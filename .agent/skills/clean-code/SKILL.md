---
name: clean-code
description: Aplicar principios de Clean Code (Robert C. Martin) en el código generado.
trigger: cuando escribas o refactorices código TypeScript del proyecto.
---

# Skill: Clean Code

Cuando esta skill esté activa, sigue estos principios al producir código:

## Nombrado

- Nombres que revelen intención. Ejemplo: `nostalgiaRestante` mejor que `n`.
- Verbos para funciones, sustantivos para clases.
- Evitar abreviaturas excepto convenciones bien establecidas (`id`, `url`).
- Constantes en `SCREAMING_SNAKE_CASE`, clases en `PascalCase`, variables y funciones en `camelCase`, archivos en `kebab-case`.

## Funciones

- Hacer una sola cosa, hacerla bien.
- Máximo 20 líneas como referencia.
- Máximo 3 parámetros; si necesitas más, agrúpalos en un objeto.
- Sin efectos colaterales no esperados.
- Evitar booleanos como parámetros (`isAdmin`); separar en funciones distintas.

## Comentarios

- El código limpio se autoexplica. Comenta el "por qué", no el "qué".
- Eliminar código comentado: si no se usa, se borra.
- JSDoc solo donde realmente aporte.

## Manejo de errores

- Excepciones para casos excepcionales, no para control de flujo.
- Tipos de error específicos: `DomainError`, `ApplicationError`, `InfrastructureError`.
- Nunca silenciar errores con `catch` vacíos.

## Niveles de abstracción

- Una función debería operar a un solo nivel de abstracción.
- No mezclar lógica de negocio con detalles técnicos.

## Anti-patrones a evitar

- Magic numbers: extraer a constantes con nombre.
- God classes: si una clase tiene más de 7 métodos públicos, dividirla.
- Acoplamiento fuerte: depender de abstracciones, no implementaciones.

## Referencias del proyecto

- ADR-001 al ADR-007 en `docs/decisions/`.
- Arquitectura en `docs/02-architecture.md` (sección 11 sobre SOLID).
