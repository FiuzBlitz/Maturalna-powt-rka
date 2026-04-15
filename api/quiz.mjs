export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { topic } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

    const googleAiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Jesteś nauczycielem. Stwórz 5 pytań ABCD na temat: ${topic}. 
            Zwróć TYLKO czysty JSON (tablica obiektów) z polami: 
            "question", "answers" (tablica 4 opcji), "correct" (litera A, B, C lub D), "explanation".`
          }]
        }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await googleAiResponse.json();
    const quizData = JSON.parse(data.candidates[0].content.parts[0].text);

    return res.status(200).json({ text: quizData });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
