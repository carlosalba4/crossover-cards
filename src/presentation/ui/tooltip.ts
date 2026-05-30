import Phaser from "phaser";
import type { CardData } from "@presentation/objects/card-sprite";
import { CardType } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const WIDTH = 280;
const HEIGHT_CHARACTER = 200;
const HEIGHT_OTHER = 160;

const COLOR_BG = 0x252240;
const COLOR_TEXT_PRI = "#F0EAD6";
const COLOR_TEXT_SEC = "#9B96B0";
const COLOR_TEXT_GOLD = "#F5C842";
const COLOR_ATK = 0xff3b3b;
const COLOR_VID = 0x4caf6e;

const RARITY_COLORS: Record<string, number> = {
  Common: 0x8c9099,
  Rare: 0x4a9fdb,
  Epic: 0x9b5de5,
  Legendary: 0xf5c842,
};

// ---------------------------------------------------------------------------
// Clase Tooltip
// ---------------------------------------------------------------------------

export class Tooltip extends Phaser.GameObjects.Container {
  private timer: Phaser.Time.TimerEvent | null = null;
  private fadeTween: Phaser.Tweens.Tween | null = null;

  // Capas visuales
  private bgGraphics: Phaser.GameObjects.Graphics;
  private portraitContainer: Phaser.GameObjects.Container | null = null;

  // Textos
  private nameText: Phaser.GameObjects.Text;
  private typeText: Phaser.GameObjects.Text;
  private rarityText: Phaser.GameObjects.Text;
  private costText: Phaser.GameObjects.Text;
  private descText: Phaser.GameObjects.Text;

  // Stats (Solo Character)
  private statsGraphics: Phaser.GameObjects.Graphics;
  private atkText: Phaser.GameObjects.Text;
  private vidText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.bgGraphics = scene.add.graphics();
    this.add(this.bgGraphics);

    this.nameText = scene.add.text(108, 16, "", {
      fontFamily: "Bangers",
      fontSize: "28px",
      color: COLOR_TEXT_PRI,
    });
    this.typeText = scene.add.text(108, 48, "", {
      fontFamily: "Nunito",
      fontSize: "12px",
      color: COLOR_TEXT_SEC,
      fontStyle: "bold",
    });
    this.rarityText = scene.add.text(108, 64, "", {
      fontFamily: "Nunito",
      fontSize: "12px",
      color: COLOR_TEXT_SEC,
    });
    this.costText = scene.add.text(108, 80, "", {
      fontFamily: "Nunito",
      fontSize: "12px",
      color: COLOR_TEXT_GOLD,
    });
    this.descText = scene.add.text(16, 110, "", {
      fontFamily: "Nunito",
      fontSize: "12px",
      color: COLOR_TEXT_PRI,
      wordWrap: { width: 248, useAdvancedWrap: true },
    });

    this.statsGraphics = scene.add.graphics();
    this.atkText = scene.add.text(40, 166, "", {
      fontFamily: "Bangers",
      fontSize: "20px",
      color: "#FF3B3B",
    });
    this.vidText = scene.add.text(100, 166, "", {
      fontFamily: "Bangers",
      fontSize: "20px",
      color: "#4CAF6E",
    });

    this.add([
      this.nameText,
      this.typeText,
      this.rarityText,
      this.costText,
      this.descText,
      this.statsGraphics,
      this.atkText,
      this.vidText,
    ]);

    this.setAlpha(0);
    this.setVisible(false);
    this.setDepth(1000);

