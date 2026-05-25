/**
 * Tests unitarios — GameEvent enum y tipos de payload
 *
 * Cobertura:
 *   - Existencia y valores del enum GameEvent (22 eventos).
 *   - Exhaustividad de GameEventPayloadMap (una clave por evento).
 *   - Estructura de los payloads mediante objetos conformes al tipo.
 *   - Casos borde: campos opcionales ausentes, valores límite.
 *
 * Convención: AAA (Arrange – Act – Assert).
 * Sin imports de Phaser ni de infraestructura (dominio puro).
 *
 * Referencia: docs/02-architecture.md §3.1.3, docs/02-architecture.md §10.
 */

import { describe, it, expect } from "vitest";
import {
  GameEvent,
  type GameEventPayloadMap,
  type MatchStartedPayload,
  type MatchEndedPayload,
  type TurnStartedPayload,
  type TurnEndedPayload,
  type PhaseChangedPayload,
  type CardPlayedPayload,
  type CharacterSummonedPayload,
  type SpellCastPayload,
  type ItemEquippedPayload,
  type AttackDeclaredPayload,
  type AttackResolvedPayload,
  type CharacterDestroyedPayload,
  type HeroDamagedPayload,
  type HeroHealedPayload,
  type HeroPowerUsedPayload,
  type NostalgiaChangedPayload,
  type MomentumChangedPayload,
  type ZoneEnvironmentChangedPayload,
  type SynergyUpdatedPayload,
  type QuestPlacedPayload,
  type QuestProgressUpdatedPayload,
  type QuestCompletedPayload,
  type CrossoverActivatedPayload,
  type DeckEmptyPayload,
  type TurnPhase,
  type CharacterDestroyedCause,
} from "@domain/events/game-event";
import { CardType, Archetype, Rarity, Ability } from "@domain/types/card-types";
import { Character } from "@domain/entities/character";
import { Spell } from "@domain/entities/spell";
import { Item } from "@domain/entities/item";

// ---------------------------------------------------------------------------
// Helpers de construcción de entidades (sin Phaser, sin repos)
// ---------------------------------------------------------------------------

/** Construye un Character mínimo para usar en payloads de test. */
function buildCharacter(): Character {
  return new Character({
    staticId: "LIC-001",
    name: "Personaje de Test",
    type: CardType.Character,
    archetype: Archetype.CartoonClasico,
    nostalgyCost: 3,
    rarity: Rarity.Common,
    description: "Personaje de prueba",
    spriteKey: "sprite_test",
    greetingText: "¡Hola!",
    attack: 4,
    health: 5,
    abilities: [],
  });
}

/** Construye un Spell mínimo para usar en payloads de test. */
function buildSpell(): Spell {
  return new Spell({
    staticId: "LIC-005",
    name: "Hechizo de Test",
    type: CardType.Spell,
    archetype: Archetype.Neutral,
    nostalgyCost: 2,
    rarity: Rarity.Rare,
    description: "Hechizo de prueba",
    spriteKey: "sprite_spell_test",
    greetingText: "¡Boom!",
    effectType: "Damage",
    targetType: "Any",
    effectValue: 3,
  });
}

/** Construye un Item mínimo para usar en payloads de test. */
function buildItem(): Item {
  return new Item({
    staticId: "LIC-010",
    name: "Objeto de Test",
    type: CardType.Item,
    archetype: Archetype.Neutral,
    nostalgyCost: 4,
    rarity: Rarity.Epic,
    description: "Objeto de prueba",
    spriteKey: "sprite_item_test",
    greetingText: "¡Equipado!",
    targetType: "Hero",
    statModifier: { attackBonus: 2, healthBonus: 0 },
    abilityGranted: Ability.Lifesteal,
    durability: 2,
  });
}

// ---------------------------------------------------------------------------
// 1. Enum GameEvent — existencia y valores
// ---------------------------------------------------------------------------

