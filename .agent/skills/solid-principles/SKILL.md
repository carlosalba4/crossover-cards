---
name: solid-principles
description: Aplicar los 5 principios SOLID en el diseño de clases del proyecto.
trigger: cuando diseñes o refactorices clases, interfaces, jerarquías o módulos.
---

# Skill: SOLID

## S — Single Responsibility Principle
Una clase debe tener una única razón para cambiar.
- `TurnEngine` gestiona transiciones de turno; el combate va en `CombatResolver`.
- `CardRepository` solo lee datos; transformaciones van en `CardFactory`.

## O — Open/Closed Principle
Abierto a extensión, cerrado a modificación.
- `AIStrategy` como interfaz: para añadir un nivel de dificultad, creas una nueva implementación, no modificas las existentes.
- Sistema de cartas extensible vía JSON sin tocar el código del motor.

## L — Liskov Substitution Principle
Subclases sustituibles por la clase base sin alterar el comportamiento.
- `Creature`, `Spell`, `Item` extienden `Card` y respetan su contrato.
- Ninguna subclase debería lanzar excepciones inesperadas en métodos heredados.

## I — Interface Segregation Principle
Interfaces pequeñas y específicas, no monolíticas.
- `IPlayable`, `IAttackable`, `IDamageable`, `IEquippable` por separado.
- Una carta solo implementa las que necesita.

## D — Dependency Inversion Principle
Depender de abstracciones, no implementaciones.
- `IEventBus` definido en `src/domain/events/`, implementación concreta en `src/infrastructure/events/`.
- `MatchService` recibe `ICardRepository` por inyección, no instancia uno directamente.

## Aplicación práctica
- Si una clase crece y mezcla responsabilidades → SRP violado, dividir.
- Si añadir una feature obliga a tocar 5 archivos → OCP violado, refactorizar a Strategy/Factory.
- Si una subclase rompe expectativas del padre → LSP violado, reconsiderar herencia o componer.

## Referencias del proyecto
- ADR-001 al ADR-007 en `docs/decisions/`.
- Arquitectura: `docs/02-architecture.md` (sección 11).