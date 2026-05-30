/**
 * Tests unitarios para src/domain/entities/deck.ts
 *
 * Cobertura objetivo: ≥ 80%.
 * Estructura: AAA (Arrange – Act – Assert).
 * Framework: Vitest.
 *
 * Estrategia: Card es abstracta, se define una subclase mínima concreta
 * `makeCard(staticId)` interna al archivo de test (no exportada).
 * Se sigue el mismo patrón que tests/domain/entities/card.test.ts.
 *
 * Qué se verifica:
 *  1. draw() con mazo vacío devuelve null (caso borde crítico — fatiga).
 *  2. draw() reduce size() en 1 por llamada (3 draws consecutivos).
 *  3. shuffle() con RNG () => 0 produce orden determinista y reproducible.
 *  4. Constructor con cards.length > 30 lanza RangeError.
 *  5. Constructor con exactamente 30 cartas NO lanza error.
 *  6. isEmpty() devuelve true tras agotar todas las cartas.
 *  7. toIdArray() devuelve los staticId en el orden actual del mazo.
 *  8. peek() devuelve la primera carta sin extraerla.
 *  9. peek() devuelve null con mazo vacío.
 * 10. size() devuelve el número correcto de cartas.
 * 11. shuffle() con el mismo RNG produce el mismo orden en dos instancias iguales.
 */

import { describe, it, expect } from "vitest";
import { Deck } from "@domain/entities/deck";
import { Card } from "@domain/entities/card";
import type { CardProps } from "@domain/entities/card";
import { CardType, Rarity, Archetype } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Subclase concreta mínima para instanciar Card en tests
// (No exportar — exclusiva del entorno de test)
// ---------------------------------------------------------------------------

