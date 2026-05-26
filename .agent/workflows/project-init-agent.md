---
description: Inicializa el proyecto Phaser 4 con TypeScript strict, Vite, Vitest, ESLint flat config y Prettier. Crea Hello World de Phaser 4. Verifica typecheck, lint, format, test, build y dev.
---

# ROL

Eres un agente especializado en inicialización de proyectos frontend con
Phaser 4, TypeScript, Vite, Vitest, ESLint y Prettier, aplicando principios de
Clean Code, SOLID y preparando el terreno para arquitectura en capas.

# CONTEXTO

El repositorio ya tiene la estructura base creada por Setup-Repo-Agent y la
configuración de IA establecida por AI-Config-Agent. Ver ADR-001 para el stack.

Entorno:

- Node.js v24.13.0
- npm 11.6.2
- Windows 11 (PowerShell)

Restricciones técnicas conocidas:

- TypeScript debe ir en modo strict completo desde el inicio.
- ESLint 10 requiere flat config (eslint.config.js), no .eslintrc.cjs.
- Vite 8.
- Phaser 4 (última versión disponible).
- TypeScript 5+ está deprecando baseUrl: usar paths relativos con ./.
- Necesitamos paths con alias para arquitectura en capas: @, @domain,
  @application, @infrastructure, @presentation.

# TAREA

Inicializa el proyecto Node y configura todo el tooling. Al final, el proyecto
debe arrancar con `npm run dev` y mostrar una escena minimalista en Phaser 4 con
tres textos:

- "Cartas Turnos IA"
- "Proyecto inicializado correctamente"
- "Fase actual: Análisis de Requisitos"

## Pasos a ejecutar

1. `npm init -y` y sobrescribir package.json con: nombre, descripción, autores,
   13 scripts (dev, build, preview, test, test:watch, test:ui, test:coverage,
   lint, lint:fix, format, format:check, typecheck), `"type": "module"`,
   keywords.
2. Instalar Phaser como dependencia.
3. Instalar como devDependencies: vite, typescript, @types/node, vitest,
   @vitest/ui, jsdom, @vitest/coverage-v8, eslint, typescript-eslint,
   @eslint/js, prettier, eslint-config-prettier, eslint-plugin-prettier.
4. Crear tsconfig.json en modo strict completo, moduleResolution "bundler",
   sin baseUrl, paths con alias usando "./src/..." para @, @domain, @application,
   @infrastructure, @presentation, types vitest/globals y node.
5. Crear vite.config.ts con los mismos alias, puerto 5173, open automático,
   target es2022, sourcemap en build.
6. Crear vitest.config.ts con los alias, environment jsdom, globals true,
   coverage v8.
7. Crear eslint.config.js (flat config) con js.configs.recommended,
   tseslint.configs.recommendedTypeChecked, prettierConfig, prettier plugin,
   regla prettier/prettier en warn, no-console permitiendo warn/error/info,
   ignores para dist y archivos de config.
8. Crear .prettierrc.json: semi true, singleQuote false, trailingComma "all",
   printWidth 100, tabWidth 2, endOfLine "lf".
9. Crear .prettierignore: node_modules, dist, build, coverage, \*.min.js,
   package-lock.json, assets.
10. Crear index.html minimalista con div#game-container y módulo /src/main.ts.
11. Crear src/main.ts con clase BootScene que muestre los tres textos
    indicados, y configuración de Phaser 4 con Phaser.AUTO, scale FIT +
    CENTER_BOTH, width 1280, height 720, background "#1a1a2e".
12. Crear tests/smoke.test.ts con 2 tests: 1+1=2 y existencia de window/document.
13. Verificar en orden: typecheck, lint, format, test, build, dev.

# RESTRICCIONES

- TypeScript: strict, noUnusedLocals, noUnusedParameters, noImplicitReturns,
  noFallthroughCasesInSwitch, forceConsistentCasingInFileNames TODOS activos.
- No usar `any` explícito.
- Indentación 2 espacios, comillas dobles, EOL LF.
- Si algún paso falla, detente y reporta el error textualmente sin parchear
  a ciegas.

# ENTREGABLES ESPERADOS

- Plan de ejecución previo con orden de pasos.
- Cada archivo generado como artifact independiente.
- Log de comandos ejecutados.
- Resultado de la verificación final (typecheck OK, lint con warnings de CRLF
  resueltos con `npm run format`, 2 tests passing, build OK con warning aceptable
  de chunk size que se documenta en ADR-002, dev arrancando en localhost:5173).
