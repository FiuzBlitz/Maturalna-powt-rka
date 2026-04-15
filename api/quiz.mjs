export default async function handler(req, res) {
  // 1. Nagłówki CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { topic } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "Brak klucza API w konfiguracji Vercel" });
  }

  try {
    // Adres URL dla modelu Gemini 3 Flash Preview
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

    const googleAiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Stwórz 5 pytań testowych (ABCD) z tematu: ${topic}. 
            Zwróć WYŁĄCZNIE czysty JSON w formacie tablicy obiektów:
            [{"question":"...","answers":["A...","B...","C...","D..."],"correct":"A","explanation":"..."}]`
          }]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    const data = await googleAiResponse.json();

    if (!googleAiResponse.ok) {
      return res.status(googleAiResponse.status).json({ 
        error: "Błąd Google API", 
        details: data.error ? data.error.message : data 
      });
    }

    if (!data.candidates || !data.candidates[0]) {
      throw new Error("AI nie zwróciło odpowiedzi.");
    }

    const text = data.candidates[0].content.parts[0].text;
    
    // Parsujemy tekst na obiekt JSON, aby upewnić się, że jest poprawny
    const quizData = JSON.parse(text);

    return res.status(200).json({ text: quizData });

  } catch (err) {
    console.error("Błąd serwera:", err.message);
    return res.status(500).json({ 
      error: "Błąd wewnętrzny serwera", 
      details: err.message 
    });
  }
}
