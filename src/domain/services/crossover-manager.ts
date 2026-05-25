import type { IEventBus } from "@domain/events/event-bus";
import { GameEvent } from "@domain/events/game-event";
import type { Deck } from "@domain/entities/deck";
import type { Hand } from "@domain/entities/hand";
import type { Character } from "@domain/entities/character";

/**
 * Gestor del Sistema Crossover (Mecánica M5).
 * Permite a cada jugador robar exactamente 1 carta del mazo rival por partida.
 */
export class CrossoverManager {
  private usedPlayers = new Set<string>();

  constructor(private readonly eventBus: IEventBus) {}

  /**
   * Activa la mecánica Crossover para un jugador.
   *
   * @param playerId ID del jugador que usa el Crossover.
   * @param opponentDeck Mazo del rival (del cual se extraerá la carta).
   * @param playerHand Mano del jugador (donde se añadirá la carta).
   * @throws {Error} Si el jugador ya ha usado su Crossover en esta partida.
   * @throws {Error} Si el mazo del rival está vacío (no consume el uso).
   */
  public activate(playerId: string, opponentDeck: Deck, playerHand: Hand): void {
    if (this.usedPlayers.has(playerId)) {
      throw new Error(
        `El jugador ${playerId} ya ha utilizado la habilidad Crossover en esta partida.`,
      );
    }

    if (opponentDeck.isEmpty()) {
      throw new Error(`No se puede activar Crossover: el mazo del rival está vacío.`);
    }

    const stolenCard = opponentDeck.draw();

    // Fallback defensivo: draw() devolvió null a pesar de isEmpty()
    if (!stolenCard) {
      throw new Error(`No se pudo robar la carta del mazo rival.`);
    }

    // Registramos que el jugador consumió su habilidad (M5)
    this.usedPlayers.add(playerId);

    const result = playerHand.add(stolenCard);
    const wasDestroyed = !result.ok; // Si no es OK, es que dio "hand_full"

    // Emitir el evento de dominio
    this.eventBus.emit(GameEvent.CrossoverActivated, {
      playerId,
      stolenCard: stolenCard as unknown as Character,
      wasDestroyed,
    });
  }

  /**
   * Verifica si un jugador ya ha usado la habilidad Crossover.
   */
  public hasUsedCrossover(playerId: string): boolean {
    return this.usedPlayers.has(playerId);
  }
}
