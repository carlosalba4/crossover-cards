/**
 * Tests unitarios para src/domain/entities/character.ts
 *
 * Cobertura objetivo: ≥ 80%.
 * Estructura: AAA (Arrange – Act – Assert).
 * Framework: Vitest.
 *
 * Qué se verifica:
 *  1. Construcción: campos base y campos propios de Character.
 *  2. getEffectiveAttack(): sin modifiers, con modifiers positivos/negativos,
 *     nunca devuelve valor negativo.
 *  3. getEffectiveHealth(): sin modifiers y con modifier de healthBonus negativo.
 *  4. getActiveAbilities(): habilidades base, fusión con abilitiesGranted, deduplicación.
 *  5. addModifier() / getModifiers(): añadir y consultar modifiers.
 *  6. removeExpiredModifiers(): elimina expirados, conserva vigentes y permanentes.
 *  7. removeModifiersBySource(): elimina solo los de una fuente concreta.
 *  8. takeDamage(): reduce currentHealth, no baja de 0.
 *  9. isAlive(): false cuando currentHealth === 0.
 * 10. clone(): nuevo instanceId, modifiers vacío, currentHealth = health base.
 */

import { describe, it, expect } from "vitest";
import { Character } from "@domain/entities/character";
import type { CharacterProps } from "@domain/entities/character";
import { Modifier } from "@domain/value-objects/modifier";
import { Ability, CardType, Archetype, Rarity } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Helpers de fabricación
// ---------------------------------------------------------------------------

/** Props base para un Character de prueba (basado en Rigby, LIC-005). */
function makeCharacterProps(overrides: Partial<CharacterProps> = {}): CharacterProps {
  return {
    staticId: "LIC-005",
    name: "Rigby",
    type: CardType.Character,
    archetype: Archetype.CartoonClasico,
    nostalgyCost: 2,
    rarity: Rarity.Rare,
    description: "Charge. No puede atacar el turno siguiente.",
    spriteKey: "rigby_card",
    greetingText: "YA VOOOY!",
    attack: 3,
    health: 2,
    abilities: [Ability.Charge],
    ...overrides,
  };
}

