import { SessionHistoryItem, TranslationLogItem, LearningHistoryEntry, PredictionFeedback } from '../types';

export type AnalyticsTimeframe = '7d' | '14d' | '30d' | '90d' | 'all';
export type AnalyticsSignLanguageFilter = 'ALL' | 'ASL' | 'ISL';

export interface AccuracyTrendPoint {
  date: string;
  displayDate: string;
  avgAccuracy: number;
  targetThreshold: number;
  sessionsCount: number;
  rollingAverage: number;
  minAccuracy: number;
  maxAccuracy: number;
}

export interface SignComparativeTrendPoint {
  date: string;
  displayDate: string;
  [signKey: string]: number | string; // Dynamic accuracies per sign
}

export interface BiomechanicalAxisScore {
  axis: string;
  score: number;
  fullMark: number;
  description: string;
  status: 'Mastered' | 'Optimal' | 'Developing' | 'Needs Practice';
}

export interface CategoryProgressItem {
  category: string;
  displayName: string;
  mastered: number;
  total: number;
  percentage: number;
  color: string;
}

export interface SpacedRepetitionItem {
  signChar: string;
  englishTitle: string;
  signLanguage: 'ASL' | 'ISL';
  retentionScore: number; // 0 - 100%
  lastPracticedDaysAgo: number;
  decayRate: 'Low' | 'Moderate' | 'High';
  status: 'Fresh' | 'Optimal' | 'Due for Review' | 'Critical Decay';
  urgency: 'high' | 'medium' | 'low';
}

export interface ConfusionPairItem {
  intendedSign: string;
  predictedSign: string;
  signLanguage: 'ASL' | 'ISL';
  frequency: number;
  errorRate: number; // e.g. 14.5%
  anatomicalReason: string;
  remedyTip: string;
}

export interface LatencyBenchmarkItem {
  engine: string;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  accuracy: number;
  throughputFps: number;
  color: string;
}

export interface ConfidenceBucketItem {
  bucket: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface HourlyPracticeDistribution {
  hour: string;
  attempts: number;
  avgAccuracy: number;
}

export interface DayOfWeekDistribution {
  day: string;
  attempts: number;
  avgAccuracy: number;
}

export interface ExecutiveSummaryInsights {
  overallHealthScore: number;
  primaryStrength: string;
  topGrowthArea: string;
  fluencyVelocity: string;
  aiCoachingTip: string;
  predictedDaysToMastery: number;
}

// -------------------------------------------------------------
// SEED & SYNTHETIC DATA GENERATOR FOR RICH TELEMETRY
// -------------------------------------------------------------

export function generateHistoricalAnalyticsData(
  timeframe: AnalyticsTimeframe,
  signLanguageFilter: AnalyticsSignLanguageFilter = 'ALL',
  realSessions: SessionHistoryItem[] = [],
  realTranslations: TranslationLogItem[] = []
) {
  const daysMap: Record<AnalyticsTimeframe, number> = {
    '7d': 7,
    '14d': 14,
    '30d': 30,
    '90d': 90,
    'all': 90
  };

  const totalDays = daysMap[timeframe];
  const now = new Date();
  const accuracyTrends: AccuracyTrendPoint[] = [];
  const comparativeTrends: SignComparativeTrendPoint[] = [];

  // Trackable popular signs for comparative charts
  const trackedSigns = ['A', 'B', 'C', 'HELLO', 'THANK YOU', 'NAMASTE'];

  // Base accuracy progression curve with realistic human learning curves
  let baseAcc = 68;
  const rollingWindow: number[] = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    const displayDate = totalDays <= 14 ? `${dayName} ${month}/${day}` : `${month}/${day}`;

    // Learning curve with slight natural variance and upward trajectory
    const progressFactor = (totalDays - i) / totalDays;
    const noise = Math.sin(i * 0.8) * 3.5 + (Math.random() * 4 - 2);
    const dayAccuracy = Math.min(98.5, Math.max(55, Number((baseAcc + progressFactor * 22 + noise).toFixed(1))));

    rollingWindow.push(dayAccuracy);
    if (rollingWindow.length > 5) rollingWindow.shift();
    const rollingAvg = Number((rollingWindow.reduce((a, b) => a + b, 0) / rollingWindow.length).toFixed(1));

    const sessionsCount = Math.floor(Math.abs(Math.sin(i * 0.5) * 8)) + 3 + (i === 0 ? realSessions.length : 0);

    accuracyTrends.push({
      date: dateStr,
      displayDate,
      avgAccuracy: dayAccuracy,
      targetThreshold: 85,
      sessionsCount,
      rollingAverage: rollingAvg,
      minAccuracy: Math.max(45, Math.round(dayAccuracy - 12 + Math.random() * 4)),
      maxAccuracy: Math.min(100, Math.round(dayAccuracy + 8 + Math.random() * 3))
    });

    // Comparative per-sign progression
    const compPoint: SignComparativeTrendPoint = {
      date: dateStr,
      displayDate
    };

    trackedSigns.forEach((sign, sIdx) => {
      const signOffset = sIdx * 3.2;
      const signCurve = Math.min(99, Math.max(60, Number((baseAcc + progressFactor * (18 + sIdx * 2) + Math.cos(i + sIdx) * 4 - signOffset).toFixed(1))));
      compPoint[sign] = signCurve;
    });

    comparativeTrends.push(compPoint);
  }

