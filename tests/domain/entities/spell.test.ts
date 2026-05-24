/**
 * Tests unitarios para src/domain/entities/spell.ts
 *
 * Cobertura objetivo: ≥ 80%.
 * Estructura: AAA (Arrange – Act – Assert).
 * Framework: Vitest.
 */

import { describe, it, expect } from "vitest";
import { Spell } from "@domain/entities/spell";
import type { SpellProps } from "@domain/entities/spell";
import { CardType, Archetype, Rarity } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeSpellProps(overrides: Partial<SpellProps> = {}): SpellProps {
  return {
    staticId: "LIC-008",
    name: "Cangreburger",
    type: CardType.Spell,
    archetype: Archetype.Neutral,
    nostalgyCost: 2,
    rarity: Rarity.Common,
    description: "Restaura 3 PV al héroe aliado y roba 1 carta.",
    spriteKey: "cangreburger_card",
    greetingText: "¡El sabor secreto!",
    effectType: "HealAndDraw",
    targetType: "Self",
    effectValue: 3,
    drawCount: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Construcción
// ---------------------------------------------------------------------------

describe("Spell — construcción", () => {
  it("debería asignar effectType correctamente", () => {
    const spell = new Spell(makeSpellProps({ effectType: "HealAndDraw" }));
    expect(spell.effectType).toBe("HealAndDraw");
  });

  it("debería asignar targetType correctamente", () => {
    const spell = new Spell(makeSpellProps({ targetType: "Self" }));
    expect(spell.targetType).toBe("Self");
  });

  it("debería asignar effectValue correctamente", () => {
    const spell = new Spell(makeSpellProps({ effectValue: 3 }));
    expect(spell.effectValue).toBe(3);
  });

  it("debería asignar drawCount cuando se proporciona", () => {
    const spell = new Spell(makeSpellProps({ drawCount: 1 }));
    expect(spell.drawCount).toBe(1);
  });

  it("drawCount debería ser undefined cuando no se proporciona", () => {
    // Arrange — omitir drawCount del objeto de props
    const base = makeSpellProps();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { drawCount: _drop, ...withoutDraw } = base;
    const spell = new Spell(withoutDraw);
    expect(spell.drawCount).toBeUndefined();
  });

  it("debería heredar los campos base de Card correctamente", () => {
    const spell = new Spell(makeSpellProps());
    expect(spell.staticId).toBe("LIC-008");
    expect(spell.name).toBe("Cangreburger");
    expect(spell.type).toBe(CardType.Spell);
    expect(spell.nostalgyCost).toBe(2);
    expect(spell.rarity).toBe(Rarity.Common);
  });

  it("debería generar un instanceId con formato UUID v4", () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const spell = new Spell(makeSpellProps());
    expect(spell.instanceId).toMatch(uuidRegex);
  });
});

// ---------------------------------------------------------------------------
// clone()
// ---------------------------------------------------------------------------

describe("Spell.clone()", () => {
  it("debería generar un instanceId diferente al del original", () => {
    // Arrange
    const spell = new Spell(makeSpellProps());

    // Act
    const cloned = spell.clone();

    // Assert
    expect(cloned.instanceId).not.toBe(spell.instanceId);
  });

  it("el clon debería preservar effectType, targetType y effectValue", () => {
    // Arrange
    const spell = new Spell(makeSpellProps());

    // Act
    const cloned = spell.clone();

    // Assert
    expect(cloned.effectType).toBe(spell.effectType);
    expect(cloned.targetType).toBe(spell.targetType);
    expect(cloned.effectValue).toBe(spell.effectValue);
  });

  it("el clon debería preservar drawCount cuando existe", () => {
    const spell = new Spell(makeSpellProps({ drawCount: 1 }));
    const cloned = spell.clone();
    expect(cloned.drawCount).toBe(1);
  });

  it("el clon debería preservar drawCount como undefined cuando no existe", () => {
    // Arrange
    const base = makeSpellProps();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { drawCount: _drop, ...withoutDraw } = base;
    const spell = new Spell(withoutDraw);

    // Act
    const cloned = spell.clone();

    // Assert
    expect(cloned.drawCount).toBeUndefined();
  });

  it("el clon debería preservar el staticId del original", () => {
    const spell = new Spell(makeSpellProps({ staticId: "AXE-007" }));
    const cloned = spell.clone();
    expect(cloned.staticId).toBe("AXE-007");
  });

  it("dos clones del mismo Spell deberían tener instanceIds distintos entre sí (caso borde)", () => {
    const spell = new Spell(makeSpellProps());
    const clone1 = spell.clone();
    const clone2 = spell.clone();
    expect(clone1.instanceId).not.toBe(clone2.instanceId);
  });
});

// ---------------------------------------------------------------------------
// Casos de uso reales del catálogo
// ---------------------------------------------------------------------------

describe("Spell — casos de uso del catálogo", () => {
  it("Cangreburger: curación 3 PV + roba 1 carta, coste 2", () => {
    // Arrange
    const cangreburger = new Spell({
      staticId: "LIC-008",
      name: "Cangreburger",
      type: CardType.Spell,
      archetype: Archetype.Neutral,
      nostalgyCost: 2,
      rarity: Rarity.Common,
      description: "Restaura 3 PV al héroe aliado y roba 1 carta.",
      spriteKey: "cangreburger_card",
      greetingText: "¡El sabor secreto!",
      effectType: "HealAndDraw",
      targetType: "Self",
      effectValue: 3,
      drawCount: 1,
    });

    // Assert
    expect(cangreburger.effectType).toBe("HealAndDraw");
    expect(cangreburger.effectValue).toBe(3);
    expect(cangreburger.drawCount).toBe(1);
    expect(cangreburger.nostalgyCost).toBe(2);
  });

  it("Pedo Poderoso: AoE 2 daño a todos los enemigos, sin drawCount", () => {
    // Arrange — AXE-007
    const pedoPoderoso = new Spell({
      staticId: "AXE-007",
      name: "Pedo Poderoso",
      type: CardType.Spell,
      archetype: Archetype.Neutral,
      nostalgyCost: 4,
      rarity: Rarity.Epic,
      description: "Inflige 2 daño a todos los Personajes enemigos.",
      spriteKey: "pedo_poderoso_card",
      greetingText: "¡El arma secreta!",
      effectType: "AOEDamage",
      targetType: "AllEnemies",
      effectValue: 2,
    });

    // Assert
    expect(pedoPoderoso.effectType).toBe("AOEDamage");
    expect(pedoPoderoso.effectValue).toBe(2);
    expect(pedoPoderoso.drawCount).toBeUndefined();
    expect(pedoPoderoso.rarity).toBe(Rarity.Epic);
  });

  it("Superbocata: curación 6 PV sin drawCount, coste 4", () => {
    // Arrange — LIC-007
    const superbocata = new Spell({
      staticId: "LIC-007",
      name: "Superbocata",
      type: CardType.Spell,
      archetype: Archetype.Neutral,
      nostalgyCost: 4,
      rarity: Rarity.Rare,
      description: "Restaura 6 PV al héroe aliado.",
      spriteKey: "superbocata_card",
      greetingText: "¡El bocadillo más grande!",
      effectType: "Heal",
      targetType: "Self",
      effectValue: 6,
    });

    // Assert
    expect(superbocata.effectValue).toBe(6);
    expect(superbocata.drawCount).toBeUndefined();
    expect(superbocata.nostalgyCost).toBe(4);
  });
});
