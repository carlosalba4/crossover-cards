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
 *
 * `InvalidTargetError` NO está aquí: todos sus casos comparten `name` pero
 * tienen mensajes distintos (atacante exhausto, Taunt activo, objetivo ausente),
 * así que se desambiguan por palabras clave en `friendlyInvalidTarget`.
 */
const FRIENDLY_BY_NAME: Record<string, string> = {
  PhaseViolationError: "No puedes hacer eso en esta fase.",
  BoardFullError: "Esa zona está llena.",
};

/**
 * Desambigua los distintos `InvalidTargetError` de combate a partir de palabras
 * clave del mensaje original del dominio (todos comparten `error.name`).
 *
 * El matching es `toLowerCase().includes(...)` para ser insensible a mayúsculas
 * y robusto ante ligeras variaciones del texto del dominio. Stems usados:
 * - "exhaust"  cubre "exhausto"/"exhausta".
 * - "provoc"   cubre "Provocación"/"provocar"/"Provocar"; junto a "taunt".
 * - "destruid" cubre "destruido"/"destruida" (objetivo/atacante ya destruido).
 *
 * Cualquier mensaje no reconocido cae al saneado genérico para no filtrar UUIDs.
 */
function friendlyInvalidTarget(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("exhaust")) {
    return "Esa carta no puede atacar este turno.";
  }
  if (m.includes("taunt") || m.includes("provoc")) {
    return "Debes atacar primero a las cartas con Provocar.";
  }
  if (m.includes("no está en el tablero") || m.includes("not in") || m.includes("destruid")) {
    return "Ese objetivo ya no está en el tablero.";
  }

  // Fallback: cualquier InvalidTargetError futuro no contemplado se sanea por si
  // su mensaje arrastra IDs internos. Evita regresiones que muestren UUIDs.
  return sanitizeMessage(message);
}

/**
 * Traduce un error de acción a un mensaje amigable en español, garantizando que
 * nunca se filtren UUIDs al usuario.
 *
 * - `InvalidTargetError` se desambigua por palabras clave del mensaje original.
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
    if (error.name === "InvalidTargetError") {
      return friendlyInvalidTarget(error.message);
    }
    const mapped = FRIENDLY_BY_NAME[error.name];
    if (mapped) return mapped;
    if (error.message) return sanitizeMessage(error.message);
  }
  return sanitizeMessage(fallback);
}
