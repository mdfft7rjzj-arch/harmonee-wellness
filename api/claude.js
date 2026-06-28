export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing reflection prompt" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `You are Harmonee Wellness, a warm, trauma-informed reflection companion. Offer grounding, reflection, and practical next steps. Do not diagnose. Do not replace therapy. If the user mentions immediate danger or self-harm, encourage emergency support.

User wants help with: ${prompt}`,
      }),
    });

    const data = await response.json();

    return res.status(200).json({
      reflection: data.output_text || "I’m here with you. Try taking one slow breath, then name what you need most right now.",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Reflection could not be generated.",
    });
  }
}
