import Phaser from "phaser";
import { CardSprite, CardSize, type CardData } from "./card-sprite";

/**
 * Función pura para calcular la disposición en abanico de las cartas.
 * @param count Número total de cartas
 * @param index Índice de la carta actual (0 a count-1)
 * @param totalWidth Anchura máxima disponible para el abanico
 * @returns Posición x y rotación en grados
 */
export function calculateFanLayout(
  count: number,
  index: number,
  totalWidth: number,
): { x: number; rotation: number } {
  if (count <= 1) {
    return { x: 0, rotation: 0 };
  }

  const idealSpacing = 75; // Separación ideal en píxeles antes del solapamiento intensivo
  const actualWidth = Math.min((count - 1) * idealSpacing, totalWidth);
  const centerIndex = (count - 1) / 2;
  const offsetFromCenter = index - centerIndex;

  const stepX = actualWidth / (count - 1);
  const x = offsetFromCenter * stepX;

  const maxRotation = 10;
  // Regla de 3 para la rotación: extremos = maxRotation, centro = 0
  const rotation = centerIndex > 0 ? (offsetFromCenter / centerIndex) * maxRotation : 0;

  return { x, rotation };
}

export class HandView extends Phaser.GameObjects.Container {
  private readonly isPlayer: boolean;
  private readonly maxCards: number;
  private cardEntries: Array<{ id: string; sprite: CardSprite }> = [];

  // Ancho máximo del abanico (para contener hasta 10 cartas)
  private readonly fanTotalWidth = 600;

  constructor(scene: Phaser.Scene, isPlayer: boolean, maxCards: number = 10) {
    super(scene, 0, 0);
    this.isPlayer = isPlayer;
    this.maxCards = maxCards;

    scene.add.existing(this);
  }

  /**
   * Añade una nueva carta a la mano y devuelve el sprite creado.
   */
  public addCard(card: CardData & { id: string }, animate: boolean = true): CardSprite {
    if (this.cardEntries.length >= this.maxCards) {
      console.warn("La mano está llena, no se puede añadir más cartas.");
      // Devolvemos un sprite temporal para no romper callers con la firma
      return new CardSprite(this.scene, card, { size: CardSize.Hand, showBack: !this.isPlayer });
    }

    const sprite = new CardSprite(this.scene, card, {
      size: CardSize.Hand,
      showBack: !this.isPlayer,
    });

    // Las cartas del rival no son interactivas por defecto
    if (!this.isPlayer) {
      sprite.disableInteractive();
    }

    this.add(sprite);
    this.cardEntries.push({ id: card.id, sprite });

    if (animate) {
      // Aparece desde fuera (abajo de la pantalla para el jugador, arriba para el rival)
      sprite.setPosition(0, this.isPlayer ? 300 : -300);
      sprite.setAlpha(0);
      this.scene.tweens.add({
        targets: sprite,
        alpha: 1,
        duration: 300,
        ease: "Quad.easeOut",
      });
    }

    this.rearrange();
    return sprite;
  }

  /** Número de cartas actualmente en la mano. */
  public size(): number {
    return this.cardEntries.length;
  }

  /**
   * Elimina una carta de la mano por su id.
   */
  public removeCard(cardId: string, animate: boolean = true): void {
    const index = this.cardEntries.findIndex((e) => e.id === cardId);
    if (index === -1) return;

    const entry = this.cardEntries.splice(index, 1)[0];

    if (animate) {
      // Animación de salida hacia el tablero
      const targetY = entry.sprite.y + (this.isPlayer ? -150 : 150);
      this.scene.tweens.add({
        targets: entry.sprite,
        y: targetY,
        alpha: 0,
        duration: 300,
        ease: "Quad.easeIn",
        onComplete: () => {
          entry.sprite.destroy();
        },
      });
    } else {
      entry.sprite.destroy();
    }

    this.rearrange();
  }

  /**
   * Recalcula y anima todas las cartas a sus posiciones en abanico.
   * Cancela tweens previos para evitar conflictos y actualiza la posición
   * de reposo de cada carta (necesario para el hover correcto).
   */
  public rearrange(): void {
    const count = this.cardEntries.length;

    this.cardEntries.forEach((entry, index) => {
      const { x, rotation } = calculateFanLayout(count, index, this.fanTotalWidth);

      // Añadir un ligero offset vertical basado en la rotación para dar forma de arco
      const yOffset = Math.abs(rotation) * 1.5;
      const targetY = this.isPlayer ? yOffset : -yOffset;

      // Si no es el jugador, invertimos la rotación para que el abanico luzca bien boca abajo
      const targetRotation = this.isPlayer ? rotation : -rotation;

      // Cancelar tweens previos para evitar conflictos con hover o drags anteriores
      this.scene.tweens.killTweensOf(entry.sprite);

      // Actualizar la posición de reposo antes de animar (fix hover con _baseY incorrecto)
      entry.sprite.setRestPosition(targetY);

      this.scene.tweens.add({
        targets: entry.sprite,
        x,
        y: targetY,
        angle: targetRotation,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 300,
        ease: "Quad.easeOut",
      });
    });
  }

  /**
   * Habilita o deshabilita la interactividad visual de todas las cartas.
   * Utilizado para bloquear durante el turno del rival.
   */
  public setEnabled(enabled: boolean): void {
    this.cardEntries.forEach((entry) => {
      entry.sprite.setDisabled(!enabled);
    });
  }
}
