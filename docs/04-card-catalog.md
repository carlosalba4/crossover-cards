# Catálogo de Cartas — Crossover Cards

## Documento 04: Diseño Numérico y Balance

---

| Campo            | Valor                                                        |
|------------------|--------------------------------------------------------------|
| Titulo           | Catálogo de Cartas y Balance                                 |
| Version          | 1.0.0                                                        |
| Fecha            | 2026-05-21                                                   |
| Estado           | Aprobado                                                     |
| Autores          | Equipo del proyecto (2 personas)                             |
| Fase             | Diseño (Cascada, Día 3-4)                                    |
| Revision         | Generado con asistencia de Google Antigravity (Claude Sonnet)|

---

## Tabla de Contenidos

1. Introducción
2. Sistema económico del juego
3. Distribución por rareza
4. Distribución por arquetipo
5. Catálogo del Mazo de El Lich (10 cartas)
6. Catálogo del Mazo de Axel Blaze (10 cartas)
7. Habilidades de héroe definitivas
8. Tabla resumen ejecutiva
9. Esquema JSON de ejemplo
10. Tests de balance previstos
11. Decisiones marcadas [PENDIENTE DE VALIDACIÓN]

---

## 1. Introducción

### 1.1 Propósito del Documento

Este documento define el catálogo numérico completo de las 20 cartas del juego Crossover Cards,
incluyendo costes de Nostalgia, estadísticas de ataque y vida, habilidades con descripciones
formales e implementables, justificaciones de balance y sinergias. Es el entregable de diseño
numérico que traduce las cartas descritas narrativamente en el PRD a valores concretos listos
para implementar en la capa de dominio.

El catálogo es la referencia principal para el domain-dev-agent (implementación TypeScript),
el tester-agent (tests de balance) y el ai-opponent-agent (evaluación de valor de cartas).

### 1.2 Cambio Terminológico Canónico

A partir de este documento, el tipo de carta que el PRD denominaba "Criatura" pasa a llamarse:

- **"Personaje"** en español: documentación, descripciones narrativas, mensajes de UI.
- **"Character"** en inglés: nombres de clase (`Character`), interfaz (`ICharacter`), campo
  JSON (`"type": "character"`), variables de código.

Este cambio se propagará en una tarea posterior al PRD v1.2 y al documento de arquitectura.
Mientras tanto, este catálogo es la fuente de verdad terminológica. "Hechizo" y "Objeto"
permanecen igual en ambos idiomas.

### 1.3 Principios de Balance Aplicados

- **Conservadurismo**: vale más una carta ligeramente débil que una rota. Las cartas de
  coste bajo tienen preferencia sobre los efectos espectaculares mal calibrados.
- **Fórmula vanilla orientativa**: `coste ≈ (ataque + vida) / 2` para Personajes sin habilidad.
  Las habilidades suman coste efectivo; las restricciones lo reducen.
- **Coherencia con el PRD**: los stats del PRD se respetan. Este documento justifica los números
  existentes, no los reemplaza salvo en puntos explícitamente marcados.
- **Implementabilidad**: todas las habilidades son realizables con el sistema `Modifier[]`
  y el Event Bus documentados en la sección 4 y 5 del documento de arquitectura.

### 1.4 Referencias

| Documento                  | Ubicacion                            |
|----------------------------|--------------------------------------|
| PRD v1.1.0                 | `docs/01-prd.md`                     |
| Arquitectura Técnica v1.0  | `docs/02-architecture.md`            |
| Catálogo de Agentes        | `docs/03-agents.md`                  |
| Skill de Mecánicas         | `.agent/skills/card-game-mechanics/SKILL.md` |

---

## 2. Sistema Económico del Juego

### 2.1 Curva de Nostalgia Turno a Turno

La Nostalgia comienza en 1 el turno 1 y aumenta +1 por turno hasta un máximo de 10.
Se restaura al inicio de cada turno propio. El Momentum puede actuar como Nostalgia adicional
cuando el jugador tiene 15 PV o menos.

| Turno | Nostalgia max | Cartas jugables (coste exacto)                               | Notas                                    |
|:-----:|:-------------:|--------------------------------------------------------------|------------------------------------------|
| 1     | 1             | Chum Chum (1)                                                | Solo 1 carta de coste 1 en todo el juego |
| 2     | 2             | Pops (2), Darwin (2), Rigby (2), Cangreburger (2)            | Turno de desarrollo; 4 opciones          |
| 3     | 3             | Chowder (3), Patricio (3), Fantasma (3), Agallas (3), El Poder (3), Linterna (3) | Turno más poblado |
| 4     | 4             | Jake (4), Superbocata (4), Pedo Poderoso (4), Diamantino (4), Omnitrix (4) | Punto de inflexión |
| 5     | 5             | Marceline (5), Bola de Dragón (5), Espada S. Demonio (5)     | Cartas de alto impacto                   |
| 6     | 6             | Combinación de 2 cartas (4+2, 3+3) o habilidad + carta       | Sin carta de coste 6                     |
| 7     | 7             | Goku (7) / combinación de 3 cartas baratas                   | Techo de coste del MVP                   |
| 8-10  | 8-10          | Multi-juego: 2 cartas caras + habilidad de héroe el mismo turno | Fase de cierre con Momentum             |

**Observación de diseño**: ninguna carta supera coste 7. Los turnos 8-10 están diseñados
para que el jugador pueda combinar múltiples acciones fuertes en el mismo turno, lo que
crea picos de presión decisivos en la parte final de la partida.

### 2.2 Fórmula Vanilla de Balance

La fórmula vanilla es orientativa. Los stats del PRD se toman como datos de entrada y se
justifican respecto a ella, no al revés.

- **Personaje vanilla**: `coste ≈ (ataque + vida) / 2`
- **Hechizo de daño**: `coste ≈ daño_total / 1.5`
- **Hechizo de curación**: `coste ≈ curación / 2`
- **Objeto**: `coste ≈ (bonus_ataque × durabilidad) / 2`

### 2.3 Tabla de Bonificaciones y Penalizaciones

| Modificador                                       | Ajuste de coste efectivo |
|---------------------------------------------------|:------------------------:|
| Taunt (Provocación)                               | +1                       |
| Charge (Cargo, puede atacar el mismo turno)       | +1                       |
| Divine Shield (Escudo Divino)                     | +1 a +2                  |
| Deathrattle potente (buff +2/+2 a aliado)         | +1                       |
| Battlecry fuerte (destruir personaje, robar carta) | +1                       |
| Lifesteal (Drenaje)                               | +1                       |
| Efecto de área (AoE)                              | +1 a +2                  |
| Restricción de ataque (cooldown 1 turno)          | -1                       |
| Efecto condicional (requiere aliado en tablero)   | -0.5                     |
| Efecto aleatorio (puede ser negativo)             | -0.5                     |
| Legendaria (efecto único e impactante)            | margen libre documentado |

---

## 3. Distribución por Rareza

### 3.1 Tabla por Mazo

