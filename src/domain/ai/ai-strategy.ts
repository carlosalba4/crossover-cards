/**
 * AIStrategy — Crossover Cards
 *
 * Define el contrato que deben cumplir todas las estrategias de IA del
 * oponente, y los tipos de acción propios de la IA que las implementaciones
 * devuelven.
 *
 * Responsabilidades de este módulo:
 *   1. `AIMainAction`  — Discriminated union con las decisiones posibles en
 *      la Fase Principal (jugar carta, usar habilidad de héroe, terminar fase).
 *   2. `AICombatAction` — Discriminated union con las decisiones posibles en
 *      la Fase de Combate (atacar, terminar combate).
 *   3. `IAIStrategy`   — Interfaz del patrón Strategy: define los cuatro
 *      métodos de decisión que implementan `GreedyAI` y `ThreatAwareAI`.
 *
 * Separación de responsabilidades (ADR-007):
 *   - La IA devuelve sus propias acciones (`AIMainAction` / `AICombatAction`),
 *     NO objetos `GameAction`. Es responsabilidad del `OpponentService`
 *     (capa de Aplicación) traducir estas decisiones en `GameAction` concretos
 *     y ejecutarlos mediante los `Command` correspondientes.
 *   - Esto evita que la IA dependa de la capa de Aplicación, cumpliendo el
 *     Principio de Inversión de Dependencias.
 *
 * Referencias:
 *   - docs/02-architecture.md §4.3 (diagrama classDiagram Strategy)
 *   - docs/02-architecture.md §8.1 (Estructura Intercambiable de la IA)
 *   - docs/decisions/ADR-007-patron-strategy-ia.md
 */

import type { GameStateSnapshot } from "@domain/ai/game-state-snapshot";

// ---------------------------------------------------------------------------
// 1. Tipos de acción de Fase Principal
// ---------------------------------------------------------------------------

/**
 * Acción de Fase Principal: la IA juega una carta desde su mano.
 *
 * @field cardInstanceId - UUID de la instancia de carta en la mano de la IA.
 * @field zoneId         - Zona del tablero donde se colocará el Personaje.
 *                         Solo relevante para cartas de tipo Character;
 *                         OpponentService lo ignorará para Spells e Items.
 */
export interface AIPlayCardAction {
  readonly type: "PLAY_CARD";
  readonly cardInstanceId: string;
  readonly zoneId: "left" | "center" | "right";
}

/**
 * Acción de Fase Principal: la IA activa la habilidad de su héroe.
 *
 * @field targetId - ID del objetivo (instanceId de un Personaje o staticId
 *                   de un héroe). Undefined si la habilidad no tiene objetivo
 *                   explícito (ej. efecto de área o sin objetivo).
 */
export interface AIUseHeroPowerAction {
  readonly type: "USE_HERO_POWER";
  readonly targetId?: string;
}

/**
 * Acción de Fase Principal: la IA declara que ha terminado su fase principal.
 * Siempre debe ser el último elemento del array devuelto por
 * `decideMainPhaseActions`.
 */
export interface AIEndMainPhaseAction {
  readonly type: "END_MAIN_PHASE";
}

/**
 * Unión discriminada de todas las acciones posibles durante la Fase Principal.
 * El campo `type` actúa como discriminante para el narrowing de TypeScript.
 */
export type AIMainAction = AIPlayCardAction | AIUseHeroPowerAction | AIEndMainPhaseAction;

// ---------------------------------------------------------------------------
// 2. Tipos de acción de Fase de Combate
// ---------------------------------------------------------------------------

/**
 * Acción de Fase de Combate: la IA declara un ataque.
 *
 * @field attackerId - `instanceId` del Personaje atacante (propiedad del tablero de la IA).
 * @field defenderId - `instanceId` del Personaje defensor (tablero del oponente),
 *                     o `staticId` del héroe oponente si el ataque va directo al héroe.
 */
export interface AIAttackAction {
  readonly type: "ATTACK";
  readonly attackerId: string;
  readonly defenderId: string;
}

/**
 * Acción de Fase de Combate: la IA declara que ha terminado el combate.
 * Siempre debe ser el último elemento del array devuelto por
 * `decideCombatActions`.
 */
