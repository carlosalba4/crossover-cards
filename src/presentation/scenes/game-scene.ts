import Phaser from "phaser";
import { BoardView } from "@presentation/objects/board-view";
import { HandView } from "@presentation/objects/hand-view";
import { HeroView } from "@presentation/objects/hero-view";
import { HUDOverlay } from "@presentation/ui/hud-overlay";
import { TurnIndicator } from "@presentation/ui/turn-indicator";
import { ZoneBanner } from "@presentation/ui/zone-banner";
import { Tooltip } from "@presentation/ui/tooltip";
import { Archetype, CardType, Rarity } from "@domain/types/card-types";

// Datos mock mínimos
const MOCK_HERO = {
  id: "HERO-001",
  name: "El Lich",
  spriteKey: "hero-el-lich",
  archetype: "AventuraMagica",
  maxHealth: 30,
  heroPower: { name: "Hechizo", cost: 2 },
};

const MOCK_CARD = {
  id: "LIC-001",
  spriteKey: "card-missing",
  name: "Pops el Gentil",
  type: CardType.Character,
  archetype: Archetype.CartoonClasico,
  rarity: Rarity.Rare,
  nostalgyCost: 2,
  attack: 1,
  health: 4,
  description: "Último Aliento",
};

export class GameScene extends Phaser.Scene {
  private heroId!: string;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: { heroId: string }): void {
    this.heroId = data.heroId || "HERO-001";
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0D0B1E");
    console.info("GameScene iniciada con heroId:", this.heroId);

    // BoardView — tablero central
    const board = new BoardView(this, 136, 0, 1648, 1080);
    this.add.existing(board);

    // HandView jugador — posicionado en zona inferior del tablero (y~950)
    const hand = new HandView(this, true);
    hand.setPosition(960, 950);
    for (let i = 0; i < 3; i++) {
      hand.addCard({ ...MOCK_CARD, id: `mock-hand-${i}` }, false);
    }
    this.add.existing(hand);

    // HeroView jugador en zona inferior izquierda del tablero
    const heroPlayer = new HeroView(this, MOCK_HERO, true);
    heroPlayer.setPosition(250, 850);
    heroPlayer.updateHealth(30, 30);
    this.add.existing(heroPlayer);

    // HeroView rival en zona superior izquierda
    const heroRival = new HeroView(this, { ...MOCK_HERO, name: "Axel Blaze" }, false);
    heroRival.setPosition(250, 200);
    heroRival.updateHealth(30, 30);
    this.add.existing(heroRival);

    // HUDOverlay izquierdo (x=0, ancho 120px)
    const hudLeft = new HUDOverlay(this, "left", 0, 100);
    hudLeft.addActionEntry("Partida iniciada");
    this.add.existing(hudLeft);

    // HUDOverlay derecho (x=1800, ancho 120px)
    const hudRight = new HUDOverlay(this, "right", 1800, 100);
    hudRight.updateNostalgia(3, 5);
    hudRight.updateDeck(27);
    this.add.existing(hudRight);

    // TurnIndicator visible en la parte superior del tablero central
    const turnIndicator = new TurnIndicator(this, 960, 40);
    turnIndicator.setPhase("Main", true);
    this.add.existing(turnIndicator);

    // ZoneBanner instanciado pero oculto
    const zoneBanner = new ZoneBanner(this, 960, 300);
    zoneBanner.setVisible(false);

    // Tooltip instanciado pero oculto
    const tooltip = new Tooltip(this);
    tooltip.setVisible(false);
  }
}
