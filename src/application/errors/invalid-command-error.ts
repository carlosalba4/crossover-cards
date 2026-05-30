import { ApplicationError } from "./application-error";

export class InvalidCommandError extends ApplicationError {
  constructor(message: string) {
    super(message, "INVALID_COMMAND");
  }
}
