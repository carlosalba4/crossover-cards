# Crossover Cards

Juego de cartas estratégico por turnos 1 vs 1 (Jugador vs IA) desarrollado con
herramientas agénticas como proyecto académico de la asignatura Programación de
Inteligencia Artificial.

Stack: Phaser 4 + TypeScript (strict) + Vite. Tests: Vitest. Lint/Format:
ESLint + Prettier.

---

## Requisitos previos

- Node.js 24.x o superior ([nodejs.org](https://nodejs.org))
- npm 11.x o superior (incluido con Node.js)
- Navegador moderno con WebGL habilitado: Chrome 120+, Firefox 120+, Edge 120+
- Sistema operativo: Windows 10/11, macOS 13+ o Linux con soporte WebGL

---

## Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/Dubricius/cartas-turnos-ia.git

# 2. Entrar al directorio
cd cartas-turnos-ia

# 3. Instalar dependencias
npm install

# 4. Arrancar el servidor de desarrollo
npm run dev
```

5. Abrir `http://localhost:5173` en el navegador.

---

## Build de producción

```bash
# Genera el directorio dist/ optimizado
npm run build

# Levanta un servidor local para verificar la build
npm run preview
```

El juego estará disponible en `http://localhost:4173`.

---

## Verificación

El evaluador puede verificar el estado del proyecto con los siguientes comandos:

```bash
# Comprobación de tipos TypeScript (debe pasar sin errores)
npm run typecheck

# Análisis estático de código (debe pasar sin errores)
npm run lint

# Suite de tests unitarios e integración (debe mostrar todos los tests en verde)
npm test

# Build de producción (debe completarse con warning aceptable de bundle size)
npm run build
```

El warning de tamaño de bundle en la salida de `npm run build` es conocido y
está documentado en `docs/decisions/ADR-002-bundle-size.md`.

---

## Estructura del proyecto

```
cartas-turnos-ia/
├── src/
│   ├── domain/          # Lógica pura del juego (sin dependencias de Phaser)
│   ├── application/     # Casos de uso y servicios de orquestación
│   ├── infrastructure/  # Repositorios, adaptadores y persistencia
│   └── presentation/    # Escenas, sprites y UI de Phaser 4
├── tests/               # Tests unitarios e integración (Vitest)
├── assets/              # Sprites, fuentes y audio
├── docs/                # Documentación del proyecto
│   ├── decisions/       # Architecture Decision Records (ADR-001 a ADR-008)
│   ├── qa/              # Informes de revisión QA por fase
│   └── screenshots/     # Capturas por fase del proyecto
└── .agent/              # Workflows y skills de los agentes de IA
```

---

## Documentación adicional

| Documento | Ruta |
| --- | --- |
| Product Requirements Document | `docs/01-prd.md` |
| Arquitectura técnica | `docs/02-architecture.md` |
| Catálogo de agentes | `docs/03-agents.md` |
| Catálogo de cartas | `docs/04-card-catalog.md` |
| Diseño UI/UX | `docs/05-ui-design.md` |
| ADR-001: Stack tecnológico | `docs/decisions/ADR-001-stack-tecnologico.md` |
| ADR-002: Bundle size | `docs/decisions/ADR-002-bundle-size.md` |
| ADR-003: AGENTS.md y rules | `docs/decisions/ADR-003-agents-md-y-rules.md` |
| ADR-004: Patrón State (turnos) | `docs/decisions/ADR-004-patron-state-turnos.md` |
| ADR-005: Event Bus | `docs/decisions/ADR-005-event-bus-comunicacion.md` |
| ADR-006: Estrategia de identificadores | `docs/decisions/ADR-006-estrategia-identificadores.md` |
| ADR-007: Patrón Strategy (IA) | `docs/decisions/ADR-007-patron-strategy-ia.md` |
| ADR-008: Entrega sin despliegue público | `docs/decisions/ADR-008-entrega-sin-despliegue-publico.md` |
| Log de interacciones con IA | `docs/ai-log.md` |
| Informe QA Fase 4 | `docs/qa/fase-4-qa-report.md` |

---

## Integración continua

El proyecto cuenta con un workflow de GitHub Actions en
`.github/workflows/ci.yml` que se ejecuta en cada push a cualquier rama y en
cada pull request a main.

El pipeline ejecuta en orden: typecheck, lint, tests y build de producción. El
directorio `dist/` generado se sube como artifact descargable de la run con
retención de 7 días.

El estado de las ejecuciones es visible en la pestaña Actions del repositorio.

---

## Setup del entorno de desarrollo con IA (para nuevos miembros del equipo)

### Software agéntico requerido

- Antigravity ([antigravity.google/download](https://antigravity.google/download))
- Ollama ([ollama.com/download](https://ollama.com/download))

### Modelos locales en Ollama

```bash
ollama pull qwen2.5-coder:7b
ollama pull qwen3:8b
ollama pull deepseek-r1:8b
ollama pull phi4-mini
```

### Modelos personalizados de Ollama (contexto extendido a 16K)

```bash
ollama create qwen-coder-agent -f Modelfile-qwen-coder
ollama create qwen3-agent -f Modelfile-qwen3
```

### Opencode

```bash
# Windows
irm https://opencode.ai/install.ps1 | iex

# macOS/Linux
curl -fsSL https://opencode.ai/install | bash
```