  // If real sessions exist today, update today's trend point
  if (realSessions.length > 0 && accuracyTrends.length > 0) {
    const todayIndex = accuracyTrends.length - 1;
    const realAvg = Number((realSessions.reduce((acc, curr) => acc + curr.confidence, 0) / realSessions.length).toFixed(1));
    accuracyTrends[todayIndex].avgAccuracy = realAvg;
    accuracyTrends[todayIndex].sessionsCount = Math.max(realSessions.length, accuracyTrends[todayIndex].sessionsCount);
  }

  return {
    accuracyTrends,
    comparativeTrends
  };
}

// -------------------------------------------------------------
// BIOMECHANICAL SKILLS RADAR METRICS
// -------------------------------------------------------------

export function getBiomechanicalSkillsData(): BiomechanicalAxisScore[] {
  return [
    {
      axis: 'Landmark Stability',
      score: 92,
      fullMark: 100,
      description: 'Hand tremor minimization and coordinate jitter suppression',
      status: 'Mastered'
    },
    {
      axis: 'Finger Articulation',
      score: 86,
      fullMark: 100,
      description: 'Individual distal & proximal joint curl accuracy (Thumb to Pinky)',
      status: 'Optimal'
    },
    {
      axis: 'Wrist Rotation',
      score: 79,
      fullMark: 100,
      description: 'Pronation, supination, and pitch alignment relative to camera normal',
      status: 'Developing'
    },
    {
      axis: 'Transition Speed',
      score: 84,
      fullMark: 100,
      description: 'Speed of switching between consecutive postures (gestures/sec)',
      status: 'Optimal'
    },
    {
      axis: 'Vocabulary Diversity',
      score: 78,
      fullMark: 100,
      description: 'Coverage across ASL alphabets, ISL phrases, and numbers',
      status: 'Developing'
    },
    {
      axis: 'Memory Retention',
      score: 88,
      fullMark: 100,
      description: 'Spaced repetition recall accuracy on previously tested signs',
      status: 'Mastered'
    }
  ];
}

// -------------------------------------------------------------
// CURRICULUM & CATEGORY PROGRESS DATA
// -------------------------------------------------------------

export function getCurriculumProgressData(signLanguage: AnalyticsSignLanguageFilter = 'ALL'): CategoryProgressItem[] {
  const allCategories: CategoryProgressItem[] = [
    {
      category: 'asl-alphabets',
      displayName: 'ASL Alphabets (A-Z)',
      mastered: 22,
      total: 26,
      percentage: 84.6,
      color: '#7c8d7c'
    },
    {
      category: 'isl-alphabets',
      displayName: 'ISL Two-Handed Alphabets',
      mastered: 19,
      total: 26,
      percentage: 73.1,
      color: '#e0a96d'
    },
    {
      category: 'greetings-courtesies',
      displayName: 'Greetings & Courtesies',
      mastered: 14,
      total: 16,
      percentage: 87.5,
      color: '#0d9488'
    },
    {
      category: 'emergency-medical',
      displayName: 'Emergency & Health Signs',
      mastered: 10,
      total: 12,
      percentage: 83.3,
      color: '#f43f5e'
    },
    {
      category: 'numbers-counting',
      displayName: 'Numbers (0 - 100)',
      mastered: 18,
      total: 20,
      percentage: 90.0,
      color: '#8b5cf6'
    },
    {
      category: 'family-relations',
      displayName: 'Family & Social Phrases',
      mastered: 11,
      total: 15,
      percentage: 73.3,
      color: '#3b82f6'
    },
    {
      category: 'food-dining',
      displayName: 'Food, Water & Dining',
      mastered: 9,
      total: 14,
      percentage: 64.3,
      color: '#f59e0b'
    }
  ];

  if (signLanguage === 'ASL') {
    return allCategories.filter(c => c.category.startsWith('asl') || c.category === 'greetings-courtesies' || c.category === 'numbers-counting');
  }
  if (signLanguage === 'ISL') {
    return allCategories.filter(c => c.category.startsWith('isl') || c.category === 'emergency-medical' || c.category === 'family-relations' || c.category === 'food-dining');
  }

  return allCategories;
}

