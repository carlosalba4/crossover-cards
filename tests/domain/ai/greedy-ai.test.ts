/**
 * Tests unitarios de GreedyAI — Crossover Cards
 *
 * Verifica el comportamiento determinístico de la estrategia codiciosa:
 *   - Fase Principal: orden de juego por coste, simulación de Nostalgia.
 *   - Fase de Combate: ataques al héroe / al Personaje con Taunt.
 *   - Crossover: siempre false.
 *
 * Los GameStateSnapshot se construyen a mano con objetos literales
 * (NO se usa createSnapshot ni Match real) para mantener los tests
 * aislados de cualquier dependencia de infraestructura.
 *
 * Estructura: AAA (Arrange → Act → Assert) en cada test.
 */

import { describe, it, expect } from "vitest";
import { GreedyAI } from "@domain/ai/greedy-ai";
import type { GameStateSnapshot } from "@domain/ai/game-state-snapshot";
import type { Character } from "@domain/entities/character";
import type { Card } from "@domain/entities/card";
import { Ability } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Helpers de construcción de mocks
// ---------------------------------------------------------------------------

/**
 * Crea un mock mínimo de Card con los campos que GreedyAI utiliza.
 * Solo necesita `instanceId` y `nostalgyCost`.
 */
function makeCard(instanceId: string, nostalgyCost: number): Card {
  return { instanceId, nostalgyCost } as unknown as Card;
}

/**
 * Crea un mock mínimo de Character con los campos que GreedyAI utiliza:
 * instanceId, abilities, currentHealth, hasAttackedThisTurn y getEffectiveAttack().
 */
function makeCharacter(
  overrides: {
    instanceId?: string;
    abilities?: ReadonlyArray<Ability>;
    attack?: number;
    currentHealth?: number;
    hasAttackedThisTurn?: boolean;
    getEffectiveAttack?: () => number;
  } = {},
): Character {
  return {
    instanceId: "char-default",
    abilities: [] as ReadonlyArray<Ability>,
    attack: 2,
    currentHealth: 3,
    hasAttackedThisTurn: false,
    getEffectiveAttack: () => 2,
    ...overrides,
  } as unknown as Character;
}

/**
 * Snapshot neutro por defecto. Todos los campos están en estado inactivo:
 * mano vacía, tableros vacíos, Nostalgia = 0.
 */
const NEUTRAL_SNAPSHOT: GameStateSnapshot = {
  aiPlayerId: "ai",
  opponentPlayerId: "opponent",
  aiHeroHealth: 30,
  aiHeroMaxHealth: 30,
  opponentHeroHealth: 30,
  opponentHeroMaxHealth: 30,
  opponentHeroStaticId: "HERO-OPP",
  aiHeroPower: {
    name: "Poder de prueba",
    nostalgyCost: 2,
    effectType: "Damage",
    targetType: "Any",
    value: 2,
  },
  aiHand: [],
  aiBoard: [[], [], []],
  opponentBoard: [[], [], []],
  nostalgiaCurrent: 0,
  nostalgiaMax: 0,
  momentumActive: false,
  momentumCharges: 0,
  crossoverAvailable: false,
  currentPhase: "main",
};

/**
 * Construye un snapshot aplicando overrides sobre los valores neutros.
 * Reduce la repetición de campos no relevantes para cada test.
 */
