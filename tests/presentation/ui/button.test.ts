import { describe, it, expect } from "vitest";
import { lightenColor } from "@presentation/utils/ui-math";

describe("Button Pure Functions", () => {
  describe("lightenColor", () => {
    it("debería aclarar un color oscuro correctamente usando el factor multiplicador", () => {
      // Arrange
      // R=16 (0x10), G=32 (0x20), B=48 (0x30)
      const originalColor = 0x102030;
      const factor = 1.1;

      // Act
      const lighterColor = lightenColor(originalColor, factor);

      // Assert
      // R = Math.round(16 * 1.1) = 18 (0x12)
      // G = Math.round(32 * 1.1) = 35 (0x23)
      // B = Math.round(48 * 1.1) = 53 (0x35)
      expect(lighterColor).toBe(0x122335);
    });

    it("no debería sobrepasar el valor máximo de 0xFF por canal de color", () => {
      // Arrange
      const originalColor = 0xffffff; // Blanco puro
      const factor = 1.5;

      // Act
      const lighterColor = lightenColor(originalColor, factor);

      // Assert
      expect(lighterColor).toBe(0xffffff); // Sigue siendo blanco
    });

    it("debería devolver negro puro (0x000000) si el color original es negro", () => {
      // Arrange
      const originalColor = 0x000000;
      const factor = 2.0;

      // Act
      const lighterColor = lightenColor(originalColor, factor);

      // Assert
      expect(lighterColor).toBe(0x000000);
    });
  });
});
