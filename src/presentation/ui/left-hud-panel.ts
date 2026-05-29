import Phaser from "phaser";
import { ActionLog } from "@presentation/ui/action-log";
import { Button } from "@presentation/ui/button";
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
  private readonly pauseBtn: Button;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // ActionLog
    this.actionLog = new ActionLog(scene, 0, 0);
    this.add(this.actionLog);

    // Botón Pausa
    this.pauseBtn = new Button({
      scene,
      x: 60,
      y: 450,
      width: 104,
      height: 40,
      label: "PAUSA",
      backgroundColor: 0x1a1730,
      textColor: "#F0EAD6",
      onClick: () => {
        this.emit("pause");
      },
    });
    this.add(this.pauseBtn);

    scene.add.existing(this);
  }

  /** Añade una entrada al registro de acciones. */
  public addActionEntry(text: string): void {
    this.actionLog.addEntry(text);
  }
}
