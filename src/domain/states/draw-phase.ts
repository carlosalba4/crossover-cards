import { BaseTurnPhase, PhaseViolationError, type TurnAction } from "./turn-phase";
import type { TurnEngine } from "@domain/services/turn-engine";
import { GameEvent } from "@domain/events/game-event";
import { MainPhase } from "./main-phase";

/**
 * Daño de fatiga que recibe el héroe cuando intenta robar de un mazo vacío.
 * Se mantiene constante (1 PV por turno) para el MVP.
 */
const FATIGUE_DAMAGE = 1;

/**
 * Fase de Robo (Draw Phase).
 *
 * Es una fase automática: al entrar, el jugador activo roba 1 carta del mazo.
 *  - Si el mazo tiene cartas, la carta entra en la mano y se emite `CardDrawn`.
 *    Si la mano está llena (Hand Burn), la carta se descarta en silencio: el
 *    mazo decrementa igualmente y no se emite `CardDrawn` (la carta nunca llegó
 *    a la mano).
 *  - Si el mazo está vacío, el héroe recibe daño de fatiga y se emiten
 *    `HeroDamaged` (para refrescar la vida) y `DeckEmpty` (fatiga).
 *
 * El fin de partida por muerte del héroe lo gestiona el flujo existente
 * (MatchService): esta fase no añade lógica de victoria/derrota.
 */
export class DrawPhase extends BaseTurnPhase {
  constructor(engine: TurnEngine) {
    super(engine, "draw");
  }

  enter(): void {
    const match = this.engine.getMatch();
    if (!match) {
      // Motor instanciado sin Match (tests de la máquina de estados): no hay robo.
      return;
    }

    const eventBus = this.engine.getEventBus();
    const player = match.getActivePlayer();
    const drawnCard = player.deck.draw();

    if (drawnCard === null) {
      // Mazo vacío → daño de fatiga al héroe del jugador activo.
      player.hero.takeDamage(FATIGUE_DAMAGE);
      eventBus.emit(GameEvent.HeroDamaged, {
        playerId: player.playerId,
        damage: FATIGUE_DAMAGE,
        currentHealth: player.hero.currentHealth,
      });
      eventBus.emit(GameEvent.DeckEmpty, {
        playerId: player.playerId,
        fatigueDamage: FATIGUE_DAMAGE,
      });
      return;
    }

    // El mazo ya decrementó en `draw()`. Si la mano está llena, `Hand.add`
    // falla silenciosamente (Hand Burn): la carta se descarta y NO emitimos
    // `CardDrawn` porque no llegó a la mano.
    const result = player.hand.add(drawnCard);
    if (result.ok) {
      eventBus.emit(GameEvent.CardDrawn, {
        playerId: player.playerId,
        card: drawnCard,
      });
    }
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
