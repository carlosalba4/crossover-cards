# ADR-007: Patrón Strategy para la IA del oponente y gestión simplificada de modificadores

- **Fecha**: 2026-05-20
- **Estado**: Aceptada
- **Autores**: [Equipo del proyecto Crossover Cards]

## Contexto

El PRD (RF-06) y la sección 8 del documento de arquitectura definen que el juego debe contar con un oponente controlado por ordenador (IA) que disponga de dos niveles de dificultad seleccionables (Fácil y Medio). Ambos niveles deben compartir el mismo flujo de interacción en el juego, pero variar radicalmente en sus procesos de toma de decisiones (la IA Fácil actúa de forma puramente codiciosa o "greedy", mientras que la IA Media es capaz de analizar amenazas en el tablero y coordinar sinergias).

Por otro lado, para las mecánicas de juego innovadoras (Sinergias Tribales M3, Entornos de Zonas M4, Habilidades de Héroe M1, y Cartas M2), es crítico contar con un sistema robusto para aplicar buffs y debuffs temporales o permanentes a las estadísticas de los personajes en juego. La rúbrica académica del proyecto sugiere evaluar el patrón **Decorator** para esta lógica, pero la limitación temporal estricta de 14 días (ADR-001) obliga a equilibrar la pureza arquitectónica teórica con la simplicidad de la implementación práctica.

## Decisión

Se toman dos decisiones técnicas complementarias para resolver estos desafíos de diseño:

1. **Patrón Strategy para la IA del Oponente**: Se define la interfaz `AIStrategy` en la capa de Dominio (`src/domain/ai/`) con métodos clave de decisión (`decideMainPhaseActions`, `decideCombatActions`, `shouldUseCrossover`). Se crean dos clases de estrategia concretas: `GreedyAI` (IA fácil) y `ThreatAwareAI` (IA media). El servicio de aplicación `OpponentService` orquesta los turnos de la IA inyectando dinámicamente la estrategia correspondiente según la dificultad elegida, sin conocer la lógica algorítmica interna de cada una.
2. **Uso de Modifier[] compuesto sobre el patrón Decorator para Buffs/Debuffs**: Para el MVP de 14 días se descarta la implementación activa del patrón Decorator para envolver la clase `Character`. En su lugar, se opta por un enfoque pragmático de composición: la entidad `Character` mantendrá un array interno de objetos modificadores simples (`modifiers: IModifier[]`). Las estadísticas efectivas se calculan bajo demanda sumando los bonos base y activos (ej. `getEffectiveAttack(): base + modifiers.sum()`), en lugar de modificar destructivamente los atributos del personaje. Se deja documentado el patrón Decorator únicamente en este ADR y en el documento de arquitectura como la arquitectura de referencia a adoptar en futuras expansiones.

## Justificación

### Justificación del Patrón Strategy para la IA:
- **Abierto/Cerrado (OCP)**: Permite introducir nuevos niveles de dificultad (ej. una "IA Imposible" o "IA Temática") simplemente creando una nueva clase que implemente `AIStrategy`, sin alterar una sola línea de código en `OpponentService` ni en el flujo principal del motor de turnos.
- **Intercambiabilidad en Caliente**: Permite modificar la dificultad de la IA dinámicamente a mitad de la partida o adaptarla según eventos, simplemente asignando una nueva estrategia al servicio.
- **Testing Unitario Aislado**: Cada algoritmo de IA se puede testear de manera 100% aislada pasando estados de juego mockeados a los métodos de decisión de la estrategia y verificando que el plan de acciones devuelto sea el óptimo.

### Justificación de Modifier[] sobre Decorator:
- **Simplicidad de Implementación (MVP en 14 días)**: El patrón Decorator añade un boilerplate sustancial y complejidad al requerir envolver dinámicamente las referencias de los objetos en memoria. Si un personaje tiene 3 buffs activos, estaría envuelto en 3 capas de decorators, haciendo extremadamente laboriosa e ineficiente la inspección de datos para la capa de presentación de Phaser y los tests unitarios.
- **Inspección de datos directa**: Al almacenar los modificadores en un array plano (`Modifier[]`), la UI de Phaser 4 (ej. `Tooltip` o `CardSprite`) puede recorrer el array de forma directa para desglosar al usuario el origen de los bufos (ejemplo: "+2 de ATQ por Sinergias, +1 de Vida por Zona Bosque"). Con Decorator, este desglose requeriría desemmonar recursivamente las capas envolventes del objeto.
- **Reducción de Riesgos Técnicos**: Un array plano elimina el riesgo de problemas de tipado complejos en TypeScript al mezclar interfaces decoradas con referencias directas a la clase concreta `Character` en los arrays del tablero y la mano.

## Consecuencias

**Positivas**:
- Desacoplamiento total del algoritmo de decisión de la IA respecto al bucle de juego.
- Código limpio, testeable y extensible en la IA del rival.
- Gestión de buffs extremadamente segura (no destructiva) y de rápida implementación mediante `modifiers: IModifier[]`.
- Desglose de modificadores en la interfaz visual muy sencillo de programar.

**Negativas / Riesgos**:
- **Mantenimiento manual de la expiración de modificadores**: Al usar un array, es necesario que la `EndPhase` del motor de turnos recorra los personajes activos restando turnos a los modificadores y eliminando los que expiren. *Mitigación*: Se centralizará esta limpieza en un método de dominio `Character.removeExpiredModifiers()` invocado automáticamente al cerrar el turno.
- **Orden de aplicación de buffs**: Si en el futuro se introducen modificadores multiplicativos (ej. "Duplica el ataque de este esbirro"), el orden en el que están guardados en el array afectará al resultado. *Mitigación*: Para el MVP solo se permitirán bonos aditivos (+X/-X). Si se requieren multiplicativos, se ordenará el array de modificadores poniendo los multiplicadores siempre al final durante el cálculo final de estadísticas.

## Alternativas consideradas

### Alternativas para la IA:
- **Alternativa 1**: **Estructura monolítica con condicionales anidados**. Programar toda la IA dentro de un método `executeAiTurn()` en `OpponentService` usando bloques `if (difficulty === "EASY")` para cada decisión. *Descartada porque*: Genera un archivo gigantesco e imposible de mantener que viola el Principio de Responsabilidad Única (SRP) y el Principio de Abierto/Cerrado (OCP).
- **Alternativa 2**: **Integración de un framework externo de Árboles de Comportamiento (Behavior Trees)**. *Descartada porque*: Incrementa el tamaño del bundle de cliente e introduce una complejidad técnica desmesurada para los requerimientos reales del juego, poniendo en peligro la entrega del MVP en 14 días.

### Alternativas para Buffs/Debuffs:
- **Alternativa 1**: **Patrón Decorator puro implementado**. Envolver cada personaje con clases decorator (`SynergyBuffDecorator`, `ZoneEnvironmentBuffDecorator`) en cada aplicación de efecto. *Descartada porque*: Hace casi imposible inspeccionar individualmente el origen de los buffs para pintarlos en los Tooltips de la UI de Phaser, añade sobre-ingeniería innecesaria en esta etapa del proyecto y ralentiza el desarrollo.
- **Alternativa 2**: **Mutación directa destructiva de atributos**. Sumar o restar directamente los valores a los atributos base `attack` y `health` de la entidad al aplicar un efecto, y restarlos al retirarlo. *Descartada porque*: Es sumamente inestable y propensa a bugs acumulativos (ej. si el personaje se mueve de zona, o muere la unidad que daba el buff tribal, es fácil olvidar restar el valor o restarlo dos veces, corrompiendo el estado del personaje permanentemente).
