# Informe QA — Bloque IMPL-F (IMPL-053 a IMPL-067)

**Tarea:** IMPL-069  
**Agente:** qa-reviewer-agent  
**Fecha:** 2026-05-29  

---

## Archivos auditados

| Archivo | Líneas |
|---------|--------|
| `src/presentation/objects/card-sprite.ts` | 725 |
| `src/presentation/objects/hero-view.ts` | 286 |
| `src/presentation/objects/nostalgia-clock-ui.ts` | 150 |
| `src/presentation/objects/hand-view.ts` | 166 |
| `src/presentation/objects/board-view.ts` | 296 |
| `src/presentation/objects/zone-view.ts` | 273 |
| `src/presentation/ui/hud-overlay.ts` | 345 |
| `src/presentation/ui/zone-banner.ts` | 74 |
| `src/presentation/ui/turn-indicator.ts` | 72 |
| `src/presentation/ui/toast.ts` | 114 |
| `src/presentation/ui/action-log.ts` | 83 |
| `src/presentation/ui/deck-counter.ts` | 71 |
| `src/presentation/ui/tooltip.ts` | 260 |
| `src/presentation/scenes/game-scene.ts` | 835 |
| `src/presentation/scenes/end-scene.ts` | 366 |

---

## ✅ Lo que está bien

- **Sin `setTimeout`/`setInterval` directos**: todos los delays usan `this.scene.time.delayedCall(...)` o `this.time.delayedCall(...)`. ✔
- **Sin `any` explícito**: no se encontró ningún uso de `: any` en todo el bloque. ✔
- **Kebab-case en archivos**: todos los nombres de archivo siguen la convención. ✔
- **`destroy()` limpia tweens**: `CardSprite`, `HeroView`, `ZoneView`, `Tooltip` y `HUDOverlay` sobrescriben `destroy()` cancelando sus tweens/timers pendientes. ✔
- **`game-scene.ts` implementa `shutdown()`**: desuscribe todos los handlers del EventBus (`unsubscribers.forEach`) y llama a `matchService.dispose()`. ✔
- **`calculateFanLayout` exportada como función pura** en `hand-view.ts`: facilita tests unitarios sin Phaser. ✔
- **Constantes de diseño con nombre** en la mayoría de archivos (`RARITY_COLOR`, `ARCHETYPE_COLOR`, tokens de color). ✔
- **`import type`** utilizado correctamente en `board-view.ts` (l.4), `game-scene.ts` (l.22) y `card-sprite.ts` (l.2). ✔
- **`NostalgiaClockUI` sin dependencias de dominio**: solo recibe primitivos `(current, max)`. ✔
- **`Toast` usa tweens con `delay`** en lugar de `setTimeout` para la pausa de 2.5 s. ✔

---

## ⚠️ Issues encontrados

### 🔴 Severidad ALTA

---

#### ISSUE-F-01 — DIP violado: `GameScene` instancia `GameEventBus` directamente

- **Archivo:** `game-scene.ts:67`
- **Descripción:** `this.eventBus = GameEventBus.getInstance()` llama al singleton de infraestructura desde la capa de presentación. Según ADR-005 §Decisión, la capa de presentación debe *recibir* el `IEventBus` por inyección, no obtenerlo directamente. Además, la línea importa `GameEventBus` desde `@infrastructure` (l.20), creando una dependencia directa Presentación → Infraestructura.
- **Refactor sugerido:**

```ts
// game-scene.ts — init() recibe el bus ya compuesto
init(data: { heroId?: string; eventBus?: IEventBus }): void {
  this.heroId = data.heroId ?? "HERO-001";
  this.eventBus = data.eventBus ?? GameEventBus.getInstance(); // fallback temporal
}
```

- 📚 **Referencia:** ADR-005 §Decisión punto 3; `docs/02-architecture.md §3`.

---

#### ISSUE-F-02 — DIP violado: `GameScene` instancia repositorios de infraestructura directamente

