import { BaseTurnPhase, PhaseViolationError, type TurnAction } from "./turn-phase";
import type { TurnEngine } from "@domain/services/turn-engine";
import { CombatPhase } from "./combat-phase";

/**
 * Fase Principal (Main Phase).
 * El jugador activo puede jugar cartas, usar su poder de héroe
 * y luego pasar a la fase de combate.
 */
export class MainPhase extends BaseTurnPhase {
  constructor(engine: TurnEngine) {
    super(engine, "main");
  }

  enter(): void {
    // Inicio de la fase principal
  }

  exit(): void {
    // Limpieza
  }

  handleAction(action: TurnAction): void {
    switch (action.type) {
      case "PLAY_CARD":
      case "USE_HERO_POWER":
        // En una implementación completa delegaríamos a un servicio.
        break;
      case "END_PHASE":
        this.engine.transitionTo(new CombatPhase(this.engine));
        break;
      default:
        throw new PhaseViolationError(`Acción ${action.type} no permitida en la fase principal.`);
    }
  }

  getAllowedActions(): string[] {
    return ["PLAY_CARD", "USE_HERO_POWER", "END_PHASE"];
  }
}
