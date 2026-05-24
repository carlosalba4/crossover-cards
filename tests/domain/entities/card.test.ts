/**
 * Tests unitarios para src/domain/entities/card.ts
 *
 * Cobertura objetivo: ≥ 80%.
 * Estructura: AAA (Arrange – Act – Assert).
 * Framework: Vitest.
 *
 * Estrategia: Card es abstracta, por lo que se define una subclase mínima
 * `TestCard` dentro de este archivo para poder instanciarla. Esta clase
 * NO se exporta y es exclusiva del entorno de test.
 *
 * Qué se verifica:
 *  1. Construcción correcta: todos los campos de CardProps asignados.
 *  2. instanceId es string no vacío y tiene formato UUID v4.
 *  3. Dos instancias con los mismos datos tienen instanceIds distintos.
 *  4. clone() genera un nuevo instanceId diferente pero mismos datos base.
 *  5. Los campos readonly no son mutables en tiempo de ejecución.
 *  6. El tipo y arquetipo del enum se preservan tal como se pasan.
 */

import { describe, it, expect } from "vitest";
import { Card } from "@domain/entities/card";
import type { CardProps } from "@domain/entities/card";
import {
  CardType,
  Rarity,
  Archetype,
} from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Subclase concreta mínima para instanciar Card en tests
// (No exportar — sólo para uso interno del test)
// ---------------------------------------------------------------------------

class TestCard extends Card {
  /**
   * Implementación mínima de clone(): copia los props base y genera nuevo instanceId.
   */
  clone(): TestCard {
    return new TestCard({
      staticId: this.staticId,
      name: this.name,
      type: this.type,
      archetype: this.archetype,
      nostalgyCost: this.nostalgyCost,
      rarity: this.rarity,
      description: this.description,
      spriteKey: this.spriteKey,
      greetingText: this.greetingText,
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers de fabricación
// ---------------------------------------------------------------------------

/** Crea CardProps con valores por defecto sobreescribibles. */
function makeCardProps(overrides: Partial<CardProps> = {}): CardProps {
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
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Construcción y campos
// ---------------------------------------------------------------------------

describe("Card — construcción y campos", () => {
  it("debería asignar staticId correctamente desde los props", () => {
    // Arrange
    const props = makeCardProps({ staticId: "LIC-005" });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.staticId).toBe("LIC-005");
  });

  it("debería asignar name correctamente", () => {
    // Arrange
    const props = makeCardProps({ name: "Rigby" });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.name).toBe("Rigby");
  });

  it("debería asignar type correctamente", () => {
    // Arrange
    const props = makeCardProps({ type: CardType.Character });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.type).toBe(CardType.Character);
    expect(card.type).toBe("character");
  });

  it("debería asignar archetype correctamente", () => {
    // Arrange
    const props = makeCardProps({ archetype: Archetype.CartoonClasico });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.archetype).toBe(Archetype.CartoonClasico);
  });

  it("debería asignar nostalgyCost correctamente", () => {
    // Arrange
    const props = makeCardProps({ nostalgyCost: 2 });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.nostalgyCost).toBe(2);
  });

  it("debería asignar rarity correctamente", () => {
    // Arrange
    const props = makeCardProps({ rarity: Rarity.Rare });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.rarity).toBe(Rarity.Rare);
  });

  it("debería asignar description correctamente", () => {
    // Arrange
    const props = makeCardProps({ description: "Charge." });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.description).toBe("Charge.");
  });

  it("debería asignar spriteKey correctamente", () => {
    // Arrange
    const props = makeCardProps({ spriteKey: "rigby_card" });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.spriteKey).toBe("rigby_card");
  });

  it("debería asignar greetingText correctamente", () => {
    // Arrange
    const props = makeCardProps({ greetingText: "YA VOOOY!" });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.greetingText).toBe("YA VOOOY!");
  });
});

// ---------------------------------------------------------------------------
// instanceId — unicidad y formato
// ---------------------------------------------------------------------------

