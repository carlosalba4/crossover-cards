import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZoneManager, type IRNG } from "@domain/services/zone-manager";
import { Character } from "@domain/entities/character";
import { Archetype, CardType, Rarity, Ability } from "@domain/types/card-types";
import { GameEvent } from "@domain/events/game-event";
import type { IEventBus } from "@domain/events/event-bus";

// Mock del IEventBus
class MockEventBus implements IEventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers = new Map<GameEvent, Set<(payload: any) => void>>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on = vi.fn((event: GameEvent, handler: (payload: any) => void) => {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => {};
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit = vi.fn((event: GameEvent, payload: any) => {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((h) => h(payload));
    }
  });

  off = vi.fn();
  clear = vi.fn();
}

class MockRNG implements IRNG {
  private values: number[] = [];

  // Permite inyectar los valores que devolverá secuencialmente
  setValues(values: number[]) {
    this.values = [...values];
  }

  next(): number {
    return this.values.shift() ?? 0;
  }
}

function createCharacter(id: string, archetype: Archetype, cost = 1): Character {
  return new Character({
    staticId: id,
    name: `Char_${id}`,
    type: CardType.Character,
    archetype,
    nostalgyCost: cost,
    rarity: Rarity.Common,
    description: "Test card",
    spriteKey: "test",
    greetingText: "",
    attack: 2,
    health: 2,
    abilities: [],
  });
}

describe("ZoneManager", () => {
  let eventBus: MockEventBus;
  let rng: MockRNG;
  let manager: ZoneManager;

  beforeEach(() => {
    eventBus = new MockEventBus();
    rng = new MockRNG();
    manager = new ZoneManager(eventBus, rng);
  });

  it("debe inicializar las 3 zonas con ENV-001", () => {
    expect(manager.getEnvironment("left")).toBe("ENV-001");
    expect(manager.getEnvironment("center")).toBe("ENV-001");
    expect(manager.getEnvironment("right")).toBe("ENV-001");
  });

  it("debe rotar el entorno cada 3 turnos basándose en RNG y emitir evento", () => {
    // Configurar RNG:
    // índice de zona = Math.floor(rng.next() * 3) -> 0.5 * 3 = 1.5 -> índice 1 ("center")
    // índice de entorno = Math.floor(rng.next() * 5) -> 0.2 * 5 = 1.0 -> índice 1 ("ENV-003")
    rng.setValues([0.5, 0.2]);

    const getCharactersMock = vi.fn().mockReturnValue([]);

    manager.onFullTurnEnded(getCharactersMock); // Turno 1
    manager.onFullTurnEnded(getCharactersMock); // Turno 2
    expect(manager.getEnvironment("center")).toBe("ENV-001"); // Sin cambios aún

    manager.onFullTurnEnded(getCharactersMock); // Turno 3 (¡Rotación!)

    expect(manager.getEnvironment("center")).toBe("ENV-003");

    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.ZoneEnvironmentChanged, {
      zoneId: "center",
      previousEnv: "ENV-001",
      newEnv: "ENV-003",
    });
    expect(getCharactersMock).toHaveBeenCalledWith("center");
  });

  describe("Efectos de Entorno", () => {
    it("ENV-001 (Paisaje Neutro) no debe aplicar ningún modificador", () => {
      const c = createCharacter("C", Archetype.Neutral);
      manager.applyEnvironmentToCharacter(c, "left"); // Es ENV-001 por defecto

      expect(c.getModifiers().length).toBe(0);
    });

    it("ENV-002 (Bosque Mágico) debe aplicar +1 VID", () => {
      const c = createCharacter("C", Archetype.Neutral);

      manager.changeEnvironment("left", "ENV-002", [c]); // Lo cambia y se lo aplica a 'c'

      expect(c.getEffectiveHealth()).toBe(3); // Base 2 + 1
      expect(c.getModifiers()[0].source).toBe("zone");
    });

    it("ENV-003 (Estadio Deportivo) debe aplicar +1 ATQ", () => {
      const c = createCharacter("C", Archetype.Neutral);
      manager.changeEnvironment("left", "ENV-003", [c]);
      expect(c.getEffectiveAttack()).toBe(3);
    });

    it("ENV-004 (Cocina Krusty) debe conceder HealHeroOnAttack", () => {
      const c = createCharacter("C", Archetype.Neutral);
      manager.changeEnvironment("left", "ENV-004", [c]);
      expect(c.getActiveAbilities()).toContain(Ability.HealHeroOnAttack);
    });

    it("ENV-005 (Tierra de Ooo) debe dar Charge solo a Aventura Mágica", () => {
      const c1 = createCharacter("C1", Archetype.AventuraMagica);
      const c2 = createCharacter("C2", Archetype.Neutral);

      manager.changeEnvironment("left", "ENV-005", [c1, c2]);

      expect(c1.getActiveAbilities()).toContain(Ability.Charge);
      expect(c2.getActiveAbilities()).not.toContain(Ability.Charge);
    });

    it("ENV-006 (Parque Municipal) debe reducir el coste en 1 (solo Cartoon Clásico) y restaurarlo", () => {
      const c1 = createCharacter("C1", Archetype.CartoonClasico, 2);
      const c2 = createCharacter("C2", Archetype.Neutral, 2);

      // Aplicar
      manager.changeEnvironment("left", "ENV-006", [c1, c2]);

      expect(c1.nostalgyCost).toBe(1); // 2 - 1 = 1
      expect(c2.nostalgyCost).toBe(2); // Inmune

      // Remover (cambiando a otro entorno)
      manager.changeEnvironment("left", "ENV-001", [c1, c2]);

      expect(c1.nostalgyCost).toBe(2); // Se restaura
    });
  });

  describe("Limpieza de Modificadores (Cambio de entorno)", () => {
    it("debe purgar los modificadores del entorno anterior al recibir uno nuevo", () => {
      const c = createCharacter("C", Archetype.Neutral);

      // 1. Aplicar ENV-002 (+1 VID)
      manager.changeEnvironment("left", "ENV-002", [c]);
      expect(c.getEffectiveHealth()).toBe(3);
      expect(c.getEffectiveAttack()).toBe(2);

      // 2. Cambiar a ENV-003 (+1 ATQ)
      manager.changeEnvironment("left", "ENV-003", [c]);

      // La salud debe volver a 2, y el ataque debe subir a 3.
      // No debe tener ambos acumulados.
      expect(c.getEffectiveHealth()).toBe(2);
      expect(c.getEffectiveAttack()).toBe(3);

      // Debe tener exactamente 1 modifier ("zone")
      expect(c.getModifiers().length).toBe(1);
    });
  });
});
