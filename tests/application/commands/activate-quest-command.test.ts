import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActivateQuestCommand } from "@application/commands/activate-quest-command";
import { Match } from "@domain/entities/match";
import { Hand } from "@domain/entities/hand";
import { Hero } from "@domain/entities/hero";
import { Deck } from "@domain/entities/deck";
import { QuestManager } from "@domain/services/quest-manager";
import { GameEvent } from "@domain/events/game-event";
import { Archetype, CardType, Rarity } from "@domain/types/card-types";
import { ApplicationError } from "@application/errors/application-error";
import { CardNotInHandError } from "@domain/errors/card-not-in-hand-error";
import { Spell } from "@domain/entities/spell";
import type { IEventBus } from "@domain/events/event-bus";
import type { QuestData } from "@domain/services/quest-manager";

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

function makeQuestCard(): Spell {
  return new Spell({
    staticId: "QST-001",
    name: "Misión Épica",
    type: CardType.Spell,
    archetype: Archetype.Neutral,
    nostalgyCost: 1,
    rarity: Rarity.Epic,
    description: "Una misión",
    spriteKey: "quest_sprite",
    greetingText: "Misión!",
    effectType: "Quest",
    targetType: "None",
    effectValue: 0,
  });
}

const mockQuestData: QuestData = {
  id: "QST-001",
  name: "Misión Épica",
  condition: { type: "PlayCharacter", target: 5 },
  reward: { type: "DrawCard" },
};

function makeMatch(hand: Hand): Match {
  const match = new Match(
    {
      playerId: "player1",
      hand,
      board: { left: [], center: [], right: [] },
      hero: makeHero(),
      deck: new Deck([]),
    },
    {
      playerId: "player2",
      hand: new Hand(),
      board: { left: [], center: [], right: [] },
      hero: makeHero(),
      deck: new Deck([]),
    },
  );
  match.activePlayerId = "player1";
  return match;
}

describe("ActivateQuestCommand", () => {
  let eventBus: IEventBus;
  let questManager: QuestManager;

  beforeEach(() => {
    eventBus = makeMockEventBus();
    questManager = new QuestManager(eventBus);
  });

  it("debería colocar una misión con éxito y sacarla de la mano", () => {
    const hand = new Hand();
    const questCard = makeQuestCard();
    hand.add(questCard);
    const match = makeMatch(hand);

    const command = new ActivateQuestCommand(
      match,
      "player1",
      questCard.instanceId,
      mockQuestData,
      questManager,
      eventBus,
    );

    const result = command.execute();

    expect(result.success).toBe(true);
    expect(result.eventsEmitted).toContain(GameEvent.QuestPlaced);
    expect(match.player1.hand.size()).toBe(0);
    expect(questManager.getActiveQuest("player1")).toBeDefined();
  });

  it("debería fallar si la carta de misión no está en la mano", () => {
    const hand = new Hand();
    const match = makeMatch(hand);

    const command = new ActivateQuestCommand(
      match,
      "player1",
      "no-existe",
      mockQuestData,
      questManager,
      eventBus,
    );

    const result = command.execute();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(CardNotInHandError);
  });

  it("debería fallar si ya hay una misión activa", () => {
    const hand = new Hand();
    const questCard = makeQuestCard();
    hand.add(questCard);
    const match = makeMatch(hand);

    questManager.placeQuest("player1", mockQuestData);

    const command = new ActivateQuestCommand(
      match,
      "player1",
      questCard.instanceId,
      mockQuestData,
      questManager,
      eventBus,
    );

    const result = command.execute();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(ApplicationError);
    expect((result.error as ApplicationError).code).toBe("QUEST_ALREADY_ACTIVE");
  });

  it("debería fallar si el jugador no es el activo", () => {
    const hand = new Hand();
    const questCard = makeQuestCard();
    hand.add(questCard);
    const match = makeMatch(hand);

    const command = new ActivateQuestCommand(
      match,
      "player2",
      questCard.instanceId,
      mockQuestData,
      questManager,
      eventBus,
    );

    const result = command.execute();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(ApplicationError);
    expect((result.error as ApplicationError).code).toBe("NOT_ACTIVE_PLAYER");
  });
});
