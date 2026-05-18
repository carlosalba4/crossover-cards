# ADR-001: Stack tecnológico

- **Fecha**: 2026-05-18
- **Estado**: Aceptada
- **Autores**: [Vuestros nombres]

## Contexto

Proyecto académico de la asignatura "Desarrollo con IA" con las siguientes restricciones:

- Duración: 14 días naturales.
- Equipo: 2 personas.
- Metodología impuesta por el profesor: Cascada clásica.
- Framework impuesto: Phaser 4.
- Modelos: solo gratuitos (locales o free tier cloud), no se permite contratación de modelos de pago.
- El enunciado pide explícitamente herramientas agénticas (opencode y Antigravity) y MCP Servers.
- Hardware: dos portátiles con NVIDIA RTX 4060 / 5060, Intel i7-14700HX, 32 GB RAM, 445 GB y 173 GB SSD.

## Decisión

Stack acordado:

| Capa                            | Herramienta                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------- |
| Framework de juego              | Phaser 4 (plan Personal gratuito)                                                |
| Lenguaje                        | TypeScript (strict mode)                                                         |
| Bundler                         | Vite                                                                             |
| IDE agéntico alto nivel         | Google Antigravity (free preview)                                                |
| IDE agéntico bajo nivel         | opencode (CLI dentro de terminal de Antigravity)                                 |
| Modelos cloud (vía Antigravity) | Gemini 3.1 Pro, Claude Sonnet 4.6, Claude Opus 4.6, Gemini 3 Flash, GPT-OSS 120B |
| Modelos locales (vía Ollama)    | Qwen2.5-Coder-7B, Qwen3-8B, DeepSeek-R1-8B, Phi-4-mini                           |
| Testing                         | Vitest                                                                           |
| Lint / Format                   | ESLint + Prettier                                                                |
| Control de versiones            | Git + GitHub privado                                                             |
| GUI Git                         | GitHub Desktop                                                                   |
| Despliegue                      | GitHub Pages o itch.io (por decidir en fase 5)                                   |

## Justificación

- Antigravity es gratuito y cumple el requisito de IDE agéntico del enunciado. Incluye Gemini 3.1 Pro y Claude Sonnet 4.6 en su cuota gratuita.
- Phaser Editor v5 fue descartado: solo el plan Personal (la librería) es gratis; el editor visual cuesta 12 USD/mes.
- opencode ejecutándose dentro de la terminal de Antigravity cumple literalmente la indicación del enunciado: "ha de utilizar tanto opencode como Antigravity ya que se complementan perfectamente al actuar uno más a bajo nivel y el otro a alto".
- Los modelos locales vía Ollama permiten:
  - Reducir consumo de cuota cloud para tareas mecánicas (tests, boilerplate, comentarios).
  - Trabajo offline cuando se requiera.
  - Verificación cruzada de salidas (segunda opinión sin gastar cuota).
- TypeScript en modo strict facilita aplicar SOLID y patrones, que la rúbrica valora explícitamente.

## Consecuencias

**Positivas**:

- Cero coste económico.
- Cumple el enunciado al pie de la letra (Antigravity + opencode).
- Stack moderno y bien documentado: los modelos lo conocen a fondo.
- Argumento sólido para la memoria sobre división alto/bajo nivel de agentes.

**Negativas / Riesgos**:

- Modelos locales tienen ventana de contexto limitada (16K útiles); se mitiga reservando tareas grandes para Antigravity cloud.
- Antigravity está en preview; posibles bugs o cambios de API durante los 14 días. Mitigación: documentar versión usada en cada interacción.
- Curva de aprendizaje de opencode + Ollama (configuración inicial). Mitigación: configuración versionada en repo.

## Alternativas consideradas

- **Phaser Editor v5 con asistente IA integrado**: descartado por ser de pago (12 USD/mes).
- **VS Code + Continue + Ollama**: descartado por no cumplir el requisito explícito del enunciado sobre herramientas agénticas.
- **Solo Antigravity sin opencode**: descartado para cumplir el "ambas se complementan" del enunciado.
- **Solo opencode sin Antigravity**: descartado por perder los modelos cloud potentes (Claude Opus, Gemini 3.1 Pro) incluidos gratis en Antigravity.