    scene.add.existing(this);
  }

  // -------------------------------------------------------------------------
  // Métodos Públicos
  // -------------------------------------------------------------------------

  /**
   * Programa la aparición del tooltip tras un hover constante.
   */
  public showForCard(card: CardData, x: number, y: number, cardHeight: number): void {
    this.hide();

    this.timer = this.scene.time.delayedCall(300, () => {
      const isCharacter = card.type === CardType.Character;
      const tooltipHeight = isCharacter ? HEIGHT_CHARACTER : HEIGHT_OTHER;

      this.buildContent(card, isCharacter, tooltipHeight);
      this.positionTooltip(x, y, cardHeight, tooltipHeight);

      this.setVisible(true);
      this.fadeTween = this.scene.tweens.add({
        targets: this,
        alpha: 1,
        duration: 150,
      });
    });
  }

  /**
   * Oculta el tooltip inmediatamente y cancela el timer.
   */
  public hide(): void {
    if (this.timer) {
      this.timer.destroy();
      this.timer = null;
    }
    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }
    this.setAlpha(0);
    this.setVisible(false);
  }

  // -------------------------------------------------------------------------
  // Métodos Privados
  // -------------------------------------------------------------------------

  private buildContent(card: CardData, isCharacter: boolean, height: number): void {
    const rarityColor = RARITY_COLORS[card.rarity] || 0x8c9099;

    this.bgGraphics.clear();
    this.bgGraphics.fillStyle(COLOR_BG, 1);
    this.bgGraphics.fillRoundedRect(0, 0, WIDTH, height, 8);
    this.bgGraphics.lineStyle(2, rarityColor, 1);
    this.bgGraphics.strokeRoundedRect(0, 0, WIDTH, height, 8);

    this.buildPortrait(card);

    this.nameText.setText(card.name);
    this.typeText.setText(`${card.type.toUpperCase()} - ${card.archetype.toUpperCase()}`);
    this.rarityText.setText(`Rareza: ${card.rarity}`);
    this.costText.setText(`Coste Nostalgia: ${card.nostalgyCost}`);
    this.descText.setText(card.description);

    if (isCharacter) {
      this.statsGraphics.setVisible(true);
      this.atkText.setVisible(true);
      this.vidText.setVisible(true);

      this.atkText.setText(String(card.attack ?? 0));
      this.vidText.setText(String(card.health ?? 0));

      this.statsGraphics.clear();

      // Icono ATQ (Triángulo)
      this.statsGraphics.fillStyle(COLOR_ATK, 1);
      this.statsGraphics.fillTriangle(16, 182, 24, 168, 32, 182);

      // Icono VID (Corazón simplificado)
      this.statsGraphics.fillStyle(COLOR_VID, 1);
      this.statsGraphics.fillCircle(80, 172, 4);
      this.statsGraphics.fillCircle(88, 172, 4);
      this.statsGraphics.fillTriangle(76, 174, 92, 174, 84, 184);
    } else {
      this.statsGraphics.setVisible(false);
      this.atkText.setVisible(false);
      this.vidText.setVisible(false);
    }
  }

  private buildPortrait(card: CardData): void {
    if (this.portraitContainer) {
      this.portraitContainer.destroy();
    }

    this.portraitContainer = this.scene.add.container(0, 0);

    if (this.scene.textures.exists(card.spriteKey)) {
      const img = this.scene.add.image(16 + 40, 16 + 40, card.spriteKey);
      img.setDisplaySize(80, 80);
      this.portraitContainer.add(img);
    } else {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(0x0d0b1e, 1); // bg-deep
      gfx.fillCircle(16 + 40, 16 + 40, 40);

      const initial = card.name ? card.name.charAt(0).toUpperCase() : "?";
      const txt = this.scene.add
        .text(16 + 40, 16 + 40, initial, {
          fontFamily: "Bangers",
          fontSize: "32px",
          color: COLOR_TEXT_PRI,
        })
        .setOrigin(0.5);

      this.portraitContainer.add([gfx, txt]);
    }

    this.add(this.portraitContainer);
  }

  /**
   * Posiciona el tooltip de forma inteligente respecto a la carta (coordenadas
   * de MUNDO). Si la carta está en la mitad inferior de la pantalla (mano del
   * jugador) el tooltip se muestra ENCIMA; si está arriba, debajo. Finalmente se
   * recorta (clamp) a los bordes visibles para que nunca quede cortado (Bug 7).
   *
   * @param x Centro horizontal de la carta (mundo).
   * @param y Centro vertical de la carta (mundo).
   * @param cardHeight Altura de la carta, para separar el tooltip de su borde.
   * @param tooltipHeight Altura del tooltip a posicionar.
   */
  private positionTooltip(x: number, y: number, cardHeight: number, tooltipHeight: number): void {
    const margin = 8;
    const screenW = this.scene.scale.width;
    const screenH = this.scene.scale.height;
    const halfCard = cardHeight / 2;

    let finalX = x - WIDTH / 2;

    // Encima si la carta está en la mitad inferior de la pantalla; debajo si no.
    const showAbove = y > screenH / 2;
    let finalY = showAbove ? y - halfCard - tooltipHeight - margin : y + halfCard + margin;

    // Clamp a los límites visibles de la pantalla en ambos ejes.
    finalX = Phaser.Math.Clamp(finalX, margin, screenW - WIDTH - margin);
    finalY = Phaser.Math.Clamp(finalY, margin, screenH - tooltipHeight - margin);

    this.setPosition(finalX, finalY);
  }

  override destroy(fromScene?: boolean): void {
    if (this.timer) {
      this.timer.destroy();
    }
    if (this.fadeTween) {
      this.fadeTween.stop();
    }
    super.destroy(fromScene);
  }
}
