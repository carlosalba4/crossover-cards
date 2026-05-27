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
    this.activeGlow.strokeRoundedRect(-2, -2, 68, 68, 8);
    this.activeGlow.setAlpha(0);

    // 2. Glow peligro (Rojo)
    this.dangerGlow = scene.add.graphics();
    this.dangerGlow.lineStyle(4, COLOR_DANGER, 1);
    this.dangerGlow.strokeRoundedRect(-2, -2, 68, 68, 8);
    this.dangerGlow.setAlpha(0);

    // 3. Borde normal
    const borderColor = ARCHETYPE_COLOR[heroData.archetype] || 0xffffff;
    this.portraitBorder = scene.add.graphics();
    this.portraitBorder.lineStyle(3, borderColor, 1);
    this.portraitBorder.strokeRoundedRect(0, 0, 64, 64, 6);

    // 4. Retrato
    if (scene.textures.exists(heroData.spriteKey)) {
      this.portraitImg = scene.add.image(32, 32, heroData.spriteKey).setDisplaySize(64, 64);
    } else {
      this.portraitImg = scene.add.graphics();
      this.portraitImg.fillStyle(COLOR_BG_SURFACE, 1);
      this.portraitImg.fillRoundedRect(0, 0, 64, 64, 6);
      const nameTxt = scene.add
        .text(32, 32, heroData.name.substring(0, 3).toUpperCase(), {
          fontFamily: "Bangers",
          fontSize: "20px",
          color: "#F0EAD6",
        })
        .setOrigin(0.5);
      this.add(nameTxt);
    }

    // Icono placeholder para playHeroPowerAnimation
    this.powerIconPlaceholder = scene.add
      .text(32, 32, "⚡", {
        fontFamily: "system-ui",
        fontSize: "32px",
        color: "#F5C842",
      })
      .setOrigin(0.5);
    this.powerIconPlaceholder.setAlpha(0);

    // 5. Contador de Vida
    this.healthIcon = scene.add
      .text(76, 32, "❤", {
        fontFamily: "system-ui",
        fontSize: "24px",
        color: TEXT_COLOR_OK,
      })
      .setOrigin(0, 0.5);

    this.healthText = scene.add
      .text(104, 32, String(heroData.maxHealth), {
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

      // Flash feedback-damage en el retrato
      const flash = this.scene.add.graphics();
      flash.fillStyle(COLOR_DANGER, 0.4);
      flash.fillRoundedRect(0, 0, 64, 64, 6);
      this.add(flash);

      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          flash.destroy();
        },
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
    super.destroy(fromScene);
  }
}
