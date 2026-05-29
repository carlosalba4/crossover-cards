import { Match, type PlayerState } from "@domain/entities/match";
import { Hand } from "@domain/entities/hand";
import { Hero } from "@domain/entities/hero";
import type { DeckService } from "@application/services/deck-service";
import type { IEventBus } from "@domain/events/event-bus";
import { TurnEngine } from "@domain/services/turn-engine";
import { CombatResolver } from "@domain/services/combat-resolver";
import { NostalgiaSystem } from "@domain/services/nostalgia-system";
import type { IDeckRepository } from "@domain/repositories/i-deck-repository";
import type { IHeroRepository } from "@domain/repositories/i-hero-repository";
import { ApplicationError } from "@application/errors/application-error";
import type { CommandResult, ICommand } from "@application/commands/i-command";
import { PlayCardCommand } from "@application/commands/play-card-command";
import { AttackCommand } from "@application/commands/attack-command";
import { EndTurnCommand } from "@application/commands/end-turn-command";
import { GameEvent } from "@domain/events/game-event";
import type { GameAction } from "@application/types/game-action";

export class MatchService {
  private currentMatch: Match | null = null;
  private turnEngine: TurnEngine | null = null;
  private combatResolver: CombatResolver | null = null;
  private nostalgiaSystem: NostalgiaSystem | null = null;
  private internalUnsubscribers: Array<() => void> = [];
  /** Evita emitir MatchEnded más de una vez por partida. */
  private matchEnded = false;

  constructor(
    private readonly deckService: DeckService,
    private readonly deckRepository: IDeckRepository,
    private readonly heroRepository: IHeroRepository,
    private readonly eventBus: IEventBus,
  ) {}

  public async initMatch(p1DeckId: string, p2DeckId: string): Promise<Match> {
    const p1DeckData = await this.deckRepository.getById(p1DeckId);
    const p2DeckData = await this.deckRepository.getById(p2DeckId);

    if (!p1DeckData || !p2DeckData) {
      throw new ApplicationError("No se encontraron los mazos indicados.");
    }

    const p1HeroData = await this.heroRepository.getById(p1DeckData.heroId);
    const p2HeroData = await this.heroRepository.getById(p2DeckData.heroId);

    if (!p1HeroData || !p2HeroData) {
      throw new ApplicationError("No se encontraron los héroes de los mazos.");
    }

    const p1Hero = new Hero({
      staticId: p1HeroData.id,
      name: p1HeroData.name,
      archetype: p1HeroData.archetype,
      maxHealth: p1HeroData.maxHealth,
      heroPower: {
        name: p1HeroData.heroPower.name,
        nostalgyCost: p1HeroData.heroPower.cost,
        effectType: p1HeroData.heroPower.effectType,
        targetType: p1HeroData.heroPower.targetType,
        value: p1HeroData.heroPower.value,
      },
    });

    const p2Hero = new Hero({
      staticId: p2HeroData.id,
      name: p2HeroData.name,
      archetype: p2HeroData.archetype,
      maxHealth: p2HeroData.maxHealth,
      heroPower: {
        name: p2HeroData.heroPower.name,
        nostalgyCost: p2HeroData.heroPower.cost,
        effectType: p2HeroData.heroPower.effectType,
        targetType: p2HeroData.heroPower.targetType,
        value: p2HeroData.heroPower.value,
      },
    });

    const p1Deck = await this.deckService.buildDeck(p1DeckId);
    const p2Deck = await this.deckService.buildDeck(p2DeckId);

    p1Deck.shuffle();
    p2Deck.shuffle();

    const p1Hand = new Hand();
    const p2Hand = new Hand();

    for (let i = 0; i < 4; i++) {
      const c1 = p1Deck.draw();
      if (c1) p1Hand.add(c1);

      const c2 = p2Deck.draw();
      if (c2) p2Hand.add(c2);
    }

    const player1Id = "p1";
    const player2Id = "p2";

    const p1State: PlayerState = {
      playerId: player1Id,
      deck: p1Deck,
      hand: p1Hand,
      board: { left: [], center: [], right: [] },
      hero: p1Hero,
    };

    const p2State: PlayerState = {
      playerId: player2Id,
      deck: p2Deck,
      hand: p2Hand,
      board: { left: [], center: [], right: [] },
      hero: p2Hero,
    };

    this.currentMatch = new Match(p1State, p2State);
    this.matchEnded = false;

    // Determinar activo al azar
    const isP1Active = Math.random() < 0.5;
    this.currentMatch.activePlayerId = isP1Active ? player1Id : player2Id;

    // Inicializar subsistemas
    this.turnEngine = new TurnEngine(
      this.eventBus,
      this.currentMatch.activePlayerId,
      isP1Active ? player2Id : player1Id,
    );
    this.combatResolver = new CombatResolver(this.eventBus);
    this.nostalgiaSystem = new NostalgiaSystem(this.eventBus);

    // Limpiar suscripciones de partidas anteriores antes de registrar las nuevas
    this.dispose();

    // Mantener la entidad Match sincronizada con los eventos del dominio
    this.internalUnsubscribers.push(
      this.eventBus.on(GameEvent.TurnStarted, (payload) => {
        if (this.currentMatch) {
          this.currentMatch.activePlayerId = payload.playerId;
          this.currentMatch.currentPhase = payload.phase;

          // Reset del estado de combate del jugador activo: la regla vive en el
          // dominio (entidad Match); aquí solo se orquesta al iniciar el turno.
          this.currentMatch.resetCombatStateForActivePlayer();
        }
        this.nostalgiaSystem?.onTurnStart(payload.playerId);
      }),
    );

    this.internalUnsubscribers.push(
      this.eventBus.on(GameEvent.PhaseChanged, (payload) => {
        if (this.currentMatch) {
          this.currentMatch.currentPhase = payload.newPhase;
        }
      }),
    );

    // Arrancar la partida (Activa DrawPhase para el jugador 1)
    this.turnEngine.startMatch();

    return this.currentMatch;
  }

