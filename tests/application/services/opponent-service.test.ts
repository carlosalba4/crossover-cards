import { describe, it, expect, vi } from "vitest";
/* eslint-disable @typescript-eslint/unbound-method */
import { OpponentService } from "@application/services/opponent-service";
import { GreedyAI } from "@domain/ai/greedy-ai";
import type { IAIStrategy, AIMainAction, AICombatAction } from "@domain/ai/ai-strategy";
import type { MatchService } from "@application/services/match-service";
import type { Match, PlayerState } from "@domain/entities/match";
import { Hand } from "@domain/entities/hand";
import { Hero, type IHeroPower } from "@domain/entities/hero";
import type { Character } from "@domain/entities/character";
import type { Deck } from "@domain/entities/deck";
import { Archetype } from "@domain/types/card-types";

describe("OpponentService", () => {
  // Helpers
  function buildDummyMatch(): Match {
    const hero = new Hero({
      staticId: "hero-1",
      name: "Hero",
      archetype: Archetype.Neutral,
      maxHealth: 30,
      heroPower: {
        name: "Power",
        nostalgyCost: 1,
        effectType: "Damage",
        targetType: "Any",
        value: 1,
      },
    });

    const p1State: PlayerState = {
      playerId: "ai-player",
      hand: new Hand(),
      board: { left: [], center: [], right: [] },
      hero: hero,
      deck: {} as unknown as Deck,
    };

    const p2State: PlayerState = {
      playerId: "opponent",
      hand: new Hand(),
      board: { left: [], center: [], right: [] },
      hero: hero,
      deck: {} as unknown as Deck,
    };

    return {
      player1: p1State,
      player2: p2State,
      currentPhase: "main",
      activePlayerId: "ai-player",
      // OpponentService consulta el estado vivo del atacante antes de cada ATTACK
      // (re-evaluación tras combate). En este mock todos los atacantes están
      // disponibles, preservando la intención de los tests (verificar el reenvío
      // de las acciones de la IA a MatchService).
      findCharacterOnBoard: () => ({
        isAlive: () => true,
        isExhausted: false,
        hasAttackedThisTurn: false,
      }),
    } as unknown as Match; // Usar unknown para no tener que implementar todos los métodos
  }

  function createMockStrategy(
    mainActions: AIMainAction[] = [{ type: "END_MAIN_PHASE" }],
    combatActions: AICombatAction[] = [{ type: "END_COMBAT" }],
    useCrossover: boolean = false,
  ): IAIStrategy {
    return {
      decideMainPhaseActions: vi.fn().mockReturnValue(mainActions),
      decideCombatActions: vi.fn().mockReturnValue(combatActions),
      shouldUseCrossover: vi.fn().mockReturnValue(useCrossover),
      shouldUseHeroPower: vi.fn().mockReturnValue(null),
    };
  }

  function createMockMatchService(
    success: boolean = true,
    nostalgiaCurrent: number = 10,
  ): MatchService {
    return {
      handlePlayerAction: vi.fn().mockReturnValue({ success, eventsEmitted: [] }),
      getNostalgia: vi.fn().mockReturnValue({ current: nostalgiaCurrent, max: 10 }),
      isCrossoverAvailable: vi.fn().mockReturnValue(false),
    } as unknown as MatchService;
  }

  /**
   * Construye un Match con un poder de héroe concreto para la IA y, opcionalmente,
   * aliados en el centro del tablero. Pensado para validar el reenvío de
   * USE_HERO_POWER por OpponentService usando estrategias reales.
   */
  function buildHeroPowerMatch(opts: {
    heroPower: IHeroPower;
    aiBoardCenter?: Character[];
    opponentStaticId?: string;
  }): Match {
    const aiHero = new Hero({
      staticId: "HERO-AI",
      name: "AI Hero",
      archetype: Archetype.Neutral,
      maxHealth: 30,
      heroPower: opts.heroPower,
    });
    const opponentHero = new Hero({
      staticId: opts.opponentStaticId ?? "HERO-OPP",
      name: "Opponent Hero",
      archetype: Archetype.Neutral,
      maxHealth: 30,
      heroPower: { name: "P", nostalgyCost: 1, effectType: "Damage", targetType: "Any", value: 1 },
    });

    const p1State: PlayerState = {
      playerId: "ai-player",
      hand: new Hand(),
      board: { left: [], center: opts.aiBoardCenter ?? [], right: [] },
      hero: aiHero,
      deck: {} as unknown as Deck,
    };
    const p2State: PlayerState = {
      playerId: "opponent",
      hand: new Hand(),
      board: { left: [], center: [], right: [] },
      hero: opponentHero,
      deck: {} as unknown as Deck,
    };

    return {
      player1: p1State,
      player2: p2State,
      currentPhase: "main",
      activePlayerId: "ai-player",
      findCharacterOnBoard: () => null,
    } as unknown as Match;
  }

  const dummyDelay = async () => Promise.resolve();

  it("a) setStrategy() reemplaza la estrategia", async () => {
    // Arrange
    const originalStrategy = createMockStrategy();
    const newStrategy = createMockStrategy();
    const opponentService = new OpponentService(originalStrategy);
    const match = buildDummyMatch();
    const matchService = createMockMatchService();

    // Act 1: usa original
    await opponentService.executeTurn(match, "ai-player", matchService, dummyDelay);

    // Act 2: cambia y usa nueva
    opponentService.setStrategy(newStrategy);
    await opponentService.executeTurn(match, "ai-player", matchService, dummyDelay);

    // Assert
    expect(originalStrategy.decideMainPhaseActions).toHaveBeenCalledTimes(1);
    expect(newStrategy.decideMainPhaseActions).toHaveBeenCalledTimes(1);
  });

  it("b) executeAITurn llama a handlePlayerAction para PLAY_CARD", async () => {
    // Arrange
    const strategy = createMockStrategy([
      { type: "PLAY_CARD", cardInstanceId: "card-1", zoneId: "center" },
      { type: "PLAY_CARD", cardInstanceId: "card-2", zoneId: "left" },
      { type: "END_MAIN_PHASE" },
    ]);
    const opponentService = new OpponentService(strategy);
    const match = buildDummyMatch();
    const matchService = createMockMatchService();

    // Act
    await opponentService.executeTurn(match, "ai-player", matchService, dummyDelay);

    // Assert
    expect(matchService.handlePlayerAction).toHaveBeenCalledWith({
      type: "PLAY_CARD",
      playerId: "ai-player",
      cardInstanceId: "card-1",
      zoneId: "center",
    });
    expect(matchService.handlePlayerAction).toHaveBeenCalledWith({
      type: "PLAY_CARD",
      playerId: "ai-player",
      cardInstanceId: "card-2",
      zoneId: "left",
    });
  });

  it("c) executeAITurn llama a handlePlayerAction para ATTACK", async () => {
    // Arrange
    const strategy = createMockStrategy(
      [{ type: "END_MAIN_PHASE" }],
      [
        { type: "ATTACK", attackerId: "att-1", defenderId: "def-1" },
        { type: "ATTACK", attackerId: "att-2", defenderId: "def-2" },
        { type: "END_COMBAT" },
      ],
    );
    const opponentService = new OpponentService(strategy);
    const match = buildDummyMatch();
    const matchService = createMockMatchService();

    // Act
    await opponentService.executeTurn(match, "ai-player", matchService, dummyDelay);

    // Assert
    expect(matchService.handlePlayerAction).toHaveBeenCalledWith({
      type: "ATTACK",
      attackerId: "att-1",
      defenderId: "def-1",
    });
    expect(matchService.handlePlayerAction).toHaveBeenCalledWith({
      type: "ATTACK",
      attackerId: "att-2",
      defenderId: "def-2",
    });
  });

  it("d) executeAITurn SIEMPRE llama a END_TURN al final", async () => {
    // Arrange
    const strategy = createMockStrategy();
    const opponentService = new OpponentService(strategy);
    const match = buildDummyMatch();
    const matchService = createMockMatchService();

    // Act
    await opponentService.executeTurn(match, "ai-player", matchService, dummyDelay);

    // Assert
    // handlePlayerAction debería ser llamado 1 vez, solo para el END_TURN
    expect(matchService.handlePlayerAction).toHaveBeenCalledTimes(1);
    expect(matchService.handlePlayerAction).toHaveBeenCalledWith({
      type: "END_TURN",
      playerId: "ai-player",
    });
  });

  it("e) Si handlePlayerAction devuelve success: false, NO lanza excepción y continúa al END_TURN final", async () => {
    // Arrange
    const strategy = createMockStrategy(
      [
        { type: "PLAY_CARD", cardInstanceId: "card-1", zoneId: "center" },
        { type: "END_MAIN_PHASE" },
      ],
      [{ type: "ATTACK", attackerId: "att-1", defenderId: "def-1" }, { type: "END_COMBAT" }],
    );
    const opponentService = new OpponentService(strategy);
    const match = buildDummyMatch();

    // Configurar matchService para que siempre falle (pero no lance excepción)
    const matchService = createMockMatchService(false);

    // Mock console.warn para mantener limpia la salida de tests
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Act
    // No debe lanzar excepciones
    await expect(
      opponentService.executeTurn(match, "ai-player", matchService, dummyDelay),
    ).resolves.not.toThrow();

    // Assert
    // Se llamó a PLAY_CARD
    expect(matchService.handlePlayerAction).toHaveBeenNthCalledWith(1, {
      type: "PLAY_CARD",
      playerId: "ai-player",
      cardInstanceId: "card-1",
      zoneId: "center",
    });

    // Se llamó a ATTACK (el fallo anterior no detuvo el flujo)
    expect(matchService.handlePlayerAction).toHaveBeenNthCalledWith(2, {
      type: "ATTACK",
      attackerId: "att-1",
      defenderId: "def-1",
    });

    // Se llamó a END_TURN al final (el fallo no detuvo el flujo)
    expect(matchService.handlePlayerAction).toHaveBeenNthCalledWith(3, {
      type: "END_TURN",
      playerId: "ai-player",
    });

    expect(consoleSpy).toHaveBeenCalledTimes(3); // PLAY_CARD, ATTACK y END_TURN fallidos

    consoleSpy.mockRestore();
  });

  // ===========================================================================
  // Poder de héroe (CRÍTICO-F4.1)
  // ===========================================================================

  it("f) GreedyAI con poder de daño y Nostalgia suficiente → USE_HERO_POWER al héroe rival", async () => {
    // Arrange
    const opponentService = new OpponentService(new GreedyAI());
    const match = buildHeroPowerMatch({
      heroPower: {
        name: "Hechizo Ancestral",
        nostalgyCost: 2,
        effectType: "Damage",
        targetType: "Any",
        value: 2,
      },
      opponentStaticId: "HERO-002",
    });
    const matchService = createMockMatchService(true, 10);

    // Act
    await opponentService.executeTurn(match, "ai-player", matchService, dummyDelay);

    // Assert: apunta al staticId del héroe rival.
    expect(matchService.handlePlayerAction).toHaveBeenCalledWith({
      type: "USE_HERO_POWER",
      playerId: "ai-player",
      targetId: "HERO-002",
    });
  });

  it("g) GreedyAI con poder de buff y un aliado en tablero → USE_HERO_POWER al aliado", async () => {
    // Arrange
    const ally = { instanceId: "ally-strong", attack: 5 } as unknown as Character;
    const opponentService = new OpponentService(new GreedyAI());
    const match = buildHeroPowerMatch({
      heroPower: {
        name: "Tornado de Fuego",
        nostalgyCost: 2,
        effectType: "BuffAttack",
        targetType: "AllyCharacter",
        value: 2,
      },
      aiBoardCenter: [ally],
    });
    const matchService = createMockMatchService(true, 10);

    // Act
    await opponentService.executeTurn(match, "ai-player", matchService, dummyDelay);

    // Assert: apunta al instanceId del aliado.
    expect(matchService.handlePlayerAction).toHaveBeenCalledWith({
      type: "USE_HERO_POWER",
      playerId: "ai-player",
      targetId: "ally-strong",
    });
  });

  it("h) Sin Nostalgia para el coste → no se intenta USE_HERO_POWER", async () => {
    // Arrange: coste 2, Nostalgia disponible 1.
    const opponentService = new OpponentService(new GreedyAI());
    const match = buildHeroPowerMatch({
      heroPower: {
        name: "Hechizo Ancestral",
        nostalgyCost: 2,
        effectType: "Damage",
        targetType: "Any",
        value: 2,
      },
    });
    const matchService = createMockMatchService(true, 1);

    // Act
    await opponentService.executeTurn(match, "ai-player", matchService, dummyDelay);

    // Assert: ninguna llamada de tipo USE_HERO_POWER.
    const calls = (matchService.handlePlayerAction as ReturnType<typeof vi.fn>).mock.calls;
    const heroPowerCalls = calls.filter(
      (c) => (c[0] as { type?: string })?.type === "USE_HERO_POWER",
    );
    expect(heroPowerCalls).toHaveLength(0);
  });

  // ===========================================================================
  // Crossover (CRÍTICO-F4.1)
  // ===========================================================================

  it("i) shouldUseCrossover=true → emite ACTIVATE_CROSSOVER una vez", async () => {
    // Arrange
    const strategy = createMockStrategy(
      [{ type: "END_MAIN_PHASE" }],
      [{ type: "END_COMBAT" }],
      true,
    );
    const opponentService = new OpponentService(strategy);
    const match = buildDummyMatch();
    const matchService = createMockMatchService();

    // Act
    await opponentService.executeTurn(match, "ai-player", matchService, dummyDelay);

    // Assert
    const calls = (matchService.handlePlayerAction as ReturnType<typeof vi.fn>).mock.calls;
    const crossoverCalls = calls.filter(
      (c) => (c[0] as { type?: string })?.type === "ACTIVATE_CROSSOVER",
    );
    expect(crossoverCalls).toHaveLength(1);
    expect(matchService.handlePlayerAction).toHaveBeenCalledWith({
      type: "ACTIVATE_CROSSOVER",
      playerId: "ai-player",
    });
  });
});
