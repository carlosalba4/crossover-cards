import { describe, it, expect, vi } from "vitest";
import { TurnEngine } from "@domain/services/turn-engine";
import { GameEvent } from "@domain/events/game-event";
import type { IEventBus } from "@domain/events/event-bus";

class MockEventBus implements IEventBus {
  on = vi.fn();
  emit = vi.fn();
  off = vi.fn();
  clear = vi.fn();
}

describe("TurnEngine", () => {
  it("debe inicializarse con el primer jugador como activo y en turno 1", () => {
    // Arrange
    const eventBus = new MockEventBus();
    const engine = new TurnEngine(eventBus, "P1", "P2");

    // Act & Assert
    expect(engine.getActivePlayerId()).toBe("P1");
    expect(engine.getInactivePlayerId()).toBe("P2");
    expect(engine.getTurnNumber()).toBe(1);
    expect(engine.getCurrentPhaseName()).toBeNull();
  });

  it("debe emitir MatchStarted y TurnStarted al invocar startMatch", () => {
    // Arrange
    const eventBus = new MockEventBus();
    const engine = new TurnEngine(eventBus, "P1", "P2");

    // Act
    engine.startMatch();

    // Assert
    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.MatchStarted, {
      player1Id: "P1",
      player2Id: "P2",
    });
    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.TurnStarted, {
      playerId: "P1",
      turnNumber: 1,
      phase: "draw",
    });
    // La fase de robo es automática: el motor avanza a main tras iniciar el turno.
    expect(engine.getCurrentPhaseName()).toBe("main");
  });

  it("debe alternar al jugador activo y aumentar el turno al invocar endTurn", () => {
    // Arrange
    const eventBus = new MockEventBus();
    const engine = new TurnEngine(eventBus, "P1", "P2");
    engine.startMatch();

    // Act
    engine.endTurn();

    // Assert
    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.TurnEnded, {
      playerId: "P1",
      turnNumber: 1,
    });
    expect(engine.getActivePlayerId()).toBe("P2");
    expect(engine.getInactivePlayerId()).toBe("P1");
    expect(engine.getTurnNumber()).toBe(2);
    // P2 empieza su turno y el motor avanza automáticamente de draw a main.
    expect(engine.getCurrentPhaseName()).toBe("main");
  });

  it("debe emitir PhaseChanged al hacer transitionTo", () => {
    // Arrange
    const eventBus = new MockEventBus();
    const engine = new TurnEngine(eventBus, "P1", "P2");
    engine.startMatch(); // draw -> main automático; emite PhaseChanged draw->main

    // Assert: la transición automática draw->main se ha emitido al iniciar
    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.PhaseChanged, {
      playerId: "P1",
      previousPhase: "draw",
      newPhase: "main",
    });

    // Act: desde main, END_PHASE transiciona a combat
    engine.handleAction({ type: "END_PHASE" });

    // Assert
    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.PhaseChanged, {
      playerId: "P1",
      previousPhase: "main",
      newPhase: "combat",
    });
    expect(engine.getCurrentPhaseName()).toBe("combat");
  });

  it("debe delegar acciones a la fase actual y transicionar correctamente en un turno completo", () => {
    // Arrange
    const eventBus = new MockEventBus();
    const engine = new TurnEngine(eventBus, "P1", "P2");
    engine.startMatch();

    // Act & Assert
    // El turno arranca directamente en main (draw es automática).
    expect(engine.getCurrentPhaseName()).toBe("main");
    engine.handleAction({ type: "PLAY_CARD" }); // Acción válida en main
    engine.handleAction({ type: "END_PHASE" });

    expect(engine.getCurrentPhaseName()).toBe("combat");
    engine.handleAction({ type: "ATTACK" }); // Acción válida en combat
    engine.handleAction({ type: "END_PHASE" });

    expect(engine.getCurrentPhaseName()).toBe("end");
    engine.handleAction({ type: "END_TURN" });

    expect(engine.getActivePlayerId()).toBe("P2");
    expect(engine.getTurnNumber()).toBe(2);
  });

  it("debe lanzar un error al intentar hacer handleAction antes de startMatch", () => {
    // Arrange
    const eventBus = new MockEventBus();
    const engine = new TurnEngine(eventBus, "P1", "P2");

    // Act & Assert
    expect(() => engine.handleAction({ type: "END_PHASE" })).toThrowError(
      "No hay ninguna fase de turno activa.",
    );
  });

  it("debe retornar correctamente su bus de eventos", () => {
    const eventBus = new MockEventBus();
    const engine = new TurnEngine(eventBus, "P1", "P2");
    expect(engine.getEventBus()).toBe(eventBus);
  });
});
