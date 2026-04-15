export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { topic } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY; // Zalecane: ustaw GEMINI_API_KEY w panelu Vercel

    try {
    const API_KEY = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    console.log("Wysyłam zapytanie do:", url.replace(API_KEY, "REDACTED")); // loguje URL bez klucza dla bezpieczeństwa

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Temat: ${topic}` }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Błąd API Google:", response.status, errorData);
      return res.status(response.status).json({ error: `Google API Error: ${response.status}`, details: errorData });
    }
    
    // ... reszta kodu (data = await response.json())

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Stwórz 5 pytań testowych (ABCD) z tematu: ${topic}. 
            Zwróć WYŁĄCZNIE czysty JSON w formacie tablicy obiektów:
            [{"question":"...","answers":["A","B","C","D"],"correct":"A","explanation":"..."}]`
          }]
        }]
      })
    });

    const data = await response.json();

    // Sprawdzenie czy AI nie zwróciło błędu
    if (data.error) {
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    let text = data.candidates[0].content.parts[0].text;

    // Wyciąganie JSON (na wypadek gdyby AI dodało markdown typu ```json)
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    res.status(200).json({ text: JSON.parse(text) });

  } catch (err) {
    res.status(500).json({ error: "Błąd serwera: " + err.message });
  }
}
