import type Phaser from "phaser";

/**
 * Utilidades de dibujo compartidas para objetos de presentación (Phaser).
 *
 * Funciones puras sobre un `Phaser.GameObjects.Graphics`: no crean ni destruyen
 * objetos, solo añaden trazos. Centralizar estas primitivas evita duplicación
 * (DRY) entre `BoardView`, `ZoneView` y otros objetos del tablero.
 */

/**
 * Dibuja un rectángulo con borde discontinuo (dashed) sobre el Graphics dado.
 *
 * El trazo se añade al path actual y se renderiza con `strokePath()`. El color
 * y grosor de línea deben configurarse con `gfx.lineStyle(...)` antes de llamar.
 *
 * @param gfx        - Graphics destino sobre el que se dibuja.
 * @param x          - Coordenada X de la esquina superior izquierda.
 * @param y          - Coordenada Y de la esquina superior izquierda.
 * @param w          - Anchura del rectángulo.
 * @param h          - Altura del rectángulo.
 * @param dashLength - Longitud de cada segmento dibujado. Por defecto 6.
 * @param gapLength  - Longitud del hueco entre segmentos. Por defecto 6.
 */
export function drawDashedRect(
  gfx: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  dashLength = 6,
  gapLength = 6,
): void {
  const step = dashLength + gapLength;

  gfx.beginPath();

  // Lados horizontales (superior e inferior)
  for (let i = x; i < x + w; i += step) {
    gfx.moveTo(i, y);
    gfx.lineTo(Math.min(i + dashLength, x + w), y);
    gfx.moveTo(i, y + h);
    gfx.lineTo(Math.min(i + dashLength, x + w), y + h);
  }

  // Lados verticales (izquierdo y derecho)
  for (let i = y; i < y + h; i += step) {
    gfx.moveTo(x, i);
    gfx.lineTo(x, Math.min(i + dashLength, y + h));
    gfx.moveTo(x + w, i);
    gfx.lineTo(x + w, Math.min(i + dashLength, y + h));
  }

  gfx.strokePath();
}
