// Función serverless de Vercel: recibe el mensaje del chat y responde con Gemini.
// La clave de API vive en la variable de entorno GEMINI_API_KEY (nunca en el código).

const GEMINI_MODEL = "gemini-1.5-flash"; // si da error, cambia a "gemini-1.5-flash"

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Falta la variable de entorno GEMINI_API_KEY");
    return res.status(500).json({ error: "Configuración incompleta del servidor" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { role: "model", parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: message }] }]
        })
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("Error de Gemini:", response.status, detail);
      return res.status(502).json({ error: "El modelo de IA no respondió" });
    }

    const data = await response.json();
    const reply =
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts
        .map(function (p) { return p.text; })
        .join("");

    return res.status(200).json({
      reply: reply || "Perdón, no entendí. ¿Quieres ver precios o agendar un turno?"
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