- **Archivo:** `game-scene.ts:69-72`
- **Descripción:** `new JsonDeckRepository()`, `new JsonCardRepository()`, `new JsonHeroRepository()` se construyen dentro del método `create()` de una escena Phaser. La capa de Presentación no debería conocer las implementaciones concretas de repositorios; debería recibir abstracciones ya construidas.
- **Refactor sugerido:** Crear un `GameSceneComposer` que construya todas las dependencias y las pase vía `scene.start('GameScene', { matchService, eventBus })`.

- 📚 **Referencia:** SOLID DIP; `docs/02-architecture.md §3.4`.

---

#### ISSUE-F-03 — DIP violado: `GameScene` instancia `GreedyAI` directamente

- **Archivo:** `game-scene.ts:75`
- **Descripción:** `new OpponentService(new GreedyAI())` instancia una estrategia concreta de IA del dominio directamente en la escena. La escena no debería conocer qué implementación de `AIStrategy` se usa; eso pertenece a la composición raíz.
- **Refactor sugerido:** Pasar `opponentService` ya construido como dato de `init()`.

- 📚 **Referencia:** SOLID DIP; SOLID OCP.

---

#### ISSUE-F-04 — Coerción estructural para acceder a propiedad privada (`board-view.ts`)

- **Archivo:** `board-view.ts:181-185`
- **Descripción:**
```ts
type SpriteWithText = { vidText?: Phaser.GameObjects.Text };
const s = sprite as unknown as SpriteWithText;
if (s.vidText) { s.vidText.setText(...) }
```
Se accede a la propiedad privada `vidText` de `CardSprite` mediante coerción estructural. Rompe el encapsulamiento, es frágil ante refactors, y semánticamente equivale a `as any`.
- **Refactor sugerido:**

```ts
// card-sprite.ts — añadir método público
public updateHealth(current: number, max: number): void {
  if (this._card.type !== CardType.Character) return;
  this.vidText.setText(String(current));
  this.vidText.setColor(current < max ? "#FF3B3B" : "#6BFF8E");
  this.scene.tweens.add({ targets: this.vidText, scale: 1.5, duration: 150, yoyo: true });
}
```

- 📚 **Referencia:** Clean Code §Encapsulamiento; SOLID SRP.

---

### 🟡 Severidad MEDIA

---

#### ISSUE-F-05 — `GameScene.create()` excede el límite de responsabilidades (SRP)

- **Archivo:** `game-scene.ts:62-239`
- **Descripción:** El método `create()` tiene ~177 líneas y realiza: construcción de infraestructura, composición del UI, configuración de event handlers, inicio de la partida asíncrona y poblado inicial de mano/héroe. Al menos 5 responsabilidades distintas.
- **Refactor sugerido (quirúrgico):**

```ts
create(): void {
  this.cameras.main.setBackgroundColor("#0D0B1E");
  this.buildServices();   // Nuevo método privado
  this.buildUI();
  this.setupEventHandlers();
  this.startMatch();      // nuevo: encapsula la promesa
}
```

- 📚 **Referencia:** Clean Code §Funciones; SOLID SRP.

---

#### ISSUE-F-06 — `HUDOverlay` mezcla dos variantes de HUD en una misma clase (SRP)

- **Archivo:** `hud-overlay.ts:47-132`
- **Descripción:** `HUDOverlay` gestiona dos paneles completamente distintos controlados por `side: "left" | "right"`. Produce más de 10 propiedades opcionales (`?`) y dos conjuntos de responsabilidades que cambian por razones diferentes.
- **Refactor sugerido:** Separar en `LeftHUDPanel` y `RightHUDPanel` que compartan una interfaz `IHUDPanel`.

- 📚 **Referencia:** Clean Code §God Classes; SOLID SRP.

---

#### ISSUE-F-07 — Magic numbers sin constantes en `game-scene.ts` (zonas de drop)

- **Archivo:** `game-scene.ts:782-800`
- **Descripción:** Coordenadas de zonas de drop (`540`, `680`, `80`, `240`, `400`, `560`, `150`, `500`) dispersas como literales sin constantes nombradas.
- **Refactor sugerido:**

```ts
const DROP_ZONE_START_Y = 540;
const DROP_ZONE_OFFSET_X = 680;
const DROP_ZONE_LEFT_MIN = 80;
const DROP_ZONE_LEFT_MAX = 240;
// etc.
```

