import Phaser from "phaser";

export type TurnPhase = "Draw" | "Main" | "Combat" | "End";

const PHASES: Array<{ id: TurnPhase; label: string }> = [
  { id: "Draw", label: "ROBO" },
  { id: "Main", label: "PRINCIPAL" },
  { id: "Combat", label: "COMBATE" },
  { id: "End", label: "FIN" },
];

export class TurnIndicator extends Phaser.GameObjects.Container {
  private bgGraphics: Phaser.GameObjects.Graphics;
  private phaseTexts: Map<TurnPhase, Phaser.GameObjects.Text> = new Map();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.bgGraphics = scene.add.graphics();
    this.bgGraphics.fillStyle(0x252240, 1);
    this.bgGraphics.fillRect(-100, -16, 200, 32);

    this.add(this.bgGraphics);

    // Repartir 4 textos a lo largo de los 200px
    const positions = [-72, -18, 32, 75];

    PHASES.forEach((phase, index) => {
      const text = scene.add
        .text(positions[index], 0, phase.label, {
          fontFamily: "Bangers",
          fontSize: "18px",
          color: "#9B96B0",
        })
        .setOrigin(0.5);

      text.setAlpha(0.5); // Inactivo por defecto
      this.add(text);
      this.phaseTexts.set(phase.id, text);
    });

    scene.add.existing(this);
  }

  /**
   * Actualiza el indicador para resaltar la fase actual
   * y cambiar el color según el jugador activo.
   */
  public setPhase(phase: TurnPhase, isPlayerTurn: boolean): void {
    const activeColor = isPlayerTurn ? "#3ECFCF" : "#FF3B3B";
    const activeBorderColor = isPlayerTurn ? 0x3ecfcf : 0xff3b3b;

    // Actualizar borde de todo el banner
    this.bgGraphics.clear();
    this.bgGraphics.fillStyle(0x252240, 1);
    this.bgGraphics.fillRect(-100, -16, 200, 32);
    this.bgGraphics.lineStyle(2, activeBorderColor, 1);
    this.bgGraphics.strokeRect(-100, -16, 200, 32);

    // Resaltar el texto de la fase activa
    this.phaseTexts.forEach((text, id) => {
      if (id === phase) {
        text.setColor(activeColor);
        text.setAlpha(1);
      } else {
        text.setColor("#9B96B0");
        text.setAlpha(0.5);
      }
    });
  }
}
