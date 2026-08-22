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

export interface MultiplayerPlayer {
  id: string;
  name: string;
  avatar: string;
  isAi?: boolean;
  aiDifficulty?: 'novice' | 'intermediate' | 'expert';
  cameraActive: boolean;
  currentScore: number;
  roundWins: number;
  currentAccuracy: number;
  currentSignAttempt: string;
  streak: number;
  bestReactionMs: number;
  isReady: boolean;
  landmarks?: Array<{ x: number; y: number; z?: number }>;
  mistakes?: SignMistake[];
}

export type MultiplayerGameMode = 'speed_duel' | 'precision_clash' | 'sign_gauntlet' | 'mimic_battle' | 'sudden_death';
export type MultiplayerDifficulty = 'novice' | 'intermediate' | 'expert';

export interface MultiplayerRoundResult {
  roundNumber: number;
  targetSign: string;
  winnerId: string | 'tie';
  p1Accuracy: number;
  p1TimeMs: number;
  p2Accuracy: number;
  p2TimeMs: number;
  explanation: string;
}

export interface MultiplayerMatchState {
  matchId: string;
  roomCode: string;
  gameMode: MultiplayerGameMode;
  difficulty: MultiplayerDifficulty;
  signLanguage: 'ASL' | 'ISL';
  totalRounds: number;
  currentRoundIndex: number;
  roundTimeLimitSec: number;
  roundTimeRemainingSec: number;
  status: 'lobby' | 'countdown' | 'in_progress' | 'round_recap' | 'match_summary';
  targetSigns: string[];
  currentPromptSign: string;
  p1: MultiplayerPlayer;
  p2: MultiplayerPlayer;
  roundHistory: MultiplayerRoundResult[];
}

export interface MultiplayerLeaderboardEntry {
  rank: number;
  playerName: string;
  avatar: string;
  eloRating: number;
  tier: 'Grandmaster' | 'Diamond' | 'Platinum' | 'Gold' | 'Silver';
  wins: number;
  losses: number;
  winRate: number;
  avgAccuracy: number;
  highestStreak: number;
  isUser?: boolean;
}

// Gesture Search & Reverse Image Recognition Types
export interface GestureSearchFilters {
  query: string;
  selectedCategories: string[];
  signLanguage: 'ALL' | 'ASL' | 'ISL';
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  handedness: 'all' | 'one_handed' | 'two_handed';
  movementType: 'all' | 'static' | 'dynamic';
  sortBy: 'relevance' | 'alphabetical_asc' | 'alphabetical_desc' | 'difficulty_asc' | 'difficulty_desc' | 'popular';
}

export interface ImageSearchMatch {
  char: string;
  englishTitle: string;
  signLanguage: 'ASL' | 'ISL' | string;
  category: string;
  confidence: number;
  matchReason: string;
  fingerBreakdown?: string;
  handShapeMatch?: string;
  visualTip?: string;
}

export interface ImageSearchResultData {
  detectedHandPose: string;
  isTwoHanded?: boolean;
  anatomicalSummary: string;
  matches: ImageSearchMatch[];
  suggestions: string[];
}

// Practice Recommendations & Weak Gesture Analysis Types
export type MasteryTier = 'mastered' | 'proficient' | 'developing' | 'critical_weakness' | 'untested';
export type RecommendationUrgency = 'high' | 'medium' | 'low';
export type RecommendationReasonType = 'weak_accuracy' | 'frequent_mistake' | 'spaced_repetition_due' | 'confusion_pair' | 'curriculum_frontier' | 'multiplayer_loss';

export interface AnatomicalWeaknessPoint {
  fingerOrJoint: string;
  issueDescription: string;
  frequency: number; // percentage of attempts
  correctiveTip: string;
}

