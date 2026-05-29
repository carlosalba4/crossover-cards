import Phaser from "phaser";
import type { Archetype, Rarity } from "@domain/types/card-types";
import { CardType } from "@domain/types/card-types";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/**
 * Datos mínimos de una carta necesarios para renderizarla.
 * Solo propiedades primitivas — sin dependencia de clases del dominio.
 */
export interface CardData {
  /** Clave del sprite en la caché de Phaser (ej. "card-pops-el-gentil"). */
  readonly spriteKey: string;
  readonly name: string;
  readonly type: CardType;
  readonly archetype: Archetype;
  readonly rarity: Rarity;
  readonly nostalgyCost: number;
  /** Ataque base. Requerido para CardType.Character; ignorado en Spell/Item. */
  readonly attack?: number;
  /** Vida base. Requerido para CardType.Character; ignorado en Spell/Item. */
  readonly health?: number;
  /** Descripción / texto de habilidad (máx. 3 líneas). */
  readonly description: string;
}

/** Tamaño de renderizado de la carta. */
export enum CardSize {
  /** Carta en mano: 80×112px. */
  Hand = "hand",
  /** Carta en tablero: 72×96px. */
  Board = "board",
}

/** Opciones de construcción opcionales para CardSprite. */
export interface CardSpriteOptions {
  /** Tamaño de la carta. Por defecto: Hand. */
  size?: CardSize;
  /** Rotación inicial en grados (abanico en mano). Por defecto: 0. */
  rotation?: number;
  /** Mostrar el reverso de la carta desde el inicio. Por defecto: false. */
  showBack?: boolean;
  /** Comenzar en estado disabled. Por defecto: false. */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Paleta de colores (tokens del doc §2.1)
// ---------------------------------------------------------------------------

/** Colores de borde según rareza (hex numérico Phaser). */
const RARITY_COLOR: Record<Rarity, number> = {
  Common: 0x8c9099,
  Rare: 0x4a9fdb,
  Epic: 0x9b5de5,
  Legendary: 0xf5c842,
};

/** Colores de banda de arquetipo (hex numérico Phaser). */
const ARCHETYPE_COLOR: Record<Archetype, number> = {
  CartoonClasico: 0xff6b35,
  AventuraMagica: 0x7b4fdb,
  AnimeCombate: 0xe83e3e,
  Sobrenatural: 0x39d98a,
  Neutral: 0x8c9099,
};

// Tokens de color globales
const COLOR_BG_DEEP = 0x0d0b1e;
const COLOR_BG_CARD = 0x1a1730;
const COLOR_BG_SURFACE = 0x252240;
const COLOR_TEXT_PRIMARY = "#F0EAD6";
const COLOR_TEXT_SECONDARY = "#9B96B0";
const COLOR_ACCENT_TEAL = 0x3ecfcf;
const COLOR_FEEDBACK_DAMAGE = 0xff3b3b;
const COLOR_FEEDBACK_OK = 0x4caf6e;
const COLOR_ACCENT_GOLD = 0xf5c842;

// ---------------------------------------------------------------------------
// Dimensiones según tamaño
// ---------------------------------------------------------------------------

interface CardDimensions {
  width: number;
  height: number;
  portraitW: number;
  portraitH: number;
  borderThickness: number;
  archetypeBandW: number;
  costCircleR: number;
  nameFontSize: string;
  statFontSize: string;
  descFontSize: string;
  typeFontSize: string;
}

const HAND_DIMS: CardDimensions = {
  width: 80,
  height: 112,
  portraitW: 56,
  portraitH: 64,
  borderThickness: 3,
  archetypeBandW: 6,
  costCircleR: 14,
  nameFontSize: "11px",
  statFontSize: "11px",
  descFontSize: "9px",
  typeFontSize: "9px",
};

const BOARD_DIMS: CardDimensions = {
  width: 72,
  height: 96,
  portraitW: 52,
  portraitH: 52,
  borderThickness: 2,
  archetypeBandW: 5,
  costCircleR: 12,
  nameFontSize: "0px", // no se muestra nombre en tablero
  statFontSize: "11px",
  descFontSize: "0px",
  typeFontSize: "0px",
};

// ---------------------------------------------------------------------------
// Constantes de animación
// ---------------------------------------------------------------------------

const TWEEN_HOVER_MS = 150;
const TWEEN_GLOW_MS = 1000;
const SCALE_HOVER = 1.15;
const HOVER_ELEVATION_PX = 20;
const DISABLED_ALPHA = 0.4;

// ---------------------------------------------------------------------------
// Clase CardSprite
// ---------------------------------------------------------------------------

/**
 * Representación visual completa de una carta en Phaser 4.
 *
 * Extiende `Phaser.GameObjects.Container` y gestiona todos los estados
 * visuales: default, hover, seleccionada, arrastrada, disabled y reverso.
 *
 * Referencia de diseño: docs/05-ui-design.md §4.1, §5.1, §5.2.
 * Referencia arquitectura: docs/02-architecture.md §3.4.2.
 *
 * @example
 * ```ts
 * const sprite = new CardSprite(scene, cardData, { size: CardSize.Hand });
 * scene.add.existing(sprite);
 * sprite.setPosition(400, 600);
 * ```
 */
export class CardSprite extends Phaser.GameObjects.Container {
  // -------------------------------------------------------------------------
  // Propiedades de estado
  // -------------------------------------------------------------------------

