/**
 * GameStateSnapshot — Crossover Cards
 *
 * Vista inmutable del estado de la partida en un instante concreto.
 * La IA nunca accede al objeto `Match` directamente: solo recibe un
 * `GameStateSnapshot` de solo lectura que describe el tablero, los
 * recursos y la fase actual.
 *
 * Principios aplicados:
 *   - Todos los campos son `readonly` para garantizar inmutabilidad.
 *   - `createSnapshot` es una función pura: no muta el `Match` ni
 *     ninguna de sus entidades.
 *   - Sin dependencias de Phaser ni de capas externas al dominio.
 *
 * Referencias:
 *   - docs/02-architecture.md §3.1.4 (IA del oponente)
 *   - docs/02-architecture.md §8 (Estrategia de IA del rival)
 *   - docs/decisions/ADR-007-patron-strategy-ia.md
 */

import type { Card } from "@domain/entities/card";
import type { Character } from "@domain/entities/character";
import type { Match, PlayerState } from "@domain/entities/match";
import type { IHeroPower } from "@domain/entities/hero";
import type { TurnPhase } from "@domain/events/game-event";
import type { PlayerId } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Tipo GameStateSnapshot
// ---------------------------------------------------------------------------

/**
 * Vista completamente inmutable del estado de la partida para la IA.
 *
 * Contiene toda la información que una estrategia de IA puede necesitar
 * para planificar sus acciones durante la Fase Principal y la Fase de
 * Combate, sin exponer referencias mutables al `Match` subyacente.
 *
 * Campos de tablero:
 *   - `aiBoard`: array de filas, una por zona (left=[0], center=[1], right=[2]).
 *   - `opponentBoard`: ídem para el oponente.
 *
 * Campos de recursos pendientes de implementación en `PlayerState`:
 *   Los campos `nostalgiaCurrent`, `nostalgiaMax`, `momentumActive`,
 *   `momentumCharges` y `crossoverAvailable` no existen aún en la entidad
 *   `PlayerState`. `createSnapshot` los inicializa a valores neutros (0 /
 *   false) hasta que esas propiedades sean añadidas al dominio.
 *   Esta decisión permite avanzar en la implementación de la IA sin
 *   bloquear la implementación paralela de NostalgiaSystem y MomentumSystem.
 */
export interface GameStateSnapshot {
  /** ID del jugador que controla la IA. */
  readonly aiPlayerId: PlayerId;

  /** ID del jugador humano (oponente de la IA). */
  readonly opponentPlayerId: PlayerId;

  // -- Vida de los héroes ----------------------------------------------------

  /** Puntos de vida actuales del héroe de la IA. */
  readonly aiHeroHealth: number;

  /** Puntos de vida máximos del héroe de la IA. */
  readonly aiHeroMaxHealth: number;

  /** Puntos de vida actuales del héroe del oponente. */
  readonly opponentHeroHealth: number;

  /** Puntos de vida máximos del héroe del oponente. */
  readonly opponentHeroMaxHealth: number;

  /**
   * `staticId` del héroe del oponente (ej. "HERO-001"). Es el `targetId` con el
   * que se identifica al héroe rival como objetivo del poder de héroe (contrato
   * unificado con la presentación y el HeroPowerResolver).
   */
  readonly opponentHeroStaticId: string;

  // -- Poder de héroe de la IA -----------------------------------------------

  /**
   * Definición declarativa del poder del héroe de la IA (effectType, value,
   * coste, etc.). Permite a la estrategia decidir si usarlo y contra qué
   * objetivo sin acceder al `Match`.
   */
  readonly aiHeroPower: IHeroPower;

  // -- Mano de la IA ---------------------------------------------------------

  /**
   * Cartas en la mano de la IA en este momento.
   * La IA conoce su propia mano, pero no la del oponente.
   */
  readonly aiHand: readonly Card[];

  // -- Tablero ---------------------------------------------------------------

  /**
   * Personajes en el tablero de la IA, agrupados por zona.
   * Índice 0 → zona izquierda, 1 → zona central, 2 → zona derecha.
   */
  readonly aiBoard: readonly (readonly Character[])[];

  /**
   * Personajes en el tablero del oponente, agrupados por zona.
   * Índice 0 → zona izquierda, 1 → zona central, 2 → zona derecha.
   */
  readonly opponentBoard: readonly (readonly Character[])[];

