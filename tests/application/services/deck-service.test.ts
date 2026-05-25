import { describe, it, expect, vi } from "vitest";
import { DeckService } from "@application/services/deck-service";
import type { IDeckRepository } from "@domain/repositories/i-deck-repository";
import type { ICardRepository } from "@domain/repositories/i-card-repository";
import type { DeckData, CharacterData, SpellData } from "@domain/types/card-data";
import { CardType, Archetype, Rarity, Ability } from "@domain/types/card-types";
import { ApplicationError } from "@application/errors/application-error";
import { Deck } from "@domain/entities/deck";
import { Character } from "@domain/entities/character";
import { Spell } from "@domain/entities/spell";

const mockCharacterData: CharacterData = {
  id: "LIC-001",
  name: "Finn el Humano",
  type: CardType.Character,
  archetype: Archetype.CartoonClasico,
  nostalgyCost: 3,
  rarity: Rarity.Rare,
  description: "Charge",
  spriteKey: "finn",
  greetingText: "¡Hora de Aventuras!",
  attack: 4,
  health: 4,
  abilities: [Ability.Charge],
};

const mockSpellData: SpellData = {
  id: "SPELL-001",
  name: "Fuego Mágico",
  type: CardType.Spell,
  archetype: Archetype.CartoonClasico,
  nostalgyCost: 2,
  rarity: Rarity.Common,
  description: "Inflige 2 de daño",
  spriteKey: "fire",
  greetingText: "Fuego!",
  effectType: "Damage",
  targetType: "Any",
  effectValue: 2,
};

const mockDeckData: DeckData = {
  id: "DECK-001",
  name: "Mazo Prueba",
  heroId: "HERO-001",
  cards: [
    { cardId: "LIC-001", quantity: 2 },
    { cardId: "SPELL-001", quantity: 1 },
  ],
};

function createMockRepositories() {
  const mockDeckRepo: IDeckRepository = {
    getAll: vi.fn().mockResolvedValue([mockDeckData]),
    getById: vi.fn().mockImplementation((id: string) => {
      if (id === "DECK-001") return Promise.resolve(mockDeckData);
      return Promise.resolve(null);
    }),
  };

  const mockCardRepo: ICardRepository = {
    getAll: vi.fn().mockResolvedValue([mockCharacterData, mockSpellData]),
    getById: vi.fn().mockImplementation((id: string) => {
      if (id === "LIC-001") return Promise.resolve(mockCharacterData);
      if (id === "SPELL-001") return Promise.resolve(mockSpellData);
      return Promise.resolve(null);
    }),
    getByArchetype: vi.fn().mockResolvedValue([]),
  };

  return { mockDeckRepo, mockCardRepo };
}

describe("DeckService", () => {
  it("debería construir un Deck válido instanciando las cartas correctamente", async () => {
    const { mockDeckRepo, mockCardRepo } = createMockRepositories();
    const service = new DeckService(mockDeckRepo, mockCardRepo);

    const deck = await service.buildDeck("DECK-001");

    expect(deck).toBeInstanceOf(Deck);
    expect(deck.size()).toBe(3); // 2 de LIC-001 + 1 de SPELL-001

    // Verificar las instancias de las cartas creadas (el orden es determinista ya que se insertan en bucle)
    const card1 = deck.draw();
    expect(card1).toBeInstanceOf(Character);
    expect(card1?.staticId).toBe("LIC-001");

    const card2 = deck.draw();
    expect(card2).toBeInstanceOf(Character);
    expect(card2?.staticId).toBe("LIC-001");

    const card3 = deck.draw();
    expect(card3).toBeInstanceOf(Spell);
    expect(card3?.staticId).toBe("SPELL-001");

    // Al intentar robar de un mazo vacío retorna null
    expect(deck.draw()).toBeNull();
  });

  it("debería lanzar error si el mazo no existe", async () => {
    const { mockDeckRepo, mockCardRepo } = createMockRepositories();
    const service = new DeckService(mockDeckRepo, mockCardRepo);

    await expect(service.buildDeck("NO-EXISTE")).rejects.toThrow(ApplicationError);
    await expect(service.buildDeck("NO-EXISTE")).rejects.toMatchObject({ code: "DECK_NOT_FOUND" });
  });

  it("debería lanzar error si alguna carta del mazo no existe en el repositorio", async () => {
    const { mockDeckRepo, mockCardRepo } = createMockRepositories();
    const brokenDeck: DeckData = {
      id: "DECK-BROKEN",
      name: "Roto",
      heroId: "HERO-001",
      cards: [{ cardId: "FANTASMA", quantity: 1 }],
    };

    mockDeckRepo.getById = vi.fn().mockResolvedValue(brokenDeck);

    const service = new DeckService(mockDeckRepo, mockCardRepo);

    await expect(service.buildDeck("DECK-BROKEN")).rejects.toThrow(ApplicationError);
    await expect(service.buildDeck("DECK-BROKEN")).rejects.toMatchObject({
      code: "CARD_NOT_FOUND",
    });
  });
});