/** Crea un Modifier de prueba con valores sobreescribibles. */
function makeModifier(
  overrides: Partial<{
    source: string;
    attackBonus: number;
    healthBonus: number;
    abilitiesGranted: Ability[];
    duration: number;
    appliedAtTurn: number;
  }> = {},
): Modifier {
  return new Modifier({
    source: "test",
    attackBonus: 0,
    healthBonus: 0,
    abilitiesGranted: [],
    duration: 1,
    appliedAtTurn: 1,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Construcción
// ---------------------------------------------------------------------------

describe("Character — construcción", () => {
  it("debería asignar attack correctamente", () => {
    // Arrange / Act
    const char = new Character(makeCharacterProps({ attack: 3 }));

    // Assert
    expect(char.attack).toBe(3);
  });

  it("debería asignar health correctamente e inicializar currentHealth igual a health", () => {
    // Arrange / Act
    const char = new Character(makeCharacterProps({ health: 2 }));

    // Assert
    expect(char.health).toBe(2);
    expect(char.currentHealth).toBe(2);
  });

  it("debería inicializar isExhausted en false", () => {
    // Arrange / Act
    const char = new Character(makeCharacterProps());

    // Assert
    expect(char.isExhausted).toBe(false);
  });

  it("debería inicializar hasAttackedThisTurn en false", () => {
    // Arrange / Act
    const char = new Character(makeCharacterProps());

    // Assert
    expect(char.hasAttackedThisTurn).toBe(false);
  });

  it("debería inicializar el array de modifiers vacío", () => {
    // Arrange / Act
    const char = new Character(makeCharacterProps());

    // Assert
    expect(char.getModifiers()).toHaveLength(0);
  });

  it("debería preservar las habilidades base", () => {
    // Arrange / Act
    const char = new Character(makeCharacterProps({ abilities: [Ability.Charge] }));

    // Assert
    expect(char.abilities).toContain(Ability.Charge);
  });
});

// ---------------------------------------------------------------------------
// getEffectiveAttack()
// ---------------------------------------------------------------------------

describe("Character.getEffectiveAttack()", () => {
  it("debería devolver el attack base cuando no hay modifiers", () => {
    // Arrange
    const char = new Character(makeCharacterProps({ attack: 3 }));

    // Act
    const result = char.getEffectiveAttack();

    // Assert
    expect(result).toBe(3);
  });

  it("debería sumar un modifier de +2 ATQ al attack base", () => {
    // Arrange
    const char = new Character(makeCharacterProps({ attack: 3 }));
    char.addModifier(makeModifier({ attackBonus: 2, source: "synergy" }));

    // Act
    const result = char.getEffectiveAttack();

    // Assert
    expect(result).toBe(5);
  });

  it("debería sumar correctamente 2 modifiers activos", () => {
    // Arrange — Rigby (3 ATQ) + sinergia (+2) + habilidad de héroe (+2) = 7
    const char = new Character(makeCharacterProps({ attack: 3 }));
    char.addModifier(makeModifier({ attackBonus: 2, source: "synergy" }));
    char.addModifier(makeModifier({ attackBonus: 2, source: "hero-power" }));

    // Act
    const result = char.getEffectiveAttack();

    // Assert
    expect(result).toBe(7);
  });

  it("nunca debería devolver un valor negativo aunque los modifiers sean muy negativos", () => {
    // Arrange — Linterna Minimizadora reduce ATQ a 0 (o menos)
    const char = new Character(makeCharacterProps({ attack: 3 }));
    char.addModifier(makeModifier({ attackBonus: -10 }));

    // Act
    const result = char.getEffectiveAttack();

    // Assert
    expect(result).toBe(0);
  });

  it("debería devolver 0 cuando el attack base es 0 y no hay modifiers", () => {
    // Arrange — Caso borde: carta con ataque 0
    const char = new Character(makeCharacterProps({ attack: 0 }));

    // Act
    const result = char.getEffectiveAttack();

    // Assert
    expect(result).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getEffectiveHealth()
// ---------------------------------------------------------------------------

describe("Character.getEffectiveHealth()", () => {
  it("debería devolver currentHealth cuando no hay modifiers", () => {
    // Arrange
    const char = new Character(makeCharacterProps({ health: 4 }));

    // Act
    const result = char.getEffectiveHealth();

    // Assert
    expect(result).toBe(4);
  });

  it("debería sumar healthBonus de un modifier al currentHealth", () => {
    // Arrange
    const char = new Character(makeCharacterProps({ health: 4 }));
    char.addModifier(makeModifier({ healthBonus: 2 }));

    // Act
    const result = char.getEffectiveHealth();

    // Assert
    expect(result).toBe(6);
  });

  it("nunca debería devolver un valor negativo", () => {
    // Arrange
    const char = new Character(makeCharacterProps({ health: 2 }));
    char.takeDamage(2); // currentHealth = 0
    char.addModifier(makeModifier({ healthBonus: -5 }));

    // Act
    const result = char.getEffectiveHealth();

    // Assert
    expect(result).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getActiveAbilities()
// ---------------------------------------------------------------------------

describe("Character.getActiveAbilities()", () => {
  it("debería devolver solo las habilidades base cuando no hay modifiers", () => {
    // Arrange
    const char = new Character(makeCharacterProps({ abilities: [Ability.Charge] }));

    // Act
    const result = char.getActiveAbilities();

    // Assert
    expect(result).toEqual([Ability.Charge]);
  });

  it("debería fusionar habilidades base con las concedidas por modifiers", () => {
    // Arrange — Patricio Estrella: Taunt temporal (outcome 5)
    const char = new Character(makeCharacterProps({ abilities: [] }));
    char.addModifier(makeModifier({ abilitiesGranted: [Ability.Taunt] }));

    // Act
    const result = char.getActiveAbilities();

    // Assert
    expect(result).toContain(Ability.Taunt);
  });

  it("debería deduplicar habilidades que aparecen en base y en modifier", () => {
    // Arrange — Charge base + modifier que también otorga Charge
    const char = new Character(makeCharacterProps({ abilities: [Ability.Charge] }));
    char.addModifier(makeModifier({ abilitiesGranted: [Ability.Charge] }));

    // Act
    const result = char.getActiveAbilities();

    // Assert
    const chargeCount = result.filter((a) => a === Ability.Charge).length;
    expect(chargeCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// addModifier / getModifiers
// ---------------------------------------------------------------------------

describe("Character.addModifier() / getModifiers()", () => {
  it("debería añadir un modifier y ser recuperable por getModifiers()", () => {
    // Arrange
    const char = new Character(makeCharacterProps());
    const mod = makeModifier({ source: "zone" });

    // Act
    char.addModifier(mod);

    // Assert
    expect(char.getModifiers()).toHaveLength(1);
    expect(char.getModifiers()[0]).toBe(mod);
  });

  it("debería acumular múltiples modifiers", () => {
    // Arrange
    const char = new Character(makeCharacterProps());

    // Act
    char.addModifier(makeModifier({ source: "synergy" }));
    char.addModifier(makeModifier({ source: "zone" }));

    // Assert
    expect(char.getModifiers()).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// removeExpiredModifiers()
// ---------------------------------------------------------------------------

describe("Character.removeExpiredModifiers()", () => {
  it("debería eliminar los modifiers expirados en el turno actual", () => {
    // Arrange — Modifier de duración 1, aplicado en turno 3; expira en turno 4
    const char = new Character(makeCharacterProps());
    char.addModifier(makeModifier({ duration: 1, appliedAtTurn: 3 }));

    // Act — Limpiamos en turno 4
    char.removeExpiredModifiers(4);

    // Assert
    expect(char.getModifiers()).toHaveLength(0);
  });

  it("debería conservar los modifiers que aún no han expirado", () => {
    // Arrange — duration 3 aplicado en turno 2; sigue activo en turno 4 (4-2=2 < 3)
    const char = new Character(makeCharacterProps());
    char.addModifier(makeModifier({ duration: 3, appliedAtTurn: 2 }));

    // Act
    char.removeExpiredModifiers(4);

    // Assert
    expect(char.getModifiers()).toHaveLength(1);
  });

  it("debería conservar los modifiers permanentes (duration === -1)", () => {
    // Arrange
    const char = new Character(makeCharacterProps());
    char.addModifier(makeModifier({ duration: -1, appliedAtTurn: 1 }));

    // Act — Limpiamos en turno 100
    char.removeExpiredModifiers(100);

    // Assert
    expect(char.getModifiers()).toHaveLength(1);
  });

  it("debería eliminar solo los expirados cuando hay mezcla de expirados y vigentes", () => {
    // Arrange
    const char = new Character(makeCharacterProps());
    // Expirado en turno 5: duration 1, aplicado en turno 4 (5-4=1 >= 1)
    char.addModifier(makeModifier({ duration: 1, appliedAtTurn: 4, source: "expired" }));
    // Vigente en turno 5: duration -1 (permanente)
    char.addModifier(makeModifier({ duration: -1, appliedAtTurn: 1, source: "permanent" }));
    // Vigente en turno 5: duration 3, aplicado en turno 4 (5-4=1 < 3)
    char.addModifier(makeModifier({ duration: 3, appliedAtTurn: 4, source: "active" }));

    // Act
    char.removeExpiredModifiers(5);

    // Assert
    const remaining = char.getModifiers();
    expect(remaining).toHaveLength(2);
    expect(remaining.every((m) => m.source !== "expired")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// removeModifiersBySource()
// ---------------------------------------------------------------------------

describe("Character.removeModifiersBySource()", () => {
  it("debería eliminar solo los modifiers cuyo source coincide", () => {
    // Arrange
    const char = new Character(makeCharacterProps());
    char.addModifier(makeModifier({ source: "synergy" }));
    char.addModifier(makeModifier({ source: "zone" }));
    char.addModifier(makeModifier({ source: "synergy" }));

    // Act
    char.removeModifiersBySource("synergy");

    // Assert
    const remaining = char.getModifiers();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].source).toBe("zone");
  });

  it("no debería lanzar error si no existe ningún modifier de la fuente indicada", () => {
    // Arrange
    const char = new Character(makeCharacterProps());
    char.addModifier(makeModifier({ source: "zone" }));

    // Act & Assert — No debe lanzar excepción
    expect(() => char.removeModifiersBySource("nonexistent")).not.toThrow();
    expect(char.getModifiers()).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// takeDamage() / isAlive()
// ---------------------------------------------------------------------------

describe("Character.takeDamage() / isAlive()", () => {
  it("debería reducir currentHealth correctamente", () => {
    // Arrange
    const char = new Character(makeCharacterProps({ health: 4 }));

    // Act
    char.takeDamage(3);

    // Assert
    expect(char.currentHealth).toBe(1);
  });

  it("currentHealth no debería bajar de 0 aunque el daño sea mayor que la vida", () => {
    // Arrange
    const char = new Character(makeCharacterProps({ health: 2 }));

    // Act
    char.takeDamage(10);

    // Assert
    expect(char.currentHealth).toBe(0);
  });

  it("isAlive() debería devolver true cuando currentHealth > 0", () => {
    // Arrange
    const char = new Character(makeCharacterProps({ health: 4 }));

    // Act / Assert
    expect(char.isAlive()).toBe(true);
  });

  it("isAlive() debería devolver false cuando currentHealth === 0", () => {
    // Arrange
    const char = new Character(makeCharacterProps({ health: 2 }));

    // Act
    char.takeDamage(2);

    // Assert
    expect(char.isAlive()).toBe(false);
  });

  it("isAlive() debería devolver false después de daño letal (caso borde)", () => {
    // Arrange — Goku tiene 6 VID, recibe 7 de daño
    const char = new Character(makeCharacterProps({ health: 6 }));

    // Act
    char.takeDamage(7);

    // Assert
    expect(char.currentHealth).toBe(0);
    expect(char.isAlive()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clone()
// ---------------------------------------------------------------------------

describe("Character.clone()", () => {
  it("debería generar un instanceId diferente al del original", () => {
    // Arrange
    const char = new Character(makeCharacterProps());

    // Act
    const cloned = char.clone();

    // Assert
    expect(cloned.instanceId).not.toBe(char.instanceId);
  });

  it("el clon debería tener modifiers vacío aunque el original tenga modifiers", () => {
    // Arrange
    const char = new Character(makeCharacterProps());
    char.addModifier(makeModifier({ source: "synergy", attackBonus: 2 }));

    // Act
    const cloned = char.clone();

    // Assert
    expect(cloned.getModifiers()).toHaveLength(0);
  });

  it("el clon debería tener currentHealth restaurada a health base", () => {
    // Arrange
    const char = new Character(makeCharacterProps({ health: 4 }));
    char.takeDamage(3); // currentHealth = 1

    // Act
    const cloned = char.clone();

    // Assert
    expect(cloned.currentHealth).toBe(4);
  });

  it("el clon debería tener isExhausted = false aunque el original esté exhausto", () => {
    // Arrange
    const char = new Character(makeCharacterProps());
    char.isExhausted = true;

    // Act
    const cloned = char.clone();

    // Assert
    expect(cloned.isExhausted).toBe(false);
  });

  it("el clon debería tener hasAttackedThisTurn = false", () => {
    // Arrange
    const char = new Character(makeCharacterProps());
    char.hasAttackedThisTurn = true;

    // Act
    const cloned = char.clone();

    // Assert
    expect(cloned.hasAttackedThisTurn).toBe(false);
  });

  it("el clon debería preservar todos los datos base (staticId, attack, health, abilities)", () => {
    // Arrange
    const char = new Character(
      makeCharacterProps({
        staticId: "AXE-001",
        attack: 6,
        health: 6,
        abilities: [Ability.Resurrection],
      }),
    );

    // Act
    const cloned = char.clone();

    // Assert
    expect(cloned.staticId).toBe("AXE-001");
    expect(cloned.attack).toBe(6);
    expect(cloned.health).toBe(6);
    expect(cloned.abilities).toContain(Ability.Resurrection);
  });
});
