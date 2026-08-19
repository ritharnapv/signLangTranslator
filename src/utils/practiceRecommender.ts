import { 
  LearningHistoryEntry, 
  WeakGestureAnalysis, 
  PracticeRecommendation, 
  PersonalizedPracticePlan, 
  UserLearningProfileSummary,
  MasteryTier,
  RecommendationUrgency,
  RecommendationReasonType
} from '../types';
import { COMPLETE_ISL_DICTIONARY } from '../data/islDictionaryData';
import { getSignBlueprint } from './signEvaluatorEngine';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Storage keys
const LOCAL_STORAGE_HISTORY_KEY = 'asl_learning_history_entries';
const LOCAL_STORAGE_WEAKNESS_KEY = 'asl_weakness_cache';

// Common confusion pairs in sign language (ASL & ISL)
export const CONFUSION_PAIRS: Record<string, { partners: string[]; reason: string; signLanguage: 'ASL' | 'ISL' }> = {
  // ASL confusions
  'A': { partners: ['S', 'T', 'E'], reason: 'Thumb positioning on fist (A: outside index side, S: across fingers, T: between index & middle)', signLanguage: 'ASL' },
  'S': { partners: ['A', 'T', 'E'], reason: 'Thumb locked across curled fingers vs on the outside edge', signLanguage: 'ASL' },
  'T': { partners: ['A', 'S', 'N', 'M'], reason: 'Thumb tucked strictly under index finger knuckle', signLanguage: 'ASL' },
  'E': { partners: ['A', 'S', 'O'], reason: 'Finger pads resting on curled thumb vs tucked under', signLanguage: 'ASL' },
  'M': { partners: ['N', 'T'], reason: 'Thumb tucked under three fingers (M) vs two fingers (N)', signLanguage: 'ASL' },
  'N': { partners: ['M', 'T'], reason: 'Thumb tucked under two fingers (N) vs three (M)', signLanguage: 'ASL' },
  'K': { partners: ['V', 'P'], reason: 'Thumb positioned between index and middle fingers pointing upward', signLanguage: 'ASL' },
  'V': { partners: ['K', 'U', '2'], reason: 'Index and middle spread in V without thumb between them', signLanguage: 'ASL' },
  'U': { partners: ['V', 'H'], reason: 'Index and middle held tight together without spreading', signLanguage: 'ASL' },
  'D': { partners: ['1', 'F'], reason: 'Index straight up with middle/ring/pinky touching thumb tip (D) vs index/thumb circle (F)', signLanguage: 'ASL' },
  'F': { partners: ['D', '9'], reason: 'Index and thumb forming a circle with other 3 fingers extended', signLanguage: 'ASL' },
  'G': { partners: ['H', 'Q'], reason: 'Index and thumb pointing horizontally parallel (one finger extended vs two for H)', signLanguage: 'ASL' },
  
  // ISL confusions
  'NAMASTE': { partners: ['DHANYAWAD', 'PLEASE'], reason: 'Two-handed symmetry and palm-to-palm contact at chest level', signLanguage: 'ISL' },
  'DHANYAWAD': { partners: ['NAMASTE', 'WELCOME'], reason: 'Dominant hand moving from chin forward vs static two-handed greeting', signLanguage: 'ISL' },
  'WATER': { partners: ['TEA', 'MILK'], reason: 'Curled cup/W handshape moving toward mouth', signLanguage: 'ISL' },
  'HELP': { partners: ['DOCTOR', 'EMERGENCY'], reason: 'Dominant fist lifted upward resting on flat non-dominant palm', signLanguage: 'ISL' }
};