  private _disabled: boolean;
  private _showBack: boolean;
  private _selected: boolean;
  private _baseY = 0;
  private _isHovering = false;
  private readonly _size: CardSize;
  private readonly _dims: CardDimensions;
  private readonly _card: CardData;

  // -------------------------------------------------------------------------
  // Hijos internos
  // -------------------------------------------------------------------------

  /** Capa de fondo y borde de la carta (Graphics). */
  private readonly cardBg: Phaser.GameObjects.Graphics;
  /** Imagen del retrato del personaje (o Graphics placeholder). */
  private portrait: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  /** Overlay del reverso (Graphics o Image). */
  private readonly backLayer: Phaser.GameObjects.Graphics;
  /** Texto del nombre de la carta. */
  private readonly nameText: Phaser.GameObjects.Text;
  /** Texto del coste de Nostalgia. */
  private readonly costText: Phaser.GameObjects.Text;
  /** Texto del valor de ATQ. */
  private readonly atkText: Phaser.GameObjects.Text;
  /** Texto del valor de VID. */
  private readonly vidText: Phaser.GameObjects.Text;
  /** Texto de descripción / habilidad. */
  private readonly descText: Phaser.GameObjects.Text;
  /** Texto del tipo de carta. */
  private readonly typeText: Phaser.GameObjects.Text;
  /** Gráfico del borde seleccionado (teal glow). */
  private readonly selectedBorder: Phaser.GameObjects.Graphics;
  /** Overlay de disabled (semitransparente). */
  private readonly disabledOverlay: Phaser.GameObjects.Graphics;

  /** Tween del glow pulsante en estado seleccionada. */
  private glowTween: Phaser.Tweens.Tween | null = null;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  /**
   * @param scene  - Escena Phaser a la que pertenece.
   * @param card   - Datos de la carta a representar.
   * @param options - Opciones de personalización visual.
   */
  constructor(scene: Phaser.Scene, card: CardData, options: CardSpriteOptions = {}) {
    super(scene, 0, 0);

    this._card = card;
    this._size = options.size ?? CardSize.Hand;
    this._dims = this._size === CardSize.Board ? BOARD_DIMS : HAND_DIMS;
    this._disabled = options.disabled ?? false;
    this._showBack = options.showBack ?? false;
    this._selected = false;

    // -- Construir capas en orden (fondo → portrait → ui → efectos) --
    this.cardBg = scene.add.graphics();
    this.portrait = this.buildPortrait(scene);
    this.backLayer = this.buildBackLayer(scene);

    this.nameText = this.buildNameText(scene);
    this.costText = this.buildCostText(scene);
    this.atkText = this.buildAtkText(scene);
    this.vidText = this.buildVidText(scene);
    this.descText = this.buildDescText(scene);
    this.typeText = this.buildTypeText(scene);
    this.selectedBorder = scene.add.graphics();
    this.disabledOverlay = this.buildDisabledOverlay(scene);

    // Ensamblar contenedor
    this.add([
      this.cardBg,
      this.portrait,
      this.nameText,
      this.costText,
      this.atkText,
      this.vidText,
      this.descText,
      this.typeText,
      this.selectedBorder,
      this.backLayer,
      this.disabledOverlay,
    ]);

    // Tamaño del hit-area del contenedor
    this.setSize(this._dims.width, this._dims.height);

    // Dibujar cara/reverso inicial
    this.drawCardFace();
    this.applyRotation(options.rotation ?? 0);
    this.syncBackVisibility();

    // Interactividad
    this.setInteractive({ useHandCursor: true });
    this.bindPointerEvents();

    // Estados iniciales
    if (this._disabled) {
      this.applyDisabledVisual(true);
    }

    // Registrar en la escena
    scene.add.existing(this);
  }

