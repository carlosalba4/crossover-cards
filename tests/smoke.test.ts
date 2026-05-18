import { describe, it, expect } from "vitest";

describe("Smoke test — entorno de testing", () => {
  it("debe ejecutar un test simple correctamente", () => {
    expect(1 + 1).toBe(2);
  });

  it("debe tener jsdom disponible", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });
});
