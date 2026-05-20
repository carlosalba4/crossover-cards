# ROL
Eres un Game Designer senior especializado en juegos de cartas coleccionables (Hearthstone,
MTG Arena, Marvel Snap). Tu tarea es realizar una refactorización quirúrgica del PRD
existente del proyecto "Crossover Cards", manteniendo intactas las secciones que NO se
indican como modificables, y reescribiendo solo las que sí.

# CONTEXTO
- El proyecto es académico, 14 días, metodología cascada clásica.
- Stack: Phaser 4 + TypeScript + Vite.
- El PRD actual está en `docs/01-prd.md`. Léelo entero antes de proponer cambios.
- El concepto del juego es un crossover absurdo de personajes de series de animación
  cartoon y anime que se enfrentan en partidas 1 vs 1 por turnos.
- Tono: humorístico, casual, nostálgico, autoconsciente del absurdo del crossover.
- La fantasía narrativa es: "El multiverso de los dibujos animados ha colapsado y
  personajes de distintas series, sin nada que ver entre sí, se enfrentan en duelos
  de cartas". El humor random es parte del encanto.

# ALCANCE DE LOS CAMBIOS

## Cambios obligatorios (modificar SOLO estas secciones del PRD)

### CAMBIO 1 — Título del juego
- **Antes**: "Crossover Cards: El Juego de Cartas Definitivo".
- **Después**: "Crossover Cards" (a secas).
- Actualizar el título en TODA la cabecera del PRD, secciones de portada, glosario,
  y cualquier mención.

### CAMBIO 2 — Recurso principal renombrado
- **Antes**: el recurso del juego se llama "Maná" (1 → 10 puntos, +1 por turno).
- **Después**: el recurso se llama **"Nostalgia"** y se representa visualmente con
  un **reloj de bolsillo antiguo (tipo reloj victoriano de cadena)** en la UI.
  El mecanismo es idéntico al maná de Hearthstone: empieza en 1, sube +1 por
  turno hasta un máximo de 10, se regenera al inicio de cada turno propio.
- Reemplaza todas las menciones a "maná" por "Nostalgia" en todo el PRD.
- Mantén el "Momentum" (mecánica de comeback) tal como está, NO renombrar.
- Justificación narrativa: el juego trata sobre personajes nostálgicos de cartoons,
  así que el recurso es el sentimiento nostálgico que invocan.

### CAMBIO 3 — Héroes jugables (sustituir completamente los 2 héroes actuales)

Eliminar los héroes actuales del PRD ("El Flojo" y "El Aventurero" o como se llamen).
Sustituir por estos dos:

#### Héroe 1: **El Lich**
- Origen: villano de la serie "Hora de Aventuras" (Cartoon Network). Es una entidad
  no-muerta, esquelética, oscura, antiquísima. Su poder es manipular la vida y la
  muerte, drenar energía vital y destruir mundos. Habla con voz gélida y profunda.
  En el juego se le representa como un **mago oscuro nigromante**.
- Vida: 30.
- Habilidad pasiva genérica de mago: **"Hechizo Ancestral"** — coste 2 Nostalgia.
  Inflige 2 puntos de daño a un objetivo enemigo (héroe o criatura) elegido por el
  jugador. Una vez por turno.
- Estética: tonos morados, verdes oscuros, calaveras.

#### Héroe 2: **Axel Blaze**
- Origen: protagonista delantero del anime/videojuego "Inazuma Eleven". Es un
  futbolista intenso, serio, con cabello blanco en pinchos. Su técnica firma es
  "Tornado de Fuego". En el juego se le representa como un **luchador físico
  ofensivo**.
- Vida: 30.
- Habilidad pasiva genérica de luchador: **"Disparo Llamarada"** — coste 2 Nostalgia.
  Otorga +2 de ataque a una criatura aliada hasta el final del turno. Una vez por
  turno.
- Estética: tonos rojos, naranjas, llamas.

### CAMBIO 4 — Catálogo de cartas (sustituir completamente)

**Elimina TODAS las cartas actuales del PRD** (todas las 20 cartas iniciales) y
reemplázalas por las 20 nuevas que aparecen a continuación. Mantén el sistema de
rareza (Común, Rara, Épica, Legendaria) y el coste de Nostalgia razonable para
cada una (decide tú los valores según el poder del efecto).

Para cada carta, diseña una habilidad/efecto **inspirado en su trasfondo real**
(descrito abajo). Si el trasfondo no encaja con una mecánica de juego de cartas
viable, usa una habilidad genérica.

#### MAZO DE EL LICH (10 cartas: 6 criaturas + 2 hechizos + 2 objetos)

