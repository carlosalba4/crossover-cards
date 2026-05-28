# Auditoría Funcional — Estado del Proyecto hasta IMPL-066

**Fecha:** 2026-05-28  
**Auditor:** QA-Reviewer-Agent (Antigravity / Claude Sonnet 4.6 Thinking)  
**Alcance:** Lectura de código real. Sin modificación de archivos.  
**Tests ejecutados:** 45 ficheros / 464 tests — **todos PASSING** ✅

---

## 1. Resumen Ejecutivo

El proyecto está en un estado **funcionalmente avanzado**. La capa de dominio
es sólida y bien testeada. La capa de presentación cubre el flujo completo
Boot→Menu→HeroSelect→GameScene con turno del jugador y turno de IA. Sin embargo,
existen **4 bugs confirmados** y varias dependencias frágiles entre capas que,
bajo determinadas secuencias de juego, producirán comportamientos incorrectos
silenciosos.

---

## 2. Inventario de Funcionalidad — Estado por Área

### 2.1 Flujo de Escenas

| Funcionalidad | Estado | Notas |
|---|---|---|
| Boot → Menu (fade + carga de assets) | ✅ | `BootScene.onLoadComplete()` correcto |
| Menu → HeroSelect (fadeOut) | ✅ | `MenuScene.startGame()` correcto |
| HeroSelect → GameScene (con heroId) | ✅ | Pasa `heroId` como data object |
| GameScene → EndScene (MatchEnded) | ⚠️ | Handler implementado, pero `EndScene` NO existe en `game-config.ts` |
| HeroSelect → Menu (volver) | ✅ | `goBack()` con fadeOut correcto |
| EndScene (pantalla de fin) | ❌ | No existe — fuera de alcance IMPL-066 |

### 2.2 Inicialización de Partida

| Funcionalidad | Estado | Notas |
|---|---|---|
| Carga async de mazos (JSON) | ✅ | Repositorios JSON correctos |
| Construcción de Deck y Hero desde datos | ✅ | `MatchService.initMatch()` correcto |
| Reparto inicial de 4 cartas a cada jugador | ✅ | Bucle `for(i<4)` correcto |
| Shuffle del mazo antes del reparto | ✅ | `p1Deck.shuffle()` llamado |
| Jugador activo inicial al azar | ✅ | `Math.random() < 0.5` |
| Poblado visual de mano del jugador | ✅ | `handPlayer.addCard()` + drag registrado |
| Poblado visual de mano del rival (cara oculta) | ✅ | `HandView(scene, false)` muestra reverso |
| Actualización de HeroView con datos reales | ✅ | Destroy+recrear en callback `.then()` |

### 2.3 Flujo de Turno

| Funcionalidad | Estado | Notas |
|---|---|---|
| Inicio de turno → TurnStarted event | ✅ | `TurnEngine.startMatch()` → `startTurn()` |
| DrawPhase automática → MainPhase inmediata | ✅ | `transitionTo(DrawPhase)` + `transitionTo(MainPhase)` |
| PhaseChanged event al transicionar | ✅ | `TurnEngine.transitionTo()` emite evento |
| Sincronización `match.currentPhase` vía EventBus | ✅ | Handler en `MatchService.initMatch()` línea 135 |
| Fin de turno → TurnEnded → alternancia | ✅ | `TurnEngine.endTurn()` alterna jugadores |
| Nostalgia incrementa en 1 por turno (máx 10) | ✅ | `NostalgiaSystem.onTurnStart()` correcto |
| Resincronización de fase en `handlePlayerAction` | ✅ | `MatchService:157-160` lee `turnEngine.getCurrentPhaseName()` |

### 2.4 Acciones del Jugador

