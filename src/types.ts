export type SignLanguageSystem = 'ASL' | 'ISL' | 'BSL' | string;

export interface ASLGesture {
  id: string;
  char: string;
  hindiChar?: string;
  englishTitle?: string;
  videoUrl?: string;
  imageUrl?: string;
  description: string;
  category: 'alphabet' | 'greeting' | 'common' | 'custom' | 'isl-alphabet' | 'isl-greeting' | 'isl-common' | 'isl-number' | 'isl-daily-phrase' | 'isl-family' | 'isl-food' | 'isl-emotion' | 'isl-health-emergency' | 'isl-time' | 'isl-culture-places' | string;
  signLanguage?: SignLanguageSystem;
  isTwoHanded?: boolean;
  visualTip: string;
  meaning?: string;
  culturalContext?: string;
  facialExpression?: string;
  movementType?: string;
  movementDescription?: string;
  synonyms?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  steps?: string[];
  grammaticalRole?: string;
  tags?: string[];
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

export interface DailyPracticeSign {
  id: string;
  char: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  visualTip: string;
  steps: string[];
  status: 'pending' | 'completed' | 'mastered';
  accuracy?: number;
  attempts?: number;
  feedback?: string;
  completedAt?: string;
}

export interface DailyPracticeStats {
  date: string; // YYYY-MM-DD
  completedCount: number;
  totalSigns: number;
  dailyScore: number; // Avg accuracy %
  xpEarned: number;
  isDailyGoalMet: boolean;
  signs: DailyPracticeSign[];
}

export interface UserStreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastPracticedDate: string | null;
  totalPracticedDays: number;
  totalXp: number;
  streakFreezeCount: number;
  level: number;
  history: Record<string, { completedCount: number; dailyScore: number; xpEarned: number }>; // YYYY-MM-DD -> stats
}

export interface SavedPersonalModel {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  epochs: number;
  accuracy: number;
  loss: number;
  valAccuracy?: number;
  valLoss?: number;
  sampleCount: number;
  classes: string[];
  architecture: string;
  storageKey: string;
  isActive: boolean;
  tags?: string[];
  authorUid?: string;
  authorEmail?: string;
}