**1. Pops el Gentil (criatura, Común/Rara)**
- Trasfondo: anciano caballeroso y bondadoso de Regular Show, con cabeza enorme y
  cuerpo diminuto, infinitamente paciente y educado. Tiene poderes ocultos que solo
  aparecen cuando se enfada.
- Sugerencia de habilidad: stats bajos pero buena habilidad de soporte/curación o
  un efecto sorpresa al morir ("deathrattle").

**2. Darwin Watterson (criatura, Común)**
- Trasfondo: pez naranja con piernas, hermano adoptivo de Gumball. Inocente, leal,
  positivo. A veces tiene rabietas explosivas.
- Sugerencia de habilidad: criatura básica con alguna habilidad de "compañerismo"
  (buff cuando hay otro aliado en el tablero).

**3. Chowder (criatura, Común)**
- Trasfondo: protagonista de la serie homónima, un cocinero pequeño con orejas de
  gato. Glotón, torpe, aprendiz de chef. Siempre tiene hambre.
- Sugerencia de habilidad: efecto relacionado con consumir o "comerse" algo del
  tablero (descartar carta enemiga, devorar criatura debilitada, etc.).

**4. Patricio Estrella (criatura, Común)**
- Trasfondo: estrella de mar rosa, mejor amigo de Bob Esponja. Extremadamente tonto
  pero leal. Vive bajo una roca en Fondo de Bikini.
- Sugerencia de habilidad: stats decentes con habilidad "tonta" — efecto aleatorio
  (positivo o negativo).

**5. Rigby (criatura, Rara)**
- Trasfondo: mapache de Regular Show, vago, irresponsable, mejor amigo de Mordecai.
  Holgazán pero a veces tiene golpes de genio.
- Sugerencia de habilidad: efecto "vago" — coste bajo, ataque alto, pero solo puede
  atacar 1 turno sí 1 turno no, o similar.

**6. Jake el Perro (criatura, Épica)**
- Trasfondo: perro mágico de Hora de Aventuras, hermano adoptivo de Finn. Puede
  estirarse, cambiar de forma y tamaño a voluntad. Carismático, padre de familia.
- Sugerencia de habilidad: cambio de stats dinámico — al jugarlo elige entre 2 stats
  diferentes (alto ataque/baja vida o baja ataque/alta vida).

**7. Superbocata (hechizo, Rara)**
- Trasfondo: sándwich legendario que prepara Jake en Hora de Aventuras, capaz de
  hacer llorar de placer a quien lo come.
- Sugerencia de habilidad: cura al héroe propio una cantidad significativa de vida
  (5-7 puntos), o regenera todas las criaturas aliadas a su vida máxima.

**8. Burger Cangreburger (hechizo, Común/Rara)**
- Trasfondo: hamburguesa secreta del Crustáceo Crujiente de Bob Esponja, la receta
  más codiciada de Fondo de Bikini.
- Sugerencia de habilidad: cura una cantidad menor o roba 1 carta + cura 2.

**9. El Poder (objeto, Épica)**
- Trasfondo: teclado electrónico de Regular Show que Mordecai y Rigby encuentran. Cuando
  es tocado mientras se canta lo que se quiere eso mismo se hace realidad.
- Sugerencia de habilidad: arma equipable al héroe que le da +3 ataque durante 2
  turnos. O inflige daño AoE al activarse.

**10. Espada de Sangre de Demonio (objeto, Legendaria)**
- Trasfondo: espada legendaria de la familia de Jake en Hora de Aventuras, forjada
  con sangre de demonio. Extremadamente poderosa pero corrupta.
- Sugerencia de habilidad: arma equipable que da gran bonus de ataque (+4/+5) pero
  inflige 1 daño al propio héroe cada turno que esté equipada.

#### MAZO DE AXEL BLAZE (10 cartas: 6 criaturas + 2 hechizos + 2 objetos)

**11. Goku (criatura, Legendaria)**
- Trasfondo: saiyan protagonista de Dragon Ball. Guerrero supremo, puede transformarse
  en Super Saiyan y aumentar su poder masivamente. Inocente y siempre buscando
  enemigos más fuertes.
- Sugerencia de habilidad: criatura con stats altos. Al recibir daño mortal,
  "transforma" — vuelve al tablero con stats mayores (Super Saiyan).

**12. Marceline (criatura, Épica)**
- Trasfondo: vampira reina de Hora de Aventuras, rockera, mil años, puede volar,
  flotar y absorber el color rojo de las cosas. Inmortal pero tiene corazón.
- Sugerencia de habilidad: drenaje de vida — al atacar a una criatura enemiga,
  el héroe propio recupera tantos puntos de vida como daño infligido.

