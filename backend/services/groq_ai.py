import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def get_ai_response(messages: list) -> str:
    response = client.chat.completions.create(
        model='openai/gpt-oss-120b',
        messages=messages,
        max_tokens=400
    )
    return response.choices[0].message.content
