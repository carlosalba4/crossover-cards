import type { DeckData } from "@domain/types/card-data";

export interface IDeckRepository {
  getAll(): Promise<DeckData[]>;
  getById(id: string): Promise<DeckData | null>;
}
