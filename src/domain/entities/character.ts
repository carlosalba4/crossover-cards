/**
 * Entidad Character — Crossover Cards
 *
 * Representa una carta de Personaje en el tablero. Extiende la clase base
 * Card añadiendo estadísticas de combate (ATQ, VID), estado de turno
 * (exhausta, ha atacado) y el sistema de modificadores temporales.
 *
 * Referencia:
 *   - docs/02-architecture.md §3.1.1 (entidad Character)
 *   - docs/02-architecture.md §4.8 (patrón Modifier[] frente a Decorator)
 *   - docs/04-card-catalog.md §9.1 (esquema JSON Character — Rigby como ejemplo)
 *   - docs/04-card-catalog.md §9.4 (Modifier pool de Patricio Estrella)
 *
 * Decisiones de diseño:
 *   - `attack` y `health` son readonly (stats base inmutables de la carta).
 *   - Los stats efectivos se calculan dinámicamente en cada llamada a
 *     `getEffectiveAttack()` / `getEffectiveHealth()`, evitando estado derivado.
 *   - `currentHealth` es mutable porque representa el estado en partida.
 *   - `modifiers` es privado: solo se accede mediante métodos del dominio
 *     (encapsulación, OCP — se pueden añadir nuevos tipos de modifier sin
 *     cambiar Character).
 *   - `getEffectiveAttack()` y `getEffectiveHealth()` aplican `Math.max(0, ...)`
 *     para garantizar que nunca devuelven un valor negativo.
 */

import { Card } from "@domain/entities/card";
import type { CardProps } from "@domain/entities/card";
import type { Ability } from "@domain/types/card-types";
import type { Modifier } from "@domain/value-objects/modifier";

// ---------------------------------------------------------------------------
// Props de construcción
// ---------------------------------------------------------------------------

/** Props de entrada para construir un Character. Extiende CardProps con stats de combate. */
export interface CharacterProps extends CardProps {
  /** Ataque base de la carta (valor estático del JSON). */
  readonly attack: number;
  /** Vida máxima base de la carta (valor estático del JSON). */
  readonly health: number;
  /** Habilidades base de la carta (inmutables, del JSON). */
  readonly abilities: ReadonlyArray<Ability>;
}

// ---------------------------------------------------------------------------
// Entidad Character
// ---------------------------------------------------------------------------

/**
 * Carta de Personaje que puede ocupar un slot del tablero.
 *
 * Stats efectivos = stats base + suma de todos los Modifier activos.
 * Las habilidades activas = habilidades base ∪ habilidades de modifiers activos.
 */
export class Character extends Card {
  /** Ataque base (inmutable; definido en el JSON de la carta). */
  readonly attack: number;

  /** Vida máxima base (inmutable; definida en el JSON de la carta). */
  readonly health: number;

  /** Habilidades base (inmutables; definidas en el JSON de la carta). */
  readonly abilities: ReadonlyArray<Ability>;

  /** Vida actual en partida. Puede reducirse por daño de combate. */
  currentHealth: number;

  /**
   * Indica si el Personaje no puede realizar más acciones este turno.
   * Se pone a true al ser invocado (salvo que tenga Charge) y al atacar.
   */
  isExhausted: boolean;

  /**
   * Indica si el Personaje ya ha atacado en la fase de combate del turno actual.
   * Se resetea al inicio del turno del jugador.
   */
  hasAttackedThisTurn: boolean;

  /** Array privado de modificadores activos sobre este Personaje. */
  private modifiers: Modifier[];

  constructor(props: CharacterProps) {
    super(props);
    this.attack = props.attack;
    this.health = props.health;
    // Copia defensiva para garantizar que el array interno no comparte referencia
    this.abilities = [...props.abilities];
    this.currentHealth = props.health;
    this.isExhausted = false;
    this.hasAttackedThisTurn = false;
    this.modifiers = [];
  }

  // -------------------------------------------------------------------------
  // Stats efectivos
  // -------------------------------------------------------------------------

  /**
   * Calcula el ataque efectivo sumando todos los `attackBonus` de los modifiers
   * activos al ataque base. El resultado nunca es negativo.
   *
   * @returns ATQ efectivo (≥ 0).
   */
  getEffectiveAttack(): number {
    const bonus = this.modifiers.reduce((sum, m) => sum + m.attackBonus, 0);
    return Math.max(0, this.attack + bonus);
  }

