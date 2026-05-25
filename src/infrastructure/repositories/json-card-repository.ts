import type { ICardRepository } from "@domain/repositories/i-card-repository";
import type { CardData } from "@domain/types/card-data";
import type { Archetype } from "@domain/types/card-types";
import { InfrastructureError } from "@infrastructure/errors/infrastructure-error";

export class JsonCardRepository implements ICardRepository {
  private cache: CardData[] | null = null;
  private readonly url = "/assets/data/cards.json";

  /**
   * Obtiene todas las cartas parseadas desde el JSON o desde la caché en memoria.
   */
  async getAll(): Promise<CardData[]> {
    if (this.cache !== null) {
      return this.cache;
    }

    try {
      const response = await fetch(this.url);

      if (!response.ok) {
        throw new InfrastructureError(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as unknown as CardData[];
      this.cache = data;
      return data;
    } catch (error) {
      if (error instanceof InfrastructureError) {
        throw error;
      }
      throw new InfrastructureError(`Failed to fetch cards: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene una carta por su ID estático.
   */
  async getById(id: string): Promise<CardData | null> {
    const cards = await this.getAll();
    const card = cards.find((c) => c.id === id);
    return card || null;
  }

  /**
   * Obtiene todas las cartas que coinciden con un arquetipo tribal específico.
   */
  async getByArchetype(archetype: Archetype): Promise<CardData[]> {
    const cards = await this.getAll();
    return cards.filter((c) => c.archetype === archetype);
  }
}
