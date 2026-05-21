---
description: "Refactoriza el PRD aplicando cambios quirúrgicos del universo Crossover Cards: Nostalgia, héroes El Lich y Axel Blaze, 20 cartas nuevas, 4 arquetipos, zonas y misiones genéricas, easter egg nostálgico."
---

# ROL
Game Designer senior especializado en juegos de cartas (Hearthstone, MTG Arena,
Marvel Snap). Realiza una refactorización quirúrgica del PRD existente del
proyecto "Crossover Cards", manteniendo intactas las secciones que NO se
indican como modificables y reescribiendo solo las que sí.

# CONTEXTO
- Proyecto académico, 14 días, cascada clásica.
- Stack: Phaser 4 + TypeScript + Vite.
- PRD actual en @docs/01-prd.md (léelo antes de proponer cambios).
- Concepto: crossover absurdo de cartoons y anime que se enfrentan en partidas 1 vs 1.
- Tono: humorístico, casual, nostálgico, autoconsciente del absurdo.
- Fantasía: "El multiverso de los dibujos animados ha colapsado y personajes
  de distintas series se enfrentan en duelos de cartas". El humor random es parte
  del encanto.

# ALCANCE DE LOS CAMBIOS

## Cambios obligatorios

### 1. Título
- Antes: "Crossover Cards: El Juego de Cartas Definitivo".
- Después: "Crossover Cards" (a secas).
- Actualizar en todo el PRD.

### 2. Recurso "Maná" → "Nostalgia"
- Renombrar todas las menciones de "maná" a "Nostalgia" en TODO el PRD.
- Mecánica idéntica (1 → 10, +1 por turno, restaura al inicio del turno propio).
- Representación visual: reloj de bolsillo antiguo (victoriano, de cadena).
- Justificación narrativa: personajes nostálgicos de cartoons.
- NO renombrar "Momentum" (mecánica de comeback).

### 3. Héroes (sustituir los 2 actuales)

#### El Lich (mago oscuro nigromante)
- Origen: villano de Hora de Aventuras. Entidad no-muerta, esquelética, oscura.
- Vida: 30. Estética: morados, verdes oscuros, calaveras.
- Habilidad pasiva "Hechizo Ancestral" (2 Nostalgia, 1/turno): 2 daño a objetivo.

#### Axel Blaze (luchador físico ofensivo)
- Origen: delantero de Inazuma Eleven. Intenso, técnica "Tornado de Fuego".
- Vida: 30. Estética: rojos, naranjas, llamas.
- Habilidad pasiva "Disparo Llamarada" (2 Nostalgia, 1/turno): +2 ataque a aliado
  hasta fin de turno.

### 4. Catálogo de cartas (sustituir las 20)
Mantén el sistema de rareza (Común, Rara, Épica, Legendaria) y coste de Nostalgia
razonable (decide tú según el poder). Diseña habilidad inspirada en el trasfondo
de cada carta; si el trasfondo no encaja, usa habilidad genérica.

#### Mazo de El Lich (10 cartas)
1. Pops el Gentil (Regular Show, anciano caballeroso con poderes ocultos al
   enfadarse). Criatura Común/Rara. Sugerencia: soporte/curación o deathrattle
   sorpresa.
2. Darwin Watterson (Gumball, pez naranja, inocente y leal). Criatura Común.
   Sugerencia: buff con otro aliado en tablero.
3. Chowder (Chowder, cocinero pequeño glotón). Criatura Común. Sugerencia:
   "comer" cartas/criaturas.
4. Patricio Estrella (Bob Esponja, estrella de mar tonta y leal). Criatura Común.
   Sugerencia: efecto aleatorio "tonto" (positivo/negativo).
5. Rigby (Regular Show, mapache vago e irresponsable). Criatura Rara.
   Sugerencia: coste bajo, ataque alto, ataca turno sí turno no.
6. Jake el Perro (Hora de Aventuras, perro mágico que cambia de forma).
   Criatura Épica. Sugerencia: elegir stats al jugarlo (alto atk/baja vida o
   bajo atk/alta vida).
7. Superbocata (sándwich legendario de Jake que hace llorar de placer).
   Hechizo Raro. Sugerencia: curar 5-7 al héroe propio o regenerar criaturas
   aliadas.
8. Burger Cangreburger (hamburguesa secreta del Crustáceo Crujiente).
   Hechizo Común/Raro. Sugerencia: curar 3 + robar 1 carta.
9. El Poder (teclado mágico de Regular Show: lo que se cante mientras se toca
   se hace realidad). Objeto Épico. Sugerencia: arma equipable +3 ataque durante
   2 turnos o daño AoE al activar.
10. Espada de Sangre de Demonio (espada de la familia de Jake, forjada con
    sangre de demonio, poderosa pero corrupta). Objeto Legendario. Sugerencia:
    +4/+5 ataque equipable pero 1 daño al héroe propio cada turno.

#### Mazo de Axel Blaze (10 cartas)
11. Goku (Dragon Ball, saiyan, se transforma en Super Saiyan). Criatura
    Legendaria. Sugerencia: stats altos; al morir, vuelve transformado con
    stats mayores.
12. Marceline (Hora de Aventuras, vampira reina, rockera, absorbe color rojo).
    Criatura Épica. Sugerencia: drenaje de vida al atacar criaturas.
13. Fantasma Chocala (Regular Show, fantasma optimista, "¡choca esos cinco!").
    Criatura Rara. Sugerencia: etéreo (no objetivo de hechizos 1 turno) o
    +1/+1 a un aliado al entrar.
