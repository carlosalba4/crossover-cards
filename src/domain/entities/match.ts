import type { Hand } from "@domain/entities/hand";
import type { Character } from "@domain/entities/character";
import type { Hero } from "@domain/entities/hero";
import type { Deck } from "@domain/entities/deck";
import type { TurnPhase } from "@domain/events/game-event";

/**
 * Representa el estado del tablero de un jugador:
 * los Personajes colocados en las tres zonas (izquierda, centro, derecha).
 */
export interface PlayerBoard {
  left: Character[];
  center: Character[];
  right: Character[];
}

/**
 * Estado de un jugador dentro de una partida en curso.
 */
export interface PlayerState {
  readonly playerId: string;
  hand: Hand;
  board: PlayerBoard;
  hero: Hero;
  deck: Deck;
}

/**
 * Aggregate de estado de la partida. Contiene el estado de ambos jugadores
 * y la fase de turno actual. No contiene lógica: es un contenedor de datos
 * que los comandos y servicios leen y mutan.
 *
 * Referencia: docs/02-architecture.md §3.1 (entidades / aggregate root).
 */
export class Match {
  readonly player1: PlayerState;
  readonly player2: PlayerState;
  currentPhase: TurnPhase;
  activePlayerId: string;

  /** Número máximo de Personajes por zona en el tablero. */
  static readonly MAX_BOARD_SLOTS = 7;

  constructor(player1State: PlayerState, player2State: PlayerState) {
    this.player1 = player1State;
    this.player2 = player2State;
    this.currentPhase = "draw";
    this.activePlayerId = player1State.playerId;
  }

  /**
   * Obtiene el estado del jugador activo.
   */
  getActivePlayer(): PlayerState {
    return this.activePlayerId === this.player1.playerId ? this.player1 : this.player2;
  }

  /**
   * Obtiene el estado del jugador inactivo (oponente).
   */
  getInactivePlayer(): PlayerState {
    return this.activePlayerId === this.player1.playerId ? this.player2 : this.player1;
  }

  /**
   * Obtiene el total de Personajes en el tablero de un jugador.
   */
  getTotalBoardCount(player: PlayerState): number {
    return player.board.left.length + player.board.center.length + player.board.right.length;
  }

  /**
   * Añade un Personaje a una zona del tablero del jugador.
   * Zona por defecto: "center".
   */
  addCharacterToBoard(
    player: PlayerState,
    character: Character,
    zone: keyof PlayerBoard = "center",
  ): void {
    player.board[zone].push(character);
  }

  /**
   * Busca un Personaje por instanceId en el tablero de un jugador.
   */
  findCharacterOnBoard(player: PlayerState, instanceId: string): Character | null {
    for (const zone of ["left", "center", "right"] as (keyof PlayerBoard)[]) {
      const found = player.board[zone].find((c) => c.instanceId === instanceId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Devuelve todos los Personajes del tablero de un jugador (todas las zonas).
   */
  getAllBoardCharacters(player: PlayerState): Character[] {
    return [...player.board.left, ...player.board.center, ...player.board.right];
  }

  /**
   * Resetea el estado de combate de los Personajes del jugador activo al
   * iniciar su turno: vuelven a estar disponibles para atacar
   * (`isExhausted = false`, `hasAttackedThisTurn = false`).
   *
   * Esta lógica vive en el dominio porque es una regla del juego (el "despertar"
   * de los Personajes al inicio del turno), no una preocupación de presentación
   * ni de aplicación.
   *
   * Sobre la excepción "Personajes recién jugados sin Charge":
   * en el momento de iniciar el turno el tablero del jugador activo solo
   * contiene Personajes de turnos ANTERIORES (todavía no ha jugado nada este
   * turno). Los Personajes que juegue después en su Fase Principal quedan
   * exhaustos vía `PlayCardCommand` (salvo que tengan Charge), por lo que la
   * excepción se satisface de forma natural por el orden temporal y no requiere
   * marcar individualmente qué Personaje es "nuevo".
   */
  resetCombatStateForActivePlayer(): void {
    for (const character of this.getAllBoardCharacters(this.getActivePlayer())) {
      character.isExhausted = false;
      character.hasAttackedThisTurn = false;
    }
  }

  /**
   * Elimina un Personaje destruido del tablero de un jugador.
   */
  removeCharacterFromBoard(player: PlayerState, instanceId: string): void {
    for (const zone of ["left", "center", "right"] as (keyof PlayerBoard)[]) {
      player.board[zone] = player.board[zone].filter((c) => c.instanceId !== instanceId);
    }
  }
}
