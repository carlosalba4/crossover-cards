---
name: card-game-mechanics
description: Mecánicas específicas del juego Crossover Cards y su balance.
trigger: cuando trabajes con cartas, mazos, combate, IA del rival, mecánicas M1-M5.
---

# Skill: Mecánicas de Crossover Cards

## Recursos

- **Nostalgia**: empieza en 1, +1 por turno, máximo 10. Se restaura al inicio del turno propio.
- **Momentum**: se gana 1 punto/turno cuando la vida del jugador baja del 50%. Se gasta como Nostalgia extra o para cartas "Furia".

## Fases del turno

1. **Robo (Draw)**: roba 1 carta. Si el mazo está vacío, recibes "daño por fatiga" (+1 por turno).
2. **Principal (Main)**: jugar cartas, activar habilidad de héroe, equipar objetos.
3. **Combate (Combat)**: atacar con criaturas (cada criatura solo una vez por turno).
4. **Fin (End)**: limpiar efectos temporales, comprobar misiones, ceder turno al rival.

## Tablero

- 7 slots máximos por lado.
- 6 slots dentro de zonas (2 por cada una de las 3 zonas), 1 slot libre fuera de zonas.
- Mano máxima 10 cartas (las que sobren se queman al robarse).

## Mecánicas innovadoras

- **M1 Sinergia tribal**: +1 ataque a las cartas del mismo arquetipo en tablero, por cada aliada del mismo arquetipo.
- **M2 Momentum**: ya descrito arriba.
- **M3 Zonas dinámicas**: cada 3 turnos, una zona aleatoria cambia de tipo (Caótica / Mágica / Combate / Misteriosa) y aplica buff/debuff a las criaturas dentro.
- **M4 Misiones**: cartas especiales con coste 0 que dan recompensa al cumplir condición.
- **M5 Crossover**: una vez por partida, roba 1 carta aleatoria del mazo del rival.

## Tipos de carta

- **Criatura**: ataque, vida, habilidades especiales.
- **Hechizo**: efecto inmediato.
- **Objeto**: equipable al héroe o criatura aliada; puede tener durabilidad.

## Rareza

- Común (gris): efectos simples.
- Rara (azul): efectos con condiciones.
- Épica (morada): potentes situacionales.
- Legendaria (dorada): únicas, 1 copia max por mazo.

## Héroes iniciales

- **El Lich** (mago oscuro): "Hechizo Ancestral" — 2 Nostalgia, inflige 2 daño a objetivo.
- **Axel Blaze** (luchador físico): "Disparo Llamarada" — 2 Nostalgia, +2 ataque a aliado hasta fin de turno.

## Referencias del proyecto

- PRD: `docs/01-prd.md` (juego completo).
- Catálogo de cartas: `docs/04-card-catalog.md` (se generará).