  // -------------------------------------------------------------------------
  // API pública
  // -------------------------------------------------------------------------

  /**
   * Habilita o deshabilita la carta visualmente e interactivamente.
   * @param disabled `true` para deshabilitar.
   */
  setDisabled(disabled: boolean): void {
    this._disabled = disabled;
    this.applyDisabledVisual(disabled);
    if (disabled) {
      this.disableInteractive();
    } else {
      this.setInteractive({ useHandCursor: true });
    }
  }

  /**
   * Muestra u oculta el reverso de la carta (para la mano del rival).
   * @param show `true` para mostrar el reverso.
   */
  showBack(show: boolean): void {
    this._showBack = show;
    this.syncBackVisibility();
  }

  /**
   * Activa o desactiva el estado de "seleccionada" con glow teal pulsante.
   * @param selected `true` para activar el glow.
   */
  setSelected(selected: boolean): void {
    if (this._selected === selected) return;
    this._selected = selected;

    if (selected) {
      this.startGlowTween();
    } else {
      this.stopGlowTween();
    }
  }

  /** Indica si la carta está actualmente seleccionada. */
  get isSelected(): boolean {
    return this._selected;
  }

  /** Indica si la carta está actualmente disabled. */
  get isDisabled(): boolean {
    return this._disabled;
  }

  /**
   * Actualiza la posición de reposo de la carta y cancela cualquier hover activo.
   * Llamar desde HandView.rearrange() antes de animar a la nueva posición.
   */
  setRestPosition(baseY: number): void {
    this._baseY = baseY;
    this._isHovering = false;
  }

  /**
   * Actualiza el valor de VID mostrado en la carta y anima un golpe.
   * Solo tiene efecto en cartas de tipo Character (las únicas con VID visible).
   *
   * @param current - Vida actual a mostrar.
   * @param max     - Vida máxima (para colorear: rojo si está dañada, verde si plena).
   */
  updateHealth(current: number, max: number): void {
    if (this._card.type !== CardType.Character) return;
    this.vidText.setText(String(current));
    this.vidText.setColor(current < max ? "#FF3B3B" : "#6BFF8E");
    this.scene.tweens.add({
      targets: this.vidText,
      scale: 1.5,
      duration: 150,
      yoyo: true,
    });
  }

  // -------------------------------------------------------------------------
  // Construcción de capas internas
  // -------------------------------------------------------------------------

