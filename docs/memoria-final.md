# Memoria Final del Proyecto: Crossover Cards

**Asignatura:** Programación de Inteligencia Artificial (IA)
**Autores:** Carlos Alba Buenestado, Arturo Gómez Marín
**Fecha:** 31 de mayo de 2026

---

## Índice

1. [Introducción y objetivos del proyecto](#1-introducción-y-objetivos-del-proyecto)
2. [Metodología](#2-metodología)
3. [Sistema agéntico](#3-sistema-agéntico)
4. [Desarrollo por fases](#4-desarrollo-por-fases)
   - [4.1. Fase 1: Setup y Análisis](#41-fase-1-setup-y-análisis)
   - [4.2. Fase 2: Diseño](#42-fase-2-diseño)
   - [4.3. Fase 3: Implementación](#43-fase-3-implementación)
   - [4.4. Fase 4: Pruebas (QA)](#44-fase-4-pruebas-qa)
   - [4.5. Fase 5: Despliegue](#45-fase-5-despliegue)
   - [4.6. Fase 6: Memoria final](#46-fase-6-memoria-final)
5. [Arquitectura y calidad del código](#5-arquitectura-y-calidad-del-código)
6. [Resultado final](#6-resultado-final)
7. [Conclusiones y posibles mejoras futuras](#7-conclusiones-y-posibles-mejoras-futuras)
8. [Anexos](#8-anexos)
   - [Anexo I: Tabla de trazabilidad agente-archivo](#anexo-i-tabla-de-trazabilidad-agente-archivo)
   - [Anexo II: Índice de ADRs](#anexo-ii-índice-de-adrs)

---

## 1. Introducción y objetivos del proyecto

### 1.1. Introducción

**Crossover Cards** es un juego de cartas estratégico por turnos 1 vs 1 (Jugador frente a Inteligencia Artificial), desarrollado como proyecto final de la asignatura "Programación de Inteligencia Artificial (IA)". 

El juego se ambienta en un universo *crossover* donde personajes icónicos de series de animación clásicas (como *Hora de Aventuras*, *Bob Esponja*, *Inazuma Eleven* o *Historias Corrientes*) se enfrentan en duelos temáticos. Combina la profundidad táctica y estratégica de los juegos de cartas modernos con el humor y la estética desenfadada de las animaciones de la década de los 2000, permitiendo al jugador controlar a héroes singulares (como El Lich o Axel Blaze) y gestionar el recurso central de la partida: la *Nostalgia*.

El propósito fundamental de este desarrollo no es comercial, sino estrictamente **académico**, operando como banco de pruebas para la implementación de un sistema basado en agentes de IA que automatice la ingeniería de software y la generación de componentes complejos de un videojuego web (usando Phaser 4, TypeScript y Vite).

### 1.2. Objetivos del proyecto

Los objetivos del proyecto se dividen en dos vertientes claramente diferenciadas: los requisitos propios de la evaluación académica y las metas funcionales del juego entregado.

#### Objetivos Académicos
1. **Desarrollo asistido por IA:** Delegar el grueso del desarrollo (planificación, análisis, diseño, programación y pruebas) a un sistema agéntico dual (combinando Antigravity en la nube y opencode/Ollama en local), documentando estrictamente todas y cada una de las interacciones.
2. **Arquitectura y patrones:** Aplicar una arquitectura en capas limpia que aísle la lógica del juego (Dominio) de la presentación visual (Phaser), implementando patrones de diseño estructurados (State, Command, Strategy, Observer, Factory, Repository).
3. **Metodología en cascada:** Estructurar el avance en fases rígidas e iterativas, adaptadas al marco de tiempo disponible (14 días).
4. **Calidad de software (QA):** Alcanzar una cobertura mínima del 80% en los tests de la capa de Dominio, así como garantizar un código sin errores en TypeScript *strict mode* y sin advertencias en ESLint.

#### Objetivos del Producto (MVP)
1. **Jugabilidad completa:** Permitir disputar partidas completas de principio a fin, con condiciones de victoria, derrota y empate.
2. **Contenido preconstruido:** Integrar 2 héroes asimétricos con habilidades únicas y un catálogo total de 20 cartas exclusivas (divididas en Personajes, Hechizos y Objetos).
3. **Mecánicas innovadoras:** Implementar 5 mecánicas avanzadas que aporten profundidad: *Sinergia Tribal*, *Momentum* (mecánica de remontada), *Zonas y Entornos Dinámicos*, *Misiones* (Quests en el tablero) y *Aliado Invitado* (Crossover).
4. **Inteligencia Artificial del oponente:** Integrar un jugador virtual (IA) utilizando el patrón Strategy con dos niveles de dificultad (Fácil/Greedy y Medio/Threat-aware) para poder disputar partidas asimétricas.
5. **Interfaz y Feedback:** Proveer un flujo de pantallas completo (Menú, Selección de Héroe, Partida y Fin), y un *easter egg* retro interactivo integrado en el tablero visual.

---

## 2. Metodología

### 2.1. El modelo en Cascada asistido por IA

Para el desarrollo de **Crossover Cards** se ha optado por una metodología de ciclo de vida clásico en **cascada** (Waterfall), dividida en fases secuenciales y ejecutada en un plazo estricto de 14 días. 

**Justificación de la metodología:**
Aunque las metodologías ágiles dominan el desarrollo tradicional, el uso intensivo de agentes autónomos de IA requiere un enfoque distinto. Los Modelos de Lenguaje Grande (LLMs) adolecen de alucinaciones y pérdida de contexto si se enfrentan a requisitos ambiguos o continuamente iterativos sin un ancla fuerte. Al emplear un modelo en cascada estricto, logramos que los agentes de fases posteriores (como los programadores de código) reciban documentación completamente estable y cerrada (el PRD, los catálogos y la Arquitectura), maximizando su precisión, reduciendo los errores lógicos y optimizando el consumo de *tokens*.

La política de ejecución se ha basado en la **supervisión humana obligatoria**: ningún agente actuó o modificó el código sin presentar previamente un plan de ejecución detallado que el equipo debía aprobar (ciclo *Plan → Aprobación → Ejecución*).

### 2.2. Intervención del Sistema Agéntico por Fases

El proyecto ha utilizado un catálogo de 19 agentes especializados, orquestados en un ecosistema dual: nivel *cloud* (con modelos de gran capacidad como Claude Sonnet 4.6 Thinking o Gemini 3.1 Pro en Antigravity, ideales para razonamiento complejo y síntesis de documentación) y nivel *local* (con modelos ligeros como Qwen-Coder en opencode/Ollama, optimizados para pruebas y refactorizaciones mecánicas en local).

A continuación se detalla la vinculación de cada fase metodológica con los agentes que actuaron en ella:

#### Fase 1: Setup y Análisis
*Establecimiento de infraestructura y definición del producto.*
- **Setup-Repo-Agent / AI-Config-Agent / Project-Init-Agent:** Se encargaron de inicializar el entorno técnico (Phaser 4, Vite, Vitest, linting) y configurar los *Modelfiles* para el uso de los LLMs locales.
- **Test-Opencode-Agent:** Validó la comunicación entre la terminal y los modelos locales instalados.
- **PRD-Agent / PRD-Refactor-Agent:** Redactaron de manera integral el *Product Requirements Document* (PRD), definiendo mecánicas, héroes, y posteriormente inyectando el refactor al universo *Crossover* animado.

#### Fase 2: Diseño
*Arquitectura de software y experiencia de usuario.*
- **Architect-Agent / ADR-Writer-Agent:** Diseñaron la arquitectura en capas, documentaron los patrones de diseño (Event Bus, Strategy, State) y redactaron los Registros de Decisiones Arquitectónicas (ADRs).
- **Agents-Catalog-Agent:** Formalizó el sistema agéntico, flujos y políticas de asignación de tokens.
- **CardCatalog-Agent:** Diseñó y balanceó estadísticamente (stats, curva de Nostalgia y rarezas) el catálogo numérico de las 20 cartas.
- **UI-Design-Agent:** Produjo el documento de diseño visual, *wireframes*, estados interactivos y especificó los *assets* gráficos y de audio necesarios.

#### Fase 3: Implementación
*Traducción del diseño a código fuente en TypeScript.*
- **Implementation-Orchestrator-Agent:** Actuó como *Custom Agent* director técnico, coordinando la jerarquía de delegación de las tareas de programación en los agentes inferiores.
- **Domain-Dev-Agent:** Implementó las reglas de negocio (entidades puras de juego) en aislamiento total del motor gráfico.
- **Phaser-Dev-Agent:** Desarrolló las 5 escenas del juego y la interfaz visual interactiva en WebGL.
- **AI-Opponent-Agent:** Programó la inteligencia de la máquina (niveles Greedy y Threat-aware) mediante el patrón Strategy.

#### Fase 4: Pruebas (QA)
*Aseguramiento de calidad y refactorización.*
- **Tester-Agent:** Operando en paralelo, se encargó de generar la suite de tests con Vitest, logrando la máxima cobertura posible en la capa de dominio.
- **QA-Reviewer-Agent:** Actuó como revisor de código senior (auditor), analizando el proyecto final contra violaciones de los principios SOLID, identificando *code smells*, evaluando el acoplamiento y proponiendo refactorizaciones estables.

#### Fase 5: Despliegue
*Preparación para la entrega final.*
- **Deploy-Agent:** Configuró el flujo de Integración Continua (CI) mediante GitHub Actions para validar lint, tests y build automatizados, y redactó el ADR-008 justificando la entrega como repositorio sin despliegue público web para evitar problemas de derechos de autor con los *assets* de los personajes.

#### Fase 6: Memoria final
- **Memory-Agent:** (*Agente que actualmente redacta este documento*). Su labor es recopilar, aglutinar y dar formato de lectura a todo el trabajo disperso de las fases previas, ensamblando esta memoria final para su evaluación académica.

---

## 3. Sistema agéntico

### 3.1. Arquitectura dual (Cloud / Local)

Cumpliendo con los requisitos del proyecto, el sistema agéntico se articula en dos niveles complementarios para maximizar la calidad del código sin agotar los límites de cuota (tokens) de los modelos comerciales:

- **Nivel alto (Cloud):** Emplea Google Antigravity como IDE agéntico, utilizando modelos pesados (como Claude Sonnet 4.6 Thinking, Claude Opus 4.6 Thinking y Gemini 3.1 Pro). Se encarga de tareas que requieren razonamiento profundo, contexto extenso y generación multi-archivo (como la definición de la arquitectura, redacción de documentación extensa, orquestación de flujos y generación de lógica compleja).
- **Nivel bajo (Local):** Utiliza *opencode* (CLI en la terminal integrada) conectado a *Ollama*, ejecutando modelos como Qwen2.5-Coder-7B o Qwen3-8B con hasta 16 384 tokens de contexto. Su uso se limita a tareas mecánicas, *boilerplate*, generación de tests repetitivos y refactorizaciones localizadas sin necesidad de un razonamiento estratégico complejo.

### 3.2. Workflows frente a Custom Agents nativos

El proyecto distingue técnicamente dos formas de implementar los 19 agentes, en función de su persistencia de memoria:

- **Workflows:** Representan el 95% de los agentes. Están definidos como archivos estáticos Markdown en el repositorio (`.agent/workflows/*.md`) e invocados mediante comandos directos en el chat (ej. `/prd-agent`). Carecen de estado persistente entre sesiones; cada invocación reinicia el contexto. Se han utilizado para tareas acotadas y directas (redactar el PRD, balancear cartas, implementar interfaces).
- **Custom Agents nativos:** Entidades creadas desde la configuración del IDE agéntico (*Settings → Customizations → Agents*). Poseen memoria persistente y alta capacidad de delegación encadenada. El único agente implementado de esta forma es el **Implementation-Orchestrator-Agent**, cuyo propósito ha sido coordinar la fase de Implementación a lo largo de varios días, delegando subtareas a agentes de código y recordando en todo momento el estado global del repositorio.

### 3.3. Configuración de Skills y Rules

El comportamiento de los modelos de IA está estrictamente gobernado por anclas semánticas:
- **Rules (`AGENTS.md`):** Archivo raíz que actúa como el contrato de comportamiento obligatorio para todo el proyecto. Fija el *stack* técnico, la política de no modificar archivos sin listar primero el directorio, las convenciones de nomenclatura, y la obligación de documentar las interacciones. Es leído automáticamente tanto por opencode como por Antigravity en cada instrucción.
- **Skills (`.agent/skills/`):** Conocimiento especializado cargable bajo demanda para evitar el consumo innecesario de contexto. Destacan *skills* como `phaser-patterns` (buenas prácticas en Phaser 4), `solid-principles`, `clean-code` y `testing-vitest` (para garantizar la estructura AAA en las pruebas de Vitest).

### 3.4. Política de gestión de *tokens* y trazabilidad

Dado que el desarrollo dependía fuertemente de modelos en la nube sujetos a límites gratuitos, se estableció una férrea política de control de recursos:

**Criterios de elección de modelo:**
- **Claude Opus 4.6 Thinking:** Reservado para arquitectura crítica y decisiones (ADRs) complejas.
- **Claude Sonnet 4.6 / Gemini 3.1 Pro:** Generación de código sustancial, refactorizaciones profundas y documentación extensa.
- **Qwen2.5-Coder / Gemini 3 Flash:** Tareas mecánicas, generación de *getters/setters* y suites de tests unitarios.
- **GPT-OSS 120B Medium:** Utilizado esporádicamente para solicitar segundas opiniones sin consumir cuota primaria.

**Mecanismos de ahorro:**
- Reparto equitativo de la cuota diaria entre los dos miembros del equipo (el Miembro A gestionaba fases de documentación, el Miembro B las fases de código). Si un agente consumía más del 50% de la cuota de un usuario, la tarea pasaba al otro integrante.
- Obligación de leer directamente desde el repositorio (mediante el IDE agéntico) en lugar de pegar grandes bloques de código en el *prompt*.
- Modificaciones quirúrgicas (*diffs*) en lugar de regeneraciones completas de archivos extensos.

**Registro de interacciones (`ai-log.md`):**
Para garantizar la trazabilidad total del proyecto frente a la evaluación académica, todas las interacciones con la IA se han documentado de forma inmutable en `docs/ai-log.md`. Este documento registra secuencialmente cada *prompt* emitido, la herramienta utilizada, el modelo exacto que procesó la solicitud y el resultado (o los archivos modificados), cumpliendo con la exigencia de transparencia del sistema agéntico.

---

## 4. Desarrollo por fases

Esta sección expone de forma narrativa el avance empírico del proyecto a través de las iteraciones de la metodología en cascada, ilustrando los hitos principales con capturas reales extraídas del entorno de desarrollo.

### 4.1. Fase 1: Setup y Análisis

El proyecto arrancó estableciendo unos cimientos tecnológicos robustos y una definición funcional inamovible. En primer lugar, se confió a los agentes de inicialización (como el `Project-Init-Agent`) la tarea de preparar un ecosistema TypeScript moderno. En lugar de configuraciones heredadas, se construyó un entorno limpio con **Vite**, **Vitest** (para pruebas), **ESLint flat config** (para control de calidad) y **Phaser 4** como motor gráfico. 

![Figura 1: Plan de inicialización propuesto por el agente Project-Init](screenshots/01-setup/2026-05-18_01-setup_agente-project-init-plan_003b.png)

Una vez completada la configuración y verificada la compatibilidad local con la terminal (mediante opencode), se levantó el servidor de desarrollo, validando que el motor de físicas y renderizado de Phaser funcionaba correctamente.

![Figura 2: Servidor en ejecución mostrando el "Hello World" de Phaser 4](screenshots/01-setup/2026-05-18_01-setup_phaser-hello-world_003h.png)

Con el terreno técnico preparado, la atención giró hacia los requisitos. Mediante herramientas de IA con capacidades de Product Management, se generó un extenso **Product Requirements Document (PRD)**. Este documento actuó como el "contrato funcional" del juego, especificando casos de uso, restricciones técnicas y condiciones de victoria.

![Figura 3: Propuesta metodológica del PRD-Agent para estructurar los requisitos](screenshots/02-analysis/2026-05-19_02-analysis_prd-agent-plan-propuesto_03.png)

Finalmente, un agente especializado en diseño lúdico y narrativo refactorizó dicho documento para inyectarle el ADN temático de *Crossover Cards*, incorporando de forma quirúrgica héroes icónicos de la animación como El Lich y Axel Blaze, así como la mecánica nuclear de toda la economía del juego: el recurso *Nostalgia*.

![Figura 4: Resultado del PRD refactorizado inyectando los perfiles de los héroes](screenshots/02-analysis/2026-05-19_02-analysis_prd-refactor-heroes_06a.png)

### 4.2. Fase 2: Diseño

Con las reglas del juego firmemente acotadas, la fase de diseño abordó la compleja tarea de separar las responsabilidades lógicas de las visuales. El `Architect-Agent` estableció una **Arquitectura en Capas** que independizó por completo el Dominio puro (las reglas y la máquina de estados en TypeScript) de la Presentación (la integración directa con el WebGL de Phaser 4). Esta división resultó crítica para permitir el testing unitario rápido.

![Figura 5: Diagrama de arquitectura en capas generado por el Architect-Agent](screenshots/03-design/2026-05-20_03-design_architecture-diagrama-capas_05.png)

Para garantizar que el resto de los agentes (que no comparten estado ni memoria) respetaran en todo momento estas directrices, se adoptó el estándar de la industria **Architecture Decision Records (ADR)**. Un agente dedicado se encargó de redactar formalmente documentos justificativos (ADR-001 a ADR-007) explicando el contexto y la elección de patrones concretos (como el Event Bus o Strategy).

![Figura 6: Generación automática de registros de decisiones arquitectónicas (ADR)](screenshots/03-design/2026-05-20_03-design_adr-writer-resultado_02.png)

En paralelo al modelado del software, se procedió al **Diseño Lúdico y Visual**. El `CardCatalog-Agent` generó un catálogo balanceado de 20 cartas distintas, calculando el coste matemático, el ataque, la vida y la rareza en formato JSON para facilitar su instanciación en el juego.

![Figura 7: Ficha de diseño lúdico y balance numérico para una carta de rareza legendaria](screenshots/03-design/2026-05-21_03-design_card-catalog-ficha-legendaria_06.png)

Por su parte, el `UI-Design-Agent` concibió la experiencia de usuario (UX), produciendo paletas de colores basadas en tonos nostálgicos y delineando *wireframes* detallados. Estos bocetos dictaminaron de forma exacta dónde se ubicarían la mano del jugador, el contador de Nostalgia y el panel de interacción, sentando unas bases gráficas inamovibles para la fase de programación venidera.

![Figura 8: Wireframe esquemático de la disposición espacial en la escena de juego](screenshots/03-design/2026-05-21_03-design_ui-design-wireframe-gamescene_06.png)

### 4.3. Fase 3: Implementación

La fase de implementación constituyó el núcleo práctico del proyecto y la prueba de fuego del sistema agéntico. Para gestionar la complejidad del código fuente, se instanció un *Custom Agent* con memoria persistente denominado `Implementation-Orchestrator-Agent`. Este agente actuó como director técnico: en lugar de escribir código directamente, dividió el trabajo en bloques manejables (IMPL-A a IMPL-F) y delegó tareas concretas a agentes de menor nivel.

![Figura 9: Invocación inicial y configuración del Implementation-Orchestrator-Agent](screenshots/04-implementation/2026-05-22_04-implementation_orchestrator-invocacion_01.png)

Bajo esta orquestación jerárquica, el desarrollo avanzó capa por capa. El `Domain-Dev-Agent` materializó primero la lógica del juego (entidades, control de turnos y *Nostalgia*), seguido por el `AI-Opponent-Agent`, que integró la inteligencia del rival. Posteriormente, el `Phaser-Dev-Agent` se encargó de conectar esta lógica puramente matemática con el renderizado WebGL, dando vida visual al catálogo de cartas, los contadores interactivos y, por supuesto, a la selección de héroes.

![Figura 10: Escena de presentación y selección asimétrica de héroes renderizada en Phaser 4](screenshots/04-implementation/2026-05-26_04-implementation_imple-hero-select-scene.png)

El hito central de esta fase se alcanzó con el bloque IMPL-F, donde todos los subsistemas independientes (máquina de estados, Event Bus, animaciones UI y algoritmos de decisión de la IA) se integraron en el tablero de juego para formar un ciclo de partida funcional e interactivo.

![Figura 11: Renderizado del tablero de la partida funcional con la interfaz de usuario completa integrada](screenshots/04-implementation/2026-05-30_04-implementation_implf-partida-12.png)

Finalmente, se programaron las condiciones dinámicas de victoria y derrota, garantizando que el agotamiento de la vida de un héroe condujera de manera orgánica a la escena final de resolución, completando así el flujo de pantallas exigido en el PRD.

![Figura 12: Escena de fin de partida documentando el resultado de una victoria](screenshots/04-implementation/2026-05-30_04-implementation_implf-final-13.png)

### 4.4. Fase 4: Pruebas (QA)

A diferencia de metodologías tradicionales donde las pruebas se posponen al final, en este proyecto la validación unitaria con **Vitest** se ejecutó de forma paralela a la codificación. El `Tester-Agent` generó suites de pruebas tras cada bloque de desarrollo asegurando que los módulos del Dominio cumplieran sus expectativas (patrón AAA). No obstante, para garantizar una cobertura arquitectónica global, se ejecutó una fase formal de aseguramiento de calidad (QA).

Para esta labor crítica se desplegó al `QA-Reviewer-Agent`. Este agente actuó como auditor externo del código, examinando el repositorio frente a los Documentos de Arquitectura (ADRs) preestablecidos para evaluar posibles transgresiones a los principios SOLID y debilidades en el acoplamiento.

![Figura 13: Plan de auditoría propuesto por el QA-Reviewer-Agent enfocándose en acoplamiento y principios SOLID](screenshots/05-testing/2026-05-30_05-testing_qa-reviewer-plan_02.png)

El resultado del análisis de cobertura profunda se consolidó en un reporte riguroso. El agente detectó áreas específicas de mejora, proponiendo desacoplar la lógica matemática de la presentación visual inherente a las clases `Phaser.GameObjects.Container`. Las observaciones se tradujeron en refactorizaciones quirúrgicas aprobadas por el equipo, certificando la alta calidad técnica del código de entrega y validando empíricamente la efectividad del sistema de revisión IA.

![Figura 14: Emisión del veredicto y reporte final de aseguramiento de calidad (QA)](screenshots/05-testing/2026-05-30_05-testing_qa-report-veredicto_04.png)

### 4.5. Fase 5: Despliegue

La fase de entrega técnica se encomendó al `Deploy-Agent`, cuyo objetivo era asegurar que el proyecto cumpliera con los estándares académicos sin incurrir en riesgos legales ni costes operativos innecesarios. Se formalizó la decisión arquitectónica (documentada en el **ADR-008**) de no desplegar el juego en un servidor web público gratuito (como Vercel o GitHub Pages) debido a que los *assets* visuales extraídos del universo *crossover* (personajes de series animadas) están protegidos por derechos de autor. En su lugar, el producto se entregaría de forma privada como código fuente empaquetado y ejecutable en local.

![Figura 15: Invocación del Deploy-Agent y formulación del ADR-008 para la entrega final](screenshots/06-deployment/2026-05-30_06-deployment_deploy-agent-invocacion_01.png)

Para garantizar la fiabilidad irrefutable del código entregado, el agente configuró un *pipeline* de Integración Continua (CI) mediante **GitHub Actions**. Este flujo automatizado aseguraba de forma transparente que, antes de la entrega, se superaran los análisis estáticos de TypeScript y ESLint, pasaran todas las aserciones de Vitest y se compilara con éxito la rama *main*.

![Figura 16: Ejecución exitosa del pipeline de Integración Continua (CI) en GitHub Actions](screenshots/06-deployment/2026-05-30_06-deployment_github-actions-build-verde_02.png)

Como colofón a la fase de despliegue, el agente redactó un exhaustivo archivo `README.md` que sirve como manual de entrega, detallando los prerrequisitos de instalación, los comandos del ecosistema Vite y la configuración necesaria de Ollama para el *testing* del sistema agéntico.

![Figura 17: Vista renderizada del README.md actuando como manual de instalación y uso](screenshots/06-deployment/2026-05-30_06-deployment_readme-renderizado_03.png)

### 4.6. Fase 6: Memoria final

La última fase de la cascada metodológica consistió puramente en la consolidación técnica del conocimiento. Esta labor fue delegada al `Memory-Agent` (el agente responsable de generar la redacción de este mismo documento). Su flujo de trabajo exigió auditar minuciosamente todo el registro inmutable de interacciones (`ai-log.md`), recopilar las justificaciones estructurales del PRD y la arquitectura, y ensamblar la historia técnica del proyecto de forma comprensible.

Al carecer de impacto en el código fuente, el éxito de esta fase no se mide mediante pruebas de *software*, sino por el grado de trazabilidad logrado al relacionar de manera fidedigna los 19 agentes del catálogo, alinear las decenas de evidencias extraídas en tiempo real de `docs/screenshots/` y compilar las lecciones empíricas obtenidas a lo largo de los 14 días de intenso desarrollo IA.

---

## 5. Arquitectura y calidad del código

El proyecto se sustenta en una **Arquitectura en Capas** que aísla estrictamente la lógica de negocio (Dominio) de la lógica gráfica (Presentación). Esta decisión estructural ha sido fundamental no solo para el mantenimiento del código, sino también para posibilitar una estrategia de pruebas robusta y automatizada mediante agentes.

### 5.1. Patrones de Diseño implementados
Para gestionar la complejidad inherente de un juego de cartas de estado asíncrono, se han implementado múltiples patrones de diseño:
- **State Pattern:** Controla la máquina de estados del motor de turnos (fases de inicio, robo, acción y fin).
- **Command Pattern:** Encapsula las acciones de los jugadores (ej. `PlayCardCommand`, `AttackHeroCommand`), facilitando la validación antes de mutar el estado.
- **Strategy Pattern:** Define el cerebro de la IA del rival (con clases intercambiables `GreedyAI` y `ThreatAwareAI`).
- **Observer (Event Bus):** Desacopla por completo el Dominio de Phaser; el dominio emite eventos y la interfaz gráfica simplemente reacciona a ellos.
- **Factory y Repository:** Deshidratan e instancian las cartas a partir de JSONs puros, abstrayendo el acceso a datos.

### 5.2. Cobertura de Pruebas (QA) y Métricas Reales

Para garantizar la fiabilidad técnica del proyecto, se estableció una estricta política de *testing* unitario estructurado bajo el patrón **AAA (Arrange, Act, Assert)** usando Vitest, acompañado de validación de código inquebrantable (*TypeScript strict mode*) sin emitir ningún error ni advertencia de ESLint.

La rúbrica inicial (recogida en el archivo de reglas `AGENTS.md`) exigía alcanzar una cobertura mínima del **80% en la capa de dominio**. Los resultados finales empíricos demuestran que este objetivo ha sido superado con creces. El informe final arroja un total de **486 tests repartidos en 48 ficheros**, ejecutándose todos en verde de manera exitosa.

#### Desglose de cobertura por capa

| Capa / Directorio | Cobertura aprox. | Observaciones |
| :--- | :--- | :--- |
| `domain/entities`, `domain/states`, `domain/value-objects`, `domain/events`, `domain/factories`, `domain/types` | **100%** | Núcleo central del juego con validación algorítmica perfecta. |
| `domain/services` | **94,8%** | Lógica compleja de orquestación y sistema de combate. |
| `domain/ai` | **92,7%** | Algoritmos de decisión para la IA rival. |
| `application/commands` | **92,0%** | Casos de uso e intenciones del usuario. |
| `application/services` | **88,0%** | Conexión entre la presentación y la emisión de comandos. |
| `infrastructure/` | **> 97,0%** | Acceso al almacenamiento y repositorios JSON. |
| `presentation/objects` | **~ 10,0%** | Lógica visual WebGL y *sprites* de Phaser 4. |
| **Cobertura Global ("All files")** | **74,78%** | Promedio matemático del repositorio completo. |

**Justificación de la Cobertura Global (74,78%):**
Aunque la cobertura total del repositorio no alcance matemáticamente el 80% global, esto obedece a una **decisión de ingeniería consciente y deliberada**. La capa de presentación (`presentation/objects`), que se encarga del renderizado gráfico en WebGL mediante el motor Phaser 4, presenta intencionadamente un porcentaje bajo. 

Realizar *tests* unitarios a nivel de ciclo de renderizado de *sprites* o interpolación de animaciones aporta un valor técnico nulo frente a un coste de mantenimiento altísimo, dada su dependencia intrínseca del ciclo de repintado del navegador y del *canvas*. Por consiguiente, la estrategia de *testing* del sistema agéntico se enfocó exclusivamente en la lógica pura (Dominio y Aplicación), donde los fallos matemáticos o de estado supondrían problemas críticos. La sólida arquitectura desacoplada garantizó que el núcleo del juego funcionara a la perfección, relegando a Phaser a un mero receptor visual.

---


## 6. Resultado final

El resultado obtenido tras los 14 días de desarrollo es un prototipo funcional (MVP) de **Crossover Cards** jugable de principio a fin, validando empíricamente la viabilidad de la arquitectura propuesta.

**Lo que está plenamente jugable e integrado en la interfaz visual:**
- **Flujo completo de escenas:** El juego navega correctamente desde la pantalla de Menú, pasando por la Selección de Héroe asimétrica, la Partida en el tablero interactivo, y desembocando en la Escena de Fin de Juego (reconociendo de forma dinámica la Victoria o la Derrota).
- **Núcleo de la partida:** El ciclo de turnos (fases de Inicio, Robo, Acción y Fin) está perfectamente sincronizado. El recurso *Nostalgia* se regenera y aumenta cada turno. Se pueden arrastrar cartas desde la mano al tablero pagando su coste correspondiente, y ordenar ataques (tanto a los esbirros rivales como directamente al héroe enemigo).
- **Inteligencia artificial:** El motor de IA del oponente funciona con éxito de forma autónoma. Se integra mediante el patrón *Strategy* para jugar cartas y dirigir sus ataques durante su turno sin colgar el ciclo de la partida.
- **Catálogo de entidades:** Los dos héroes previstos (El Lich y Axel Blaze) cargan correctamente sus propiedades vitales, y el repositorio de cartas base se instancia dinámicamente desde los archivos JSON.

**Desviaciones respecto al PRD (Transparencia en la integración):**
El *Product Requirements Document* inicial especificaba 5 mecánicas avanzadas (*Sinergia Tribal, Momentum, Zonas Dinámicas, Misiones y Aliado Invitado*). Desde un punto de vista puramente lógico, estas mecánicas **están 100% implementadas y testeadas en la capa de Dominio** (con algoritmos que calculan los sinergismos y aplican las recompensas de misiones de forma matemática). Sin embargo, dada la estricta limitación temporal de la metodología en cascada, **su integración visual en la interfaz de Phaser 4 ha quedado parcial**. Por ejemplo, aunque el motor de reglas interno sí aplique el daño compensatorio del *Momentum*, la interfaz gráfica no despliega actualmente animaciones específicas que alerten visualmente de ello al jugador, reduciéndose en pantalla a una experiencia de combate de cartas tradicional.

---

## 7. Conclusiones y posibles mejoras futuras

### 7.1. Conclusiones sobre la metodología asistida por IA

El objetivo académico central del proyecto no era crear un videojuego de corte comercial, sino evaluar críticamente la viabilidad de la ingeniería de *software* orquestada por agentes de IA. En este sentido, la conclusión fundamental es que el desarrollo de este repositorio ha sido **mayoritariamente asistido por IA, sujeto a una estricta supervisión humana**.

Sería técnicamente falso afirmar que el desarrollo fue "100% automático". El inmenso valor de este experimento residió en obligar a los agentes a operar bajo un ciclo inquebrantable de **Planificación → Aprobación Humana → Ejecución**, limitando la intervención manual humana a labores de director de proyecto y a realizar retoques quirúrgicos puntuales para solventar cuellos de botella muy específicos en la integración gráfica de Phaser. Este formato ha cumplido escrupulosamente con la premisa del enunciado: *escribir a mano la mínima cantidad de código posible*, delegando el esfuerzo pesado al ecosistema dual *Cloud/Local*.

Asimismo, se ha demostrado empíricamente que la **metodología en cascada clásica** es un entorno excepcionalmente favorable para el uso de LLMs en el desarrollo de *software*. Al forzar una monolítica fase de Análisis y Diseño antes de empezar a programar, se proveyó a los agentes de un "ancla de verdad absoluta" (los ADRs y la documentación técnica). Esta rigidez arquitectónica inmutable eliminó casi por completo las alucinaciones por pérdida de contexto que habitualmente aquejan a las IAs cuando se enfrentan a requisitos ágiles ambiguos o iterativos.

### 7.2. Posibles mejoras futuras

A nivel técnico y lúdico, el proyecto ha dejado cimentada una base extremadamente escalable sobre la que iterar en el futuro:

1. **Sincronización total Dominio-UI:** La mejora más inmediata consistiría en actualizar las escenas de Phaser para que representen visualmente el 100% de las mecánicas que ya son funcionales en la lógica pura (como añadir ranuras visuales para las *Misiones* en el tablero o implementar partículas para los efectos de *Sinergia Tribal*).
2. **Expansión del contenido mediante JSON:** Dado que el motor desacopla la creación de entidades apoyándose en el patrón *Factory*, añadir expansiones masivas de contenido (por ejemplo, 10 nuevos héroes y 100 cartas inéditas) no requeriría programar código TypeScript adicional; bastaría con alimentar el sistema estructurando nuevos archivos de datos JSON.
3. **Escalabilidad al Multijugador (PvP):** La arquitectura orientada a comandos y aislada por el *Event Bus* resulta ser el cimiento perfecto para sustituir de forma transparente el servicio local de la IA (`domain/ai`) por una infraestructura de red asíncrona basada en WebSockets, posibilitando duelos reales jugador contra jugador por internet sin tener que reescribir la máquina de estados.

---

## 8. Anexos

### Anexo I: Trazabilidad Agente-Archivo

La siguiente tabla consolida qué componentes y documentos han sido producidos de forma directa por cada agente durante el flujo metodológico en cascada, sirviendo como mapa irrefutable de autoría.

| Fase | Agentes asociados | Archivos y documentos producidos |
| :--- | :--- | :--- |
| **Fase 1: Setup** | `#001` Setup-Repo, `#002` AI-Config, `#003` Project-Init, `#004` Test-Opencode | Estructura base del repositorio, `package.json`, `vite.config.ts`, `eslint.config.js`, configuración de modelos, `ADR-001`, `ADR-002`, `ai-log.md` inicial. |
| **Fase 1: Análisis** | `#005` PRD-Agent, `#006` PRD-Refactor | Documento funcional base: `docs/01-prd.md` |
| **Fase 2: Diseño** | `#007` Architect, `#008` ADR-Writer, `#009` Agents-Catalog, `#010` CardCatalog, `#011` UI-Design | `docs/02-architecture.md`, `docs/03-agents.md`, `docs/04-card-catalog.md`, documento UI y registros arquitectónicos (`ADR-004` a `ADR-007`). |
| **Fase 3: Implementación** | `#012` Impl-Orchestrator, `#013` Domain-Dev, `#014` Phaser-Dev, `#015` AI-Opponent | Todo el código fuente alojado en `src/domain/`, `src/application/`, `src/infrastructure/` y `src/presentation/`. |
| **Fase 4: Pruebas (QA)** | `#016` Tester, `#017` QA-Reviewer | Suite completa en `tests/` y reporte de auditoría de calidad. |
| **Fase 5: Despliegue** | `#018` Deploy-Agent | Pipeline CI en `.github/workflows/ci.yml`, `README.md` final y decisión `ADR-008`. |
| **Fase 6: Memoria** | `#019` Memory-Agent | Generación del presente documento: `docs/memoria-final.md`. |

### Anexo II: Índice de Decisiones Arquitectónicas (ADR)

- **ADR-001: Stack tecnológico.** Elección de Phaser 4, Vite y TypeScript *strict*.
- **ADR-002: Tamaño del bundle de producción.** Restricciones y objetivos de peso.
- **ADR-003: Uso de AGENTS.md para guiar agentes locales.** Configuración central de *rules*.
- **ADR-004: Patrón State para la máquina de estados del turno.** Gestión inmutable del ciclo de juego.
- **ADR-005: Event Bus como mecanismo de comunicación entre capas.** Desacoplamiento total entre Dominio y Presentación.
- **ADR-006: Estrategia híbrida de identificadores.** Combinación de UUIDs e IDs legibles.
- **ADR-007: Patrón Strategy para la IA del oponente y gestión simplificada de modificadores.** Inyección de cerebros intercambiables para la máquina.
- **ADR-008: Entrega sin despliegue público.** Justificación académica y legal por derechos de autor de las imágenes.

### Anexo III: Referencias del Proyecto

El repositorio principal y la documentación subyacente se encuentran enlazados a continuación:

- **Repositorio (GitHub):** [https://github.com/Dubricius/cartas-turnos-ia](https://github.com/Dubricius/cartas-turnos-ia) *(Repositorio privado, con acceso directo habilitado para el profesor evaluador).*
- **PRD (Requisitos Funcionales):** [docs/01-prd.md](./01-prd.md)
- **Documento de Arquitectura:** [docs/02-architecture.md](./02-architecture.md)
- **Catálogo Oficial de Agentes:** [docs/03-agents.md](./03-agents.md)
- **Registro Inmutable de Interacciones IA:** [docs/ai-log.md](./ai-log.md)

---