14. Diamantino (Ben 10, alienígena de diamante, casi indestructible).
    Criatura Rara. Sugerencia: alta vida + "Escudo Cristalino" (primer daño
    recibido se reduce a la mitad).
15. Chum Chum (Fanboy & Chum Chum, niño hiperactivo y leal). Criatura Común.
    Sugerencia: stats bajos, coste 1, sirve para activar sinergias tribales.
16. Agallas el Perro Cobarde (perro asustadizo que acaba salvando a sus dueños).
    Criatura Rara. Sugerencia: "Cobardía" — no puede ser atacado si hay otro
    aliado en tablero; cuando se queda solo, +2 ataque.
17. Pedo Poderoso (Uncle Grandpa, arcoíris explosivo del Tigre Realista volador).
    Hechizo Épico. Sugerencia: AoE 2 daño a todas las criaturas enemigas.
    Efecto visual: arcoíris explosivo.
18. Linterna Minimizadora (Doraemon, gadget que reduce el tamaño de cualquier
    objeto). Hechizo Raro. Sugerencia: reduce a la mitad los stats de una
    criatura enemiga (redondeo abajo) hasta fin de partida.
19. Bola de Dragón (Dragon Ball, 7 esferas que invocan a Shenlong para conceder
    un deseo). Objeto Legendario. Sugerencia: robar 3 cartas; o "concede deseo":
    elegir entre curar 5, dañar 5, o ganar 3 Nostalgia.
20. Omnitrix (Ben 10, reloj alienígena que transforma a Ben). Objeto Legendario.
    Sugerencia: equipable; al activar, transforma al héroe 1 turno otorgándole
    habilidad aleatoria entre 3 (ataque, escudo, robar carta).

### 5. Arquetipos (sustituir los 4 actuales)
Elimina Floja, Aventura, Submarino, Deportiva. Diseña 4 nuevos coherentes con el
catálogo. Cada arquetipo entre 3 y 6 criaturas para que la sinergia tribal (M1)
funcione. Justifica brevemente por qué cada uno y qué cartas incluye.

Propuesta de partida (puedes ajustar):
- **Cartoon Clásico** (humor, vagancia, absurdo): Pops, Rigby, Patricio, Chowder,
  Darwin, Chum Chum.
- **Aventura Mágica** (Hora de Aventuras + mística): Jake, Marceline, El Lich (héroe).
- **Anime Combate** (intensidad, transformaciones): Goku, Axel Blaze (héroe),
  Diamantino.
- **Sobrenatural** (fantasmas, horror cómico): Fantasma Chocala, Agallas.

### 6. Zonas dinámicas (genéricas)
Sustituye las zonas específicas. Diseña 3-4 zonas genéricas. Mantén la mecánica
M3 (cada 3 turnos cambia una zona). Propuesta:
- **Zona Caótica**: buff aleatorio al inicio del turno (+1 ataque o +1 vida random).
- **Zona Mágica**: hechizos cuestan 1 Nostalgia menos.
- **Zona de Combate**: criaturas ganan +1 ataque pero -1 vida.
- **Zona Misteriosa**: criaturas no pueden ser objetivo durante ese turno.

### 7. Misiones (genéricas, no dependientes de arquetipos)
Propuesta:
- Invoca 5 criaturas → invoca token legendario 5/5.
- Inflige 15 daño con criaturas → +5 vida al héroe.
- Sobrevive 7 turnos → roba 3 cartas y gana 3 Nostalgia.

### 8. Easter egg (coherencia nostálgica)
Elige una y descríbela en el PRD:
- 10 clics en el reloj de Nostalgia → animación logo Cartoon Network 90s o
  sintonía corta nostálgica.
- Clic en elemento concreto del tablero → frase guiño a los autores.
- Combinación de cartas concreta → animación humorística especial.

## Secciones que NO debes tocar
- Resumen ejecutivo (solo título y maná→Nostalgia donde aparezca).
- Sistema de turnos (Robo → Principal → Combate → Fin).
- Mecánicas M1, M2, M4, M5 (solo ajustar maná→Nostalgia y arquetipos a los nuevos).
- IA del oponente (Fácil/Medio): mantén comportamiento; solo si menciona cartas
  concretas, adapta nombres.
- Requisitos no funcionales: no cambiar.
- Casos de uso CU-01 a CU-08: solo adaptar nombres de héroes/cartas si aparecen.
- Riesgos identificados: mantener.
- Plataforma, resolución, tono general.

# INSTRUCCIONES DE EJECUCIÓN
1. Lee @docs/01-prd.md completo.
2. Propón un PLAN DE CAMBIOS en tabla (sección | tipo de cambio | resumen).
3. Espera mi aprobación del plan.
4. Aplica los cambios directamente en `docs/01-prd.md` (sobreescribir, no archivo nuevo).
5. NO regeneres secciones no modificables.
6. Mantén estilo Markdown, tablas, numeración, glosario y estructura general.

# RESTRICCIONES
- No inventes mecánicas adicionales.
- Si dudas sobre alguna habilidad, propón 2-3 alternativas marcadas [PENDIENTE DE VALIDACIÓN].
- Habilidades viables técnicamente con Phaser (sin físicas complejas).
- Mantén el balance: carta fuerte → mayor coste o mayor rareza.
- Idioma: español. Sin emojis.

# ENTREGABLES ESPERADOS
- `docs/01-prd.md` actualizado con todos los cambios.
- Resumen final al chat con secciones modificadas y decisiones
  [PENDIENTE DE VALIDACIÓN].

Empieza ahora leyendo el PRD y proponiendo el plan.