import os
import json
import base64
import random
import asyncio
import urllib.request
import urllib.error
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SignSense Real-time Prediction Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