| Rareza      | El Lich | Axel Blaze | Total |
|-------------|:-------:|:----------:|:-----:|
| Común       | 3       | 1          | 4     |
| Rara        | 3       | 3          | 6     |
| Épica       | 2       | 2          | 4     |
| Legendaria  | 1       | 3          | 4     |
| **Total**   | **9**   | **9**      | **18**|

> Nota: las 2 cartas restantes hasta 10 por mazo son las misiones (QST-001/002/003),
> que son neutrales y no pertenecen a ningún mazo. El recuento de 9 cartas es el total
> de cartas propias del mazo antes de contar las misiones compartidas.

### 3.2 Justificación de la Distribución

En CCGs comerciales la distribución típica es 50% Común, 30% Rara, 15% Épica, 5% Legendaria.
En Crossover Cards los mazos son **cerrados y preconstruidos** sin deckbuilding del jugador,
lo que permite romper esta norma conscientemente:

- **El Lich (3C/3R/2E/1L)**: distribución más conservadora. El mazo de control con curva
  baja necesita consistencia. Más comunes = más copias posibles en el mazo de 30.
- **Axel Blaze (1C/3R/2E/3L)**: distribución agresiva. Las 3 Legendarias (Goku, Bola de
  Dragón, Omnitrix) son cartas de impacto alto pero coste elevado (7, 5, 4). Dado que son
  mazos preconstruidos fijos, la regla CCG estándar de "1 Legendaria max por mazo" no aplica.
  Las 3 Legendarias tienen costes suficientemente altos para no aparecer juntas en mano
  en los primeros turnos.

---

## 4. Distribución por Arquetipo

### 4.1 Tabla de Personajes por Arquetipo

| Arquetipo        | Personajes en El Lich                        | Personajes en Axel Blaze          | Total Personajes | Sinergia M1 |
|------------------|----------------------------------------------|-----------------------------------|:----------------:|:-----------:|
| Cartoon Clásico  | Pops, Darwin, Chowder, Patricio, Rigby (5)   | Chum Chum (1)                     | 6                | Fuerte      |
| Aventura Mágica  | Jake el Perro (1)                            | Marceline (1)                     | 2                | Marginal    |
| Anime Combate    | —                                            | Goku, Diamantino (2)              | 2                | Moderada    |
| Sobrenatural     | —                                            | Fantasma Chocala, Agallas (2)     | 2                | Situacional |
| Neutral          | —                                            | —                                 | 0                | N/A         |

### 4.2 Cartas No-Personaje por Mazo

| Tipo    | El Lich                                      | Axel Blaze                               |
|---------|----------------------------------------------|------------------------------------------|
| Hechizo | Superbocata (4), Cangreburger (2)            | Pedo Poderoso (4), Linterna Minimizadora (3) |
| Objeto  | El Poder (3), Espada de Sangre de Demonio (5)| Bola de Dragón (5), Omnitrix (4)         |

### 4.3 Análisis de Viabilidad de Sinergias Tribales (M1)

- **Cartoon Clásico**: arquetipo tribal más fuerte del juego. El Lich tiene 5 Personajes de
  este arquetipo; con 3 en tablero simultáneo, cada una gana +2 ATQ adicional de sinergia.
  Axel Blaze solo tiene 1 (Chum Chum), que puede usar el Crossover para robar una del rival.
- **Anime Combate**: con Goku + Diamantino en tablero, se activa sinergia mínima (+1 ATQ).
  Es el tribal secundario de Axel Blaze. Moderadamente viable.
- **Sobrenatural**: arquetipo de complemento. Con Fantasma Chocala + Agallas en tablero se
  activa sinergia mínima, pero el diseño de estas cartas no depende de ella para ser útiles.
  Documentado explícitamente como "arquetipo situacional".
- **Aventura Mágica**: no viable como tribal puro en ningún mazo. Jake (El Lich) y Marceline
  (Axel Blaze) son Personajes individuales fuertes por sus propias habilidades, no por sinergia.
  El entorno ENV-005 (Tierra de Ooo) les otorga Cargo situacionalmente.

---

## 5. Catalogo del Mazo de El Lich (10 cartas)

### LIC-001 - Pops el Gentil

- **ID**: `pops-el-gentil`
- **Tipo**: Personaje
- **Arquetipo**: Cartoon Clasico
- **Rareza**: Rara
- **Coste de Nostalgia**: 2
- **Stats**: Ataque 1 / Vida 4
- **Habilidad**: Ultimo Aliento (Deathrattle) - al ser destruido, otorga +2 ATQ y +2 VID a una Personaje aliada aleatoria en el tablero.
- **Trasfondo narrativo**: Pops es el senor gentil del Parque, cuya bondad infinita se manifiesta incluso en su ultimo momento. Su sacrificio refuerza a sus aliados con el calor de su recuerdo.
- **Justificacion de balance**: vanilla para coste 2: (1+4)/2 = 2.5, ligeramente por debajo. El Deathrattle de +2/+2 a aliado equivale a coste +1 efectivo, pero la aleatoriedad y la condicion (necesita aliado) lo reducen a coste neto 2. Carta defensiva de coste bajo con recompensa condicionada.
- **Sinergias**: optima con Darwin (Battlecry se activa con Pops presente). La sinergia Cartoon Clasico amplifica su ATQ base de 1 para no ser inutil en combate.

---

### LIC-002 - Darwin Watterson

- **ID**: `darwin-watterson`
- **Tipo**: Personaje
- **Arquetipo**: Cartoon Clasico
- **Rareza**: Comun
- **Coste de Nostalgia**: 2
- **Stats**: Ataque 2 / Vida 3
- **Habilidad**: Grito de Guerra (Battlecry) - al ser jugado, si hay otra Personaje aliada en el tablero, esta Personaje gana +1 ATQ y +1 VID permanentemente.
- **Trasfondo narrativo**: Darwin, el mejor amigo y hermano adoptivo de Gumball, siempre crece mas fuerte rodeado de sus seres queridos. Su presencia es senal de que el equipo va primero.
- **Justificacion de balance**: stats 2/3 ligeramente bajo vanilla (2.5). El Battlecry condicional (+1/+1) lo lleva a 3/4 efectivo cuando se cumple. La condicion (requiere aliado previo) equilibra el valor.
- **Sinergias**: potente despues de Chum Chum (T1) o Rigby (T2). El arquetipo Cartoon Clasico multiplica su ATQ base con sinergia tribal.

---

### LIC-003 - Chowder

- **ID**: `chowder`
- **Tipo**: Personaje
- **Arquetipo**: Cartoon Clasico
- **Rareza**: Comun
- **Coste de Nostalgia**: 3
- **Stats**: Ataque 3 / Vida 2
- **Habilidad**: Grito de Guerra (Battlecry) - al ser jugado, destruye una Personaje enemiga con 1 VID o menos ("se la come").
- **Trasfondo narrativo**: Chowder, el aprendiz de chef gloton del mundo de Marziplan, devora literalmente a los Personajes enemigos pequenas. Su hambre insaciable es su mayor arma tactica.
- **Justificacion de balance**: stats 3/2 ligeramente sobre vanilla para coste 3 (2.5). El Battlecry de eliminacion es muy situacional (solo Personajes con 1 VID o menos). Valor crece en partidas largas con Personajes debilitadas.
- **Sinergias**: combo con "Hechizo Ancestral" (2 danyo deja Personaje en 1 VID, Chowder la elimina). Combo con El Poder (AoE 3 danyo configura objetivos para Chowder).

