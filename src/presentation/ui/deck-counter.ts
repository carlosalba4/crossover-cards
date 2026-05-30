import Phaser from "phaser";

export class DeckCounter extends Phaser.GameObjects.Container {
  private iconGraphics: Phaser.GameObjects.Graphics;
  private iconImage: Phaser.GameObjects.Image | null;
  private countText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Icono del mazo: sprite "icon-deck" si está cargado; si no, placeholder
    // dibujado con Graphics (fallback).
    this.iconGraphics = scene.add.graphics();
    this.iconImage = scene.textures.exists("icon-deck")
      ? scene.add.image(10, 14, "icon-deck").setDisplaySize(24, 28)
      : null;

    this.countText = scene.add.text(28, 6, "30", {
      fontFamily: "Nunito",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#F0EAD6",
    });

    const layers: Phaser.GameObjects.GameObject[] = [this.iconGraphics];
    if (this.iconImage) layers.push(this.iconImage);
    layers.push(this.countText);
    this.add(layers);
    scene.add.existing(this);

    // Render inicial (solo dibuja el placeholder si no hay sprite)
    this.renderIcon(0xf0ead6);
  }

  /**
   * Actualiza el contador de cartas y su color dependiendo de la cantidad.
   */
  public update(count: number): void {
    this.countText.setText(count.toString());

    let colorHex = "#F0EAD6";
    let colorNum = 0xf0ead6;

    if (count === 0) {
      colorHex = "#FF3B3B"; // Damage
      colorNum = 0xff3b3b;
    } else if (count >= 1 && count <= 4) {
      colorHex = "#F5A623"; // Warn
      colorNum = 0xf5a623;
    }

    this.countText.setColor(colorHex);
    this.renderIcon(colorNum);

    // Animación de feedback para el cambio
    this.scene.tweens.add({
      targets: this,
      scale: 1.1,
      duration: 100,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  /**
   * Dibuja el placeholder del mazo con el color actual
   */
  private renderIcon(color: number): void {
    this.iconGraphics.clear();
    // Si hay sprite de icono, no dibujamos el placeholder de Graphics.
    if (this.iconImage) return;
    this.iconGraphics.lineStyle(2, color, 1);
    this.iconGraphics.strokeRoundedRect(0, 0, 20, 28, 4);

    this.iconGraphics.beginPath();
    this.iconGraphics.moveTo(2, 4);
    this.iconGraphics.lineTo(18, 4);
    this.iconGraphics.moveTo(2, 8);
    this.iconGraphics.lineTo(18, 8);
    this.iconGraphics.strokePath();
  }
}
