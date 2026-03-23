from services.groq_ai import client

def detect_and_translate(text: str) -> tuple:
    """Returns (english_text, detected_lang_code)"""
    try:
        response = client.chat.completions.create(
            model='llama-3.1-8b-instant',
            messages=[
                {"role": "system", "content": "You are a translation engine. Translate the user's text to English. Respond with ONLY the English translation, nothing else."},
                {"role": "user", "content": text}
            ],
            max_tokens=100
        )
        english_text = response.choices[0].message.content.strip()
        
        response_lang = client.chat.completions.create(
            model='llama-3.1-8b-instant',
            messages=[
                {"role": "system", "content": "Identify the language and script of the user's text. Examples: 'English', 'Hinglish' (Hindi in English letters), 'Hindi' (Devanagari), 'Marathi', 'Gujarati'. Respond with ONLY the exact name of the language/script, nothing else."},
                {"role": "user", "content": text}
            ],
            max_tokens=10
        )
        lang = response_lang.choices[0].message.content.strip()
        return english_text, lang
    except Exception:
        return text, 'English'

def translate_back(text: str, lang: str) -> str:
    """Translate reply back to user's language"""
    if 'English' in lang or 'english' in lang.lower(): 
        return text
    try:
        response = client.chat.completions.create(
            model='llama-3.1-8b-instant',
            messages=[
                {"role": "system", "content": f"Translate the following English text to exactly this language format: {lang}. If {lang} implies Hinglish, you MUST use the English alphabet to write Hindi words. Keep it natural and accurate. Do not mistranslate words (e.g., 'plenty of water' means 'bahut saara pani' or 'kafi pani', NOT plastic). Respond with ONLY the translation."},
                {"role": "user", "content": text}
            ],
            max_tokens=400
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return text
