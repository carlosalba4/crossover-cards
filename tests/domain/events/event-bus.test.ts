/**
 * Tests unitarios — Interfaz IEventBus
 *
 * Cobertura:
 *   - Creación de un mock que implementa la interfaz `IEventBus`.
 *   - Tipado estricto: confirmación de que TypeScript enruta correctamente
 *     el payload dependiendo del enum `GameEvent`.
 *   - Verificación de los métodos `on`, `emit`, `off` y `clear`.
 *
 * Convención: AAA (Arrange – Act – Assert).
 * Sin imports de Phaser ni infraestructura.
 *
 * Referencia: docs/02-architecture.md §4.4 (patrón Observer / Event Bus)
 */

import { describe, it, expect, vi } from "vitest";
import type { IEventBus, Unsubscribe } from "@domain/events/event-bus";
import { GameEvent, type GameEventPayloadMap } from "@domain/events/game-event";

// ---------------------------------------------------------------------------
// Mock de IEventBus para validación del contrato
// ---------------------------------------------------------------------------

type AnyHandler = (payload: unknown) => void;

/**
 * Implementación de prueba del Event Bus.
 * Demuestra que la interfaz es implementable y que los tipos genéricos
 * funcionan correctamente.
 */
class MockEventBus implements IEventBus {
  private handlers: Map<GameEvent, Set<AnyHandler>> = new Map();

  on<E extends GameEvent>(
    event: E,
    handler: (payload: GameEventPayloadMap[E]) => void,
  ): Unsubscribe {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as AnyHandler);

    return () => this.off(event, handler);
  }

  emit<E extends GameEvent>(event: E, payload: GameEventPayloadMap[E]): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => handler(payload));
    }
  }

  off<E extends GameEvent>(event: E, handler: (payload: GameEventPayloadMap[E]) => void): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler as AnyHandler);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("IEventBus Interface & Mock implementation", () => {
  it("debe permitir suscribirse a un evento (on) y recibir notificaciones (emit)", () => {
    // Arrange
    const bus: IEventBus = new MockEventBus();
    const handler = vi.fn();
    const payload: GameEventPayloadMap[GameEvent.MatchStarted] = {
      player1Id: "p1",
      player2Id: "p2",
    };

    // Act
    bus.on(GameEvent.MatchStarted, handler);
    bus.emit(GameEvent.MatchStarted, payload);

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it("debe garantizar que los tipos de payload coinciden con el evento (type safety)", () => {
    // Arrange
    const bus: IEventBus = new MockEventBus();
    const turnHandler = vi.fn();

    const turnPayload: GameEventPayloadMap[GameEvent.TurnStarted] = {
      playerId: "jugador-a",
      turnNumber: 5,
      phase: "draw",
    };

    // Act
    bus.on(GameEvent.TurnStarted, turnHandler);
    bus.emit(GameEvent.TurnStarted, turnPayload);

    // Assert
    // Si intentáramos `bus.emit(GameEvent.TurnStarted, MatchStartedPayload)`,
    // typecheck fallaría. Esta prueba demuestra que compila correctamente y
    // distribuye el mensaje.
    expect(turnHandler).toHaveBeenCalledWith(turnPayload);
  });

  it("debe permitir cancelar la suscripción mediante el Unsubscribe devuelto", () => {
    // Arrange
    const bus: IEventBus = new MockEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.on(GameEvent.TurnEnded, handler);

    const payload: GameEventPayloadMap[GameEvent.TurnEnded] = {
      playerId: "p1",
      turnNumber: 3,
    };

    // Act
    unsubscribe();
    bus.emit(GameEvent.TurnEnded, payload);

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it("debe permitir cancelar la suscripción usando el método off", () => {
    // Arrange
    const bus: IEventBus = new MockEventBus();
    const handler = vi.fn();
    bus.on(GameEvent.PhaseChanged, handler);

    const payload: GameEventPayloadMap[GameEvent.PhaseChanged] = {
      playerId: "p1",
      previousPhase: "main",
      newPhase: "combat",
    };

    // Act
    bus.off(GameEvent.PhaseChanged, handler);
    bus.emit(GameEvent.PhaseChanged, payload);

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it("debe eliminar todos los listeners al llamar a clear", () => {
    // Arrange
    const bus: IEventBus = new MockEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on(GameEvent.MatchStarted, handler1);
    bus.on(GameEvent.MatchEnded, handler2);

    // Act
    bus.clear();
    bus.emit(GameEvent.MatchStarted, { player1Id: "p1", player2Id: "p2" });
    bus.emit(GameEvent.MatchEnded, { winnerId: "p1", loserId: "p2", isDraw: false });

    // Assert
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });
});
