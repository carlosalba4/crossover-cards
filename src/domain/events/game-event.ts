/**
 * Eventos de dominio de Crossover Cards — GameEvent enum y payloads tipados.
 *
 * Este módulo define:
 *   1. `GameEvent` — enum exhaustivo con los 22 eventos del dominio.
 *   2. Un tipo de payload por evento, correctamente tipado y readonly.
 *   3. `GameEventPayloadMap` — mapa tipo→payload para el tipado genérico del IEventBus.
 *
 * Principios aplicados:
 *   - Sin dependencias de Phaser, Vite ni ninguna librería externa (dominio puro).
 *   - Todos los campos de payload son `readonly` (inmutabilidad de value objects).
 *   - `import type` para las entidades: evita generar JS innecesario y previene
 *     dependencias circulares en tiempo de ejecución.
 *
 * Referencia:
 *   - docs/02-architecture.md §3.1.3 (tabla de eventos y payloads).
 *   - docs/02-architecture.md §4.4 (patrón Observer / Event Bus).
 *   - docs/01-prd.md §6-9 (mecánicas M1-M5).
 */

import type { PlayerId, CardId, Archetype } from "@domain/types/card-types";
import type { Card } from "@domain/entities/card";
import type { Character } from "@domain/entities/character";
import type { Spell } from "@domain/entities/spell";
import type { Item } from "@domain/entities/item";
import type { IHeroPower } from "@domain/entities/hero";

// ---------------------------------------------------------------------------
// 1. Enum de eventos
// ---------------------------------------------------------------------------

/**
 * Enumeración exhaustiva de todos los eventos de dominio del juego.
 *
 * Se usa como clave genérica en `IEventBus.on<T>(event, handler)` y
 * `IEventBus.emit<T>(event, payload)`, garantizando type-safety entre el
 * evento emitido y su payload asociado a través de `GameEventPayloadMap`.
 *
 * Orden de enumeración: ciclo de vida de la partida → carta → combate →
 * recursos → tablero → misiones → especiales.
 */
export enum GameEvent {
  // -- Partida ---------------------------------------------------------------
  /** Se emite al comenzar una nueva partida (jugadores listos, mazos barajados). */
  MatchStarted = "MatchStarted",

  /** Se emite cuando la partida termina (PV héroe ≤ 0 o condición de victoria). */
  MatchEnded = "MatchEnded",

  // -- Turno y fases ---------------------------------------------------------
  /** Se emite al comenzar el turno de un jugador (tras robo automático). */
  TurnStarted = "TurnStarted",

  /** Se emite al finalizar completamente el turno del jugador activo. */
  TurnEnded = "TurnEnded",

  /** Se emite cada vez que el turno activo cambia de fase (ej. Main→Combat). */
  PhaseChanged = "PhaseChanged",

  // -- Cartas jugadas --------------------------------------------------------
  /** Se emite cuando un jugador juega cualquier carta desde la mano. */
  CardPlayed = "CardPlayed",

  /** Se emite cuando un Personaje se coloca en el tablero (tras CardPlayed si es Character). */
  CharacterSummoned = "CharacterSummoned",

  /** Se emite cuando se lanza un Hechizo (tras CardPlayed si es Spell). */
  SpellCast = "SpellCast",

  /** Se emite cuando se equipa un Objeto al héroe (tras CardPlayed si es Item). */
  ItemEquipped = "ItemEquipped",

  // -- Combate ---------------------------------------------------------------
  /** Se emite cuando un Personaje declara un ataque (antes de resolver daño). */
  AttackDeclared = "AttackDeclared",

  /** Se emite cuando el daño mutuo de un ataque ha sido calculado y aplicado. */
  AttackResolved = "AttackResolved",

  /** Se emite cuando un Personaje es destruido (VID ≤ 0 tras daño). */
  CharacterDestroyed = "CharacterDestroyed",

  // -- Héroes ----------------------------------------------------------------
  /** Se emite cuando el héroe de un jugador recibe daño. */
  HeroDamaged = "HeroDamaged",