// -------------------------------------------------------------
// SPACED REPETITION & RETENTION DECAY (EBBINGHAUS)
// -------------------------------------------------------------

export function getSpacedRepetitionData(): SpacedRepetitionItem[] {
  return [
    {
      signChar: 'T',
      englishTitle: 'Letter T (Thumb tuck under index)',
      signLanguage: 'ASL',
      retentionScore: 52,
      lastPracticedDaysAgo: 5,
      decayRate: 'High',
      status: 'Critical Decay',
      urgency: 'high'
    },
    {
      signChar: 'DHANYAWAD',
      englishTitle: 'Thank You (Chin forward stroke)',
      signLanguage: 'ISL',
      retentionScore: 61,
      lastPracticedDaysAgo: 4,
      decayRate: 'Moderate',
      status: 'Due for Review',
      urgency: 'high'
    },
    {
      signChar: 'M',
      englishTitle: 'Letter M (Three-finger fold)',
      signLanguage: 'ASL',
      retentionScore: 68,
      lastPracticedDaysAgo: 3,
      decayRate: 'Moderate',
      status: 'Due for Review',
      urgency: 'medium'
    },
    {
      signChar: 'HELP',
      englishTitle: 'Help / Emergency (Fist on Palm)',
      signLanguage: 'ISL',
      retentionScore: 84,
      lastPracticedDaysAgo: 2,
      decayRate: 'Low',
      status: 'Optimal',
      urgency: 'low'
    },
    {
      signChar: 'A',
      englishTitle: 'Letter A (Upright Fist)',
      signLanguage: 'ASL',
      retentionScore: 94,
      lastPracticedDaysAgo: 1,
      decayRate: 'Low',
      status: 'Fresh',
      urgency: 'low'
    },
    {
      signChar: 'NAMASTE',
      englishTitle: 'Greeting / Hello (Two-handed prayer)',
      signLanguage: 'ISL',
      retentionScore: 96,
      lastPracticedDaysAgo: 1,
      decayRate: 'Low',
      status: 'Fresh',
      urgency: 'low'
    }
  ];
}

// -------------------------------------------------------------
// PREDICTION TELEMETRY & ML INFERENCE BENCHMARKS
// -------------------------------------------------------------

export function getLatencyBenchmarks(): LatencyBenchmarkItem[] {
  return [
    {
      engine: 'On-Device Custom TF.js',
      avgLatencyMs: 38,
      minLatencyMs: 24,
      maxLatencyMs: 62,
      accuracy: 94.2,
      throughputFps: 58.4,
      color: '#7c8d7c'
    },
    {
      engine: 'MediaPipe Joint Heuristics',
      avgLatencyMs: 14,
      minLatencyMs: 9,
      maxLatencyMs: 28,
      accuracy: 88.6,
      throughputFps: 60.0,
      color: '#e0a96d'
    },
    {
      engine: 'Gemini 2.5 Multimodal API',
      avgLatencyMs: 340,
      minLatencyMs: 210,
      maxLatencyMs: 620,
      accuracy: 98.4,
      throughputFps: 3.2,
      color: '#3b82f6'
    },
    {
      engine: 'Hybrid Ensemble Orchestrator',
      avgLatencyMs: 46,
      minLatencyMs: 31,
      maxLatencyMs: 85,
      accuracy: 96.8,
      throughputFps: 48.0,
      color: '#8b5cf6'
    }
  ];
}

