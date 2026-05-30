import { BaseTurnPhase, PhaseViolationError, type TurnAction } from "./turn-phase";
import type { TurnEngine } from "@domain/services/turn-engine";
import { MainPhase } from "./main-phase";

/**
 * Fase de Robo (Draw Phase).
 * Normalmente resolviendo acciones automáticas (robar, fatigue),
 * o esperando a que el jugador o sistema avance a la fase principal.
 */
export class DrawPhase extends BaseTurnPhase {
  constructor(engine: TurnEngine) {
    super(engine, "draw");
  }

  enter(): void {
    // En una implementación completa aquí el jugador robaría carta
    // o se aplicaría daño de fatiga.
  }

  exit(): void {
    // Limpieza al salir de la fase de robo
  }

  handleAction(action: TurnAction): void {
    if (action.type === "END_PHASE") {
      this.engine.transitionTo(new MainPhase(this.engine));
    } else {
      throw new PhaseViolationError(`Acción ${action.type} no permitida en la fase de robo.`);
    }
  }

  getAllowedActions(): string[] {
    return ["END_PHASE"];
  }
}
