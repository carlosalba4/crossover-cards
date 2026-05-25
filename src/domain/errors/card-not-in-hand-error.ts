import { DomainError } from "./domain-error";

export class CardNotInHandError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
