import Phaser from "phaser";

export class ZoneBanner extends Phaser.GameObjects.Container {
  private bgGraphics: Phaser.GameObjects.Graphics;
  private messageText: Phaser.GameObjects.Text;
  private startY: number = -60;
  private targetY: number;

  constructor(scene: Phaser.Scene, x: number, targetY: number) {
    super(scene, x, -60);
    this.targetY = targetY;

    this.bgGraphics = scene.add.graphics();
    this.bgGraphics.fillStyle(0x252240, 1);
    this.bgGraphics.fillRect(-200, -28, 400, 56);

    this.messageText = scene.add
      .text(0, 0, "", {
        fontFamily: "Nunito",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);

    this.add([this.bgGraphics, this.messageText]);
    this.setDepth(2000); // Asegurar que flote sobre todo
    scene.add.existing(this);
    this.setVisible(false);
  }

  /**
   * Muestra el banner de zona con animación.
   * Si ya está activo, la animación anterior se cancela y se reinicia.
   */
  public show(zoneLabel: string, envName: string, envColor: number): void {
    // Si estaba activo, detener animaciones
    this.scene.tweens.killTweensOf(this);

    this.messageText.setText(`Zona ${zoneLabel} ahora es: ${envName}`);

    // Redibujar fondo y borde con el nuevo color
    this.bgGraphics.clear();
    this.bgGraphics.fillStyle(0x252240, 1);
    this.bgGraphics.fillRect(-200, -28, 400, 56);
    this.bgGraphics.lineStyle(2, envColor, 1);
    this.bgGraphics.strokeRect(-200, -28, 400, 56);

    // Posición inicial
    this.y = this.startY;
    this.setVisible(true);

    // Slide-down -> wait -> slide-up
    this.scene.tweens.add({
      targets: this,
      y: this.targetY,
      duration: 400,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          y: this.startY,
          duration: 400,
          delay: 2000,
          ease: "Quad.easeIn",
          onComplete: () => {
            this.setVisible(false);
          },
        });
      },
    });
  }
}
