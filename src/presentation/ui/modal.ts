import Phaser from "phaser";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/**
 * Configuración para construir un Modal.
 * Referencia: docs/05-ui-design.md §4.10.
 */
export interface ModalConfig {
  scene: Phaser.Scene;
  title: string;
  /** Texto multilínea separado por '\n'. */
  body: string;
  /** Callback invocado tras cerrar y destruir el modal. */
  onClose?: () => void;
  /** Ancho del panel central en píxeles. Por defecto 480. */
  width?: number;
  /** Alto del panel central en píxeles. Por defecto 320. */
  height?: number;
}

// ---------------------------------------------------------------------------
// Constantes de diseño (tokens — docs/05-ui-design.md §2.1 y §4.10)
// ---------------------------------------------------------------------------

/** Fondo del panel — bg-surface. */
const COLOR_PANEL_BG = 0x252240;
/** Borde del panel — bg-card. */
const COLOR_PANEL_BORDER = 0x1a1730;
/** Radio de esquinas del panel. */
const PANEL_CORNER_RADIUS = 12;
/** Grosor del borde del panel. */
const PANEL_BORDER_WIDTH = 2;
/** Padding superior del título respecto al panel. */
const TITLE_PADDING_TOP = 24;
/** Padding horizontal del cuerpo respecto al panel. */
const BODY_PADDING_X = 32;
/** Profundidad del modal — encima de todo. */
const MODAL_DEPTH = 1000;
/** Duración de las animaciones de entrada/salida en ms. */
const ANIM_DURATION = 200;
/** Alpha objetivo del overlay. */
const OVERLAY_ALPHA = 0.7;
/** Escala inicial del panel durante la entrada. */
const PANEL_SCALE_FROM = 0.9;

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 320;

// ---------------------------------------------------------------------------
// Clase Modal
// ---------------------------------------------------------------------------

/**
 * Modal reutilizable para Crossover Cards.
 *
 * Extiende `Phaser.GameObjects.Container` y se registra en la escena
 * automáticamente. Incluye overlay semitransparente bloqueante, panel
 * central animado y botón de cierre "✕".
 *
 * Uso recomendado via método estático:
 * ```ts
 * Modal.show(this, { title: 'Cómo jugar', body: '...' });
 * ```
 *
 * Referencia: docs/05-ui-design.md §4.10 y §3.2.
 */
