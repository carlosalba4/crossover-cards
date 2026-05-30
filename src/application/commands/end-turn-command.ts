import type { ICommand, CommandResult } from "@application/commands/i-command";
import type { Match } from "@domain/entities/match";
import type { IEventBus } from "@domain/events/event-bus";
import type { TurnEngine } from "@domain/services/turn-engine";
import { GameEvent } from "@domain/events/game-event";
import { EndPhase } from "@domain/states/end-phase";
import { PhaseViolationError } from "@domain/errors/phase-violation-error";

/**
 * Comando que finaliza el turno del jugador activo.
 *
 * Puede ejecutarse desde "main" o "combat".
 * Transiciona el motor de turnos a la fase EndPhase, que a su vez
 * llama a `turnEngine.endTurn()` y cede el control al rival.
 *
 * Referencia: docs/02-architecture.md §4.3 (patrón Command).
 */
export class EndTurnCommand implements ICommand {
  constructor(
    private readonly match: Match,
    private readonly playerId: string,
    _eventBus: IEventBus,
    private readonly turnEngine: TurnEngine,
  ) {}

  execute(): CommandResult {
    const eventsEmitted: GameEvent[] = [];

    // ── 1. Validar jugador activo ────────────────────────────────────────────
    if (this.match.activePlayerId !== this.playerId) {
      return {
        success: false,
        error: new PhaseViolationError(
          `El jugador "${this.playerId}" no es el jugador activo. No puede terminar el turno.`,
        ),
        eventsEmitted,
      };
    }

    // ── 2. Validar fase permitida (main o combat) ────────────────────────────
    const phase = this.match.currentPhase;
    if (phase !== "main" && phase !== "combat") {
      return {
        success: false,
        error: new PhaseViolationError(
          `No se puede terminar el turno desde la fase "${phase}". Solo desde "main" o "combat".`,
        ),
        eventsEmitted,
      };
    }

    // ── 3. Transicionar a EndPhase y ejecutar el final del turno ────────────
    // Primero transicionamos a EndPhase para permitir efectos "al final de turno"
    this.turnEngine.transitionTo(new EndPhase(this.turnEngine));
    // Luego le ordenamos al motor terminar el turno (esto alterna el jugador activo)
    this.turnEngine.handleAction({ type: "END_TURN" });
    eventsEmitted.push(GameEvent.TurnEnded);

    return { success: true, eventsEmitted };
  }
}