  /** Se emite cuando el héroe de un jugador recupera puntos de vida. */
  HeroHealed = "HeroHealed",

  /** Se emite al usar la habilidad especial del héroe. */
  HeroPowerUsed = "HeroPowerUsed",

  // -- Recursos (M1 Nostalgia, M2 Momentum) ----------------------------------
  /** Se emite cada vez que cambia la Nostalgia disponible o el máximo del turno. */
  NostalgiaChanged = "NostalgiaChanged",

  /** Se emite cuando el Momentum acumulado del jugador cambia de valor o estado. */
  MomentumChanged = "MomentumChanged",

  // -- Tablero y zonas (M3 Zonas) -------------------------------------------
  /** Se emite cuando cambia el entorno activo de una zona del tablero. */
  ZoneEnvironmentChanged = "ZoneEnvironmentChanged",

  /** Se emite cuando se recalcula el bonus de sinergia tribal de un jugador. */
  SynergyUpdated = "SynergyUpdated",

  // -- Misiones (M4 Misiones) ------------------------------------------------
  /** Se emite cuando un jugador coloca una carta de Misión en su zona de misión. */
  QuestPlaced = "QuestPlaced",

  /** Se emite cuando el progreso de una misión activa avanza. */
  QuestProgressUpdated = "QuestProgressUpdated",

  /** Se emite cuando una misión se completa y se activa su recompensa. */
  QuestCompleted = "QuestCompleted",

  // -- Crossover y mazo (M5 Crossover) ---------------------------------------
  /** Se emite al activar la mecánica Crossover (robo de carta del mazo rival). */
  CrossoverActivated = "CrossoverActivated",

  /** Se emite cuando un jugador roba una carta del mazo y entra en su mano. */
  CardDrawn = "CardDrawn",

  /** Se emite cuando un jugador intenta robar de un mazo vacío (fatiga). */
  DeckEmpty = "DeckEmpty",
}

// ---------------------------------------------------------------------------
// 2. Tipos de payload por evento
// ---------------------------------------------------------------------------

// -- Partida -----------------------------------------------------------------

/** Payload de {@link GameEvent.MatchStarted}. */
export interface MatchStartedPayload {
  /** ID del primer jugador (turno inicial). */
  readonly player1Id: PlayerId;
  /** ID del segundo jugador. */
  readonly player2Id: PlayerId;
}

/** Payload de {@link GameEvent.MatchEnded}. */
export interface MatchEndedPayload {
  /** ID del jugador que ha ganado. `null` solo en caso de empate técnico. */
  readonly winnerId: PlayerId | null;
  /** ID del jugador que ha perdido. `null` solo en caso de empate técnico. */
  readonly loserId: PlayerId | null;
  /** Indica si la partida terminó en empate (ej. ambos héroes mueren a la vez). */
  readonly isDraw: boolean;
}

// -- Turno y fases -----------------------------------------------------------

/** Fase del turno. Refleja las 4 fases de la máquina de estados (§4.1). */
export type TurnPhase = "draw" | "main" | "combat" | "end";

/** Payload de {@link GameEvent.TurnStarted}. */
export interface TurnStartedPayload {
  /** ID del jugador cuyo turno comienza. */
  readonly playerId: PlayerId;
  /** Número de turno global de la partida (comienza en 1). */
  readonly turnNumber: number;
  /** Fase en la que comienza el turno (siempre "draw"). */
  readonly phase: TurnPhase;
}

/** Payload de {@link GameEvent.TurnEnded}. */
export interface TurnEndedPayload {
  /** ID del jugador cuyo turno acaba de finalizar. */
  readonly playerId: PlayerId;
  /** Número de turno global que ha finalizado. */
  readonly turnNumber: number;
}

/** Payload de {@link GameEvent.PhaseChanged}. */
export interface PhaseChangedPayload {
  /** ID del jugador activo en el momento del cambio de fase. */
  readonly playerId: PlayerId;
  /** Fase anterior. */
  readonly previousPhase: TurnPhase;
  /** Nueva fase activa. */
  readonly newPhase: TurnPhase;
}

