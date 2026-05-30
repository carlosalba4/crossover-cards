# ADR-008: Entrega sin despliegue público

- **Fecha**: 2026-05-30
- **Estado**: Aceptada
- **Autores**: [Vuestros nombres]

## Contexto

El enunciado de la asignatura lista "Despliegue de la aplicación" como uno de
los puntos de ingeniería a abordar durante la fase 5 del proyecto. Sin embargo,
los entregables formales exigidos son:

- Memoria en PDF (`Nombre_Apellido1_IA_Develop.pdf`).
- Código comprimido en ZIP (`Nombre_Apellido1_IA_Develop.zip`).
- Fichero `Grupo.txt`.
- Repositorio compartido con el usuario `rubteacher` en GitHub.

En ningún apartado del enunciado se exige una URL pública funcional del juego.

El repositorio es privado por uso académico de sprites y recursos gráficos
sujetos a copyright de terceros. Convertir el repositorio en público para
habilitar GitHub Pages implicaría exponer esos assets sin licencia comercial.

Las alternativas de despliegue evaluadas presentan las siguientes barreras:

| Alternativa | Barrera principal |
| --- | --- |
| GitHub Pages en repo privado | Requiere plan GitHub Pro (de pago) |
| GitHub Pages en repo público | Expone assets con copyright |
| itch.io | No es un entregable formal; requiere cuenta adicional |
| Despliegue simulado / documental | Menos defendible que una CI real verificable |

## Decisión

El proyecto no se desplegará como URL pública. La fase de Despliegue se aborda
mediante las siguientes acciones concretas y verificables:

1. **Workflow de GitHub Actions** (`.github/workflows/ci.yml`): pipeline que
   ejecuta typecheck, lint, tests y build de producción en cada push a
   cualquier rama y en cada pull request a main. El `dist/` resultante se
   sube como artifact de la run con retención de 7 días, lo que constituye un
   entregable descargable y verificable por el evaluador directamente desde la
   pestaña Actions del repositorio.

2. **Build de producción verificada**: `npm run build` genera un `dist/`
   completamente funcional. El evaluador puede ejecutar `npm run preview` para
   levantar el juego en local a partir de esa build sin necesidad de Vite en
   modo desarrollo.

3. **Guía de instalación y ejecución en README**: secciones detalladas que
   permiten al evaluador clonar el repo, instalar dependencias y ejecutar el
   juego en menos de 2 minutos, o verificar typecheck, lint y tests de forma
   independiente.

4. **Entrega final como repositorio compartido + ZIP + memoria PDF +
   Grupo.txt**, que cumple íntegramente los entregables formales del enunciado.

## Justificación

- **Cumplimiento literal del enunciado**: los entregables formales son PDF +
  ZIP + Grupo.txt + repositorio compartido. No se exige URL pública. La
  solución adoptada cubre todos estos puntos.

- **Protección de la propiedad intelectual académica**: mantener el repositorio
  privado evita la exposición de assets con copyright de terceros.

- **Cero coste económico**: ni GitHub Pro, ni cuenta de itch.io de pago, ni
  ningún servicio de hosting son necesarios.

- **CI real, no simulada**: el workflow de GitHub Actions es observable y
  verificable por cualquier persona con acceso al repositorio (incluyendo
  `rubteacher`). Cada run muestra el log completo de cada paso y el artifact
  del `dist/` generado.

- **Ejecución local trivial**: el evaluador puede levantar el juego en local
  con cuatro comandos (`git clone`, `npm install`, `npm run dev`, abrir
  `http://localhost:5173`) siguiendo el README.

## Consecuencias positivas

- Ahorro de tiempo en la fase final del proyecto; no se dedica tiempo a
  configurar servicios de hosting.
- Sin exposición de assets con copyright en ningún entorno público.
- Pipeline de CI reutilizable si el proyecto evolucionase en el futuro.
- El evaluador dispone de dos vías independientes de verificación: ejecución
  local y descarga del artifact de CI.

## Consecuencias negativas / riesgos

- El evaluador no puede probar el juego sin instalarlo localmente.
  **Mitigación**: README con guía paso a paso, comprobada en entorno Windows
  y Linux, que permite levantar el juego en menos de 2 minutos.

- Si el evaluador cambiase los criterios para exigir URL pública después de la
  entrega, habría que desplegar en itch.io o GitHub Pages.
  **Mitigación**: la build de producción ya está lista; subirla a itch.io como
  aplicación HTML5 requeriría únicamente comprimir el `dist/` y publicarlo,
  sin modificaciones de código.

## Alternativas consideradas

- **GitHub Pages con repositorio privado**: descartado porque requiere el plan
  GitHub Pro (de pago), lo que contradice el principio de cero coste del
  proyecto recogido en ADR-001.

- **GitHub Pages con repositorio público**: descartado porque haría accesibles
  públicamente sprites y recursos gráficos sujetos a copyright de terceros,
  con riesgo legal para el equipo.

- **itch.io**: descartado porque no constituye un entregable formal del
  enunciado, requiere la creación de una cuenta adicional, y el tiempo
  disponible en la fase final es limitado. La build estaría disponible para
  esta vía si fuese necesario en el futuro.

- **Despliegue simulado documental (sin CI real)**: descartado por ser menos
  defendible ante el evaluador que una CI ejecutada y verificable en la
  pestaña Actions del repositorio. Una CI real demuestra que el proyecto
  compila, pasa todos los tests y genera un `dist/` sin intervención manual.
