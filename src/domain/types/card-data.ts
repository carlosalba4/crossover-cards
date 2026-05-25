import { CardType, Archetype, Rarity, Ability } from "./card-types";

export interface BaseCardData {
  id: string;
  name: string;
  type: CardType;
  archetype: Archetype;
  nostalgyCost: number;
  rarity: Rarity;
  description: string;
  spriteKey: string;
  greetingText: string;
}

export interface CharacterData extends BaseCardData {
  type: CardType.Character;
  attack: number;
  health: number;
  abilities: Ability[];
  abilityMeta?: Record<string, any>;
}

export interface SpellData extends BaseCardData {
  type: CardType.Spell;
  effectType: string;
  targetType: string;
  effectValue: number;
  drawCount?: number;
}

export interface ItemData extends BaseCardData {
  type: CardType.Item;
  targetType: string;
  statModifier: {
    attackBonus: number;
    healthBonus: number;
  };
  abilityGranted: Ability | null;
  durability: number;
  onTurnStartEffect?: {
    type: string;
    value: number;
  };
  onPlayChoiceEffect?: Record<string, any>;
  onActivateEffect?: Record<string, any>;
  heroAbilityOverrideOptions?: any[];
}

export type CardData = CharacterData | SpellData | ItemData;

export interface DeckData {
  id: string;
  name: string;
  heroId: string;
  cards: { cardId: string; quantity: number }[];
}

export interface HeroData {
  id: string;
  name: string;
  archetype: Archetype;
  maxHealth: number;
  heroPower: {
    name: string;
    cost: number;
    effectType: string;
    targetType: string;
    value: number;
    duration?: string;
  };
}
