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
  /**
   * Clave de textura de un icono opcional mostrado a la izquierda de la
   * etiqueta. Si la textura no existe, el botón se renderiza solo con texto
   * (fallback), sin error.
   */
  iconKey?: string;
  /** Prefijo para texturas de los estados (ej. 'button', 'instrucciones'). Por defecto 'button'. */
  texturePrefix?: string;
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
  /** Sprite de fondo del botón (si los assets están disponibles); si no, null. */
  private readonly bgImage: Phaser.GameObjects.Image | null;
  private readonly label: Phaser.GameObjects.Text;

  // Texturas de estados
  private readonly _textureDefault: string;
  private readonly _textureHover: string;
  private readonly _texturePressed: string;
  private readonly _textureDisabled: string;

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

    const prefix = config.texturePrefix ?? "button";
    this._textureDefault = `${prefix}-default`;
    this._textureHover = `${prefix}-hover`;
    this._texturePressed = `${prefix}-pressed`;
    this._textureDisabled = `${prefix}-disabled`;

    // --- Fondo: sprite por defecto si está cargado; si no, Graphics ---
    this.bg = config.scene.add.graphics();
    this.bgImage = config.scene.textures.exists(this._textureDefault)
      ? config.scene.add
        .image(0, 0, this._textureDefault)
        .setDisplaySize(this._width, this._height)
      : null;
    // drawBackground es no-op cuando hay sprite (lo cubre la imagen).
    this.drawBackground(this._backgroundColor);

    // --- Etiqueta (Text) centrada en el contenedor ---
    this.label = config.scene.add.text(0, 0, config.label, {
      fontFamily: config.fontFamily ?? "Bangers",
      fontSize: config.fontSize ?? "28px",
      color: config.textColor ?? "#0D0B1E",
    });
    this.label.setOrigin(0.5, 0.5);

    // --- Ensamblar capas: fondo (Graphics + sprite) → icono opcional → texto ---
    const layers: Phaser.GameObjects.GameObject[] = [this.bg];
    if (this.bgImage) layers.push(this.bgImage);

    // Icono opcional a la izquierda de la etiqueta. Solo se añade si la textura
    // existe; en caso contrario el botón conserva su apariencia de solo texto.
    if (config.iconKey && config.scene.textures.exists(config.iconKey)) {
      const iconSize = this._height * 0.5;
      const icon = config.scene.add.image(-this._width / 2 + iconSize / 2 + 8, 0, config.iconKey);
      icon.setDisplaySize(iconSize, iconSize);
      // Desplazar ligeramente la etiqueta para dejar sitio al icono.
      this.label.setX(iconSize / 2 + 4);
      layers.push(icon);
    }

    layers.push(this.label);
    this.add(layers);

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
   * Redibuja el fondo de Graphics con el color indicado, centrado en (0, 0).
   * Es no-op cuando hay sprite de fondo (button-default), que ya cubre el botón.
   */
  private drawBackground(color: number): void {
    if (this.bgImage) return;
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

  /**
   * Cambia la textura del sprite de fondo al estado indicado (si hay sprites y
   * la textura existe). En modo fallback (Graphics) no hace nada.
   */
  private setStateTexture(key: string): void {
    if (this.bgImage && this.scene.textures.exists(key)) {
      this.bgImage.setTexture(key);
      this.bgImage.setDisplaySize(this._width, this._height);
    }
  }

  // -------------------------------------------------------------------------
  // Gestión de estados visuales
  // -------------------------------------------------------------------------

  private applyNormalState(): void {
    this.setAlpha(1);
    this.setInteractive({ useHandCursor: true });
    this.setStateTexture(this._textureDefault);
    this.drawBackground(this._backgroundColor);
    this.scaleTo(SCALE_NORMAL, TWEEN_HOVER_MS);
  }

  private applyDisabledState(): void {
    this.setAlpha(DISABLED_ALPHA);
    this.disableInteractive();
    this.setStateTexture(this._textureDisabled);
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
    this.setStateTexture(this._textureHover);
    this.drawBackground(lightenColor(this._backgroundColor, LIGHTEN_FACTOR));
    this.scaleTo(SCALE_HOVER, TWEEN_HOVER_MS);
  }

  private onPointerOut(): void {
    if (this._disabled) return;
    this.setStateTexture(this._textureDefault);
    this.drawBackground(this._backgroundColor);
    this.scaleTo(SCALE_NORMAL, TWEEN_HOVER_MS);
  }

  private onPointerDown(): void {
    if (this._disabled) return;
    this.setStateTexture(this._texturePressed);
    this.scaleTo(SCALE_PRESSED, TWEEN_PRESS_MS);
  }

  private onPointerUp(): void {
    if (this._disabled) return;
    // Vuelve a escala hover (el cursor sigue sobre el botón)
    this.setStateTexture(this._textureHover);
    this.scaleTo(SCALE_HOVER, TWEEN_HOVER_MS);
    this._onClick();
  }
}
