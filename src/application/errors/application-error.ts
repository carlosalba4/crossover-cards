export class ApplicationError extends Error {
  public readonly code: string;

  constructor(message: string, code = "APPLICATION_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
