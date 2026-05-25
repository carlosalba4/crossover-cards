/**
 * Clase de error base para errores que ocurren en la capa de infraestructura.
 * Ejemplos: fallos de red, errores HTTP, fallos al leer archivos o bases de datos.
 */
export class InfrastructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype); // Restaurar prototipo para instanceof
  }
}
