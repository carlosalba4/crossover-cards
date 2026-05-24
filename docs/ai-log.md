# Registro de Interacciones con IA

Este archivo registra todas las interacciones con herramientas de IA durante el proyecto.  
Es un entregable clave de la rúbrica: "es fundamental documentar todas las interacciones
con las herramientas de IA: prompts, agentes, indicaciones, resultados, aspectos clave
a destacar, creación o modificación de los json o .md correspondientes".

---

## Registro

### Interacción #001 — 2026-05-18 (Bootstrap del repositorio)

- **Fase**: Configuración previa (anterior a Análisis)
- **Agente**: Setup-Repo-Agent
- **Herramienta**: Antigravity (chat de agente)
- **Modelo**: Gemini 3 Flash
- **Tokens (entrada ≈ / salida ≈)**: ~1000 / ~2800

**Objetivo**: Crear la estructura completa de carpetas del repositorio y los archivos
base de documentación (README.md, .gitignore, .gitattributes, Grupo.txt). El agente
no toca todavía la configuración de IA ni el proyecto npm.

**Prompt** (ver `prompts/agents/setup-repo-agent.md`):
> Rol de agente bootstrapping bajo metodología cascada, tarea de crear estructura
> de carpetas y documentación base. Sin instalar dependencias ni configurar IA.

**Resultado**:
- 21 carpetas creadas (docs, prompts, src, tests, assets y sus subcarpetas).
- 14 archivos .gitkeep en las carpetas vacías.
- Grupo.txt, README.md, .gitignore, .gitattributes en raíz.

**Decisiones clave**:
- Modelo Gemini 3 Flash: tarea estructurada, no requiere razonamiento profundo,
  cuota generosa.
- .gitattributes con `eol=lf` para evitar problemas CRLF/LF entre Windows y Linux.
- Política de carpetas vacías con .gitkeep para mantener estructura visible
  desde el primer commit.

**Iteraciones**: 1 plan + 1 ejecución, aprobada sin cambios.

**Capturas asociadas**:
- `docs/screenshots/01-setup/2026-05-18_01-setup_agente-setup-repo-prompt_001a.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_agente-setup-repo-plan_001b.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_repo-estructura-resultado_001c.png`

**Notas**: El prompt completo está versionado en `prompts/agents/setup-repo-agent.md`.

