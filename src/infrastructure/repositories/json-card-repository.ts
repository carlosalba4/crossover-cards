import type { ICardRepository } from "@domain/repositories/i-card-repository";
import type { CardData } from "@domain/types/card-data";
import { type Archetype, Rarity } from "@domain/types/card-types";
import { InfrastructureError } from "@infrastructure/errors/infrastructure-error";

/**
 * Mapa de normalización de rareza: el JSON de datos usa etiquetas en español
 * ("Comun", "Rara", "Epica", "Legendaria") que no coinciden con el enum de
 * dominio `Rarity` (inglés). Esta capa de infraestructura traduce los datos
 * externos al tipo canónico del dominio (patrón anti-corrupción), de forma que
 * el resto de la app (marcos de rareza, colores de borde, tooltip) reciba
 * siempre valores válidos del enum. El mapeo es idempotente: los valores ya en
 * inglés se devuelven sin cambios.
 */
const RARITY_ALIASES: Record<string, Rarity> = {
  comun: Rarity.Common,
  común: Rarity.Common,
  common: Rarity.Common,
  rara: Rarity.Rare,
  rare: Rarity.Rare,
  epica: Rarity.Epic,
  épica: Rarity.Epic,
  epic: Rarity.Epic,
  legendaria: Rarity.Legendary,
  legendary: Rarity.Legendary,
};

/** Traduce una etiqueta de rareza (es/en) al enum `Rarity`; Common por defecto. */
function normalizeRarity(raw: unknown): Rarity {
  if (typeof raw === "string") {
    const mapped = RARITY_ALIASES[raw.toLowerCase()];
    if (mapped) return mapped;
  }
  return Rarity.Common;
}

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
      // Normalizar las rarezas de los datos externos al enum de dominio antes
      // de cachear, para que los consumidores reciban valores canónicos.
      this.cache = data.map((card) => ({ ...card, rarity: normalizeRarity(card.rarity) }));
      return this.cache;
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
