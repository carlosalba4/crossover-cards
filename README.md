# Crossover Cards

A turn-based 1-vs-1 strategy card game (player vs AI opponent), built almost entirely through an **agentic AI development workflow**. Academic capstone project for the *Artificial Intelligence Programming* module of the AI & Big Data Specialization at Instituto Nebrija.

The game has a nostalgic crossover theme: cards featuring characters from animated series, two playable heroes (The Lich and Axel Blaze) and a central resource called *Nostalgia* that players manage every turn.

**Stack:** Phaser 4 · TypeScript (strict) · Vite · Vitest · ESLint + Prettier · GitHub Actions

---

## Highlights

- **19 specialised AI agents** covering the full lifecycle: requirements (PRD), architecture, ADRs, card catalogue, UI design, implementation, opponent AI, QA, CI and documentation. Every agent works under a human-in-the-loop *plan → approve → execute* cycle.
- **Dual-model architecture:**
  - Cloud models in an agentic IDE (Google Antigravity with Gemini and Claude) for architecture, documentation and complex code.
  - Local models via Ollama and opencode (Qwen2.5-Coder, Qwen3) for repetitive tasks and boilerplate, keeping token usage under control.
- **Clean, layered architecture:** pure domain logic with no Phaser dependencies, plus application, infrastructure and presentation layers. Uses the State pattern for turns, the Strategy pattern for the AI opponent and an event bus between layers.
- **AI opponent** with interchangeable strategies: greedy, and threat-aware heuristics. It decides card plays, hero powers and the once-per-match Crossover mechanic.
- **Quality:**
  - 486 automated tests across 48 files.
  - 92–100% coverage on the domain layers.
  - TypeScript strict mode with zero errors.
  - CI pipeline: type-check → lint → test → build.
- **Full traceability:** 8 ADRs, QA reports and a log of every interaction with AI tools (`docs/ai-log.md`).

> Most project documentation (PRD, architecture, ADRs, AI log) is written in Spanish, as required by the course.

---

## Prerequisites

- Node.js 24.x or later ([nodejs.org](https://nodejs.org))
- npm 11.x or later (bundled with Node.js)
- A modern browser with WebGL enabled: Chrome 120+, Firefox 120+ or Edge 120+

---

## Getting started

```bash
git clone https://github.com/carlosalba4/crossover-cards.git
cd crossover-cards
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Production build

```bash
npm run build     # generates an optimised dist/ folder
npm run preview   # serves the build at http://localhost:4173
```

The bundle-size warning during the build is known and documented in `docs/decisions/ADR-002-bundle-size.md`.

### Quality checks

```bash
npm run typecheck   # TypeScript type checking
npm run lint        # static analysis
npm test            # unit and integration tests
```

---

## Project structure

```
crossover-cards/
├── src/
│   ├── domain/          # Pure game logic (no Phaser dependencies)
│   ├── application/     # Use cases and orchestration services
│   ├── infrastructure/  # Repositories and adapters
│   └── presentation/    # Phaser 4 scenes, sprites and UI
├── tests/               # Unit and integration tests (Vitest)
├── assets/              # Sprites, fonts and audio
├── docs/                # Project documentation
│   ├── decisions/       # Architecture Decision Records (ADR-001 to ADR-008)
│   ├── qa/              # QA review reports
│   └── screenshots/     # Screenshots for each project phase
└── .agent/              # AI agent workflows and skills
```

---

## Documentation

| Document | Path |
| --- | --- |
| Project report (PDF) | `docs/Crossover_Cards_Report.pdf` |
| Product Requirements Document | `docs/01-prd.md` |
| Technical architecture | `docs/02-architecture.md` |
| AI agent catalogue | `docs/03-agents.md` |
| Card catalogue | `docs/04-card-catalog.md` |
| UI/UX design | `docs/05-ui-design.md` |
| AI interaction log | `docs/ai-log.md` |
| QA report (phase 4) | `docs/qa/fase-4-qa-report.md` |
| ADR-001: Tech stack | `docs/decisions/ADR-001-stack-tecnologico.md` |
| ADR-002: Bundle size | `docs/decisions/ADR-002-bundle-size.md` |
| ADR-003: AGENTS.md and rules | `docs/decisions/ADR-003-agents-md-y-rules.md` |
| ADR-004: State pattern for turns | `docs/decisions/ADR-004-patron-state-turnos.md` |
| ADR-005: Event bus | `docs/decisions/ADR-005-event-bus-comunicacion.md` |
| ADR-006: Identifier strategy | `docs/decisions/ADR-006-estrategia-identificadores.md` |
| ADR-007: Strategy pattern for the AI | `docs/decisions/ADR-007-patron-strategy-ia.md` |
| ADR-008: Delivery without public deployment | `docs/decisions/ADR-008-entrega-sin-despliegue-publico.md` |

---

## Continuous integration

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and on pull requests to `main`. It runs type-check, lint, tests and the production build, then uploads `dist/` as a downloadable artifact, kept for 7 days.

---

## Scope and known limitations

The project was scoped as an MVP for the course deadline. Some mechanics described in the PRD, such as Momentum, tribal synergies, quests and dynamic zones, are designed and partly implemented in the domain layer but not yet wired into the match flow. This is documented as technical debt in the QA report and the project report.

---

## AI development environment (optional)

To reproduce the agentic workflow used to build the project:

- [Google Antigravity](https://antigravity.google/download), the agentic IDE (cloud models)
- [Ollama](https://ollama.com/download), for local models

```bash
ollama pull qwen2.5-coder:7b
ollama pull qwen3:8b
ollama pull deepseek-r1:8b
ollama pull phi4-mini

# Custom models with a 16K context window
ollama create qwen-coder-agent -f Modelfile-qwen-coder
ollama create qwen3-agent -f Modelfile-qwen3
```

- [opencode](https://opencode.ai), the terminal agent connected to Ollama:

```bash
# Windows
irm https://opencode.ai/install.ps1 | iex

# macOS / Linux
curl -fsSL https://opencode.ai/install | bash
```

---

## Authors

- **Carlos Alba Buenestado** · [github.com/carlosalba4](https://github.com/carlosalba4)
- **Arturo Gómez Marín**

## Disclaimer

This is a non-commercial academic project. All characters, names and artwork from third-party animated series belong to their respective owners and are used for educational purposes only.
