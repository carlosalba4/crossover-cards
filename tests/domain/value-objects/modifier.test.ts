/**
 * Tests unitarios para src/domain/value-objects/modifier.ts
 *
 * Cobertura objetivo: ≥ 80%.
 * Estructura: AAA (Arrange – Act – Assert).
 * Framework: Vitest.
 *
 * Qué se verifica:
 *  1. Construcción correcta: todos los campos accesibles y con valor correcto.
 *  2. Inmutabilidad: los campos readonly no se modifican tras la construcción.
 *  3. isExpired() — todos los casos de duración:
 *     a. duration === -1  → permanente, nunca expira.
 *     b. duration === 0   → expira de inmediato (one-shot).
 *     c. duration > 0     → expira cuando currentTurn - appliedAtTurn >= duration.
 *     d. Casos borde: turno anterior, mismo turno de aplicación, varios turnos después.
 *  4. Copia defensiva de abilitiesGranted: mutar el array original no afecta al modifier.
 */

import { describe, it, expect } from "vitest";
import { Modifier } from "@domain/value-objects/modifier";
import type { IModifier, ModifierProps } from "@domain/value-objects/modifier";
import { Ability } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Helpers de fabricación para los tests
// ---------------------------------------------------------------------------

/** Crea un ModifierProps con valores por defecto sobreescribibles. */
function makeProps(overrides: Partial<ModifierProps> = {}): ModifierProps {
  return {
    source: "test-source",
    attackBonus: 0,
    healthBonus: 0,
    abilitiesGranted: [],
    duration: 1,
    appliedAtTurn: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Construcción
// ---------------------------------------------------------------------------

describe("Modifier — construcción", () => {
  it("debería asignar correctamente el campo source", () => {
    // Arrange
    const props = makeProps({ source: "synergy" });

    // Act
    const modifier = new Modifier(props);

    // Assert
    expect(modifier.source).toBe("synergy");
  });

  it("debería asignar correctamente attackBonus positivo", () => {
    // Arrange
    const props = makeProps({ attackBonus: 2 });

    // Act
    const modifier = new Modifier(props);

    // Assert
    expect(modifier.attackBonus).toBe(2);
  });

  it("debería asignar correctamente attackBonus negativo (debuff)", () => {
    // Arrange — Linterna Minimizadora reduce ATQ a la mitad
    const props = makeProps({ attackBonus: -3 });

    // Act
    const modifier = new Modifier(props);

    // Assert
    expect(modifier.attackBonus).toBe(-3);
  });

  it("debería asignar correctamente healthBonus", () => {
    // Arrange
    const props = makeProps({ healthBonus: 1 });

    // Act
    const modifier = new Modifier(props);

    // Assert
    expect(modifier.healthBonus).toBe(1);
  });

  it("debería asignar correctamente abilitiesGranted con una habilidad", () => {
    // Arrange — Modifier que concede Taunt temporal (outcome 5 de Patricio)
    const props = makeProps({ abilitiesGranted: [Ability.Taunt], duration: 1 });

    // Act
    const modifier = new Modifier(props);

    // Assert
    expect(modifier.abilitiesGranted).toContain(Ability.Taunt);
    expect(modifier.abilitiesGranted).toHaveLength(1);
  });

  it("debería asignar correctamente appliedAtTurn", () => {
    // Arrange
    const props = makeProps({ appliedAtTurn: 5 });

    // Act
    const modifier = new Modifier(props);

    // Assert
    expect(modifier.appliedAtTurn).toBe(5);
  });

  it("debería asignar duration correctamente", () => {
    // Arrange
    const props = makeProps({ duration: 3 });

    // Act
    const modifier = new Modifier(props);

    // Assert
    expect(modifier.duration).toBe(3);
  });

  it("debería implementar la interfaz IModifier (verificación estructural)", () => {
    // Arrange
    const props = makeProps();

    // Act
    const modifier: IModifier = new Modifier(props);

    // Assert — Si TypeScript compila, el contrato se cumple; verificamos en runtime
    expect(typeof modifier.source).toBe("string");
    expect(typeof modifier.attackBonus).toBe("number");
    expect(typeof modifier.healthBonus).toBe("number");
    expect(Array.isArray(modifier.abilitiesGranted)).toBe(true);
    expect(typeof modifier.duration).toBe("number");
    expect(typeof modifier.isExpired).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Inmutabilidad
// ---------------------------------------------------------------------------

describe("Modifier — inmutabilidad (copia defensiva)", () => {
  it("mutar el array original después de construir no debería afectar al modifier", () => {
    // Arrange
    const originalAbilities: Ability[] = [Ability.Charge];
    const props = makeProps({ abilitiesGranted: originalAbilities });
    const modifier = new Modifier(props);

    // Act — Mutamos el array original externo
    originalAbilities.push(Ability.Taunt);

    // Assert — El modifier no debe verse afectado
    expect(modifier.abilitiesGranted).toHaveLength(1);
    expect(modifier.abilitiesGranted).not.toContain(Ability.Taunt);
  });
});

// ---------------------------------------------------------------------------
// isExpired — duration === -1 (permanente)
// ---------------------------------------------------------------------------

describe("Modifier.isExpired() — duration === -1 (permanente)", () => {
  it("debería devolver false en cualquier turno futuro", () => {
    // Arrange — Modifier permanente: +2 ATQ de Patricio (outcome 1)
    const modifier = new Modifier(
      makeProps({ duration: -1, appliedAtTurn: 1 })
    );

    // Act
    const expiredTurn10 = modifier.isExpired(10, 1);
    const expiredTurn100 = modifier.isExpired(100, 1);

    // Assert
    expect(expiredTurn10).toBe(false);
    expect(expiredTurn100).toBe(false);
  });

  it("debería devolver false incluso cuando currentTurn === appliedAtTurn", () => {
    // Arrange
    const modifier = new Modifier(
      makeProps({ duration: -1, appliedAtTurn: 3 })
    );

    // Act
    const result = modifier.isExpired(3, 3);

    // Assert
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isExpired — duration === 0 (one-shot)
// ---------------------------------------------------------------------------

describe("Modifier.isExpired() — duration === 0 (one-shot)", () => {
  it("debería devolver true inmediatamente en el mismo turno de aplicación", () => {
    // Arrange — Battlecry one-shot: roba 1 carta (outcome 6 de Patricio)
    const modifier = new Modifier(
      makeProps({ duration: 0, appliedAtTurn: 2 })
    );

    // Act — Turno actual = turno de aplicación
    const result = modifier.isExpired(2, 2);

    // Assert
    expect(result).toBe(true);
  });

  it("debería devolver true en turnos posteriores al de aplicación", () => {
    // Arrange
    const modifier = new Modifier(
      makeProps({ duration: 0, appliedAtTurn: 1 })
    );

    // Act
    const result = modifier.isExpired(5, 1);

    // Assert
    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isExpired — duration > 0 (duración finita)
// ---------------------------------------------------------------------------

describe("Modifier.isExpired() — duration > 0 (duración finita)", () => {
  it("debería devolver false cuando no ha transcurrido el tiempo de duración", () => {
    // Arrange — Taunt temporal de 1 turno aplicado en turno 3
    const modifier = new Modifier(
      makeProps({ duration: 1, appliedAtTurn: 3 })
    );

    // Act — Todavía en el turno 3 (0 turnos transcurridos)
    const result = modifier.isExpired(3, 3);

    // Assert
    expect(result).toBe(false);
  });

  it("debería devolver true exactamente cuando se alcanza la duración (caso borde)", () => {
    // Arrange — Modifier de 1 turno aplicado en turno 3
    const modifier = new Modifier(
      makeProps({ duration: 1, appliedAtTurn: 3 })
    );

    // Act — Turno 4: currentTurn - appliedAtTurn = 1 >= duration 1 → expirado
    const result = modifier.isExpired(4, 3);

    // Assert
    expect(result).toBe(true);
  });

  it("debería devolver true cuando se supera la duración", () => {
    // Arrange — Modifier de 2 turnos aplicado en turno 1
    const modifier = new Modifier(
      makeProps({ duration: 2, appliedAtTurn: 1 })
    );

    // Act — Turno 5: 5 - 1 = 4 >= 2 → expirado
    const result = modifier.isExpired(5, 1);

    // Assert
    expect(result).toBe(true);
  });

  it("debería devolver false cuando aún quedan turnos de duración", () => {
    // Arrange — Modifier de 3 turnos aplicado en turno 2
    const modifier = new Modifier(
      makeProps({ duration: 3, appliedAtTurn: 2 })
    );

    // Act — Turno 4: 4 - 2 = 2 < 3 → sigue activo
    const result = modifier.isExpired(4, 2);

    // Assert
    expect(result).toBe(false);
  });

  it("debería respetar appliedAtTurn del parámetro (no el del campo interno)", () => {
    // Arrange — Probamos que el parámetro del método tiene precedencia
    // (diseño deliberado: permite reutilizar el modifier con contextos distintos)
    const modifier = new Modifier(
      makeProps({ duration: 1, appliedAtTurn: 1 })
    );

    // Act — Le pasamos appliedAtTurn = 5, currentTurn = 5 → 0 transcurridos → NO expirado
    const result = modifier.isExpired(5, 5);

    // Assert
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Casos de uso reales del catálogo
// ---------------------------------------------------------------------------

describe("Modifier — casos de uso del catálogo", () => {
  it("sinergia tribal Cartoon Clásico debería expirar al siguiente turno", () => {
    // Arrange — TribalSynergySystem aplica +2 ATQ por turno mientras hay 3 Cartoon
    const synergy = new Modifier({
      source: "synergy",
      attackBonus: 2,
      healthBonus: 0,
      abilitiesGranted: [],
      duration: 1,
      appliedAtTurn: 4,
    });

    // Act
    const stillActiveInTurn4 = synergy.isExpired(4, 4);
    const expiredInTurn5 = synergy.isExpired(5, 4);

    // Assert
    expect(stillActiveInTurn4).toBe(false);
    expect(expiredInTurn5).toBe(true);
  });

  it("modifier de Patricio (+2 ATQ permanente, outcome 1) nunca debería expirar", () => {
    // Arrange — outcome 1 de Patricio: +2 ATQ, duration: -1
    const patricioMod = new Modifier({
      source: "patricio_random",
      attackBonus: 2,
      healthBonus: 0,
      abilitiesGranted: [],
      duration: -1,
      appliedAtTurn: 3,
    });

    // Act
    const notExpiredTurn10 = patricioMod.isExpired(10, 3);

    // Assert
    expect(notExpiredTurn10).toBe(false);
    expect(patricioMod.source).toBe("patricio_random");
  });

  it("modifier de SpellImmunity del Fantasma Chocala debería expirar al final del turno de entrada", () => {
    // Arrange — Fantasma Chocala: inmune a hechizos el turno de entrada (duration: 1)
    const spellImmunity = new Modifier({
      source: "fantasma-chocala-battlecry",
      attackBonus: 0,
      healthBonus: 0,
      abilitiesGranted: [Ability.SpellImmunity],
      duration: 1,
      appliedAtTurn: 2,
    });

    // Act
    const activeOnTurn2 = spellImmunity.isExpired(2, 2);
    const expiredOnTurn3 = spellImmunity.isExpired(3, 2);

    // Assert
    expect(activeOnTurn2).toBe(false);
    expect(expiredOnTurn3).toBe(true);
    expect(spellImmunity.abilitiesGranted).toContain(Ability.SpellImmunity);
  });
});
