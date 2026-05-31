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
/**
 * Color oscuro para los textos del cuerpo de la carta (nombre, tipo y
 * descripción) que se dibujan sobre el fondo claro/beige del frame de rareza,
 * donde el texto claro no contrasta.
 */
const COLOR_TEXT_ON_FRAME = "#1A1A1A";
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
  /** Lado del retrato cuadrado (centrado), contenido dentro del marco. */
  portraitW: number;
  portraitH: number;
  /** Centro vertical del retrato (relativo al centro de la carta). */
  artCenterY: number;
  /** Margen interior seguro respecto al borde de la carta (holgura del frame). */
  pad: number;
  /** Y de la fila de stats (números e iconos de ATQ/VID). */
  statY: number;
  /** Lado de los iconos de stat (icon-attack / icon-health). */
  statIconSize: number;
  borderThickness: number;
  archetypeBandW: number;
  costCircleR: number;
  nameFontSize: string;
  statFontSize: string;
  typeFontSize: string;
}

const HAND_DIMS: CardDimensions = {
  width: 80,
  height: 112,
  portraitW: 44,
  portraitH: 44,
  artCenterY: 8,
  pad: 8,
  statY: 41,
  statIconSize: 10,
  borderThickness: 3,
  archetypeBandW: 6,
  costCircleR: 13,
  nameFontSize: "11px",
  statFontSize: "12px",
  typeFontSize: "9px",
};