export interface WeakGestureAnalysis {
  signChar: string;
  englishTitle?: string;
  hindiChar?: string;
  signLanguage: 'ASL' | 'ISL' | string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isTwoHanded?: boolean;
  masteryTier: MasteryTier;
  averageAccuracy: number; // 0 - 100
  recentAccuracy: number;  // last 3 attempts avg
  totalAttempts: number;
  lastPracticedAt: string | null;
  daysSinceLastPractice: number;
  retentionScore: number; // 0 - 100 based on forgetting curve
  weaknessScore: number;  // 0 - 100 (higher = needs more practice)
  consecutiveFailures: number;
  topMistakes: AnatomicalWeaknessPoint[];
  confusionPartners?: string[]; // e.g. ['M', 'N'] or ['A', 'S']
  historicalScores: Array<{ timestamp: string; score: number; source: string }>;
  trend: 'improving' | 'declining' | 'stagnant' | 'new';
}

export interface PracticeRecommendation {
  id: string;
  signChar: string;
  englishTitle?: string;
  hindiChar?: string;
  signLanguage: 'ASL' | 'ISL' | string;
  category: string;
  urgency: RecommendationUrgency;
  reasonType: RecommendationReasonType;
  headline: string;
  detailedReason: string;
  coachingTip: string;
  expectedImprovement: string;
  estimatedMinutes: number;
  xpBonus: number;
  weaknessScore: number;
  targetAccuracy: number;
  currentAccuracy: number;
  anatomicalFocus: string[];
  sampleSteps: string[];
  visualTip: string;
}

export interface PersonalizedPracticePlan {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  focusArea: string;
  totalXpReward: number;
  targetSigns: PracticeRecommendation[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  tag: string;
  isCompleted?: boolean;
}

export interface LearningHistoryEntry {
  id: string;
  timestamp: string;
  signChar: string;
  englishTitle?: string;
  signLanguage: 'ASL' | 'ISL' | string;
  source: 'evaluator' | 'daily_practice' | 'curriculum_quiz' | 'multiplayer' | 'live_translator';
  score: number; // 0 - 100
  accuracyGrade?: 'Mastered' | 'Excellent' | 'Good' | 'Needs Practice' | 'Incorrect';
  durationSeconds?: number;
  mistakesRecorded?: string[];
  subScores?: {
    fingerExtension?: number;
    thumbOpposition?: number;
    palmOrientation?: number;
    jointCurvature?: number;
    abductionSpread?: number;
  };
  notes?: string;
}

export interface UserLearningProfileSummary {
  totalPracticedSigns: number;
  masteredCount: number;
  proficientCount: number;
  developingCount: number;
  criticalWeaknessCount: number;
  overallHealthScore: number; // 0 - 100
  topAnatomicalWeakness: string;
  retentionDueCount: number;
  longestMasteryStreak: number;
  remediatedCount: number; // Weaknesses turned into mastered
}

export type NotificationType = 'practice_reminder' | 'achievement' | 'model_update' | 'system' | 'streak_alert';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  timestamp: string; // ISO string
  read: boolean;
  actionTab?: 'dashboard' | 'leaderboard' | 'learning_dashboard' | 'practice_recommendations' | 'evaluator' | 'multiplayer' | 'learning' | 'dictionary' | 'gesture_search' | 'trainer' | 'datasets' | 'offline' | 'profile';
  actionLabel?: string;
  actionPayload?: {
    signChar?: string;
    signLanguage?: 'ASL' | 'ISL' | string;
    badgeId?: string;
    badgeTitle?: string;
    badgeTier?: 'bronze' | 'silver' | 'gold' | 'diamond';
    modelId?: string;
    modelName?: string;
    modelVersion?: string;
    modelAccuracy?: number;
    streakDays?: number;
    xpEarned?: number;
    url?: string;
  };
  iconType?: 'bell' | 'sparkles' | 'trophy' | 'cpu' | 'flame' | 'target' | 'clock' | 'zap';
  sentToBrowser?: boolean;
}

export interface NotificationPreferences {
  browserNotificationsEnabled: boolean;
  practiceRemindersEnabled: boolean;
  practiceReminderTime: string; // e.g. "18:00"
  practiceReminderDays: number[]; // [0,1,2,3,4,5,6] (0=Sun, 6=Sat)
  practiceIntervalHours: number; // e.g. 24
  achievementAlertsEnabled: boolean;
  modelUpdatesEnabled: boolean;
  streakProtectionAlerts: boolean;
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string;   // e.g. "08:00"
}

