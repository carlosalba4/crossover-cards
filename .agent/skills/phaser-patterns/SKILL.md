---
name: phaser-patterns
description: Patrones específicos de Phaser 4 con TypeScript para el proyecto Crossover Cards.
trigger: cuando trabajes con escenas, sprites, animaciones o cualquier código Phaser.
---

# Skill: Phaser Patterns

## Convenciones de escenas
- Una escena por archivo en `src/presentation/scenes/`.
- Nombre del archivo en kebab-case: `game-scene.ts`.
- Clase exportada en PascalCase: `class GameScene extends Phaser.Scene`.
- Pasar la `key` en el constructor: `super({ key: "GameScene" })`.

## Ciclo de vida de escena
1. `init(data)`: recibir datos desde otra escena.
2. `preload()`: cargar assets que esta escena necesita.
3. `create()`: instanciar objetos visuales.
4. `update()`: lógica por frame (úsalo lo mínimo).

## Separación dominio / presentación
- Las escenas NO contienen lógica de juego: solo presentación.
- La lógica viene de `src/domain/` vía `MatchService` (`src/application/`).
- Las escenas se suscriben a eventos del `IEventBus` para reaccionar visualmente.
- Los inputs del usuario disparan `Commands` que llegan al `MatchService`.

## Sprites y assets
- Cargar assets en una sola escena `BootScene` y reutilizar.
- Usar atlas (sprite sheets) en lugar de imágenes individuales cuando sea posible.
- Nombrar texturas con el formato `<tipo>-<id>`: `card-pops-el-gentil`, `hero-axel-blaze`.

## Animaciones
- Definir animaciones en `BootScene` después del preload.
- Reutilizar animaciones por arquetipo si comparten estética.

## Performance
- Reusar objetos: `setActive(false)` mejor que `destroy()` para objetos que se reutilizan.
- Limitar partículas y efectos.
- Probar a 60 FPS en navegador moderno.

## Referencias del proyecto
- Arquitectura: `docs/02-architecture.md` (sección 3.4 Capa de Presentación).
- PRD: `docs/01-prd.md` (sección de UI/UX).