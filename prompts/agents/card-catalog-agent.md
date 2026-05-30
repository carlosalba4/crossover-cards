# ROL

Eres un Game Designer senior especializado en balance de juegos de cartas
coleccionables digitales (Hearthstone, MTG Arena, Legends of Runeterra, Marvel
Snap). Tu tarea es producir el catálogo numérico definitivo de las 20 cartas
del juego "Crossover Cards" y las habilidades de héroe, con valores concretos
de coste, ataque, vida y descripciones de habilidad listas para implementar.

# CONTEXTO

- Proyecto académico de 14 días, metodología cascada clásica.
- Stack: Phaser 4 + TypeScript + Vite.
- El PRD definitivo está en @docs/01-prd.md (léelo entero).
- La arquitectura técnica está en @docs/02-architecture.md (modelo de datos en
  sección 5).
- Las reglas globales están en @AGENTS.md.
- Las mecánicas del juego están en la skill `card-game-mechanics`.

# OBJETIVO

Generar el archivo `docs/04-card-catalog.md` con el catálogo numérico completo
y todas las decisiones de balance documentadas.

# CONTENIDO REQUERIDO

## 1. Introducción

- Propósito del documento.
- Principios de balance aplicados.
- Referencias: PRD, arquitectura, mecánicas.

## 2. Sistema económico del juego

- Curva de Nostalgia esperada turno a turno (turnos 1-10).
- Cartas mínimas, óptimas y exclusivas por turno según coste.
- Fórmula vanilla de balance (orientativa, no obligatoria):
  - Personaje vanilla: `coste ≈ (ataque + vida) / 2`.
  - Hechizo: `coste ≈ daño / 1.5` o `coste ≈ curación / 2`.
  - Objeto equipable: `coste ≈ (bonus de ataque × duración) / 2`.
- Tabla de bonificaciones/penalizaciones aplicables:
  - Habilidades fuertes (deathrattle masivo, immune, AoE): suben el coste.
  - Restricciones (solo ataca cada 2 turnos, requiere condición): bajan el coste.
  - Cartas legendarias: pueden romper la fórmula con margen documentado.

## 3. Distribución por rareza

Tabla por mazo:

- Mazo de El Lich: X Comunes, X Raras, X Épicas, X Legendarias (total 10).
- Mazo de Axel Blaze: igual.
- Justifica la distribución (regla habitual en CCGs es ~50% comunes, 30% raras,
  15% épicas, 5% legendarias, pero al ser mazos cerrados de 10 cartas se puede
  ajustar).

## 4. Distribución por arquetipo

- Cuántas cartas de cada arquetipo (los 4 definidos en el PRD) hay en cada mazo.
- Cuántas Personajes tiene cada arquetipo en total (mínimo 3 para que la sinergia
  tribal M1 sea viable).
- Cartas neutrales (sin arquetipo) si existen.

## 5. Catálogo del Mazo de El Lich (10 cartas)

Para cada carta, una ficha con esta estructura:

### [Nombre de la carta]

- **ID**: kebab-case único (`pops-el-gentil`, `superbocata`).
- **Tipo**: Personaje / Hechizo / Objeto.
- **Arquetipo**: [el correspondiente] / Neutral.
- **Rareza**: Común / Rara / Épica / Legendaria.
- **Coste de Nostalgia**: número entero entre 0 y 10.
- **Stats** (solo Personajes): Ataque / Vida.
- **Durabilidad** (solo objetos con uso limitado): X usos.
- **Habilidad**: descripción formal con palabra clave si aplica
  (Battlecry, Deathrattle, Taunt, Charge, Divine Shield, Lifesteal, etc.).
- **Trasfondo narrativo**: 1-2 frases del personaje (extraído del PRD).
- **Justificación de balance**: cómo se llega a los números (vanilla + ajustes).
- **Sinergias**: con qué otras cartas del mazo o del juego combina especialmente.

