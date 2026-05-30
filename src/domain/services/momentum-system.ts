import type { IEventBus } from "@domain/events/event-bus";
import {
  GameEvent,
  type HeroDamagedPayload,
  type HeroHealedPayload,
} from "@domain/events/game-event";

/**
 * Error lanzado cuando un jugador intenta realizar una acción
 * para la cual no tiene suficiente Momentum disponible.
 */
export class InsufficientMomentumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientMomentumError";
  }
}

/**
 * Estado interno de Momentum para un jugador.
 */
interface PlayerMomentum {
  momentum: number;
  isActive: boolean;
}

/**
 * Servicio de dominio que gestiona la mecánica de "comeback" del juego (Momentum).
 * - Se activa cuando la vida del héroe cae a <= 15.
 * - Otorga +1 de Momentum al inicio del turno si está activo (máx 10).
 * - Se conserva el recurso aunque la vida vuelva a subir y se desactive el estado.
 */
export class MomentumSystem {
  private readonly MAX_MOMENTUM = 10;
  private readonly ACTIVATION_THRESHOLD = 15;
  private states = new Map<string, PlayerMomentum>();

  constructor(private readonly eventBus: IEventBus) {
    // Suscribirse a eventos de cambio de vida del héroe para evaluar el umbral
    this.eventBus.on(GameEvent.HeroDamaged, this.onHeroHealthChanged.bind(this));
    this.eventBus.on(GameEvent.HeroHealed, this.onHeroHealthChanged.bind(this));
  }

  /**
   * Obtiene o inicializa el estado de momentum de un jugador.
   */
  private getPlayerState(playerId: string): PlayerMomentum {
    if (!this.states.has(playerId)) {
      this.states.set(playerId, { momentum: 0, isActive: false });
    }
    return this.states.get(playerId)!;
  }

  /**
   * Callback invocado por el IEventBus cuando un héroe recibe daño o curación.
   * Actualiza el estado isActive y emite MomentumChanged si cambia.
   */
  private onHeroHealthChanged(payload: HeroDamagedPayload | HeroHealedPayload): void {
    const { playerId, currentHealth } = payload;
    const state = this.getPlayerState(playerId);

    const wasActive = state.isActive;
    state.isActive = currentHealth <= this.ACTIVATION_THRESHOLD;

    if (wasActive !== state.isActive) {
      this.emitChange(playerId, state);
    }
  }

  /**
   * Ejecutado al inicio del turno de un jugador.
   * Si el Momentum está activo, el jugador gana +1 punto acumulable (hasta 10).
   *
   * @param playerId ID del jugador.
   */
  public onTurnStart(playerId: string): void {
    const state = this.getPlayerState(playerId);

    if (state.isActive && state.momentum < this.MAX_MOMENTUM) {
      state.momentum++;
      this.emitChange(playerId, state);
    }
  }

  /**
   * Deduce Momentum del jugador activo.
   *
   * @param playerId ID del jugador que realiza el gasto.
   * @param amount Cantidad de Momentum a deducir (debe ser >= 0).
   * @throws {InsufficientMomentumError} si amount > momentum.
   * @throws {Error} si amount es negativo.
   */
  public spendAsMomentum(playerId: string, amount: number): void {
    if (amount < 0) {
      throw new Error("No se puede gastar una cantidad negativa de Momentum.");
    }

    const state = this.getPlayerState(playerId);

    if (state.momentum < amount) {
      throw new InsufficientMomentumError(
        `Momentum insuficiente. Requerido: ${amount}, Actual: ${state.momentum}`,
      );
    }

    state.momentum -= amount;
    this.emitChange(playerId, state);
  }

  /**
   * Consulta la cantidad de Momentum acumulado actualmente para un jugador.
   */
  public getCurrentMomentum(playerId: string): number {
    return this.getPlayerState(playerId).momentum;
  }

  /**
   * Consulta si el estado de ganancia de Momentum está activo para un jugador.
   */
  public isMomentumActive(playerId: string): boolean {
    return this.getPlayerState(playerId).isActive;
  }

  private emitChange(playerId: string, state: PlayerMomentum): void {
    this.eventBus.emit(GameEvent.MomentumChanged, {
      playerId,
      momentum: state.momentum,
      isActive: state.isActive,
    });
  }
}