// Seed foundational history for new users so they can immediately see realistic analytics & recommendations
export function getSeedLearningHistory(): LearningHistoryEntry[] {
  const now = Date.now();
  const dayMs = 86400000;

  return [
    // Weak sign: ASL 'A' - Frequent thumb misalignment
    {
      id: 'seed_hist_1',
      timestamp: new Date(now - dayMs * 1.2).toISOString(),
      signChar: 'A',
      englishTitle: 'Letter A (Fist)',
      signLanguage: 'ASL',
      source: 'evaluator',
      score: 54,
      accuracyGrade: 'Needs Practice',
      durationSeconds: 14,
      mistakesRecorded: ['Thumb locked over fingers like S instead of resting along outside index edge'],
      subScores: { fingerExtension: 85, thumbOpposition: 40, palmOrientation: 90, jointCurvature: 60, abductionSpread: 80 },
      notes: 'Thumb was misplaced across fingers.'
    },
    {
      id: 'seed_hist_2',
      timestamp: new Date(now - dayMs * 3.5).toISOString(),
      signChar: 'A',
      englishTitle: 'Letter A (Fist)',
      signLanguage: 'ASL',
      source: 'daily_practice',
      score: 62,
      accuracyGrade: 'Needs Practice',
      durationSeconds: 20,
      mistakesRecorded: ['Thumb bent inward toward palm'],
      subScores: { fingerExtension: 80, thumbOpposition: 45, palmOrientation: 85, jointCurvature: 65, abductionSpread: 75 },
      notes: 'Struggled with thumb positioning.'
    },
    // Weak sign: ASL 'E' - Finger curl issue
    {
      id: 'seed_hist_3',
      timestamp: new Date(now - dayMs * 0.8).toISOString(),
      signChar: 'E',
      englishTitle: 'Letter E',
      signLanguage: 'ASL',
      source: 'evaluator',
      score: 58,
      accuracyGrade: 'Needs Practice',
      durationSeconds: 18,
      mistakesRecorded: ['Finger tips hovering above thumb instead of resting directly on folded thumb'],
      subScores: { fingerExtension: 50, thumbOpposition: 60, palmOrientation: 92, jointCurvature: 55, abductionSpread: 85 },
      notes: 'Need tighter knuckle curvature.'
    },
    // Weak sign: ASL 'M' - Confused with N
    {
      id: 'seed_hist_4',
      timestamp: new Date(now - dayMs * 2.1).toISOString(),
      signChar: 'M',
      englishTitle: 'Letter M',
      signLanguage: 'ASL',
      source: 'curriculum_quiz',
      score: 60,
      accuracyGrade: 'Needs Practice',
      durationSeconds: 15,
      mistakesRecorded: ['Thumb only under two fingers (looks like N) instead of three'],
      subScores: { fingerExtension: 70, thumbOpposition: 50, palmOrientation: 80, jointCurvature: 65, abductionSpread: 70 },
      notes: 'Tuck thumb further across to reach third finger.'
    },
    // Mastered sign needing Spaced Repetition Review: ASL 'B' (Practiced 6 days ago)
    {
      id: 'seed_hist_5',
      timestamp: new Date(now - dayMs * 6.5).toISOString(),
      signChar: 'B',
      englishTitle: 'Letter B (Flat Hand)',
      signLanguage: 'ASL',
      source: 'evaluator',
      score: 94,
      accuracyGrade: 'Mastered',
      durationSeconds: 10,
      mistakesRecorded: [],
      subScores: { fingerExtension: 98, thumbOpposition: 90, palmOrientation: 95, jointCurvature: 96, abductionSpread: 92 },
      notes: 'Flawless flat palm posture.'
    },
    // Proficient sign: ISL 'NAMASTE'
    {
      id: 'seed_hist_6',
      timestamp: new Date(now - dayMs * 0.5).toISOString(),
      signChar: 'NAMASTE',
      englishTitle: 'Namaste Greeting',
      signLanguage: 'ISL',
      source: 'evaluator',
      score: 88,
      accuracyGrade: 'Excellent',
      durationSeconds: 12,
      mistakesRecorded: ['Slight asymmetry in left palm angle'],
      subScores: { fingerExtension: 90, thumbOpposition: 85, palmOrientation: 92, jointCurvature: 90, abductionSpread: 88 },
      notes: 'Very clean two-handed greeting.'
    },
    // Weak sign: ISL 'HELP' - Two-handed elevation
    {
      id: 'seed_hist_7',
      timestamp: new Date(now - dayMs * 1.5).toISOString(),
      signChar: 'HELP',
      englishTitle: 'Help / Assistance',
      signLanguage: 'ISL',
      source: 'daily_practice',
      score: 64,
      accuracyGrade: 'Needs Practice',
      durationSeconds: 22,
      mistakesRecorded: ['Non-dominant palm not held completely flat as base'],
      subScores: { fingerExtension: 65, thumbOpposition: 60, palmOrientation: 70, jointCurvature: 68, abductionSpread: 75 },
      notes: 'Keep support hand stable while lifting dominant fist.'
    },
    // Mastered sign: ASL 'L'
    {
      id: 'seed_hist_8',
      timestamp: new Date(now - dayMs * 4.0).toISOString(),
      signChar: 'L',
      englishTitle: 'Letter L (Right Angle)',
      signLanguage: 'ASL',
      source: 'evaluator',
      score: 96,
      accuracyGrade: 'Mastered',
      durationSeconds: 8,
      mistakesRecorded: [],
      subScores: { fingerExtension: 98, thumbOpposition: 96, palmOrientation: 95, jointCurvature: 97, abductionSpread: 95 }
    },
    // Developing sign: ASL 'V'
    {
      id: 'seed_hist_9',
      timestamp: new Date(now - dayMs * 0.3).toISOString(),
      signChar: 'V',
      englishTitle: 'Letter V (Peace)',
      signLanguage: 'ASL',
      source: 'multiplayer',
      score: 76,
      accuracyGrade: 'Good',
      durationSeconds: 11,
      mistakesRecorded: ['Ring finger started lifting slightly'],
      subScores: { fingerExtension: 85, thumbOpposition: 75, palmOrientation: 80, jointCurvature: 78, abductionSpread: 88 }
    }
  ];
}

