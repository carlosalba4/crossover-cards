# ADR-004: Patrón State para la máquina de estados del turno

- **Fecha**: 2026-05-20
- **Estado**: Aceptada
- **Autores**: [Equipo del proyecto Crossover Cards]

## Contexto

El juego Crossover Cards es un juego de cartas estratégico por turnos. El ciclo de vida de cada turno está estructurado de manera rigurosa en cuatro fases distintas y secuenciales: Fase de Robo (Draw Phase), Fase Principal (Main Phase), Fase de Combate (Combat Phase) y Fase de Fin de Turno (End Phase). Cada una de estas fases tiene sus propias reglas de negocio: define qué acciones son válidas (por ejemplo, solo se pueden jugar cartas en la Fase Principal, y solo se puede atacar en la Fase de Combate), qué transiciones de estado están permitidas y qué disparadores automáticos deben activarse al entrar o salir de ellas.

El PRD (especialmente el flujo de bucle de turnos en la sección 6.2) y el documento de arquitectura técnica establecen la necesidad de un sistema robusto, escalable y fácilmente testable para controlar estas transiciones. Si la lógica de las fases se mezcla en una clase controladora gigante, el código se volverá propenso a errores de acoplamiento, difícil de depurar y propenso a estados inconsistentes, especialmente al coordinar la lógica entre el jugador humano y el oponente controlado por la IA.

## Decisión

Se decide implementar el patrón de diseño clásico **State** para gestionar el motor de turnos del juego (`TurnEngine`).

La arquitectura constará de:

1. Una interfaz común `ITurnPhase` que define el contrato para cualquier estado/fase de un turno, con métodos para gestionar la entrada (`enter`), la salida (`exit`), la ejecución de acciones del jugador (`handleAction`) y la recuperación de acciones permitidas (`getAllowedActions`).
2. Clases concretas para cada fase del turno: `DrawPhase`, `MainPhase`, `CombatPhase` y `EndPhase`. Cada una encapsula de forma aislada la validación de negocio y las reglas específicas de su ciclo de vida.
3. Un objeto de contexto `TurnEngine` que mantiene la referencia a la fase activa actual y delega en ella las peticiones de acción y transiciones.

## Justificación

La implementación del patrón State se fundamenta en las siguientes razones técnicas:

- **Separación de Responsabilidades (SRP)**: Cada fase del turno se encuentra en su propio archivo físico y clase, aislando por completo las reglas de juego específicas de ese momento temporal. Por ejemplo, la lógica de _Fatigue_ reside estrictamente dentro de `DrawPhase` y no interfiere con la lógica de combate.
- **Mantenibilidad y Robustez**: Al encapsular las reglas de transición dentro de cada clase concreta de fase, es virtualmente imposible que se ejecuten acciones no válidas correspondientes a otra etapa del turno (por ejemplo, declarar ataques durante la Fase Principal), reduciendo de raíz bugs críticos de flujo.
- **Testabilidad Aislada**: Al no depender de variables globales ni de Phaser, es posible instanciar cada fase del turno de forma unitaria en Vitest y probar sus transiciones mediante simulaciones de acción directas, logrando cumplir de manera eficiente con el objetivo de cobertura del 80% en el dominio.
- **Flexibilidad ante cambios**: Si en futuras iteraciones de diseño se requiere introducir una nueva fase (por ejemplo, una fase de "Mulligan" o "Interrupción"), bastará con añadir una nueva clase que implemente `ITurnPhase` y ajustar la transición de entrada en `TurnEngine`, sin alterar las fases de robo, combate o fin existentes.

## Consecuencias

**Positivas**:

- Alta cohesión y bajo acoplamiento en la lógica del motor de turnos.
- Lógica de transiciones limpia, explícitamente definida y fácil de seguir.
- Facilidad extrema para mockear fases individuales durante los tests automatizados de Vitest.
- Alineamiento estricto con los requerimientos académicos de evaluación de patrones de diseño (SOLID).

**Negativas / Riesgos**:

- **Incremento en el número de archivos**: El patrón requiere crear al menos 5 archivos físicos nuevos en `src/domain/states/` en lugar de una única clase controladora. _Mitigación_: Se asume este coste de infraestructura en favor de la alta mantenibilidad a largo plazo del código.
- **Complejidad inicial de boilerplate**: Requiere definir interfaces y constructores que pasen el contexto. _Mitigación_: Se utilizarán plantillas de código limpio y el generador de código de los agentes (Antigravity/opencode) para agilizar la creación inicial de las clases.

## Alternativas consideradas

- **Alternativa 1**: **Estructura procedural switch/case (Máquina de estados _ad-hoc_)**. Consiste en almacenar el estado actual en una variable de tipo `enum` (por ejemplo, `PhaseEnum`) dentro de una clase única `TurnManager`, y utilizar un `switch(currentPhase)` masivo en cada método de acción para bifurcar el comportamiento. _Descartada porque_: Conduce a una clase "dios" gigante con baja cohesión, propensa a colisiones de código al trabajar dos personas en el equipo en paralelo, y difícil de mantener a medida que se añaden validaciones a las acciones de juego.
- **Alternativa 2**: **Uso de una librería externa de FSM (Finite State Machine)** como `javascript-state-machine` o `xstate`. _Descartada porque_: Introduce una dependencia externa innecesaria, incrementa potencialmente el tamaño del bundle (infringiendo el ADR-002) y oculta la implementación interna de los estados, dificultando el testing puro con Vitest de la lógica de dominio sin dependencias externas complejas.