  // -- Recursos de Nostalgia (M1) --------------------------------------------

  /** Nostalgia disponible actualmente para la IA en este turno. */
  readonly nostalgiaCurrent: number;

  /** Nostalgia máxima del turno de la IA. */
  readonly nostalgiaMax: number;

  // -- Momentum (M2) ---------------------------------------------------------

  /**
   * Indica si la IA está en estado Momentum (vida del héroe ≤ 15 PV).
   * Cuando está activo, la IA puede acumular cargas de Momentum.
   */
  readonly momentumActive: boolean;

  /**
   * Número de cargas de Momentum disponibles para convertir a Nostalgia.
   * Solo relevante cuando `momentumActive` es true.
   */
  readonly momentumCharges: number;

  // -- Crossover (M5) --------------------------------------------------------

  /**
   * Indica si la mecánica Crossover todavía está disponible para la IA.
   * Es un uso único por partida: false si ya se ha activado.
   */
  readonly crossoverAvailable: boolean;

  // -- Fase del turno --------------------------------------------------------

  /**
   * Fase del turno activa en el momento del snapshot.
   * La IA solo actúa durante las fases "main" y "combat".
   */
  readonly currentPhase: TurnPhase;
}

// ---------------------------------------------------------------------------
// Función pura createSnapshot
// ---------------------------------------------------------------------------

/**
 * Construye un `GameStateSnapshot` inmutable a partir del estado actual
 * de la partida, desde el punto de vista de la IA (`aiPlayerId`).
 *
 * La función es pura: no tiene efectos secundarios y no muta ningún
 * campo de `match`. Todos los arrays se copian con spread (`[...]`) para
 * romper la referencia al array original del `Match`.
 *
 * @param match       - Estado actual de la partida (no se muta).
 * @param aiPlayerId  - ID del jugador controlado por la IA.
 *                      Puede ser `match.player1.playerId` o
 *                      `match.player2.playerId`.
 * @returns Un `GameStateSnapshot` completamente readonly.
 *
 * @example
 * ```ts
 * const snapshot = createSnapshot(match, "player-2");
 * const cheapest = snapshot.aiHand
 *   .filter(c => c.nostalgyCost <= snapshot.nostalgiaCurrent)
 *   .sort((a, b) => b.nostalgyCost - a.nostalgyCost);
 * ```
 */
export function createSnapshot(
  match: Match,
  aiPlayerId: PlayerId,
  nostalgiaCurrent: number = 0,
  nostalgiaMax: number = 0,
  crossoverAvailable: boolean = false,
): GameStateSnapshot {
  // Identifica qué PlayerState corresponde a la IA y cuál al oponente.
  const isAiPlayer1 = match.player1.playerId === aiPlayerId;

  const aiState: PlayerState = isAiPlayer1 ? match.player1 : match.player2;
  const opponentState: PlayerState = isAiPlayer1 ? match.player2 : match.player1;

  // -- Tablero de la IA (copia defensiva de cada zona) ----------------------
  const aiBoard: readonly (readonly Character[])[] = [
    [...aiState.board.left],
    [...aiState.board.center],
    [...aiState.board.right],
  ];

  // -- Tablero del oponente (copia defensiva de cada zona) ------------------
  const opponentBoard: readonly (readonly Character[])[] = [
    [...opponentState.board.left],
    [...opponentState.board.center],
    [...opponentState.board.right],
  ];

  // -- Mano de la IA (copia defensiva) --------------------------------------
  const aiHand: readonly Card[] = [...aiState.hand.getCards()];

  return {
    aiPlayerId,
    opponentPlayerId: opponentState.playerId,

    aiHeroHealth: aiState.hero.currentHealth,
    aiHeroMaxHealth: aiState.hero.maxHealth,
    opponentHeroHealth: opponentState.hero.currentHealth,
    opponentHeroMaxHealth: opponentState.hero.maxHealth,
    opponentHeroStaticId: opponentState.hero.staticId,

    aiHeroPower: aiState.hero.heroPower,

    aiHand,
    aiBoard,
    opponentBoard,

    nostalgiaCurrent,
    nostalgiaMax,

    // Momentum pendiente de integración en PlayerState: valores neutros.
    momentumActive: false,
    momentumCharges: 0,

    crossoverAvailable,

    currentPhase: match.currentPhase,
  };
}
