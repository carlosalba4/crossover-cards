import { describe, it, expect, vi } from "vitest";
import { EndPhase } from "@domain/states/end-phase";
import { TurnEngine } from "@domain/services/turn-engine";
import { PhaseViolationError } from "@domain/states/turn-phase";
import type { IEventBus } from "@domain/events/event-bus";

class MockEventBus implements IEventBus {
  on = vi.fn();
  emit = vi.fn();
  off = vi.fn();
  clear = vi.fn();
}

describe("EndPhase", () => {
  it("debe invocar engine.endTurn() cuando recibe la acción END_TURN", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const endTurnSpy = vi.spyOn(engine, "endTurn");
    const phase = new EndPhase(engine);

    // Act
    phase.handleAction({ type: "END_TURN" });

    // Assert
    expect(endTurnSpy).toHaveBeenCalledTimes(1);
  });

  it("debe lanzar PhaseViolationError si recibe una acción no permitida", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new EndPhase(engine);

    // Act & Assert
    expect(() => phase.handleAction({ type: "ATTACK" })).toThrowError(PhaseViolationError);
  });

  it("debe devolver las acciones permitidas correctamente", () => {
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new EndPhase(engine);
    expect(phase.getAllowedActions()).toEqual(["END_TURN"]);
  });
});
