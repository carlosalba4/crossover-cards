# Product Requirements Document (PRD)
## Juego de Cartas Estratégico por Turnos — Crossover Animado

---

| Campo            | Valor                                      |
|------------------|--------------------------------------------|
| Titulo           | Crossover Cards: El Juego de Cartas Definitivo |
| Version          | 1.0.0                                      |
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
| MH-05  | Sistema de mana creciente (1 a 10, +1 por turno)      |
| MH-06  | Tablero con limite de 7 criaturas por lado             |
| MH-07  | Mano maxima de 10 cartas, mazo de 30 cartas            |
| MH-08  | Tipos de carta: Criatura, Hechizo, Objeto              |
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
| CH-01  | Animacion de entrada de criaturas al tablero                     |
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
    |         - El jugador activo recibe su mana del turno (+1, max 10)
    |         - Puede jugar cartas (Criaturas, Hechizos, Objetos) pagando su coste
    |         - Puede activar la habilidad de heroe (si tiene mana)
    |         - Puede activar Crossover (una vez por partida)
    |         - Puede colocar cartas de Mision (coste 0)
    |         - Puede gastar Momentum como mana adicional
    |
    +---> FASE 3: COMBATE
    |         - Las criaturas del jugador activo pueden atacar
    |         - Cada criatura puede atacar una vez por turno
    |         - Se puede atacar a criaturas enemigas o al heroe rival
    |         - Si el rival tiene criaturas con Provocacion, es obligatorio atacarlas primero
    |
    +---> FASE 4: FIN DE TURNO
              - Se resuelven efectos de "fin de turno"
              - Se comprueban condiciones de Mision
              - Se verifican sinergias tribales activas
              - Se actualiza el estado de Zonas/Entornos
              - El turno pasa al otro jugador
