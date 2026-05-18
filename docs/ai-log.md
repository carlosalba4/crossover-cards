# Registro de Interacciones con IA

Este archivo registra todas las interacciones con herramientas de IA durante el proyecto.  
Es un entregable clave de la rúbrica: "es fundamental documentar todas las interacciones
con las herramientas de IA: prompts, agentes, indicaciones, resultados, aspectos clave
a destacar, creación o modificación de los json o .md correspondientes".

---

## Plantilla por interacción

### Interacción #XXX — YYYY-MM-DD HH:MM

- **Fase**: [Análisis / Diseño / Implementación / Pruebas / Despliegue / Memoria]
- **Agente**: [Nombre del agente, ej: PRD-Agent]
- **Herramienta**: [Antigravity / opencode / Ollama directo / API externa]
- **Modelo**: [Modelo concreto, ej: claude-sonnet-4.6-thinking, qwen2.5-coder:7b]
- **Tokens (entrada ≈ / salida ≈)**: [aproximación si la herramienta lo reporta]

**Objetivo**: [Qué se quería conseguir]

**Prompt** (resumen o referencia a `/prompts/...`):

> [Texto del prompt o ruta al archivo]

**Resultado**: [Qué generó la IA — resumen + referencia al artifact si aplica]

**Decisiones clave**: [Qué se aceptó, qué se rechazó, por qué]

**Iteraciones**: [Cuántas veces se reformuló el prompt]

**Notas**: [Observaciones relevantes]

---

## Registro

### Interacción #001 — 2026-05-18 (Setup inicial)

- **Fase**: Configuración previa (anterior a Análisis)
- **Agente**: Asistente de planificación (externo, vía claude.ai)
- **Herramienta**: claude.ai (chat web)
- **Modelo**: Claude (no especificado por la plataforma)
- **Tokens (entrada ≈ / salida ≈)**: N/A

**Objetivo**: Planificar el proyecto completo, definir stack tecnológico, metodología, fases, agentes IA y entregables. Decidir herramientas (Antigravity + opencode + Ollama) y producir la documentación base del repositorio.

**Prompt** (resumen):

> Conversación iterativa de planificación a partir del PDF del enunciado de la asignatura, refinando decisiones técnicas, restricciones de modelos, alcance del MVP y mecánicas innovadoras del juego.

**Resultado**:

- ADR-001 con el stack tecnológico definitivo.
- Estructura del repositorio.
- README, .gitignore, Grupo.txt.
- Configuración de opencode (Modelfile-\*, opencode.json).
- Sistema de capturas para la memoria.
- Plan de 14 días dividido en 6 fases.

**Decisiones clave**:

- Descartar Phaser Editor v5 por ser de pago.
- Combinar Antigravity (alto nivel, cloud) con opencode (bajo nivel, local) tal como pide el enunciado.
- Sprites de personajes reales pero con repo privado para mitigar IP.
- Mecánicas innovadoras seleccionadas: sinergia tribal, momentum, zonas dinámicas, misiones, crossover.

**Iteraciones**: ~8 mensajes de ida y vuelta para refinar el plan.

**Capturas asociadas**:

- `docs/screenshots/01-setup/2026-05-18_01-setup_antigravity-modelos-disponibles_01.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_github-colaboradores_02.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_repo-estructura-inicial_03.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_ollama-modelos-instalados_04.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_antigravity-workspace-abierto_05.png`

**Notas**: Esta interacción inicial fue de planificación pura. Los agentes operativos (PRD-Agent, Architect-Agent, etc.) se lanzarán dentro de Antigravity a partir del Paso 12.