**13. Fantasma Chocala (criatura, Rara)**
- Trasfondo: fantasma flotante de Regular Show, compañero de trabajo en el parque.
  Optimista, infantil, dice "¡Choca esos cinco!" constantemente.
- Sugerencia de habilidad: criatura etérea — no puede ser objetivo de hechizos
  enemigos durante 1 turno, o concede buff al chocar los cinco con otra criatura
  aliada (+1/+1 a un aliado al entrar).

**14. Diamantino (criatura, Rara)**
- Trasfondo: alienígena de Ben 10 que Ben puede convertirse en él con el Omnitrix.
  Cuerpo de diamante, casi indestructible, puede disparar fragmentos cristalinos.
- Sugerencia de habilidad: alta vida y "Escudo Cristalino" — la primera vez que
  reciba daño, lo reduce a la mitad (similar a "Divine Shield" pero parcial).

**15. Chum Chum (criatura, Común)**
- Trasfondo: niño pequeño y energético, mejor amigo del protagonista Fanboy en la
  serie "Fanboy & Chum Chum". Hiperactivo, ingenuo, leal.
- Sugerencia de habilidad: stats bajos pero coste 1 — criatura barata para activar
  sinergias tribales.

**16. Agallas el Perro Cobarde (criatura, Rara)**
- Trasfondo: perro rosa muy asustadizo de la serie "Agallas, el Perro Cobarde".
  A pesar de su miedo extremo, siempre acaba salvando a sus dueños de horrores
  sobrenaturales.
- Sugerencia de habilidad: efecto "Cobardía" — no puede ser atacado mientras haya
  otra criatura aliada en el tablero (taunt inverso). Cuando se queda solo, se
  envalentona y gana +2 ataque.

**17. Pedo Poderoso (hechizo, Épica)**
- Trasfondo: tipo "Tito Yayo" (Uncle Grandpa) tiene un tigre realista volador
  gigante llamado "Tigre Realista" que vuela soltando arcoíris. El "Pedo Poderoso"
  es ese arcoíris explosivo que sale del tigre al volar, absurdo y devastador.
- Sugerencia de habilidad: AoE — inflige 2 puntos de daño a todas las criaturas
  enemigas en el tablero. Efecto visual: arcoíris explosivo.

**18. Linterna Minimizadora (hechizo, Rara)**
- Trasfondo: gadget de Doraemon que reduce el tamaño de cualquier objeto/persona
  al que apunte. Doraemon la usa para entrar en sitios pequeños o esconder cosas.
- Sugerencia de habilidad: reduce los stats de una criatura enemiga a la mitad
  (redondeo hacia abajo) hasta el final de la partida.

**19. Bola de Dragón (objeto, Legendaria)**
- Trasfondo: las 7 esferas mágicas de Dragon Ball. Reunidas las 7, invocan a Shenlong
  que concede un deseo. Doradas, con estrellas rojas dentro.
- Sugerencia de habilidad: efecto único legendario — al jugarse, roba 3 cartas del
  mazo. O bien: efecto "concede un deseo" — el jugador elige entre 3 efectos
  posibles (curar 5 / dañar 5 / ganar 3 Nostalgia).

**20. Omnitrix (objeto, Legendaria)**
- Trasfondo: reloj alienígena en la muñeca de Ben 10 que le permite transformarse
  en distintas formas alienígenas con poderes únicos. Pieza tecnológica suprema.
- Sugerencia de habilidad: arma/objeto equipable al héroe — al activarse,
  transforma al héroe durante 1 turno otorgándole una habilidad aleatoria entre
  un pool de 3 (ataque, escudo, robar carta).

### CAMBIO 5 — Arquetipos (sustituir completamente los 4 actuales)

Elimina los 4 arquetipos actuales (Floja, Aventura, Submarino, Deportiva). Diseña
**4 arquetipos nuevos** que cubran de forma coherente las 20 cartas del catálogo
nuevo. Justifica brevemente por qué has elegido cada arquetipo y qué cartas pertenecen
a cuál.

Propuesta de partida (puedes ajustarla según tu criterio):
- **Cartoon Clásico** (humor, vagancia, absurdo): Pops, Rigby, Patricio, Chowder,
  Darwin, Chum Chum.
- **Aventura Mágica** (Hora de Aventuras + mística): Jake, Marceline, El Lich
  (héroe).
- **Anime Combate** (intensidad, poder, transformaciones): Goku, Axel Blaze (héroe),
  Diamantino.
- **Sobrenatural** (fantasmas, cobardía, horror cómico): Fantasma Chocala, Agallas.

