import { describe, it, expect, vi, beforeEach } from "vitest";
import { AttackCommand } from "@application/commands/attack-command";
import { Match } from "@domain/entities/match";
import { Hand } from "@domain/entities/hand";
import { Character } from "@domain/entities/character";
import { CombatResolver } from "@domain/services/combat-resolver";
import { GameEvent } from "@domain/events/game-event";
import { CardType, Archetype, Rarity, Ability } from "@domain/types/card-types";
import { PhaseViolationError } from "@domain/errors/phase-violation-error";
import { InvalidTargetError } from "@domain/errors/invalid-target-error";
import type { IEventBus } from "@domain/events/event-bus";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMockEventBus(): IEventBus {
  return {
    emit: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    off: vi.fn(),
    clear: vi.fn(),
  };
}

function makeCharacter(
  overrides: Partial<{
    attack: number;
    health: number;
    abilities: Ability[];
    name: string;
  }> = {},
): Character {
  return new Character({
    staticId: "LIC-005",
    name: overrides.name ?? "Rigby",
    type: CardType.Character,
    archetype: Archetype.CartoonClasico,
    nostalgyCost: 2,
    rarity: Rarity.Rare,
    description: "Test",
    spriteKey: "rigby_card",
    greetingText: "YA VOOOY!",
    attack: overrides.attack ?? 3,
    health: overrides.health ?? 3,
    abilities: overrides.abilities ?? [],
  });
}

function makeMatch(
  attackerChars: Character[] = [],
  defenderChars: Character[] = [],
  phase: "main" | "draw" | "combat" | "end" = "combat",
): Match {
  const match = new Match(
    {
      playerId: "player1",
      hand: new Hand(),
      board: { left: [], center: attackerChars, right: [] },
      heroCurrentHealth: 30,
    },
    {
      playerId: "player2",
      hand: new Hand(),
      board: { left: [], center: defenderChars, right: [] },
      heroCurrentHealth: 30,
    },
  );
  match.currentPhase = phase;
  match.activePlayerId = "player1";
  return match;
}

// ── Tests AttackCommand ───────────────────────────────────────────────────────

describe("AttackCommand", () => {
  let eventBus: IEventBus;
  let combatResolver: CombatResolver;

  beforeEach(() => {
    eventBus = makeMockEventBus();
    combatResolver = new CombatResolver(eventBus);
  });

  // ── Éxito: ataque básico ─────────────────────────────────────────────────

  it("debería resolver un ataque con éxito y emitir AttackDeclared + AttackResolved", () => {
    // Arrange
    const attacker = makeCharacter({ attack: 3, health: 3 });
    const defender = makeCharacter({ attack: 2, health: 2, name: "Chowder" });
    const match = makeMatch([attacker], [defender]);

    const command = new AttackCommand(
      match,
      attacker.instanceId,
      defender.instanceId,
      eventBus,
      combatResolver,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(true);
    expect(result.eventsEmitted).toContain(GameEvent.AttackDeclared);
    expect(result.eventsEmitted).toContain(GameEvent.AttackResolved);

    // El atacante recibió daño de contraataque (2), sigue vivo (3 - 2 = 1)
    expect(attacker.currentHealth).toBe(1);
    // El defensor recibió 3 daño, murió (2 - 3 = -1 → 0)
    expect(defender.currentHealth).toBe(0);
    expect(!defender.isAlive()).toBe(true);
  });

  it("debería eliminar Personaje muerto del tablero tras el ataque", () => {
    // Arrange
    const attacker = makeCharacter({ attack: 5, health: 5 });
    const defender = makeCharacter({ attack: 1, health: 2, name: "Chowder" });
    const match = makeMatch([attacker], [defender]);

    const command = new AttackCommand(
      match,
      attacker.instanceId,
      defender.instanceId,
      eventBus,
      combatResolver,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(true);
    expect(result.eventsEmitted).toContain(GameEvent.CharacterDestroyed);
    // Defensor eliminado del tablero
    expect(match.player2.board.center).toHaveLength(0);
    // Atacante sigue en tablero (solo recibió 1 de daño)
    expect(match.player1.board.center).toHaveLength(1);
  });

  // ── Fallo: fase incorrecta ───────────────────────────────────────────────

  it("debería fallar con PhaseViolationError si la fase no es 'combat'", () => {
    // Arrange
    const attacker = makeCharacter();
    const defender = makeCharacter({ name: "Chowder" });
    const match = makeMatch([attacker], [defender], "main");

    const command = new AttackCommand(
      match,
      attacker.instanceId,
      defender.instanceId,
      eventBus,
      combatResolver,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(PhaseViolationError);
    // Ninguna entidad tomó daño
    expect(attacker.currentHealth).toBe(3);
    expect(defender.currentHealth).toBe(3);
  });

  // ── Fallo: atacante exhausto ─────────────────────────────────────────────

  it("debería fallar con InvalidTargetError si el atacante está exhausto", () => {
    // Arrange
    const attacker = makeCharacter();
    attacker.isExhausted = true;
    const defender = makeCharacter({ name: "Chowder" });
    const match = makeMatch([attacker], [defender]);

    const command = new AttackCommand(
      match,
      attacker.instanceId,
      defender.instanceId,
      eventBus,
      combatResolver,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(InvalidTargetError);
  });

  // ── Fallo: ignorar Provocación (Taunt) ───────────────────────────────────

  it("debería fallar con InvalidTargetError si se ignora un Personaje con Taunt", () => {
    // Arrange
    const attacker = makeCharacter();
    const defenderWithTaunt = makeCharacter({
      name: "Patricio",
      abilities: [Ability.Taunt],
    });
    const defenderWithoutTaunt = makeCharacter({ name: "Chowder" });
    const match = makeMatch([attacker], [defenderWithTaunt, defenderWithoutTaunt]);

    // Intentamos atacar al Personaje SIN Taunt cuando hay uno CON Taunt
    const command = new AttackCommand(
      match,
      attacker.instanceId,
      defenderWithoutTaunt.instanceId,
      eventBus,
      combatResolver,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(InvalidTargetError);
    expect((result.error as InvalidTargetError).message).toContain("Provocación");
  });

  it("debería permitir atacar al Personaje con Taunt cuando existe uno en el tablero", () => {
    // Arrange
    const attacker = makeCharacter({ attack: 5, health: 5 });
    const defenderWithTaunt = makeCharacter({
      name: "Patricio",
      attack: 1,
      health: 2,
      abilities: [Ability.Taunt],
    });
    const match = makeMatch([attacker], [defenderWithTaunt]);

    const command = new AttackCommand(
      match,
      attacker.instanceId,
      defenderWithTaunt.instanceId,
      eventBus,
      combatResolver,
    );

    // Act
    const result = command.execute();

    // Assert
    expect(result.success).toBe(true);
    expect(result.eventsEmitted).toContain(GameEvent.AttackResolved);
  });
});
