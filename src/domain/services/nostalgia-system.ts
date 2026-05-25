import type { IEventBus } from "@domain/events/event-bus";
import { GameEvent } from "@domain/events/game-event";

/**
 * Error lanzado cuando un jugador intenta realizar una acción
 * para la cual no tiene suficiente Nostalgia disponible.
 */
export class InsufficientNostalgiaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientNostalgiaError";
  }
}

/**
 * Estado interno de Nostalgia para un jugador.
 */
interface PlayerNostalgia {
  current: number;
  max: number;
}

/**
 * Servicio de dominio que gestiona el recurso de "Nostalgia" de los jugadores.
 * La Nostalgia equivale al Maná: crece en 1 cada turno hasta un máximo de 10,
 * y se recarga completamente al inicio de cada turno, sin acumular el sobrante
 * del turno anterior.
 */
export class NostalgiaSystem {
  private readonly ABSOLUTE_MAX = 10;
  private states = new Map<string, PlayerNostalgia>();

  constructor(private readonly eventBus: IEventBus) {}

  /**
   * Obtiene o inicializa el estado de nostalgia de un jugador.
   */
  private getPlayerState(playerId: string): PlayerNostalgia {
    if (!this.states.has(playerId)) {
      this.states.set(playerId, { current: 0, max: 0 });
    }
    return this.states.get(playerId)!;
  }

  /**
   * Ejecutado al inicio del turno de un jugador.
   * Incrementa su Nostalgia máxima en 1 (hasta 10) y rellena su reserva actual
   * igualándola al nuevo máximo. El sobrante del turno anterior se pierde.
   * Emite el evento NostalgiaChanged.
   *
   * @param playerId ID del jugador cuyo turno está empezando.
   */
  public onTurnStart(playerId: string): void {
    const state = this.getPlayerState(playerId);

    if (state.max < this.ABSOLUTE_MAX) {
      state.max++;
    }

    // La nostalgia no gastada se pierde, siempre se recarga al máximo actual
    state.current = state.max;

    this.emitChange(playerId, state);
  }

  /**
   * Deduce Nostalgia del jugador activo para pagar una carta o habilidad.
   * Emite el evento NostalgiaChanged tras el pago.
   *
   * @param playerId ID del jugador que realiza el gasto.
   * @param amount Cantidad de Nostalgia a deducir (debe ser >= 0).
   * @throws {InsufficientNostalgiaError} si amount > current.
   * @throws {Error} si amount es negativo.
   */
  public spend(playerId: string, amount: number): void {
    if (amount < 0) {
      throw new Error("No se puede gastar una cantidad negativa de Nostalgia.");
    }

    const state = this.getPlayerState(playerId);

    if (state.current < amount) {
      throw new InsufficientNostalgiaError(
        `Nostalgia insuficiente. Requerida: ${amount}, Actual: ${state.current}`,
      );
    }

    state.current -= amount;

    this.emitChange(playerId, state);
  }

  /**
   * Consulta la Nostalgia disponible actualmente para un jugador.
   */
  public getCurrentNostalgia(playerId: string): number {
    return this.getPlayerState(playerId).current;
  }

  /**
   * Consulta la Nostalgia máxima actual para un jugador.
   */
  public getMaxNostalgia(playerId: string): number {
    return this.getPlayerState(playerId).max;
  }

  private emitChange(playerId: string, state: PlayerNostalgia): void {
    this.eventBus.emit(GameEvent.NostalgiaChanged, {
      playerId,
      current: state.current,
      max: state.max,
    });
  }
}
