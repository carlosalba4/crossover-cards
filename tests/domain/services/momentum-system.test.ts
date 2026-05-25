import { describe, it, expect, vi, beforeEach } from "vitest";
import { MomentumSystem, InsufficientMomentumError } from "@domain/services/momentum-system";
import { GameEvent } from "@domain/events/game-event";
import type { IEventBus } from "@domain/events/event-bus";

// Mock del IEventBus con soporte para suscripciones
class MockEventBus implements IEventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers = new Map<GameEvent, Set<(payload: any) => void>>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on = vi.fn((event: GameEvent, handler: (payload: any) => void) => {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => {};
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit = vi.fn((event: GameEvent, payload: any) => {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((h) => h(payload));
    }
  });

  off = vi.fn();
  clear = vi.fn();
}

describe("MomentumSystem", () => {
  let eventBus: MockEventBus;
  let system: MomentumSystem;
  const PLAYER_ID = "Player1";

  beforeEach(() => {
    eventBus = new MockEventBus();
    system = new MomentumSystem(eventBus);
  });

  it("debe inicializarse inactivo y con 0 de momentum", () => {
    expect(system.getCurrentMomentum(PLAYER_ID)).toBe(0);
    expect(system.isMomentumActive(PLAYER_ID)).toBe(false);
  });

  it("debe activar el momentum si la vida del héroe cae a 15 o menos y emitir evento", () => {
    eventBus.emit(GameEvent.HeroDamaged, { playerId: PLAYER_ID, damage: 15, currentHealth: 15 });

    expect(system.isMomentumActive(PLAYER_ID)).toBe(true);
    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.MomentumChanged, {
      playerId: PLAYER_ID,
      momentum: 0,
      isActive: true,
    });
  });

  it("no debe activar el momentum si la vida es mayor a 15", () => {
    eventBus.emit(GameEvent.HeroDamaged, { playerId: PLAYER_ID, damage: 10, currentHealth: 20 });

    expect(system.isMomentumActive(PLAYER_ID)).toBe(false);
  });

  it("debe desactivar el momentum si el héroe se cura a más de 15, conservando el recurso acumulado", () => {
    // Activa (vida = 15)
    eventBus.emit(GameEvent.HeroDamaged, { playerId: PLAYER_ID, damage: 15, currentHealth: 15 });

    // Gana 1 al inicio del turno
    system.onTurnStart(PLAYER_ID);
    expect(system.getCurrentMomentum(PLAYER_ID)).toBe(1);

    // Cura a 16
    eventBus.emit(GameEvent.HeroHealed, { playerId: PLAYER_ID, amount: 1, currentHealth: 16 });

    // Se desactiva pero conserva recurso
    expect(system.isMomentumActive(PLAYER_ID)).toBe(false);
    expect(system.getCurrentMomentum(PLAYER_ID)).toBe(1);

    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.MomentumChanged, {
      playerId: PLAYER_ID,
      momentum: 1,
      isActive: false,
    });
  });

  it("debe ganar 1 de momentum al inicio del turno solo si está activo, hasta max 10", () => {
    // Inactivo -> 0
    system.onTurnStart(PLAYER_ID);
    expect(system.getCurrentMomentum(PLAYER_ID)).toBe(0);

    // Activa
    eventBus.emit(GameEvent.HeroDamaged, { playerId: PLAYER_ID, damage: 20, currentHealth: 10 });

    // 15 turnos ganando (debería toparse en 10)
    for (let i = 0; i < 15; i++) {
      system.onTurnStart(PLAYER_ID);
    }

    expect(system.getCurrentMomentum(PLAYER_ID)).toBe(10);
  });

  it("debe permitir gastar momentum y emitir el evento correspondiente", () => {
    eventBus.emit(GameEvent.HeroDamaged, { playerId: PLAYER_ID, damage: 20, currentHealth: 10 });
    system.onTurnStart(PLAYER_ID);
    system.onTurnStart(PLAYER_ID);
    system.onTurnStart(PLAYER_ID); // momentum = 3

    system.spendAsMomentum(PLAYER_ID, 2);

    expect(system.getCurrentMomentum(PLAYER_ID)).toBe(1);
    expect(eventBus.emit).toHaveBeenLastCalledWith(GameEvent.MomentumChanged, {
      playerId: PLAYER_ID,
      momentum: 1,
      isActive: true,
    });
  });

  it("debe lanzar error si no hay suficiente momentum para gastar", () => {
    eventBus.emit(GameEvent.HeroDamaged, { playerId: PLAYER_ID, damage: 20, currentHealth: 10 });
    system.onTurnStart(PLAYER_ID); // momentum = 1

    expect(() => system.spendAsMomentum(PLAYER_ID, 2)).toThrowError(InsufficientMomentumError);
    expect(() => system.spendAsMomentum(PLAYER_ID, 2)).toThrowError(/Momentum insuficiente/);

    // El valor no cambia por el error
    expect(system.getCurrentMomentum(PLAYER_ID)).toBe(1);
  });

  it("debe lanzar error genérico al intentar gastar un valor negativo", () => {
    expect(() => system.spendAsMomentum(PLAYER_ID, -1)).toThrowError(
      "No se puede gastar una cantidad negativa de Momentum.",
    );
  });
});