---

### LIC-004 - Patricio Estrella

- **ID**: `patricio-estrella`
- **Tipo**: Personaje
- **Arquetipo**: Cartoon Clasico
- **Rareza**: Comun
- **Coste de Nostalgia**: 3
- **Stats**: Ataque 4 / Vida 3
- **Habilidad**: Al ser jugado, se asigna aleatoriamente uno de 6 outcomes como Modifier fijo durante toda la vida de Patricio en el tablero. El outcome se selecciona con RNG inyectable (seed determinista para tests). Pool de outcomes:
  1. +2 ATQ permanente (Patricio pasa a 6/3)
  2. -1 ATQ permanente (Patricio pasa a 3/3)
  3. +1 VID permanente (Patricio pasa a 4/4)
  4. -1 VID permanente (Patricio pasa a 4/2)
  5. Taunt durante 1 turno completo (Provocacion temporal)
  6. Battlecry one-shot: roba 1 carta al jugarse (Modifier caduca inmediatamente)
- **Trasfondo narrativo**: Patricio es la estrella de mar mas impredecible de Fondo de Bikini. Nadie sabe lo que hara a continuacion, ni el mismo. Su caos inherente lo hace temible en el tablero.
- **Justificacion de balance**: vanilla coste 3: (4+3)/2 = 3.5. Stats por encima de vanilla porque la habilidad es aleatoria y puede ser negativa. Valor esperado de los 6 outcomes: ligeramente positivo (4 buenos, 1 neutro, 1 malo). RNG inyectable encaja con el patron Modifier[] de la arquitectura (seccion 4.8).
- **Sinergias**: la sinergia tribal Cartoon Clasico compensa outcomes negativos de ATQ. El outcome 6 (roba carta) es el mas valioso en curva baja.

---

### LIC-005 - Rigby

- **ID**: `rigby`
- **Tipo**: Personaje
- **Arquetipo**: Cartoon Clasico
- **Rareza**: Rara
- **Coste de Nostalgia**: 2
- **Stats**: Ataque 3 / Vida 2
- **Habilidad**: Cargo (Charge) - puede atacar el mismo turno que es jugado. Restriccion: no puede atacar en el turno inmediatamente siguiente tras haber atacado (cooldown 1 turno).
- **Trasfondo narrativo**: Rigby, el mapache holgazan del Regular Show, cuando se pone en marcha es imparable... por un momento. Su energia explosiva se agota rapido y necesita recuperarse.
- **Justificacion de balance**: vanilla coste 2 = 2.5. Stats 3/2 por encima de vanilla + Charge (+1 coste efectivo). La restriccion de cooldown (-1 coste efectivo) los cancela: coste neto 2. Dano burst consistente: 3 danyo garantizado el turno de juego, inactiva el siguiente.
- **Sinergias**: ideal para rematar Personajes debilitados o presionar al heroe rival. La sinergia tribal Cartoon Clasico amplifica su ATQ en el turno activo.

---

### LIC-006 - Jake el Perro

- **ID**: `jake-el-perro`
- **Tipo**: Personaje
- **Arquetipo**: Aventura Magica
- **Rareza**: Epica
- **Coste de Nostalgia**: 4
- **Stats**: Variable segun forma elegida al jugarse
- **Habilidad**: Battlecry - al jugarse, el jugador elige una forma permanente:
  - Forma Ofensiva: 6 ATQ / 2 VID
  - Forma Defensiva: 2 ATQ / 6 VID
- **Trasfondo narrativo**: Jake el Perro de Hora de Aventuras puede estirarse y adoptar cualquier forma. En el campo de batalla, su magia le permite adaptarse: ser el escudo o el martillo.
- **Justificacion de balance**: ambas formas son exactamente vanilla para coste 4: (6+2)/2 = 4, (2+6)/2 = 4. La flexibilidad tactica de eleccion justifica la rareza Epica sin necesitar stats superiores.
- **Sinergias**: Forma Ofensiva con buff de "Tornado de Fuego" robado via Crossover. Forma Defensiva es el unico tanque de El Lich. ENV-005 (Tierra de Ooo) le otorga Cargo situacionalmente.

---

### LIC-007 - Superbocata

- **ID**: `superbocata`
- **Tipo**: Hechizo
- **Arquetipo**: Neutral
- **Rareza**: Rara
- **Coste de Nostalgia**: 4
- **Habilidad**: Restaura 6 PV al heroe aliado.
- **Trasfondo narrativo**: el bocadillo mas grande e improbable del universo de las Tierras de Ooo. Una mordida y cualquier herida parece olvidarse. La nostalgia del sabor lo cura todo.
- **Justificacion de balance**: formula curacion: 6/2 = 3. Se establece en coste 4 (+1) porque 6 PV puede anular completamente la presion de un turno del rival. El sobre-coste limita la combinabilidad con otras cartas caras el mismo turno.
- **Sinergias**: esencial en el plan de control. Contrarresta el auto-danyo de la Espada de Sangre de Demonio. Puede sacar al jugador del estado de Momentum del rival.

---

### LIC-008 - Cangreburger

- **ID**: `cangreburger`
- **Tipo**: Hechizo
- **Arquetipo**: Neutral
- **Rareza**: Comun
- **Coste de Nostalgia**: 2
- **Habilidad**: Restaura 3 PV al heroe aliado y roba 1 carta.
- **Trasfondo narrativo**: el producto estrella del Krusty Krab, preparado con la formula secreta del senor Cangrejo. En el campo de batalla, su aroma nostalgico restaura el animo y trae nuevas ideas a la mente.
- **Justificacion de balance**: curacion (3/2 = 1.5) + robo de carta (~1.5 coste estandar) = 3 de coste efectivo. Se mantiene en 2 (ligero under-cost) porque la curacion es modesta y el robo de carta a coste 2 es el pegamento de la mano de El Lich en curva baja.
- **Sinergias**: activa misiones con condicion de robo. Combina con Patricio (si su outcome es roba carta, el jugador puede obtener 2 cartas en el mismo turno).

---

### LIC-009 - El Poder

- **ID**: `el-poder`
- **Tipo**: Objeto
- **Arquetipo**: Neutral
- **Rareza**: Epica
- **Coste de Nostalgia**: 3
- **Durabilidad**: 1 uso
- **Habilidad**: Se equipa al heroe aliado. Al activarse en Fase Principal, inflige 3 danyo a TODAS los Personajes enemigos del tablero (AoE). El objeto se destruye tras el uso.
- **Trasfondo narrativo**: El Poder, el objeto magico y peligroso del Regular Show que Rigby nunca deberia haber encontrado. Su energia cosmica puede limpiar el tablero de un solo golpe.
- **Justificacion de balance**: AoE de 3 danyo con activacion diferida y durabilidad 1. Comparado con Pedo Poderoso (coste 4, AoE 2 danyo instantaneo), ofrece +1 danyo de AoE con coste de accion adicional. El coste 3 vs 4 refleja este coste de activacion diferida.
- **Sinergias**: combo con Chowder (El Poder deja Personajes en 1 VID, Chowder las devora). Activa mision QST-002 si el AoE golpea multiples enemigos.

