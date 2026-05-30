# ADR-006: Estrategia híbrida de identificadores

- **Fecha**: 2026-05-20
- **Estado**: Aceptada
- **Autores**: [Equipo del proyecto Crossover Cards]

## Contexto

El juego Crossover Cards almacena una gran cantidad de datos de configuración estáticos en archivos JSON (cartas en `cards.json`, héroes en `heroes.json`, misiones en `quests.json`). A la vez, durante el ciclo de vida de una partida en ejecución, estos datos se instancian y se mezclan con datos de estado dinámicos muy volátiles (instancias de cartas concretas moviéndose entre el mazo, la mano, el cementerio y las distintas zonas del tablero; modificadores de buff activos; identificadores de partidas activas).

Para garantizar la integridad referencial, evitar bugs en la lógica de resolución de cartas, y facilitar tanto la edición manual de los JSONs por parte del equipo como la depuración rápida a través del visor de eventos y la consola del navegador, se requiere definir una política estricta y clara sobre el formato y generación de identificadores únicos (IDs) para todas las entidades del software.

## Decisión

Se adopta una **estrategia híbrida de identificadores** clasificada según la naturaleza de la entidad:

1. **Entidades Estáticas (Datos de configuración JSON)**: Utilizan strings legibles por humanos basados en prefijos por arquetipo/tipo seguidos de un número de secuencia en kebab-case (ejemplo: `LIC-001` para Pops de Cartoon Clásico, `HERO-001` para el héroe El Lich, `QST-003` para la misión "El Gran Desfile").
2. **Entidades Dinámicas (Instancias volátiles en memoria durante la partida)**: Utilizan identificadores UUID v4 autogenerados de forma única al instanciarse la clase en el dominio (ejemplo: la instancia de la carta en la mano del jugador tendrá el ID `b3f8a428-2d86-4fdf-9759-3fb7a6416172`, mientras que el modificador temporal que le otorga +2/+2 tendrá el ID `20cf8b6e-c852-47c1-84de-c827ea802e3b`).

## Justificación

Esta estrategia híbrida se sustenta en los siguientes pilares de mantenibilidad y trazabilidad:

- **Legibilidad y Ergonomía para el Game Designer**: El equipo puede crear, editar y balancear cartas manualmente en el JSON utilizando IDs descriptivos (`LIC-001`) sin la fricción ni el riesgo de error humano que supone copiar y pegar secuencias alfanuméricas aleatorias complejas.
- **Prevención de Colisiones en Juego**: Si un jugador tiene en su mazo dos copias físicas del personaje `LIC-001`, y ambas se juegan en la misma zona del tablero, la lógica del juego debe poder diferenciarlas inequívocamente al procesar ataques, objetivos de hechizos y expiración de bufos. Asignarles un UUID v4 individual a cada instancia al momento de entrar a la partida solventa este problema de manera absoluta.
- **Facilidad de Depuración (Debugging)**: Al leer el flujo de eventos en la consola (ejemplo: _"Pops el Gentil (ID: LIC-001, Instancia: b3f8...) ataca a Lich (ID: HERO-001)"_), es sumamente sencillo para el programador entender qué carta estática desencadenó la acción y qué instancia concreta del tablero recibió el impacto.
- **Desacoplamiento del Event Loop en Tests**: El uso de UUIDs para partidas y modificadores garantiza que cada ejecución de test unitario en Vitest sea hermética e independiente, sin peligro de arrastrar IDs residuales de ejecuciones previas.

## Consecuencias

**Positivas**:

- Cero colisiones lógicas al tener múltiples instancias de la misma carta física en juego.
- Estructura de JSON limpia, legible y auto-descriptiva para mantenimiento manual.
- Trazabilidad perfecta de modificadores y ciclos de vida de cartas a través de logs en el Event Bus.

**Negativas / Riesgos**:

- **Sobrecarga de almacenamiento en red**: Los UUID v4 ocupan 36 caracteres en comparación con enteros simples, incrementando ligeramente el tamaño del estado serializado. _Mitigación_: Tratándose de un juego cliente-side sin sincronización constante con servidor multijugador en tiempo real, esta sobrecarga de memoria en el navegador es completamente imperceptible y despreciable.
- **Riesgo de desincronización manual en el JSON**: Si un programador escribe un ID estático duplicado en el archivo de cartas (ej. dos cartas con ID `LIC-001`), el cargador fallará. _Mitigación_: Se implementará un test unitario de validación estática de datos en Vitest que recorra los JSONs al iniciar los tests y verifique que no existan duplicados, garantizando la integridad referencial antes del despliegue.

## Alternativas consideradas

- **Alternativa 1**: **Estrategia pura de UUID v4 para todo**. Asignar UUIDs generados desde el inicio en el archivo JSON a cada carta y héroe estático. _Descartada porque_: Hace extremadamente doloroso editar los mazos en `decks.json` (ya que referenciar cartas requeriría enlazar secuencias complejas como `"LIC-001"` vs `"8f9e2b10-fa32-4731..."`), disminuyendo la velocidad de desarrollo del equipo de 2 personas.
- **Alternativa 2**: **Estrategia pura de strings legibles con sufijos autoincrementales**. Crear IDs dinámicos concatenando el ID de carta base con un contador global de instancias (ejemplo: `LIC-001-inst-1`, `LIC-001-inst-2`). _Descartada porque_: Obliga al dominio a mantener un estado centralizado (un contador mutable global) para generar los sufijos, lo que introduce un acoplamiento indeseado, dificulta el paralelismo y la limpieza de estado en tests unitarios, y es propenso a reinicios inconsistentes de contadores.
- **Alternativa 3**: **IDs numéricos secuenciales simples (autoincrementales enteros)**. _Descartada porque_: Requiere un coordinado estricto en la base de datos o sistema de persistencia y carece de semántica legible al depurar flujos complejos de combate en la consola.
