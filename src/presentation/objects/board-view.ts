import Phaser from "phaser";
import { ZoneView } from "@presentation/objects/zone-view";
import { CardSprite, CardSize } from "@presentation/objects/card-sprite";
import { drawDashedRect } from "@presentation/utils/graphics-utils";
import type { Archetype, Rarity, CardType } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type BoardZoneId = "left" | "center" | "right" | "free";

/**
 * DTO de presentación con los datos mínimos para renderizar un Personaje en el
 * tablero. Solo propiedades primitivas: desacopla `BoardView` de la entidad de
 * dominio `Character` (que contiene lógica de negocio). La escena es responsable
 * de mapear la entidad de dominio a este DTO.
 */
export interface CharacterBoardData {
  readonly instanceId: string;
  readonly spriteKey: string;
  readonly name: string;
  readonly type: CardType;
  readonly archetype: Archetype;
  readonly rarity: Rarity;
  readonly nostalgyCost: number;
  readonly attack: number;
  readonly currentHealth: number;
  readonly description: string;
}

interface SlotData {
  id: string;
  sprite: CardSprite;
}

// ---------------------------------------------------------------------------
// Clase BoardView
// ---------------------------------------------------------------------------

export class BoardView extends Phaser.GameObjects.Container {
  /**
   * Número máximo de Personajes que caben sin solaparse en una zona del tablero
   * (ancho de zona 160px, ancho de carta de tablero 72px ⇒ 2 slots por zona).
   */
  public static readonly MAX_SLOTS_PER_ZONE = 2;

  private leftZone: ZoneView;
  private centerZone: ZoneView;
  private rightZone: ZoneView;

  private spriteMap: Map<string, CardSprite> = new Map();
  private highlights: Map<string, Phaser.GameObjects.Graphics> = new Map();

  private slots: {
    player: Record<BoardZoneId, SlotData[]>;
    opponent: Record<BoardZoneId, SlotData[]>;
  } = {
    player: { left: [], center: [], right: [], free: [] },
    opponent: { left: [], center: [], right: [], free: [] },
  };

  private boardHeight: number;
  private startX: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    this.boardHeight = height;

    // Configuración de dimensiones
    const zoneWidth = 160;
    const freeSlotWidth = 80;
    const totalContentWidth = zoneWidth * 3 + freeSlotWidth;
    this.startX = (width - totalContentWidth) / 2;

    // Línea divisoria central
    const separator = scene.add.graphics();
    separator.lineStyle(2, 0x252240, 1);
    separator.beginPath();
    separator.moveTo(0, height / 2);
    separator.lineTo(width, height / 2);
    separator.strokePath();
    this.add(separator);

    // Free Slot (sección izquierda)
    const freeGraphics = scene.add.graphics();
    freeGraphics.lineStyle(2, 0x9b96b0, 0.4);
    const freeCenterX = this.startX + freeSlotWidth / 2;
    drawDashedRect(freeGraphics, freeCenterX - 36, height * 0.25 - 48, 72, 96);
    drawDashedRect(freeGraphics, freeCenterX - 36, height * 0.75 - 48, 72, 96);
    this.add(freeGraphics);

    // Zonas
    this.leftZone = new ZoneView(scene, "left", this.startX + freeSlotWidth, 0, zoneWidth, height);
    this.centerZone = new ZoneView(
      scene,
      "center",
      this.startX + freeSlotWidth + zoneWidth,
      0,
      zoneWidth,
      height,
    );
    this.rightZone = new ZoneView(
      scene,
      "right",
      this.startX + freeSlotWidth + zoneWidth * 2,
      0,
      zoneWidth,
      height,
    );

    this.add([this.leftZone, this.centerZone, this.rightZone]);