| Funcionalidad | Estado | Notas |
|---|---|---|
| Drag & drop de carta a zona | ✅ | `setDraggable()` explícito + handlers |
| Validación de fase en dragstart | ✅ | Comprueba `isPlayerTurn && currentPhase === "main"` |
| Detección de drop zone | ⚠️ | Coordenadas hardcodeadas no alineadas con BoardView — Bug F-1 |
| Jugar carta → descuento Nostalgia | ✅ | `PlayCardCommand` + `NostalgiaSystem.spend()` |
| Jugar carta → aparece en tablero (Character) | ✅ | `CharacterSummoned` → `BoardView.addCharacterSprite()` |
| Jugar Spell → toast con nombre | ✅ | `SpellCast` event handler correcto |
| Jugar Item → visual | ⚠️ | `ItemEquipped` event emitido, **sin handler visual** en GameScene |
| Atacar (Character vs Character) | ✅ | `AttackCommand` + `CombatResolver` + limpieza muertos |
| Atacar al héroe rival directamente | ❌ | **Bug #3** — AttackCommand rechaza siempre |
| Selección de atacante (clic en combat) | ✅ | `selectAttacker()` con glow pulsante |
| Cancelar selección (clic vacío / ESC) | ✅ | `clearAttackerSelection()` |
| Fin de turno con botón HUD | ✅ | Valida `isPlayerTurn` y fase `main/combat` |
| Habilidad de héroe (sin objetivo) | ⚠️ | `UseHeroPowerCommand` existe, pero **no está en GameAction** — Bug #4 |
| Crossover (modal + confirmación) | ⚠️ | Modal OK, pero `ACTIVATE_CROSSOVER` no pasa `MatchService` — Bug #4 |

### 2.5 Sistema de Eventos → Animaciones Visuales

| Funcionalidad | Estado | Notas |
|---|---|---|
| CharacterSummoned → sprite en tablero | ✅ | Animación scale |
| CharacterDestroyed → sprite eliminado | ✅ | Fadeout correcto |
| AttackResolved → animación de golpe | ✅ | `playAttackAnimation()` implementado |
| HeroDamaged → shake + HP actualizado | ✅ | Tween shake + `updateHealth()` |
| HeroHealed → HP actualizado | ✅ | Handler correcto |
| NostalgiaChanged → NostalgiaClockUI | ✅ | `hudRight.updateNostalgia()` |
| MomentumChanged → barra Momentum | ✅ | `updateMomentum()` con fade |
| ZoneEnvironmentChanged → ZoneBanner | ✅ | `zoneBanner.show()` |
| QuestProgressUpdated → HUD izquierdo | ✅ | `hudLeft.setActiveQuest()` |
| DeckEmpty → toast "Fatiga activa" | ✅ | Handler implementado |
| MatchEnded → transición EndScene | ⚠️ | Handler OK, EndScene no existe → Phaser error silencioso |
| ItemEquipped → visual | ❌ | Sin handler en GameScene |

### 2.6 Turno de la IA

| Funcionalidad | Estado | Notas |
|---|---|---|
| Detección de turno de IA en TurnStarted | ✅ | `if (!isPlayer)` en handler |
| Bloqueo visual de la mano del jugador | ✅ | `handPlayer.setEnabled(false)` + overlay |
| Ejecución async de IA con delays | ✅ | `opponentService.executeTurn()` con `delayFn` Phaser |
| GreedyAI decide cartas a jugar | ✅ | Implementado + 17 tests verdes |
| IA juega cartas (PLAY_CARD) | ✅ | Pasa por `matchService.handlePlayerAction()` |
| IA usa habilidad de héroe | ⚠️ | `opponent-service.ts:129-132` — solo loguea warning, no ejecuta |
| IA usa Crossover | ⚠️ | `opponent-service.ts:147` — solo loguea warning, no ejecuta |
| IA ataca (Character vs Character) | ✅ | `ATTACK` correctamente enrutado |
| IA ataca al héroe del jugador | ❌ | Bug #3 — `AttackCommand` rechaza ataques a héroe |
| IA termina turno (END_TURN) | ✅ | `handlePlayerAction({type:"END_TURN"})` |
| Desbloqueo de mano al terminar turno IA | ✅ | `TurnEnded` handler línea 416 |

### 2.7 Recursos y HUD

| Funcionalidad | Estado | Notas |
|---|---|---|
| NostalgiaClockUI con valor actual/máx | ✅ | Actualiza en cada `NostalgiaChanged` para p1 |
| Momentum visible cuando vida ≤ 15 | ⚠️ | Visual OK, `MomentumSystem` no conectado al flujo de turno |
| DeckCounter | ⚠️ | Solo actualiza en `DeckEmpty`(0). No decrece por robo |
| Botón "Fin de Turno" deshabilitado en turno rival | ✅ | `setEndTurnEnabled(isPlayer)` |
| Botón Crossover deshabilitado tras uso | ✅ | `setCrossoverUsed(true)` |
| Panel de Misión en HUD | ⚠️ | Visual implementado, `QuestManager` no conectado |
| ActionLog (log izquierdo) | ⚠️ | Construido, pero GameScene nunca llama a `addActionEntry()` |

