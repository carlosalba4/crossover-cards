import type { ICommand, CommandResult } from "@application/commands/i-command";
import type { Match } from "@domain/entities/match";
import type { IEventBus } from "@domain/events/event-bus";
import type { CombatResolver } from "@domain/services/combat-resolver";
import { GameEvent } from "@domain/events/game-event";
import { Ability } from "@domain/types/card-types";
import { PhaseViolationError } from "@domain/errors/phase-violation-error";
import { InvalidTargetError } from "@domain/errors/invalid-target-error";

/**
 * Comando que ejecuta un ataque en la Fase de Combate.
 *
 * Validaciones:
 *  1. La fase actual debe ser "combat".
 *  2. El atacante debe existir en el tablero del jugador activo.
 *  3. El atacante no debe estar exhausto ni haber atacado ya.
 *  4. Si el oponente tiene Personajes con Taunt, el objetivo debe ser uno de ellos.
 *
 * Si válido: delega al CombatResolver, limpia muertos del tablero
 * y retorna el CommandResult con los eventos emitidos.
 *
 * Referencia: docs/02-architecture.md §4.3 (patrón Command).
 */
export class AttackCommand implements ICommand {
  constructor(
    private readonly match: Match,
    private readonly attackerId: string,
    private readonly defenderId: string,
    _eventBus: IEventBus,
    private readonly combatResolver: CombatResolver,
  ) {}

  execute(): CommandResult {
    const eventsEmitted: GameEvent[] = [];

    // ── 1. Validar fase ──────────────────────────────────────────────────────
    if (this.match.currentPhase !== "combat") {
      return {
        success: false,
        error: new PhaseViolationError(
          `Solo se puede atacar en la fase "combat", fase actual: "${this.match.currentPhase}".`,
        ),
        eventsEmitted,
      };
    }

    const activePlayer = this.match.getActivePlayer();
    const inactivePlayer = this.match.getInactivePlayer();

    // ── 2. Localizar atacante ────────────────────────────────────────────────
    const attacker = this.match.findCharacterOnBoard(activePlayer, this.attackerId);
    if (!attacker) {
      return {
        success: false,
        error: new InvalidTargetError(
          `El atacante con instanceId "${this.attackerId}" no está en el tablero del jugador activo.`,
        ),
        eventsEmitted,
      };
    }

    // ── 3. Atacante no exhausto ──────────────────────────────────────────────
    if (attacker.isExhausted || attacker.hasAttackedThisTurn) {
      return {
        success: false,
        error: new InvalidTargetError(
          `El Personaje "${attacker.name}" está exhausto o ya atacó este turno.`,
        ),
        eventsEmitted,
      };
    }

    // ── 4. Validar Taunt ─────────────────────────────────────────────────────
    const opponentCharacters = this.match.getAllBoardCharacters(inactivePlayer);
    const tauntCharacters = opponentCharacters.filter((c) =>
      c.getActiveAbilities().includes(Ability.Taunt),
    );

    // Si hay algún Taunt, el objetivo debe ser uno de ellos (no el héroe)
    if (tauntCharacters.length > 0) {
      const isTargetingTaunt = tauntCharacters.some((c) => c.instanceId === this.defenderId);
      if (!isTargetingTaunt) {
        return {
          success: false,
          error: new InvalidTargetError(
            "Hay Personajes con Provocación (Taunt) en el tablero rival. Debes atacarlos primero.",
          ),
          eventsEmitted,
        };
      }
    }

    // ── Ejecutar el ataque via CombatResolver ────────────────────────────────
    // Determinar si el defensor es un Character del tablero o el "héroe" (id estático)
    const defenderCharacter = this.match.findCharacterOnBoard(inactivePlayer, this.defenderId);

    // Por ahora solo soportamos Character vs Character en este comando
    // (Character vs Hero requeriría acceso a la entidad Hero del oponente)
    if (!defenderCharacter) {
      return {
        success: false,
        error: new InvalidTargetError(
          `El defensor con id "${this.defenderId}" no está en el tablero del oponente.`,
        ),
        eventsEmitted,
      };
    }

    // El CombatResolver emite AttackDeclared y AttackResolved internamente
    this.combatResolver.resolveAttack(
      attacker,
      defenderCharacter,
      activePlayer.playerId,
      inactivePlayer.playerId,
    );

    eventsEmitted.push(GameEvent.AttackDeclared);
    eventsEmitted.push(GameEvent.AttackResolved);

    // ── Limpiar muertos del tablero ───────────────────────────────────────────
    if (!attacker.isAlive()) {
      this.match.removeCharacterFromBoard(activePlayer, attacker.instanceId);
      eventsEmitted.push(GameEvent.CharacterDestroyed);
    }
    if (!defenderCharacter.isAlive()) {
      this.match.removeCharacterFromBoard(inactivePlayer, defenderCharacter.instanceId);
      eventsEmitted.push(GameEvent.CharacterDestroyed);
    }

    return { success: true, eventsEmitted };
  }
}
