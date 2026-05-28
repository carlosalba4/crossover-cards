/**
 * GameEventBus — Implementación concreta del IEventBus (Infraestructura).
 *
 * Implementa el patrón Publisher/Subscriber con las siguientes garantías:
 *   - Singleton controlado: `getInstance()` / `resetInstance()` (seguro para tests).
 *   - Prevención de bucles infinitos: flag `isEmitting` bloquea emisiones recursivas.
 *   - Aislamiento de errores: cada handler se ejecuta en try/catch individual,
 *     evitando que un error en un suscriptor detenga la cadena de propagación.
 *
 * Referencia:
 *   - docs/decisions/ADR-005-event-bus-comunicacion.md
 *   - docs/02-architecture.md §4.4 (patrón Observer / Event Bus), §4.7, §7
 */

import type { IEventBus, Unsubscribe } from "@domain/events/event-bus";
import type { GameEvent, GameEventPayloadMap } from "@domain/events/game-event";

/**
 * Tipo interno para almacenar handlers sin perder el tipo del payload.
 * Se usa `unknown` en el mapa interno y se castea de forma controlada
 * en los puntos de llamada —único uso justificado de cast en esta clase—.
 */
type AnyHandler = (payload: unknown) => void;

/**
 * Implementación concreta del Event Bus del juego.
 *
 * Vive en la capa de Infraestructura e implementa `IEventBus` (Dominio),
 * respetando el Principio de Inversión de Dependencias (DIP).
 */
export class GameEventBus implements IEventBus {
  // ---------------------------------------------------------------------------
  // Singleton
  // ---------------------------------------------------------------------------

  private static instance: GameEventBus | null = null;

  /**
   * Devuelve la instancia Singleton del bus.
   * La crea la primera vez que se llama.
   */
  static getInstance(): GameEventBus {
    if (GameEventBus.instance === null) {
      GameEventBus.instance = new GameEventBus();
    }
    return GameEventBus.instance;
  }

  /**
   * Destruye la instancia Singleton y libera todos los handlers.
   * **Solo para uso en tests**: permite que cada suite comience con estado limpio.
   */
  static resetInstance(): void {
    if (GameEventBus.instance !== null) {
      GameEventBus.instance.clear();
      GameEventBus.instance = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Estado interno
  // ---------------------------------------------------------------------------

  /**
   * Mapa de suscriptores: clave = nombre del evento, valor = lista de handlers.
   * Usamos `Map` para O(1) en lookup y para poder borrar entradas vacías.
   */
  private readonly handlers: Map<string, AnyHandler[]> = new Map();

  /**
   * Conjunto de eventos cuya emisión está actualmente en curso.
   * Bloquea únicamente la re-emisión del MISMO evento para prevenir bucles
   * infinitos, pero permite emisiones anidadas de eventos distintos.
   */
  private readonly emittingEvents: Set<string> = new Set();

  /**
   * Constructor privado: impide la instanciación directa fuera del Singleton.
   */
  private constructor() {}

  // ---------------------------------------------------------------------------
  // Implementación de IEventBus
  // ---------------------------------------------------------------------------

  /**
   * Suscribe un handler al evento indicado.
   *
   * @param event   - Evento del enum GameEvent a escuchar.
   * @param handler - Callback fuertemente tipado con el payload del evento.
   * @returns Función de cancelación de la suscripción (`Unsubscribe`).
   */
  on<E extends GameEvent>(
    event: E,
    handler: (payload: GameEventPayloadMap[E]) => void,
  ): Unsubscribe {
    const key = event as string;

    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }

    // Cast justificado: el tipo genérico garantiza que el payload en emit()
    // coincide con GameEventPayloadMap[E], por lo que el cast es seguro.
    const anyHandler = handler as AnyHandler;
    this.handlers.get(key)!.push(anyHandler);

    return () => this.off(event, handler);
  }

  /**
   * Emite un evento, invocando en orden a todos los handlers suscritos.
   *
   * Garantías:
   *   - Si se llama mientras ya hay una emisión en curso, loguea un warning
   *     y retorna inmediatamente sin propagar (prevención de bucle infinito).
   *   - Cada handler se envuelve en try/catch individual: un error en un
   *     handler no interrumpe la ejecución del siguiente.
   *
   * @param event   - Evento del enum GameEvent a emitir.
   * @param payload - Datos tipados asociados al evento.
   */
  emit<E extends GameEvent>(event: E, payload: GameEventPayloadMap[E]): void {
    const key = event as string;

    if (this.emittingEvents.has(key)) {
      console.warn(
        `[GameEventBus] Emisión recursiva bloqueada para el evento "${key}". ` +
          "Revisa si algún handler dispara emit() del mismo evento dentro de su cuerpo.",
      );
      return;
    }

    const eventHandlers = this.handlers.get(key);

    if (eventHandlers === undefined || eventHandlers.length === 0) {
      return;
    }

    // Iteramos sobre una copia para que un off() dentro de un handler
    // no afecte a la lista mientras se itera.
    const snapshot = [...eventHandlers];

    this.emittingEvents.add(key);
    try {
      for (const handler of snapshot) {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[GameEventBus] Error en handler del evento "${key}":`, error);
        }
      }
    } finally {
      this.emittingEvents.delete(key);
    }
  }

  /**
   * Elimina un handler específico de un evento.
   * Si el handler no estaba suscrito, la llamada no tiene efecto.
   *
   * En la mayoría de casos es preferible usar la función `Unsubscribe`
   * devuelta por `on()` en lugar de llamar a `off()` directamente.
   *
   * @param event   - Evento del que se elimina el handler.
   * @param handler - Referencia exacta a la función handler a eliminar.
   */
  off<E extends GameEvent>(event: E, handler: (payload: GameEventPayloadMap[E]) => void): void {
    const key = event as string;
    const eventHandlers = this.handlers.get(key);

    if (eventHandlers === undefined) {
      return;
    }

    const anyHandler = handler as AnyHandler;
    const index = eventHandlers.indexOf(anyHandler);

    if (index !== -1) {
      eventHandlers.splice(index, 1);
    }

    // Limpieza: si ya no hay handlers para este evento, eliminamos la entrada
    if (eventHandlers.length === 0) {
      this.handlers.delete(key);
    }
  }

  /**
   * Elimina todos los handlers de todos los eventos.
   * Útil para limpiar el estado entre partidas o al final de los tests.
   */
  clear(): void {
    this.handlers.clear();
  }
}
