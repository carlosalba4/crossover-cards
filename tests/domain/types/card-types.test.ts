/**
 * Tests unitarios para src/domain/types/card-types.ts
 *
 * Cobertura objetivo: ≥ 80% de los valores y ramas del módulo.
 * Estructura: AAA (Arrange – Act – Assert).
 * Framework: Vitest.
 *
 * Qué se verifica:
 *  1. Todos los valores de cada enum son accesibles y tienen el valor esperado.
 *  2. Los type aliases CardId y PlayerId son strings en tiempo de ejecución.
 *  3. Casos borde: valores de enum no pertenecientes al conjunto.
 *  4. Unicidad: ningún valor de enum se repite dentro del mismo enum.
 */

import { describe, it, expect } from "vitest";
import {
  CardType,
  Rarity,
  Archetype,
  Ability,
} from "@domain/types/card-types";
import type { CardId, PlayerId } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// CardType
// ---------------------------------------------------------------------------

describe("CardType", () => {
  it("debería tener el valor 'character' para CardType.Character", () => {
    // Arrange
    const expected = "character";

    // Act
    const actual = CardType.Character;

    // Assert
    expect(actual).toBe(expected);
  });

  it("debería tener el valor 'spell' para CardType.Spell", () => {
    // Arrange
    const expected = "spell";

    // Act
    const actual = CardType.Spell;

    // Assert
    expect(actual).toBe(expected);
  });

  it("debería tener el valor 'item' para CardType.Item", () => {
    // Arrange
    const expected = "item";

    // Act
    const actual = CardType.Item;

    // Assert
    expect(actual).toBe(expected);
  });

  it("debería contener exactamente 3 valores únicos", () => {
    // Arrange
    const values = Object.values(CardType);

    // Act
    const uniqueValues = new Set(values);

    // Assert
    expect(uniqueValues.size).toBe(3);
  });

  it("debería poder usarse como clave de lookup en un objeto (caso borde)", () => {
    // Arrange — Simulamos el campo "type" de un JSON de carta
    const cardData: Record<string, string> = { type: "character" };

    // Act
    const isCharacter = cardData["type"] === CardType.Character;

    // Assert
    expect(isCharacter).toBe(true);
  });

  it("no debería coincidir con un valor fuera del enum (caso borde)", () => {
    // Arrange
    const invalidValue = "creature"; // Terminología antigua eliminada

    // Act
    const isValidCardType = Object.values(CardType).includes(
      invalidValue as CardType
    );

    // Assert
    expect(isValidCardType).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rarity
// ---------------------------------------------------------------------------

describe("Rarity", () => {
  it("debería tener el valor 'Common' para Rarity.Common", () => {
    // Arrange / Act / Assert
    expect(Rarity.Common).toBe("Common");
  });

  it("debería tener el valor 'Rare' para Rarity.Rare", () => {
    expect(Rarity.Rare).toBe("Rare");
  });

  it("debería tener el valor 'Epic' para Rarity.Epic", () => {
    expect(Rarity.Epic).toBe("Epic");
  });

  it("debería tener el valor 'Legendary' para Rarity.Legendary", () => {
    expect(Rarity.Legendary).toBe("Legendary");
  });

  it("debería contener exactamente 4 valores únicos", () => {
    // Arrange
    const values = Object.values(Rarity);

    // Act
    const uniqueValues = new Set(values);

    // Assert
    expect(uniqueValues.size).toBe(4);
  });

  it("no debería incluir 'Mythic' como rareza válida (caso borde)", () => {
    // Arrange
    const invalidRarity = "Mythic";

    // Act
    const isValid = Object.values(Rarity).includes(invalidRarity as Rarity);

    // Assert
    expect(isValid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Archetype
// ---------------------------------------------------------------------------

describe("Archetype", () => {
  it("debería tener el valor 'CartoonClasico' para Archetype.CartoonClasico", () => {
    expect(Archetype.CartoonClasico).toBe("CartoonClasico");
  });

  it("debería tener el valor 'AventuraMagica' para Archetype.AventuraMagica", () => {
    expect(Archetype.AventuraMagica).toBe("AventuraMagica");
  });

  it("debería tener el valor 'AnimeCombate' para Archetype.AnimeCombate", () => {
    expect(Archetype.AnimeCombate).toBe("AnimeCombate");
  });

  it("debería tener el valor 'Sobrenatural' para Archetype.Sobrenatural", () => {
    expect(Archetype.Sobrenatural).toBe("Sobrenatural");
  });

  it("debería tener el valor 'Neutral' para Archetype.Neutral", () => {
    expect(Archetype.Neutral).toBe("Neutral");
  });

  it("debería contener exactamente 5 valores únicos", () => {
    // Arrange
    const values = Object.values(Archetype);

    // Act
    const uniqueValues = new Set(values);

    // Assert
    expect(uniqueValues.size).toBe(5);
  });

  it("debería poder filtrar Personajes por arquetipo (caso de uso real)", () => {
    // Arrange — Tabla simplificada de arquetipos del catálogo §4.1
    const characters: Array<{ name: string; archetype: Archetype }> = [
      { name: "Pops", archetype: Archetype.CartoonClasico },
      { name: "Darwin", archetype: Archetype.CartoonClasico },
      { name: "Goku", archetype: Archetype.AnimeCombate },
    ];

    // Act
    const cartoonCharacters = characters.filter(
      (c) => c.archetype === Archetype.CartoonClasico
    );

    // Assert
    expect(cartoonCharacters).toHaveLength(2);
  });

  it("no debería incluir 'Historico' como arquetipo válido (caso borde)", () => {
    // Arrange
    const invalidArchetype = "Historico";

    // Act
    const isValid = Object.values(Archetype).includes(
      invalidArchetype as Archetype
    );

    // Assert
    expect(isValid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Ability
// ---------------------------------------------------------------------------

describe("Ability", () => {
  it("debería tener el valor 'charge' para Ability.Charge", () => {
    expect(Ability.Charge).toBe("charge");
  });

  it("debería tener el valor 'taunt' para Ability.Taunt", () => {
    expect(Ability.Taunt).toBe("taunt");
  });

  it("debería tener el valor 'divineShield' para Ability.DivineShield", () => {
    expect(Ability.DivineShield).toBe("divineShield");
  });

  it("debería tener el valor 'deathrattle' para Ability.Deathrattle", () => {
    expect(Ability.Deathrattle).toBe("deathrattle");
  });

  it("debería tener el valor 'battlecry' para Ability.Battlecry", () => {
    expect(Ability.Battlecry).toBe("battlecry");
  });

  it("debería tener el valor 'lifesteal' para Ability.Lifesteal", () => {
    expect(Ability.Lifesteal).toBe("lifesteal");
  });

  it("debería tener el valor 'randomModifier' para Ability.RandomModifier", () => {
    expect(Ability.RandomModifier).toBe("randomModifier");
  });

  it("debería tener el valor 'spellImmunity' para Ability.SpellImmunity", () => {
    expect(Ability.SpellImmunity).toBe("spellImmunity");
  });

  it("debería tener el valor 'inverseTaunt' para Ability.InverseTaunt", () => {
    expect(Ability.InverseTaunt).toBe("inverseTaunt");
  });

  it("debería tener el valor 'crystalShield' para Ability.CrystalShield", () => {
    expect(Ability.CrystalShield).toBe("crystalShield");
  });

  it("debería tener el valor 'resurrection' para Ability.Resurrection", () => {
    expect(Ability.Resurrection).toBe("resurrection");
  });

  it("debería contener exactamente 11 valores únicos", () => {
    // Arrange
    const values = Object.values(Ability);

    // Act
    const uniqueValues = new Set(values);

    // Assert
    expect(uniqueValues.size).toBe(11);
  });

  it("debería permitir comprobar si un Personaje tiene Charge (caso de uso real)", () => {
    // Arrange — Rigby (LIC-005) tiene Charge
    const rigbyAbilities: Ability[] = [Ability.Charge];

    // Act
    const hasCharge = rigbyAbilities.includes(Ability.Charge);
    const hasTaunt = rigbyAbilities.includes(Ability.Taunt);

    // Assert
    expect(hasCharge).toBe(true);
    expect(hasTaunt).toBe(false);
  });

  it("no debería incluir 'poisonous' como habilidad válida (caso borde)", () => {
    // Arrange
    const invalidAbility = "poisonous";

    // Act
    const isValid = Object.values(Ability).includes(
      invalidAbility as Ability
    );

    // Assert
    expect(isValid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Type aliases: CardId y PlayerId
// ---------------------------------------------------------------------------

describe("CardId y PlayerId (type aliases)", () => {
  it("CardId debería ser asignable a string en tiempo de ejecución", () => {
    // Arrange
    const cardId: CardId = "LIC-001";

    // Act
    const isString = typeof cardId === "string";

    // Assert
    expect(isString).toBe(true);
  });

  it("PlayerId debería ser asignable a string en tiempo de ejecución", () => {
    // Arrange
    const playerId: PlayerId = "player-uuid-v4";

    // Act
    const isString = typeof playerId === "string";

    // Assert
    expect(isString).toBe(true);
  });

  it("CardId debería aceptar el formato UUID para instancias en partida (caso borde)", () => {
    // Arrange — Las instancias dinámicas usan UUIDs (docs/02 §5.3)
    const instanceId: CardId = "550e8400-e29b-41d4-a716-446655440000";

    // Act
    const isString = typeof instanceId === "string";
    const hasCorrectLength = instanceId.length === 36;

    // Assert
    expect(isString).toBe(true);
    expect(hasCorrectLength).toBe(true);
  });

  it("CardId debería aceptar el formato legible para cartas estáticas (caso borde)", () => {
    // Arrange — Las cartas estáticas usan IDs legibles (docs/02 §5.3)
    const staticId: CardId = "AXE-001";

    // Act
    const isString = typeof staticId === "string";
    const matchesPattern = /^[A-Z]{2,3}-\d{3}$/.test(staticId);

    // Assert
    expect(isString).toBe(true);
    expect(matchesPattern).toBe(true);
  });
});
