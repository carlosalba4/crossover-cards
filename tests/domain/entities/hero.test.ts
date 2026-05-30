/**
 * Tests unitarios para src/domain/entities/hero.ts
 *
 * Cobertura objetivo: ≥ 80%.
 * Estructura: AAA (Arrange – Act – Assert).
 * Framework: Vitest.
 *
 * Estrategia:
 *   - IHeroPower se inyecta como objeto literal (mock) para verificar
 *     que la interfaz es inyectable sin dependencias concretas.
 *   - Item se crea con la clase concreta para testear equipItem/unequipItem.
 *
 * Qué se verifica:
 *  1. Construcción: campos readonly y valores iniciales mutables.
 *  2. takeDamage(): reducción correcta, nunca por debajo de 0 (casos borde).
 *  3. heal(): incremento correcto, nunca supera maxHealth (casos borde).
 *  4. isAlive(): true con vida, false con vida = 0.
 *  5. resetTurn(): pone hasUsedHeroPowerThisTurn = false.
 *  6. equipItem() / unequipItem(): gestión del objeto equipado.
 *  7. useHeroPower(): marca el flag de uso.
 *  8. IHeroPower inyectable: distintos mocks producen héroes distintos.
 */

import { describe, it, expect } from "vitest";
import { Hero } from "@domain/entities/hero";
import type { HeroProps, IHeroPower } from "@domain/entities/hero";
import { Item } from "@domain/entities/item";
import type { ItemProps } from "@domain/entities/item";
import { Archetype, CardType, Rarity } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Mocks de IHeroPower
// ---------------------------------------------------------------------------

/** Mock de "Hechizo Ancestral" (El Lich) — 2 daño a cualquier objetivo, coste 2. */
const hechizoPower: IHeroPower = {
  name: "Hechizo Ancestral",
  nostalgyCost: 2,
  effectType: "Damage",
  targetType: "Any",
  value: 2,
};

/** Mock de "Tornado de Fuego" (Axel Blaze) — +2 ATQ a Personaje aliada, coste 2. */
const tornadoPower: IHeroPower = {
  name: "Tornado de Fuego",
  nostalgyCost: 2,
  effectType: "AttackBuff",
  targetType: "AlliedCharacter",
  value: 2,
};

// ---------------------------------------------------------------------------
// Helpers de fabricación
// ---------------------------------------------------------------------------

function makeHeroProps(overrides: Partial<HeroProps> = {}): HeroProps {
  return {
    staticId: "HERO-001",
    name: "El Lich",
    archetype: Archetype.AventuraMagica,
    maxHealth: 30,
    heroPower: hechizoPower,
    ...overrides,
  };
}