Si encuentras un reparto más equilibrado para sinergias de juego, propón alternativa.
Cada arquetipo debe tener entre 3 y 6 criaturas para que la mecánica M1 (Sinergia
Tribal) funcione.

### CAMBIO 6 — Zonas/entornos dinámicos (genéricas)

Sustituye las zonas específicas actuales por **zonas genéricas temáticas** que
funcionen sin necesidad de localizaciones concretas de una serie. Diseña 3-4 zonas:

- **Zona Caótica** — buff aleatorio al inicio del turno (+1 ataque o +1 vida random).
- **Zona Mágica** — los hechizos cuestan 1 Nostalgia menos en esta zona.
- **Zona de Combate** — las criaturas en esta zona ganan +1 ataque pero -1 vida.
- **Zona Misteriosa** — las criaturas en esta zona ganan "no ser objetivo" durante
  ese turno.

Mantén la mecánica M3 tal como está, solo cambian los nombres y efectos de las zonas.

### CAMBIO 7 — Misiones (genéricas)

Sustituye las misiones actuales por **misiones genéricas** que no dependan de
arquetipos específicos. Propuesta:

- **Misión 1**: "Invoca 5 criaturas en total durante la partida". Recompensa:
  invoca una criatura legendaria token 5/5.
- **Misión 2**: "Inflige 15 puntos de daño con criaturas". Recompensa: tu héroe
  gana +5 vida.
- **Misión 3**: "Sobrevive 7 turnos". Recompensa: roba 3 cartas y ganas 3 Nostalgia.

Puedes mejorar la lista pero mantenla simple y no dependiente del catálogo de cartas.

### CAMBIO 8 — Easter egg con coherencia nostálgica

Mantén la mecánica del easter egg pero alinéala con la temática nostálgica.
Propuestas (elige una y descríbela en el PRD):

- Hacer clic 10 veces en el reloj de Nostalgia del HUD muestra una animación del
  logo "Cartoon Network 90s" o una sintonía corta nostálgica.
- Hacer clic en un elemento concreto del tablero (a tu elección) muestra una
  frase guiño a los autores del proyecto.
- Combinación de cartas concreta que dispare una animación humorística especial.

## Secciones que NO debes tocar

- Resumen ejecutivo (solo cambiar título y "maná→Nostalgia" donde aparezca).
- Sistema de turnos (Robo → Principal → Combate → Fin).
- Mecánicas M1, M2, M4, M5 (solo ajustar las menciones a "maná" → "Nostalgia" y
  los arquetipos a los nuevos).
- IA del oponente (Fácil/Medio) — mantén el comportamiento, solo si menciona
  cartas concretas adapta los nombres.
- Requisitos no funcionales — no cambiar.
- Casos de uso CU-01 a CU-08 — adaptar solo nombres de héroes/cartas si aparecen.
- Riesgos identificados — mantener.
- Plataforma, resolución, tono general.

# INSTRUCCIONES DE EJECUCIÓN

1. **Primero**: lee `docs/01-prd.md` completo.
2. **Segundo**: produce un **PLAN DE CAMBIOS** en una tabla con:
   - Columna A: sección del PRD afectada.
   - Columna B: tipo de cambio (Reemplazar / Modificar parcial / Renombrar).
   - Columna C: resumen breve del cambio.
3. **Espera mi aprobación** del plan antes de ejecutar.
4. Una vez aprobado, **aplica los cambios directamente al archivo `docs/01-prd.md`**
   sobreescribiéndolo. No generes un archivo nuevo aparte.
5. **NO regeneres** las secciones que no se indican como modificables.
6. Mantén el estilo Markdown, tablas, numeración, glosario y estructura general
   del PRD original.

# RESTRICCIONES
- No inventes mecánicas más allá de los cambios indicados.
- Si tienes dudas sobre alguna habilidad de carta, **propón 2-3 alternativas** y
  marca con [PENDIENTE DE VALIDACIÓN].
- Todas las habilidades deben ser viables técnicamente con Phaser y un dominio
  de juego sencillo (sin animaciones imposibles, sin físicas complejas).
- Mantén el balance: si una carta nueva es muy fuerte, sube su coste de Nostalgia
  o su rareza.
- Idioma del PRD: español.
- Sin emojis.

# ENTREGABLES ESPERADOS

Tras tu aprobación del plan:
- `docs/01-prd.md` actualizado con todos los cambios aplicados.
- Resumen final al chat con la lista de secciones modificadas y cualquier
  decisión [PENDIENTE DE VALIDACIÓN] que necesite revisión humana.

Empieza ahora leyendo el PRD y proponiendo el plan de cambios.