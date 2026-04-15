export default async function handler(req, res) {
  // Nagłówki CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { topic } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "Brak klucza API w konfiguracji Vercel" });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    // Wysłanie zapytania do Google
    const googleAiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Stwórz 5 pytań testowych (ABCD) z tematu: ${topic}. 
            Zwróć WYŁĄCZNIE czysty JSON w formacie tablicy obiektów:
            [{"question":"...","answers":["A...","B...","C...","D..."],"correct":"A","explanation":"..."}]`
          }]
        }]
      })
    });

    const data = await googleAiResponse.json();

    if (!googleAiResponse.ok) {
      console.error("Błąd Google API:", data);
      return res.status(googleAiResponse.status).json({ error: "Google API Error", details: data });
    }

    if (!data.candidates || !data.candidates[0]) {
      throw new Error("AI nie zwróciło żadnych wyników.");
    }

    let text = data.candidates[0].content.parts[0].text;

    // Oczyszczanie tekstu z ewentualnego markdownu (```json ... ```)
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }

    // Parsujemy tekst na obiekt, aby upewnić się, że to poprawny JSON
    const quizArray = JSON.parse(text);

    // Wysyłamy odpowiedź do Twojej strony
    res.status(200).json({ text: quizArray });

  } catch (err) {
    console.error("Błąd serwera:", err.message);
    res.status(500).json({ error: "Błąd serwera", details: err.message });
  }
}