- 📚 **Referencia:** Clean Code §Magic Numbers.

---

#### ISSUE-F-08 — Magic numbers sin constantes en `hero-view.ts`

- **Archivo:** `hero-view.ts:67-68, 73-74, 79-80, 84, 111, 119`
- **Descripción:** Dimensiones del retrato (`64`, `68`, `32`), offset del glow (`-2`, `68`) y posiciones del contador de vida hardcodeadas. El valor `64` aparece al menos 6 veces.
- **Refactor sugerido:**

```ts
const PORTRAIT_SIZE = 64;
const GLOW_OFFSET = 2;
const GLOW_SIZE = PORTRAIT_SIZE + GLOW_OFFSET * 2; // 68
```

- 📚 **Referencia:** Clean Code §Magic Numbers.

---

#### ISSUE-F-09 — `Toast` usa estado estático mutable (`activeToasts: Toast[]`)

- **Archivo:** `toast.ts:17`
- **Descripción:** `private static activeToasts: Toast[] = []` es estado global mutable compartido entre escenas. Si Phaser destruye y recrea una escena, los toasts anteriores quedan como referencias a objetos destruidos, pudiendo provocar errores en `repositionToasts`.
- **Refactor sugerido:**

```ts
// toast.ts
public static reset(): void { Toast.activeToasts = []; }

// game-scene.ts — shutdown()
Toast.reset();
```

- 📚 **Referencia:** ADR-005 §Consecuencias Negativas (fugas de memoria).

---

#### ISSUE-F-10 — `game-scene.ts` usa `as unknown as GameAction` en 4 lugares

- **Archivo:** `game-scene.ts:567, 588, 611, 716`
- **Descripción:** Se usa `as unknown as GameAction` porque el tipo discriminado `GameAction` no cubre la variante `USE_HERO_POWER` con `targetId`. Silencia el compilador.
- **Refactor sugerido:**

```ts
// @application/types/game-action.ts — añadir variante
| { type: "USE_HERO_POWER"; playerId: string; targetId?: string }
```

- 📚 **Referencia:** AGENTS.md §4; typescript-strict SKILL.

---

#### ISSUE-F-11 — `HeroView.updateHealth()` crea `Graphics` dinámicamente sin garantía de destrucción

- **Archivo:** `hero-view.ts:197-209`
- **Descripción:** Cada vez que el héroe recibe daño se ejecuta `const flash = this.scene.add.graphics()` con un tween `onComplete: () => flash.destroy()`. Si la escena se destruye antes de que el tween termine, el `Graphics` queda sin destruir.
- **Refactor sugerido:** Pre-instanciar `damageFlash` como campo de clase y reutilizarlo:

```ts
// campo: private readonly damageFlash: Phaser.GameObjects.Graphics;
// En updateHealth():
this.scene.tweens.killTweensOf(this.damageFlash);
this.damageFlash.setAlpha(0.4);
this.scene.tweens.add({ targets: this.damageFlash, alpha: 0, duration: 300 });
```

- 📚 **Referencia:** ADR-005 §Consecuencias Negativas (fugas de memoria).

---

#### ISSUE-F-12 — `board-view.ts` importa la entidad `Character` del dominio

- **Archivo:** `board-view.ts:4`
- **Descripción:** `import type { Character } from "@domain/entities/character"` importa una entidad con lógica de negocio (tiene `takeDamage()`, `canAttack()`, etc.) en un objeto visual. Viola la restricción: _"presentation no importa de domain directamente salvo para tipos de datos o utilidades puras"_.
- **Refactor sugerido:**

```ts
// board-view.ts — DTO de presentación propio
export interface CharacterBoardData {
  instanceId: string; spriteKey: string; name: string;
  type: CardType; archetype: Archetype; rarity: Rarity;
  nostalgyCost: number; attack: number; currentHealth: number;
  description: string;
}
public addCharacterSprite(character: CharacterBoardData, zoneId: BoardZoneId, isPlayer: boolean): void
```

- 📚 **Referencia:** `docs/02-architecture.md §3`; ADR-005 §Contexto.

---

#### ISSUE-F-13 — Narrowing inseguro al poblar la mano inicial en `game-scene.ts`

