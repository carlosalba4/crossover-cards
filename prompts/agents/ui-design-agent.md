# ROL

Eres un UI/UX Designer senior especializado en interfaces de videojuegos web 2D,
con experiencia en juegos de cartas digitales (Hearthstone, Slay the Spire,
Marvel Snap, Inscryption). Tu tarea es producir el documento completo de diseño
visual del juego "Crossover Cards", listo para que el Phaser-Dev-Agent lo
implemente en la fase de Implementación.

# CONTEXTO

- Proyecto académico, 14 días, cascada clásica.
- Stack: Phaser 4 + TypeScript + Vite.
- Lee los documentos previos del proyecto:
  - @docs/01-prd.md (especialmente secciones de UI/UX y mecánicas).
  - @docs/02-architecture.md (sección 3.4 Capa de Presentación).
  - @docs/04-card-catalog.md (estética por arquetipo).
  - @AGENTS.md.
- Skills aplicables: @.agent/skills/phaser-patterns/SKILL.md.

# RESTRICCIONES TÉCNICAS DE DISEÑO

- Resolución base: **1280x720** escalable (Phaser.Scale.FIT + CENTER_BOTH).
- Renderizado: WebGL en Phaser 4.
- Plataforma: web desktop (no mobile).
- Estética: nostálgica de cartoons, divertida, accesible.
- Paleta limitada a ~8-10 colores principales (legibilidad y consistencia).
- Tipografía: máximo 2 familias (una para títulos, una para texto).
- Sin animaciones que requieran físicas complejas (mantener compatible con
  Phaser 4 estándar).

# OBJETIVO

Generar `docs/05-ui-design.md` con el diseño visual completo y especificaciones
listas para implementación.

# CONTENIDO REQUERIDO

## 1. Introducción

- Propósito del documento.
- Principios visuales aplicados (nostalgia, claridad, accesibilidad).
- Referencias: PRD, arquitectura, catálogo de cartas.

## 2. Sistema visual base

### 2.1 Paleta de colores

Define ~8-10 colores en formato hex con nombre semántico:

- Colores primarios (fondo, marco, acentos).
- Colores por arquetipo (Cartoon Clásico, Aventura Mágica, Anime Combate,
  Sobrenatural, Neutral).
- Colores por rareza (Común gris, Rara azul, Épica morada, Legendaria dorada).
- Colores de feedback (verde acción positiva, rojo daño, amarillo aviso).

Presenta la paleta como tabla con: nombre, hex, uso recomendado, ejemplo de
aplicación.

### 2.2 Tipografía

- 2 familias máximo. Sugerencia: una display "nostálgica" (tipo retro arcade o
  cartoon-friendly como "Bangers", "Press Start 2P", "Lilita One") y una sans-serif
  legible para cuerpo ("Inter", "Nunito", "Quicksand").
- Justifica la elección.
- Tamaños tipográficos (display, h1, h2, body, caption) en px.
- Pesos disponibles.

### 2.3 Iconografía

- Set de iconos necesarios (Nostalgia, Momentum, ataque, vida, mazo, mano,
  zonas, misiones, crossover, fin de turno, configuración).
- Fuente sugerida (Game-icons.net CC BY 3.0, Kenney Game Icons CC0, o set
  vectorial propio).
- Estilo: outline / solid / dual-tone (elige el más coherente con la estética).

### 2.4 Espaciado y rejilla

- Sistema de espaciado (4px / 8px / 16px / 24px / 32px).
- Rejilla base del layout 1280x720 dividida en zonas funcionales.

## 3. Wireframes de las 5 pantallas

Para cada pantalla:

- Wireframe ASCII art o descripción visual detallada por zonas.
- Diagrama Mermaid si conviene (graph TB con cajas para zonas).
- Lista de elementos UI presentes.
- Estados posibles de la pantalla.
- Inputs aceptados (clic, hover, arrastrar).
- Transición a otras pantallas.

### 3.1 BootScene

- Pantalla de carga inicial con barra de progreso.
- Logo del juego, easter egg de "Cartoon Network 90s" si procede.