---

### LIC-010 - Espada de Sangre de Demonio

- **ID**: `espada-sangre-demonio`
- **Tipo**: Objeto
- **Arquetipo**: Aventura Magica
- **Rareza**: Legendaria
- **Coste de Nostalgia**: 5
- **Durabilidad**: 3 usos
- **Habilidad**: Se equipa al heroe aliado otorgando +5 ATQ. Al inicio de cada turno propio mientras esta equipada, el heroe recibe 1 danyo (maldicion de la espada). Cada uso de ataque del heroe consume 1 de durabilidad.
- **Trasfondo narrativo**: la espada carmesi de la Princesa Marceline, forjada con magia oscura. Su poder es indiscutible, pero drena la vida de quien la empuna turno tras turno. Solo los mas desesperados la desenvainan.
- **Justificacion de balance**: (5 ATQ x 3 durabilidad) / 2 = 7.5 coste bruto. Reducido a 5 por el auto-danyo (3 turnos x 1 danyo = -3 PV garantizados). La Legendaria transforma el estilo del heroe: El Lich pasa de mago puro a luchador agresivo.
- **Sinergias**: el auto-danyo puede activar el Momentum propio si baja de 15 PV, creando sinergia narrativa. Combina con Superbocata para curar el auto-danyo acumulado.

---

## 6. Catalogo del Mazo de Axel Blaze (10 cartas)

### AXE-001 - Goku

- **ID**: `goku`
- **Tipo**: Personaje
- **Arquetipo**: Anime Combate
- **Rareza**: Legendaria
- **Coste de Nostalgia**: 7
- **Stats**: Ataque 6 / Vida 6
- **Habilidad**: Al recibir danyo que lo dejaria a 0 VID o menos, en lugar de morir, Goku vuelve con 4 ATQ / 4 VID y gana Cargo durante ese turno. Este efecto solo puede ocurrir una vez por partida.
- **Trasfondo narrativo**: el Saiyan mas famoso del universo nunca se rinde. En el multiverso de Crossover Cards, su espiritu de combate lo hace levantarse incluso cuando parece caido para siempre.
- **Justificacion de balance**: vanilla coste 7: (6+6)/2 = 6. Goku tiene stats exactamente vanilla para coste 7 mas una habilidad de resurreccion unica (ocurre una vez por partida), que equivale a coste +2 adicional de valor efectivo. El coste 7 lo hace practicamente injugable antes del turno 7, cuando la partida ya esta muy avanzada, evitando que domine las fases tempranas.
- **Sinergias**: su resurreccion activa Cargo, lo que combina con el buff "Tornado de Fuego" de Axel Blaze (se le puede dar +2 ATQ y atacar inmediatamente despues de revivir). La sinergia tribal Anime Combate con Diamantino le da ATQ adicional.

---

### AXE-002 - Marceline

- **ID**: `marceline`
- **Tipo**: Personaje
- **Arquetipo**: Aventura Magica
- **Rareza**: Epica
- **Coste de Nostalgia**: 5
- **Stats**: Ataque 4 / Vida 5
- **Habilidad**: Drenaje (Lifesteal) - al atacar a una Personaje, el heroe aliado recupera PV iguales al danyo infligido.
- **Trasfondo narrativo**: Marceline la Reina de los Vampiros, la musica mas cool de las Tierras de Ooo. En el campo de batalla, drena la vida de sus enemigos para fortalecer a su heroe, igual que hace con la energia roja de sus victimas.
- **Justificacion de balance**: vanilla coste 5: (4+5)/2 = 4.5. Stats ligeramente por encima de vanilla con Lifesteal, que suele valer +1 coste efectivo. Total efectivo ~5.5, ligeramente sobre el coste de 5. Se acepta este ligero over-cost porque el Lifesteal solo activa al atacar Personajes (no al heroe rival), lo que limita su impacto en situaciones de tablero limpio.
- **Sinergias**: combina con "Tornado de Fuego" (+2 ATQ temporal aumenta el heal del Lifesteal en el mismo turno). Con sinergia tribal de Aventura Magica (si Jake el Perro fue robado via Crossover), el entorno ENV-005 le otorga Cargo para atacar el mismo turno que entra.

---

### AXE-003 - Fantasma Chocala

- **ID**: `fantasma-chocala`
- **Tipo**: Personaje
- **Arquetipo**: Sobrenatural
- **Rareza**: Rara
- **Coste de Nostalgia**: 3
- **Stats**: Ataque 2 / Vida 3
- **Habilidad**: Grito de Guerra (Battlecry) - al ser jugado, otorga +1 ATQ y +1 VID a una Personaje aliada aleatoria. Adicionalmente, no puede ser objetivo de hechizos enemigos durante el turno en que es jugado (inmunidad a hechizos ese turno).
- **Trasfondo narrativo**: el fantasma que siempre aparece en el momento mas inesperado. Su naturaleza eterea le hace invisible a los hechizos rivales el momento de su llegada, y su saludo refuerza a un companero aliado.
- **Justificacion de balance**: vanilla coste 3: (2+3)/2 = 2.5. Stats por debajo de vanilla. El Battlecry de +1/+1 a aliado (~+0.5 coste) y la inmunidad a hechizos el turno de entrada (~+0.5 coste) lo llevan a valor efectivo de ~3.5. Ligeramente sobre coste 3, aceptable para Rara.
- **Sinergias**: la inmunidad a hechizos el turno de entrada lo protege contra "Hechizo Ancestral" de El Lich. Activa sinergia tribal Sobrenatural con Agallas (sinergia minima). El Battlecry aleatorio puede reforzar a Goku o Diamantino si estan en tablero.

---

### AXE-004 - Diamantino

- **ID**: `diamantino`
- **Tipo**: Personaje
- **Arquetipo**: Anime Combate
- **Rareza**: Rara
- **Coste de Nostalgia**: 4
- **Stats**: Ataque 3 / Vida 5
- **Habilidad**: Escudo Cristalino - la primera vez que recibe danyo en su vida en el tablero, ese danyo se reduce a la mitad (redondeado hacia abajo). Esta habilidad se activa una sola vez.
- **Trasfondo narrativo**: Diamantino, el portero diamante del equipo de futbol, tiene una resistencia sobrehumana. Su cuerpo cristalizado puede absorber cualquier impacto, aunque solo hasta cierto punto.
- **Justificacion de balance**: vanilla coste 4: (3+5)/2 = 4. Stats exactamente vanilla. El Escudo Cristalino equivale a absorber el primer golpe a la mitad, lo que en la practica actua como un Divine Shield suavizado (vale +1 a +1.5 de coste efectivo). Se mantiene en coste 4 porque la mitigacion es parcial (no total como Divine Shield) y solo ocurre una vez.
- **Sinergias**: sinergia tribal Anime Combate con Goku. Su resistencia lo convierte en un tanque fiable para mantener la sinergia tribal activa. Combina con "Tornado de Fuego" en su turno de ataque para maximizar danyo aprovechando su supervivencia.

