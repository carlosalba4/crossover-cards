import { describe, it, expect, vi, beforeEach } from "vitest";
import { NostalgiaSystem, InsufficientNostalgiaError } from "@domain/services/nostalgia-system";
import { GameEvent } from "@domain/events/game-event";
import type { IEventBus } from "@domain/events/event-bus";

// Mock del IEventBus
class MockEventBus implements IEventBus {
  on = vi.fn();
  emit = vi.fn();
  off = vi.fn();
  clear = vi.fn();
}

describe("NostalgiaSystem", () => {
  let eventBus: MockEventBus;
  let system: NostalgiaSystem;
  const PLAYER_ID = "Player1";

  beforeEach(() => {
    eventBus = new MockEventBus();
    system = new NostalgiaSystem(eventBus);
  });

  it("debe inicializar el estado del jugador con 0 en max y current", () => {
    expect(system.getCurrentNostalgia(PLAYER_ID)).toBe(0);
    expect(system.getMaxNostalgia(PLAYER_ID)).toBe(0);
  });

  describe("onTurnStart", () => {
    it("debe incrementar max en 1 y rellenar current al nuevo max", () => {
      system.onTurnStart(PLAYER_ID);

      expect(system.getMaxNostalgia(PLAYER_ID)).toBe(1);
      expect(system.getCurrentNostalgia(PLAYER_ID)).toBe(1);

      expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.NostalgiaChanged, {
        playerId: PLAYER_ID,
        current: 1,
        max: 1,
      });
    });

    it("no debe acumular nostalgia no gastada de turnos anteriores", () => {
      system.onTurnStart(PLAYER_ID); // max 1, cur 1
      system.onTurnStart(PLAYER_ID); // max 2, cur 2 (no 1+2)

      expect(system.getMaxNostalgia(PLAYER_ID)).toBe(2);
      expect(system.getCurrentNostalgia(PLAYER_ID)).toBe(2);
    });

    it("debe estar topado a un máximo de 10", () => {
      for (let i = 0; i < 15; i++) {
        system.onTurnStart(PLAYER_ID);
      }

      expect(system.getMaxNostalgia(PLAYER_ID)).toBe(10);
      expect(system.getCurrentNostalgia(PLAYER_ID)).toBe(10);

      expect(eventBus.emit).toHaveBeenLastCalledWith(GameEvent.NostalgiaChanged, {
        playerId: PLAYER_ID,
        current: 10,
        max: 10,
      });
    });
  });

  describe("spend", () => {
    it("debe deducir la nostalgia correctamente y emitir evento", () => {
      system.onTurnStart(PLAYER_ID); // max 1, cur 1
      system.onTurnStart(PLAYER_ID); // max 2, cur 2
      system.onTurnStart(PLAYER_ID); // max 3, cur 3

      system.spend(PLAYER_ID, 2);

      expect(system.getCurrentNostalgia(PLAYER_ID)).toBe(1);
      expect(system.getMaxNostalgia(PLAYER_ID)).toBe(3);

      expect(eventBus.emit).toHaveBeenLastCalledWith(GameEvent.NostalgiaChanged, {
        playerId: PLAYER_ID,
        current: 1,
        max: 3,
      });
    });

    it("debe lanzar InsufficientNostalgiaError si no hay suficiente", () => {
      system.onTurnStart(PLAYER_ID); // max 1, cur 1

      expect(() => system.spend(PLAYER_ID, 2)).toThrowError(InsufficientNostalgiaError);
      expect(() => system.spend(PLAYER_ID, 2)).toThrowError(/Nostalgia insuficiente/);

      // Asegurarse de que el estado no mutó tras el fallo
      expect(system.getCurrentNostalgia(PLAYER_ID)).toBe(1);
    });

    it("debe lanzar un Error base si la cantidad es negativa", () => {
      system.onTurnStart(PLAYER_ID); // max 1, cur 1

      expect(() => system.spend(PLAYER_ID, -1)).toThrowError(
        "No se puede gastar una cantidad negativa de Nostalgia.",
      );
    });
  });
});
