import { describe, it, expect, vi, beforeEach } from "vitest";
import { CombatResolver } from "@domain/services/combat-resolver";
import { Character } from "@domain/entities/character";
import { Hero } from "@domain/entities/hero";
import { Ability, Archetype, Rarity, CardType } from "@domain/types/card-types";
import { GameEvent } from "@domain/events/game-event";
import type { IEventBus } from "@domain/events/event-bus";

// Mock IEventBus
class MockEventBus implements IEventBus {
  on = vi.fn();
  emit = vi.fn();
  off = vi.fn();
  clear = vi.fn();
}

// Helpers para crear instancias en los tests
function createCharacter(
  id: string,
  attack: number,
  health: number,
  abilities: Ability[] = [],
): Character {
  return new Character({
    staticId: "TEST-001",
    name: id,
    type: CardType.Character,
    archetype: Archetype.Neutral,
    nostalgyCost: 1,
    rarity: Rarity.Common,
    description: "Test card",
    spriteKey: "test",
    greetingText: "",
    attack,
    health,
    abilities,
  });
}

function createHero(id: string, maxHealth: number): Hero {
  return new Hero({
    staticId: id,
    name: id,
    archetype: Archetype.Neutral,
    maxHealth,
    heroPower: {
      name: "Test Power",
      nostalgyCost: 1,
      effectType: "Damage",
      targetType: "Any",
      value: 1,
    },
  });
}

describe("CombatResolver", () => {
  let eventBus: MockEventBus;
  let resolver: CombatResolver;

  beforeEach(() => {
    eventBus = new MockEventBus();
    resolver = new CombatResolver(eventBus);
  });

  describe("Resolución base de daño", () => {
    it("debe aplicar daño mutuo a dos Personajes y emitir eventos correctos", () => {
      const attacker = createCharacter("Atacante", 3, 5); // Sobrevive con 3
      const defender = createCharacter("Defensor", 2, 3); // Sobrevive con 0 -> Muere

      resolver.resolveAttack(attacker, defender, "P1", "P2");

      expect(attacker.currentHealth).toBe(3);
      expect(defender.currentHealth).toBe(0);
      expect(attacker.hasAttackedThisTurn).toBe(true);
      expect(attacker.isExhausted).toBe(true);

      // Verificación de eventos
      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.AttackDeclared, {
        attackerId: attacker.instanceId,
        defenderId: defender.instanceId,
      });

      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.AttackResolved, {
        attackerId: attacker.instanceId,
        defenderId: defender.instanceId,
        damageToAttacker: 2,
        damageToDefender: 3,
      });

      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.CharacterDestroyed, {
        playerId: "P2",
        character: defender,
        cause: "combat",
      });
      // El atacante sobrevivió, por tanto NO se llama a CharacterDestroyed para P1
      expect(eventBus.emit).toHaveBeenCalledTimes(3);
    });

    it("debe aplicar daño al Héroe sin recibir contraataque", () => {
      const attacker = createCharacter("Atacante", 4, 2);
      const hero = createHero("HERO", 30);

      resolver.resolveAttack(attacker, hero, "P1", "P2");

      expect(hero.currentHealth).toBe(26);
      expect(attacker.currentHealth).toBe(2);

      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.HeroDamaged, {
        playerId: "P2",
        damage: 4,
        currentHealth: 26,
      });
    });
  });

  describe("Habilidades Especiales", () => {
    it("Divine Shield absorbe el daño y luego se elimina del defensor", () => {
      const attacker = createCharacter("A", 5, 5);
      const defender = createCharacter("D", 2, 5, [Ability.DivineShield]);

      resolver.resolveAttack(attacker, defender, "P1", "P2");

      // El defensor recibe 0 daño gracias al Divine Shield
      expect(defender.currentHealth).toBe(5);
      // El atacante recibe 2 daño (contraataque normal)
      expect(attacker.currentHealth).toBe(3);

      // El Divine Shield se pierde
      expect(defender.getActiveAbilities()).not.toContain(Ability.DivineShield);

      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.AttackResolved, {
        attackerId: attacker.instanceId,
        defenderId: defender.instanceId,
        damageToAttacker: 2,
        damageToDefender: 0,
      });
    });

    it("Poisonous destruye instantáneamente al defensor Personaje si hace daño", () => {
      const attacker = createCharacter("A", 1, 1, [Ability.Poisonous]);
      const defender = createCharacter("D", 0, 10);

      resolver.resolveAttack(attacker, defender, "P1", "P2");

      // Destrucción total independientemente de sus 10 PV
      expect(defender.currentHealth).toBe(0);
      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.CharacterDestroyed, expect.anything());
    });

    it("Poisonous NO destruye instantáneamente al Héroe", () => {
      const attacker = createCharacter("A", 1, 1, [Ability.Poisonous]);
      const hero = createHero("H", 30);

      resolver.resolveAttack(attacker, hero, "P1", "P2");

      // Solo recibe 1 de daño normal
      expect(hero.currentHealth).toBe(29);
    });

    it("Stealth impide ser seleccionado como objetivo y se pierde al atacar", () => {
      const attacker = createCharacter("A", 2, 2, [Ability.Stealth]);
      const defenderStealth = createCharacter("D1", 2, 2, [Ability.Stealth]);
      const defenderNormal = createCharacter("D2", 2, 2);

      // D1 tiene stealth, debe fallar
      expect(() => resolver.resolveAttack(attacker, defenderStealth, "P1", "P2")).toThrowError(
        "No se puede seleccionar como objetivo a un Personaje con Stealth.",
      );

      // A tiene stealth y ataca a D2
      resolver.resolveAttack(attacker, defenderNormal, "P1", "P2");

      // A pierde su stealth tras declarar ataque
      expect(attacker.getActiveAbilities()).not.toContain(Ability.Stealth);
    });
  });

  describe("Validaciones de Estado", () => {
    it("debe rechazar ataques si el atacante está exhausto", () => {
      const attacker = createCharacter("A", 1, 1);
      attacker.isExhausted = true;
      const defender = createCharacter("D", 1, 1);

      expect(() => resolver.resolveAttack(attacker, defender, "P1", "P2")).toThrowError(
        "El Personaje atacante está exhausto o ya ha atacado este turno.",
      );
    });

    it("debe rechazar ataques si el objetivo está muerto", () => {
      const attacker = createCharacter("A", 1, 1);
      const defender = createCharacter("D", 1, 1);
      defender.currentHealth = 0; // muerto

      expect(() => resolver.resolveAttack(attacker, defender, "P1", "P2")).toThrowError(
        "El objetivo ya está destruido.",
      );
    });
  });
});