export function getConfidenceDistribution(): ConfidenceBucketItem[] {
  return [
    {
      bucket: '95 - 100%',
      label: 'Ultra High Precision',
      count: 482,
      percentage: 54.2,
      color: '#10b981' // emerald-500
    },
    {
      bucket: '85 - 94%',
      label: 'Strong Match',
      count: 248,
      percentage: 27.9,
      color: '#7c8d7c' // app primary sage
    },
    {
      bucket: '70 - 84%',
      label: 'Acceptable Baseline',
      count: 112,
      percentage: 12.6,
      color: '#f59e0b' // amber-500
    },
    {
      bucket: '50 - 69%',
      label: 'Ambiguous / Low Confidence',
      count: 36,
      percentage: 4.0,
      color: '#f97316' // orange-500
    },
    {
      bucket: '< 50%',
      label: 'Unrecognized / Noise',
      count: 12,
      percentage: 1.3,
      color: '#ef4444' // rose-500
    }
  ];
}

// -------------------------------------------------------------
// CONFUSION MATRIX PAIRS
// -------------------------------------------------------------

export function getTopConfusionPairs(): ConfusionPairItem[] {
  return [
    {
      intendedSign: 'M',
      predictedSign: 'N',
      signLanguage: 'ASL',
      frequency: 28,
      errorRate: 14.8,
      anatomicalReason: 'Thumb tucked under three fingers (M) vs two fingers (N)',
      remedyTip: 'Feel the ring finger tip resting securely on the thumb before holding the sign.'
    },
    {
      intendedSign: 'V',
      predictedSign: 'U',
      signLanguage: 'ASL',
      frequency: 22,
      errorRate: 11.4,
      anatomicalReason: 'Index & middle fingers spread apart in V vs pressed together in U',
      remedyTip: 'Maintain a minimum 25-degree opening between index and middle fingers.'
    },
    {
      intendedSign: 'A',
      predictedSign: 'S',
      signLanguage: 'ASL',
      frequency: 18,
      errorRate: 9.6,
      anatomicalReason: 'Thumb resting along outside edge of index vs wrapped over fingers',
      remedyTip: 'Keep thumb erect against the side of the fist, not crossing the front.'
    },
    {
      intendedSign: 'K',
      predictedSign: 'V',
      signLanguage: 'ASL',
      frequency: 15,
      errorRate: 8.2,
      anatomicalReason: 'Thumb knuckle placed between index & middle vs tucked into palm',
      remedyTip: 'Rest thumb pad directly on the middle joint of the index finger.'
    },
    {
      intendedSign: 'NAMASTE',
      predictedSign: 'DHANYAWAD',
      signLanguage: 'ISL',
      frequency: 12,
      errorRate: 6.5,
      anatomicalReason: 'Static two-hand prayer contact vs single-hand chin stroke',
      remedyTip: 'Ensure both left and right palms are tracked simultaneously for ISL Namaste.'
    },
    {
      intendedSign: 'D',
      predictedSign: '1',
      signLanguage: 'ASL',
      frequency: 9,
      errorRate: 4.8,
      anatomicalReason: 'Thumb touching middle finger to form circle (D) vs curled in palm (1)',
      remedyTip: 'Ensure middle, ring, and pinky tips form a visible loop with the thumb.'
    }
  ];
}

// -------------------------------------------------------------
// TIME OF DAY & DAY OF WEEK ACCURACY PATTERNS
// -------------------------------------------------------------

export function getHourlyPracticeDistribution(): HourlyPracticeDistribution[] {
  return [
    { hour: '06:00', attempts: 12, avgAccuracy: 88.5 },
    { hour: '08:00', attempts: 34, avgAccuracy: 91.2 },
    { hour: '10:00', attempts: 68, avgAccuracy: 94.6 },
    { hour: '12:00', attempts: 45, avgAccuracy: 89.0 },
    { hour: '14:00', attempts: 52, avgAccuracy: 87.4 },
    { hour: '16:00', attempts: 78, avgAccuracy: 92.8 },
    { hour: '18:00', attempts: 110, avgAccuracy: 95.3 },
    { hour: '20:00', attempts: 94, avgAccuracy: 93.1 },
    { hour: '22:00', attempts: 38, avgAccuracy: 86.2 }
  ];
}

export function getDayOfWeekDistribution(): DayOfWeekDistribution[] {
  return [
    { day: 'Mon', attempts: 84, avgAccuracy: 89.4 },
    { day: 'Tue', attempts: 96, avgAccuracy: 91.8 },
    { day: 'Wed', attempts: 112, avgAccuracy: 93.5 },
    { day: 'Thu', attempts: 104, avgAccuracy: 92.1 },
    { day: 'Fri', attempts: 128, avgAccuracy: 94.8 },
    { day: 'Sat', attempts: 145, avgAccuracy: 96.2 },
    { day: 'Sun', attempts: 92, avgAccuracy: 90.5 }
  ];
}

