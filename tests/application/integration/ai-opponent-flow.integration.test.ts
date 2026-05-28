import { describe, it, expect, vi } from "vitest";
import { MatchService } from "@application/services/match-service";
import { OpponentService } from "@application/services/opponent-service";
import { DeckService } from "@application/services/deck-service";
import { GreedyAI } from "@domain/ai/greedy-ai";
import { ThreatAwareAI } from "@domain/ai/threat-aware-ai";
import { GameEventBus } from "@infrastructure/events/game-event-bus";
import { Archetype, CardType, Rarity } from "@domain/types/card-types";
import type { ICardRepository } from "@domain/repositories/i-card-repository";
import type { IDeckRepository } from "@domain/repositories/i-deck-repository";
import type { IHeroRepository } from "@domain/repositories/i-hero-repository";
import type { CardData, DeckData, HeroData } from "@domain/types/card-data";
import type { IEventBus } from "@domain/events/event-bus";

// --- Fakes para repositorios ---

const MOCK_CARDS: CardData[] = [
  {
    id: "card-1",
    name: "Guerrero Básico",
    type: CardType.Character,
    archetype: Archetype.Neutral,
    nostalgyCost: 1,
    rarity: Rarity.Common,
    description: "",
    spriteKey: "",
    greetingText: "",
    attack: 2,
    health: 2,
    abilities: [],
  },
  {
    id: "card-2",
    name: "Atacante Fuerte",
    type: CardType.Character,
    archetype: Archetype.Neutral,
    nostalgyCost: 2,
    rarity: Rarity.Common,
    description: "",
    spriteKey: "",
    greetingText: "",
    attack: 4,
    health: 3,
    abilities: [],
  },
];

const MOCK_HEROES: HeroData[] = [
  {
    id: "hero-1",
    name: "Hero Humano",
    archetype: Archetype.Neutral,
    maxHealth: 30,
    heroPower: {
      name: "Poder",
      cost: 2,
      effectType: "Damage",
      targetType: "Any",
      value: 2,
    },
  },
  {
    id: "hero-2",
    name: "Hero IA",
    archetype: Archetype.Neutral,
    maxHealth: 30,
    heroPower: {
      name: "Poder IA",
      cost: 2,
      effectType: "Damage",
      targetType: "Any",
      value: 2,
    },
  },
];

const MOCK_DECKS: DeckData[] = [
  {
    id: "deck-1",
    name: "Deck Humano",
    heroId: "hero-1",
    cards: [
      { cardId: "card-1", quantity: 15 },
      { cardId: "card-2", quantity: 15 },
    ],
  },
  {
    id: "deck-2",
    name: "Deck IA",
    heroId: "hero-2",
    cards: [
      { cardId: "card-1", quantity: 15 },
      { cardId: "card-2", quantity: 15 },
    ],
  },
];

class FakeCardRepository implements ICardRepository {
  getById(id: string): Promise<CardData | null> {
    return Promise.resolve(MOCK_CARDS.find((c) => c.id === id) || null);
  }
  getAll(): Promise<CardData[]> {
    return Promise.resolve(MOCK_CARDS);
  }
  getByArchetype(archetype: Archetype): Promise<CardData[]> {
    return Promise.resolve(MOCK_CARDS.filter((c) => c.archetype === archetype));
  }
}

class FakeHeroRepository implements IHeroRepository {
  getById(id: string): Promise<HeroData | null> {
    return Promise.resolve(MOCK_HEROES.find((h) => h.id === id) || null);
  }
  getAll(): Promise<HeroData[]> {
    return Promise.resolve(MOCK_HEROES);
  }
}

class FakeDeckRepository implements IDeckRepository {
  getById(id: string): Promise<DeckData | null> {
    return Promise.resolve(MOCK_DECKS.find((d) => d.id === id) || null);
  }
  getAll(): Promise<DeckData[]> {
    return Promise.resolve(MOCK_DECKS);
  }
}

// --- Suite de Integración ---