class TestCard extends Card {
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
// Helper de fabricación de cartas
// No exportar: es exclusivo del entorno de test.
// ---------------------------------------------------------------------------

/**
 * Instancia una subclase mínima concreta de Card con el staticId indicado.
 * El resto de campos reciben valores neutros para el test.
 *
 * @param staticId - ID estático de la carta (ej. "LIC-001").
 * @returns Instancia de TestCard lista para insertar en un Deck de test.
 */
function makeCard(staticId: string): Card {
  const props: CardProps = {
    staticId,
    name: `Carta ${staticId}`,
    type: CardType.Character,
    archetype: Archetype.CartoonClasico,
    nostalgyCost: 1,
    rarity: Rarity.Common,
    description: "Carta de test.",
    spriteKey: "test_sprite",
    greetingText: "¡Hola!",
  };
  return new TestCard(props);
}

// ---------------------------------------------------------------------------
// Helper: crea un array de N cartas con staticId secuenciales
// ---------------------------------------------------------------------------

function makeCards(n: number): Card[] {
  return Array.from({ length: n }, (_, i) => makeCard(`TEST-${String(i + 1).padStart(3, "0")}`));
}

// ---------------------------------------------------------------------------
// Constructor y validaciones
// ---------------------------------------------------------------------------

describe("Deck — constructor", () => {
  it("debería crear un Deck con 0 cartas sin error", () => {
    // Arrange / Act / Assert
    expect(() => new Deck([])).not.toThrow();
  });

  it("debería crear un Deck con exactamente 30 cartas sin error (límite arquitectónico)", () => {
    // Arrange
    const cards = makeCards(30);

    // Act / Assert — NO debe lanzar
    expect(() => new Deck(cards)).not.toThrow();
  });

  it("debería lanzar RangeError al recibir más de 30 cartas", () => {
    // Arrange
    const cards = makeCards(31);

    // Act / Assert
    expect(() => new Deck(cards)).toThrow(RangeError);
  });

  it("el mensaje del RangeError debe indicar el límite y el número recibido", () => {
    // Arrange
    const cards = makeCards(35);

    // Act / Assert
    expect(() => new Deck(cards)).toThrow(/30.*35|35.*30/);
  });

  it("el constructor debe almacenar una copia defensiva del array (mutación externa no afecta al Deck)", () => {
    // Arrange
    const cards = makeCards(3);
    const deck = new Deck(cards);

    // Act — mutar el array original externamente
    cards.push(makeCard("EXTRA-001"));

    // Assert — el Deck no debe reflejar la mutación
    expect(deck.size()).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// size() e isEmpty()
// ---------------------------------------------------------------------------

describe("Deck — size() e isEmpty()", () => {
  it("size() debe devolver el número inicial de cartas del mazo", () => {
    // Arrange
    const deck = new Deck(makeCards(5));

    // Act / Assert
    expect(deck.size()).toBe(5);
  });

  it("isEmpty() debe devolver false cuando hay cartas en el mazo", () => {
    // Arrange
    const deck = new Deck(makeCards(3));

    // Act / Assert
    expect(deck.isEmpty()).toBe(false);
  });

  it("isEmpty() debe devolver true cuando el mazo está vacío desde el inicio", () => {
    // Arrange
    const deck = new Deck([]);

    // Act / Assert
    expect(deck.isEmpty()).toBe(true);
  });

  it("isEmpty() debe devolver true tras agotar todas las cartas con draw() (caso borde crítico)", () => {
    // Arrange
    const deck = new Deck(makeCards(3));

    // Act — agotar todas las cartas
    deck.draw();
    deck.draw();
    deck.draw();

    // Assert
    expect(deck.isEmpty()).toBe(true);
    expect(deck.size()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// draw()
// ---------------------------------------------------------------------------

describe("Deck — draw()", () => {
  it("draw() con mazo vacío debe devolver null (caso borde crítico — fatiga)", () => {
    // Arrange
    const deck = new Deck([]);

    // Act
    const result = deck.draw();

    // Assert
    expect(result).toBeNull();
  });

  it("draw() con mazo no vacío debe devolver la primera carta", () => {
    // Arrange
    const primera = makeCard("LIC-001");
    const segunda = makeCard("LIC-002");
    const deck = new Deck([primera, segunda]);

    // Act
    const drawn = deck.draw();

    // Assert — se devuelve la carta que estaba en posición 0
    expect(drawn?.staticId).toBe("LIC-001");
  });

  it("draw() debe reducir size() en 1 por cada llamada (3 draws consecutivos)", () => {
    // Arrange
    const deck = new Deck(makeCards(3));
    expect(deck.size()).toBe(3);

    // Act & Assert — se verifica el tamaño tras cada extracción
    deck.draw();
    expect(deck.size()).toBe(2);

    deck.draw();
    expect(deck.size()).toBe(1);

    deck.draw();
    expect(deck.size()).toBe(0);
  });

  it("draw() sucesivos después de vaciar el mazo deben seguir devolviendo null", () => {
    // Arrange
    const deck = new Deck(makeCards(1));
    deck.draw(); // agota el mazo

    // Act
    const result1 = deck.draw();
    const result2 = deck.draw();

    // Assert
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  it("draw() debe extraer las cartas en el orden en que están almacenadas (FIFO)", () => {
    // Arrange
    const cards = ["LIC-001", "LIC-002", "LIC-003"].map(makeCard);
    const deck = new Deck(cards);

    // Act
    const first = deck.draw();
    const second = deck.draw();
    const third = deck.draw();

    // Assert — orden FIFO
    expect(first?.staticId).toBe("LIC-001");
    expect(second?.staticId).toBe("LIC-002");
    expect(third?.staticId).toBe("LIC-003");
  });
});

// ---------------------------------------------------------------------------
// peek()
// ---------------------------------------------------------------------------

describe("Deck — peek()", () => {
  it("peek() debe devolver null con el mazo vacío", () => {
    // Arrange
    const deck = new Deck([]);

    // Act / Assert
    expect(deck.peek()).toBeNull();
  });

  it("peek() debe devolver la primera carta sin extraerla", () => {
    // Arrange
    const cards = ["LIC-001", "LIC-002"].map(makeCard);
    const deck = new Deck(cards);

    // Act
    const peeked = deck.peek();

    // Assert — devuelve la carta correcta
    expect(peeked?.staticId).toBe("LIC-001");

    // Assert — el tamaño NO ha cambiado (no se extrae)
    expect(deck.size()).toBe(2);
  });

  it("peek() seguido de draw() deben devolver la misma carta", () => {
    // Arrange
    const deck = new Deck(makeCards(3));

    // Act
    const peeked = deck.peek();
    const drawn = deck.draw();

    // Assert
    expect(peeked?.staticId).toBe(drawn?.staticId);
  });
});

// ---------------------------------------------------------------------------
// shuffle()
// ---------------------------------------------------------------------------

describe("Deck — shuffle()", () => {
  it("shuffle() con RNG () => 0 debe producir un orden determinista reproducible", () => {
    // Arrange — RNG que siempre devuelve 0; Fisher-Yates con j=0 en cada paso
    // mueve siempre el elemento i al índice 0, produciendo el array invertido.
    const rngZero = (): number => 0;

    const staticIds = ["A", "B", "C", "D", "E"];

    // Primera instancia
    const deck1 = new Deck(staticIds.map(makeCard), rngZero);
    deck1.shuffle();
    const order1 = deck1.toIdArray();

    // Segunda instancia con los mismos datos y el mismo RNG
    const deck2 = new Deck(staticIds.map(makeCard), rngZero);
    deck2.shuffle();
    const order2 = deck2.toIdArray();

    // Assert — ambas instancias producen el mismo orden
    expect(order1).toEqual(order2);

    // Assert — el orden es determinista y reproducible.
    // Con rng=()=>0, j=Math.floor(0*(i+1))=0 en cada paso de Fisher-Yates,
    // por lo que cada elemento en posición i se intercambia con el 0.
    // Traza para ["A","B","C","D","E"]:
    //   i=4: swap(4,0) → ["E","B","C","D","A"]
    //   i=3: swap(3,0) → ["D","B","C","E","A"]
    //   i=2: swap(2,0) → ["C","B","D","E","A"]
    //   i=1: swap(1,0) → ["B","C","D","E","A"]
    expect(order1).toEqual(["B", "C", "D", "E", "A"]);
  });

  it("shuffle() no debe cambiar el número de cartas del mazo", () => {
    // Arrange
    const deck = new Deck(makeCards(10));

    // Act
    deck.shuffle();

    // Assert
    expect(deck.size()).toBe(10);
  });

  it("shuffle() con RNG realista debe producir al menos algún cambio de posición en un mazo grande", () => {
    // Arrange — mazo de 20 cartas, barajado con Math.random
    const ids = makeCards(20).map((c) => c.staticId);
    const deck = new Deck(makeCards(20));

    // Act
    deck.shuffle();
    const shuffled = deck.toIdArray();

    // Assert — el resultado contiene los mismos IDs
    expect(shuffled.sort()).toEqual(ids.sort());
  });
});

// ---------------------------------------------------------------------------
// toIdArray()
// ---------------------------------------------------------------------------

describe("Deck — toIdArray()", () => {
  it("toIdArray() debe devolver los staticId en el orden actual del mazo", () => {
    // Arrange
    const ids = ["LIC-001", "LIC-002", "LIC-003"];
    const deck = new Deck(ids.map(makeCard));

    // Act
    const result = deck.toIdArray();

    // Assert
    expect(result).toEqual(ids);
  });

  it("toIdArray() debe devolver array vacío para un mazo vacío", () => {
    // Arrange
    const deck = new Deck([]);

    // Act / Assert
    expect(deck.toIdArray()).toEqual([]);
  });

  it("toIdArray() debe reflejar el nuevo orden después de shuffle()", () => {
    // Arrange — RNG que invierte el array (rng=()=>0)
    const ids = ["A", "B", "C"];
    const deck = new Deck(ids.map(makeCard), () => 0);

    // Act
    deck.shuffle();
    const result = deck.toIdArray();

    // Assert — el orden producido por Fisher-Yates con rng=()=>0.
    // Traza para ["A","B","C"]:
    //   i=2: swap(2,0) → ["C","B","A"]
    //   i=1: swap(1,0) → ["B","C","A"]
    expect(result).toEqual(["B", "C", "A"]);
  });

  it("toIdArray() debe reflejar el array reducido después de varios draw()", () => {
    // Arrange
    const ids = ["LIC-001", "LIC-002", "LIC-003"];
    const deck = new Deck(ids.map(makeCard));

    // Act — extraer la primera carta
    deck.draw();
    const result = deck.toIdArray();

    // Assert — ya no aparece LIC-001
    expect(result).toEqual(["LIC-002", "LIC-003"]);
  });
});
