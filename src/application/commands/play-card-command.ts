import type { ICommand, CommandResult } from "@application/commands/i-command";
import { Match, type PlayerBoard } from "@domain/entities/match";
import type { IEventBus } from "@domain/events/event-bus";
import type { NostalgiaSystem } from "@domain/services/nostalgia-system";
import { GameEvent } from "@domain/events/game-event";
import { Character } from "@domain/entities/character";
import { Spell } from "@domain/entities/spell";
import { Item } from "@domain/entities/item";
import { CardType, Ability } from "@domain/types/card-types";
import { PhaseViolationError } from "@domain/errors/phase-violation-error";
import { CardNotInHandError } from "@domain/errors/card-not-in-hand-error";
import { BoardFullError } from "@domain/errors/board-full-error";
import { InsufficientNostalgiaError } from "@domain/errors/insufficient-nostalgia-error";

/**
 * Comando que ejecuta la acción de jugar una carta desde la mano.
 *
 * Validaciones (en orden):
 *  1. La fase actual debe ser "main".
 *  2. La carta debe estar en la mano del jugador activo.
 *  3. El jugador debe tener suficiente Nostalgia.
 *  4. Si es Character, el tablero no debe estar lleno.
 *
 * Si todo es válido: retira la carta de la mano, descuenta Nostalgia,
 * coloca en tablero o aplica efecto, y emite los eventos correspondientes.
 *
 * Referencia: docs/02-architecture.md §4.3 (patrón Command).
 */
export class PlayCardCommand implements ICommand {
  constructor(
    private readonly match: Match,
    private readonly playerId: string,
    private readonly cardInstanceId: string,
    private readonly eventBus: IEventBus,
    private readonly nostalgiaSystem: NostalgiaSystem,
    private readonly zoneId: keyof PlayerBoard = "center",
  ) {}

  execute(): CommandResult {
    const eventsEmitted: GameEvent[] = [];

    // ── 1. Validar fase ──────────────────────────────────────────────────────
    if (this.match.currentPhase !== "main") {
      return {
        success: false,
        error: new PhaseViolationError(
          `No se puede jugar cartas en la fase "${this.match.currentPhase}". Solo en "main".`,
        ),
        eventsEmitted,
      };
    }

    const player = this.match.getActivePlayer();

    // Solo el jugador activo puede jugar cartas
    if (player.playerId !== this.playerId) {
      return {
        success: false,
        error: new PhaseViolationError("Solo el jugador activo puede jugar cartas."),
        eventsEmitted,
      };
    }

    // ── 2. Validar que la carta está en mano ─────────────────────────────────
    const card = player.hand.find(this.cardInstanceId);
    if (!card) {
      return {
        success: false,
        error: new CardNotInHandError(
          `La carta con instanceId "${this.cardInstanceId}" no está en la mano del jugador.`,
        ),
        eventsEmitted,
      };
    }

    // ── 3. Validar Nostalgia suficiente ──────────────────────────────────────
    const available = this.nostalgiaSystem.getCurrentNostalgia(this.playerId);
    if (available < card.nostalgyCost) {
      return {
        success: false,
        error: new InsufficientNostalgiaError(
          `Nostalgia insuficiente. Requerida: ${card.nostalgyCost}, Actual: ${available}`,
        ),
        eventsEmitted,
      };
    }

    // ── 4. Validar tablero no lleno (solo para Character) ────────────────────
    if (card.type === CardType.Character) {
      const total = this.match.getTotalBoardCount(player);
      if (total >= Match.MAX_BOARD_SLOTS) {
        return {
          success: false,
          error: new BoardFullError(
            `El tablero está lleno (${Match.MAX_BOARD_SLOTS} Personajes máximo).`,
          ),
          eventsEmitted,
        };
      }
    }

    // ── Acciones: retirar carta de mano ──────────────────────────────────────
    player.hand.remove(this.cardInstanceId);

    // ── Descontar Nostalgia ───────────────────────────────────────────────────
    this.nostalgiaSystem.spend(this.playerId, card.nostalgyCost);
    eventsEmitted.push(GameEvent.NostalgiaChanged);

    // ── Emitir CardPlayed ─────────────────────────────────────────────────────
    this.eventBus.emit(GameEvent.CardPlayed, {
      playerId: this.playerId,
      cardId: card.instanceId,
      staticId: card.staticId,
      zoneId: card.type === CardType.Character ? this.zoneId : undefined,
    });
    eventsEmitted.push(GameEvent.CardPlayed);

    // ── Resolución por tipo de carta ─────────────────────────────────────────
    if (card instanceof Character) {
      this.resolveCharacter(card, player, eventsEmitted);
    } else if (card instanceof Spell) {
      this.resolveSpell(card, eventsEmitted);
    } else if (card instanceof Item) {
      this.resolveItem(card, eventsEmitted);
    }

    return { success: true, eventsEmitted };
  }

  /**
   * Coloca el Personaje en el tablero, aplica Battlecry si tiene,
   * y emite CharacterSummoned.
   */
  private resolveCharacter(
    character: Character,
    player: ReturnType<Match["getActivePlayer"]>,
    eventsEmitted: GameEvent[],
  ): void {
    // Si NO tiene Charge, queda exhausto al entrar
    const hasCharge = character.abilities.includes(Ability.Charge);
    character.isExhausted = !hasCharge;

    this.match.addCharacterToBoard(player, character, this.zoneId);

    this.eventBus.emit(GameEvent.CharacterSummoned, {
      playerId: this.playerId,
      character,
      zoneId: this.zoneId,
    });
    eventsEmitted.push(GameEvent.CharacterSummoned);
  }

  /**
   * Emite SpellCast. La resolución real del efecto queda para
   * el servicio de efectos de Hechizo (fuera de este comando).
   */
  private resolveSpell(spell: Spell, eventsEmitted: GameEvent[]): void {
    this.eventBus.emit(GameEvent.SpellCast, {
      playerId: this.playerId,
      spell,
      targetId: undefined,
    });
    eventsEmitted.push(GameEvent.SpellCast);
  }

  /**
   * Emite ItemEquipped. La aplicación de los stats queda para
   * el servicio de Ítems del héroe (fuera de este comando).
   */
  private resolveItem(item: Item, eventsEmitted: GameEvent[]): void {
    this.eventBus.emit(GameEvent.ItemEquipped, {
      playerId: this.playerId,
      item,
      targetId: this.playerId, // equipa al héroe aliado por defecto
    });
    eventsEmitted.push(GameEvent.ItemEquipped);
  }
}
