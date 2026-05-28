import Phaser from "phaser";
import { BoardView, type BoardZoneId } from "@presentation/objects/board-view";
import { HandView } from "@presentation/objects/hand-view";
import { HeroView } from "@presentation/objects/hero-view";
import { HUDOverlay } from "@presentation/ui/hud-overlay";
import { TurnIndicator } from "@presentation/ui/turn-indicator";
import { ZoneBanner } from "@presentation/ui/zone-banner";
import { Tooltip } from "@presentation/ui/tooltip";
import { Toast } from "@presentation/ui/toast";
import { Modal } from "@presentation/ui/modal";
import { Button } from "@presentation/ui/button";
import { CardSprite } from "@presentation/objects/card-sprite";
import type { GameAction } from "@application/types/game-action";

import { MatchService } from "@application/services/match-service";
import { DeckService } from "@application/services/deck-service";
import { JsonDeckRepository } from "@infrastructure/repositories/json-deck-repository";
import { JsonCardRepository } from "@infrastructure/repositories/json-card-repository";
import { JsonHeroRepository } from "@infrastructure/repositories/json-hero-repository";
import { GameEventBus } from "@infrastructure/events/game-event-bus";
import { GameEvent } from "@domain/events/game-event";
import type { Unsubscribe, IEventBus } from "@domain/events/event-bus";
import { OpponentService } from "@application/services/opponent-service";
import { GreedyAI } from "@domain/ai/greedy-ai";

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

  private currentPhase: string = "main";
  private isPlayerTurn: boolean = false;
  private selectedAttacker: string | null = null;
  private attackerGlow: Phaser.GameObjects.Graphics | null = null;
  private targetSelectionMode: "heroPower" | null = null;
  private dragHighlight: Phaser.GameObjects.Graphics | null = null;

  private opponentService!: OpponentService;
  private aiOverlay?: Phaser.GameObjects.Rectangle;
  private rivalTurnText!: Phaser.GameObjects.Text;

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
    this.opponentService = new OpponentService(new GreedyAI());

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

    this.rivalTurnText = this.add
      .text(960, 40, "TURNO RIVAL", {
        fontFamily: "Bangers",
        fontSize: "24px",
        color: "#FF3B3B",
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(100);

    this.setupUIInteractions();

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
          const sprite = this.handPlayer.list[this.handPlayer.list.length - 1];
          if (sprite instanceof CardSprite) {
            this.makeHandCardDraggable(sprite, c.instanceId);
          }
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
        const sprite = this.board.list
          .slice()
          .reverse()
          .find((child) => child instanceof CardSprite);
        if (sprite instanceof CardSprite) {
          this.makeBoardCharacterClickable(sprite, payload.character.instanceId, isPlayer);
        }
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
        this.isPlayerTurn = isPlayer;
        this.currentPhase = payload.phase;

        if (!isPlayer) {
          this.clearAttackerSelection();
          this.targetSelectionMode = null;
          this.board.clearHighlights();

          // Bloquear mano del jugador
          this.handPlayer.setEnabled(false);

          // Overlay semitransparente sutil sobre la mano
          if (!this.aiOverlay) {
            this.aiOverlay = this.add.rectangle(960, 950, 1920, 300, 0x000000, 0.4);
            this.aiOverlay.setDepth(50);
          }
          this.aiOverlay.setVisible(true);

          // Indicador visual
          this.turnIndicator.setVisible(false);
          this.rivalTurnText.setVisible(true);

          // Ejecutar IA con delay visual
          const match = this.matchService.getCurrentMatch();
          if (match) {
            const delayFn = (ms: number) => {
              return new Promise<void>((resolve) => {
                this.time.delayedCall(ms, resolve);
              });
            };
            this.opponentService
              .executeTurn(match, payload.playerId, this.matchService, delayFn)
              .catch((e) => console.error(e));
          }
        } else {
          // Desbloquear mano y limpiar overlay
          this.handPlayer.setEnabled(true);
          if (this.aiOverlay) this.aiOverlay.setVisible(false);

          // Indicador visual normal
          this.turnIndicator.setVisible(true);
          this.rivalTurnText.setVisible(false);
          this.turnIndicator.setPhase("Draw", isPlayer);
        }

        this.heroPlayer.setActiveTurn(isPlayer);
        this.heroRival.setActiveTurn(!isPlayer);
        this.hudRight.setEndTurnEnabled(isPlayer);
      }),
    );

    // 9. PhaseChanged
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.PhaseChanged, (payload) => {
        const isPlayer = payload.playerId === "p1";
        this.currentPhase = payload.newPhase;
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
      this.eventBus.on(GameEvent.TurnEnded, (payload) => {
        const isPlayer = payload.playerId === "p1";
        if (!isPlayer) {
          this.handPlayer.setEnabled(true);
          if (this.aiOverlay) this.aiOverlay.setVisible(false);
        }
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

  private setupUIInteractions(): void {
    this.hudRight.on("endTurn", () => {
      if (!this.isPlayerTurn) {
        Toast.show(this, "No es tu turno", "warn");
        return;
      }
      // Validar con el estado local de la escena (más fiable que esperar match.currentPhase)
      if (this.currentPhase !== "main" && this.currentPhase !== "combat") {
        Toast.show(this, "Espera a que cargue la fase principal", "warn");
        return;
      }
      const result = this.matchService.handlePlayerAction({
        type: "END_TURN",
        playerId: "p1",
      });
      if (!result.success) {
        Toast.show(this, result.error?.message || "No puedes terminar el turno ahora", "warn");
      }
    });

    this.hudRight.on("crossover", () => {
      if (!this.isPlayerTurn) return;
      if (this.currentPhase !== "main") {
        Toast.show(this, "Crossover solo se puede usar en fase Main", "warn");
        return;
      }

      const modal = Modal.show(this, {
        title: "Crossover",
        body: "¿Quieres activar Crossover?\nRobarás una carta del mazo enemigo.",
        onClose: () => {
          if (btn) btn.destroy();
        },
      });

      const btn = new Button({
        scene: this,
        x: 960,
        y: 650,
        width: 140,
        height: 48,
        label: "CONFIRMAR",
        backgroundColor: 0x7b4fdb,
        textColor: "#ffffff",
        onClick: () => {
          btn.destroy();
          modal.destroy();
          const result = this.matchService.handlePlayerAction({
            type: "ACTIVATE_CROSSOVER",
            playerId: "p1",
          } as unknown as GameAction);
          if (!result.success) {
            Toast.show(this, result.error?.message || "Acción Crossover inválida", "warn");
          }
        },
      });
      btn.setDepth(1001);
      this.add.existing(btn);
    });

    this.heroPlayer.on("heroPowerClicked", () => {
      if (!this.isPlayerTurn) return;

      const match = this.matchService.getCurrentMatch();
      const heroPower = match?.player1.hero.heroPower;
      if (!heroPower) return;

      if (heroPower.targetType === "none" || !heroPower.targetType) {
        const result = this.matchService.handlePlayerAction({
          type: "USE_HERO_POWER",
          playerId: "p1",
        } as unknown as GameAction);
        if (!result.success) {
          Toast.show(this, result.error?.message || "No se pudo usar la habilidad", "warn");
        }
      } else {
        this.targetSelectionMode = "heroPower";
        Toast.show(this, "Selecciona un objetivo", "ok");
      }
    });

    this.heroRival.setSize(180, 100);
    this.heroRival.setInteractive({ useHandCursor: true });
    this.heroRival.on("pointerdown", () => {
      if (!this.isPlayerTurn) return;

      const p2StaticId = this.matchService.getCurrentMatch()?.player2.hero.staticId;
      if (!p2StaticId) return;

      if (this.targetSelectionMode === "heroPower") {
        const result = this.matchService.handlePlayerAction({
          type: "USE_HERO_POWER",
          playerId: "p1",
          targetId: p2StaticId,
        } as unknown as GameAction);
        if (!result.success) Toast.show(this, result.error?.message || "Objetivo inválido", "warn");
        this.targetSelectionMode = null;
        return;
      }

      if (this.currentPhase === "combat" && this.selectedAttacker) {
        const result = this.matchService.handlePlayerAction({
          type: "ATTACK",
          attackerId: this.selectedAttacker,
          defenderId: p2StaticId,
        });
        if (!result.success) {
          Toast.show(this, result.error?.message || "Ataque inválido", "warn");
        }
        this.clearAttackerSelection();
      }
    });

    this.input.on(
      "pointerdown",
      (_pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => {
        if (gameObjects.length === 0) {
          if (this.selectedAttacker) this.clearAttackerSelection();
          if (this.targetSelectionMode) {
            this.targetSelectionMode = null;
            Toast.show(this, "Selección cancelada", "ok");
          }
        }
      },
    );

    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.selectedAttacker) this.clearAttackerSelection();
      if (this.targetSelectionMode) {
        this.targetSelectionMode = null;
        Toast.show(this, "Selección cancelada", "ok");
      }
    });
  }

  private makeHandCardDraggable(sprite: CardSprite, cardInstanceId: string): void {
    sprite.setInteractive({ draggable: true });
    // Phaser requiere registrar explícitamente el objeto en el gestor de drag de la escena.
    this.input.setDraggable(sprite);

    let startX = 0;
    let startY = 0;

    sprite.on("dragstart", (_pointer: Phaser.Input.Pointer) => {
      if (!this.isPlayerTurn || this.currentPhase !== "main") {
        Toast.show(this, "Solo puedes jugar cartas en tu fase Main", "warn");
        return;
      }
      startX = sprite.x;
      startY = sprite.y;
      sprite.setDepth(100);
      this.highlightValidSlots();
    });

    sprite.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (!this.isPlayerTurn || this.currentPhase !== "main") return;
      sprite.x = dragX;
      sprite.y = dragY;
    });

    sprite.on("dragend", (pointer: Phaser.Input.Pointer) => {
      if (!this.isPlayerTurn || this.currentPhase !== "main") return;
      this.clearSlotHighlights();
      sprite.setDepth(0);

      const zoneId = this.getDropZone(pointer.x, pointer.y);
      if (zoneId) {
        const result = this.matchService.handlePlayerAction({
          type: "PLAY_CARD",
          playerId: "p1",
          cardInstanceId,
          zoneId,
        });

        if (!result.success) {
          Toast.show(this, result.error?.message || "No se puede jugar la carta", "warn");
          this.tweens.add({
            targets: sprite,
            x: startX,
            y: startY,
            duration: 200,
            ease: "Quad.easeOut",
          });
          this.handPlayer.rearrange();
        }
      } else {
        this.tweens.add({
          targets: sprite,
          x: startX,
          y: startY,
          duration: 200,
          ease: "Quad.easeOut",
        });
        this.handPlayer.rearrange();
      }
    });
  }

  private makeBoardCharacterClickable(
    sprite: CardSprite,
    characterId: string,
    isPlayer: boolean,
  ): void {
    sprite.setInteractive({ useHandCursor: true });

    sprite.on("pointerdown", () => {
      if (!this.isPlayerTurn) return;

      if (this.targetSelectionMode === "heroPower") {
        const result = this.matchService.handlePlayerAction({
          type: "USE_HERO_POWER",
          playerId: "p1",
          targetId: characterId,
        } as unknown as GameAction);
        if (!result.success) Toast.show(this, result.error?.message || "Objetivo inválido", "warn");
        this.targetSelectionMode = null;
        return;
      }

      if (this.currentPhase !== "combat") return;

      if (isPlayer) {
        this.selectAttacker(sprite, characterId);
      } else {
        if (this.selectedAttacker) {
          const result = this.matchService.handlePlayerAction({
            type: "ATTACK",
            attackerId: this.selectedAttacker,
            defenderId: characterId,
          });

          if (!result.success) {
            Toast.show(this, result.error?.message || "Ataque inválido", "warn");
          }
          this.clearAttackerSelection();
        }
      }
    });
  }

  private selectAttacker(sprite: CardSprite, characterId: string): void {
    this.clearAttackerSelection();
    this.selectedAttacker = characterId;

    this.attackerGlow = this.add.graphics();
    this.attackerGlow.lineStyle(4, 0xff3b3b, 1);
    this.board.add(this.attackerGlow);
    this.attackerGlow.strokeRoundedRect(sprite.x - 38, sprite.y - 50, 76, 100, 6);

    this.tweens.add({
      targets: this.attackerGlow,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: 600,
    });
  }

  private clearAttackerSelection(): void {
    this.selectedAttacker = null;
    if (this.attackerGlow) {
      this.tweens.killTweensOf(this.attackerGlow);
      this.attackerGlow.destroy();
      this.attackerGlow = null;
    }
  }

  private getDropZone(pointerX: number, pointerY: number): "left" | "center" | "right" | null {
    if (pointerY < 540) return null;
    const startX = 680;
    if (pointerX >= startX + 80 && pointerX < startX + 240) return "left";
    if (pointerX >= startX + 240 && pointerX < startX + 400) return "center";
    if (pointerX >= startX + 400 && pointerX < startX + 560) return "right";
    return null;
  }

  private highlightValidSlots(): void {
    if (!this.dragHighlight) {
      this.dragHighlight = this.add.graphics();
    }
    this.dragHighlight.clear();
    this.dragHighlight.lineStyle(4, 0x4caf6e, 0.6);
    const startX = 680;
    this.dragHighlight.strokeRoundedRect(startX + 80, 540, 150, 500, 8);
    this.dragHighlight.strokeRoundedRect(startX + 240, 540, 150, 500, 8);
    this.dragHighlight.strokeRoundedRect(startX + 400, 540, 150, 500, 8);
  }

  private clearSlotHighlights(): void {
    if (this.dragHighlight) {
      this.dragHighlight.clear();
    }
  }

  shutdown(): void {
    // Desuscribir todos los handlers
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    // Limpiar todos los eventos de tiempo para evitar fugas
    this.time.removeAllEvents();
    this.tweens.killAll();

    if (this.handPlayer) {
      this.handPlayer.getAll().forEach((child) => {
        if (child instanceof CardSprite) {
          child.removeAllListeners();
        }
      });
    }

    if (this.board) {
      this.board.getAll().forEach((child) => {
        if (child instanceof CardSprite) {
          child.removeAllListeners();
        }
      });
    }
  }
}
