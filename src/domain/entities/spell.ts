/**
 * Entidad Spell — Crossover Cards
 *
 * Representa una carta de Hechizo. Los hechizos no ocupan slot de tablero:
 * se resuelven de forma inmediata al ser jugados y van al cementerio.
 *
 * Referencia:
 *   - docs/02-architecture.md §3.1.1 (entidad Spell)
 *   - docs/04-card-catalog.md §9.2 (esquema JSON Hechizo — Cangreburger)
 *
 * Decisiones de diseño:
 *   - Todos los campos son readonly: un Hechizo no muta su definición.
 *   - `effectType` y `targetType` son strings en lugar de enums para que la
 *     CardFactory pueda instanciar hechizos desde JSON sin necesitar un mapeo
 *     adicional. Si el conjunto de tipos crece, se migra a enum en una refactori-
 *     zación posterior (OCP).
 *   - `drawCount` es opcional porque la mayoría de hechizos no roban cartas.
 */

import { Card } from "@domain/entities/card";
import type { CardProps } from "@domain/entities/card";

// ---------------------------------------------------------------------------
// Props de construcción
// ---------------------------------------------------------------------------

/**
 * Props de entrada para construir un Spell.
 * Extiende CardProps con los campos propios de los hechizos.
 */
export interface SpellProps extends CardProps {
  /**
   * Tipo de efecto que produce el hechizo.
   * Ejemplos del catálogo: "HealAndDraw", "Damage", "AOE".
   */
  readonly effectType: string;

  /**
   * Tipo de objetivo del hechizo.
   * Ejemplos: "Self" (héroe aliado), "Any" (héroe o Personaje), "AllEnemies".
   */
  readonly targetType: string;

  /** Magnitud numérica del efecto (PV curados, daño infligido, etc.). */
  readonly effectValue: number;

  /**
   * Número de cartas que roba el jugador al resolver el hechizo.
   * Solo presente en hechizos con efecto de robo (ej. Cangreburger: drawCount = 1).
   */
  readonly drawCount?: number;
}

// ---------------------------------------------------------------------------
// Entidad Spell
// ---------------------------------------------------------------------------

/**
 * Carta de Hechizo de efecto inmediato.
 *
 * Se instancia y se destruye en el mismo turno en que se juega.
 * El `CombatResolver` o el comando `PlayCardCommand` leen `effectType`,
 * `targetType` y `effectValue` para resolver el efecto correspondiente.
 */
export class Spell extends Card {
  /** Tipo de efecto del hechizo (ej. "HealAndDraw", "Damage"). */
  readonly effectType: string;

  /** Tipo de objetivo del hechizo (ej. "Self", "Any", "AllEnemies"). */
  readonly targetType: string;

  /** Magnitud numérica del efecto principal. */
  readonly effectValue: number;

  /**
   * Número de cartas a robar al resolver el hechizo.
   * `undefined` si el hechizo no incluye robo de cartas.
   */
  readonly drawCount: number | undefined;

  constructor(props: SpellProps) {
    super(props);
    this.effectType = props.effectType;
    this.targetType = props.targetType;
    this.effectValue = props.effectValue;
    this.drawCount = props.drawCount;
  }

  /**
   * Crea una copia del Hechizo con un nuevo `instanceId`.
   * Todos los campos son idénticos al original (sin estado mutable que resetear).
   *
   * @returns Nueva instancia Spell con los mismos datos.
   */
  clone(): Spell {
    return new Spell({
      staticId: this.staticId,
      name: this.name,
      type: this.type,
      archetype: this.archetype,
      nostalgyCost: this.nostalgyCost,
      rarity: this.rarity,
      description: this.description,
      spriteKey: this.spriteKey,
      greetingText: this.greetingText,
      effectType: this.effectType,
      targetType: this.targetType,
      effectValue: this.effectValue,
      drawCount: this.drawCount,
    });
  }
}
