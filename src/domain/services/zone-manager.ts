import type { IEventBus } from "@domain/events/event-bus";
import { GameEvent } from "@domain/events/game-event";
import type { Character } from "@domain/entities/character";
import { Archetype, Ability } from "@domain/types/card-types";
import { Modifier } from "@domain/value-objects/modifier";

/**
 * Interfaz para el Generador de Números Aleatorios.
 * Facilita el testing determinista del sistema de zonas.
 */
export interface IRNG {
  /** Devuelve un número n tal que 0 <= n < 1 */
  next(): number;
}

/**
 * Contrato del Patrón Strategy para los efectos de entorno.
 */
export interface IZoneEffect {
  apply(character: Character): void;
  remove(character: Character): void;
}

// -- Implementaciones concretas de los entornos (Strategy) --

class Env001 implements IZoneEffect {
  // Paisaje Neutro: Sin modificadores

  apply(_character: Character): void {}

  remove(_character: Character): void {}
}

class Env002 implements IZoneEffect {
  // Bosque Mágico: +1 VID
  apply(character: Character): void {
    character.addModifier(
      new Modifier({
        source: "zone",
        attackBonus: 0,
        healthBonus: 1,
        abilitiesGranted: [],
        duration: -1,
        appliedAtTurn: 0,
      }),
    );
  }
  remove(character: Character): void {
    character.removeModifiersBySource("zone");
  }
}

class Env003 implements IZoneEffect {
  // Estadio Deportivo: +1 ATQ
  apply(character: Character): void {
    character.addModifier(
      new Modifier({
        source: "zone",
        attackBonus: 1,
        healthBonus: 0,
        abilitiesGranted: [],
        duration: -1,
        appliedAtTurn: 0,
      }),
    );
  }
  remove(character: Character): void {
    character.removeModifiersBySource("zone");
  }
}

class Env004 implements IZoneEffect {
  // Cocina Krusty: Restauran 1 VID al héroe aliado al atacar
  apply(character: Character): void {
    character.addModifier(
      new Modifier({
        source: "zone",
        attackBonus: 0,
        healthBonus: 0,
        abilitiesGranted: [Ability.HealHeroOnAttack],
        duration: -1,
        appliedAtTurn: 0,
      }),
    );
  }
  remove(character: Character): void {
    character.removeModifiersBySource("zone");
  }
}

class Env005 implements IZoneEffect {
  // Tierra de Ooo: Aventura Mágica ganan Charge
  apply(character: Character): void {
    if (character.archetype === Archetype.AventuraMagica) {
      character.addModifier(
        new Modifier({
          source: "zone",
          attackBonus: 0,
          healthBonus: 0,
          abilitiesGranted: [Ability.Charge],
          duration: -1,
          appliedAtTurn: 0,
        }),
      );
    }
  }
  remove(character: Character): void {
    if (character.archetype === Archetype.AventuraMagica) {
      character.removeModifiersBySource("zone");
    }
  }
}

class Env006 implements IZoneEffect {
  // Parque Municipal: Cartoon Clásico cuestan 1 menos
  apply(character: Character): void {
    if (character.archetype === Archetype.CartoonClasico) {
      const reduction = character.nostalgyCost > 0 ? 1 : 0;
      Reflect.set(character, "_env006_reduction", reduction);
      Reflect.set(character, "nostalgyCost", character.nostalgyCost - reduction);
    }
  }
  remove(character: Character): void {
    if (character.archetype === Archetype.CartoonClasico) {
      const reduction = (Reflect.get(character, "_env006_reduction") as number) || 0;
      Reflect.set(character, "nostalgyCost", character.nostalgyCost + reduction);
      Reflect.deleteProperty(character, "_env006_reduction");
    }
  }
}

export const EnvironmentEffects: Record<string, IZoneEffect> = {
  "ENV-001": new Env001(),
  "ENV-002": new Env002(),
  "ENV-003": new Env003(),
  "ENV-004": new Env004(),
  "ENV-005": new Env005(),
  "ENV-006": new Env006(),
};

export type ZoneId = "left" | "center" | "right";

/**
 * Gestor del Sistema de Zonas Dinámicas (Mecánica M3).
 * Rota aleatoriamente los entornos cada 3 turnos completos y aplica
 * los modificadores correspondientes a los personajes en el tablero.
 */
export class ZoneManager {
  private zones: Record<ZoneId, string> = {
    left: "ENV-001",
    center: "ENV-001",
    right: "ENV-001",
  };

  private turnCounter = 0;
  private readonly AVAILABLE_ENVIRONMENTS = ["ENV-002", "ENV-003", "ENV-004", "ENV-005", "ENV-006"];
  private readonly ZONES: ZoneId[] = ["left", "center", "right"];

  constructor(
    private readonly eventBus: IEventBus,
    private readonly rng: IRNG,
  ) {}

  public getEnvironment(zoneId: ZoneId): string {
    return this.zones[zoneId];
  }

  public applyEnvironmentToCharacter(character: Character, zoneId: ZoneId): void {
    const envId = this.zones[zoneId];
    EnvironmentEffects[envId].apply(character);
  }

  public removeEnvironmentFromCharacter(character: Character, zoneId: ZoneId): void {
    const envId = this.zones[zoneId];
    EnvironmentEffects[envId].remove(character);
  }

  public changeEnvironment(zoneId: ZoneId, newEnvId: string, charactersInZone: Character[]): void {
    const previousEnv = this.zones[zoneId];

    // 1. Limpiar efectos del entorno anterior
    charactersInZone.forEach((c) => EnvironmentEffects[previousEnv].remove(c));

    // 2. Cambiar el estado
    this.zones[zoneId] = newEnvId;

    // 3. Aplicar nuevos efectos
    charactersInZone.forEach((c) => EnvironmentEffects[newEnvId].apply(c));

    // 4. Emitir el evento a los suscriptores (UI)
    this.eventBus.emit(GameEvent.ZoneEnvironmentChanged, {
      zoneId,
      previousEnv,
      newEnv: newEnvId,
    });
  }

  /**
   * Registra el avance de un turno completo. Cada 3 turnos, elige una zona
   * al azar y le aplica un nuevo entorno aleatorio (distinto de ENV-001).
   *
   * @param getCharactersInZone Callback que permite al servicio obtener los personajes
   * que se encuentran físicamente en la zona para aplicar/remover los efectos,
   * sin acoplar al ZoneManager con el estado global del tablero.
   */
  public onFullTurnEnded(getCharactersInZone: (zoneId: ZoneId) => Character[]): void {
    this.turnCounter++;

    if (this.turnCounter >= 3) {
      this.turnCounter = 0;

      // Selección aleatoria determinista inyectada (útil para testing)
      const zoneIndex = Math.floor(this.rng.next() * this.ZONES.length);
      const targetZone = this.ZONES[zoneIndex];

      const envIndex = Math.floor(this.rng.next() * this.AVAILABLE_ENVIRONMENTS.length);
      const newEnv = this.AVAILABLE_ENVIRONMENTS[envIndex];

      const characters = getCharactersInZone(targetZone);
      this.changeEnvironment(targetZone, newEnv, characters);
    }
  }
}
