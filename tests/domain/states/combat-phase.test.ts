import { describe, it, expect, vi } from "vitest";
import { CombatPhase } from "@domain/states/combat-phase";
import { TurnEngine } from "@domain/services/turn-engine";
import { PhaseViolationError } from "@domain/states/turn-phase";
import type { IEventBus } from "@domain/events/event-bus";

class MockEventBus implements IEventBus {
  on = vi.fn();
  emit = vi.fn();
  off = vi.fn();
  clear = vi.fn();
}

describe("CombatPhase", () => {
  it("debe transicionar a EndPhase cuando recibe la acción END_PHASE", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    engine.startMatch(); // draw
    engine.handleAction({ type: "END_PHASE" }); // main
    engine.handleAction({ type: "END_PHASE" }); // combat
    const phase = new CombatPhase(engine);

    // Act
    phase.handleAction({ type: "END_PHASE" });

    // Assert
    expect(engine.getCurrentPhaseName()).toBe("end");
  });

  it("debe permitir declarar ataques", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new CombatPhase(engine);

    // Act & Assert
    expect(() => phase.handleAction({ type: "ATTACK" })).not.toThrow();
  });

  it("debe lanzar PhaseViolationError si recibe una acción no permitida", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new CombatPhase(engine);

    // Act & Assert
    expect(() => phase.handleAction({ type: "PLAY_CARD" })).toThrowError(PhaseViolationError);
  });

  it("debe devolver las acciones permitidas correctamente", () => {
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new CombatPhase(engine);
    expect(phase.getAllowedActions()).toEqual(["ATTACK", "END_PHASE"]);
  });
});
