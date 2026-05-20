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