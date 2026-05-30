# ADR-002: Tamaño del bundle de producción

- **Fecha**: 2026-05-18
- **Estado**: Aceptada
- **Autores**: [Vuestros nombres]

## Contexto

La build de producción genera un bundle de ~1.35 MB (~352 KB gzipped) debido principalmente al tamaño de Phaser 4. Vite emite un aviso al superar el umbral por defecto de 500 KB.

## Decisión

Aceptar el tamaño actual del bundle sin aplicar code splitting en esta fase.

## Justificación

- Phaser es un framework de juegos completo (renderer WebGL, físicas, input, audio, etc.); su tamaño es esperable e inevitable.
- 352 KB gzipped es perfectamente asumible para un juego web cargado una sola vez.
- Aplicar code splitting prematuro complicaría la arquitectura sin beneficio real en un proyecto de 14 días.
- El alcance del MVP no justifica la complejidad de lazy-loading de escenas.

## Consecuencias

- Carga inicial algo más lenta en conexiones muy débiles (mitigado con `loading...` en index.html si fuera necesario).
- Si en fase posterior crece mucho el código de dominio, se reevaluará code splitting por escenas.

## Alternativas consideradas

- **Code splitting por escena**: descartado por complejidad innecesaria en MVP.
- **Subir el umbral con `build.chunkSizeWarningLimit`**: descartado, preferimos ver el aviso como recordatorio.
