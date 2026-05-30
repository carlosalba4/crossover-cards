/**
 * ThreatEvaluator — Crossover Cards
 *
 * Servicio auxiliar sin estado que calcula la puntuación de peligro
 * de los Personajes enemigos, permitiendo a `ThreatAwareAI` priorizar
 * objetivos durante la Fase de Combate.
 *
 * Fórmula de score (docs/02-architecture.md §8.3):
 *   base  = getEffectiveAttack() + (currentHealth × 0.5)
 *   +3    si el Personaje tiene Poisonous
 *   +2    si el Personaje tiene DivineShield
 *   +1    si el Personaje tiene Taunt
 *   Umbral de Amenaza Crítica: score >= 5
 *
 * Principios aplicados:
 *   - Sin estado interno: todos los métodos son funciones puras sobre
 *     los parámetros recibidos (SRP, facilita el testing unitario).
 *   - `getEffectiveAttack()` en lugar de `attack` directo: respeta la
 *     encapsulación de modificadores activos del Personaje.
 *   - `character.abilities` (habilidades base) para la evaluación de
 *     habilidades, según especificación de IMPL-035.
 *
 * Referencias:
 *   - docs/02-architecture.md §8.3 (ThreatEvaluator, fórmula de amenaza)
 *   - docs/decisions/ADR-007-patron-strategy-ia.md
 */

import type { Character } from "@domain/entities/character";
import { Ability } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Constantes de puntuación
// ---------------------------------------------------------------------------

/** Bonus de score por tener Veneno (elimina cualquier Personaje al impactar). */
const POISONOUS_BONUS = 3;

/** Bonus de score por tener Escudo Divino (absorbe el primer golpe recibido). */
const DIVINE_SHIELD_BONUS = 2;

/** Bonus de score por tener Provocación (obliga a ser atacado primero). */
const TAUNT_BONUS = 1;

/** Umbral a partir del cual un Personaje se considera una Amenaza Crítica. */
const CRITICAL_THREAT_THRESHOLD = 5;

/** Factor multiplicador de la vida en el cálculo de score base. */
const HEALTH_WEIGHT = 0.5;

// ---------------------------------------------------------------------------
// Clase ThreatEvaluator
// ---------------------------------------------------------------------------

/**
 * Evaluador de amenazas para la IA del oponente.
 *
 * No necesita parámetros en el constructor porque no mantiene estado.
 * Puede instanciarse directamente o inyectarse en `ThreatAwareAI`.
 *
 * @example
 * ```ts
 * const evaluator = new ThreatEvaluator();
 * const threats = evaluator.getCriticalThreats(snapshot.opponentBoard.flat());
 * ```
 */
export class ThreatEvaluator {
  // -------------------------------------------------------------------------
  // Evaluación individual
  // -------------------------------------------------------------------------

  /**
   * Calcula el score de peligro de un Personaje enemigo.
   *
   * Fórmula exacta (§8.3):
   *   score = getEffectiveAttack() + (currentHealth × 0.5)
   *           + 3 si Poisonous
   *           + 2 si DivineShield
   *           + 1 si Taunt
   *
   * El resultado puede ser un número decimal (por el factor 0.5 en la vida).
   *
   * @param character - Personaje a evaluar (no se muta).
   * @returns Score de amenaza (mayor = más peligroso).
   */
  evaluateThreat(character: Character): number {
    const base = character.getEffectiveAttack() + character.currentHealth * HEALTH_WEIGHT;

    const poisonousBonus = character.abilities.includes(Ability.Poisonous) ? POISONOUS_BONUS : 0;
    const divineShieldBonus = character.abilities.includes(Ability.DivineShield)
      ? DIVINE_SHIELD_BONUS
      : 0;
    const tauntBonus = character.abilities.includes(Ability.Taunt) ? TAUNT_BONUS : 0;

    return base + poisonousBonus + divineShieldBonus + tauntBonus;
  }

  /**
   * Indica si un Personaje supera el umbral de Amenaza Crítica (score >= 5).
   *
   * @param character - Personaje a evaluar.
   * @returns `true` si el score es mayor o igual a 5.
   */
  isCriticalThreat(character: Character): boolean {
    return this.evaluateThreat(character) >= CRITICAL_THREAT_THRESHOLD;
  }

  // -------------------------------------------------------------------------
  // Evaluación de conjuntos
  // -------------------------------------------------------------------------

  /**
   * Ordena un array de Personajes de mayor a menor score de amenaza.
   *
   * Si el array de entrada está vacío, devuelve `[]` sin iterar.
   * No muta el array de entrada (la ordenación opera sobre una copia).
   *
   * @param characters - Personajes a evaluar (puede estar vacío).
   * @returns Nuevo array ordenado de mayor a menor score.
   */
  getThreats(characters: readonly Character[]): Character[] {
    if (characters.length === 0) {
      return [];
    }

    return [...characters].sort((a, b) => this.evaluateThreat(b) - this.evaluateThreat(a));
  }

  /**
   * Filtra y ordena los Personajes que superan el umbral de Amenaza Crítica.
   *
   * Combina `evaluateThreat` y `isCriticalThreat` en un único recorrido
   * eficiente: primero filtra por umbral y luego ordena el subconjunto.
   *
   * @param characters - Personajes a evaluar (puede estar vacío).
   * @returns Nuevo array con solo los Personajes críticos, ordenados de
   *          mayor a menor score.
   */
  getCriticalThreats(characters: readonly Character[]): Character[] {
    if (characters.length === 0) {
      return [];
    }

    return characters
      .filter((c) => this.evaluateThreat(c) >= CRITICAL_THREAT_THRESHOLD)
      .sort((a, b) => this.evaluateThreat(b) - this.evaluateThreat(a));
  }
}