---

### AXE-005 - Chum Chum

- **ID**: `chum-chum`
- **Tipo**: Personaje
- **Arquetipo**: Cartoon Clasico
- **Rareza**: Comun
- **Coste de Nostalgia**: 1
- **Stats**: Ataque 1 / Vida 2
- **Habilidad**: Ninguna. Personaje vanilla de coste 1.
- **Trasfondo narrativo**: Chum Chum, el mejor amigo de Fanboy, es tan entusiasta que se lanza al campo de batalla sin pensarlo dos veces. No tiene poderes especiales, pero su presencia alegra a todo el equipo.
- **Justificacion de balance**: vanilla coste 1: (1+2)/2 = 1.5. Stats ligeramente por debajo de vanilla (sin habilidad). Es el unico 1-drop del juego, lo que le da un valor de curva unico: garantiza una Personaje en tablero en el turno 1, activando sinergias en el turno 2 (Darwin, Fantasma Chocala). Su modestia es su proposito.
- **Sinergias**: activa el Battlecry de Darwin (si Chum Chum entra T1, Darwin puede entrar T2 con bonus). Tambien activa la sinergia tribal minima de Cartoon Clasico en Axel Blaze (Chum Chum es el unico Cartoon Clasico del mazo). Clave para la mision QST-001 (invocar 5 Personajes).

---

### AXE-006 - Agallas el Perro Cobarde

- **ID**: `agallas-el-perro-cobarde`
- **Tipo**: Personaje
- **Arquetipo**: Sobrenatural
- **Rareza**: Rara
- **Coste de Nostalgia**: 3
- **Stats**: Ataque 2 / Vida 4
- **Habilidad**: Taunt inverso - no puede ser objetivo de ataques directos mientras haya otra Personaje aliada en el tablero. Si es la unica Personaje aliada en el tablero, gana +2 ATQ permanentemente.
- **Trasfondo narrativo**: Agallas, el perro mas cobarde del mundo, siempre se esconde detras de algo (o alguien). Pero cuando se queda solo, el miedo se convierte en una furia inesperada que sorprende a todos.
- **Justificacion de balance**: vanilla coste 3: (2+4)/2 = 3. Stats exactamente vanilla. El Taunt inverso es un mecanismo unico que protege a Agallas mientras no es necesario (hay otros aliados), y lo convierte en amenaza cuando es el ultimo (+2 ATQ, pasando a 4/4). El doble rol equilibra el coste 3.
- **Sinergias**: arquetipo de complemento Sobrenatural con Fantasma Chocala. En situaciones de tablero limpio (el unico aliado), sus 4/4 efectivos son amenazantes. Combina con "Tornado de Fuego" para llegar a 6 ATQ en el turno de ataque si queda solo.

---

### AXE-007 - Pedo Poderoso

- **ID**: `pedo-poderoso`
- **Tipo**: Hechizo
- **Arquetipo**: Neutral
- **Rareza**: Epica
- **Coste de Nostalgia**: 4
- **Habilidad**: Inflige 2 danyo a TODAS los Personajes enemigos del tablero (AoE instantaneo).
- **Trasfondo narrativo**: el arma secreta mas vergonzosa y devastadora del universo. Un sonido, un olor y el tablero enemigo queda arrasado. La fisica del multiverso de Crossover Cards permite que su impacto sea... considerable.
- **Justificacion de balance**: AoE instantaneo sin coste de accion adicional. Comparado con El Poder (coste 3, AoE 3 danyo pero requiere equipar + activar en distintos turnos), Pedo Poderoso es mas eficiente situacionalmente pero hace 1 menos de danyo. El coste 4 refleja la conveniencia del AoE instantaneo sin restricciones de activacion.
- **Sinergias**: combo con Linterna Minimizadora (reduce stats enemigos a la mitad primero, luego el AoE puede destruir directamente Personajes debilitadas). Activa mision QST-002 si golpea multiples enemigos con el danyo total.

---

### AXE-008 - Linterna Minimizadora

- **ID**: `linterna-minimizadora`
- **Tipo**: Hechizo
- **Arquetipo**: Neutral
- **Rareza**: Rara
- **Coste de Nostalgia**: 3
- **Habilidad**: Reduce el ATQ y VID de una Personaje enemiga objetivo a la mitad (redondeado hacia abajo) de forma permanente.
- **Trasfondo narrativo**: la linterna de Jimmy Neutron que reduce el tamano de cualquier objeto o personaje. En el campo de batalla, convierte la amenaza mas poderosa en algo gestionable.
- **Justificacion de balance**: formula de control: reduce efectivamente los stats de una Personaje enemiga en ~50%. Para una Personaje de 6/6 la convierte en 3/3, eliminando ~3 de ataque y ~3 de vida. Este control permanente sobre una Personaje cara es equivalente a un hechizo de eliminacion suavizado. El coste 3 es correcto: mas barato que la eliminacion total pero menos impactante.
- **Sinergias**: combo con Pedo Poderoso (Linterna debilita primero, el AoE destruye). Responde directamente a Goku (si se juega antes de que Goku muera para evitar su resurreccion, al reducirle la vida a 3 el AoE de 2 danyo lo destruye sin activar la resurreccion... si sus PV actuales son <= 2 tras el debuff).

---

### AXE-009 - Bola de Dragon

- **ID**: `bola-de-dragon`
- **Tipo**: Objeto
- **Arquetipo**: Anime Combate
- **Rareza**: Legendaria
- **Coste de Nostalgia**: 5
- **Durabilidad**: uso unico (se consume al activarse)
- **Habilidad**: Al jugarse, el jugador elige UNO de los tres efectos siguientes:
  1. Curar 5 PV al heroe aliado.
  2. Infligir 5 danyo al heroe enemigo.
  3. Ganar 3 Nostalgia extra este turno (uso inmediato, no se acumula entre turnos).
- **Trasfondo narrativo**: la legendaria Bola de Dragon puede conceder cualquier deseo. En Crossover Cards, condensa ese poder en tres opciones criticas que pueden cambiar el rumbo de la partida en el momento preciso.
- **Justificacion de balance**: tres efectos a elegir, cada uno con valor individual de coste 3-4 (5 PV curacion ~2.5, 5 danyo directo ~3.3, 3 Nostalgia extra ~valor de aceleracion de curva). Al ser Legendaria de uso unico con eleccion, el coste 5 refleja la maxima flexibilidad tactica del juego. La eleccion elimina el desperdicio: siempre el jugador obtiene el efecto que mas necesita en ese momento.
- **Sinergias**: la opcion 3 (3 Nostalgia extra) permite jugar Goku el mismo turno que se juega Bola de Dragon si ya se tienen 4 Nostalgia disponibles (4+3 = 7 = coste de Goku). Potente combo de cierre en turno 5+.

---

### AXE-010 - Omnitrix

