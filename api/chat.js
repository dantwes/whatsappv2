const GROQ_MODEL = "qwen/qwen3.8-27b"; 

const SYSTEM = `Eres el asistente virtual de "La Barbería". Responde siempre en español, tono amable y breve.

Información del negocio:
- Precios: corte clásico $18, corte premium $25, barba $12, combo corte + barba $35.
- Horario: lunes a sábado de 9:00 a 19:00. Domingos cerrado.
- Turnos disponibles: 9:00, 11:00, 13:00, 15:00 y 17:00.

Cómo agendar:
1. Usa los datos que el cliente ya dio en esta conversación; jamás los vuelvas a pedir.
2. Si falta un dato (nombre, servicio, día, hora), pide SOLO ese dato.
3. Cuando pregunten por horarios, ofrece directamente los turnos disponibles.
4. Cuando tengas todo, confirma con las palabras exactas "Turno confirmado" más un resumen.

Reglas:
- Máximo 2 líneas por respuesta. No saludes en cada mensaje.
- Nunca inventes precios, servicios ni horarios.
- Si preguntan algo fuera de la información, responde que avisarás por WhatsApp.
- No hables de IA ni de tecnología; eres el asistente del negocio.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const message = req.body && req.body.message;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Falta el mensaje" });
  }

  const rawHistory = (req.body && req.body.history) || [];
  const cleanHistory = rawHistory
    .filter(function (h) {
      return h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string";
    })
    .slice(-10)
    .map(function (h) {
      return { role: h.role, content: h.content.slice(0, 1000) };
    });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("Falta la variable de entorno GROQ_API_KEY");
    return res.status(500).json({ error: "Configuración incompleta del servidor" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: SYSTEM }]
          .concat(cleanHistory)
          .concat([{ role: "user", content: message }]),
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Error de Groq:", response.status, detail);
      return res.status(502).json({ error: "El modelo de IA no respondió" });
    }

    const data = await response.json();
    const reply =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    return res.status(200).json({
      reply: (reply && reply.trim()) || "Perdón, no entendí. ¿Quieres ver precios o agendar un turno?"
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
