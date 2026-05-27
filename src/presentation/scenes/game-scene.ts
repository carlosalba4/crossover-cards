import Phaser from "phaser";
import { BoardView, type BoardZoneId } from "@presentation/objects/board-view";
import { HandView } from "@presentation/objects/hand-view";
import { HeroView } from "@presentation/objects/hero-view";
import { HUDOverlay } from "@presentation/ui/hud-overlay";
import { TurnIndicator } from "@presentation/ui/turn-indicator";
import { ZoneBanner } from "@presentation/ui/zone-banner";
import { Tooltip } from "@presentation/ui/tooltip";
import { Toast } from "@presentation/ui/toast";

import { MatchService } from "@application/services/match-service";
import { DeckService } from "@application/services/deck-service";
import { JsonDeckRepository } from "@infrastructure/repositories/json-deck-repository";
import { JsonCardRepository } from "@infrastructure/repositories/json-card-repository";
import { JsonHeroRepository } from "@infrastructure/repositories/json-hero-repository";
import { GameEventBus } from "@infrastructure/events/game-event-bus";
import { GameEvent } from "@domain/events/game-event";
import type { Unsubscribe, IEventBus } from "@domain/events/event-bus";

export class GameScene extends Phaser.Scene {
  private heroId!: string;
  private unsubscribers: Array<Unsubscribe> = [];

  private eventBus!: IEventBus;
  private matchService!: MatchService;

