import type { IDeckRepository } from "@domain/repositories/i-deck-repository";
import type { DeckData } from "@domain/types/card-data";
import { InfrastructureError } from "@infrastructure/errors/infrastructure-error";

export class JsonDeckRepository implements IDeckRepository {
  private cache: DeckData[] | null = null;
  private readonly url = "/assets/data/decks.json";

  /**
   * Obtiene todos los mazos parseados desde el JSON o desde la caché en memoria.
   */
  async getAll(): Promise<DeckData[]> {
    if (this.cache !== null) {
      return this.cache;
    }

    try {
      const response = await fetch(this.url);

      if (!response.ok) {
        throw new InfrastructureError(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as unknown as DeckData[];
      this.cache = data;
      return data;
    } catch (error) {
      if (error instanceof InfrastructureError) {
        throw error;
      }
      throw new InfrastructureError(`Failed to fetch decks: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene un mazo por su ID estático.
   */
  async getById(id: string): Promise<DeckData | null> {
    const decks = await this.getAll();
    const deck = decks.find((d) => d.id === id);
    return deck || null;
  }
}
