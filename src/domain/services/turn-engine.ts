import type { IEventBus } from "@domain/events/event-bus";
import { GameEvent, type TurnPhase } from "@domain/events/game-event";
import type { ITurnPhase, TurnAction } from "@domain/states/turn-phase";
import { DrawPhase } from "@domain/states/draw-phase";

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

    this.transitionTo(new DrawPhase(this));
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
