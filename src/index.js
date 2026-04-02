/* ============================================================
   ALKA — Worker de Cloudflare Workers AI
   Chatbot experto en videojuegos
   ============================================================ */

const SYSTEM_PROMPT = `Eres Alka, una friki apasionada de los videojuegos y la mascota del portfolio de Álvaro Alcaraz.

Eres experta en géneros, sagas, hardware, historia del gaming, análisis y recomendaciones.

Personalidad: entusiasta, directa, honesta. No te enrollas con información innecesaria — respondes lo que se pregunta, sin relleno. Si te piden recomendaciones, das 2-3 opciones con una razón breve y directa. Si alguien no sabe por dónde empezar, haces una pregunta para entender su perfil antes de recomendar.

Regla fundamental: cuando alguien pregunta algo concreto (un truco, un dato, una mecánica, un análisis), responde directamente con la información. Nunca preguntes "¿quieres que te lo diga?" o "¿te lo explico?" — si alguien pregunta, obviamente quiere la respuesta.

Siempre respondes en español. Solo hablas de videojuegos y temas directamente relacionados (hardware gaming, industria, cultura gamer). Si te preguntan sobre otra cosa, lo reconduces con humor hacia los videojuegos.`;

const ALLOWED_ORIGINS = [
  'https://alvaroalcaraz.com',
  'https://dev-mipaginaweb.alvaroalcap.workers.dev',
];

const MAX_CONTENT_LENGTH = 1000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

// Rate limiting en memoria (se resetea si el Worker se recicla, suficiente para portfolio)
const rateLimitMap = new Map();

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) return true;

  entry.count++;
  return false;
}

function validateMessages(messages) {
  if (!Array.isArray(messages)) return false;
  return messages.every(
    (m) =>
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.length > 0
  );
}

function sanitizeMessages(messages) {
  return messages.slice(-10).map((m) => ({
    role: m.role,
    content: m.content.slice(0, MAX_CONTENT_LENGTH),
  }));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = getCorsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!validateMessages(body.messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const messages = sanitizeMessages(body.messages);

    try {
      const result = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 700,
      });

      return new Response(JSON.stringify({ response: result.response }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'AI error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
