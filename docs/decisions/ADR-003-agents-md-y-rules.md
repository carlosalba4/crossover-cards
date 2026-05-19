# ADR-003: Uso de AGENTS.md para guiar agentes locales

- **Fecha**: 2026-05-18
- **Estado**: Aceptada
- **Autores**: [Vuestros nombres]

## Contexto

Durante la verificación inicial de opencode + Ollama (interacción #004 del 
ai-log), se detectaron limitaciones del modelo Qwen3 8B trabajando agénticamente:

- Alucinaba nombres de archivos genéricos antes de listar el filesystem real.
- Usaba patrones de glob no recursivos por defecto.
- Generaba múltiples iteraciones internas innecesarias.

Estas limitaciones son típicas de modelos locales de tamaño medio (≤10B).

## Decisión

Adoptamos `AGENTS.md` en la raíz del repositorio como mecanismo central de Rules 
para todos los agentes de IA del proyecto (opencode, Antigravity y otros). 
Opencode lo lee automáticamente por convención.

El archivo incluye:
- Contexto del proyecto.
- Reglas de exploración de filesystem (críticas para evitar alucinaciones).
- Arquitectura en capas y alias de paths.
- Convenciones de naming y código.
- Reglas de testing.
- Convenciones de documentación e idiomas.
- Estilo de respuesta esperado.

## Justificación

- Cubre el requisito explícito del enunciado de definir "rules" para los agentes.
- Reduce alucinaciones del modelo local en exploración de archivos.
- Centraliza la información que cualquier agente necesita conocer del proyecto.
- Es independiente de la herramienta: sirve para opencode hoy y para cualquier 
  futuro agente que respete la convención.
- Coste cero (no requiere reentrenamiento ni cambio de modelo).

## Consecuencias

**Positivas**:
- Mejora medible en precisión del agente local Qwen3.
- Sistema de rules versionado en git y compartido entre los dos miembros del equipo.
- Reduce tokens consumidos en correcciones de comportamiento del agente.

**Negativas / Riesgos**:
- Modelos muy pequeños (≤3B) pueden ignorar parcialmente las reglas; mitigado 
  reservando esos modelos para tareas triviales.

## Alternativas consideradas

- **Descargar un modelo local mayor** (gpt-oss-20b, Qwen3-Coder-30B): viable pero 
  ocupa 14-18 GB adicionales y no garantiza mejor adherencia a convenciones del 
  proyecto sin reglas explícitas. Se mantiene como opción futura si AGENTS.md 
  no es suficiente.
- **Solo usar modelos cloud**: descartado, no aprovecha la inversión en setup local 
  y desperdicia hardware capaz de inferencia.
- **Rules en formato propio de opencode (.opencode/rules/)**: menos portable; 
  AGENTS.md es estándar de facto en agentes modernos.