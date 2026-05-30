import type { IEventBus } from "@domain/events/event-bus";
import { GameEvent } from "@domain/events/game-event";
import type { CardId } from "@domain/types/card-types";

/**
 * Estructura de la condición para completar una misión.
 */
export interface QuestCondition {
  readonly type: string;
  readonly target: number;
}

/**
 * Estructura de la recompensa otorgada al completar una misión.
 */
export interface QuestReward {
  readonly type: string;
  readonly tokenId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [key: string]: any;
}

/**
 * Representa los datos estáticos de una misión (QST-001, etc.).
 */
export interface QuestData {
  readonly id: CardId;
  readonly name: string;
  readonly condition: QuestCondition;
  readonly reward: QuestReward;
}

/**
 * Estado en memoria de una misión activa asignada a un jugador.
 */
export interface ActiveQuest {
  readonly quest: QuestData;
  currentProgress: number;
}

/**
 * Gestor del Sistema de Misiones (Mecánica M4).
 * Permite a los jugadores tener una misión activa simultáneamente,
 * progresar en ella y obtener recompensas.
 */
export class QuestManager {
  private activeQuests = new Map<string, ActiveQuest>();

  constructor(private readonly eventBus: IEventBus) {}

  /**
   * Asigna una misión a un jugador.
   *
   * @param playerId ID del jugador.
   * @param quest Datos de la misión a asignar.
   * @throws {Error} Si el jugador ya tiene una misión en progreso.
   */
  public placeQuest(playerId: string, quest: QuestData): void {
    if (this.activeQuests.has(playerId)) {
      throw new Error(`El jugador ${playerId} ya tiene una misión activa en curso.`);
    }

    this.activeQuests.set(playerId, {
      quest,
      currentProgress: 0,
    });

    this.eventBus.emit(GameEvent.QuestPlaced, {
      playerId,
      questId: quest.id,
      questName: quest.name,
    });
  }

  /**
   * Incrementa el progreso de la misión activa de un jugador.
   * Si la misión alcanza su objetivo, se completa, emite la recompensa
   * y libera el hueco.
   *
   * @param playerId ID del jugador.
   * @param questId ID de la misión cuyo progreso se actualiza.
   * @param delta Cantidad de progreso a añadir (debe ser > 0).
   */
  public updateProgress(playerId: string, questId: CardId, delta: number): void {
    if (delta <= 0) return;

    const active = this.activeQuests.get(playerId);

    if (!active) {
      return; // El jugador no tiene misión activa
    }

    if (active.quest.id !== questId) {
      return; // El jugador tiene otra misión, ignorar este progreso
    }

    active.currentProgress += delta;
    const target = active.quest.condition.target;

    this.eventBus.emit(GameEvent.QuestProgressUpdated, {
      playerId,
      questId,
      current: active.currentProgress,
      target,
    });

    if (active.currentProgress >= target) {
      // Misión completada
      const rewardString = JSON.stringify(active.quest.reward);

      this.eventBus.emit(GameEvent.QuestCompleted, {
        playerId,
        questId,
        reward: rewardString,
      });

      // Liberar hueco
      this.activeQuests.delete(playerId);
    }
  }

  /**
   * Devuelve la misión activa de un jugador, si la tiene.
   */
  public getActiveQuest(playerId: string): ActiveQuest | undefined {
    return this.activeQuests.get(playerId);
  }
}