/**
 * Loads learning history from local storage or cloud
 */
export function getLearningHistory(limitCount?: number, filterLang?: string): LearningHistoryEntry[] {
  let history: LearningHistoryEntry[] = [];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (saved) {
      history = JSON.parse(saved);
    }
  } catch (err) {
    console.warn("Failed to load local learning history:", err);
  }

  // If no history exists yet, initialize with the seed history
  if (!history || history.length === 0) {
    history = getSeedLearningHistory();
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }

  // Sort newest first
  history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (filterLang && filterLang !== 'ALL') {
    history = history.filter(item => item.signLanguage === filterLang);
  }

  if (limitCount && limitCount > 0) {
    return history.slice(0, limitCount);
  }

  return history;
}

/**
 * Records a new learning evaluation / practice attempt into history and synchronizes to cloud
 */
export async function recordLearningHistoryEntry(entry: Omit<LearningHistoryEntry, 'id'>): Promise<LearningHistoryEntry> {
  const newEntry: LearningHistoryEntry = {
    ...entry,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  };

  try {
    const current = getLearningHistory();
    const updated = [newEntry, ...current].slice(0, 500); // keep last 500 records
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));

    // Cloud sync if user is logged in
    const user = auth.currentUser;
    if (user) {
      try {
        const userHistRef = doc(db, 'user_learning_history', user.uid);
        await setDoc(userHistRef, {
          updatedAt: new Date().toISOString(),
          userId: user.uid,
          userEmail: user.email || '',
          recentEntries: updated.slice(0, 100)
        }, { merge: true });
      } catch (cloudErr) {
        console.warn("Cloud learning history sync deferred:", cloudErr);
      }
    }
  } catch (e) {
    console.error("Failed to record learning history entry:", e);
  }

  return newEntry;
}

/**
 * Clears all learning history
 */
export function clearLearningHistory(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    localStorage.removeItem(LOCAL_STORAGE_WEAKNESS_KEY);
  } catch (e) {
    console.error("Error clearing learning history:", e);
  }
}

/**
 * Calculates Ebbinghaus Spaced Repetition Retention Score (0 - 100)
 * R = e^(-t / S)
 * Where t is days elapsed, S is memory strength factor based on mastery & practice count
 */
export function calculateRetentionScore(daysSincePractice: number, totalAttempts: number, avgAccuracy: number): number {
  if (daysSincePractice <= 0) return 100;
  
  // Strength factor (in days): base 2 days, increases with attempts and accuracy
  const masteryFactor = avgAccuracy >= 90 ? 7 : avgAccuracy >= 75 ? 4 : 2;
  const repetitionBonus = Math.min(totalAttempts * 0.8, 6);
  const memoryStrengthDays = masteryFactor + repetitionBonus;

  // Exponential decay
  const retention = Math.exp(-daysSincePractice / memoryStrengthDays) * 100;
  return Math.max(0, Math.min(100, Math.round(retention)));
}

/**
 * Analyzes all learning history to identify weak gestures, mistake patterns, and mastery tiers
 */
