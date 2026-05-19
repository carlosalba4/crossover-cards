# Product Requirements Document (PRD)
## Juego de Cartas Estratégico por Turnos — Crossover Animado

---

| Campo            | Valor                                      |
|------------------|--------------------------------------------|
| Titulo           | Crossover Cards                                |
| Version          | 1.1.0                                      |
| Fecha            | 2026-05-19                                 |
| Estado           | Borrador — pendiente de revision del equipo |
| Autores          | Equipo del proyecto (2 personas)           |
| Fase             | Analisis de Requisitos (Cascada, Dia 1-2)  |
| Asignatura       | Desarrollo con IA                          |
| Revision         | Generado con asistencia de Google Antigravity (Claude Sonnet) |

---

## Tabla de Contenidos

1. Introduccion
2. Vision del Producto
3. Objetivos y Metricas de Exito
4. Restricciones del Proyecto
5. Alcance del MVP
6. Concepto de Juego
7. Sistema de Cartas
8. Heroes
9. Mecanicas Innovadoras
10. IA del Oponente
11. Easter Egg del Tablero
12. Requisitos Funcionales (RF)
13. Requisitos No Funcionales (RNF)
14. Casos de Uso (CU)
15. Criterios de Aceptacion
16. Arquitectura de Referencia
17. Riesgos Identificados
18. Glosario
19. Apendice: Registro de Interacciones IA

---

## 1. Introduccion

### 1.1 Proposito del Documento

Este documento define los requisitos funcionales y no funcionales del juego de cartas
estrategico por turnos desarrollado como proyecto final de la asignatura "Desarrollo con IA".
Su objetivo es servir como contrato de alcance entre el equipo de desarrollo y los evaluadores,
y como referencia tecnica durante todas las fases posteriores de la metodologia en cascada.

El PRD es el entregable principal de la fase de Analisis de Requisitos y debe leerse antes
de comenzar cualquier tarea de Diseno o Implementacion.

### 1.2 Alcance del Documento

Este documento cubre:

- La vision y concepto completo del producto.
- Todas las mecanicas de juego del MVP.
- Los requisitos funcionales (RF) y no funcionales (RNF) numerados y priorizados.
- Los casos de uso principales en formato Cockburn.
- Los criterios de aceptacion medibles para cada mecanica innovadora.
- La arquitectura de referencia en capas.
- Los riesgos identificados con planes de mitigacion.

Este documento NO cubre diseno visual detallado de assets, implementacion tecnica concreta
ni planificacion de sprints.

### 1.3 Audiencia

- Equipo de desarrollo del proyecto (2 personas).
- Profesor evaluador de la asignatura.
- Futuros colaboradores o revisores del repositorio.

### 1.4 Documentos Relacionados

| Documento                               | Ubicacion                              |
|-----------------------------------------|----------------------------------------|
| Registro de interacciones con IA        | `docs/ai-log.md`                       |
| ADR-001: Stack tecnologico              | `docs/decisions/ADR-001-*.md`          |
| ADR-002: Tamano de bundle               | `docs/decisions/ADR-002-*.md`          |
| AGENTS.md (reglas para agentes IA)      | `AGENTS.md`                            |
| Prompt del agente PRD                   | `prompts/agents/prd-agent.md`          |

---

## 2. Vision del Producto

### 2.1 Pitch

Crossover Cards es un juego de cartas estrategico por turnos 1 vs 1 (Jugador vs IA)
ambientado en un universo crossover donde personajes iconicos de series de animacion
(Regular Show, Hora de Aventuras, Bob Esponja, Inazuma Eleven y otros) se enfrentan
en combates de cartas. Cada heroe tiene su mazo tematico y sus mecanicas propias,
combinando la profundidad estrategica de Hearthstone con la estetica y el humor
desenfadado de los cartoons modernos.

### 2.2 Fantasia y Tono

- **Fantasia central**: el jugador es un aficionado que ha reunido cartas de sus series
  favoritas y desafia a rivales en duelos epicos.
- **Tono**: casual, divertido, colorido, con humor. Los personajes hacen comentarios
  sarcasticos y memorables al jugar sus cartas.
- **Referencia estetica**: cartoons de Cartoon Network y Nickelodeon de los anos 2000-2010.
- **Audiencia objetivo**: jugadores casuales de 16-30 anos con nostalgia por estas series.

### 2.3 Plataforma Objetivo

| Campo               | Valor                                    |
|---------------------|------------------------------------------|
| Plataforma          | Navegador web (desktop)                  |
| Resolucion base     | 1280x720 px (escalable)                  |
| Renderizado         | WebGL via Phaser 4                       |
| Navegadores         | Chrome, Firefox, Edge (versiones recientes) |
| Conexion            | Sin necesidad de servidor backend        |

### 2.4 Posicionamiento

Crossover Cards no compite en el mercado comercial. Su proposito es academico:
demostrar la aplicacion de patrones de diseno, arquitectura en capas, pruebas unitarias
y el uso efectivo de herramientas de IA en el flujo de desarrollo de software.

---

## 3. Objetivos y Metricas de Exito

### 3.1 Objetivos Academicos

| ID  | Objetivo                                                                 | Criterio de exito                              |
|-----|--------------------------------------------------------------------------|------------------------------------------------|
| OA-1 | Aplicar metodologia en cascada con entregables por fase                 | PRD, diseno y codigo entregados en plazo        |
| OA-2 | Documentar todas las interacciones con IA                               | ai-log.md con minimo 8 interacciones           |
| OA-3 | Aplicar arquitectura en capas y patrones de diseno                      | Separacion domain/application/presentation     |
| OA-4 | Alcanzar cobertura de tests ≥ 80% en la capa de dominio                 | Reporte de Vitest con cobertura verificable    |
| OA-5 | Implementar flujos agénticos con opencode + Antigravity                 | Prompts versionados en `prompts/agents/`       |

### 3.2 Objetivos de Producto (MVP)

| ID   | Objetivo                                                                | Criterio de exito                              |
|------|-------------------------------------------------------------------------|------------------------------------------------|
| OP-1 | Partida completa jugable de principio a fin                             | Partida termina con victoria/derrota           |
| OP-2 | 2 heroes con mazos distintos y habilidades unicas                       | Cada heroe tiene 15 cartas distintas           |
| OP-3 | 5 mecanicas innovadoras funcionando correctamente                       | M1-M5 cubiertas por criterios de aceptacion   |
| OP-4 | IA en 2 niveles de dificultad                                           | Facil y Medio con comportamientos distintos    |
| OP-5 | Tablero animado con easter egg interactivo                              | Easter egg se activa y produce respuesta visual|
| OP-6 | UI completa: menu, seleccion, partida, resultado                        | Flujo completo sin pantallas rotas             |

### 3.3 KPIs de Calidad

| KPI                          | Umbral minimo     |
|------------------------------|-------------------|
| Cobertura de tests (dominio) | ≥ 80%             |
| Rendimiento en partida       | 60 FPS sostenidos |
| Errores de TypeScript        | 0 en modo strict  |
| Advertencias de ESLint       | 0 al hacer commit |
| Tiempo de carga inicial      | < 5 segundos      |

---

## 4. Restricciones del Proyecto

### 4.1 Restricciones Temporales

| Fase              | Dias asignados | Dias naturales     |
|-------------------|----------------|--------------------|
| Analisis          | 1-2            | Dia 1 al 2         |
| Diseno            | 3-4            | Dia 3 al 4         |
| Implementacion    | 5-11           | Dia 5 al 11        |
| Pruebas           | 12-13          | Dia 12 al 13       |
| Despliegue        | 14             | Dia 14             |
| **Total**         | **14 dias**    |                    |

### 4.2 Restricciones de Equipo

- Equipo de 2 personas. No hay roles especializados fijos; ambos participan en todas las fases.
- Disponibilidad estimada: aproximadamente 4-6 horas diarias por persona.

### 4.3 Restricciones Tecnicas

| Restriccion                          | Detalle                                          |
|--------------------------------------|--------------------------------------------------|
| Stack obligatorio                    | Phaser 4 + TypeScript + Vite + Vitest            |
| Modelos de IA                        | Solo gratuitos o locales (Qwen2.5-Coder, Qwen3) |
| Sin backend                          | Toda la logica en cliente web                    |
| Sin pago                             | Sin servicios de pago (APIs, CDNs de pago, etc.) |
| Arquitectura en capas obligatoria    | domain / application / infrastructure / presentation |
| Idioma del codigo                    | Ingles (nombres); Espanol (comentarios, docs)    |

### 4.4 Restricciones de Uso de IA

- Los modelos de pago (GPT-4, Claude Pro en modo directo, Gemini Pro) estan prohibidos
  como herramientas autonomas de generacion de codigo.
- Antigravity (Google) y opencode con Ollama local son las unicas herramientas de IA
  permitidas.
- Toda interaccion con IA debe quedar registrada en `docs/ai-log.md`.

---

## 5. Alcance del MVP

### 5.1 Funcionalidades Must-Have (Obligatorias)

| ID     | Funcionalidad                                          |
|--------|--------------------------------------------------------|
| MH-01  | Partida 1 vs 1: Jugador vs IA                          |
| MH-02  | 2 heroes jugables con habilidad pasiva unica           |
| MH-03  | 20 cartas iniciales (10 por mazo)                      |
| MH-04  | Sistema de turnos: Robo, Principal, Combate, Fin       |
| MH-05  | Sistema de Nostalgia creciente (1 a 10, +1 por turno, reloj victoriano)      |
| MH-06  | Tablero con limite de 7 Personajes por lado             |
| MH-07  | Mano maxima de 10 cartas, mazo de 30 cartas            |
| MH-08  | Tipos de carta: Personaje, Hechizo, Objeto              |
| MH-09  | Sistema de rareza: Comun, Rara, Epica, Legendaria      |
| MH-10  | IA con nivel Facil (Greedy) y Medio (Threat-aware)     |
| MH-11  | Tablero animado con easter egg oculto interactivo      |
| MH-12  | Zonas/Entornos del tablero dinamicos                   |
| MH-13  | Mecanica M1: Sinergia tribal                           |
| MH-14  | Mecanica M2: Momentum (comeback mechanic)              |
| MH-15  | Mecanica M3: Zonas/Entornos dinamicos                  |
| MH-16  | Mecanica M4: Misiones (Quests)                         |
| MH-17  | Mecanica M5: Aliado invitado (Crossover)               |
| MH-18  | UI: Menu principal                                     |
| MH-19  | UI: Seleccion de heroe                                 |
| MH-20  | UI: Pantalla de partida completa                       |
| MH-21  | UI: Pantalla de victoria y derrota                     |

