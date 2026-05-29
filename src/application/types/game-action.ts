/**
 * Acciones que el jugador puede emitir contra el MatchService.
 *
 * Es un discriminated union: el campo `type` discrimina entre acciones,
 * y cada variante lleva los parámetros que necesita el Command correspondiente.
 *
 * Estas acciones son el contrato entre la capa de Presentación (Phaser)
 * y la capa de Aplicación (MatchService). La presentación construye una
 * GameAction y la pasa a MatchService.handlePlayerAction(action).
 *
 * Referencia: docs/02-architecture.md §3.2 (Capa de Aplicación)
 */

import type { PlayerId, CardId } from "@domain/types/card-types";
import type { PlayerBoard } from "@domain/entities/match";

/**
 * Identificador de zona del tablero. Coincide con las claves de PlayerBoard
 * (left, center, right).
 */
export type ZoneId = keyof PlayerBoard;

/**
 * Acción: Jugar una carta desde la mano.
 * - playerId: jugador que ejecuta la acción.
 * - cardInstanceId: UUID de la instancia de carta en la mano.
 * - zoneId: zona del tablero donde se coloca (left, center o right).
 */
export interface PlayCardAction {
  readonly type: "PLAY_CARD";
  readonly playerId: PlayerId;
  readonly cardInstanceId: CardId;
  readonly zoneId: ZoneId;
}

/**
 * Acción: Atacar con un Personaje en la Fase de Combate.
 * - attackerId: UUID del Personaje atacante (en el tablero propio).
 * - defenderId: UUID del defensor (Personaje enemigo o héroe enemigo).
 */
export interface AttackAction {
  readonly type: "ATTACK";
  readonly attackerId: CardId;
  readonly defenderId: CardId;
}

/**
 * Acción: Terminar el turno del jugador activo.
 * - playerId: jugador que termina su turno (debe ser el activo).
 */
export interface EndTurnAction {
  readonly type: "END_TURN";
  readonly playerId: PlayerId;
}

/**
 * Acción: Usar la habilidad especial del héroe.
 * - playerId: jugador que usa la habilidad (debe ser el activo).
 * - targetId: objetivo de la habilidad. `instanceId` de un Personaje o
 *   `staticId` de un héroe. `undefined` para habilidades sin objetivo.
 */
export interface UseHeroPowerAction {
  readonly type: "USE_HERO_POWER";
  readonly playerId: PlayerId;
  readonly targetId?: CardId;
}

/**
 * Acción: Activar la mecánica Crossover (robo de carta del mazo rival).
 * - playerId: jugador que activa el Crossover (debe ser el activo).
 */
export interface ActivateCrossoverAction {
  readonly type: "ACTIVATE_CROSSOVER";
  readonly playerId: PlayerId;
}

/**
 * Unión discriminada de todas las acciones del jugador.
 */
export type GameAction =
  | PlayCardAction
  | AttackAction
  | EndTurnAction
  | UseHeroPowerAction
  | ActivateCrossoverAction;
