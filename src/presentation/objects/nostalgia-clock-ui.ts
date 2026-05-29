import Phaser from "phaser";

export class NostalgiaClockUI extends Phaser.GameObjects.Container {
  private readonly clockImage: Phaser.GameObjects.Image | null;
  private readonly sphereGraphics: Phaser.GameObjects.Graphics;
  private readonly glowGraphics: Phaser.GameObjects.Graphics;
  private readonly emptyOverlay: Phaser.GameObjects.Graphics;
  private readonly spendFlashGraphics: Phaser.GameObjects.Graphics;
  private readonly hourHandGraphics: Phaser.GameObjects.Graphics;
  private readonly minuteHandGraphics: Phaser.GameObjects.Graphics;
  private readonly digitalText: Phaser.GameObjects.Text;

  private currentNostalgia: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // 0. Imagen del reloj (si el asset existe). Reemplaza la esfera dibujada.
    this.clockImage = scene.textures.exists("nostalgia-clock")
      ? scene.add.image(0, 0, "nostalgia-clock").setDisplaySize(132, 132)
      : null;

    // 1. Esfera base y borde (bg-card #1A1730, borde dorado #F5C842 3px).
    //    Solo se dibuja como fallback cuando no hay imagen de reloj.
    this.sphereGraphics = scene.add.graphics();
    if (!this.clockImage) {
      this.sphereGraphics.fillStyle(0x1a1730, 1);
      this.sphereGraphics.fillCircle(0, 0, 64);
      this.sphereGraphics.lineStyle(3, 0xf5c842, 1);
      this.sphereGraphics.strokeCircle(0, 0, 64);
    }

    // 2. Glow para estado cargado (brillo dorado exterior)
    this.glowGraphics = scene.add.graphics();
    this.glowGraphics.lineStyle(4, 0xf5c842, 0.4);
    this.glowGraphics.strokeCircle(0, 0, 66);
    this.glowGraphics.lineStyle(8, 0xf5c842, 0.2);
    this.glowGraphics.strokeCircle(0, 0, 70);
    this.glowGraphics.setVisible(false);

    // 3. Overlay para estado vacío (rgba(0,0,0,0.3) sobre esfera)
    this.emptyOverlay = scene.add.graphics();
    this.emptyOverlay.fillStyle(0x000000, 0.3);
    this.emptyOverlay.fillCircle(0, 0, 64);
    this.emptyOverlay.setVisible(true);

    // 4. Flash para retroceso (accent-teal #3ECFCF)
    this.spendFlashGraphics = scene.add.graphics();
    this.spendFlashGraphics.fillStyle(0x3ecfcf, 1);
    this.spendFlashGraphics.fillCircle(0, 0, 64);
    this.spendFlashGraphics.setAlpha(0);

    // 5. Manecilla de horas (max/10, estática, más corta y gruesa)
    this.hourHandGraphics = scene.add.graphics();
    this.hourHandGraphics.lineStyle(6, 0xf5c842, 1);
    this.hourHandGraphics.beginPath();
    this.hourHandGraphics.moveTo(0, 0);
    this.hourHandGraphics.lineTo(0, -35);
    this.hourHandGraphics.strokePath();

    // 6. Manecilla de minutos (current/max, animada)
    this.minuteHandGraphics = scene.add.graphics();
    this.minuteHandGraphics.lineStyle(3, 0xf5c842, 1);
    this.minuteHandGraphics.beginPath();
    this.minuteHandGraphics.moveTo(0, 0);
    this.minuteHandGraphics.lineTo(0, -50);
    this.minuteHandGraphics.strokePath();

    // Punto central (decorativo)
    const centerDot = scene.add.graphics();
    centerDot.fillStyle(0xf5c842, 1);
    centerDot.fillCircle(0, 0, 4);

    // 7. Texto digital X/10 (Nunito 16px Bold #F0EAD6, centrado bajo el eje)
    this.digitalText = scene.add
      .text(0, 30, "0/10", {
        fontFamily: "Nunito",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#F0EAD6",
      })
      .setOrigin(0.5);

    // Añadir al container en orden de dibujado
    const clockLayers: Phaser.GameObjects.GameObject[] = [];
    if (this.clockImage) clockLayers.push(this.clockImage);
    clockLayers.push(
      this.glowGraphics,
      this.sphereGraphics,
      this.emptyOverlay,
      this.spendFlashGraphics,
      this.hourHandGraphics,
      this.minuteHandGraphics,
      centerDot,
      this.digitalText,
    );
    this.add(clockLayers);

    scene.add.existing(this);
  }

  /**
   * Actualiza la UI del reloj y anima las manecillas
   * @param current Valor actual de nostalgia
   * @param max Valor máximo de nostalgia para el turno
   */
  public update(current: number, max: number): void {
    const safeMax = Math.max(0, Math.min(max, 10));
    const safeCurrent = Math.max(0, Math.min(current, safeMax));

    this.digitalText.setText(`${safeCurrent}/${safeMax}`);

    // Manecilla de horas
    this.hourHandGraphics.angle = (safeMax / 10) * 360;

    // Estado cargado (corona/brillo) vs Estado vacío (overlay negro)
    this.glowGraphics.setVisible(safeCurrent > 0 && safeCurrent === safeMax);
    this.emptyOverlay.setVisible(safeCurrent === 0);

    // Ángulo de minutos (12 en punto = 0 grados en nuestra línea trazada hacia y:-50)
    const targetAngle = safeMax > 0 ? (safeCurrent / safeMax) * 360 : 0;

    // Si hubo un cambio, animar
    if (this.currentNostalgia !== safeCurrent) {
      const isGain = safeCurrent > this.currentNostalgia;
      this.currentNostalgia = safeCurrent;

      this.scene.tweens.add({
        targets: this.minuteHandGraphics,
        angle: targetAngle,
        duration: isGain ? 500 : 300,
        ease: isGain ? "Quad.easeOut" : "Quad.easeIn",
      });

      // Si es un gasto, reproducimos un destello
      if (!isGain) {
        this.playSpendFlash();
      }
    } else {
      // Si no hubo cambio, asegurarnos de que el ángulo sea el correcto sin animar
      // Por ejemplo, tras inicializar
      this.minuteHandGraphics.angle = targetAngle;
    }
  }

  /**
   * Reproduce un destello de retroceso
   */
  private playSpendFlash(): void {
    // Detener tweens previos sobre este graphics por seguridad
    this.scene.tweens.killTweensOf(this.spendFlashGraphics);

    this.spendFlashGraphics.setAlpha(0.6);
    this.scene.tweens.add({
      targets: this.spendFlashGraphics,
      alpha: 0,
      duration: 300,
      ease: "Quad.easeOut",
    });
  }
}