### 5.2 Funcionalidades Should-Have (Deseables)

| ID     | Funcionalidad                                              |
|--------|------------------------------------------------------------|
| SH-01  | Tooltips interactivos sobre cada carta al pasar el raton  |
| SH-02  | Animacion especial al jugar cartas Legendarias            |
| SH-03  | Efectos de sonido basicos (jugar carta, atacar, victoria) |
| SH-04  | Contador visual de cartas restantes en el mazo            |
| SH-05  | Historial de acciones del turno (log lateral)             |
| SH-06  | Indicador visual de turno activo                          |

### 5.3 Funcionalidades Could-Have (Opcionales)

| ID     | Funcionalidad                                                    |
|--------|------------------------------------------------------------------|
| CH-01  | Animacion de entrada de Personajes al tablero                     |
| CH-02  | Persistencia local de estadisticas (victorias/derrotas)          |
| CH-03  | Selector de nivel de dificultad en el menu                       |
| CH-04  | Musica de fondo adaptativa segun fase del juego                  |
| CH-05  | Tercer heroe jugable                                             |

### 5.4 Exclusiones Explicitas (Out of Scope)

- Multijugador online o en red local.
- Tienda o sistema de coleccion de cartas.
- Cuentas de usuario o autenticacion.
- Mas de 2 niveles de dificultad de IA.
- Soporte movil o tactil.
- Modo historia o campana.
- Editor de mazos.

---

## 6. Concepto de Juego

### 6.1 Descripcion General

Crossover Cards es un juego de cartas por turnos donde dos jugadores (uno humano,
uno controlado por IA) se enfrentan en un duelo de cartas. Cada jugador controla un
heroe con 30 puntos de vida y un mazo de 30 cartas. El objetivo es reducir los puntos
de vida del heroe rival a 0.

### 6.2 Estructura de una Partida

```
Inicio de Partida
    |
    v
[Configuracion inicial]
    - Cada jugador baraja su mazo
    - Cada jugador roba 4 cartas
    - Se determina quien va primero (aleatorio)
    - El jugador que va primero NO roba en el turno 1
    |
    v
[Bucle de turnos]
    |
    +---> FASE 1: ROBO
    |         - El jugador activo roba 1 carta
    |         - Si el mazo esta vacio: recibe 1 danyo por carta que deberia robar
    |
    +---> FASE 2: PRINCIPAL
    |         - El jugador activo recibe su Nostalgia del turno (+1, max 10)
    |         - Puede jugar cartas (Personajes, Hechizos, Objetos) pagando su coste
    |         - Puede activar la habilidad de heroe (si tiene Nostalgia)
    |         - Puede activar Crossover (una vez por partida)
    |         - Puede colocar cartas de Mision (coste 0)
    |         - Puede gastar Momentum como Nostalgia adicional
    |
    +---> FASE 3: COMBATE
    |         - Las Personajes del jugador activo pueden atacar
    |         - Cada Personaje puede atacar una vez por turno
    |         - Se puede atacar a Personajes enemigas o al heroe rival
    |         - Si el rival tiene Personajes con Provocacion, es obligatorio atacarlas primero
    |
    +---> FASE 4: FIN DE TURNO
              - Se resuelven efectos de "fin de turno"
              - Se comprueban condiciones de Mision
              - Se verifican sinergias tribales activas
              - Se actualiza el estado de Zonas/Entornos
              - El turno pasa al otro jugador
```

### 6.3 Sistema de Nostalgia

La Nostalgia es el recurso principal del juego. Narrativamente representa el sentimiento
nostalgico que invocan los personajes de cartoon al entrar en combate. Se representa
visualmente en la UI mediante un **reloj de bolsillo victoriano de cadena** que se
recarga al inicio de cada turno.

- Cada jugador comienza el turno 1 con 1 punto de Nostalgia (maximo 1).
- Cada turno, el maximo de Nostalgia aumenta en 1 hasta un tope de 10.
- Al inicio de cada turno del jugador, su Nostalgia se recarga al maximo actual.
- La Nostalgia no utilizada NO se acumula entre turnos.
- El Momentum (ver Mecanica M2) puede actuar como Nostalgia adicional en el mismo turno.

### 6.4 Sistema de Combate

- Una Personaje recien jugada NO puede atacar en el mismo turno, salvo que tenga
  la habilidad "Cargo" (charge).
- Al atacar, ambas Personajes se infligen dano mutuamente igual a su valor de Ataque.
- Una Personaje con 0 o menos puntos de Vida es destruida y enviada al cementerio.
- El heroe no puede atacar directamente; solo recibe dano de Personajes y hechizos.
- Una Personaje solo puede realizar una accion de ataque por turno.

### 6.5 Fin de Partida

La partida termina cuando:

a) Los puntos de vida de un heroe llegan a 0 o menos → ese jugador pierde.
b) Ambos heroes llegan a 0 en el mismo momento → empate (se muestra pantalla especial).
c) [PENDIENTE DE VALIDACION] Opcion de rendicion voluntaria por parte del jugador humano.

### 6.6 Habilidades Especiales de Personajes

| Habilidad       | Nombre tecnico  | Descripcion                                                     |
|-----------------|-----------------|-----------------------------------------------------------------|
| Provocacion     | Taunt           | Los rivales deben atacar esta Personaje antes que a otras        |
| Cargo           | Charge          | Puede atacar el mismo turno que es jugada                       |
| Escudo Divino   | Divine Shield   | Ignora el primer punto de dano que recibe                       |
| Ultimo Aliento  | Deathrattle     | Activa un efecto al ser destruida                               |
| Grito de Guerra | Battlecry       | Activa un efecto al ser jugada desde la mano                    |
| Vision          | Stealth         | No puede ser objetivo de ataques ni hechizos hasta que ataque   |
| Veneno          | Poisonous       | Destruye cualquier Personaje a la que danya, independientemente de su vida |
| Silencio        | Silence (efecto)| Elimina todas las habilidades especiales de la Personaje objetivo |

---

## 7. Sistema de Cartas

### 7.1 Atributos Comunes a Todas las Cartas

| Atributo        | Tipo      | Descripcion                                                   |
|-----------------|-----------|---------------------------------------------------------------|
| id              | string    | Identificador unico. Formato: `ARCH-NUM` (ej: `LIC-001`)     |
| name            | string    | Nombre de la carta                                            |
| type            | enum      | Personaje / Hechizo / Objeto                                   |
| archetype       | enum      | Cartoon Clasico / Aventura Magica / Anime Combate / Sobrenatural / Neutral |
| nostalgyCost    | integer   | Coste en puntos de Nostalgia para jugarla (0-10)                   |
| rarity          | enum      | Comun / Rara / Epica / Legendaria                             |
| description     | string    | Descripcion del efecto de la carta                            |
| spriteKey       | string    | Clave del asset grafico en Phaser                             |
| greetingText    | string    | Texto que el personaje/carta dice al ser jugado                     |

### 7.2 Atributos Adicionales por Tipo

#### Personajes

| Atributo        | Tipo          | Descripcion                                                 |
|-----------------|---------------|-------------------------------------------------------------|
| attack          | integer       | Puntos de ataque                                            |
| health          | integer       | Puntos de vida                                              |
| abilities       | string[]      | Lista de habilidades especiales (taunt, charge, etc.)       |
| currentHealth   | integer       | Vida actual en partida (puede diferir de la base)           |
| hasAttackedThisTurn | boolean  | Indica si ya ataco este turno                               |
| isExhausted     | boolean       | Indica si fue jugada este turno y aun no puede atacar       |

#### Hechizos

| Atributo        | Tipo      | Descripcion                                                   |
|-----------------|-----------|---------------------------------------------------------------|
| effectType      | enum      | Danyo / Curacion / Robo / Buff / Debuff / AoE / Control      |
| targetType      | enum      | SingleCreature / AllCreatures / Hero / AllEnemies / Self      |
| effectValue     | integer   | Magnitud del efecto (puntos de dano, curacion, cartas, etc.) |

#### Objetos Modificadores

| Atributo        | Tipo      | Descripcion                                                   |
|-----------------|-----------|---------------------------------------------------------------|
| targetType      | enum      | Hero / Creature                                               |
| statModifier    | object    | Modificacion de ataque y/o vida                               |
| abilityGranted  | string    | Habilidad concedida al objetivo (opcional)                    |
| durability      | integer   | Usos restantes antes de que el objeto se destruya             |

### 7.3 Sistema de Rareza

| Rareza      | Color visual | Limite por mazo | Caracteristica principal                          |
|-------------|--------------|-----------------|---------------------------------------------------|
| Comun       | Gris         | Sin limite      | Efectos simples y directos                        |
| Rara        | Azul         | Sin limite      | Efectos con condicion o contador                  |
| Epica       | Morada       | 2 copias max    | Efectos potentes situacionales                    |
| Legendaria  | Dorada       | 1 copia max     | Efecto unico, animacion especial al jugar         |

### 7.4 Tabla de Cartas Iniciales del MVP

El MVP incluye 20 cartas distintas: 10 del mazo de El Lich y 10 del mazo de Axel Blaze.
Cada mazo tiene 30 cartas en total, por lo que se permite incluir 2-3 copias de las
cartas Comunes y Raras.

#### Mazo de El Lich

