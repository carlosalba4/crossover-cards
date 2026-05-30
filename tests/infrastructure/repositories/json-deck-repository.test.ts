import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JsonDeckRepository } from "@infrastructure/repositories/json-deck-repository";
import { InfrastructureError } from "@infrastructure/errors/infrastructure-error";
import type { DeckData } from "@domain/types/card-data";

const mockDecks: DeckData[] = [
  {
    id: "DECK-LICH-01",
    name: "Mazo de El Lich",
    heroId: "HERO-001",
    cards: [
      { cardId: "LIC-001", quantity: 1 },
      { cardId: "LIC-002", quantity: 1 },
    ],
  },
  {
    id: "DECK-AXEL-01",
    name: "Mazo de Axel Blaze",
    heroId: "HERO-002",
    cards: [{ cardId: "AXE-001", quantity: 1 }],
  },
];

describe("JsonDeckRepository", () => {
  let repository: JsonDeckRepository;

  beforeEach(() => {
    repository = new JsonDeckRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debería obtener todos los mazos y guardarlos en caché", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockDecks),
    });
    vi.stubGlobal("fetch", fetchMock);

    // Primera llamada
    const result1 = await repository.getAll();
    expect(result1).toHaveLength(2);
    expect(result1[0].id).toBe("DECK-LICH-01");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Segunda llamada (debe usar caché)
    const result2 = await repository.getAll();
    expect(result2).toBe(result1); // Referencia exacta en memoria
    expect(fetchMock).toHaveBeenCalledTimes(1); // No incrementa llamadas
  });

  it("debería obtener un mazo por ID usando getById", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDecks),
      }),
    );

    const deck = await repository.getById("DECK-AXEL-01");
    expect(deck).not.toBeNull();
    expect(deck?.id).toBe("DECK-AXEL-01");
    expect(deck?.name).toBe("Mazo de Axel Blaze");

    const notFound = await repository.getById("NO-EXISTE");
    expect(notFound).toBeNull();
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
    await expect(repository.getAll()).rejects.toThrowError("Failed to fetch decks: Network failed");
  });
});
