/**
 * Tests unitarios de la función pura `calculateFanLayout`.
 *
 * NOTA: Este archivo NO instancia ningún objeto de Phaser.
 * `phaser` y `card-sprite` se mockean al mínimo para aislar la función pura
 * sin depender de canvas/WebGL. La lógica de calculateFanLayout es pura
 * (no llama a nada de Phaser en su interior).
 *
 * Tarea: IMPL-068 · Agente: tester-agent
 */
import { describe, it, expect, vi } from "vitest";

// ── Mocks de módulos con dependencias de Phaser ──────────────────────────────
// Deben declararse ANTES de cualquier import que los use (hoisting de vi.mock).

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
  },
}));

vi.mock("@presentation/objects/card-sprite", () => ({
  CardSprite: class CardSprite {},
  CardSize: { Hand: "hand", Board: "board" },
}));

import { calculateFanLayout } from "@presentation/objects/hand-view";

// ---------------------------------------------------------------------------
// Constantes auxiliares
// ---------------------------------------------------------------------------

const WIDTH_900 = 900;

// ---------------------------------------------------------------------------
// Describe principal
// ---------------------------------------------------------------------------

describe("calculateFanLayout", () => {
  // ── Camino feliz: carta única ────────────────────────────────────────────

  describe("cuando hay una sola carta (count=1)", () => {
    it("debe retornar x=0 y rotation=0", () => {
      // Arrange
      const count = 1;
      const index = 0;
      const totalWidth = WIDTH_900;

      // Act
      const result = calculateFanLayout(count, index, totalWidth);

      // Assert
      expect(result.x).toBe(0);
      expect(result.rotation).toBe(0);
    });
  });

  // ── Camino feliz: tres cartas ────────────────────────────────────────────

  describe("cuando hay tres cartas (count=3)", () => {
    it("la carta izquierda (index=0) debe tener rotación negativa", () => {
      // Arrange
      const count = 3;
      const index = 0;

      // Act
      const result = calculateFanLayout(count, index, WIDTH_900);

      // Assert
      expect(result.rotation).toBeLessThan(0);
    });

    it("la carta central (index=1) debe tener rotation===0", () => {
      // Arrange
      const count = 3;
      const index = 1;

      // Act
      const result = calculateFanLayout(count, index, WIDTH_900);

      // Assert
      expect(result.rotation).toBe(0);
    });

    it("la carta derecha (index=2) debe tener rotación positiva", () => {
      // Arrange
      const count = 3;
      const index = 2;

      // Act
      const result = calculateFanLayout(count, index, WIDTH_900);

      // Assert
      expect(result.rotation).toBeGreaterThan(0);
    });
  });

  // ── Límites de rotación (count=7) ────────────────────────────────────────

  describe("cuando hay siete cartas (count=7) — límite de inclinación", () => {
    it("la carta más a la izquierda (index=0) debe tener rotation===-10", () => {
      // Arrange
      const count = 7;
      const index = 0;

      // Act
      const { rotation } = calculateFanLayout(count, index, WIDTH_900);

      // Assert
      expect(rotation).toBe(-10);
    });

    it("la carta más a la derecha (index=6) debe tener rotation===10", () => {
      // Arrange
      const count = 7;
      const index = 6;

      // Act
      const { rotation } = calculateFanLayout(count, index, WIDTH_900);

      // Assert
      expect(rotation).toBe(10);
    });
  });

  // ── Solapamiento controlado (count=10) ───────────────────────────────────

  describe("cuando hay diez cartas (count=10) — solapamiento máximo por mano llena", () => {
    it("todas las x deben estar dentro del rango [-450, 450] (totalWidth/2)", () => {
      // Arrange
      const count = 10;
      const halfWidth = WIDTH_900 / 2;

      // Act + Assert
      for (let index = 0; index < count; index++) {
        const { x } = calculateFanLayout(count, index, WIDTH_900);
        expect(x).toBeGreaterThanOrEqual(-halfWidth);
        expect(x).toBeLessThanOrEqual(halfWidth);
      }
    });

    it("no debe lanzar error cuando hay 10 cartas (las cartas se solapan más)", () => {
      // Arrange
      const count = 10;

      // Act + Assert — debe ejecutarse sin lanzar excepción
      expect(() => {
        for (let index = 0; index < count; index++) {
          calculateFanLayout(count, index, WIDTH_900);
        }
      }).not.toThrow();
    });
  });

  // ── Caso borde: totalWidth=0 ─────────────────────────────────────────────

  describe("caso borde: totalWidth=0", () => {
    it("no debe lanzar error cuando totalWidth es 0", () => {
      // Arrange
      const count = 1;
      const index = 0;
      const totalWidth = 0;

      // Act + Assert — caso borde extremo
      expect(() => calculateFanLayout(count, index, totalWidth)).not.toThrow();
    });

    it("con count>1 y totalWidth=0 todas las x deben ser 0 (cartas apiladas)", () => {
      // Arrange
      const count = 3;
      const totalWidth = 0;

      // Act + Assert
      for (let index = 0; index < count; index++) {
        const { x } = calculateFanLayout(count, index, totalWidth);
        // toBeCloseTo evita el fallo de Object.is entre +0 y -0
        expect(x).toBeCloseTo(0, 10);
      }
    });
  });

  // ── Simetría ─────────────────────────────────────────────────────────────

  describe("simetría del abanico", () => {
    it("la rotación de carta[0] y carta[count-1] deben ser opuestas en magnitud", () => {
      // Arrange
      const count = 5;

      // Act
      const left = calculateFanLayout(count, 0, WIDTH_900);
      const right = calculateFanLayout(count, count - 1, WIDTH_900);

      // Assert
      expect(left.rotation).toBe(-right.rotation);
    });

    it("la posición x de carta[0] y carta[count-1] deben ser opuestas en signo", () => {
      // Arrange
      const count = 5;

      // Act
      const left = calculateFanLayout(count, 0, WIDTH_900);
      const right = calculateFanLayout(count, count - 1, WIDTH_900);

      // Assert
      expect(left.x).toBe(-right.x);
    });
  });

  // ── Separación real vs. spacing ideal ────────────────────────────────────

  describe("espaciado real no supera totalWidth cuando count es grande", () => {
    it("con count=20 el rango de x no supera totalWidth", () => {
      // Arrange
      const count = 20;
      const positions = Array.from({ length: count }, (_, i) =>
        calculateFanLayout(count, i, WIDTH_900),
      );

      // Act
      const xs = positions.map((p) => p.x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);

      // Assert — toBeCloseTo absorbe errores de punto flotante (~1e-13)
      expect(maxX - minX).toBeCloseTo(WIDTH_900, 5);
    });
  });
});
