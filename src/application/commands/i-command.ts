import type { DomainError } from "@domain/errors/domain-error";
import type { ApplicationError } from "@application/errors/application-error";
import type { GameEvent } from "@domain/events/game-event";

export interface CommandResult {
  success: boolean;
  error?: DomainError | ApplicationError;
  eventsEmitted: GameEvent[];
}

export interface ICommand {
  execute(): CommandResult;
}