| ID      | Nombre                      | Tipo      | Nostalgia | Rareza     | ATQ | VID | Arquetipo         | Habilidades / Efecto                                                                   |
|---------|-----------------------------|-----------|-----------|------------|-----|-----|-------------------|----------------------------------------------------------------------------------------|
| LIC-001 | Pops el Gentil              | Personaje | 2         | Rara       | 1   | 4   | Cartoon Clasico   | Ultimo Aliento: otorga +2/+2 a una Personaje aliada aleatoria                          |
| LIC-002 | Darwin Watterson            | Personaje | 2         | Comun      | 2   | 3   | Cartoon Clasico   | Grito de Guerra: si hay otra Personaje aliada en el tablero, esta Personaje gana +1/+1 |
| LIC-003 | Chowder                     | Personaje | 3         | Comun      | 3   | 2   | Cartoon Clasico   | Grito de Guerra: destruye una Personaje enemiga con 1 o menos VID ("se la come")       |
| LIC-004 | Patricio Estrella           | Personaje | 3         | Comun      | 4   | 3   | Cartoon Clasico   | Al atacar, efecto aleatorio: gana +2 ATQ O pierde -1 ATQ ese ataque [PENDIENTE VALIDACION] |
| LIC-005 | Rigby                       | Personaje | 2         | Rara       | 3   | 2   | Cartoon Clasico   | Cargo. No puede atacar el turno inmediatamente siguiente tras atacar                   |
| LIC-006 | Jake el Perro               | Personaje | 4         | Epica      | --  | --  | Aventura Magica   | Al jugarlo, el jugador elige la forma: 6/2 (forma ofensiva) o 2/6 (forma defensiva)   |
| LIC-007 | Superbocata                 | Hechizo   | 4         | Rara       | --  | --  | Neutral           | Restaura 6 PV al heroe aliado                                                          |
| LIC-008 | Cangreburger                | Hechizo   | 2         | Comun      | --  | --  | Neutral           | Restaura 3 PV al heroe aliado y roba 1 carta                                          |
| LIC-009 | El Poder                    | Objeto    | 3         | Epica      | --  | --  | Neutral           | Equipa al heroe: al activarse, inflige 3 de dano a todas las Personajes enemigas. Durabilidad 1 |
| LIC-010 | Espada de Sangre de Demonio | Objeto    | 5         | Legendaria | --  | --  | Aventura Magica   | Equipa al heroe: +5 ATQ. Al inicio de cada turno propio, el heroe recibe 1 de dano. Durabilidad 3 |

#### Mazo de Axel Blaze

| ID      | Nombre                      | Tipo      | Nostalgia | Rareza     | ATQ | VID | Arquetipo         | Habilidades / Efecto                                                                   |
|---------|-----------------------------|-----------|-----------|------------|-----|-----|-------------------|----------------------------------------------------------------------------------------|
| AXE-001 | Goku                        | Personaje | 7         | Legendaria | 6   | 6   | Anime Combate     | Al recibir dano que lo dejaria a 0 VID, en lugar de morir vuelve con 4/4 y gana Cargo (una vez por partida) |
| AXE-002 | Marceline                   | Personaje | 5         | Epica      | 4   | 5   | Aventura Magica   | Drenaje: al atacar a una Personaje, el heroe aliado recupera PV iguales al dano infligido |
| AXE-003 | Fantasma Chocala            | Personaje | 3         | Rara       | 2   | 3   | Sobrenatural      | Grito de Guerra: otorga +1/+1 a una Personaje aliada aleatoria. No puede ser objetivo de hechizos el turno en que es jugado |
| AXE-004 | Diamantino                  | Personaje | 4         | Rara       | 3   | 5   | Anime Combate     | Escudo Cristalino: la primera vez que recibe dano, lo reduce a la mitad (redondeado hacia abajo) |
| AXE-005 | Chum Chum                   | Personaje | 1         | Comun      | 1   | 2   | Cartoon Clasico   | Sin habilidad especial. Coste 1, ideal para activar sinergias tribales                 |
| AXE-006 | Agallas el Perro Cobarde    | Personaje | 3         | Rara       | 2   | 4   | Sobrenatural      | No puede ser objetivo de ataques mientras haya otra Personaje aliada (taunt inverso). Si es la unica aliada, gana +2 ATQ |
| AXE-007 | Pedo Poderoso               | Hechizo   | 4         | Epica      | --  | --  | Neutral           | Inflige 2 de dano a todas las Personajes enemigas del tablero (AoE)                   |
| AXE-008 | Linterna Minimizadora       | Hechizo   | 3         | Rara       | --  | --  | Neutral           | Reduce el ATQ y VID de una Personaje enemiga a la mitad (redondeo hacia abajo) de forma permanente |
| AXE-009 | Bola de Dragon              | Objeto    | 5         | Legendaria | --  | --  | Anime Combate     | Al jugarse, el jugador elige entre: curar 5 PV al heroe / infligir 5 dano al heroe enemigo / ganar 3 Nostalgia extra este turno |
| AXE-010 | Omnitrix                    | Objeto    | 4         | Legendaria | --  | --  | Anime Combate     | Equipa al heroe. Al activar habilidad de heroe, elige entre: infligir 3 dano / Escudo Divino hasta el siguiente turno / robar 2 cartas. Durabilidad 2 |


- Cada mazo contiene exactamente 30 cartas.
- Cartas Comunes y Raras: maximo 2 copias por carta.
- Cartas Epicas: maximo 2 copias por carta.
- Cartas Legendarias: maximo 1 copia por carta.
- [PENDIENTE DE VALIDACION] El editor de mazos es una funcionalidad Could-Have y no
  forma parte del MVP. Los mazos del MVP son preconstruidos y no modificables.

---

## 8. Heroes

### 8.1 Ficha de Heroe — El Lich

| Campo               | Valor                                                            |
|---------------------|------------------------------------------------------------------|
| ID                  | HERO-001                                                         |
| Nombre canonico     | El Lich                                                          |
| Arquetipo principal | Aventura Magica                                                  |
| Puntos de Vida base | 30                                                               |
| Universo de referencia | Hora de Aventuras — Cartoon Network                           |
| Estilo de juego     | Control, dano directo, desgaste del rival                        |
| Estetica            | Tonos morados y verdes oscuros, calaveras, magia corrupta        |

**Trasfondo**: El Lich es la entidad no-muerta mas antigua y poderosa de las Tierras de
Ooo. En el multiverso de Crossover Cards aparece como un nigromante que usa el
sentimiento de la nostalgia de forma corrupta para drenar la energia de sus rivales.
Habla con voz gelida y profunda.

#### Habilidad Activable: Hechizo Ancestral

| Campo        | Valor                                                                    |
|--------------|--------------------------------------------------------------------------|
| Nombre       | Hechizo Ancestral                                                        |
| Coste        | 2 Nostalgia                                                              |
| Frecuencia   | Una vez por turno (en la Fase Principal)                                 |
| Efecto       | Inflige 2 puntos de dano a un objetivo enemigo elegido por el jugador (heroe o Personaje) |
| Sinergia     | Complementa mazos de desgaste y control; util para rematar Personajes debilitadas |

**Razonamiento de la habilidad**: el dano directo a objetivo refleja el poder de
manipulacion oscura del Lich. A 2 Nostalgia es eficiente pero no rota la partida;
funciona tanto para eliminar amenazas como para presionar al heroe rival.

### 8.2 Ficha de Heroe — Axel Blaze

| Campo               | Valor                                                            |
|---------------------|------------------------------------------------------------------|
| ID                  | HERO-002                                                         |
| Nombre canonico     | Axel Blaze                                                       |
| Arquetipo principal | Anime Combate                                                    |
| Puntos de Vida base | 30                                                               |
| Universo de referencia | Inazuma Eleven — anime/videojuego                             |
| Estilo de juego     | Agresivo, buff a personajes aliados, presion constante           |
| Estetica            | Tonos rojos y naranjas, llamas, energia de combate               |

**Trasfondo**: Axel Blaze (conocido tambien como Gazelle en otras versiones) es el
delantero estrella del equipo Inazuma Eleven. Su tecnica firma es "Tornado de Fuego".
En el multiverso de Crossover Cards representa al luchador fisico que potencia a
sus aliados con intensidad y determinacion.

#### Habilidad Activable: Tornado de Fuego

| Campo        | Valor                                                                    |
|--------------|--------------------------------------------------------------------------|
| Nombre       | Tornado de Fuego                                                        |
| Coste        | 2 Nostalgia                                                              |
| Frecuencia   | Una vez por turno (en la Fase Principal)                                 |
| Efecto       | Otorga +2 de ATQ a una Personaje aliada elegida hasta el final del turno |
| Sinergia     | Potente con Personajes que tienen Cargo o con la sinergia tribal de Anime Combate |

**Razonamiento de la habilidad**: el buff temporal de ataque refleja el disparo
potenciado con llamas de Axel. Al ser temporal (solo hasta fin de turno), obliga
al jugador a atacar con esa Personaje ese turno, creando decision tactica.

### 8.3 Seleccion de Heroe

El jugador elige su heroe en la pantalla de Seleccion de Heroe antes de comenzar
la partida. La IA siempre usa el heroe contrario al jugador para garantizar partidas
asimetricas. Si el jugador elige El Lich, la IA usa Axel Blaze, y viceversa.

| Campo               | Valor                                                        |

## 9. Mecanicas Innovadoras

### M1 — Sinergia Tribal

#### Descripcion

Las Personajes pertenecen a un arquetipo tribal (Cartoon Clasico, Aventura Magica, Anime Combate, Sobrenatural o Neutral). Cuando un jugador tiene 2 o mas Personajes del mismo arquetipo en el tablero
simultaneamente, se activa un bonus de sinergia que afecta a todas las Personajes de
ese arquetipo en el tablero aliado.

#### Reglas de Funcionamiento

1. El sistema comprueba la sinergia tribal al final de cada Fase Principal y al final
   de cada Fase de Combate.
2. El bonus de sinergia base es: +1 punto de Ataque a cada Personaje del arquetipo
   por cada Personaje aliada adicional del mismo arquetipo en el tablero.
   - Con 2 Personajes del mismo arquetipo: cada una recibe +1 ATQ.
   - Con 3 Personajes del mismo arquetipo: cada una recibe +2 ATQ.
   - Con N Personajes del mismo arquetipo: cada una recibe +(N-1) ATQ.
3. El bonus es dinamico: si una Personaje muere, el bonus se recalcula en el siguiente
   punto de comprobacion.
4. Algunas cartas tienen efectos adicionales de sinergia tribal especificados en su
   descripcion (ver tabla de cartas, columna Efecto).
5. Las Personajes con arquetipo Neutral NO participan en los calculos de sinergia tribal.

#### Interacciones con Otras Mecanicas

- La sinergia tribal interactua con las Zonas/Entornos: si una zona otorga un buff
  a un arquetipo concreto, ese buff se aplica adicionalmente al bonus tribal.
- La IA de nivel Medio evalua las sinergias tribales en su algoritmo de decision.

### M2 — Momentum (Comeback Mechanic)

#### Descripcion