// -- Cartas jugadas ----------------------------------------------------------

/** Payload de {@link GameEvent.CardPlayed}. */
export interface CardPlayedPayload {
  /** ID del jugador que ha jugado la carta. */
  readonly playerId: PlayerId;
  /** ID de instancia de la carta jugada. */
  readonly cardId: CardId;
  /** ID estático de la carta (ej. "LIC-001"). Útil para logging. */
  readonly staticId: CardId;
  /**
   * ID de la zona destino (solo para Personajes que se colocan en tablero).
   * `undefined` para Hechizos e Ítems.
   */
  readonly zoneId?: string;
}

/** Payload de {@link GameEvent.CharacterSummoned}. */
export interface CharacterSummonedPayload {
  /** ID del jugador que invoca el Personaje. */
  readonly playerId: PlayerId;
  /** Entidad Character recién colocada en el tablero. */
  readonly character: Character;
  /** ID de la zona donde se ha colocado el Personaje. */
  readonly zoneId: string;
}

/** Payload de {@link GameEvent.SpellCast}. */
export interface SpellCastPayload {
  /** ID del jugador que lanza el Hechizo. */
  readonly playerId: PlayerId;
  /** Entidad Spell lanzada. */
  readonly spell: Spell;
  /**
   * ID del objetivo del Hechizo.
   * Puede ser el `instanceId` de un Personaje, el `staticId` de un héroe,
   * o `undefined` si el hechizo no tiene objetivo (ej. efecto de área).
   */
  readonly targetId: string | undefined;
}

/** Payload de {@link GameEvent.ItemEquipped}. */
export interface ItemEquippedPayload {
  /** ID del jugador que equipa el Objeto. */
  readonly playerId: PlayerId;
  /** Entidad Item equipada al héroe. */
  readonly item: Item;
  /**
   * ID del objetivo al que se equipa el objeto.
   * Normalmente el `staticId` del héroe aliado (ej. "HERO-001").
   */
  readonly targetId: string;
}

// -- Combate -----------------------------------------------------------------

/** Payload de {@link GameEvent.AttackDeclared}. */
export interface AttackDeclaredPayload {
  /**
   * `instanceId` del Personaje atacante.
   * (Los héroes no pueden declarar ataques en esta versión.)
   */
  readonly attackerId: string;
  /**
   * `instanceId` del Personaje defensor, o `staticId` del héroe defensor.
   */
  readonly defenderId: string;
}

/** Payload de {@link GameEvent.AttackResolved}. */
export interface AttackResolvedPayload {
  /** `instanceId` del atacante. */
  readonly attackerId: string;
  /** `instanceId` del defensor (Personaje o héroe). */
  readonly defenderId: string;
  /** Daño recibido por el atacante (puede ser 0 si el defensor no ataca). */
  readonly damageToAttacker: number;
  /** Daño recibido por el defensor. */
  readonly damageToDefender: number;
}

/** Causas posibles de destrucción de un Personaje. */
export type CharacterDestroyedCause = "combat" | "spell" | "effect" | "deathrattle";

/** Payload de {@link GameEvent.CharacterDestroyed}. */
export interface CharacterDestroyedPayload {
  /** ID del jugador propietario del Personaje destruido. */
  readonly playerId: PlayerId;
  /** Entidad Character destruida (ya retirada del tablero). */
  readonly character: Character;
  /** Causa de la destrucción. */
  readonly cause: CharacterDestroyedCause;
}

// -- Héroes ------------------------------------------------------------------

/** Payload de {@link GameEvent.HeroDamaged}. */
export interface HeroDamagedPayload {
  /** ID del jugador cuyo héroe recibe daño. */
  readonly playerId: PlayerId;
  /** Cantidad de daño recibido en este evento (siempre > 0). */
  readonly damage: number;
  /** Puntos de vida del héroe después de aplicar el daño. */
  readonly currentHealth: number;
}

