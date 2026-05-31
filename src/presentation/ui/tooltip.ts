import Phaser from "phaser";
import type { CardData } from "@presentation/objects/card-sprite";
import { CardType } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const MIN_WIDTH = 280;
const MAX_WIDTH = 360;

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
      wordWrap: { width: MAX_WIDTH - 108 - 16, useAdvancedWrap: true },
    });
    this.typeText = scene.add.text(108, 48, "", {
      fontFamily: "Nunito",
      fontSize: "12px",
      color: COLOR_TEXT_SEC,
      fontStyle: "bold",
      wordWrap: { width: MAX_WIDTH - 108 - 16, useAdvancedWrap: true },
    });
    this.rarityText = scene.add.text(108, 64, "", {
      fontFamily: "Nunito",
      fontSize: "12px",
      color: COLOR_TEXT_SEC,
      wordWrap: { width: MAX_WIDTH - 108 - 16, useAdvancedWrap: true },
    });
    this.costText = scene.add.text(108, 80, "", {
      fontFamily: "Nunito",
      fontSize: "12px",
      color: COLOR_TEXT_GOLD,
      wordWrap: { width: MAX_WIDTH - 108 - 16, useAdvancedWrap: true },
    });
    this.descText = scene.add.text(16, 110, "", {
      fontFamily: "Nunito",
      fontSize: "12px",
      color: COLOR_TEXT_PRI,
      wordWrap: { width: MAX_WIDTH - 32, useAdvancedWrap: true },
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

      const { width, height } = this.buildContent(card, isCharacter);
      this.positionTooltip(x, y, cardHeight, width, height);

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

  private buildContent(card: CardData, isCharacter: boolean): { width: number; height: number } {
    this.nameText.setText(card.name);
    let currentY = 16;
    this.nameText.setY(currentY);
    currentY += this.nameText.height + 4;

    const formattedArchetype = card.archetype.replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase();
    this.typeText.setText(`${card.type.toUpperCase()} - ${formattedArchetype}`);
    this.typeText.setY(currentY);
    currentY += this.typeText.height + 4;

    this.rarityText.setText(`Rareza: ${card.rarity}`);
    this.rarityText.setY(currentY);
    currentY += this.rarityText.height + 4;

    this.costText.setText(`Coste Nostalgia: ${card.nostalgyCost}`);
    this.costText.setY(currentY);
    currentY += this.costText.height + 16;

    // El texto descriptivo debe ir al menos debajo de la imagen (aprox Y=110)
    const descY = Math.max(110, currentY);
    this.descText.setY(descY);
    this.descText.setText(card.description);

    // Medida real
    const maxTextWidth = Math.max(
      108 + this.nameText.width,
      108 + this.typeText.width,
      108 + this.rarityText.width,
      108 + this.costText.width,
      16 + this.descText.width,
    );
    const finalWidth = Phaser.Math.Clamp(maxTextWidth + 16, MIN_WIDTH, MAX_WIDTH);

    const descBottom = descY + (card.description ? this.descText.height : 0);
    let finalHeight = descBottom + 16;

    if (isCharacter) {
      this.statsGraphics.setVisible(true);
      this.atkText.setVisible(true);
      this.vidText.setVisible(true);

      this.atkText.setText(String(card.attack ?? 0));
      this.vidText.setText(String(card.health ?? 0));

      const statsY = descBottom + 12;

      this.statsGraphics.clear();

      // Icono ATQ (Triángulo)
      this.statsGraphics.fillStyle(COLOR_ATK, 1);
      this.statsGraphics.fillTriangle(16, statsY + 14, 24, statsY, 32, statsY + 14);

      // Icono VID (Corazón simplificado)
      this.statsGraphics.fillStyle(COLOR_VID, 1);
      this.statsGraphics.fillCircle(80, statsY + 4, 4);
      this.statsGraphics.fillCircle(88, statsY + 4, 4);
      this.statsGraphics.fillTriangle(76, statsY + 6, 92, statsY + 6, 84, statsY + 16);

      this.atkText.setPosition(40, statsY - 2);
      this.vidText.setPosition(100, statsY - 2);

      finalHeight = statsY + 24 + 16;
    } else {
      this.statsGraphics.setVisible(false);
      this.atkText.setVisible(false);
      this.vidText.setVisible(false);
    }

    const rarityColor = RARITY_COLORS[card.rarity] || 0x8c9099;

    this.bgGraphics.clear();
    this.bgGraphics.fillStyle(COLOR_BG, 1);
    this.bgGraphics.fillRoundedRect(0, 0, finalWidth, finalHeight, 8);
    this.bgGraphics.lineStyle(2, rarityColor, 1);
    this.bgGraphics.strokeRoundedRect(0, 0, finalWidth, finalHeight, 8);

    this.buildPortrait(card);

    return { width: finalWidth, height: finalHeight };
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
   * @param tooltipWidth Anchura dinámica del tooltip.
   * @param tooltipHeight Altura dinámica del tooltip.
   */
  private positionTooltip(
    x: number,
    y: number,
    cardHeight: number,
    tooltipWidth: number,
    tooltipHeight: number,
  ): void {
    const margin = 8;
    const screenW = this.scene.scale.width;
    const screenH = this.scene.scale.height;
    const halfCard = cardHeight / 2;

    let finalX = x - tooltipWidth / 2;

    // Encima si la carta está en la mitad inferior de la pantalla; debajo si no.
    const showAbove = y > screenH / 2;
    let finalY = showAbove ? y - halfCard - tooltipHeight - margin : y + halfCard + margin;

    // Clamp horizontal a los límites visibles de la pantalla.
    finalX = Phaser.Math.Clamp(finalX, margin, screenW - tooltipWidth - margin);

    // Si choca por arriba al intentar ponerlo encima, forzar abajo
    if (showAbove && finalY < margin) {
      finalY = y + halfCard + margin;
    }
    // Si choca por abajo al intentar ponerlo debajo, forzar arriba
    else if (!showAbove && finalY + tooltipHeight > screenH - margin) {
      finalY = y - halfCard - tooltipHeight - margin;
    }

    // Clamp vertical final de seguridad.
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