**Nota de actualización (2026-05-20)**: La invocación original se realizó copiando manualmente el contenido del prompt en el chat (sistema agéntico inicial basado en `prompts/agents/setup-repo-agent.md`). Tras la formalización del sistema agéntico (ver Interacción #009), el agente está disponible como Workflow nativo de Antigravity en `.agent/workflows/setup-repo-agent.md` e invocable con `/setup-repo-agent`. La captura del prompt pegado se ha sustituido por una captura equivalente del workflow invocado. El contenido del prompt y el resultado generado no cambian.

---

### Interacción #002 — 2026-05-18 (Configuración de infraestructura IA)

- **Fase**: Configuración previa (anterior a Análisis)
- **Agente**: AI-Config-Agent
- **Herramienta**: Antigravity (chat de agente)
- **Modelo**: Gemini 3 Flash
- **Tokens (entrada ≈ / salida ≈)**: ~1400 / ~4200

**Objetivo**: Crear toda la documentación de decisiones de IA (ADR-001 y ADR-002),
el archivo de registro de interacciones (`ai-log.md`), y la configuración de
opencode + Ollama para usar modelos locales (Modelfile-qwen-coder, Modelfile-qwen3,
opencode.json). Versionar también los prompts de agentes en `prompts/agents/`.

**Prompt** (ver `prompts/agents/ai-config-agent.md`):
> Rol de agente de configuración de infraestructura IA. Crea documentación de
> decisiones, registro de interacciones, configuración de opencode con Ollama,
> y versiona prompts.

**Resultado**:
- `docs/ai-log.md` con plantilla y sección de registro.
- `docs/decisions/ADR-001-stack-tecnologico.md` con tabla, justificación y
  alternativas descartadas (Phaser Editor v5 de pago, VS Code+Continue no agéntico).
- `docs/decisions/ADR-002-bundle-size.md` preventivo sobre tamaño de bundle.
- `opencode.json` apuntando a http://localhost:11434/v1 con qwen-coder-agent
  y qwen3-agent.
- `Modelfile-qwen-coder` y `Modelfile-qwen3` con num_ctx 16384.
- Versionado de prompts en `prompts/agents/setup-repo-agent.md` y
  `prompts/agents/ai-config-agent.md`.

**Decisiones clave**:
- Antigravity + opencode + Ollama: cumple el requisito del enunciado de usar
  "tanto opencode como Antigravity ya que se complementan".
- ADR-001 documenta el descarte razonado de Phaser Editor v5 (12 USD/mes).
- num_ctx 16384 en Ollama porque el default de 4096 es insuficiente para
  tareas agénticas con opencode.
- `tool_call_format: json_fallback` en opencode.json para compatibilidad con
  modelos Qwen sin tool calling nativo perfecto.

**Iteraciones**: 1 plan + 1 ejecución, aprobada con un ajuste menor
(añadir ADR-002 al plan inicial).

**Capturas asociadas**:
- `docs/screenshots/01-setup/2026-05-18_01-setup_agente-ai-config-prompt_002a.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_agente-ai-config-plan_002b.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_adr-001-preview_002c.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_opencode-config_002d.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_ollama-modelos-instalados_002e.png`

**Notas**: A partir de esta interacción, opencode está listo para ser invocado
desde la terminal integrada de Antigravity en interacciones posteriores.

**Nota de actualización (2026-05-20)**: La invocación original se realizó copiando manualmente el contenido del prompt en el chat. Tras la formalización del sistema agéntico (ver Interacción #009), el agente está disponible como Workflow nativo en `.agent/workflows/ai-config-agent.md` e invocable con `/ai-config-agent`. La captura del prompt pegado se ha sustituido por una captura equivalente del workflow invocado. El contenido del prompt y el resultado generado no cambian.

---

### Interacción #003 — 2026-05-18 (Inicialización del proyecto Phaser 4)

- **Fase**: Configuración previa (anterior a Análisis)
- **Agente**: Project-Init-Agent
- **Herramienta**: Antigravity (chat de agente + terminal integrada)
- **Modelo**: Gemini 3 Flash
- **Tokens (entrada ≈ / salida ≈)**: ~2000 / ~5400

**Objetivo**: Inicializar el proyecto Phaser 4 + TypeScript + Vite + Vitest +
ESLint + Prettier, en modo strict, con paths de alias para arquitectura en capas,
y verificar que `npm run dev` muestra una escena minimalista en navegador.

**Prompt** (ver `prompts/agents/project-init-agent.md`):
> Rol de agente de bootstrapping técnico con 13 pasos numerados: npm init,
> instalar dependencias, generar configuración (tsconfig, vite, vitest, eslint,
> prettier), crear Hello World de Phaser 4, verificación final.

**Resultado**:
- `package.json` con 13 scripts npm (dev, build, preview, test, test:watch,
  test:ui, test:coverage, lint, lint:fix, format, format:check, typecheck).
- `tsconfig.json` en modo strict, sin baseUrl, paths con `./src/...`.
- `vite.config.ts`, `vitest.config.ts` con alias coherentes.
- `eslint.config.js` en flat config (ESLint 10), `.prettierrc.json`,
  `.prettierignore`.
- `index.html`, `src/main.ts` con BootScene mostrando tres textos.
- `tests/smoke.test.ts` con 2 tests (matemática básica + jsdom).
- Verificación: typecheck OK, lint inicial con 62 warnings CRLF resueltos con
  `npm run format` y `.gitattributes` (ya creado por AI-Config-Agent), 2/2 tests
  passing, build OK (~1.35 MB con warning aceptable documentado en ADR-002),
  dev arrancando en localhost:5173.

**Decisiones clave**:
- TypeScript strict completo: facilita aplicar SOLID y patrones, que la rúbrica
  valora explícitamente.
- ESLint flat config porque ESLint 10 ya no soporta `.eslintrc.cjs`.
- Quitar `baseUrl` de tsconfig por deprecación en TS 7.0; paths con `./`.
- Aceptar tamaño de bundle (ya documentado en ADR-002).

**Iteraciones**: 1 plan + 1 ejecución + 3 ajustes post-verificación:
  1. Quitar `baseUrl` de tsconfig (deprecation warning).
  2. Migrar de `.eslintrc.cjs` a `eslint.config.js` (ESLint 10).
  3. Ejecutar `npm run format` para resolver warnings CRLF de Prettier.

**Capturas asociadas**:
- `docs/screenshots/01-setup/2026-05-18_01-setup_agente-project-init-prompt_003a.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_agente-project-init-plan_003b.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_npm-init-resultado_003c.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_npm-install-phaser_003d.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_package-json-final_003e.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_npm-test-passing_003f.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_npm-build-success_003g.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_phaser-hello-world_003h.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_github-desktop-commit_003i.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_github-historial-commits_003j.png`

**Notas**: Las 3 iteraciones de ajuste reflejan el flujo realista de
verificación-corrección de un agente. En una ejecución agéntica completamente
autónoma, el agente habría reintentado los pasos automáticamente; aquí fueron
ajustados con supervisión humana.

**Nota de actualización (2026-05-20)**: La invocación original se realizó copiando manualmente el contenido del prompt en el chat. Tras la formalización del sistema agéntico (ver Interacción #009), el agente está disponible como Workflow nativo en `.agent/workflows/project-init-agent.md` e invocable con `/project-init-agent`. La captura del prompt pegado se ha sustituido por una captura equivalente del workflow invocado. El contenido del prompt y el resultado generado no cambian.

---

### Interacción #004 — 2026-05-18 (Configuración y verificación de opencode)

- **Fase**: Configuración previa (anterior a Análisis)
- **Agente**: Test-Opencode-Agent (verificación inicial)
- **Herramienta**: opencode (dentro de la terminal de Antigravity)
- **Modelos probados**: 
  - Qwen 2.5 Coder 7B (custom: qwen-coder-agent, num_ctx 16384, temp 0.2)
  - Qwen 3 8B (custom: qwen3-agent, num_ctx 16384, temp 0.3)
- **Tokens (entrada ≈ / salida ≈)**: ~800 / ~1400

**Objetivo**: Verificar que la infraestructura local de IA está completamente funcional:
Ollama corriendo, modelos personalizados creados, opencode instalado, conexión 
opencode ↔ Ollama operativa, y capacidad agéntica de lectura de filesystem.

**Prompt** (en chat de opencode):
> Lista los archivos de la carpeta docs/ y dime brevemente para qué sirve cada uno
> según su nombre y contenido.

**Resultado**: Funcional. Tras 3 iteraciones internas del agente, leyó correctamente 
`docs/ai-log.md` y produjo un resumen válido del propósito del archivo.

**Iteraciones**:
1. **Primer intento — Qwen2.5-Coder con agente "Plan"**: el modelo escribió la 
   llamada al tool (`{"name": "bash", "arguments": {"command": "ls docs/"}}`) en 
   texto plano en lugar de invocarla. Causa: el agente "Plan" de opencode no 
   ejecuta acciones, solo planifica. Diagnóstico correcto: no era un problema 
   del modelo sino del modo de agente.
2. **Segundo intento — Qwen3 8B con agente "Build"**: ejecución agéntica real, 
   pero con peculiaridades:
   - El modelo alucinó nombres de archivos típicos (`README.md`, `api.md`, 
     `tutorial.md`) y trató de leerlos sin verificar existencia. Fallaron con 
     "File not found".
   - Usó offset=0 en el primer `read`, lo que dio error (opencode requiere 
     offset ≥ 1). Tras el error, ajustó a offset=1.
   - Posteriormente usó `glob "docs/*"` para listar archivos reales. El patrón 
     no es recursivo, así que solo detectó `ai-log.md` (ignoró `decisions/`).
   - Finalmente leyó `ai-log.md` con éxito y produjo un resumen correcto.
   - Duración total: 1 min 51 s.

**Decisiones clave**:
- A partir de ahora, tareas mecánicas (boilerplate, tests, refactor pequeño) se 
  delegan a opencode + Qwen local con el agente "Build".
- Tareas exploratorias, de razonamiento o multi-archivo se hacen en Antigravity 
  con Gemini/Claude para evitar iteraciones excesivas.
- En prompts para modelos locales, se recomienda **forzar exploración inicial** 
  (ej.: "Empieza listando los archivos con `glob docs/**/*` antes de leerlos") 
  para reducir alucinaciones.
- Documentar limitaciones encontradas como parte de la gestión de tokens.

**Limitaciones identificadas (Qwen3 8B local)**:
- Tendencia a alucinar nombres de archivos genéricos antes de listar lo real.
- Patrones de glob no siempre óptimos (no recursivos por defecto).
- Requiere más iteraciones internas que modelos cloud → más tiempo de respuesta.

**Capturas asociadas**:
- `docs/screenshots/01-setup/2026-05-18_01-setup_ollama-modelos-custom-creados_010-01.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_ollama-qwen-coder-test_010-02.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_opencode-version_010-03.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_opencode-modelos-disponibles_010-04.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_opencode-primera-ejecucion-agentica_010-05.png`
- `docs/screenshots/01-setup/2026-05-18_01-setup_gpu-uso-ollama_010-06.png` (opcional)
- `docs/screenshots/01-setup/2026-05-18_01-setup_antigravity-opencode-split_010-07.png`

**Notas**: Las limitaciones identificadas no son bloqueantes; al contrario, justifican 
plenamente la arquitectura híbrida cloud/local del proyecto y validan el reparto de 
tareas según capacidad del modelo. Esta verificación cierra la fase de Setup.

**Nota sobre capturas**: La captura `010-05` (primera ejecución agéntica) se 
omitió porque la prueba reveló limitaciones del modelo Qwen3 que motivaron 
una revisión de la elección de modelos locales (ver Interacción #005).

**Acción correctora aplicada**: Tras la primera prueba con limitaciones, se creó 
`AGENTS.md` en la raíz del proyecto con reglas explícitas sobre exploración de 
filesystem, convenciones de código, arquitectura y estilo de respuesta. Opencode 
lo lee automáticamente. 

**Segunda prueba (con AGENTS.md cargado)**: el modelo Qwen3 8B respetó las reglas, 
usó `glob "docs/**/*"` para listado recursivo, leyó los archivos reales antes de 
resumirlos, y no alucinó nombres. La precisión mejoró sustancialmente.

Conclusión: para modelos locales de tamaño medio (≤10B), un AGENTS.md bien 
formulado tiene impacto comparable a cambiar a un modelo más grande. Esta decisión 
queda documentada como ADR-003.

---

### Interaccion #005 — 2026-05-19 (Generacion del PRD)

- **Fase**: Analisis de Requisitos (Dia 2 de la cascada)
- **Agente**: PRD-Agent
- **Herramienta**: Antigravity (chat de agente)
- **Modelo**: Claude Sonnet (via Google Antigravity)
- **Tokens (entrada ≈ / salida ≈)**: ~4500 / ~18000

**Objetivo**: Redactar el Product Requirements Document (PRD) completo del juego de
cartas estrategico por turnos, siguiendo el plan de 19 secciones aprobado por el equipo.
El documento debe servir como entregable de la fase de Analisis y contener toda la
especificacion funcional y de producto.

**Prompt** (ver `prompts/agents/prd-agent.md`):
> Rol de Product Manager senior especializado en juegos de cartas coleccionables. Tarea:
> redactar un PRD completo, profesional y exhaustivo para el proyecto academico. Se
> proporciona el concepto del juego, mecanicas, heroes, sistema de cartas, requisitos
> y restricciones detallados. Formato Markdown, sin codigo, sin emoji.

**Resultado**:
- `docs/01-prd.md` creado con 1292 lineas y ~80 KB.
- 19 secciones completas: portada, introduccion, vision, objetivos, restricciones,
  alcance MVP, concepto de juego, sistema de cartas, heroes, 5 mecanicas innovadoras
  (M1-M5), IA del oponente, easter egg, 50 requisitos funcionales (RF), 20 requisitos
  no funcionales (RNF), 8 casos de uso en formato Cockburn, criterios de aceptacion
  Given/When/Then para las 5 mecanicas, arquitectura de referencia en capas, 8 riesgos
  identificados, glosario de 25 terminos y apendice de interacciones IA.
- Tabla de 20 cartas iniciales del MVP (10 por mazo): FLO-001 a FLO-010 y AVE-001 a AVE-010.
- Fichas detalladas de los 2 heroes con alternativas de nombre razonadas.
- 8 riesgos con probabilidad, impacto y plan de mitigacion.

**Decisiones clave**:
- **Nombre del juego**: se propone "Crossover Cards" como nombre de trabajo.
  Marcado como [PENDIENTE DE VALIDACION].
- **Generacion en partes**: el documento supero el limite de tokens del modelo (64k)
  y se genero en 4 bloques consecutivos escritos directamente al fichero, evitando
  la limitacion de tokens de salida de la API.
- **Seccion 16 anadida**: arquitectura de referencia en capas incluida por iniciativa
  del agente al considerarse esencial para el proyecto academico. Comunicado al equipo.
- **7 supuestos marcados**: se identificaron 7 decisiones de diseno que requieren
  validacion del equipo antes de comenzar la fase de Diseno.
- **Patron Strategy para la IA**: documentado en la seccion 10 como guia para la
  implementacion del patron de diseno en `src/application/`.

**Iteraciones**:
1. Propuesta de tabla de contenidos (19 secciones) y espera de aprobacion del equipo.
2. Aprobacion recibida. Generacion del documento completo en 4 bloques por limite de tokens.
3. Verificacion final: 1292 lineas, 80 KB, todas las secciones presentes.

**Supuestos adoptados [PENDIENTE DE VALIDACION]**:
- Nombre de heroes: "El Flojo" y "El Aventurero".
- Limite por carril en zonas dinamicas: pendiente de ajuste de balance.
- Opcion de rendicion voluntaria del jugador: incluida como pendiente.
- IA Medio gana >= 40% contra IA Facil: umbral por verificar empiricamente.
- Las cartas Epicas tienen limite de 2 copias por mazo.

**Capturas asociadas**:
- `docs/screenshots/02-analisis/2026-05-19_02-analisis_prd-agent-prompt_005a.png`
- `docs/screenshots/02-analisis/2026-05-19_02-analisis_prd-plan-aprobado_005b.png`
- `docs/screenshots/02-analisis/2026-05-19_02-analisis_prd-generado-completo_005c.png`

**Notas**: El documento generado es completamente apto para incluirse como capitulo de
la memoria PDF final. La generacion en partes por limite de tokens es un patron que se
documentara en AGENTS.md para futuras interacciones con documentos extensos.

**Nota de actualización (2026-05-20)**: La invocación original se realizó copiando manualmente el contenido del prompt en el chat. Tras la formalización del sistema agéntico (ver Interacción #009), el agente está disponible como Workflow nativo en `.agent/workflows/prd-agent.md` e invocable con `/prd-agent`. La captura del prompt pegado se ha sustituido por una captura equivalente del workflow invocado. El contenido del prompt y el resultado generado no cambian.

---

### Interacción #006 — 2026-05-19 (Refactorización del PRD)

- **Fase**: Análisis de Requisitos (días 1-2)
- **Agente**: PRD-Refactor-Agent
- **Herramienta**: Antigravity (chat de agente)
- **Modelo**: Claude Sonnet 4.6 Thinking
- **Tokens (entrada ≈ / salida ≈)**: ~15000 / ~3000

**Objetivo**: Refactorizar el PRD inicial para adaptar el juego al universo
"Crossover Cards" definitivo: renombrar el recurso de Maná a Nostalgia 
(representado con reloj de bolsillo), sustituir los héroes por El Lich y 
Axel Blaze, reemplazar las 20 cartas iniciales por personajes/hechizos/objetos 
de series de animación (Hora de Aventuras, Regular Show, Bob Esponja, Dragon Ball, 
Ben 10, Inazuma Eleven, Doraemon, Uncle Grandpa, Gumball, Chowder, Agallas, 
Fanboy & Chum Chum), redefinir los 4 arquetipos para que sean coherentes con 
el nuevo casting, y adaptar zonas, misiones y easter egg al tono nostálgico.

**Prompt** (ver `prompts/agents/prd-refactor-agent.md`):
> Rol de Game Designer senior con tarea de refactorización quirúrgica del PRD, 
> con trasfondo embebido de cada personaje (sin necesidad de internet), lista 
> exhaustiva de cambios obligatorios, secciones explícitamente protegidas que 
> no debe tocar, y formato de plan → aprobación → ejecución.

**Resultado**:
- Plan de cambios propuesto y aprobado.
- `docs/01-prd.md` actualizado con: 
  - Título reducido a "Crossover Cards".
  - Recurso renombrado a Nostalgia con representación visual de reloj de bolsillo.
  - Héroes El Lich (mago oscuro) y Axel Blaze (luchador físico) con habilidades 
    "Hechizo Ancestral" y "Disparo Llamarada".
  - 20 cartas nuevas distribuidas en 2 mazos (10 + 10).
  - 4 arquetipos nuevos: [rellena los nombres reales que decidió Sonnet].
  - Zonas genéricas: Zona Caótica, Zona Mágica, Zona de Combate, Zona Misteriosa.
  - Misiones genéricas independientes de arquetipos.
  - Easter egg coherente con la nostalgia (a elegir entre tres opciones propuestas).

**Decisiones clave**:
- Universo crossover absurdo asumido como pieza narrativa (multiverso colapsado).
- Trasfondo de personajes embebido en el prompt para evitar dependencia de wikis 
  externas.
- Cambios quirúrgicos: solo modificadas las secciones afectadas, el resto del PRD 
  intacto.

**Iteraciones**: 
1. 1 plan + 1 ejecución.
2. Revisión manual y completa del documento.
3. Correcciones quirúrjicas y última ejecución.

**Capturas asociadas**:
- `docs/screenshots/02-analysis/2026-05-19_02-analysis_prd-refactor-prompt-pegado_01.png`
- `docs/screenshots/02-analysis/2026-05-19_02-analysis_prd-refactor-plan-cambios_02.png`
- `docs/screenshots/02-analysis/2026-05-19_02-analysis_prd-refactor-aplicando_03.png`
- `docs/screenshots/02-analysis/2026-05-19_02-analysis_prd-refactor-cartas-nuevas_04.png`
- `docs/screenshots/02-analysis/2026-05-19_02-analysis_prd-refactor-arquetipos_05.png`
- `docs/screenshots/02-analysis/2026-05-19_02-analysis_prd-refactor-heroes_06.png`

**Notas**: Esta refactorización cierra la fase de Análisis. El PRD queda como base 
estable para el diseño técnico de la siguiente fase.

**Nota de actualización (2026-05-20)**: La invocación original se realizó copiando manualmente el contenido del prompt en el chat. Tras la formalización del sistema agéntico (ver Interacción #009), el agente está disponible como Workflow nativo en `.agent/workflows/prd-refactor-agent.md` e invocable con `/prd-refactor-agent`. La captura del prompt pegado se ha sustituido por una captura equivalente del workflow invocado. El contenido del prompt y el resultado generado no cambian.

---

### Interacción #007 — 2026-05-20 (Redacción del Documento de Arquitectura)

- **Fase**: Diseño (Días 3-4 de la cascada)
- **Agente**: Architect-Agent
- **Herramienta**: Antigravity (chat de agente)
- **Modelo**: Gemini 3.1 Pro + Claude Sonnet 4.6 Thinking (vía Google Antigravity)
- **Tokens (entrada ≈ / salida ≈)**: ~25000 / ~30000

**Objetivo**: Completar y estructurar el documento de Arquitectura Técnica (`docs/02-architecture.md`) resolviendo los puntos de diseño pendientes de la arquitectura del juego (Event Bus, Decorator vs Modifier, distribución de zonas y carriles, etc.).

**Resultado**:
- `docs/02-architecture.md` completamente redactado con las 16 secciones propuestas en el plan.
- Integración de diagramas Mermaid para la vista general de capas, la máquina de estados del turno, el patrón de IA y el flujo de dependencias entre capas.
- Justificación detallada de los patrones aplicados (State, Command, Strategy, Observer/Event Bus, Factory, Repository, Singleton controlado) y de las decisiones pragmáticas sobre bufos (`Modifier[]`) y renderizado en Phaser (tablero único superpuesto).

**Decisiones clave**:
- Mantener pureza estricta de la capa de Dominio (cero referencias a Phaser).
- Adoptar array de modificadores `Modifier[]` para bufos en el MVP y reservar el patrón Decorator como mejora futura documentada, a fin de evitar sobre-ingeniería en el ciclo de 14 días.
- Zonas lógicas integradas sobre el mismo lienzo visual del tablero en Phaser, simplificando la geometría gráfica.

**Nota de actualización (2026-05-20)**: La invocación original se realizó copiando manualmente el contenido del prompt en el chat. Tras la formalización del sistema agéntico (ver Interacción #009), el agente está disponible como Workflow nativo en `.agent/workflows/architect-agent.md` e invocable con `/architect-agent`. La captura del prompt pegado se ha sustituido por una captura equivalente del workflow invocado. El contenido del prompt y el resultado generado no cambian.

---

### Interacción #008 — 2026-05-20 (Redacción de ADR-004 a ADR-007)

- **Fase**: Diseño (Días 3-4 de la cascada)
- **Agente**: Architect-Agent
- **Herramienta**: Antigravity (chat de agente)
- **Modelo**: Gemini 3.1 Pro (vía Google Antigravity)
- **Tokens (entrada ≈ / salida ≈)**: ~12000 / ~15000

**Objetivo**: Redactar los 4 registros de decisiones arquitectónicas (ADRs) restantes propuestos en la sección 16 del documento de arquitectura técnica, siguiendo el formato estricto del proyecto.

**Resultado**:
- `docs/decisions/ADR-004-patron-state-turnos.md` creado, justificando el patrón State para las fases del turno frente a switch/case procedural o FSM externas.
- `docs/decisions/ADR-005-event-bus-comunicacion.md` creado, detallando el desacoplamiento entre dominio y Phaser usando un Event Bus propio e Inversión de Dependencias (DIP).
- `docs/decisions/ADR-006-estrategia-identificadores.md` creado, describiendo el enfoque híbrido de strings legibles para datos estáticos y UUID v4 para instancias en ejecución.
- `docs/decisions/ADR-007-patron-strategy-ia.md` creado, validando el patrón Strategy para la IA del oponente y la decisión pragmática de utilizar un array simple de `Modifier[]` para buffs/debuffs en lugar de Decorator puro.

**Decisiones clave**:
- Estricto apego a las convenciones de formato de ADRs previas, incluyendo justificación, consecuencias y alternativas descartadas.
- Registro coherente de las motivaciones tácticas de simplificación para la entrega del MVP en 14 días sin sacrificar la testabilidad del dominio.

**Nota de actualización (2026-05-20)**: La invocación original se realizó copiando manualmente el contenido del prompt en el chat. Tras la formalización del sistema agéntico (ver Interacción #009), el agente está disponible como Workflow nativo en `.agent/workflows/adr-writer-agent.md` e invocable con `/adr-writer-agent`. La captura del prompt pegado se ha sustituido por una captura equivalente del workflow invocado. El contenido del prompt y el resultado generado no cambian.

---

### Interacción #009 — 2026-05-20 (Formalización del sistema agéntico)

- **Fase**: Diseño (días 3-4)
- **Agente**: Refactor manual del sistema agéntico (no agente IA)
- **Herramienta**: Edición manual + Antigravity (verificación visual)
- **Modelo**: N/A (refactor estructural)
- **Tokens (entrada ≈ / salida ≈)**: N/A

**Objetivo**: Formalizar el sistema agéntico del proyecto convirtiendo los prompts 
versionados en sistemas reales de Antigravity (Workflows + Skills + Rules). 
Detectamos que los `prompts/agents/*.md` originales eran solo documentación 
copiada manualmente; la formalización los convierte en agentes invocables 
nativamente con `/` desde cualquier chat.

**Acciones realizadas**:
- Creada estructura `.agent/workflows/` con 17 workflows (8 ya ejecutados + 9 previstos).
- Creada estructura `.agent/skills/` con 6 skills cargables bajo demanda:
  - clean-code, phaser-patterns, solid-principles, testing-vitest, 
    card-game-mechanics, typescript-strict.
- `AGENTS.md` ampliado con sección "Sistema agéntico del proyecto".
- `prompts/agents/` mantenida como documentación legible con README aclaratorio.

**Decisiones clave**:
- Sistema agéntico real con Workflows + Skills + Rules, no solo prompts manuales.
- Cumple literalmente la sección del enunciado: "agentes, flujos, skills, rules".
- Documentación dual: `.agent/workflows/` ejecutable + `prompts/agents/` legible.
- Skills diseñadas para cargarse bajo demanda según el tipo de tarea, optimizando 
  uso de contexto del agente.

**Iteraciones**: 1 (formalización completa).

**Capturas asociadas**:
- `docs/screenshots/03-design/2026-05-20_03-design_antigravity-workflows-cargados_01.png`
- `docs/screenshots/03-design/2026-05-20_03-design_antigravity-rules-agentsmd_02.png`
- `docs/screenshots/03-design/2026-05-20_03-design_antigravity-workflows-dropdown_03.png`
- `docs/screenshots/03-design/2026-05-20_03-design_antigravity-workflow-invocacion_04.png`

**Notas**: Esta refactorización es una mejora del enfoque inicial. Las interacciones 
#001 a #008 fueron ejecutadas con copia-pega manual de prompts; a partir de #010 
(Agents-Catalog-Agent) las invocaciones se harán vía `/nombre-agente` aprovechando 
el sistema agéntico formal. El catálogo completo de agentes en `docs/03-agents.md` 
documentará este sistema con detalle.

---

### Interacción #010 — 2026-05-21 (Catálogo de Agentes)

- **Fase**: Diseño (días 3-4)
- **Agente**: Agents-Catalog-Agent
- **Herramienta**: Antigravity (workflow `/agents-catalog-agent`)
- **Modelo**: Claude Sonnet 4.6 Thinking
- **Tokens (entrada ≈ / salida ≈)**: ~15000 / ~20000

**Objetivo**: Producir el catálogo formal de agentes del proyecto (`docs/03-agents.md`)
con 19 fichas de agentes, diagrama Mermaid del flujo agéntico, política de gestión de
tokens, distinción entre Workflows y Custom Agents nativos de Antigravity, inventario
de skills/rules/MCP y política de revisión humana.

**Prompt** (ver `.agent/workflows/agents-catalog-agent.md`):
> Rol de AI Operations Engineer senior. Tarea: producir el catálogo formal de agentes
> del proyecto Crossover Cards con 11 secciones, 19 fichas de agentes y diagrama Mermaid.
> Requisitos adicionales del profesor: flujo jerárquico con Implementation-Orchestrator-Agent,
> distinción Workflows vs Custom Agents nativos, skills externas como decisión abierta.

**Resultado**:
- `docs/03-agents.md` creado con 864 líneas y ~45 KB.
- 11 secciones completas: introducción, visión general, catálogo (19 fichas), flujo
  con diagrama Mermaid, política de tokens, tipología de agentes, skills/rules/MCP,
  revisión humana, trazabilidad, riesgos y conclusiones.
- 9 fichas de agentes ejecutados (#001–#009) y 10 fichas de agentes previstos (#010–#019).
- Diagrama Mermaid con flujo jerárquico: Implementation-Orchestrator-Agent delega en
  Domain-Dev, Phaser-Dev, AI-Opponent y Tester con ciclos de retroalimentación.
- Sección 6 con distinción explícita Workflows vs Custom Agents nativos (tabla comparativa).
- Decisión abierta documentada sobre skills externas (Phaser 4 oficial, Anthropic TypeScript).

**Decisiones clave**:
- 19 agentes en lugar de los 18 del enunciado original: se añade Implementation-Orchestrator-Agent
  como nuevo agente orquestador, requerido explícitamente por el profesor.
- Implementation-Orchestrator-Agent implementado como Custom Agent nativo de Antigravity
  (no como Workflow), dado que requiere memoria persistente entre sesiones y capacidades
  de delegación extendidas.
- Documento generado en múltiples bloques consecutivos por el límite de tokens de salida
  del modelo (64K tokens), siguiendo el patrón ya documentado en la interacción #005.

**Iteraciones**:
1. Lectura de todos los archivos fuente del repositorio (AGENTS.md, ai-log.md, ADR-001 a ADR-007, prompts).
2. Propuesta de plan con tabla de contenidos y lista de 19 agentes. Aprobada.
3. Generación del documento en 4 bloques consecutivos por límite de tokens.
4. Verificación: 864 líneas, 11 secciones presentes, estructura correcta.

**Capturas asociadas**:
- `docs/screenshots/03-design/2026-05-21_03-design_agents-catalog-workflow-invocacion_010a.png`
- `docs/screenshots/03-design/2026-05-21_03-design_agents-catalog-plan-aprobado_010b.png`
- `docs/screenshots/03-design/2026-05-21_03-design_agents-catalog-documento-generado_010c.png`

**Notas**: El catálogo queda como documento vivo. Se actualizará al inicio de cada fase
con los datos reales de ejecución. La interacción #009 (formalización del sistema agéntico)
queda retroactivamente vinculada a este catálogo como su precedente directo.

**Pendientes identificados**:
- [PENDIENTE] Capturas de pantalla de la sesión (añadir a `docs/screenshots/03-design/`).
- [PENDIENTE] Actualizar ficha #009 con el número de interacción correcto (#010) una vez
  que el ai-log quede cerrado.
---

### Interaccion #011 - 2026-05-21 (Catalogo de Cartas y Balance)

- **Fase**: Diseno (Dias 3-4 de la cascada)
- **Agente**: Card-Catalog-Agent
- **Herramienta**: Antigravity (workflow `/card-catalog-agent`)
- **Modelo**: Claude Sonnet 4.6 Thinking
- **Tokens (entrada aprox / salida aprox)**: ~20000 / ~25000

**Objetivo**: Producir el catalogo numerico definitivo de las 20 cartas del juego
(`docs/04-card-catalog.md`) con costes de Nostalgia, stats, habilidades formales,
justificaciones de balance, sinergias, habilidades de heroe definitivas, esquema JSON
de ejemplo y tests de balance previstos (con rangos numericos) para el Tester-Agent
y el AI-Opponent-Agent.

**Prompt** (ver `.agent/workflows/card-catalog-agent.md`):
> Rol de Game Designer senior especializado en balance de CCGs (Hearthstone, MTG Arena,
> Legends of Runeterra, Marvel Snap). Tarea: producir el catalogo numerico completo
> de las 20 cartas del MVP con todas las fichas, justificaciones de balance y tests.

**Resultado**:
- `docs/04-card-catalog.md` creado con ~831 lineas.
- 11 secciones: introduccion (con cambio terminologico canonico), sistema economico,
  distribucion por rareza, distribucion por arquetipo, 10 fichas del mazo de El Lich,
  10 fichas del mazo de Axel Blaze, habilidades de heroe, tabla resumen ejecutiva,
  esquema JSON de ejemplo (4 cartas), 8 tests de balance con rangos numericos, y
  5 decisiones [PENDIENTE DE VALIDACION].
- Resolucion de todas las ambiguedades del plan: Patricio Estrella (6 outcomes RNG
  inyectable via Modifier[]), 3 Legendarias en Axel Blaze (aceptado para mazos
  preconstruidos), Sobrenatural como arquetipo situacional, nombre "Tornado de Fuego"
  como canonico para Axel Blaze, y misiones como pool neutral compartido.
- Cambio terminologico establecido: "Criatura" -> "Personaje" (es) / "Character" (en).

**Decisiones clave**:
- La formula vanilla orienta pero no dicta: los stats del PRD se respetan y se
  justifican retrospectivamente. Ninguna carta fue modificada, solo documentada.
- Patricio Estrella: el efecto aleatorio se implementa como Modifier fijo asignado
  al jugarse (no al atacar), con RNG inyectable para tests deterministicos.
- Documento generado en multiples bloques consecutivos via Add-Content PowerShell
  por limitaciones del token limit de salida del modelo (64K tokens).
- La entrada #011 del ai-log cierra la fase de Diseno de documentacion.

**Iteraciones**:
1. Lectura del PRD, arquitectura, workflow y skill de mecanicas.
2. Propuesta de plan con curva de Nostalgia, tabla vanilla, distribucion de rareza/arquetipo.
3. Aprobacion del plan con 5 resoluciones de pendientes y cambio terminologico.
4. Generacion del documento en 4 bloques por limitacion de tokens.
5. Verificacion: 831 lineas, 11 secciones, todas las fichas presentes.

**Capturas asociadas**:
- `docs/screenshots/03-design/2026-05-21_03-design_card-catalog-workflow-invocacion_011a.png`
- `docs/screenshots/03-design/2026-05-21_03-design_card-catalog-plan-aprobado_011b.png`
- `docs/screenshots/03-design/2026-05-21_03-design_card-catalog-documento-generado_011c.png`

**Notas**: Este documento es la referencia definitiva de balance para el Domain-Dev-Agent
(implementacion TypeScript de entidades y datos JSON), el Tester-Agent (tests de balance
TB-001 a TB-008) y el AI-Opponent-Agent (evaluacion de valor de cartas para GreedyAI
y ThreatAwareAI). El archivo `assets/data/cards.json` se generara siguiendo el esquema
JSON de la seccion 9 de este catalogo.

---

### Interacción #012 — 2026-05-22 (Refactorización Terminológica)

- **Fase**: Diseño / Alineación de Documentación
- **Agente**: Terminology-Refactor-Agent
- **Herramienta**: Antigravity (workflow `/terminology-refactor-agent`)
- **Modelo**: Gemini 3.5 Flash (vía Google Antigravity)
- **Tokens (entrada aprox / salida aprox)**: ~15000 / ~3000

**Objetivo**: Propagar de forma consistente el cambio de nombre de la entidad "Criatura/Creature" a "Personaje" (español) y "Character" (inglés) en los archivos `docs/01-prd.md` y `docs/02-architecture.md`, añadiendo notas de actualización al inicio de ambos archivos.

**Prompt** (ver `.agent/workflows/terminology-refactor-agent.md`):
> Procede con el reporte previo de sustituciones en docs/01-prd.md y docs/02-architecture.md. NO toques docs/04-card-catalog.md ni los workflows.

**Resultado**:
- `docs/01-prd.md` modificado quirúrgicamente en 5 ubicaciones técnicas (cambios de `Creature` -> `Character`, `CreatureCard` -> `CharacterCard`, `SingleCreature` -> `SingleCharacter`, `AllCreatures` -> `AllCharacters`, `addCreature` -> `addCharacter`) y añadiendo la nota de actualización. Se respetó la mención a "Criatura" en el glosario (línea 1247) por ser una explicación comparativa de terminología de otros juegos de cartas.
- `docs/02-architecture.md` modificado quirúrgicamente en 1 ubicación de prosa en español (línea 1120, cambiando "criatura" -> "personaje") y añadiendo la nota de actualización.

**Decisiones clave**:
- Respetar el contexto explicativo comparativo en el glosario del PRD.
- No tocar `docs/04-card-catalog.md` que ya estaba alineado.
- Mantener la fecha `2026-05-21` en la nota de actualización tal y como se solicita en el formato del workflow.

**Iteraciones**:
1. Lectura y análisis de ocurrencias en `docs/01-prd.md` y `docs/02-architecture.md`.
2. Presentación del Reporte Previo de sustituciones y justificaciones de exclusión.
3. Aprobación del usuario y aplicación de las modificaciones quirúrgicas y adición de notas de actualización.

---

### Interacción #013 — 2026-05-23 (Diseño UI/UX)

- **Fase**: Diseño (Días 3-4 de la cascada)
- **Agente**: UI-Design-Agent
- **Herramienta**: Antigravity (workflow `/ui-design-agent`)
- **Modelo**: Claude Sonnet 4.6 Thinking (vía Google Antigravity)
- **Tokens (entrada ≈ / salida ≈)**: ~30000 / ~35000

**Objetivo**: Producir el documento de diseño visual completo del juego (`docs/05-ui-design.md`)
con 13 secciones: sistema visual base (paleta, tipografía, iconografía, rejilla), wireframes
ASCII de las 5 escenas (Boot, Menu, HeroSelect, Game, End), 10 componentes UI reutilizables,
diseño detallado de la carta, estados interactivos, animaciones clave, easter egg completo,
especificación de assets con nombre exacto de archivo, accesibilidad, diagrama de flujo Mermaid
y notas de hand-off para el Phaser-Dev-Agent.

**Prompt** (ver `.agent/workflows/ui-design-agent.md`):
> Workflow UI-Design-Agent invocado con las siguientes decisiones cerradas del equipo:
> reloj de bolsillo híbrido analógico+digital, sprites de series autorizados para uso académico,
> cartas en abanico estilo Hearthstone, slot libre con contorno punteado, zona de misión
> en HUD lateral expansible. Estrategia de assets definitiva: sprites de personajes de Fandom/
> DeviantArt/Spriters Resource, UI de Kenney.nl, fondos y reloj con Stable Diffusion SDXL,
> audio de Freesound CC0 + Kenney Audio Pack + Pixabay Music.

**Resultado**:
- `docs/05-ui-design.md` creado con ~1100 líneas y ~55 KB.
- 13 secciones completas:
  - §1 Introducción con principios visuales y referencias.
  - §2 Sistema visual base: 10 tokens de color semánticos, 5 colores de arquetipo, 4 de rareza,
    3 de feedback; escala tipográfica de 7 niveles (Bangers + Nunito); 12 iconos con URL;
    sistema de espaciado 4/8/16/24/32px; rejilla 1280×720 documentada con ASCII.
  - §3 Wireframes ASCII de las 5 escenas con lista de elementos, estados y transiciones.
  - §4 10 componentes UI: CardSprite, NostalgiaClockUI, MomentumBar, HeroPortrait,
    HealthCounter, DeckCounter, EndTurnButton, Tooltip, Toast, Modal.
  - §5 Diseño de carta en 4 versiones: Anverso Personaje, Anverso Hechizo/Objeto, Reverso,
    versión tablero.
  - §6 Tabla de 10 estados interactivos con feedback visual e indicador no-color.
  - §7 11 animaciones clave con duración exacta y descripción de implementación Phaser.
  - §8 Easter egg: EasterEggTV con 10 clics, secuencia VHS, filtro sepia 2 turnos, easter
    egg secundario en BootScene con 3 clics.
  - §9 Especificación de assets: 20 sprites de personajes, 4 héroes, reloj de Nostalgia,
    5 marcos de rareza, 5 fondos de escena, 12 iconos HUD, 15 archivos de audio.
    Cada asset con nombre exacto kebab-case, tipo, resolución, fuente específica, URL y estado.
  - §10 Accesibilidad: tabla de 7 criterios WCAG 2.1 AA con ratios de contraste calculados.
  - §11 Diagrama Mermaid stateDiagram-v2 del flujo completo entre escenas.
  - §12 Notas para Phaser-Dev-Agent: mapeo componente→clase Phaser, atlas de texturas,
    convenciones de naming, gestión de animaciones y recomendaciones de rendimiento.
  - §13 6 decisiones [PENDIENTE DE VALIDACIÓN] identificadas (DU-001 a DU-006).

**Decisiones cerradas en esta interacción**:
- NostalgiaClockUI híbrido: reloj analógico 128×128px con manecillas animadas + indicador
  digital "X/10" superpuesto. Manecillas avanzan 0.5s al ganar Nostalgia, retroceden 0.3s al gastar.
- Cartas en mano: abanico ligero (-10° a +10°), hover a rotación 0° + escala 115% + elevación 20px.
- Sprites de personajes: autorizados para uso académico (repositorio privado, sin distribución
  comercial). Nota legal a incluir en la memoria.
- Estrategia de assets definitiva: sprites Fandom/DeviantArt, UI Kenney, fondos SDXL, audio CC0.
- Slot libre visible con contorno punteado tenue. Zona de misión en HUD lateral expansible.

**Nota legal documentada** (§9 del documento):
> Los sprites de personajes pertenecen a sus respectivos propietarios (Cartoon Network,
> Nickelodeon, Toei Animation, Level-5, Man of Action Studios). Su uso es exclusivamente
> académico, sin fines comerciales, en el marco de la asignatura Desarrollo con IA.

**Iteraciones**:
1. Lectura de PRD, arquitectura, catálogo de cartas y skill phaser-patterns.
2. Propuesta del plan (tabla de contenidos, paleta borrador, tipografía propuesta). Aprobado.
3. Resolución de 5 decisiones pendientes por parte del equipo + estrategia de assets definitiva.
4. Generación del documento en 4 bloques consecutivos por límite de tokens (64K) del modelo.
5. Adición de entrada en ai-log.md.

**Capturas asociadas**:
- `docs/screenshots/03-design/2026-05-23_03-design_ui-design-workflow-invocacion_013a.png`
- `docs/screenshots/03-design/2026-05-23_03-design_ui-design-plan-aprobado_013b.png`
- `docs/screenshots/03-design/2026-05-23_03-design_ui-design-documento-generado_013c.png`

**Notas**: El documento `docs/05-ui-design.md` es el entregable de diseño que cierra la fase
de Diseño (días 3-4) y habilita el inicio de la implementación con el Phaser-Dev-Agent y el
Domain-Dev-Agent. Los 6 puntos DU-001 a DU-006 deben resolverse antes de iniciar GameScene.

---

### Interacción #014 — 2026-05-22 (Setup de Fase 3 - Sistema agéntico jerárquico)

- **Fase**: Implementación (días 5-10) - SETUP
- **Agente**: (Refactor manual del sistema agéntico, sin invocación a modelo)
- **Herramienta**: Edición manual de workflows en Antigravity
- **Modelo**: N/A
- **Tokens (entrada / salida)**: N/A

**Objetivo**: Preparar el sistema agéntico jerárquico para la fase de 
Implementación según indicación del profesor. Crear el agente orquestador 
(Implementation-Orchestrator-Agent), rellenar los workflows en esqueleto 
de los 5 agentes especialistas (Domain-Dev, Phaser-Dev, AI-Opponent, Tester, 
QA-Reviewer), formalizar el formato YAML estándar de tareas delegadas.

**Acciones realizadas**:
- Creación de rama `fase-3-implementacion` en git con push a remoto.
- Creación de carpeta `docs/screenshots/04-implementation/`.
- Verificación del proyecto local: typecheck, lint, test, dev server arrancando.
- Creación de `.agent/workflows/implementation-orchestrator-agent.md`.
- Rellenado de `.agent/workflows/domain-dev-agent.md`.
- Rellenado de `.agent/workflows/phaser-dev-agent.md`.
- Rellenado de `.agent/workflows/ai-opponent-agent.md`.
- Rellenado de `.agent/workflows/tester-agent.md`.
- Rellenado de `.agent/workflows/qa-reviewer-agent.md`.
- Copias legibles correspondientes en `prompts/agents/`.
- Creación de `docs/task-format.md` con formato YAML estándar.

**Decisiones clave**:
- Flujo jerárquico con orquestador y delegaciones según indicación del 
  profesor (Rubén).
- Formato YAML estándar de tareas para consistencia entre agentes.
- IDs de tareas con prefijo por fase (IMPL, TEST, DEPLOY, MEM).
- Criterios de aceptación obligatoriamente verificables con comandos.
- Trabajo en rama dedicada `fase-3-implementacion` con merge a `main` vía PR 
  al cierre de fase.

**Iteraciones**: 1 (refactor estructural).

**Capturas asociadas**:
- `docs/screenshots/04-implementation/2026-05-22_04-implementation_branch-fase3-creada_01.png`
- `docs/screenshots/04-implementation/2026-05-22_04-implementation_verificacion-inicial_02.png`
- `docs/screenshots/04-implementation/2026-05-22_04-implementation_helloworld-phaser4_03.png`
- `docs/screenshots/04-implementation/2026-05-22_04-implementation_orchestrator-agent-creado_04.png`
- `docs/screenshots/04-implementation/2026-05-22_04-implementation_orchestrator-en-dropdown_05.png`
- `docs/screenshots/04-implementation/2026-05-22_04-implementation_workflows-listos_06.png`
- `docs/screenshots/04-implementation/2026-05-22_04-implementation_task-format-creado_07.png`

**Notas**: Setup completo del sistema agéntico jerárquico. La próxima interacción 
(#015) será la primera invocación real del Implementation-Orchestrator-Agent 
para el bloque "Capa de Dominio parte 1".

---

### Interacción #015 — 2026-05-22 (Bloque IMPL-A: Capa de Dominio parte 1)

- **Fase**: Implementación (días 5-10)
- **Agente orquestador**: Implementation-Orchestrator-Agent
- **Agentes especialistas**: Domain-Dev-Agent (N invocaciones)
- **Herramienta**: Antigravity (workflows invocados con `/`)
- **Modelo del orquestador**: Claude Sonnet 4.6 Thinking
- **Modelo de los especialistas**: Claude Sonnet 4.6 Thinking
- **Tokens (entrada / salida)**: ~[XX] / ~[XX]

**Objetivo**: Implementar la primera parte de la capa de dominio del juego: 
tipos base (CardType, Rarity, Archetype), entidad base Card, entidades 
concretas (Character, Spell, Item), Hero y colecciones (Deck, Hand). 
Cobertura objetivo 80% en cada archivo.

**Plan delegado por el Orchestrator**: [N] tareas atómicas en formato YAML:
- IMPL-A1: Tipos base (card-types.ts).
- IMPL-A2: Entidad base Card.
- IMPL-A3: Character extends Card.
- IMPL-A4: Spell extends Card.
- IMPL-A5: Item extends Card.
- IMPL-A6: Hero.
- IMPL-A7: Deck.
- IMPL-A8: Hand.

**Resultado**:
- [N] archivos de código en `src/domain/`.
- [N] archivos de tests en `tests/domain/`.
- Cobertura total del bloque: [XX]%.
- Typecheck, lint y test pasan.
- [N] commits incrementales en rama `fase-3-implementacion`.

**Decisiones clave**:
- Orchestrator delegó por orden de dependencias (tipos antes que entidades, 
  Card antes que sus subclases).
- Cada tarea con criterios verificables (typecheck + test + cobertura).
- Modelo Sonnet Thinking para todas las invocaciones (suficiente para 
  dominio puro).
- [Si hubo iteraciones correctivas]: describir cuáles.

**Iteraciones**:
1. Plan del Orchestrator aprobado.
2. Ejecución secuencial de las [N] tareas.
3. [Si hubo correctivas]: descripción.

**Capturas asociadas**:
- [Lista de capturas con sus paths]

**Notas**: Primera invocación real del Implementation-Orchestrator-Agent. 
Sistema agéntico jerárquico funcionando con delegaciones. Próximo bloque: 
IMPL-B Capa de Dominio parte 2 (TurnEngine, CombatResolver, sistemas).