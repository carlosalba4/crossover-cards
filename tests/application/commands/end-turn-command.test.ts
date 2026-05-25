import { describe, it, expect, vi, beforeEach } from "vitest";
import { EndTurnCommand } from "@application/commands/end-turn-command";
import { Match } from "@domain/entities/match";
import { Hand } from "@domain/entities/hand";
import { TurnEngine } from "@domain/services/turn-engine";
import { GameEvent } from "@domain/events/game-event";
import { PhaseViolationError } from "@domain/errors/phase-violation-error";
import type { IEventBus } from "@domain/events/event-bus";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMockEventBus(): IEventBus {
  return {
    emit: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    off: vi.fn(),
    clear: vi.fn(),
  };
}

function makeMatch(phase: "main" | "draw" | "combat" | "end" = "main"): Match {
  const match = new Match(
    {
      playerId: "player1",
      hand: new Hand(),
      board: { left: [], center: [], right: [] },
      heroCurrentHealth: 30,
    },
    {
      playerId: "player2",
      hand: new Hand(),
      board: { left: [], center: [], right: [] },
      heroCurrentHealth: 30,
    },
  );
  match.currentPhase = phase;
  match.activePlayerId = "player1";
  return match;
}

// ── Tests EndTurnCommand ──────────────────────────────────────────────────────

describe("EndTurnCommand", () => {
  let eventBus: IEventBus;
  let turnEngine: TurnEngine;

  beforeEach(() => {
    eventBus = makeMockEventBus();
    turnEngine = new TurnEngine(eventBus, "player1", "player2");
    // Arrancar la partida para que el motor tenga una fase activa
    turnEngine.startMatch();
  });

  // ── Éxito: finalizar desde Main phase ───────────────────────────────────

  it("debería finalizar el turno con éxito desde la fase 'main'", () => {
    // Arrange
    const match = makeMatch("main");
    const command = new EndTurnCommand(match, "player1", eventBus, turnEngine);

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(true);
    expect(result.eventsEmitted).toContain(GameEvent.TurnEnded);
  });

  it("debería finalizar el turno con éxito desde la fase 'combat'", () => {
    // Arrange
    const match = makeMatch("combat");
    const command = new EndTurnCommand(match, "player1", eventBus, turnEngine);

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(true);
    expect(result.eventsEmitted).toContain(GameEvent.TurnEnded);
  });

  it("debería emitir TurnEnded vía el event bus", () => {
    // Arrange
    const match = makeMatch("main");
    const command = new EndTurnCommand(match, "player1", eventBus, turnEngine);

    // Act
    command.execute();

    // Assert — TurnEnded fue emitido por el TurnEngine
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const emitMock = vi.mocked(eventBus.emit);
    expect(emitMock).toHaveBeenCalledWith(
      GameEvent.TurnEnded,
      expect.objectContaining({ playerId: "player1" }),
    );
  });

  // ── Fallo: jugador incorrecto ────────────────────────────────────────────

  it("debería fallar con PhaseViolationError si el jugador no es el activo", () => {
    // Arrange
    const match = makeMatch("main");
    const command = new EndTurnCommand(match, "player2", eventBus, turnEngine);

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(PhaseViolationError);
  });

  // ── Fallo: fase incorrecta ───────────────────────────────────────────────

  it("debería fallar con PhaseViolationError si la fase es 'draw'", () => {
    // Arrange
    const match = makeMatch("draw");
    const command = new EndTurnCommand(match, "player1", eventBus, turnEngine);

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(PhaseViolationError);
    expect((result.error as PhaseViolationError).message).toContain("draw");
  });
});
