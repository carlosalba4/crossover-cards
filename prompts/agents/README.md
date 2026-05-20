# Prompts versionados

Esta carpeta contiene copias legibles de los prompts de cada agente del proyecto, 
para consulta humana fuera del entorno Antigravity.

**La fuente de verdad ejecutable de cada agente está en `.agent/workflows/`**, donde 
los archivos tienen el encabezado YAML necesario para ser reconocidos por Antigravity 
como Workflows invocables con `/`.

Si modificas un prompt, hazlo primero en `.agent/workflows/<agente>.md` y refleja 
el cambio aquí en `prompts/agents/<agente>.md` para mantener la consistencia 
documental.