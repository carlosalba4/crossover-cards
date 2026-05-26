# ROL

Eres un Arquitecto de Software senior con 15 años de experiencia en arquitectura
limpia, patrones de diseño y desarrollo de videojuegos web. Tu tarea es producir
el documento de arquitectura técnica del proyecto "Crossover Cards", a partir
del PRD ya validado.

# CONTEXTO

- Proyecto académico de 14 días, metodología cascada clásica.
- Stack: Phaser 4 + TypeScript (strict) + Vite + Vitest + ESLint + Prettier.
- Equipo: 2 personas.
- El PRD definitivo está en `docs/01-prd.md` (léelo entero antes de empezar).
- Las reglas del proyecto están en `AGENTS.md` (léelo también).
- El proyecto valora especialmente: SOLID, Clean Code, patrones de diseño, baja
  acoplamiento, modularidad, testabilidad, modelado de datos adecuado.

# OBJETIVO

Crea el archivo `docs/02-architecture.md` con la arquitectura técnica completa
del juego, lista para que sirva de guía exhaustiva a la fase de Implementación
posterior.

# CONTENIDO REQUERIDO (estructura del documento)

## 1. Introducción

- Propósito del documento.
- Alcance.
- Referencias (PRD, AGENTS.md, ADRs existentes).

## 2. Visión general de la arquitectura

- Resumen ejecutivo en 1-2 párrafos.
- Diagrama de capas en Mermaid (Domain / Application / Infrastructure /
  Presentation).
- Principios arquitectónicos aplicados (Clean Architecture, SOLID, Domain-Driven
  Design ligero, separación lógica/presentación).
- Justificación de las decisiones arquitectónicas principales.

## 3. Capas en detalle

### 3.1 Capa de Dominio (`src/domain/`)

- Responsabilidad: lógica pura del juego, sin dependencias de Phaser.
- Entidades principales (lista con responsabilidad de cada una):
  - Card, Character, Spell, Item, Player, Hero, Deck, Hand, Board, Zone,
    Match, Turn, NostalgiaSystem, MomentumSystem.
- Servicios de dominio:
  - TurnEngine, CombatResolver, ZoneManager, QuestManager, CrossoverManager.
- Eventos de dominio (GameEventBus):
  - CardPlayed, CharacterSummoned, AttackResolved, HeroDamaged, TurnEnded,
    QuestCompleted, ZoneChanged, MomentumGained, MatchEnded.
- IA del oponente (`src/domain/ai/`):
  - Interfaz AIStrategy.
  - Implementaciones: GreedyAI, ThreatAwareAI.

### 3.2 Capa de Aplicación (`src/application/`)

- Responsabilidad: orquestación de casos de uso.
- Comandos (patrón Command):
  - PlayCardCommand, AttackCommand, EndTurnCommand, UseHeroPowerCommand,
    ActivateQuestCommand, ActivateCrossoverCommand.
- Servicios de aplicación:
  - MatchService, DeckService, OpponentService.
- Cómo recibe las acciones del jugador y las traduce en comandos sobre el
  dominio.

### 3.3 Capa de Infraestructura (`src/infrastructure/`)

- Responsabilidad: implementación técnica de adaptadores.
- Repositorios:
  - CardRepository (lee `assets/data/cards.json`).
  - DeckRepository (lee `assets/data/decks.json`).
  - HeroRepository.
- Adaptadores:
  - LocalStorageAdapter (persistencia local opcional).
  - SpriteSheetAdapter (mapeo lógico de sprites a IDs de carta).
- Política de errores en la capa.

### 3.4 Capa de Presentación (`src/presentation/`)

- Responsabilidad: capa Phaser, todo lo visual.
- Escenas:
  - BootScene, MenuScene, HeroSelectScene, GameScene, EndScene.
- Objetos visuales (`src/presentation/objects/`):
  - CardSprite, BoardView, HandView, HeroView, ZoneView, NostalgiaClockUI,
    MomentumBar.
- UI auxiliar (`src/presentation/ui/`):
  - HUD, Tooltip, Button, Toast, Modal.
- Cómo se suscribe a los eventos del dominio y los traduce en animaciones.
- Cómo emite acciones del jugador como comandos a la capa de aplicación.

## 4. Patrones de diseño aplicados

Para cada patrón:

- Nombre.
- Problema que resuelve.
- Dónde se aplica en este proyecto (clases concretas).
- Snippet de pseudocódigo o diagrama Mermaid si ayuda.

Patrones obligatorios a incluir:

- **State**: máquina de estados del turno (DrawPhase, MainPhase, CombatPhase,
  EndPhase). Incluye diagrama Mermaid stateDiagram.
- **Command**: acciones del jugador y su pila para posibles undo/log.
- **Strategy**: IA del oponente intercambiable.
- **Observer / Event Bus**: comunicación dominio → presentación sin acoplamiento.
- **Factory**: CardFactory que instancia entidades a partir del JSON.
- **Repository**: aislamiento del origen de datos.
- **Singleton (controlado)**: para EventBus y configuración global.

