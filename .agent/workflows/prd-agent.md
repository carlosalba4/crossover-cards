---
description: Genera el Product Requirements Document completo del juego: alcance MVP, mecánicas innovadoras, sistema de cartas, héroes, IA, RFs, RNFs, casos de uso en Cockburn, criterios Given/When/Then y riesgos.
---

# ROL
Eres un Product Manager senior especializado en videojuegos, con experiencia en juegos
de cartas coleccionables digitales (Hearthstone, MTG Arena, Legends of Runeterra,
Marvel Snap). Tu tarea es redactar un Product Requirements Document (PRD) completo,
profesional y exhaustivo para el videojuego descrito a continuación. El PRD será el
entregable de la fase de Análisis de Requisitos de un proyecto académico siguiendo
la metodología en cascada clásica.

# CONTEXTO DEL PROYECTO
- Proyecto académico de la asignatura "Desarrollo con IA".
- Equipo: 2 personas.
- Duración total: 14 días naturales.
- Metodología: Cascada clásica (Análisis → Diseño → Implementación → Pruebas → Despliegue).
- Stack técnico: Phaser 4 (TypeScript) + Phaser-Vite + Vitest.
- IDE/Asistente: Google Antigravity + opencode con Ollama local (Qwen2.5-Coder, Qwen3).
- Restricción: NO se permite usar modelos de pago. Solo modelos gratuitos o locales.
- El profesor valorará especialmente: documentación de interacciones con IA, decisiones
  de agentes/flujos/skills/rules, calidad del código (SOLID, patrones, arquitectura),
  funcionalidades implementadas y calidad final.

# CONCEPTO DEL JUEGO

## Pitch
Juego de cartas estratégico por turnos 1 vs 1 (jugador vs IA) inspirado en Hearthstone,
ambientado en un universo crossover donde personajes icónicos de series de animación
(Regular Show, Hora de Aventuras, Bob Esponja, Inazuma Eleven, etc.) se enfrentan en
combates de cartas. Cada héroe tiene su mazo temático y sus mecánicas.

## Fantasía y tono
Casual, divertido, colorido, con humor. Inspirado estéticamente en cartoons modernos.
Diálogos cortos y memorables al jugar cartas.

## Plataforma
Web (navegador desktop). Resolución base 1280x720 escalable. WebGL.

# ALCANCE — MVP (must-have)
1. Partida 1 vs 1: Jugador vs IA.
2. 2 héroes jugables con habilidad pasiva única.
3. 20 cartas iniciales repartidas entre los dos mazos preconstruidos.
4. Sistema de turnos con fases: Robo → Principal → Combate → Fin.
5. Sistema de maná creciente (1 → 10 puntos, +1 por turno).
6. Tablero con máximo 7 criaturas por lado, mano máxima 10 cartas, mazo de 30 cartas.
7. Tipos de carta: Criaturas, Hechizos, Objetos modificadores.
8. Sistema de rareza: Común, Rara, Épica, Legendaria.
9. IA del rival con dos niveles: Fácil (greedy) y Medio (prioriza amenazas).
10. Tablero animado con al menos un easter egg oculto.
11. Zonas/entornos del tablero que cambian cada X turnos y otorgan buffs.
12. UI completa: menú principal, selección de héroe, partida, pantalla de victoria/derrota.

# MECÁNICAS INNOVADORAS (todas obligatorias en MVP)

## M1 — Sinergia tribal
Las cartas pertenecen a "arquetipos" (Floja, Aventura, Submarino, Deportiva). Jugar 2+
criaturas del mismo arquetipo en el tablero activa bonus en cadena (ej: +1 ataque a
todas las del arquetipo por cada aliada del mismo tipo).

## M2 — Momentum (comeback mechanic)
Cuando un jugador baja del 50% de vida, gana 1 punto de Momentum por turno. El Momentum
se puede gastar como maná adicional (1 Momentum = 1 maná extra ese turno) o acumular
para activar cartas "Furia" que solo se pueden jugar con Momentum gastado.

## M3 — Zonas/Entornos dinámicos
El tablero está dividido en 3 carriles o zonas. Cada 3 turnos, una de las zonas se
transforma (ej: "Bosque Mágico", "Estadio", "Cocina Krusty"). Las criaturas presentes
en esa zona reciben buffs/debuffs temáticos mientras la zona esté activa.

## M4 — Misiones (Quests)
Cartas especiales que el jugador puede colocar al inicio del turno por 0 maná. La misión
describe una condición (ej: "Invoca 5 criaturas del arquetipo Aventura"). Al cumplirse,
otorga una recompensa fuerte (carta legendaria, daño masivo, robo extra).

## M5 — Aliado invitado
Una vez por partida, cada jugador puede activar "Crossover": roba 1 carta aleatoria del
mazo del oponente y la añade a su mano. Refuerza la fantasía de universo compartido y
crea momentos imprevisibles.

# SISTEMA DE CARTAS

## Atributos comunes
- ID único
- Nombre
- Tipo (Criatura / Hechizo / Objeto)
- Arquetipo (Floja / Aventura / Submarino / Deportiva / Neutral)
- Coste de maná
- Rareza (Común / Rara / Épica / Legendaria)
- Descripción del efecto
- Sprite/Imagen
- Texto de saludo al jugar

## Criaturas (atributos adicionales)
- Ataque
- Vida
- Habilidades especiales (taunt, charge, divine shield, deathrattle, battlecry, etc.)

