import { describe, it, expect, vi } from "vitest";
import { MainPhase } from "@domain/states/main-phase";
import { TurnEngine } from "@domain/services/turn-engine";
import { PhaseViolationError } from "@domain/states/turn-phase";
import type { IEventBus } from "@domain/events/event-bus";

class MockEventBus implements IEventBus {
  on = vi.fn();
  emit = vi.fn();
  off = vi.fn();
  clear = vi.fn();
}

describe("MainPhase", () => {
  it("debe transicionar a CombatPhase cuando recibe la acción END_PHASE", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    engine.startMatch(); // Empieza en draw phase
    engine.handleAction({ type: "END_PHASE" }); // Pasa a main
    const phase = new MainPhase(engine);

    // Act
    phase.handleAction({ type: "END_PHASE" });

    // Assert
    expect(engine.getCurrentPhaseName()).toBe("combat");
  });

  it("debe permitir jugar cartas y usar poderes de héroe", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new MainPhase(engine);

    // Act & Assert
    expect(() => phase.handleAction({ type: "PLAY_CARD" })).not.toThrow();
    expect(() => phase.handleAction({ type: "USE_HERO_POWER" })).not.toThrow();
  });

  it("debe lanzar PhaseViolationError si recibe una acción no permitida", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new MainPhase(engine);

    // Act & Assert
    expect(() => phase.handleAction({ type: "ATTACK" })).toThrowError(PhaseViolationError);
  });

  it("debe devolver las acciones permitidas correctamente", () => {
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new MainPhase(engine);
    expect(phase.getAllowedActions()).toEqual(["PLAY_CARD", "USE_HERO_POWER", "END_PHASE"]);
  });
});
