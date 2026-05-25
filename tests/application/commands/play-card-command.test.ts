import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlayCardCommand } from "@application/commands/play-card-command";
import { Match } from "@domain/entities/match";
import { Hand } from "@domain/entities/hand";
import { Character } from "@domain/entities/character";
import { Spell } from "@domain/entities/spell";
import { NostalgiaSystem } from "@domain/services/nostalgia-system";
import { GameEvent } from "@domain/events/game-event";
import { CardType, Archetype, Rarity, Ability } from "@domain/types/card-types";
import { PhaseViolationError } from "@domain/errors/phase-violation-error";
import { InsufficientNostalgiaError } from "@domain/errors/insufficient-nostalgia-error";
import { BoardFullError } from "@domain/errors/board-full-error";
import { CardNotInHandError } from "@domain/errors/card-not-in-hand-error";
import type { IEventBus } from "@domain/events/event-bus";

// ── Helpers de construcción ──────────────────────────────────────────────────

function makeMockEventBus(): IEventBus {
  return {
    emit: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    off: vi.fn(),
    clear: vi.fn(),
  };
}

function makeCharacter(
  overrides: Partial<{ attack: number; health: number; abilities: Ability[] }> = {},
): Character {
  return new Character({
    staticId: "LIC-005",
    name: "Rigby",
    type: CardType.Character,
    archetype: Archetype.CartoonClasico,
    nostalgyCost: 2,
    rarity: Rarity.Rare,
    description: "Charge",
    spriteKey: "rigby_card",
    greetingText: "YA VOOOY!",
    attack: overrides.attack ?? 3,
    health: overrides.health ?? 2,
    abilities: overrides.abilities ?? [],
  });
}

function makeSpell(): Spell {
  return new Spell({
    staticId: "LIC-008",
    name: "Cangreburger",
    type: CardType.Spell,
    archetype: Archetype.Neutral,
    nostalgyCost: 2,
    rarity: Rarity.Common,
    description: "Cura y roba",
    spriteKey: "cangreburger_card",
    greetingText: "Sabor secreto!",
    effectType: "HealAndDraw",
    targetType: "Self",
    effectValue: 3,
    drawCount: 1,
  });
}

