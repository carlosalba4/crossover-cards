import { describe, it, expect, vi } from "vitest";
/* eslint-disable @typescript-eslint/unbound-method */
import { OpponentService } from "@application/services/opponent-service";
import type { IAIStrategy, AIMainAction, AICombatAction } from "@domain/ai/ai-strategy";
import type { MatchService } from "@application/services/match-service";
import type { Match, PlayerState } from "@domain/entities/match";
import { Hand } from "@domain/entities/hand";
import { Hero } from "@domain/entities/hero";
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

  function createMockMatchService(success: boolean = true): MatchService {
    return {
      handlePlayerAction: vi.fn().mockReturnValue({ success, eventsEmitted: [] }),
      getNostalgia: vi.fn().mockReturnValue({ current: 10, max: 10 }),
    } as unknown as MatchService;
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
});
