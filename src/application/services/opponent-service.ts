/**
 * OpponentService — Crossover Cards
 *
 * Servicio de Aplicación que orquesta el turno completo de la IA.
 * Es el puente entre el patrón Strategy del dominio (`IAIStrategy`) y
 * el sistema de comandos de la capa de Aplicación (`MatchService`).
 *
 * Responsabilidades:
 *   1. Construir el `GameStateSnapshot` inmutable a partir del `Match`.
 *   2. Delegar las decisiones a la `IAIStrategy` configurada.
 *   3. Traducir las acciones de la IA (`AIMainAction` / `AICombatAction`)
 *      en llamadas a `MatchService.handlePlayerAction(GameAction)`.
 *   4. Permitir cambiar la estrategia en caliente (cambio de dificultad).
 *
 * Separación de responsabilidades:
 *   - OpponentService NO conoce la lógica de `GreedyAI` ni `ThreatAwareAI`.
 *     Solo interactúa con la interfaz `IAIStrategy` (OCP, DIP).
 *   - OpponentService NO modifica el `Match` directamente: todas las
 *     mutaciones de estado pasan por los comandos de `MatchService`.
 *   - Si `handlePlayerAction` devuelve `{ success: false }`, el error
 *     se registra con `console.warn` pero NO interrumpe el turno:
 *     la IA puede tener decisiones basadas en un snapshot ya desactualizado.
 *
 * Referencias:
 *   - docs/02-architecture.md §3.2.2 (OpponentService)
 *   - docs/02-architecture.md §8.1 (Estructura Intercambiable de la IA)
 *   - docs/02-architecture.md §4.3 (diagrama classDiagram Strategy)
 *   - docs/decisions/ADR-007-patron-strategy-ia.md
 */

import type { Match } from "@domain/entities/match";
import type { IAIStrategy } from "@domain/ai/ai-strategy";
import { createSnapshot } from "@domain/ai/game-state-snapshot";
import type { MatchService } from "@application/services/match-service";

// ---------------------------------------------------------------------------
// Clase OpponentService
// ---------------------------------------------------------------------------

/**
 * Orquestador del turno de la IA. Vive en la capa de Aplicación.
 *
 * @example
 * ```ts
 * const opponentService = new OpponentService(new GreedyAI());
 * opponentService.executeAITurn(match, "p2", matchService);
 * ```
 */
export class OpponentService {
  /**
   * @param strategy - Estrategia de IA activa. Se puede reemplazar en caliente
   *                   con `setStrategy()`.
   */
  constructor(private strategy: IAIStrategy) {}

  // -------------------------------------------------------------------------
  // Configuración de estrategia
  // -------------------------------------------------------------------------

  /**
   * Reemplaza la estrategia de IA activa.
   *
   * Permite cambiar la dificultad (Fácil ↔ Medio) incluso a mitad de partida,
   * sin necesidad de reiniciar el servicio. La nueva estrategia se aplica a
   * partir del siguiente turno de la IA.
   *
   * @param strategy - Nueva implementación de `IAIStrategy` a utilizar.
   */
  setStrategy(strategy: IAIStrategy): void {
    this.strategy = strategy;
  }

  // -------------------------------------------------------------------------
  // Ejecución del turno completo
  // -------------------------------------------------------------------------

  /**
   * Ejecuta el turno completo de la IA, desde la Fase Principal hasta el
   * envío de `END_TURN`. Siempre termina con `END_TURN` aunque las
   * estrategias devuelvan arrays vacíos.
   *
   * Flujo:
   *   1. Construye el snapshot inmutable del estado actual.
   *   2. Fase Principal → `decideMainPhaseActions` → ejecuta acciones hasta END_MAIN_PHASE.
   *   3. Crossover (opcional) → `shouldUseCrossover` → log de reserva si true.
   *   4. Fase de Combate → `decideCombatActions` → ejecuta ataques hasta END_COMBAT.
   *   5. Fin de turno → emite END_TURN al héroe de la IA.
   *
   * @param match        - Estado actual de la partida (no se muta directamente).
   * @param aiPlayerId   - ID del jugador controlado por la IA.
   * @param matchService - Servicio de partida que ejecuta los comandos.
   */
  executeAITurn(match: Match, aiPlayerId: string, matchService: MatchService): void {
    // Paso 1 — Construir el snapshot inmutable
    const snapshot = createSnapshot(match, aiPlayerId);

    // -----------------------------------------------------------------------
    // Paso 2 — Fase Principal
    // -----------------------------------------------------------------------
    const mainActions = this.strategy.decideMainPhaseActions(snapshot);

    for (const action of mainActions) {
      switch (action.type) {
        case "PLAY_CARD": {
          const result = matchService.handlePlayerAction({
            type: "PLAY_CARD",
            playerId: aiPlayerId,
            cardInstanceId: action.cardInstanceId,
            zoneId: action.zoneId,
          });
          if (!result.success) {
            console.warn(
              `[OpponentService] PLAY_CARD fallido (carta ${action.cardInstanceId}):`,
              result.error?.message,
            );
          }
          break;
        }

        case "USE_HERO_POWER":
          // USE_HERO_POWER: UseHeroPowerCommand no existe aún en esta iteración.
          // Se reserva para una tarea futura del bloque IMPL-D.
          console.warn(
            "[OpponentService] USE_HERO_POWER: pendiente de implementar UseHeroPowerCommand.",
          );
          break;

        case "END_MAIN_PHASE":
          // La estrategia indica que ha terminado la fase principal
          break;
      }

      // Salir del loop al encontrar END_MAIN_PHASE
      if (action.type === "END_MAIN_PHASE") {
        break;
      }
    }

    // -----------------------------------------------------------------------
    // Paso 3 — Crossover (opcional, pendiente de comando)
    // -----------------------------------------------------------------------
    if (this.strategy.shouldUseCrossover(snapshot)) {
      // ActivateCrossoverCommand no existe aún: se reserva para tarea futura.
      console.warn("[OpponentService] Crossover IA: pendiente de comando.");
    }

    // -----------------------------------------------------------------------
    // Paso 4 — Fase de Combate
    // -----------------------------------------------------------------------
    const combatActions = this.strategy.decideCombatActions(snapshot);

    for (const action of combatActions) {
      switch (action.type) {
        case "ATTACK": {
          const result = matchService.handlePlayerAction({
            type: "ATTACK",
            attackerId: action.attackerId,
            defenderId: action.defenderId,
          });
          if (!result.success) {
            console.warn(
              `[OpponentService] ATTACK fallido (${action.attackerId} → ${action.defenderId}):`,
              result.error?.message,
            );
          }
          break;
        }

        case "END_COMBAT":
          // La estrategia indica que ha terminado el combate
          break;
      }

      // Salir del loop al encontrar END_COMBAT
      if (action.type === "END_COMBAT") {
        break;
      }
    }

    // -----------------------------------------------------------------------
    // Paso 5 — Fin de turno (siempre se emite, aunque los pasos anteriores
    // hayan fallado o devuelto arrays vacíos)
    // -----------------------------------------------------------------------
    const endTurnResult = matchService.handlePlayerAction({
      type: "END_TURN",
      playerId: aiPlayerId,
    });

    if (!endTurnResult.success) {
      console.warn("[OpponentService] END_TURN fallido:", endTurnResult.error?.message);
    }
  }
}
