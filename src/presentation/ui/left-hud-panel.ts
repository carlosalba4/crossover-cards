import Phaser from "phaser";
import { ActionLog } from "@presentation/ui/action-log";
import type { IHUDPanel } from "@presentation/ui/i-hud-panel";

// ---------------------------------------------------------------------------
// Clase LeftHUDPanel
// ---------------------------------------------------------------------------

/**
 * Panel lateral izquierdo del HUD: registro de acciones (`ActionLog`) y botón
 * de pausa. Responsabilidad única frente a `RightHUDPanel` (que gestiona los
 * recursos del jugador). Emite el evento `"pause"` al pulsar el botón.
 */
export class LeftHUDPanel extends Phaser.GameObjects.Container implements IHUDPanel {
  private readonly actionLog: ActionLog;
  private readonly pauseBtn: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // ActionLog
    this.actionLog = new ActionLog(scene, 0, 0);
    this.add(this.actionLog);

    // Indicadores de estado del oponente (escudo y zona) con sus iconos.
    this.buildStatusIcons(scene, 40, 390);

    // Botón Pausa / Ajustes
    this.pauseBtn = scene.add
      .image(60, 450, "icon-settings")
      .setDisplaySize(64, 64)
      .setInteractive({ useHandCursor: true });

    const baseScale = this.pauseBtn.scale;
    const hoverScale = baseScale * 1.05;
    const pressScale = baseScale * 0.95;

    this.pauseBtn.on("pointerover", () => {
      scene.tweens.killTweensOf(this.pauseBtn);
      scene.tweens.add({ targets: this.pauseBtn, scale: hoverScale, duration: 80, ease: "Power1" });
    });
    this.pauseBtn.on("pointerout", () => {
      scene.tweens.killTweensOf(this.pauseBtn);
      scene.tweens.add({ targets: this.pauseBtn, scale: baseScale, duration: 80, ease: "Power1" });
    });
    this.pauseBtn.on("pointerdown", () => {
      scene.tweens.killTweensOf(this.pauseBtn);
      scene.tweens.add({ targets: this.pauseBtn, scale: pressScale, duration: 60, ease: "Power1" });
    });
    this.pauseBtn.on("pointerup", () => {
      scene.tweens.killTweensOf(this.pauseBtn);
      scene.tweens.add({ targets: this.pauseBtn, scale: hoverScale, duration: 80, ease: "Power1" });
      this.emit("pause");
    });

    this.add(this.pauseBtn);

    scene.add.existing(this);
  }

  /**
   * Dibuja los indicadores de estado del oponente con sus iconos: escudo
   * (icon-shield) y zona (icon-zone). Cada uno usa su sprite si está cargado o
   * un placeholder de Graphics como fallback.
   */
  private buildStatusIcons(scene: Phaser.Scene, x: number, y: number): void {
    this.addStatusIcon(scene, x, y, "icon-shield", 0x4a9fdb);
    this.addStatusIcon(scene, x + 48, y, "icon-zone", 0x39d98a);
  }

  /** Añade un indicador de icono individual (sprite o círculo de color fallback). */
  private addStatusIcon(
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    fallbackColor: number,
  ): void {
    if (scene.textures.exists(key)) {
      const icon = scene.add.image(x, y, key).setDisplaySize(28, 28);
      this.add(icon);
    } else {
      const gfx = scene.add.graphics();
      gfx.fillStyle(fallbackColor, 1);
      gfx.fillCircle(x, y, 12);
      this.add(gfx);
    }
  }

  /** Añade una entrada al registro de acciones. */
  public addActionEntry(text: string): void {
    this.actionLog.addEntry(text);
  }
}
