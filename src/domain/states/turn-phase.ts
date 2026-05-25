import type { TurnEngine } from "@domain/services/turn-engine";
import type { TurnPhase } from "@domain/events/game-event";

/**
 * Representa una acción intentada por el jugador durante una fase.
 */
export interface TurnAction {
  type: string;
  payload?: unknown;
}

export { PhaseViolationError } from "@domain/errors/phase-violation-error";

/**
 * Contrato para las fases del motor de turnos (State Pattern).
 */
export interface ITurnPhase {
  readonly phaseName: TurnPhase;
  enter(): void;
  exit(): void;
  handleAction(action: TurnAction): void;
  getAllowedActions(): string[];
}

/**
 * Clase base abstracta para las fases del turno.
 * Proporciona funcionalidad común como la referencia al motor de turnos.
 */
export abstract class BaseTurnPhase implements ITurnPhase {
  constructor(
    protected engine: TurnEngine,
    public readonly phaseName: TurnPhase,
  ) {}

  abstract enter(): void;
  abstract exit(): void;
  abstract handleAction(action: TurnAction): void;
  abstract getAllowedActions(): string[];
}