### 2.8 Mecánicas Especiales

| Funcionalidad | Estado | Notas |
|---|---|---|
| Taunt (obligatoriedad) | ✅ | `AttackCommand:80-96` valida correctamente |
| Divine Shield | ✅ | `CombatResolver` + tests verdes |
| Poisonous | ✅ | `CombatResolver` + tests verdes |
| Stealth | ✅ | `CombatResolver` + tests verdes |
| Charge | ✅ | `PlayCardCommand:140-141` — `isExhausted = !hasCharge` |
| Fatiga (daño al robar con mazo vacío) | ⚠️ | Toast se muestra, pero daño real al héroe **NO se aplica** |
| Zonas dinámicas | ⚠️ | `ZoneView` + evento implementados, `ZoneManager` no conectado |
| Sinergias tribales | ⚠️ | `TribalSynergySystem` implementado y testeado, no conectado |
| Sistema de Misiones | ⚠️ | `QuestManager` implementado y testeado, no conectado |
| CrossoverManager | ⚠️ | Implementado y testeado, pero enrutamiento falla — Bug #4 |
| MomentumSystem | ⚠️ | Implementado y testeado, no conectado al flujo de turno |

---

## 3. Funcionalidades Fuera de Alcance de IMPL-066

| Funcionalidad | Razón |
|---|---|
| `EndScene` | Fuera de alcance (IMPL-067+) — Phaser emitirá error silencioso |
| Efectos reales de Hechizos | `SpellCast` emitido pero sin servicio de resolución |
| Efectos reales de Ítems | `ItemEquipped` emitido pero sin servicio de resolución |
| Battlecry individuales de personajes | Efectos del catálogo no implementados |
| USE_HERO_POWER / ACTIVATE_CROSSOVER en MatchService | Pendiente de IMPL-06x |
| Pantalla de pausa | Botón existe con `onClick` vacío |

---

## 4. Bugs Confirmados en Código Real

### Bug #1 — Acceso a sprite por índice de lista (frágil)

**Ubicación:** `game-scene.ts:214`
```ts
const sprite = this.handPlayer.list[this.handPlayer.list.length - 1];
```
Asume que el último elemento de `Container.list` es siempre el sprite recién
añadido. Funciona en condiciones actuales, pero es frágil ante refactors de
`HandView.addCard()` o cambios internos de Phaser.

### Bug #2 — CardPlayed + CharacterSummoned pueden crear conflicto de interactividad

**Ubicación:** `game-scene.ts:247-280`  
El handler de `CardPlayed` llama a `board.addCharacterSprite()` (línea 261).
El handler de `CharacterSummoned` también lo llama (línea 272) y además
registra `makeBoardCharacterClickable()`. La guardia `spriteMap.has()` evita el
sprite duplicado, pero el sprite creado por `CardPlayed` no tiene interactividad
de combate registrada. Solo el que pasa por `CharacterSummoned` la tiene.
En flujo actual (ambos emitidos por `PlayCardCommand` consecutivamente),
`CharacterSummoned` se procesa segundo y recrea el registro correctamente.

### Bug #3 (CRÍTICO) — Ataque directo al héroe rival inoperativo

**Ubicación:** `attack-command.ts:100-112`
```ts
// Por ahora solo soportamos Character vs Character en este comando
if (!defenderCharacter) {
  return { success: false, error: new InvalidTargetError(...) }
}
```
`findCharacterOnBoard()` busca por `instanceId` en el tablero. El héroe rival
se identifica por `staticId` (ej. `"HERO-002"`), no existe en el tablero →
siempre devuelve error. **El jugador y la IA nunca pueden ganar dañando
directamente al héroe rival.**

### Bug #4 (CRÍTICO) — USE_HERO_POWER y ACTIVATE_CROSSOVER no enrutados

**Ubicación:** `game-action.ts:59`, `match-service.ts:164-201`

`GameAction = PlayCardAction | AttackAction | EndTurnAction` — solo 3 variantes.
El switch en `handlePlayerAction` tiene `default: never` → devuelve error para
cualquier tipo desconocido. La GameScene usa `as unknown as GameAction` para
forzar el tipo, pero en runtime el valor no coincide con ningún `case`.  
**Habilidad de héroe y Crossover del jugador son inoperativos.**