const BOARD_DIMS: CardDimensions = {
  width: 72,
  height: 96,
  // En tablero no hay nombre ni tipo, así que el arte puede ser mayor y ocupar
  // el centro de la carta.
  portraitW: 50,
  portraitH: 50,
  artCenterY: -2,
  pad: 7,
  statY: 35,
  statIconSize: 8,
  borderThickness: 2,
  archetypeBandW: 5,
  costCircleR: 11,
  nameFontSize: "0px", // no se muestra nombre en tablero
  statFontSize: "11px",
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
// Texto
// ---------------------------------------------------------------------------

/** Carácter de elipsis usado al recortar el nombre si no cabe en la carta. */
const ELLIPSIS = "…";

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
  /** Texto del tipo de carta. */
  private readonly typeText: Phaser.GameObjects.Text;
  /** Gráfico del borde seleccionado (teal glow). */
  private readonly selectedBorder: Phaser.GameObjects.Graphics;
  /** Overlay de disabled (semitransparente). */
  private readonly disabledOverlay: Phaser.GameObjects.Graphics;
  /** Marco decorativo de rareza (frame-<rarity>) o null si no hay asset. */
  private readonly frame: Phaser.GameObjects.Image | null;
  /** Icono de ataque junto al número de ATQ (solo Character) o null. */
  private readonly atkIcon: Phaser.GameObjects.Image | null;
  /** Icono de vida junto al número de VID (solo Character) o null. */
  private readonly vidIcon: Phaser.GameObjects.Image | null;

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
    this.typeText = this.buildTypeText(scene);
    this.selectedBorder = scene.add.graphics();
    this.disabledOverlay = this.buildDisabledOverlay(scene);

    // Marco de rareza (sprite) e iconos de stats — solo si el asset existe;
    // en caso contrario se conservan los placeholders dibujados con Graphics.
    // Los iconos se anclan a las esquinas inferiores, dentro del margen seguro.
    this.frame = this.buildFrame(scene);
    const d = this._dims;
    const atkIconX = -d.width / 2 + d.pad + d.statIconSize / 2;
    const vidIconX = d.width / 2 - d.pad - d.statIconSize / 2;
    this.atkIcon = this.buildStatIcon(scene, "icon-attack", atkIconX);
    this.vidIcon = this.buildStatIcon(scene, "icon-health", vidIconX);

    // Ensamblar contenedor. El marco va sobre el fondo Graphics pero bajo el
    // retrato y los textos para que estos sigan siendo legibles.
    const layers: Phaser.GameObjects.GameObject[] = [this.cardBg];
    if (this.frame) layers.push(this.frame);
    layers.push(this.portrait, this.nameText, this.costText, this.atkText, this.vidText);
    if (this.atkIcon) layers.push(this.atkIcon);
    if (this.vidIcon) layers.push(this.vidIcon);
    layers.push(this.typeText, this.selectedBorder, this.backLayer, this.disabledOverlay);
    this.add(layers);

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
   * Devuelve los datos inmutables de la carta. Lo usa la escena para alimentar
   * el Tooltip con la descripción completa al hacer hover (Bug D).
   */
  getCardData(): CardData {
    return this._card;
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

  /**
   * Actualiza el valor de ATQ mostrado en la carta y anima un pulso.
   * Solo tiene efecto en cartas de tipo Character (las únicas con ATQ visible).
   * Se colorea en verde cuando el ATQ efectivo supera al base (buff activo).
   *
   * @param current - ATQ efectivo actual a mostrar.
   */
  updateAttack(current: number): void {
    if (this._card.type !== CardType.Character) return;
    const base = this._card.attack ?? 0;
    this.atkText.setText(String(current));
    this.atkText.setColor(current > base ? "#6BFF8E" : "#FF6B6B");
    this.scene.tweens.add({
      targets: this.atkText,
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

    // Zona del retrato (fondo bg-card), centrada y contenida dentro del marco
    this.cardBg.fillStyle(COLOR_BG_CARD, 1);
    this.cardBg.fillRect(
      -d.portraitW / 2,
      d.artCenterY - d.portraitH / 2,
      d.portraitW,
      d.portraitH,
    );

    // Zonas de stats (ATQ inferior izquierda, VID inferior derecha) — Character
    if (this._card.type === CardType.Character) {
      const zoneW = d.statIconSize + 16;
      const zoneH = 16;
      this.cardBg.fillStyle(COLOR_FEEDBACK_DAMAGE, 0.2);
      this.cardBg.fillRect(-halfW + d.pad, d.statY - zoneH / 2, zoneW, zoneH);
      this.cardBg.fillStyle(COLOR_FEEDBACK_OK, 0.2);
      this.cardBg.fillRect(halfW - d.pad - zoneW, d.statY - zoneH / 2, zoneW, zoneH);
    }

    // Círculo del coste (esquina superior izquierda, dentro del margen seguro)
    const costCx = -halfW + d.pad + d.costCircleR;
    const costCy = -halfH + d.pad + d.costCircleR;
    this.cardBg.fillStyle(COLOR_BG_DEEP, 1);
    this.cardBg.fillCircle(costCx, costCy, d.costCircleR);
    this.cardBg.lineStyle(1, COLOR_ACCENT_GOLD, 0.8);
    this.cardBg.strokeCircle(costCx, costCy, d.costCircleR);
  }

  /** Crea el marco decorativo de rareza (frame-<rarity>) si el asset existe. */
  private buildFrame(scene: Phaser.Scene): Phaser.GameObjects.Image | null {
    const key = `frame-${this._card.rarity.toLowerCase()}`;
    if (!scene.textures.exists(key)) return null;
    const d = this._dims;
    const img = scene.add.image(0, 0, key);
    img.setOrigin(0.5, 0.5);
    img.setDisplaySize(d.width, d.height);
    return img;
  }

  /**
   * Crea un icono de stat (icon-attack / icon-health) junto a su número.
   * Devuelve null si la carta no es Personaje o el asset no existe.
   */
  private buildStatIcon(
    scene: Phaser.Scene,
    key: string,
    x: number,
  ): Phaser.GameObjects.Image | null {
    if (this._card.type !== CardType.Character) return null;
    if (!scene.textures.exists(key)) return null;
    const d = this._dims;
    const img = scene.add.image(x, d.statY, key);
    img.setOrigin(0.5, 0.5);
    img.setDisplaySize(d.statIconSize, d.statIconSize);
    return img;
  }

  /**
   * Crea la imagen del retrato (o un Graphics placeholder si falta el asset),
   * centrada horizontalmente y escalada a un cuadrado contenido dentro del marco
   * para que el arte NUNCA sobresalga de la carta.
   */
  private buildPortrait(
    scene: Phaser.Scene,
  ): Phaser.GameObjects.Image | Phaser.GameObjects.Graphics {
    const d = this._dims;
    const portraitX = 0;
    const portraitY = d.artCenterY;

    if (scene.textures.exists(this._card.spriteKey)) {
      const img = scene.add.image(portraitX, portraitY, this._card.spriteKey);
      img.setDisplaySize(d.portraitW, d.portraitH);
      return img;
    }

    // Placeholder: rectángulo del color del arquetipo
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
    const isHand = this._size === CardSize.Hand;
    // +2 para dejar 1px de respiración sobre el borde interior
    const y = -d.height / 2 + d.pad + 2;
    const txt = scene.add.text(0, y, "", {
      fontFamily: "Nunito",
      fontSize: d.nameFontSize,
      fontStyle: "bold",
      color: COLOR_TEXT_ON_FRAME,
      // Stroke negro para legibilidad sobre cualquier fondo del frame
      stroke: "#000000",
      strokeThickness: 2,
    });
    txt.setOrigin(0.5, 0);
    // El nombre evita la zona del círculo de coste (esquina superior izquierda).
    // maxWidth = ancho total menos el diámetro del círculo de coste y su margen
    // derecho, más el pad simétrico del lado derecho.
    if (isHand) {
      const costDiameter = (d.costCircleR + d.pad) * 2;
      const maxWidth = d.width - costDiameter - d.pad;
      txt.setText(this.fitSingleLine(txt, this._card.name, maxWidth));
    } else {
      txt.setText(this._card.name);
    }
    txt.setVisible(isHand);
    return txt;
  }

  private buildCostText(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const d = this._dims;
    const cx = -d.width / 2 + d.pad + d.costCircleR;
    const cy = -d.height / 2 + d.pad + d.costCircleR;
    // Color dorado para máximo contraste sobre el círculo oscuro (COLOR_BG_DEEP).
    // Stroke negro para que el número sea legible incluso si el círculo se
    // superpone con el frame de rareza.
    const txt = scene.add.text(cx, cy, String(this._card.nostalgyCost), {
      fontFamily: "Nunito",
      fontSize: `${d.costCircleR + 1}px`,
      color: "#F5C842",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    txt.setOrigin(0.5, 0.5);
    return txt;
  }

  private buildAtkText(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const d = this._dims;
    const isCharacter = this._card.type === CardType.Character;
    const atk = isCharacter ? String(this._card.attack ?? 0) : "";
    // Anclado a la izquierda, justo a la derecha del icono de ATQ: el número
    // crece hacia el centro y nunca se sale por el borde izquierdo.
    const x = -d.width / 2 + d.pad + d.statIconSize + 3;
    const txt = scene.add.text(x, d.statY, atk, {
      fontFamily: "Nunito",
      fontSize: d.statFontSize,
      color: "#FF6B6B",
      fontStyle: "bold",
    });
    txt.setOrigin(0, 0.5);
    txt.setVisible(isCharacter);
    return txt;
  }

  private buildVidText(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const d = this._dims;
    const isCharacter = this._card.type === CardType.Character;
    const vid = isCharacter ? String(this._card.health ?? 0) : "";
    // Anclado a la derecha, justo a la izquierda del icono de VID: el número
    // crece hacia el centro y nunca se sale por el borde derecho.
    const x = d.width / 2 - d.pad - d.statIconSize - 3;
    const txt = scene.add.text(x, d.statY, vid, {
      fontFamily: "Nunito",
      fontSize: d.statFontSize,
      color: "#6BFF8E",
      fontStyle: "bold",
    });
    txt.setOrigin(1, 0.5);
    txt.setVisible(isCharacter);
    return txt;
  }

  /**
   * Recorta un texto de una sola línea con elipsis para que su anchura
   * renderizada no supere `maxWidth`, evitando que sobresalga de la carta. Si ya
   * cabe, lo devuelve tal cual. La medición usa `txt.width`.
   */
  private fitSingleLine(txt: Phaser.GameObjects.Text, full: string, maxWidth: number): string {
    txt.setText(full);
    if (txt.width <= maxWidth) {
      return full;
    }
    for (let len = full.length - 1; len >= 1; len--) {
      const candidate = full.slice(0, len).trimEnd() + ELLIPSIS;
      txt.setText(candidate);
      if (txt.width <= maxWidth) {
        return candidate;
      }
    }
    return ELLIPSIS;
  }

  private buildTypeText(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const d = this._dims;
    const label = this.resolveTypeLabel();
    // Etiqueta de tipo centrada, justo debajo del nombre (solo en mano).
    // +16 para 1px de respiración extra entre nombre (≈13px alto) y tipo.
    const y = -d.height / 2 + d.pad + 16;
    const txt = scene.add.text(0, y, label, {
      fontFamily: "Nunito",
      fontSize: d.typeFontSize,
      color: COLOR_TEXT_ON_FRAME,
      fontStyle: "bold",
      // Stroke para legibilidad sobre el frame de rareza (claro u oscuro)
      stroke: "#000000",
      strokeThickness: 1,
    });
    txt.setOrigin(0.5, 0);
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
    const isCharacter = this._card.type === CardType.Character;
    this.cardBg.setVisible(showFront);
    this.frame?.setVisible(showFront);
    this.portrait.setVisible(showFront);
    this.nameText.setVisible(showFront && this._size === CardSize.Hand);
    this.costText.setVisible(showFront);
    this.atkText.setVisible(showFront && isCharacter);
    this.vidText.setVisible(showFront && isCharacter);
    this.atkIcon?.setVisible(showFront && isCharacter);
    this.vidIcon?.setVisible(showFront && isCharacter);
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