  /**
   * Dibuja el fondo y borde de la carta usando Graphics.
   * El origen del contenedor es (0.5, 0.5) ⇒ todo se dibuja relativo al centro.
   */
  private drawCardFace(): void {
    const d = this._dims;
    const halfW = d.width / 2;
    const halfH = d.height / 2;
    const rarity = this._card.rarity;
    const archetype = this._card.archetype;

    this.cardBg.clear();

    // Borde exterior según rareza
    this.cardBg.fillStyle(RARITY_COLOR[rarity], 1);
    this.cardBg.fillRoundedRect(-halfW, -halfH, d.width, d.height, 4);

    // Fondo interior de la carta
    this.cardBg.fillStyle(COLOR_BG_SURFACE, 1);
    this.cardBg.fillRoundedRect(
      -halfW + d.borderThickness,
      -halfH + d.borderThickness,
      d.width - d.borderThickness * 2,
      d.height - d.borderThickness * 2,
      3,
    );

    // Banda de arquetipo (lateral izquierda)
    this.cardBg.fillStyle(ARCHETYPE_COLOR[archetype], 1);
    this.cardBg.fillRect(
      -halfW + d.borderThickness,
      -halfH + d.borderThickness,
      d.archetypeBandW,
      d.height - d.borderThickness * 2,
    );

    // Zona del retrato (fondo bg-card)
    const portraitAreaX = -halfW + d.archetypeBandW + d.borderThickness;
    const portraitAreaY = -halfH + d.borderThickness + (this._size === CardSize.Hand ? 18 : 2);
    const portraitAreaW = d.width - d.archetypeBandW - d.borderThickness * 2;

    this.cardBg.fillStyle(COLOR_BG_CARD, 1);
    this.cardBg.fillRect(portraitAreaX, portraitAreaY, portraitAreaW, d.portraitH);

    // Zona ATQ (triángulo-ish, inferior izquierda) — solo Character
    if (this._card.type === CardType.Character) {
      this.cardBg.fillStyle(COLOR_FEEDBACK_DAMAGE, 0.2);
      this.cardBg.fillRect(
        -halfW + d.archetypeBandW + d.borderThickness,
        halfH - 22,
        (d.width - d.archetypeBandW - d.borderThickness * 2) / 2,
        16,
      );

      // Zona VID (triángulo-ish, inferior derecha)
      this.cardBg.fillStyle(COLOR_FEEDBACK_OK, 0.2);
      this.cardBg.fillRect(
        halfW - (d.width - d.archetypeBandW - d.borderThickness * 2) / 2 - d.borderThickness,
        halfH - 22,
        (d.width - d.archetypeBandW - d.borderThickness * 2) / 2,
        16,
      );
    }

    // Círculo del coste (superior izquierda)
    this.cardBg.fillStyle(COLOR_BG_DEEP, 1);
    this.cardBg.fillCircle(
      -halfW + d.archetypeBandW + d.borderThickness + d.costCircleR,
      -halfH + d.borderThickness + d.costCircleR,
      d.costCircleR,
    );
    this.cardBg.lineStyle(1, COLOR_ACCENT_GOLD, 0.8);
    this.cardBg.strokeCircle(
      -halfW + d.archetypeBandW + d.borderThickness + d.costCircleR,
      -halfH + d.borderThickness + d.costCircleR,
      d.costCircleR,
    );
  }

  /** Crea la imagen del retrato o un Graphics placeholder si falta el asset. */
  private buildPortrait(
    scene: Phaser.Scene,
  ): Phaser.GameObjects.Image | Phaser.GameObjects.Graphics {
    const d = this._dims;
    const portraitY =
      -d.height / 2 + d.borderThickness + (this._size === CardSize.Hand ? 18 : 2) + d.portraitH / 2;
    const portraitX =
      (d.archetypeBandW + d.borderThickness) / 2 +
      (d.width - d.archetypeBandW - d.borderThickness * 2) / 2 -
      d.width / 2 +
      d.archetypeBandW +
      d.borderThickness;

    if (scene.textures.exists(this._card.spriteKey)) {
      const img = scene.add.image(portraitX, portraitY, this._card.spriteKey);
      img.setDisplaySize(d.portraitW, d.portraitH);
      return img;
    }

    // Placeholder: rectángulo del color del arquetipo con texto del nombre
    const gfx = scene.add.graphics();
    gfx.fillStyle(ARCHETYPE_COLOR[this._card.archetype], 0.4);
    gfx.fillRect(
      portraitX - d.portraitW / 2,
      portraitY - d.portraitH / 2,
      d.portraitW,
      d.portraitH,
    );
    gfx.lineStyle(1, ARCHETYPE_COLOR[this._card.archetype], 0.8);
    gfx.strokeRect(
      portraitX - d.portraitW / 2,
      portraitY - d.portraitH / 2,
      d.portraitW,
      d.portraitH,
    );
    return gfx;
  }

  /** Construye la capa del reverso (card-back.png o Graphics placeholder #1A1730). */
  private buildBackLayer(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const d = this._dims;
    const halfW = d.width / 2;
    const halfH = d.height / 2;

    const gfx = scene.add.graphics();
    gfx.fillStyle(COLOR_BG_CARD, 1);
    gfx.fillRoundedRect(-halfW, -halfH, d.width, d.height, 4);

    // Logo "CC" centrado
    gfx.lineStyle(2, COLOR_ACCENT_GOLD, 0.9);
    gfx.strokeRoundedRect(-halfW + 2, -halfH + 2, d.width - 4, d.height - 4, 3);

    // Patrón de rombos simple (4 puntos decorativos)
    gfx.fillStyle(COLOR_ACCENT_GOLD, 0.15);
    const step = 12;
    for (let ry = -halfH + 8; ry < halfH - 8; ry += step) {
      for (let rx = -halfW + 8; rx < halfW - 8; rx += step) {
        gfx.fillRect(rx, ry, 3, 3);
      }
    }

    gfx.setVisible(false);
    return gfx;
  }