Aplica esto a las 10 cartas del Mazo de El Lich tal como están en el PRD:
Pops el Gentil, Darwin Watterson, Chowder, Patricio Estrella, Rigby, Jake el Perro,
Superbocata, Burger Cangreburger, El Poder, Espada de Sangre de Demonio.

## 6. Catálogo del Mazo de Axel Blaze (10 cartas)

Misma estructura aplicada a las 10 cartas del Mazo de Axel Blaze:
Goku, Marceline, Fantasma Chocala, Diamantino, Chum Chum, Agallas el Perro
Cobarde, Pedo Poderoso, Linterna Minimizadora, Bola de Dragón, Omnitrix.

## 7. Habilidades de héroe definitivas

### El Lich

- Nombre de habilidad: "Hechizo Ancestral".
- Coste: [número] Nostalgia.
- Efecto formal: [descripción].
- Frecuencia: una vez por turno.
- Justificación: por qué este coste y efecto encajan en la curva.

### Axel Blaze

- Nombre de habilidad: "Tornado de Fuego".
- Coste: [número] Nostalgia.
- Efecto formal: [descripción].
- Frecuencia: una vez por turno.
- Justificación: por qué este coste y efecto encajan en la curva.

## 8. Tabla resumen ejecutiva

Una tabla por mazo con columnas: ID | Nombre | Tipo | Arquetipo | Rareza | Coste |
Ataque | Vida | Habilidad resumida. Para consulta rápida.

## 9. Esquema JSON de ejemplo

Esquema TypeScript/JSON de 2-3 cartas representativas (una Personaje, un hechizo,
un objeto) listo para ser usado en `assets/data/cards.json`. Sigue el modelo de
datos definido en sección 5 del documento de arquitectura.

## 10. Tests de balance previstos

Lista de escenarios que deben pasar para validar el balance:

- Una partida promedio dura entre X y Y turnos.
- Ninguna carta debería tener una tasa de juego > 80% (over-tuned) o < 10% (no
  vale la pena jugarla).
- Las cartas Legendarias deben sentirse impactantes pero no automáticas.
- Sinergia tribal funciona: jugar 2+ cartas del mismo arquetipo es ventajoso.
- Momentum (comeback) realmente revierte partidas cuando la diferencia de vida
  es < 30%.

Estos escenarios son entradas para el Tester-Agent futuro.

## 11. Decisiones marcadas [PENDIENTE DE VALIDACIÓN]

Lista de decisiones de balance donde haya dudas reales y el equipo deberá
revisar manualmente.

# RESTRICCIONES

- Idioma: español.
- Markdown limpio, sin emojis, tablas donde aporten claridad.
- Sé conservador: vale más una carta ligeramente débil que rota.
- Mantén coherencia con el PRD: si el PRD dice que Goku es Legendaria, no la
  bajes a Épica.
- Las habilidades deben ser implementables con la arquitectura existente
  (patrón Strategy para IA, sistema de modificadores con array Modifier[],
  Event Bus para reacciones).
- Si una habilidad del PRD es muy ambigua, proponla con 2-3 alternativas y
  marca [PENDIENTE DE VALIDACIÓN].
- No inventes cartas adicionales fuera de las 20.

# INSTRUCCIONES DE EJECUCIÓN

1. Lee @docs/01-prd.md (especialmente sección de catálogo de cartas).
2. Lee @docs/02-architecture.md (especialmente sección 5 Modelo de datos).
3. Lee la skill @.agent/skills/card-game-mechanics/SKILL.md.
4. Propón un PLAN con la tabla de contenidos detallada y un primer borrador
   de la curva de costes esperada.
5. Espera mi aprobación del plan antes de redactar las fichas.
6. Una vez aprobado, escribe el documento completo en `docs/04-card-catalog.md`.
7. Al finalizar, resume al chat: distribución final por rareza/arquetipo,
   decisiones marcadas [PENDIENTE DE VALIDACIÓN], cualquier punto que requiera
   revisión humana.

Empieza ahora leyendo los archivos del repo y proponiendo el plan.
