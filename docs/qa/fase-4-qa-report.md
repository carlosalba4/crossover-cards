# Informe QA — Fase 4 · Crossover Cards

**Fecha:** 2026-05-30  
**Revisor:** QA-Reviewer-Agent (Antigravity / Claude Sonnet 4.6 Thinking)  
**Alcance:** Proyecto completo como producto terminado (Fase MVP)  
**Tests:** 486 passed / 48 archivos · Duración: 30.5 s · Exit code: 0

---

## Resumen ejecutivo

El proyecto Crossover Cards supera la revisión de Fase 4 en condiciones aceptables para despliegue con correcciones menores. La arquitectura en capas se respeta con coherencia: dominio puro sin Phaser, EventBus como único canal de comunicación cruzado, patrón Command bien aplicado en la capa de aplicación, y patrón Strategy en la IA. Los 7 ADRs se reflejan en el código sin contradicciones estructurales. La suite de 486 tests pasa limpiamente y cubre los flujos críticos. Se identifican **2 hallazgos críticos** (ambos de carácter funcional/arquitectónico real, no cosméticos) y **3 hallazgos mayores**. La deuda técnica de las 5 mecánicas innovadoras está parcialmente documentada en el código pero carece de entrada explícita en `ai-log.md`, lo cual es un riesgo para la Fase 6 (Memoria).

---

## Veredicto general

> ## ⚠️ APTO CON CORRECCIONES
>
> El MVP es funcional y desplegable. Los hallazgos críticos deben resolverse antes del despliegue final o quedar explícitamente documentados como limitaciones conocidas.

---

## Hallazgos Críticos

### CRÍTICO-F4.1 — Poder de héroe de la IA completamente silenciado

| Campo | Detalle |
|---|---|
| **ID** | CRÍTICO-F4.1 |
| **Ubicación** | `src/application/services/opponent-service.ts:128-132` |
| **Severidad** | Crítica |

**Descripción:** El `OpponentService.executeTurn()` entra al `case "USE_HERO_POWER"` y ejecuta únicamente un `console.warn("pendiente de implementar UseHeroPowerCommand.")`. Sin embargo, **`UseHeroPowerCommand` ya existe y está implementado** en `src/application/commands/use-hero-power-command.ts`, cablea correctamente con `NostalgiaSystem` y emite `HeroPowerUsed`. La IA nunca usa su poder de héroe aunque tenga recursos y la estrategia decida hacerlo. El jugador humano sí puede usarlo correctamente (el comando está cableado en `MatchService.handlePlayerAction`). Esto constituye una asimetría funcional entre IA y jugador humano.

**Recomendación:**
```ts
// opponent-service.ts, case "USE_HERO_POWER":
// REEMPLAZAR el console.warn por:
const result = matchService.handlePlayerAction({
  type: "USE_HERO_POWER",
  playerId: aiPlayerId,
  targetId: action.targetId,
});
if (!result.success) {
  console.warn("[OpponentService] USE_HERO_POWER fallido:", result.error?.message);
}
```
> Referencia: ADR-007 §Decisión punto 1; `docs/02-architecture.md §3.2.2`.

---

### CRÍTICO-F4.2 — `HeroPowerUsed` emitido sin efecto aplicado (poder de héroe hueco)

| Campo | Detalle |
|---|---|
| **ID** | CRÍTICO-F4.2 |
| **Ubicación** | `src/application/commands/use-hero-power-command.ts:78-84` |
| **Severidad** | Crítica |

**Descripción:** `UseHeroPowerCommand.execute()` valida la fase, valida la Nostalgia, gasta la Nostalgia, marca el uso (`hero.useHeroPower()`), y emite `HeroPowerUsed`. Pero **ningún handler en toda la aplicación suscribe `GameEvent.HeroPowerUsed`** para aplicar el efecto real del poder (curación, daño, robo de carta, etc.). El evento es emitido al vacío. El jugador humano gasta Nostalgia y consume el uso del turno, pero el efecto declarado en `heroPower.effectType` nunca se ejecuta. El comentario inline del comando dice explícitamente _"la resolución del efecto se hace en otro servicio"_, pero ese servicio no existe.

Esta deuda **no está registrada** en el `ai-log.md` ni en los ADRs como deuda conocida y aceptada.

