import type { IEventBus } from "@domain/events/event-bus";
import { GameEvent } from "@domain/events/game-event";
import type { Match, PlayerState } from "@domain/entities/match";
import type { Character } from "@domain/entities/character";
import { Modifier } from "@domain/value-objects/modifier";

/**
 * `source` con el que se etiquetan los Modifier creados por el poder de héroe.
 * Permite limpiarlos selectivamente al final del turno (buff de duración EndOfTurn).
 */
const HERO_POWER_SOURCE = "hero_power";

/** Tipos de efecto soportados por los poderes de héroe del catálogo. */
const EFFECT_DAMAGE = "Damage";
const EFFECT_BUFF_ATTACK = "BuffAttack";

/**
 * HeroPowerResolver — Crossover Cards
 *
 * Servicio de Dominio que aplica el efecto real de un poder de héroe. El
 * `UseHeroPowerCommand` valida y emite `HeroPowerUsed` (gastando Nostalgia y
 * marcando el uso), pero NO aplica el efecto; este resolver lo escucha y lo
 * resuelve sobre el objetivo:
 *
 *   - `"Damage"`: inflige `value` de daño al objetivo (Personaje en cualquier
 *     tablero, o Héroe). Emite `CharacterDamaged` / `HeroDamaged`. La muerte la
 *     gestiona el flujo existente (`cleanupDeadCharacters` / `checkMatchEnd` en
 *     MatchService); este servicio NO destruye ni decide fin de partida.
 *   - `"BuffAttack"`: aplica un Modifier de `+value` ATQ a un Personaje ALIADO
 *     del lanzador, con duración limitada al turno. Emite `CharacterBuffed`.
 *     El buff se retira en `TurnEnded` por `source`, emitiendo `CharacterBuffed`
 *     con el ATQ revertido para que la presentación lo refleje.
 *
 * Contrato de `targetId` (unificado con la presentación y la IA):
 *   - Personaje → `instanceId` (UUID).
 *   - Héroe → `staticId` del héroe (ej. "HERO-001").
 *
 * Robustez: si el objetivo no existe o es incoherente con el efecto (p.ej. buff
 * a un enemigo, o daño sin objetivo), no lanza: ignora la acción en silencio
 * (la validación principal ya recae en el comando).
 */
export class HeroPowerResolver {
  private readonly unsubscribers: Array<() => void> = [];

  /** Turno actual de la partida; usado como `appliedAtTurn` de los Modifier. */
  private currentTurn = 1;

  constructor(
    private readonly match: Match,
    private readonly eventBus: IEventBus,
  ) {
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.TurnStarted, (payload) => {
        this.currentTurn = payload.turnNumber;
      }),
    );
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.HeroPowerUsed, (payload) => {
        this.resolve(
          payload.playerId,
          payload.heroPower.effectType,
          payload.heroPower.value,
          payload.targetId,
        );
      }),
    );
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.TurnEnded, () => {
        this.clearHeroPowerBuffs();
      }),
    );
  }

  /** Cancela todas las suscripciones del servicio. */
  public dispose(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers.length = 0;
  }

  // -------------------------------------------------------------------------
  // Resolución del efecto
  // -------------------------------------------------------------------------

  private resolve(
    casterPlayerId: string,
    effectType: string,
    value: number,
    targetId: string | undefined,
  ): void {
    if (effectType === EFFECT_DAMAGE) {
      this.applyDamage(value, targetId);
    } else if (effectType === EFFECT_BUFF_ATTACK) {
      this.applyBuffAttack(casterPlayerId, value, targetId);
    }
    // Otros effectType no están soportados aún: se ignoran sin mutar estado.
  }

  /**
   * Aplica daño al objetivo (`"Damage"`). El objetivo puede ser un Personaje de
   * cualquier tablero o un Héroe (por `staticId`). La destrucción/fin de partida
   * la gestiona el flujo existente; aquí solo aplicamos daño y notificamos.
   */
  private applyDamage(value: number, targetId: string | undefined): void {
    if (targetId === undefined || value <= 0) return;

    const character = this.findCharacterById(targetId);
    if (character) {
      character.takeDamage(value);
      this.eventBus.emit(GameEvent.CharacterDamaged, {
        playerId: this.ownerPlayerIdOf(character),
        character,
      });
      return;
    }

    const heroOwner = this.findHeroOwnerByStaticId(targetId);
    if (heroOwner) {
      heroOwner.hero.takeDamage(value);
      this.eventBus.emit(GameEvent.HeroDamaged, {
        playerId: heroOwner.playerId,
        damage: value,
        currentHealth: heroOwner.hero.currentHealth,
      });
    }
    // Objetivo inexistente: ignorar en silencio.
  }

  /**
   * Aplica un buff de ATQ (`"BuffAttack"`) a un Personaje ALIADO del lanzador,
   * con duración limitada al turno. Si el objetivo no es un aliado válido, ignora.
   */
  private applyBuffAttack(
    casterPlayerId: string,
    value: number,
    targetId: string | undefined,
  ): void {
    if (targetId === undefined || value === 0) return;

    const caster = this.playerById(casterPlayerId);
    if (!caster) return;

    const target = this.match.findCharacterOnBoard(caster, targetId);
    if (!target) return; // Solo se permite buffear Personajes aliados.

    target.addModifier(
      new Modifier({
        source: HERO_POWER_SOURCE,
        attackBonus: value,
        healthBonus: 0,
        abilitiesGranted: [],
        duration: 1,
        appliedAtTurn: this.currentTurn,
      }),
    );

    this.eventBus.emit(GameEvent.CharacterBuffed, {
      playerId: casterPlayerId,
      character: target,
    });
  }

  /**
   * Retira al final del turno todos los Modifier del poder de héroe (buff
   * EndOfTurn) y notifica el ATQ revertido de cada Personaje afectado.
   */
  private clearHeroPowerBuffs(): void {
    for (const player of [this.match.player1, this.match.player2]) {
      for (const character of this.match.getAllBoardCharacters(player)) {
        const hadBuff = character.getModifiers().some((m) => m.source === HERO_POWER_SOURCE);
        if (hadBuff) {
          character.removeModifiersBySource(HERO_POWER_SOURCE);
          this.eventBus.emit(GameEvent.CharacterBuffed, {
            playerId: player.playerId,
            character,
          });
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Utilidades de localización de objetivos
  // -------------------------------------------------------------------------

  private findCharacterById(instanceId: string): Character | null {
    return (
      this.match.findCharacterOnBoard(this.match.player1, instanceId) ??
      this.match.findCharacterOnBoard(this.match.player2, instanceId)
    );
  }

  private findHeroOwnerByStaticId(staticId: string): PlayerState | null {
    if (this.match.player1.hero.staticId === staticId) return this.match.player1;
    if (this.match.player2.hero.staticId === staticId) return this.match.player2;
    return null;
  }

  private playerById(playerId: string): PlayerState | null {
    if (this.match.player1.playerId === playerId) return this.match.player1;
    if (this.match.player2.playerId === playerId) return this.match.player2;
    return null;
  }

  private ownerPlayerIdOf(character: Character): string {
    return this.match.findCharacterOnBoard(this.match.player1, character.instanceId)
      ? this.match.player1.playerId
      : this.match.player2.playerId;
  }
}
