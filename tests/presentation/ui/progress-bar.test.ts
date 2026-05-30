import { describe, it, expect } from "vitest";
import { clampProgress, calculateFillWidth } from "@presentation/utils/ui-math";

describe("ProgressBar Pure Functions", () => {
  describe("clampProgress", () => {
    it("debería devolver 0 para valores negativos", () => {
      // Act & Assert
      expect(clampProgress(-0.5)).toBe(0);
      expect(clampProgress(-10)).toBe(0);
    });

    it("debería devolver 1 para valores mayores que 1", () => {
      // Act & Assert
      expect(clampProgress(1.5)).toBe(1);
      expect(clampProgress(100)).toBe(1);
    });

    it("debería mantener valores intermedios (entre 0 y 1) intactos", () => {
      // Act & Assert
      expect(clampProgress(0)).toBe(0);
      expect(clampProgress(0.42)).toBe(0.42);
      expect(clampProgress(1)).toBe(1);
    });
  });

  describe("calculateFillWidth", () => {
    it("debería devolver 0 cuando el progreso es 0", () => {
      // Act & Assert
      expect(calculateFillWidth(0, 480)).toBe(0);
    });

    it("debería devolver el ancho total cuando el progreso es 1", () => {
      // Act & Assert
      expect(calculateFillWidth(1, 480)).toBe(480);
    });

    it("debería devolver la proporción correcta para progresos fraccionales", () => {
      // Act & Assert
      expect(calculateFillWidth(0.5, 480)).toBe(240);
      expect(calculateFillWidth(0.25, 480)).toBe(120);
    });
  });
});
