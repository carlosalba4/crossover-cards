# AGENTS.md — Reglas para agentes en este proyecto

Este archivo guía a cualquier agente de IA (opencode, Antigravity u otros) que
trabaje en este repositorio. Léelo antes de actuar.

## 1. Contexto del proyecto

- Proyecto académico: juego de cartas estratégico por turnos 1 vs 1 (Jugador vs IA).
- Stack: Phaser 4 + TypeScript + Vite. Tests con Vitest. Lint/Format con ESLint + Prettier (flat config, LF EOL, 2 espacios, comillas dobles).
- Metodología: cascada clásica en 14 días.
- Repo privado en GitHub.

## 2. Reglas de exploración del filesystem (CRÍTICAS)

- **Antes de leer archivos concretos, lista la estructura real**. No asumas
  nombres genéricos tipo `README.md`, `api.md`, `tutorial.md`.
- Para listar recursivamente: usa `glob "docs/**/*"` o `bash "ls -la docs/"`,
  NO `glob "docs/*"` (no recursivo).
- En la herramienta `read`, **siempre offset ≥ 1** (offset=0 da error en opencode).
- Si una ruta no existe, NO inventes contenido: reporta el error y prueba otra ruta.

## 3. Arquitectura del proyecto

Se aplica arquitectura en capas. Respeta esta separación:

- `src/domain/` — Lógica pura del juego. SIN dependencias de Phaser.
- `src/application/` — Casos de uso, comandos, servicios de orquestación.
- `src/infrastructure/` — Persistencia, repositorios, adaptadores externos.
- `src/presentation/` — Capa Phaser: escenas, sprites, UI.

Alias de paths disponibles:

- `@/...` → `src/...`
- `@domain/...` → `src/domain/...`
- `@application/...` → `src/application/...`
- `@infrastructure/...` → `src/infrastructure/...`
- `@presentation/...` → `src/presentation/...`

## 4. Convenciones de código

- TypeScript strict. NO usar `any` explícito.
- Naming:
  - Archivos: kebab-case (`turn-engine.ts`, `card-factory.ts`).
  - Clases e interfaces: PascalCase.
  - Funciones, métodos y variables: camelCase.
  - Constantes globales: SCREAMING_SNAKE_CASE.
- Patrones de diseño aplicables: State (fases del turno), Command (acciones del
  jugador), Strategy (IA del rival), Observer (event bus del juego), Factory
  (instanciar cartas desde JSON), Repository (acceso a datos de cartas).
- Principios: SOLID, Clean Code, separación lógica/presentación.

## 5. Testing

- Tests en `tests/`, nombrados `*.test.ts`.
- Estructura AAA (Arrange, Act, Assert).
- Cobertura mínima objetivo en dominio: 80%.

## 6. Documentación

- **Cada interacción con IA debe registrarse en `docs/ai-log.md`** usando la
  plantilla del archivo.
- Decisiones arquitectónicas → ADR numerado en `docs/decisions/`.
- Capturas de pantalla en `docs/screenshots/XX-fase/` con convención de nombres:
  `YYYY-MM-DD_XX-fase_tema_secuencial.png`.

## 7. Idioma

- Documentación, comentarios funcionales, mensajes de commit: **español**.
- Código (nombres de variables, funciones, clases): **inglés**.
- Prefijos de commit (Conventional Commits): `feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `test:`.

## 8. Estilo de respuesta para agentes

- Antes de modificar archivos, **propón un plan** y espera aprobación.
- Si una tarea es ambigua, **pregunta**, no asumas.
- Si hay error de herramienta, **reporta el error textualmente** y reintenta con
  estrategia distinta. No parchees a ciegas.
- Para tareas de exploración de archivos, empieza SIEMPRE con `glob "**/*"` o
  similar para conocer la estructura real.