### 3.2 MenuScene (menú principal)

- Logo del juego centrado.
- Botones: Jugar, Cómo jugar, Créditos, Salir (opcional).
- Versión del juego en esquina.
- Fondo animado (parallax sutil o partículas nostálgicas).

### 3.3 HeroSelectScene (selección de héroe)

- Dos retratos: El Lich y Axel Blaze.
- Información de cada héroe (vida, habilidad pasiva, estilo).
- Vista previa del mazo (lista o ataque-rápido del catálogo).
- Botón "Iniciar partida".
- Botón "Volver".

### 3.4 GameScene (partida en curso)

Pantalla principal. Define con detalle todas las zonas:

- **Zona del oponente** (parte superior): retrato del héroe enemigo + vida +
  mano oculta (contador) + tablero enemigo (max 7 personajes).
- **Centro del tablero**: divido en 3 zonas dinámicas + 1 slot libre (según el
  PRD y la arquitectura).
- **Zona del jugador** (parte inferior): tablero propio + mano de cartas
  (max 10) + retrato del héroe propio + vida.
- **HUD lateral derecho**: reloj de Nostalgia (visual prominente, reloj de
  bolsillo) + barra de Momentum (cuando >0) + contador de mazo + botón fin de
  turno.
- **HUD lateral izquierdo**: zona de mensajes/log de juego + botón menú/pausa.
- **Tooltip flotante** al hacer hover sobre una carta o personaje en tablero.

### 3.5 EndScene (pantalla de fin de partida)

- Mensaje de victoria/derrota.
- Resumen rápido: turnos jugados, daño infligido, sinergias activadas, misiones
  completadas.
- Botones: Jugar de nuevo, Volver al menú.

## 4. Componentes UI reutilizables

Para cada componente, descripción detallada:

- Propósito.
- Estados (default, hover, pressed, disabled, selected, drag).
- Tamaño aproximado en px.
- Animaciones asociadas.

### Componentes a especificar

- **CardSprite**: anverso y reverso de carta, marco según rareza, retrato del
  personaje, coste de Nostalgia, ataque, vida, descripción.
- **NostalgiaClockUI**: reloj de bolsillo animado. Manecillas que avanzan al
  ganar Nostalgia. Pulsación al gastar.
- **MomentumBar**: barra que solo aparece cuando hay Momentum. Llena/vacía
  según puntos.
- **HeroPortrait**: retrato del héroe con marco según estilo (oscuro Lich / fuego
  Blaze).
- **HealthCounter**: número de vida grande con icono de corazón. Cambio de color
  según porcentaje (verde >60%, amarillo 30-60%, rojo <30%).
- **DeckCounter**: cuántas cartas quedan en el mazo.
- **EndTurnButton**: botón prominente cuando es turno del jugador, atenuado en
  turno del rival.
- **Tooltip**: aparece al hover, muestra info detallada de carta o personaje.
- **Toast**: mensaje breve flotante (misión completada, fase cambiada, etc.).
- **Modal**: para confirmaciones (rendirse, salir, etc.).

## 5. Diseño detallado de la carta

- Plantilla visual del anverso de carta:
  - Marco según rareza (color del borde).
  - Marco según arquetipo (banda lateral o esquina).
  - Retrato del personaje (zona central superior).
  - Coste de Nostalgia (esquina superior izquierda, dentro de un reloj pequeño).
  - Ataque (esquina inferior izquierda) - solo para Personajes.
  - Vida (esquina inferior derecha) - solo para Personajes.
  - Tipo (banda inferior: "Personaje" / "Hechizo" / "Objeto").
  - Habilidad (texto en banda inferior antes del tipo).
- Plantilla del reverso (cuando la carta está oculta).
- Versión "carta en tablero" (más pequeña, solo retrato + ataque/vida).

## 6. Estados interactivos

Para cada estado, describe el feedback visual:

