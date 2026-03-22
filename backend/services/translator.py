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
                {"role": "system", "content": "You are a language detector. Identify the ISO-639-1 language code (e.g. en, hi, mr, gu, ta, te) of the text. If it is Romanized/Hinglish, return hi. Respond with ONLY the 2-letter code, nothing else."},
                {"role": "user", "content": text}
            ],
            max_tokens=10
        )
        lang = response_lang.choices[0].message.content.strip().lower()
        return english_text, lang
    except Exception:
        return text, 'en'

def translate_back(text: str, lang: str) -> str:
    """Translate reply back to user's language"""
    if lang == 'en': return text
    try:
        response = client.chat.completions.create(
            model='llama-3.1-8b-instant',
            messages=[
                {"role": "system", "content": f"You are a translation engine. Translate the following English text to the language with ISO code '{lang}'. If the language is 'hi' (Hindi), you can write it in native script. Respond with ONLY the translation, nothing else."},
                {"role": "user", "content": text}
            ],
            max_tokens=400
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return text
