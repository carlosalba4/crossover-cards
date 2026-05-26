import Phaser from "phaser";
import { calculateFillWidth } from "@presentation/utils/ui-math";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/** Configuración de construcción de la barra de progreso. */
export interface ProgressBarConfig {
  scene: Phaser.Scene;
  /** Centro X de la barra. */
  x: number;
  /** Centro Y de la barra. */
  y: number;
  /** Ancho total de la barra en píxeles. */
  width: number;
  /** Alto de la barra en píxeles. Por defecto 12 (spec BootScene §3.1). */
  height?: number;
}

// ---------------------------------------------------------------------------
// Constantes de diseño (spec docs/05-ui-design.md §3.1)
// ---------------------------------------------------------------------------

/** Fondo de la barra — token bg-card. */
const COLOR_BG = 0x1a1730;
/** Relleno de la barra — token accent-teal. */
const COLOR_FILL = 0x3ecfcf;
/** Radio de esquinas redondeadas (spec: 4px). */
const CORNER_RADIUS = 4;
/** Alto por defecto (spec: 12px). */
const DEFAULT_HEIGHT = 12;


// ---------------------------------------------------------------------------
// Clase ProgressBar
// ---------------------------------------------------------------------------

/**
 * Barra de progreso reutilizable para BootScene.
 *
 * Extiende `Phaser.GameObjects.Container`. El par (x, y) referencia el
 * **centro** de la barra; internamente los Graphics se dibujan con offset
 * negativo para que el origen visual coincida con ese centro.
 *
 * Referencia de diseño: docs/05-ui-design.md §3.1 (BootScene — barra de
 * carga: fondo bg-card, relleno accent-teal, bordes redondeados 4px,
 * altura 12px, ancho 480px centrado).
 */
export class ProgressBar extends Phaser.GameObjects.Container {
  private readonly bgGraphics: Phaser.GameObjects.Graphics;
  private readonly fillGraphics: Phaser.GameObjects.Graphics;
  private readonly _width: number;
  private readonly _height: number;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(config: ProgressBarConfig) {
    super(config.scene, config.x, config.y);

    this._width = config.width;
    this._height = config.height ?? DEFAULT_HEIGHT;

    // --- Fondo (bg-card) ---
    this.bgGraphics = config.scene.add.graphics();
    this.drawBackground();

    // --- Relleno (accent-teal) — inicialmente vacío ---
    this.fillGraphics = config.scene.add.graphics();

    // --- Ensamblar contenedor (bg primero para quedar detrás) ---
    this.add([this.bgGraphics, this.fillGraphics]);

    // Registrar en la escena (siempre al final del constructor)
    config.scene.add.existing(this);
  }

  // -------------------------------------------------------------------------
  // API pública
  // -------------------------------------------------------------------------

  /**
   * Actualiza el progreso visual de la barra.
   *
   * El valor se clampea al rango [0, 1] antes de calcular el ancho.
   * Con progress <= 0 el relleno no se dibuja; con progress >= 1 ocupa
   * el ancho completo.
   *
   * @param progress Progreso entre 0.0 y 1.0.
   */
  update(progress: number): void {
    const fillWidth = calculateFillWidth(progress, this._width);

    this.fillGraphics.clear();

    if (fillWidth <= 0) {
      // Sin relleno visible — no dibujamos nada
      return;
    }

    this.fillGraphics.fillStyle(COLOR_FILL, 1);
    this.fillGraphics.fillRoundedRect(
      -this._width / 2,
      -this._height / 2,
      fillWidth,
      this._height,
      CORNER_RADIUS,
    );
  }

  // -------------------------------------------------------------------------
  // Dibujo interno del fondo
  // -------------------------------------------------------------------------

  /** Dibuja el fondo completo centrado en (0, 0) del contenedor. */
  private drawBackground(): void {
    this.bgGraphics.fillStyle(COLOR_BG, 1);
    this.bgGraphics.fillRoundedRect(
      -this._width / 2,
      -this._height / 2,
      this._width,
      this._height,
      CORNER_RADIUS,
    );
  }
}
