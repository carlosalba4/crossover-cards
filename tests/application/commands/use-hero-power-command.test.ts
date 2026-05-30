import { describe, it, expect, vi, beforeEach } from "vitest";
import { UseHeroPowerCommand } from "@application/commands/use-hero-power-command";
import { Match } from "@domain/entities/match";
import { Hand } from "@domain/entities/hand";
import { Hero } from "@domain/entities/hero";
import { Deck } from "@domain/entities/deck";
import { NostalgiaSystem } from "@domain/services/nostalgia-system";
import { GameEvent } from "@domain/events/game-event";
import { Archetype } from "@domain/types/card-types";
import { PhaseViolationError } from "@domain/errors/phase-violation-error";
import { InsufficientNostalgiaError } from "@domain/errors/insufficient-nostalgia-error";
import { ApplicationError } from "@application/errors/application-error";
import type { IEventBus } from "@domain/events/event-bus";

function makeMockEventBus(): IEventBus {
  return {
    emit: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    off: vi.fn(),
    clear: vi.fn(),
  };
}

function makeHero(): Hero {
  return new Hero({
    staticId: "HERO-1",
    name: "El Lich",
    archetype: Archetype.CartoonClasico,
    maxHealth: 30,
    heroPower: {
      name: "Poder",
      nostalgyCost: 2,
      effectType: "Damage",
      targetType: "Any",
      value: 2,
    },
  });
}

function makeMatch(phase: "main" | "draw" | "combat" | "end" = "main"): Match {
  const match = new Match(
    {
      playerId: "player1",
      hand: new Hand(),
      board: { left: [], center: [], right: [] },
      hero: makeHero(),
      deck: new Deck([]),
    },
    {
      playerId: "player2",
      hand: new Hand(),
      board: { left: [], center: [], right: [] },
      hero: makeHero(),
      deck: new Deck([]),
    },
  );
  match.currentPhase = phase;
  match.activePlayerId = "player1";
  return match;
}

describe("UseHeroPowerCommand", () => {
  let eventBus: IEventBus;
  let nostalgiaSystem: NostalgiaSystem;

  beforeEach(() => {
    eventBus = makeMockEventBus();
    nostalgiaSystem = new NostalgiaSystem(eventBus);
    // Añadimos Nostalgia al player1
    nostalgiaSystem.onTurnStart("player1");
    nostalgiaSystem.onTurnStart("player1");
    nostalgiaSystem.onTurnStart("player1");
  });

  it("debería usar el poder con éxito en fase main con Nostalgia suficiente", () => {
    const match = makeMatch("main");
    const command = new UseHeroPowerCommand(match, "player1", "target1", eventBus, nostalgiaSystem);

    const result = command.execute();

    expect(result.success).toBe(true);
    expect(result.eventsEmitted).toContain(GameEvent.HeroPowerUsed);
    expect(result.eventsEmitted).toContain(GameEvent.NostalgiaChanged);
    expect(match.player1.hero.hasUsedHeroPowerThisTurn).toBe(true);
  });

  it("debería fallar si no es la fase main", () => {
    const match = makeMatch("combat");
    const command = new UseHeroPowerCommand(match, "player1", "target1", eventBus, nostalgiaSystem);

    const result = command.execute();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(PhaseViolationError);
  });

  it("debería fallar si el jugador no es el activo", () => {
    const match = makeMatch("main");
    const command = new UseHeroPowerCommand(match, "player2", "target1", eventBus, nostalgiaSystem);

    const result = command.execute();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(PhaseViolationError);
  });

  it("debería fallar si ya se usó el poder este turno", () => {
    const match = makeMatch("main");
    match.player1.hero.useHeroPower();
    const command = new UseHeroPowerCommand(match, "player1", "target1", eventBus, nostalgiaSystem);

    const result = command.execute();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(ApplicationError);
    expect((result.error as ApplicationError).code).toBe("HERO_POWER_ALREADY_USED");
  });

  it("debería fallar si no hay Nostalgia suficiente", () => {
    const match = makeMatch("main");
    // Crear un sistema de Nostalgia sin Nostalgia disponible
    const poorNostalgiaSystem = new NostalgiaSystem(eventBus);
    const command = new UseHeroPowerCommand(
      match,
      "player1",
      "target1",
      eventBus,
      poorNostalgiaSystem,
    );

    const result = command.execute();

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(InsufficientNostalgiaError);
  });
});
