/**
 * Tests unitarios de las funciones puras de saneado/mapeo de mensajes de toast.
 *
 * NOTA: NO instancian Phaser; las funciones son puras. Cubren el Bug B:
 * los UUIDs internos no deben filtrarse al usuario y los errores conocidos
 * deben traducirse a textos amigables en español.
 */
import { describe, it, expect } from "vitest";
import { InvalidTargetError } from "@domain/errors/invalid-target-error";
import { PhaseViolationError } from "@domain/errors/phase-violation-error";
import { InsufficientNostalgiaError } from "@domain/errors/insufficient-nostalgia-error";
import { BoardFullError } from "@domain/errors/board-full-error";
import { sanitizeMessage, friendlyErrorMessage } from "@presentation/utils/toast-messages";

const UUID = "d31ad54b-7297-4666-b776-4cf6529f1ffd";

describe("sanitizeMessage", () => {
  it("reemplaza un UUID v4 por 'objetivo'", () => {
    // Arrange
    const msg = `El defensor con id "${UUID}" no está en el tablero.`;

    // Act
    const result = sanitizeMessage(msg);

    // Assert
    expect(result).not.toContain(UUID);
    expect(result).toContain("objetivo");
  });

  it("reemplaza múltiples UUIDs en el mismo mensaje", () => {
    const msg = `${UUID} ataca a ${UUID}`;
    const result = sanitizeMessage(msg);
    expect(result).toBe("objetivo ataca a objetivo");
  });

  it("es insensible a mayúsculas en el UUID", () => {
    const result = sanitizeMessage(`id ${UUID.toUpperCase()} fin`);
    expect(result).toBe("id objetivo fin");
  });

  it("deja intacto un mensaje sin UUID", () => {
    const msg = "No es tu turno";
    expect(sanitizeMessage(msg)).toBe(msg);
  });
});

describe("friendlyErrorMessage", () => {
  it("mapea InvalidTargetError de defensor ausente a texto amigable sin UUID", () => {
    const error = new InvalidTargetError(
      `El defensor con id "${UUID}" no está en el tablero del oponente.`,
    );
    const result = friendlyErrorMessage(error, "fallback");
    expect(result).toBe("Ese objetivo ya no está en el tablero.");
    expect(result).not.toContain(UUID);
  });

  it("mapea InvalidTargetError de atacante exhausto a su toast específico", () => {
    const error = new InvalidTargetError(
      'El Personaje "Rigby" está exhausto o ya atacó este turno.',
    );
    expect(friendlyErrorMessage(error, "fallback")).toBe("Esa carta no puede atacar este turno.");
  });

  it("mapea InvalidTargetError de Taunt/Provocar a su toast específico", () => {
    const error = new InvalidTargetError(
      "Hay Personajes con Provocación (Taunt) en el tablero rival. Debes atacarlos primero.",
    );
    expect(friendlyErrorMessage(error, "fallback")).toBe(
      "Debes atacar primero a las cartas con Provocar.",
    );
  });

  it("mapea InvalidTargetError de objetivo ya destruido al toast genérico de tablero", () => {
    const error = new InvalidTargetError('El objetivo "Chum Chum" ya está destruido.');
    expect(friendlyErrorMessage(error, "fallback")).toBe("Ese objetivo ya no está en el tablero.");
  });

  it("el matching de InvalidTargetError es insensible a mayúsculas", () => {
    const exhausted = new InvalidTargetError("El Personaje está EXHAUSTO este turno.");
    expect(friendlyErrorMessage(exhausted, "fallback")).toBe(
      "Esa carta no puede atacar este turno.",
    );

    const taunt = new InvalidTargetError("Hay un TAUNT en el tablero rival.");
    expect(friendlyErrorMessage(taunt, "fallback")).toBe(
      "Debes atacar primero a las cartas con Provocar.",
    );
  });

  it("InvalidTargetError no reconocido cae al fallback saneado (sin UUID)", () => {
    const error = new InvalidTargetError(`Caso futuro raro con ${UUID} incrustado.`);
    const result = friendlyErrorMessage(error, "fallback");
    expect(result).not.toContain(UUID);
    expect(result).toBe("Caso futuro raro con objetivo incrustado.");
  });

  it("mapea PhaseViolationError a texto amigable", () => {
    const error = new PhaseViolationError("No puedes atacar en fase draw");
    expect(friendlyErrorMessage(error, "fallback")).toBe("No puedes hacer eso en esta fase.");
  });

  it("mapea BoardFullError a texto amigable", () => {
    const error = new BoardFullError("La zona left está llena");
    expect(friendlyErrorMessage(error, "fallback")).toBe("Esa zona está llena.");
  });

  it("conserva el mensaje legible de InsufficientNostalgiaError (saneado)", () => {
    const error = new InsufficientNostalgiaError("Necesitas 3 de Nostalgia y tienes 1.");
    expect(friendlyErrorMessage(error, "fallback")).toBe("Necesitas 3 de Nostalgia y tienes 1.");
  });

  it("sanea el mensaje de un error no mapeado que contiene UUID", () => {
    const error = new Error(`Algo con ${UUID} dentro`);
    const result = friendlyErrorMessage(error, "fallback");
    expect(result).not.toContain(UUID);
    expect(result).toBe("Algo con objetivo dentro");
  });

  it("usa el fallback (saneado) cuando el error no es un Error", () => {
    expect(friendlyErrorMessage(undefined, "Mensaje por defecto")).toBe("Mensaje por defecto");
    expect(friendlyErrorMessage("texto suelto", "fallback")).toBe("fallback");
  });

  it("usa el fallback cuando el Error no tiene mensaje", () => {
    expect(friendlyErrorMessage(new Error(""), "Acción inválida")).toBe("Acción inválida");
  });
});