/** Payload de {@link GameEvent.HeroHealed}. */
export interface HeroHealedPayload {
  /** ID del jugador cuyo héroe se cura. */
  readonly playerId: PlayerId;
  /** Cantidad de PV recuperados en este evento (siempre > 0). */
  readonly amount: number;
  /** Puntos de vida del héroe después de la curación. */
  readonly currentHealth: number;
}

/** Payload de {@link GameEvent.HeroPowerUsed}. */
export interface HeroPowerUsedPayload {
  /** ID del jugador que usa la habilidad de héroe. */
  readonly playerId: PlayerId;
  /** Snapshot de la habilidad usada (para logging y animaciones). */
  readonly heroPower: IHeroPower;
  /**
   * ID del objetivo de la habilidad.
   * `undefined` si la habilidad no tiene objetivo explícito.
   */
  readonly targetId?: string;
}

// -- Recursos ----------------------------------------------------------------

/** Payload de {@link GameEvent.NostalgiaChanged}. */
export interface NostalgiaChangedPayload {
  /** ID del jugador cuya Nostalgia ha cambiado. */
  readonly playerId: PlayerId;
  /** Nostalgia disponible actual (0 ≤ current ≤ max). */
  readonly current: number;
  /** Nostalgia máxima del turno (crece 1 por turno hasta el límite del PRD). */
  readonly max: number;
}

/** Payload de {@link GameEvent.MomentumChanged}. */
export interface MomentumChangedPayload {
  /** ID del jugador cuyo Momentum ha cambiado. */
  readonly playerId: PlayerId;
  /** Puntos de Momentum actuales acumulados. */
  readonly momentum: number;
  /** Indica si el jugador está actualmente en estado Momentum (vida ≤ 15 PV). */
  readonly isActive: boolean;
}

// -- Tablero y zonas ---------------------------------------------------------

/** Payload de {@link GameEvent.ZoneEnvironmentChanged}. */
export interface ZoneEnvironmentChangedPayload {
  /** ID de la zona cuyo entorno ha cambiado ("left" | "center" | "right"). */
  readonly zoneId: string;
  /**
   * ID del entorno anterior.
   * `null` si la zona no tenía entorno previo (primer cambio de la partida).
   */
  readonly previousEnv: string | null;
  /** ID del nuevo entorno activo. */
  readonly newEnv: string;
}

/** Payload de {@link GameEvent.SynergyUpdated}. */
export interface SynergyUpdatedPayload {
  /** ID del jugador cuyas sinergias se han recalculado. */
  readonly playerId: PlayerId;
  /** Arquetipo cuya sinergia ha cambiado. */
  readonly archetype: Archetype;
  /** Valor del bonus de sinergia activo (0 si no hay sinergia activa). */
  readonly bonus: number;
  /**
   * `instanceId` de los Personajes en tablero que reciben o pierden el bonus.
   */
  readonly affectedCharacterIds: ReadonlyArray<string>;
}

// -- Misiones ----------------------------------------------------------------

/** Payload de {@link GameEvent.QuestPlaced}. */
export interface QuestPlacedPayload {
  /** ID del jugador que coloca la Misión. */
  readonly playerId: PlayerId;
  /** ID estático de la carta de Misión colocada (ej. "QUEST-001"). */
  readonly questId: CardId;
  /** Nombre de la misión para la UI. */
  readonly questName: string;
}

/** Payload de {@link GameEvent.QuestProgressUpdated}. */
export interface QuestProgressUpdatedPayload {
  /** ID del jugador dueño de la Misión. */
  readonly playerId: PlayerId;
  /** ID estático de la Misión activa. */
  readonly questId: CardId;
  /** Progreso actual. */
  readonly current: number;
  /** Progreso objetivo para completar la misión. */
  readonly target: number;
}

/** Payload de {@link GameEvent.QuestCompleted}. */
export interface QuestCompletedPayload {
  /** ID del jugador que ha completado la Misión. */
  readonly playerId: PlayerId;
  /** ID estático de la Misión completada. */
  readonly questId: CardId;
  /**
   * Descripción textual de la recompensa otorgada.
   * El efecto real lo aplica el QuestManager; este payload solo informa.
   */
  readonly reward: string;
}

