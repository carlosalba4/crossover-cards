/**
 * Entidad Hand (Mano) — Crossover Cards
 *
 * Representa la mano de cartas de un jugador durante la partida.
 * Implementa la mecánica de "Hand Burn": si la mano tiene 10 cartas,
 * cualquier intento de robar/añadir una nueva carta falla silenciosamente
 * (la carta se "quema") en lugar de lanzar una excepción, siguiendo
 * las reglas del PRD.
 *
 * Utiliza el patrón Result<T, E> para el control de flujo sin excepciones,
 * cumpliendo con los principios de Clean Architecture.
 *
 * Referencias:
 *   - docs/01-prd.md (Mecánica Hand Burn: límite 10 cartas).
 *   - docs/02-architecture.md §3.1.1 (Tabla Hand).
 */

import type { Card } from "@domain/entities/card";

// ---------------------------------------------------------------------------
// Tipos auxiliares (Result Pattern)
// ---------------------------------------------------------------------------

/**
 * Patrón Result para control de flujo de errores esperados en el dominio,
 * evitando lanzar excepciones (que deberían reservarse para bugs inesperados).
 *
 * @template T Tipo del valor de retorno en caso de éxito.
 * @template E Tipo literal de string para el error.
 */
export type Result<T, E extends string> = { ok: true; value: T } | { ok: false; error: E };

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Tamaño máximo de la mano antes de que se active el Hand Burn. */
export const MAX_HAND_SIZE = 10;

// ---------------------------------------------------------------------------
// Entidad Hand
// ---------------------------------------------------------------------------

export class Hand {
  /**
   * Array interno de cartas. Es privado para evitar manipulaciones
   * que se salten las reglas de dominio (ej. Hand Burn).
   */
  private cards: Card[];

  constructor() {
    this.cards = [];
  }

  /**
   * Intenta añadir una carta a la mano.
   *
   * @param card La carta a añadir.
   * @returns Un objeto Result indicando éxito, o el error "hand_full" si
   * se ha alcanzado el límite (Hand Burn). En este último caso, la carta no se añade.
   */
  add(card: Card): Result<void, "hand_full"> {
    if (this.isFull()) {
      return { ok: false, error: "hand_full" };
    }

    this.cards.push(card);
    return { ok: true, value: undefined };
  }

  /**
   * Busca y elimina una carta de la mano por su identificador de instancia.
   *
   * @param instanceId El UUID único de la carta a retirar.
   * @returns La instancia de la carta si se encontró y retiró, o null si no existía.
   */
  remove(instanceId: string): Card | null {
    const index = this.cards.findIndex((c) => c.instanceId === instanceId);
    if (index === -1) {
      return null;
    }

    // splice modifica el array original y devuelve un array con los elementos eliminados
    const [removedCard] = this.cards.splice(index, 1);
    return removedCard;
  }

  /**
   * Busca una carta en la mano sin extraerla de la misma.
   *
   * @param instanceId El UUID único de la carta a buscar.
   * @returns La instancia de la carta si existe, o null.
   */
  find(instanceId: string): Card | null {
    return this.cards.find((c) => c.instanceId === instanceId) || null;
  }

  /**
   * Indica si la mano ha alcanzado su límite máximo de capacidad.
   * @returns true si el número de cartas es >= MAX_HAND_SIZE.
   */
  isFull(): boolean {
    return this.cards.length >= MAX_HAND_SIZE;
  }

  /**
   * Obtiene la cantidad de cartas que hay actualmente en la mano.
   */
  size(): number {
    return this.cards.length;
  }

  /**
   * Devuelve una referencia de solo lectura a las cartas de la mano.
   * Permite iterar y consultar las cartas sin poder modificar el array original.
   */
  getCards(): ReadonlyArray<Card> {
    return this.cards;
  }

  /**
   * Descarta la última carta añadida a la mano (operación LIFO/pop).
   * Puede usarse en mecánicas de descarte forzado o "quemar" del final.
   *
   * @returns La carta descartada, o null si la mano estaba vacía.
   */
  burn(): Card | null {
    if (this.cards.length === 0) {
      return null;
    }
    return this.cards.pop() || null;
  }
}
