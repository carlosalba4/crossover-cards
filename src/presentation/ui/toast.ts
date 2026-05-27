import Phaser from "phaser";

export type ToastType = "ok" | "warn" | "damage";

const TOAST_COLORS: Record<ToastType, number> = {
  ok: 0x4caf6e,
  warn: 0xf5a623,
  damage: 0xff3b3b,
};

const TOAST_WIDTH = 320;
const TOAST_HEIGHT = 48;
const TOAST_GAP = 8;
const START_Y = -60;

export class Toast extends Phaser.GameObjects.Container {
  private static activeToasts: Toast[] = [];

  private bg: Phaser.GameObjects.Graphics;
  private messageText: Phaser.GameObjects.Text;
  private targetY: number = 0;

  private constructor(scene: Phaser.Scene, x: number, y: number, message: string, type: ToastType) {
    super(scene, x, y);

    this.bg = scene.add.graphics();
    this.bg.fillStyle(TOAST_COLORS[type], 1);
    this.bg.fillRoundedRect(-TOAST_WIDTH / 2, 0, TOAST_WIDTH, TOAST_HEIGHT, 8);

    this.messageText = scene.add
      .text(0, TOAST_HEIGHT / 2, message, {
        fontFamily: "Nunito",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#F0EAD6",
      })
      .setOrigin(0.5);

    this.add([this.bg, this.messageText]);
  }

  /**
   * Muestra un nuevo Toast en pantalla
   */
  public static show(scene: Phaser.Scene, message: string, type: ToastType): void {
    const x = scene.scale.width / 2;
    const toast = new Toast(scene, x, START_Y, message, type);
    scene.add.existing(toast);
    toast.setDepth(1000);

    Toast.activeToasts.push(toast);
    Toast.repositionToasts(scene);

    // Slide down y luego up sin setTimeout, usando tweens concatenados
    // En Phaser podemos usar timelines o tweens con delay
    scene.tweens.add({
      targets: toast,
      y: toast.targetY, // Al inicializar, repositionToasts le asigna un targetY
      duration: 300,
      ease: "Quad.easeOut",
      onComplete: () => {
        // Al terminar de entrar, programamos la salida con delay
        scene.tweens.add({
          targets: toast,
          y: START_Y,
          alpha: 0,
          delay: 2500, // Permanece 2.5s
          duration: 300,
          ease: "Quad.easeIn",
          onComplete: () => {
            toast.destroy();
            Toast.removeToast(toast);
            Toast.repositionToasts(scene);
          },
        });
      },
    });
  }

  /**
   * Elimina un toast de la lista activa
   */
  private static removeToast(toast: Toast): void {
    const index = Toast.activeToasts.indexOf(toast);
    if (index !== -1) {
      Toast.activeToasts.splice(index, 1);
    }
  }

  /**
   * Recalcula la posición Y de todos los toasts activos y los anima hacia ella
   */
  private static repositionToasts(scene: Phaser.Scene): void {
    let currentY = 16; // Margen superior

    for (let i = Toast.activeToasts.length - 1; i >= 0; i--) {
      const toast = Toast.activeToasts[i];
      toast.targetY = currentY;

      // Solo animamos si el toast ya está visible (y > START_Y) o está bajando
      if (toast.y > START_Y) {
        scene.tweens.add({
          targets: toast,
          y: currentY,
          duration: 200,
          ease: "Quad.easeOut",
        });
      }

      currentY += TOAST_HEIGHT + TOAST_GAP;
    }
  }
}