  /** Overlay semitransparente para el estado disabled. */
  private buildDisabledOverlay(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const d = this._dims;
    const gfx = scene.add.graphics();
    gfx.fillStyle(0x000000, 0.5);
    gfx.fillRoundedRect(-d.width / 2, -d.height / 2, d.width, d.height, 4);
    gfx.setVisible(false);
    return gfx;
  }

  // -------------------------------------------------------------------------
  // Construcción de textos
  // -------------------------------------------------------------------------

  private buildNameText(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const d = this._dims;
    const x = d.archetypeBandW / 2 + 2;
    const y = -d.height / 2 + d.borderThickness + 2;
    const txt = scene.add.text(x, y, this._card.name, {
      fontFamily: "Bangers",
      fontSize: d.nameFontSize,
      color: COLOR_TEXT_PRIMARY,
    });
    txt.setOrigin(0, 0);
    txt.setVisible(this._size === CardSize.Hand);
    return txt;
  }

  private buildCostText(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const d = this._dims;
    const cx = -d.width / 2 + d.archetypeBandW + d.borderThickness + d.costCircleR;
    const cy = -d.height / 2 + d.borderThickness + d.costCircleR;
    const txt = scene.add.text(cx, cy, String(this._card.nostalgyCost), {
      fontFamily: "Nunito",
      fontSize: `${d.costCircleR}px`,
      color: COLOR_TEXT_PRIMARY,
      fontStyle: "bold",
    });
    txt.setOrigin(0.5, 0.5);
    return txt;
  }

  private buildAtkText(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const d = this._dims;
    const isCharacter = this._card.type === CardType.Character;
    const atk = isCharacter ? String(this._card.attack ?? 0) : "";
    const halfW = d.width / 2;
    const halfH = d.height / 2;
    const sectionW = (d.width - d.archetypeBandW - d.borderThickness * 2) / 2;
    const x = -halfW + d.archetypeBandW + d.borderThickness + sectionW / 2;
    const txt = scene.add.text(x, halfH - 14, atk, {
      fontFamily: "Nunito",
      fontSize: d.statFontSize,
      color: "#FF6B6B",
      fontStyle: "bold",
    });
    txt.setOrigin(0.5, 0.5);
    txt.setVisible(isCharacter);
    return txt;
  }

  private buildVidText(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const d = this._dims;
    const isCharacter = this._card.type === CardType.Character;
    const vid = isCharacter ? String(this._card.health ?? 0) : "";
    const halfW = d.width / 2;
    const halfH = d.height / 2;
    const sectionW = (d.width - d.archetypeBandW - d.borderThickness * 2) / 2;
    const x = halfW - d.borderThickness - sectionW / 2;
    const txt = scene.add.text(x, halfH - 14, vid, {
      fontFamily: "Nunito",
      fontSize: d.statFontSize,
      color: "#6BFF8E",
      fontStyle: "bold",
    });
    txt.setOrigin(0.5, 0.5);
    txt.setVisible(isCharacter);
    return txt;
  }

  private buildDescText(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const d = this._dims;
    const areaX = -d.width / 2 + d.archetypeBandW + d.borderThickness + 2;
    const areaY = d.height / 2 - 38;
    const areaW = d.width - d.archetypeBandW - d.borderThickness * 2 - 4;

    const txt = scene.add.text(areaX, areaY, this._card.description, {
      fontFamily: "Nunito",
      fontSize: d.descFontSize,
      color: COLOR_TEXT_PRIMARY,
      wordWrap: { width: areaW, useAdvancedWrap: true },
    });
    txt.setOrigin(0, 0);
    txt.setVisible(this._size === CardSize.Hand);
    return txt;
  }

