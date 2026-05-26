import Phaser from "phaser";

import { Button } from "@presentation/ui/button";
import type { HeroData as UIPortraitData } from "@presentation/ui/hero-portrait";
import { HeroPortrait } from "@presentation/ui/hero-portrait";
import { JsonHeroRepository } from "@infrastructure/repositories/json-hero-repository";
import { JsonDeckRepository } from "@infrastructure/repositories/json-deck-repository";
import { JsonCardRepository } from "@infrastructure/repositories/json-card-repository";

// ---------------------------------------------------------------------------
// Interfaces locales
// ---------------------------------------------------------------------------

interface IDomainDeckData {
  id: string;
  name: string;
  heroId: string;
  cards: { cardId: string; quantity: number }[];
}

interface IDomainHeroData {
  id: string;
  name: string;
  archetype: string;
  maxHealth: number;
  heroPower: {
    name: string;
    cost: number;
    effectType: string;
    targetType: string;
    value: number;
  };
}

interface DeckCardInfo {
  name: string;
  cost: number;
}

interface HeroDataBundle {
  hero: IDomainHeroData;
  cards: DeckCardInfo[];
}

interface SelectionData {
  hero1: HeroDataBundle;
  hero2: HeroDataBundle;
}

// ---------------------------------------------------------------------------
// Clase HeroSelectScene
// ---------------------------------------------------------------------------

export class HeroSelectScene extends Phaser.Scene {
  private _heroRepo = new JsonHeroRepository();
  private _deckRepo = new JsonDeckRepository();
  private _cardRepo = new JsonCardRepository();

  private _selectedHeroId: string | null = null;
  private _portraits: HeroPortrait[] = [];
  private _startButton!: Button;

  constructor() {
    super({ key: "HeroSelectScene" });
  }

  // -------------------------------------------------------------------------
  // create — setup de UI base y carga asíncrona
  // -------------------------------------------------------------------------

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this._selectedHeroId = null;
    this._portraits = [];

    // --- Fondo ---
    if (this.textures.exists("bg-hero-select")) {
      this.add.image(cx, cy, "bg-hero-select").setDisplaySize(width, height);
    } else {
      this.add.rectangle(cx, cy, width, height, 0x0d0b1e);
    }

    // --- UI Superior ---
    this.add
      .text(cx, 60, "Elige tu Héroe", {
        fontFamily: "Bangers, system-ui",
        fontSize: "40px",
        color: "#F5C842",
      })
      .setOrigin(0.5);

    new Button({
      scene: this,
      x: 120,
      y: 60,
      width: 160,
      height: 48,
      label: "< VOLVER",
      backgroundColor: 0x252240, // bg-surface
      textColor: "#F0EAD6",
      fontFamily: "Nunito, system-ui",
      fontSize: "20px",
      onClick: () => this.goBack(),
    });

    // --- Botón Iniciar Partida ---
    this._startButton = new Button({
      scene: this,
      x: cx,
      y: height - 80,
      width: 320,
      height: 64,
      label: "INICIAR PARTIDA",
      backgroundColor: 0x3ecfcf, // accent-teal
      textColor: "#0D0B1E",
      fontSize: "28px",
      disabled: true,
      onClick: () => this.startGame(),
    });

    // --- Mensaje de carga ---
    const loadingText = this.add
      .text(cx, cy, "Cargando datos...", {
        fontFamily: "Nunito, system-ui",
        fontSize: "24px",
        color: "#9B96B0",
      })
      .setOrigin(0.5);

    // --- Carga asíncrona ---
    this.loadData()
      .then((data) => {
        loadingText.destroy();
        this.buildHeroPanels(cx, cy, data);
      })
      .catch((err) => {
        console.error("Error cargando datos de héroes:", err);
        loadingText.setText("Error al cargar héroes.");
        loadingText.setColor("#E83E3E");
      });
  }

  // -------------------------------------------------------------------------
  // Métodos privados — Datos
  // -------------------------------------------------------------------------

  private async loadData(): Promise<SelectionData> {
    const hero1 = await this._heroRepo.getById("HERO-001");
    const deck1 = await this._deckRepo.getById("DECK-001");

    const hero2 = await this._heroRepo.getById("HERO-002");
    const deck2 = await this._deckRepo.getById("DECK-002");

    if (!hero1 || !deck1 || !hero2 || !deck2) {
      throw new Error("No se encontraron los héroes o mazos base.");
    }

    const mapDeckCards = async (deck: IDomainDeckData): Promise<DeckCardInfo[]> => {
      const cards: DeckCardInfo[] = [];
      for (const item of deck.cards) {
        const cardData = await this._cardRepo.getById(item.cardId);
        if (cardData) {
          // Extraemos nombre y coste. Aunque el mazo tenga N copias (item.quantity),
          // para el resumen visual mostraremos tipos únicos de cartas como pide la UI,
          // o podemos repetir. El requerimiento indica "10 cartas". Por lo que se
          // interpretará como 1 entrada por tipo para resumen o 1 por copia,
          // tomaremos todas las copias hasta llegar a 10.
          for (let i = 0; i < item.quantity; i++) {
            cards.push({ name: cardData.name, cost: cardData.nostalgyCost });
          }
        }
      }
      return cards;
    };

    return {
      hero1: {
        hero: hero1,
        cards: await mapDeckCards(deck1),
      },
      hero2: {
        hero: hero2,
        cards: await mapDeckCards(deck2),
      },
    };
  }

  // -------------------------------------------------------------------------
  // Métodos privados — UI
  // -------------------------------------------------------------------------

  private buildHeroPanels(cx: number, cy: number, data: SelectionData): void {
    const mapHeroData = (hero: IDomainHeroData, textureKey: string): UIPortraitData => ({
      id: hero.id,
      name: hero.name,
      maxHealth: hero.maxHealth,
      heroPower: { name: hero.heroPower.name, cost: hero.heroPower.cost },
      archetype: hero.archetype,
      textureKey,
    });

    const p1 = new HeroPortrait({
      scene: this,
      x: cx - 200,
      y: cy + 20,
      heroData: mapHeroData(data.hero1.hero, "hero-el-lich"),
      deckCardNames: data.hero1.cards,
    });

    const p2 = new HeroPortrait({
      scene: this,
      x: cx + 200,
      y: cy + 20,
      heroData: mapHeroData(data.hero2.hero, "hero-axel-blaze"),
      deckCardNames: data.hero2.cards,
    });

    this._portraits = [p1, p2];

    p1.on("pointerdown", () => this.selectHero(p1, data.hero1.hero.id));
    p2.on("pointerdown", () => this.selectHero(p2, data.hero2.hero.id));
  }

  private selectHero(selectedPortrait: HeroPortrait, heroId: string): void {
    for (const portrait of this._portraits) {
      if (portrait === selectedPortrait) {
        portrait.select();
      } else {
        portrait.deselect();
      }
    }

    this._selectedHeroId = heroId;
    this._startButton.setDisabled(false);
  }

  // -------------------------------------------------------------------------
  // Lógica de navegación
  // -------------------------------------------------------------------------

  private goBack(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("MenuScene");
    });
  }

  private startGame(): void {
    if (!this._selectedHeroId) return;

    console.info("Héroe seleccionado:", this._selectedHeroId);
    // La transición a GameScene será implementada en IMPL-F
  }
}