**Recomendación (RECOMENDACIÓN-F4.2):** Crear un `HeroPowerResolver` (servicio de dominio o aplicación) que suscriba `HeroPowerUsed` y aplique el `effectType` sobre el objetivo indicado. Como mínimo para el MVP: curación al héroe propio (`heal`) y daño al objetivo (`damage`). Registrar como limitación conocida en `ai-log.md` si se pospone a Fase 5.

> Referencia: ADR-004 §patrón State; `docs/02-architecture.md §4.3` (Command debe ser idempotente y completo).

---

## Hallazgos Mayores

### MAYOR-F4.1 — Identificador `"p1"` hardcodeado en 15+ ubicaciones de `GameScene`

| Campo | Detalle |
|---|---|
| **ID** | MAYOR-F4.1 |
| **Ubicación** | `src/presentation/scenes/game-scene.ts` líneas: 353, 365, 419, 441, 454, 518, 533, 544, 554, 580, 601, 612, 664, 700, 757, 779, 863, 894 |
| **Severidad** | Mayor |

**Descripción:** La lógica de presentación asume universalmente que el jugador humano tiene `playerId === "p1"` mediante literales de string en cada handler de evento. ADR-006 define que `"p1"` y `"p2"` son identificadores asignados en `MatchService.initMatch()` con aleatoriedad (`Math.random() < 0.5`), lo que significa que el jugador humano podría ser `"p2"` en cualquier partida. En la práctica actual el héroe seleccionado por el jugador **siempre se asigna al primer mazo** (`playerDeck.id` como primer argumento de `initMatch`), por lo que el jugador es siempre `player1` y su `playerId` resulta ser `"p1"`. Sin embargo, si el orden de los mazos cambia, toda la lógica de presentación se invierte silenciosamente.

El patrón correcto es que `GameScene` obtenga el `playerId` real del jugador desde el `Match` una vez inicializado y lo almacene como `this.humanPlayerId`, comparando contra esa variable en lugar del literal.

**Recomendación (RECOMENDACIÓN-F4.1):**
```ts
// En init() o al arrancar startMatch():
private humanPlayerId: string = "p1"; // valor inicial conservador

// Tras initMatch():
this.humanPlayerId = match.player1.playerId; // siempre será p1 mientras startMatch() conserve el orden actual

// En todos los handlers:
const isPlayer = payload.playerId === this.humanPlayerId;
```
> Referencia: ADR-006 §Decisión; `docs/02-architecture.md §3.1`.

---

### MAYOR-F4.2 — `MomentumSystem` instanciado en `MatchService` pero sin conexión al flujo de turnos

| Campo | Detalle |
|---|---|
| **ID** | MAYOR-F4.2 |
| **Ubicación** | `src/application/services/match-service.ts:26,132` · `src/domain/services/momentum-system.ts` |
| **Severidad** | Mayor |

**Descripción:** `MomentumSystem` **no está instanciado en `MatchService`** (solo `NostalgiaSystem` y `CrossoverManager` se instancian). El sistema suscribe eventos `HeroDamaged`/`HeroHealed` en su constructor, acumula momentum en `onTurnStart`, y emite `MomentumChanged` — pero nunca se llama a `onTurnStart()` desde ningún orquestador. El handler de `TurnStarted` en `MatchService` (línea 149) llama a `this.nostalgiaSystem?.onTurnStart(payload.playerId)` pero **omite completamente** la llamada equivalente a MomentumSystem.

La UI tiene un slot activo para mostrar Momentum (handler `MomentumChanged` en `GameScene:552-558`), lo que crea una inconsistencia observable: el jugador ve el widget de Momentum en el HUD pero nunca recibe valores porque el sistema no emite.

**Recomendación (RECOMENDACIÓN-F4.2):** Instanciar `MomentumSystem` en `MatchService` (junto a `NostalgiaSystem`) y añadir la llamada en el handler `TurnStarted`. O bien, eliminar el handler `MomentumChanged` de `GameScene` y el slot de UI para que la presentación sea coherente con el estado real. Documentar la decisión en `ai-log.md`.

> Referencia: deuda técnica conocida (Camino A).

---

### MAYOR-F4.3 — Subsistemas suscriben al EventBus en su constructor pero `dispose()` no los desregistra

