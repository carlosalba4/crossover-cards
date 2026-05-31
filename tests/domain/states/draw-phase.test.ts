import { describe, it, expect, vi } from "vitest";
import { DrawPhase } from "@domain/states/draw-phase";

import { TurnEngine } from "@domain/services/turn-engine";
import { PhaseViolationError } from "@domain/states/turn-phase";
import type { IEventBus } from "@domain/events/event-bus";
import { Match, type PlayerState } from "@domain/entities/match";
import { Hand, MAX_HAND_SIZE } from "@domain/entities/hand";
import { Hero } from "@domain/entities/hero";
import { Deck } from "@domain/entities/deck";
import { Character } from "@domain/entities/character";
import { CardType, Archetype, Rarity } from "@domain/types/card-types";
import { GameEvent } from "@domain/events/game-event";

class MockEventBus implements IEventBus {
  on = vi.fn();
  emit = vi.fn();
  off = vi.fn();
  clear = vi.fn();
}

// ── Helpers de dominio ─────────────────────────────────────────────────────

function makeCharacter(name = "Carta"): Character {
  return new Character({
    staticId: "LIC-005",
    name,
    type: CardType.Character,
    archetype: Archetype.CartoonClasico,
    nostalgyCost: 2,
    rarity: Rarity.Rare,
    description: "Test",
    spriteKey: "rigby_card",
    greetingText: "YA VOOOY!",
    attack: 3,
    health: 3,
    abilities: [],
  });
}

function makeHero(): Hero {
  return new Hero({
    staticId: "HERO-1",
    name: "H1",
    archetype: Archetype.Neutral,
    maxHealth: 30,
    heroPower: {
      name: "P",
      nostalgyCost: 2,
      effectType: "Damage",
      targetType: "Any",
      value: 2,
    },
  });
}

function makePlayerState(playerId: string, deck: Deck, hand: Hand, hero: Hero): PlayerState {
  return { playerId, deck, hand, board: { left: [], center: [], right: [] }, hero };
}

/**
 * Construye un Match con `p1` (activo por defecto) y `p2`. Permite inyectar el
 * mazo, la mano y el héroe del jugador activo para cada escenario de robo.
 */
function makeMatch(p1Deck: Deck, p1Hand: Hand, p1Hero: Hero): Match {
  const p1 = makePlayerState("p1", p1Deck, p1Hand, p1Hero);
  const p2 = makePlayerState("p2", new Deck([]), new Hand(), makeHero());
  return new Match(p1, p2);
}

describe("DrawPhase — máquina de estados", () => {
  it("tras startMatch el motor avanza automáticamente a MainPhase (draw es automática)", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    // Act
    engine.startMatch(); // draw → main automático
    // Assert
    expect(engine.getCurrentPhaseName()).toBe("main");
  });

  it("DrawPhase.handleAction con END_PHASE transiciona a MainPhase", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new DrawPhase(engine);
    // Act
    phase.handleAction({ type: "END_PHASE" });
    // Assert
    expect(engine.getCurrentPhaseName()).toBe("main");
  });

  it("debe lanzar PhaseViolationError si recibe una acción no permitida", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new DrawPhase(engine);

    // Act & Assert
    expect(() => phase.handleAction({ type: "PLAY_CARD" })).toThrowError(PhaseViolationError);
  });

  it("debe devolver las acciones permitidas correctamente", () => {
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new DrawPhase(engine);
    expect(phase.getAllowedActions()).toEqual(["END_PHASE"]);
  });

  it("sin Match inyectado, enter() es un no-op (no roba ni emite eventos)", () => {
    // Arrange
    const bus = new MockEventBus();
    const engine = new TurnEngine(bus, "P1", "P2");
    // Act
    new DrawPhase(engine).enter();
    // Assert
    expect(bus.emit).not.toHaveBeenCalled();
  });
});

describe("DrawPhase — robo automático al iniciar turno", () => {
  it("con mazo no vacío roba la carta a la mano y emite CardDrawn", () => {
    // Arrange
    const card = makeCharacter("Robada");
    const deck = new Deck([card]);
    const hand = new Hand();
    const match = makeMatch(deck, hand, makeHero());
    const bus = new MockEventBus();
    const engine = new TurnEngine(bus, "p1", "p2", match);

    // Act
    new DrawPhase(engine).enter();

    // Assert
    expect(hand.size()).toBe(1);
    expect(hand.find(card.instanceId)).toBe(card);
    expect(deck.size()).toBe(0);
    expect(bus.emit).toHaveBeenCalledWith(GameEvent.CardDrawn, {
      playerId: "p1",
      card,
    });
  });

  it("con mazo vacío aplica fatiga: -1 PV al héroe y emite HeroDamaged + DeckEmpty", () => {
    // Arrange
    const hero = makeHero(); // 30 PV
    const match = makeMatch(new Deck([]), new Hand(), hero);
    const bus = new MockEventBus();
    const engine = new TurnEngine(bus, "p1", "p2", match);

    // Act
    new DrawPhase(engine).enter();

    // Assert
    expect(hero.currentHealth).toBe(29);
    expect(bus.emit).toHaveBeenCalledWith(GameEvent.HeroDamaged, {
      playerId: "p1",
      damage: 1,
      currentHealth: 29,
    });
    expect(bus.emit).toHaveBeenCalledWith(GameEvent.DeckEmpty, {
      playerId: "p1",
      fatigueDamage: 1,
    });
    // La carta no llega a mano: no se emite CardDrawn.
    expect(bus.emit).not.toHaveBeenCalledWith(GameEvent.CardDrawn, expect.anything());
  });

  it("con la mano llena descarta la carta (Hand Burn) pero el mazo decrementa igual", () => {
    // Arrange
    const hand = new Hand();
    for (let i = 0; i < MAX_HAND_SIZE; i++) {
      hand.add(makeCharacter(`Mano-${i}`));
    }
    expect(hand.size()).toBe(MAX_HAND_SIZE);

    const card = makeCharacter("Quemada");
    const deck = new Deck([card]);
    const match = makeMatch(deck, hand, makeHero());
    const bus = new MockEventBus();
    const engine = new TurnEngine(bus, "p1", "p2", match);

    // Act
    new DrawPhase(engine).enter();

    // Assert
    expect(hand.size()).toBe(MAX_HAND_SIZE); // sigue llena: la carta se quemó
    expect(hand.find(card.instanceId)).toBeNull();
    expect(deck.size()).toBe(0); // el mazo decrementa de todas formas
    expect(bus.emit).not.toHaveBeenCalledWith(GameEvent.CardDrawn, expect.anything());
  });

  it("startMatch roba para el jugador activo y deja el turno en MainPhase (robo antes de Main)", () => {
    // Arrange
    const card = makeCharacter("Inicial");
    const deck = new Deck([card]);
    const hand = new Hand();
    const match = makeMatch(deck, hand, makeHero());
    const engine = new TurnEngine(new MockEventBus(), "p1", "p2", match);

    // Act
    engine.startMatch();

    // Assert
    expect(hand.size()).toBe(1); // la carta ya está en mano...
    expect(engine.getCurrentPhaseName()).toBe("main"); // ...antes de llegar a Main
  });
});
