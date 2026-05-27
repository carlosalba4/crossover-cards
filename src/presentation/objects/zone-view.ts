import Phaser from "phaser";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface EnvironmentData {
  iconKey: string;
  name: string;
  color: number;
}

// ---------------------------------------------------------------------------
// Constantes de diseño
// ---------------------------------------------------------------------------

const COLOR_TEXT_SECONDARY = "#9B96B0";
const COLOR_SLOT_OUTLINE = 0x9b96b0;
const COLOR_VALID_TARGET = 0x4caf6e;
const COLOR_INVALID_TARGET = 0xff3b3b;
const COLOR_SEPARATOR = 0x252240;
const SLOT_WIDTH = 72;
const SLOT_HEIGHT = 96;
const SLOT_GAP = 8;
const BACKGROUND_ALPHA = 0.15;

// ---------------------------------------------------------------------------
// Clase ZoneView
// ---------------------------------------------------------------------------

export class ZoneView extends Phaser.GameObjects.Container {
  private readonly zoneWidth: number;
  private readonly zoneHeight: number;
  public readonly zoneId: string;

  private bgGraphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;
  private iconImg: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics | null = null;
  private nameText: Phaser.GameObjects.Text;

  private currentColor: number = 0x000000;
  private colorTween: Phaser.Tweens.Tween | null = null;

  constructor(
    scene: Phaser.Scene,
    zoneId: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    super(scene, x, y);
    this.zoneId = zoneId;
    this.zoneWidth = width;
    this.zoneHeight = height;

    // 1. Capa de fondo
    this.bgGraphics = scene.add.graphics();
    this.add(this.bgGraphics);

    // 2. Capa de slots vacíos (contorno punteado)
    const slotsGraphics = scene.add.graphics();
    slotsGraphics.lineStyle(2, COLOR_SLOT_OUTLINE, 0.4);
    this.drawEmptySlots(slotsGraphics);
    this.add(slotsGraphics);

    // 3. Línea divisoria central
    const sepGraphics = scene.add.graphics();
    sepGraphics.lineStyle(2, COLOR_SEPARATOR, 1);
    sepGraphics.beginPath();
    sepGraphics.moveTo(0, height / 2);
    sepGraphics.lineTo(width, height / 2);
    sepGraphics.strokePath();
    this.add(sepGraphics);

    // 4. Capa de Highlight (Glow)
    this.glowGraphics = scene.add.graphics();
    this.add(this.glowGraphics);

    // 5. Etiqueta de nombre del entorno
    this.nameText = scene.add
      .text(width / 2, height / 2 + 16, "", {
        fontFamily: "Nunito",
        fontSize: "12px",
        color: COLOR_TEXT_SECONDARY,
      })
      .setOrigin(0.5, 0);
    this.add(this.nameText);

    // Establecer tamaño para interactividad futura
    this.setSize(width, height);

    // Registrar en la escena
    scene.add.existing(this);
  }

  // -------------------------------------------------------------------------
  // Métodos Públicos
  // -------------------------------------------------------------------------

  /**
   * Actualiza el entorno de la zona (icono, nombre, color de fondo).
   */
  public setEnvironment(envData: EnvironmentData | null): void {
    if (!envData) {
      this.nameText.setText("Neutral");
      this.transitionColor(0x000000);
      this.setIcon(null, 0x000000);
      return;
    }

    this.nameText.setText(envData.name);
    this.transitionColor(envData.color);
    this.setIcon(envData.iconKey, envData.color);
  }

  /**
   * Resalta la zona al arrastrar una carta sobre ella.
   */
  public highlightAsTarget(valid: boolean): void {
    const color = valid ? COLOR_VALID_TARGET : COLOR_INVALID_TARGET;
    this.glowGraphics.clear();
    this.glowGraphics.lineStyle(4, color, 1);
    this.glowGraphics.strokeRect(0, 0, this.zoneWidth, this.zoneHeight);

    // Relleno semitransparente como glow interior
    this.glowGraphics.fillStyle(color, 0.1);
    this.glowGraphics.fillRect(0, 0, this.zoneWidth, this.zoneHeight);
  }