| Campo | Detalle |
|---|---|
| **ID** | MAYOR-F4.3 |
| **Ubicación** | `src/application/services/match-service.ts:132-136` · `src/domain/services/momentum-system.ts:40-41` |
| **Severidad** | Mayor |

**Descripción:** `NostalgiaSystem` (vía `MomentumSystem` si se instanciara) suscribe en su constructor handlers a `HeroDamaged`/`HeroHealed` directamente en el `GameEventBus`. Estas suscripciones **no están en `internalUnsubscribers`** de `MatchService`. El `dispose()` del servicio limpia solo los handlers registrados explícitamente en `internalUnsubscribers`, pero no los de los subsistemas. Si `initMatch()` se llamara de nuevo (flujo "Jugar de nuevo" sin recargar la página), los handlers de los subsistemas anteriores permanecerían activos, acumulándose en el bus. En el flujo actual del MVP (una partida por sesión de navegador) no causa bug observable, pero contradice la garantía de limpieza del ADR-005 §Consecuencias.

**Recomendación (RECOMENDACIÓN-F4.3):** Exponer un método `dispose()` en `NostalgiaSystem` y `MomentumSystem` que llame a `off()` sobre sus handlers internos, e invocarlos desde `MatchService.dispose()`.

> Referencia: ADR-005 §Consecuencias (riesgo de fugas de memoria).

---

## Verificación de deuda técnica conocida

### Sistemas instanciados pero desconectados del flujo principal

| Sistema | Instanciado | Conectado a MatchService | Tests propios | Documentación |
|---|---|---|---|---|
| `NostalgiaSystem` | ✅ Sí | ✅ Sí (onTurnStart + spend) | ✅ Sí | ✅ ADR-004 |
| `CrossoverManager` | ✅ Sí | ⚠️ Parcial (solo `ActivateCrossoverCommand`) | ✅ Sí | ✅ Código |
| `MomentumSystem` | ❌ No | ❌ No | ✅ Sí | ⚠️ Incompleto (ver MAYOR-F4.2) |
| `TribalSynergySystem` | ❌ No | ❌ No | ✅ Sí | ⚠️ Sin entrada en ai-log |
| `QuestManager` | ❌ No* | ❌ No (cmd existe) | ✅ Sí | ⚠️ Sin entrada en ai-log |
| `ZoneManager` | ❌ No | ❌ No | ✅ Sí | ⚠️ Sin entrada en ai-log |

> *`QuestManager` tiene `ActivateQuestCommand` implementado y testeado pero no está instanciado en `MatchService` ni en `GameDependencies`.

### Coherencia documental de la deuda

- **Código:** Los sistemas existen, tienen tests, y algunos tienen comentarios inline que los marcan como "pendientes". ✅
- **PRD (`docs/01-prd.md`):** Las mecánicas innovadoras M1–M5 están descritas como funcionalidades del juego sin marcar su estado de implementación. ⚠️ **Incoherencia**: el PRD presenta las mecánicas como diseñadas para el juego sin indicar que son deuda técnica del MVP.
- **`ai-log.md`:** **No existe ninguna entrada** que documente explícitamente la decisión de cerrar el MVP sin conectar las 5 mecánicas. Esto es un riesgo real para la **Fase 6 (Memoria)**, donde el profesor leerá el log para evaluar las decisiones tomadas.
- **ADRs:** Ningún ADR registra la decisión de desconectar los sistemas. El ADR-007 menciona la complejidad del MVP pero no declara qué sistemas quedan fuera de alcance.

> **Acción recomendada para Fase 6:** Añadir una entrada en `ai-log.md` que documente la decisión de cerrar el MVP sin conectar los sistemas de mecánicas innovadoras, los sistemas afectados, la justificación y el estado del código.

---

## Verificación de aplicación de ADRs

