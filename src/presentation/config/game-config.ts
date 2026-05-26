import Phaser from "phaser";

/**
 * Configuración global de Phaser 4 para Crossover Cards.
 *
 * Paleta: bg-deep (#0D0B1E) — fondo principal de todas las escenas.
 * Rejilla: 1920×1080 con escala FIT y centrado automático.
 *
 * NOTA: el array `scene` se completa en IMPL-046 cuando las clases de
 * escena estén disponibles. Phaser no acepta strings de nombre como
 * referencia de clase, por lo que se deja vacío hasta entonces.
 */
export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#0D0B1E",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080,
  },
  // Se añadirán las clases de escena en IMPL-046
  scene: [],
};
