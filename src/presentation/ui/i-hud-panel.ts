import type Phaser from "phaser";

/**
 * Contrato común de los paneles del HUD (lateral izquierdo y derecho).
 *
 * Ambos paneles son contenedores Phaser posicionables que emiten eventos hacia
 * `GameScene` mediante el sistema de eventos de `EventEmitter`. La interfaz evita
 * que la escena dependa de las clases concretas para operaciones comunes
 * (posicionar, escuchar eventos, destruir) — SRP + DIP.
 */
export interface IHUDPanel {
  /** Reposiciona el panel dentro de la escena. */
  setPosition(x?: number, y?: number): this;
  /** Suscribe un listener a un evento emitido por el panel. */
  on(event: string, fn: (...args: unknown[]) => void, context?: unknown): this;
  /** Libera los recursos del panel (timers, tweens, hijos). */
  destroy(fromScene?: boolean): void;
}

// Comprobación estructural: cualquier subclase de Phaser.GameObjects.Container
// satisface IHUDPanel. Se documenta aquí como referencia del contrato esperado.
export type HUDPanelLike = IHUDPanel & Phaser.GameObjects.Container;
