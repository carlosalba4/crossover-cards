/**
 * ThreatAwareAI — Crossover Cards
 *
 * Implementación del patrón Strategy para el nivel de dificultad Medio.
 * Evalúa el estado del tablero, identifica amenazas críticas e intenta
 * construir intercambios ("trades") favorables.
 *
 * Algoritmo de decisión (docs/02-architecture.md §8.3):
 *
 *   Fase Principal (en orden estricto):
 *     1. Defensa temprana:  si vida <= 40 %, prioriza hechizos de mano.
 *     2. Sinergias tribales: prioriza grupos >= 2 cartas del mismo arquetipo.
 *     3. Momentum:          señala uso si momentumActive && charges >= 3.
 *     4. Resolución estándar: mayor a menor coste con Nostalgia restante.
 *     → Siempre termina con END_MAIN_PHASE.
 *
 *   Fase de Combate (en orden estricto):
 *     a. getCriticalThreats() para priorizar objetivos.
 *     b. Por atacante disponible:
 *        - Amenaza crítica → ataca la de mayor score.
 *        - Value trade favorable → ataca al objetivo ventajoso.
 *        - Sin amenazas/trades → ataca héroe solo si no quedan rivales
 *          o si el daño total puede ser letal.
 *     → Siempre termina con END_COMBAT.
 *
 * Principios aplicados:
 *   - NO muta el snapshot recibido (inmutabilidad).
 *   - rng solo sirve para desempatar opciones de igual score.
 *   - Todas las decisiones principales son determinísticas.
 *   - Sin dependencias de Phaser, Application ni Infrastructure.
 *
 * Referencias:
 *   - docs/02-architecture.md §4.3 (diagrama Strategy), §8.3 (algoritmo)
 *   - docs/decisions/ADR-007-patron-strategy-ia.md
 */

import type { Card } from "@domain/entities/card";
import type { Character } from "@domain/entities/character";
import type { GameStateSnapshot } from "@domain/ai/game-state-snapshot";
import type { AICombatAction, AIMainAction, IAIStrategy } from "@domain/ai/ai-strategy";
import { ThreatEvaluator } from "@domain/ai/threat-evaluator";
import { CardType } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Constantes internas
// ---------------------------------------------------------------------------

/** Umbral de vida (ratio) por debajo del cual la IA entra en modo defensivo. */
const DEFENSIVE_HEALTH_RATIO = 0.4;

/** Umbral de vida (ratio) por debajo del cual la IA considera usar Crossover. */
const CROSSOVER_HEALTH_RATIO = 0.3;

/** Máximo de cartas en mano para activar Crossover (umbral defensivo). */
const CROSSOVER_MAX_HAND_SIZE = 3;

/** Mínimo de cargas de Momentum para señalar su uso. */
const MOMENTUM_MIN_CHARGES = 3;

/** Mínimo de cartas del mismo arquetipo en mano para activar prioridad tribal. */
const TRIBAL_MIN_GROUP_SIZE = 2;

/** Zona por defecto para colocar Personajes (se puede evolucionar). */
const DEFAULT_ZONE_ID = "center" as const;

// ---------------------------------------------------------------------------
// Clase ThreatAwareAI
// ---------------------------------------------------------------------------

/**
 * Estrategia de IA de nivel Medio para Crossover Cards.
 *
 * Evalúa amenazas en cada turno, prioriza eliminación de Personajes peligrosos,
 * considera sinergias tribales al jugar cartas y activa mecánicas defensivas
 * cuando la vida del héroe cae por debajo de umbrales críticos.
 *
 * @example
 * ```ts
 * const ai = new ThreatAwareAI();
 * const mainActions = ai.decideMainPhaseActions(snapshot);
 * const combatActions = ai.decideCombatActions(snapshot);
 * ```
 */
export class ThreatAwareAI implements IAIStrategy {
  /** Evaluador de amenazas inyectado internamente. */
  private readonly threatEvaluator: ThreatEvaluator;

  /**
   * @param rng - Generador de aleatoriedad. Solo se usa para desempatar
   *              opciones de igual score, garantizando reproducibilidad
   *              cuando se inyecta un valor fijo (ej. `() => 0.5`).
   */
  constructor(private readonly rng: () => number = Math.random) {
    this.threatEvaluator = new ThreatEvaluator();
  }

