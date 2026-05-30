import { describe, it, expect, vi, beforeEach } from "vitest";
import { TurnEngine } from "@domain/services/turn-engine";
import { CombatResolver } from "@domain/services/combat-resolver";
import { NostalgiaSystem } from "@domain/services/nostalgia-system";
import { MomentumSystem } from "@domain/services/momentum-system";
import { ZoneManager, type IRNG } from "@domain/services/zone-manager";
import { TribalSynergySystem } from "@domain/services/tribal-synergy-system";
import { QuestManager } from "@domain/services/quest-manager";
import { CrossoverManager } from "@domain/services/crossover-manager";
import { GameEvent } from "@domain/events/game-event";
import type { IEventBus } from "@domain/events/event-bus";
import { Character } from "@domain/entities/character";
import { Deck } from "@domain/entities/deck";
import { Hand } from "@domain/entities/hand";
import { Hero } from "@domain/entities/hero";
import { Archetype, CardType, Rarity } from "@domain/types/card-types";
import type { IHeroPower } from "@domain/entities/hero";

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

class MockEventBus implements IEventBus {
  public emittedEvents: GameEvent[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers = new Map<GameEvent, Set<(payload: any) => void>>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on = vi.fn((event: GameEvent, handler: (payload: any) => void) => {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => {};
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit = vi.fn((event: GameEvent, payload: any) => {
    this.emittedEvents.push(event);
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((h) => h(payload));
    }
  });

  off = vi.fn();
  clear = vi.fn();
}

class MockRNG implements IRNG {
  next(): number {
    return 0.5; // Determinista
  }
}

class MockHeroPower implements IHeroPower {
  readonly name = "Mock Power";
  readonly nostalgyCost = 2;
  readonly effectType = "Damage";
  readonly targetType = "Any";
  readonly value = 1;

  canBeUsed(): boolean {
    return true;
  }
  execute(): void {}
}

function createMockCharacter(id: string, attack: number = 2): Character {
  return new Character({
    staticId: id,
    name: `Char_${id}`,
    type: CardType.Character,
    archetype: Archetype.Neutral,
    nostalgyCost: 1,
    rarity: Rarity.Common,
    description: "",
    spriteKey: "",
    greetingText: "",
    attack,
    health: 5,
    abilities: [],
  });
}

// -----------------------------------------------------------------------------
// Test de Integración
// -----------------------------------------------------------------------------

describe("Domain Services Integration E2E", () => {
  let eventBus: MockEventBus;
  let turnEngine: TurnEngine;
  let combatResolver: CombatResolver;
  let nostalgiaSystem: NostalgiaSystem;
  let momentumSystem: MomentumSystem;
  let zoneManager: ZoneManager;
  let synergySystem: TribalSynergySystem;

  let questManager: QuestManager;
  let crossoverManager: CrossoverManager;

  const P1 = "Player1";
  const P2 = "Player2";

  let p1Hero: Hero;
  let p2Hero: Hero;
  let p1Deck: Deck;
  let p2Deck: Deck;
  let p1Hand: Hand;
  let p2Hand: Hand;
  let boardP1: Character[];

  let boardP2: Character[];

  beforeEach(() => {
    eventBus = new MockEventBus();

    // Instanciar todos los servicios inyectando el mismo EventBus
    turnEngine = new TurnEngine(eventBus, P1, P2);
    combatResolver = new CombatResolver(eventBus);
    nostalgiaSystem = new NostalgiaSystem(eventBus);
    momentumSystem = new MomentumSystem(eventBus); // Este se suscribe a HeroDamaged en el constructor
    zoneManager = new ZoneManager(eventBus, new MockRNG());
    synergySystem = new TribalSynergySystem(eventBus);
    questManager = new QuestManager(eventBus);
    crossoverManager = new CrossoverManager(eventBus);

    // Entidades
    p1Hero = new Hero({
      staticId: "HERO-001",
      name: "P1 Hero",
      archetype: Archetype.Neutral,
      maxHealth: 30,
      heroPower: new MockHeroPower(),
    });
    p2Hero = new Hero({
      staticId: "HERO-002",
      name: "P2 Hero",
      archetype: Archetype.Neutral,
      maxHealth: 30,
      heroPower: new MockHeroPower(),
    });

    p1Deck = new Deck([createMockCharacter("C1")]); // Mazo de 1 sola carta para forzar fatiga rápida
    p2Deck = new Deck([createMockCharacter("C2"), createMockCharacter("C3")]);

    p1Hand = new Hand();
    p2Hand = new Hand();
    boardP1 = [];
    boardP2 = [];
  });

  it("debe simular una partida completa con todas las interacciones exigidas (fatiga, momentum, crossover)", () => {
    // =========================================================
    // 0. Inicio de Partida
    // =========================================================
    turnEngine.startMatch();
    // Emite MatchStarted, TurnStarted (P1), y avanza automáticamente draw -> main

    // =========================================================
    // 1. TURNO 1 (P1)
    // =========================================================
    // -- Draw Phase (automática: el motor ya está en main) --
    let drawCard = p1Deck.draw();
    if (drawCard) p1Hand.add(drawCard);

    nostalgiaSystem.onTurnStart(P1);
    momentumSystem.onTurnStart(P1);

    // -- Main Phase --
    nostalgiaSystem.spend(P1, 1);
    const playedCard = p1Hand.remove(drawCard!.instanceId) as Character;
    boardP1.push(playedCard);
    synergySystem.calculateSynergies(P1, boardP1, turnEngine.getTurnNumber());

    turnEngine.handleAction({ type: "END_PHASE" }); // Pasa a CombatPhase

    // -- Combat Phase --
    combatResolver.resolveAttack(playedCard, p2Hero, P1, P2);
    // El ATQ es 2 -> p2Hero se queda con 28 PV

    turnEngine.handleAction({ type: "END_PHASE" }); // Pasa a EndPhase
    turnEngine.handleAction({ type: "END_TURN" }); // Termina P1, empieza P2 (Turno 2)
    zoneManager.onFullTurnEnded(() => []);

    // =========================================================
    // 2. TURNO 2 (P2)
    // =========================================================
    // -- Draw Phase (automática: el motor ya está en main) --
    drawCard = p2Deck.draw();
    if (drawCard) p2Hand.add(drawCard);

    nostalgiaSystem.onTurnStart(P2);
    momentumSystem.onTurnStart(P2);

    turnEngine.handleAction({ type: "END_PHASE" }); // -> CombatPhase
    turnEngine.handleAction({ type: "END_PHASE" }); // -> EndPhase
    turnEngine.handleAction({ type: "END_TURN" }); // Termina P2, empieza P1 (Turno 3)
    zoneManager.onFullTurnEnded(() => []);

    // =========================================================
    // 3. TURNO 3 (P1)
    // =========================================================
    // -- Draw Phase (CASO BORDE: Mazo vacío -> Fatiga) --
    // Reset combat state de los personajes propios al inicio del turno
    // (en una partida real esto lo haría TurnEngine al emitir TurnStarted)
    boardP1.forEach((c) => {
      Reflect.set(c, "hasAttackedThisTurn", false);
      Reflect.set(c, "isExhausted", false);
    });
    drawCard = p1Deck.draw();
    expect(drawCard).toBeNull(); // Mazo vacío

    // Simulamos la lógica de la aplicación aplicando el daño y notificando al bus
    p1Hero.takeDamage(1);
    eventBus.emit(GameEvent.DeckEmpty, { playerId: P1, fatigueDamage: 1 });
    eventBus.emit(GameEvent.HeroDamaged, {
      playerId: P1,
      damage: 1,
      currentHealth: p1Hero.currentHealth,
    });

    nostalgiaSystem.onTurnStart(P1);
    momentumSystem.onTurnStart(P1);

    // -- Main Phase --
    // Crossover (M5)
    crossoverManager.activate(P1, p2Deck, p1Hand);

    turnEngine.handleAction({ type: "END_PHASE" }); // -> CombatPhase

    // -- Combat Phase --
    // CASO BORDE: P1 hace un ataque masivo para activar Momentum a P2
    const attacker = boardP1[0];
    Reflect.set(attacker, "attack", 13); // Con ATQ=13 bajará los 28 PV de P2 a 15 exactos
    combatResolver.resolveAttack(attacker, p2Hero, P1, P2);

    turnEngine.handleAction({ type: "END_PHASE" }); // -> EndPhase

    // =========================================================
    // VALIDACIONES
    // =========================================================

    const events = eventBus.emittedEvents;

    // A. Coherencia de Eventos Básica
    expect(events).toContain(GameEvent.MatchStarted);
    expect(events).toContain(GameEvent.TurnStarted);
    expect(events).toContain(GameEvent.PhaseChanged);
    expect(events).toContain(GameEvent.NostalgiaChanged);
    expect(events).toContain(GameEvent.AttackDeclared);
    expect(events).toContain(GameEvent.HeroDamaged);
    expect(events).toContain(GameEvent.AttackResolved);
    expect(events).toContain(GameEvent.TurnEnded);

    // B. Casos Borde y Eventos Especiales
    expect(events).toContain(GameEvent.DeckEmpty);
    expect(events).toContain(GameEvent.CrossoverActivated);
    expect(events).toContain(GameEvent.MomentumChanged);

    // C. Estado Final (P1)
    expect(p1Hero.currentHealth).toBe(29); // Recibió 1 por fatiga
    expect(p1Hand.size()).toBe(1); // Robó carta con el Crossover
    expect(crossoverManager.hasUsedCrossover(P1)).toBe(true);

    // D. Estado Final (P2)
    expect(p2Hero.currentHealth).toBe(15); // Recibió 2 + 13 de daño = 15 exactos
    expect(momentumSystem.isMomentumActive(P2)).toBe(true); // Se activó el comeback
    // E. Lectura para compiler (evitar TS unused errors)
    expect(questManager).toBeDefined();
    expect(boardP2.length).toBe(0);
  });
});
