/**
 * Entidad Deck — Crossover Cards
 *
 * Colección ordenada de cartas que representa el mazo de un jugador.
 * Encapsula las operaciones de barajado (Fisher-Yates), robo y consulta
 * sin ninguna dependencia de Phaser ni de librerías externas.
 *
 * Referencia:
 *   - docs/02-architecture.md §3.1.1 (tabla de entidades, Deck)
 *   - docs/02-architecture.md §5.1  (esquema JSON DeckData)
 *   - docs/02-architecture.md §5.2  (esquema TypeScript PlayerState.deck)
 *   - docs/04-card-catalog.md §3    (distribución de mazos por héroe)
 *
 * Decisiones de diseño:
 *   - El constructor recibe un `RngFn` inyectable para que los tests puedan
 *     reproducir barajados de forma determinista sin mockear Math.random.
 *   - `draw()` devuelve `null` en lugar de lanzar: la gestión del daño por
 *     fatiga es responsabilidad del servicio de dominio (DrawPhase / TurnEngine).
 *   - El array interno es una copia defensiva del array recibido para evitar
 *     mutación externa accidental (Principio de inmutabilidad del parámetro).
 *   - `toIdArray()` devuelve `staticId` (no `instanceId`) para serialización
 *     persistente compatible con el esquema DeckData del JSON.
 */

import type { Card } from "@domain/entities/card";

// ---------------------------------------------------------------------------
// Tipo público: función de aleatoriedad inyectable
// ---------------------------------------------------------------------------

/**
 * Función de aleatoriedad inyectable. Devuelve float en [0, 1). Por defecto: Math.random
 *
 * Permite sustituir el generador en tests para obtener barajados deterministas
 * y reproducibles sin tocar la implementación de producción.
 */
export type RngFn = () => number;

// ---------------------------------------------------------------------------
// Constante de límite arquitectónico
// ---------------------------------------------------------------------------

/**
 * Número máximo de cartas permitidas en un Deck.
 *
 * Este valor es el techo arquitectónico del juego para futuras expansiones.
 * El MVP usa mazos de 10 cartas por héroe, pero el límite de la entidad
 * no debe reducirse para no imponer restricciones en expansiones futuras.
 */
const MAX_DECK_SIZE = 30;

// ---------------------------------------------------------------------------
// Clase Deck
// ---------------------------------------------------------------------------

/**
 * Colección ordenada de cartas de un jugador.
 *
 * Representa el mazo en estado de juego. Expone operaciones de
 * barajado (Fisher-Yates), robo (draw), inspección (peek) y serialización.
 *
 * No contiene lógica de turnos, fatiga ni Nostalgia: esas responsabilidades
 * pertenecen a los servicios de dominio (SRP — Single Responsibility Principle).
 */
export class Deck {
  // TODO(MVP): el mazo actual del MVP tiene 10 cartas por héroe.
  // El límite máximo de la entidad (30) es el techo arquitectónico del
  // juego para futuras expansiones. No reducir este límite a 10.

  /** Colección interna de cartas en el orden actual del mazo. */
  private cards: Card[];

  /** Función de aleatoriedad inyectable. Permite tests deterministas. */
  private readonly rng: RngFn;

  /**
   * Crea un nuevo Deck a partir de un array de cartas.
   *
   * @param cards - Cartas del mazo. Se almacena una copia defensiva.
   * @param rng   - Función de aleatoriedad. Por defecto: Math.random.
   * @throws {RangeError} Si el número de cartas supera el límite arquitectónico (30).
   */
  constructor(cards: Card[], rng: RngFn = Math.random) {
    if (cards.length > MAX_DECK_SIZE) {
      throw new RangeError(
        `El mazo no puede tener más de ${MAX_DECK_SIZE} cartas. ` +
          `Se recibieron ${cards.length}.`,
      );
    }

    // Copia defensiva: evita que mutaciones externas del array original
    // afecten el estado interno del Deck.
    this.cards = [...cards];
    this.rng = rng;
  }

  // ---------------------------------------------------------------------------
  // Operaciones de barajado
  // ---------------------------------------------------------------------------

  /**
   * Baraja el mazo in-place usando el algoritmo Fisher-Yates (Knuth Shuffle).
   *
   * El RNG inyectable garantiza que dos llamadas con el mismo generador
   * producen el mismo resultado, lo que permite tests deterministas.
   *
   * Complejidad temporal: O(n).
   */
  shuffle(): void {
    const n = this.cards.length;

    for (let i = n - 1; i > 0; i--) {
      // Índice aleatorio en [0, i] (inclusive)
      const j = Math.floor(this.rng() * (i + 1));

      // Intercambio de posiciones
      const temp = this.cards[i];
      this.cards[i] = this.cards[j] as Card;
      this.cards[j] = temp as Card;
    }
  }

  // ---------------------------------------------------------------------------
  // Operaciones de robo
  // ---------------------------------------------------------------------------

  /**
   * Extrae y devuelve la primera carta del mazo.
   *
   * Devuelve `null` si el mazo está vacío. En ese caso, el servicio de turno
   * (DrawPhase / TurnEngine) es responsable de aplicar el daño por fatiga
   * y emitir el evento `DeckEmpty`.
   *
   * @returns La carta extraída, o `null` si el mazo está vacío.
   */
  draw(): Card | null {
    if (this.cards.length === 0) {
      return null;
    }

    // `shift()` extrae el elemento en índice 0; garantizado no-undefined por la
    // comprobación anterior. El cast es seguro: TypeScript no puede inferirlo
    // porque shift() devuelve `T | undefined` incluso tras la guarda de longitud.
    return this.cards.shift() as Card;
  }

  /**
   * Devuelve la primera carta del mazo sin extraerla.
   *
   * Útil para que la IA evalúe la siguiente carta sin modificar el estado.
   *
   * @returns La primera carta, o `null` si el mazo está vacío.
   */
  peek(): Card | null {
    return this.cards[0] ?? null;
  }

  // ---------------------------------------------------------------------------
  // Consultas de estado
  // ---------------------------------------------------------------------------

  /**
   * Devuelve el número de cartas restantes en el mazo.
   *
   * @returns Número de cartas (>= 0).
   */
  size(): number {
    return this.cards.length;
  }

  /**
   * Indica si el mazo está vacío.
   *
   * @returns `true` si no quedan cartas; `false` en caso contrario.
   */
  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  // ---------------------------------------------------------------------------
  // Serialización
  // ---------------------------------------------------------------------------

  /**
   * Devuelve un array con los `staticId` de las cartas en el orden actual del mazo.
   *
   * Compatible con el esquema JSON DeckData (`{ cardId, quantity }[]`) y con
   * el campo `PlayerState.deck: string[]` definido en la arquitectura (§5.2).
   *
   * @returns Array de staticId en el orden actual del mazo.
   */
  toIdArray(): string[] {
    return this.cards.map((card) => card.staticId);
  }
}
