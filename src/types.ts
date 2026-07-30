export interface ASLGesture {
  id: string;
  char: string;
  videoUrl?: string;
  description: string;
  category: 'alphabet' | 'greeting' | 'common' | 'custom' | string;
  visualTip: string;
  meaning?: string;
  synonyms?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  steps?: string[];
  grammaticalRole?: string;
}

export interface TranslationResult {
  predictedChar: string;
  confidence: number;
  explanation: string;
  tips: string[];
  grammarMatches?: string[];
  detectedEmotion?: 'happy' | 'sad' | 'angry' | 'neutral' | string;
}

export interface MilestoneDay {
  day: number;
  title: string;
  focusArea: string;
  description: string;
  tasks: string[];
  status: 'completed' | 'active' | 'upcoming';
}

export interface SessionHistoryItem {
  id: string;
  timestamp: string;
  caption: string;
  confidence: number;
  canvasImage?: string; // fallback base64
  emotion?: 'happy' | 'sad' | 'angry' | 'neutral' | string;
}

export interface CollectedSample {
  id: string;
  label: string;
  timestamp: string;
  landmarks: Array<{x: number, y: number, z: number}>;
  sequenceOfLandmarks?: Array<Array<{x: number, y: number, z: number}>>;
  leftHandLandmarks?: Array<{x: number, y: number, z: number}>;
  rightHandLandmarks?: Array<{x: number, y: number, z: number}>;
  sequenceOfLeftHandLandmarks?: Array<Array<{x: number, y: number, z: number}>>;
  sequenceOfRightHandLandmarks?: Array<Array<{x: number, y: number, z: number}>>;
  handType?: string;
}

export interface TranslationLogItem {
  id: string;
  timestamp: string;
  inputText: string;
  translatedText: string;
  targetLanguage: string;
}

export interface GestureFrame {
  frameIndex: number;
  timestampOffsetMs: number;
  landmarks: Array<{ x: number; y: number; z: number }>;
  leftHandLandmarks?: Array<{ x: number; y: number; z: number }>;
  rightHandLandmarks?: Array<{ x: number; y: number; z: number }>;
  predictedChar?: string;
  confidence?: number;
  notes?: string;
}

export interface GestureRecording {
  id: string;
  title: string;
  label: string;
  description?: string;
  createdAt: string;
  durationMs: number;
  fps: number;
  frames: GestureFrame[];
  handType?: 'Right' | 'Left' | 'Both' | string;
  category?: string;
  author?: string;
}

export interface PredictionFeedback {
  id: string;
  predictedChar: string;
  correctLabel: string;
  confidence?: number;
  predictionSource?: string;
  notes?: string;
  createdAt: string;
  userId?: string;
  userEmail?: string;
  status: 'pending_review' | 'corrected' | 'applied';
  landmarksSnapshot?: Array<{ x: number; y: number; z: number }>;
}

