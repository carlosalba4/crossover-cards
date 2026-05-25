import { describe, it, expect } from "vitest";
import { CardFactory } from "@domain/factories/card-factory";
import { CardType, Archetype, Rarity, Ability } from "@domain/types/card-types";
import type { CharacterData, SpellData, ItemData } from "@domain/types/card-data";
import { Character } from "@domain/entities/character";
import { Spell } from "@domain/entities/spell";
import { Item } from "@domain/entities/item";
import { DomainError } from "@domain/errors/domain-error";

describe("CardFactory", () => {
  it("debería instanciar un Character correctamente", () => {
    const data: CharacterData = {
      id: "LIC-005",
      name: "Rigby",
      type: CardType.Character,
      archetype: Archetype.CartoonClasico,
      nostalgyCost: 2,
      rarity: Rarity.Rare,
      description: "Charge",
      spriteKey: "rigby_card",
      greetingText: "YA VOOOY!",
      attack: 3,
      health: 2,
      abilities: [Ability.Charge],
    };

    const card = CardFactory.createCard(data);

    expect(card).toBeInstanceOf(Character);
    expect(card.staticId).toBe("LIC-005");
    expect((card as Character).attack).toBe(3);
    expect((card as Character).health).toBe(2);
    expect((card as Character).abilities).toContain(Ability.Charge);
  });

  it("debería instanciar un Spell correctamente", () => {
    const data: SpellData = {
      id: "LIC-008",
      name: "Cangreburger",
      type: CardType.Spell,
      archetype: Archetype.Neutral,
      nostalgyCost: 2,
      rarity: Rarity.Common,
      description: "Restaura 3 PV al heroe aliado y roba 1 carta.",
      spriteKey: "cangreburger_card",
      greetingText: "El sabor secreto!",
      effectType: "HealAndDraw",
      targetType: "Self",
      effectValue: 3,
      drawCount: 1,
    };

    const card = CardFactory.createCard(data);

    expect(card).toBeInstanceOf(Spell);
    expect(card.staticId).toBe("LIC-008");
    expect((card as Spell).effectType).toBe("HealAndDraw");
    expect((card as Spell).effectValue).toBe(3);
    expect((card as Spell).drawCount).toBe(1);
  });

  it("debería instanciar un Item correctamente", () => {
    const data: ItemData = {
      id: "LIC-010",
      name: "Espada de Sangre de Demonio",
      type: CardType.Item,
      archetype: Archetype.AventuraMagica,
      nostalgyCost: 5,
      rarity: Rarity.Legendary,
      description: "+5 ATQ al heroe.",
      spriteKey: "demon_sword_card",
      greetingText: "Este poder tiene un precio...",
      targetType: "Hero",
      statModifier: { attackBonus: 5, healthBonus: 0 },
      abilityGranted: null,
      durability: 3,
      onTurnStartEffect: {
        type: "DamageOwner",
        value: 1
      }
    };

    const card = CardFactory.createCard(data);

    expect(card).toBeInstanceOf(Item);
    expect(card.staticId).toBe("LIC-010");
    expect((card as Item).targetType).toBe("Hero");
    expect((card as Item).statModifier.attackBonus).toBe(5);
    expect((card as Item).durability).toBe(3);
    expect((card as Item).onTurnStartEffect?.type).toBe("DamageOwner");
  });

  it("debería lanzar un DomainError si el tipo es desconocido", () => {
    const data = {
      id: "ERR-001",
      name: "Error Card",
      type: "invalid_type",
      archetype: Archetype.Neutral,
      nostalgyCost: 1,
      rarity: Rarity.Common,
      description: "Test",
      spriteKey: "test",
      greetingText: "test",
    } as any;

    expect(() => CardFactory.createCard(data)).toThrowError(DomainError);
    expect(() => CardFactory.createCard(data)).toThrowError("Unknown card type: invalid_type");
  });
});
