import type { IEventBus } from "@domain/events/event-bus";
import { GameEvent } from "@domain/events/game-event";
import { Character } from "@domain/entities/character";
import { Hero } from "@domain/entities/hero";
import { Ability } from "@domain/types/card-types";

/**
 * Servicio de Dominio responsable de resolver el combate físico entre
 * entidades del tablero (Characters) o ataques directos al héroe (Hero).
 *
 * Implementa las mecánicas especiales de combate definidas en el PRD:
 * - Divine Shield (escudo divino)
 * - Poisonous (toque venenoso)
 * - Stealth (sigilo)
 * - Taunt (provocar) [Nota: la validación global de obligatoriedad de
 *   Taunt se asume que recae sobre la capa de Comandos, el resolver no
 *   bloquea por Taunt si el target ya fue validado].
 */
export class CombatResolver {
  constructor(private readonly eventBus: IEventBus) {}

  /**
   * Resuelve un ataque de un Personaje contra otro Personaje o un Héroe.
   *
   * @param attacker El Personaje que inicia el ataque.
   * @param defender El objetivo del ataque (Personaje o Héroe).
   * @param attackerPlayerId ID del jugador atacante.
   * @param defenderPlayerId ID del jugador defensor.
   */
  public resolveAttack(
    attacker: Character,
    defender: Character | Hero,
    attackerPlayerId: string,
    defenderPlayerId: string,
  ): void {
    // 1. Validaciones previas de estado y reglas básicas
    if (attacker.isExhausted || attacker.hasAttackedThisTurn) {
      throw new Error("El Personaje atacante está exhausto o ya ha atacado este turno.");
    }
    if (!attacker.isAlive()) {
      throw new Error("El Personaje atacante ya está destruido.");
    }
    if (!defender.isAlive()) {
      throw new Error("El objetivo ya está destruido.");
    }

    // Validación de sigilo (Stealth)
    if (defender instanceof Character) {
      if (defender.getActiveAbilities().includes(Ability.Stealth)) {
        throw new Error("No se puede seleccionar como objetivo a un Personaje con Stealth.");
      }
    }

    // 2. Evento previo
    const defenderId = defender instanceof Character ? defender.instanceId : defender.staticId;
    this.eventBus.emit(GameEvent.AttackDeclared, {
      attackerId: attacker.instanceId,
      defenderId: defenderId,
    });

    // 3. El atacante pierde el Stealth inmediatamente al atacar
    if (attacker.getActiveAbilities().includes(Ability.Stealth)) {
      this.removeAbility(attacker, Ability.Stealth);
    }

    // 4. Cálculo de Daño Inicial
    let damageToDefender = attacker.getEffectiveAttack();
    let damageToAttacker = 0;

    if (defender instanceof Character) {
      damageToAttacker = defender.getEffectiveAttack();
    }

    // 5. Procesamiento del Divine Shield (Escudo Divino)
    if (
      defender instanceof Character &&
      defender.getActiveAbilities().includes(Ability.DivineShield)
    ) {
      if (damageToDefender > 0) {
        damageToDefender = 0; // El escudo absorbe el impacto
        this.removeAbility(defender, Ability.DivineShield);
      }
    }

    if (attacker.getActiveAbilities().includes(Ability.DivineShield)) {
      if (damageToAttacker > 0) {
        damageToAttacker = 0; // El escudo absorbe el contraataque
        this.removeAbility(attacker, Ability.DivineShield);
      }
    }

    // 6. Aplicación de Daño y Poisonous (Venenoso)
    if (damageToAttacker > 0) {
      attacker.takeDamage(damageToAttacker);
      // Poisonous en el defensor: mata al atacante si infligió >= 1 de daño
      if (
        defender instanceof Character &&
        defender.getActiveAbilities().includes(Ability.Poisonous)
      ) {
        attacker.takeDamage(attacker.currentHealth);
      }
    }

    if (damageToDefender > 0) {
      defender.takeDamage(damageToDefender);
      // Poisonous en el atacante: mata al defensor (solo a Personajes, no Héroes)
      if (attacker.getActiveAbilities().includes(Ability.Poisonous)) {
        if (defender instanceof Character) {
          defender.takeDamage(defender.currentHealth);
        }
      }
    }

    // 7. Marcar estado del atacante
    attacker.hasAttackedThisTurn = true;
    attacker.isExhausted = true;

    // 8. Evento AttackResolved
    this.eventBus.emit(GameEvent.AttackResolved, {
      attackerId: attacker.instanceId,
      defenderId: defenderId,
      damageToAttacker,
      damageToDefender,
    });

    // 9. Eventos consecuentes (HeroDamaged y CharacterDestroyed)
    if (defender instanceof Hero && damageToDefender > 0) {
      this.eventBus.emit(GameEvent.HeroDamaged, {
        playerId: defenderPlayerId,
        damage: damageToDefender,
        currentHealth: defender.currentHealth,
      });
    }

    if (!attacker.isAlive()) {
      this.eventBus.emit(GameEvent.CharacterDestroyed, {
        playerId: attackerPlayerId,
        character: attacker,
        cause: "combat",
      });
    }

    if (defender instanceof Character && !defender.isAlive()) {
      this.eventBus.emit(GameEvent.CharacterDestroyed, {
        playerId: defenderPlayerId,
        character: defender,
        cause: "combat",
      });
    }
  }

  /**
   * Elimina permanentemente una habilidad del array base del Personaje.
   * Utilizado para consumibles como Divine Shield o la pérdida de Stealth.
   * NOTA: Requiere cast porque el modelo restringe con `readonly` para otras capas.
   */
  private removeAbility(character: Character, ability: Ability): void {
    const abilities = character.abilities as Ability[];
    const index = abilities.indexOf(ability);
    if (index !== -1) {
      abilities.splice(index, 1);
    }
  }
}
