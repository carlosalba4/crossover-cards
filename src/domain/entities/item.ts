/**
 * Entidad Item — Crossover Cards
 *
 * Representa una carta de Objeto equipable al héroe aliado. Los objetos
 * tienen durabilidad: cada activación de su efecto consume 1 de durabilidad,
 * y cuando llega a 0 se destruyen.
 *
 * Referencia:
 *   - docs/02-architecture.md §3.1.1 (entidad Item)
 *   - docs/04-card-catalog.md §9.3 (esquema JSON Objeto — Espada de Sangre de Demonio)
 *   - docs/04-card-catalog.md §6 (Bola de Dragón coste 5, Omnitrix coste 4)
 *
 * Decisiones de diseño:
 *   - `durability` es readonly (el máximo de la carta); `currentDurability` es
 *     mutable (estado en partida). Esta separación sigue el mismo patrón que
 *     `health` / `currentHealth` en Character.
 *   - `abilityGranted` admite `null` (no todos los objetos conceden habilidades).
 *   - `onTurnStartEffect` es opcional: solo la Espada de Sangre de Demonio lo usa.
 *   - `statModifier` agrupa los bonuses de ATQ y VID del objeto en un objeto
 *     compuesto para facilitar la lectura en la CardFactory.
 */

import { Card } from "@domain/entities/card";
import type { CardProps } from "@domain/entities/card";
import type { Ability } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

/** Bonificación de stats que otorga el objeto al héroe equipado. */
export interface StatModifier {
  readonly attackBonus: number;
  readonly healthBonus: number;
}

/**
 * Efecto que se activa al inicio de cada turno del jugador mientras
 * el objeto esté equipado.
 * Ejemplo: `{ type: "DamageOwner", value: 1 }` para la Espada de Sangre de Demonio.
 */
export interface TurnStartEffect {
  /** Tipo de efecto. Ej. "DamageOwner", "HealOwner". */
  readonly type: string;
  /** Magnitud numérica del efecto. */
  readonly value: number;
}

// ---------------------------------------------------------------------------
// Props de construcción
// ---------------------------------------------------------------------------

/**
 * Props de entrada para construir un Item.
 * Extiende CardProps con los campos propios de los objetos equipables.
 */
export interface ItemProps extends CardProps {
  /**
   * Tipo de objetivo del objeto.
   * Ejemplo: "Hero" (se equipa al héroe aliado).
   */
  readonly targetType: string;

  /** Bonificación de stats que otorga el objeto al héroe mientras esté equipado. */
  readonly statModifier: StatModifier;

  /**
   * Habilidad concedida al héroe mientras el objeto esté equipado.
   * `null` si el objeto no concede ninguna habilidad.
   */
  readonly abilityGranted: Ability | null;

  /** Durabilidad máxima del objeto (número de usos antes de destruirse). */
  readonly durability: number;

  /**
   * Efecto que se activa al inicio de cada turno propio mientras esté equipado.
   * `undefined` si el objeto no tiene efecto de inicio de turno.
   */
  readonly onTurnStartEffect?: TurnStartEffect;
}

// ---------------------------------------------------------------------------
// Entidad Item
// ---------------------------------------------------------------------------

/**
 * Carta de Objeto equipable al héroe.
 *
 * Ciclo de vida en partida:
 * 1. Se juega desde la mano (`PlayCardCommand`) → se equipa al héroe.
 * 2. Cada vez que su efecto se activa, se llama a `use()`.
 * 3. Cuando `isBroken()` devuelve true, el objeto se destruye y se retira.
 */
export class Item extends Card {
  /** Tipo de objetivo del objeto (ej. "Hero"). */
  readonly targetType: string;

  /** Bonificación de stats que otorga al héroe equipado. */
  readonly statModifier: StatModifier;

  /**
   * Habilidad concedida al héroe mientras está equipado.
   * `null` si no concede ninguna habilidad.
   */
  readonly abilityGranted: Ability | null;

  /** Durabilidad máxima (número de usos; valor estático del JSON). */
  readonly durability: number;

  /**
   * Efecto de inicio de turno.
   * `undefined` si el objeto no tiene este efecto.
   */
  readonly onTurnStartEffect: TurnStartEffect | undefined;

  /**
   * Durabilidad actual en partida. Se reduce en 1 con cada llamada a `use()`.
   * Se inicializa igual que `durability`.
   */
  currentDurability: number;

  constructor(props: ItemProps) {
    super(props);
    this.targetType = props.targetType;
    // Copia defensiva del statModifier para garantizar inmutabilidad
    this.statModifier = { ...props.statModifier };
    this.abilityGranted = props.abilityGranted;
    this.durability = props.durability;
    this.onTurnStartEffect =
      props.onTurnStartEffect !== undefined ? { ...props.onTurnStartEffect } : undefined;
    this.currentDurability = props.durability;
  }

  // -------------------------------------------------------------------------
  // Durabilidad
  // -------------------------------------------------------------------------

  /**
   * Consume 1 punto de durabilidad al activar el efecto del objeto.
   * Si la durabilidad ya es 0, no hace nada (el objeto ya está roto).
   */
  use(): void {
    if (this.currentDurability > 0) {
      this.currentDurability -= 1;
    }
  }

  /**
   * Indica si el objeto se ha agotado y debe destruirse.
   *
   * @returns true si `currentDurability <= 0`.
   */
  isBroken(): boolean {
    return this.currentDurability <= 0;
  }

  // -------------------------------------------------------------------------
  // Clonación
  // -------------------------------------------------------------------------

  /**
   * Crea una copia del Objeto con un nuevo `instanceId` y durabilidad restaurada.
   *
   * El clon tiene:
   * - Nuevo `instanceId` (UUID v4 generado en el constructor de Card).
   * - `currentDurability` restaurada al valor máximo `durability`.
   *
   * @returns Nueva instancia Item con los mismos datos base.
   */
  clone(): Item {
    return new Item({
      staticId: this.staticId,
      name: this.name,
      type: this.type,
      archetype: this.archetype,
      nostalgyCost: this.nostalgyCost,
      rarity: this.rarity,
      description: this.description,
      spriteKey: this.spriteKey,
      greetingText: this.greetingText,
      targetType: this.targetType,
      statModifier: this.statModifier,
      abilityGranted: this.abilityGranted,
      durability: this.durability,
      onTurnStartEffect: this.onTurnStartEffect,
    });
  }
}
