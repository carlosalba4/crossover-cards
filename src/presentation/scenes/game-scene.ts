import Phaser from "phaser";
import {
  BoardView,
  type BoardZoneId,
  type CharacterBoardData,
} from "@presentation/objects/board-view";
import { HandView } from "@presentation/objects/hand-view";
import { HeroView } from "@presentation/objects/hero-view";
import { LeftHUDPanel } from "@presentation/ui/left-hud-panel";
import { RightHUDPanel } from "@presentation/ui/right-hud-panel";
import { TurnIndicator } from "@presentation/ui/turn-indicator";
import { ZoneBanner } from "@presentation/ui/zone-banner";
import { Tooltip } from "@presentation/ui/tooltip";
import { Toast } from "@presentation/ui/toast";
import { Modal } from "@presentation/ui/modal";
import { Button } from "@presentation/ui/button";
import { CardSprite } from "@presentation/objects/card-sprite";
import { friendlyErrorMessage } from "@presentation/utils/toast-messages";

import type { MatchService } from "@application/services/match-service";
import type { OpponentService } from "@application/services/opponent-service";
import type { IDeckRepository } from "@domain/repositories/i-deck-repository";
import { GameEvent } from "@domain/events/game-event";
import type { Unsubscribe, IEventBus } from "@domain/events/event-bus";
import { Character } from "@domain/entities/character";
import { CardType } from "@domain/types/card-types";
import { createGameDependencies, type GameDependencies } from "@/composition/game-dependencies";

// ---------------------------------------------------------------------------
// Constantes de zonas de drop (coordenadas del tablero, en px)
// ---------------------------------------------------------------------------

/** Y mínima a partir de la cual una carta soltada cuenta como jugada en tablero. */
const DROP_ZONE_MIN_Y = 540;
/** Origen X de las zonas de drop (offset del free slot). */
const DROP_ZONE_BASE_X = 680;
/** Offset X del inicio de la zona izquierda respecto a la base. */
const DROP_ZONE_LEFT_OFFSET = 80;
/** Offset X del inicio de la zona central. */
const DROP_ZONE_CENTER_OFFSET = 240;
/** Offset X del inicio de la zona derecha. */
const DROP_ZONE_RIGHT_OFFSET = 400;
/** Offset X del final de la zona derecha. */
const DROP_ZONE_END_OFFSET = 560;
/** Anchura del recuadro de resaltado de cada slot. */
const DROP_ZONE_SLOT_WIDTH = 150;
/** Altura del recuadro de resaltado de cada slot. */
const DROP_ZONE_SLOT_HEIGHT = 500;

/**
 * Retardo (ms) antes de arrancar el turno de la IA. Difiere el arranque para
 * que los manejadores síncronos de inicio de turno (reset de combate y recarga
 * de Nostalgia en MatchService) se apliquen antes de que la IA lea el estado,
 * y aporta una pausa visual de "el rival está pensando".
 */
const AI_TURN_START_DELAY_MS = 500;

export class GameScene extends Phaser.Scene {
  private heroId!: string;
  private unsubscribers: Array<Unsubscribe> = [];

  private eventBus!: IEventBus;
  private matchService!: MatchService;
  private opponentService!: OpponentService;
  private deckRepository!: IDeckRepository;

  private board!: BoardView;
  private handPlayer!: HandView;
  private handRival!: HandView;
  private heroPlayer!: HeroView;
  private heroRival!: HeroView;
  private hudRight!: RightHUDPanel;
  private turnIndicator!: TurnIndicator;
  private zoneBanner!: ZoneBanner;
  private tooltip!: Tooltip;

  private currentPhase: string = "main";
  private isPlayerTurn: boolean = false;
  private selectedAttacker: string | null = null;
  private attackerGlow: Phaser.GameObjects.Graphics | null = null;
  private targetSelectionMode: "heroPower" | null = null;
  private dragHighlight: Phaser.GameObjects.Graphics | null = null;

  private aiOverlay?: Phaser.GameObjects.Rectangle;
  private rivalTurnText!: Phaser.GameObjects.Text;

