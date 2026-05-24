/**
 * Tests unitarios para src/domain/entities/item.ts
 *
 * Cobertura objetivo: ≥ 80%.
 * Estructura: AAA (Arrange – Act – Assert).
 * Framework: Vitest.
 */

import { describe, it, expect } from "vitest";
import { Item } from "@domain/entities/item";
import type { ItemProps } from "@domain/entities/item";
import { Ability, CardType, Archetype, Rarity } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItemProps(overrides: Partial<ItemProps> = {}): ItemProps {
  return {
    staticId: "LIC-010",
    name: "Espada de Sangre de Demonio",
    type: CardType.Item,
    archetype: Archetype.AventuraMagica,
    nostalgyCost: 5,
    rarity: Rarity.Legendary,
    description: "+5 ATQ al héroe. 1 auto-daño/turno. Durabilidad 3.",
    spriteKey: "demon_sword_card",
    greetingText: "Este poder tiene un precio...",
    targetType: "Hero",
    statModifier: { attackBonus: 5, healthBonus: 0 },
    abilityGranted: null,
    durability: 3,
    onTurnStartEffect: { type: "DamageOwner", value: 1 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Construcción
// ---------------------------------------------------------------------------

describe("Item — construcción", () => {
  it("debería asignar targetType correctamente", () => {
    const item = new Item(makeItemProps({ targetType: "Hero" }));
    expect(item.targetType).toBe("Hero");
  });

  it("debería asignar statModifier correctamente", () => {
    const item = new Item(makeItemProps({ statModifier: { attackBonus: 5, healthBonus: 0 } }));
    expect(item.statModifier.attackBonus).toBe(5);
    expect(item.statModifier.healthBonus).toBe(0);
  });

  it("debería asignar abilityGranted cuando es una habilidad válida", () => {
    // Arrange — Omnitrix no concede habilidad base, pero podría conceder DivineShield
    const item = new Item(makeItemProps({ abilityGranted: Ability.DivineShield }));
    expect(item.abilityGranted).toBe(Ability.DivineShield);
  });

  it("debería asignar abilityGranted como null cuando no hay habilidad", () => {
    const item = new Item(makeItemProps({ abilityGranted: null }));
    expect(item.abilityGranted).toBeNull();
  });

  it("debería asignar durability correctamente e inicializar currentDurability igual", () => {
    const item = new Item(makeItemProps({ durability: 3 }));
    expect(item.durability).toBe(3);
    expect(item.currentDurability).toBe(3);
  });

  it("debería asignar onTurnStartEffect cuando se proporciona", () => {
    const item = new Item(makeItemProps({ onTurnStartEffect: { type: "DamageOwner", value: 1 } }));
    expect(item.onTurnStartEffect).toBeDefined();
    expect(item.onTurnStartEffect?.type).toBe("DamageOwner");
    expect(item.onTurnStartEffect?.value).toBe(1);
  });

  it("onTurnStartEffect debería ser undefined cuando no se proporciona", () => {
    const props = makeItemProps();
    const { onTurnStartEffect: _omit, ...propsWithout } = props;
    const item = new Item(propsWithout as ItemProps);
    expect(item.onTurnStartEffect).toBeUndefined();
  });

  it("debería heredar campos base de Card correctamente", () => {
    const item = new Item(makeItemProps());
    expect(item.staticId).toBe("LIC-010");
    expect(item.type).toBe(CardType.Item);
    expect(item.rarity).toBe(Rarity.Legendary);
    expect(item.nostalgyCost).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// use() / isBroken()
// ---------------------------------------------------------------------------

describe("Item.use() / isBroken()", () => {
  it("use() debería reducir currentDurability en 1", () => {
    // Arrange
    const item = new Item(makeItemProps({ durability: 3 }));

    // Act
    item.use();

    // Assert
    expect(item.currentDurability).toBe(2);
  });

  it("use() debería poder reducir currentDurability hasta 0", () => {
    // Arrange
    const item = new Item(makeItemProps({ durability: 2 }));

    // Act
    item.use();
    item.use();

    // Assert
    expect(item.currentDurability).toBe(0);
  });

  it("use() no debería bajar currentDurability de 0 (caso borde)", () => {
    // Arrange
    const item = new Item(makeItemProps({ durability: 1 }));
    item.use(); // currentDurability = 0

    // Act
    item.use(); // Intento de usar objeto roto

    // Assert
    expect(item.currentDurability).toBe(0);
  });

  it("isBroken() debería devolver false cuando hay durabilidad restante", () => {
    // Arrange
    const item = new Item(makeItemProps({ durability: 3 }));

    // Act / Assert
    expect(item.isBroken()).toBe(false);
  });

  it("isBroken() debería devolver true cuando currentDurability === 0", () => {
    // Arrange
    const item = new Item(makeItemProps({ durability: 1 }));

    // Act
    item.use();

    // Assert
    expect(item.isBroken()).toBe(true);
  });

  it("Espada de Sangre de Demonio: 3 usos y luego isBroken", () => {
    // Arrange — LIC-010: durabilidad 3
    const sword = new Item(makeItemProps({ durability: 3 }));

    // Act
    sword.use();
    sword.use();
    expect(sword.isBroken()).toBe(false);
    sword.use();

    // Assert
    expect(sword.currentDurability).toBe(0);
    expect(sword.isBroken()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// clone()
// ---------------------------------------------------------------------------

describe("Item.clone()", () => {
  it("debería generar un instanceId diferente al del original", () => {
    // Arrange
    const item = new Item(makeItemProps());

    // Act
    const cloned = item.clone();

    // Assert
    expect(cloned.instanceId).not.toBe(item.instanceId);
  });

  it("el clon debería restaurar currentDurability al valor máximo aunque el original esté usado", () => {
    // Arrange
    const item = new Item(makeItemProps({ durability: 3 }));
    item.use();
    item.use(); // currentDurability = 1

    // Act
    const cloned = item.clone();

    // Assert
    expect(cloned.currentDurability).toBe(3);
  });

  it("el clon debería preservar statModifier y targetType del original", () => {
    // Arrange
    const item = new Item(makeItemProps());

    // Act
    const cloned = item.clone();

    // Assert
    expect(cloned.statModifier.attackBonus).toBe(item.statModifier.attackBonus);
    expect(cloned.targetType).toBe(item.targetType);
  });

  it("el clon debería preservar onTurnStartEffect cuando existe", () => {
    // Arrange
    const item = new Item(makeItemProps({ onTurnStartEffect: { type: "DamageOwner", value: 1 } }));

    // Act
    const cloned = item.clone();

    // Assert
    expect(cloned.onTurnStartEffect).toBeDefined();
    expect(cloned.onTurnStartEffect?.type).toBe("DamageOwner");
  });

  it("el clon debería preservar abilityGranted null", () => {
    // Arrange
    const item = new Item(makeItemProps({ abilityGranted: null }));

    // Act
    const cloned = item.clone();

    // Assert
    expect(cloned.abilityGranted).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Casos de uso reales del catálogo
// ---------------------------------------------------------------------------

describe("Item — casos de uso del catálogo", () => {
  it("Omnitrix: durabilidad 2, sin onTurnStartEffect, sin abilityGranted base", () => {
    // Arrange — AXE-010: durabilidad 2, coste 4
    const omnitrix = new Item({
      staticId: "AXE-010",
      name: "Omnitrix",
      type: CardType.Item,
      archetype: Archetype.AnimeCombate,
      nostalgyCost: 4,
      rarity: Rarity.Legendary,
      description: "Equipable; reemplaza habilidad de héroe por 3 opciones. Durabilidad 2.",
      spriteKey: "omnitrix_card",
      greetingText: "¡Es hora del héroe!",
      targetType: "Hero",
      statModifier: { attackBonus: 0, healthBonus: 0 },
      abilityGranted: null,
      durability: 2,
    });

    // Assert
    expect(omnitrix.durability).toBe(2);
    expect(omnitrix.currentDurability).toBe(2);
    expect(omnitrix.onTurnStartEffect).toBeUndefined();
    expect(omnitrix.isBroken()).toBe(false);

    // Act — usar 2 veces hasta que se rompa
    omnitrix.use();
    omnitrix.use();

    // Assert
    expect(omnitrix.isBroken()).toBe(true);
  });

  it("El Poder: durabilidad 1, sin statModifier bonus, AoE al activarse", () => {
    // Arrange — LIC-009: durabilidad 1 (uso único)
    const elPoder = new Item({
      staticId: "LIC-009",
      name: "El Poder",
      type: CardType.Item,
      archetype: Archetype.Neutral,
      nostalgyCost: 3,
      rarity: Rarity.Epic,
      description: "Equipable; activa AoE 3 daño a todos los enemigos. Durabilidad 1.",
      spriteKey: "el_poder_card",
      greetingText: "¡Rigby, no lo toques!",
      targetType: "Hero",
      statModifier: { attackBonus: 0, healthBonus: 0 },
      abilityGranted: null,
      durability: 1,
    });

    // Act
    elPoder.use();

    // Assert
    expect(elPoder.isBroken()).toBe(true);
  });
});
