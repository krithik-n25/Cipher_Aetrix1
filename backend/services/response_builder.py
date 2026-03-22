from services.translator import translate_back

def build_reply(triage_msg: str, ai_reply: str, user_lang: str) -> str:
    full_reply = f'{triage_msg}\n\n💬 {ai_reply}'
    return translate_back(full_reply, user_lang)
