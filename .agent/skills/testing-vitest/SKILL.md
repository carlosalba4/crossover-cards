---
name: testing-vitest
description: Generar tests unitarios e integración con Vitest siguiendo AAA y cobertura por capa.
trigger: cuando generes o modifiques archivos en tests/ o cuando se pida cobertura de test.
---

# Skill: Testing con Vitest

## Estructura AAA
Cada test sigue Arrange / Act / Assert:
```ts
it("debe sumar nostalgia al inicio del turno propio", () => {
  // Arrange
  const player = new Player({ initialNostalgia: 3 });
  // Act
  player.startTurn();
  // Assert
  expect(player.nostalgia).toBe(4);
});
```

## Convenciones
- Archivos: `<unidad>.test.ts` en `tests/` reflejando estructura de `src/`.
- Describe por unidad bajo test, `it` por escenario.
- Sin lógica condicional en los tests.
- Sin dependencias compartidas entre tests; cada uno arrange su propio estado.

## Cobertura por capa
- `src/domain/`: 80% (núcleo del juego, lo más testeable).
- `src/application/`: 60%.
- `src/infrastructure/`: 40%.
- `src/presentation/`: tests mínimos sobre lógica de UI no Phaser.

## Mocks
- Lo mínimo posible. Si necesitas mocks para todo, hay acoplamiento que arreglar.
- `vi.fn()` para spies puntuales.
- `vi.mock(path)` solo cuando el módulo entero sea irrelevante para el test.

## Tests de escenarios de juego
- IA: tests con tablero predefinido y verificar la decisión esperada.
- Combate: tests deterministas, sin azar.
- Estados de turno: tests por transición.

## Casos border
- Mazo vacío al robar.
- Mano llena al robar (carta se quema).
- 0 Nostalgia disponible para jugar carta.
- Tablero lleno al invocar criatura.

## Referencias del proyecto
- Arquitectura: `docs/02-architecture.md` (sección 10 Estrategia de testing).