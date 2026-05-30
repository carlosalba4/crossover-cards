import type { HeroData } from "@domain/types/card-data";

export interface IHeroRepository {
  getAll(): Promise<HeroData[]>;
  getById(id: string): Promise<HeroData | null>;
}
