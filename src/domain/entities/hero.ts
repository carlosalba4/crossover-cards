/**
 * Entidad Hero — Crossover Cards
 *
 * Representa al héroe de un jugador. Es una entidad independiente que NO
 * extiende Card: los héroes no son cartas jugables desde la mano, sino
 * avatares permanentes de la partida con vida propia y habilidad de héroe.
 *
 * Referencia:
 *   - docs/02-architecture.md §3.1.1 (tabla Hero)
 *   - docs/02-architecture.md §5.1 (esquema JSON HeroData)
 *   - docs/04-card-catalog.md §7 (habilidades: Hechizo Ancestral / Tornado de Fuego)
 *
 * Decisiones de diseño:
 *   - `IHeroPower` es una interfaz inyectable: el constructor recibe cualquier
 *     objeto que la implemente, lo que facilita el testing sin dependencias
 *     concretas y cumple el Dependency Inversion Principle (SOLID §11.5).
 *   - La lógica del efecto de `heroPower` reside en el servicio de dominio
 *     correspondiente (ej. `TurnEngine`). `Hero.useHeroPower()` solo marca
 *     el flag de uso; respetar el SRP (una sola razón para cambiar).
 *   - `equippedItem` es `Item | null` para soportar el Omnitrix (AXE-010)
 *     y la Espada de Sangre de Demonio (LIC-010) sin acoplar Hero a ningún
 *     tipo concreto de objeto.
 *   - `heal()` está limitada por `maxHealth` para evitar superar el máximo
 *     establecido en el JSON del héroe.
 */

import type { Archetype } from "@domain/types/card-types";
import type { Item } from "@domain/entities/item";

// ---------------------------------------------------------------------------
// Habilidad de héroe (inyectable)
// ---------------------------------------------------------------------------

/**
 * Contrato de la habilidad de héroe.
 *
 * Es inyectable: cualquier objeto literal o clase que implemente esta interfaz
 * puede pasarse al constructor de Hero. Esto permite mockear la heroPower en
 * tests sin necesidad de un repositorio de datos.
 *
 * Ejemplos del catálogo (docs/04 §7):
 * - El Lich → Hechizo Ancestral: effectType "Damage", targetType "Any", value 2, cost 2.
 * - Axel Blaze → Tornado de Fuego: effectType "AttackBuff", targetType "AlliedCharacter", value 2, cost 2.
 */
export interface IHeroPower {
  /** Nombre para mostrar en la UI. */
  readonly name: string;
  /** Coste de Nostalgia para activarla. */
  readonly nostalgyCost: number;
  /**
   * Tipo de efecto que produce.
   * Ejemplos: "Damage", "AttackBuff".
   */
  readonly effectType: string;
  /**
   * Tipo de objetivo de la habilidad.
   * Ejemplos: "Any" (héroe o Personaje), "AlliedCharacter".
   */
  readonly targetType: string;
  /** Magnitud numérica del efecto (daño, buff de ATQ, etc.). */
  readonly value: number;
}

// ---------------------------------------------------------------------------
// Props de construcción
// ---------------------------------------------------------------------------

/**
 * Props de entrada para construir un Hero.
 */
export interface HeroProps {
  /** ID estático del héroe tal como aparece en el JSON (ej. "HERO-001"). */
  readonly staticId: string;
  readonly name: string;
  readonly archetype: Archetype;
  /** Puntos de vida máximos. Se usa como valor inicial de currentHealth. */
  readonly maxHealth: number;
  /** Habilidad de héroe inyectable. */
  readonly heroPower: IHeroPower;
}

// ---------------------------------------------------------------------------
// Entidad Hero
// ---------------------------------------------------------------------------