export function analyzeWeakGestures(
  history?: LearningHistoryEntry[],
  signLangFilter: 'ALL' | 'ASL' | 'ISL' = 'ALL'
): WeakGestureAnalysis[] {
  const entries = history || getLearningHistory();
  const filtered = signLangFilter === 'ALL' 
    ? entries 
    : entries.filter(e => e.signLanguage === signLangFilter);

  // Group by signChar + signLanguage
  const signGroups: Record<string, LearningHistoryEntry[]> = {};
  
  filtered.forEach(entry => {
    const key = `${entry.signChar.toUpperCase()}__${entry.signLanguage || 'ASL'}`;
    if (!signGroups[key]) {
      signGroups[key] = [];
    }
    signGroups[key].push(entry);
  });

  const now = Date.now();
  const dayMs = 86400000;
  const analysisResults: WeakGestureAnalysis[] = [];

  Object.entries(signGroups).forEach(([key, items]) => {
    const [signChar, signLanguage] = key.split('__');
    // Sort oldest to newest for chronological tracking
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const totalAttempts = items.length;
    const scores = items.map(i => i.score);
    const avgAccuracy = Math.round(scores.reduce((a, b) => a + b, 0) / totalAttempts);
    
    // Recent accuracy (last 3 attempts)
    const recentItems = items.slice(-3);
    const recentAccuracy = Math.round(recentItems.reduce((a, b) => a + b.score, 0) / recentItems.length);

    // Calculate trend
    let trend: 'improving' | 'declining' | 'stagnant' | 'new' = 'stagnant';
    if (items.length === 1) {
      trend = 'new';
    } else if (recentAccuracy > avgAccuracy + 5) {
      trend = 'improving';
    } else if (recentAccuracy < avgAccuracy - 5) {
      trend = 'declining';
    }

    // Last practice date & days elapsed
    const lastItem = items[items.length - 1];
    const lastPracticedAt = lastItem.timestamp;
    const daysSinceLastPractice = Math.max(0, Number(((now - new Date(lastPracticedAt).getTime()) / dayMs).toFixed(1)));

    // Retention score
    const retentionScore = calculateRetentionScore(daysSinceLastPractice, totalAttempts, avgAccuracy);

    // Consecutive failures (< 70% score) from newest backwards
    let consecutiveFailures = 0;
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].score < 70) {
        consecutiveFailures++;
      } else {
        break;
      }
    }

    // Aggregate mistake frequency & top anatomical errors
    const mistakeCounts: Record<string, { count: number; desc: string }> = {};
    items.forEach(item => {
      if (item.mistakesRecorded && Array.isArray(item.mistakesRecorded)) {
        item.mistakesRecorded.forEach(m => {
          const simplified = m.trim();
          if (simplified) {
            if (!mistakeCounts[simplified]) {
              mistakeCounts[simplified] = { count: 0, desc: simplified };
            }
            mistakeCounts[simplified].count++;
          }
        });
      }
    });

    const topMistakes: WeakGestureAnalysis['topMistakes'] = Object.values(mistakeCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(m => {
        // Detect anatomical joint
        let joint = 'Hand Posture';
        const lower = m.desc.toLowerCase();
        if (lower.includes('thumb')) joint = 'Thumb Opposition';
        else if (lower.includes('index')) joint = 'Index Finger';
        else if (lower.includes('middle')) joint = 'Middle Finger';
        else if (lower.includes('pinky')) joint = 'Pinky Extension';
        else if (lower.includes('palm')) joint = 'Palm Orientation';
        else if (lower.includes('wrist') || lower.includes('angle')) joint = 'Wrist Alignment';
        else if (lower.includes('two') || lower.includes('both') || lower.includes('symmetry')) joint = 'Two-Handed Symmetry';

        return {
          fingerOrJoint: joint,
          issueDescription: m.desc,
          frequency: Math.round((m.count / totalAttempts) * 100),
          correctiveTip: `Keep ${joint.toLowerCase()} steady and check angle against reference skeleton.`
        };
      });

    // If subscores exist, check lowest anatomical subscore
    const subScoreAverages = {
      fingerExtension: 0,
      thumbOpposition: 0,
      palmOrientation: 0,
      jointCurvature: 0,
      abductionSpread: 0
    };
    let subScoreCount = 0;

    items.forEach(i => {
      if (i.subScores) {
        subScoreAverages.fingerExtension += i.subScores.fingerExtension || 0;
        subScoreAverages.thumbOpposition += i.subScores.thumbOpposition || 0;
        subScoreAverages.palmOrientation += i.subScores.palmOrientation || 0;
        subScoreAverages.jointCurvature += i.subScores.jointCurvature || 0;
        subScoreAverages.abductionSpread += i.subScores.abductionSpread || 0;
        subScoreCount++;
      }
    });

    if (subScoreCount > 0 && topMistakes.length === 0) {
      const avgThumb = subScoreAverages.thumbOpposition / subScoreCount;
      const avgPalm = subScoreAverages.palmOrientation / subScoreCount;
      const avgCurve = subScoreAverages.jointCurvature / subScoreCount;
      
      if (avgThumb < 70) {
        topMistakes.push({
          fingerOrJoint: 'Thumb Opposition',
          issueDescription: 'Thumb is not positioned correctly against fingers',
          frequency: Math.round(100 - avgThumb),
          correctiveTip: 'Ensure thumb is aligned properly with the reference angle.'
        });
      }
      if (avgCurve < 70) {
        topMistakes.push({
          fingerOrJoint: 'Joint Curvature',
          issueDescription: 'Knuckles or finger joints are improperly flexed',
          frequency: Math.round(100 - avgCurve),
          correctiveTip: 'Bend fingers cleanly from the middle joint.'
        });
      }
      if (avgPalm < 70) {
        topMistakes.push({
          fingerOrJoint: 'Palm Orientation',
          issueDescription: 'Palm angle differs from camera orientation standard',
          frequency: Math.round(100 - avgPalm),
          correctiveTip: 'Rotate wrist so palm directly faces the camera.'
        });
      }
    }

    // Determine Mastery Tier
    let masteryTier: MasteryTier = 'untested';
    if (recentAccuracy >= 90 && avgAccuracy >= 85 && totalAttempts >= 3) {
      masteryTier = 'mastered';
    } else if (recentAccuracy >= 75 && avgAccuracy >= 70) {
      masteryTier = 'proficient';
    } else if (recentAccuracy >= 60 || avgAccuracy >= 60) {
      masteryTier = 'developing';
    } else {
      masteryTier = 'critical_weakness';
    }

    // Weakness Score Formula (0 - 100)
    // Higher = urgent need for practice!
    const accuracyDeficit = (100 - recentAccuracy) * 0.45;
    const retentionDeficit = (100 - retentionScore) * 0.25;
    const failurePenalty = Math.min(consecutiveFailures * 8, 20);
    const mistakePenalty = Math.min(topMistakes.length * 5, 10);
    
    let weaknessScore = Math.round(accuracyDeficit + retentionDeficit + failurePenalty + mistakePenalty);
    weaknessScore = Math.max(0, Math.min(100, weaknessScore));

    // Lookup metadata from dictionary or evaluator blueprint
    const islMatch = COMPLETE_ISL_DICTIONARY.find(d => d.char.toUpperCase() === signChar.toUpperCase());
    const blueprint = getSignBlueprint(signChar, signLanguage as 'ASL' | 'ISL');

    const englishTitle = islMatch?.englishTitle || blueprint.name || `Sign ${signChar}`;
    const hindiChar = islMatch?.hindiChar;
    const category = islMatch?.category || blueprint.category || (signLanguage === 'ISL' ? 'isl-alphabet' : 'alphabet');
    const isTwoHanded = islMatch?.isTwoHanded || blueprint.isTwoHanded || false;
    const difficulty = (islMatch?.difficulty as 'easy' | 'medium' | 'hard') || 'easy';

    // Confusion partners
    const confusionPartners = CONFUSION_PAIRS[signChar.toUpperCase()]?.partners || [];

    analysisResults.push({
      signChar,
      englishTitle,
      hindiChar,
      signLanguage: signLanguage as 'ASL' | 'ISL',
      category,
      difficulty,
      isTwoHanded,
      masteryTier,
      averageAccuracy: avgAccuracy,
      recentAccuracy: recentAccuracy,
      totalAttempts,
      lastPracticedAt,
      daysSinceLastPractice,
      retentionScore,
      weaknessScore,
      consecutiveFailures,
      topMistakes,
      confusionPartners,
      historicalScores: items.map(i => ({ timestamp: i.timestamp, score: i.score, source: i.source })),
      trend
    });
  });

  // Sort by highest weakness score first
  analysisResults.sort((a, b) => b.weaknessScore - a.weaknessScore);

  return analysisResults;
}

