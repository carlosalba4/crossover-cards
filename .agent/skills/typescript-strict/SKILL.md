---
name: typescript-strict
description: Convenciones TypeScript strict mode y patrones idiomáticos del proyecto.
trigger: cuando escribas o refactorices código TypeScript.
---

# Skill: TypeScript Strict

## Configuración

El proyecto usa `strict: true` con todas las opciones del strict:

- `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`,
- `strictBindCallApply`, `strictPropertyInitialization`,
- `noImplicitThis`, `alwaysStrict`.
- Más: `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`,
- `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`.

## Reglas duras

- **Nunca usar `any` explícito**. Si no se conoce el tipo, usar `unknown` y narrow con guards.
- **Nunca silenciar el compilador con `as`** salvo casos justificados y comentados.
- **Inicializar propiedades** en el constructor o usar `?` si son opcionales.
- **Funciones públicas deben declarar tipos de retorno explícitos**.

## Convenciones

- Interfaces con prefijo `I`: `ICard`, `IEventBus`, `IRepository`.
- Tipos con sufijo descriptivo: `PlayerId`, `CardCost`, `Phase`.
- Enums solo cuando sea exhaustivo y cerrado; preferir unión de literales si el valor importa.
  - `type Phase = "draw" | "main" | "combat" | "end";`
- Objetos inmutables: usar `readonly` y `Readonly<T>` cuando aplique.

## Patrones

- **Result type** para errores controlados:

```ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

- **Narrowing con type guards**:

```ts
function isCreature(card: Card): card is Creature {
  return card.type === "creature";
}
```

- **Discriminated unions** para entidades polimórficas (`Card` con `type: "creature" | "spell" | "item"`).

## Imports

- Imports relativos solo dentro de la misma capa.
- Para cruzar capas, usar alias: `@domain/...`, `@application/...`, etc.
- `import type` cuando solo se importa para tipado: evita generar JS innecesario.

## Anti-patrones

- `as any`: prohibido salvo casos justificados con comentario explicativo.
- `Object.assign` para construcción: preferir constructores explícitos.
- Mutar parámetros de función: usar copias inmutables.

## Referencias del proyecto

- ADR-001 (stack tecnológico).
- AGENTS.md (convenciones globales).