## Hechizos
- Efecto inmediato (daño, curación, robo, buff, debuff, AoE)

## Objetos modificadores
- Se equipan al héroe o a una criatura aliada
- Modifican stats o conceden habilidades
- Pueden tener durabilidad (X usos)

## Rareza (impacto en gameplay y visual)
- Común (gris): efectos simples
- Rara (azul): efectos con condiciones
- Épica (morada): efectos potentes situacionales
- Legendaria (dorada): efectos únicos, máximo 1 copia por mazo, animación especial

# HÉROES INICIALES (sugerencia, refinable)

## Héroe 1: "El Flojo" (arquetipo Floja, inspirado en Mordecai/Rigby)
- Vida: 30
- Habilidad pasiva (1 maná): "Pereza Estratégica" — Roba 1 carta y descarta 1 carta
  aleatoria de tu mano.

## Héroe 2: "El Aventurero" (arquetipo Aventura, inspirado en Finn/Jake)
- Vida: 30
- Habilidad pasiva (2 maná): "Combo de Aventura" — Inflige 1 daño. Si tienes una
  criatura "Aventura" en el tablero, inflige 2 daño en su lugar.

# EASTER EGG DEL TABLERO
Diseña al menos un easter egg interactivo oculto: por ejemplo, hacer clic 10 veces en
un elemento concreto del fondo desbloquea una animación especial, cambia la música, o
muestra un guiño a los autores. Sé creativo.

# IA DEL OPONENTE

## Nivel Fácil ("Greedy")
- Juega siempre la carta de mayor coste que pueda permitirse.
- Ataca al héroe enemigo si puede; si no, a la criatura con menos vida.
- No usa hechizos defensivos.

## Nivel Medio ("Threat-aware")
- Evalúa amenazas en el tablero (criaturas con ataque ≥ 4 o efectos peligrosos).
- Prioriza eliminar amenazas antes de atacar al héroe.
- Usa hechizos defensivos cuando su vida baja del 40%.
- Aprovecha sinergias tribales si tiene 2+ cartas del mismo arquetipo en mano.

# REQUISITOS FUNCIONALES (RF)
Lista numerada con identificador único (RF-001, RF-002, ...) cubriendo:
- Inicio de partida y configuración inicial.
- Sistema de turnos.
- Robo de cartas.
- Jugado de cartas (criaturas, hechizos, objetos).
- Sistema de combate.
- Sistema de maná y Momentum.
- Activación de mecánicas (sinergia, zonas, misiones, crossover).
- Detección de fin de partida (victoria/derrota).
- Menú principal, selección de héroe, pantalla de fin.

Para cada RF: identificador, descripción, actor, precondición, flujo principal,
postcondición, prioridad (Must/Should/Could).

# REQUISITOS NO FUNCIONALES (RNF)
- Rendimiento: 60 FPS en navegador moderno.
- Compatibilidad: Chrome, Firefox, Edge versiones recientes.
- Usabilidad: tooltips sobre cartas, indicador visual de turno, animaciones claras.
- Accesibilidad: contraste suficiente, tamaño de fuente legible.
- Internacionalización: textos centralizados en archivos de idioma (mínimo ES).
- Modularidad: separación dominio / presentación / infraestructura.
- Testabilidad: lógica de dominio testeable sin Phaser.
- Persistencia: progreso local (localStorage) opcional.

# CASOS DE USO PRINCIPALES
Describe en formato Cockburn al menos:
- CU-01: Iniciar partida nueva
- CU-02: Jugar una criatura
- CU-03: Lanzar un hechizo
- CU-04: Atacar con una criatura
- CU-05: Activar habilidad de héroe
- CU-06: Activar mecánica Crossover
- CU-07: Completar una misión
- CU-08: Terminar partida

Cada uno con: actor, precondición, flujo principal numerado, flujos alternativos,
postcondición.

# CRITERIOS DE ACEPTACIÓN MEDIBLES
Para cada mecánica innovadora (M1-M5), define al menos 3 criterios de aceptación en
formato Given/When/Then.

# RIESGOS IDENTIFICADOS
Lista de 5-8 riesgos del proyecto con: descripción, probabilidad, impacto, plan de
mitigación.

# GLOSARIO
Términos clave del dominio del juego con definición clara y concisa.

# FORMATO DE SALIDA REQUERIDO
- Documento Markdown limpio, jerarquizado con encabezados.
- Numeración consistente.
- Tablas para cartas iniciales, RFs y RNFs.
- Sin emoji.
- Tono profesional pero accesible.
- Apto para incluir tal cual como capítulo de la memoria PDF final.
- Guardar en `docs/01-prd.md`.

# RESTRICCIONES PARA TI (la IA que genera este PRD)
- No inventes mecánicas más allá de las descritas; puedes refinarlas y profundizarlas.
- Si una decisión queda abierta (ej: nombre exacto de un héroe), proponla con 2-3
  alternativas razonadas.
- Marca claramente con [PENDIENTE DE VALIDACIÓN] cualquier suposición que hagas.
- Sé exhaustivo en RFs y CUs: prefiere demasiado detalle a poco.
- No incluyas código, solo especificación funcional y de producto.
- Antes de empezar, propón un plan con la tabla de contenidos completa del PRD y
  espera aprobación.

Genera ahora el PRD completo siguiendo esta estructura.