| ADR | Título | Aplicación en código |
|---|---|---|
| ADR-001 | Stack tecnológico (Phaser 4 + TS + Vite) | ✅ Correcto |
| ADR-002 | Bundle size | ✅ Sin dependencias pesadas añadidas |
| ADR-003 | AGENTS.md y rules | ✅ Archivo presente y referenciado |
| ADR-004 | Patrón State (turnos) | ✅ `TurnEngine` + `DrawPhase`/`MainPhase` correcto |
| ADR-005 | Event Bus | ✅ `GameEventBus` Singleton en infra; `IEventBus` en dominio; `MAYOR-F4.3` es riesgo latente |
| ADR-006 | Identificadores híbridos | ✅ `staticId` para datos JSON; `instanceId` UUID para instancias. Violación de convención en `GameScene` → `MAYOR-F4.1` |
| ADR-007 | Strategy IA | ✅ `IAIStrategy` + `GreedyAI` + `ThreatAwareAI`. `CRÍTICO-F4.1` impide que la IA use `shouldUseHeroPower` efectivamente |

---

## Calidad SOLID / Clean Code — Resumen

**Lo que está bien:**
- **SRP:** Cada comando hace exactamente una cosa. `CombatResolver`, `NostalgiaSystem`, `TurnEngine` tienen responsabilidades únicas.
- **OCP:** Añadir una nueva `IAIStrategy` no requiere modificar `OpponentService`. Añadir un nuevo comando no requiere modificar `MatchService` (solo el `switch`).
- **DIP:** `GameScene` recibe dependencias compuestas desde `createGameDependencies()`. Dominio no importa Phaser en ningún archivo.
- **ISP:** `IEventBus` mínimo (3 métodos). `IAIStrategy` bien segregada en 4 métodos.
- **LSP:** Todas las clases de estrategia IA son sustituibles sin romper `OpponentService`.
- **Nombrado:** Consistente y descriptivo en toda la base de código.
- **TypeScript strict:** Uso de `any` solo en 1 caso justificado (`QuestReward`) con `eslint-disable` explícito.

Se detectaron **12 observaciones menores de estilo no incluidas en este informe** (comentarios redundantes, `as` cast en EventBus interno justificado por diseño, magic string `"env-icon"` en handler ZoneEnvironmentChanged, etc.).

---

## Cobertura y relevancia de tests

- **Total:** 486 tests / 48 archivos / 0 fallos.
- **Dominio:** Alta cobertura estructural. Los 5 sistemas de mecánicas innovadoras tienen tests propios aunque no estén conectados al flujo principal.
- **Aplicación:** Todos los Commands testeados individualmente. `MatchService` y `OpponentService` tienen tests de integración.
- **Infraestructura:** `GameEventBus` testeado (Singleton, recursión, limpieza). Repositorios JSON testeados.
- **Presentación:** Tests de lógica pura extraída (`calculateFanLayout`, `clampProgress`, etc.). Correcto: las clases Phaser no se pueden testear en Node sin simular WebGL.
- **Gaps detectados:**
  - `HeroPowerUsed` sin handler → ningún test verifica el efecto del poder de héroe aplicado (porque el resolver no existe → CRÍTICO-F4.2).
  - `GameScene` (1043 líneas) no tiene test de integración E2E (aceptable para MVP Phaser en 14 días).

---

## Recomendaciones para Fase 5 (Despliegue)

1. **Resolver CRÍTICO-F4.1** antes del build de producción: el parche es de ~5 líneas.
2. **Documentar CRÍTICO-F4.2** como limitación conocida del MVP si no se implementa el resolver de efecto.
3. Verificar que `vite build` no incluya `console.warn/error` en el bundle de producción.
4. Revisar el `base` path de Vite para GitHub Pages (suele requerir `base: '/nombre-repo/'`).
5. Validar que los assets (`assets/`) estén correctamente referenciados con rutas relativas tras el build.

## Recomendaciones para Fase 6 (Memoria)

1. **Crear entrada en `ai-log.md`** que documente la decisión de cerrar MVP sin conectar los sistemas de mecánicas innovadoras: sistemas afectados, justificación, impacto, tests que demuestran preparación del código.
2. Documentar el **MAYOR-F4.2** (MomentumSystem desconectado) como elección explícita, no como olvido.
3. Incluir en la memoria el análisis de la asimetría `USE_HERO_POWER` IA vs jugador como deuda técnica identificada en QA de Fase 4.
4. Las capturas de pantalla del juego deben tomarse con CRÍTICO-F4.1 corregido para mostrar la IA en comportamiento completo.

---

*Informe generado por QA-Reviewer-Agent — Fase 4 · Crossover Cards · 2026-05-30*
