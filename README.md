# SignSense: AI-Powered American Sign Language (ASL) Translator & Practice Suite

Welcome to **SignSense**, a highly polished, production-ready, full-stack application for American Sign Language (ASL) tracking, translation, and interactive learning. 

This repository features a modern, ultra-responsive **React (Vite) + Tailwind CSS** frontend, a high-performance **Express.js API proxy** with robust offline support, and a dedicated **FastAPI Computer Vision and Neural Prediction Server** powered by **Google MediaPipe Hand Tracking** and the **Google Gemini API**.

---

## Table of Contents
1. [Core Features Overview](#1-core-features-overview)
2. [Full Code Review & System Architecture](#2-full-code-review--system-architecture)
3. [Performance Audit & Optimizations](#3-performance-audit--optimizations)
4. [Accessibility & Usability Enhancements](#4-accessibility--usability-enhancements)
5. [Security Architecture & Audit](#5-security-architecture--audit)
6. [User Guide & Operation Manual](#6-user-guide--operation-manual)
7. [Installation & Local Setup Guide](#7-installation--local-setup-guide)
8. [API & WebSocket Specification](#8-api--websocket-specification)
9. [Production Deployment Guide](#9-production-deployment-guide)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. Core Features Overview

SignSense is built to provide an immersive, barrier-free environment for both ASL learners and fluent speakers.

*   **Real-Time Computer Vision:** Uses **MediaPipe Hands** to identify landmarks on your hands directly in-browser.
*   **Dual Processing Pipelines:**
    *   **HTTP Frame Pull:** High-compatibility REST API endpoint (`/api/translate-frame`) for slower or restricted networks.
    *   **WebSocket Stream:** An ultra-low latency, full-duplex socket channel (`/ws`) for continuous, sub-50ms hand coordinate translation.
*   **Smart Sentence Builder:** Dynamically gathers recognized gestures (letters, words, or full actions) and applies state-of-the-art **Gemini AI Grammar Correction** to instantly output elegant, natural-sounding English sentences.
*   **Aesthetic AI Corrections Card:** Shows a side-by-side comparison of raw transcripts versus AI-suggested sentences, listing grammar fixes, structural improvements, and a description of preserved semantic context.
*   **Multilingual Translation & TTS:** Reads corrected sentences aloud in beautiful, high-fidelity voices (Fenrir, Kore, Zephyr) and translates them into multiple target languages (Hindi, Kannada, Malayalam, etc.) instantly.
*   **Durable Cloud Customization:** Fully integrates with **Firebase Cloud Firestore** to sync custom gestures, practice histories, and daily streaks securely across sessions.
*   **Simulated Offline Fallbacks:** Designed with a robust "Graceful Degradation" engine. When Gemini API keys are not supplied, the app automatically activates high-quality rule-based local grammar correction and a dictionary translation system to keep the workspace 100% functional for local developers.

---

## 2. Full Code Review & System Architecture

```
                             +-----------------------------+
                             |     React (Vite) Client     |
                             |  (MediaPipe Hand Tracking)  |
                             +--------------+--------------+
                                            |
                    +-----------------------+-----------------------+
                    | (REST APIs)                                   | (WebSockets)
                    v                                               v
       +------------+------------+                     +------------+------------+
       |   Express.js API Proxy  |                     |  FastAPI Prediction Srv |
       | (Port 3000 / server.ts) |                     |  (Port 8000 / main.py)  |
       +------------+------------+                     +------------+------------+
                    |                                               |
                    +-----------------------+-----------------------+
                                            |
                                            v
                               +------------+------------+
                               |     Google Gemini API   |
                               | (Neural Language/Vision)|
                               +-------------------------+
```

### Key Modules Checked
1.  `src/App.tsx` (Frontend Interface):
    *   Manages camera hooks, canvas drawing loops, MediaPipe hand trackers, and unified app states.
    *   Implements local storage and optional Firebase sync for `SessionHistory` and `CustomGestures`.
    *   Encapsulates states cleanly to avoid unnecessary re-renders. Dependencies of `useEffect` blocks are strictly bound to primitives.
2.  `server.ts` (Express Gateway):
    *   Secures sensitive credentials (keeps `GEMINI_API_KEY` entirely server-side).
    *   Serves compiled production React assets and acts as a lightweight proxy/fallback layer.
3.  `main.py` (FastAPI Prediction Engine):
    *   Handles heavy multi-threaded calculations.
    *   Maintains websocket connection loops and base64 video stream processing.
    *   Executes localized math heuristics and structures Google Gemini requests for multimodal vision tasks.

---

## 3. Performance Audit & Optimizations

We conducted a thorough performance analysis of our real-time rendering and prediction pipeline:

### Render Loop & Downsampling
*   **Optimized Frame Rate:** Capturing raw 1080p camera frames at 60 FPS causes high CPU overhead and network congestion. SignSense captures, downsamples, and processes frames at a lightweight resolution of **640x480 pixels** at a throttled **5 FPS** for the REST API and **15 FPS** for WebSockets.
*   **Canvas Memory Management:** The camera frame canvas uses a persistent offline `HTMLCanvasElement` cache, preventing constant garbage collection and memory leak spikes.
*   **Debounced State Updates:** Landmark visualizer canvas triggers render frames only when there are actual changes, preventing heavy React virtual DOM recalculations during fast movements.

### WebSocket Connection Backoff & Throttle
*   **Automatic Reconnection:** If the socket drops due to temporary network loss, a **linear backoff algorithm** is used to retry connections safely up to 5 times rather than flooding the backend with infinite tight-loop requests.
*   **Frame Queue Gates:** The websocket pipeline ensures a frame is only sent if the previous frame has been processed (Request-Response validation), completely eliminating buffer overflows and lag.

---

## 4. Accessibility & Usability Enhancements

In keeping with our commitment to accessible software, SignSense is designed for all users:

*   **Keyboard Hotkeys:**
    *   `Spacebar`: Manually freeze/resume video tracking.
    *   `Enter`: Accept current gesture/character into the active sentence.
    *   `Backspace`: Delete the last character.
    *   `Escape`: Clear the current sentence.
*   **High Contrast UI:** Exceeds WCAG AA requirements with light and dark themes designed with slate bases (`#151518`), forest greens (`#1e331e`), and vibrant text colors.
*   **ARIA Attributes:** Every custom button, input field, and visual feedback badge includes explicit `aria-label`, `aria-describedby`, and custom `role` settings to support screen-readers.
*   **Interactive Focus Rings:** Active elements highlight with an emerald-500 focus ring upon keyboard tab focus.
*   **MediaPipe Keyboard Fallback:** A fully responsive visual keyboard tray is available beneath the stream, allowing users with mobility or camera limitations to input signs via mouse clicks or tactile keyboards.

---

## 5. Security Architecture & Audit

A comprehensive security audit has been integrated into SignSense:

1.  **API Key Isolation:** Sensitive credentials like `GEMINI_API_KEY` are **never** bundled or rendered in the frontend. All API interactions are handled by our backend servers via secure REST proxies.
2.  **CORS & Origin Protections:** The FastAPI and Express backends limit allowed origins strictly to the specified runtime environments to block unauthorized external requests.
3.  **Strict Payload Limits:** The Express gateway limits body inputs (`JSON`) to **15MB** to prevent Denial of Service (DoS) attacks from malicious oversized base64 strings.
4.  **Input Sanitation:** Sentences passed to Gemini and translation endpoints are stripped of terminal scripts and formatted using Pydantic schemas in FastAPI and Express validation blocks to prevent prompt-injection style attacks.

---

## 6. User Guide & Operation Manual

To master SignSense, follow this simple workflow:

### Step 1: Camera Setup & Calibration
*   Click the **"Allow Camera"** prompt.
*   Position yourself so your hands are clearly visible in the preview box.
*   An emerald boundary line and hand-mesh skeleton will overlay on your hand when tracked correctly.

### Step 2: Formulating Sentences
*   Hold a gesture (e.g. sign for "H", "E", "L", "L", "O").
*   The system recognizes the sign and highlights it on the screen.
*   Configure the **Smart Sentence Builder** panel:
    *   **Auto-append Mode:** Appends letters or whole words based on hand stability duration.
    *   **Duplicate Filter:** Prevents redundant letters or actions from being repeatedly added.
    *   **Smart Auto-Spacing:** Handles spaces, casing, and punctuation attachments automatically.

### Step 3: AI Review & Polishing
*   Once you've entered a raw sign stream (e.g., "h e l l o how r u"), click **"Improve Grammar with AI"**.
*   The **AI Corrections Card** will display:
    1.  **Original Text** vs **Corrected Text** side-by-side.
    2.  An itemized list of **Grammar Fixes** (such as punctuation correction and letter grouping).
    3.  **Structure Improved** breakdown (explaining how run-ons or fragments were bridged).
    4.  **Preserved Meaning** reassuring note.
*   Click **"Accept & Replace"** to update your text, or **"Reject"** to write your own text.

### Step 4: Outputting Results
*   Click **"Read Aloud"** to activate text-to-speech with a neural or fallback browser voice.
*   Choose a translation language (e.g., Hindi, Malayalam) and click **"Translate"** to review multilingual outputs instantly.

---

## 7. Installation & Local Setup Guide

SignSense can run on any desktop or local server. Follow these steps to set it up:

### Prerequisites
*   Node.js (v18.0.0 or higher)
*   Python (v3.9.0 or higher)
*   Google Gemini API Key (Optional, fallback modes are automatically activated if empty)

### Backend (FastAPI Prediction Engine) Installation
1. Navigate to the project root directory.
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server on port 8000:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Frontend & API Gateway (Express + React) Installation
1. Open a new terminal in the project root directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root based on `.env.example`:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   ```
4. Start the full-stack development workspace:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000` to start using SignSense!

---

## 8. API & WebSocket Specification

### Express Server (REST Endpoints)
All paths are relative to `http://localhost:3000`.

#### 1. Translate Frame
*   **Endpoint:** `POST /api/translate-frame`
*   **Request Body:**
    ```json
    {
      "image": "data:image/jpeg;base64,...",
      "targetGesture": "A"
    }
    ```
*   **Response:**
    ```json
    {
      "predictedChar": "A",
      "confidence": 94.2,
      "explanation": "Predicted with high-accuracy, index finger raised.",
      "tips": ["Keep your hand stable", "Avoid direct backlighting"],
      "grammarMatches": ["Matches letter A in practice set"],
      "simulated": false
    }
    ```

#### 2. AI Grammar Polisher
*   **Endpoint:** `POST /api/improve-grammar`
*   **Request Body:**
    ```json
    {
      "sentence": "h e l l o friend how r u"
    }
    ```
*   **Response:**
    ```json
    {
      "original": "h e l l o friend how r u",
      "corrected": "Hello friend, how are you?",
      "grammarChanges": [
        "Grouped 'h e l l o' characters into 'Hello'.",
        "Expanded 'r u' contraction to 'are you'."
      ],
      "structureImprovements": [
        "Capitalized the first letter of the sentence.",
        "Added appropriate terminal question mark punctuation."
      ],
      "meaningPreserved": "The friendly check-in question was fully retained.",
      "simulated": false
    }
    ```

### FastAPI WebSocket Protocol
*   **URL:** `ws://localhost:8000/ws`
*   **Input Binary Frame:** Send structured JSON strings containing raw frame base64 data:
    ```json
    {
      "image": "data:image/jpeg;base64,...",
      "expected": "A"
    }
    ```
*   **Broadcast Response Frame:**
    ```json
    {
      "char": "A",
      "confidence": 98.1,
      "landmarks": [[0.5, 0.4, -0.1], ...]
    }
    ```

---

## 9. Production Deployment Guide

SignSense is optimized for production-ready hosting environments:

### Frontend (Deploying on Vercel)
Vercel is the recommended hosting platform for our built React Single Page App (SPA).
1. Sign in to your **Vercel** account and create a new project.
2. Select your repository containing this codebase.
3. Ensure the project build settings are configured for a standard **Vite** configuration:
   *   **Framework Preset:** Vite
   *   **Build Command:** `npm run build`
   *   **Output Directory:** `dist`
4. Add the following **Environment Variables** in Vercel settings:
   *   `VITE_API_URL`: The production URL of your FastAPI backend on Render (e.g. `https://signsense-backend.onrender.com`).
   *   `VITE_WS_URL`: The production WebSocket URL of your FastAPI backend on Render (e.g. `wss://signsense-backend.onrender.com/ws`).
5. Click **Deploy**. Vercel will build and serve your static React client with global CDN routing.

### Backend (Deploying on Render)
Render is perfect for hosting high-performance Python FastAPI containers.
1. Sign in to your **Render** dashboard and click **New > Web Service**.
2. Select your repository and select the **Python** environment.
3. Configure the build parameters:
   *   **Build Command:** `pip install -r requirements.txt`
   *   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add the following **Environment Variables** in Render:
   *   `GEMINI_API_KEY`: Your production-grade Google Gemini API key.
5. Select a Plan (free or developer tiers are sufficient) and hit **Deploy**.

---

## 10. Future Roadmap

We have planned several visionary features to elevate SignSense in subsequent versions:

1.  **Multiplayer Sign Language Classrooms:** Build real-time WebRTC collaborative video hubs where teachers can assign signs and see student accuracy charts live.
2.  **Continuous Sentence Recognition:** Enhance our hand coordinate algorithms to interpret full, continuous conversational gestures rather than tracking character-by-character letters or isolated word landmarks.
3.  **Haptic Feedback Wearables Integration:** Integrate third-party Bluetooth smart rings or haptic glove APIs to give learners physical feedback when their finger angles are sub-optimal.
4.  **Generative Sign-to-Video Engine:** Integrate diffusion model interfaces to let users input English text and see high-definition video of an AI avatar demonstrating the correct corresponding signs in real-time.

---

*SignSense is crafted to unlock human potential through seamless technology integration. For inquiries or custom integrations, contact the development team at ritharnapv@gmail.com.*
