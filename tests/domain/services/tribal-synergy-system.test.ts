import { describe, it, expect, vi, beforeEach } from "vitest";
import { TribalSynergySystem } from "@domain/services/tribal-synergy-system";
import { Character } from "@domain/entities/character";
import { Archetype, Rarity, CardType } from "@domain/types/card-types";
import { GameEvent } from "@domain/events/game-event";
import type { IEventBus } from "@domain/events/event-bus";
import { Modifier } from "@domain/value-objects/modifier";

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

function createCharacter(id: string, archetype: Archetype): Character {
  return new Character({
    staticId: id,
    name: `Char_${id}`,
    type: CardType.Character,
    archetype,
    nostalgyCost: 1,
    rarity: Rarity.Common,
    description: "Test card",
    spriteKey: "test",
    greetingText: "",
    attack: 2,
    health: 2,
    abilities: [],
  });
}

describe("TribalSynergySystem", () => {
  let eventBus: MockEventBus;
  let system: TribalSynergySystem;
  const PLAYER_ID = "Player1";

  beforeEach(() => {
    eventBus = new MockEventBus();
    system = new TribalSynergySystem(eventBus);
  });

  it("no debe aplicar sinergias si solo hay un personaje de un arquetipo", () => {
    const c1 = createCharacter("C1", Archetype.CartoonClasico);

    system.calculateSynergies(PLAYER_ID, [c1], 1);

    expect(c1.getEffectiveAttack()).toBe(2); // ATQ base = 2
    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.SynergyUpdated, {
      playerId: PLAYER_ID,
      archetype: Archetype.CartoonClasico,
      bonus: 0,
      affectedCharacterIds: [c1.instanceId],
    });
  });

  it("debe ignorar por completo a los personajes de arquetipo Neutral", () => {
    const c1 = createCharacter("C1", Archetype.Neutral);
    const c2 = createCharacter("C2", Archetype.Neutral);

    system.calculateSynergies(PLAYER_ID, [c1, c2], 1);

    expect(c1.getEffectiveAttack()).toBe(2);
    expect(c2.getEffectiveAttack()).toBe(2);
    // Neutral no debe generar eventos
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  it("debe aplicar un bono de +1 a 2 personajes del mismo arquetipo", () => {
    const c1 = createCharacter("C1", Archetype.AventuraMagica);
    const c2 = createCharacter("C2", Archetype.AventuraMagica);

    system.calculateSynergies(PLAYER_ID, [c1, c2], 1);

    expect(c1.getEffectiveAttack()).toBe(3); // Base 2 + 1 = 3
    expect(c2.getEffectiveAttack()).toBe(3);

    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.SynergyUpdated, {
      playerId: PLAYER_ID,
      archetype: Archetype.AventuraMagica,
      bonus: 1,
      affectedCharacterIds: [c1.instanceId, c2.instanceId],
    });
  });

  it("debe aplicar un bono de +2 a 3 personajes del mismo arquetipo", () => {
    const c1 = createCharacter("C1", Archetype.AnimeCombate);
    const c2 = createCharacter("C2", Archetype.AnimeCombate);
    const c3 = createCharacter("C3", Archetype.AnimeCombate);

    system.calculateSynergies(PLAYER_ID, [c1, c2, c3], 1);

    expect(c1.getEffectiveAttack()).toBe(4); // Base 2 + 2 = 4
    expect(c2.getEffectiveAttack()).toBe(4);
    expect(c3.getEffectiveAttack()).toBe(4);

    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.SynergyUpdated, {
      playerId: PLAYER_ID,
      archetype: Archetype.AnimeCombate,
      bonus: 2,
      affectedCharacterIds: [c1.instanceId, c2.instanceId, c3.instanceId],
    });
  });

  it("debe limpiar los modificadores de 'synergy' anteriores antes de recalcular", () => {
    const c1 = createCharacter("C1", Archetype.CartoonClasico);
    const c2 = createCharacter("C2", Archetype.CartoonClasico);

    // Simular que c1 ya tenía un modificador de synergy antiguo (ej. de +5)
    c1.addModifier(
      new Modifier({
        source: "synergy",
        attackBonus: 5,
        healthBonus: 0,
        abilitiesGranted: [],
        duration: -1,
        appliedAtTurn: 1,
      }),
    );
    // Simular un modificador que no es de sinergia (ej. "buff_hechizo") que debe preservarse
    c1.addModifier(
      new Modifier({
        source: "buff_hechizo",
        attackBonus: 2,
        healthBonus: 0,
        abilitiesGranted: [],
        duration: -1,
        appliedAtTurn: 1,
      }),
    );

    // Ejecutamos cálculo real (son 2 personajes, debería dar +1 de sinergia)
    system.calculateSynergies(PLAYER_ID, [c1, c2], 2);

    // c1: Base 2 + 2 (hechizo) + 1 (sinergia) = 5
    expect(c1.getEffectiveAttack()).toBe(5);

    // c2: Base 2 + 1 (sinergia) = 3
    expect(c2.getEffectiveAttack()).toBe(3);

    // Revisamos que efectivamente tiene solo 2 modificadores (hechizo + nueva sinergia)
    expect(c1.getModifiers().length).toBe(2);
    expect(c1.getModifiers().find((m) => m.source === "synergy")?.attackBonus).toBe(1);
  });

  it("debe retirar la sinergia si un personaje muere (queda N=1 en un recalculo posterior)", () => {
    const c1 = createCharacter("C1", Archetype.Sobrenatural);
    const c2 = createCharacter("C2", Archetype.Sobrenatural);

    // 1. Hay 2 personajes -> +1
    system.calculateSynergies(PLAYER_ID, [c1, c2], 1);
    expect(c1.getEffectiveAttack()).toBe(3);

    // 2. c2 muere y ya no se pasa al tablero. Recalculamos.
    system.calculateSynergies(PLAYER_ID, [c1], 2);

    // Ahora c1 se queda solo -> bono 0
    expect(c1.getEffectiveAttack()).toBe(2);

    expect(eventBus.emit).toHaveBeenLastCalledWith(GameEvent.SynergyUpdated, {
      playerId: PLAYER_ID,
      archetype: Archetype.Sobrenatural,
      bonus: 0, // Perdió el bono
      affectedCharacterIds: [c1.instanceId],
    });
  });
});