export interface AIEndCombatAction {
  readonly type: "END_COMBAT";
}

/**
 * Unión discriminada de todas las acciones posibles durante la Fase de Combate.
 * El campo `type` actúa como discriminante para el narrowing de TypeScript.
 */
export type AICombatAction = AIAttackAction | AIEndCombatAction;

// ---------------------------------------------------------------------------
// 3. Interfaz IAIStrategy (patrón Strategy)
// ---------------------------------------------------------------------------

/**
 * Contrato para cualquier estrategia de IA del oponente en Crossover Cards.
 *
 * Cada implementación encapsula un algoritmo de toma de decisiones distinto:
 *   - `GreedyAI`      — Estrategia codiciosa (nivel Fácil).
 *   - `ThreatAwareAI` — Estrategia consciente de amenazas (nivel Medio).
 *
 * Invariantes del contrato:
 *   1. Los métodos son deterministas dado el mismo snapshot (salvo que la
 *      implementación inyecte expresamente un generador de aleatoriedad).
 *   2. `decideMainPhaseActions` SIEMPRE termina con `{ type: "END_MAIN_PHASE" }`.
 *   3. `decideCombatActions` SIEMPRE termina con `{ type: "END_COMBAT" }`.
 *   4. Ningún método muta el `snapshot` recibido.
 *   5. Ningún método lanza excepciones; si el estado no permite acciones,
 *      devuelve el array mínimo válido (solo la acción de fin de fase).
 *
 * Extensibilidad (OCP):
 *   Añadir un nuevo nivel de dificultad requiere únicamente crear una nueva
 *   clase que implemente esta interfaz, sin modificar `OpponentService` ni
 *   ningún otro código existente.
 *
 * @see GreedyAI
 * @see ThreatAwareAI
 */
export interface IAIStrategy {
  /**
   * Planifica la secuencia completa de acciones para la Fase Principal.
   *
   * La implementación debe analizar el snapshot e indicar qué cartas jugar
   * (en qué orden y zona) y si usar la habilidad de héroe. El último elemento
   * del array devuelto **siempre** es `{ type: "END_MAIN_PHASE" }`.
   *
   * @param snapshot - Vista inmutable del estado actual de la partida.
   * @returns Secuencia ordenada de acciones de Fase Principal.
   */
  decideMainPhaseActions(snapshot: GameStateSnapshot): readonly AIMainAction[];

  /**
   * Planifica la secuencia completa de ataques para la Fase de Combate.
   *
   * La implementación debe indicar qué Personajes atacan y contra qué
   * objetivo. El último elemento del array devuelto **siempre** es
   * `{ type: "END_COMBAT" }`.
   *
   * @param snapshot - Vista inmutable del estado actual de la partida.
   * @returns Secuencia ordenada de acciones de Fase de Combate.
   */
  decideCombatActions(snapshot: GameStateSnapshot): readonly AICombatAction[];

  /**
   * Decide si la IA debe activar la mecánica Crossover en este turno.
   *
   * Solo tiene sentido cuando `snapshot.crossoverAvailable === true`.
   * El `OpponentService` ya verificará esa precondición antes de ejecutar
   * la acción.
   *
   * @param snapshot - Vista inmutable del estado actual de la partida.
   * @returns `true` si la IA debe activar el Crossover; `false` en caso contrario.
   */
  shouldUseCrossover(snapshot: GameStateSnapshot): boolean;

  /**
   * Decide si la IA debe usar la habilidad de héroe y contra qué objetivo.
   *
   * Si la implementación devuelve un `string`, se interpreta como el
   * `targetId` del objetivo (instanceId de un Personaje o staticId de un héroe).
   * Si devuelve `null`, el `OpponentService` no intentará usar la habilidad.
   *
   * Nota: este método es independiente de `decideMainPhaseActions`. El
   * `OpponentService` puede invocarlos en el orden que considere óptimo.
   *
   * @param snapshot - Vista inmutable del estado actual de la partida.
   * @returns El `targetId` del objetivo, o `null` si no se debe usar.
   */
  shouldUseHeroPower(snapshot: GameStateSnapshot): string | null;
}
