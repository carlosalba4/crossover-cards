import type { ICommand, CommandResult } from "@application/commands/i-command";
import type { Match } from "@domain/entities/match";
import type { IEventBus } from "@domain/events/event-bus";
import type { NostalgiaSystem } from "@domain/services/nostalgia-system";
import { GameEvent } from "@domain/events/game-event";
import { PhaseViolationError } from "@domain/errors/phase-violation-error";
import { InsufficientNostalgiaError } from "@domain/errors/insufficient-nostalgia-error";
import { ApplicationError } from "@application/errors/application-error";

export class UseHeroPowerCommand implements ICommand {
  constructor(
    private readonly match: Match,
    private readonly playerId: string,
    private readonly targetId: string | undefined,
    private readonly eventBus: IEventBus,
    private readonly nostalgiaSystem: NostalgiaSystem,
  ) {}

  execute(): CommandResult {
    const eventsEmitted: GameEvent[] = [];

    // 1. Validar fase
    if (this.match.currentPhase !== "main") {
      return {
        success: false,
        error: new PhaseViolationError(
          `Solo se puede usar el poder de héroe en la fase "main", fase actual: "${this.match.currentPhase}".`,
        ),
        eventsEmitted,
      };
    }

    const player = this.match.getActivePlayer();

    // 2. Validar jugador activo
    if (player.playerId !== this.playerId) {
      return {
        success: false,
        error: new PhaseViolationError("Solo el jugador activo puede usar su poder de héroe."),
        eventsEmitted,
      };
    }

    const hero = player.hero;

    // 3. Validar uso previo en el turno
    if (hero.hasUsedHeroPowerThisTurn) {
      return {
        success: false,
        error: new ApplicationError(
          "El poder de héroe ya ha sido utilizado en este turno.",
          "HERO_POWER_ALREADY_USED",
        ),
        eventsEmitted,
      };
    }

    // 4. Validar Nostalgia
    const availableNostalgia = this.nostalgiaSystem.getCurrentNostalgia(this.playerId);
    const cost = hero.heroPower.nostalgyCost;
    if (availableNostalgia < cost) {
      return {
        success: false,
        error: new InsufficientNostalgiaError(
          `Nostalgia insuficiente. Requerida: ${cost}, Actual: ${availableNostalgia}`,
        ),
        eventsEmitted,
      };
    }

    // 5. Gastar Nostalgia
    this.nostalgiaSystem.spend(this.playerId, cost);
    eventsEmitted.push(GameEvent.NostalgiaChanged);

    // 6. Marcar uso
    hero.useHeroPower();

    // 7. Emitir evento HeroPowerUsed (la resolución del efecto se hace en otro servicio, ej. TurnEngine o CommandHandler)
    this.eventBus.emit(GameEvent.HeroPowerUsed, {
      playerId: this.playerId,
      heroPower: hero.heroPower,
      targetId: this.targetId,
    });
    eventsEmitted.push(GameEvent.HeroPowerUsed);

    return { success: true, eventsEmitted };
  }
}
