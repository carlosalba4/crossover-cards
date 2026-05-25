import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrossoverManager } from "@domain/services/crossover-manager";
import { Deck } from "@domain/entities/deck";
import { Hand } from "@domain/entities/hand";
import { Character } from "@domain/entities/character";
import { Archetype, CardType, Rarity } from "@domain/types/card-types";
import { GameEvent } from "@domain/events/game-event";
import type { IEventBus } from "@domain/events/event-bus";
import type { Card } from "@domain/entities/card";

// Mock del IEventBus
class MockEventBus implements IEventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers = new Map<GameEvent, Set<(payload: any) => void>>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on = vi.fn((event: GameEvent, handler: (payload: any) => void) => {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => {};
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit = vi.fn((event: GameEvent, payload: any) => {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((h) => h(payload));
    }
  });

  off = vi.fn();
  clear = vi.fn();
}

function createMockCard(id: string): Card {
  return new Character({
    staticId: id,
    name: `Card_${id}`,
    type: CardType.Character,
    archetype: Archetype.Neutral,
    nostalgyCost: 1,
    rarity: Rarity.Common,
    description: "",
    spriteKey: "",
    greetingText: "",
    attack: 1,
    health: 1,
    abilities: [],
  });
}

describe("CrossoverManager", () => {
  let eventBus: MockEventBus;
  let manager: CrossoverManager;
  const PLAYER_ID = "Player1";

  beforeEach(() => {
    eventBus = new MockEventBus();
    manager = new CrossoverManager(eventBus);
  });

  it("debe robar una carta del rival, añadirla a la mano, emitir el evento y registrar el uso", () => {
    const card = createMockCard("C1");
    const opponentDeck = new Deck([card]);
    const playerHand = new Hand();

    expect(manager.hasUsedCrossover(PLAYER_ID)).toBe(false);

    manager.activate(PLAYER_ID, opponentDeck, playerHand);

    // Verificaciones
    expect(manager.hasUsedCrossover(PLAYER_ID)).toBe(true);
    expect(opponentDeck.size()).toBe(0);
    expect(playerHand.size()).toBe(1);
    expect(playerHand.getCards()[0].staticId).toBe("C1");

    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.CrossoverActivated, {
      playerId: PLAYER_ID,
      stolenCard: card,
      wasDestroyed: false,
    });
  });

  it("debe lanzar un error si el jugador intenta usar la habilidad por segunda vez", () => {
    const opponentDeck = new Deck([createMockCard("C1"), createMockCard("C2")]);
    const playerHand = new Hand();

    // Primer uso
    manager.activate(PLAYER_ID, opponentDeck, playerHand);

    // Intento de segundo uso
    expect(() => manager.activate(PLAYER_ID, opponentDeck, playerHand)).toThrowError(
      "El jugador Player1 ya ha utilizado la habilidad Crossover en esta partida.",
    );

    // No roba la segunda carta
    expect(opponentDeck.size()).toBe(1);
  });

  it("debe lanzar un error si el mazo rival está vacío y NO registrar el uso", () => {
    const emptyDeck = new Deck([]);
    const playerHand = new Hand();

    expect(() => manager.activate(PLAYER_ID, emptyDeck, playerHand)).toThrowError(
      "No se puede activar Crossover: el mazo del rival está vacío.",
    );

    // Como dio error, no debe haber gastado su uso único
    expect(manager.hasUsedCrossover(PLAYER_ID)).toBe(false);
  });

  it("debe quemar (destruir) la carta si la mano del jugador está llena, y aún así registrar el uso", () => {
    const card = createMockCard("StolenCard");
    const opponentDeck = new Deck([card]);
    const playerHand = new Hand();

    // Llenar la mano (máximo es 10 según hand.ts)
    for (let i = 0; i < 10; i++) {
      playerHand.add(createMockCard(`Fill_${i}`));
    }
    expect(playerHand.isFull()).toBe(true);

    manager.activate(PLAYER_ID, opponentDeck, playerHand);

    // Mazo rival pierde la carta
    expect(opponentDeck.size()).toBe(0);
    // Mano no crece (se queda en 10)
    expect(playerHand.size()).toBe(10);
    // Registra el uso
    expect(manager.hasUsedCrossover(PLAYER_ID)).toBe(true);

    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.CrossoverActivated, {
      playerId: PLAYER_ID,
      stolenCard: card,
      wasDestroyed: true, // ¡La carta se quemó!
    });
  });
});
