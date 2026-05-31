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
  async executeTurn(
    match: Match,
    aiPlayerId: string,
    matchService: MatchService,
    delayFn: (ms: number) => Promise<void>,
  ): Promise<void> {
    // Paso 1 — Construir el snapshot inmutable
    const nostalgia = matchService.getNostalgia(aiPlayerId);
    const snapshot = createSnapshot(match, aiPlayerId, nostalgia.current, nostalgia.max);

    // -----------------------------------------------------------------------
    // Paso 2 — Fase Principal
    // -----------------------------------------------------------------------
    const mainActions = this.strategy.decideMainPhaseActions(snapshot);

    for (const action of mainActions) {
      await delayFn(800);

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
          // El plan de fase principal puede señalar USE_HERO_POWER (p.ej. la
          // rama de Momentum de ThreatAwareAI). La decisión informada del
          // objetivo se resuelve más abajo vía shouldUseHeroPower sobre un
          // snapshot ya actualizado; aquí no hacemos nada para no duplicarla.
          break;

        case "END_MAIN_PHASE":
          break;
      }

      if (action.type === "END_MAIN_PHASE") {
        break;
      }
    }

    // -----------------------------------------------------------------------
    // Paso 3 — Poder de héroe y Crossover
    //
    // Se reconstruye el snapshot tras la fase principal para reflejar la
    // Nostalgia ya gastada, las cartas jugadas y la disponibilidad real del
    // Crossover. Ambas decisiones usan este estado actualizado.
    // -----------------------------------------------------------------------
    const postMainNostalgia = matchService.getNostalgia(aiPlayerId);
    const postMainSnapshot = createSnapshot(
      match,
      aiPlayerId,
      postMainNostalgia.current,
      postMainNostalgia.max,
      matchService.isCrossoverAvailable(aiPlayerId),
    );

    // Poder de héroe: el efecto (daño/buff) lo aplica HeroPowerResolver al
    // emitirse HeroPowerUsed. El buff se aplica ANTES del combate, por lo que
    // el atacante reforzado golpea con su ATQ aumentado.
    const heroPowerTargetId = this.strategy.shouldUseHeroPower(postMainSnapshot);
    if (heroPowerTargetId !== null) {
      await delayFn(800);
      const result = matchService.handlePlayerAction({
        type: "USE_HERO_POWER",
        playerId: aiPlayerId,
        targetId: heroPowerTargetId,
      });
      if (!result.success) {
        console.warn("[OpponentService] USE_HERO_POWER fallido:", result.error?.message);
      }
    }

    // Crossover (uso único por partida, garantizado por CrossoverManager).
    if (this.strategy.shouldUseCrossover(postMainSnapshot)) {
      await delayFn(800);
      const result = matchService.handlePlayerAction({
        type: "ACTIVATE_CROSSOVER",
        playerId: aiPlayerId,
      });
      if (!result.success) {
        // No es un error grave: p.ej. ya usado o mazo rival vacío.
        console.info("[OpponentService] ACTIVATE_CROSSOVER no aplicado:", result.error?.message);
      }
    }

    // -----------------------------------------------------------------------
    // Paso 4 — Fase de Combate
    // -----------------------------------------------------------------------
    const combatActions = this.strategy.decideCombatActions(snapshot);

    for (const action of combatActions) {
      await delayFn(800);

      switch (action.type) {
        case "ATTACK": {
          // El plan de combate se decidió sobre un snapshot al inicio del turno.
          // Un atacante de un combate anterior del plan pudo morir por
          // contraataque o quedar exhausto. Re-evaluamos el estado VIVO del Match
          // antes de cada ataque y descartamos la acción si ya no es válida; así
          // evitamos disparar la guarda legítima de CombatResolver (que lanzaría y
          // bloquearía el turno de la IA).
          if (!this.isAttackerAvailable(match, aiPlayerId, action.attackerId)) {
            break;
          }
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
          break;
      }

      if (action.type === "END_COMBAT") {
        break;
      }
    }

    // -----------------------------------------------------------------------
    // Paso 5 — Fin de turno
    // -----------------------------------------------------------------------
    await delayFn(800);
    const endTurnResult = matchService.handlePlayerAction({
      type: "END_TURN",
      playerId: aiPlayerId,
    });

    if (!endTurnResult.success) {
      console.warn("[OpponentService] END_TURN fallido:", endTurnResult.error?.message);
    }
  }

  // -------------------------------------------------------------------------
  // Utilidades internas
  // -------------------------------------------------------------------------

  /**
   * Comprueba, contra el estado actual del Match, si un Personaje de la IA sigue
   * disponible para atacar: existe en su tablero, está vivo y no ha atacado ni
   * está exhausto. Se usa para descartar ataques de un plan ya desactualizado.
   *
   * @param match      - Estado actual de la partida.
   * @param aiPlayerId - ID del jugador controlado por la IA.
   * @param attackerId - `instanceId` del Personaje atacante a verificar.
   */
  private isAttackerAvailable(match: Match, aiPlayerId: string, attackerId: string): boolean {
    const aiPlayer = match.player1.playerId === aiPlayerId ? match.player1 : match.player2;
    const attacker = match.findCharacterOnBoard(aiPlayer, attackerId);
    return (
      attacker !== null &&
      attacker.isAlive() &&
      !attacker.isExhausted &&
      !attacker.hasAttackedThisTurn
    );
  }
}