function makeMatch(hand: Hand, phase: "main" | "draw" | "combat" | "end" = "main"): Match {
  const match = new Match(
    {
      playerId: "player1",
      hand,
      board: { left: [], center: [], right: [] },
      heroCurrentHealth: 30,
    },
    {
      playerId: "player2",
      hand: new Hand(),
      board: { left: [], center: [], right: [] },
      heroCurrentHealth: 30,
    },
  );
  match.currentPhase = phase;
  match.activePlayerId = "player1";
  return match;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PlayCardCommand", () => {
  let eventBus: IEventBus;
  let nostalgiaSystem: NostalgiaSystem;

  beforeEach(() => {
    eventBus = makeMockEventBus();
    nostalgiaSystem = new NostalgiaSystem(eventBus);
    // Dar 5 de nostalgia al player1 (simula 5 cristales disponibles)
    nostalgiaSystem.onTurnStart("player1");
    nostalgiaSystem.onTurnStart("player1");
    nostalgiaSystem.onTurnStart("player1");
    nostalgiaSystem.onTurnStart("player1");
    nostalgiaSystem.onTurnStart("player1");
  });

  // ── Caso éxito: jugar un Character ───────────────────────────────────────

  it("debería jugar un Character con éxito y emitir CardPlayed + CharacterSummoned", () => {
    // Arrange
    const character = makeCharacter();
    const hand = new Hand();
    hand.add(character);
    const match = makeMatch(hand);

    const command = new PlayCardCommand(
      match,
      "player1",
      character.instanceId,
      eventBus,
      nostalgiaSystem,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.eventsEmitted).toContain(GameEvent.CardPlayed);
    expect(result.eventsEmitted).toContain(GameEvent.CharacterSummoned);
    expect(result.eventsEmitted).toContain(GameEvent.NostalgiaChanged);

    // Carta retirada de la mano
    expect(match.player1.hand.size()).toBe(0);

    // Personaje en tablero
    expect(match.player1.board.center).toHaveLength(1);
    expect(match.player1.board.center[0].instanceId).toBe(character.instanceId);

    // Personaje exhausto (no tiene Charge)
    expect(character.isExhausted).toBe(true);

    // Verificar eventos emitidos en el bus
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const emitMock = vi.mocked(eventBus.emit);
    expect(emitMock).toHaveBeenCalledWith(
      GameEvent.CardPlayed,
      expect.objectContaining({
        playerId: "player1",
        staticId: "LIC-005",
      }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      GameEvent.CharacterSummoned,
      expect.objectContaining({
        playerId: "player1",
        zoneId: "center",
      }),
    );
  });

  // ── Caso éxito: Character con Charge no queda exhausto ───────────────────

  it("debería no exhaust a un Character con Charge al invocarlo", () => {
    // Arrange
    const character = makeCharacter({ abilities: [Ability.Charge] });
    const hand = new Hand();
    hand.add(character);
    const match = makeMatch(hand);

    const command = new PlayCardCommand(
      match,
      "player1",
      character.instanceId,
      eventBus,
      nostalgiaSystem,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(true);
    expect(character.isExhausted).toBe(false);
  });

  // ── Caso éxito: jugar un Spell ────────────────────────────────────────────

  it("debería jugar un Spell con éxito y emitir CardPlayed + SpellCast", () => {
    // Arrange
    const spell = makeSpell();
    const hand = new Hand();
    hand.add(spell);
    const match = makeMatch(hand);

    const command = new PlayCardCommand(
      match,
      "player1",
      spell.instanceId,
      eventBus,
      nostalgiaSystem,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(true);
    expect(result.eventsEmitted).toContain(GameEvent.SpellCast);
    expect(match.player1.hand.size()).toBe(0);
    // Un hechizo no ocupa tablero
    expect(match.player1.board.center).toHaveLength(0);
  });

  // ── Fallo: fase incorrecta ───────────────────────────────────────────────

  it("debería fallar con PhaseViolationError si la fase no es 'main'", () => {
    // Arrange
    const character = makeCharacter();
    const hand = new Hand();
    hand.add(character);
    const match = makeMatch(hand, "combat");

    const command = new PlayCardCommand(
      match,
      "player1",
      character.instanceId,
      eventBus,
      nostalgiaSystem,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(PhaseViolationError);
    expect(match.player1.hand.size()).toBe(1); // carta NO salió de la mano
  });

  // ── Fallo: Nostalgia insuficiente ────────────────────────────────────────

  it("debería fallar con InsufficientNostalgiaError si no hay suficiente Nostalgia", () => {
    // Arrange
    const expensiveCard = makeCharacter({ attack: 5, health: 5 });
    // Sobrescribir nostalgyCost a 10 (más de lo disponible)
    Object.defineProperty(expensiveCard, "nostalgyCost", { value: 10 });

    const hand = new Hand();
    hand.add(expensiveCard);
    const match = makeMatch(hand);

    const command = new PlayCardCommand(
      match,
      "player1",
      expensiveCard.instanceId,
      eventBus,
      nostalgiaSystem,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(InsufficientNostalgiaError);
    expect(match.player1.hand.size()).toBe(1); // carta NO salió de la mano
  });

  // ── Fallo: tablero lleno ─────────────────────────────────────────────────

  it("debería fallar con BoardFullError si el tablero está lleno", () => {
    // Arrange
    const character = makeCharacter();
    const hand = new Hand();
    hand.add(character);
    const match = makeMatch(hand);

    // Llenar el tablero hasta el máximo (7)
    for (let i = 0; i < Match.MAX_BOARD_SLOTS; i++) {
      match.player1.board.center.push(makeCharacter());
    }

    const command = new PlayCardCommand(
      match,
      "player1",
      character.instanceId,
      eventBus,
      nostalgiaSystem,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(BoardFullError);
    expect(match.player1.hand.size()).toBe(1);
  });

  // ── Fallo: carta no en mano ──────────────────────────────────────────────

  it("debería fallar con CardNotInHandError si la carta no está en la mano", () => {
    // Arrange
    const hand = new Hand(); // mano vacía
    const match = makeMatch(hand);

    const command = new PlayCardCommand(
      match,
      "player1",
      "id-inexistente",
      eventBus,
      nostalgiaSystem,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(CardNotInHandError);
  });
});
