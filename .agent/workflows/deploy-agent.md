---
description: "Configura el despliegue del juego: build de producción con Vite, GitHub Actions de CI (lint + test + build) y publicación en GitHub Pages o itch.io. Documenta el proceso completo."
---

---
description: "Configura el empaquetado y la integración continua del proyecto: workflow de GitHub Actions con typecheck + lint + test + build en cada push, guía de instalación y ejecución en README expandido, y ADR-008 documentando la decisión de no desplegar como URL pública."
---

# ROL
Eres un DevOps engineer senior especializado en integración continua y entrega
de proyectos web. Tu tarea es preparar la fase de entrega del proyecto
"Crossover Cards" sin requerir un despliegue como URL pública.

# CONTEXTO
- Proyecto académico de 14 días, metodología cascada clásica.
- Stack: Phaser 4 + TypeScript + Vite.
- Repo privado en GitHub por uso académico de sprites con copyright.
- El enunciado de la asignatura (`docs/proyecto-enunciado.pdf` si existe) NO
  exige URL pública del juego. Los entregables formales son:
  - Memoria PDF (`Nombre_Apellido1_IA_Develop.pdf`).
  - Código en ZIP (`Nombre_Apellido1_IA_Develop.zip`).
  - `Grupo.txt`.
  - Repositorio compartido con `rubteacher`.
- Build de producción verificada: `npm run build` produce dist/ sin errores
  (warning de tamaño de bundle aceptado en ADR-002).
- Lee @AGENTS.md y @docs/02-architecture.md para conocer las convenciones.

# OBJETIVO
Producir tres entregables que cumplan el espíritu del punto "Despliegue de la
aplicación" del enunciado sin desplegar como URL pública.

# TAREAS A REALIZAR

## 1. Workflow de GitHub Actions
Crear `.github/workflows/ci.yml` con un pipeline que se dispare en:
- Push a cualquier rama.
- Pull requests a main.

El pipeline debe ejecutar en orden, en Ubuntu latest con Node 24:
1. Checkout del repo.
2. Setup Node.js 24 con cache de npm.
3. `npm ci` (más rápido y reproducible que `npm install` en CI).
4. `npm run typecheck`.
5. `npm run lint`.
6. `npm test` (las 486 pruebas).
7. `npm run build`.
8. Subir el directorio `dist/` como artifact de la run con retención de 7 días.

El workflow debe llamarse "CI - Build, Test and Package". Sin ningún secret
ni credencial, solo trabajo de CI puro.

## 2. README expandido con guía de ejecución
Expandir el `README.md` actual añadiendo (o sustituyendo si ya hay una sección
de instalación rudimentaria):

### Sección "Requisitos previos"
- Node.js 24.x o superior.
- npm 11.x o superior.
- Navegador moderno con WebGL (Chrome 120+, Firefox 120+, Edge 120+).
- Sistema operativo: Windows 10/11, macOS 13+, o Linux con soporte WebGL.

### Sección "Instalación y ejecución"
Pasos numerados para clonar, instalar y ejecutar en modo desarrollo:
1. Clonar el repositorio.
2. Entrar al directorio.
3. `npm install`.
4. `npm run dev`.
5. Abrir `http://localhost:5173` en el navegador.

### Sección "Build de producción"
Pasos para generar la build optimizada:
1. `npm run build` (genera `dist/`).
2. `npm run preview` para verificar la build localmente.

### Sección "Verificación"
Cómo el evaluador puede verificar que todo funciona:
1. `npm run typecheck` → debe pasar sin errores.
2. `npm run lint` → debe pasar sin errores.
3. `npm test` → debe mostrar 486 tests verdes.
4. `npm run build` → debe completarse con warning aceptable de bundle size
   (documentado en `docs/decisions/ADR-002-bundle-size.md`).

### Sección "Estructura del proyecto"
Árbol simplificado mostrando las carpetas principales: src/domain,
src/application, src/infrastructure, src/presentation, tests/, docs/, assets/,
.agent/.

### Sección "Documentación adicional"
Enlaces a los documentos clave: PRD, arquitectura, agentes, catálogo de cartas,
diseño UI, ADRs, ai-log, informes QA.

### Sección "Integración Continua"
Mención al workflow de GitHub Actions y dónde verlo (pestaña Actions del repo).

## 3. ADR-008 documentando la decisión de no desplegar
Crear `docs/decisions/ADR-008-entrega-sin-despliegue-publico.md` con el
formato estándar usado en los 7 ADRs anteriores. Estructura:

- **Contexto**: el enunciado lista "Despliegue de la aplicación" como cuestión
  de ingeniería a abordar, pero los entregables formales son PDF + ZIP +
  Grupo.txt sin requerir URL pública. El repo es privado por uso académico de
  sprites con copyright. Una publicación como URL pública (GitHub Pages,
  itch.io) requeriría o convertir el repo en público (riesgo legal con la IP)
  o adquirir GitHub Pro para Pages en repos privados (coste).

- **Decisión**: El proyecto NO se desplegará como URL pública. La fase de
  Despliegue se aborda mediante:
  1. Workflow de GitHub Actions que ejecuta typecheck + lint + test + build
     en cada push, proporcionando CI real y verificable.
  2. Build de producción verificada y empaquetable como artifact de la run
     de CI.
  3. Guía de instalación y ejecución completa en README para el evaluador.
  4. Entrega final como repositorio compartido + ZIP + memoria PDF + Grupo.txt.

- **Justificación**:
  - Cumplimiento literal del enunciado (PDF + ZIP + TXT como entregables).
  - Protección de IP académica al mantener repo privado.
  - Ausencia de coste económico (sin GitHub Pro ni cuenta itch.io necesaria).
  - CI real demostrable, no simulada.
  - El profesor puede ejecutar el juego localmente siguiendo el README en
    menos de 2 minutos.

- **Consecuencias positivas**:
  - Ahorro de tiempo en la fase final del proyecto.
  - Sin exposición de assets con copyright.
  - Pipeline CI reutilizable para evolución futura.

- **Consecuencias negativas / riesgos**:
  - El profesor no puede probar el juego sin instalarlo localmente (mitigación:
    README detallado).
  - Si el profesor cambiase los criterios para exigir URL pública, habría que
    desplegar en itch.io (mitigación: la build ya está lista para subirse).

- **Alternativas consideradas**:
  - GitHub Pages con repo privado: descartado por requerir GitHub Pro de pago.
  - GitHub Pages con repo público: descartado por exposición de IP académica.
  - itch.io: descartado por no ser entregable formal y por tiempo limitado.
  - Despliegue simulado documental: descartado por ser menos defendible que
    una CI real.

# RESTRICCIONES
- Idioma: español en README y ADR.
- Markdown limpio, sin emojis.
- El workflow YAML debe ser válido (verificar sintaxis).
- No tocar código de aplicación. Solo añadir: archivo YAML del workflow,
  modificar README.md, crear ADR-008.
- El workflow NO debe ejecutar ningún paso de despliegue real (no Pages,
  no FTP, no Docker registry). Solo CI: typecheck, lint, test, build, artifact.

# INSTRUCCIONES DE EJECUCIÓN
1. Propón un plan corto enumerando los tres archivos a generar/modificar.
2. Espera aprobación.
3. Genera los tres archivos.
4. Resume al chat: rutas de los archivos producidos y cualquier supuesto que
   hayas hecho (versión exacta de Node detectada, etc.).

Empieza ahora.