/**
 * Héroe de un jugador en una partida de Crossover Cards.
 *
 * Ciclo de vida de la heroPower por turno:
 * 1. `hasUsedHeroPowerThisTurn` comienza en `false` al inicio del turno (via `resetTurn()`).
 * 2. El jugador activa la habilidad → el servicio valida coste de Nostalgia.
 * 3. Se llama a `useHeroPower()` → `hasUsedHeroPowerThisTurn = true`.
 * 4. El efecto lo resuelve el servicio de dominio leyendo `heroPower.effectType`.
 * 5. Al inicio del siguiente turno, `resetTurn()` vuelve a poner el flag en `false`.
 */
export class Hero {
  /** ID estático del héroe (ej. "HERO-001"). */
  readonly staticId: string;

  readonly name: string;
  readonly archetype: Archetype;

  /** Puntos de vida máximos (inmutable; definido en el JSON). */
  readonly maxHealth: number;

  /** Habilidad de héroe inyectable. */
  readonly heroPower: IHeroPower;

  /** Puntos de vida actuales en partida. Inicializado a `maxHealth`. */
  currentHealth: number;

  /**
   * Indica si el jugador ya usó la habilidad de héroe en este turno.
   * Se resetea al inicio de cada turno con `resetTurn()`.
   */
  hasUsedHeroPowerThisTurn: boolean;

  /**
   * Objeto actualmente equipado al héroe.
   * `null` si no hay ningún objeto equipado.
   */
  equippedItem: Item | null;

  constructor(props: HeroProps) {
    this.staticId = props.staticId;
    this.name = props.name;
    this.archetype = props.archetype;
    this.maxHealth = props.maxHealth;
    this.heroPower = props.heroPower;
    this.currentHealth = props.maxHealth;
    this.hasUsedHeroPowerThisTurn = false;
    this.equippedItem = null;
  }

  // -------------------------------------------------------------------------
  // Vida
  // -------------------------------------------------------------------------

  /**
   * Aplica daño al héroe reduciendo su `currentHealth`.
   * La vida nunca baja de 0 (el fin de partida lo detecta el MatchService).
   *
   * @param amount - Cantidad de daño a recibir (debe ser ≥ 0).
   */
  takeDamage(amount: number): void {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
  }

  /**
   * Cura al héroe aumentando su `currentHealth`.
   * La vida nunca supera `maxHealth`.
   *
   * @param amount - Cantidad de PV a recuperar (debe ser ≥ 0).
   */
  heal(amount: number): void {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }

  /**
   * Indica si el héroe sigue vivo en la partida.
   *
   * @returns true si `currentHealth > 0`.
   */
  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  // -------------------------------------------------------------------------
  // Turno
  // -------------------------------------------------------------------------

  /**
   * Resetea el estado de uso de la habilidad de héroe al inicio de un nuevo turno.
   * Debe llamarse al entrar en la fase DrawPhase del turno del jugador.
   */
  resetTurn(): void {
    this.hasUsedHeroPowerThisTurn = false;
  }

  // -------------------------------------------------------------------------
  // Objeto equipado
  // -------------------------------------------------------------------------

  /**
   * Equipa un objeto al héroe.
   * Si ya hay un objeto equipado, lo reemplaza (el objeto anterior se descarta).
   * La lógica de descarte/cementerio la gestiona el servicio de dominio.
   *
   * @param item - Objeto a equipar.
   */
  equipItem(item: Item): void {
    this.equippedItem = item;
  }

  /**
   * Desequipa el objeto actual del héroe.
   * Se llama cuando el objeto se rompe (`isBroken()`) o es eliminado.
   */
  unequipItem(): void {
    this.equippedItem = null;
  }

  // -------------------------------------------------------------------------
  // Habilidad de héroe
  // -------------------------------------------------------------------------

  /**
   * Marca la habilidad de héroe como usada en este turno.
   * El efecto real lo resuelve el servicio de dominio (SRP):
   * Hero solo gestiona el estado del flag de uso.
   *
   * Precondición: el llamante debe haber validado que
   * `!hasUsedHeroPowerThisTurn` y que hay Nostalgia suficiente.
   */
  useHeroPower(): void {
    this.hasUsedHeroPowerThisTurn = true;
  }
}