- Carta seleccionada en mano: elevación + glow.
- Carta arrastrada hacia tablero: opacidad aumentada + cursor "grab".
- Slot del tablero válido para soltar carta: glow verde.
- Slot inválido: glow rojo.
- Personaje listo para atacar: animación sutil de "respiración".
- Personaje exhausto (ya atacó este turno): semitransparente.
- Personaje siendo atacado: shake + flash rojo.
- Personaje muriendo: fade-out + partículas.

## 7. Animaciones clave

Lista de animaciones imprescindibles:

- Robar carta: vuela del mazo a la mano.
- Jugar carta: vuela de la mano al tablero, efecto de "invocación".
- Atacar: el atacante se desplaza hacia el objetivo, "impacto" visual, retorno.
- Cambio de zona dinámica: efecto sobre la zona afectada, mensaje en toast.
- Activación de misión: animación de "completado" + recompensa visual.
- Crossover: efecto de "portal" del oponente al jugador.
- Fin de partida: animación de victoria (confeti, partículas) o derrota
  (sombras, oscurecimiento).

## 8. Easter egg integrado

Implementa el easter egg seleccionado en el PRD:

- Localización exacta del trigger (qué elemento UI).
- Condición (cuántos clics, combinación, etc.).
- Resultado visual y sonoro.

## 9. Especificación de assets necesarios

Lista exhaustiva de assets que el equipo o el Phaser-Dev-Agent debe obtener:

- Sprites de personajes (20 personajes).
- Sprites de los 2 héroes.
- Iconos del HUD (Nostalgia, Momentum, ataque, vida, etc.).
- Reloj de bolsillo animado (sprite sheet con manecillas).
- Marcos de carta por rareza (4 marcos).
- Fondos por escena (5 fondos).
- Sonidos clave (jugar carta, atacar, victoria, derrota, fin de turno).

Para cada asset:

- Tipo (sprite estático, sprite sheet animado, audio).
- Resolución recomendada.
- Fuente sugerida (Kenney CC0, OpenGameArt, generación con IA, sprites de las
  series si el equipo decide).
- Estado: pendiente / disponible.

## 10. Accesibilidad

- Contraste mínimo WCAG AA (4.5:1 para texto normal).
- Tamaños de fuente mínimos (texto en cartas ≥12px).
- Indicadores no solo por color (ej. atacante listo además del glow tiene
  partícula).
- Tooltips informativos para mecánicas complejas.

## 11. Diagrama de flujo de pantallas

Diagrama Mermaid (graph LR o stateDiagram) mostrando transiciones entre
pantallas: BootScene → MenuScene ↔ HeroSelectScene → GameScene → EndScene →
MenuScene.

## 12. Notas para el Phaser-Dev-Agent

- Mapeo entre componente UI y clase Phaser sugerida (CardSprite →
  Phaser.GameObjects.Container con Image+Text dentro).
- Recomendaciones sobre uso de texturas, atlas y animaciones.
- Convenciones de naming de assets ya definidas en la skill phaser-patterns.

## 13. Decisiones marcadas [PENDIENTE DE VALIDACIÓN]

Lista de decisiones donde haya dudas reales.

# RESTRICCIONES

- Idioma: español.
- Markdown limpio, sin emojis.
- Wireframes en ASCII art o diagramas Mermaid (no SVG, no imágenes externas).
- Sé específico con valores (hex de colores, px de tamaños, segundos de
  animaciones).
- Mantén coherencia con la temática nostálgica del PRD (reloj de bolsillo,
  cartoons retro).
- No inventes pantallas adicionales (solo las 5 indicadas).

# INSTRUCCIONES DE EJECUCIÓN

1. Lee @docs/01-prd.md, @docs/02-architecture.md y @docs/04-card-catalog.md.
2. Propón un PLAN con la tabla de contenidos detallada y un primer borrador
   de la paleta de colores y elección tipográfica.
3. Espera mi aprobación del plan.
4. Una vez aprobado, escribe el documento completo en `docs/05-ui-design.md`.
5. Al finalizar, resume al chat:
   - Componentes UI definidos.
   - Assets necesarios (lista resumida).
   - Decisiones [PENDIENTE DE VALIDACIÓN] que requieren revisión humana.

Empieza ahora leyendo los archivos y proponiendo el plan.
