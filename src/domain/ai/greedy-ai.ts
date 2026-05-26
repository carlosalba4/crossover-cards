/**
 * GreedyAI — Crossover Cards
 *
 * Implementación del nivel de dificultad Fácil. Actúa de forma codiciosa:
 * maximiza el valor inmediato sin prever consecuencias futuras.
 *
 * Algoritmo (docs/02-architecture.md §8.2):
 *
 *   Fase Principal
 *   ─────────────
 *   1. Ordena la mano de mayor a menor coste de Nostalgia.
 *   2. Juega la primera carta que pueda permitirse (coste ≤ Nostalgia
 *      simulada disponible) y descuenta el coste del contador local.
 *   3. Repite hasta que no quede ninguna carta jugable.
 *   4. Termina con END_MAIN_PHASE.
 *
 *   Fase de Combate
 *   ───────────────
 *   1. Obtiene los Personajes propios aún disponibles (hasAttackedThisTurn === false).
 *   2. Si el oponente tiene Personajes con Provocación → ataca el de menor vida.
 *   3. Si no hay Provocación → ataca al héroe oponente directamente.
 *   4. Termina con END_COMBAT.
 *
 * Propiedades de la implementación:
 *   - Determinística: el mismo snapshot produce siempre el mismo resultado.
 *   - Sin efectos secundarios: no muta el snapshot ni ninguna entidad.
 *   - Sin aleatoriedad: no usa Math.random().
 *
 * Nota sobre ThreatEvaluator:
 *   GreedyAI no utiliza ThreatEvaluator en su algoritmo actual (§8.2 no lo
 *   requiere). Se declara como campo de instancia por coherencia con la
 *   arquitectura definida en §3.1.4 (la jerarquía de IA incluye ThreatEvaluator
 *   como dependencia de las clases concretas) y para facilitar posibles
 *   extensiones futuras sin romper el contrato de IAIStrategy.
 *
 * Referencias:
 *   - docs/02-architecture.md §8.2 (Algoritmo GreedyAI)
 *   - docs/decisions/ADR-007-patron-strategy-ia.md
 */

import { Ability } from "@domain/types/card-types";
import type { AICombatAction, AIMainAction, IAIStrategy } from "@domain/ai/ai-strategy";
import type { GameStateSnapshot } from "@domain/ai/game-state-snapshot";
import { ThreatEvaluator } from "@domain/ai/threat-evaluator";

// ---------------------------------------------------------------------------
// Constante de zona por defecto
// ---------------------------------------------------------------------------

/**
 * Zona por defecto donde GreedyAI coloca todos sus Personajes.
 * La IA codiciosa no razona sobre posicionamiento estratégico de zonas.
 */
const DEFAULT_ZONE = "center" as const;

// ---------------------------------------------------------------------------
// Clase GreedyAI
// ---------------------------------------------------------------------------

/**
 * Estrategia de IA codiciosa (nivel Fácil).
 *
 * Implementa `IAIStrategy`. No requiere parámetros en el constructor.
 *
 * @example
 * ```ts
 * const ai = new GreedyAI();
 * const mainActions = ai.decideMainPhaseActions(snapshot);
 * const combatActions = ai.decideCombatActions(snapshot);
 * ```
 */
export class GreedyAI implements IAIStrategy {
  /**
   * Evaluador de amenazas. GreedyAI lo utiliza como criterio de desempate
   * secundario cuando hay múltiples Personajes con Provocación: si dos tienen
   * la misma vida, se ataca primero al de mayor score de amenaza.
   */
  private readonly threatEvaluator: ThreatEvaluator = new ThreatEvaluator();

  // -------------------------------------------------------------------------
  // Fase Principal
  // -------------------------------------------------------------------------

