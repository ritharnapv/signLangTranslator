import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

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
        "Hello": {
          predictedChar: "Hello",
          confidence: 95.8,
          explanation: "Flat hand posture aligned vertically at forehead height, swept outwards in an elegant salute motion. High contrast fingers detected against the background.",
          tips: ["Hold your hand flat and tilt your wrist outward.", "Make sure your thumb is tucked close to the side of your index finger."],
          grammarMatches: ["Greeting", "ASL Universal Hello"]
        },
        "Thank You": {
          predictedChar: "Thank You",
          confidence: 92.4,
          explanation: "Flat open palm meeting the lip region and moving gracefully downward and outward facing the reader.",
          tips: ["Ensure your hand starts close to your lips before moving outward.", "Keep your palm facing upward at the end of the sign."],
          grammarMatches: ["Greeting", "Politeness Formula 'Thank You'"]
        },
        "Yes": {
          predictedChar: "Yes",
          confidence: 94.1,
          explanation: "S-hand shape (closed fist) facing outward, rocking vertically forward and back in a rhythmic nodding pattern.",
          tips: ["Keep your fingers tightly closed into a fist mimicking a head shape.", "Tilt your wrist cleanly from top to bottom, not side to side."],
          grammarMatches: ["Agreement", "Affirmation 'Yes'"]
        },
        "No": {
          predictedChar: "No",
          confidence: 93.0,
          explanation: "Index and middle fingers extended together and rapidly striking the extended thumb pad below.",
          tips: ["Keep your ring and pinky fingers fully curled into your palm.", "Perform a crisp double-tap motion for maximum recognition accuracy."],
          grammarMatches: ["Negation", "Refusal 'No'"]
        },
        "Help": {
          predictedChar: "Help",
          confidence: 91.5,
          explanation: "Dominant hand closed in a thumbs-up shape resting squarely on top of the flat, open non-dominant hand, moving upward in a lifting motion.",
          tips: ["Ensure the non-dominant palm acts as a clear flat supporting platform.", "Extend your thumb pointing straight up in a clean thumbs-up posture."],
          grammarMatches: ["Request", "Assistance 'Help'", "SOS Emergency Sign"]
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

// Ensure data/datasets directory exists and seed defaults if empty
const DATASETS_DIR = path.join(process.cwd(), "data", "datasets");
try {
  if (!fs.existsSync(DATASETS_DIR)) {
    fs.mkdirSync(DATASETS_DIR, { recursive: true });
  }
  
  // Seed initial starter datasets if empty to provide robust immediate visual state
  const files = fs.readdirSync(DATASETS_DIR);
  if (files.filter(f => f.endsWith(".json")).length === 0) {
    console.log("Seeding initial starter ASL datasets...");
    
    // Helper to generate simulated 21-joint skeleton coordinates 
    const makeMockJoints = (gesture: string) => {
      const joints = [];
      const variance = gesture === "A" ? 0.05 : gesture === "B" ? 0.12 : 0.08;
      for (let i = 0; i < 21; i++) {
        // Form a physical cascade of palm & finger knuckles
        joints.push({
          x: 0.5 + Math.sin(i / 3) * 0.2 + (Math.random() - 0.5) * variance,
          y: 0.6 - (i / 20) * 0.45 + (Math.random() - 0.5) * variance,
          z: -0.1 + (i / 15) * 0.2 + (Math.random() - 0.5) * variance * 0.1
        });
      }
      return joints;
    };

    const makeSamples = (label: string, count: number) => {
      const samples = [];
      for (let i = 0; i < count; i++) {
        samples.push({
          id: `sample_${label.toLowerCase()}_${Date.now()}_${i}`,
          label: label,
          timestamp: new Date(Date.now() - i * 3600000).toLocaleString(),
          landmarks: makeMockJoints(label)
        });
      }
      return samples;
    };

    // 1. Starter Core Alphabet Dataset
    const alphabetSamples = [
      ...makeSamples("A", 12),
      ...makeSamples("B", 10),
      ...makeSamples("C", 8)
    ];
    const d1 = {
      id: "dataset_asl_alphabet",
      name: "Standard ASL Alphabet Baseline",
      description: "Baseline calibration metrics for letters A, B, and C containing 30 skeletal joint arrays captured from default webcams.",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      samples: alphabetSamples,
      categories: ["A", "B", "C"],
      sampleStatistics: { "A": 12, "B": 10, "C": 8 },
      size: `${Math.round(JSON.stringify(alphabetSamples).length / 1024)} KB`
    };
    fs.writeFileSync(path.join(DATASETS_DIR, "dataset_asl_alphabet.json"), JSON.stringify(d1, null, 2));

    // 2. Greetings and Alerts Sign Language Dataset
    const greetingsSamples = [
      ...makeSamples("HI", 10),
      ...makeSamples("LOVE", 12),
      ...makeSamples("SOS", 6)
    ];
    const d2 = {
      id: "dataset_asl_greetings",
      name: "High Priority ASL Gestures",
      description: "Interactive visual templates for highly used conversational signals and SOS emergency posture layouts.",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      samples: greetingsSamples,
      categories: ["HI", "LOVE", "SOS"],
      sampleStatistics: { "HI": 10, "LOVE": 12, "SOS": 6 },
      size: `${Math.round(JSON.stringify(greetingsSamples).length / 1024)} KB`
    };
    fs.writeFileSync(path.join(DATASETS_DIR, "dataset_asl_greetings.json"), JSON.stringify(d2, null, 2));
    console.log("ASL starter datasets database successfully seeded.");
  }
} catch (err) {
  console.error("Error setting up and seeding datasets directory:", err);
}

// 3. GET all datasets
app.get("/api/datasets", (req, res) => {
  try {
    const list: any[] = [];
    if (fs.existsSync(DATASETS_DIR)) {
      const files = fs.readdirSync(DATASETS_DIR);
      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            const raw = fs.readFileSync(path.join(DATASETS_DIR, file), "utf-8");
            const parsed = JSON.parse(raw);
            list.push(parsed);
          } catch (errJson) {
            console.error(`Error reading dataset JSON file '${file}':`, errJson);
          }
        }
      }
    }
    // Sort by creation time descending
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch datasets", details: error.message });
  }
});

