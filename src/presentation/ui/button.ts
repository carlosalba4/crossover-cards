import Phaser from "phaser";
import { lightenColor } from "@presentation/utils/ui-math";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/** Configuración de construcción del botón. */
export interface ButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  /** Color de fondo en formato numérico Phaser (ej. 0x3ECFCF). */
  backgroundColor: number;
  /** Color de texto CSS. Por defecto '#0D0B1E' (token bg-deep). */
  textColor?: string;
  /** Tamaño de fuente CSS. Por defecto '28px'. */
  fontSize?: string;
  /** Familia tipográfica. Por defecto 'Bangers'. */
  fontFamily?: string;
  onClick: () => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Constantes de animación (basadas en spec §4.7)
// ---------------------------------------------------------------------------

const TWEEN_HOVER_MS = 80;
const TWEEN_PRESS_MS = 60;
const SCALE_NORMAL = 1.0;
const SCALE_HOVER = 1.05;
const SCALE_PRESSED = 0.98;
const LIGHTEN_FACTOR = 1.1;
const CORNER_RADIUS = 8;
const DISABLED_ALPHA = 0.5;

// ---------------------------------------------------------------------------
// Clase Button
// ---------------------------------------------------------------------------

/**
 * Botón reutilizable para todas las escenas de Crossover Cards.
 *
 * Extiende `Phaser.GameObjects.Container` y se registra automáticamente
 * en la escena al construirse. Internamente usa un `Graphics` para el fondo
 * y un `Text` para la etiqueta, ambos centrados en (0, 0) relativo al
 * contenedor.
 *
 * Referencia de diseño: docs/05-ui-design.md §4.7 (EndTurnButton) y §3.2
 * (botones de MenuScene).
 */
export class Button extends Phaser.GameObjects.Container {
  // Hijos internos
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;

  // Estado
  private _disabled: boolean;
  private readonly _width: number;
  private readonly _height: number;
  private readonly _backgroundColor: number;
  private readonly _onClick: () => void;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(config: ButtonConfig) {
    super(config.scene, config.x, config.y);

    this._width = config.width;
    this._height = config.height;
    this._backgroundColor = config.backgroundColor;
    this._onClick = config.onClick;
    this._disabled = config.disabled ?? false;

    // --- Fondo (Graphics) ---
    this.bg = config.scene.add.graphics();
    this.drawBackground(this._backgroundColor);

    // --- Etiqueta (Text) centrada en el contenedor ---
    this.label = config.scene.add.text(0, 0, config.label, {
      fontFamily: config.fontFamily ?? "Bangers",
      fontSize: config.fontSize ?? "28px",
      color: config.textColor ?? "#0D0B1E",
    });
    this.label.setOrigin(0.5, 0.5);

    // --- Ensamblar contenedor ---
    this.add([this.bg, this.label]);

    // --- Interactividad ---
    this.setSize(this._width, this._height);
    this.setInteractive({ useHandCursor: true });
    this.bindEvents();

    // Aplicar estado disabled inicial si corresponde
    if (this._disabled) {
      this.applyDisabledState();
    }

    // Registrar en la escena (siempre al final del constructor)
    config.scene.add.existing(this);
  }

  // -------------------------------------------------------------------------
  // Getter público (clave para tests — IMPL-051)
  // -------------------------------------------------------------------------

  /** Indica si el botón está deshabilitado. */
  get disabled(): boolean {
    return this._disabled;
  }

  // -------------------------------------------------------------------------
  // API pública
  // -------------------------------------------------------------------------

  /**
   * Habilita o deshabilita el botón.
   * @param value `true` para deshabilitar, `false` para habilitar.
   */
  setDisabled(value: boolean): void {
    this._disabled = value;
    if (value) {
      this.applyDisabledState();
    } else {
      this.applyNormalState();
    }
  }

  /**
   * Actualiza el texto de la etiqueta del botón.
   * @param text Nuevo texto a mostrar.
   */
  setLabel(text: string): void {
    this.label.setText(text);
  }

  // -------------------------------------------------------------------------
  // Dibujo del fondo
  // -------------------------------------------------------------------------

  /**
   * Redibuja el fondo con el color indicado, centrado en (0, 0).
   */
  private drawBackground(color: number): void {
    this.bg.clear();
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(
      -this._width / 2,
      -this._height / 2,
      this._width,
      this._height,
      CORNER_RADIUS,
    );
  }

  // -------------------------------------------------------------------------
  // Gestión de estados visuales
  // -------------------------------------------------------------------------

  private applyNormalState(): void {
    this.setAlpha(1);
    this.setInteractive({ useHandCursor: true });
    this.drawBackground(this._backgroundColor);
    this.scaleTo(SCALE_NORMAL, TWEEN_HOVER_MS);
  }

  private applyDisabledState(): void {
    this.setAlpha(DISABLED_ALPHA);
    this.disableInteractive();
    this.drawBackground(this._backgroundColor);
    this.scene.tweens.killTweensOf(this);
    this.setScale(SCALE_NORMAL);
  }

  // -------------------------------------------------------------------------
  // Animaciones de escala con tween
  // -------------------------------------------------------------------------

  private scaleTo(targetScale: number, duration: number): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX: targetScale,
      scaleY: targetScale,
      duration,
      ease: "Power1",
    });
  }

  // -------------------------------------------------------------------------
  // Enlace de eventos de puntero
  // -------------------------------------------------------------------------

  private bindEvents(): void {
    this.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.onPointerOver();
    });
    this.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.onPointerOut();
    });
    this.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.onPointerDown();
    });
    this.on(Phaser.Input.Events.POINTER_UP, () => {
      this.onPointerUp();
    });
  }

  private onPointerOver(): void {
    if (this._disabled) return;
    this.drawBackground(lightenColor(this._backgroundColor, LIGHTEN_FACTOR));
    this.scaleTo(SCALE_HOVER, TWEEN_HOVER_MS);
  }

  private onPointerOut(): void {
    if (this._disabled) return;
    this.drawBackground(this._backgroundColor);
    this.scaleTo(SCALE_NORMAL, TWEEN_HOVER_MS);
  }

  private onPointerDown(): void {
    if (this._disabled) return;
    this.scaleTo(SCALE_PRESSED, TWEEN_PRESS_MS);
  }

  private onPointerUp(): void {
    if (this._disabled) return;
    // Vuelve a escala hover (el cursor sigue sobre el botón)
    this.scaleTo(SCALE_HOVER, TWEEN_HOVER_MS);
    this._onClick();
  }
}
