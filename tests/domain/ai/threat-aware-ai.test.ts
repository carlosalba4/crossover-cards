/**
 * Tests unitarios de ThreatAwareAI — Crossover Cards
 *
 * Verifica el algoritmo en 4 pasos de la Fase Principal y la selección
 * de objetivos basada en amenazas críticas en la Fase de Combate.
 *
 * REGLA CRÍTICA: ningún test usa Math.random() directamente.
 * ThreatAwareAI se instancia siempre con una función rng determinista:
 *   () => 0    → elige siempre el primer elemento en desempates
 *   () => 0.99 → elige siempre el último elemento en desempates
 *
 * Los GameStateSnapshot se construyen con objetos literales (sin Match real).
 * Los mocks de Character usan `as unknown as Character` con los campos mínimos.
 *
 * Estructura: AAA (Arrange → Act → Assert) en cada test.
 */

import { describe, it, expect } from "vitest";
import { ThreatAwareAI } from "@domain/ai/threat-aware-ai";
import type { GameStateSnapshot } from "@domain/ai/game-state-snapshot";
import type { Character } from "@domain/entities/character";
import type { Card } from "@domain/entities/card";
import { Ability, Archetype, CardType } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Helpers de construcción de mocks
// ---------------------------------------------------------------------------

/**
 * Crea un mock mínimo de Card con los campos que ThreatAwareAI utiliza:
 * instanceId, nostalgyCost, type, archetype.
 */
function makeCard(
  instanceId: string,
  nostalgyCost: number,
  type: CardType = CardType.Character,
  archetype: Archetype = Archetype.Neutral,
): Card {
  return { instanceId, nostalgyCost, type, archetype } as unknown as Card;
}

/**
 * Crea un mock mínimo de Character con los campos que ThreatAwareAI utiliza:
 * instanceId, abilities, currentHealth, hasAttackedThisTurn, getEffectiveAttack().
 */
function makeCharacter(
  overrides: {
    instanceId?: string;
    abilities?: ReadonlyArray<Ability>;
    currentHealth?: number;
    hasAttackedThisTurn?: boolean;
    getEffectiveAttack?: () => number;
  } = {},
): Character {
  return {
    instanceId: "char-default",
    abilities: [] as ReadonlyArray<Ability>,
    currentHealth: 3,
    hasAttackedThisTurn: false,
    getEffectiveAttack: () => 2,
    ...overrides,
  } as unknown as Character;
}