Cuando un jugador cae por debajo del 50% de sus puntos de vida maximos (15 o menos
puntos de vida con el maximo base de 30), entra en estado de Momentum. Este estado
otorga ventajas acumulables que permiten al jugador en desventaja intentar remontar.

#### Reglas de Funcionamiento

1. **Activacion**: el estado de Momentum se activa automaticamente cuando los PV del
   jugador caen a 15 o menos al inicio de su turno.
2. **Generacion**: mientras el jugador esta en Momentum, recibe +1 punto de Momentum
   al inicio de cada uno de sus turnos.
3. **Indicador visual**: un contador de Momentum es visible permanentemente junto al
   heroe afectado.
4. **Usos del Momentum**:
   - **Como Nostalgia adicional**: el jugador puede declarar "uso X de Momentum como Nostalgia"
     antes de jugar una carta. El Momentum se consume y el Nostalgia disponible ese turno
     aumenta en X. El Momentum gastado como Nostalgia se pierde al final del turno si no
     se usa.
   - **Para cartas Furia**: ciertas cartas tienen el tipo especial "Furia" y solo pueden
     jugarse si el jugador gasta la cantidad de Momentum indicada en la carta. El coste
     en Nostalgia de estas cartas es 0 pero requieren Momentum.
5. **Desactivacion**: si el jugador recupera vida y supera los 15 PV, el contador de
   Momentum deja de incrementarse, pero el Momentum acumulado se conserva.
6. **Limite de Momentum**: maximo 10 puntos acumulados simultaneamente.

#### Notas de Diseno

- El Momentum NO garantiza la victoria al jugador en desventaja; solo ofrece recursos
  adicionales para intentar remontar.
- El jugador en ventaja debe decidir si prioriza eliminar al rival rapidamente o si
  puede permitirse el riesgo de que este acumule Momentum.

### M3 — Zonas y Entornos Dinamicos

#### Descripcion

El tablero se divide en 3 carriles o zonas: Izquierda, Centro y Derecha. Cada zona
tiene un entorno activo que puede cambiar a lo largo de la partida. Los entornos
otorgan buffs o debuffs a las Personajes que los ocupan mientras estan activos.

#### Reglas de Funcionamiento

1. **Zonas del tablero**: cada carril del tablero puede alojar hasta 2-3 Personajes
   por bando. [PENDIENTE DE VALIDACION: el limite exacto por carril esta sujeto a
   ajuste de balance durante la implementacion.]
2. **Cambio de entorno**: al inicio del turno 1, las 3 zonas tienen un entorno por
   defecto (Paisaje Neutro). Cada 3 turnos completos (un turno completo = un turno
   de cada jugador), una zona seleccionada aleatoriamente cambia de entorno.
3. **Entornos disponibles en MVP**:

| ID Entorno  | Nombre           | Buff/Debuff aplicado                                          |
|-------------|------------------|---------------------------------------------------------------|
| ENV-001     | Paisaje Neutro   | Sin modificadores                                             |
| ENV-002     | Bosque Magico    | +1 VID a todas las Personajes en esta zona                     |
| ENV-003     | Estadio Deportivo| +1 ATQ a todas las Personajes en esta zona                     |
| ENV-004     | Cocina Krusty    | Las Personajes en esta zona restauran 1 VID al heroe aliado al atacar |
| ENV-005     | Tierra de Ooo    | Las Personajes de arquetipo Aventura Magica en esta zona ganan Cargo este turno |
| ENV-006     | Parque Municipal | Las Personajes de arquetipo Cartoon Clasico en esta zona cuestan 1 Nostalgia menos |

4. **Permanencia**: los modificadores de un entorno se aplican mientras el entorno
   este activo. Al cambiar de entorno, los modificadores del anterior desaparecen.
5. **Animacion de transicion**: el cambio de entorno se acompana de una animacion
   de transicion de fondo.

### M4 — Misiones (Quests)

#### Descripcion

Las Misiones son un tipo especial de carta que el jugador coloca en una zona especial
del tablero (la Zona de Mision) por un coste de 0 Nostalgia al inicio de su turno. Una vez
colocada, la Mision muestra una condicion a cumplir. Al completarse la condicion,
la Mision se activa automaticamente y otorga una recompensa poderosa.

#### Reglas de Funcionamiento

1. **Colocacion**: solo se puede colocar una Mision activa a la vez. Si ya hay una
   Mision activa, no se puede colocar otra hasta que la primera se complete o se
   descarte voluntariamente.
