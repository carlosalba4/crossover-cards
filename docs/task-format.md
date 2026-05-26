# Formato estándar de tareas en Fase de Implementación

Toda tarea delegada por el Implementation-Orchestrator-Agent a un agente
especialista sigue este formato YAML obligatorio.

## Estructura

```yaml
task_id: <FASE>-<NUMERO> # ID único, ej: IMPL-001
agent: <nombre-del-agente> # ej: domain-dev-agent
description: <qué hace la tarea> # 1 línea
inputs: # archivos que el agente debe leer
  - <ruta-relativa-1>
  - <ruta-relativa-2>
outputs: # archivos que el agente debe producir
  - <ruta-relativa-1>
  - <ruta-relativa-2>
acceptance_criteria: # criterios verificables
  - <criterio 1>
  - <criterio 2>
dependencies: # tareas previas necesarias o "none"
  - <task_id-previa>
estimated_complexity: low | medium | high
model_hint: <modelo recomendado> # ej: Claude Sonnet 4.6 Thinking
```

## Ejemplo concreto

```yaml
task_id: IMPL-001
agent: domain-dev-agent
description: Crear entidad base Card con tipos CardType, Rarity, Archetype
inputs:
  - docs/02-architecture.md
  - docs/04-card-catalog.md
outputs:
  - src/domain/entities/card.ts
  - tests/domain/entities/card.test.ts
acceptance_criteria:
  - npm run typecheck pasa sin errores
  - npm test pasa con éxito
  - Cobertura de card.ts >= 80%
  - Sin warnings de ESLint
dependencies:
  - none
estimated_complexity: low
model_hint: Claude Sonnet 4.6 Thinking
```

## Convención de IDs

- `IMPL-XXX`: tareas de implementación (Fase 3).
- `TEST-XXX`: tareas de testing exhaustivo (Fase 4).
- `DEPLOY-XXX`: tareas de despliegue (Fase 5).
- `MEM-XXX`: tareas de memoria (Fase 6).

## Política de criterios de aceptación

Los criterios deben ser:

- Verificables con un comando concreto (ej: `npm test`).
- Cuantificables cuando aplique (ej: "cobertura >= 80%").
- Específicos (no "código limpio" sino "sin warnings ESLint").

## Política de inputs/outputs

- Los `inputs` solo pueden ser archivos que ya existen.
- Los `outputs` son los archivos que la tarea debe producir o modificar.
- No mezclar tareas que producen ficheros distintos: una tarea → uno o pocos
  ficheros relacionados.
