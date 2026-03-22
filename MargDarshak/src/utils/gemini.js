const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ─── DANGER PHRASES — English + Hindi + Gujarati + Marathi ───────────────────
const DANGER_PHRASES = [
  // ENGLISH — Cardiac
  'heart attack','cardiac arrest','heart stopped','heart failure','heart fail',
  'chest pain','chest pains','chest tightness','chest pressure','chest heaviness',
  'pain in chest','pain in my chest','tightness in chest','pressure in chest',
  'chest hurts','chest is hurting','my chest hurts','chest is paining',
  'left arm pain','jaw pain',
  // ENGLISH — Breathing
  "can't breathe",'cant breathe','cannot breathe','not breathing',
  'difficulty breathing','hard to breathe','trouble breathing',
  'unable to breathe','struggling to breathe','stopped breathing',
  'shortness of breath','short of breath','out of breath',
  'breathless','breathlessness','no breath','gasping','gasping for air',
  // ENGLISH — Unconscious
  'unconscious','unresponsive','not responding','collapsed','has collapsed',
  'fainted','fainting','passed out','blacked out',
  'not waking up',"won't wake up",'wont wake up','cannot wake',
  'fell unconscious','lost consciousness','loss of consciousness',
  // ENGLISH — Seizure
  'seizure','seizures','having a seizure','convulsion','convulsions','convulsing',
  'fits','having fits','got fits','fitting',
  'body is shaking uncontrollably','jerking','body jerking',
  // ENGLISH — Bleeding
  'vomiting blood','vomited blood','throwing up blood',
  'coughing blood','coughed up blood','blood in cough',
  'blood in vomit','blood in stool','blood in potty',
  'bloody stool','black stool','tarry stool',
  'heavy bleeding','bleeding heavily','bleeding a lot',
  "bleeding won't stop",'bleeding wont stop','cannot stop bleeding',
  'uncontrolled bleeding',
  // ENGLISH — Stroke
  'stroke','having a stroke','brain stroke',
  'face drooping','face is drooping','face dropped','facial droop',
  'arm weakness','one arm weak','one side weak','sudden weakness',
  'slurred speech','speech is slurred',"can't speak",'cant speak','cannot speak',
  'paralysis','paralyzed','body not moving',
  // ENGLISH — Life threat
  'dying','i am dying','going to die','i will die','about to die',
  'feel like dying','might die','could die','will not survive','near death',
  'bachao','emergency','very serious','critical condition','life threatening',
  // ENGLISH — Poison/Snake/Choke
  'snake bite','snakebite','bitten by snake',
  'poisoning','been poisoned','swallowed poison',
  'overdose','took too many pills','took too much medicine',
  'pesticide','kerosene swallowed','chemical swallowed',
  'choking','is choking','something stuck in throat','food stuck at','airway blocked',
  // ENGLISH — Allergic/Burns
  'anaphylaxis','severe allergic reaction',
  'throat swelling','throat is swelling','throat closing','tongue swelling',
  'severe burn','severe burns','electric shock','electrocution',
  // ENGLISH — Pregnancy/Pediatric/Head
  'eclampsia','fits in pregnancy','heavy bleeding in pregnancy',
  'baby not moving','baby stopped moving','no fetal movement',
  'baby not breathing','infant not breathing','baby unconscious','baby having fits',
  'child not breathing','child unconscious',
  'head injury','hit on head','fell and hit head','fell from height','fell from roof',

  // HINDI / HINGLISH
  'dil ka dora','dil ka daura','dil kdard','dil mein dard',
  'seene mein dard','sine mein dard','chhati mein dard',
  'heart mein dard','dil fail','heart fail',
  'sans nahi aa rahi','sans nahi aati','sans lene mein takleef',
  'sans rukk gayi','sans band','saans nahi','saans band',
  'saans lene mein dikkat','dam ghut raha','dam ghut',
  'behosh','behosh ho gaya','behosh ho gayi','behosh pad gaya',
  'murcha','murcha aa gaya','murcha pad gaya','hosh nahi',
  'gir gaya','gir gayi','gir pada',
  'fit aa gaya',
  'jhad bhasya','jhad bhasyi',
  'khoon aa raha','khoon nikal raha','bahut khoon',
  'khoon ki ulti','ulti mein khoon','potty mein khoon',
  'khoon band nahi ho raha',
  'laqwa','ek taraf kamzori',
  'marne wala','marne wali','mar jaunga','mar jaungi','mar jaaunga',
  'mar raha hoon','mar rahi hoon','maut aa rahi',
  'bachao','madad karo',
  'saanp ne kaata','saanp ka kaata',
  'zeher','zeher kha liya','zeher pi liya',
  'gala band','gale mein kuch atka',
  'bijli lagi','current laga',
  'bacha ki saans nahi','bacha behosh',

  // GUJARATI
  'chhati ma dard','chhati dukhe che','chhati ghatt lagay che',
  'dil ma dard','dil nu dard',
  'shvas nathi aavto','shvas leva nathi avtu','dam ghutay che','shvas band',
  'behosh thai gayo','behosh thai gayi','padhi gayo','padhi gayi',
  'hoshkosh nathi','bhaan nathi',
  'fit aavi','aakshep aavyo','jhad bhasyu',
  'lahi aave che','lahi nikalay che','ghanu lahi','lahi bandu nathi',
  'marava nu che','mari jais','mari jais hu','bachavo','madad karo',
  'saanp katyo','zaher pi lidhu','zaher khaadhu',
  'gala ma koi vastu atki','muh vankhu thai gayu',
  'ek baju kamjori','bolai nathi avtu',
  'bijli lagi','current lagyo',
  'baacha ne shvas nathi','baacha behosh',

  // MARATHI
  'chhati dukhtey','chhati dukhat ahe','chhati ghatt vatat ahe',
  'dil mdhye dukhat ahe','dil dukhtey',
  'shvas gheta yet nahi','shvas lavat nahi','dam komdtoy','shvas band zala',
  'behosh zalo','behosh zali','padlo','padli','shudh nahi',
  'fit aali','zhad bhaslay','aakshep aala',
  'rakt yetoye','rakt padtey','khup rakt','rakt thambt nahi',
  'maraycha ahe','marto','marti','vachva','madad kara',
  'saap chawla','vish pyala','vish khalla',
  'gala adklay','tond vakda zala',
  'ek baju shakti nahi','bolata yet nahi',
  'bijli lagi','current laga',
  'bala shvas ghena band kela','bala behosh zala',
]

