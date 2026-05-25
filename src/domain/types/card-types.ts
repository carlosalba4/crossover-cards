/**
 * Tipos base del dominio de Crossover Cards.
 *
 * Este módulo define los enums y type aliases fundamentales de la capa de dominio.
 * No tiene ninguna dependencia de Phaser ni de librerías externas.
 *
 * Referencia: docs/02-architecture.md §3.1.1, docs/04-card-catalog.md §2-6 y §9.
 */

// ---------------------------------------------------------------------------
// Identificadores de valor (Value Object aliases)
// ---------------------------------------------------------------------------

/**
 * Identificador único de una carta.
 * Las cartas estáticas usan IDs legibles (ej. "LIC-001").
 * Las instancias en partida usan UUIDs v4 (ej. "550e8400-e29b-41d4-a716-446655440000").
 */
export type CardId = string;

/**
 * Identificador único de un jugador en una partida en curso.
 */
export type PlayerId = string;

// ---------------------------------------------------------------------------
// Tipo de carta
// ---------------------------------------------------------------------------

/**
 * Tipo de carta. Corresponde al campo `"type"` del esquema JSON de cartas
 * y determina la subclase concreta que instancia la CardFactory.
 *
 * - Character: carta de Personaje con ATQ, VID y habilidades en tablero.
 * - Spell:     hechizo de efecto inmediato; no ocupa slot de tablero.
 * - Item:      objeto equipable al héroe con durabilidad y efecto continuo.
 */
export enum CardType {
  Character = "character",
  Spell = "spell",
  Item = "item",
}

// ---------------------------------------------------------------------------
// Rareza
// ---------------------------------------------------------------------------

/**
 * Rareza de una carta. Afecta a la distribución por mazo y al valor percibido.
 *
 * - Common:    Común. 4 cartas en el conjunto de 20 (docs/04 §3.1).
 * - Rare:      Rara. 6 cartas en el conjunto.
 * - Epic:      Épica. 4 cartas en el conjunto.
 * - Legendary: Legendaria. 4 cartas en el conjunto; efectos únicos de alto impacto.
 */
export enum Rarity {
  Common = "Common",
  Rare = "Rare",
  Epic = "Epic",
  Legendary = "Legendary",
}

// ---------------------------------------------------------------------------
// Arquetipo tribal
// ---------------------------------------------------------------------------

/**
 * Arquetipo tribal de una carta. Determina las sinergias del TribalSynergySystem.
 *
 * - CartoonClasico:  mayor bloque tribal del juego (5 Personajes en El Lich).
 * - AventuraMagica:  arquetipo individual; Jake y Marceline son fuertes por sí solos.
 * - AnimeCombate:    tribal de Axel Blaze con Goku y Diamantino.
 * - Sobrenatural:    tribal de complemento con Fantasma Chocala y Agallas.
 * - Neutral:         sin pertenencia tribal; no activa ni bloquea sinergias.
 */
export enum Archetype {
  CartoonClasico = "CartoonClasico",
  AventuraMagica = "AventuraMagica",
  AnimeCombate = "AnimeCombate",
  Sobrenatural = "Sobrenatural",
  Neutral = "Neutral",
}

// ---------------------------------------------------------------------------
// Habilidades de carta (Abilities)
// ---------------------------------------------------------------------------

/**
 * Habilidades que pueden tener los Personajes, Objetos o Hechizos.
 * Son usadas como elementos del array `abilities[]` en la entidad Card.
 *
 * - Charge:          puede atacar el mismo turno que se juega.
 * - Taunt:           obliga a los rivales a atacar a este Personaje antes que a otros.
 * - DivineShield:    absorbe el primer golpe recibido sin daño.
 * - Deathrattle:     activa un efecto al ser destruido el Personaje.
 * - Battlecry:       activa un efecto al entrar al tablero desde la mano.
 * - Lifesteal:       el héroe aliado recupera PV iguales al daño infligido.
 * - RandomModifier:  aplica un Modifier aleatorio de un pool predefinido al jugarse.
 * - SpellImmunity:   inmune a hechizos enemigos (puede ser temporal o permanente).
 * - InverseTaunt:    no puede ser objetivo de ataques mientras haya otro aliado en tablero.
 * - CrystalShield:   el primer daño recibido se reduce a la mitad (redondeado abajo).
 * - Resurrection:    al recibir daño letal, vuelve al tablero una vez con stats fijos.
 */
export enum Ability {
  Charge = "charge",
  Taunt = "taunt",
  DivineShield = "divineShield",
  Deathrattle = "deathrattle",
  Battlecry = "battlecry",
  Lifesteal = "lifesteal",
  RandomModifier = "randomModifier",
  SpellImmunity = "spellImmunity",
  InverseTaunt = "inverseTaunt",
  CrystalShield = "crystalShield",
  Resurrection = "resurrection",
  Poisonous = "poisonous",
  Stealth = "stealth",
}