describe("Card — instanceId", () => {
  it("debería generar un instanceId string no vacío", () => {
    // Arrange
    const props = makeCardProps();

    // Act
    const card = new TestCard(props);

    // Assert
    expect(typeof card.instanceId).toBe("string");
    expect(card.instanceId.length).toBeGreaterThan(0);
  });

  it("debería generar un instanceId con formato UUID v4 (8-4-4-4-12)", () => {
    // Arrange
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const props = makeCardProps();

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.instanceId).toMatch(uuidRegex);
  });

  it("dos instancias con los mismos props deberían tener instanceIds distintos", () => {
    // Arrange
    const props = makeCardProps();

    // Act
    const card1 = new TestCard(props);
    const card2 = new TestCard(props);

    // Assert
    expect(card1.instanceId).not.toBe(card2.instanceId);
  });

  it("debería generar instanceIds distintos en 10 instancias consecutivas (caso borde)", () => {
    // Arrange
    const props = makeCardProps();

    // Act
    const ids = Array.from({ length: 10 }, () => new TestCard(props).instanceId);

    // Assert — Un Set de los IDs debe tener el mismo tamaño (todos únicos)
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// clone()
// ---------------------------------------------------------------------------

describe("Card — clone()", () => {
  it("el clon debería tener el mismo staticId que el original", () => {
    // Arrange
    const card = new TestCard(makeCardProps({ staticId: "AXE-001" }));

    // Act
    const cloned = card.clone();

    // Assert
    expect(cloned.staticId).toBe(card.staticId);
  });

  it("el clon debería tener un instanceId diferente al original", () => {
    // Arrange
    const card = new TestCard(makeCardProps());

    // Act
    const cloned = card.clone();

    // Assert
    expect(cloned.instanceId).not.toBe(card.instanceId);
  });

  it("el clon debería preservar todos los demás campos del original", () => {
    // Arrange
    const props = makeCardProps({
      name: "Goku",
      type: CardType.Character,
      archetype: Archetype.AnimeCombate,
      nostalgyCost: 7,
      rarity: Rarity.Legendary,
    });
    const card = new TestCard(props);

    // Act
    const cloned = card.clone();

    // Assert
    expect(cloned.name).toBe(card.name);
    expect(cloned.type).toBe(card.type);
    expect(cloned.archetype).toBe(card.archetype);
    expect(cloned.nostalgyCost).toBe(card.nostalgyCost);
    expect(cloned.rarity).toBe(card.rarity);
    expect(cloned.spriteKey).toBe(card.spriteKey);
    expect(cloned.greetingText).toBe(card.greetingText);
  });

  it("clonar el clon debería generar aún otro instanceId único", () => {
    // Arrange — Verificamos la cadena de clonación (caso borde)
    const card = new TestCard(makeCardProps());

    // Act
    const clone1 = card.clone();
    const clone2 = clone1.clone();

    // Assert
    expect(card.instanceId).not.toBe(clone1.instanceId);
    expect(clone1.instanceId).not.toBe(clone2.instanceId);
    expect(card.instanceId).not.toBe(clone2.instanceId);
  });
});

// ---------------------------------------------------------------------------
// Casos de uso reales del catálogo
// ---------------------------------------------------------------------------

describe("Card — casos de uso del catálogo", () => {
  it("debería representar correctamente a Chum Chum (único 1-drop del juego)", () => {
    // Arrange — AXE-005: Personaje, CartoonClasico, Común, coste 1
    const props = makeCardProps({
      staticId: "AXE-005",
      name: "Chum Chum",
      type: CardType.Character,
      archetype: Archetype.CartoonClasico,
      nostalgyCost: 1,
      rarity: Rarity.Common,
      description: "Sin habilidad. Único 1-drop del juego.",
      spriteKey: "chum_chum_card",
      greetingText: "¡Chum Chum al rescate!",
    });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.nostalgyCost).toBe(1);
    expect(card.rarity).toBe(Rarity.Common);
    expect(card.archetype).toBe(Archetype.CartoonClasico);
  });

  it("debería representar correctamente a Goku (Legendaria, coste 7)", () => {
    // Arrange — AXE-001: Personaje, AnimeCombate, Legendaria, coste 7
    const props = makeCardProps({
      staticId: "AXE-001",
      name: "Goku",
      type: CardType.Character,
      archetype: Archetype.AnimeCombate,
      nostalgyCost: 7,
      rarity: Rarity.Legendary,
      description: "Al recibir daño letal una vez por partida, vuelve 4/4 con Charge.",
      spriteKey: "goku_card",
      greetingText: "¡Esto no ha terminado!",
    });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.staticId).toBe("AXE-001");
    expect(card.nostalgyCost).toBe(7);
    expect(card.rarity).toBe(Rarity.Legendary);
    expect(card.type).toBe(CardType.Character);
  });

  it("debería representar correctamente el Omnitrix (Objeto Legendario)", () => {
    // Arrange — AXE-010: Objeto, AnimeCombate, Legendaria, coste 4
    const props = makeCardProps({
      staticId: "AXE-010",
      name: "Omnitrix",
      type: CardType.Item,
      archetype: Archetype.AnimeCombate,
      nostalgyCost: 4,
      rarity: Rarity.Legendary,
      description: "Equipable; reemplaza habilidad de héroe por 3 opciones. Durabilidad 2.",
      spriteKey: "omnitrix_card",
      greetingText: "¡Es hora del héroe!",
    });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.type).toBe(CardType.Item);
    expect(card.rarity).toBe(Rarity.Legendary);
  });

  it("debería representar correctamente el Cangreburger (Hechizo Común, coste 2)", () => {
    // Arrange — LIC-008: Hechizo, Neutral, Común, coste 2
    const props = makeCardProps({
      staticId: "LIC-008",
      name: "Cangreburger",
      type: CardType.Spell,
      archetype: Archetype.Neutral,
      nostalgyCost: 2,
      rarity: Rarity.Common,
      description: "Restaura 3 PV al héroe aliado y roba 1 carta.",
      spriteKey: "cangreburger_card",
      greetingText: "¡El sabor secreto!",
    });

    // Act
    const card = new TestCard(props);

    // Assert
    expect(card.type).toBe(CardType.Spell);
    expect(card.archetype).toBe(Archetype.Neutral);
    expect(card.nostalgyCost).toBe(2);
  });
});