  /**
   * Calcula la vida efectiva sumando todos los `healthBonus` de los modifiers
   * activos a la vida actual. El resultado nunca es negativo.
   *
   * @returns VID efectiva (≥ 0).
   */
  getEffectiveHealth(): number {
    const bonus = this.modifiers.reduce((sum, m) => sum + m.healthBonus, 0);
    return Math.max(0, this.currentHealth + bonus);
  }

  // -------------------------------------------------------------------------
  // Habilidades activas
  // -------------------------------------------------------------------------

  /**
   * Devuelve el conjunto deduplicado de habilidades activas:
   * habilidades base de la carta + habilidades concedidas por modifiers activos.
   *
   * @returns Array de Ability sin duplicados.
   */
  getActiveAbilities(): Ability[] {
    const granted = this.modifiers.flatMap((m) => [...m.abilitiesGranted]);
    const merged = [...this.abilities, ...granted];
    // Deduplicar preservando el orden de primera aparición
    return [...new Set(merged)];
  }

  // -------------------------------------------------------------------------
  // Gestión de modifiers
  // -------------------------------------------------------------------------

  /**
   * Añade un modifier al Personaje.
   *
   * @param modifier - Modifier a aplicar.
   */
  addModifier(modifier: Modifier): void {
    this.modifiers.push(modifier);
  }

  /**
   * Elimina los modifiers cuya duración ha expirado en el turno actual.
   * Los modifiers permanentes (duration === -1) nunca se eliminan.
   *
   * @param currentTurn - Número del turno actual en la partida.
   */
  removeExpiredModifiers(currentTurn: number): void {
    this.modifiers = this.modifiers.filter((m) => !m.isExpired(currentTurn, m.appliedAtTurn));
  }

  /**
   * Elimina todos los modifiers cuyo `source` coincida con el valor dado.
   * Útil para limpiar sinergias tribales o efectos de zona al abandonar el tablero.
   *
   * @param source - Identificador del origen a limpiar (ej. "synergy", "zone").
   */
  removeModifiersBySource(source: string): void {
    this.modifiers = this.modifiers.filter((m) => m.source !== source);
  }

  /**
   * Devuelve una vista de solo lectura del array de modifiers activos.
   *
   * @returns Array de modifiers (no modificable directamente).
   */
  getModifiers(): ReadonlyArray<Modifier> {
    return this.modifiers;
  }

  // -------------------------------------------------------------------------
  // Combate
  // -------------------------------------------------------------------------

  /**
   * Aplica daño al Personaje reduciendo su `currentHealth`.
   * La vida nunca baja de 0 (la destrucción la gestiona el CombatResolver).
   *
   * @param amount - Cantidad de daño a recibir (debe ser ≥ 0).
   */
  takeDamage(amount: number): void {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
  }

  /**
   * Indica si el Personaje sigue vivo en el tablero.
   *
   * @returns true si currentHealth > 0.
   */
  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  // -------------------------------------------------------------------------
  // Clonación
  // -------------------------------------------------------------------------

  /**
   * Crea una copia del Personaje con un nuevo `instanceId` y estado inicial limpio.
   * Se usa para instanciar múltiples copias del mismo tipo de carta en partida.
   *
   * El clon tiene:
   * - Nuevo `instanceId` (UUID v4 generado en el constructor de Card).
   * - `currentHealth` restaurado a `health` (vida máxima base).
   * - `isExhausted` = false.
   * - `hasAttackedThisTurn` = false.
   * - `modifiers` vacío.
   *
   * @returns Nueva instancia Character con los mismos datos base.
   */
  clone(): Character {
    return new Character({
      staticId: this.staticId,
      name: this.name,
      type: this.type,
      archetype: this.archetype,
      nostalgyCost: this.nostalgyCost,
      rarity: this.rarity,
      description: this.description,
      spriteKey: this.spriteKey,
      greetingText: this.greetingText,
      attack: this.attack,
      health: this.health,
      abilities: this.abilities,
    });
  }
}