// -- Crossover y mazo --------------------------------------------------------

/** Payload de {@link GameEvent.CrossoverActivated}. */
export interface CrossoverActivatedPayload {
  /** ID del jugador que activa el Crossover. */
  readonly playerId: PlayerId;
  /** Entidad de la carta robada del mazo rival y añadida a la mano. */
  readonly stolenCard: Character | Spell | Item;
  /**
   * Indica si la carta fue destruida al entrar a la mano (ej. mano llena).
   * Normalmente false; true solo en casos límite de la mecánica.
   */
  readonly wasDestroyed: boolean;
}

/** Payload de {@link GameEvent.CardDrawn}. */
export interface CardDrawnPayload {
  /** ID del jugador que roba la carta. */
  readonly playerId: PlayerId;
  /** Entidad de la carta robada del mazo y añadida a la mano. */
  readonly card: Card;
}

/** Payload de {@link GameEvent.DeckEmpty}. */
export interface DeckEmptyPayload {
  /** ID del jugador cuyo mazo está vacío. */
  readonly playerId: PlayerId;
  /** Daño de fatiga aplicado al héroe en este evento. */
  readonly fatigueDamage: number;
}

// ---------------------------------------------------------------------------
// 3. Mapa tipo→payload (para IEventBus genérico)
// ---------------------------------------------------------------------------

/**
 * Mapa que relaciona cada valor de `GameEvent` con su tipo de payload.
 *
 * Permite al `IEventBus` forzar la coherencia entre el evento emitido y
 * el payload que recibe el handler, sin necesidad de castings explícitos:
 *
 * ```ts
 * // En IEventBus:
 * on<E extends GameEvent>(
 *   event: E,
 *   handler: (payload: GameEventPayloadMap[E]) => void
 * ): Unsubscribe;
 * ```
 *
 * Esto garantiza que, por ejemplo, si se suscribe a `GameEvent.HeroDamaged`,
 * el handler recibe un `HeroDamagedPayload` tipado, sin `as` ni `any`.
 */
export interface GameEventPayloadMap {
  [GameEvent.MatchStarted]: MatchStartedPayload;
  [GameEvent.MatchEnded]: MatchEndedPayload;
  [GameEvent.TurnStarted]: TurnStartedPayload;
  [GameEvent.TurnEnded]: TurnEndedPayload;
  [GameEvent.PhaseChanged]: PhaseChangedPayload;
  [GameEvent.CardPlayed]: CardPlayedPayload;
  [GameEvent.CharacterSummoned]: CharacterSummonedPayload;
  [GameEvent.SpellCast]: SpellCastPayload;
  [GameEvent.ItemEquipped]: ItemEquippedPayload;
  [GameEvent.AttackDeclared]: AttackDeclaredPayload;
  [GameEvent.AttackResolved]: AttackResolvedPayload;
  [GameEvent.CharacterDestroyed]: CharacterDestroyedPayload;
  [GameEvent.HeroDamaged]: HeroDamagedPayload;
  [GameEvent.HeroHealed]: HeroHealedPayload;
  [GameEvent.HeroPowerUsed]: HeroPowerUsedPayload;
  [GameEvent.NostalgiaChanged]: NostalgiaChangedPayload;
  [GameEvent.MomentumChanged]: MomentumChangedPayload;
  [GameEvent.ZoneEnvironmentChanged]: ZoneEnvironmentChangedPayload;
  [GameEvent.SynergyUpdated]: SynergyUpdatedPayload;
  [GameEvent.QuestPlaced]: QuestPlacedPayload;
  [GameEvent.QuestProgressUpdated]: QuestProgressUpdatedPayload;
  [GameEvent.QuestCompleted]: QuestCompletedPayload;
  [GameEvent.CrossoverActivated]: CrossoverActivatedPayload;
  [GameEvent.CardDrawn]: CardDrawnPayload;
  [GameEvent.DeckEmpty]: DeckEmptyPayload;
}