export class Modal extends Phaser.GameObjects.Container {
  private readonly _onClose: (() => void) | undefined;
  private readonly panel: Phaser.GameObjects.Graphics;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(config: ModalConfig) {
    // El Container se posiciona en (0, 0) — sus hijos usan coordenadas canvas
    super(config.scene, 0, 0);

    this._onClose = config.onClose;

    const { width: canvasW, height: canvasH } = config.scene.scale;
    const modalW = config.width ?? DEFAULT_WIDTH;
    const modalH = config.height ?? DEFAULT_HEIGHT;
    const cx = canvasW / 2;
    const cy = canvasH / 2;

    // --- Overlay semitransparente bloqueante ---
    const overlay = config.scene.add.graphics();
    overlay.fillStyle(0x000000, OVERLAY_ALPHA);
    overlay.fillRect(0, 0, canvasW, canvasH);
    // El overlay bloquea clics sin cerrar el modal
    const overlayRect = new Phaser.Geom.Rectangle(0, 0, canvasW, canvasH);
    overlay.setInteractive(overlayRect, (rect: Phaser.Geom.Rectangle, x: number, y: number) =>
      Phaser.Geom.Rectangle.Contains(rect, x, y),
    );

    // --- Panel central ---
    this.panel = config.scene.add.graphics();
    this.drawPanel(cx, cy, modalW, modalH);

    // --- Título ---
    const titleY = cy - modalH / 2 + TITLE_PADDING_TOP;
    const titleText = config.scene.add
      .text(cx, titleY, config.title, {
        fontFamily: "Bangers, system-ui",
        fontSize: "40px",
        color: "#F0EAD6",
      })
      .setOrigin(0.5, 0);

    // --- Cuerpo ---
    const bodyMaxWidth = modalW - BODY_PADDING_X * 2;
    const bodyY = titleY + titleText.height + 16;
    config.scene.add
      .text(cx, bodyY, config.body, {
        fontFamily: "Nunito, system-ui",
        fontSize: "16px",
        color: "#9B96B0",
        wordWrap: { width: bodyMaxWidth },
        align: "center",
      })
      .setOrigin(0.5, 0);

    // --- Botón de cierre "✕" ---
    const closeX = cx + modalW / 2 - 24;
    const closeY = cy - modalH / 2 + 16;
    const closeBtn = config.scene.add
      .text(closeX, closeY, "✕", {
        fontFamily: "Nunito, system-ui",
        fontSize: "24px",
        color: "#F0EAD6",
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });

    closeBtn.on("pointerover", () => {
      closeBtn.setAlpha(0.7);
    });
    closeBtn.on("pointerout", () => {
      closeBtn.setAlpha(1);
    });
    closeBtn.on("pointerup", () => {
      this.animateOut();
    });

    // --- Ensamblar contenedor ---
    this.add([overlay, this.panel, titleText, closeBtn]);

    // --- Profundidad máxima ---
    this.setDepth(MODAL_DEPTH);

    // --- Animación de entrada ---
    overlay.setAlpha(0);
    this.panel.setScale(PANEL_SCALE_FROM);
    titleText.setScale(PANEL_SCALE_FROM);
    closeBtn.setScale(PANEL_SCALE_FROM);

    config.scene.tweens.add({
      targets: overlay,
      alpha: OVERLAY_ALPHA,
      duration: ANIM_DURATION,
      ease: "Power1",
    });
    config.scene.tweens.add({
      targets: [this.panel, titleText, closeBtn],
      scaleX: 1,
      scaleY: 1,
      duration: ANIM_DURATION,
      ease: "Power2.easeOut",
    });

    // Registrar en la escena (siempre al final del constructor)
    config.scene.add.existing(this);
  }

  // -------------------------------------------------------------------------
  // Método estático de fábrica
  // -------------------------------------------------------------------------

  /**
   * Crea y muestra un Modal en la escena indicada.
   *
   * @param scene  Escena Phaser receptora.
   * @param config Configuración del modal (sin el campo `scene`).
   * @returns      La instancia creada.
   */
  static show(scene: Phaser.Scene, config: Omit<ModalConfig, "scene">): Modal {
    return new Modal({ scene, ...config });
  }

  // -------------------------------------------------------------------------
  // Animación de salida y destrucción
  // -------------------------------------------------------------------------

  /**
   * Anima la salida del modal (inverso a la entrada) y lo destruye.
   * Invoca `onClose` tras la animación.
   */
  private animateOut(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: PANEL_SCALE_FROM,
      scaleY: PANEL_SCALE_FROM,
      duration: ANIM_DURATION,
      ease: "Power1",
      onComplete: () => {
        this.destroy();
        this._onClose?.();
      },
    });
  }

  // -------------------------------------------------------------------------
  // Dibujo del panel central
  // -------------------------------------------------------------------------

  /**
   * Dibuja el panel centrado en (cx, cy) con borde y esquinas redondeadas.
   */
  private drawPanel(cx: number, cy: number, modalW: number, modalH: number): void {
    const px = cx - modalW / 2;
    const py = cy - modalH / 2;

    // Borde exterior (bg-card)
    this.panel.fillStyle(COLOR_PANEL_BORDER, 1);
    this.panel.fillRoundedRect(
      px - PANEL_BORDER_WIDTH,
      py - PANEL_BORDER_WIDTH,
      modalW + PANEL_BORDER_WIDTH * 2,
      modalH + PANEL_BORDER_WIDTH * 2,
      PANEL_CORNER_RADIUS + PANEL_BORDER_WIDTH,
    );

    // Relleno interior (bg-surface)
    this.panel.fillStyle(COLOR_PANEL_BG, 1);
    this.panel.fillRoundedRect(px, py, modalW, modalH, PANEL_CORNER_RADIUS);
  }
}
