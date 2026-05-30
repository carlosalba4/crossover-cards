import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JsonHeroRepository } from "@infrastructure/repositories/json-hero-repository";
import { InfrastructureError } from "@infrastructure/errors/infrastructure-error";
import { Archetype } from "@domain/types/card-types";
import type { HeroData } from "@domain/types/card-data";

const mockHeroes: HeroData[] = [
  {
    id: "HERO-001",
    name: "El Lich",
    archetype: Archetype.AventuraMagica,
    maxHealth: 30,
    heroPower: {
      name: "Hechizo Ancestral",
      cost: 2,
      effectType: "Damage",
      targetType: "Any",
      value: 2,
    },
  },
  {
    id: "HERO-002",
    name: "Axel Blaze",
    archetype: Archetype.AnimeCombate,
    maxHealth: 30,
    heroPower: {
      name: "Tornado de Fuego",
      cost: 2,
      effectType: "BuffAttack",
      targetType: "AllyCharacter",
      value: 2,
      duration: "EndOfTurn",
    },
  },
];

describe("JsonHeroRepository", () => {
  let repository: JsonHeroRepository;

  beforeEach(() => {
    repository = new JsonHeroRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debería obtener todos los héroes y guardarlos en caché", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockHeroes),
    });
    vi.stubGlobal("fetch", fetchMock);

    // Primera llamada
    const result1 = await repository.getAll();
    expect(result1).toHaveLength(2);
    expect(result1[0].id).toBe("HERO-001");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Segunda llamada (debe usar caché)
    const result2 = await repository.getAll();
    expect(result2).toBe(result1); // Referencia exacta en memoria
    expect(fetchMock).toHaveBeenCalledTimes(1); // No incrementa llamadas
  });

  it("debería obtener el héroe HERO-001 usando getById", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockHeroes),
      }),
    );

    const hero = await repository.getById("HERO-001");
    expect(hero).not.toBeNull();
    expect(hero?.id).toBe("HERO-001");
    expect(hero?.name).toBe("El Lich");
    expect(hero?.heroPower.name).toBe("Hechizo Ancestral");
    expect(hero?.heroPower.cost).toBe(2);

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
    await expect(repository.getAll()).rejects.toThrowError(
      "Failed to fetch heroes: Network failed",
    );
  });
});