  // Estadísticas de la partida, acumuladas desde los eventos del dominio y
  // entregadas a EndScene al terminar (Bug 4). Solo se contabiliza lo que se
  // puede derivar de forma fiable de los eventos actuales.
  /** Número total de turnos iniciados en la partida. */
  private statTurns = 0;
  /** Daño total infligido por el jugador humano (p1) a rivales. */
  private statDamageDealt = 0;
  /** Número de cartas jugadas por el jugador humano (p1). */
  private statCardsPlayed = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: { heroId?: string; dependencies?: GameDependencies }): void {
    this.heroId = data.heroId || "HERO-001";

    // Las dependencias se reciben ya compuestas desde la raíz de composición
    // (DIP). Si no se inyectan, se construyen aquí como fallback para permitir
    // arrancar la escena de forma autónoma sin acoplar la presentación a la
    // infraestructura concreta.
    const deps = data.dependencies ?? createGameDependencies();
    this.eventBus = deps.eventBus;
    this.matchService = deps.matchService;
    this.opponentService = deps.opponentService;
    this.deckRepository = deps.deckRepository;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0D0B1E");
    console.info("GameScene iniciada con heroId:", this.heroId);

    // Fondo del tablero (bg-game). Se dibuja primero y al fondo; el color sólido
    // de la cámara queda como fallback si el asset no se cargó.
    if (this.textures.exists("bg-game")) {
      this.add
        .image(this.scale.width / 2, this.scale.height / 2, "bg-game")
        .setDisplaySize(this.scale.width, this.scale.height)
        .setDepth(-100);
    }

    this.buildUI();
    this.setupUIInteractions();

    this.unsubscribers = [];
    this.setupEventHandlers();

    this.startMatch();

    // Cambiar de music-menu a music-game. Suscribir SHUTDOWN para parar
    // music-game si la escena se destruye (ej.: el jugador reinicia).
    this.swapToGameMusic();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      const track1 = this.sound.get("music-game");
      if (track1?.isPlaying) track1.stop();

      const track2 = this.sound.get("music-game2");
      if (track2?.isPlaying) track2.stop();
    });
  }

  // -------------------------------------------------------------------------
  // Construcción de la UI
  // -------------------------------------------------------------------------

  private buildUI(): void {
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

    // El panel izquierdo se auto-registra en la escena desde su constructor;
    // no se guarda referencia porque la escena no interactúa con él actualmente.
    new LeftHUDPanel(this, 0, 100);
    this.hudRight = new RightHUDPanel(this, 1800, 100);
    this.turnIndicator = new TurnIndicator(this, 960, 40);

    this.zoneBanner = new ZoneBanner(this, 960, 300);
    this.tooltip = new Tooltip(this);
    this.tooltip.setVisible(false);

    this.rivalTurnText = this.add
      .text(960, 40, "TURNO RIVAL", {
        fontFamily: "Bangers",
        fontSize: "24px",
        color: "#FF3B3B",
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(100);
  }

  // -------------------------------------------------------------------------
  // Arranque de la partida (carga asíncrona)
  // -------------------------------------------------------------------------

  private startMatch(): void {
    // Convertir heroId → deckId buscando en el repositorio el mazo asociado.
    this.deckRepository
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

        // Reconectar los handlers de interacción a los HeroView recién creados
        // (los listeners del mock anterior se perdieron al destruirlo). Sin esto
        // el clic sobre el héroe rival no haría nada (Bug B).
        this.wireHeroInteractions();

        p1.hand.getCards().forEach((c) => {
          const isCharacter = c instanceof Character;
          const sprite = this.handPlayer.addCard(
            {
              id: c.instanceId,
              spriteKey: c.spriteKey,
              name: c.name,
              type: c.type,
              archetype: c.archetype,
              rarity: c.rarity,
              nostalgyCost: c.nostalgyCost,
              attack: isCharacter ? c.attack : undefined,
              health: isCharacter ? c.currentHealth : undefined,
              description: c.description,
            },
            false,
          );
          this.makeHandCardDraggable(sprite, c.instanceId);
        });
        this.hudRight.updateHand(this.handPlayer.size());

        p2.hand.getCards().forEach((c) => {
          const isCharacter = c instanceof Character;
          this.handRival.addCard(
            {
              id: c.instanceId,
              spriteKey: c.spriteKey,
              name: c.name,
              type: c.type,
              archetype: c.archetype,
              rarity: c.rarity,
              nostalgyCost: c.nostalgyCost,
              attack: isCharacter ? c.attack : undefined,
              health: isCharacter ? c.currentHealth : undefined,
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

  /**
   * Mapea una entidad de dominio `Character` al DTO de presentación que
   * consume `BoardView`, aislando la capa visual de la lógica de negocio.
   */
  private toCharacterBoardData(character: Character): CharacterBoardData {
    return {
      instanceId: character.instanceId,
      spriteKey: character.spriteKey,
      name: character.name,
      type: character.type,
      archetype: character.archetype,
      rarity: character.rarity,
      nostalgyCost: character.nostalgyCost,
      attack: character.attack,
      currentHealth: character.currentHealth,
      description: character.description,
    };
  }

  /**
   * Sincroniza la vida mostrada en el CardSprite de tablero de un Personaje
   * con su vida real en el dominio. Se usa tras resolverse un combate.
   * Si el id no corresponde a ningún Personaje en tablero (p.ej. es el héroe
   * rival), no hace nada.
   */
  private refreshBoardCharacterHealth(instanceId: string): void {
    const match = this.matchService.getCurrentMatch();
    if (!match) return;
    const character =
      match.findCharacterOnBoard(match.player1, instanceId) ??
      match.findCharacterOnBoard(match.player2, instanceId);
    if (character) {
      this.board.updateCharacterHealth(instanceId, character.currentHealth, character.health);
    }
  }

  private setupEventHandlers(): void {
    // 1. CardPlayed — elimina la carta de la mano instantáneamente.
    // La creación del sprite en tablero la gestiona el handler CharacterSummoned.
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.CardPlayed, (payload) => {
        if (!payload.cardId) return;
        const isPlayer = payload.playerId === "p1";
        if (isPlayer) this.statCardsPlayed += 1;
        const hand = isPlayer ? this.handPlayer : this.handRival;
        hand.removeCard(payload.cardId, false);
        if (isPlayer) this.hudRight.updateHand(this.handPlayer.size());
      }),
    );

    // 2. CharacterSummoned — única ruta de creación del sprite en tablero
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.CharacterSummoned, (payload) => {
        if (!payload.character || !payload.zoneId) return;
        const isPlayer = payload.playerId === "p1";
        this.board.addCharacterSprite(
          this.toCharacterBoardData(payload.character),
          payload.zoneId as BoardZoneId,
          isPlayer,
        );
        const sprite = this.board.getSpriteByInstanceId(payload.character.instanceId);
        if (sprite) {
          this.makeBoardCharacterClickable(sprite, payload.character.instanceId, isPlayer);
        }
      }),
    );

    // 3. CharacterDestroyed
    this.unsubscribers.push(
      this.eventBus.on(GameEvent.CharacterDestroyed, (payload) => {
        if (!payload.character) return;
        // Ocultar el tooltip por si el cursor estaba sobre la carta al morir.
        this.tooltip.hide();
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
        // Contabilizar el daño ofensivo del jugador: durante su turno, el
        // atacante es siempre p1, por lo que damageToDefender es daño infligido
        // por el jugador humano (a un Personaje o al héroe rival).
        if (this.isPlayerTurn && payload.damageToDefender) {
          this.statDamageDealt += payload.damageToDefender;
        }
        if (payload.attackerId && payload.defenderId) {
          this.board.playAttackAnimation(payload.attackerId, payload.defenderId);
        }
        // Refrescar la vida visible de los Personajes implicados. El payload no
        // trae la vida actual, así que se lee del Match (ya mutado por el daño).
        // Para un objetivo héroe el id no corresponde a ningún sprite de tablero
        // y la actualización es un no-op (su vida la gestiona HeroDamaged).
        this.refreshBoardCharacterHealth(payload.attackerId);
        this.refreshBoardCharacterHealth(payload.defenderId);
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
        this.statTurns += 1;

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

          // Ejecutar IA con delay visual. El arranque se DIFIERE para garantizar
          // que el manejador interno de MatchService (reset de combate + recarga
          // de Nostalgia al iniciar turno) se ejecute ANTES de que la IA
          // construya su snapshot. De lo contrario la IA leería estado obsoleto
          // del turno anterior (Nostalgia y flags de combate), ya que el handler
          // de GameScene se ejecuta antes que el de MatchService en el mismo
          // emit de TurnStarted.
          const aiPlayerId = payload.playerId;
          const delayFn = (ms: number) => {
            return new Promise<void>((resolve) => {
              this.time.delayedCall(ms, resolve);
            });
          };
          this.time.delayedCall(AI_TURN_START_DELAY_MS, () => {
            const match = this.matchService.getCurrentMatch();
            if (!match) return;
            this.opponentService
              .executeTurn(match, aiPlayerId, this.matchService, delayFn)
              .catch((e) => console.error(e));
          });
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
          this.hudRight.setActiveQuest({
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
        // Estadísticas reales acumuladas durante la partida desde los eventos
        // del dominio (turnos, daño ofensivo del jugador y cartas jugadas).
        const stats = {
          turns: this.statTurns,
          damageDealt: this.statDamageDealt,
          cardsPlayed: this.statCardsPlayed,
        };
        this.cameras.main.fadeOut(600, 13, 11, 30);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start("EndScene", {
            winnerId: payload.winnerId,
            loserId: payload.loserId,
            isDraw: payload.isDraw,
            stats,
          });
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
        Toast.show(
          this,
          friendlyErrorMessage(result.error, "No puedes terminar el turno ahora"),
          "warn",
        );
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
          });
          if (!result.success) {
            Toast.show(
              this,
              friendlyErrorMessage(result.error, "Acción Crossover inválida"),
              "warn",
            );
          }
        },
      });
      btn.setDepth(1001);
      this.add.existing(btn);
    });

    // Los handlers de los HeroView se conectan en wireHeroInteractions(), que se
    // (re)invoca tras recrear los héroes con los datos reales en startMatch().
    // Si se conectaran aquí, se perderían al destruir/recrear los HeroView.

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

  /**
   * Conecta los handlers de interacción de los HeroView (poder de héroe del
   * jugador y clic sobre el héroe rival como objetivo de ataque / poder).
   *
   * Debe llamarse DESPUÉS de (re)crear los HeroView en startMatch(), porque al
   * destruir/recrear los objetos se pierden sus listeners. El objetivo "héroe
   * rival" usa el playerId del rival como defenderId (contrato unificado con
   * AttackCommand y la IA).
   */
  private wireHeroInteractions(): void {
    this.heroPlayer.on("heroPowerClicked", () => {
      if (!this.isPlayerTurn) return;

      const match = this.matchService.getCurrentMatch();
      const heroPower = match?.player1.hero.heroPower;
      if (!heroPower) return;

      if (heroPower.targetType === "none" || !heroPower.targetType) {
        const result = this.matchService.handlePlayerAction({
          type: "USE_HERO_POWER",
          playerId: "p1",
        });
        if (!result.success) {
          Toast.show(
            this,
            friendlyErrorMessage(result.error, "No se pudo usar la habilidad"),
            "warn",
          );
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

      const rivalState = this.matchService.getCurrentMatch()?.player2;
      if (!rivalState) return;

      if (this.targetSelectionMode === "heroPower") {
        const result = this.matchService.handlePlayerAction({
          type: "USE_HERO_POWER",
          playerId: "p1",
          // El poder de héroe identifica al héroe objetivo por su staticId.
          targetId: rivalState.hero.staticId,
        });
        if (!result.success)
          Toast.show(this, friendlyErrorMessage(result.error, "Objetivo inválido"), "warn");
        this.targetSelectionMode = null;
        return;
      }

      // El AttackCommand auto-transiciona main→combat, así que se permite
      // declarar el ataque al héroe rival también desde la fase main.
      // El objetivo "héroe rival" se identifica por el playerId rival (contrato
      // unificado con AttackCommand y la IA), no por su staticId.
      if (this.canAttackNow() && this.selectedAttacker) {
        const result = this.matchService.handlePlayerAction({
          type: "ATTACK",
          attackerId: this.selectedAttacker,
          defenderId: rivalState.playerId,
        });
        if (!result.success) {
          Toast.show(this, friendlyErrorMessage(result.error, "Ataque inválido"), "warn");
        }
        this.clearAttackerSelection();
      }
    });
  }

  private makeHandCardDraggable(sprite: CardSprite, cardInstanceId: string): void {
    sprite.setInteractive({ draggable: true });
    // Phaser requiere registrar explícitamente el objeto en el gestor de drag de la escena.
    this.input.setDraggable(sprite);

    // Tooltip con la descripción COMPLETA al hover sostenido. El retardo de 300ms
    // lo gestiona internamente Tooltip.showForCard (IMPL-057). No interfiere con
    // la elevación de hover de CardSprite ni con el drag.
    sprite.on(Phaser.Input.Events.POINTER_OVER, () => {
      // La carta es hija del contenedor HandView, así que sprite.x/y son
      // coordenadas LOCALES. El Tooltip vive a nivel de escena (coordenadas de
      // mundo), por lo que convertimos a mundo con la matriz de transformación
      // para posicionarlo correctamente respecto a la carta (Bug 7).
      const m = sprite.getWorldTransformMatrix();
      this.tooltip.showForCard(sprite.getCardData(), m.tx, m.ty, sprite.height);
    });
    sprite.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.tooltip.hide();
    });

    sprite.on("dragstart", (_pointer: Phaser.Input.Pointer) => {
      if (!this.isPlayerTurn || this.currentPhase !== "main") {
        Toast.show(this, "Solo puedes jugar cartas en tu fase Main", "warn");
        return;
      }
      // Ocultar el tooltip mientras se arrastra la carta.
      this.tooltip.hide();
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
        // Cada slot acepta UNA sola carta: si la zona destino ya está llena de
        // Personajes, rechazamos el drop y devolvemos la carta a la mano para
        // evitar cartas superpuestas en el tablero (Bug 6). Los Hechizos/Objetos
        // no ocupan slot, por lo que no se les aplica el límite de zona.
        const isCharacterCard = sprite.getCardData().type === CardType.Character;
        if (isCharacterCard && this.board.isZoneFull(zoneId, true)) {
          Toast.show(this, "Esa zona está llena", "warn");
          this.handPlayer.rearrange();
          return;
        }

        const result = this.matchService.handlePlayerAction({
          type: "PLAY_CARD",
          playerId: "p1",
          cardInstanceId,
          zoneId,
        });

        if (!result.success) {
          Toast.show(
            this,
            friendlyErrorMessage(result.error, "No se puede jugar la carta"),
            "warn",
          );
          // rearrange anima la carta de vuelta a su hueco en el abanico
          this.handPlayer.rearrange();
        }
        // En éxito: removeCard(false) en CardPlayed handler destruye el sprite
      } else {
        // Zona inválida: rearrange devuelve la carta a su posición fan correcta
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

    // Hover: mostrar tooltip para cualquier carta del tablero (propia o rival).
    // Usamos getWorldTransformMatrix() porque los sprites del tablero son hijos
    // de un Container (BoardView) y sus coordenadas x/y son locales.
    sprite.on(Phaser.Input.Events.POINTER_OVER, () => {
      const m = sprite.getWorldTransformMatrix();
      this.tooltip.showForCard(sprite.getCardData(), m.tx, m.ty, sprite.height);
    });
    sprite.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.tooltip.hide();
    });

    sprite.on("pointerdown", () => {
      // Ocultar el tooltip SIEMPRE al hacer clic, incluso fuera de turno.
      this.tooltip.hide();

      if (!this.isPlayerTurn) return;

      if (this.targetSelectionMode === "heroPower") {
        const result = this.matchService.handlePlayerAction({
          type: "USE_HERO_POWER",
          playerId: "p1",
          targetId: characterId,
        });
        if (!result.success)
          Toast.show(this, friendlyErrorMessage(result.error, "Objetivo inválido"), "warn");
        this.targetSelectionMode = null;
        return;
      }

      // Permitir seleccionar atacante y declarar ataques en main o combat:
      // el AttackCommand auto-transiciona main→combat al resolver el ataque.
      if (!this.canAttackNow()) return;

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
            Toast.show(this, friendlyErrorMessage(result.error, "Ataque inválido"), "warn");
          }
          this.clearAttackerSelection();
        }
      }
    });
  }

  /**
   * Indica si el jugador puede declarar ataques en este momento. El combate
   * se permite tanto en la fase main como en combat porque el AttackCommand
   * auto-transiciona main→combat al resolver el primer ataque.
   */
  private canAttackNow(): boolean {
    return this.isPlayerTurn && (this.currentPhase === "main" || this.currentPhase === "combat");
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
    if (pointerY < DROP_ZONE_MIN_Y) return null;
    const baseX = DROP_ZONE_BASE_X;
    if (pointerX >= baseX + DROP_ZONE_LEFT_OFFSET && pointerX < baseX + DROP_ZONE_CENTER_OFFSET) {
      return "left";
    }
    if (pointerX >= baseX + DROP_ZONE_CENTER_OFFSET && pointerX < baseX + DROP_ZONE_RIGHT_OFFSET) {
      return "center";
    }
    if (pointerX >= baseX + DROP_ZONE_RIGHT_OFFSET && pointerX < baseX + DROP_ZONE_END_OFFSET) {
      return "right";
    }
    return null;
  }

  private highlightValidSlots(): void {
    if (!this.dragHighlight) {
      this.dragHighlight = this.add.graphics();
    }
    this.dragHighlight.clear();
    this.dragHighlight.lineStyle(4, 0x4caf6e, 0.6);
    const baseX = DROP_ZONE_BASE_X;
    this.dragHighlight.strokeRoundedRect(
      baseX + DROP_ZONE_LEFT_OFFSET,
      DROP_ZONE_MIN_Y,
      DROP_ZONE_SLOT_WIDTH,
      DROP_ZONE_SLOT_HEIGHT,
      8,
    );
    this.dragHighlight.strokeRoundedRect(
      baseX + DROP_ZONE_CENTER_OFFSET,
      DROP_ZONE_MIN_Y,
      DROP_ZONE_SLOT_WIDTH,
      DROP_ZONE_SLOT_HEIGHT,
      8,
    );
    this.dragHighlight.strokeRoundedRect(
      baseX + DROP_ZONE_RIGHT_OFFSET,
      DROP_ZONE_MIN_Y,
      DROP_ZONE_SLOT_WIDTH,
      DROP_ZONE_SLOT_HEIGHT,
      8,
    );
  }

  private clearSlotHighlights(): void {
    if (this.dragHighlight) {
      this.dragHighlight.clear();
    }
  }

  shutdown(): void {
    // Desuscribir handlers de GameScene y los internos de MatchService
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.matchService?.dispose();

    // Reiniciar el estado estático compartido de Toast para evitar referencias
    // a objetos destruidos al recrear la escena.
    Toast.reset();

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

  // -------------------------------------------------------------------------
  // Música
  // -------------------------------------------------------------------------

  /**
   * Para music-menu si está sonando y arranca music-game en bucle.
   * La detención de music-game al salir se gestiona en el handler
   * SHUTDOWN registrado en create().
   */
  private swapToGameMusic(): void {
    const menuTrack = this.sound.get("music-menu");
    if (menuTrack?.isPlaying) menuTrack.stop();

    const trackKey = Phaser.Math.Between(1, 2) === 1 ? "music-game" : "music-game2";
    const gameTrack = this.sound.get(trackKey);
    if (!gameTrack?.isPlaying) {
      this.sound.play(trackKey, { loop: true, volume: 0.3 });
    }
  }
}
