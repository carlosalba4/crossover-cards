import { describe, it, expect, beforeEach, vi } from "vitest";
import { MatchService } from "@application/services/match-service";
import { DeckService } from "@application/services/deck-service";
import type { IDeckRepository } from "@domain/repositories/i-deck-repository";
import type { IHeroRepository } from "@domain/repositories/i-hero-repository";
import type { ICardRepository } from "@domain/repositories/i-card-repository";
import type { IEventBus } from "@domain/events/event-bus";
import { GameEvent } from "@domain/events/game-event";
import { CardType, Archetype, Rarity } from "@domain/types/card-types";
import type { GameAction } from "@application/types/game-action";

class MockEventBus implements IEventBus {
  on = vi.fn();
  emit = vi.fn();
  off = vi.fn();
  clear = vi.fn();
}

const mockDeckRepository: IDeckRepository = {
  getAll: vi.fn(),
  getById: vi.fn().mockResolvedValue({
    id: "DECK-1",
    name: "Deck 1",
    heroId: "HERO-1",
    cards: [{ cardId: "CARD-1", quantity: 30 }],
  }),
};

const mockHeroRepository: IHeroRepository = {
  getAll: vi.fn(),
  getById: vi.fn().mockResolvedValue({
    id: "HERO-1",
    name: "Hero 1",
    archetype: Archetype.Neutral,
    maxHealth: 30,
    heroPower: {
      name: "Power 1",
      cost: 2,
      effectType: "Damage",
      targetType: "Any",
      value: 2,
    },
  }),
};

const mockCardRepository: ICardRepository = {
  getAll: vi.fn(),
  getById: vi.fn().mockResolvedValue({
    id: "CARD-1",
    name: "Card 1",
    type: CardType.Character,
    archetype: Archetype.Neutral,
    nostalgyCost: 1,
    rarity: Rarity.Common,
    description: "Desc",
    spriteKey: "sprite1",
    greetingText: "Hi",
    attack: 1,
    health: 1,
    abilities: [],
  }),
  getByArchetype: vi.fn(),
};

describe("MatchService", () => {
  let eventBus: MockEventBus;
  let deckService: DeckService;
  let matchService: MatchService;

  beforeEach(() => {
    eventBus = new MockEventBus();
    deckService = new DeckService(mockDeckRepository, mockCardRepository);
    matchService = new MatchService(deckService, mockDeckRepository, mockHeroRepository, eventBus);
  });

  it("should initialize a match correctly", async () => {
    // Arrange & Act
    const match = await matchService.initMatch("DECK-1", "DECK-1");

    // Assert
    expect(match).toBeDefined();
    expect(match.player1.playerId).toBe("p1");
    expect(match.player2.playerId).toBe("p2");
    expect(match.player1.hero.name).toBe("Hero 1");
    expect(match.player2.hero.name).toBe("Hero 1");
    expect(match.player1.hand.size()).toBe(4);
    expect(match.player2.hand.size()).toBe(4);

    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.MatchStarted, expect.anything());
    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.TurnStarted, expect.anything());
  });

  it("should handle invalid actions gracefully", async () => {
    // Arrange
    await matchService.initMatch("DECK-1", "DECK-1");

    // Act
    const result = matchService.handlePlayerAction({
      type: "UNKNOWN_ACTION",
    } as unknown as GameAction);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Acción no soportada");
  });

  it("should delegate valid PLAY_CARD action to PlayCardCommand", async () => {
    // Arrange
    const match = await matchService.initMatch("DECK-1", "DECK-1");

    const activePlayerId = match.activePlayerId;
    const activePlayer = activePlayerId === "p1" ? match.player1 : match.player2;
    const cardToPlay = activePlayer.hand.getCards()[0];

    // Act
    const result = matchService.handlePlayerAction({
      type: "PLAY_CARD",
      playerId: activePlayerId,
      cardInstanceId: cardToPlay.instanceId,
      zoneId: "center",
    });

    // Assert
    // Expect failure due to PhaseViolation (it starts in "draw" phase)
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("fase");
  });
});
