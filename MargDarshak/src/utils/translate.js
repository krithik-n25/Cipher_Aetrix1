const API_KEY = import.meta.env.VITE_TRANSLATE_API_KEY

export async function translateText(text, targetLang) {
  if (!text || targetLang === 'en') return text
  const key = `${text}__${targetLang}`
  const cached = sessionStorage.getItem(key)
  if (cached) return cached
  try {
    if (!API_KEY) return text
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target: targetLang, source: 'en' }),
      }
    )
    const data = await res.json()
    const translated = data.data?.translations?.[0]?.translatedText || text
    sessionStorage.setItem(key, translated)
    return translated
  } catch {
    return text
  }
}

export async function translateBatch(texts, targetLang) {
  return Promise.all(texts.map(t => translateText(t, targetLang)))
}

export async function detectLanguage(text) {
  try {
    if (!API_KEY) return 'en'
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2/detect?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text }),
      }
    )
    const data = await res.json()
    return data.data?.detections?.[0]?.[0]?.language || 'en'
  } catch {
    return 'en'
  }
}
