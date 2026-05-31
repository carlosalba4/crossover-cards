/**
 * Saneado y mapeo de mensajes de error para los toasts de la escena.
 *
 * El dominio lanza errores con todos los detalles (incluidos UUIDs de instancia)
 * porque son útiles para depuración y tests. Esta capa de presentación traduce
 * esos errores a textos amigables en español y, como red de seguridad, elimina
 * cualquier UUID que pudiera filtrarse al usuario. El dominio NO se modifica.
 */

/** UUID v4 (formato 8-4-4-4-12 hex). Global e insensible a mayúsculas. */
const UUID_V4_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Sustituye cualquier subcadena con forma de UUID v4 por el literal "objetivo".
 * Red de seguridad para mensajes no mapeados que pudieran contener IDs internos.
 */
export function sanitizeMessage(msg: string): string {
  return msg.replace(UUID_V4_REGEX, "objetivo");
}

/**
 * Mensajes amigables por clase de error conocida, indexados por `error.name`
 * (cada `DomainError`/`ApplicationError` asigna `name = this.constructor.name`).
 */
const FRIENDLY_BY_NAME: Record<string, string> = {
  InvalidTargetError: "Ese objetivo ya no está en el tablero.",
  PhaseViolationError: "No puedes hacer eso en esta fase.",
  BoardFullError: "Esa zona está llena.",
};

/**
 * Traduce un error de acción a un mensaje amigable en español, garantizando que
 * nunca se filtren UUIDs al usuario.
 *
 * - Si el `name` del error coincide con uno conocido, usa su mensaje fijo.
 * - `InsufficientNostalgiaError` ya es legible: se sanea por si trae IDs.
 * - Para cualquier otro `Error`, se sanea su `message`.
 * - Si no hay error o mensaje utilizable, se usa el `fallback` (también saneado).
 *
 * @param error Error de la acción (tipado como `unknown` para no acoplar a `any`).
 * @param fallback Texto por defecto cuando no se puede derivar un mensaje.
 */
export function friendlyErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const mapped = FRIENDLY_BY_NAME[error.name];
    if (mapped) return mapped;
    if (error.message) return sanitizeMessage(error.message);
  }
  return sanitizeMessage(fallback);
}
