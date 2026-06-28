// api/claude.js
// Vercel Serverless Function that powers the "Generate Reflection" button.
// Place this file at:  api/claude.js  (in your project root)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Read the API key from Vercel environment variables (set in step 3 below)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "Missing ANTHROPIC_API_KEY. Add it in Vercel → Settings → Environment Variables, then redeploy.",
    });
  }

  // The request body may arrive already-parsed or as a raw string
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  // Accept several common field names so this matches your frontend
  const userText = (
    body.feeling ||
    body.input ||
    body.text ||
    body.prompt ||
    body.message ||
    ""
  )
    .toString()
    .trim();

  if (!userText) {
    return res.status(400).json({ error: "No input was provided." });
  }

  const system =
    "You are a warm, grounded wellness companion. The user shares a feeling or " +
    "situation in a few words. Offer a short, gentle reflection (3-5 sentences): " +
    "acknowledge the feeling, offer one calming reframe or grounding idea, and one " +
    "small, doable next step. Be kind and human, not clinical. Do not diagnose or " +
    "give medical advice. If the message suggests crisis or self-harm, gently " +
    "encourage reaching out to a trusted person or, in the U.S., calling or texting 988.";

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system,
        messages: [{ role: "user", content: `I'm feeling: ${userText}` }],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(r.status).json({ error: "Claude API error", detail });
    }

    const data = await r.json();
    const reflection = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    // Returned under a few key names so it matches whatever your frontend reads
    return res
      .status(200)
      .json({ reflection, text: reflection, result: reflection });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Request failed", detail: String(err) });
  }
}