- **ID**: `omnitrix`
- **Tipo**: Objeto
- **Arquetipo**: Anime Combate
- **Rareza**: Legendaria
- **Coste de Nostalgia**: 4
- **Durabilidad**: 2 usos
- **Habilidad**: Se equipa al heroe aliado. Al activar la habilidad de heroe mientras el Omnitrix esta equipado, el jugador elige UNO de los tres efectos (en lugar del efecto normal de la habilidad):
  1. Infligir 3 danyo a un objetivo enemigo (heroe o Personaje).
  2. Otorgar Escudo Divino al heroe aliado hasta el inicio del siguiente turno.
  3. Robar 2 cartas.
  Cada vez que se activa la habilidad de heroe con el Omnitrix equipado consume 1 de durabilidad.
- **Trasfondo narrativo**: el Omnitrix de Ben Tennyson permite transformarse en cualquier alienigena. En Crossover Cards, Axel Blaze usa el Omnitrix para elegir el poder que mas necesita en cada turno, combinando la fuerza del futbol con tecnologia extraterrestre.
- **Justificacion de balance**: reemplaza la habilidad de heroe estandar ("Tornado de Fuego", +2 ATQ, coste 2) por 3 efectos mas potentes sin coste adicional de Nostalgia. El equilibrio: durabilidad 2 (solo 2 usos en toda la partida) y coste de equipar 4 Nostalgia. El valor total del objeto es aproximadamente 2 usos x (3 danyo o Shield o 2 cartas) ~ coste equivalente a 2 hechizos de coste 3, amortizando el coste de equipar de 4 en 2 turnos de uso.
- **Sinergias**: la opcion "Robar 2 cartas" combina con mazos que necesitan refresco en mid-game. La opcion "Escudo Divino al heroe" protege de daño directo critico en turnos de alta presion. El efecto 1 (3 danyo) complementa el AoE de Pedo Poderoso para rematar Personajes supervivientes.

---

## 7. Habilidades de Heroe Definitivas

### El Lich — Hechizo Ancestral

| Campo      | Valor                                                                              |
|------------|------------------------------------------------------------------------------------|
| Nombre     | Hechizo Ancestral                                                                  |
| Coste      | 2 Nostalgia                                                                        |
| Frecuencia | Una vez por turno (Fase Principal)                                                 |
| Efecto     | Inflige 2 puntos de danyo a un objetivo enemigo elegido por el jugador (heroe o Personaje) |
| Sinergia   | Complementa mazos de desgaste y control; util para rematar Personajes debilitadas  |

**Justificacion**: 2 danyo directo a objetivo a coste 2 es exactamente la tasa estandar de los CCGs (1 danyo por 1 Nostalgia). No es un efecto rompedor pero si consistente. Usado correctamente, puede eliminar Personajes de baja vida o presionar al heroe rival turno a turno. Se usa si el jugador no tiene carta mas eficiente que jugar con la Nostalgia restante.

**Interaccion con cartas**: combo directo con Chowder (Hechizo Ancestral deja Personaje en 1 VID, Chowder la elimina con Battlecry). Tambien activa misiones QST-002 (danyo acumulado).

---

### Axel Blaze — Tornado de Fuego

| Campo      | Valor                                                                              |
|------------|------------------------------------------------------------------------------------|
| Nombre     | Tornado de Fuego                                                                   |
| Coste      | 2 Nostalgia                                                                        |
| Frecuencia | Una vez por turno (Fase Principal)                                                 |
| Efecto     | Otorga +2 ATQ a una Personaje aliada elegida hasta el final del turno              |
| Sinergia   | Potente con Personajes que tienen Cargo o con la sinergia tribal de Anime Combate  |

**Nota terminologica**: el nombre canonico es "Tornado de Fuego" segun el PRD (seccion 8). El workflow contenia "Disparo Llamarada" por error. "Tornado de Fuego" es la referencia definitiva.

**Justificacion**: +2 ATQ temporal es un buff atacante que obliga al jugador a atacar con esa Personaje ese turno para aprovechar el bonus. Esta restriccion implicita (si no atacas, el bonus se pierde) crea decision tactica. A coste 2 es exactamente lo que cuesta en terminos de valor de buff temporal en un CCG estandar.

**Interaccion con cartas**: maxima sinergia con Goku (post-resurreccion tiene Cargo, el buff se aprovecha inmediatamente). Tambien potente con Rigby del mazo rival si se roba via Crossover (Cargo + +2 ATQ = 5 danyo burst en el turno de entrada).

---

## 8. Tabla Resumen Ejecutiva

### 8.1 Mazo de El Lich

| ID      | Nombre                      | Tipo      | Arquetipo        | Rareza     | Coste | ATQ  | VID  | Habilidad resumida                                    |
|---------|-----------------------------|-----------|------------------|------------|:-----:|:----:|:----:|-------------------------------------------------------|
| LIC-001 | Pops el Gentil              | Personaje | Cartoon Clasico  | Rara       | 2     | 1    | 4    | Deathrattle: +2/+2 a aliado aleatorio                 |
| LIC-002 | Darwin Watterson            | Personaje | Cartoon Clasico  | Comun      | 2     | 2    | 3    | Battlecry: +1/+1 si hay aliado                        |
| LIC-003 | Chowder                     | Personaje | Cartoon Clasico  | Comun      | 3     | 3    | 2    | Battlecry: destruye enemigo con 1 VID o menos         |
| LIC-004 | Patricio Estrella           | Personaje | Cartoon Clasico  | Comun      | 3     | 4    | 3    | Modifier aleatorio al jugarse (6 outcomes, RNG inyectable) |
| LIC-005 | Rigby                       | Personaje | Cartoon Clasico  | Rara       | 2     | 3    | 2    | Charge; cooldown 1 turno tras atacar                  |
| LIC-006 | Jake el Perro               | Personaje | Aventura Magica  | Epica      | 4     | var  | var  | Battlecry: elige 6/2 u 2/6                            |
| LIC-007 | Superbocata                 | Hechizo   | Neutral          | Rara       | 4     | —    | —    | Restaura 6 PV al heroe aliado                         |
| LIC-008 | Cangreburger                | Hechizo   | Neutral          | Comun      | 2     | —    | —    | Restaura 3 PV y roba 1 carta                          |
| LIC-009 | El Poder                    | Objeto    | Neutral          | Epica      | 3     | —    | —    | Equipable; activa AoE 3 danyo a todos los enemigos. Durabilidad 1 |
| LIC-010 | Espada de Sangre de Demonio | Objeto    | Aventura Magica  | Legendaria | 5     | —    | —    | Equipable; +5 ATQ heroe, 1 auto-danyo/turno. Durabilidad 3 |

### 8.2 Mazo de Axel Blaze

