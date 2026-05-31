/**
 * Tests unitarios de HeroPowerResolver — Crossover Cards
 *
 * Verifica la aplicación del efecto real del poder de héroe (CRÍTICO-F4.2):
 *   - "Damage" sobre Personaje y sobre Héroe.
 *   - "BuffAttack" sobre un aliado (con expiración al final del turno).
 *   - Robustez ante objetivos inexistentes.
 *
 * Usa el GameEventBus real para que la emisión de HeroPowerUsed dispare al
 * resolver de forma síncrona. Estructura AAA.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HeroPowerResolver } from "@domain/services/hero-power-resolver";
import { GameEventBus } from "@infrastructure/events/game-event-bus";
import { GameEvent } from "@domain/events/game-event";
import { Match, type PlayerState } from "@domain/entities/match";
import { Character } from "@domain/entities/character";
import { Hero, type IHeroPower } from "@domain/entities/hero";
import { Hand } from "@domain/entities/hand";
import type { Deck } from "@domain/entities/deck";
import { CardType, Archetype, Rarity } from "@domain/types/card-types";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeCharacter(attack = 3, health = 5): Character {
  return new Character({
    staticId: "LIC-005",
    name: "Test",
    type: CardType.Character,
    archetype: Archetype.CartoonClasico,
    nostalgyCost: 2,
    rarity: Rarity.Rare,
    description: "Test",
    spriteKey: "rigby_card",
    greetingText: "hi",
    attack,
    health,
    abilities: [],
  });
}

function makeHero(staticId: string): Hero {
  return new Hero({
    staticId,
    name: `Hero ${staticId}`,
    archetype: Archetype.Neutral,
    maxHealth: 30,
    heroPower: { name: "P", nostalgyCost: 2, effectType: "Damage", targetType: "Any", value: 2 },
  });
}

function makeMatch(p1Center: Character[] = [], p2Center: Character[] = []): Match {
  const p1: PlayerState = {
    playerId: "p1",
    hand: new Hand(),
    board: { left: [], center: p1Center, right: [] },
    hero: makeHero("HERO-P1"),
    deck: {} as unknown as Deck,
  };
  const p2: PlayerState = {
    playerId: "p2",
    hand: new Hand(),
    board: { left: [], center: p2Center, right: [] },
    hero: makeHero("HERO-P2"),
    deck: {} as unknown as Deck,
  };
  return new Match(p1, p2);
}

const DAMAGE_POWER: IHeroPower = {
  name: "Hechizo Ancestral",
  nostalgyCost: 2,
  effectType: "Damage",
  targetType: "Any",
  value: 2,
};

const BUFF_POWER: IHeroPower = {
  name: "Tornado de Fuego",
  nostalgyCost: 2,
  effectType: "BuffAttack",
  targetType: "AllyCharacter",
  value: 2,
};

describe("HeroPowerResolver", () => {
  let bus: GameEventBus;
  let resolver: HeroPowerResolver;

  beforeEach(() => {
    GameEventBus.resetInstance();
    bus = GameEventBus.getInstance();
  });

  afterEach(() => {
    resolver.dispose();
    GameEventBus.resetInstance();
  });

  it('"Damage" a un Personaje reduce su vida y emite CharacterDamaged', () => {
    // Arrange
    const enemy = makeCharacter(3, 5);
    const match = makeMatch([], [enemy]);
    resolver = new HeroPowerResolver(match, bus);
    const spy = vi.fn();
    bus.on(GameEvent.CharacterDamaged, spy);

    // Act: p1 usa Damage(2) sobre el Personaje enemigo.
    bus.emit(GameEvent.HeroPowerUsed, {
      playerId: "p1",
      heroPower: DAMAGE_POWER,
      targetId: enemy.instanceId,
    });

    // Assert
    expect(enemy.currentHealth).toBe(3);
    expect(spy).toHaveBeenCalledWith({ playerId: "p2", character: enemy });
  });

  it('"Damage" a un Héroe (por staticId) reduce su vida y emite HeroDamaged', () => {
    // Arrange
    const match = makeMatch();
    resolver = new HeroPowerResolver(match, bus);
    const spy = vi.fn();
    bus.on(GameEvent.HeroDamaged, spy);

    // Act: p1 usa Damage(2) sobre el héroe rival (staticId "HERO-P2").
    bus.emit(GameEvent.HeroPowerUsed, {
      playerId: "p1",
      heroPower: DAMAGE_POWER,
      targetId: "HERO-P2",
    });

    // Assert
    expect(match.player2.hero.currentHealth).toBe(28);
    expect(spy).toHaveBeenCalledWith({ playerId: "p2", damage: 2, currentHealth: 28 });
  });

  it('"Damage" letal deja al Personaje con vida <= 0 (la destrucción la gestiona otro flujo)', () => {
    // Arrange
    const enemy = makeCharacter(1, 2);
    const match = makeMatch([], [enemy]);
    resolver = new HeroPowerResolver(match, bus);

    // Act
    bus.emit(GameEvent.HeroPowerUsed, {
      playerId: "p1",
      heroPower: DAMAGE_POWER,
      targetId: enemy.instanceId,
    });

    // Assert
    expect(enemy.currentHealth).toBe(0);
    expect(enemy.isAlive()).toBe(false);
  });

  it('"BuffAttack" a un aliado aumenta su ATQ efectivo y emite CharacterBuffed', () => {
    // Arrange
    const ally = makeCharacter(3, 5);
    const match = makeMatch([ally], []);
    resolver = new HeroPowerResolver(match, bus);
    const spy = vi.fn();
    bus.on(GameEvent.CharacterBuffed, spy);

    // Act: p1 buffea a su aliado.
    bus.emit(GameEvent.HeroPowerUsed, {
      playerId: "p1",
      heroPower: BUFF_POWER,
      targetId: ally.instanceId,
    });

    // Assert
    expect(ally.getEffectiveAttack()).toBe(5); // 3 base + 2 buff
    expect(spy).toHaveBeenCalledWith({ playerId: "p1", character: ally });
  });

  it("el buff de ATQ expira al final del turno (TurnEnded) y se notifica el ATQ revertido", () => {
    // Arrange
    const ally = makeCharacter(3, 5);
    const match = makeMatch([ally], []);
    resolver = new HeroPowerResolver(match, bus);
    bus.emit(GameEvent.HeroPowerUsed, {
      playerId: "p1",
      heroPower: BUFF_POWER,
      targetId: ally.instanceId,
    });
    expect(ally.getEffectiveAttack()).toBe(5);

    const spy = vi.fn();
    bus.on(GameEvent.CharacterBuffed, spy);

    // Act: termina el turno → el buff se retira.
    bus.emit(GameEvent.TurnEnded, { playerId: "p1", turnNumber: 1 });

    // Assert
    expect(ally.getEffectiveAttack()).toBe(3); // vuelve al ATQ base
    expect(spy).toHaveBeenCalledWith({ playerId: "p1", character: ally });
  });

  it("objetivo inexistente no muta estado ni lanza", () => {
    // Arrange
    const ally = makeCharacter(3, 5);
    const match = makeMatch([ally], []);
    resolver = new HeroPowerResolver(match, bus);
    const damagedSpy = vi.fn();
    bus.on(GameEvent.CharacterDamaged, damagedSpy);

    // Act: targetId que no corresponde a ningún Personaje ni héroe.
    bus.emit(GameEvent.HeroPowerUsed, {
      playerId: "p1",
      heroPower: DAMAGE_POWER,
      targetId: "id-inexistente",
    });

    // Assert
    expect(ally.currentHealth).toBe(5);
    expect(match.player2.hero.currentHealth).toBe(30);
    expect(damagedSpy).not.toHaveBeenCalled();
  });

  it("BuffAttack solo afecta a aliados: un objetivo enemigo se ignora", () => {
    // Arrange
    const enemy = makeCharacter(3, 5);
    const match = makeMatch([], [enemy]);
    resolver = new HeroPowerResolver(match, bus);
    const spy = vi.fn();
    bus.on(GameEvent.CharacterBuffed, spy);

    // Act: p1 intenta buffear un Personaje del rival.
    bus.emit(GameEvent.HeroPowerUsed, {
      playerId: "p1",
      heroPower: BUFF_POWER,
      targetId: enemy.instanceId,
    });

    // Assert: sin buff aplicado.
    expect(enemy.getEffectiveAttack()).toBe(3);
    expect(spy).not.toHaveBeenCalled();
  });

  it('"Damage" a un Personaje propio emite CharacterDamaged con el playerId correcto', () => {
    // Arrange: el objetivo es un aliado del propio lanzador (cubre la rama p1).
    const ally = makeCharacter(3, 5);
    const match = makeMatch([ally], []);
    resolver = new HeroPowerResolver(match, bus);
    const spy = vi.fn();
    bus.on(GameEvent.CharacterDamaged, spy);

    // Act
    bus.emit(GameEvent.HeroPowerUsed, {
      playerId: "p1",
      heroPower: DAMAGE_POWER,
      targetId: ally.instanceId,
    });

    // Assert
    expect(ally.currentHealth).toBe(3);
    expect(spy).toHaveBeenCalledWith({ playerId: "p1", character: ally });
  });

  it('"Damage" al héroe propio (por staticId) reduce su vida', () => {
    // Arrange: cubre la rama del héroe player1 en findHeroOwnerByStaticId.
    const match = makeMatch();
    resolver = new HeroPowerResolver(match, bus);
    const spy = vi.fn();
    bus.on(GameEvent.HeroDamaged, spy);

    // Act
    bus.emit(GameEvent.HeroPowerUsed, {
      playerId: "p1",
      heroPower: DAMAGE_POWER,
      targetId: "HERO-P1",
    });

    // Assert
    expect(match.player1.hero.currentHealth).toBe(28);
    expect(spy).toHaveBeenCalledWith({ playerId: "p1", damage: 2, currentHealth: 28 });
  });

  it("un effectType no soportado no muta estado ni emite eventos", () => {
    // Arrange
    const ally = makeCharacter(3, 5);
    const match = makeMatch([ally], []);
    resolver = new HeroPowerResolver(match, bus);
    const damagedSpy = vi.fn();
    const buffedSpy = vi.fn();
    bus.on(GameEvent.CharacterDamaged, damagedSpy);
    bus.on(GameEvent.CharacterBuffed, buffedSpy);

    // Act: effectType desconocido.
    bus.emit(GameEvent.HeroPowerUsed, {
      playerId: "p1",
      heroPower: {
        name: "Raro",
        nostalgyCost: 2,
        effectType: "Unknown",
        targetType: "Any",
        value: 2,
      },
      targetId: ally.instanceId,
    });

    // Assert
    expect(ally.currentHealth).toBe(5);
    expect(ally.getEffectiveAttack()).toBe(3);
    expect(damagedSpy).not.toHaveBeenCalled();
    expect(buffedSpy).not.toHaveBeenCalled();
  });
});
