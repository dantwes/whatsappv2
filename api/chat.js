const GROQ_MODEL = "llama-3.3-70b-versatile"; // verifica el ID vigente en console.groq.com

const SYSTEM = `Eres el asistente virtual de "La Barbería". Responde siempre en español, con un tono amable y breve (máximo 3 líneas).

Información del negocio:
- Precios: corte clásico $18, corte premium $25, barba $12, combo corte + barba $35.
- Horario: lunes a sábado de 9:00 a 19:00. Domingos cerrado.
- Turnos disponibles: 9:00, 11:00, 13:00, 15:00 y 17:00.

Cómo agendar:
1. Pregunta al cliente: nombre, servicio, día y hora.
2. Cuando tengas todo, confirma el turno con las palabras exactas "Turno confirmado" y un resumen.

Reglas:
- Nunca inventes precios, servicios ni horarios.
- Si preguntan algo que no está en la información, responde que avisarás por WhatsApp.
- No hables de IA ni de tecnología; eres el asistente del negocio.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const message = req.body && req.body.message;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Falta el mensaje" });
  }

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
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: message }
        ],
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