---

## 5. Puntos de Integración Frágiles

### F-1 (ALTA) — Coordenadas de drop zone hardcodeadas vs posición real del tablero

**Archivos:** `game-scene.ts:789-796` y `board-view.ts:48`

`getDropZone()` usa `startX = 680`. `BoardView` calcula su posición:
```
BoardView.x = 136 (offset de escena)
BoardView.startX = (1648 - 560) / 2 = 544
zona "left" starts at: 136 + 544 + 80 = 760
```
La GameScene detecta la zona "left" desde x=760, pero `getDropZone()` la
calcula desde x=760 (680+80). **En este caso coinciden por casualidad**, pero
si se cambia el ancho de la escena o el layout del tablero, las zonas de drop
se desalinearán con los rectángulos visuales.

### F-2 (ALTA) — GameEventBus Singleton no se limpia entre partidas

**Archivo:** `match-service.ts:127-139`

`MatchService` registra handlers con `this.eventBus.on(...)` en `initMatch()`
sin guardar los `Unsubscribe`. `GameScene.shutdown()` desuscribe sus propios
handlers, pero los de `MatchService` permanecen activos. En una segunda partida,
los handlers de la primera se acumulan → **doble disparo de eventos y memory
leak**.

### F-3 (MEDIA) — NostalgiaSystem no emite evento al inicio por DeckCounter

No hay evento `CardDrawn` por robo individual. `DeckCounter` solo se actualiza
cuando el mazo se vacía. Durante toda la partida el contador visual del mazo
muestra el valor inicial.

### F-4 (MEDIA) — Servicios de dominio implementados pero no conectados al flujo

`MomentumSystem`, `TribalSynergySystem`, `QuestManager`, `ZoneManager` y
`CrossoverManager` están implementados y testeados en dominio, pero ninguno
se instancia ni se llama desde `MatchService` o los Commands. Sus eventos
(`MomentumChanged`, `SynergyUpdated`, `QuestProgressUpdated`,
`ZoneEnvironmentChanged`) nunca se emiten durante el juego real.

### F-5 (BAJA) — GameEventBus `isEmitting` bloquea emisiones anidadas silenciosamente

**Archivo:** `game-event-bus.ts:124-130`

Si un handler del EventBus dispara una acción que a su vez emite otro evento,
el segundo evento se silencia con un `console.warn`. Actualmente no ocurre en
el flujo normal, pero es una trampa latente para futuras mecánicas de reacción
(ej. Battlecry que dispara daño, que dispara HeroDamaged, que dispara MatchEnded).

---

## 6. Estado del Suite de Tests

- **45 ficheros / 464 tests — todos PASSING** ✅
- Cobertura de dominio: entidades, servicios, estados, IA, eventos, infraestructura
- Sin tests de presentación (Phaser requiere entorno de browser) excepto Button y ProgressBar
- Tests de `UseHeroPowerCommand` y `ActivateCrossoverCommand` existen y pasan,
  pero no cubren el path de integración con `MatchService` (donde está el bug real)

---

## 7. Top 3 Prioridades para Próximas Tareas

**Prioridad 1 — Ataque directo al héroe rival (Bug #3)**  
`AttackCommand` debe detectar si `defenderId` corresponde al `staticId` del
héroe rival y delegarlo a `CombatResolver.resolveAttack(attacker, hero, ...)`.
Sin esto la partida no puede terminar por la mecánica principal.

**Prioridad 2 — Enrutar USE_HERO_POWER y ACTIVATE_CROSSOVER (Bug #4)**  
Añadir `UseHeroPowerAction` y `ActivateCrossoverAction` al discriminated union
`GameAction` e implementar los casos en el switch de `MatchService.handlePlayerAction()`.
Instanciar `UseHeroPowerCommand` y `ActivateCrossoverCommand` ya implementados.

**Prioridad 3 — Limpieza del EventBus entre partidas (F-2)**  
`MatchService` debe guardar los `Unsubscribe` de sus handlers internos y
exponerlos en un método `dispose()` que `GameScene.shutdown()` llame.
Alternativa: `GameEventBus.resetInstance()` al inicio de cada `initMatch()`.

---

*Auditoría basada en inspección directa de código (lectura únicamente).*  
*Ningún archivo del proyecto fue modificado.*
