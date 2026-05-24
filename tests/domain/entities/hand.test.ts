/**
 * Tests unitarios para src/domain/entities/hand.ts
 *
 * Cobertura objetivo: ≥ 80%.
 * Estructura: AAA (Arrange – Act – Assert).
 * Framework: Vitest.
 */

import { describe, it, expect } from "vitest";
import { Hand, MAX_HAND_SIZE } from "@domain/entities/hand";
import { Card } from "@domain/entities/card";
import type { CardProps } from "@domain/entities/card";
import { CardType, Archetype, Rarity } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Subclase mínima concreta de Card para instanciar en los tests
 */
class TestCard extends Card {
  clone(): Card {
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

/**
 * Helper para crear cartas de prueba fácilmente.
 */
function makeCard(staticId: string = "TEST-001"): TestCard {
  const props: CardProps = {
    staticId,
    name: `Card ${staticId}`,
    type: CardType.Character,
    archetype: Archetype.Neutral,
    nostalgyCost: 1,
    rarity: Rarity.Common,
    description: "Test card",
    spriteKey: "test_key",
    greetingText: "Hello test",
  };
  return new TestCard(props);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Hand", () => {
  describe("add()", () => {
    it("con mano vacía devuelve ok y aumenta el size", () => {
      // Arrange
      const hand = new Hand();
      const card = makeCard();

      // Act
      const result = hand.add(card);

      // Assert
      expect(result.ok).toBe(true);
      expect(hand.size()).toBe(1);
    });

    it("con 9 cartas devuelve ok y size pasa a 10", () => {
      // Arrange
      const hand = new Hand();
      for (let i = 0; i < MAX_HAND_SIZE - 1; i++) {
        hand.add(makeCard(`TEST-00${i}`));
      }

      // Act
      const result = hand.add(makeCard("TEST-10"));

      // Assert
      expect(result.ok).toBe(true);
      expect(hand.size()).toBe(MAX_HAND_SIZE);
    });

    it("con mano de 10 cartas devuelve error 'hand_full' y size permanece en 10 (Hand Burn)", () => {
      // Arrange
      const hand = new Hand();
      for (let i = 0; i < MAX_HAND_SIZE; i++) {
        hand.add(makeCard(`TEST-00${i}`));
      }

      // Act
      const extraCard = makeCard("BURNED-01");
      const result = hand.add(extraCard);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("hand_full");
      }
      expect(hand.size()).toBe(MAX_HAND_SIZE);
      expect(hand.find(extraCard.instanceId)).toBeNull(); // la carta no entró
    });
  });

  describe("remove()", () => {
    it("con instanceId existente devuelve la carta y reduce size en 1", () => {
      // Arrange
      const hand = new Hand();
      const cardToKeep = makeCard("KEEP");
      const cardToRemove = makeCard("REMOVE");

      hand.add(cardToKeep);
      hand.add(cardToRemove);

      expect(hand.size()).toBe(2);

      // Act
      const removed = hand.remove(cardToRemove.instanceId);

      // Assert
      expect(removed).not.toBeNull();
      expect(removed?.instanceId).toBe(cardToRemove.instanceId);
      expect(hand.size()).toBe(1);
      expect(hand.find(cardToRemove.instanceId)).toBeNull();
    });

    it("con instanceId inexistente devuelve null y no modifica la mano", () => {
      // Arrange
      const hand = new Hand();
      hand.add(makeCard("KEEP"));
      const initialSize = hand.size();

      // Act
      const removed = hand.remove("non-existent-uuid");

      // Assert
      expect(removed).toBeNull();
      expect(hand.size()).toBe(initialSize);
    });
  });

  describe("find()", () => {
    it("encuentra y devuelve la carta sin extraerla", () => {
      // Arrange
      const hand = new Hand();
      const card = makeCard("FIND-ME");
      hand.add(card);

      // Act
      const found = hand.find(card.instanceId);

      // Assert
      expect(found).not.toBeNull();
      expect(found?.instanceId).toBe(card.instanceId);
      expect(hand.size()).toBe(1); // El size no se redujo
    });

    it("devuelve null si no existe", () => {
      const hand = new Hand();
      expect(hand.find("uuid")).toBeNull();
    });
  });

  describe("isFull()", () => {
    it("devuelve false con mano vacía o parcialmente llena", () => {
      // Arrange
      const hand = new Hand();

      // Act & Assert
      expect(hand.isFull()).toBe(false);

      hand.add(makeCard());
      expect(hand.isFull()).toBe(false);

      for (let i = 0; i < 8; i++) {
        hand.add(makeCard());
      }
      expect(hand.size()).toBe(9);
      expect(hand.isFull()).toBe(false);
    });

    it("devuelve true cuando la mano tiene 10 cartas", () => {
      // Arrange
      const hand = new Hand();
      for (let i = 0; i < MAX_HAND_SIZE; i++) {
        hand.add(makeCard());
      }

      // Act & Assert
      expect(hand.isFull()).toBe(true);
    });
  });

  describe("getCards()", () => {
    it("devuelve un ReadonlyArray con las cartas correctas", () => {
      // Arrange
      const hand = new Hand();
      const card1 = makeCard("1");
      const card2 = makeCard("2");
      hand.add(card1);
      hand.add(card2);

      // Act
      const cards = hand.getCards();

      // Assert
      expect(cards.length).toBe(2);
      expect(cards[0].instanceId).toBe(card1.instanceId);
      expect(cards[1].instanceId).toBe(card2.instanceId);

      // Si `cards` no fuera ReadonlyArray, TypeScript permitiría usar push().
      // La firma del método getCards() ya garantiza esto.
    });
  });

  describe("burn()", () => {
    it("con mano vacía devuelve null", () => {
      // Arrange
      const hand = new Hand();

      // Act
      const burned = hand.burn();

      // Assert
      expect(burned).toBeNull();
    });

    it("con 1 carta devuelve la carta y size queda en 0", () => {
      // Arrange
      const hand = new Hand();
      const card = makeCard();
      hand.add(card);

      // Act
      const burned = hand.burn();

      // Assert
      expect(burned).not.toBeNull();
      expect(burned?.instanceId).toBe(card.instanceId);
      expect(hand.size()).toBe(0);
    });

    it("descarta siempre la última carta añadida (LIFO)", () => {
      // Arrange
      const hand = new Hand();
      const card1 = makeCard("1");
      const card2 = makeCard("2");

      hand.add(card1);
      hand.add(card2);

      // Act
      const burned = hand.burn();

      // Assert
      expect(burned?.instanceId).toBe(card2.instanceId);
      expect(hand.size()).toBe(1);
    });
  });
});
