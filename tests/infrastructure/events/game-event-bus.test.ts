import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GameEventBus } from "@infrastructure/events/game-event-bus";
import { GameEvent } from "@domain/events/game-event";
import type { TurnEndedPayload } from "@domain/events/game-event";

describe("GameEventBus (Infrastructure)", () => {
  let eventBus: GameEventBus;

  // Arrange global para cada test
  beforeEach(() => {
    // Aseguramos un estado limpio invocando el reset
    GameEventBus.resetInstance();
    eventBus = GameEventBus.getInstance();

    // Suprimimos console.warn y console.error para no ensuciar la salida del test,
    // ya que algunos tests generarán estos logs intencionalmente.
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debería mantener una única instancia (Singleton)", () => {
    // Act
    const instance1 = GameEventBus.getInstance();
    const instance2 = GameEventBus.getInstance();

    // Assert
    expect(instance1).toBe(instance2);
  });

  it("debería permitir suscripción y recepción de payload correctamente (on, emit)", () => {
    // Arrange
    const handler = vi.fn();
    const payload: TurnEndedPayload = { playerId: "player-1", turnNumber: 2 };

    // Act
    eventBus.on(GameEvent.TurnEnded, handler);
    eventBus.emit(GameEvent.TurnEnded, payload);

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it("debería dejar de llamar al handler tras la desuscripción (off)", () => {
    // Arrange
    const handler = vi.fn();
    const payload: TurnEndedPayload = { playerId: "player-1", turnNumber: 2 };

    // Act
    const unsubscribe = eventBus.on(GameEvent.TurnEnded, handler);
    unsubscribe(); // Equivalente a eventBus.off(GameEvent.TurnEnded, handler)
    eventBus.emit(GameEvent.TurnEnded, payload);

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it("no debería detener la ejecución si un handler lanza un error", () => {
    // Arrange
    const faultyHandler = vi.fn(() => {
      throw new Error("Error simulado en handler");
    });
    const goodHandler = vi.fn();
    const payload: TurnEndedPayload = { playerId: "player-1", turnNumber: 2 };

    eventBus.on(GameEvent.TurnEnded, faultyHandler);
    eventBus.on(GameEvent.TurnEnded, goodHandler);

    // Act
    eventBus.emit(GameEvent.TurnEnded, payload);

    // Assert
    expect(faultyHandler).toHaveBeenCalledTimes(1);
    expect(goodHandler).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled(); // Verifica que el error fue logueado
  });

  it("debería limpiar todos los handlers al llamar a clear() o resetInstance()", () => {
    // Arrange
    const handler = vi.fn();
    const payload: TurnEndedPayload = { playerId: "player-1", turnNumber: 2 };

    eventBus.on(GameEvent.TurnEnded, handler);

    // Act
    GameEventBus.resetInstance(); // Internamente llama a clear()
    const newBus = GameEventBus.getInstance();
    newBus.emit(GameEvent.TurnEnded, payload);

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it("debería bloquear emisiones recursivas dentro de un handler sin lanzar excepción", () => {
    // Arrange
    const payload: TurnEndedPayload = { playerId: "player-1", turnNumber: 2 };

    const recursiveHandler = vi.fn(() => {
      // Intento de emitir mientras ya se está procesando una emisión
      eventBus.emit(GameEvent.TurnEnded, payload);
    });

    eventBus.on(GameEvent.TurnEnded, recursiveHandler);

    // Act
    // No debería lanzar un Maximum call stack size exceeded
    expect(() => eventBus.emit(GameEvent.TurnEnded, payload)).not.toThrow();

    // Assert
    expect(recursiveHandler).toHaveBeenCalledTimes(1); // Se llama la primera vez, el emit interno es bloqueado
    expect(console.warn).toHaveBeenCalled(); // Verifica que el aviso de recursividad fue logueado
  });
});