  // -------------------------------------------------------------------------
  // Fase Principal
  // -------------------------------------------------------------------------

  /**
   * Planifica la secuencia completa de acciones para la Fase Principal,
   * siguiendo el algoritmo de §8.3 en orden estricto de 4 pasos.
   *
   * El array devuelto siempre termina con `{ type: "END_MAIN_PHASE" }`.
   *
   * @param snapshot - Vista inmutable del estado actual de la partida.
   * @returns Secuencia ordenada de acciones de Fase Principal.
   */
  decideMainPhaseActions(snapshot: GameStateSnapshot): readonly AIMainAction[] {
    const actions: AIMainAction[] = [];

    // Contador local de Nostalgia disponible (no muta el snapshot).
    let nostalgiaLeft = snapshot.nostalgiaCurrent;

    // Conjunto de instanceId ya programados para jugar (evita duplicados).
    const scheduledIds = new Set<string>();

    // -- PASO 1: Defensa temprana ----------------------------------------
    // Si la vida del héroe de la IA <= 40 %, prioriza hechizos de la mano.
    const healthRatio =
      snapshot.aiHeroMaxHealth > 0 ? snapshot.aiHeroHealth / snapshot.aiHeroMaxHealth : 1;

    if (healthRatio <= DEFENSIVE_HEALTH_RATIO) {
      const spells = snapshot.aiHand.filter(
        (card) =>
          card.type === CardType.Spell &&
          card.nostalgyCost <= nostalgiaLeft &&
          !scheduledIds.has(card.instanceId),
      );

      for (const spell of spells) {
        actions.push({
          type: "PLAY_CARD",
          cardInstanceId: spell.instanceId,
          zoneId: DEFAULT_ZONE_ID,
        });
        scheduledIds.add(spell.instanceId);
        nostalgiaLeft -= spell.nostalgyCost;
      }
    }

    // -- PASO 2: Sinergias tribales -------------------------------------
    // Agrupa aiHand por arquetipo y prioriza grupos >= 2 jugables.
    const tribalGroups = this.groupByArchetype(snapshot.aiHand, scheduledIds);

    // Ordena grupos de mayor a menor tamaño (para maximizar sinergia).
    const sortedGroups = [...tribalGroups.values()].sort((a, b) => b.length - a.length);

    for (const group of sortedGroups) {
      // Filtra cartas del grupo que sean jugables con la Nostalgia disponible.
      const playable = group.filter(
        (card) => card.nostalgyCost <= nostalgiaLeft && !scheduledIds.has(card.instanceId),
      );

      if (playable.length >= TRIBAL_MIN_GROUP_SIZE) {
        // Comprueba si podemos costear al menos 2 cartas del grupo en conjunto.
        const totalCost = playable
          .slice(0, TRIBAL_MIN_GROUP_SIZE)
          .reduce((sum, c) => sum + c.nostalgyCost, 0);

        if (totalCost <= nostalgiaLeft) {
          // Añade todas las jugables del grupo (orden descendente de coste).
          const sorted = [...playable].sort((a, b) => b.nostalgyCost - a.nostalgyCost);
          for (const card of sorted) {
            if (card.nostalgyCost <= nostalgiaLeft && !scheduledIds.has(card.instanceId)) {
              actions.push({
                type: "PLAY_CARD",
                cardInstanceId: card.instanceId,
                zoneId: DEFAULT_ZONE_ID,
              });
              scheduledIds.add(card.instanceId);
              nostalgiaLeft -= card.nostalgyCost;
            }
          }
        }
      }
    }

    // -- PASO 3: Momentum -----------------------------------------------
    // Señala uso de Momentum si está activo y hay suficientes cargas.
    if (snapshot.momentumActive && snapshot.momentumCharges >= MOMENTUM_MIN_CHARGES) {
      actions.push({ type: "USE_HERO_POWER" });
    }

    // -- PASO 4: Resolución estándar ------------------------------------
    // Con la Nostalgia restante, juega cartas de mayor a menor coste.
    const remainingPlayable = snapshot.aiHand
      .filter((card) => !scheduledIds.has(card.instanceId) && card.nostalgyCost <= nostalgiaLeft)
      .sort((a, b) => {
        // Orden primario: mayor coste primero.
        const costDiff = b.nostalgyCost - a.nostalgyCost;
        if (costDiff !== 0) return costDiff;
        // Desempate con rng (determinístico cuando rng es constante).
        return this.rng() - 0.5;
      });

    for (const card of remainingPlayable) {
      if (card.nostalgyCost <= nostalgiaLeft && !scheduledIds.has(card.instanceId)) {
        actions.push({
          type: "PLAY_CARD",
          cardInstanceId: card.instanceId,
          zoneId: DEFAULT_ZONE_ID,
        });
        scheduledIds.add(card.instanceId);
        nostalgiaLeft -= card.nostalgyCost;
      }
    }

    // Siempre termina con END_MAIN_PHASE.
    actions.push({ type: "END_MAIN_PHASE" });
    return actions;
  }

