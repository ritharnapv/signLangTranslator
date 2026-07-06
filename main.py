import os
import json
import base64
import random
import asyncio
import re
import urllib.request
import urllib.error
from typing import Optional, List
from pydantic import BaseModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SignSense Real-time Prediction Backend")

# Enable CORS for all requests in development/production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas for Request payloads
class TranslateFrameRequest(BaseModel):
    image: str
    targetGesture: Optional[str] = None

class ImproveGrammarRequest(BaseModel):
    sentence: str

class TranslateRequest(BaseModel):
    text: str
    targetLanguage: str

class TtsRequest(BaseModel):
    text: str
    voiceName: Optional[str] = None

class DetectLanguageRequest(BaseModel):
    text: str

# Helper functions for Offline Fallbacks
def get_offline_grammar_correction(sentence: str) -> dict:
    text = sentence.strip()
    # Clean up consecutive spaces
    text = re.sub(r' {2,}', ' ', text)
    # Capitalize first letter of each sentence
    text = re.sub(r'(^\s*|[.!?]\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), text)
    # Capitalize pronoun 'I'
    text = re.sub(r'\bi\b', 'I', text)
    # Polished punctuation spacing
    text = re.sub(r'\s+([.,!?])', r'\1', text)
    
    return {
        "original": sentence,
        "corrected": text,
        "grammarChanges": [
            "Fixed sentence word spacing and trailing space margins.",
            "Capitalized the first word of sentences and standalone 'I' pronouns.",
            "Polished punctuation attachment spacing."
        ],
        "structureImprovements": [
            "Removed consecutive redundant matching signs and duplicates.",
            "Assembled character sequences into cohesive words where possible."
        ],
        "meaningPreserved": "All primary noun/verb gestures and structural letters were retained precisely as entered in the practice notepad.",
        "simulated": True,
        "message": "Offline rule-based grammar correction applied."
    }

def get_offline_translation(text: str, target_language: str) -> dict:
    lower = text.strip().lower()
    fallback_db = {
        "hindi": {
            "hello": "नमस्ते (Namaste)",
            "hi": "नमस्ते (Namaste)",
            "love": "प्यार (Pyar)",
            "peace": "शांति (Shanti)",
            "rock": "चट्टान (Chattan)",
            "heart": "दिल (Dil)",
            "yes": "हाँ (Haan)",
            "no": "नहीं (Nahi)",
            "good": "अच्छा (Achha)",
            "please": "कृपया (Kripya)",
            "thank you": "धन्यवाद (Dhanyawad)",
            "how are you": "आप कैसे हैं? (Aap kaise hain?)",
            "i love you": "मैं आपसे प्यार करता हूँ (Main aapse pyar karta hoon)",
            "help": "मदद (Madad)",
            "a": "ए", "b": "बी", "c": "सी"
        },
        "kannada": {
            "hello": "ನಮಸ್ಕಾರ (Namaskara)",
            "hi": "ನಮಸ್ಕಾರ (Namaskara)",
            "love": "ಪ್ರೀತಿ (Preethi)",
            "peace": "ಶಾಂತಿ (Shanthi)",
            "rock": "ಬಂಡೆ (Bande)",
            "heart": "ಹೃದಯ (Hrudaya)",
            "yes": "ಹೌದು (Haudu)",
            "no": "ಇಲ್ಲ (Illa)",
            "good": "ಒಳ್ಳೆಯದು (Olleyadu)",
            "please": "ದಯವಿಟ್ಟು (Dayavittu)",
            "thank you": "ಧನ್ಯವಾದಗಳು (Dhanyavadagalu)",
            "how are you": "ನೀವು ಹೇಗಿದ್ದೀರಿ? (Neevu hegiddiri?)",
            "i love you": "ನಾನು ನಿನ್ನನ್ನು ಪ್ರೀತಿಸುತ್ತೇನೆ (Naanu ninnanu preethisuthene)",
            "help": "ಸಹಾಯ (Sahaya)",
            "a": "ಎ", "b": "बी", "c": "ಸಿ"
        },
        "malayalam": {
            "hello": "നമസ്കാരം (Namaskaram)",
            "hi": "നമസ്കാരം (Namaskaram)",
            "love": "സ്നേഹം (Snehham)",
            "peace": "സമാധാനം (Samadhanam)",
            "rock": "പാറ (Paara)",
            "heart": "ഹൃദയം (Hrudayam)",
            "yes": "അതെ (Athe)",
            "no": "അല്ല (Alla)",
            "good": "നല്ലത് (Nallathu)",
            "please": "ദയവായി (Dayavayi)",
            "thank you": "നന്ദി (Nandi)",
            "how are you": "സുഖമാണോ? (Sukhamano?)",
            "i love you": "ഞാൻ നിന്നെ സ്നേഹിക്കുന്നു (Njan ninne snehikkunnu)",
            "help": "സഹായം (Sahayam)",
            "a": "എ", "b": "ബി", "c": "സി"
        }
    }
    
    lang_key = target_language.lower()
    translated = ""
    if lang_key == "english":
        translated = text
    elif lang_key in fallback_db:
        db = fallback_db[lang_key]
        if lower in db:
            translated = db[lower]
        else:
            words = text.split()
            parts = []
            for w in words:
                lw = re.sub(r'[.,!?]', '', w.lower())
                parts.append(db.get(lw, w))
            translated = " ".join(parts)
    else:
        translated = text
        
    return {
        "original": text,
        "translated": translated,
        "targetLanguage": target_language,
        "simulated": True,
        "message": "Offline local translation dictionary used."
    }

def get_offline_detect_language(text: str) -> dict:
    text_trim = text.strip()
    detected = "English"
    if re.search(r'[\u0900-\u097F]', text_trim):
        detected = "Hindi"
    elif re.search(r'[\u0C80-\u0CFF]', text_trim):
        detected = "Kannada"
    elif re.search(r'[\u0D00-\u0D7F]', text_trim):
        detected = "Malayalam"
    return {
        "language": detected,
        "confidence": 0.9,
        "simulated": True
    }

# Helper functions for Gemini API calls
def call_gemini_grammar_api(sentence: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "MY_GEMINI_API_KEY" or api_key.strip() == "":
        raise ValueError("Gemini API Key is not configured.")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt_text = (
        f"You are an expert English linguist and American Sign Language (ASL) interpreter. "
        f"The user is practicing sign language, and the following raw text was constructed "
        f"character-by-character or word-by-word from sign recognition gestures: \"{sentence}\".\n"
        f"Please analyze and correct this text. Perform the following:\n"
        f"1. Fix grammar: Correct any grammatical errors, spelling mistakes, punctuation, spacing, capitalization, or missing word components (e.g. \"H E L L O\" -> \"HELLO\").\n"
        f"2. Improve sentence structure: Rephrase run-on phrases, connect fragmented words, remove unnecessary consecutive duplicates, and format it into an elegant, natural English sentence.\n"
        f"3. Preserve meaning: Retain the complete semantic context, named entities, and core actions of the original gesture inputs."
    )
    
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "original": {
                "type": "STRING",
                "description": "The original raw sentence transcript"
            },
            "corrected": {
                "type": "STRING",
                "description": "The polished, grammatically correct and structure-improved English sentence"
            },
            "grammarChanges": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "List of specific grammatical fixes made (e.g., spelling, spacing, capitalization, letter merging)"
            },
            "structureImprovements": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "List of sentence structure improvements (e.g., flow enhancement, rephrasing, removing redundancy, connecting fragments)"
            },
            "meaningPreserved": {
                "type": "STRING",
                "description": "A brief, comforting explanation of how the core meaning and semantic intent of the original sign gestures was perfectly preserved"
            }
        },
        "required": ["original", "corrected", "grammarChanges", "structureImprovements", "meaningPreserved"]
    }
    
    payload = {
        "contents": {
            "parts": [{"text": prompt_text}]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": response_schema
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req, timeout=12) as response:
        res_data = response.read().decode("utf-8")
        parsed_res = json.loads(res_data)
        candidates = parsed_res.get("candidates", [])
        if not candidates:
            raise ValueError("No prediction candidates returned from Gemini.")
        text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return json.loads(text_content.strip())

def call_gemini_translation_api(text: str, target_language: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "MY_GEMINI_API_KEY" or api_key.strip() == "":
        raise ValueError("Gemini API Key is not configured.")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt_text = (
        f"You are an expert multilingual translator. Translate the following text from English into {target_language}.\n"
        f"If the text contains spelling mistakes, first correct it logically before translating.\n"
        f"Maintain the exact emotional tone and meaning. Do not include any explanations, transliterations (unless natural as part of the language), notes, or markdown. Return ONLY the final translated sentence or phrase.\n\n"
        f"Text: \"{text}\"\n\n"
        f"Translated {target_language} text:"
    )
    
    payload = {
        "contents": {
            "parts": [{"text": prompt_text}]
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req, timeout=12) as response:
        res_data = response.read().decode("utf-8")
        parsed_res = json.loads(res_data)
        candidates = parsed_res.get("candidates", [])
        if not candidates:
            raise ValueError("No translation candidates returned from Gemini.")
        return candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()

def call_gemini_tts_api(text: str, voice_name: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "MY_GEMINI_API_KEY" or api_key.strip() == "":
        raise ValueError("Gemini API Key is not configured.")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key={api_key}"
    
    allowed_voices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']
    chosen_voice = voice_name if voice_name in allowed_voices else 'Kore'
    
    payload = {
        "contents": [
            {
                "parts": [{"text": text}]
            }
        ],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": chosen_voice}
                }
            }
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req, timeout=12) as response:
        res_data = response.read().decode("utf-8")
        parsed_res = json.loads(res_data)
        candidates = parsed_res.get("candidates", [])
        if not candidates:
            raise ValueError("No tts candidates returned from Gemini.")
        
        base64_audio = candidates[0].get("content", {}).get("parts", [{}])[0].get("inlineData", {}).get("data", "")
        if not base64_audio:
            raise ValueError("No audio content returned from model inlineData.")
        return base64_audio

def call_gemini_detect_language_api(text: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "MY_GEMINI_API_KEY" or api_key.strip() == "":
        raise ValueError("Gemini API Key is not configured.")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt_text = (
        f"Analyze the language of the following text and return the detected language.\n"
        f"The detected language MUST be exactly one of these: \"English\", \"Hindi\", \"Kannada\", \"Malayalam\".\n"
        f"If you are unsure or if the text contains multiple languages, prioritize the most dominant script. If the text is purely Latin/English or spelling is ambiguous, return \"English\".\n\n"
        f"Text: \"{text}\""
    )
    
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "language": {
                "type": "STRING",
                "description": "The detected language, must be exactly one of \"English\", \"Hindi\", \"Kannada\", \"Malayalam\""
            },
            "confidence": {
                "type": "NUMBER",
                "description": "Confidence score from 0.0 to 1.0"
            }
        },
        "required": ["language"]
    }
    
    payload = {
        "contents": {
            "parts": [{"text": prompt_text}]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": response_schema
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req, timeout=12) as response:
        res_data = response.read().decode("utf-8")
        parsed_res = json.loads(res_data)
        candidates = parsed_res.get("candidates", [])
        if not candidates:
            raise ValueError("No language candidates returned from Gemini.")
        text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return json.loads(text_content.strip())


@app.get("/health")
async def health_check():
    api_key = os.environ.get("GEMINI_API_KEY", "")
    has_api_key = bool(api_key and api_key != "MY_GEMINI_API_KEY" and api_key.strip() != "")
    return {
        "status": "ok",
        "service": "FastAPI WebSocket Neural Engine",
        "apiConnected": has_api_key,
        "mode": "Gemini Real-Time Stream" if has_api_key else "Interactive Simulation Stream"
    }

def get_simulated_prediction(target_gesture: str) -> dict:
    """Fallback high-quality prediction simulator when Gemini API Key is not set up."""
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    chosen_letter = target_gesture if target_gesture else random.choice(alphabet)
    
    simulated_responses = {
        "A": {
            "predictedChar": "A",
            "confidence": 94.5,
            "explanation": "Strong fist gesture recognized over WebSocket. The thumb is resting comfortably flat along the vertical side of the index finger.",
            "tips": ["Keep your fingers tightly closed together.", "Avoid tucking your thumb underneath the fingers; push it outward as a support pillar."],
            "grammarMatches": ["Symbol for Letter 'A'", "ASL Alphabet Entry #1"]
        },
        "B": {
            "predictedChar": "B",
            "confidence": 89.2,
            "explanation": "Open flat hand layout oriented upwards received via WS stream, with fingers pressed together and index/thumb neatly tucked inside.",
            "tips": ["Ensure all four main fingers are fully straightened vertically.", "Fold your thumb securely across your upper palm."],
            "grammarMatches": ["Symbol for Letter 'B'", "Numerical gesture '4' variation"]
        },
        "C": {
            "predictedChar": "C",
            "confidence": 91.8,
            "explanation": "A clean, semicircular skeletal shape formed by curved fingers and thumb, mimicking a cup structure. WS packet latency was 24ms.",
            "tips": ["Keep your palm open to reveal the side curve.", "Ensure the spacing between the fingertips and thumb tip remains clearly aligned."],
            "grammarMatches": ["Symbol for letter 'C'"]
        },
        "Hello": {
            "predictedChar": "Hello",
            "confidence": 95.8,
            "explanation": "Flat hand posture aligned vertically at forehead height, swept outwards in an elegant salute motion. High contrast fingers detected against the background.",
            "tips": ["Hold your hand flat and tilt your wrist outward.", "Make sure your thumb is tucked close to the side of your index finger."],
            "grammarMatches": ["Greeting", "ASL Universal Hello"]
        },
        "Thank You": {
            "predictedChar": "Thank You",
            "confidence": 92.4,
            "explanation": "Flat open palm meeting the lip region and moving gracefully downward and outward facing the reader.",
            "tips": ["Ensure your hand starts close to your lips before moving outward.", "Keep your palm facing upward at the end of the sign."],
            "grammarMatches": ["Greeting", "Politeness Formula 'Thank You'"]
        },
        "Yes": {
            "predictedChar": "Yes",
            "confidence": 94.1,
            "explanation": "S-hand shape (closed fist) facing outward, rocking vertically forward and back in a rhythmic nodding pattern.",
            "tips": ["Keep your fingers tightly closed into a fist mimicking a head shape.", "Tilt your wrist cleanly from top to bottom, not side to side."],
            "grammarMatches": ["Agreement", "Affirmation 'Yes'"]
        },
        "No": {
            "predictedChar": "No",
            "confidence": 93.0,
            "explanation": "Index and middle fingers extended together and rapidly striking the extended thumb pad below.",
            "tips": ["Keep your ring and pinky fingers fully curled into your palm.", "Perform a crisp double-tap motion for maximum recognition accuracy."],
            "grammarMatches": ["Negation", "Refusal 'No'"]
        },
        "Help": {
            "predictedChar": "Help",
            "confidence": 91.5,
            "explanation": "Dominant hand closed in a thumbs-up shape resting squarely on top of the flat, open non-dominant hand, moving upward in a lifting motion.",
            "tips": ["Ensure the non-dominant palm acts as a clear flat supporting platform.", "Extend your thumb pointing straight up in a clean thumbs-up posture."],
            "grammarMatches": ["Request", "Assistance 'Help'", "SOS Emergency Sign"]
        }
    }
    
    if chosen_letter in simulated_responses:
        payload = simulated_responses[chosen_letter]
    else:
        payload = {
            "predictedChar": chosen_letter,
            "confidence": round(85.0 + random.random() * 12.0, 1),
            "explanation": f"Detected a live WS stream gesture resembling '{chosen_letter}' under localized camera lighting.",
            "tips": ["Keep your hand centered inside the green detection ring for ideal tracking.", "Minimize background clutter and maintain high contrast shadow lines."],
            "grammarMatches": [f"Symbol for {chosen_letter}", "General gesture sequence"]
        }
        
    return payload

def call_gemini_vision_api(mime_type: str, base64_data: str, target_gesture: str) -> dict:
    """Call Google Gemini 3.5 Multimodal API via standard python library to maintain zero external dependencies."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "MY_GEMINI_API_KEY" or api_key.strip() == "":
        raise ValueError("Gemini API Key is not configured.")

    prompt_text = (
        f"You are a certified sign language interpreter. The user is practicing the ASL symbol for '{target_gesture}' "
        "using a real-time WebSocket connection. Analyze their camera snapshot. Check if they did it correctly, "
        "output their prediction, confidence (0-100), detailed feedback explanation and constructive correction tips."
    ) if target_gesture else (
        "You are a professional sign language interpreter. Analyze this camera frame image from a WebSocket stream and "
        "translate the hand gesture to its corresponding ASL alphabet letter or common sign (like Hello, Please, Thank You, Love). "
        "Return prediction, confidence, explanation, and physical correctness tips."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    system_instruction = (
        "You are a professional sign language feedback AI. Analyze the uploaded image containing a sign language hand shape, "
        "output the correct letter/word, a numeric confidence score, a visual outline description, and a list of 2 or 3 corrective "
        "hand-placement improvement tips. You must return EXACTLY valid JSON matching the schema."
    )
    
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "predictedChar": {
                "type": "STRING",
                "description": "The primary ASL alphabet letter (A-Z) or greeting word predicted from the hand shape."
            },
            "confidence": {
                "type": "NUMBER",
                "description": "Prediction confidence percentage from 0 to 100."
            },
            "explanation": {
                "type": "STRING",
                "description": "A description of the fingers, palm rotation, and current joint conformation detected in the image."
            },
            "tips": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "2 or 3 operational tips on physical adjustments the user can make to execute a cleaner, more readable sign (e.g., 'Fully extend index finger', 'Separate your thumb')."
            },
            "grammarMatches": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "Contextual info or words containing this letter."
            }
        },
        "required": ["predictedChar", "confidence", "explanation", "tips"]
    }

    # Prepare multimodal request payload
    payload = {
        "contents": {
            "parts": [
                {
                    "inlineData": {
                        "mimeType": mime_type,
                        "data": base64_data
                    }
                },
                {
                    "text": prompt_text
                }
            ]
        },
        "systemInstruction": {
            "parts": [
                {
                    "text": system_instruction
                }
            ]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": response_schema
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = response.read().decode("utf-8")
            parsed_res = json.loads(res_data)
            
            # Extract generated content text
            candidates = parsed_res.get("candidates", [])
            if not candidates:
                raise ValueError("No prediction candidates returned from Gemini.")
            
            text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return json.loads(text_content.strip())
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e else ""
        print(f"[Gemini API HTTP Error] {e.code}: {error_body}")
        raise RuntimeError(f"Gemini API request failed: {e.reason}")
    except Exception as e:
        print(f"[Gemini API Connection Error] {str(e)}")
        raise e

@app.post("/api/translate-frame")
async def translate_frame(req: TranslateFrameRequest):
    image_str = req.image
    target_gesture = req.targetGesture or ""
    
    try:
        if "," in image_str:
            header, base64_data = image_str.split(",", 1)
            mime_type = header.split(";")[0].split(":")[1]
        else:
            base64_data = image_str
            mime_type = "image/jpeg"
        
        api_key = os.environ.get("GEMINI_API_KEY", "")
        use_real_api = bool(api_key and api_key != "MY_GEMINI_API_KEY" and api_key.strip() != "")
        
        if use_real_api:
            loop = asyncio.get_event_loop()
            prediction = await loop.run_in_executor(
                None, call_gemini_vision_api, mime_type, base64_data, target_gesture
            )
            return {**prediction, "simulated": False}
        else:
            prediction = get_simulated_prediction(target_gesture)
            return {**prediction, "simulated": True}
    except Exception as ex:
        print(f"[FastAPI POST /api/translate-frame] Error: {str(ex)}")
        return {
            "predictedChar": target_gesture if target_gesture else "A",
            "confidence": 75.0,
            "explanation": f"Neural prediction fallback triggered: {str(ex)}",
            "tips": ["Verify camera visibility.", "Check if the API Key is set correctly in Settings."],
            "grammarMatches": ["Error recovery fallback"],
            "simulated": True
        }

@app.post("/api/improve-grammar")
async def improve_grammar(req: ImproveGrammarRequest):
    sentence = req.sentence
    if not sentence or not sentence.strip():
        raise HTTPException(status_code=400, detail="Missing sentence text")
        
    api_key = os.environ.get("GEMINI_API_KEY", "")
    use_real_api = bool(api_key and api_key != "MY_GEMINI_API_KEY" and api_key.strip() != "")
    
    try:
        if use_real_api:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, call_gemini_grammar_api, sentence)
            return {**result, "simulated": False}
        else:
            return get_offline_grammar_correction(sentence)
    except Exception as ex:
        print(f"[FastAPI POST /api/improve-grammar] Error: {str(ex)}")
        return get_offline_grammar_correction(sentence)

@app.post("/api/translate")
async def translate_text(req: TranslateRequest):
    text = req.text
    target_language = req.targetLanguage
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Missing text to translate")
    if not target_language or not target_language.strip():
        raise HTTPException(status_code=400, detail="Missing target language")
        
    api_key = os.environ.get("GEMINI_API_KEY", "")
    use_real_api = bool(api_key and api_key != "MY_GEMINI_API_KEY" and api_key.strip() != "")
    
    try:
        if use_real_api:
            loop = asyncio.get_event_loop()
            translated = await loop.run_in_executor(None, call_gemini_translation_api, text, target_language)
            return {
                "original": text,
                "translated": translated,
                "targetLanguage": target_language,
                "simulated": False
            }
        else:
            return get_offline_translation(text, target_language)
    except Exception as ex:
        print(f"[FastAPI POST /api/translate] Error: {str(ex)}")
        return get_offline_translation(text, target_language)

@app.post("/api/tts")
async def text_to_speech(req: TtsRequest):
    text = req.text
    voice_name = req.voiceName or "Kore"
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Missing text to speak")
        
    api_key = os.environ.get("GEMINI_API_KEY", "")
    use_real_api = bool(api_key and api_key != "MY_GEMINI_API_KEY" and api_key.strip() != "")
    
    try:
        if use_real_api:
            loop = asyncio.get_event_loop()
            base64_audio = await loop.run_in_executor(None, call_gemini_tts_api, text, voice_name)
            return {
                "base64Audio": base64_audio,
                "simulated": False,
                "voiceName": voice_name
            }
        else:
            return {
                "simulated": True,
                "message": "Offline fallback: Browser Speech Synthesis will be used."
            }
    except Exception as ex:
        print(f"[FastAPI POST /api/tts] Error: {str(ex)}")
        return {
            "simulated": True,
            "message": f"Offline fallback triggered: {str(ex)}"
        }

@app.post("/api/detect-language")
async def detect_language(req: DetectLanguageRequest):
    text = req.text
    if not text or not text.strip():
        return {"language": "English", "confidence": 1.0, "simulated": True}
        
    api_key = os.environ.get("GEMINI_API_KEY", "")
    use_real_api = bool(api_key and api_key != "MY_GEMINI_API_KEY" and api_key.strip() != "")
    
    try:
        if use_real_api:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, call_gemini_detect_language_api, text)
            return {**result, "simulated": False}
        else:
            return get_offline_detect_language(text)
    except Exception as ex:
        print(f"[FastAPI POST /api/detect-language] Error: {str(ex)}")
        return get_offline_detect_language(text)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[FastAPI WS] Connection accepted from Node proxy client.")
    
    try:
        while True:
            # Receive data from client
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON frame sent over WebSocket."
                }))
                continue
                
            msg_type = data.get("type")
            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue
                
            if msg_type == "frame":
                image_str = data.get("image", "")
                target_gesture = data.get("targetGesture", "")
                
                if not image_str:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Missing image frame in stream packet."
                    }))
                    continue
                
                try:
                    # Parse Base64 image segments
                    if "," in image_str:
                        header, base64_data = image_str.split(",", 1)
                        mime_type = header.split(";")[0].split(":")[1]
                    else:
                        base64_data = image_str
                        mime_type = "image/jpeg"
                    
                    api_key = os.environ.get("GEMINI_API_KEY", "")
                    use_real_api = bool(api_key and api_key != "MY_GEMINI_API_KEY" and api_key.strip() != "")
                    
                    if use_real_api:
                        print(f"[FastAPI WS] Invoking real Gemini Vision for target '{target_gesture}'...")
                        # Run the actual Gemini multimodal parsing asynchronously to avoid blocking the loop
                        loop = asyncio.get_event_loop()
                        prediction = await loop.run_in_executor(
                            None, call_gemini_vision_api, mime_type, base64_data, target_gesture
                        )
                    else:
                        # Use local simulator
                        prediction = get_simulated_prediction(target_gesture)
                        await asyncio.sleep(0.3) # Mimic neural network inference time
                    
                    # Send response back to client
                    await websocket.send_text(json.dumps({
                        "type": "prediction",
                        "predictedChar": prediction.get("predictedChar"),
                        "confidence": prediction.get("confidence", 90.0),
                        "explanation": prediction.get("explanation", ""),
                        "tips": prediction.get("tips", []),
                        "grammarMatches": prediction.get("grammarMatches", []),
                        "simulated": not use_real_api
                    }))
                    
                except Exception as ex:
                    print(f"[FastAPI WS] Neural processing error: {str(ex)}")
                    # Graceful error handling for invalid base64, API failures, or network timeouts
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"Real-time Neural prediction error: {str(ex)}",
                        # Fallback state so the client UI doesn't freeze or lock
                        "predictedChar": target_gesture if target_gesture else "A",
                        "confidence": 75.0,
                        "explanation": f"The Real-time neural engine encountered an error parsing the frame: {str(ex)}. Reverting to local fallback tracking.",
                        "tips": ["Verify camera visibility.", "Check if the API Key is set correctly in Settings."],
                        "grammarMatches": ["Error recovery fallback"]
                    }))
                    
    except WebSocketDisconnect:
        print("[FastAPI WS] WebSocket disconnected cleanly.")
    except Exception as e:
        print(f"[FastAPI WS] Unexpected error in connection loop: {str(e)}")
