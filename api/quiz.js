export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { topic } = req.body;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Stwórz 5 pytań testowych (ABCD) z tematu: ${topic}.
Zwróć czysty JSON:
[
 {\"question\":\"...\",\"answers\":[\"A...\",\"B...\",\"C...\",\"D...\"],\"correct\":\"A\",\"explanation\":\"...\"}
]`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    res.status(200).json({ text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
