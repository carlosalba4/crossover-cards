import type { ICommand, CommandResult } from "@application/commands/i-command";
import type { Match } from "@domain/entities/match";
import type { IEventBus } from "@domain/events/event-bus";
import type { CrossoverManager } from "@domain/services/crossover-manager";
import { GameEvent } from "@domain/events/game-event";
import { ApplicationError } from "@application/errors/application-error";

export class ActivateCrossoverCommand implements ICommand {
  constructor(
    private readonly match: Match,
    private readonly playerId: string,
    private readonly crossoverManager: CrossoverManager,
    _eventBus: IEventBus, // EventBus inyectado
  ) {}

  execute(): CommandResult {
    const eventsEmitted: GameEvent[] = [];
    const player = this.match.getActivePlayer();

    // Solo el jugador activo puede activar Crossover
    if (player.playerId !== this.playerId) {
      return {
        success: false,
        error: new ApplicationError(
          "Solo el jugador activo puede usar la habilidad Crossover.",
          "NOT_ACTIVE_PLAYER",
        ),
        eventsEmitted,
      };
    }

    const opponent = this.match.getInactivePlayer();

    // 1. Validar que no se haya usado el Crossover previamente
    if (this.crossoverManager.hasUsedCrossover(this.playerId)) {
      return {
        success: false,
        error: new ApplicationError(
          "La habilidad Crossover ya ha sido utilizada en esta partida.",
          "CROSSOVER_ALREADY_USED",
        ),
        eventsEmitted,
      };
    }

    // 2. Validar que el mazo enemigo no esté vacío
    if (opponent.deck.isEmpty()) {
      return {
        success: false,
        error: new ApplicationError(
          "No se puede usar Crossover porque el mazo del rival está vacío.",
          "OPPONENT_DECK_EMPTY",
        ),
        eventsEmitted,
      };
    }

    // 3. Activar Crossover (roba del mazo rival y añade a la mano local)
    // El CrossoverManager emite CrossoverActivated internamente
    this.crossoverManager.activate(this.playerId, opponent.deck, player.hand);

    eventsEmitted.push(GameEvent.CrossoverActivated);

    return { success: true, eventsEmitted };
  }
}