  private board!: BoardView;
  private handPlayer!: HandView;
  private handRival!: HandView;
  private heroPlayer!: HeroView;
  private heroRival!: HeroView;
  private hudLeft!: HUDOverlay;
  private hudRight!: HUDOverlay;
  private turnIndicator!: TurnIndicator;
  private zoneBanner!: ZoneBanner;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: { heroId?: string }): void {
    this.heroId = data.heroId || "HERO-001";
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0D0B1E");
    console.info("GameScene iniciada con heroId:", this.heroId);

    // 1. Inicializar EventBus y Servicios
    this.eventBus = GameEventBus.getInstance();

    const deckRepo = new JsonDeckRepository();
    const cardRepo = new JsonCardRepository();
    const heroRepo = new JsonHeroRepository();
    const deckService = new DeckService(deckRepo, cardRepo);

    this.matchService = new MatchService(deckService, deckRepo, heroRepo, this.eventBus);

    // 2. Construir UI
    this.board = new BoardView(this, 136, 0, 1648, 1080);

    this.handPlayer = new HandView(this, true);
    this.handPlayer.setPosition(960, 950);

    this.handRival = new HandView(this, false);
    this.handRival.setPosition(960, -50); // Abanico invertido en la parte superior

    // Mocks iniciales que serán actualizados por eventos
    this.heroPlayer = new HeroView(
      this,
      {
        id: "p1-hero",
        name: "Cargando...",
        spriteKey: "hero-el-lich",
        archetype: "Neutral",
        maxHealth: 30,
        heroPower: { name: "?", cost: 0 },
      },
      true,
    );
    this.heroPlayer.setPosition(250, 850);

    this.heroRival = new HeroView(
      this,
      {
        id: "p2-hero",
        name: "Cargando...",
        spriteKey: "hero-axel-blaze",
        archetype: "Neutral",
        maxHealth: 30,
        heroPower: { name: "?", cost: 0 },
      },
      false,
    );
    this.heroRival.setPosition(250, 200);

    this.hudLeft = new HUDOverlay(this, "left", 0, 100);
    this.hudRight = new HUDOverlay(this, "right", 1800, 100);
    this.turnIndicator = new TurnIndicator(this, 960, 40);

    this.zoneBanner = new ZoneBanner(this, 960, 300);
    const tooltip = new Tooltip(this);
    tooltip.setVisible(false);

    // 3. Suscribir Handlers
    this.unsubscribers = [];
    this.setupEventHandlers();

    // 4. Iniciar Partida
    // Convertir heroId → deckId buscando en el repositorio el mazo asociado.
    deckRepo
      .getAll()
      .then((allDecks) => {
        const playerDeck = allDecks.find((d) => d.heroId === this.heroId);
        const opponentDeck = allDecks.find((d) => d.heroId !== this.heroId);

        if (!playerDeck || !opponentDeck) {
          console.error("No se encontraron mazos para los héroes");
          return null;
        }

        return this.matchService.initMatch(playerDeck.id, opponentDeck.id);
      })
      .then((match) => {
        if (!match) return;
        // Al arrancar, poblar la mano y héroes reales
        const p1 = match.player1;
        const p2 = match.player2;

        // Mapeo de heroId a spriteKey (los staticId del dominio no coinciden con los archivos)
        const heroSpriteKeys: Record<string, string> = {
          "HERO-001": "hero-el-lich",
          "HERO-002": "hero-axel-blaze",
        };
        this.heroPlayer.destroy();
        this.heroPlayer = new HeroView(
          this,
          {
            id: p1.hero.staticId,
            name: p1.hero.name,
            spriteKey: heroSpriteKeys[p1.hero.staticId] ?? "hero-el-lich",
            archetype: p1.hero.archetype,
            maxHealth: p1.hero.maxHealth,
            heroPower: { name: p1.hero.heroPower.name, cost: p1.hero.heroPower.nostalgyCost },
          },
          true,
        );
        this.heroPlayer.setPosition(250, 850);
        this.heroPlayer.updateHealth(p1.hero.currentHealth, p1.hero.maxHealth);

        this.heroRival.destroy();
        this.heroRival = new HeroView(
          this,
          {
            id: p2.hero.staticId,
            name: p2.hero.name,
            spriteKey: heroSpriteKeys[p2.hero.staticId] ?? "hero-axel-blaze",
            archetype: p2.hero.archetype,
            maxHealth: p2.hero.maxHealth,
            heroPower: { name: p2.hero.heroPower.name, cost: p2.hero.heroPower.nostalgyCost },
          },
          false,
        );
        this.heroRival.setPosition(250, 200);
        this.heroRival.updateHealth(p2.hero.currentHealth, p2.hero.maxHealth);

        p1.hand.getCards().forEach((c) => {
          this.handPlayer.addCard(
            {
              id: c.instanceId,
              spriteKey: c.spriteKey,
              name: c.name,
              type: c.type,
              archetype: c.archetype,
              rarity: c.rarity,
              nostalgyCost: c.nostalgyCost,
              attack: "attack" in c ? (c as { attack?: number }).attack : undefined,
              health:
                "currentHealth" in c ? (c as { currentHealth?: number }).currentHealth : undefined,
              description: c.description,
            },
            false,
          );
        });

        p2.hand.getCards().forEach((c) => {
          this.handRival.addCard(
            {
              id: c.instanceId,
              spriteKey: c.spriteKey,
              name: c.name,
              type: c.type,
              archetype: c.archetype,
              rarity: c.rarity,
              nostalgyCost: c.nostalgyCost,
              attack: "attack" in c ? (c as { attack?: number }).attack : undefined,
              health:
                "currentHealth" in c ? (c as { currentHealth?: number }).currentHealth : undefined,
              description: c.description,
            },
            false,
          );
        });
      })
      .catch((err) => {
        console.error("Error inicializando partida:", err);
      });
  }

  private setupEventHandlers(): void {
    // 1. CardPlayed
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.CardPlayed, (payload) => {
        if (!payload.cardId) return;
        const isPlayer = payload.playerId === "p1";
        const hand = isPlayer ? this.handPlayer : this.handRival;

        hand.removeCard(payload.cardId, true);

        const match = this.matchService.getCurrentMatch();
        if (match && payload.zoneId) {
          const player = isPlayer ? match.player1 : match.player2;
          const zoneKey = payload.zoneId as "left" | "center" | "right";
          const zone = player.board[zoneKey];
          const character = zone?.find((c) => c.instanceId === payload.cardId);
          if (character) {
            this.board.addCharacterSprite(character, payload.zoneId as BoardZoneId, isPlayer);
          }
        }
      }),
    );

    // 2. CharacterSummoned
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.CharacterSummoned, (payload) => {
        if (!payload.character || !payload.zoneId) return;
        const isPlayer = payload.playerId === "p1";
        this.board.addCharacterSprite(payload.character, payload.zoneId as BoardZoneId, isPlayer);
      }),
    );

    // 3. CharacterDestroyed
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.CharacterDestroyed, (payload) => {
        if (!payload.character) return;
        this.board.removeCharacterSprite(payload.character.instanceId, true);
      }),
    );

    // 4. AttackDeclared
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.AttackDeclared, (payload) => {
        if (!payload.attackerId) return;
        this.board.highlightValidTargets([payload.attackerId]);
      }),
    );

    // 5. AttackResolved
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.AttackResolved, (payload) => {
        this.board.clearHighlights();
        if (payload.attackerId && payload.defenderId) {
          this.board.playAttackAnimation(payload.attackerId, payload.defenderId);
        }
      }),
    );

    // 6. HeroDamaged
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.HeroDamaged, (payload) => {
        const isPlayer = payload.playerId === "p1";
        const hero = isPlayer ? this.heroPlayer : this.heroRival;
        const maxHealth = isPlayer
          ? this.matchService.getCurrentMatch()?.player1.hero.maxHealth || 30
          : this.matchService.getCurrentMatch()?.player2.hero.maxHealth || 30;

        hero.updateHealth(payload.currentHealth, maxHealth);

        // Shake animation
        this.tweens.add({
          targets: hero,
          x: hero.x + 8,
          yoyo: true,
          repeat: 3,
          duration: 50,
        });
      }),
    );

    // 7. HeroHealed
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.HeroHealed, (payload) => {
        const isPlayer = payload.playerId === "p1";
        const hero = isPlayer ? this.heroPlayer : this.heroRival;
        const maxHealth = isPlayer
          ? this.matchService.getCurrentMatch()?.player1.hero.maxHealth || 30
          : this.matchService.getCurrentMatch()?.player2.hero.maxHealth || 30;

        hero.updateHealth(payload.currentHealth, maxHealth);
      }),
    );

    // 8. TurnStarted
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.TurnStarted, (payload) => {
        const isPlayer = payload.playerId === "p1";
        this.heroPlayer.setActiveTurn(isPlayer);
        this.heroRival.setActiveTurn(!isPlayer);
        this.turnIndicator.setPhase("Draw", isPlayer);
        this.hudRight.setEndTurnEnabled(isPlayer);
        this.handPlayer.setEnabled(isPlayer);
      }),
    );

    // 9. PhaseChanged
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.PhaseChanged, (payload) => {
        const isPlayer = payload.playerId === "p1";
        const phaseMap: Record<string, "Draw" | "Main" | "Combat" | "End"> = {
          draw: "Draw",
          main: "Main",
          combat: "Combat",
          end: "End",
        };
        this.turnIndicator.setPhase(phaseMap[payload.newPhase] || "Main", isPlayer);
      }),
    );

    // 10. TurnEnded
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.TurnEnded, () => {
        // Nada visual requerido específicamente aquí en esta iteración
      }),
    );

    // 11. NostalgiaChanged
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.NostalgiaChanged, (payload) => {
        const isPlayer = payload.playerId === "p1";
        if (isPlayer) {
          this.hudRight.updateNostalgia(payload.current, payload.max);
        }
      }),
    );

    // 12. MomentumChanged
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.MomentumChanged, (payload) => {
        const isPlayer = payload.playerId === "p1";
        if (isPlayer) {
          this.hudRight.updateMomentum(payload.momentum, payload.isActive);
        }
      }),
    );

    // 13. ZoneEnvironmentChanged
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.ZoneEnvironmentChanged, (payload) => {
        if (!payload.zoneId || !payload.newEnv) return;
        const envName = payload.newEnv === "forest" ? "Bosque" : payload.newEnv;
        const envColor = 0x3ecfcf; // Color por defecto si no tenemos mapa de entornos

        this.board.setZoneEnvironment(payload.zoneId as "left" | "center" | "right", {
          iconKey: "env-icon",
          name: envName,
          color: envColor,
        });
        this.zoneBanner.show(payload.zoneId.toUpperCase(), envName, envColor);
      }),
    );

    // 14. QuestProgressUpdated
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.QuestProgressUpdated, (payload) => {
        const isPlayer = payload.playerId === "p1";
        if (isPlayer && payload.questId) {
          this.hudLeft.setActiveQuest({
            name: "Progreso de Misión",
            current: payload.current,
            target: payload.target,
          });
        }
      }),
    );

    // 15. QuestCompleted
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.QuestCompleted, () => {
        Toast.show(this, "¡Misión completada!", "ok");
      }),
    );

    // 16. CrossoverActivated
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.CrossoverActivated, (payload) => {
        const isPlayer = payload.playerId === "p1";
        if (isPlayer) {
          this.hudRight.setCrossoverUsed(true);
        }
        Toast.show(this, "¡Crossover Activado!", "ok");
      }),
    );

    // 17. DeckEmpty
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.DeckEmpty, (payload) => {
        const isPlayer = payload.playerId === "p1";
        if (isPlayer) {
          this.hudRight.updateDeck(0);
        }
        Toast.show(this, "¡Fatiga activa!", "damage");
      }),
    );

    // 18. MatchEnded
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.MatchEnded, (payload) => {
        this.time.delayedCall(1500, () => {
          this.scene.start("EndScene", { result: payload.winnerId === "p1" ? "win" : "loss" });
        });
      }),
    );

    // 19. SpellCast
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.SpellCast, (payload) => {
        if (!payload.spell) return;
        Toast.show(this, payload.spell.name, "ok");
      }),
    );
  }

  shutdown(): void {
    // Desuscribir todos los handlers para evitar memory leaks
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
  }
}