function makeItemProps(overrides: Partial<ItemProps> = {}): ItemProps {
  return {
    staticId: "LIC-009",
    name: "El Poder",
    type: CardType.Item,
    archetype: Archetype.Neutral,
    nostalgyCost: 3,
    rarity: Rarity.Epic,
    description: "AoE 3 daño. Durabilidad 1.",
    spriteKey: "el_poder_card",
    greetingText: "¡Rigby, no lo toques!",
    targetType: "Hero",
    statModifier: { attackBonus: 0, healthBonus: 0 },
    abilityGranted: null,
    durability: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Construcción
// ---------------------------------------------------------------------------

describe("Hero — construcción", () => {
  it("debería asignar staticId correctamente", () => {
    // Arrange / Act
    const hero = new Hero(makeHeroProps({ staticId: "HERO-001" }));

    // Assert
    expect(hero.staticId).toBe("HERO-001");
  });

  it("debería asignar name correctamente", () => {
    const hero = new Hero(makeHeroProps({ name: "El Lich" }));
    expect(hero.name).toBe("El Lich");
  });

  it("debería asignar archetype correctamente", () => {
    const hero = new Hero(makeHeroProps({ archetype: Archetype.AventuraMagica }));
    expect(hero.archetype).toBe(Archetype.AventuraMagica);
  });

  it("debería asignar maxHealth correctamente", () => {
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));
    expect(hero.maxHealth).toBe(30);
  });

  it("debería inicializar currentHealth igual a maxHealth", () => {
    // Arrange / Act
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));

    // Assert
    expect(hero.currentHealth).toBe(30);
  });

  it("debería inicializar hasUsedHeroPowerThisTurn en false", () => {
    const hero = new Hero(makeHeroProps());
    expect(hero.hasUsedHeroPowerThisTurn).toBe(false);
  });

  it("debería inicializar equippedItem en null", () => {
    const hero = new Hero(makeHeroProps());
    expect(hero.equippedItem).toBeNull();
  });

  it("debería almacenar la heroPower inyectada correctamente", () => {
    // Arrange / Act
    const hero = new Hero(makeHeroProps({ heroPower: hechizoPower }));

    // Assert
    expect(hero.heroPower.name).toBe("Hechizo Ancestral");
    expect(hero.heroPower.nostalgyCost).toBe(2);
    expect(hero.heroPower.effectType).toBe("Damage");
    expect(hero.heroPower.targetType).toBe("Any");
    expect(hero.heroPower.value).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// takeDamage()
// ---------------------------------------------------------------------------

describe("Hero.takeDamage()", () => {
  it("debería reducir currentHealth correctamente", () => {
    // Arrange
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));

    // Act
    hero.takeDamage(10);

    // Assert
    expect(hero.currentHealth).toBe(20);
  });

  it("currentHealth nunca debería bajar de 0 con daño exactamente igual a la vida", () => {
    // Arrange
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));

    // Act
    hero.takeDamage(30);

    // Assert
    expect(hero.currentHealth).toBe(0);
  });

  it("takeDamage(50) con maxHealth = 30 debería dejar currentHealth = 0 (caso borde)", () => {
    // Arrange — Daño superior a la vida máxima
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));

    // Act
    hero.takeDamage(50);

    // Assert
    expect(hero.currentHealth).toBe(0);
  });

  it("daño acumulado debería reducir currentHealth correctamente", () => {
    // Arrange
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));

    // Act
    hero.takeDamage(10);
    hero.takeDamage(10);

    // Assert
    expect(hero.currentHealth).toBe(10);
  });

  it("daño de 0 no debería cambiar currentHealth", () => {
    // Arrange
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));

    // Act
    hero.takeDamage(0);

    // Assert
    expect(hero.currentHealth).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// heal()
// ---------------------------------------------------------------------------

describe("Hero.heal()", () => {
  it("debería incrementar currentHealth correctamente", () => {
    // Arrange
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));
    hero.takeDamage(10); // currentHealth = 20

    // Act
    hero.heal(5);

    // Assert
    expect(hero.currentHealth).toBe(25);
  });

  it("heal(10) con currentHealth=25 y maxHealth=30 debería dejar currentHealth=30", () => {
    // Arrange — Caso de la tarea: curación que llega justo al máximo
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));
    hero.takeDamage(5); // currentHealth = 25

    // Act
    hero.heal(10);

    // Assert
    expect(hero.currentHealth).toBe(30);
  });

  it("currentHealth nunca debería superar maxHealth aunque la curación sea excesiva (caso borde)", () => {
    // Arrange
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));
    hero.takeDamage(5); // currentHealth = 25

    // Act
    hero.heal(100); // Intento de curar mucho más de lo necesario

    // Assert
    expect(hero.currentHealth).toBe(30);
  });

  it("heal() con currentHealth ya en maxHealth no debería cambiar nada", () => {
    // Arrange — Héroe con vida completa
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));

    // Act
    hero.heal(10);

    // Assert
    expect(hero.currentHealth).toBe(30);
  });

  it("curación + Superbocata (6 PV) desde 20 VID debería llegar a 26, no superar 30", () => {
    // Arrange — Simulación de Superbocata (LIC-007): cura 6 PV
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));
    hero.takeDamage(10); // currentHealth = 20

    // Act
    hero.heal(6);

    // Assert
    expect(hero.currentHealth).toBe(26);
  });
});

// ---------------------------------------------------------------------------
// isAlive()
// ---------------------------------------------------------------------------