/**
 * Generates personalized, prioritized practice recommendations
 */
export function generatePersonalizedRecommendations(
  history?: LearningHistoryEntry[],
  options: {
    signLanguage?: 'ALL' | 'ASL' | 'ISL';
    maxCount?: number;
    userLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  } = {}
): PracticeRecommendation[] {
  const signLanguageFilter = options.signLanguage || 'ALL';
  const maxCount = options.maxCount || 10;
  const weakAnalyses = analyzeWeakGestures(history, signLanguageFilter);

  const recommendations: PracticeRecommendation[] = [];
  const processedSignKeys = new Set<string>();

  // 1. Prioritize Critical Weaknesses & Recurring Mistakes
  weakAnalyses.forEach(item => {
    if (processedSignKeys.has(`${item.signChar}_${item.signLanguage}`)) return;

    const blueprint = getSignBlueprint(item.signChar, item.signLanguage as 'ASL' | 'ISL');
    const islMatch = COMPLETE_ISL_DICTIONARY.find(d => d.char.toUpperCase() === item.signChar.toUpperCase());

    // Check Case A: Critical Accuracy Weakness (< 70% or consecutive failures)
    if (item.recentAccuracy < 70 || item.consecutiveFailures >= 2) {
      processedSignKeys.add(`${item.signChar}_${item.signLanguage}`);
      
      const topMistake = item.topMistakes[0];
      const anatomicalFocus = item.topMistakes.map(m => m.fingerOrJoint);
      if (anatomicalFocus.length === 0) {
        anatomicalFocus.push('Handshape Alignment', 'Joint Extension');
      }

      recommendations.push({
        id: `rec_weak_${item.signChar}_${item.signLanguage}`,
        signChar: item.signChar,
        englishTitle: item.englishTitle,
        hindiChar: item.hindiChar,
        signLanguage: item.signLanguage,
        category: item.category,
        urgency: 'high',
        reasonType: 'weak_accuracy',
        headline: `Correct ${item.signChar} Handshape Accuracy`,
        detailedReason: `Your recent score is ${item.recentAccuracy}% with ${item.consecutiveFailures} consecutive low attempts. ${topMistake ? `Top error detected: ${topMistake.issueDescription}.` : 'Anatomical alignment needs practice.'}`,
        coachingTip: topMistake?.correctiveTip || blueprint.visualTip || 'Align fingers with the reference skeleton.',
        expectedImprovement: `Target: Boost accuracy to 85%+ (+${Math.max(15, 85 - item.recentAccuracy)}% expected gain)`,
        estimatedMinutes: 3,
        xpBonus: 80, // High XP incentive for fixing weaknesses!
        weaknessScore: item.weaknessScore,
        targetAccuracy: 85,
        currentAccuracy: item.recentAccuracy,
        anatomicalFocus,
        sampleSteps: islMatch?.steps || [
          `Form the base hand posture for ${item.signChar}.`,
          `Check thumb and finger curvature carefully against skeleton guide.`,
          `Hold steady for 3 seconds facing the camera.`
        ],
        visualTip: islMatch?.visualTip || blueprint.visualTip || 'Keep wrist steady facing camera.'
      });
      return;
    }

    // Check Case B: Spaced Repetition Retention Decay (Mastered/Proficient but not practiced in days)
    if (item.retentionScore < 65 && item.daysSinceLastPractice >= 3) {
      processedSignKeys.add(`${item.signChar}_${item.signLanguage}`);
      recommendations.push({
        id: `rec_srs_${item.signChar}_${item.signLanguage}`,
        signChar: item.signChar,
        englishTitle: item.englishTitle,
        hindiChar: item.hindiChar,
        signLanguage: item.signLanguage,
        category: item.category,
        urgency: 'medium',
        reasonType: 'spaced_repetition_due',
        headline: `Refresh ${item.signChar} (Retention Memory Alert)`,
        detailedReason: `Last practiced ${item.daysSinceLastPractice} days ago. Retention score has dropped to ${item.retentionScore}%. A quick 2-minute refresher will reset memory strength!`,
        coachingTip: 'Quick recall test: Form the sign without looking at the reference first, then check accuracy.',
        expectedImprovement: 'Restore 100% Spaced Repetition retention memory',
        estimatedMinutes: 2,
        xpBonus: 50,
        weaknessScore: item.weaknessScore,
        targetAccuracy: 90,
        currentAccuracy: item.recentAccuracy,
        anatomicalFocus: ['Muscle Memory Speed', 'Visual Recall'],
        sampleSteps: islMatch?.steps || [
          `Perform ${item.signChar} from memory.`,
          `Verify palm angle and thumb orientation.`
        ],
        visualTip: islMatch?.visualTip || blueprint.visualTip || 'Maintain fluid transition.'
      });
      return;
    }

    // Check Case C: Confusion Pair Risk
    if (item.confusionPartners && item.confusionPartners.length > 0 && item.recentAccuracy < 85) {
      const confusionInfo = CONFUSION_PAIRS[item.signChar.toUpperCase()];
      if (confusionInfo) {
        processedSignKeys.add(`${item.signChar}_${item.signLanguage}`);
        recommendations.push({
          id: `rec_conf_${item.signChar}_${item.signLanguage}`,
          signChar: item.signChar,
          englishTitle: item.englishTitle,
          hindiChar: item.hindiChar,
          signLanguage: item.signLanguage,
          category: item.category,
          urgency: 'medium',
          reasonType: 'confusion_pair',
          headline: `Differentiate ${item.signChar} vs ${item.confusionPartners.join('/')}`,
          detailedReason: confusionInfo.reason,
          coachingTip: `Focus on the key differentiator: ${confusionInfo.reason}`,
          expectedImprovement: 'Eliminate false recognition and confusion overlap',
          estimatedMinutes: 4,
          xpBonus: 65,
          weaknessScore: item.weaknessScore,
          targetAccuracy: 90,
          currentAccuracy: item.recentAccuracy,
          anatomicalFocus: ['Thumb Position', 'Finger Spread Contrast'],
          sampleSteps: [
            `Form ${item.signChar} and pay attention to thumb lock.`,
            `Switch to ${item.confusionPartners[0]} and notice the exact finger shift.`,
            `Alternate 5 times between ${item.signChar} and ${item.confusionPartners[0]}.`
          ],
          visualTip: islMatch?.visualTip || blueprint.visualTip || 'Pay attention to distinct thumb tucking.'
        });
      }
    }
  });

  // 2. Add Curriculum Frontier Recommendations for Untested Essential Signs
  const practicedChars = new Set(weakAnalyses.map(w => `${w.signChar.toUpperCase()}_${w.signLanguage}`));
  
  const essentialISLSigns = ['NAMASTE', 'DHANYAWAD', 'HELP', 'WATER', 'FOOD', 'FAMILY', 'FRIEND', 'YES', 'NO'];
  const essentialASLSigns = ['A', 'B', 'C', 'D', 'E', 'L', 'V', 'Y', 'LOVE', 'PEACE'];

  if (signLanguageFilter === 'ALL' || signLanguageFilter === 'ISL') {
    essentialISLSigns.forEach(char => {
      if (recommendations.length >= maxCount) return;
      if (!practicedChars.has(`${char}_ISL`)) {
        const item = COMPLETE_ISL_DICTIONARY.find(d => d.char.toUpperCase() === char);
        if (item) {
          recommendations.push({
            id: `rec_frontier_${char}_ISL`,
            signChar: item.char,
            englishTitle: item.englishTitle,
            hindiChar: item.hindiChar,
            signLanguage: 'ISL',
            category: item.category,
            urgency: 'low',
            reasonType: 'curriculum_frontier',
            headline: `Learn Essential ISL: ${item.englishTitle}`,
            detailedReason: `Core Indian Sign Language vocabulary not yet evaluated in your learning history.`,
            coachingTip: item.visualTip,
            expectedImprovement: 'Expand ISL vocabulary foundations',
            estimatedMinutes: 3,
            xpBonus: 60,
            weaknessScore: 50,
            targetAccuracy: 80,
            currentAccuracy: 0,
            anatomicalFocus: item.isTwoHanded ? ['Two-Handed Coordination', 'Contact Point'] : ['Dominant Hand Shape'],
            sampleSteps: item.steps,
            visualTip: item.visualTip
          });
        }
      }
    });
  }

  if (signLanguageFilter === 'ALL' || signLanguageFilter === 'ASL') {
    essentialASLSigns.forEach(char => {
      if (recommendations.length >= maxCount) return;
      if (!practicedChars.has(`${char}_ASL`)) {
        const bp = getSignBlueprint(char, 'ASL');
        recommendations.push({
          id: `rec_frontier_${char}_ASL`,
          signChar: char,
          englishTitle: bp.name || `Letter ${char}`,
          signLanguage: 'ASL',
          category: 'alphabet',
          urgency: 'low',
          reasonType: 'curriculum_frontier',
          headline: `Practice ASL Foundation: ${bp.name}`,
          detailedReason: `Standard manual alphabet letter ready for your first AI Evaluator test.`,
          coachingTip: bp.visualTip,
          expectedImprovement: 'Unlock baseline alphabet mastery',
          estimatedMinutes: 2,
          xpBonus: 50,
          weaknessScore: 45,
          targetAccuracy: 80,
          currentAccuracy: 0,
          anatomicalFocus: ['Manual Alphabet Stance', 'Finger Curl'],
          sampleSteps: [
            `Study the 3D skeleton pose for ${char}.`,
            `Mirror hand posture in webcam view.`,
            `Achieve >80% accuracy score.`
          ],
          visualTip: bp.visualTip
        });
      }
    });
  }

  // Sort final recommendations: high urgency first, then highest weakness score
  const urgencyOrder: Record<RecommendationUrgency, number> = { high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => {
    if (urgencyOrder[b.urgency] !== urgencyOrder[a.urgency]) {
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    }
    return b.weaknessScore - a.weaknessScore;
  });

  return recommendations.slice(0, maxCount);
}

