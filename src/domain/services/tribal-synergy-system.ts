import type { IEventBus } from "@domain/events/event-bus";
import { GameEvent } from "@domain/events/game-event";
import type { Character } from "@domain/entities/character";
import { Archetype } from "@domain/types/card-types";
import { Modifier } from "@domain/value-objects/modifier";

/**
 * Servicio de dominio responsable de la mecánica M1 (Sinergia Tribal).
 * - Agrupa a los Personajes en tablero por arquetipo.
 * - Los arquetipos con N >= 2 Personajes reciben un bono de +(N-1) ATQ.
 * - El arquetipo Neutral no recibe sinergias.
 */
export class TribalSynergySystem {
  constructor(private readonly eventBus: IEventBus) {}

  /**
   * Recalcula y aplica las sinergias tribales para los personajes en tablero
   * de un jugador. Limpia cualquier sinergia previa antes de reevaluar.
   *
   * @param playerId ID del jugador dueño del tablero.
   * @param charactersOnBoard Lista de Personajes actualmente en el tablero.
   * @param currentTurn Turno actual de la partida (usado para registrar el Modifier).
   */
  public calculateSynergies(
    playerId: string,
    charactersOnBoard: Character[],
    currentTurn: number = 0,
  ): void {
    // 1. Limpiar sinergias previas en todos los personajes evaluados
    charactersOnBoard.forEach((character) => {
      character.removeModifiersBySource("synergy");
    });

    // 2. Agrupar por arquetipo (excluyendo Neutral)
    const groups = new Map<Archetype, Character[]>();

    charactersOnBoard.forEach((character) => {
      const arch = character.archetype;
      if (arch !== Archetype.Neutral) {
        if (!groups.has(arch)) {
          groups.set(arch, []);
        }
        groups.get(arch)!.push(character);
      }
    });

    // 3. Evaluar cada grupo, aplicar bonos si corresponden, y emitir el evento
    for (const [archetype, chars] of groups.entries()) {
      const count = chars.length;
      const bonus = count >= 2 ? count - 1 : 0;

      if (bonus > 0) {
        chars.forEach((character) => {
          character.addModifier(
            new Modifier({
              source: "synergy",
              attackBonus: bonus,
              healthBonus: 0,
              abilitiesGranted: [],
              duration: -1, // Permanente mientras se mantenga la condición en el tablero
              appliedAtTurn: currentTurn,
            }),
          );
        });
      }

      // Emitir el evento de actualización para este arquetipo
      this.eventBus.emit(GameEvent.SynergyUpdated, {
        playerId,
        archetype,
        bonus,
        affectedCharacterIds: chars.map((c) => c.instanceId),
      });
    }
  }
}