export type LeaderboardTimeframe = 'daily' | 'weekly' | 'all_time';
export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

export interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  initials: string;
  avatarColor: string;
  countryCode: string;
  countryFlag: string;
  signLanguage: 'ASL' | 'ISL' | 'BOTH';
  league: LeagueTier;
  level: number;
  levelTitle: string;
  streak: number;
  dailyScore: number;
  weeklyScore: number;
  allTimeScore: number;
  dailySignsCount: number;
  weeklySignsCount: number;
  overallAccuracy: number; // 0 - 100
  rankDaily?: number;
  rankWeekly?: number;
  rankAllTime?: number;
  dailyTrend: 'up' | 'down' | 'same';
  trendDelta: number;
  unlockedBadges: CompletionBadge[];
  featuredBadge?: CompletionBadge;
  isCurrentUser?: boolean;
  bio?: string;
  lastActive: string;
  multiplayerWins?: number;
}

export interface LeagueDefinition {
  id: LeagueTier;
  title: string;
  icon: string;
  color: string;
  bgGradient: string;
  minXp: number;
  rewards: string;
  description: string;
  badgeBorder: string;
}

export interface LeaderboardFilterOptions {
  timeframe: LeaderboardTimeframe;
  signLanguage: 'ALL' | 'ASL' | 'ISL';
  league: 'ALL' | LeagueTier;
  searchQuery: string;
}

export type CertificateTheme = 'gold' | 'emerald' | 'sapphire' | 'cyber';
export type CertificateHonors = 'Honors with Distinction' | 'Excellence in Signing' | 'Verified Certified Signer' | 'Mastery Level';
export type CertificateType = 'track_completion' | 'practice_milestone' | 'evaluator_mastery' | 'fluency_diploma' | 'custom';

export interface CertificateCredential {
  id: string; // e.g. SIGNAI-2026-A89F-ISL
  recipientName: string;
  recipientEmail?: string;
  trackId: string;
  trackTitle: string;
  description: string;
  signLanguage: 'ISL' | 'ASL' | 'BOTH';
  issueDate: string; // e.g. "August 22, 2026"
  issueTimestamp: number;
  completionScore: number; // 0 - 100 accuracy
  masteredSignsCount: number;
  practiceMinutes: number;
  levelTitle: string;
  honorsLevel: CertificateHonors;
  theme: CertificateTheme;
  verificationHash: string; // cryptographic simulation hash
  verificationUrl: string;
  qrCodeDataUrl: string; // generated base64 QR code image
  certificateType: CertificateType;
  instructorName: string;
  instructorTitle: string;
  organizationName: string;
  skillsAcquired: string[];
  notes?: string;
  status: 'valid' | 'revoked';
}

export interface CertificateCreationParams {
  recipientName: string;
  recipientEmail?: string;
  trackId: string;
  trackTitle: string;
  description?: string;
  signLanguage: 'ISL' | 'ASL' | 'BOTH';
  completionScore?: number;
  masteredSignsCount?: number;
  practiceMinutes?: number;
  levelTitle?: string;
  honorsLevel?: CertificateHonors;
  theme?: CertificateTheme;
  certificateType?: CertificateType;
  skillsAcquired?: string[];
  customDate?: string;
}

export interface CertificateTrackPreset {
  id: string;
  title: string;
  description: string;
  signLanguage: 'ISL' | 'ASL' | 'BOTH';
  defaultLevel: string;
  defaultHonors: CertificateHonors;
  defaultSignsCount: number;
  defaultMinutes: number;
  skills: string[];
  theme: CertificateTheme;
  type: CertificateType;
  badgeEmoji: string;
}

export interface CertificateVerificationResult {
  isValid: boolean;
  certificate?: CertificateCredential;
  verifiedAt: string;
  tamperCheckPassed: boolean;
  message: string;
}