/**
 * Generates structured personalized practice workout plans
 */
export function generateCuratedPracticePlans(recommendations: PracticeRecommendation[]): PersonalizedPracticePlan[] {
  const highUrgency = recommendations.filter(r => r.urgency === 'high');
  const srsDue = recommendations.filter(r => r.reasonType === 'spaced_repetition_due');
  const confusion = recommendations.filter(r => r.reasonType === 'confusion_pair');
  const islSigns = recommendations.filter(r => r.signLanguage === 'ISL');

  const plans: PersonalizedPracticePlan[] = [];

  // Plan 1: 5-Minute Weakness Fixer
  const weakPool = (highUrgency.length > 0 ? highUrgency : recommendations).slice(0, 3);
  if (weakPool.length > 0) {
    plans.push({
      id: 'plan_quick_weakness_fix',
      title: '5-Minute Weakness Eliminator',
      description: 'Laser-focused drill targeting your 3 highest-error handshapes with immediate joint alignment feedback.',
      estimatedMinutes: 5,
      focusArea: 'High Error Correction & Thumb Alignment',
      totalXpReward: weakPool.reduce((acc, r) => acc + r.xpBonus, 50),
      targetSigns: weakPool,
      level: 'Beginner',
      tag: 'Urgent Weaknesses'
    });
  }

  // Plan 2: 15-Minute Daily Adaptive Booster (Weak + SRS + Growth)
  const boosterPool = [
    ...(highUrgency.slice(0, 2)),
    ...(srsDue.slice(0, 2)),
    ...(recommendations.filter(r => r.reasonType === 'curriculum_frontier').slice(0, 1))
  ].slice(0, 5);

  if (boosterPool.length >= 3) {
    plans.push({
      id: 'plan_comprehensive_booster',
      title: '15-Minute Comprehensive Booster',
      description: 'A complete daily routine combining error remediation, spaced repetition refreshers, and one new vocabulary horizon sign.',
      estimatedMinutes: 15,
      focusArea: 'Full Retention & Skill Expansion',
      totalXpReward: boosterPool.reduce((acc, r) => acc + r.xpBonus, 100),
      targetSigns: boosterPool,
      level: 'Intermediate',
      tag: 'Balanced Workout'
    });
  }

  // Plan 3: Confusion Pair Buster
  if (confusion.length > 0) {
    plans.push({
      id: 'plan_confusion_buster',
      title: 'Confusion Pair Precision Drill',
      description: 'Eliminate handshape ambiguities between easily mixed-up letters (such as A/S/T and M/N).',
      estimatedMinutes: 8,
      focusArea: 'Subtle Finger Differentiation',
      totalXpReward: confusion.reduce((acc, r) => acc + r.xpBonus, 60),
      targetSigns: confusion.slice(0, 3),
      level: 'Intermediate',
      tag: 'Precision Drill'
    });
  }

  // Plan 4: ISL Two-Handed Mastery Routine
  if (islSigns.length >= 2) {
    plans.push({
      id: 'plan_isl_two_handed',
      title: 'ISL Two-Handed Precision Routine',
      description: 'Master bilateral coordination, symmetric contact, and polite Indian Sign Language greetings.',
      estimatedMinutes: 10,
      focusArea: 'ISL Two-Handed Coordination',
      totalXpReward: islSigns.slice(0, 4).reduce((acc, r) => acc + r.xpBonus, 80),
      targetSigns: islSigns.slice(0, 4),
      level: 'Intermediate',
      tag: 'ISL Culture & Fluency'
    });
  }

  return plans;
}

