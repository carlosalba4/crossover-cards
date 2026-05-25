import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuestManager, type QuestData } from "@domain/services/quest-manager";
import { GameEvent } from "@domain/events/game-event";
import type { IEventBus } from "@domain/events/event-bus";

// Mock del IEventBus
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

describe("QuestManager", () => {
  let eventBus: MockEventBus;
  let manager: QuestManager;
  const P1 = "Player1";
  const P2 = "Player2";

  const quest1: QuestData = {
    id: "QST-001",
    name: "El Gran Desfile",
    condition: { type: "SummonCharacters", target: 5 },
    reward: { type: "SummonToken", tokenId: "TOK-001" },
  };

  const quest2: QuestData = {
    id: "QST-002",
    name: "Máquina de Guerra",
    condition: { type: "DealDamage", target: 15 },
    reward: { type: "HealHero", amount: 5 },
  };

  beforeEach(() => {
    eventBus = new MockEventBus();
    manager = new QuestManager(eventBus);
  });

  it("debe permitir colocar una misión y emitir el evento QuestPlaced", () => {
    manager.placeQuest(P1, quest1);

    expect(manager.getActiveQuest(P1)).toBeDefined();
    expect(manager.getActiveQuest(P1)?.currentProgress).toBe(0);

    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.QuestPlaced, {
      playerId: P1,
      questId: "QST-001",
      questName: "El Gran Desfile",
    });
  });

  it("debe lanzar un error si el jugador ya tiene una misión activa", () => {
    manager.placeQuest(P1, quest1);

    expect(() => manager.placeQuest(P1, quest2)).toThrowError(
      "El jugador Player1 ya tiene una misión activa en curso.",
    );
  });

  it("debe actualizar el progreso y emitir QuestProgressUpdated sin completar si no llega al target", () => {
    manager.placeQuest(P1, quest1); // Target = 5

    manager.updateProgress(P1, "QST-001", 2);

    expect(manager.getActiveQuest(P1)?.currentProgress).toBe(2);
    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.QuestProgressUpdated, {
      playerId: P1,
      questId: "QST-001",
      current: 2,
      target: 5,
    });

    // No debe haber emitido Completed
    expect(eventBus.emit).not.toHaveBeenCalledWith(GameEvent.QuestCompleted, expect.anything());
  });

  it("debe completar la misión, emitir QuestCompleted, entregar recompensa y liberar hueco al llegar al target", () => {
    manager.placeQuest(P1, quest1); // Target = 5

    manager.updateProgress(P1, "QST-001", 5);

    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.QuestProgressUpdated, {
      playerId: P1,
      questId: "QST-001",
      current: 5,
      target: 5,
    });

    expect(eventBus.emit).toHaveBeenCalledWith(GameEvent.QuestCompleted, {
      playerId: P1,
      questId: "QST-001",
      reward: JSON.stringify(quest1.reward),
    });

    // El hueco debe estar liberado
    expect(manager.getActiveQuest(P1)).toBeUndefined();
  });

  it("el progreso debe ser independiente por jugador, incluso si juegan la misma misión", () => {
    manager.placeQuest(P1, quest1);
    manager.placeQuest(P2, quest1);

    manager.updateProgress(P1, "QST-001", 4);
    manager.updateProgress(P2, "QST-001", 2);

    expect(manager.getActiveQuest(P1)?.currentProgress).toBe(4);
    expect(manager.getActiveQuest(P2)?.currentProgress).toBe(2);

    // Si P1 completa, P2 sigue teniéndola
    manager.updateProgress(P1, "QST-001", 1);

    expect(manager.getActiveQuest(P1)).toBeUndefined();
    expect(manager.getActiveQuest(P2)?.currentProgress).toBe(2);
  });

  it("debe ignorar actualizaciones de progreso si el delta es <= 0", () => {
    manager.placeQuest(P1, quest1);
    manager.updateProgress(P1, "QST-001", -2);

    expect(manager.getActiveQuest(P1)?.currentProgress).toBe(0);
  });

  it("debe ignorar silenciosamente la actualización si el jugador no tiene misión activa", () => {
    // P1 no tiene misión
    manager.updateProgress(P1, "QST-001", 2);
    expect(eventBus.emit).not.toHaveBeenCalledWith(
      GameEvent.QuestProgressUpdated,
      expect.anything(),
    );
  });

  it("debe ignorar silenciosamente la actualización si el ID de la misión no coincide", () => {
    manager.placeQuest(P1, quest1); // Activa QST-001

    // Intenta actualizar QST-002
    manager.updateProgress(P1, "QST-002", 5);

    expect(manager.getActiveQuest(P1)?.currentProgress).toBe(0);
    expect(eventBus.emit).not.toHaveBeenCalledWith(
      GameEvent.QuestProgressUpdated,
      expect.anything(),
    );
  });
});
