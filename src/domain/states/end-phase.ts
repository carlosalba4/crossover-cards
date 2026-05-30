import { BaseTurnPhase, PhaseViolationError, type TurnAction } from "./turn-phase";
import type { TurnEngine } from "@domain/services/turn-engine";

/**
 * Fase de Fin de Turno (End Phase).
 * Se resuelven efectos al final del turno y se pasa el turno al oponente.
 */
export class EndPhase extends BaseTurnPhase {
  constructor(engine: TurnEngine) {
    super(engine, "end");
  }

  enter(): void {
    // Aquí se ejecutarían habilidades tipo "Al final de tu turno..."
  }

  exit(): void {
    // Limpieza
  }

  handleAction(action: TurnAction): void {
    if (action.type === "END_TURN") {
      this.engine.endTurn();
    } else {
      throw new PhaseViolationError(`Acción ${action.type} no permitida en la fase final.`);
    }
  }

  getAllowedActions(): string[] {
    return ["END_TURN"];
  }
}
