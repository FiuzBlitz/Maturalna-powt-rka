export default async function handler(req, res) {
  // 🔥 CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 🔥 obsługa OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { topic } = req.body;

  try {
const response = await fetch(
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Stwórz 5 pytań testowych (ABCD) z tematu: ${topic}.
Zwróć WYŁĄCZNIE czysty JSON:
[
 {\"question\":\"...\",\"answers\":[\"A...\",\"B...\",\"C...\",\"D...\"],\"correct\":\"A\",\"explanation\":\"...\"}
]`
        }]
      }]
    })
  }
);
    const data = await response.json();
console.log("AI RESPONSE:", JSON.stringify(data));
    let text = data.candidates[0].content.parts[0].text;

    // 🔥 wyciąganie JSON
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");

    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    res.status(200).json({ text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