Opcional (incluir si encaja):

- **Decorator**: para modificadores temporales de cartas (buffs/debuffs).
- **Template Method**: para fases de turno con pasos comunes.

## 5. Modelo de datos

- Esquema JSON de una Carta (con todos sus campos: id, name, type, archetype,
  cost, rarity, attack, vida, abilities, deathrattle, battlecry, hero-power, etc.).
- Esquema JSON de un Mazo.
- Esquema JSON de un Héroe.
- Esquema JSON de una Zona.
- Esquema JSON de una Misión (Quest).
- Esquema TypeScript de Partida en curso (MatchState) en memoria.
- Estrategia de identificadores (UUIDs vs strings legibles).

## 6. Máquina de estados del turno

- Diagrama Mermaid stateDiagram con transiciones Draw → Main → Combat → End.
- Detalle de qué eventos disparan cada transición.
- Cómo se intercala el turno de la IA vs del jugador.

## 7. Manejo de eventos (Event Bus)

- Lista completa de eventos del dominio con su payload.
- Patrón Publisher/Subscriber.
- Garantías: orden de emisión, errores en suscriptores, prevención de bucles
  infinitos.

## 8. Estrategia de IA del rival

- Cómo está estructurada (interfaz + estrategias intercambiables).
- Algoritmo de GreedyAI (paso a paso).
- Algoritmo de ThreatAwareAI (paso a paso).
- Cómo se evalúa el "peligro" de un personaje enemigo.
- Cómo se intercambian estrategias sin tocar el resto del código.

## 9. Manejo de errores

- Estrategia general: errores esperados (no excepciones) vs excepcionales.
- Tipos de error propios (DomainError, ApplicationError, InfrastructureError).
- Política en cada capa.
- Logging.

## 10. Estrategia de testing

- Pirámide de testing: muchos unitarios de dominio, algunos de integración,
  pocos e2e.
- Cobertura mínima por capa:
  - Domain: 80%.
  - Application: 60%.
  - Infrastructure: 40%.
  - Presentation: tests visuales mínimos.
- Cómo testear código que toca Phaser (mocks, jsdom).
- Cómo testear la IA del oponente (escenarios reproducibles).
- Herramientas: Vitest + jsdom + @vitest/coverage-v8.

## 11. SOLID en este proyecto

Para cada principio:

- Nombre y enunciado breve.
- Cómo se aplica concretamente con ejemplos del proyecto.
- Qué clase o estructura encarna mejor el principio.

## 12. Estructura final de carpetas

Árbol completo de `src/` con todos los archivos previstos, comentado.

## 13. Dependencias entre capas

- Diagrama Mermaid graph mostrando flujo de dependencias.
- Regla de oro: dependencias solo apuntan hacia adentro (Domain no depende de
  nadie; Presentation depende de Application y Domain; etc.).

## 14. Despliegue

- Tipo: aplicación web estática.
- Build: Vite (`npm run build`) genera `dist/`.
- Alojamiento: GitHub Pages o itch.io (decisión final en Fase de Despliegue).
- CDN o servidor: no requerido.

## 15. Riesgos arquitectónicos y mitigación

- Lista de 3-5 riesgos técnicos con plan de mitigación.

## 16. ADRs derivados

- Lista de Architecture Decision Records que se generarán adicionalmente como
  consecuencia de este documento. Propón al menos 3 ADRs nuevos para crear
  en `docs/decisions/`.

# RESTRICCIONES IMPORTANTES

- **NO escribir código real**. Solo arquitectura, pseudocódigo conceptual,
  diagramas y esquemas. El código se hace en la fase de Implementación.
- Usa **Mermaid** para todos los diagramas (no SVG, no ASCII art).
- Idioma: español. Sin emojis.
- Markdown limpio, jerarquizado, con tablas donde aporten claridad.
- Sé exhaustivo en patrones, SOLID y modelo de datos: son los puntos que más
  valora la rúbrica académica.
- Si una decisión queda abierta, propón 2-3 alternativas razonadas con
  [PENDIENTE DE VALIDACIÓN].

# INSTRUCCIONES DE EJECUCIÓN

1. Lee `docs/01-prd.md` y `AGENTS.md` completos.
2. Genera un **PLAN** con la tabla de contenidos detallada del documento y
   tu propuesta de ADRs adicionales.
3. **Espera mi aprobación** del plan.
4. Una vez aprobado, escribe el documento completo directamente en
   `docs/02-architecture.md`.
5. Al finalizar, lista al chat:
   - Resumen de patrones aplicados.
   - Lista de ADRs adicionales propuestos para crear después.
   - Decisiones marcadas como [PENDIENTE DE VALIDACIÓN] que requieren revisión.

Empieza ahora leyendo el PRD y proponiendo el plan.