  // -------------------------------------------------------------------------
  // Fase de Combate
  // -------------------------------------------------------------------------

  /**
   * Planifica la secuencia completa de ataques para la Fase de Combate,
   * siguiendo el algoritmo de §8.3.
   *
   * El array devuelto siempre termina con `{ type: "END_COMBAT" }`.
   *
   * @param snapshot - Vista inmutable del estado actual de la partida.
   * @returns Secuencia ordenada de acciones de Fase de Combate.
   */
  decideCombatActions(snapshot: GameStateSnapshot): readonly AICombatAction[] {
    const actions: AICombatAction[] = [];

    // Obtiene todos los Personajes de la IA disponibles para atacar.
    const availableAttackers = snapshot.aiBoard
      .flat()
      .filter((character) => !character.hasAttackedThisTurn);

    if (availableAttackers.length === 0) {
      actions.push({ type: "END_COMBAT" });
      return actions;
    }

    // Todos los Personajes rivales en tablero (aplanado de zonas).
    const opponentCharacters = snapshot.opponentBoard.flat();

    // Calcula las Amenazas Críticas enemigas (score >= 5).
    const criticalThreats = this.threatEvaluator.getCriticalThreats(opponentCharacters);

    // Suma de ATQ de todos mis atacantes disponibles (para comprobar letal).
    const totalAttackerDamage = availableAttackers.reduce(
      (sum, attacker) => sum + attacker.getEffectiveAttack(),
      0,
    );

    for (const attacker of availableAttackers) {
      const targetId = this.selectTarget(
        attacker,
        criticalThreats,
        opponentCharacters,
        snapshot.opponentHeroHealth,
        totalAttackerDamage,
        snapshot.opponentPlayerId,
      );

      if (targetId !== null) {
        actions.push({
          type: "ATTACK",
          attackerId: attacker.instanceId,
          defenderId: targetId,
        });
      }
    }

    // Siempre termina con END_COMBAT.
    actions.push({ type: "END_COMBAT" });
    return actions;
  }

  // -------------------------------------------------------------------------
  // Crossover
  // -------------------------------------------------------------------------

  /**
   * Decide si la IA debe activar el Crossover.
   *
   * Retorna `true` SOLO si:
   *   - vida <= 30 % del máximo
   *   - mano con <= 3 cartas
   *   - crossoverAvailable === true
   *
   * @param snapshot - Vista inmutable del estado actual de la partida.
   * @returns `true` si se debe activar el Crossover.
   */
  shouldUseCrossover(snapshot: GameStateSnapshot): boolean {
    if (!snapshot.crossoverAvailable) {
      return false;
    }

    const healthRatio =
      snapshot.aiHeroMaxHealth > 0 ? snapshot.aiHeroHealth / snapshot.aiHeroMaxHealth : 1;

    return (
      healthRatio <= CROSSOVER_HEALTH_RATIO && snapshot.aiHand.length <= CROSSOVER_MAX_HAND_SIZE
    );
  }

  // -------------------------------------------------------------------------
  // Habilidad de héroe
  // -------------------------------------------------------------------------

  /**
   * Siempre retorna `null`.
   *
   * El snapshot no incluye datos del heroPower (coste, tipo de objetivo,
   * si ya fue usada este turno). OpponentService evaluará la habilidad
   * con los datos reales del Match antes de emitir UseHeroPowerCommand.
   *
   * @param _snapshot - Vista inmutable del estado (no utilizada aquí).
   * @returns Siempre `null`.
   */
  shouldUseHeroPower(_snapshot: GameStateSnapshot): string | null {
    return null;
  }