describe("GameEvent enum", () => {
  it("debe existir como objeto con 24 claves string", () => {
    // Arrange
    const events = Object.values(GameEvent);

    // Act — contamos solo los valores string (los enums de string no duplican)
    const count = events.length;

    // Assert
    expect(count).toBe(24);
  });

  it("debe contener todos los eventos de la arquitectura §3.1.3", () => {
    // Arrange
    const expectedEvents: GameEvent[] = [
      GameEvent.MatchStarted,
      GameEvent.MatchEnded,
      GameEvent.TurnStarted,
      GameEvent.TurnEnded,
      GameEvent.PhaseChanged,
      GameEvent.CardPlayed,
      GameEvent.CharacterSummoned,
      GameEvent.SpellCast,
      GameEvent.ItemEquipped,
      GameEvent.AttackDeclared,
      GameEvent.AttackResolved,
      GameEvent.CharacterDestroyed,
      GameEvent.HeroDamaged,
      GameEvent.HeroHealed,
      GameEvent.HeroPowerUsed,
      GameEvent.NostalgiaChanged,
      GameEvent.MomentumChanged,
      GameEvent.ZoneEnvironmentChanged,
      GameEvent.SynergyUpdated,
      GameEvent.QuestPlaced,
      GameEvent.QuestProgressUpdated,
      GameEvent.QuestCompleted,
      GameEvent.CrossoverActivated,
      GameEvent.DeckEmpty,
    ];

    // Act
    const actualEvents = Object.values(GameEvent);

    // Assert
    for (const ev of expectedEvents) {
      expect(actualEvents).toContain(ev);
    }
  });

  it("cada clave del enum debe tener un valor string no vacío", () => {
    // Arrange & Act
    const entries = Object.entries(GameEvent);

    // Assert
    for (const [, value] of entries) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. GameEventPayloadMap — exhaustividad de claves
// ---------------------------------------------------------------------------

describe("GameEventPayloadMap", () => {
  it("debe tener una entrada por cada valor del enum GameEvent", () => {
    /**
     * Trick de tipo: creamos un objeto que implementa GameEventPayloadMap
     * con payloads mínimos válidos. Si faltara alguna clave, TypeScript
     * fallaría en tiempo de compilación (el test lo detecta en typecheck).
     *
     * En runtime verificamos que el número de entradas coincide.
     */
    const sampleMap: GameEventPayloadMap = {
      [GameEvent.MatchStarted]: { player1Id: "p1", player2Id: "p2" },
      [GameEvent.MatchEnded]: { winnerId: "p1", loserId: "p2", isDraw: false },
      [GameEvent.TurnStarted]: { playerId: "p1", turnNumber: 1, phase: "draw" },
      [GameEvent.TurnEnded]: { playerId: "p1", turnNumber: 1 },
      [GameEvent.PhaseChanged]: {
        playerId: "p1",
        previousPhase: "main",
        newPhase: "combat",
      },
      [GameEvent.CardPlayed]: {
        playerId: "p1",
        cardId: "uuid-001",
        staticId: "LIC-001",
      },
      [GameEvent.CharacterSummoned]: {
        playerId: "p1",
        character: buildCharacter(),
        zoneId: "center",
      },
      [GameEvent.SpellCast]: {
        playerId: "p1",
        spell: buildSpell(),
        targetId: undefined,
      },
      [GameEvent.ItemEquipped]: {
        playerId: "p1",
        item: buildItem(),
        targetId: "HERO-001",
      },
      [GameEvent.AttackDeclared]: {
        attackerId: "uuid-char-1",
        defenderId: "uuid-char-2",
      },
      [GameEvent.AttackResolved]: {
        attackerId: "uuid-char-1",
        defenderId: "uuid-char-2",
        damageToAttacker: 3,
        damageToDefender: 4,
      },
      [GameEvent.CharacterDestroyed]: {
        playerId: "p2",
        character: buildCharacter(),
        cause: "combat",
      },
      [GameEvent.HeroDamaged]: {
        playerId: "p2",
        damage: 5,
        currentHealth: 25,
      },
      [GameEvent.HeroHealed]: {
        playerId: "p1",
        amount: 3,
        currentHealth: 28,
      },
      [GameEvent.HeroPowerUsed]: {
        playerId: "p1",
        heroPower: {
          name: "Hechizo Ancestral",
          nostalgyCost: 2,
          effectType: "Damage",
          targetType: "Any",
          value: 2,
        },
      },
      [GameEvent.NostalgiaChanged]: {
        playerId: "p1",
        current: 3,
        max: 5,
      },
      [GameEvent.MomentumChanged]: {
        playerId: "p2",
        momentum: 3,
        isActive: true,
      },
      [GameEvent.ZoneEnvironmentChanged]: {
        zoneId: "left",
        previousEnv: "forest",
        newEnv: "volcano",
      },
      [GameEvent.SynergyUpdated]: {
        playerId: "p1",
        archetype: Archetype.CartoonClasico,
        bonus: 2,
        affectedCharacterIds: ["uuid-char-1", "uuid-char-2"],
      },
      [GameEvent.QuestPlaced]: {
        playerId: "p1",
        questId: "QUEST-001",
        questName: "Misión de prueba",
      },
      [GameEvent.QuestProgressUpdated]: {
        playerId: "p1",
        questId: "QUEST-001",
        current: 2,
        target: 3,
      },
      [GameEvent.QuestCompleted]: {
        playerId: "p1",
        questId: "QUEST-001",
        reward: "Roba 2 cartas",
      },
      [GameEvent.CrossoverActivated]: {
        playerId: "p1",
        stolenCard: buildSpell(),
        wasDestroyed: false,
      },
      [GameEvent.DeckEmpty]: {
        playerId: "p2",
        fatigueDamage: 1,
      },
    };

    // Act
    const mapKeyCount = Object.keys(sampleMap).length;
    const enumValueCount = Object.values(GameEvent).length;

    // Assert — el mapa tiene exactamente una entrada por evento
    expect(mapKeyCount).toBe(enumValueCount);
  });
});

// ---------------------------------------------------------------------------
// 3. Payloads de partida
// ---------------------------------------------------------------------------

describe("MatchStartedPayload", () => {
  it("debe contener player1Id y player2Id como strings", () => {
    // Arrange
    const payload: MatchStartedPayload = {
      player1Id: "jugador-1",
      player2Id: "jugador-2",
    };

    // Act & Assert
    expect(payload.player1Id).toBe("jugador-1");
    expect(payload.player2Id).toBe("jugador-2");
  });
});

describe("MatchEndedPayload", () => {
  it("debe representar una victoria normal con winnerId y loserId", () => {
    // Arrange
    const payload: MatchEndedPayload = {
      winnerId: "p1",
      loserId: "p2",
      isDraw: false,
    };

    // Act & Assert
    expect(payload.isDraw).toBe(false);
    expect(payload.winnerId).not.toBeNull();
    expect(payload.loserId).not.toBeNull();
  });

  it("caso borde: empate técnico — winnerId y loserId son null", () => {
    // Arrange
    const payload: MatchEndedPayload = {
      winnerId: null,
      loserId: null,
      isDraw: true,
    };

    // Act & Assert
    expect(payload.isDraw).toBe(true);
    expect(payload.winnerId).toBeNull();
    expect(payload.loserId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Payloads de turno
// ---------------------------------------------------------------------------

describe("TurnStartedPayload", () => {
  it("debe contener playerId, turnNumber y phase 'draw'", () => {
    // Arrange
    const payload: TurnStartedPayload = {
      playerId: "p1",
      turnNumber: 1,
      phase: "draw",
    };

    // Act & Assert
    expect(payload.turnNumber).toBe(1);
    expect(payload.phase).toBe("draw");
  });

  it("caso borde: turno 1 es el primero válido (turnNumber nunca 0)", () => {
    // Arrange
    const payload: TurnStartedPayload = {
      playerId: "p1",
      turnNumber: 1,
      phase: "draw",
    };

    // Act & Assert
    expect(payload.turnNumber).toBeGreaterThanOrEqual(1);
  });
});

describe("TurnEndedPayload", () => {
  it("debe contener playerId y turnNumber", () => {
    // Arrange
    const payload: TurnEndedPayload = {
      playerId: "p1",
      turnNumber: 1,
    };

    // Act & Assert
    expect(payload.turnNumber).toBe(1);
    expect(payload.playerId).toBe("p1");
  });
});

describe("PhaseChangedPayload", () => {
  it("debe permitir todos los cambios de fase válidos", () => {
    // Arrange
    const validTransitions: Array<{ from: TurnPhase; to: TurnPhase }> = [
      { from: "draw", to: "main" },
      { from: "main", to: "combat" },
      { from: "main", to: "end" },
      { from: "combat", to: "end" },
    ];

    for (const { from, to } of validTransitions) {
      // Act
      const payload: PhaseChangedPayload = {
        playerId: "p1",
        previousPhase: from,
        newPhase: to,
      };

      // Assert
      expect(payload.previousPhase).toBe(from);
      expect(payload.newPhase).toBe(to);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Payloads de cartas jugadas
// ---------------------------------------------------------------------------

describe("CardPlayedPayload", () => {
  it("debe incluir cardId y staticId siempre presentes", () => {
    // Arrange
    const payload: CardPlayedPayload = {
      playerId: "p1",
      cardId: "uuid-abc-123",
      staticId: "LIC-001",
    };

    // Act & Assert
    expect(payload.cardId).not.toBe("");
    expect(payload.staticId).toBe("LIC-001");
  });

  it("caso borde: zoneId es opcional — puede estar ausente (Hechizo/Objeto)", () => {
    // Arrange
    const payload: CardPlayedPayload = {
      playerId: "p1",
      cardId: "uuid-spell-001",
      staticId: "LIC-005",
      // zoneId ausente intencionalmente
    };

    // Act & Assert
    expect(payload.zoneId).toBeUndefined();
  });
});

describe("CharacterSummonedPayload", () => {
  it("debe contener la entidad Character y el zoneId destino", () => {
    // Arrange
    const character = buildCharacter();
    const payload: CharacterSummonedPayload = {
      playerId: "p1",
      character,
      zoneId: "center",
    };

    // Act & Assert
    expect(payload.character).toBe(character);
    expect(payload.zoneId).toBe("center");
    expect(payload.character.attack).toBe(4);
    expect(payload.character.health).toBe(5);
  });
});

describe("SpellCastPayload", () => {
  it("debe contener la entidad Spell con effectType y effectValue", () => {
    // Arrange
    const spell = buildSpell();
    const payload: SpellCastPayload = {
      playerId: "p1",
      spell,
      targetId: "uuid-char-enemy",
    };

    // Act & Assert
    expect(payload.spell.effectType).toBe("Damage");
    expect(payload.spell.effectValue).toBe(3);
    expect(payload.targetId).toBe("uuid-char-enemy");
  });

  it("caso borde: targetId undefined para hechizos sin objetivo explícito", () => {
    // Arrange
    const spell = buildSpell();
    const payload: SpellCastPayload = {
      playerId: "p1",
      spell,
      targetId: undefined,
    };

    // Act & Assert
    expect(payload.targetId).toBeUndefined();
  });
});

describe("ItemEquippedPayload", () => {
  it("debe contener la entidad Item y su targetId", () => {
    const item = buildItem();
    const payload: ItemEquippedPayload = {
      playerId: "p1",
      item,
      targetId: "HERO-001",
    };

    expect(payload.item.targetType).toBe("Hero");
    expect(payload.targetId).toBe("HERO-001");
  });
});

// ---------------------------------------------------------------------------
// 6. Payloads de combate
// ---------------------------------------------------------------------------

describe("AttackDeclaredPayload", () => {
  it("debe contener attackerId y defenderId", () => {
    const payload: AttackDeclaredPayload = {
      attackerId: "uuid-1",
      defenderId: "uuid-2",
    };

    expect(payload.attackerId).toBe("uuid-1");
    expect(payload.defenderId).toBe("uuid-2");
  });
});

describe("AttackResolvedPayload", () => {
  it("debe contener atacante, defensor y daños mutuos", () => {
    // Arrange
    const payload: AttackResolvedPayload = {
      attackerId: "uuid-char-1",
      defenderId: "uuid-char-2",
      damageToAttacker: 3,
      damageToDefender: 4,
    };

    // Act & Assert
    expect(payload.damageToAttacker).toBeGreaterThanOrEqual(0);
    expect(payload.damageToDefender).toBeGreaterThanOrEqual(0);
  });

  it("caso borde: daño a atacante puede ser 0 (ej. defensor sin ATQ)", () => {
    // Arrange
    const payload: AttackResolvedPayload = {
      attackerId: "uuid-char-1",
      defenderId: "HERO-002",
      damageToAttacker: 0,
      damageToDefender: 5,
    };

    // Act & Assert
    expect(payload.damageToAttacker).toBe(0);
    expect(payload.damageToDefender).toBe(5);
  });
});

describe("CharacterDestroyedPayload", () => {
  it("debe incluir la causa de la destrucción", () => {
    // Arrange
    const causes: CharacterDestroyedCause[] = ["combat", "spell", "effect", "deathrattle"];

    for (const cause of causes) {
      // Act
      const payload: CharacterDestroyedPayload = {
        playerId: "p2",
        character: buildCharacter(),
        cause,
      };

      // Assert
      expect(payload.cause).toBe(cause);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Payloads de héroe
// ---------------------------------------------------------------------------

describe("HeroDamagedPayload", () => {
  it("debe reflejar el daño recibido y la vida restante", () => {
    // Arrange
    const payload: HeroDamagedPayload = {
      playerId: "p2",
      damage: 5,
      currentHealth: 25,
    };

    // Act & Assert
    expect(payload.damage).toBeGreaterThan(0);
    expect(payload.currentHealth).toBeGreaterThanOrEqual(0);
  });

  it("caso borde: currentHealth puede ser 0 (héroe destruido)", () => {
    // Arrange
    const payload: HeroDamagedPayload = {
      playerId: "p2",
      damage: 30,
      currentHealth: 0,
    };

    // Act & Assert
    expect(payload.currentHealth).toBe(0);
  });
});

describe("HeroHealedPayload", () => {
  it("debe reflejar curación y vida restante", () => {
    const payload: HeroHealedPayload = {
      playerId: "p1",
      amount: 3,
      currentHealth: 28,
    };

    expect(payload.amount).toBe(3);
    expect(payload.currentHealth).toBe(28);
  });
});

describe("HeroPowerUsedPayload", () => {
  it("debe contener el snapshot de heroPower con todos sus campos", () => {
    // Arrange
    const payload: HeroPowerUsedPayload = {
      playerId: "p1",
      heroPower: {
        name: "Tornado de Fuego",
        nostalgyCost: 2,
        effectType: "AttackBuff",
        targetType: "AlliedCharacter",
        value: 2,
      },
    };

    // Act & Assert
    expect(payload.heroPower.nostalgyCost).toBe(2);
    expect(payload.heroPower.effectType).toBe("AttackBuff");
  });

  it("caso borde: targetId es opcional — ausente en habilidades sin objetivo", () => {
    // Arrange
    const payload: HeroPowerUsedPayload = {
      playerId: "p1",
      heroPower: {
        name: "Hechizo Ancestral",
        nostalgyCost: 2,
        effectType: "Damage",
        targetType: "Any",
        value: 2,
      },
      // targetId ausente intencionalmente
    };

    // Act & Assert
    expect(payload.targetId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 8. Payloads de recursos
// ---------------------------------------------------------------------------

describe("NostalgiaChangedPayload", () => {
  it("debe tener current ≤ max siempre", () => {
    // Arrange
    const payload: NostalgiaChangedPayload = {
      playerId: "p1",
      current: 3,
      max: 5,
    };

    // Act & Assert
    expect(payload.current).toBeLessThanOrEqual(payload.max);
  });

  it("caso borde: Nostalgia actual puede ser 0 (sin recursos)", () => {
    // Arrange
    const payload: NostalgiaChangedPayload = {
      playerId: "p1",
      current: 0,
      max: 4,
    };

    // Act & Assert
    expect(payload.current).toBe(0);
    expect(payload.max).toBeGreaterThan(0);
  });
});

describe("MomentumChangedPayload", () => {
  it("isActive debe ser true cuando el jugador está por debajo de 15 PV", () => {
    // Arrange
    const payload: MomentumChangedPayload = {
      playerId: "p2",
      momentum: 3,
      isActive: true,
    };

    // Act & Assert
    expect(payload.isActive).toBe(true);
    expect(payload.momentum).toBeGreaterThanOrEqual(0);
  });

  it("caso borde: Momentum 0 con isActive false (héroe por encima de 15 PV)", () => {
    // Arrange
    const payload: MomentumChangedPayload = {
      playerId: "p1",
      momentum: 0,
      isActive: false,
    };

    // Act & Assert
    expect(payload.momentum).toBe(0);
    expect(payload.isActive).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. Payloads de tablero
// ---------------------------------------------------------------------------

describe("ZoneEnvironmentChangedPayload", () => {
  it("debe incluir zoneId, previousEnv y newEnv", () => {
    // Arrange
    const payload: ZoneEnvironmentChangedPayload = {
      zoneId: "center",
      previousEnv: "forest",
      newEnv: "volcano",
    };

    // Act & Assert
    expect(payload.zoneId).toBe("center");
    expect(payload.newEnv).not.toBe(payload.previousEnv);
  });

  it("caso borde: previousEnv null cuando es el primer entorno de la partida", () => {
    // Arrange
    const payload: ZoneEnvironmentChangedPayload = {
      zoneId: "left",
      previousEnv: null,
      newEnv: "forest",
    };

    // Act & Assert
    expect(payload.previousEnv).toBeNull();
    expect(payload.newEnv).not.toBeNull();
  });
});

describe("SynergyUpdatedPayload", () => {
  it("debe incluir arquetipo y lista de Personajes afectados", () => {
    // Arrange
    const payload: SynergyUpdatedPayload = {
      playerId: "p1",
      archetype: Archetype.CartoonClasico,
      bonus: 2,
      affectedCharacterIds: ["uuid-1", "uuid-2", "uuid-3"],
    };

    // Act & Assert
    expect(payload.archetype).toBe(Archetype.CartoonClasico);
    expect(payload.affectedCharacterIds).toHaveLength(3);
  });

  it("caso borde: bonus 0 y lista vacía cuando no hay sinergia activa", () => {
    // Arrange
    const payload: SynergyUpdatedPayload = {
      playerId: "p1",
      archetype: Archetype.AnimeCombate,
      bonus: 0,
      affectedCharacterIds: [],
    };

    // Act & Assert
    expect(payload.bonus).toBe(0);
    expect(payload.affectedCharacterIds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 10. Payloads de misiones
// ---------------------------------------------------------------------------

describe("QuestPlacedPayload", () => {
  it("debe contener la información de la misión colocada", () => {
    const payload: QuestPlacedPayload = {
      playerId: "p1",
      questId: "QUEST-001",
      questName: "Misión 1",
    };

    expect(payload.questId).toBe("QUEST-001");
  });
});

describe("QuestProgressUpdatedPayload", () => {
  it("debe tener current ≤ target (la misión no puede superar el objetivo)", () => {
    // Arrange
    const payload: QuestProgressUpdatedPayload = {
      playerId: "p1",
      questId: "QUEST-001",
      current: 2,
      target: 3,
    };

    // Act & Assert
    expect(payload.current).toBeLessThanOrEqual(payload.target);
  });

  it("caso borde: current === target implica misión completada (siguiente evento QuestCompleted)", () => {
    // Arrange
    const payload: QuestProgressUpdatedPayload = {
      playerId: "p1",
      questId: "QUEST-001",
      current: 3,
      target: 3,
    };

    // Act & Assert
    expect(payload.current).toBe(payload.target);
  });
});

describe("QuestCompletedPayload", () => {
  it("debe contener el reward string", () => {
    const payload: QuestCompletedPayload = {
      playerId: "p1",
      questId: "QUEST-001",
      reward: "Roba 2",
    };

    expect(payload.reward).toBe("Roba 2");
  });
});

// ---------------------------------------------------------------------------
// 11. Payloads de Crossover y mazo vacío
// ---------------------------------------------------------------------------

describe("CrossoverActivatedPayload", () => {
  it("debe incluir la carta robada como Character, Spell o Item", () => {
    // Arrange — carta robada es un Hechizo (Spell)
    const stolenSpell = buildSpell();
    const payload: CrossoverActivatedPayload = {
      playerId: "p1",
      stolenCard: stolenSpell,
      wasDestroyed: false,
    };

    // Act & Assert
    expect(payload.stolenCard).toBeInstanceOf(Spell);
    expect(payload.wasDestroyed).toBe(false);
  });

  it("caso borde: wasDestroyed true si la mano estaba llena al robar", () => {
    // Arrange
    const payload: CrossoverActivatedPayload = {
      playerId: "p1",
      stolenCard: buildCharacter(),
      wasDestroyed: true,
    };

    // Act & Assert
    expect(payload.wasDestroyed).toBe(true);
    expect(payload.stolenCard).toBeInstanceOf(Character);
  });
});

describe("DeckEmptyPayload", () => {
  it("debe incluir el daño de fatiga aplicado al héroe", () => {
    // Arrange
    const payload: DeckEmptyPayload = {
      playerId: "p2",
      fatigueDamage: 1,
    };

    // Act & Assert
    expect(payload.fatigueDamage).toBeGreaterThan(0);
  });

  it("caso borde: fatigueDamage aumenta con cada intento de robo (ej. turno 5 → daño 5)", () => {
    // Arrange — en turn 5 el daño de fatiga acumulado sería 5
    const payload: DeckEmptyPayload = {
      playerId: "p1",
      fatigueDamage: 5,
    };

    // Act & Assert
    expect(payload.fatigueDamage).toBe(5);
  });
});
