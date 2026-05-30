import type { ICommand, CommandResult } from "@application/commands/i-command";
import type { Match } from "@domain/entities/match";
import type { IEventBus } from "@domain/events/event-bus";
import type { QuestManager, QuestData } from "@domain/services/quest-manager";
import { GameEvent } from "@domain/events/game-event";
import { ApplicationError } from "@application/errors/application-error";
import { CardNotInHandError } from "@domain/errors/card-not-in-hand-error";

export class ActivateQuestCommand implements ICommand {
  constructor(
    private readonly match: Match,
    private readonly playerId: string,
    private readonly questCardInstanceId: string,
    private readonly questData: QuestData, // Datos estructurados de la misión
    private readonly questManager: QuestManager,
    _eventBus: IEventBus, // EventBus es inyectado pero los eventos los emite QuestManager internamente, sin embargo, lo pasamos por si acaso
  ) {}

  execute(): CommandResult {
    const eventsEmitted: GameEvent[] = [];
    const player = this.match.getActivePlayer();

    // Solo el jugador activo puede activar una misión (o asumimos que cualquier jugador que tenga el turno)
    if (player.playerId !== this.playerId) {
      return {
        success: false,
        error: new ApplicationError(
          "Solo el jugador activo puede colocar una misión.",
          "NOT_ACTIVE_PLAYER",
        ),
        eventsEmitted,
      };
    }

    // 1. Validar que la carta está en la mano
    const card = player.hand.find(this.questCardInstanceId);
    if (!card) {
      return {
        success: false,
        error: new CardNotInHandError(
          `La carta de misión con id ${this.questCardInstanceId} no está en la mano.`,
        ),
        eventsEmitted,
      };
    }

    // 2. Validar que no hay misión activa
    const activeQuest = this.questManager.getActiveQuest(this.playerId);
    if (activeQuest) {
      return {
        success: false,
        error: new ApplicationError(
          "El jugador ya tiene una misión activa.",
          "QUEST_ALREADY_ACTIVE",
        ),
        eventsEmitted,
      };
    }

    // 3. Colocar misión y retirar carta de la mano
    player.hand.remove(this.questCardInstanceId);

    // QuestManager emite QuestPlaced internamente
    this.questManager.placeQuest(this.playerId, this.questData);

    eventsEmitted.push(GameEvent.QuestPlaced);

    return { success: true, eventsEmitted };
  }
}