  /**
   * Elimina el resaltado de target.
   */
  public clearHighlight(): void {
    this.glowGraphics.clear();
  }

  // -------------------------------------------------------------------------
  // Métodos Privados
  // -------------------------------------------------------------------------

  /**
   * Transición fluida del color de fondo usando un tween de Phaser.
   */
  private transitionColor(targetColor: number): void {
    if (this.colorTween) {
      this.colorTween.stop();
    }

    const startColorObj = Phaser.Display.Color.IntegerToColor(this.currentColor);
    const targetColorObj = Phaser.Display.Color.IntegerToColor(targetColor);

    this.colorTween = this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 500,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        const value = Number(tween.getValue());
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
          startColorObj,
          targetColorObj,
          100,
          value,
        );
        const colorInt = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
        this.drawBackground(colorInt);
      },
      onComplete: () => {
        this.currentColor = targetColor;
        this.drawBackground(targetColor);
        this.colorTween = null;
      },
    });
  }

  /**
   * Dibuja el fondo semitransparente con el color actual.
   */
  private drawBackground(color: number): void {
    this.bgGraphics.clear();
    this.bgGraphics.fillStyle(color, BACKGROUND_ALPHA);
    this.bgGraphics.fillRect(0, 0, this.zoneWidth, this.zoneHeight);
  }

  /**
   * Actualiza el icono del entorno. Crea un Graphics placeholder si falta.
   */
  private setIcon(iconKey: string | null, color: number): void {
    if (this.iconImg) {
      this.iconImg.destroy();
      this.iconImg = null;
    }

    if (!iconKey) return;

    if (this.scene.textures.exists(iconKey)) {
      this.iconImg = this.scene.add.image(this.zoneWidth / 2, this.zoneHeight / 2 - 12, iconKey);
      this.iconImg.setDisplaySize(24, 24);
    } else {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(color || 0x8c9099, 1);
      gfx.fillCircle(this.zoneWidth / 2, this.zoneHeight / 2 - 12, 12);
      this.iconImg = gfx;
    }
    this.add(this.iconImg);
  }

  /**
   * Dibuja 4 slots vacíos (2 por bando) con contorno punteado.
   */
  private drawEmptySlots(gfx: Phaser.GameObjects.Graphics): void {
    const centerX = this.zoneWidth / 2;
    const topY = this.zoneHeight * 0.25;
    const bottomY = this.zoneHeight * 0.75;

    const xs = [centerX - SLOT_WIDTH - SLOT_GAP / 2, centerX + SLOT_GAP / 2];
    const ys = [topY - SLOT_HEIGHT / 2, bottomY - SLOT_HEIGHT / 2];

    for (const y of ys) {
      for (const x of xs) {
        this.drawDashedRect(gfx, x, y, SLOT_WIDTH, SLOT_HEIGHT);
      }
    }
  }

  /**
   * Helper para dibujar un rectángulo con borde punteado/discontinuo.
   */
  private drawDashedRect(
    gfx: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const dashLength = 6;
    const gapLength = 6;

    gfx.beginPath();

    // Superior
    for (let i = x; i < x + w; i += dashLength + gapLength) {
      gfx.moveTo(i, y);
      gfx.lineTo(Math.min(i + dashLength, x + w), y);
    }
    // Inferior
    for (let i = x; i < x + w; i += dashLength + gapLength) {
      gfx.moveTo(i, y + h);
      gfx.lineTo(Math.min(i + dashLength, x + w), y + h);
    }
    // Izquierdo
    for (let i = y; i < y + h; i += dashLength + gapLength) {
      gfx.moveTo(x, i);
      gfx.lineTo(x, Math.min(i + dashLength, y + h));
    }
    // Derecho
    for (let i = y; i < y + h; i += dashLength + gapLength) {
      gfx.moveTo(x + w, i);
      gfx.lineTo(x + w, Math.min(i + dashLength, y + h));
    }

    gfx.strokePath();
  }

  override destroy(fromScene?: boolean): void {
    if (this.colorTween) {
      this.colorTween.stop();
    }
    super.destroy(fromScene);
  }
}