- **Archivo:** `game-scene.ts:207-209, 227-229`
- **Descripción:** `(c as { attack?: number }).attack` y `(c as { currentHealth?: number }).currentHealth` son coerciones que silencian el compilador porque `ICard` base no declara esas propiedades.
- **Refactor sugerido:** Usar type guard o discriminated union:

```ts
const atk = c.type === CardType.Character && "attack" in c
  ? (c as CharacterCard).attack
  : undefined;
```

- 📚 **Referencia:** typescript-strict SKILL §Narrowing.

---

### 🟢 Severidad BAJA

---

#### ISSUE-F-14 — `ZoneBanner` usa `-60` como posición inicial sin nombre

- **Archivo:** `zone-banner.ts:6, 10, 50, 62`
- **Descripción:** El valor `-60` aparece 3 veces sin una constante nombrada.
- **Refactor sugerido:** `const BANNER_HIDDEN_Y = -60;`

---

#### ISSUE-F-15 — `TurnIndicator` usa array de posiciones hardcodeadas

- **Archivo:** `turn-indicator.ts:26`
- **Descripción:** `const positions = [-72, -18, 32, 75]` no es extensible si se añade una quinta fase.
- **Refactor sugerido:**

```ts
const INDICATOR_WIDTH = 200;
const positions = PHASES.map((_, i) =>
  -INDICATOR_WIDTH / 2 + (INDICATOR_WIDTH / PHASES.length) * (i + 0.5)
);
```

---

#### ISSUE-F-16 — Callback vacío de pausa en `HUDOverlay`

- **Archivo:** `hud-overlay.ts:80`
- **Descripción:** `onClick` del botón de pausa es un no-op con comentario `// Pausa no definida en scope actual`. Debería al menos emitir un evento.
- **Refactor sugerido:** `onClick: () => { this.emit("pause"); }`

---

#### ISSUE-F-17 — `drawDashedRect` duplicada en `board-view.ts` y `zone-view.ts`

- **Archivos:** `board-view.ts:266-294`; `zone-view.ts:230-264`
- **Descripción:** Función privada idéntica en ambas clases. Violación de DRY.
- **Refactor sugerido:**

```ts
// src/presentation/utils/graphics-utils.ts
export function drawDashedRect(
  gfx: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  dashLength = 6, gapLength = 6
): void { ... }
```

---

## 🔧 Tabla de prioridad de refactors

| # | Issue | Archivo | Acción |
|---|-------|---------|--------|
| 1 | ISSUE-F-01 | `game-scene.ts:67` | Inyectar `IEventBus` desde composición raíz |
| 2 | ISSUE-F-02 | `game-scene.ts:69-72` | Mover repos a composición raíz |
| 3 | ISSUE-F-04 | `board-view.ts:181-185` | Añadir `updateHealth()` a `CardSprite` |
| 4 | ISSUE-F-12 | `board-view.ts:4` | Crear DTO `CharacterBoardData` |
| 5 | ISSUE-F-09 | `toast.ts:17` | Añadir `Toast.reset()` y llamarlo en `shutdown()` |
| 6 | ISSUE-F-11 | `hero-view.ts:197` | Pre-instanciar `damageFlash` |
| 7 | ISSUE-F-10 | `game-scene.ts:567,588,611,716` | Ampliar unión `GameAction` |
| 8 | ISSUE-F-17 | `board-view.ts`, `zone-view.ts` | Extraer `drawDashedRect` a `graphics-utils.ts` |

---

## Verificaciones de criterios de aceptación

| Criterio | Resultado |
|----------|-----------|
| Sin `setTimeout`/`setInterval` directos | ✅ Ninguno encontrado |
| Sin `any` explícito | ✅ Ninguno encontrado |
| `game-scene.ts` limpia suscripciones en `shutdown()` | ✅ Correcto (ll.810-811) |
| Presentation no importa instancias de dominio que rompan dependencias | ⚠️ `board-view.ts:4` importa `Character` (entidad con lógica); `game-scene.ts:75` instancia `GreedyAI` |
| `GameEventBus` no instanciado directamente en presentación | ⚠️ `game-scene.ts:67` llama `GameEventBus.getInstance()` directamente |