/**
 * Calculates overall user learning profile health metrics
 */
export function calculateLearningProfileSummary(
  history: LearningHistoryEntry[],
  weakAnalyses: WeakGestureAnalysis[]
): UserLearningProfileSummary {
  let masteredCount = 0;
  let proficientCount = 0;
  let developingCount = 0;
  let criticalWeaknessCount = 0;
  let retentionDueCount = 0;

  const anatomicalIssueTally: Record<string, number> = {};

  weakAnalyses.forEach(w => {
    if (w.masteryTier === 'mastered') masteredCount++;
    else if (w.masteryTier === 'proficient') proficientCount++;
    else if (w.masteryTier === 'developing') developingCount++;
    else if (w.masteryTier === 'critical_weakness') criticalWeaknessCount++;

    if (w.retentionScore < 65 && w.daysSinceLastPractice >= 3) {
      retentionDueCount++;
    }

    w.topMistakes.forEach(m => {
      anatomicalIssueTally[m.fingerOrJoint] = (anatomicalIssueTally[m.fingerOrJoint] || 0) + m.frequency;
    });
  });

  // Find top anatomical weakness
  let topAnatomicalWeakness = 'None detected';
  let highestTally = 0;
  Object.entries(anatomicalIssueTally).forEach(([joint, tally]) => {
    if (tally > highestTally) {
      highestTally = tally;
      topAnatomicalWeakness = joint;
    }
  });

  // Calculate Overall Health Score (0 - 100)
  const total = weakAnalyses.length;
  let overallHealthScore = 75;
  if (total > 0) {
    const weighted = (masteredCount * 100 + proficientCount * 80 + developingCount * 55 + criticalWeaknessCount * 30) / total;
    overallHealthScore = Math.round(weighted);
  }

  // Count remediated signs (started < 65 and latest score >= 85)
  let remediatedCount = 0;
  weakAnalyses.forEach(w => {
    if (w.historicalScores.length >= 2) {
      const firstScore = w.historicalScores[0].score;
      const latestScore = w.recentAccuracy;
      if (firstScore < 65 && latestScore >= 85) {
        remediatedCount++;
      }
    }
  });

  return {
    totalPracticedSigns: total,
    masteredCount,
    proficientCount,
    developingCount,
    criticalWeaknessCount,
    overallHealthScore,
    topAnatomicalWeakness,
    retentionDueCount,
    longestMasteryStreak: Math.max(3, masteredCount),
    remediatedCount
  };
}
