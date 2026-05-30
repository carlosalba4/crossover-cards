import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JsonCardRepository } from "@infrastructure/repositories/json-card-repository";
import { InfrastructureError } from "@infrastructure/errors/infrastructure-error";
import { CardType, Archetype, Rarity } from "@domain/types/card-types";
import type { CardData } from "@domain/types/card-data";

const mockCards: CardData[] = [
  {
    id: "LIC-001",
    name: "Pops el Gentil",
    type: CardType.Character,
    archetype: Archetype.CartoonClasico,
    nostalgyCost: 2,
    rarity: Rarity.Rare,
    description: "Test description",
    spriteKey: "pops",
    greetingText: "Hello",
    attack: 1,
    health: 4,
    abilities: [],
  },
  {
    id: "AXE-001",
    name: "Goku",
    type: CardType.Character,
    archetype: Archetype.AnimeCombate,
    nostalgyCost: 5,
    rarity: Rarity.Epic,
    description: "Kamehameha",
    spriteKey: "goku",
    greetingText: "Kamehameha",
    attack: 6,
    health: 5,
    abilities: [],
  },
];

describe("JsonCardRepository", () => {
  let repository: JsonCardRepository;

  beforeEach(() => {
    repository = new JsonCardRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debería obtener todas las cartas y guardarlas en caché", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockCards),
    });
    vi.stubGlobal("fetch", fetchMock);

    // Primera llamada
    const result1 = await repository.getAll();
    expect(result1).toHaveLength(2);
    expect(result1[0].id).toBe("LIC-001");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Segunda llamada (debe usar caché)
    const result2 = await repository.getAll();
    expect(result2).toBe(result1); // Referencia exacta en memoria
    expect(fetchMock).toHaveBeenCalledTimes(1); // No incrementa llamadas
  });

  it("debería obtener una carta por ID usando getById", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCards),
      }),
    );

    const card = await repository.getById("LIC-001");
    expect(card).not.toBeNull();
    expect(card?.id).toBe("LIC-001");
    expect(card?.name).toBe("Pops el Gentil");

    const notFound = await repository.getById("NO-EXISTE");
    expect(notFound).toBeNull();
  });

  it("debería filtrar cartas por arquetipo usando getByArchetype", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCards),
      }),
    );

    const cartoonCards = await repository.getByArchetype(Archetype.CartoonClasico);
    expect(cartoonCards).toHaveLength(1);
    expect(cartoonCards[0].id).toBe("LIC-001");

    const animeCards = await repository.getByArchetype(Archetype.AnimeCombate);
    expect(animeCards).toHaveLength(1);
    expect(animeCards[0].id).toBe("AXE-001");

    const neutralCards = await repository.getByArchetype(Archetype.Neutral);
    expect(neutralCards).toHaveLength(0);
  });

  it("debería lanzar InfrastructureError si fetch no es ok (error HTTP)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    await expect(repository.getAll()).rejects.toThrowError(InfrastructureError);
    await expect(repository.getAll()).rejects.toThrowError("HTTP error! status: 404");
  });

  it("debería lanzar InfrastructureError si fetch rechaza la promesa (error de red)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failed")));

    await expect(repository.getAll()).rejects.toThrowError(InfrastructureError);
    await expect(repository.getAll()).rejects.toThrowError("Failed to fetch cards: Network failed");
  });
});
