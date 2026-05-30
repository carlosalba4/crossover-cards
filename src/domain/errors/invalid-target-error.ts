import { DomainError } from "./domain-error";

export class InvalidTargetError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
