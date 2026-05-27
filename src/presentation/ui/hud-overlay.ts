import Phaser from "phaser";
import { NostalgiaClockUI } from "@presentation/objects/nostalgia-clock-ui";
import { DeckCounter } from "@presentation/ui/deck-counter";
import { ActionLog } from "@presentation/ui/action-log";
import { Button } from "@presentation/ui/button";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface QuestData {
  name: string;
  current: number;
  target: number;
}

// ---------------------------------------------------------------------------
// Clase HUDOverlay
// ---------------------------------------------------------------------------

export class HUDOverlay extends Phaser.GameObjects.Container {
  private readonly side: "left" | "right";

  // Lado Izquierdo
  private actionLog?: ActionLog;
  private pauseBtn?: Button;

  // Lado Derecho
  private nostalgiaClock?: NostalgiaClockUI;
  private deckCounter?: DeckCounter;
  private crossoverBtn?: Button;
  private endTurnBtn?: Button;

  // Momentum (Derecho)
  private momentumBarContainer?: Phaser.GameObjects.Container;
  private momentumGraphics?: Phaser.GameObjects.Graphics;

  // Quest (Derecho)
  private questContainer?: Phaser.GameObjects.Container;
  private questPopup?: Phaser.GameObjects.Container;
  private questHoverTimer: Phaser.Time.TimerEvent | null = null;
  private questNameText?: Phaser.GameObjects.Text;
  private questProgressText?: Phaser.GameObjects.Text;
  private questPopupNameText?: Phaser.GameObjects.Text;
  private questPopupProgressText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, side: "left" | "right", x: number, y: number) {
    super(scene, x, y);
    this.side = side;

    if (side === "left") {
      this.buildLeftHUD(scene);
    } else {
      this.buildRightHUD(scene);
    }

    scene.add.existing(this);
  }

  // -------------------------------------------------------------------------
  // Construcción Visual
  // -------------------------------------------------------------------------

  private buildLeftHUD(scene: Phaser.Scene): void {
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
        // Pausa no definida en scope actual
      },
    });
    this.add(this.pauseBtn);
  }

  private buildRightHUD(scene: Phaser.Scene): void {
    // NostalgiaClockUI
    this.nostalgiaClock = new NostalgiaClockUI(scene, 80, 80);
    this.add(this.nostalgiaClock);

    // MomentumBar
    this.buildMomentumBar(scene, 10, 40);

    // DeckCounter
    this.deckCounter = new DeckCounter(scene, 50, 160);
    this.add(this.deckCounter);

    // Crossover Button
    this.crossoverBtn = new Button({
      scene,
      x: 80,
      y: 230,
      width: 144,
      height: 40,
      label: "CROSSOVER",
      backgroundColor: 0x7b4fdb,
      textColor: "#F0EAD6",
      onClick: () => {
        this.emit("crossover");
      },
    });
    this.add(this.crossoverBtn);

    // Quest Panel
    this.buildQuestPanel(scene, 80, 290);

    // End Turn Button
    this.endTurnBtn = new Button({
      scene,
      x: 80,
      y: 360,
      width: 144,
      height: 56,
      label: "FIN DE TURNO",
      backgroundColor: 0x3ecfcf,
      textColor: "#0d0b1e",
      onClick: () => {
        this.emit("endTurn");
      },
    });
    this.add(this.endTurnBtn);
  }

  private buildMomentumBar(scene: Phaser.Scene, x: number, y: number): void {
    this.momentumBarContainer = scene.add.container(x, y);
    this.momentumGraphics = scene.add.graphics();
    this.momentumBarContainer.add(this.momentumGraphics);

    this.momentumBarContainer.setAlpha(0);
    this.add(this.momentumBarContainer);
  }

  private buildQuestPanel(scene: Phaser.Scene, x: number, y: number): void {
    this.questContainer = scene.add.container(x, y);

    const bg = scene.add.graphics();
    bg.fillStyle(0x1a1730, 1);
    bg.fillRoundedRect(-72, -24, 144, 48, 4);
    bg.lineStyle(2, 0xf5c842, 1);
    bg.strokeRoundedRect(-72, -24, 144, 48, 4);

    this.questNameText = scene.add
      .text(0, -8, "Misión", {
        fontFamily: "Nunito",
        fontSize: "14px",
        color: "#F0EAD6",
      })
      .setOrigin(0.5);

    this.questProgressText = scene.add
      .text(0, 12, "0/0", {
        fontFamily: "Nunito",
        fontSize: "12px",
        color: "#9B96B0",
      })
      .setOrigin(0.5);

    const hitArea = scene.add.rectangle(0, 0, 144, 48);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on("pointerover", () => {
      this.questHoverTimer = this.scene.time.delayedCall(300, () => {
        this.showQuestPopup();
      });
    });

    hitArea.on("pointerout", () => {
      if (this.questHoverTimer) {
        this.questHoverTimer.destroy();
        this.questHoverTimer = null;
      }
      this.hideQuestPopup();
    });

    this.questContainer.add([bg, this.questNameText, this.questProgressText, hitArea]);
    this.questContainer.setVisible(false);
    this.add(this.questContainer);

    // Popup expandido
    this.questPopup = scene.add.container(x - 80, y);
    const popBg = scene.add.graphics();
    popBg.fillStyle(0x252240, 1);
    popBg.fillRoundedRect(-280, -80, 280, 160, 8);
    popBg.lineStyle(2, 0xf5c842, 1);
    popBg.strokeRoundedRect(-280, -80, 280, 160, 8);

    this.questPopupNameText = scene.add
      .text(-140, -40, "Misión", {
        fontFamily: "Bangers",
        fontSize: "24px",
        color: "#F5C842",
      })
      .setOrigin(0.5);

    this.questPopupProgressText = scene.add
      .text(-140, 0, "0/0", {
        fontFamily: "Nunito",
        fontSize: "18px",
        color: "#F0EAD6",
      })
      .setOrigin(0.5);

    const popDesc = scene.add
      .text(-140, 40, "Completa el objetivo para recompensa", {
        fontFamily: "Nunito",
        fontSize: "12px",
        color: "#9B96B0",
      })
      .setOrigin(0.5);

    this.questPopup.add([popBg, this.questPopupNameText, this.questPopupProgressText, popDesc]);
    this.questPopup.setVisible(false);
    this.add(this.questPopup);
  }

  // -------------------------------------------------------------------------
  // Métodos Públicos (Actualización de Estado)
  // -------------------------------------------------------------------------

  public updateNostalgia(current: number, max: number): void {
    if (this.nostalgiaClock) {
      this.nostalgiaClock.update(current, max);
    }
  }

  public updateDeck(count: number): void {
    if (this.deckCounter) {
      this.deckCounter.update(count);
    }
  }

  public updateMomentum(points: number, isActive: boolean): void {
    if (!this.momentumBarContainer || !this.momentumGraphics) return;

    if (isActive) {
      if (this.momentumBarContainer.alpha === 0) {
        this.scene.tweens.add({
          targets: this.momentumBarContainer,
          alpha: 1,
          duration: 600,
          ease: "Sine.easeInOut",
        });
      }

      this.momentumGraphics.clear();
      this.momentumGraphics.fillStyle(0x1a1730, 1);
      this.momentumGraphics.fillRect(0, 0, 16, 80);

      this.momentumGraphics.fillStyle(0xf5a623, 1);
      const safePoints = Math.min(points, 10); // Asumiendo 10 max
      for (let i = 0; i < safePoints; i++) {
        this.momentumGraphics.fillRect(0, 80 - (i + 1) * 8, 16, 8);
      }

      // Separadores
      this.momentumGraphics.lineStyle(1, 0x000000, 1);
      for (let i = 1; i < 10; i++) {
        this.momentumGraphics.beginPath();
        this.momentumGraphics.moveTo(0, i * 8);
        this.momentumGraphics.lineTo(16, i * 8);
        this.momentumGraphics.strokePath();
      }
    } else {
      this.momentumBarContainer.setAlpha(0);
    }
  }

  public setCrossoverUsed(used: boolean): void {
    if (this.crossoverBtn) {
      this.crossoverBtn.setDisabled(used);
      this.crossoverBtn.setAlpha(used ? 0.5 : 1.0);
    }
  }

  public setEndTurnEnabled(enabled: boolean): void {
    if (this.endTurnBtn) {
      this.endTurnBtn.setDisabled(!enabled);
    }
  }

  public setActiveQuest(quest: QuestData | null): void {
    if (!this.questContainer) return;

    if (quest) {
      this.questContainer.setVisible(true);

      const shortName = quest.name.length > 12 ? quest.name.substring(0, 10) + "..." : quest.name;
      this.questNameText?.setText(shortName);
      this.questProgressText?.setText(`${quest.current}/${quest.target}`);

      this.questPopupNameText?.setText(quest.name);
      this.questPopupProgressText?.setText(`Progreso: ${quest.current}/${quest.target}`);
    } else {
      this.questContainer.setVisible(false);
      this.hideQuestPopup();
    }
  }

  public addActionEntry(text: string): void {
    if (this.actionLog && this.side === "left") {
      this.actionLog.addEntry(text);
    }
  }

  // -------------------------------------------------------------------------
  // Métodos Internos
  // -------------------------------------------------------------------------

  private showQuestPopup(): void {
    if (this.questPopup) {
      this.questPopup.setVisible(true);
      this.questPopup.setAlpha(0);
      this.scene.tweens.add({
        targets: this.questPopup,
        alpha: 1,
        duration: 150,
      });
    }
  }

  private hideQuestPopup(): void {
    if (this.questPopup) {
      this.scene.tweens.killTweensOf(this.questPopup);
      this.questPopup.setVisible(false);
    }
  }

  override destroy(fromScene?: boolean): void {
    if (this.questHoverTimer) {
      this.questHoverTimer.destroy();
    }
    super.destroy(fromScene);
  }
}