export function scanForDanger(text) {
  const lower = (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return DANGER_PHRASES.some(p => lower.includes(p))
}

export async function chatWithGemini(conversationHistory, systemPrompt) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts?.[0]?.text || '',
    })),
  ]

  let res
  try {
    res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 300 }),
    })
  } catch {
    throw new Error('Connection failed. Please check your internet.')
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response from assistant.')
  return text
}

const EXTRACTION_PROMPT = `Based on the conversation above, extract a JSON object. Return ONLY raw JSON, no markdown, no backticks, no explanation.

CRITICAL RULES for has_danger_signs — set to TRUE if the patient mentioned ANY of:
- chest pain, heart attack, heart problem
- difficulty breathing, can't breathe, breathless
- unconscious, fainted, collapsed
- seizure, fits, convulsions
- vomiting blood, coughing blood, heavy bleeding
- stroke, face drooping, paralysis
- snake bite, poisoning, overdose
- "going to die", "dying", "marne wala", "bachao", "emergency"
- severe burns, electric shock
- baby not moving, pregnancy bleeding

For symptoms array use these EXACT codes when applicable:
chest_pain, heart_attack, difficulty_breathing, severe_breathlessness, unconscious,
seizure, vomiting_blood, coughing_blood, heavy_bleeding, stroke_signs, facial_droop,
paralysis, snake_bite, poisoning, overdose, choking, cyanosis, anaphylaxis,
fever, high_fever, cough, diarrhea, vomiting, headache, body_ache, weakness,
abdominal_pain, rash, urinary_pain, back_pain, joint_pain, sore_throat

Return this exact structure:
{
  "symptoms": ["exact codes from list above"],
  "duration_days": null,
  "severity": "mild",
  "has_danger_signs": false,
  "patient_age_group": "adult",
  "conversation_summary": "one sentence in English describing the case"
}

severity must be "mild", "moderate", or "severe".
If patient says dying/emergency/heart attack → severity must be "severe" and has_danger_signs must be true.`

