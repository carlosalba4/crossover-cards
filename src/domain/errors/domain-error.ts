/**
 * Clase de error base para todos los errores de dominio.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype); // Restaurar prototipo para instanceof
  }
}
