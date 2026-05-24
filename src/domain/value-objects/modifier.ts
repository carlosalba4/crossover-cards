/**
 * Value object Modifier — Crossover Cards
 *
 * Representa un buff o debuff temporal que puede aplicarse a un Personaje.
 * Encapsula origen, magnitud de cambio de stats, habilidades concedidas
 * y duración en turnos.
 *
 * Referencia:
 *   - docs/02-architecture.md §4.8 (Modifier[] frente a Decorator)
 *   - docs/02-architecture.md §3.1.1 (entidad Modifier)
 *   - docs/04-card-catalog.md §9.4 (pool de modifiers de Patricio Estrella)
 *
 * Decisión de diseño: todos los campos son `readonly` para garantizar
 * inmutabilidad del value object; el objeto no muta su estado tras crearse.
 * El turno de aplicación se guarda en `appliedAtTurn` para que `isExpired`
 * pueda calcularse sin depender de estado externo.
 */

import type { Ability } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Interfaz pública
// ---------------------------------------------------------------------------

/**
 * Contrato de un modificador de carta.
 *
 * Un Modifier es un value object inmutable. La entidad Character mantiene
 * un array `modifiers: IModifier[]` y recalcula sus stats efectivos en cada
 * consulta (ver Character.getEffectiveAttack / getEffectiveHealth).
 */
export interface IModifier {
  /** Identificador del origen del modifier. Ej. "synergy", "zone", "patricio_random". */
  readonly source: string;

  /** Modificación de ATQ (puede ser negativo). */
  readonly attackBonus: number;

  /** Modificación de VID máxima (puede ser negativo). */
  readonly healthBonus: number;

  /** Habilidades temporales concedidas mientras el modifier esté activo. */
  readonly abilitiesGranted: ReadonlyArray<Ability>;

  /**
   * Duración en turnos.
   * - `-1`: permanente (nunca expira).
   * - `0`: efecto de un solo disparo; expira inmediatamente tras aplicarse.
   * - `N > 0`: expira cuando `currentTurn - appliedAtTurn >= N`.
   */
  readonly duration: number;

  /**
   * Devuelve true si el modifier ya ha expirado.
   *
   * @param currentTurn   - Número del turno actual en la partida.
   * @param appliedAtTurn - Turno en el que se aplicó este modifier.
   */
  isExpired(currentTurn: number, appliedAtTurn: number): boolean;
}

// ---------------------------------------------------------------------------
// Propiedades de construcción
// ---------------------------------------------------------------------------

/**
 * Conjunto de propiedades necesarias para construir un Modifier.
 * No incluye `appliedAtTurn`, que se recibe en el constructor.
 */
export interface ModifierProps {
  readonly source: string;
  readonly attackBonus: number;
  readonly healthBonus: number;
  readonly abilitiesGranted: ReadonlyArray<Ability>;
  readonly duration: number;
  /** Turno de partida en el que se aplica este modifier. */
  readonly appliedAtTurn: number;
}

// ---------------------------------------------------------------------------
// Implementación concreta
// ---------------------------------------------------------------------------

/**
 * Implementación concreta del value object IModifier.
 *
 * Ejemplos de uso:
 * ```ts
 * // Sinergia tribal temporal de 1 turno
 * const synergy = new Modifier({
 *   source: "synergy",
 *   attackBonus: 2,
 *   healthBonus: 0,
 *   abilitiesGranted: [],
 *   duration: 1,
 *   appliedAtTurn: 3,
 * });
 *
 * // Modifier permanente (duration = -1)
 * const perm = new Modifier({ source: "patricio_random", attackBonus: 2,
 *   healthBonus: 0, abilitiesGranted: [], duration: -1, appliedAtTurn: 2 });
 * ```
 */
export class Modifier implements IModifier {
  readonly source: string;
  readonly attackBonus: number;
  readonly healthBonus: number;
  readonly abilitiesGranted: ReadonlyArray<Ability>;
  readonly duration: number;

  /**
   * Turno de partida en el que se aplicó este modifier.
   * Necesario para calcular `isExpired` sin depender de estado externo.
   */
  readonly appliedAtTurn: number;

  constructor(props: ModifierProps) {
    this.source = props.source;
    this.attackBonus = props.attackBonus;
    this.healthBonus = props.healthBonus;
    // Copia defensiva del array para garantizar inmutabilidad del value object
    this.abilitiesGranted = [...props.abilitiesGranted];
    this.duration = props.duration;
    this.appliedAtTurn = props.appliedAtTurn;
  }

  /**
   * Determina si el modifier ha expirado dado el turno actual.
   *
   * Lógica:
   * - `duration === -1`: permanente, nunca expira → false.
   * - `duration === 0`: efecto one-shot, expira de inmediato → true.
   * - `duration > 0`: expira cuando `currentTurn - appliedAtTurn >= duration`.
   *
   * @param currentTurn   - Número del turno actual en la partida.
   * @param appliedAtTurn - Turno en el que se aplicó este modifier.
   */
  isExpired(currentTurn: number, appliedAtTurn: number): boolean {
    if (this.duration === -1) {
      return false; // Permanente: nunca expira
    }
    return currentTurn - appliedAtTurn >= this.duration;
  }
}
