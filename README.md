# cartas-turnos-ia

Juego de cartas por turnos desarrollado con IA - Proyecto académico

## Setup del entorno (para nuevos miembros del equipo)

### Software requerido
- Node.js LTS (v20+)
- Git + GitHub Desktop
- Antigravity (https://antigravity.google/download)
- Ollama (https://ollama.com/download)

### Modelos locales en Ollama
```bash
ollama pull qwen2.5-coder:7b
ollama pull qwen3:8b
ollama pull deepseek-r1:8b
ollama pull phi4-mini
```

### Clonado e instalación
```bash
git clone https://github.com/Dubricius/cartas-turnos-ia.git
cd cartas-turnos-ia
npm install
```

### Modelos personalizados de Ollama (contexto extendido a 16K)
```bash
ollama create qwen-coder-agent -f Modelfile-qwen-coder
ollama create qwen3-agent -f Modelfile-qwen3
```

### Opencode
```bash
# Windows
irm https://opencode.ai/install.ps1 | iex

# macOS/Linux
curl -fsSL https://opencode.ai/install | bash
```

### Verificación
```bash
npm run typecheck
npm test
npm run dev
```