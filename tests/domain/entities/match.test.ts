import { describe, it, expect } from "vitest";
import { Match, type PlayerState } from "@domain/entities/match";
import { Hand } from "@domain/entities/hand";
import { Deck } from "@domain/entities/deck";
import { Hero } from "@domain/entities/hero";
import { Character } from "@domain/entities/character";
import type { Ability } from "@domain/types/card-types";
import { Archetype, CardType, Rarity } from "@domain/types/card-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeHero(staticId: string): Hero {
  return new Hero({
    staticId,
    name: staticId,
    archetype: Archetype.Neutral,
    maxHealth: 30,
    heroPower: {
      name: "P",
      nostalgyCost: 2,
      effectType: "Damage",
      targetType: "Any",
      value: 2,
    },
  });
}

function makeCharacter(abilities: Ability[] = []): Character {
  return new Character({
    staticId: "LIC-005",
    name: "Rigby",
    type: CardType.Character,
    archetype: Archetype.CartoonClasico,
    nostalgyCost: 2,
    rarity: Rarity.Rare,
    description: "Test",
    spriteKey: "rigby_card",
    greetingText: "YA VOOOY!",
    attack: 3,
    health: 3,
    abilities,
  });
}

function makePlayer(playerId: string, characters: Character[]): PlayerState {
  return {
    playerId,
    hand: new Hand(),
    board: { left: [], center: characters, right: [] },
    hero: makeHero(`HERO-${playerId}`),
    deck: new Deck([]),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Match.resetCombatStateForActivePlayer", () => {
  it("resetea isExhausted y hasAttackedThisTurn de los Personajes del jugador activo", () => {
    // Arrange
    const activeChar = makeCharacter();
    activeChar.isExhausted = true;
    activeChar.hasAttackedThisTurn = true;

    const match = new Match(makePlayer("p1", [activeChar]), makePlayer("p2", []));
    match.activePlayerId = "p1";

    // Act
    match.resetCombatStateForActivePlayer();

    // Assert
    expect(activeChar.isExhausted).toBe(false);
    expect(activeChar.hasAttackedThisTurn).toBe(false);
  });

  it("NO toca a los Personajes del jugador inactivo", () => {
    // Arrange
    const inactiveChar = makeCharacter();
    inactiveChar.isExhausted = true;
    inactiveChar.hasAttackedThisTurn = true;

    const match = new Match(makePlayer("p1", []), makePlayer("p2", [inactiveChar]));
    match.activePlayerId = "p1";

    // Act
    match.resetCombatStateForActivePlayer();

    // Assert: el jugador inactivo (p2) conserva su estado
    expect(inactiveChar.isExhausted).toBe(true);
    expect(inactiveChar.hasAttackedThisTurn).toBe(true);
  });

  it("permite que un Personaje con ≥1 turno en el tablero vuelva a atacar", () => {
    // Arrange: un Personaje jugado en un turno anterior quedó exhausto
    const veteran = makeCharacter();
    veteran.isExhausted = true;

    const match = new Match(makePlayer("p1", [veteran]), makePlayer("p2", []));
    match.activePlayerId = "p1";

    // Act: al iniciar de nuevo su turno se resetea
    match.resetCombatStateForActivePlayer();

    // Assert
    expect(veteran.isExhausted).toBe(false);
  });
});
