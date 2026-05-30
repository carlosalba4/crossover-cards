/**
 * Tests de capa de presentación — CardSprite (src/presentation/objects/card-sprite.ts)
 *
 * RESULTADO DEL ANÁLISIS: CardSprite no exporta ninguna función pura.
 * Todas las exports del módulo son:
 *   - `CardData`         → interface (tipo TypeScript, no instanciable)
 *   - `CardSize`         → enum de valores string (no función pura con lógica)
 *   - `CardSpriteOptions`→ interface (tipo TypeScript, no instanciable)
 *   - `CardSprite`       → clase que extiende Phaser.GameObjects.Container
 *
 * POR QUÉ NO HAY TESTS FUNCIONALES ADICIONALES AQUÍ:
 * La restricción de IMPL-068 establece que "Si el test necesita algo de Phaser
 * para funcionar, la función NO es pura y NO debe testearse aquí."
 * `CardSprite` requiere una instancia de `Phaser.Scene` en su constructor
 * y llama a `scene.add.graphics()`, `scene.add.text()`, etc., lo que la hace
 * imposible de testear sin un canvas/WebGL real o un mock masivo de Phaser.
 *
 * COBERTURA ALTERNATIVA:
 * Los tests de integración de `CardSprite` se delegan a un entorno con
 * jsdom + Phaser headless (fuera del alcance de IMPL-068).
 *
 * Referencia: docs/02-architecture.md §10 — cobertura de presentación: mínima,
 * solo lógica de UI no-Phaser.
 *
 * Tarea: IMPL-068 · Agente: tester-agent
 */
import { describe, it, expect, vi } from "vitest";

// ── Mock de Phaser para evitar error de canvas en jsdom ──────────────────────
vi.mock("phaser", () => ({
  default: {
    GameObjects: {
      Container: class Container {
        scene = {};
        add() {}
        setSize() {}
        setAngle() {}
        setInteractive() {}
        on() {}
      },
    },
    Input: { Events: { POINTER_OVER: "pointerover", POINTER_OUT: "pointerout" } },
  },
}));

import { CardSize } from "@presentation/objects/card-sprite";

// ---------------------------------------------------------------------------
// Tests de los valores del enum CardSize (único comportamiento sin Phaser)
// ---------------------------------------------------------------------------

describe("CardSize (enum)", () => {
  it("Hand debe tener el valor de string 'hand'", () => {
    // Arrange + Act — enum puro, sin dependencia de Phaser
    const value = CardSize.Hand;

    // Assert
    expect(value).toBe("hand");
  });

  it("Board debe tener el valor de string 'board'", () => {
    // Arrange + Act
    const value = CardSize.Board;

    // Assert
    expect(value).toBe("board");
  });

  it("Hand y Board deben ser distintos", () => {
    // Arrange + Act + Assert
    expect(CardSize.Hand).not.toBe(CardSize.Board);
  });
});

/*
 * ── NOTA SOBRE AUSENCIA DE TESTS ADICIONALES ───────────────────────────────
 *
 * Las siguientes exports de card-sprite.ts NO tienen tests funcionales
 * en este archivo por las razones indicadas:
 *
 * | Export           | Razón de exclusión                                        |
 * |------------------|-----------------------------------------------------------|
 * | CardData         | Interface de TypeScript (sin runtime testeable)           |
 * | CardSpriteOptions| Interface de TypeScript (sin runtime testeable)           |
 * | CardSprite       | Clase Phaser — requiere scene, canvas y WebGL/jsdom       |
 *
 * Si en el futuro se extraen funciones puras de CardSprite (ej. cálculo de
 * dimensiones, resolución de colores por rareza, lógica de tipo-etiqueta),
 * deben exportarse por separado y testearse en este archivo.
 *
 * Ejemplo de refactor sugerido (no implementado en IMPL-068):
 *
 *   // card-sprite-utils.ts
 *   export function resolveTypeLabel(type: CardType): string { ... }
 *   export function rarityColor(rarity: Rarity): number { ... }
 * ──────────────────────────────────────────────────────────────────────────
 */
