import type { IDeckRepository } from "@domain/repositories/i-deck-repository";
import type { ICardRepository } from "@domain/repositories/i-card-repository";
import { Deck } from "@domain/entities/deck";
import { CardFactory } from "@domain/factories/card-factory";
import { ApplicationError } from "@application/errors/application-error";
import type { Card } from "@domain/entities/card";

export class DeckService {
  constructor(
    private readonly deckRepository: IDeckRepository,
    private readonly cardRepository: ICardRepository,
  ) {}

  /**
   * Construye un mazo (Deck) completo a partir de su ID.
   * Obtiene la receta del Deck y, para cada entrada, obtiene los datos de la carta
   * y genera las instancias de dominio correspondientes usando CardFactory.
   *
   * @param deckId ID estático del mazo (ej. "DECK-001")
   * @returns Instancia de Deck lista para la partida
   * @throws {ApplicationError} Si no se encuentra el mazo o alguna de las cartas
   */
  public async buildDeck(deckId: string): Promise<Deck> {
    const deckData = await this.deckRepository.getById(deckId);

    if (!deckData) {
      throw new ApplicationError(`No se encontró el mazo con ID: ${deckId}`, "DECK_NOT_FOUND");
    }

    const cards: Card[] = [];

    for (const entry of deckData.cards) {
      const cardData = await this.cardRepository.getById(entry.cardId);

      if (!cardData) {
        throw new ApplicationError(
          `No se encontró la carta con ID: ${entry.cardId} requerida por el mazo ${deckId}`,
          "CARD_NOT_FOUND",
        );
      }

      // Crear tantas instancias como indique 'quantity'
      for (let i = 0; i < entry.quantity; i++) {
        const cardInstance = CardFactory.createCard(cardData);
        cards.push(cardInstance);
      }
    }

    // El constructor de Deck lanzará un RangeError si excede MAX_DECK_SIZE (30)
    return new Deck(cards);
  }
}
