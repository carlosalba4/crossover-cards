# ROL
Eres un refactorizador terminológico especializado en documentación técnica.
Tu trabajo es propagar de forma consistente el cambio de nombre de una entidad
del dominio a través de múltiples archivos del repositorio, respetando contexto,
plurales, mayúsculas, idioma y bloques de código.

# CONTEXTO
- Proyecto académico "Crossover Cards" (juego de cartas por turnos).
- Stack: Phaser 4 + TypeScript + Vite.
- Documentos del repo:
  - @docs/01-prd.md (Product Requirements Document).
  - @docs/02-architecture.md (Arquitectura técnica).
  - @docs/04-card-catalog.md (Catálogo numérico — YA está alineado, no tocar).
  - @AGENTS.md (Rules del proyecto).
- Se ha decidido formalmente (ver `docs/04-card-catalog.md`) que la entidad
  llamada hasta ahora "Criatura/Creature" pasa a denominarse:
  - **"Personaje"** en español (documentación, descripciones, UI).
  - **"Character"** en inglés (nombres de clase, variables, identificadores
    técnicos, JSON schemas).

# OBJETIVO
Aplicar el cambio terminológico de forma quirúrgica a `docs/01-prd.md` y
`docs/02-architecture.md` para que toda la documentación quede alineada con la
decisión del catálogo de cartas.

# REGLAS DE SUSTITUCIÓN

## Sustituciones en español (en TEXTO PROSA del PRD)
- "criatura" → "personaje"
- "Criatura" → "Personaje"
- "criaturas" → "personajes"
- "Criaturas" → "Personajes"
- "CRIATURA" → "PERSONAJE"
- "CRIATURAS" → "PERSONAJES"

## Sustituciones en inglés (en NOMBRES TÉCNICOS de la arquitectura)
- `Creature` (PascalCase, clase/interfaz) → `Character`
- `creature` (camelCase, variable) → `character`
- `creatures` (plural variable) → `characters`
- `ICreature` (interfaz) → `ICharacter`
- `CreatureRepository`, `CreatureFactory`, etc. → `CharacterRepository`, `CharacterFactory`, etc.
- En JSON schemas: `"type": "creature"` → `"type": "character"`

## Contextos a respetar (NO modificar)
- Si la palabra "creature" aparece en una URL externa, código importado de
  librerías de terceros o nombres de archivo ya existentes, no modificar.
- Si aparece en un nombre histórico ya en uso (poco probable aquí), respetarlo
  y marcar [PENDIENTE DE VALIDACIÓN].
- Bloques de código que citan otras librerías o ejemplos externos: no tocar.
- Si encuentras un texto narrativo donde "criatura" se usa en sentido amplio
  (no la entidad de juego sino "ser viviente cualquiera"), respetarlo. Usa el
  sentido común.

## Tipos de carta a considerar
El sistema reconoce 3 tipos de carta: Personaje (antes Criatura), Hechizo, Objeto.
"Hechizo" y "Objeto" NO cambian.

# INSTRUCCIONES DE EJECUCIÓN

1. Lee @docs/01-prd.md completo. Cuenta cuántas ocurrencias de "criatura/criaturas/
   Criatura/Criaturas" hay aproximadamente.
2. Lee @docs/02-architecture.md completo. Cuenta ocurrencias de "Creature/creature/
   creatures/ICreature".
3. Produce un **REPORTE PREVIO** al chat con:
   - Número aproximado de sustituciones a hacer en cada archivo.
   - Cualquier ocurrencia ambigua que detectes (contexto narrativo, terceros, etc.).
   - Confirmación de las reglas de sustitución que vas a aplicar.
4. Espera mi aprobación.
5. Una vez aprobado, aplica los cambios DIRECTAMENTE sobre los archivos:
   - `docs/01-prd.md`: sustituye en prosa española.
   - `docs/02-architecture.md`: sustituye en nombres técnicos.
6. Añade una nota al inicio de cada documento modificado (justo después del
   título principal) con este formato exacto:

   > **Nota de actualización (2026-05-21)**: en este documento se ha aplicado
   > el cambio terminológico "Criatura → Personaje / Creature → Character"
   > acordado en `docs/04-card-catalog.md`. Mantiene retrocompatibilidad
   > conceptual; las descripciones funcionales y mecánicas son idénticas a
   > versiones anteriores del documento.

7. Al finalizar, resume al chat:
   - Total de sustituciones aplicadas en cada archivo.
   - Decisiones tomadas en casos ambiguos.
   - Confirmación de que `docs/04-card-catalog.md` NO se ha tocado.

# RESTRICCIONES
- Cambios quirúrgicos: SOLO los términos indicados. NO modifiques redacciones,
  ortografía, formato Markdown, tablas, diagramas Mermaid u otras secciones.
- NO toques `docs/04-card-catalog.md` (ya está alineado).
- NO toques `AGENTS.md` salvo si encuentras "Creature" en él (no debería).
- NO toques `prompts/agents/*.md` ni `.agent/workflows/*.md` (los workflows
  pueden conservar Creature, no afecta a la documentación del usuario).
- Idioma de tus respuestas al chat: español.

Empieza ahora leyendo los archivos y produciendo el reporte previo.