| ID      | Nombre                   | Tipo      | Arquetipo       | Rareza     | Coste | ATQ | VID | Habilidad resumida                                         |
|---------|--------------------------|-----------|-----------------|------------|:-----:|:---:|:---:|------------------------------------------------------------|
| AXE-001 | Goku                     | Personaje | Anime Combate   | Legendaria | 7     | 6   | 6   | Al morir una vez por partida, vuelve 4/4 con Charge        |
| AXE-002 | Marceline                | Personaje | Aventura Magica | Epica      | 5     | 4   | 5   | Lifesteal: el heroe aliado recupera PV = danyo infligido   |
| AXE-003 | Fantasma Chocala         | Personaje | Sobrenatural    | Rara       | 3     | 2   | 3   | Battlecry: +1/+1 a aliado aleatorio; inmune a hechizos ese turno |
| AXE-004 | Diamantino               | Personaje | Anime Combate   | Rara       | 4     | 3   | 5   | Escudo Cristalino: primer danyo recibido se reduce a la mitad |
| AXE-005 | Chum Chum                | Personaje | Cartoon Clasico | Comun      | 1     | 1   | 2   | Sin habilidad. Unico 1-drop del juego                      |
| AXE-006 | Agallas el Perro Cobarde | Personaje | Sobrenatural    | Rara       | 3     | 2   | 4   | Taunt inverso; +2 ATQ si es el unico aliado en tablero     |
| AXE-007 | Pedo Poderoso            | Hechizo   | Neutral         | Epica      | 4     | —   | —   | AoE instantaneo: 2 danyo a todos los Personajes enemigos   |
| AXE-008 | Linterna Minimizadora    | Hechizo   | Neutral         | Rara       | 3     | —   | —   | Reduce ATQ y VID de enemigo objetivo a la mitad (permanente) |
| AXE-009 | Bola de Dragon           | Objeto    | Anime Combate   | Legendaria | 5     | —   | —   | Elige: curar 5 PV / 5 danyo al heroe enemigo / 3 Nostalgia extra |
| AXE-010 | Omnitrix                 | Objeto    | Anime Combate   | Legendaria | 4     | —   | —   | Equipable (dur. 2); reemplaza habilidad de heroe por 3 opciones |

---

## 9. Esquema JSON de Ejemplo

Los siguientes ejemplos siguen el modelo de datos definido en la seccion 5 del documento de arquitectura (`docs/02-architecture.md`). El campo `"type"` usa el valor `"character"` (en ingles) segun la nomenclatura canonica establecida en este documento.

### 9.1 Personaje (Character)

```json
{
  "id": "LIC-005",
  "name": "Rigby",
  "type": "character",
  "archetype": "CartoonClasico",
  "nostalgyCost": 2,
  "rarity": "Rara",
  "description": "Charge. No puede atacar el turno siguiente tras haber atacado.",
  "spriteKey": "rigby_card",
  "greetingText": "YA VOOOY!",
  "attack": 3,
  "health": 2,
  "abilities": ["charge"],
  "abilityMeta": {
    "chargeCooldownTurns": 1
  }
}
```

### 9.2 Hechizo (Spell)

```json
{
  "id": "LIC-008",
  "name": "Cangreburger",
  "type": "spell",
  "archetype": "Neutral",
  "nostalgyCost": 2,
  "rarity": "Comun",
  "description": "Restaura 3 PV al heroe aliado y roba 1 carta.",
  "spriteKey": "cangreburger_card",
  "greetingText": "El sabor secreto!",
  "effectType": "HealAndDraw",
  "targetType": "Self",
  "effectValue": 3,
  "drawCount": 1
}
```

### 9.3 Objeto (Item)

```json
{
  "id": "LIC-010",
  "name": "Espada de Sangre de Demonio",
  "type": "item",
  "archetype": "AventuraMagica",
  "nostalgyCost": 5,
  "rarity": "Legendaria",
  "description": "+5 ATQ al heroe. Al inicio de cada turno propio, el heroe recibe 1 danyo. Durabilidad 3.",
  "spriteKey": "demon_sword_card",
  "greetingText": "Este poder tiene un precio...",
  "targetType": "Hero",
  "statModifier": {
    "attackBonus": 5,
    "healthBonus": 0
  },
  "abilityGranted": null,
  "durability": 3,
  "onTurnStartEffect": {
    "type": "DamageOwner",
    "value": 1
  }
}
```

### 9.4 Personaje con Modifier aleatorio (Patricio Estrella)

```json
{
  "id": "LIC-004",
  "name": "Patricio Estrella",
  "type": "character",
  "archetype": "CartoonClasico",
  "nostalgyCost": 3,
  "rarity": "Comun",
  "description": "Al ser jugado, recibe un Modifier aleatorio fijo de 6 outcomes posibles.",
  "spriteKey": "patricio_card",
  "greetingText": "Que esta pasando?",
  "attack": 4,
  "health": 3,
  "abilities": ["randomModifier"],
  "abilityMeta": {
    "modifierPool": [
      { "source": "patricio_random", "attackBonus": 2, "healthBonus": 0, "duration": -1 },
      { "source": "patricio_random", "attackBonus": -1, "healthBonus": 0, "duration": -1 },
      { "source": "patricio_random", "attackBonus": 0, "healthBonus": 1, "duration": -1 },
      { "source": "patricio_random", "attackBonus": 0, "healthBonus": -1, "duration": -1 },
      { "source": "patricio_random", "attackBonus": 0, "healthBonus": 0, "abilitiesGranted": ["taunt"], "duration": 1 },
      { "source": "patricio_random", "attackBonus": 0, "healthBonus": 0, "abilitiesGranted": [], "oneShot": "drawCard", "duration": 0 }
    ]
  }
}
```

---

## 10. Tests de Balance Previstos

Esta seccion define escenarios con rangos numericos concretos para el Tester-Agent
y el AI-Opponent-Agent. Cada escenario es un criterio de aceptacion de balance.

### TB-001: Duracion de Partida

- **Escenario**: simular 100 partidas IA vs IA (GreedyAI vs ThreatAwareAI).
- **Rango esperado**: la partida promedio debe durar entre **6 y 14 turnos por jugador**
  (12-28 turnos totales de tablero).
- **Fallo si**: el 20% o mas de las partidas terminan en 5 turnos o menos (demasiado agresivo)
  o en 20 turnos o mas (demasiado lento / tablero estancado).

### TB-002: No Hay Carta Dominante

- **Escenario**: en 100 partidas, registrar que cartas se juegan en cada partida.
- **Rango esperado**: ninguna carta debe aparecer jugada en mas del **80% de las partidas**
  (over-tuned) ni en menos del **10% de las partidas** (carta inutil).
- **Fallo si**: Goku aparece en >80% de las partidas jugado antes del turno 8 (significaria
  que la IA prioriza Goku incorrectamente respecto a otras cartas).
- **Nota**: las Legendarias pueden estar cerca del limite del 80% sin superarlo, dado su
  impacto disenado.

### TB-003: Las Legendarias Son Impactantes Pero No Automaticas

- **Escenario**: en partidas donde se juega Goku, registrar si el jugador de Goku gana
  la partida dentro de los **2 turnos siguientes** al turno en que se juega Goku.
- **Rango esperado**: el jugador de Goku no debe ganar en los 2 turnos siguientes en mas
  del **60% de los casos** (si gana mas del 60%, Goku es demasiado poderoso solo).
