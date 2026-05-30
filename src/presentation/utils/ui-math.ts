/**
 * Aclara un color numérico multiplicando sus canales por un factor.
 * Satura en 0xFF por canal.
 */
export function lightenColor(color: number, factor: number): number {
  const r = Math.min(0xff, Math.round(((color >> 16) & 0xff) * factor));
  const g = Math.min(0xff, Math.round(((color >> 8) & 0xff) * factor));
  const b = Math.min(0xff, Math.round((color & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}

/**
 * Clampea un valor de progreso al rango [0, 1].
 */
export function clampProgress(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/**
 * Calcula el ancho del relleno de la barra de progreso.
 */
export function calculateFillWidth(progress: number, totalWidth: number): number {
  return totalWidth * clampProgress(progress);
}