```

### 6.3 Sistema de Mana

- Cada jugador comienza el turno 1 con 1 punto de mana (maximo 1).
- Cada turno, el maximo de mana aumenta en 1 hasta un tope de 10.
- Al inicio de cada turno del jugador, su mana se recarga al maximo actual.
- El mana no utilizado NO se acumula entre turnos.
- El Momentum (ver Mecanica M2) puede actuar como mana adicional en el mismo turno.

### 6.4 Sistema de Combate

- Una criatura recien jugada NO puede atacar en el mismo turno, salvo que tenga
  la habilidad "Cargo" (charge).
- Al atacar, ambas criaturas se infligen dano mutuamente igual a su valor de Ataque.
- Una criatura con 0 o menos puntos de Vida es destruida y enviada al cementerio.
- El heroe no puede atacar directamente; solo recibe dano de criaturas y hechizos.
- Una criatura solo puede realizar una accion de ataque por turno.

### 6.5 Fin de Partida

La partida termina cuando:

a) Los puntos de vida de un heroe llegan a 0 o menos → ese jugador pierde.
b) Ambos heroes llegan a 0 en el mismo momento → empate (se muestra pantalla especial).
c) [PENDIENTE DE VALIDACION] Opcion de rendicion voluntaria por parte del jugador humano.

### 6.6 Habilidades Especiales de Criaturas

| Habilidad       | Nombre tecnico  | Descripcion                                                     |
|-----------------|-----------------|-----------------------------------------------------------------|
| Provocacion     | Taunt           | Los rivales deben atacar esta criatura antes que a otras        |
| Cargo           | Charge          | Puede atacar el mismo turno que es jugada                       |
| Escudo Divino   | Divine Shield   | Ignora el primer punto de dano que recibe                       |
| Ultimo Aliento  | Deathrattle     | Activa un efecto al ser destruida                               |
| Grito de Guerra | Battlecry       | Activa un efecto al ser jugada desde la mano                    |
| Vision          | Stealth         | No puede ser objetivo de ataques ni hechizos hasta que ataque   |
| Veneno          | Poisonous       | Destruye cualquier criatura a la que danya, independientemente de su vida |
| Silencio        | Silence (efecto)| Elimina todas las habilidades especiales de la criatura objetivo |

---

## 7. Sistema de Cartas

### 7.1 Atributos Comunes a Todas las Cartas

| Atributo        | Tipo      | Descripcion                                                   |
|-----------------|-----------|---------------------------------------------------------------|
| id              | string    | Identificador unico. Formato: `ARCH-NUM` (ej: `FLO-001`)     |
| name            | string    | Nombre de la carta                                            |
| type            | enum      | Criatura / Hechizo / Objeto                                   |
| archetype       | enum      | Floja / Aventura / Submarino / Deportiva / Neutral            |
| manaCost        | integer   | Coste en puntos de mana para jugarla (0-10)                   |
| rarity          | enum      | Comun / Rara / Epica / Legendaria                             |
| description     | string    | Descripcion del efecto de la carta                            |
| spriteKey       | string    | Clave del asset grafico en Phaser                             |
| greetingText    | string    | Texto que el personaje dice al ser jugado                     |

### 7.2 Atributos Adicionales por Tipo

#### Criaturas

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

El MVP incluye 20 cartas distintas: 10 del mazo de El Flojo (arquetipo Floja) y 10 del
mazo de El Aventurero (arquetipo Aventura). Cada mazo tiene 30 cartas en total, por lo
que se permite incluir 2-3 copias de las cartas Comunes y Raras.

#### Mazo de El Flojo (Arquetipo Floja)

| ID      | Nombre                  | Tipo     | Mana | Rareza    | ATQ | VID | Habilidades / Efecto                                              |
|---------|-------------------------|----------|------|-----------|-----|-----|-------------------------------------------------------------------|
| FLO-001 | Mordecai el Pajaro      | Criatura | 3    | Comun     | 3   | 3   | Grito de Guerra: Roba 1 carta                                     |
| FLO-002 | Rigby el Mapache        | Criatura | 2    | Comun     | 2   | 2   | Cargo. Al atacar, descarta 1 carta aleatoria del rival            |
| FLO-003 | Benson Furioso          | Criatura | 4    | Rara      | 4   | 4   | Provocacion. Sinergia Floja: +2 ATQ por cada aliada Floja         |
| FLO-004 | Skips el Sabio          | Criatura | 5    | Epica     | 3   | 6   | Al inicio de tu turno, restaura 2 vida al heroe aliado            |
| FLO-005 | Pops el Gentil          | Criatura | 2    | Comun     | 1   | 3   | Escudo Divino. Al morir, otorga +1/+1 a una criatura aliada aleatoria |
| FLO-006 | El Raton de las Nieves  | Criatura | 6    | Legendaria| 5   | 5   | Ultimo Aliento: Invoca dos ratas 1/1 con Cargo                    |
| FLO-007 | Dia de Flojera          | Hechizo  | 2    | Comun     | --  | --  | Roba 2 cartas. Descarta 1 carta aleatoria de tu mano              |
| FLO-008 | Control Remoto Magico   | Hechizo  | 3    | Rara      | --  | --  | Toma el control de una criatura enemiga con 3 o menos ATQ hasta el fin del turno |
| FLO-009 | Bebida Energetica       | Objeto   | 1    | Comun     | --  | --  | Equipa a una criatura aliada: +2 ATQ y gana Cargo este turno      |
| FLO-010 | Sillon Reclinable       | Objeto   | 3    | Rara      | --  | --  | Equipa al heroe: al inicio de cada turno, recupera 1 punto de vida. Durabilidad 4 |

#### Mazo de El Aventurero (Arquetipo Aventura)

| ID      | Nombre                  | Tipo     | Mana | Rareza    | ATQ | VID | Habilidades / Efecto                                              |
|---------|-------------------------|----------|------|-----------|-----|-----|-------------------------------------------------------------------|
| AVE-001 | Finn el Humano          | Criatura | 3    | Comun     | 3   | 4   | Grito de Guerra: Si tienes otra criatura Aventura, gana +2 ATQ   |
| AVE-002 | Jake el Perro           | Criatura | 4    | Rara      | 2   | 6   | Puede dividir su ATQ entre todos los enemigos (AoE dividido)      |
| AVE-003 | La Princesa Jelly       | Criatura | 2    | Comun     | 2   | 2   | Battlecry: Aplica Silencio a una criatura enemiga con 2 o menos VID |
| AVE-004 | El Rey Hielo            | Criatura | 5    | Epica     | 3   | 5   | Al inicio del turno rival, congela una criatura enemiga aleatoria (no puede atacar 1 turno) |
| AVE-005 | BMO                     | Criatura | 1    | Comun     | 1   | 2   | Ultimo Aliento: Roba 1 carta                                      |
| AVE-006 | Marceline la Vampira    | Criatura | 6    | Legendaria| 6   | 5   | Veneno. Vision. Al atacar a un heroe, recupera 2 vida al heroe aliado |
| AVE-007 | Patada de Aventura      | Hechizo  | 2    | Comun     | --  | --  | Inflige 3 de dano a una criatura enemiga                          |
| AVE-008 | Pergamino del Conocimiento | Hechizo | 4   | Rara      | --  | --  | Roba 3 cartas. Cuesta 1 menos por cada criatura Aventura en el tablero |
| AVE-009 | Mochila Multifuncion    | Objeto   | 2    | Comun     | --  | --  | Equipa a una criatura aliada: +1/+1 y gana Provocacion            |
| AVE-010 | Espada de la Victoria   | Objeto   | 3    | Epica     | --  | --  | Equipa al heroe: gana un uso de habilidad adicional este turno. Durabilidad 2 |

### 7.5 Reglas de Construccion de Mazo

- Cada mazo contiene exactamente 30 cartas.
- Cartas Comunes y Raras: maximo 2 copias por carta.
- Cartas Epicas: maximo 2 copias por carta.
- Cartas Legendarias: maximo 1 copia por carta.
- [PENDIENTE DE VALIDACION] El editor de mazos es una funcionalidad Could-Have y no
  forma parte del MVP. Los mazos del MVP son preconstruidos y no modificables.

---

## 8. Heroes

### 8.1 Ficha de Heroe — El Flojo

| Campo               | Valor                                                        |
|---------------------|--------------------------------------------------------------|
| ID                  | HERO-001                                                     |
| Nombre canónico     | El Flojo                                                     |
| Alternativas de nombre | "El Vago Supremo", "El Maestro de la Inaccion"          |
| Arquetipo           | Floja                                                        |
| Puntos de Vida base | 30                                                           |
| Universo de referencia | Regular Show (Mordecai y Rigby)                          |
| Estilo de juego     | Control y robo de cartas, gestion de recursos               |

#### Habilidad Pasiva: Pereza Estrategica

| Campo        | Valor                                                              |
|--------------|--------------------------------------------------------------------|
| Nombre       | Pereza Estrategica                                                 |
| Coste        | 1 mana                                                             |
| Frecuencia   | Una vez por turno (en la Fase Principal)                          |
| Efecto       | Roba 1 carta de tu mazo. Descarta 1 carta aleatoria de tu mano    |
| Sinergia     | Combina bien con cartas que generan valor al ser descartadas o al tener pocas cartas en mano |

**Razonamiento de la habilidad**: la dicotomia robar/descartar refleja la personalidad
de Mordecai y Rigby: siempre tienen buenas ideas pero nunca las ejecutan bien del todo.
Funciona como herramienta de filtrado de mano a bajo coste.

#### Alternativas de nombre [PENDIENTE DE VALIDACION]

| Opcion              | Justificacion                                             |
|---------------------|-----------------------------------------------------------|
| El Flojo (propuesto)| Directo, reconocible, encaja con el arquetipo             |
| El Vago Supremo     | Mas humoristico, enfatiza el tono casual                  |
| El Maestro de la Inaccion | Ironico y memorable, mas largo para la UI         |

### 8.2 Ficha de Heroe — El Aventurero

| Campo               | Valor                                                        |
|---------------------|--------------------------------------------------------------|
| ID                  | HERO-002                                                     |
| Nombre canonico     | El Aventurero                                                |
| Alternativas de nombre | "El Heroe del Reino", "El Campeon de las Tierras de Ooo" |
| Arquetipo           | Aventura                                                     |
| Puntos de Vida base | 30                                                           |
| Universo de referencia | Hora de Aventuras (Finn y Jake)                         |
| Estilo de juego     | Agresivo, sinergia tribal, presion constante                |

#### Habilidad Pasiva: Combo de Aventura

| Campo        | Valor                                                              |
|--------------|--------------------------------------------------------------------|
| Nombre       | Combo de Aventura                                                  |
| Coste        | 2 mana                                                             |
| Frecuencia   | Una vez por turno (en la Fase Principal)                          |
| Efecto base  | Inflige 1 punto de dano al heroe enemigo                          |
| Efecto combo | Si tienes al menos 1 criatura con arquetipo Aventura en el tablero, inflige 2 puntos de dano en su lugar |
| Sinergia     | Incentiva mantener criaturas Aventura en el tablero para maximizar el dano directo |

**Razonamiento de la habilidad**: el "combo" refleja la manera en que Finn y Jake
siempre se complementan. Solos son capaces; juntos son imparables. La condicion del
tablero hace que el jugador quiera proteger sus criaturas.

#### Alternativas de nombre [PENDIENTE DE VALIDACION]

| Opcion                          | Justificacion                                    |
|---------------------------------|--------------------------------------------------|
| El Aventurero (propuesto)       | Generico y reconocible                           |
| El Heroe del Reino              | Mas tematico, referencia a Ooo                   |
| El Campeon de las Tierras de Ooo | El mas especifico, puede ser largo para la UI   |

### 8.3 Seleccion de Heroe

El jugador elige su heroe en la pantalla de Seleccion de Heroe antes de comenzar
la partida. La IA siempre usa el heroe contrario al jugador para garantizar partidas
asimetricas. Si el jugador elige El Flojo, la IA usa El Aventurero, y viceversa.

---

## 9. Mecanicas Innovadoras

### M1 — Sinergia Tribal

#### Descripcion

Las criaturas pertenecen a un arquetipo tribal (Floja, Aventura, Submarino, Deportiva
o Neutral). Cuando un jugador tiene 2 o mas criaturas del mismo arquetipo en el tablero
simultaneamente, se activa un bonus de sinergia que afecta a todas las criaturas de
ese arquetipo en el tablero aliado.

#### Reglas de Funcionamiento

1. El sistema comprueba la sinergia tribal al final de cada Fase Principal y al final
   de cada Fase de Combate.
2. El bonus de sinergia base es: +1 punto de Ataque a cada criatura del arquetipo
   por cada criatura aliada adicional del mismo arquetipo en el tablero.
   - Con 2 criaturas del mismo arquetipo: cada una recibe +1 ATQ.
   - Con 3 criaturas del mismo arquetipo: cada una recibe +2 ATQ.
   - Con N criaturas del mismo arquetipo: cada una recibe +(N-1) ATQ.
3. El bonus es dinamico: si una criatura muere, el bonus se recalcula en el siguiente
   punto de comprobacion.
4. Algunas cartas tienen efectos adicionales de sinergia tribal especificados en su
   descripcion (ver tabla de cartas, columna Efecto).
5. Las criaturas con arquetipo Neutral NO participan en los calculos de sinergia tribal.

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
   - **Como mana adicional**: el jugador puede declarar "uso X de Momentum como mana"
     antes de jugar una carta. El Momentum se consume y el mana disponible ese turno
     aumenta en X. El Momentum gastado como mana se pierde al final del turno si no
     se usa.
   - **Para cartas Furia**: ciertas cartas tienen el tipo especial "Furia" y solo pueden
     jugarse si el jugador gasta la cantidad de Momentum indicada en la carta. El coste
     en mana de estas cartas es 0 pero requieren Momentum.
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
otorgan buffs o debuffs a las criaturas que los ocupan mientras estan activos.

#### Reglas de Funcionamiento

1. **Zonas del tablero**: cada carril del tablero puede alojar hasta 2-3 criaturas
   por bando. [PENDIENTE DE VALIDACION: el limite exacto por carril esta sujeto a
   ajuste de balance durante la implementacion.]
2. **Cambio de entorno**: al inicio del turno 1, las 3 zonas tienen un entorno por
   defecto (Paisaje Neutro). Cada 3 turnos completos (un turno completo = un turno
   de cada jugador), una zona seleccionada aleatoriamente cambia de entorno.
3. **Entornos disponibles en MVP**:

| ID Entorno  | Nombre           | Buff/Debuff aplicado                                          |
|-------------|------------------|---------------------------------------------------------------|
| ENV-001     | Paisaje Neutro   | Sin modificadores                                             |
| ENV-002     | Bosque Magico    | +1 VID a todas las criaturas en esta zona                     |
| ENV-003     | Estadio Deportivo| +1 ATQ a todas las criaturas en esta zona                     |
| ENV-004     | Cocina Krusty    | Las criaturas en esta zona restauran 1 VID al heroe aliado al atacar |
| ENV-005     | Tierra de Ooo    | Las criaturas Aventura en esta zona ganan Cargo este turno    |
| ENV-006     | Parque Municipal | Las criaturas Floja en esta zona cuestan 1 mana menos         |

4. **Permanencia**: los modificadores de un entorno se aplican mientras el entorno
   este activo. Al cambiar de entorno, los modificadores del anterior desaparecen.
5. **Animacion de transicion**: el cambio de entorno se acompana de una animacion
   de transicion de fondo.

### M4 — Misiones (Quests)

#### Descripcion

Las Misiones son un tipo especial de carta que el jugador coloca en una zona especial
del tablero (la Zona de Mision) por un coste de 0 mana al inicio de su turno. Una vez
colocada, la Mision muestra una condicion a cumplir. Al completarse la condicion,
la Mision se activa automaticamente y otorga una recompensa poderosa.

#### Reglas de Funcionamiento

1. **Colocacion**: solo se puede colocar una Mision activa a la vez. Si ya hay una
   Mision activa, no se puede colocar otra hasta que la primera se complete o se
   descarte voluntariamente.
2. **Coste**: 0 mana. Solo pueden colocarse al inicio de la Fase Principal.
3. **Condicion**: cada carta de Mision define un contador (ej: "Invoca 5 criaturas
   del arquetipo Aventura"). El sistema incrementa el contador automaticamente.
4. **Completar la Mision**: al alcanzarse el contador objetivo, la Mision se marca
   como completada, se activa la recompensa y la carta se envia al cementerio.
5. **Visibilidad**: el progreso de la Mision es visible para ambos jugadores.

#### Misiones del MVP [PENDIENTE DE VALIDACION]

| ID      | Nombre                     | Condicion                            | Recompensa                                  |
|---------|----------------------------|--------------------------------------|---------------------------------------------|
| QST-001 | La Semana de los Vagos     | Juega 4 cartas del arquetipo Floja   | Roba 3 cartas                               |
| QST-002 | El Gran Combate            | Destruye 4 criaturas enemigas        | Inflige 6 de dano al heroe enemigo          |
| QST-003 | Expedicion Aventurera      | Invoca 5 criaturas del arquetipo Aventura | Invoca una copia de Marceline la Vampira |
| QST-004 | Maestro del Mazo           | Roba 8 cartas en una partida         | Juega tu siguiente carta gratis             |

### M5 — Aliado Invitado (Crossover)

#### Descripcion

Una vez por partida, el jugador puede activar la accion especial "Crossover". Al
activarla, roba 1 carta aleatoria del mazo visible del oponente y la anade a su
mano. Esta carta puede jugarse con su coste normal de mana.

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
   criaturas del mismo arquetipo.
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
   a. Recorre la mano de mayor a menor coste de mana.
   b. Juega la primera carta que pueda pagar con el mana disponible.
   c. Repite hasta que no pueda jugar ninguna carta mas.
   d. No activa la habilidad de heroe de forma deliberada; la activa solo si
      no queda ninguna carta jugable y aun tiene mana.
   e. No usa Crossover de forma proactiva.
   f. No considera sinergias tribales.

2. **Fase de Combate**:
   a. Si puede atacar al heroe enemigo directamente (sin criaturas con Provocacion
      enemigas bloqueando), ataca al heroe con la criatura de mayor ATQ.
   b. Si hay criaturas enemigas con Provocacion, ataca a la de menor VID.
   c. Si no puede atacar al heroe y no hay criaturas con Provocacion, ataca a la
      criatura enemiga con menor VID para intentar destruirla.

### 10.3 Nivel Medio — Threat-aware

**Descripcion del comportamiento**: la IA evalua el estado del tablero, identifica
amenazas y responde a ellas de forma adaptativa. Usa recursos defensivos cuando
es necesario y aprovecha sinergias tribales.

**Algoritmo de decision (en prosa)**:

1. **Evaluacion de amenazas al inicio del turno**:
   - Una criatura enemiga es considerada "amenaza" si tiene ATQ >= 4 o si tiene
     habilidades peligrosas (Veneno, Escudo Divino, Cargo).
   - Si hay 2 o mas amenazas en el tablero, prioriza eliminarlas sobre atacar al heroe.

2. **Fase Principal**:
   a. Si su vida es <= 40% (12 PV o menos), considera jugar hechizos defensivos
      (curacion, control) antes que criaturas.
   b. Evalua si tiene 2+ cartas del mismo arquetipo en mano: si es asi, prioriza
      jugarlas en el mismo turno para activar la sinergia tribal.
   c. Juega la combinacion de cartas que maximiza el valor del tablero, considerando:
      - Sinergia tribal activa.
      - Entorno/Zona activo que beneficie al arquetipo de sus criaturas.
   d. Activa la habilidad de heroe si quedan >= 2 mana y no hay cartas mas eficientes.
   e. Usa Crossover si su vida es <= 40% y tiene <= 3 cartas en mano.

3. **Fase de Combate**:
   a. Identifica criaturas enemigas con Provocacion y las elimina primero.
   b. Prioriza atacar criaturas enemigas que constituyen amenazas (ATQ >= 4).
   c. Usa ataques de criaturas pequenas para eliminar criaturas enemigas debilitadas
      ("valor trade"): una criatura de 2/1 puede matar a una de 5/1.
   d. Solo ataca al heroe enemigo cuando no hay amenazas activas o cuando puede
      infligir suficiente dano para ganar la partida ese turno.

4. **Uso del Momentum** (cuando aplica):
   - Si acumula >= 3 de Momentum, lo gasta como mana adicional para jugar una
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
| RF-011  | El sistema incrementa el mana maximo del jugador activo en 1 al inicio de su turno (tope 10) | Sistema | Must |
| RF-012  | El sistema recarga el mana del jugador activo al maximo al inicio de su turno | Sistema       | Must      |
| RF-013  | El jugador puede jugar una carta de Criatura pagando su coste de mana    | Jugador            | Must      |
| RF-014  | El sistema coloca la criatura jugada en el tablero del jugador           | Sistema            | Must      |
| RF-015  | El sistema marca la criatura recien jugada como "exhausta" (no puede atacar ese turno) salvo que tenga Cargo | Sistema | Must |
| RF-016  | El jugador puede jugar una carta de Hechizo pagando su coste y seleccionando el objetivo | Jugador | Must |
| RF-017  | El sistema aplica el efecto del hechizo sobre el objetivo seleccionado   | Sistema            | Must      |
| RF-018  | El jugador puede jugar una carta de Objeto pagando su coste y seleccionando el objetivo | Jugador | Must |
| RF-019  | El sistema aplica los modificadores del objeto al objetivo seleccionado  | Sistema            | Must      |
| RF-020  | El sistema descuenta el coste de mana de la carta jugada del mana disponible | Sistema       | Must      |
| RF-021  | El jugador puede activar la habilidad del heroe si tiene el mana requerido | Jugador          | Must      |
| RF-022  | El sistema aplica el efecto de la habilidad del heroe y descuenta el mana | Sistema           | Must      |
| RF-023  | La habilidad de heroe solo puede activarse una vez por turno             | Sistema            | Must      |
| RF-024  | El jugador puede seleccionar una criatura propia no exhausta para atacar | Jugador            | Must      |
| RF-025  | El sistema valida que si hay criaturas enemigas con Provocacion, solo se puede atacar a ellas | Sistema | Must |
| RF-026  | Al confirmar un ataque entre criatura atacante y objetivo, el sistema aplica el dano mutuo | Sistema | Must |
| RF-027  | El sistema destruye y envia al cementerio toda criatura con VID <= 0     | Sistema            | Must      |
| RF-028  | El sistema activa el efecto Ultimo Aliento de una criatura al ser destruida | Sistema         | Must      |
| RF-029  | El sistema detecta cuando los PV de un heroe llegan a 0 y termina la partida | Sistema       | Must      |
| RF-030  | El sistema muestra la pantalla de victoria al jugador humano si gana     | Sistema            | Must      |
| RF-031  | El sistema muestra la pantalla de derrota al jugador humano si pierde    | Sistema            | Must      |
| RF-032  | El sistema calcula y aplica bonuses de Sinergia Tribal al final de cada fase | Sistema       | Must      |
| RF-033  | El sistema activa el estado de Momentum cuando el jugador activo tiene <= 15 PV | Sistema   | Must      |
| RF-034  | El sistema incrementa el contador de Momentum en 1 al inicio del turno si el jugador esta en Momentum | Sistema | Must |
| RF-035  | El jugador puede gastar Momentum como mana adicional durante la Fase Principal | Jugador     | Must      |
| RF-036  | El sistema cambia el entorno de una zona aleatoria cada 3 turnos completos | Sistema         | Must      |
| RF-037  | El sistema aplica los buffs/debuffs del entorno activo a las criaturas en esa zona | Sistema | Must |
| RF-038  | El jugador puede colocar una carta de Mision en la Zona de Mision por 0 mana al inicio de la Fase Principal | Jugador | Must |
| RF-039  | El sistema rastrea el progreso de la Mision activa e incrementa el contador cuando se cumple una accion relevante | Sistema | Must |
| RF-040  | El sistema activa la recompensa de la Mision al completarse la condicion | Sistema            | Must      |
| RF-041  | El jugador puede activar Crossover una vez por partida durante la Fase Principal | Jugador    | Must      |
| RF-042  | Al activar Crossover, el sistema selecciona 1 carta aleatoria del mazo enemigo y la anade a la mano del jugador | Sistema | Must |
| RF-043  | Si la mano del jugador esta llena (10 cartas) al activar Crossover, la carta se destruye | Sistema | Must |
| RF-044  | El sistema limita el tablero a un maximo de 7 criaturas por lado         | Sistema            | Must      |
| RF-045  | El sistema limita la mano a un maximo de 10 cartas; las cartas robadas en exceso se destruyen | Sistema | Must |
| RF-046  | El jugador puede terminar su turno voluntariamente en cualquier momento de la Fase Principal | Jugador | Must |
| RF-047  | El sistema muestra un tooltip con los detalles de una carta al pasar el cursor sobre ella | Sistema | Should |
| RF-048  | El sistema muestra un indicador visual del turno activo (jugador o IA)   | Sistema            | Should    |
| RF-049  | El sistema muestra el contador de cartas restantes en el mazo de cada jugador | Sistema      | Should    |
| RF-050  | El sistema muestra una animacion especial al jugar una carta de rareza Legendaria | Sistema  | Should    |

### 12.2 Detalle de Requisitos Clave

#### RF-013: Jugar una Carta de Criatura

| Campo         | Detalle                                                                       |
|---------------|-------------------------------------------------------------------------------|
| Actor         | Jugador humano                                                                |
| Precondicion  | Es la Fase Principal del turno del jugador. La criatura esta en su mano. El jugador tiene mana >= coste de la criatura. El tablero tiene < 7 criaturas del jugador. |
| Flujo         | 1. El jugador hace clic en la carta de criatura en su mano. 2. La carta se muestra ampliada con confirmacion. 3. El jugador confirma. 4. El sistema descuenta el mana. 5. La carta se retira de la mano. 6. La criatura aparece en el tablero del jugador. 7. Si tiene Grito de Guerra, se activa el efecto. 8. La criatura queda marcada como exhausta. |
| Postcondicion | La criatura esta en el tablero, el mana se ha reducido, la carta ya no esta en la mano. |

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
| RNF-008 | Usabilidad       | Las acciones invalidas (mana insuficiente, tablero lleno) muestran un mensaje de error claro | Prueba de cada caso invalido      |
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

### CU-02: Jugar una Criatura

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Jugador humano |
| Precondicion      | Es la Fase Principal del turno del jugador. El jugador tiene en mano al menos una carta de Criatura. El jugador tiene mana suficiente para pagarla. El tablero del jugador tiene menos de 7 criaturas. |
| Flujo principal   | 1. El jugador hace clic en una carta de Criatura en su mano. 2. La carta se eleva visualmente y se muestra un dialogo de confirmacion con sus estadisticas. 3. El jugador confirma jugando la carta. 4. El sistema descuenta el mana. 5. La carta desaparece de la mano y la criatura aparece en el tablero. 6. Si la criatura tiene Grito de Guerra, se activa su efecto. 7. La criatura queda marcada como exhausta (no puede atacar este turno) salvo que tenga Cargo. 8. El sistema recalcula las sinergias tribales. |
| Flujo alternativo | 2a. El jugador cancela la seleccion: la carta vuelve a la mano sin coste. 4a. El tablero ya tiene 7 criaturas: el sistema muestra un mensaje de error y cancela la accion. 4b. El jugador no tiene mana suficiente: el sistema muestra un mensaje de error. |
| Postcondicion     | La criatura esta en el tablero del jugador. El mana disponible se ha reducido. La carta ya no esta en la mano. |

### CU-03: Lanzar un Hechizo

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Jugador humano |
| Precondicion      | Es la Fase Principal del turno del jugador. El jugador tiene en mano al menos un Hechizo. El jugador tiene mana suficiente. Existe al menos un objetivo valido segun el tipo del hechizo. |
| Flujo principal   | 1. El jugador hace clic en una carta de Hechizo en su mano. 2. Si el hechizo requiere objetivo, el cursor cambia a modo seleccion de objetivo. 3. El jugador hace clic en el objetivo valido (criatura o heroe). 4. El sistema aplica el efecto del hechizo. 5. El sistema descuenta el mana. 6. La carta va al cementerio. |
| Flujo alternativo | 2a. El hechizo es de area (AoE): no requiere seleccion de objetivo; se aplica directamente al confirmar. 3a. El jugador hace clic en un objetivo invalido: el sistema muestra un mensaje de error y permite reseleccionar. 3b. El jugador presiona Escape o hace clic fuera: cancela la accion sin coste. |
| Postcondicion     | El efecto del hechizo se ha aplicado. El mana se ha reducido. La carta esta en el cementerio. |

### CU-04: Atacar con una Criatura

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Jugador humano |
| Precondicion      | Es la Fase de Combate del turno del jugador. El jugador tiene al menos una criatura en el tablero que no este exhausta ni haya atacado este turno. |
| Flujo principal   | 1. El jugador hace clic en una criatura propia no exhausta. 2. La criatura se resalta y el cursor cambia a modo ataque. 3. Los objetivos validos se resaltan en el tablero enemigo. 4. El jugador hace clic en el objetivo (criatura enemiga o heroe enemigo). 5. El sistema valida el ataque (comprueba Provocacion). 6. El sistema aplica el dano: la criatura atacante recibe el ATQ del defensor y viceversa. 7. Si alguna criatura llega a 0 VID, se destruye y se activa Ultimo Aliento si procede. 8. La criatura atacante queda marcada como "ya ataco este turno". |
| Flujo alternativo | 3a. El rival tiene criaturas con Provocacion: solo esas criaturas se resaltan como objetivo valido. 4a. El jugador hace clic en un objetivo invalido: el sistema muestra un mensaje. 7a. El heroe enemigo llega a 0 PV: se activa la secuencia de fin de partida (CU-08). |
| Postcondicion     | El ataque se ha resuelto. Las criaturas han recibido dano. Las destruidas estan en el cementerio. |

### CU-05: Activar Habilidad de Heroe

| Campo             | Detalle |
|-------------------|---------|
| Actor             | Jugador humano |
| Precondicion      | Es la Fase Principal del turno del jugador. El jugador tiene mana suficiente para el coste de la habilidad. La habilidad no ha sido usada este turno. |
| Flujo principal   | 1. El jugador hace clic en el boton de habilidad de heroe. 2. Si la habilidad requiere objetivo, el cursor cambia a modo seleccion. 3. El jugador selecciona el objetivo (si procede). 4. El sistema aplica el efecto de la habilidad. 5. El sistema descuenta el mana. 6. El boton de habilidad se desactiva hasta el siguiente turno. |
| Flujo alternativo | 1a. El jugador no tiene mana suficiente: el boton esta deshabilitado y muestra el coste requerido. 1b. La habilidad ya fue usada este turno: el boton esta deshabilitado. |
| Postcondicion     | El efecto de la habilidad se ha aplicado. El mana se ha reducido. La habilidad no puede usarse de nuevo este turno. |

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
| Flujo principal   | 1. El jugador realiza una accion que avanza el contador de la Mision (ej: invoca una criatura del arquetipo indicado). 2. El sistema incrementa el contador visible de la Mision. 3. Si el contador alcanza el objetivo: a. Se muestra una animacion de "Mision Completada". b. Se activa la recompensa automaticamente. c. La carta de Mision se envia al cementerio. d. La Zona de Mision queda libre. |
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
- Dado que el jugador tiene 2 criaturas del arquetipo Floja en el tablero
- Cuando termina la Fase Principal
- Entonces cada criatura Floja tiene +1 punto de ATQ respecto a su valor base

**CA-M1-02**
- Dado que el jugador tiene 3 criaturas del arquetipo Aventura en el tablero
- Cuando se destruye una de ellas durante la Fase de Combate
- Entonces las 2 criaturas Aventura restantes pasan a tener +1 ATQ (no +2) al inicio del siguiente punto de comprobacion

**CA-M1-03**
- Dado que el jugador tiene una criatura Neutral y una criatura Floja en el tablero
- Cuando termina la Fase Principal
- Entonces ninguna de las dos recibe bonus tribal (la criatura Neutral no cuenta para el calculo)

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
- Dado que el jugador tiene 3 puntos de Momentum acumulados y 2 puntos de mana disponibles
- Cuando el jugador declara gastar 2 de Momentum como mana adicional antes de jugar una carta de 4 de mana
- Entonces el jugador puede jugar la carta (tiene 2+2=4 mana efectivo) y su contador de Momentum baja a 1

### M3 — Zonas y Entornos Dinamicos

**CA-M3-01**
- Dado que han transcurrido 3 turnos completos desde el ultimo cambio de entorno
- Cuando el sistema procesa el fin del tercer turno completo
- Entonces exactamente una zona cambia de entorno y se muestra la animacion de transicion

**CA-M3-02**
- Dado que la zona Centro tiene activo el entorno "Estadio Deportivo" (+1 ATQ)
- Cuando una criatura con 3 ATQ base entra en esa zona
- Entonces la criatura tiene efectivamente 4 ATQ mientras permanece en esa zona

**CA-M3-03**
- Dado que la zona Izquierda cambia de "Bosque Magico" a "Paisaje Neutro"
- Cuando se resuelve el cambio de entorno
- Entonces las criaturas en esa zona pierden el +1 VID otorgado por el Bosque Magico y sus PV actuales se recalculan

### M4 — Misiones (Quests)

**CA-M4-01**
- Dado que el jugador no tiene ninguna Mision activa
- Cuando el jugador coloca una carta de Mision en la Zona de Mision durante la Fase Principal
- Entonces la carta se coloca por 0 mana, el mana disponible del jugador no cambia, y el contador de la Mision muestra 0/X

**CA-M4-02**
- Dado que la Mision activa "La Semana de los Vagos" requiere jugar 4 cartas Floja y el contador esta en 3/4
- Cuando el jugador juega una carta de arquetipo Floja
- Entonces el contador pasa a 4/4, se activa la animacion de completado, se aplica la recompensa (robo de 3 cartas) y la carta de Mision va al cementerio

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
| Arquetipo          | Clasificacion tribal de una carta (Floja, Aventura, Submarino, Deportiva, Neutral). Determina la compatibilidad para sinergias tribales. |
| ATQ                | Abreviatura de Ataque. Valor numerico que indica el dano que una criatura inflige al atacar. |
| Battlecry          | Habilidad especial de criatura que se activa en el momento de ser jugada desde la mano. |
| Cargo (Charge)     | Habilidad especial de criatura que le permite atacar el mismo turno en que es jugada. |
| Cementerio         | Zona fuera del tablero donde van las cartas destruidas o hechizos usados. No interactiva en el MVP. |
| Crossover          | Mecanica M5. Accion unica por partida que permite robar una carta aleatoria del mazo del oponente. |
| Deathrattle        | Ver Ultimo Aliento. |
| Escudo Divino      | Habilidad especial de criatura. Ignora la primera fuente de dano que recibe. |
| Exhausta           | Estado de una criatura recien jugada que le impide atacar ese turno (salvo que tenga Cargo). |
| Fase de Combate    | Tercera fase del turno. Las criaturas del jugador activo pueden atacar. |
| Fase de Robo       | Primera fase del turno. El jugador activo roba 1 carta de su mazo. |
| Fase Principal     | Segunda fase del turno. El jugador activo puede jugar cartas, activar habilidades y acciones especiales. |
| Fin de Turno       | Cuarta y ultima fase del turno. Se resuelven efectos de fin de turno y el control pasa al otro jugador. |
| Grito de Guerra    | Ver Battlecry. |
| Heroe              | El avatar del jugador. Tiene PV, una habilidad activable y un mazo asociado. |
| IA Greedy          | Nivel de dificultad Facil. La IA elige siempre la carta de mayor coste que puede jugar. |
| IA Threat-aware    | Nivel de dificultad Medio. La IA evalua amenazas y responde con decisiones mas complejas. |
| Mana               | Recurso que se gasta para jugar cartas. Se recarga cada turno y su maximo aumenta en 1 por turno hasta 10. |
| Mazo               | Coleccion de 30 cartas de un jugador. Se baraja al inicio de la partida. |
| Mision (Quest)     | Carta especial de coste 0 que otorga una recompensa al cumplir una condicion. Mecanica M4. |
| Momentum           | Recurso especial que se acumula cuando el jugador tiene <= 15 PV. Puede usarse como mana adicional. Mecanica M2. |
| MVP                | Minimum Viable Product. Version minima jugable que incluye todas las funcionalidades Must-Have. |
| PV                 | Puntos de Vida. Valor numerico de la salud de un heroe o una criatura. |
| Provocacion (Taunt)| Habilidad especial de criatura. Obliga al rival a atacarla antes que a otras criaturas o al heroe. |
| Rareza             | Clasificacion de una carta: Comun, Rara, Epica o Legendaria. Indica su poder y frecuencia de aparicion. |
| Sinergia Tribal    | Bonus que se activa al tener 2 o mas criaturas del mismo arquetipo en el tablero. Mecanica M1. |
| Tablero            | Zona de juego donde se colocan las criaturas. Maximo 7 criaturas por lado en el MVP. |
| Ultimo Aliento     | Habilidad especial de criatura. Activa un efecto cuando la criatura es destruida. |
| VID                | Abreviatura de Vida. Valor de salud de una criatura. |
| Vision (Stealth)   | Habilidad especial. La criatura no puede ser objetivo de ataques ni hechizos hasta que ella misma ataque. |
| Zona / Entorno     | Cada uno de los 3 carriles del tablero. Tiene un entorno activo que puede otorgar buffs o debuffs. Mecanica M3. |

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
   equilibrada de tipos (6 criaturas, 2 hechizos, 2 objetos por mazo) y rareza.
3. **Arquitectura de referencia**: se incluyo la seccion 16 por decision del agente,
   al considerarse esencial para el proyecto academico aunque no estaba en el prompt
   original. Se alerto al usuario de esta adicion.
4. **Items [PENDIENTE DE VALIDACION]**: se marcaron 7 puntos que requieren decision
   del equipo antes de la fase de Diseno.

### Supuestos Adoptados [PENDIENTE DE VALIDACION]

- Nombre canonico de heroes: "El Flojo" y "El Aventurero".
- Distribucion de cartas por mazo: 6 criaturas + 2 hechizos + 2 objetos por carta unica.
- Limite por carril en zonas dinamicas: pendiente de ajuste de balance.
- Opcion de rendicion voluntaria: incluida como pendiente.
- IA Medio gana >= 40% contra IA Facil: umbral propuesto, pendiente de verificacion empirica.
- Las cartas Epicas tienen limite de 2 copias por mazo (alineado con convencion de Hearthstone).

---

*Fin del documento. Version 1.0.0 — 2026-05-19*
*Siguiente entregable: Documento de Diseno del Sistema (DDS) — Fase de Diseno, Dias 3-4.*