export async function extractSymptomData(conversationHistory) {
  const fullText = conversationHistory.map(m => m.parts?.[0]?.text || '').join(' ')
  const dangerDetected = scanForDanger(fullText)

  const historyWithExtraction = [
    ...conversationHistory,
    { role: 'user', parts: [{ text: EXTRACTION_PROMPT }] },
  ]
  const systemPrompt = 'You are a medical data extractor. Return only valid JSON. Never return markdown. Never add explanation.'

  let extracted = null
  try {
    const raw = await chatWithGemini(historyWithExtraction, systemPrompt)
    try { extracted = JSON.parse(_clean(raw)) } catch {
      try {
        const retry = await chatWithGemini(
          [...historyWithExtraction,
           { role: 'model', parts: [{ text: raw }] },
           { role: 'user', parts: [{ text: 'Return ONLY the JSON object, nothing else.' }] }],
          systemPrompt
        )
        extracted = JSON.parse(_clean(retry))
      } catch { extracted = null }
    }
  } catch { extracted = null }

  if (!extracted) extracted = _fallback()

  // Override: if danger scan found danger words, force correct values
  if (dangerDetected) {
    extracted.has_danger_signs = true
    extracted.severity = 'severe'
    const lower = fullText.toLowerCase()
    if (lower.includes('heart attack') || lower.includes('dil ka dora') || lower.includes('dil ka daura')) {
      if (!extracted.symptoms.includes('heart_attack')) extracted.symptoms.push('heart_attack')
      if (!extracted.symptoms.includes('chest_pain')) extracted.symptoms.push('chest_pain')
    }
    if (lower.includes('chest pain') || lower.includes('seene mein dard') || lower.includes('chhati ma dard') || lower.includes('chhati dukhtey')) {
      if (!extracted.symptoms.includes('chest_pain')) extracted.symptoms.push('chest_pain')
    }
    if (lower.includes('breathless') || lower.includes("can't breathe") || lower.includes('cant breathe') || lower.includes('saans nahi') || lower.includes('shvas nathi') || lower.includes('shvas gheta yet nahi')) {
      if (!extracted.symptoms.includes('difficulty_breathing')) extracted.symptoms.push('difficulty_breathing')
    }
    if (lower.includes('unconscious') || lower.includes('behosh') || lower.includes('fainted') || lower.includes('behosh zalo') || lower.includes('behosh thai')) {
      if (!extracted.symptoms.includes('unconscious')) extracted.symptoms.push('unconscious')
    }
    if (lower.includes('seizure') || lower.includes('fits') || lower.includes('convulsion') || lower.includes('fit aavi') || lower.includes('fit aali') || lower.includes('mirgi')) {
      if (!extracted.symptoms.includes('seizure')) extracted.symptoms.push('seizure')
    }
  }

  return extracted
}

function _clean(text) {
  return text.replace(/```json/gi, '').replace(/```/g, '').trim()
}

function _fallback() {
  return {
    symptoms: ['general_discomfort'],
    duration_days: null,
    severity: 'mild',
    has_danger_signs: false,
    patient_age_group: 'adult',
    conversation_summary: 'Patient reported symptoms via conversation',
  }
}