  public handlePlayerAction(action: GameAction): CommandResult {
    if (!this.currentMatch || !this.turnEngine || !this.combatResolver || !this.nostalgiaSystem) {
      return {
        success: false,
        error: new ApplicationError("No hay partida activa."),
        eventsEmitted: [],
      };
    }

    // Forzar sincronización de la fase por si el EventBus tuvo latencia
    const realPhase = this.turnEngine.getCurrentPhaseName();
    if (realPhase) {
      this.currentMatch.currentPhase = realPhase;
    }

    let command: ICommand;

    switch (action.type) {
      case "PLAY_CARD":
        command = new PlayCardCommand(
          this.currentMatch,
          action.playerId,
          action.cardInstanceId,
          this.eventBus,
          this.nostalgiaSystem,
          action.zoneId,
        );
        break;
      case "ATTACK":
        command = new AttackCommand(
          this.currentMatch,
          action.attackerId,
          action.defenderId,
          this.eventBus,
          this.combatResolver,
          this.turnEngine,
        );
        break;
      case "END_TURN":
        command = new EndTurnCommand(
          this.currentMatch,
          action.playerId,
          this.eventBus,
          this.turnEngine,
        );
        break;
      default: {
        const _exhaustive: never = action;
        return {
          success: false,
          error: new ApplicationError(`Acción no soportada: ${JSON.stringify(_exhaustive)}`),
          eventsEmitted: [],
        };
      }
    }

    const result = command.execute();

    this.checkMatchEnd();

    return result;
  }

  public getCurrentMatch(): Match | null {
    return this.currentMatch;
  }

  public getNostalgia(playerId: string): { current: number; max: number } {
    if (!this.nostalgiaSystem) return { current: 0, max: 0 };
    return {
      current: this.nostalgiaSystem.getCurrentNostalgia(playerId),
      max: this.nostalgiaSystem.getMaxNostalgia(playerId),
    };
  }

  public dispose(): void {
    this.internalUnsubscribers.forEach((unsub) => unsub());
    this.internalUnsubscribers = [];
  }

  private checkMatchEnd(): void {
    if (!this.currentMatch || this.matchEnded) return;

    const p1Hero = this.currentMatch.player1.hero;
    const p2Hero = this.currentMatch.player2.hero;

    const p1Dead = !p1Hero.isAlive();
    const p2Dead = !p2Hero.isAlive();

    if (p1Dead || p2Dead) {
      this.matchEnded = true;
      let winnerId: string | null = null;
      let loserId: string | null = null;
      let isDraw = false;

      if (p1Dead && p2Dead) {
        isDraw = true;
      } else if (p1Dead) {
        winnerId = this.currentMatch.player2.playerId;
        loserId = this.currentMatch.player1.playerId;
      } else {
        winnerId = this.currentMatch.player1.playerId;
        loserId = this.currentMatch.player2.playerId;
      }

      this.eventBus.emit(GameEvent.MatchEnded, {
        winnerId,
        loserId,
        isDraw,
      });
    }
  }
}