  private buildTypeText(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const d = this._dims;
    const label = this.resolveTypeLabel();
    const txt = scene.add.text(0, d.height / 2 - 6, label, {
      fontFamily: "Nunito",
      fontSize: d.typeFontSize,
      color: COLOR_TEXT_SECONDARY,
      fontStyle: "bold",
    });
    txt.setOrigin(0.5, 1);
    txt.setVisible(this._size === CardSize.Hand);
    return txt;
  }

  private resolveTypeLabel(): string {
    switch (this._card.type) {
      case CardType.Character:
        return "PERSONAJE";
      case CardType.Spell:
        return "HECHIZO";
      case CardType.Item:
        return "OBJETO";
      default:
        return "";
    }
  }

  // -------------------------------------------------------------------------
  // Sincronización de estados visuales
  // -------------------------------------------------------------------------

  /** Muestra u oculta el reverso sincronizando capas. */
  private syncBackVisibility(): void {
    const showFront = !this._showBack;
    this.cardBg.setVisible(showFront);
    this.portrait.setVisible(showFront);
    this.nameText.setVisible(showFront && this._size === CardSize.Hand);
    this.costText.setVisible(showFront);
    this.atkText.setVisible(showFront && this._card.type === CardType.Character);
    this.vidText.setVisible(showFront && this._card.type === CardType.Character);
    this.descText.setVisible(showFront && this._size === CardSize.Hand);
    this.typeText.setVisible(showFront && this._size === CardSize.Hand);
    this.backLayer.setVisible(this._showBack);
  }

  private applyRotation(degrees: number): void {
    this.setAngle(degrees);
  }

  private applyDisabledVisual(disabled: boolean): void {
    if (disabled) {
      this.setAlpha(DISABLED_ALPHA);
      this.disabledOverlay.setVisible(false); // alpha de Container ya lo cubre
    } else {
      this.setAlpha(1);
      this.disabledOverlay.setVisible(false);
    }
  }

  // -------------------------------------------------------------------------
  // Glow pulsante (estado seleccionada)
  // -------------------------------------------------------------------------

  private startGlowTween(): void {
    this.drawSelectedBorder(1);

    this.glowTween = this.scene.tweens.add({
      targets: this.selectedBorder,
      alpha: { from: 0.4, to: 1.0 },
      duration: TWEEN_GLOW_MS,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  private stopGlowTween(): void {
    if (this.glowTween) {
      this.scene.tweens.remove(this.glowTween);
      this.glowTween = null;
    }
    this.selectedBorder.clear();
    this.selectedBorder.setAlpha(1);
  }

  private drawSelectedBorder(alpha: number): void {
    const d = this._dims;
    this.selectedBorder.clear();
    this.selectedBorder.lineStyle(3, COLOR_ACCENT_TEAL, alpha);
    this.selectedBorder.strokeRoundedRect(-d.width / 2, -d.height / 2, d.width, d.height, 4);
    this.selectedBorder.setAlpha(alpha);
  }

  // -------------------------------------------------------------------------
  // Eventos de puntero
  // -------------------------------------------------------------------------

  private bindPointerEvents(): void {
    this.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.onPointerOver();
    });
    this.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.onPointerOut();
    });
  }

  private onPointerOver(): void {
    if (this._disabled || this._showBack) return;
    if (this._isHovering) return; // ya está elevada, no re-elevar
    this._isHovering = true;
    this._baseY = this.y; // guarda posición de reposo
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX: SCALE_HOVER,
      scaleY: SCALE_HOVER,
      y: this._baseY - HOVER_ELEVATION_PX, // posición ABSOLUTA
      angle: 0,
      duration: TWEEN_HOVER_MS,
    });
    this.setDepth(100);
  }

  private onPointerOut(): void {
    if (this._disabled || this._showBack) return;
    if (!this._isHovering) return;
    this._isHovering = false;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.0,
      scaleY: 1.0,
      y: this._baseY, // VUELVE a la posición exacta de reposo
      duration: TWEEN_HOVER_MS,
      ease: "Power1",
    });
    this.setDepth(0);
  }

  // -------------------------------------------------------------------------
  // Ciclo de vida
  // -------------------------------------------------------------------------

  override destroy(fromScene?: boolean): void {
    this.stopGlowTween();
    super.destroy(fromScene);
  }
}