2. **Coste**: 0 Nostalgia. Solo pueden colocarse al inicio de la Fase Principal.
3. **Condicion**: cada carta de Mision define un contador (ej: "Invoca 5 Personajes
   durante la partida"). El sistema incrementa el contador automaticamente.
4. **Completar la Mision**: al alcanzarse el contador objetivo, la Mision se marca
   como completada, se activa la recompensa y la carta se envia al cementerio.
5. **Visibilidad**: el progreso de la Mision es visible para ambos jugadores.

#### Misiones del MVP [PENDIENTE DE VALIDACION]

| ID      | Nombre              | Condicion                                      | Recompensa                                                    |
|---------|---------------------|------------------------------------------------|---------------------------------------------------------------|
| QST-001 | El Gran Desfile     | Invoca 5 Personajes durante la partida         | Invoca una Personaje token legendaria 5/5 sin coste           |
| QST-002 | Maquina de Guerra   | Inflige 15 puntos de dano con Personajes       | El heroe aliado gana +5 PV                                    |
| QST-003 | Superviviente       | Sobrevive 7 turnos completos                   | Roba 3 cartas y gana 3 puntos de Nostalgia extra este turno   |

### M5 — Aliado Invitado (Crossover)

#### Descripcion

Una vez por partida, el jugador puede activar la accion especial "Crossover". Al
activarla, roba 1 carta aleatoria del mazo visible del oponente y la anade a su
mano. Esta carta puede jugarse con su coste normal de Nostalgia.

#### Reglas de Funcionamiento

1. **Frecuencia**: exactamente una vez por partida por jugador. El boton/accion de
   Crossover se deshabilita permanentemente tras su uso.
2. **Momento de uso**: solo disponible durante la Fase Principal del jugador activo.
3. **Mecanismo**: se selecciona aleatoriamente 1 carta del mazo del oponente. Esa
   carta especifica se retira del mazo del oponente y se anade a la mano del jugador
   activo. El mazo del oponente se reduce en 1 carta.
4. **Visibilidad**: ambos jugadores ven que carta fue "robada" mediante una animacion.
5. **Propiedad**: la carta robada mantiene su tipo, arquetipo y estadisticas originales.
   Puede activar sinergias del arquetipo del dueno original si el nuevo dueno tiene
   Personajes del mismo arquetipo.
6. **Limite de mano**: si la mano del jugador activo tiene 10 cartas, la carta robada
   se destruye (se muestra una animacion de carta quemada).
7. **Interaccion con la IA**: la IA de nivel Medio usa Crossover si su vida esta por
   debajo del 40% y le quedan menos de 4 cartas en mano.

---

## 10. IA del Oponente

### 10.1 Principios Generales

La IA del oponente es un agente software que toma decisiones en nombre del segundo
jugador. No tiene acceso a informacion oculta (cartas en la mano del jugador humano
no reveladas). Toma sus decisiones al inicio de su turno y las ejecuta secuencialmente.

La IA implementa el patron de diseno Strategy: ambos niveles comparten la misma
interfaz de decision pero cada uno tiene su propio algoritmo de evaluacion.

### 10.2 Nivel Facil — Greedy

**Descripcion del comportamiento**: la IA actua de forma codiciosa, priorizando siempre
el maximo valor inmediato sin considerar el estado futuro del tablero.

**Algoritmo de decision (en prosa)**:

1. **Fase Principal**:
   a. Recorre la mano de mayor a menor coste de Nostalgia.
   b. Juega la primera carta que pueda pagar con el Nostalgia disponible.
   c. Repite hasta que no pueda jugar ninguna carta mas.
   d. No activa la habilidad de heroe de forma deliberada; la activa solo si
      no queda ninguna carta jugable y aun tiene Nostalgia.
   e. No usa Crossover de forma proactiva.
   f. No considera sinergias tribales.

2. **Fase de Combate**:
   a. Si puede atacar al heroe enemigo directamente (sin Personajes con Provocacion
      enemigas bloqueando), ataca al heroe con la Personaje de mayor ATQ.
   b. Si hay Personajes enemigas con Provocacion, ataca a la de menor VID.
   c. Si no puede atacar al heroe y no hay Personajes con Provocacion, ataca a la
      Personaje enemiga con menor VID para intentar destruirla.

### 10.3 Nivel Medio — Threat-aware

**Descripcion del comportamiento**: la IA evalua el estado del tablero, identifica
amenazas y responde a ellas de forma adaptativa. Usa recursos defensivos cuando
es necesario y aprovecha sinergias tribales.

**Algoritmo de decision (en prosa)**:

1. **Evaluacion de amenazas al inicio del turno**:
   - Una Personaje enemiga es considerada "amenaza" si tiene ATQ >= 4 o si tiene
     habilidades peligrosas (Veneno, Escudo Divino, Cargo).
   - Si hay 2 o mas amenazas en el tablero, prioriza eliminarlas sobre atacar al heroe.

2. **Fase Principal**:
   a. Si su vida es <= 40% (12 PV o menos), considera jugar hechizos defensivos
      (curacion, control) antes que Personajes.
   b. Evalua si tiene 2+ cartas del mismo arquetipo en mano: si es asi, prioriza
      jugarlas en el mismo turno para activar la sinergia tribal.
   c. Juega la combinacion de cartas que maximiza el valor del tablero, considerando:
      - Sinergia tribal activa.
      - Entorno/Zona activo que beneficie al arquetipo de sus Personajes.
   d. Activa la habilidad de heroe si quedan >= 2 Nostalgia y no hay cartas mas eficientes.
   e. Usa Crossover si su vida es <= 40% y tiene <= 3 cartas en mano.

3. **Fase de Combate**:
   a. Identifica Personajes enemigas con Provocacion y las elimina primero.
   b. Prioriza atacar Personajes enemigas que constituyen amenazas (ATQ >= 4).
   c. Usa ataques de Personajes pequenas para eliminar Personajes enemigas debilitadas
      ("valor trade"): una Personaje de 2/1 puede matar a una de 5/1.
   d. Solo ataca al heroe enemigo cuando no hay amenazas activas o cuando puede
      infligir suficiente dano para ganar la partida ese turno.

4. **Uso del Momentum** (cuando aplica):
   - Si acumula >= 3 de Momentum, lo gasta como Nostalgia adicional para jugar una
     carta que de otro modo no podria permitirse ese turno.

### 10.4 Consideraciones de Implementacion

- La IA debe tomar sus decisiones en <= 2 segundos de tiempo real para no interrumpir
  el ritmo de la partida.
- Las acciones de la IA se ejecutan con un retardo artificial de 0.5-1 segundo entre
  cada accion para que el jugador pueda seguir lo que ocurre.
- [PENDIENTE DE VALIDACION] En la fase de Pruebas se verificara que la IA de nivel
  Medio gana al menos el 40% de las partidas contra una IA de nivel Facil.

---

## 11. Easter Egg del Tablero

### 11.1 Descripcion

El tablero de juego incluye un easter egg interactivo oculto en el fondo animado.
En el tablero aparece un elemento aparentemente decorativo: una television retro
encendida que muestra estatica en la esquina inferior izquierda del fondo.

### 11.2 Mecanismo de Activacion

1. El jugador debe hacer clic en la television exactamente 10 veces durante una partida.
   Los clics no tienen que ser consecutivos; el contador persiste durante toda la partida.
2. Cada clic reproduce un sonido de "click" de boton antiguo y hace parpadear brevemente
   la pantalla de la television.
3. Al decimo clic, se activa la secuencia del easter egg.

### 11.3 Secuencia del Easter Egg

Al activarse:

1. La musica de fondo se detiene momentaneamente.
2. La television muestra durante 3 segundos una animacion de la cara de un personaje
   sorprendido (guino a los autores del proyecto o a un personaje secundario de alguna
   de las series referenciadas).
3. Aparece un mensaje en pantalla estilo "VHS" con el texto: "Has encontrado el canal
   secreto. Bienvenido al multiverso."
4. Durante los siguientes 2 turnos, todas las cartas del tablero de ambos jugadores
   obtienen visualmente un filtro de color sepia, como si estuvieran en una emision
   televisiva antigua. Este efecto es puramente estetico y no afecta al gameplay.
5. La musica vuelve a reproducirse normalmente.

### 11.4 Condicion de Ocultamiento

- El elemento de la television NO tiene tooltip ni indicacion visual de que es
  interactivo. El jugador debe descubrirlo por curiosidad.
- El contador de clics se resetea al terminar la partida.
- El easter egg solo puede activarse una vez por partida.

---

## 12. Requisitos Funcionales (RF)

### 12.1 Tabla de Requisitos Funcionales

| ID      | Descripcion                                                              | Actor              | Prioridad |
|---------|--------------------------------------------------------------------------|--------------------|-----------|
| RF-001  | El sistema permite al jugador iniciar una nueva partida desde el menu    | Jugador            | Must      |
| RF-002  | El sistema permite al jugador seleccionar uno de los 2 heroes disponibles| Jugador            | Must      |
| RF-003  | El sistema asigna automaticamente el heroe contrario a la IA             | Sistema            | Must      |
| RF-004  | El sistema baraja aleatoriamente el mazo de cada jugador al inicio       | Sistema            | Must      |
| RF-005  | El sistema reparte 4 cartas iniciales a cada jugador                     | Sistema            | Must      |
| RF-006  | El sistema determina aleatoriamente quien juega primero                  | Sistema            | Must      |
| RF-007  | El jugador que va primero no roba carta en su primer turno               | Sistema            | Must      |
| RF-008  | El sistema gestiona las fases del turno en orden: Robo, Principal, Combate, Fin | Sistema     | Must      |
| RF-009  | El sistema roba automaticamente 1 carta para el jugador activo al inicio de la Fase de Robo | Sistema | Must |
| RF-010  | Si el mazo esta vacio al intentar robar, el jugador recibe 1 danyo por carta no robada | Sistema | Must |
| RF-011  | El sistema incrementa el Nostalgia maximo del jugador activo en 1 al inicio de su turno (tope 10) | Sistema | Must |
| RF-012  | El sistema recarga el Nostalgia del jugador activo al maximo al inicio de su turno | Sistema       | Must      |
| RF-013  | El jugador puede jugar una carta de Personaje pagando su coste de Nostalgia    | Jugador            | Must      |
| RF-014  | El sistema coloca la Personaje jugada en el tablero del jugador           | Sistema            | Must      |
| RF-015  | El sistema marca la Personaje recien jugada como "exhausta" (no puede atacar ese turno) salvo que tenga Cargo | Sistema | Must |
| RF-016  | El jugador puede jugar una carta de Hechizo pagando su coste y seleccionando el objetivo | Jugador | Must |
| RF-017  | El sistema aplica el efecto del hechizo sobre el objetivo seleccionado   | Sistema            | Must      |
| RF-018  | El jugador puede jugar una carta de Objeto pagando su coste y seleccionando el objetivo | Jugador | Must |
| RF-019  | El sistema aplica los modificadores del objeto al objetivo seleccionado  | Sistema            | Must      |
| RF-020  | El sistema descuenta el coste de Nostalgia de la carta jugada del Nostalgia disponible | Sistema       | Must      |
| RF-021  | El jugador puede activar la habilidad del heroe si tiene el Nostalgia requerido | Jugador          | Must      |
| RF-022  | El sistema aplica el efecto de la habilidad del heroe y descuenta el Nostalgia | Sistema           | Must      |
| RF-023  | La habilidad de heroe solo puede activarse una vez por turno             | Sistema            | Must      |
| RF-024  | El jugador puede seleccionar una Personaje propia no exhausta para atacar | Jugador            | Must      |
| RF-025  | El sistema valida que si hay Personajes enemigas con Provocacion, solo se puede atacar a ellas | Sistema | Must |
| RF-026  | Al confirmar un ataque entre Personaje atacante y objetivo, el sistema aplica el dano mutuo | Sistema | Must |
| RF-027  | El sistema destruye y envia al cementerio toda Personaje con VID <= 0     | Sistema            | Must      |
| RF-028  | El sistema activa el efecto Ultimo Aliento de una Personaje al ser destruida | Sistema         | Must      |
| RF-029  | El sistema detecta cuando los PV de un heroe llegan a 0 y termina la partida | Sistema       | Must      |
| RF-030  | El sistema muestra la pantalla de victoria al jugador humano si gana     | Sistema            | Must      |
| RF-031  | El sistema muestra la pantalla de derrota al jugador humano si pierde    | Sistema            | Must      |
| RF-032  | El sistema calcula y aplica bonuses de Sinergia Tribal al final de cada fase | Sistema       | Must      |
| RF-033  | El sistema activa el estado de Momentum cuando el jugador activo tiene <= 15 PV | Sistema   | Must      |
| RF-034  | El sistema incrementa el contador de Momentum en 1 al inicio del turno si el jugador esta en Momentum | Sistema | Must |
| RF-035  | El jugador puede gastar Momentum como Nostalgia adicional durante la Fase Principal | Jugador     | Must      |
| RF-036  | El sistema cambia el entorno de una zona aleatoria cada 3 turnos completos | Sistema         | Must      |
| RF-037  | El sistema aplica los buffs/debuffs del entorno activo a las Personajes en esa zona | Sistema | Must |
| RF-038  | El jugador puede colocar una carta de Mision en la Zona de Mision por 0 Nostalgia al inicio de la Fase Principal | Jugador | Must |
| RF-039  | El sistema rastrea el progreso de la Mision activa e incrementa el contador cuando se cumple una accion relevante | Sistema | Must |
| RF-040  | El sistema activa la recompensa de la Mision al completarse la condicion | Sistema            | Must      |
| RF-041  | El jugador puede activar Crossover una vez por partida durante la Fase Principal | Jugador    | Must      |
| RF-042  | Al activar Crossover, el sistema selecciona 1 carta aleatoria del mazo enemigo y la anade a la mano del jugador | Sistema | Must |
| RF-043  | Si la mano del jugador esta llena (10 cartas) al activar Crossover, la carta se destruye | Sistema | Must |
| RF-044  | El sistema limita el tablero a un maximo de 7 Personajes por lado         | Sistema            | Must      |
| RF-045  | El sistema limita la mano a un maximo de 10 cartas; las cartas robadas en exceso se destruyen | Sistema | Must |
| RF-046  | El jugador puede terminar su turno voluntariamente en cualquier momento de la Fase Principal | Jugador | Must |
| RF-047  | El sistema muestra un tooltip con los detalles de una carta al pasar el cursor sobre ella | Sistema | Should |
| RF-048  | El sistema muestra un indicador visual del turno activo (jugador o IA)   | Sistema            | Should    |
| RF-049  | El sistema muestra el contador de cartas restantes en el mazo de cada jugador | Sistema      | Should    |
| RF-050  | El sistema muestra una animacion especial al jugar una carta de rareza Legendaria | Sistema  | Should    |

### 12.2 Detalle de Requisitos Clave

#### RF-013: Jugar una Carta de Personaje

| Campo         | Detalle                                                                       |
|---------------|-------------------------------------------------------------------------------|
| Actor         | Jugador humano                                                                |
| Precondicion  | Es la Fase Principal del turno del jugador. La Personaje esta en su mano. El jugador tiene Nostalgia >= coste de la Personaje. El tablero tiene < 7 Personajes del jugador. |
| Flujo         | 1. El jugador hace clic en la carta de Personaje en su mano. 2. La carta se muestra ampliada con confirmacion. 3. El jugador confirma. 4. El sistema descuenta el Nostalgia. 5. La carta se retira de la mano. 6. La Personaje aparece en el tablero del jugador. 7. Si tiene Grito de Guerra, se activa el efecto. 8. La Personaje queda marcada como exhausta. |
| Postcondicion | La Personaje esta en el tablero, el Nostalgia se ha reducido, la carta ya no esta en la mano. |

#### RF-029: Deteccion de Fin de Partida

| Campo         | Detalle                                                                       |
|---------------|-------------------------------------------------------------------------------|
| Actor         | Sistema                                                                       |
| Precondicion  | Una accion de juego ha causado dano a un heroe.                               |
| Flujo         | 1. El sistema comprueba los PV de ambos heroes tras cada accion de dano. 2. Si los PV de un heroe son <= 0, se activa la secuencia de fin de partida. 3. Se detiene el bucle de turnos. 4. Se muestra la animacion de victoria/derrota. 5. Se muestra la pantalla de resultado. |
| Flujo alternativo | Si ambos heroes llegan a 0 simultaneamente, se muestra la pantalla de empate. |
| Postcondicion | La partida ha terminado. El jugador puede volver al menu principal.            |

---

## 13. Requisitos No Funcionales (RNF)

| ID      | Categoria        | Descripcion                                                                | Criterio de verificacion                       |
|---------|------------------|----------------------------------------------------------------------------|------------------------------------------------|
| RNF-001 | Rendimiento      | El juego mantiene >= 60 FPS durante el transcurso de una partida completa  | Medicion con Chrome DevTools en hardware de referencia |
| RNF-002 | Rendimiento      | El tiempo de carga inicial (primer acceso) es < 5 segundos en conexion de banda ancha | Medicion con Lighthouse                |
| RNF-003 | Compatibilidad   | El juego funciona correctamente en Chrome >= 110, Firefox >= 110, Edge >= 110 | Pruebas manuales en los tres navegadores      |
| RNF-004 | Compatibilidad   | El juego no requiere plugins ni extensiones del navegador                  | Verificacion manual                            |
| RNF-005 | Usabilidad       | Cada carta muestra un tooltip con sus estadisticas y efecto al pasar el cursor | Inspeccion visual durante pruebas de usuario |
| RNF-006 | Usabilidad       | El estado del turno activo es visible en todo momento con un indicador claro | Inspeccion visual                            |
| RNF-007 | Usabilidad       | Las animaciones de transicion de turno duran entre 0.5 y 1.5 segundos     | Medicion de duracion de animacion              |
| RNF-008 | Usabilidad       | Las acciones invalidas (Nostalgia insuficiente, tablero lleno) muestran un mensaje de error claro | Prueba de cada caso invalido      |
| RNF-009 | Accesibilidad    | El contraste de texto sobre fondo cumple al menos WCAG 2.1 nivel AA (4.5:1) | Verificacion con herramienta de contraste     |
| RNF-010 | Accesibilidad    | El tamano de fuente minimo en la UI del juego es 12px                      | Inspeccion del CSS generado                    |
| RNF-011 | Internacionalizacion | Todos los textos de la interfaz (cartas, menus, mensajes) estan centralizados en archivos de idioma | Inspeccion del codigo fuente         |
| RNF-012 | Internacionalizacion | El idioma por defecto es Espanol (ES). No se requieren otros idiomas en el MVP | Verificacion del archivo de idioma          |
| RNF-013 | Modularidad      | La logica de dominio (reglas del juego, motor de turnos, calculo de dano) no tiene dependencias de Phaser | Verificacion de imports en `src/domain/` |
| RNF-014 | Modularidad      | Los tests de dominio ejecutan sin necesidad de instanciar Phaser           | Ejecucion de `npm run test` sin navegador       |
| RNF-015 | Testabilidad     | La cobertura de tests unitarios en `src/domain/` es >= 80%                | Reporte de `npm run test:coverage`              |
| RNF-016 | Testabilidad     | Cada test sigue la estructura AAA (Arrange, Act, Assert)                   | Revision de codigo en revision de pares        |
| RNF-017 | Persistencia     | [PENDIENTE DE VALIDACION] El juego puede guardar estadisticas de partida en localStorage si CH-02 se implementa | Verificacion de localStorage en navegador |
| RNF-018 | Mantenibilidad   | El codigo cumple con las reglas de ESLint definidas en `eslint.config.js` sin advertencias | Ejecucion de `npm run lint`          |
| RNF-019 | Mantenibilidad   | El codigo sigue las convenciones de nombrado definidas en AGENTS.md        | Revision de codigo                             |
| RNF-020 | Seguridad        | El juego no realiza peticiones de red a servicios externos durante la partida | Inspeccion de trafico de red con DevTools    |


---

## 14. Casos de Uso (CU)

### CU-01: Iniciar Partida Nueva

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Jugador humano |
| Precondicion      | El juego esta en la pantalla del Menu Principal |
| Flujo principal   | 1. El jugador hace clic en "Nueva Partida". 2. El sistema muestra la pantalla de Seleccion de Heroe. 3. El jugador selecciona un heroe. 4. El sistema confirma la seleccion y asigna el heroe contrario a la IA. 5. El sistema inicializa ambos mazos, los baraja y reparte 4 cartas a cada jugador. 6. El sistema determina aleatoriamente quien va primero. 7. El sistema muestra la pantalla de partida. 8. Si el jugador va primero, se inicia su turno sin robo inicial. Si va segundo, la IA juega primero. |
| Flujo alternativo | 3a. El jugador no selecciona heroe y hace clic en "Atras": vuelve al Menu Principal. |
| Postcondicion     | La partida esta en curso. El jugador activo esta en la Fase Principal de su primer turno. |

### CU-02: Jugar una Personaje

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Jugador humano |
| Precondicion      | Es la Fase Principal del turno del jugador. El jugador tiene en mano al menos una carta de Personaje. El jugador tiene Nostalgia suficiente para pagarla. El tablero del jugador tiene menos de 7 Personajes. |
| Flujo principal   | 1. El jugador hace clic en una carta de Personaje en su mano. 2. La carta se eleva visualmente y se muestra un dialogo de confirmacion con sus estadisticas. 3. El jugador confirma jugando la carta. 4. El sistema descuenta el Nostalgia. 5. La carta desaparece de la mano y la Personaje aparece en el tablero. 6. Si la Personaje tiene Grito de Guerra, se activa su efecto. 7. La Personaje queda marcada como exhausta (no puede atacar este turno) salvo que tenga Cargo. 8. El sistema recalcula las sinergias tribales. |
| Flujo alternativo | 2a. El jugador cancela la seleccion: la carta vuelve a la mano sin coste. 4a. El tablero ya tiene 7 Personajes: el sistema muestra un mensaje de error y cancela la accion. 4b. El jugador no tiene Nostalgia suficiente: el sistema muestra un mensaje de error. |
| Postcondicion     | La Personaje esta en el tablero del jugador. El Nostalgia disponible se ha reducido. La carta ya no esta en la mano. |

### CU-03: Lanzar un Hechizo

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Jugador humano |
| Precondicion      | Es la Fase Principal del turno del jugador. El jugador tiene en mano al menos un Hechizo. El jugador tiene Nostalgia suficiente. Existe al menos un objetivo valido segun el tipo del hechizo. |
| Flujo principal   | 1. El jugador hace clic en una carta de Hechizo en su mano. 2. Si el hechizo requiere objetivo, el cursor cambia a modo seleccion de objetivo. 3. El jugador hace clic en el objetivo valido (Personaje o heroe). 4. El sistema aplica el efecto del hechizo. 5. El sistema descuenta el Nostalgia. 6. La carta va al cementerio. |
| Flujo alternativo | 2a. El hechizo es de area (AoE): no requiere seleccion de objetivo; se aplica directamente al confirmar. 3a. El jugador hace clic en un objetivo invalido: el sistema muestra un mensaje de error y permite reseleccionar. 3b. El jugador presiona Escape o hace clic fuera: cancela la accion sin coste. |
| Postcondicion     | El efecto del hechizo se ha aplicado. El Nostalgia se ha reducido. La carta esta en el cementerio. |

### CU-04: Atacar con una Personaje

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Jugador humano |
| Precondicion      | Es la Fase de Combate del turno del jugador. El jugador tiene al menos una Personaje en el tablero que no este exhausta ni haya atacado este turno. |
| Flujo principal   | 1. El jugador hace clic en una Personaje propia no exhausta. 2. La Personaje se resalta y el cursor cambia a modo ataque. 3. Los objetivos validos se resaltan en el tablero enemigo. 4. El jugador hace clic en el objetivo (Personaje enemiga o heroe enemigo). 5. El sistema valida el ataque (comprueba Provocacion). 6. El sistema aplica el dano: la Personaje atacante recibe el ATQ del defensor y viceversa. 7. Si alguna Personaje llega a 0 VID, se destruye y se activa Ultimo Aliento si procede. 8. La Personaje atacante queda marcada como "ya ataco este turno". |
| Flujo alternativo | 3a. El rival tiene Personajes con Provocacion: solo esas Personajes se resaltan como objetivo valido. 4a. El jugador hace clic en un objetivo invalido: el sistema muestra un mensaje. 7a. El heroe enemigo llega a 0 PV: se activa la secuencia de fin de partida (CU-08). |
| Postcondicion     | El ataque se ha resuelto. Las Personajes han recibido dano. Las destruidas estan en el cementerio. |

### CU-05: Activar Habilidad de Heroe

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Jugador humano |
| Precondicion      | Es la Fase Principal del turno del jugador. El jugador tiene Nostalgia suficiente para el coste de la habilidad. La habilidad no ha sido usada este turno. |
| Flujo principal   | 1. El jugador hace clic en el boton de habilidad de heroe. 2. Si la habilidad requiere objetivo, el cursor cambia a modo seleccion. 3. El jugador selecciona el objetivo (si procede). 4. El sistema aplica el efecto de la habilidad. 5. El sistema descuenta el Nostalgia. 6. El boton de habilidad se desactiva hasta el siguiente turno. |
| Flujo alternativo | 1a. El jugador no tiene Nostalgia suficiente: el boton esta deshabilitado y muestra el coste requerido. 1b. La habilidad ya fue usada este turno: el boton esta deshabilitado. |
| Postcondicion     | El efecto de la habilidad se ha aplicado. El Nostalgia se ha reducido. La habilidad no puede usarse de nuevo este turno. |

### CU-06: Activar Mecanica Crossover

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Jugador humano |
| Precondicion      | Es la Fase Principal del turno del jugador. El jugador no ha usado Crossover en esta partida. El mazo del oponente tiene al menos 1 carta. |
| Flujo principal   | 1. El jugador hace clic en el boton "Crossover". 2. El sistema muestra un dialogo de confirmacion advirtiendo que es un uso unico. 3. El jugador confirma. 4. El sistema selecciona aleatoriamente 1 carta del mazo del oponente. 5. Se muestra una animacion de "robo" de carta. 6. La carta se anade a la mano del jugador. 7. El boton Crossover se desactiva permanentemente para esta partida. |
| Flujo alternativo | 3a. El jugador cancela: vuelve a la Fase Principal sin cambios. 6a. La mano del jugador tiene 10 cartas: la carta se destruye con animacion de quema y se muestra un mensaje. 6b. El mazo del oponente esta vacio: el sistema muestra un mensaje de error y cancela la accion sin desactivar el boton. |
| Postcondicion     | El jugador tiene una carta adicional en su mano (o esta fue destruida). El boton Crossover esta desactivado. |

### CU-07: Completar una Mision

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Sistema (automatico) |
| Precondicion      | El jugador tiene una Mision activa en la Zona de Mision. Se ha realizado una accion que cumple parcial o totalmente la condicion de la Mision. |
| Flujo principal   | 1. El jugador realiza una accion que avanza el contador de la Mision (ej: invoca una Personaje del arquetipo indicado). 2. El sistema incrementa el contador visible de la Mision. 3. Si el contador alcanza el objetivo: a. Se muestra una animacion de "Mision Completada". b. Se activa la recompensa automaticamente. c. La carta de Mision se envia al cementerio. d. La Zona de Mision queda libre. |
| Flujo alternativo | 2a. El contador no ha alcanzado el objetivo: el juego continua normalmente. |
| Postcondicion     | La Mision ha sido completada. La recompensa ha sido aplicada. La Zona de Mision esta libre para una nueva Mision. |

### CU-08: Terminar Partida

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Sistema |
| Precondicion      | Los PV de al menos un heroe han llegado a 0 o menos. |
| Flujo principal   | 1. El sistema detecta que los PV de un heroe son <= 0 al resolver una accion. 2. El sistema detiene el bucle de turnos inmediatamente. 3. Se reproduce la animacion de victoria o derrota segun corresponda. 4. La pantalla de resultado muestra: resultado (Victoria/Derrota/Empate), estadisticas basicas de la partida, boton "Volver al Menu". 5. El jugador hace clic en "Volver al Menu" y el sistema carga la pantalla del Menu Principal. |
| Flujo alternativo | 1a. Ambos heroes llegan a 0 PV en la misma accion: se muestra la pantalla de Empate. 4a. El jugador hace clic en "Volver al Menu" antes de que terminen las animaciones: las animaciones se omiten y se carga el menu. |
| Postcondicion     | La partida ha terminado. Todos los recursos de la partida han sido liberados. El sistema esta en el Menu Principal. |

---

## 15. Criterios de Aceptacion

### M1 — Sinergia Tribal

**CA-M1-01**
- Dado que el jugador tiene 2 Personajes del arquetipo Cartoon Clasico en el tablero
- Cuando termina la Fase Principal
- Entonces cada Personaje Cartoon Clasico tiene +1 punto de ATQ respecto a su valor base

**CA-M1-02**
- Dado que el jugador tiene 3 Personajes del arquetipo Anime Combate en el tablero
- Cuando se destruye una de ellas durante la Fase de Combate
- Entonces las 2 Personajes Anime Combate restantes pasan a tener +1 ATQ (no +2) al inicio del siguiente punto de comprobacion

**CA-M1-03**
- Dado que el jugador tiene una Personaje Neutral y una Personaje Sobrenatural en el tablero
- Cuando termina la Fase Principal
- Entonces ninguna de las dos recibe bonus tribal (la Personaje Neutral no cuenta para el calculo)

### M2 — Momentum

**CA-M2-01**
- Dado que el jugador tiene 20 PV (por encima de 15) al inicio de su turno
- Cuando se calcula el estado de Momentum
- Entonces el jugador NO gana puntos de Momentum ese turno

**CA-M2-02**
- Dado que el jugador tiene 14 PV al inicio de su turno (en estado Momentum)
- Cuando comienza la Fase Principal
- Entonces el contador de Momentum del jugador ha incrementado en 1 y el indicador visual esta activo

**CA-M2-03**
- Dado que el jugador tiene 3 puntos de Momentum acumulados y 2 puntos de Nostalgia disponibles
- Cuando el jugador declara gastar 2 de Momentum como Nostalgia adicional antes de jugar una carta de 4 de Nostalgia
- Entonces el jugador puede jugar la carta (tiene 2+2=4 Nostalgia efectivo) y su contador de Momentum baja a 1

### M3 — Zonas y Entornos Dinamicos

**CA-M3-01**
- Dado que han transcurrido 3 turnos completos desde el ultimo cambio de entorno
- Cuando el sistema procesa el fin del tercer turno completo
- Entonces exactamente una zona cambia de entorno y se muestra la animacion de transicion

**CA-M3-02**
- Dado que la zona Centro tiene activo el entorno "Estadio Deportivo" (+1 ATQ)
- Cuando una Personaje con 3 ATQ base entra en esa zona
- Entonces la Personaje tiene efectivamente 4 ATQ mientras permanece en esa zona

**CA-M3-03**
- Dado que la zona Izquierda cambia de "Bosque Magico" a "Paisaje Neutro"
- Cuando se resuelve el cambio de entorno
- Entonces las Personajes en esa zona pierden el +1 VID otorgado por el Bosque Magico y sus PV actuales se recalculan

### M4 — Misiones (Quests)

**CA-M4-01**
- Dado que el jugador no tiene ninguna Mision activa
- Cuando el jugador coloca una carta de Mision en la Zona de Mision durante la Fase Principal
- Entonces la carta se coloca por 0 Nostalgia, el Nostalgia disponible del jugador no cambia, y el contador de la Mision muestra 0/X

**CA-M4-02**
- Dado que la Mision activa "El Gran Desfile" requiere invocar 5 Personajes y el contador esta en 4/5
- Cuando el jugador juega una Personaje desde la mano
- Entonces el contador pasa a 5/5, se activa la animacion de completado, se aplica la recompensa (Personaje token 5/5) y la carta de Mision va al cementerio

**CA-M4-03**
- Dado que el jugador ya tiene una Mision activa en la Zona de Mision
- Cuando el jugador intenta colocar una segunda carta de Mision
- Entonces el sistema rechaza la accion y muestra un mensaje indicando que ya hay una Mision activa

### M5 — Aliado Invitado (Crossover)

**CA-M5-01**
- Dado que el jugador no ha usado Crossover en la partida actual y el mazo del oponente tiene cartas
- Cuando el jugador activa Crossover durante la Fase Principal
- Entonces 1 carta aleatoria del mazo del oponente se anade a la mano del jugador y el mazo del oponente tiene 1 carta menos

**CA-M5-02**
- Dado que el jugador ha activado Crossover una vez en la partida actual
- Cuando el jugador intenta activar Crossover de nuevo
- Entonces el boton de Crossover esta deshabilitado y el sistema no permite la accion

**CA-M5-03**
- Dado que el jugador activa Crossover y su mano tiene exactamente 10 cartas
- Cuando el sistema intenta anadir la carta robada a la mano del jugador
- Entonces la carta se destruye con animacion visual, se muestra un mensaje de "mano llena" y el boton Crossover queda desactivado igualmente

---

## 16. Arquitectura de Referencia

### 16.1 Vision General

El proyecto sigue una arquitectura en capas estricta. La separacion entre capas garantiza
que la logica de negocio del juego sea independiente de Phaser, testeable con Vitest sin
navegador, y facilmente sustituible en sus partes de presentacion o infraestructura.

```
+--------------------------------------------------+
|           Capa de Presentacion                   |
|  (Phaser 4: Escenas, Sprites, UI, Animaciones)   |
+--------------------------------------------------+
           |  llama a  |
           v           v
+--------------------------------------------------+
|          Capa de Aplicacion                      |
|  (Casos de uso, Comandos, Servicios de          |
|   orquestacion, Event Bus)                       |
+--------------------------------------------------+
           |  usa      |
           v           v
+--------------------------------------------------+
|          Capa de Dominio                         |
|  (Entidades: Card, Creature, Hero, Board, Turn   |
|   Valor-objetos, Reglas de negocio puras,        |
|   Interfaces de repositorio)                     |
+--------------------------------------------------+
           |  implementada por
           v
+--------------------------------------------------+
|          Capa de Infraestructura                 |
|  (Repositorios JSON de cartas, LocalStorage,     |
|   Adaptadores externos)                          |
+--------------------------------------------------+
```

### 16.2 Descripcion de Capas

#### Capa de Dominio (`src/domain/`)

Contiene la logica pura del juego. Sin dependencias de Phaser ni de ninguna libreria
externa. Todo lo de esta capa es testeable con Vitest puro.

Responsabilidades principales:
- Entidades del juego: `Card`, `CreatureCard`, `SpellCard`, `ObjectCard`, `Hero`, `Board`, `GameState`.
- Motor de turnos: `TurnEngine` (implementa el patron State para las fases).
- Motor de combate: `CombatEngine`.
- Calculadora de sinergias: `TribalSynergyCalculator`.
- Motor de Momentum: `MomentumEngine`.
- Motor de zonas: `ZoneEngine`.
- Motor de misiones: `QuestEngine`.
- Interfaces de repositorio: `ICardRepository`, `IDeckRepository`.

Patrones de diseno aplicados en esta capa:
- State: fases del turno (DrawPhase, MainPhase, CombatPhase, EndPhase).
- Command: acciones del jugador (PlayCardCommand, AttackCommand, HeroAbilityCommand).
- Factory: instanciacion de cartas desde JSON (`CardFactory`).
- Observer: event bus interno para notificar cambios de estado.

#### Capa de Aplicacion (`src/application/`)

Orquesta los casos de uso coordinando dominio e infraestructura. No contiene logica
de negocio propia; delega en el dominio.

Responsabilidades principales:
- `GameService`: coordina el inicio de partida, cambio de turno y fin de partida.
- `AIService`: expone la interfaz Strategy para los dos niveles de IA.
- `CrossoverService`: gestiona la logica de la mecanica M5.
- Event Bus: publica eventos de dominio para que la presentacion los consuma.

#### Capa de Infraestructura (`src/infrastructure/`)

Adaptadores de datos y persistencia.

Responsabilidades principales:
- `JsonCardRepository`: lee las definiciones de cartas desde archivos JSON en `assets/data/`.
- `LocalStorageAdapter`: lee y escribe estadisticas opcionales en localStorage.

#### Capa de Presentacion (`src/presentation/`)

Escenas de Phaser 4 y componentes visuales. Solo conoce la capa de aplicacion
(nunca llama directamente al dominio).

Escenas principales:
- `MainMenuScene`: menu principal con boton de nueva partida.
- `HeroSelectScene`: seleccion de heroe con preview de mazo.
- `GameScene`: tablero de juego completo.
- `ResultScene`: pantalla de victoria, derrota o empate.

### 16.3 Flujo de Datos (Ejemplo: Jugar una Carta)

```
[Usuario hace clic en carta] (Presentacion)
    -> GameScene emite evento "card-clicked"
    -> GameService.playCard(cardId) (Aplicacion)
    -> PlayCardCommand.execute() (Dominio)
    -> TurnEngine.validatePlay() + Board.addCreature() (Dominio)
    -> TribalSynergyCalculator.recalculate() (Dominio)
    -> Event Bus publica "card-played" + "synergy-updated"
    -> GameScene recibe eventos y actualiza visualmente el tablero (Presentacion)
```

---

## 17. Riesgos Identificados

| ID    | Descripcion                                               | Probabilidad | Impacto | Plan de Mitigacion |
|-------|-----------------------------------------------------------|--------------|---------|--------------------|
| R-001 | Complejidad de las 5 mecanicas innovadoras supera el tiempo disponible | Alta | Alto | Implementar mecanicas en orden de prioridad. M1 y M2 primero; M4 y M5 pueden simplificarse si hay retraso. |
| R-002 | Los modelos locales (Qwen) generan codigo de baja calidad que requiere muchas iteraciones de correccion | Media | Medio | Reservar las tareas complejas para Antigravity. Usar opencode solo para boilerplate y tests simples. |
| R-003 | Balance de juego deficiente: la IA Medio es demasiado facil o demasiado dificil | Media | Medio | Dedicar al menos 1 dia de pruebas de balance. Parametrizar los umbrales de decision de la IA en constantes ajustables. |
| R-004 | Rendimiento inferior a 60 FPS por exceso de animaciones o calculos por turno | Baja | Alto | Perfilar con Chrome DevTools desde el primer prototipo jugable. Limitar animaciones simultaneas. |
| R-005 | Deuda tecnica por presion de tiempo lleva a violar la arquitectura en capas | Alta | Alto | Revisiones de arquitectura al final de cada dia de implementacion. AGENTS.md como guarda de arquitectura para la IA. |
| R-006 | Assets graficos (sprites de cartas) no disponibles a tiempo bloquean la UI | Media | Medio | Usar placeholders de color solido con texto desde el primer dia. Los assets reales se integran al final. |
| R-007 | Conflictos de integracion entre las contribuciones de ambos miembros del equipo | Baja | Medio | Ramas de git por funcionalidad. Pull Requests obligatorios. Merge diario a main. |
| R-008 | La mecanica de Zonas dinamicas (M3) introduce bugs de estado dificiles de detectar | Media | Alto | Tests unitarios exhaustivos de ZoneEngine antes de integrarlo con la presentacion. |

---

## 18. Glosario

| Termino            | Definicion |
|--------------------|------------|
| Arquetipo          | Clasificacion tribal de una carta (Cartoon Clasico, Aventura Magica, Anime Combate, Sobrenatural, Neutral). Determina la compatibilidad para sinergias tribales. |
| ATQ                | Abreviatura de Ataque. Valor numerico que indica el dano que una Personaje inflige al atacar. |
| Battlecry          | Habilidad especial de Personaje que se activa en el momento de ser jugada desde la mano. |
| Cargo (Charge)     | Habilidad especial de Personaje que le permite atacar el mismo turno en que es jugada. |
| Cementerio         | Zona fuera del tablero donde van las cartas destruidas o hechizos usados. No interactiva en el MVP. |
| Crossover          | Mecanica M5. Accion unica por partida que permite robar una carta aleatoria del mazo del oponente. |
| Deathrattle        | Ver Ultimo Aliento. |
| Escudo Divino      | Habilidad especial de Personaje. Ignora la primera fuente de dano que recibe. |
| Exhausta           | Estado de una Personaje recien jugada que le impide atacar ese turno (salvo que tenga Cargo). |
| Fase de Combate    | Tercera fase del turno. Las Personajes del jugador activo pueden atacar. |
| Fase de Robo       | Primera fase del turno. El jugador activo roba 1 carta de su mazo. |
| Fase Principal     | Segunda fase del turno. El jugador activo puede jugar cartas, activar habilidades y acciones especiales. |
| Fin de Turno       | Cuarta y ultima fase del turno. Se resuelven efectos de fin de turno y el control pasa al otro jugador. |
| Grito de Guerra    | Ver Battlecry. |
| Heroe              | El avatar del jugador. Tiene PV, una habilidad activable y un mazo asociado. |
| IA Greedy          | Nivel de dificultad Facil. La IA elige siempre la carta de mayor coste que puede jugar. |
| IA Threat-aware    | Nivel de dificultad Medio. La IA evalua amenazas y responde con decisiones mas complejas. |
| Nostalgia          | Recurso principal del juego, representado por un reloj de bolsillo victoriano en la UI. Se gasta para jugar cartas. Se recarga cada turno y su maximo aumenta en 1 por turno hasta 10. |
| Mazo               | Coleccion de 30 cartas de un jugador. Se baraja al inicio de la partida. |
| Mision (Quest)     | Carta especial de coste 0 que otorga una recompensa al cumplir una condicion. Mecanica M4. |
| Momentum           | Recurso especial que se acumula cuando el jugador tiene <= 15 PV. Puede usarse como Nostalgia adicional. Mecanica M2. |
| MVP                | Minimum Viable Product. Version minima jugable que incluye todas las funcionalidades Must-Have. |
| PV                 | Puntos de Vida. Valor numerico de la salud de un heroe o una Personaje. |
| Provocacion (Taunt)| Habilidad especial de Personaje. Obliga al rival a atacarla antes que a otras Personajes o al heroe. |
| Rareza             | Clasificacion de una carta: Comun, Rara, Epica o Legendaria. Indica su poder y frecuencia de aparicion. |
| Sinergia Tribal    | Bonus que se activa al tener 2 o mas Personajes del mismo arquetipo en el tablero. Mecanica M1. |
| Tablero            | Zona de juego donde se colocan las Personajes. Maximo 7 Personajes por lado en el MVP. |
| Ultimo Aliento     | Habilidad especial de Personaje. Activa un efecto cuando la Personaje es destruida. |
| VID                | Abreviatura de Vida. Valor de salud de una Personaje. |
| Vision (Stealth)   | Habilidad especial. La Personaje no puede ser objetivo de ataques ni hechizos hasta que ella misma ataque. |

| Anime Combate      | Arquetipo tribal que agrupa Personajes de series de anime con poderes de combate (Goku, Diamantino). |
| Aventura Magica    | Arquetipo tribal que agrupa Personajes de universos fantasticos y misticos (Jake, Marceline, El Lich). |
| Axel Blaze         | Heroe HERO-002. Luchador ofensivo de Inazuma Eleven. Habilidad: Tornado de Fuego (+2 ATQ a aliada). |
| Cartoon Clasico    | Arquetipo tribal que agrupa Personajes comicos y cotidianos de cartoons occidentales. |
| El Lich            | Heroe HERO-001. Nigromante de Hora de Aventuras. Habilidad: Hechizo Ancestral (2 dano a objetivo). |
| Escudo Cristalino  | Habilidad especial de Diamantino. La primera vez que recibe dano, lo reduce a la mitad. |
| Nostalgia          | Recurso principal del juego, representado visualmente por un reloj de bolsillo victoriano. Identico al Mana de Hearthstone: empieza en 1, sube +1 por turno hasta 10, se regenera al inicio de cada turno propio. |
| Personaje          | Tipo de carta que representa a un personaje animado. Se coloca en el tablero y puede atacar. Equivalente a "Criatura" en otros juegos de cartas. |
| Sobrenatural       | Arquetipo tribal que agrupa Personajes de universos de horror comico y fenomenos paranormales (Agallas, Fantasma Chocala). |


---

## 19. Apendice: Registro de Interacciones IA

Este PRD fue generado en su totalidad mediante interaccion agéntica con Google Antigravity
(modelo Claude Sonnet) durante la Fase de Analisis de Requisitos del proyecto.

La interaccion queda registrada en el archivo `docs/ai-log.md` segun el formato
definido en AGENTS.md.

### Datos de la Interaccion

| Campo                   | Valor |
|-------------------------|-------|
| Fecha                   | 2026-05-19 |
| Herramienta             | Google Antigravity |
| Modelo                  | Claude Sonnet (via Antigravity) |
| Fase del proyecto       | Analisis de Requisitos (Dia 2) |
| Prompt de entrada       | `prompts/agents/prd-agent.md` |
| Entregable generado     | `docs/01-prd.md` |
| Iteraciones             | 2 (plan aprobado + generacion completa en partes) |

### Decisiones Tomadas Durante la Generacion

1. **Nombre del juego**: se propone "Crossover Cards" como nombre de trabajo. Pendiente
   de validacion por el equipo.
2. **Tabla de cartas**: se diseno un set de 20 cartas (10 por mazo) con distribucion
   equilibrada de tipos (6 Personajes, 2 hechizos, 2 objetos por mazo) y rareza.
3. **Arquitectura de referencia**: se incluyo la seccion 16 por decision del agente,
   al considerarse esencial para el proyecto academico aunque no estaba en el prompt
   original. Se alerto al usuario de esta adicion.
4. **Items [PENDIENTE DE VALIDACION]**: se marcaron 7 puntos que requieren decision
   del equipo antes de la fase de Diseno.

### Supuestos Adoptados [PENDIENTE DE VALIDACION]

- Nombres canonicos de heroes: "El Lich" y "Axel Blaze" (confirmados en v1.1.0).
- Distribucion de cartas por mazo: 6 Personajes + 2 hechizos + 2 objetos por carta unica (confirmado en v1.1.0).
- Limite por carril en zonas dinamicas: pendiente de ajuste de balance.
- Opcion de rendicion voluntaria: incluida como pendiente.
- IA Medio gana >= 40% contra IA Facil: umbral propuesto, pendiente de verificacion empirica.
- Las cartas Epicas tienen limite de 2 copias por mazo (alineado con convencion de Hearthstone).

---

*Fin del documento. Version 1.0.0 — 2026-05-19*
*Version 1.1.0 — 2026-05-19: refactorizacion de heroes, cartas, arquetipos, recurso Nostalgia y easter egg segun revision del Game Designer (prompt prd-refactor-agent.md).*







