import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up large JSON limit to allow base64 webcam frame uploads
app.use(express.json({ limit: "15mb" }));

// Lazy-loaded GenAI client to prevent crash if key is not configured yet
let aiClient: any = null;

function getAiClient(): any {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API Health Check Endpoint
app.get("/api/health", (req, res) => {
  const aiAvailable = getAiClient() !== null;
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiConnected: aiAvailable,
    mode: aiAvailable ? "Gemini Neural Recognition" : "Interactive Simulation Mode (No Secrets Configured)",
  });
});

// 2. Multimodal Camera Frame Sign Language Translation Endpoint
app.post("/api/translate-frame", async (req, res): Promise<any> => {
  try {
    const { image, targetGesture } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Missing frame capture data" });
    }

    // Capture Base64 segments
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid canvas base64 image data" });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const ai = getAiClient();

    if (!ai) {
      // Graceful local offline developer simulation if API Key is not set up
      // Delivers realistic letter prediction from user choice or A-Z alphabet to make workspace functional
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const sampleLetters = targetGesture ? [targetGesture] : ["H", "A", "Y", "L", "O", "W"];
      const chosenLetter = sampleLetters[Math.floor(Math.random() * sampleLetters.length)];
      
      const simulatedResponses: Record<string, any> = {
        "A": {
          predictedChar: "A",
          confidence: 94.5,
          explanation: "Strong fist gesture recognized with the thumb resting comfortably flat along the vertical side of the index finger.",
          tips: ["Keep your fingers tightly closed together.", "Avoid tucking your thumb underneath the fingers; push it outward as a support pillar."],
          grammarMatches: ["Symbol for Letter 'A'", "ASL Alphabet Entry #1"]
        },
        "B": {
          predictedChar: "B",
          confidence: 89.2,
          explanation: "Open flat hand layout oriented upwards, with fingers pressed together and index/thumb neatly tucked inside the front.",
          tips: ["Ensure all four main fingers are fully straightened vertically.", "Fold your thumb securely across your upper palm."],
          grammarMatches: ["Symbol for Letter 'B'", "Numerical gesture '4' variation"]
        },
        "C": {
          predictedChar: "C",
          confidence: 91.8,
          explanation: "A clean, semicircular skeletal shape formed by curved fingers and thumb, mimicking a cup structure.",
          tips: ["Keep your palm open to reveal the side curve.", "Ensure the spacing between the fingertips and thumb tip remains clearly aligned."],
          grammarMatches: ["Symbol for letter 'C'"]
        },
        "DEFAULT": {
          predictedChar: chosenLetter,
          confidence: 85.0 + Math.random() * 12.0,
          explanation: `We've detected a distinctive gesture resembling '${chosenLetter}' under localized camera lighting. The joints are angled well with clear outline distinction.`,
          tips: ["Keep your hand centered inside the green detection ring for ideal tracking.", "Minimize background clutter and maintain high contrast shadow lines."],
          grammarMatches: [`Symbol for ${chosenLetter}`, "General gesture sequence"]
        }
      };

      const payload = simulatedResponses[chosenLetter] || simulatedResponses["DEFAULT"];
      
      // Delay slightly to simulate AI network processing
      return setTimeout(() => {
        res.json({
          ...payload,
          simulated: true,
          message: "Secrets not configured in Settings. Using Interactive Developer Sandbox recognition."
        });
      }, 900);
    }

    // Call actual Gemini 3.5 Multimodal model
    const promptText = targetGesture
      ? `You are a certified sign language interpreter. The user is practicing the ASL symbol for "${targetGesture}". Analyze their camera snapshot. Check if they did it correctly, output their prediction, confidence (0-100), detailed feedback explanation and constructive correction tips.`
      : "You are a professional sign language interpreter. Analyze this camera frame image and translate the hand gesture to its corresponding ASL alphabet letter or common sign (like Hello, Please, Thank You, Love). Return prediction, confidence, explanation, and physical correctness tips.";

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: promptText,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: "You are a professional sign language feedback AI. Analyze the uploaded image containing a sign language hand shape, output the correct letter/word, a numeric confidence score, a visual outline description, and a list of 2 or 3 corrective hand-placement improvement tips. You must return EXACTLY valid JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictedChar: {
              type: Type.STRING,
              description: "The primary ASL alphabet letter (A-Z) or greeting word predicted from the hand shape."
            },
            confidence: {
              type: Type.NUMBER,
              description: "Prediction confidence percentage from 0 to 100."
            },
            explanation: {
              type: Type.STRING,
              description: "A description of the fingers, palm rotation, and current joint conformation detected in the image."
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 or 3 operational tips on physical adjustments the user can make to execute a cleaner, more readable sign (e.g., 'Fully extend index finger', 'Separate your thumb')."
            },
            grammarMatches: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Contextual info or words containing this letter."
            }
          },
          required: ["predictedChar", "confidence", "explanation", "tips"]
        }
      }
    });

    const resultText = response.text || "";
    const parsedData = JSON.parse(resultText.trim());

    res.json(parsedData);

  } catch (error: any) {
    console.error("Frame recognition error:", error);
    res.status(500).json({
      error: "AI Vision Translation Failed",
      details: error.message || error
    });
  }
});

// Configure Vite integration or static file rendering
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development mode with live Vite server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting production mode. Serving compiled static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`========================================`);
    console.log(`🚀 SIGN TRANSLATOR SERVER IS LIVE`);
    console.log(`🌐 Local UI available at http://localhost:${PORT}`);
    console.log(`⚙️  API endpoints mapped under http://localhost:${PORT}/api`);
    console.log(`========================================`);
  });
}

startServer();
