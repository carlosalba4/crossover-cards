import Phaser from "phaser";
import { Button } from "@presentation/ui/button";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface HeroViewData {
  id: string;
  name: string;
  spriteKey: string;
  archetype: string;
  maxHealth: number;
  heroPower: { name: string; cost: number };
}

// ---------------------------------------------------------------------------
// Constantes de diseño
// ---------------------------------------------------------------------------

const COLOR_TEAL = 0x3ecfcf;
const COLOR_DANGER = 0xff3b3b;

const TEXT_COLOR_DANGER = "#FF3B3B";
const TEXT_COLOR_WARN = "#F5A623";
const TEXT_COLOR_OK = "#4CAF6E";
const COLOR_BG_SURFACE = 0x252240;

const ARCHETYPE_COLOR: Record<string, number> = {
  CartoonClasico: 0xff6b35,
  AventuraMagica: 0x7b4fdb,
  AnimeCombate: 0xe83e3e,
  Sobrenatural: 0x39d98a,
  Neutral: 0x8c9099,
};

// -- Dimensiones del retrato del héroe ---------------------------------------

/** Lado del retrato cuadrado del héroe, en px. */
const PORTRAIT_SIZE = 64;
/** Centro del retrato (para posicionar imagen/placeholder), en px. */
const PORTRAIT_CENTER = PORTRAIT_SIZE / 2;
/** Radio de las esquinas redondeadas del retrato y borde, en px. */
const PORTRAIT_RADIUS = 6;
/** Desplazamiento del glow respecto al borde del retrato, en px. */
const GLOW_OFFSET = 2;
/** Lado del glow (retrato + margen a ambos lados), en px. */
const GLOW_SIZE = PORTRAIT_SIZE + GLOW_OFFSET * 2;
/** Radio de las esquinas del glow, en px. */
const GLOW_RADIUS = 8;
/** Posición X del icono de corazón del contador de vida, en px. */
const HEALTH_ICON_X = 76;
/** Posición X del texto numérico de vida, en px. */
const HEALTH_TEXT_X = 104;

// ---------------------------------------------------------------------------
// Clase HeroView
// ---------------------------------------------------------------------------

export class HeroView extends Phaser.GameObjects.Container {
  private currentHealthVal: number;

  // Capas visuales
  private portraitBorder: Phaser.GameObjects.Graphics;
  private activeGlow: Phaser.GameObjects.Graphics;
  private dangerGlow: Phaser.GameObjects.Graphics;
  private portraitImg: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  private powerIconPlaceholder: Phaser.GameObjects.Text;
  /** Flash rojo de daño reutilizable (pre-instanciado para evitar fugas). */
  private readonly damageFlash: Phaser.GameObjects.Graphics;

  // UI
  private healthIcon: Phaser.GameObjects.Text;
  private healthText: Phaser.GameObjects.Text;
  private heroPowerBtn: Button | null = null;

