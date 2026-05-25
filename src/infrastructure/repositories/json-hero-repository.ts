import type { IHeroRepository } from "@domain/repositories/i-hero-repository";
import type { HeroData } from "@domain/types/card-data";
import { InfrastructureError } from "@infrastructure/errors/infrastructure-error";

export class JsonHeroRepository implements IHeroRepository {
  private cache: HeroData[] | null = null;
  private readonly url = "/assets/data/heroes.json";

  /**
   * Obtiene todos los héroes parseados desde el JSON o desde la caché en memoria.
   */
  async getAll(): Promise<HeroData[]> {
    if (this.cache !== null) {
      return this.cache;
    }

    try {
      const response = await fetch(this.url);

      if (!response.ok) {
        throw new InfrastructureError(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as unknown as HeroData[];
      this.cache = data;
      return data;
    } catch (error) {
      if (error instanceof InfrastructureError) {
        throw error;
      }
      throw new InfrastructureError(`Failed to fetch heroes: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene un héroe por su ID estático.
   */
  async getById(id: string): Promise<HeroData | null> {
    const heroes = await this.getAll();
    const hero = heroes.find((h) => h.id === id);
    return hero || null;
  }
}