// 4. POST create or upload custom dataset
app.post("/api/datasets", (req, res): Promise<any> | any => {
  try {
    const { id, name, description, samples } = req.body;

    if (!name || !samples || !Array.isArray(samples)) {
      return res.status(400).json({ error: "Name and samples array are required." });
    }

    const uniqueId = id || `dataset_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Generate statistics
    const categoriesSet = new Set<string>();
    const sampleStatistics: Record<string, number> = {};
    
    samples.forEach((sample: any) => {
      const label = (sample.label || "UNKNOWN").toUpperCase();
      categoriesSet.add(label);
      sampleStatistics[label] = (sampleStatistics[label] || 0) + 1;
    });

    const categories = Array.from(categoriesSet);
    const sizeStr = `${Math.round(JSON.stringify(samples).length / 1024)} KB`;

    const newDataset = {
      id: uniqueId,
      name: name,
      description: description || "Custom compiled sign gestures recorded from interactive webcam sandbox sessions.",
      createdAt: new Date().toISOString(),
      samples: samples,
      categories: categories,
      sampleStatistics: sampleStatistics,
      size: sizeStr
    };

    const targetFile = path.join(DATASETS_DIR, `${uniqueId}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(newDataset, null, 2));

    res.status(201).json({
      success: true,
      message: "Dataset compiled and saved successfully to master repository",
      dataset: newDataset
    });
  } catch (error: any) {
    console.error("Error creating dataset:", error);
    res.status(500).json({ error: "Failed to store custom dataset", details: error.message });
  }
});

// 5. DELETE a dataset
app.delete("/api/datasets/:id", (req, res): Promise<any> | any => {
  try {
    const { id } = req.params;
    const targetFile = path.join(DATASETS_DIR, `${id}.json`);

    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
      res.json({ success: true, message: `Dataset '${id}' successfully deleted from host storage.` });
    } else {
      res.status(404).json({ error: "Dataset reference not found on host." });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete dataset", details: error.message });
  }
});

// 6. GET individual dataset JSON download server link
app.get("/api/datasets/:id/download", (req, res): Promise<any> | any => {
  try {
    const { id } = req.params;
    const targetFile = path.join(DATASETS_DIR, `${id}.json`);

    if (fs.existsSync(targetFile)) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${id}.json"`);
      res.sendFile(targetFile);
    } else {
      res.status(404).json({ error: "Dataset file reference not found." });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Download link broken", details: error.message });
  }
});

