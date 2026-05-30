import { describe, it, expect } from "vitest";
import { Match, type PlayerState } from "@domain/entities/match";
import { createSnapshot } from "@domain/ai/game-state-snapshot";
import { Hand } from "@domain/entities/hand";
import { Hero } from "@domain/entities/hero";
import { Archetype, CardType } from "@domain/types/card-types";
import type { Card } from "@domain/entities/card";
import type { Character } from "@domain/entities/character";
import type { Deck } from "@domain/entities/deck";

describe("GameStateSnapshot", () => {
  // Helper para crear un Match mínimo real
  function buildTestMatch(): Match {
    const p1Hero = new Hero({
      staticId: "hero-1",
      name: "Hero 1",
      archetype: Archetype.Neutral,
      maxHealth: 30,
      heroPower: {
        name: "Power 1",
        nostalgyCost: 2,
        effectType: "Damage",
        targetType: "Any",
        value: 2,
      },
    });
    p1Hero.currentHealth = 25; // Simular daño

    const p2Hero = new Hero({
      staticId: "hero-2",
      name: "Hero 2",
      archetype: Archetype.Neutral,
      maxHealth: 40,
      heroPower: {
        name: "Power 2",
        nostalgyCost: 1,
        effectType: "Heal",
        targetType: "Self",
        value: 2,
      },
    });
    p2Hero.currentHealth = 40;

    const p1Hand = new Hand();
    const card1 = { instanceId: "c1", type: CardType.Character } as unknown as Card;
    const card2 = { instanceId: "c2", type: CardType.Spell } as unknown as Card;
    p1Hand.add(card1);
    p1Hand.add(card2);

    const p2Hand = new Hand();
    const card3 = { instanceId: "c3", type: CardType.Item } as unknown as Card;
    p2Hand.add(card3);

    const char1 = { instanceId: "char-1" } as unknown as Character;

    const p1State: PlayerState = {
      playerId: "p1",
      hand: p1Hand,
      board: { left: [], center: [char1], right: [] },
      hero: p1Hero,
      deck: {} as unknown as Deck,
    };

    const p2State: PlayerState = {
      playerId: "p2",
      hand: p2Hand,
      board: { left: [], center: [], right: [] },
      hero: p2Hero,
      deck: {} as unknown as Deck,
    };

    const match = new Match(p1State, p2State);
    match.currentPhase = "main";
    return match;
  }

  it("aiPlayerId === match.player1.playerId: asigna roles y datos correctamente", () => {
    // Arrange
    const match = buildTestMatch();
    const aiPlayerId = "p1";

    // Act
    const snapshot = createSnapshot(match, aiPlayerId);

    // Assert
    // a) aiPlayerId y opponentPlayerId se asignan correctamente
    expect(snapshot.aiPlayerId).toBe("p1");
    expect(snapshot.opponentPlayerId).toBe("p2");

    // c) aiHeroHealth y aiHeroMaxHealth reflejan los valores del héroe de la IA
    expect(snapshot.aiHeroHealth).toBe(25);
    expect(snapshot.aiHeroMaxHealth).toBe(30);

    // d) opponentHeroHealth refleja los del héroe contrario
    expect(snapshot.opponentHeroHealth).toBe(40);
    expect(snapshot.opponentHeroMaxHealth).toBe(40);

    // e) aiHand contiene las cartas de la mano de la IA (longitud correcta)
    expect(snapshot.aiHand.length).toBe(2);
    expect(snapshot.aiHand[0].instanceId).toBe("c1");
    expect(snapshot.aiHand[1].instanceId).toBe("c2");

    // f) aiBoard tiene 3 zonas (índices 0, 1, 2)
    expect(snapshot.aiBoard.length).toBe(3);
    expect(snapshot.aiBoard[1].length).toBe(1); // center
    expect(snapshot.aiBoard[1][0].instanceId).toBe("char-1");

    expect(snapshot.opponentBoard.length).toBe(3);
    expect(snapshot.opponentBoard[0].length).toBe(0);
    expect(snapshot.opponentBoard[1].length).toBe(0);
    expect(snapshot.opponentBoard[2].length).toBe(0);

    // h) currentPhase refleja match.currentPhase
    expect(snapshot.currentPhase).toBe("main");
  });

  it("aiPlayerId === match.player2.playerId: invierte roles (player2 es IA, player1 es oponente)", () => {
    // Arrange
    const match = buildTestMatch();
    const aiPlayerId = "p2";

    // Act
    const snapshot = createSnapshot(match, aiPlayerId);

    // Assert
    // b) Lo mismo cuando aiPlayerId === match.player2.playerId
    expect(snapshot.aiPlayerId).toBe("p2");
    expect(snapshot.opponentPlayerId).toBe("p1");

    expect(snapshot.aiHeroHealth).toBe(40);
    expect(snapshot.aiHeroMaxHealth).toBe(40);

    expect(snapshot.opponentHeroHealth).toBe(25);
    expect(snapshot.opponentHeroMaxHealth).toBe(30);

    expect(snapshot.aiHand.length).toBe(1);
    expect(snapshot.aiHand[0].instanceId).toBe("c3");

    expect(snapshot.aiBoard.length).toBe(3);
    expect(snapshot.aiBoard[0].length).toBe(0);
    expect(snapshot.aiBoard[1].length).toBe(0);
    expect(snapshot.aiBoard[2].length).toBe(0);

    expect(snapshot.opponentBoard.length).toBe(3);
    expect(snapshot.opponentBoard[1].length).toBe(1);
    expect(snapshot.opponentBoard[1][0].instanceId).toBe("char-1");
  });

  it("g) Mutar el array original de board después de crear el snapshot NO altera aiBoard (copia defensiva)", () => {
    // Arrange
    const match = buildTestMatch();
    const snapshot = createSnapshot(match, "p1");

    // Act
    // Mutar el board del match original
    const newChar = { instanceId: "char-2" } as unknown as Character;
    match.player1.board.left.push(newChar);

    // Assert
    // El snapshot no debe verse afectado por la mutación del match
    expect(snapshot.aiBoard[0].length).toBe(0); // left sigue vacío en el snapshot
    expect(match.player1.board.left.length).toBe(1); // mutado en el original
  });
});
