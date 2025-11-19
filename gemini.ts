const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;

// Very simple helper: send one user message and get one text reply
export async function callGemini(prompt: string): Promise<string> {
  const url =
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=' +
    GEMINI_API_KEY;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('Gemini API error:', err);
    throw new Error('Gemini request failed');
  }

  const json = await res.json();
  const text =
    json.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not reply.';
  return text;
}