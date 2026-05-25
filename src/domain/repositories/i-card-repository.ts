import type { CardData } from "@domain/types/card-data";
import type { Archetype } from "@domain/types/card-types";

export interface ICardRepository {
  getAll(): Promise<CardData[]>;
  getById(id: string): Promise<CardData | null>;
  getByArchetype(archetype: Archetype): Promise<CardData[]>;
}
