# ADR-005: Event Bus como mecanismo de comunicación entre capas

- **Fecha**: 2026-05-20
- **Estado**: Aceptada
- **Autores**: [Equipo del proyecto Crossover Cards]

## Contexto

El diseño arquitectónico de Crossover Cards (detallado en la sección 3 del documento de arquitectura) impone una separación estricta entre la lógica de negocio (capa de Dominio) y la representación visual del juego (capa de Presentación, controlada por Phaser 4). Las reglas del dominio son puras y no tienen conocimiento alguno sobre el motor gráfico. Sin embargo, cuando ocurren eventos clave de juego en el dominio (por ejemplo, una carta es jugada, una criatura es destruida, un héroe sufre daño), la capa de presentación necesita ser notificada de inmediato para actualizar la interfaz, reproducir animaciones y disparar efectos de sonido correspondientes.

Para resolver esta necesidad de comunicación asíncrona y desacoplada, se requiere un mecanismo que permita propagar información desde el interior de la arquitectura (Dominio) hacia el exterior (Presentación), respetando la ley de dependencia que impide que el dominio conozca las capas externas.

## Decisión

Se decide implementar un **Event Bus propio** a través del patrón Publisher/Subscriber (Publicador/Suscriptor).

La arquitectura técnica de esta solución se estructura mediante el principio de Inversión de Dependencias (DIP):
1. La interfaz `IEventBus` y la definición fuertemente tipada de todos los eventos (`GameEvent` enum y sus respectivos payloads) residen íntegramente en la capa de Dominio en `src/domain/events/`.
2. La implementación concreta `GameEventBus` reside en la capa de Infraestructura en `src/infrastructure/events/`. Se expone como un Singleton controlado con un método estático `resetInstance()` para evitar contaminación de estado durante los tests automatizados.
3. La capa de Presentación se suscribe a los eventos del Event Bus para actualizar la UI, y la capa de Aplicación publica los eventos resultantes de la ejecución de comandos.

## Justificación

La elección de un Event Bus propio se sustenta bajo los siguientes criterios técnicos:
- **Desacoplamiento Absoluto (Clean Architecture)**: La capa de Dominio permanece completamente libre de importaciones de Phaser. El dominio simplemente emite a través de la interfaz `IEventBus` sin saber si quien escucha es un test unitario, una consola o una escena 2D de Phaser, preservando la pureza académica del núcleo del juego.
- **Testabilidad y Simulación**: Al no depender del motor de Phaser para emitir o capturar eventos, es extremadamente fácil escribir pruebas automatizadas en Vitest que simulen partidas completas, verificando que los eventos de juego correctos se emiten en el orden esperado tras cada comando ejecutado.
- **Flexibilidad Tecnológica**: Si en el futuro se decidiese portar el juego de Phaser 4 a PixiJS, React, o incluso a una interfaz de texto, la lógica de juego del dominio y el Event Bus permanecerían intactos, requiriendo únicamente reescribir la capa de suscripción visual.
- **Control de Concurrencia y Recursividad**: El Event Bus propietario incluye un sistema interno de detección de emisiones recursivas (`isEmitting` flag). Esto previene bucles infinitos de propagación que congelarían la pestaña del navegador (riesgo típico en sistemas de cartas con sinergias automáticas).

## Consecuencias

**Positivas**:
- Cumplimiento riguroso del flujo de dependencias hacia adentro (Inversión de Dependencias).
- Testing unitario ágil de flujos asíncronos y aserciones sobre comportamientos del juego.
- Prevención activa de fugas de memoria al obligar a los componentes visuales a desregistrarse (`off`) en su fase de destrucción.

**Negativas / Riesgos**:
- **Desconexión temporal entre estado y render**: Como la lógica del dominio es instantánea y síncrona pero las animaciones visuales toman tiempo (ej. mover una carta al tablero), la UI puede quedar desfasada temporalmente. *Mitigación*: La capa de presentación implementará una cola de animaciones secuenciales que procesa los eventos uno tras otro de forma controlada y bloquea inputs del usuario mientras se reproducen efectos críticos.
- **Riesgo de fugas de memoria**: Si un Sprite u objeto visual se destruye pero no cancela su suscripción al Event Bus, la referencia persistirá en el Singleton. *Mitigación*: Se definirá un patrón en el ciclo de vida de los componentes en Phaser donde todo método `destroy()` de un Sprite invoque el método de desuscripción devuelto al registrarse.

## Alternativas consideradas

- **Alternativa 1**: **Uso del emisor de eventos nativo de Phaser (Phaser.Events.EventEmitter)**. Utilizar el sistema de eventos global del juego de Phaser para comunicar los cambios. *Descartada porque*: Requiere que la capa de Dominio importe módulos de Phaser, rompiendo la arquitectura en capas y haciendo imposible la ejecución de tests automatizados sin simular un navegador completo con WebGL en jsdom, lo que reduce drásticamente la velocidad de los tests.
- **Alternativa 2**: **Acoplamiento directo mediante callbacks**. Pasar referencias de clases visuales o callbacks de dibujo directamente a los constructores de las entidades de dominio (por ejemplo, que la clase `Hero` tenga una referencia a `HeroView` para llamarla al recibir daño). *Descartada porque*: Genera un acoplamiento bidireccional insostenible que impide la reutilización de código, dificulta enormemente los tests y viola frontalmente los principios SOLID.
- **Alternativa 3**: **Librería de flujos reactivos pesada (como RxJS)**. *Descartada porque*: Introduce una sobrecarga de bytes enorme al bundle final (violando el ADR-002) y añade complejidad innecesaria a la curva de aprendizaje del equipo de 2 personas para un MVP de 14 días.