  /**
   * Planifica las acciones de Fase Principal siguiendo el algoritmo codicioso.
   *
   * Usa un contador local `remainingNostalgia` para simular el gasto de
   * Nostalgia sin mutar el snapshot. El array resultante SIEMPRE termina
   * con `{ type: "END_MAIN_PHASE" }`.
   *
   * @param snapshot - Vista inmutable del estado actual de la partida.
   * @returns Secuencia de acciones de Fase Principal (mínimo: [END_MAIN_PHASE]).
   */
  decideMainPhaseActions(snapshot: GameStateSnapshot): readonly AIMainAction[] {
    const actions: AIMainAction[] = [];

    // Ordena la mano de mayor a menor coste (copia defensiva para no mutar el snapshot)
    const sortedHand = [...snapshot.aiHand].sort((a, b) => b.nostalgyCost - a.nostalgyCost);

    // Contador local: simula el gasto de Nostalgia sin tocar el snapshot
    let remainingNostalgia = snapshot.nostalgiaCurrent;

    for (const card of sortedHand) {
      if (card.nostalgyCost <= remainingNostalgia) {
        actions.push({
          type: "PLAY_CARD",
          cardInstanceId: card.instanceId,
          zoneId: DEFAULT_ZONE,
        });
        remainingNostalgia -= card.nostalgyCost;
      }
    }

    // Señal de fin de fase: siempre presente como último elemento
    actions.push({ type: "END_MAIN_PHASE" });
    return actions;
  }

  // -------------------------------------------------------------------------
  // Fase de Combate
  // -------------------------------------------------------------------------

  /**
   * Planifica los ataques de la Fase de Combate siguiendo el algoritmo codicioso.
   *
   * Para cada Personaje propio disponible:
   *   - Si hay Provocación enemiga → ataca el Personaje con Taunt de menor vida.
   *   - Si no hay Provocación → ataca al héroe oponente directamente.
   *
   * El array resultante SIEMPRE termina con `{ type: "END_COMBAT" }`.
   *
   * @param snapshot - Vista inmutable del estado actual de la partida.
   * @returns Secuencia de ataques (mínimo: [END_COMBAT]).
   */
  decideCombatActions(snapshot: GameStateSnapshot): readonly AICombatAction[] {
    const actions: AICombatAction[] = [];

    // Personajes propios disponibles (aún no han atacado este turno)
    const availableAttackers = snapshot.aiBoard.flat().filter((c) => !c.hasAttackedThisTurn);

    if (availableAttackers.length === 0) {
      actions.push({ type: "END_COMBAT" });
      return actions;
    }

    // Personajes del oponente en el tablero
    const opponentCharacters = snapshot.opponentBoard.flat();

    // Filtra los que tienen Provocación
    const tauntCharacters = opponentCharacters.filter((c) => c.abilities.includes(Ability.Taunt));

    for (const attacker of availableAttackers) {
      if (tauntCharacters.length > 0) {
        // Debe atacar al Personaje con Taunt de menor vida actual.
        // Desempate secundario: mayor score de amenaza (prioriza el más peligroso).
        const target = [...tauntCharacters].sort((a, b) => {
          const healthDiff = a.currentHealth - b.currentHealth;
          if (healthDiff !== 0) return healthDiff;
          return this.threatEvaluator.evaluateThreat(b) - this.threatEvaluator.evaluateThreat(a);
        })[0];
        actions.push({
          type: "ATTACK",
          attackerId: attacker.instanceId,
          defenderId: target.instanceId,
        });
      } else {
        // Sin Provocación: ataca directamente al héroe oponente
        actions.push({
          type: "ATTACK",
          attackerId: attacker.instanceId,
          defenderId: snapshot.opponentPlayerId,
        });
      }
    }

    actions.push({ type: "END_COMBAT" });
    return actions;
  }

  // -------------------------------------------------------------------------
  // Crossover y Habilidad de Héroe
  // -------------------------------------------------------------------------

  /**
   * GreedyAI nunca activa el Crossover.
   *
   * La IA codiciosa no tiene lógica para evaluar si el momento es correcto
   * para usar la mecánica Crossover (§8.2 no la contempla).
   *
   * @returns Siempre `false`.
   */

  shouldUseCrossover(_snapshot: GameStateSnapshot): boolean {
    return false;
  }

  /**
   * GreedyAI delega la decisión de habilidad de héroe al `OpponentService`.
   *
   * El snapshot no incluye los detalles del heroPower (coste, tipo de objetivo),
   * por lo que esta capa de dominio no puede decidir de forma informada.
   * `OpponentService` comprobará la disponibilidad real antes de ejecutarlo.
   *
   * @returns Siempre `null`.
   */

  shouldUseHeroPower(_snapshot: GameStateSnapshot): string | null {
    return null;
  }
}
