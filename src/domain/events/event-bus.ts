/**
 * Contrato de la interfaz IEventBus — Crossover Cards
 *
 * Este módulo define el contrato estricto del Event Bus utilizando el
 * patrón Publisher/Subscriber, cumpliendo con el Principio de Inversión
 * de Dependencias (DIP) de SOLID.
 *
 * La capa de Dominio emite eventos a través de esta interfaz sin conocer
 * quién los escucha. La capa de Presentación y otros servicios se suscriben
 * a esta interfaz. La implementación real se inyecta desde la capa de
 * Infraestructura (`GameEventBus`).
 *
 * Referencia:
 *   - docs/02-architecture.md §4.4 (patrón Observer / Event Bus)
 *   - docs/decisions/ADR-005-event-bus-comunicacion.md
 */

import type { GameEvent, GameEventPayloadMap } from "@domain/events/game-event";

/**
 * Función devuelta al suscribirse a un evento para facilitar la
 * cancelación de la suscripción (desuscripción) sin necesidad de
 * mantener una referencia explícita al handler.
 */
export type Unsubscribe = () => void;

/**
 * Interfaz del bus de eventos del juego.
 *
 * Utiliza genéricos estrictos vinculando el tipo de evento (`GameEvent`)
 * con su tipo de payload esperado (`GameEventPayloadMap[E]`).
 */
export interface IEventBus {
  /**
   * Suscribe un handler a un tipo de evento específico.
   *
   * @param event - El evento a escuchar.
   * @param handler - Función callback fuertemente tipada para el payload de este evento.
   * @returns Función para cancelar esta suscripción.
   */
  on<E extends GameEvent>(
    event: E,
    handler: (payload: GameEventPayloadMap[E]) => void,
  ): Unsubscribe;

  /**
   * Emite un evento, pasando el payload correspondiente a todos los handlers suscritos.
   *
   * @param event - El evento a emitir.
   * @param payload - Objeto con los datos asociados al evento (tipado estricto).
   */
  emit<E extends GameEvent>(event: E, payload: GameEventPayloadMap[E]): void;

  /**
   * Cancela la suscripción de un handler específico a un evento.
   * En la mayoría de los casos es preferible usar la función `Unsubscribe` devuelta por `on()`.
   *
   * @param event - El evento al que estaba suscrito el handler.
   * @param handler - La referencia a la función handler original.
   */
  off<E extends GameEvent>(event: E, handler: (payload: GameEventPayloadMap[E]) => void): void;

  /**
   * Elimina todos los handlers suscritos a todos los eventos.
   * Útil para limpieza de estado entre partidas o durante tests.
   */
  clear(): void;
}
