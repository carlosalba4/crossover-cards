/**
 * Raíz de composición de la partida (Composition Root).
 *
 * Centraliza la construcción de todas las dependencias concretas
 * (infraestructura, servicios de aplicación y estrategia de IA) en un único
 * lugar fuera de la capa de Presentación. `GameScene` recibe estas dependencias
 * ya compuestas como abstracciones (`IEventBus`, `MatchService`, …), respetando
 * el Principio de Inversión de Dependencias (DIP, ADR-005 §Decisión punto 3;
 * docs/02-architecture.md §3.4).
 *
 * De este modo la escena no instancia repositorios, el EventBus ni estrategias
 * de IA: solo orquesta la UI con las dependencias que se le inyectan.
 */

import type { IEventBus } from "@domain/events/event-bus";
import type { IDeckRepository } from "@domain/repositories/i-deck-repository";
import { MatchService } from "@application/services/match-service";
import { OpponentService } from "@application/services/opponent-service";
import { DeckService } from "@application/services/deck-service";
import { JsonDeckRepository } from "@infrastructure/repositories/json-deck-repository";
import { JsonCardRepository } from "@infrastructure/repositories/json-card-repository";
import { JsonHeroRepository } from "@infrastructure/repositories/json-hero-repository";
import { GameEventBus } from "@infrastructure/events/game-event-bus";
import { GreedyAI } from "@domain/ai/greedy-ai";

/**
 * Conjunto de dependencias necesarias para arrancar una partida en `GameScene`.
 * Todos los miembros son abstracciones o servicios de aplicación; la escena no
 * conoce ninguna implementación concreta de infraestructura ni de IA.
 */
export interface GameDependencies {
  readonly eventBus: IEventBus;
  readonly matchService: MatchService;
  readonly opponentService: OpponentService;
  /** Repositorio de mazos (abstracción) para resolver heroId → deckId en la escena. */
  readonly deckRepository: IDeckRepository;
}

/**
 * Construye el grafo de dependencias de la partida.
 *
 * @returns Las dependencias compuestas listas para inyectar en `GameScene`.
 */
export function createGameDependencies(): GameDependencies {
  const eventBus: IEventBus = GameEventBus.getInstance();

  const deckRepository = new JsonDeckRepository();
  const cardRepository = new JsonCardRepository();
  const heroRepository = new JsonHeroRepository();

  const deckService = new DeckService(deckRepository, cardRepository);
  const matchService = new MatchService(deckService, deckRepository, heroRepository, eventBus);
  const opponentService = new OpponentService(new GreedyAI());

  return { eventBus, matchService, opponentService, deckRepository };
}