- **Criterio adicional**: la resurreccion de Goku debe activarse en al menos el **30% de
  las partidas** donde Goku es jugado (si nunca activa, su habilidad no es relevante).

### TB-004: Sinergia Tribal Funciona

- **Escenario**: registrar el danyo por turno de El Lich cuando tiene 3+ Personajes Cartoon
  Clasico en tablero (sinergia maxima activa) frente a cuando tiene 1-2.
- **Rango esperado**: con 3 Personajes Cartoon Clasico en tablero, el bono de sinergia debe
  representar al menos el **15% del danyo total** del turno de combate.
- **Criterio adicional**: el jugador de El Lich debe activar sinergia tribal de 2+ Cartoon
  Clasico en al menos el **50% de las partidas** a partir del turno 4.

### TB-005: Momentum Realmente Revierte Partidas

- **Escenario**: en partidas donde un jugador estuvo a 15 PV o menos durante 3 o mas turnos
  consecutivos (Momentum activo sostenido), registrar la tasa de remontada.
- **Rango esperado**: la tasa de remontada (el jugador con Momentum acaba ganando) debe
  ser igual o superior al **25%**.
- **Fallo si**: la tasa de remontada es inferior al 15% (el Momentum no ofrece suficiente
  ventaja para ser meaningful) o superior al 45% (el Momentum rompe el balance).

### TB-006: Curva de Nostalgia Accesible en los Primeros Turnos

- **Escenario**: en 100 partidas, registrar si cada jugador puede jugar al menos 1 carta
  en los turnos 1, 2 y 3 con la mano de 4 cartas inicial.
- **Rango esperado**: en el **85% o mas** de las partidas, cada jugador puede jugar al menos
  1 carta en cada uno de los primeros 3 turnos (con la mano inicial de 4 cartas).
- **Justificacion**: la distribucion de costes garantiza que con 4 cartas iniciales y los
  turnos 1-3 cubiertos por multiples opciones de bajo coste, el riesgo de mano vacia es bajo.

### TB-007: Patricio Estrella — Distribucion de Outcomes

- **Escenario**: en 100 invocaciones de Patricio Estrella, verificar que la distribucion
  de outcomes del RNG es aproximadamente uniforme.
- **Rango esperado**: cada uno de los 6 outcomes debe aparecer entre el **10% y el 25%**
  de las veces (desviacion maxima del +-8% sobre el esperado uniforme de 16.7%).
- **Nota tecnica**: este test valida que el RNG inyectable no tiene sesgo. En modo
  determinista con seed fija, el mismo seed siempre produce el mismo outcome (test unitario).

### TB-008: El Omnitrix No Domina la Fase Media

- **Escenario**: comparar el valor promedio por turno del heroe Axel Blaze cuando el
  Omnitrix esta equipado frente a cuando usa "Tornado de Fuego" estandar.
- **Rango esperado**: el Omnitrix no debe producir mas del **50% de valor adicional** por
  uso respecto a la habilidad estandar "Tornado de Fuego". Si produce mas del 50% de valor
  adicional de forma consistente, el coste de equipar (4 Nostalgia) debe revisarse al alza.

---

## 11. Decisiones Marcadas [PENDIENTE DE VALIDACION]

### DV-001: Distribucion de Misiones entre Mazos

**Resolucion adoptada**: las misiones QST-001, QST-002 y QST-003 son neutrales y
compartidas entre ambos jugadores. Cada jugador puede tener su propia mision activa
de forma simultanea. El cumplimiento de la condicion es individual.

**Punto pendiente**: el mazo de 30 cartas de cada jugador actualmente tiene 9 cartas
propias. Las misiones son cartas adicionales que el jugador puede colocar desde una
"zona de misiones" comun, no desde el mazo. Confirmar si las misiones forman parte del
mazo de 30 o si son un pool separado accesible siempre. La implementacion actual
asume pool separado (coste 0, colocacion al inicio de Fase Principal sin consumir mano).

### DV-002: Slot Libre Fuera de Zonas

**Descripcion**: el tablero tiene 7 slots por bando: 6 en zonas (2 por zona x 3 zonas)
+ 1 slot libre fuera de zonas. Los Personajes en el slot libre no reciben buffs/debuffs
de entorno ni participan en la sinergia de zona.

**Punto pendiente**: la UI debe aclarar si el jugador puede elegir colocar una Personaje
en el slot libre voluntariamente o si ese slot solo se usa cuando las 3 zonas estan llenas.
La sinergia tribal M1 afecta a los Personajes del slot libre igualmente (es tribal, no zonal).

### DV-003: Interaccion Linterna Minimizadora con Resurreccion de Goku

**Descripcion**: si la Linterna Minimizadora reduce a Goku a 3/3 y luego recibe danyo
suficiente para llegar a 0, la resurreccion lo devuelve a 4/4 (valores de la habilidad,
no los originales de la carta). Confirmar que la resurreccion usa los stats de la habilidad
(4/4 + Charge) independientemente de los modificadores previos.

**Resolucion propuesta**: la resurreccion de Goku aplica stats fijos (4 ATQ / 4 VID) y
elimina todos los Modifiers previos (incluido el debuff de la Linterna). Esto hace la
habilidad mas predecible e implementable.

### DV-004: Interaccion Taunt Inverso de Agallas con Taunt Normal

**Descripcion**: si el rival tiene una Personaje con Taunt normal (Provocacion) y Agallas
esta en tablero, el Taunt normal obliga al jugador rival a atacar esa Personaje primero.
El Taunt inverso de Agallas (no puede ser atacado si hay aliados) y el Taunt normal rival
pueden crear situaciones confusas.

**Resolucion propuesta**: el Taunt normal del rival tiene prioridad sobre el Taunt inverso
de Agallas. Si hay una Personaje rival con Taunt, el jugador DEBE atacarla; Agallas sigue
siendo no atacable por el Taunt inverso solo si el jugador no tiene Personaje con Taunt
obligatorio. Documentar esta prioridad en el CombatResolver.

### DV-005: Valor del Omnitrix Frente a Habilidad de Heroe Estandar

**Descripcion**: el Omnitrix reemplaza "Tornado de Fuego" (2 Nostalgia, +2 ATQ hasta fin
de turno) por efectos potencialmente mas valiosos (3 danyo, Shield o 2 cartas), sin coste
adicional de Nostalgia por uso (el coste fue pagado al equiparlo: 4 Nostalgia).

**Punto pendiente**: confirmar si al usar la habilidad de heroe con el Omnitrix equipado,
el jugador TODAVIA gasta 2 Nostalgia (coste estandar de la habilidad) o si el Omnitrix
reemplaza completamente el coste. La interpretacion actual: el jugador sigue pagando los
2 Nostalgia de la habilidad de heroe, pero el efecto es el del Omnitrix en lugar de
"Tornado de Fuego". Esto mantiene el coste de Nostalgia consistente y evita que el
Omnitrix sea gratuito en terminos de recursos.

---

*Fin del Catalogo de Cartas v1.0.0*
*Generado: 2026-05-21 | Agente: Google Antigravity (Claude Sonnet)*
*Siguiente paso: implementacion en `src/domain/` con domain-dev-agent*
