from fastapi import APIRouter, Request
from fastapi.responses import Response
from twilio.twiml.messaging_response import MessagingResponse
from engine.rule_engine import classify_urgency, get_triage_message
from services.translator import detect_and_translate
from services.groq_ai import get_ai_response
from services.response_builder import build_reply

router = APIRouter()
chat_histories = {}

SYSTEM_PROMPT = '''You are a rural healthcare assistant in India helping ASHA workers.
Keep replies SHORT and SIMPLE. Never diagnose a disease.
Always recommend 108 for emergencies.
Reply in the same language the user writes in.'''

@router.post('/webhook')
async def webhook(request: Request):
    form = await request.form()
    incoming_msg = form.get('Body', '').strip()
    sender = form.get('From', '')
    if sender not in chat_histories:
        chat_histories[sender] = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    english_text, user_lang = detect_and_translate(incoming_msg)
    urgency = classify_urgency(english_text)
    triage_msg = get_triage_message(urgency)
    chat_histories[sender].append({'role': 'user', 'content': english_text})
    ai_reply = get_ai_response(chat_histories[sender])
    chat_histories[sender].append({'role': 'assistant', 'content': ai_reply})
    final_reply = build_reply(triage_msg, ai_reply, user_lang)
    resp = MessagingResponse()
    resp.message(final_reply)
    return Response(content=str(resp), media_type='application/xml')