    scene.add.existing(this);
  }

  // -------------------------------------------------------------------------
  // Métodos Públicos
  // -------------------------------------------------------------------------

  public addCharacterSprite(
    character: CharacterBoardData,
    zoneId: BoardZoneId,
    isPlayer: boolean,
  ): void {
    // Si ya existe, evitamos duplicarlo
    if (this.spriteMap.has(character.instanceId)) return;

    const sprite = new CardSprite(
      this.scene,
      {
        spriteKey: character.spriteKey,
        name: character.name,
        type: character.type,
        archetype: character.archetype,
        rarity: character.rarity,
        nostalgyCost: character.nostalgyCost,
        attack: character.attack,
        health: character.currentHealth,
        description: character.description,
      },
      { size: CardSize.Board },
    );

    const side = isPlayer ? "player" : "opponent";
    const slotIndex = this.slots[side][zoneId].length;
    this.slots[side][zoneId].push({ id: character.instanceId, sprite });
    this.spriteMap.set(character.instanceId, sprite);

    const cy = isPlayer ? this.boardHeight * 0.75 : this.boardHeight * 0.25;
    let cx: number;

    if (zoneId === "free") {
      cx = this.startX + 40;
    } else {
      let zx = this.startX + 80; // offset por freeSlot
      if (zoneId === "center") zx += 160;
      if (zoneId === "right") zx += 320;

      // Cada slot ocupa una posición horizontal propia dentro de la zona
      // (slot 0 → +40, slot 1 → +120, …) para que las cartas no se solapen.
      cx = zx + 40 + slotIndex * 80;
    }

    sprite.setPosition(cx, cy);
    sprite.setScale(0);
    this.add(sprite);

    this.scene.tweens.add({
      targets: sprite,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });
  }

  public getSpriteByInstanceId(instanceId: string): CardSprite | null {
    return this.spriteMap.get(instanceId) ?? null;
  }

  /** Número de Personajes actualmente colocados en una zona de un jugador. */
  public getZoneCount(zoneId: BoardZoneId, isPlayer: boolean): number {
    const side = isPlayer ? "player" : "opponent";
    return this.slots[side][zoneId].length;
  }

  /**
   * Indica si una zona de un jugador ya alcanzó su capacidad visual de slots
   * (no caben más cartas sin solaparse). Lo usa la escena para rechazar drops.
   */
  public isZoneFull(zoneId: BoardZoneId, isPlayer: boolean): boolean {
    return this.getZoneCount(zoneId, isPlayer) >= BoardView.MAX_SLOTS_PER_ZONE;
  }

  public removeCharacterSprite(characterId: string, animate: boolean = true): void {
    const sprite = this.spriteMap.get(characterId);
    if (!sprite) return;

    for (const side of ["player", "opponent"] as const) {
      for (const z of ["left", "center", "right", "free"] as const) {
        this.slots[side][z] = this.slots[side][z].filter((s) => s.id !== characterId);
      }
    }
    this.spriteMap.delete(characterId);

    if (animate) {
      this.scene.tweens.add({
        targets: sprite,
        scale: 0,
        alpha: 0,
        duration: 400,
        ease: "Power2",
        onComplete: () => sprite.destroy(),
      });
    } else {
      sprite.destroy();
    }
  }

  public updateCharacterHealth(characterId: string, current: number, max: number): void {
    const sprite = this.spriteMap.get(characterId);
    if (!sprite) return;

    // CardSprite expone updateHealth() públicamente, respetando el encapsulamiento.
    sprite.updateHealth(current, max);
  }

  public playAttackAnimation(attackerId: string, defenderId: string): void {
    const attacker = this.spriteMap.get(attackerId);
    const defender = this.spriteMap.get(defenderId);
    if (!attacker || !defender) return;

    const startX = attacker.x;
    const startY = attacker.y;
    const targetX = defender.x;
    const targetY = defender.y;

    this.scene.tweens.add({
      targets: attacker,
      x: startX + (targetX - startX) * 0.3,
      y: startY + (targetY - startY) * 0.3,
      duration: 150,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        attacker.setPosition(startX, startY);
      },
    });
  }

  public highlightValidTargets(characterIds: string[]): void {
    this.clearHighlights();

    characterIds.forEach((id) => {
      const sprite = this.spriteMap.get(id);
      if (sprite) {
        const glow = this.scene.add.graphics();
        glow.lineStyle(4, 0x4caf6e, 1);
        glow.strokeRoundedRect(sprite.x - 38, sprite.y - 50, 76, 100, 6);
        this.add(glow);
        this.highlights.set(id, glow);

        this.scene.tweens.add({
          targets: glow,
          alpha: 0.4,
          yoyo: true,
          repeat: -1,
          duration: 600,
          ease: "Sine.easeInOut",
        });
      }
    });
  }

  public clearHighlights(): void {
    this.highlights.forEach((g) => {
      this.scene.tweens.killTweensOf(g);
      g.destroy();
    });
    this.highlights.clear();
  }

  public setZoneEnvironment(
    zoneId: "left" | "center" | "right",
    envData: { iconKey: string; name: string; color: number } | null,
  ): void {
    if (zoneId === "left") this.leftZone.setEnvironment(envData);
    if (zoneId === "center") this.centerZone.setEnvironment(envData);
    if (zoneId === "right") this.rightZone.setEnvironment(envData);
  }
}
