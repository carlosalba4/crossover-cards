import { BaseTurnPhase, PhaseViolationError, type TurnAction } from "./turn-phase";
import type { TurnEngine } from "@domain/services/turn-engine";
import { EndPhase } from "./end-phase";

/**
 * Fase de Combate (Combat Phase).
 * El jugador activo puede declarar ataques con sus personajes.
 * Una vez finalizado, se pasa a la fase de fin de turno.
 */
export class CombatPhase extends BaseTurnPhase {
  constructor(engine: TurnEngine) {
    super(engine, "combat");
  }

  enter(): void {
    // Inicio de la fase de combate
  }

  exit(): void {
    // Limpieza
  }

  handleAction(action: TurnAction): void {
    switch (action.type) {
      case "ATTACK":
        // En una implementación completa se delegaría al CombatResolver.
        break;
      case "END_PHASE":
        this.engine.transitionTo(new EndPhase(this.engine));
        break;
      default:
        throw new PhaseViolationError(`Acción ${action.type} no permitida en la fase de combate.`);
    }
  }

  getAllowedActions(): string[] {
    return ["ATTACK", "END_PHASE"];
  }
}
