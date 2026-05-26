import Phaser from "phaser";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export interface HeroData {
  id: string; // 'HERO-001' | 'HERO-002'
  name: string;
  maxHealth: number;
  heroPower: { name: string; cost: number };
  archetype: string; // para info de estilo
  textureKey: string; // clave Phaser de la textura del retrato
}

export interface HeroPortraitConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  heroData: HeroData;
  deckCardNames: Array<{ name: string; cost: number }>; // 10 cartas
  selected?: boolean; // default false
}

// ---------------------------------------------------------------------------
// Constantes de diseño (docs/05-ui-design.md)
// ---------------------------------------------------------------------------

const HERO_BORDER: Record<string, number> = {
  "HERO-001": 0x7b4fdb, // El Lich — arch-magic
  "HERO-002": 0xe83e3e, // Axel Blaze — arch-anime
};
const COLOR_BG_CARD = 0x1a1730;
const COLOR_TEXT_PRI = "#F0EAD6";
const COLOR_TEXT_SEC = "#9B96B0";
const COLOR_ACCENT_GOLD = "#F5C842";
const COLOR_TEAL = 0x3ecfcf;

const PANEL_WIDTH = 280;
const PANEL_HEIGHT = 640; // Ajustado a 640px para acomodar el contenido y coincidir con el total
const BORDER_RADIUS = 12;
const BORDER_WIDTH = 3;

// ---------------------------------------------------------------------------
// Clase HeroPortrait
// ---------------------------------------------------------------------------

export class HeroPortrait extends Phaser.GameObjects.Container {
  private _selected: boolean = false;
  private _glowTween: Phaser.Tweens.Tween | null = null;
  private glowGraphics: Phaser.GameObjects.Graphics;

  constructor(config: HeroPortraitConfig) {
    super(config.scene, config.x, config.y);

    this._selected = config.selected ?? false;
    const heroData = config.heroData;

    // --- Overlay de selección (Glow) ---
    this.glowGraphics = config.scene.add.graphics();
    this.glowGraphics.lineStyle(4, COLOR_TEAL, 1);
    this.glowGraphics.strokeRoundedRect(
      -PANEL_WIDTH / 2 - 2,
      -PANEL_HEIGHT / 2 - 2,
      PANEL_WIDTH + 4,
      PANEL_HEIGHT + 4,
      BORDER_RADIUS + 2,
    );
    this.glowGraphics.setAlpha(0);
    this.add(this.glowGraphics);

    // --- Marco / panel de fondo ---
    const panel = config.scene.add.graphics();
    const borderColor = HERO_BORDER[heroData.id] || 0xffffff;

    panel.lineStyle(BORDER_WIDTH, borderColor, 1);
    panel.fillStyle(COLOR_BG_CARD, 1);
    panel.fillRoundedRect(
      -PANEL_WIDTH / 2,
      -PANEL_HEIGHT / 2,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      BORDER_RADIUS,
    );
    panel.strokeRoundedRect(
      -PANEL_WIDTH / 2,
      -PANEL_HEIGHT / 2,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      BORDER_RADIUS,
    );
    this.add(panel);

    // --- Retrato ---
    const portraitY = -120;
    if (config.scene.textures.exists(heroData.textureKey)) {
      const portrait = config.scene.add
        .image(0, portraitY, heroData.textureKey)
        .setDisplaySize(240, 300);
      this.add(portrait);
    } else {
      const placeholder = config.scene.add.graphics();
      placeholder.fillStyle(0x252240, 1);
      placeholder.fillRect(-120, portraitY - 150, 240, 300);
      const placeholderText = config.scene.add
        .text(0, portraitY, heroData.name, {
          fontFamily: "Bangers, system-ui",
          fontSize: "24px",
          color: COLOR_TEXT_PRI,
        })
        .setOrigin(0.5);
      this.add([placeholder, placeholderText]);
    }

    // --- Nombre del héroe ---
    const nameY = 60;
    const nameText = config.scene.add
      .text(0, nameY, heroData.name, {
        fontFamily: "Bangers, system-ui",
        fontSize: "28px",
        color: COLOR_TEXT_PRI,
      })
      .setOrigin(0.5);
    this.add(nameText);

    // --- Stats breves ---
    const statsY = nameY + 30;
    const healthText = config.scene.add
      .text(0, statsY, `❤ ${heroData.maxHealth} PV`, {
        fontFamily: "Nunito, system-ui",
        fontSize: "14px",
        color: COLOR_TEXT_SEC,
      })
      .setOrigin(0.5);
    const powerText = config.scene.add
      .text(0, statsY + 20, `⚡ ${heroData.heroPower.name} (coste ${heroData.heroPower.cost})`, {
        fontFamily: "Nunito, system-ui",
        fontSize: "14px",
        color: COLOR_TEXT_SEC,
      })
      .setOrigin(0.5);
    this.add([healthText, powerText]);

    // --- Lista de cartas del mazo ---
    const deckStartY = statsY + 50;
    const deckHeader = config.scene.add
      .text(0, deckStartY, "— MAZO —", {
        fontFamily: "Nunito, system-ui",
        fontSize: "12px",
        color: COLOR_ACCENT_GOLD,
      })
      .setOrigin(0.5);
    this.add(deckHeader);

    for (let i = 0; i < Math.min(10, config.deckCardNames.length); i++) {
      const card = config.deckCardNames[i];
      const cardText = config.scene.add
        .text(0, deckStartY + 20 + i * 16, `${i + 1}. ${card.name} (${card.cost})`, {
          fontFamily: "Nunito, system-ui",
          fontSize: "13px",
          color: COLOR_TEXT_SEC,
        })
        .setOrigin(0.5);
      this.add(cardText);
    }

    // --- Interactividad ---
    this.setSize(PANEL_WIDTH, PANEL_HEIGHT);
    this.setInteractive({ useHandCursor: true });

    this.on("pointerover", () => {
      config.scene.tweens.add({
        targets: this,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 100,
      });
    });

    this.on("pointerout", () => {
      config.scene.tweens.add({
        targets: this,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 100,
      });
    });

    // --- Estado inicial ---
    if (this._selected) {
      this.select();
    } else {
      this.deselect();
    }

    // Registrar en la escena
    config.scene.add.existing(this);
  }

  // -------------------------------------------------------------------------
  // Métodos públicos
  // -------------------------------------------------------------------------

  /** Activa glow teal pulsante y pone alpha al 100% */
  public select(): void {
    this._selected = true;
    this.setAlpha(1);

    if (this._glowTween) {
      this._glowTween.stop();
    }

    this.glowGraphics.setAlpha(1);
    this._glowTween = this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /** Cancela el glow y atenúa el contenedor */
  public deselect(): void {
    this._selected = false;
    this.setAlpha(0.6);

    if (this._glowTween) {
      this._glowTween.stop();
      this._glowTween = null;
    }
    this.glowGraphics.setAlpha(0);
  }

  /** Devuelve si el héroe está seleccionado actualmente */
  public isSelected(): boolean {
    return this._selected;
  }
}
