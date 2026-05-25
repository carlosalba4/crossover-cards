import { DomainError } from "./domain-error";

export class PhaseViolationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