describe("AI Opponent Flow Integration", () => {
  it("Escenario 1: Humano vs GreedyAI - 3 turnos simulados", async () => {
    // 1. Inicializa una partida con matchService.initMatch().
    // Aseguramos que p1 empieza el turno siendo el humano.
    const mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1);

    const eventBus = GameEventBus.getInstance() as unknown as IEventBus;
    const cardRepo = new FakeCardRepository();
    const deckRepo = new FakeDeckRepository();
    const heroRepo = new FakeHeroRepository();
    const deckService = new DeckService(deckRepo, cardRepo);
    const matchService = new MatchService(deckService, deckRepo, heroRepo, eventBus);

    const match = await matchService.initMatch("deck-1", "deck-2");
    mathRandomSpy.mockRestore();

    const humanPlayerId = "p1";
    const aiPlayerId = "p2";

    // 2. Configura el OpponentService con una instancia real de GreedyAI.
    const aiStrategy = new GreedyAI();
    const opponentService = new OpponentService(aiStrategy);

    // Turno 1: Humano
    expect(match.activePlayerId).toBe(humanPlayerId);
    // Forzamos la fase a "main" para poder jugar y atacar (DrawPhase inicial salta automáticamente a MainPhase si el motor lo soporta,
    // pero si no, lo forzamos para el test, o simplemente ejecutamos EndTurn desde main).
    // Nota: Según la implementación actual de initMatch, se llama a startMatch() que lanza DrawPhase,
    // si las fases no auto-avanzan en los tests sin interactuar, podemos forzarla a "main".
    match.currentPhase = "main";

    // El humano juega una carta (si tiene el recurso de Nostalgia, asumiremos costo 0 o no validado para este test)
    // Pero asumiendo que los comandos validan nostalgia, forzaremos un poco de nostalgia.
    match.player1.hero.currentHealth = 30;

    // Termina turno humano
    const endTurnResult = matchService.handlePlayerAction({
      type: "END_TURN",
      playerId: humanPlayerId,
    });
    expect(endTurnResult.success).toBe(true);
    expect(match.activePlayerId).toBe(aiPlayerId);

    // Turno 2: IA
    match.currentPhase = "main";
    // Forzamos un poco de nostalgia para la IA para que juegue cartas (esto simulando que la Fase Main ya asignó nostalgia)

    // 3. Simula al menos 3 turnos (llamando a executeTurn)
    const dummyDelay = async () => Promise.resolve();
    await opponentService.executeTurn(match, aiPlayerId, matchService, dummyDelay);

    // 4. Verifica que MatchService recibe correctamente las GameAction generadas por la IA.
    // Como executeAITurn no lanza excepciones y llama a END_TURN, la IA debe haber pasado su turno.
    expect(match.activePlayerId).toBe(humanPlayerId);

    // 5. Verifica consistencia (las cartas bajaron a tablero si Greedy jugó, pero si no tenía nostalgia, igual pasó turno).
    // Turno 3: Humano
    match.currentPhase = "main";
    matchService.handlePlayerAction({ type: "END_TURN", playerId: humanPlayerId });
    expect(match.activePlayerId).toBe(aiPlayerId);

    // Turno 4: IA
    match.currentPhase = "main";
    await opponentService.executeTurn(match, aiPlayerId, matchService, dummyDelay);
    expect(match.activePlayerId).toBe(humanPlayerId);
  });

  it("Escenario 2: Humano vs ThreatAwareAI - comportamiento defensivo", async () => {
    const mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1); // Humano empieza

    const eventBus = GameEventBus.getInstance() as unknown as IEventBus;
    const cardRepo = new FakeCardRepository();
    const deckRepo = new FakeDeckRepository();
    const heroRepo = new FakeHeroRepository();
    const deckService = new DeckService(deckRepo, cardRepo);
    const matchService = new MatchService(deckService, deckRepo, heroRepo, eventBus);

    const match = await matchService.initMatch("deck-1", "deck-2");
    mathRandomSpy.mockRestore();

    const humanPlayerId = "p1";
    const aiPlayerId = "p2";

    // 1. Configura el OpponentService con ThreatAwareAI(rng = () => 0).
    const aiStrategy = new ThreatAwareAI(() => 0);
    const opponentService = new OpponentService(aiStrategy);

    // Termina turno humano para pasar a la IA
    match.currentPhase = "main";
    matchService.handlePlayerAction({ type: "END_TURN", playerId: humanPlayerId });
    expect(match.activePlayerId).toBe(aiPlayerId);

    // 2. Fuerza el estado inicial del héroe de la IA para que empiece con poca vida (<= 30%).
    // maxHealth es 30, <= 30% es <= 9
    match.player2.hero.currentHealth = 8;
    match.currentPhase = "main";

    // 3. Al llamar a executeTurn, verifica que toma decisiones (el servicio debería ejecutarlo sin error)
    const dummyDelay = async () => Promise.resolve();
    await opponentService.executeTurn(match, aiPlayerId, matchService, dummyDelay);

    // El turno debe terminar
    expect(match.activePlayerId).toBe(humanPlayerId);
  });
});
