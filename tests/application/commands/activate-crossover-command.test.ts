import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActivateCrossoverCommand } from "@application/commands/activate-crossover-command";
import { Match } from "@domain/entities/match";
import { Hand } from "@domain/entities/hand";
import { Hero } from "@domain/entities/hero";
import { Deck } from "@domain/entities/deck";
import { CrossoverManager } from "@domain/services/crossover-manager";
import { GameEvent } from "@domain/events/game-event";
import { Archetype, CardType, Rarity } from "@domain/types/card-types";
import { ApplicationError } from "@application/errors/application-error";
import { Character } from "@domain/entities/character";
import type { IEventBus } from "@domain/events/event-bus";

function makeMockEventBus(): IEventBus {
  return {
    emit: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    off: vi.fn(),
    clear: vi.fn(),
  };
}

function makeHero(): Hero {
  return new Hero({
    staticId: "HERO-1",
    name: "El Lich",
    archetype: Archetype.CartoonClasico,
    maxHealth: 30,
    heroPower: {
      name: "Poder",
      nostalgyCost: 2,
      effectType: "Damage",
      targetType: "Any",
      value: 2,
    },
  });
}

function makeDummyCard(): Character {
  return new Character({
    staticId: "LIC-005",
    name: "Rigby",
    type: CardType.Character,
    archetype: Archetype.CartoonClasico,
    nostalgyCost: 2,
    rarity: Rarity.Rare,
    description: "Charge",
    spriteKey: "rigby_card",
    greetingText: "YA VOOOY!",
    attack: 3,
    health: 2,
    abilities: [],
  });
}

function makeMatch(opponentDeckEmpty: boolean = false): Match {
  const deckCards = opponentDeckEmpty ? [] : [makeDummyCard()];
  const match = new Match(
    {
      playerId: "player1",
      hand: new Hand(),
      board: { left: [], center: [], right: [] },
      hero: makeHero(),
      deck: new Deck([]),
    },
    {
      playerId: "player2",
      hand: new Hand(),
      board: { left: [], center: [], right: [] },
      hero: makeHero(),
      deck: new Deck(deckCards),
    },
  );
  match.activePlayerId = "player1";
  return match;
}

describe("ActivateCrossoverCommand", () => {
  let eventBus: IEventBus;
  let crossoverManager: CrossoverManager;

  beforeEach(() => {
    eventBus = makeMockEventBus();
    crossoverManager = new CrossoverManager(eventBus);
  });

  it("debería usar Crossover con éxito, robando carta y emitiendo evento", () => {
    const match = makeMatch(false);
    const command = new ActivateCrossoverCommand(match, "player1", crossoverManager, eventBus);

    const result = command.execute();

    expect(result.success).toBe(true);
    expect(result.eventsEmitted).toContain(GameEvent.CrossoverActivated);
    expect(crossoverManager.hasUsedCrossover("player1")).toBe(true);
    // Player 1 robó la carta
    expect(match.player1.hand.size()).toBe(1);
    // Player 2 perdió la carta
    expect(match.player2.deck.isEmpty()).toBe(true);
  });

  it("debería fallar si el mazo rival está vacío", () => {
    const match = makeMatch(true);
    const command = new ActivateCrossoverCommand(match, "player1", crossoverManager, eventBus);

    const result = command.execute();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(ApplicationError);
    expect((result.error as ApplicationError).code).toBe("OPPONENT_DECK_EMPTY");
    expect(crossoverManager.hasUsedCrossover("player1")).toBe(false);
  });

  it("debería fallar si ya se usó el Crossover previamente", () => {
    const match = makeMatch(false);
    crossoverManager.activate("player1", match.player2.deck, match.player1.hand);

    const command = new ActivateCrossoverCommand(match, "player1", crossoverManager, eventBus);

    const result = command.execute();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(ApplicationError);
    expect((result.error as ApplicationError).code).toBe("CROSSOVER_ALREADY_USED");
  });

  it("debería fallar si el jugador no es el activo", () => {
    const match = makeMatch(false);
    const command = new ActivateCrossoverCommand(match, "player2", crossoverManager, eventBus);

    const result = command.execute();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(ApplicationError);
    expect((result.error as ApplicationError).code).toBe("NOT_ACTIVE_PLAYER");
  });
});
