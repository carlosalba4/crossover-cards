# ROL

Eres un arquitecto de software técnico encargado de redactar Architecture Decision
Records (ADRs) siguiendo el formato estándar usado en el proyecto Crossover Cards.

# CONTEXTO

- El proyecto tiene ya tres ADRs redactados en `docs/decisions/`:
  - ADR-001-stack-tecnologico.md
  - ADR-002-bundle-size.md
  - ADR-003-agents-md-y-rules.md
- El documento de arquitectura `docs/02-architecture.md` propone en su sección 16
  cuatro ADRs adicionales que deben ser redactados ahora.
- Consulta `AGENTS.md` para conocer las reglas del proyecto y el `docs/01-prd.md`
  para entender los requisitos funcionales.

# TAREA

Redacta los siguientes 4 ADRs como archivos independientes en `docs/decisions/`:

1. **ADR-004-patron-state-turnos.md**
   - Decisión: usar el patrón State para gestionar las fases del turno (Draw,
     Main, Combat, End).
   - Justifica frente a alternativas (switch/case procedural, máquina de estados
     ad-hoc).
   - Consulta la sección 4 y 6 del documento de arquitectura.

2. **ADR-005-event-bus-comunicacion.md**
   - Decisión: implementar un Event Bus propio en la capa de infraestructura
     en lugar de depender directamente de los eventos nativos de Phaser.
   - Justifica el desacoplamiento dominio-presentación y la testabilidad.
   - Consulta la sección 7 del documento de arquitectura.

3. **ADR-006-estrategia-identificadores.md**
   - Decisión: estrategia híbrida de identificadores → strings legibles
     (kebab-case) para datos estáticos (cartas, héroes, zonas, misiones) y
     UUIDs para instancias dinámicas (partidas, criaturas en juego, modificadores
     activos).
   - Justifica la trazabilidad, legibilidad y mantenibilidad.
   - Consulta la sección 5 del documento de arquitectura.

4. **ADR-007-patron-strategy-ia.md**
   - Decisión: usar el patrón Strategy para los niveles de dificultad de la IA
     del oponente (GreedyAI, ThreatAwareAI), con interfaz AIStrategy.
   - Incluye también la decisión de NO aplicar Decorator para buffs/debuffs en
     el MVP, optando por un array simple `Modifier[]` (queda Decorator documentado
     como mejora futura).
   - Justifica la inyectabilidad de estrategias y la simplicidad para 14 días.
   - Consulta la sección 4 y 8 del documento de arquitectura.

# FORMATO DE CADA ADR

Sigue exactamente esta estructura (igual que ADR-001, 002, 003 ya redactados):

```markdown
# ADR-XXX: [Título]

- **Fecha**: 2026-05-20
- **Estado**: Aceptada
- **Autores**: [Equipo del proyecto Crossover Cards]

## Contexto

[Describe el contexto técnico que motiva esta decisión. 3-5 párrafos. Cita el
PRD y el documento de arquitectura si aplica].

## Decisión

[La decisión tomada, escrita en forma directa y concreta. 1-3 párrafos].

## Justificación

[Razones que sustentan la decisión, en formato de lista con viñetas detalladas].

## Consecuencias

**Positivas**:

- [Lista]

**Negativas / Riesgos**:

- [Lista, con mitigación cuando aplique]

## Alternativas consideradas

- **Alternativa 1**: [Descripción]. Descartada porque [razón].
- **Alternativa 2**: [Descripción]. Descartada porque [razón].
- (mínimo 2 alternativas, ideal 3)
```

# RESTRICCIONES

- Idioma: español.
- Sin emojis.
- Cada ADR debe tener al menos 2 alternativas consideradas y descartadas con razón.
- Las consecuencias deben ser realistas, no genéricas.
- Tono profesional, conciso, sin relleno.
- Cada ADR como archivo independiente en `docs/decisions/`.

# INSTRUCCIONES DE EJECUCIÓN

1. Lee `docs/02-architecture.md` (especialmente las secciones 4, 5, 6, 7, 8).
2. Lee uno de los ADR ya existentes (`docs/decisions/ADR-001-stack-tecnologico.md`)
   para inspirarte en el estilo y nivel de detalle.
3. Genera los 4 ADRs uno detrás de otro, en su archivo correspondiente.
4. Al terminar, resume al chat:
   - Lista de archivos creados.
   - Cualquier alternativa que hayas considerado adicionalmente.
   - Notas o supuestos relevantes.

Empieza ahora.
