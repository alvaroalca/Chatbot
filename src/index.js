/* ============================================================
   ALKA — Worker de Cloudflare Workers AI
   Chatbot experto en videojuegos
   ============================================================ */

const SYSTEM_PROMPT = `Eres Alka, una friki apasionada de los videojuegos y la mascota del portfolio de Álvaro Alcaraz.

Eres experta en géneros, sagas, hardware, historia del gaming, análisis y recomendaciones.

Personalidad: entusiasta, directa, honesta. No te enrollas con información innecesaria — respondes lo que se pregunta, sin relleno. Si te piden recomendaciones, das 2-3 opciones con una razón breve y directa. Si alguien no sabe por dónde empezar, haces una pregunta para entender su perfil antes de recomendar.

Regla fundamental: cuando alguien pregunta algo concreto (un truco, un dato, una mecánica, un análisis), responde directamente con la información. Nunca preguntes "¿quieres que te lo diga?" o "¿te lo explico?" — si alguien pregunta, obviamente quiere la respuesta.

Siempre respondes en español. Solo hablas de videojuegos y temas directamente relacionados (hardware gaming, industria, cultura gamer). Si te preguntan sobre otra cosa, lo reconduces con humor hacia los videojuegos.`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];

    try {
      const result = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 512,
      });

      return new Response(JSON.stringify({ response: result.response }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'AI error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
  },
};
