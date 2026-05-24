/**
 * Entidad base abstracta Card — Crossover Cards
 *
 * Clase raíz de la jerarquía de cartas. Encapsula los atributos comunes a
 * todos los tipos de carta (Character, Spell, Item) y define el contrato
 * que deben cumplir las subclases.
 *
 * Referencia:
 *   - docs/02-architecture.md §3.1.1 (tabla de entidades, Card)
 *   - docs/02-architecture.md §5.1 (esquema JSON CardData)
 *   - docs/02-architecture.md §5.3 (estrategia de identificadores: estático vs UUID)
 *   - docs/02-architecture.md §11.3 (LSP: Character/Spell/Item sustituibles por Card)
 *
 * Decisiones de diseño:
 *   - `instanceId` se genera internamente con `crypto.randomUUID()` para que
 *     cada instancia en partida tenga un ID único, incluso si dos cartas comparten
 *     el mismo `staticId` (ej. dos copias de "LIC-001" en el mazo).
 *   - `staticId` corresponde al campo "id" del JSON (ej. "LIC-001"), útil para
 *     referenciar el tipo de carta en el repositorio.
 *   - Todos los campos son `readonly` porque una carta no muta sus metadatos base.
 *     La lógica de combate (ATQ, VID, modifiers) reside en la subclase Character.
 *   - `clone()` es abstracto: cada subclase sabe cómo copiarse con un nuevo instanceId.
 */

import type { CardId, CardType, Archetype, Rarity } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Propiedades de construcción
// ---------------------------------------------------------------------------

/**
 * Props de entrada para construir cualquier Card.
 * `instanceId` se omite intencionalmente: lo genera el constructor con UUID.
 */
export interface CardProps {
  /** ID estático de la carta tal como aparece en el JSON (ej. "LIC-005"). */
  readonly staticId: CardId;
  readonly name: string;
  readonly type: CardType;
  readonly archetype: Archetype;
  /** Coste de Nostalgia para jugar la carta. Rango válido: 1-7. */
  readonly nostalgyCost: number;
  readonly rarity: Rarity;
  /** Descripción narrativa/mecánica de la carta para la UI. */
  readonly description: string;
  /** Clave del spritesheet de Phaser. Solo se almacena como dato; no se usa en dominio. */
  readonly spriteKey: string;
  /** Texto de saludo que aparece al invocar la carta (easter egg narrativo). */
  readonly greetingText: string;
}

// ---------------------------------------------------------------------------
// Clase abstracta base
// ---------------------------------------------------------------------------

/**
 * Clase base abstracta para todas las cartas del juego.
 *
 * No contiene lógica de combate, turnos ni modificadores: esa responsabilidad
 * pertenece a la subclase `Character` (SRP — Single Responsibility Principle).
 *
 * Jerarquía prevista:
 * ```
 * Card (abstracta)
 *   ├── Character  (ATQ, VID, modifiers, habilidades en tablero)
 *   ├── Spell      (effectType, targetType, effectValue)
 *   └── Item       (statModifier, durability, abilityGranted)
 * ```
 */
export abstract class Card {
  /**
   * Identificador único de la instancia en partida.
   * Generado con `crypto.randomUUID()` en el constructor.
   * Dos cartas con el mismo `staticId` tendrán distintos `instanceId`.
   */
  readonly instanceId: string;

  /** ID estático del tipo de carta (ej. "LIC-005"). */
  readonly staticId: CardId;

  readonly name: string;
  readonly type: CardType;
  readonly archetype: Archetype;

  /** Coste de Nostalgia. */
  readonly nostalgyCost: number;

  readonly rarity: Rarity;
  readonly description: string;
  readonly spriteKey: string;
  readonly greetingText: string;

  constructor(props: CardProps) {
    // UUID v4 generado por la Web Crypto API (disponible en Node 19+ y navegadores modernos)
    this.instanceId = crypto.randomUUID();
    this.staticId = props.staticId;
    this.name = props.name;
    this.type = props.type;
    this.archetype = props.archetype;
    this.nostalgyCost = props.nostalgyCost;
    this.rarity = props.rarity;
    this.description = props.description;
    this.spriteKey = props.spriteKey;
    this.greetingText = props.greetingText;
  }

  /**
   * Devuelve una copia profunda de esta carta con un nuevo `instanceId`.
   * Necesario para instanciar múltiples copias del mismo tipo en partida.
   *
   * Cada subclase concreta es responsable de copiar también sus campos propios.
   */
  abstract clone(): Card;
}
