import { describe, it, expect, vi } from "vitest";
import { DrawPhase } from "@domain/states/draw-phase";

import { TurnEngine } from "@domain/services/turn-engine";
import { PhaseViolationError } from "@domain/states/turn-phase";
import type { IEventBus } from "@domain/events/event-bus";

class MockEventBus implements IEventBus {
  on = vi.fn();
  emit = vi.fn();
  off = vi.fn();
  clear = vi.fn();
}

describe("DrawPhase", () => {
  it("tras startMatch el motor avanza automáticamente a MainPhase (draw es automática)", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    // Act
    engine.startMatch(); // draw → main automático
    // Assert
    expect(engine.getCurrentPhaseName()).toBe("main");
  });

  it("DrawPhase.handleAction con END_PHASE transiciona a MainPhase", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new DrawPhase(engine);
    // Act
    phase.handleAction({ type: "END_PHASE" });
    // Assert
    expect(engine.getCurrentPhaseName()).toBe("main");
  });

  it("debe lanzar PhaseViolationError si recibe una acción no permitida", () => {
    // Arrange
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new DrawPhase(engine);

    // Act & Assert
    expect(() => phase.handleAction({ type: "PLAY_CARD" })).toThrowError(PhaseViolationError);
  });

  it("debe devolver las acciones permitidas correctamente", () => {
    const engine = new TurnEngine(new MockEventBus(), "P1", "P2");
    const phase = new DrawPhase(engine);
    expect(phase.getAllowedActions()).toEqual(["END_PHASE"]);
  });
});