describe("Hero.isAlive()", () => {
  it("debería devolver true cuando currentHealth > 0", () => {
    // Arrange / Act
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));

    // Assert
    expect(hero.isAlive()).toBe(true);
  });

  it("debería devolver false cuando currentHealth === 0", () => {
    // Arrange
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));

    // Act
    hero.takeDamage(30);

    // Assert
    expect(hero.isAlive()).toBe(false);
  });

  it("debería devolver false después de daño letal excesivo (caso borde)", () => {
    // Arrange
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));

    // Act
    hero.takeDamage(9999);

    // Assert
    expect(hero.currentHealth).toBe(0);
    expect(hero.isAlive()).toBe(false);
  });

  it("debería devolver true después de curación que saca de 0 (caso borde)", () => {
    // Arrange — Nota: en el juego la curación cuando está a 0 no revive al héroe,
    // pero el test verifica el comportamiento del método heal() puro.
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));
    hero.takeDamage(30); // currentHealth = 0

    // Act
    hero.heal(1);

    // Assert
    expect(hero.currentHealth).toBe(1);
    expect(hero.isAlive()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resetTurn()
// ---------------------------------------------------------------------------

describe("Hero.resetTurn()", () => {
  it("debería poner hasUsedHeroPowerThisTurn = false tras haber usado el hero power", () => {
    // Arrange
    const hero = new Hero(makeHeroProps());
    hero.useHeroPower(); // hasUsedHeroPowerThisTurn = true

    // Act
    hero.resetTurn();

    // Assert
    expect(hero.hasUsedHeroPowerThisTurn).toBe(false);
  });

  it("debería poder llamarse varias veces sin efecto adverso", () => {
    // Arrange
    const hero = new Hero(makeHeroProps());

    // Act
    hero.resetTurn();
    hero.resetTurn();

    // Assert
    expect(hero.hasUsedHeroPowerThisTurn).toBe(false);
  });

  it("resetTurn() no debería afectar a currentHealth ni a equippedItem", () => {
    // Arrange
    const hero = new Hero(makeHeroProps({ maxHealth: 30 }));
    hero.takeDamage(10); // currentHealth = 20
    const item = new Item(makeItemProps());
    hero.equipItem(item);

    // Act
    hero.resetTurn();

    // Assert
    expect(hero.currentHealth).toBe(20);
    expect(hero.equippedItem).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// equipItem() / unequipItem()
// ---------------------------------------------------------------------------

describe("Hero.equipItem() / unequipItem()", () => {
  it("equipItem() debería asignar el item a equippedItem", () => {
    // Arrange
    const hero = new Hero(makeHeroProps());
    const item = new Item(makeItemProps());

    // Act
    hero.equipItem(item);

    // Assert
    expect(hero.equippedItem).toBe(item);
  });

  it("unequipItem() debería poner equippedItem a null", () => {
    // Arrange
    const hero = new Hero(makeHeroProps());
    const item = new Item(makeItemProps());
    hero.equipItem(item);

    // Act
    hero.unequipItem();

    // Assert
    expect(hero.equippedItem).toBeNull();
  });

  it("equipItem() debería reemplazar un item ya equipado", () => {
    // Arrange — Héroe equipa un objeto y luego equipa otro distinto
    const hero = new Hero(makeHeroProps());
    const sword = new Item(
      makeItemProps({ staticId: "LIC-010", name: "Espada de Sangre de Demonio" }),
    );
    const omnitrix = new Item(
      makeItemProps({ staticId: "AXE-010", name: "Omnitrix", durability: 2 }),
    );
    hero.equipItem(sword);

    // Act
    hero.equipItem(omnitrix);

    // Assert
    expect(hero.equippedItem?.staticId).toBe("AXE-010");
  });

  it("unequipItem() sobre un héroe sin item equipado no debería lanzar error", () => {
    // Arrange
    const hero = new Hero(makeHeroProps());

    // Act & Assert
    expect(() => hero.unequipItem()).not.toThrow();
    expect(hero.equippedItem).toBeNull();
  });

  it("el item equipado debería conservar su estado mutable (currentDurability)", () => {
    // Arrange
    const hero = new Hero(makeHeroProps());
    const item = new Item(makeItemProps({ durability: 3 }));
    hero.equipItem(item);

    // Act — El héroe usa el objeto (reduce durabilidad)
    hero.equippedItem?.use();

    // Assert — El mismo item tiene durabilidad reducida
    expect(item.currentDurability).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// useHeroPower()
// ---------------------------------------------------------------------------

describe("Hero.useHeroPower()", () => {
  it("debería poner hasUsedHeroPowerThisTurn = true", () => {
    // Arrange
    const hero = new Hero(makeHeroProps());

    // Act
    hero.useHeroPower();

    // Assert
    expect(hero.hasUsedHeroPowerThisTurn).toBe(true);
  });

  it("llamar useHeroPower() dos veces no debería lanzar error (el servicio valida el flag)", () => {
    // Arrange
    const hero = new Hero(makeHeroProps());

    // Act & Assert
    hero.useHeroPower();
    expect(() => hero.useHeroPower()).not.toThrow();
    expect(hero.hasUsedHeroPowerThisTurn).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// IHeroPower inyectable — distintos mocks
// ---------------------------------------------------------------------------

describe("IHeroPower — inyección de dependencias", () => {
  it("debería poder inyectar un mock de Hechizo Ancestral y recuperar sus campos", () => {
    // Arrange
    const hero = new Hero(makeHeroProps({ heroPower: hechizoPower }));

    // Act / Assert
    expect(hero.heroPower.effectType).toBe("Damage");
    expect(hero.heroPower.value).toBe(2);
  });

  it("debería poder inyectar un mock de Tornado de Fuego y recuperar sus campos", () => {
    // Arrange
    const hero = new Hero(
      makeHeroProps({
        staticId: "HERO-002",
        name: "Axel Blaze",
        archetype: Archetype.AnimeCombate,
        heroPower: tornadoPower,
      }),
    );

    // Act / Assert
    expect(hero.heroPower.name).toBe("Tornado de Fuego");
    expect(hero.heroPower.effectType).toBe("AttackBuff");
    expect(hero.heroPower.targetType).toBe("AlliedCharacter");
  });

  it("dos héroes con distintas heroPower deberían mantener sus datos independientes", () => {
    // Arrange
    const lich = new Hero(makeHeroProps({ heroPower: hechizoPower }));
    const axel = new Hero(
      makeHeroProps({ staticId: "HERO-002", name: "Axel Blaze", heroPower: tornadoPower }),
    );

    // Act / Assert
    expect(lich.heroPower.effectType).toBe("Damage");
    expect(axel.heroPower.effectType).toBe("AttackBuff");
  });

  it("debería admitir un objeto literal anónimo como heroPower sin necesidad de clase", () => {
    // Arrange — Verifica que IHeroPower es inyectable con cualquier literal
    const customPower: IHeroPower = {
      name: "Poder Personalizado",
      nostalgyCost: 3,
      effectType: "CustomEffect",
      targetType: "Self",
      value: 5,
    };
    const hero = new Hero(makeHeroProps({ heroPower: customPower }));

    // Act / Assert
    expect(hero.heroPower.name).toBe("Poder Personalizado");
    expect(hero.heroPower.nostalgyCost).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Casos de uso reales del catálogo
// ---------------------------------------------------------------------------

describe("Hero — casos de uso del catálogo", () => {
  it("El Lich con vida = 30 y Espada de Sangre de Demonio: auto-daño de 3 turnos", () => {
    // Arrange — LIC-010: auto-daño 1 PV/turno durante 3 turnos de durabilidad
    const lich = new Hero(makeHeroProps({ maxHealth: 30 }));
    const sword = new Item(
      makeItemProps({
        staticId: "LIC-010",
        name: "Espada de Sangre de Demonio",
        durability: 3,
        onTurnStartEffect: { type: "DamageOwner", value: 1 },
      }),
    );
    lich.equipItem(sword);

    // Act — Simular 3 turnos de auto-daño
    lich.takeDamage(1);
    lich.takeDamage(1);
    lich.takeDamage(1);

    // Assert
    expect(lich.currentHealth).toBe(27);
    expect(lich.isAlive()).toBe(true);
  });

  it("Axel Blaze a 5 PV activa Momentum (umbral 15); Superbocata lo cura a 11 PV", () => {
    // Arrange — Verificamos heal() no supera maxHealth
    const axel = new Hero(makeHeroProps({ maxHealth: 30, heroPower: tornadoPower }));
    axel.takeDamage(25); // currentHealth = 5

    // Act — Superbocata: restaura 6 PV (docs/04 §5 LIC-007)
    axel.heal(6);

    // Assert
    expect(axel.currentHealth).toBe(11);
    expect(axel.isAlive()).toBe(true);
  });
});
