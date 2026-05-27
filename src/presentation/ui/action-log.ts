import Phaser from "phaser";

const MAX_ENTRIES = 5;
const WIDTH = 120;
const HEIGHT = 400;
const PADDING = 8;
const TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Nunito",
  fontSize: "12px",
  color: "#9B96B0",
  wordWrap: { width: WIDTH - PADDING * 2, useAdvancedWrap: true },
};

export class ActionLog extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private entries: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x1a1730, 1);
    this.bg.fillRoundedRect(0, 0, WIDTH, HEIGHT, 8);

    this.add(this.bg);
    scene.add.existing(this);
  }

  /**
   * Agrega una nueva entrada al registro de acciones.
   * Inserta al principio y anima el desplazamiento.
   */
  public addEntry(text: string): void {
    const textObj = this.scene.add.text(PADDING, PADDING, text, TEXT_STYLE);
    this.add(textObj);

    this.entries.unshift(textObj);

    // Mantener un máximo de 5 entradas
    if (this.entries.length > MAX_ENTRIES) {
      const oldest = this.entries.pop();
      oldest?.destroy();
    }

    // Reposicionar y animar textos
    let currentY = PADDING;
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];

      if (i === 0) {
        // Nueva entrada hace fade-in
        entry.y = currentY;
        entry.alpha = 0;
        this.scene.tweens.add({
          targets: entry,
          alpha: 1,
          duration: 300,
        });
      } else {
        // Entradas anteriores bajan
        this.scene.tweens.add({
          targets: entry,
          y: currentY,
          duration: 300,
          ease: "Quad.easeOut",
        });
      }

      currentY += entry.height + PADDING;
    }
  }

  /**
   * Elimina todas las entradas del registro.
   */
  public clear(): void {
    for (const entry of this.entries) {
      entry.destroy();
    }
    this.entries = [];
  }
}