  // Tweens
  private activeTween: Phaser.Tweens.Tween | null = null;
  private dangerTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, heroData: HeroViewData, isPlayer: boolean) {
    super(scene, 0, 0);
    this.currentHealthVal = heroData.maxHealth;

    // 1. Glow activo (Teal)
    this.activeGlow = scene.add.graphics();
    this.activeGlow.lineStyle(4, COLOR_TEAL, 1);
    this.activeGlow.strokeRoundedRect(
      -GLOW_OFFSET,
      -GLOW_OFFSET,
      GLOW_SIZE,
      GLOW_SIZE,
      GLOW_RADIUS,
    );
    this.activeGlow.setAlpha(0);

    // 2. Glow peligro (Rojo)
    this.dangerGlow = scene.add.graphics();
    this.dangerGlow.lineStyle(4, COLOR_DANGER, 1);
    this.dangerGlow.strokeRoundedRect(
      -GLOW_OFFSET,
      -GLOW_OFFSET,
      GLOW_SIZE,
      GLOW_SIZE,
      GLOW_RADIUS,
    );
    this.dangerGlow.setAlpha(0);

    // 3. Borde normal
    const borderColor = ARCHETYPE_COLOR[heroData.archetype] || 0xffffff;
    this.portraitBorder = scene.add.graphics();
    this.portraitBorder.lineStyle(3, borderColor, 1);
    this.portraitBorder.strokeRoundedRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE, PORTRAIT_RADIUS);

    // 4. Retrato
    if (scene.textures.exists(heroData.spriteKey)) {
      this.portraitImg = scene.add
        .image(PORTRAIT_CENTER, PORTRAIT_CENTER, heroData.spriteKey)
        .setDisplaySize(PORTRAIT_SIZE, PORTRAIT_SIZE);
    } else {
      this.portraitImg = scene.add.graphics();
      this.portraitImg.fillStyle(COLOR_BG_SURFACE, 1);
      this.portraitImg.fillRoundedRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE, PORTRAIT_RADIUS);
      const nameTxt = scene.add
        .text(PORTRAIT_CENTER, PORTRAIT_CENTER, heroData.name.substring(0, 3).toUpperCase(), {
          fontFamily: "Bangers",
          fontSize: "20px",
          color: "#F0EAD6",
        })
        .setOrigin(0.5);
      this.add(nameTxt);
    }

    // Icono placeholder para playHeroPowerAnimation
    this.powerIconPlaceholder = scene.add
      .text(PORTRAIT_CENTER, PORTRAIT_CENTER, "⚡", {
        fontFamily: "system-ui",
        fontSize: "32px",
        color: "#F5C842",
      })
      .setOrigin(0.5);
    this.powerIconPlaceholder.setAlpha(0);

    // Flash de daño reutilizable (evita crear/destruir Graphics en cada golpe)
    this.damageFlash = scene.add.graphics();
    this.damageFlash.fillStyle(COLOR_DANGER, 0.4);
    this.damageFlash.fillRoundedRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE, PORTRAIT_RADIUS);
    this.damageFlash.setAlpha(0);

    // 5. Contador de Vida
    this.healthIcon = scene.add
      .text(HEALTH_ICON_X, PORTRAIT_CENTER, "❤", {
        fontFamily: "system-ui",
        fontSize: "24px",
        color: TEXT_COLOR_OK,
      })
      .setOrigin(0, 0.5);

    this.healthText = scene.add
      .text(HEALTH_TEXT_X, PORTRAIT_CENTER, String(heroData.maxHealth), {
        fontFamily: "Bangers",
        fontSize: "28px",
        color: TEXT_COLOR_OK,
      })
      .setOrigin(0, 0.5);

    // Ensamblar contenedor
    this.add([
      this.activeGlow,
      this.dangerGlow,
      this.portraitBorder,
      this.portraitImg,
      this.damageFlash,
      this.healthIcon,
      this.healthText,
      this.powerIconPlaceholder,
    ]);

    // 6. Botón de poder (solo jugador)
    if (isPlayer) {
      this.heroPowerBtn = new Button({
        scene,
        x: 180,
        y: 32,
        width: 80,
        height: 40,
        label: "PODER",
        backgroundColor: COLOR_BG_SURFACE,
        textColor: "#F5C842",
        fontSize: "18px",
        onClick: () => {
          this.emit("heroPowerClicked");
        },
      });
      this.add(this.heroPowerBtn);
    }

    scene.add.existing(this);
  }

  // -------------------------------------------------------------------------
  // Métodos Públicos
  // -------------------------------------------------------------------------

  /**
   * Actualiza la vida mostrada y cambia colores o anima si bajó.
   */
  updateHealth(current: number, max: number): void {
    const tookDamage = current < this.currentHealthVal;
    this.currentHealthVal = current;

    this.healthText.setText(String(current));

    const ratio = current / max;
    let colorHex = TEXT_COLOR_OK;
    let isDanger = false;

    if (ratio < 0.3) {
      colorHex = TEXT_COLOR_DANGER;
      isDanger = true;
    } else if (ratio <= 0.6) {
      colorHex = TEXT_COLOR_WARN;
    }

    this.healthText.setColor(colorHex);
    this.healthIcon.setColor(colorHex);

    if (tookDamage) {
      // Tween de daño en el texto (cae 8px y rebota)
      this.scene.tweens.add({
        targets: [this.healthText, this.healthIcon],
        y: "+=8",
        yoyo: true,
        duration: 150,
        ease: "Quad.easeOut",
      });

      // Flash feedback-damage en el retrato (reutiliza el Graphics pre-instanciado)
      this.scene.tweens.killTweensOf(this.damageFlash);
      this.damageFlash.setAlpha(0.4);
      this.scene.tweens.add({
        targets: this.damageFlash,
        alpha: 0,
        duration: 300,
      });
    }

    // Gestionar glow de peligro
    if (isDanger && !this.dangerTween) {
      this.dangerGlow.setAlpha(1);
      this.dangerTween = this.scene.tweens.add({
        targets: this.dangerGlow,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else if (!isDanger && this.dangerTween) {
      this.dangerTween.stop();
      this.dangerTween = null;
      this.dangerGlow.setAlpha(0);
    }
  }

  /**
   * Activa o desactiva el glow de turno activo.
   */
  setActiveTurn(active: boolean): void {
    if (active) {
      if (!this.activeTween) {
        this.activeGlow.setAlpha(1);
        this.activeTween = this.scene.tweens.add({
          targets: this.activeGlow,
          alpha: 0.4,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    } else {
      if (this.activeTween) {
        this.activeTween.stop();
        this.activeTween = null;
      }
      this.activeGlow.setAlpha(0);
    }
  }

  /**
   * Habilita o deshabilita el botón de héroe.
   */
  setHeroPowerEnabled(enabled: boolean): void {
    if (this.heroPowerBtn) {
      this.heroPowerBtn.setDisabled(!enabled);
    }
  }

  /**
   * Animación de uso de habilidad sobre el retrato.
   */
  playHeroPowerAnimation(): void {
    this.powerIconPlaceholder.setAlpha(1);
    this.powerIconPlaceholder.setScale(1);

    this.scene.tweens.add({
      targets: this.powerIconPlaceholder,
      alpha: 0,
      scale: 2,
      duration: 1000,
      ease: "Power2",
    });
  }

  override destroy(fromScene?: boolean): void {
    if (this.activeTween) this.activeTween.stop();
    if (this.dangerTween) this.dangerTween.stop();
    this.scene.tweens.killTweensOf(this.damageFlash);
    this.scene.tweens.killTweensOf([this.healthText, this.healthIcon]);
    super.destroy(fromScene);
  }
}