function buildSnapshot(overrides: Partial<GameStateSnapshot> = {}): GameStateSnapshot {
  return { ...NEUTRAL_SNAPSHOT, ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GreedyAI", () => {
  // =========================================================================
  // decideMainPhaseActions
  // =========================================================================

  describe("decideMainPhaseActions", () => {
    it("mano vacía → retorna exactamente [END_MAIN_PHASE]", () => {
      // Arrange
      const ai = new GreedyAI();
      const snapshot = buildSnapshot({ aiHand: [], nostalgiaCurrent: 5 });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert
      expect(result).toEqual([{ type: "END_MAIN_PHASE" }]);
    });

    it("una carta con coste 2 y nostalgiaCurrent=2 → [PLAY_CARD, END_MAIN_PHASE]", () => {
      // Arrange
      const ai = new GreedyAI();
      const card = makeCard("card-1", 2);
      const snapshot = buildSnapshot({
        aiHand: [card],
        nostalgiaCurrent: 2,
      });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert
      expect(result).toEqual([
        { type: "PLAY_CARD", cardInstanceId: "card-1", zoneId: "center" },
        { type: "END_MAIN_PHASE" },
      ]);
    });

    it("dos cartas (coste 3 y coste 1), nostalgiaCurrent=3 → juega solo la de coste 3", () => {
      // Arrange: 3 de Nostalgia no alcanza para ambas (3-3=0 < 1)
      const ai = new GreedyAI();
      const card3 = makeCard("card-3", 3);
      const card1 = makeCard("card-1", 1);
      const snapshot = buildSnapshot({
        aiHand: [card1, card3], // orden inverso deliberado para verificar el sort
        nostalgiaCurrent: 3,
      });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert: juega la de coste 3 primero (greedy); la de coste 1 no cabe
      expect(result).toEqual([
        { type: "PLAY_CARD", cardInstanceId: "card-3", zoneId: "center" },
        { type: "END_MAIN_PHASE" },
      ]);
    });

    it("dos cartas (coste 3 y coste 1), nostalgiaCurrent=4 → juega ambas en orden descendente", () => {
      // Arrange: 4 de Nostalgia permite jugar coste 3 (resto=1) y luego coste 1 (resto=0)
      const ai = new GreedyAI();
      const card3 = makeCard("card-3", 3);
      const card1 = makeCard("card-1", 1);
      const snapshot = buildSnapshot({
        aiHand: [card1, card3], // orden inverso deliberado
        nostalgiaCurrent: 4,
      });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert: coste 3 primero, luego coste 1
      expect(result).toEqual([
        { type: "PLAY_CARD", cardInstanceId: "card-3", zoneId: "center" },
        { type: "PLAY_CARD", cardInstanceId: "card-1", zoneId: "center" },
        { type: "END_MAIN_PHASE" },
      ]);
    });

    it("nostalgia insuficiente para todas las cartas → [END_MAIN_PHASE]", () => {
      // Arrange: carta cuesta 5, solo hay 4 de Nostalgia
      const ai = new GreedyAI();
      const card = makeCard("card-5", 5);
      const snapshot = buildSnapshot({
        aiHand: [card],
        nostalgiaCurrent: 4,
      });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert
      expect(result).toEqual([{ type: "END_MAIN_PHASE" }]);
    });

    it("varias cartas del mismo coste → todas jugables si hay Nostalgia suficiente", () => {
      // Arrange: 3 cartas de coste 2, Nostalgia = 6
      const ai = new GreedyAI();
      const cardA = makeCard("card-a", 2);
      const cardB = makeCard("card-b", 2);
      const cardC = makeCard("card-c", 2);
      const snapshot = buildSnapshot({
        aiHand: [cardA, cardB, cardC],
        nostalgiaCurrent: 6,
      });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert: las 3 cartas se juegan y termina con END_MAIN_PHASE
      expect(result).toHaveLength(4);
      expect(result[0].type).toBe("PLAY_CARD");
      expect(result[1].type).toBe("PLAY_CARD");
      expect(result[2].type).toBe("PLAY_CARD");
      expect(result[3]).toEqual({ type: "END_MAIN_PHASE" });
    });

    it("el snapshot no es mutado tras la llamada", () => {
      // Arrange
      const ai = new GreedyAI();
      const card = makeCard("card-2", 2);
      const snapshot = buildSnapshot({
        aiHand: [card],
        nostalgiaCurrent: 3,
      });
      const originalHandLength = snapshot.aiHand.length;
      const originalNostalgia = snapshot.nostalgiaCurrent;

      // Act
      ai.decideMainPhaseActions(snapshot);

      // Assert: el snapshot no ha sido modificado
      expect(snapshot.aiHand.length).toBe(originalHandLength);
      expect(snapshot.nostalgiaCurrent).toBe(originalNostalgia);
    });
  });

  // =========================================================================
  // decideCombatActions
  // =========================================================================

  describe("decideCombatActions", () => {
    it("tablero IA vacío → [END_COMBAT]", () => {
      // Arrange
      const ai = new GreedyAI();
      const snapshot = buildSnapshot({
        aiBoard: [[], [], []],
        opponentBoard: [[], [], []],
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert
      expect(result).toEqual([{ type: "END_COMBAT" }]);
    });

    it("un atacante, tablero enemigo vacío → ATTACK al héroe, END_COMBAT", () => {
      // Arrange
      const ai = new GreedyAI();
      const attacker = makeCharacter({ instanceId: "attacker-1" });
      const snapshot = buildSnapshot({
        aiBoard: [[attacker], [], []],
        opponentBoard: [[], [], []],
        opponentPlayerId: "opponent",
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert
      expect(result).toEqual([
        { type: "ATTACK", attackerId: "attacker-1", defenderId: "opponent" },
        { type: "END_COMBAT" },
      ]);
    });

    it("un atacante, un enemigo con Taunt → ataca al Taunt (no al héroe)", () => {
      // Arrange
      const ai = new GreedyAI();
      const attacker = makeCharacter({ instanceId: "attacker-1" });
      const tauntEnemy = makeCharacter({
        instanceId: "taunt-enemy",
        abilities: [Ability.Taunt],
        currentHealth: 4,
      });
      const snapshot = buildSnapshot({
        aiBoard: [[attacker], [], []],
        opponentBoard: [[tauntEnemy], [], []],
        opponentPlayerId: "opponent",
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert: ataca al Taunt, NO al héroe
      expect(result).toEqual([
        { type: "ATTACK", attackerId: "attacker-1", defenderId: "taunt-enemy" },
        { type: "END_COMBAT" },
      ]);
    });

    it("varios atacantes, ningún Taunt enemigo → todos atacan al héroe directamente", () => {
      // Arrange
      const ai = new GreedyAI();
      const attacker1 = makeCharacter({ instanceId: "a1" });
      const attacker2 = makeCharacter({ instanceId: "a2" });
      const snapshot = buildSnapshot({
        aiBoard: [[attacker1, attacker2], [], []],
        opponentBoard: [[], [], []],
        opponentPlayerId: "opponent",
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert: a1 y a2 atacan al héroe, luego END_COMBAT
      expect(result).toEqual([
        { type: "ATTACK", attackerId: "a1", defenderId: "opponent" },
        { type: "ATTACK", attackerId: "a2", defenderId: "opponent" },
        { type: "END_COMBAT" },
      ]);
    });

    it("atacante con hasAttackedThisTurn=true → se omite, no genera ATTACK", () => {
      // Arrange
      const ai = new GreedyAI();
      const exhausted = makeCharacter({
        instanceId: "exhausted",
        hasAttackedThisTurn: true,
      });
      const snapshot = buildSnapshot({
        aiBoard: [[exhausted], [], []],
        opponentBoard: [[], [], []],
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert: sin atacantes disponibles → solo END_COMBAT
      expect(result).toEqual([{ type: "END_COMBAT" }]);
    });

    it("dos Taunt con distinta vida → ataca al de menor currentHealth primero", () => {
      // Arrange
      const ai = new GreedyAI();
      const attacker1 = makeCharacter({ instanceId: "a1" });
      const attacker2 = makeCharacter({ instanceId: "a2" });
      const tauntLowHealth = makeCharacter({
        instanceId: "taunt-low",
        abilities: [Ability.Taunt],
        currentHealth: 2,
        getEffectiveAttack: () => 2,
      });
      const tauntHighHealth = makeCharacter({
        instanceId: "taunt-high",
        abilities: [Ability.Taunt],
        currentHealth: 5,
        getEffectiveAttack: () => 2,
      });
      const snapshot = buildSnapshot({
        aiBoard: [[attacker1, attacker2], [], []],
        opponentBoard: [[tauntHighHealth, tauntLowHealth], [], []],
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert: ambos atacantes apuntan al Taunt de menor vida
      expect(result[0]).toEqual({
        type: "ATTACK",
        attackerId: "a1",
        defenderId: "taunt-low",
      });
      expect(result[1]).toEqual({
        type: "ATTACK",
        attackerId: "a2",
        defenderId: "taunt-low",
      });
      expect(result[2]).toEqual({ type: "END_COMBAT" });
    });

    it("mezcla de atacantes disponibles y exhaustos → solo los disponibles atacan", () => {
      // Arrange
      const ai = new GreedyAI();
      const available = makeCharacter({ instanceId: "avail", hasAttackedThisTurn: false });
      const exhausted = makeCharacter({ instanceId: "exhaust", hasAttackedThisTurn: true });
      const snapshot = buildSnapshot({
        aiBoard: [[available, exhausted], [], []],
        opponentBoard: [[], [], []],
        opponentPlayerId: "opponent",
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert: solo "avail" ataca
      expect(result).toEqual([
        { type: "ATTACK", attackerId: "avail", defenderId: "opponent" },
        { type: "END_COMBAT" },
      ]);
    });
  });

  // =========================================================================
  // shouldUseCrossover
  // =========================================================================

  describe("shouldUseCrossover", () => {
    it("retorna false con snapshot neutro (Crossover no disponible)", () => {
      // Arrange
      const ai = new GreedyAI();
      const snapshot = buildSnapshot();

      // Act & Assert
      expect(ai.shouldUseCrossover(snapshot)).toBe(false);
    });

    it("retorna false si está disponible pero la vida es > 50 %", () => {
      // Arrange: vida plena (30/30 = 100 %).
      const ai = new GreedyAI();
      const snapshot = buildSnapshot({ crossoverAvailable: true, aiHeroHealth: 30 });

      // Act & Assert
      expect(ai.shouldUseCrossover(snapshot)).toBe(false);
    });

    it("retorna true si está disponible y la vida es <= 50 %", () => {
      // Arrange: 15/30 = 50 %.
      const ai = new GreedyAI();
      const snapshot = buildSnapshot({ crossoverAvailable: true, aiHeroHealth: 15 });

      // Act & Assert
      expect(ai.shouldUseCrossover(snapshot)).toBe(true);
    });

    it("retorna false si la vida es baja pero el Crossover ya no está disponible", () => {
      // Arrange
      const ai = new GreedyAI();
      const snapshot = buildSnapshot({ crossoverAvailable: false, aiHeroHealth: 5 });

      // Act & Assert
      expect(ai.shouldUseCrossover(snapshot)).toBe(false);
    });
  });

  // =========================================================================
  // shouldUseHeroPower
  // =========================================================================

  describe("shouldUseHeroPower", () => {
    it("retorna null si no hay Nostalgia para el coste", () => {
      // Arrange: coste 2, Nostalgia 1.
      const ai = new GreedyAI();
      const snapshot = buildSnapshot({ nostalgiaCurrent: 1 });

      // Act & Assert
      expect(ai.shouldUseHeroPower(snapshot)).toBeNull();
    });

    it("poder de daño → apunta al staticId del héroe rival", () => {
      // Arrange
      const ai = new GreedyAI();
      const snapshot = buildSnapshot({ nostalgiaCurrent: 2 });

      // Act & Assert
      expect(ai.shouldUseHeroPower(snapshot)).toBe("HERO-OPP");
    });

    it("poder de buff → apunta al aliado con mayor ATQ base", () => {
      // Arrange
      const ai = new GreedyAI();
      const weak = makeCharacter({ instanceId: "weak", attack: 2 });
      const strong = makeCharacter({ instanceId: "strong", attack: 5 });
      const snapshot = buildSnapshot({
        nostalgiaCurrent: 2,
        aiHeroPower: {
          name: "Tornado de Fuego",
          nostalgyCost: 2,
          effectType: "BuffAttack",
          targetType: "AllyCharacter",
          value: 2,
        },
        aiBoard: [[weak, strong], [], []],
      });

      // Act & Assert
      expect(ai.shouldUseHeroPower(snapshot)).toBe("strong");
    });

    it("poder de buff sin aliados en tablero → null", () => {
      // Arrange
      const ai = new GreedyAI();
      const snapshot = buildSnapshot({
        nostalgiaCurrent: 2,
        aiHeroPower: {
          name: "Tornado de Fuego",
          nostalgyCost: 2,
          effectType: "BuffAttack",
          targetType: "AllyCharacter",
          value: 2,
        },
        aiBoard: [[], [], []],
      });

      // Act & Assert
      expect(ai.shouldUseHeroPower(snapshot)).toBeNull();
    });
  });
});
