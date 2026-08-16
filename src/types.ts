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

export interface LessonSignDetail {
  id: string;
  char: string;
  hindiChar?: string;
  englishTitle: string;
  meaning: string;
  visualTip: string;
  description: string;
  steps: string[];
  isTwoHanded?: boolean;
  culturalNote?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface LessonQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  signChar?: string;
}

export interface LearningLesson {
  id: string;
  trackId: string;
  dayNumber: number;
  title: string;
  subtitle: string;
  description: string;
  durationMin: number;
  xpReward: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  signLanguage: 'ISL' | 'ASL' | 'BOTH';
  signs: LessonSignDetail[];
  quizQuestions: LessonQuizQuestion[];
  culturalFact?: string;
  completed: boolean;
  score?: number;
  stars?: number; // 1 to 3
  completedAt?: string;
  unlocked?: boolean;
}

export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: string;
  signLanguage: 'ISL' | 'ASL' | 'BOTH';
  color: string;
  totalLessons: number;
  completedLessons: number;
}

export interface PracticeGoal {
  id: string;
  title: string;
  description: string;
  type: 'daily_signs' | 'daily_time' | 'daily_accuracy' | 'weekly_lessons' | 'weekly_xp' | 'streak_target';
  targetValue: number;
  currentValue: number;
  unit: string;
  period: 'daily' | 'weekly';
  isCompleted: boolean;
  xpReward: number;
  iconName: string;
}

export interface CompletionBadge {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'mastery' | 'accuracy' | 'curriculum' | 'speed' | 'culture';
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  requirement: string;
  currentProgress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  xpValue: number;
  flavorText?: string;
}

export interface LearningDashboardStats {
  totalXp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  currentLevelXpProgress: number;
  currentStreak: number;
  bestStreak: number;
  totalPracticedDays: number;
  signsMasteredCount: number;
  totalLessonsCompleted: number;
  overallAccuracy: number;
  practiceMinutesThisWeek: number;
  streakFreezeAvailable: number;
  lastPracticedDate: string | null;
}

export interface SignMistake {
  id: string;
  finger: 'Thumb' | 'Index' | 'Middle' | 'Ring' | 'Pinky' | 'Wrist' | 'Palm' | 'Both Hands';
  jointIndices: number[];
  severity: 'critical' | 'moderate' | 'minor';
  title: string;
  description: string;
  expectedState: string;
  observedState: string;
  correctionAction: string;
  correctionDirection?: 'up' | 'down' | 'left' | 'right' | 'inward' | 'outward' | 'curve' | 'straighten';
}

export interface JointStatus {
  jointIndex: number;
  name: string;
  status: 'correct' | 'warning' | 'error';
  errorDistance: number;
  expectedPos?: { x: number; y: number; z?: number };
  actualPos?: { x: number; y: number; z?: number };
  feedback?: string;
}

export interface SignEvaluationResult {
  id: string;
  timestamp: string;
  targetSign: string;
  detectedSign: string;
  signLanguage: 'ASL' | 'ISL' | string;
  overallScore: number; // 0 - 100
  grade: 'Mastered' | 'Excellent' | 'Good' | 'Needs Practice' | 'Incorrect';
  isCorrect: boolean;
  subScores: {
    fingerExtension: number; // 0 - 100
    thumbOpposition: number; // 0 - 100
    palmOrientation: number; // 0 - 100
    jointCurvature: number;  // 0 - 100
    abductionSpread: number; // 0 - 100
  };
  mistakes: SignMistake[];
  jointStatuses: JointStatus[];
  suggestions: string[];
  correctiveChecklist: Array<{
    id: string;
    label: string;
    completed: boolean;
    tip: string;
    arrowGuide?: { fromJoint: number; toJoint: number; direction: string };
  }>;
  referenceLandmarks?: Array<{ x: number; y: number; z?: number }>;
  userLandmarks?: Array<{ x: number; y: number; z?: number }>;
  explanation: string;
  aiVisionFeedback?: {
    explanation: string;
    lightingQuality: 'good' | 'fair' | 'poor';
    handVisibility: 'clear' | 'partially_occluded' | 'out_of_frame';
  };
}