// -------------------------------------------------------------
// EXECUTIVE SUMMARY INSIGHTS ENGINE
// -------------------------------------------------------------

export function computeExecutiveSummary(
  averageAccuracy: number,
  totalSessions: number,
  totalTranslations: number
): ExecutiveSummaryInsights {
  const healthScore = Math.min(99, Math.max(65, Math.round(averageAccuracy > 0 ? averageAccuracy : 91.4)));
  
  let primaryStrength = 'Exceptional landmark stability in single-handed ASL alphabets (A, B, C, L, Y).';
  let topGrowthArea = 'Thumb-tuck discipline on compact fists (M, N, T) and ISL two-handed sync.';
  let fluencyVelocity = '+18.4% accuracy improvement over the past 14 practice days.';
  let aiCoachingTip = 'Your evening practice sessions (18:00 - 20:00) yield 6.2% higher recognition precision than midday sessions.';
  let predictedDaysToMastery = 12;

  if (healthScore >= 95) {
    primaryStrength = 'Mastery-grade joint alignment across both ASL and ISL conversational vocabularies.';
    topGrowthArea = 'Rapid real-time fingerspelling at 4+ characters per second.';
    fluencyVelocity = 'Top 3% percentile among active learners in your league.';
    aiCoachingTip = 'Ready for competitive multiplayer arena and advanced fluency certifications.';
    predictedDaysToMastery = 4;
  } else if (healthScore < 80) {
    primaryStrength = 'Consistent daily practice streak with strong baseline camera positioning.';
    topGrowthArea = 'Wrist rotation and thumb opposition angles.';
    fluencyVelocity = 'Steady climb with high retention on core greetings.';
    aiCoachingTip = 'Focus on 5-minute targeted drills using the AI Sign Evaluator before live meetings.';
    predictedDaysToMastery = 22;
  }

  return {
    overallHealthScore: healthScore,
    primaryStrength,
    topGrowthArea,
    fluencyVelocity,
    aiCoachingTip,
    predictedDaysToMastery
  };
}

// -------------------------------------------------------------
// DATA EXPORTERS (CSV & JSON)
// -------------------------------------------------------------

export function exportAnalyticsToCSV(
  sessions: SessionHistoryItem[],
  translations: TranslationLogItem[],
  accuracyTrends: AccuracyTrendPoint[]
) {
  const rows: string[][] = [];

  // Header
  rows.push(['# SignSense Analytics Telemetry Export']);
  rows.push([`Generated At: ${new Date().toISOString()}`]);
  rows.push([]);

  // 1. Daily Accuracy Summary
  rows.push(['--- DAILY ACCURACY TRENDS ---']);
  rows.push(['Date', 'Display Date', 'Average Accuracy (%)', 'Sessions Count', 'Rolling Average (%)', 'Min Accuracy (%)', 'Max Accuracy (%)']);
  accuracyTrends.forEach(item => {
    rows.push([
      item.date,
      item.displayDate,
      item.avgAccuracy.toString(),
      item.sessionsCount.toString(),
      item.rollingAverage.toString(),
      item.minAccuracy.toString(),
      item.maxAccuracy.toString()
    ]);
  });
  rows.push([]);

  // 2. Gesture Practice Sessions
  rows.push(['--- GESTURE PRACTICE SESSIONS ---']);
  rows.push(['ID', 'Timestamp', 'Caption', 'Confidence (%)', 'Emotion']);
  sessions.forEach(s => {
    rows.push([
      s.id,
      s.timestamp,
      `"${s.caption.replace(/"/g, '""')}"`,
      s.confidence.toFixed(1),
      s.emotion || 'neutral'
    ]);
  });
  rows.push([]);

  // 3. Translation Logs
  rows.push(['--- MULTILANGUAGE TRANSLATION LOGS ---']);
  rows.push(['ID', 'Timestamp', 'Input Sign/Text', 'Translated Text', 'Target Language']);
  translations.forEach(t => {
    rows.push([
      t.id,
      t.timestamp,
      `"${t.inputText.replace(/"/g, '""')}"`,
      `"${t.translatedText.replace(/"/g, '""')}"`,
      t.targetLanguage
    ]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `SignSense_Analytics_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
