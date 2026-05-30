import { ApplicationError } from "./application-error";

export class PlayerNotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, "PLAYER_NOT_FOUND");
  }
}
