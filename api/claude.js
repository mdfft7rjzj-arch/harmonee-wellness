export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Server configuration error."
      });
    }

    const { message, toolType } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a reflection prompt."
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 800,
        system: getSystemPrompt(toolType),
        messages: [
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(response.status).json({
        error: "Unable to complete this reflection right now."
      });
    }

    const text =
      data?.content?.find((item) => item.type === "text")?.text ||
      "No reflection was generated.";

    return res.status(200).json({
      response: text
    });
  } catch (error) {
    console.error("Function error:", error);
    return res.status(500).json({
      error: "Something went wrong while processing your reflection."
    });
  }
}

function getSystemPrompt(toolType) {
  const basePrompt = `
You support Harmonee Wellness, a trauma-informed, culturally aware wellness education brand.

You provide educational reflection support only.
You do not provide therapy, diagnosis, treatment, crisis intervention, or medical advice.
Use a warm, grounded, emotionally intelligent, inclusive tone.
Encourage self-reflection, nervous system awareness, emotional regulation, and practical self-care.
Do not claim to be the user's therapist.
Do not provide clinical diagnosis.
If a user expresses immediate danger, self-harm, or crisis, encourage emergency services or 988 in the U.S.
`;

  const prompts = {
    "self-care-rhythm": `
${basePrompt}

The user is using the Personalized Self-Care Rhythm tool.
Help them create a gentle, realistic self-care rhythm based on energy, responsibilities, sensory needs, emotional capacity, and daily life.
`,

    "journal-check-in": `
${basePrompt}

The user is using the Journal Reflection Check-In tool.
Help them name emotions, notice patterns, and reflect without shame.
Offer thoughtful prompts, not clinical interpretation.
`,

    "hygiene-snapshot": `
${basePrompt}

The user is using the Mental Health Hygiene Snapshot tool.
Help them reflect on stress, rest, support, boundaries, emotional capacity, regulation, and care needs.
`
  };

  return prompts[toolType] || basePrompt;
}