  // -------------------------------------------------------------------------
  // Métodos privados de apoyo
  // -------------------------------------------------------------------------

  /**
   * Agrupa las cartas de la mano por arquetipo, excluyendo las ya
   * programadas para jugar.
   *
   * @param hand        - Mano actual de la IA.
   * @param scheduledIds - Set de instanceIds ya añadidos al plan.
   * @returns Map<arquetipo, cartas del grupo>.
   */
  private groupByArchetype(hand: readonly Card[], scheduledIds: Set<string>): Map<string, Card[]> {
    const groups = new Map<string, Card[]>();

    for (const card of hand) {
      if (scheduledIds.has(card.instanceId)) continue;

      const key = card.archetype;
      const existing = groups.get(key);
      if (existing !== undefined) {
        existing.push(card);
      } else {
        groups.set(key, [card]);
      }
    }

    return groups;
  }

  /**
   * Selecciona el mejor objetivo para un atacante dado.
   *
   * Prioridad:
   *   1. Amenaza crítica de mayor score.
   *   2. Value trade favorable (mi ATQ >= vida enemiga Y ATQ enemigo < mi vida).
   *   3. Héroe enemigo si no quedan Personajes rivales o si el daño puede ser letal.
   *   4. `null` si no se encuentra ningún objetivo válido.
   *
   * @param attacker              - Personaje atacante de la IA.
   * @param criticalThreats       - Amenazas críticas ya ordenadas por score desc.
   * @param opponentCharacters    - Todos los Personajes rivales en tablero.
   * @param opponentHeroHealth    - Vida actual del héroe rival.
   * @param totalAttackerDamage   - Suma de ATQ de todos los atacantes disponibles.
   * @param opponentPlayerId      - ID del jugador rival (usado como heroId).
   * @returns ID del objetivo o `null` si no se ataca.
   */
  private selectTarget(
    attacker: Character,
    criticalThreats: Character[],
    opponentCharacters: Character[],
    opponentHeroHealth: number,
    totalAttackerDamage: number,
    opponentPlayerId: string,
  ): string | null {
    const myAttack = attacker.getEffectiveAttack();
    const myCurrentHealth = attacker.currentHealth;

    // -- Prioridad 1: Amenaza Crítica -----------------------------------
    if (criticalThreats.length > 0) {
      // La lista ya viene ordenada de mayor a menor score por getCriticalThreats.
      // En caso de empate de score, desempata con rng.
      const topScore = this.threatEvaluator.evaluateThreat(criticalThreats[0]);
      const topThreats = criticalThreats.filter(
        (t) => this.threatEvaluator.evaluateThreat(t) === topScore,
      );
      const chosen =
        topThreats.length === 1
          ? topThreats[0]
          : topThreats[Math.floor(this.rng() * topThreats.length)];
      return chosen.instanceId;
    }

    // -- Prioridad 2: Value Trade favorable ---------------------------
    // Mi ATQ >= vida enemiga (puedo matarla) Y ATQ enemigo < mi vida (sobrevivo).
    const valueTrades = opponentCharacters.filter(
      (enemy) => myAttack >= enemy.currentHealth && enemy.getEffectiveAttack() < myCurrentHealth,
    );

    if (valueTrades.length > 0) {
      // Elige el trade de mayor valor (enemigo más caro de matar = más stats).
      valueTrades.sort((a, b) => {
        const scoreDiff =
          this.threatEvaluator.evaluateThreat(b) - this.threatEvaluator.evaluateThreat(a);
        if (scoreDiff !== 0) return scoreDiff;
        return this.rng() - 0.5;
      });
      return valueTrades[0].instanceId;
    }

    // -- Prioridad 3: Ataque al héroe enemigo -------------------------
    // Solo si no quedan Personajes rivales vivos, o si el daño total puede ser letal.
    const noEnemyCharacters = opponentCharacters.length === 0;
    const canLethal = totalAttackerDamage >= opponentHeroHealth;

    if (noEnemyCharacters || canLethal) {
      return opponentPlayerId;
    }

    // No hay objetivo válido para este atacante en este ciclo.
    return null;
  }
}
