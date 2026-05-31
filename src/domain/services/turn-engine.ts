import type { IEventBus } from "@domain/events/event-bus";
import { GameEvent, type TurnPhase } from "@domain/events/game-event";
import type { ITurnPhase, TurnAction } from "@domain/states/turn-phase";
import type { Match } from "@domain/entities/match";
import { DrawPhase } from "@domain/states/draw-phase";
import { MainPhase } from "@domain/states/main-phase";

/**
 * Contexto principal del patrón State para la gestión de turnos.
 * Mantiene la fase activa, orquesta las transiciones y delega las acciones.
 */
export class TurnEngine {
  private activePlayerId: string;
  private inactivePlayerId: string;
  private currentPhase: ITurnPhase | null = null;
  private turnNumber: number = 1;

  constructor(
    private readonly eventBus: IEventBus,
    player1Id: string,
    player2Id: string,
    private readonly match: Match | null = null,
  ) {
    this.activePlayerId = player1Id;
    this.inactivePlayerId = player2Id;
  }

  /**
   * Obtiene el EventBus inyectado para que las fases puedan emitir eventos.
   */
  public getEventBus(): IEventBus {
    return this.eventBus;
  }

  /**
   * Obtiene el aggregate Match inyectado para que las fases automáticas (ej.
   * la fase de robo) puedan leer y mutar el estado del jugador activo.
   *
   * Devuelve `null` cuando el motor se instancia sin Match (ej. tests
   * unitarios centrados solo en la máquina de estados de fases).
   */
  public getMatch(): Match | null {
    return this.match;
  }

  /**
   * Obtiene el ID del jugador que tiene el turno activo actualmente.
   */
  public getActivePlayerId(): string {
    return this.activePlayerId;
  }

  /**
   * Obtiene el ID del jugador inactivo (oponente) en este turno.
   */
  public getInactivePlayerId(): string {
    return this.inactivePlayerId;
  }

  /**
   * Obtiene el número de turno actual.
   */
  public getTurnNumber(): number {
    return this.turnNumber;
  }

  /**
   * Obtiene el nombre de la fase actual, si la hay.
   */
  public getCurrentPhaseName(): TurnPhase | null {
    return this.currentPhase ? this.currentPhase.phaseName : null;
  }

  /**
   * Inicia el ciclo de turnos del juego.
   */
  public startMatch(): void {
    this.eventBus.emit(GameEvent.MatchStarted, {
      player1Id: this.activePlayerId,
      player2Id: this.inactivePlayerId,
    });
    this.startTurn();
  }

  /**
   * Inicia un nuevo turno para el jugador activo.
   */
  private startTurn(): void {
    this.eventBus.emit(GameEvent.TurnStarted, {
      playerId: this.activePlayerId,
      turnNumber: this.turnNumber,
      phase: "draw",
    });
    // La fase de robo es automática: al entrar en Draw, `DrawPhase.enter()`
    // roba la carta del jugador activo (o aplica fatiga si el mazo está vacío)
    // de forma síncrona. Solo después avanzamos a Main, de modo que el jugador
    // empieza su fase principal con la carta ya en mano y sin poder accionar
    // nada durante el robo.
    this.transitionTo(new DrawPhase(this));
    this.transitionTo(new MainPhase(this));
  }

  /**
   * Transiciona la máquina de estados a una nueva fase.
   * Ejecuta exit() en la fase anterior y enter() en la nueva.
   */
  public transitionTo(newPhase: ITurnPhase): void {
    const previousPhaseName = this.currentPhase?.phaseName;

    if (this.currentPhase) {
      this.currentPhase.exit();
    }

    this.currentPhase = newPhase;
    this.currentPhase.enter();

    if (previousPhaseName) {
      this.eventBus.emit(GameEvent.PhaseChanged, {
        playerId: this.activePlayerId,
        previousPhase: previousPhaseName,
        newPhase: this.currentPhase.phaseName,
      });
    }
  }

  /**
   * Finaliza el turno actual y cede el control al otro jugador.
   */
  public endTurn(): void {
    this.eventBus.emit(GameEvent.TurnEnded, {
      playerId: this.activePlayerId,
      turnNumber: this.turnNumber,
    });

    // Alternar jugador activo
    const temp = this.activePlayerId;
    this.activePlayerId = this.inactivePlayerId;
    this.inactivePlayerId = temp;

    this.turnNumber++;
    this.startTurn();
  }

  /**
   * Delega una acción de juego a la fase activa actual.
   */
  public handleAction(action: TurnAction): void {
    if (!this.currentPhase) {
      throw new Error("No hay ninguna fase de turno activa.");
    }
    this.currentPhase.handleAction(action);
  }
}