// 7. POST improve sentence grammar using Gemini or rule-based fallback
app.post("/api/improve-grammar", async (req, res): Promise<any> => {
  try {
    const { sentence } = req.body;
    if (!sentence) {
      return res.status(400).json({ error: "Missing sentence text" });
    }

    const ai = getAiClient();
    if (!ai) {
      // Offline fallback: rule-based grammar improvement
      // 1. Clean up spacing
      let text = sentence.trim().replace(/\s+/g, ' ');
      // 2. Capitalize first letter of each sentence
      text = text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match: string, p1: string, p2: string) => p1 + p2.toUpperCase());
      // 3. Capitalize standalone "i"
      text = text.replace(/\bi\b/g, 'I');
      // 4. Clean up punctuation spacing: "hello , world" -> "hello, world"
      text = text.replace(/\s+([.,!?])/g, '$1');
      // 5. Remove contiguous duplicate words (case-insensitive check, but keep first)
      const words = text.split(' ');
      const deduplicatedWords: string[] = [];
      for (let i = 0; i < words.length; i++) {
        if (i === 0 || words[i].toLowerCase() !== words[i - 1].toLowerCase()) {
          deduplicatedWords.push(words[i]);
        }
      }
      const corrected = deduplicatedWords.join(' ');

      return res.json({
        original: sentence,
        corrected: corrected,
        simulated: true,
        message: "Offline rule-based grammar correction applied."
      });
    }

    // Call actual Gemini model for high-fidelity correction
    const promptText = `You are an expert English linguist and American Sign Language interpreter. The following text has been compiled character-by-character or word-by-word from sign language recognition gestures. It may contain spelling mistakes, missing spaces, lowercase pronouns, raw consecutive words, and redundant duplicate inputs.
Please clean up the text, correct any spelling, expand words if appropriate, merge individual letters where spelling is intended (e.g. "H E L L O" -> "HELLO"), remove unnecessary consecutive duplicate words, adjust capitalization, and return a natural, grammatically correct English sentence.

Input raw sign transcript: "${sentence}"

Output only the corrected, polished English sentence without any introductory or concluding text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
    });

    const corrected = (response.text || "").trim();
    res.json({
      original: sentence,
      corrected: corrected,
      simulated: false
    });

  } catch (error: any) {
    console.error("Grammar improvement error:", error);
    res.status(500).json({ error: "Grammar correction failed", details: error.message });
  }
});

// 8. POST translate output text (multilingual translation)
app.post("/api/translate", async (req, res): Promise<any> => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text to translate" });
    }
    if (!targetLanguage) {
      return res.status(400).json({ error: "Missing target language" });
    }

    const ai = getAiClient();
    if (!ai) {
      // Offline fallback dictionary translation for common words if offline/no key
      const lower = text.trim().toLowerCase();
      const fallbackDb: Record<string, Record<string, string>> = {
        hindi: {
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
        kannada: {
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
          "a": "ಎ", "b": "ಬಿ", "c": "ಸಿ"
        },
        malayalam: {
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
      };

      const langKey = targetLanguage.toLowerCase();
      let translated = "";
      if (langKey === "english") {
        translated = text; // Already English
      } else if (fallbackDb[langKey]) {
        const dict = fallbackDb[langKey];
        if (dict[lower]) {
          translated = dict[lower];
        } else {
          const parts = text.split(/\s+/).map((w: string) => {
            const lw = w.toLowerCase().replace(/[.,!?]/g, "");
            return dict[lw] || w;
          });
          translated = parts.join(" ");
        }
      } else {
        translated = text;
      }

      return res.json({
        original: text,
        translated: translated,
        targetLanguage,
        simulated: true,
        message: "Offline local translation dictionary used."
      });
    }

    const promptText = `You are an expert multilingual translator. Translate the following text from English into ${targetLanguage}.
If the text contains spelling mistakes, first correct it logically before translating.
Maintain the exact emotional tone and meaning. Do not include any explanations, transliterations (unless natural as part of the language), notes, or markdown. Return ONLY the final translated sentence or phrase.

Text: "${text}"

Translated ${targetLanguage} text:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
    });

    const translated = (response.text || "").trim();
    res.json({
      original: text,
      translated: translated,
      targetLanguage,
      simulated: false
    });

  } catch (error: any) {
    console.error("Translation error:", error);
    res.status(500).json({ error: "Translation failed", details: error.message });
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