/** Snapshot neutro por defecto: mano vacía, tableros vacíos, vida plena. */
const NEUTRAL_SNAPSHOT: GameStateSnapshot = {
  aiPlayerId: "ai",
  opponentPlayerId: "opponent",
  aiHeroHealth: 30,
  aiHeroMaxHealth: 30,
  opponentHeroHealth: 30,
  opponentHeroMaxHealth: 30,
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

/** Construye un snapshot aplicando overrides sobre los valores neutros. */
function buildSnapshot(overrides: Partial<GameStateSnapshot> = {}): GameStateSnapshot {
  return { ...NEUTRAL_SNAPSHOT, ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ThreatAwareAI", () => {
  // =========================================================================
  // shouldUseCrossover
  // =========================================================================

  describe("shouldUseCrossover", () => {
    it("vida=29% (8/30 ~ 26%), mano.length=3, crossoverAvailable=true → true", () => {
      // Arrange: vida 8.7/30 ≈ 29%, por debajo del umbral 30%
      const ai = new ThreatAwareAI(() => 0);
      const snapshot = buildSnapshot({
        aiHeroHealth: 8, // 8/30 ≈ 26.7% < 30%
        aiHeroMaxHealth: 30,
        aiHand: [makeCard("c1", 1), makeCard("c2", 1), makeCard("c3", 1)], // length=3
        crossoverAvailable: true,
      });

      // Act
      const result = ai.shouldUseCrossover(snapshot);

      // Assert
      expect(result).toBe(true);
    });

    it("vida=31% (10/30), mano.length=3, crossoverAvailable=true → false", () => {
      // Arrange: vida justo por encima del umbral 30%
      const ai = new ThreatAwareAI(() => 0);
      const snapshot = buildSnapshot({
        aiHeroHealth: 10, // 10/30 ≈ 33.3% > 30%
        aiHeroMaxHealth: 30,
        aiHand: [makeCard("c1", 1), makeCard("c2", 1), makeCard("c3", 1)],
        crossoverAvailable: true,
      });

      // Act
      const result = ai.shouldUseCrossover(snapshot);

      // Assert: supera el umbral → no activa Crossover
      expect(result).toBe(false);
    });

    it("vida=26%, mano.length=4, crossoverAvailable=true → false", () => {
      // Arrange: vida baja pero demasiadas cartas en mano (> 3)
      const ai = new ThreatAwareAI(() => 0);
      const snapshot = buildSnapshot({
        aiHeroHealth: 8,
        aiHeroMaxHealth: 30,
        aiHand: [makeCard("c1", 1), makeCard("c2", 1), makeCard("c3", 1), makeCard("c4", 1)], // length=4
        crossoverAvailable: true,
      });

      // Act
      const result = ai.shouldUseCrossover(snapshot);

      // Assert: mano demasiado grande → no activa Crossover
      expect(result).toBe(false);
    });

    it("vida=26%, mano.length=3, crossoverAvailable=false → false", () => {
      // Arrange: condiciones de vida y mano correctas pero Crossover no disponible
      const ai = new ThreatAwareAI(() => 0);
      const snapshot = buildSnapshot({
        aiHeroHealth: 8,
        aiHeroMaxHealth: 30,
        aiHand: [makeCard("c1", 1), makeCard("c2", 1), makeCard("c3", 1)],
        crossoverAvailable: false,
      });

      // Act
      const result = ai.shouldUseCrossover(snapshot);

      // Assert
      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // shouldUseHeroPower
  // =========================================================================

  describe("shouldUseHeroPower", () => {
    it("siempre retorna null (snapshot no incluye datos del heroPower)", () => {
      // Arrange
      const ai = new ThreatAwareAI(() => 0);
      const snapshot = buildSnapshot({ nostalgiaCurrent: 10 });

      // Act
      const result = ai.shouldUseHeroPower(snapshot);

      // Assert
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // decideMainPhaseActions
  // =========================================================================

  describe("decideMainPhaseActions", () => {
    it("mano vacía → [END_MAIN_PHASE]", () => {
      // Arrange
      const ai = new ThreatAwareAI(() => 0);
      const snapshot = buildSnapshot({ aiHand: [], nostalgiaCurrent: 5 });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert
      expect(result).toEqual([{ type: "END_MAIN_PHASE" }]);
    });

    it("vida > 40%, sin cartas del mismo arquetipo → resolución estándar (mayor a menor coste)", () => {
      // Arrange: vida plena (100%), 2 cartas de distintos arquetipos
      const ai = new ThreatAwareAI(() => 0);
      const card3 = makeCard("card-3", 3, CardType.Character, Archetype.CartoonClasico);
      const card1 = makeCard("card-1", 1, CardType.Character, Archetype.AnimeCombate);
      const snapshot = buildSnapshot({
        aiHeroHealth: 30,
        aiHeroMaxHealth: 30,
        aiHand: [card1, card3], // orden inverso deliberado
        nostalgiaCurrent: 5,
      });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert: coste 3 se juega antes que coste 1 (resolución estándar greedy)
      const playCardActions = result.filter((a) => a.type === "PLAY_CARD");
      expect(playCardActions[0]).toMatchObject({ cardInstanceId: "card-3" });
      expect(playCardActions[1]).toMatchObject({ cardInstanceId: "card-1" });
      expect(result[result.length - 1]).toEqual({ type: "END_MAIN_PHASE" });
    });

    it("vida <= 40%, hay un Spell jugable en mano → el Spell aparece primero en el plan", () => {
      // Arrange: vida al 33% (10/30) → modo defensivo
      const ai = new ThreatAwareAI(() => 0);
      const spell = makeCard("spell-1", 2, CardType.Spell, Archetype.Neutral);
      const char = makeCard("char-1", 2, CardType.Character, Archetype.AnimeCombate);
      const snapshot = buildSnapshot({
        aiHeroHealth: 10, // 10/30 ≈ 33% <= 40%
        aiHeroMaxHealth: 30,
        aiHand: [char, spell], // el Character viene primero en la lista
        nostalgiaCurrent: 5,
      });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert: el Spell se prioriza antes que el Character
      const firstPlayCard = result.find((a) => a.type === "PLAY_CARD");
      expect(firstPlayCard).toMatchObject({ cardInstanceId: "spell-1" });
    });

    it("dos cartas del mismo arquetipo jugables → aparecen antes que carta de otro arquetipo", () => {
      // Arrange: 2 cartas del mismo arquetipo (tribal group >= 2) + 1 carta diferente
      const ai = new ThreatAwareAI(() => 0);
      // Mismo arquetipo = CartoonClasico
      const tribal1 = makeCard("tribal-1", 2, CardType.Character, Archetype.CartoonClasico);
      const tribal2 = makeCard("tribal-2", 2, CardType.Character, Archetype.CartoonClasico);
      // Arquetipo diferente
      const other = makeCard("other-1", 3, CardType.Character, Archetype.AnimeCombate);
      const snapshot = buildSnapshot({
        aiHeroHealth: 30, // vida alta → no modo defensivo
        aiHeroMaxHealth: 30,
        aiHand: [other, tribal1, tribal2], // orden deliberado: other primero
        nostalgiaCurrent: 10,
      });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert: las dos cartas tribales aparecen antes que 'other'
      const playCardActions = result
        .filter((a) => a.type === "PLAY_CARD")
        .map((a) => (a as { type: "PLAY_CARD"; cardInstanceId: string }).cardInstanceId);

      const indexTribal1 = playCardActions.indexOf("tribal-1");
      const indexTribal2 = playCardActions.indexOf("tribal-2");
      const indexOther = playCardActions.indexOf("other-1");

      expect(indexTribal1).toBeGreaterThanOrEqual(0);
      expect(indexTribal2).toBeGreaterThanOrEqual(0);
      // Las tribales deben aparecer antes que 'other'
      expect(Math.max(indexTribal1, indexTribal2)).toBeLessThan(indexOther);
    });

    it("momentumActive=true, momentumCharges=3 → USE_HERO_POWER aparece en el plan", () => {
      // Arrange
      const ai = new ThreatAwareAI(() => 0);
      const snapshot = buildSnapshot({
        momentumActive: true,
        momentumCharges: 3,
        nostalgiaCurrent: 5,
      });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert
      const hasHeroPower = result.some((a) => a.type === "USE_HERO_POWER");
      expect(hasHeroPower).toBe(true);
    });

    it("momentumActive=true, momentumCharges=2 → NO aparece USE_HERO_POWER en el plan", () => {
      // Arrange: cargas insuficientes (mínimo requerido = 3)
      const ai = new ThreatAwareAI(() => 0);
      const snapshot = buildSnapshot({
        momentumActive: true,
        momentumCharges: 2,
        nostalgiaCurrent: 5,
      });

      // Act
      const result = ai.decideMainPhaseActions(snapshot);

      // Assert
      const hasHeroPower = result.some((a) => a.type === "USE_HERO_POWER");
      expect(hasHeroPower).toBe(false);
    });
  });

  // =========================================================================
  // decideCombatActions
  // =========================================================================

  describe("decideCombatActions", () => {
    it("tablero IA vacío → [END_COMBAT]", () => {
      // Arrange
      const ai = new ThreatAwareAI(() => 0);
      const snapshot = buildSnapshot({
        aiBoard: [[], [], []],
        opponentBoard: [[], [], []],
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert
      expect(result).toEqual([{ type: "END_COMBAT" }]);
    });

    it("un atacante, Amenaza Crítica en tablero enemigo (score >= 5): ataca la Amenaza, no el héroe", () => {
      // Arrange: Personaje con Poisonous (score = ATQ + vida*0.5 + 3)
      // Con ATQ=2 y vida=2 → score = 2 + 1 + 3 = 6 (>= 5, es Amenaza Crítica)
      const ai = new ThreatAwareAI(() => 0);
      const attacker = makeCharacter({ instanceId: "attacker", getEffectiveAttack: () => 3 });
      const criticalEnemy = makeCharacter({
        instanceId: "critical-enemy",
        abilities: [Ability.Poisonous], // +3 al score
        currentHealth: 4,
        getEffectiveAttack: () => 2,
        // score = 2 + (4*0.5) + 3 = 2 + 2 + 3 = 7 >= 5
      });
      const snapshot = buildSnapshot({
        aiBoard: [[attacker], [], []],
        opponentBoard: [[criticalEnemy], [], []],
        opponentPlayerId: "opponent",
        opponentHeroHealth: 30,
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert: ataca a la Amenaza Crítica, NO al héroe
      expect(result[0]).toEqual({
        type: "ATTACK",
        attackerId: "attacker",
        defenderId: "critical-enemy",
      });
      expect(result[result.length - 1]).toEqual({ type: "END_COMBAT" });
    });

    it("un atacante, tablero enemigo con Personaje sin Amenaza Crítica y daño total NO letal → value trade", () => {
      // Arrange: enemigo con score < 5 (sin habilidades especiales, vida=2, ATQ=1)
      // Atacante con ATQ=3 >= vida enemigo 2, ATQ enemigo 1 < vida atacante 5 → value trade
      const ai = new ThreatAwareAI(() => 0);
      const attacker = makeCharacter({
        instanceId: "attacker",
        getEffectiveAttack: () => 3,
        currentHealth: 5,
      });
      const weakEnemy = makeCharacter({
        instanceId: "weak-enemy",
        abilities: [],
        currentHealth: 2,
        getEffectiveAttack: () => 1,
        // score = 1 + (2*0.5) + 0 = 2 < 5 → no es Amenaza Crítica
      });
      const snapshot = buildSnapshot({
        aiBoard: [[attacker], [], []],
        opponentBoard: [[weakEnemy], [], []],
        opponentPlayerId: "opponent",
        opponentHeroHealth: 30, // daño total (3) < vida héroe (30) → no letal
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert: ataca al Personaje rival (value trade), no al héroe
      expect(result[0]).toEqual({
        type: "ATTACK",
        attackerId: "attacker",
        defenderId: "weak-enemy",
      });
    });

    it("un atacante, tablero enemigo vacío → ataca al héroe directamente", () => {
      // Arrange: no hay Personajes rivales en tablero
      const ai = new ThreatAwareAI(() => 0);
      const attacker = makeCharacter({ instanceId: "attacker", getEffectiveAttack: () => 3 });
      const snapshot = buildSnapshot({
        aiBoard: [[attacker], [], []],
        opponentBoard: [[], [], []],
        opponentPlayerId: "opponent",
        opponentHeroHealth: 30,
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert
      expect(result[0]).toEqual({
        type: "ATTACK",
        attackerId: "attacker",
        defenderId: "opponent",
      });
      expect(result[result.length - 1]).toEqual({ type: "END_COMBAT" });
    });

    it("atacante con hasAttackedThisTurn=true → no genera ATTACK", () => {
      // Arrange
      const ai = new ThreatAwareAI(() => 0);
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

    it("daño total letal al héroe → ataca al héroe (canLethal=true)", () => {
      // Arrange: ATQ=25, vida héroe=20 → totalDamage (25) >= opponentHeroHealth (20) → letal
      const ai = new ThreatAwareAI(() => 0);
      const lethalAttacker = makeCharacter({
        instanceId: "lethal-attacker",
        getEffectiveAttack: () => 25,
        currentHealth: 10,
      });
      const snapshot = buildSnapshot({
        aiBoard: [[lethalAttacker], [], []],
        opponentBoard: [[], [], []],
        opponentPlayerId: "opponent",
        opponentHeroHealth: 20,
      });

      // Act
      const result = ai.decideCombatActions(snapshot);

      // Assert: noEnemyCharacters → ataca al héroe
      expect(result[0]).toEqual({
        type: "ATTACK",
        attackerId: "lethal-attacker",
        defenderId: "opponent",
      });
    });
  });
});
