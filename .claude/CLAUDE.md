# CLAUDE.md — alka-chat

## Contexto del proyecto
- **Qué es**: Worker de Cloudflare Workers AI que da vida a Alka, la mascota-chatbot del portfolio de Álvaro Alcaraz
- **Repo**: `alvaroalca/Chatbot` (privado)
- **Worker URL**: `https://alka-chat.alvaroalcap.workers.dev`
- **Frontend**: vive en el repo del portfolio (`alvaroalca/Mi-Pagina-Web`), en `public/projects/chatbot/`

## Alka — quién es
- Mascota oficial de Álvaro Alcaraz. Aparece como sprite animado en la landing del portfolio y como chatbot en `alvaroalcaraz.com/projects/chatbot/`
- En el chat: experta apasionada en videojuegos — géneros, sagas, hardware, historia, análisis, recomendaciones
- Personalidad: friki entusiasta, directa, sin relleno. Responde lo que se pregunta sin pedir permiso para dar la información
- Idioma: siempre español. Solo habla de videojuegos y temas relacionados

## Estructura
```
chatbot/
├── src/
│   └── index.js   → lógica del Worker + system prompt de Alka
├── wrangler.jsonc  → config Cloudflare (nombre: alka-chat, binding AI)
└── package.json
```

## IA
- **Modelo**: `@cf/meta/llama-3-8b-instruct` (Cloudflare Workers AI, free tier)
- **System prompt**: al inicio de `src/index.js`, constante `SYSTEM_PROMPT`
- **Contexto**: últimos 10 mensajes de la conversación
- **max_tokens**: 512

## Deploy
- `npx wrangler deploy` desde la raíz del proyecto
- Cada deploy actualiza el Worker en producción inmediatamente

## Commits
- No añadir `Co-Authored-By: Claude...` en ningún commit

## Modificaciones habituales
- **Cambiar personalidad/comportamiento de Alka**: editar `SYSTEM_PROMPT` en `src/index.js` + redesplegar
- **Cambiar modelo**: editar el string del modelo en `env.AI.run(...)` + redesplegar
- **Cambiar UI del chat**: esos archivos están en el repo del portfolio, no aquí
