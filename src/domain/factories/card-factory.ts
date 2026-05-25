import { Card } from "@domain/entities/card";
import { Character, type CharacterProps } from "@domain/entities/character";
import { Spell, type SpellProps } from "@domain/entities/spell";
import { Item, type ItemProps } from "@domain/entities/item";
import { CardType } from "@domain/types/card-types";
import { DomainError } from "@domain/errors/domain-error";
import type { CardData, CharacterData, SpellData, ItemData } from "@domain/types/card-data";

export class CardFactory {
  public static createCard(data: CardData): Card {
    switch (data.type) {
      case CardType.Character:
        return this.createCharacter(data as CharacterData);
      case CardType.Spell:
        return this.createSpell(data as SpellData);
      case CardType.Item:
        return this.createItem(data as ItemData);
      default:
        // Type casting to handle potential invalid inputs from external data
        throw new DomainError(`Unknown card type: ${(data as any).type}`);
    }
  }

  private static createCharacter(data: CharacterData): Character {
    const props: CharacterProps = {
      staticId: data.id,
      name: data.name,
      type: data.type,
      archetype: data.archetype,
      nostalgyCost: data.nostalgyCost,
      rarity: data.rarity,
      description: data.description,
      spriteKey: data.spriteKey,
      greetingText: data.greetingText,
      attack: data.attack,
      health: data.health,
      abilities: data.abilities,
    };
    return new Character(props);
  }

  private static createSpell(data: SpellData): Spell {
    const props: SpellProps = {
      staticId: data.id,
      name: data.name,
      type: data.type,
      archetype: data.archetype,
      nostalgyCost: data.nostalgyCost,
      rarity: data.rarity,
      description: data.description,
      spriteKey: data.spriteKey,
      greetingText: data.greetingText,
      effectType: data.effectType,
      targetType: data.targetType,
      effectValue: data.effectValue,
      drawCount: data.drawCount,
    };
    return new Spell(props);
  }

  private static createItem(data: ItemData): Item {
    const props: ItemProps = {
      staticId: data.id,
      name: data.name,
      type: data.type,
      archetype: data.archetype,
      nostalgyCost: data.nostalgyCost,
      rarity: data.rarity,
      description: data.description,
      spriteKey: data.spriteKey,
      greetingText: data.greetingText,
      targetType: data.targetType,
      statModifier: data.statModifier,
      abilityGranted: data.abilityGranted,
      durability: data.durability,
      onTurnStartEffect: data.onTurnStartEffect,
    };
    return new Item(props);
  }
}
