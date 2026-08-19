import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Target,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  RotateCcw,
  Zap,
  Calendar,
  Flame,
  Award,
  ChevronRight,
  ChevronDown,
  Info,
  Filter,
  Play,
  Check,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Activity,
  History,
  Download,
  Share2,
  RefreshCw,
  Search,
  Sliders,
  Maximize2,
  ThumbsUp,
  BrainCircuit,
  PieChart as PieIcon,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import {
  WeakGestureAnalysis,
  PracticeRecommendation,
  PersonalizedPracticePlan,
  LearningHistoryEntry,
  UserLearningProfileSummary,
  MasteryTier,
  RecommendationUrgency,
  RecommendationReasonType
} from '../types';
import {
  getLearningHistory,
  recordLearningHistoryEntry,
  analyzeWeakGestures,
  generatePersonalizedRecommendations,
  generateCuratedPracticePlans,
  calculateLearningProfileSummary,
  clearLearningHistory,
  CONFUSION_PAIRS
} from '../utils/practiceRecommender';
import { getSignBlueprint } from '../utils/signEvaluatorEngine';

interface PracticeRecommendationsProps {
  onOpenEvaluator?: (signName: string, lang?: 'ASL' | 'ISL') => void;
  onOpenDictionary?: (signName: string, lang?: 'ASL' | 'ISL') => void;
  onNavigateToDashboard?: () => void;
  onOpenDailyPractice?: () => void;
}

export default function PracticeRecommendations({
  onOpenEvaluator,
  onOpenDictionary,
  onNavigateToDashboard,
  onOpenDailyPractice
}: PracticeRecommendationsProps) {
  // Navigation tabs within recommendations
  const [activeTab, setActiveTab] = useState<'recommendations' | 'weaknesses' | 'history'>('recommendations');
  const [signLanguageFilter, setSignLanguageFilter] = useState<'ALL' | 'ISL' | 'ASL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('all');
  const [selectedMasteryFilter, setSelectedMasteryFilter] = useState<string>('all');
  const [historySourceFilter, setHistorySourceFilter] = useState<string>('all');

  // Interactive state
  const [history, setHistory] = useState<LearningHistoryEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedAnalysisDetail, setSelectedAnalysisDetail] = useState<WeakGestureAnalysis | null>(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<LearningHistoryEntry | null>(null);
  const [activePlan, setActivePlan] = useState<PersonalizedPracticePlan | null>(null);
  const [workoutCurrentIndex, setWorkoutCurrentIndex] = useState<number>(0);
  const [workoutScore, setWorkoutScore] = useState<number>(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(false);
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState<boolean>(false);
  const [showAddLogModal, setShowAddLogModal] = useState<boolean>(false);

  // Manual Log State
  const [manualSign, setManualSign] = useState<string>('A');
  const [manualLang, setManualLang] = useState<'ASL' | 'ISL'>('ASL');
  const [manualScore, setManualScore] = useState<number>(75);
  const [manualMistake, setManualMistake] = useState<string>('');
  const [manualSource, setManualSource] = useState<LearningHistoryEntry['source']>('evaluator');

  // Load and refresh data
  const refreshData = () => {
    setIsRefreshing(true);
    const data = getLearningHistory();
    setHistory(data);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Compute Analyses and Recommendations
  const weakAnalyses = useMemo(() => {
    return analyzeWeakGestures(history, signLanguageFilter);
  }, [history, signLanguageFilter]);

  const recommendations = useMemo(() => {
    return generatePersonalizedRecommendations(history, {
      signLanguage: signLanguageFilter,
      maxCount: 12
    });
  }, [history, signLanguageFilter]);

  const curatedPlans = useMemo(() => {
    return generateCuratedPracticePlans(recommendations);
  }, [recommendations]);

  const summary = useMemo(() => {
    return calculateLearningProfileSummary(history, weakAnalyses);
  }, [history, weakAnalyses]);

  // Filtered recommendations list
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(rec => {
      if (selectedUrgencyFilter !== 'all' && rec.urgency !== selectedUrgencyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rec.signChar.toLowerCase().includes(q) || (rec.englishTitle && rec.englishTitle.toLowerCase().includes(q));
        const matchesReason = rec.detailedReason.toLowerCase().includes(q) || rec.headline.toLowerCase().includes(q);
        if (!matchesName && !matchesReason) return false;
      }
      return true;
    });
  }, [recommendations, selectedUrgencyFilter, searchQuery]);

  // Filtered weak gestures list
  const filteredWeaknesses = useMemo(() => {
    return weakAnalyses.filter(item => {
      if (selectedMasteryFilter !== 'all' && item.masteryTier !== selectedMasteryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.signChar.toLowerCase().includes(q) || (item.englishTitle && item.englishTitle.toLowerCase().includes(q));
        if (!matchesName) return false;
      }
      return true;
    });
  }, [weakAnalyses, selectedMasteryFilter, searchQuery]);

  // Filtered history list
  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      if (signLanguageFilter !== 'ALL' && entry.signLanguage !== signLanguageFilter) return false;
      if (historySourceFilter !== 'all' && entry.source !== historySourceFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = entry.signChar.toLowerCase().includes(q) || (entry.englishTitle && entry.englishTitle.toLowerCase().includes(q));
        if (!matchesName) return false;
      }
      return true;
    });
  }, [history, signLanguageFilter, historySourceFilter, searchQuery]);

  // Handle start interactive workout
  const handleStartWorkout = (plan: PersonalizedPracticePlan) => {
    setActivePlan(plan);
    setWorkoutCurrentIndex(0);
    setWorkoutScore(0);
    setIsWorkoutActive(true);
    setIsWorkoutCompleted(false);
  };

  const handleWorkoutNext = async (score: number) => {
    if (!activePlan) return;
    const currentSign = activePlan.targetSigns[workoutCurrentIndex];
    
    // Record workout evaluation into history
    await recordLearningHistoryEntry({
      timestamp: new Date().toISOString(),
      signChar: currentSign.signChar,
      englishTitle: currentSign.englishTitle,
      signLanguage: currentSign.signLanguage,
      source: 'daily_practice',
      score,
      accuracyGrade: score >= 90 ? 'Mastered' : score >= 75 ? 'Good' : 'Needs Practice',
      durationSeconds: 15,
      mistakesRecorded: score < 75 ? [currentSign.coachingTip] : []
    });

    const newScore = workoutScore + score;
    setWorkoutScore(newScore);

    if (workoutCurrentIndex + 1 < activePlan.targetSigns.length) {
      setWorkoutCurrentIndex(workoutCurrentIndex + 1);
    } else {
      setIsWorkoutCompleted(true);
      refreshData();
    }
  };

  const handleManualAddLog = async () => {
    if (!manualSign.trim()) return;
    await recordLearningHistoryEntry({
      timestamp: new Date().toISOString(),
      signChar: manualSign.trim().toUpperCase(),
      englishTitle: `Sign ${manualSign.trim().toUpperCase()}`,
      signLanguage: manualLang,
      source: manualSource,
      score: manualScore,
      accuracyGrade: manualScore >= 90 ? 'Mastered' : manualScore >= 75 ? 'Good' : 'Needs Practice',
      durationSeconds: 20,
      mistakesRecorded: manualMistake.trim() ? [manualMistake.trim()] : []
    });
    setShowAddLogModal(false);
    setManualMistake('');
    refreshData();
  };

  // Export history to JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sign_learning_history_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16" id="practice-recommendations-root">
      {/* Top Banner & AI Coach Diagnosis Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white p-6 md:p-8 shadow-2xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>AI Adaptive Coach & Practice Diagnostics</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Personalized Practice Recommendations</span>
            </h1>
            <p className="text-sm md:text-base text-indigo-200/80 max-w-2xl">
              Real-time weakness analysis based on your learning history, joint error patterns, and spaced repetition retention curve.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (curatedPlans.length > 0) {
                  handleStartWorkout(curatedPlans[0]);
                }
              }}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer transform active:scale-95"
              id="start-quick-workout-btn"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start 5-Min Weakness Workout</span>
            </button>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-indigo-200 hover:text-white transition-all cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold">
              <span>Skill Health Score</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-white">{summary.overallHealthScore}%</span>
              <span className="text-xs text-emerald-400 font-medium">
                {summary.overallHealthScore >= 80 ? 'Optimal' : summary.overallHealthScore >= 60 ? 'Good' : 'Needs Work'}
              </span>
            </div>
            <div className="mt-2 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  summary.overallHealthScore >= 80 ? 'bg-emerald-400' : summary.overallHealthScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                }`}
                style={{ width: `${summary.overallHealthScore}%` }}
              />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold">
              <span>Critical Weaknesses</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-rose-400">{summary.criticalWeaknessCount}</span>
              <span className="text-xs text-indigo-200/70">Signs &lt;70%</span>
            </div>
            <p className="mt-1 text-[11px] text-indigo-200/60 truncate">
              {summary.criticalWeaknessCount > 0 ? 'High error frequency detected' : 'Zero critical errors!'}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold">
              <span>Spaced Memory Alert</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-amber-300">{summary.retentionDueCount}</span>
              <span className="text-xs text-indigo-200/70">Review due</span>
            </div>
            <p className="mt-1 text-[11px] text-indigo-200/60 truncate">
              Based on Ebbinghaus forgetting curve
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold">
              <span>Top Anatomical Hurdle</span>
              <Target className="w-4 h-4 text-violet-400" />
            </div>
            <div className="mt-3">
              <span className="text-sm md:text-base font-bold text-violet-300 block truncate" title={summary.topAnatomicalWeakness}>
                {summary.topAnatomicalWeakness}
              </span>
              <span className="text-xs text-indigo-200/60">Recurring joint mistake</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-400 truncate">
              {summary.remediatedCount} weaknesses fixed so far!
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation & Filter Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#18181b] p-4 rounded-2xl border border-[#e4e4e7] dark:border-[#27272a] shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f4f4f5] dark:bg-[#27272a] rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'recommendations'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#71717a] dark:text-[#a1a1aa] hover:text-[#18181b] dark:hover:text-white'
            }`}
            id="tab-rec-today-btn"
          >
            <Sparkles className="w-4 h-4" />
            <span>Recommended for You ({recommendations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('weaknesses')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'weaknesses'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#71717a] dark:text-[#a1a1aa] hover:text-[#18181b] dark:hover:text-white'
            }`}
            id="tab-weaknesses-btn"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Weakness Deep-Dive ({weakAnalyses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#71717a] dark:text-[#a1a1aa] hover:text-[#18181b] dark:hover:text-white'
            }`}
            id="tab-learning-history-btn"
          >
            <History className="w-4 h-4" />
            <span>Learning History ({history.length})</span>
          </button>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language Switch */}
          <div className="flex items-center gap-1 p-1 bg-[#f4f4f5] dark:bg-[#27272a] rounded-xl text-xs font-semibold">
            {(['ALL', 'ISL', 'ASL'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setSignLanguageFilter(lang)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  signLanguageFilter === lang
                    ? 'bg-white dark:bg-[#18181b] text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-[#71717a] dark:text-[#a1a1aa] hover:text-[#18181b] dark:hover:text-white'
                }`}
              >
                {lang === 'ALL' ? 'All Signs' : lang}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
            <input
              type="text"
              placeholder="Search sign, mistake, reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#f4f4f5] dark:bg-[#27272a] border border-transparent focus:border-indigo-500 rounded-xl text-xs text-[#18181b] dark:text-white outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-black dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RECOMMENDED FOR YOU (Prescriptions & Curated Workouts) */}
      {/* ========================================================================= */}
      {activeTab === 'recommendations' && (
        <div className="space-y-8" id="view-recommendations-list">
          {/* Curated Adaptive Workout Plans */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#18181b] dark:text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span>Adaptive Practice Workouts</span>
                </h2>
                <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">
                  Scientifically sequenced micro-sessions generated from your personal error patterns.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {curatedPlans.map(plan => (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-[#18181b] border border-[#e4e4e7] dark:border-[#27272a] hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                        {plan.tag}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                        <Zap className="w-3.5 h-3.5 fill-amber-500" />
                        <span>+{plan.totalXpReward} XP</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-extrabold text-[#18181b] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {plan.title}
                    </h3>
                    <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] line-clamp-2 leading-relaxed">
                      {plan.description}
                    </p>

                    {/* Target Sign Chips */}
                    <div className="pt-2 border-t border-[#f4f4f5] dark:border-[#27272a] flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-[#a1a1aa] font-semibold">Signs:</span>
                      {plan.targetSigns.map(s => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 bg-[#f4f4f5] dark:bg-[#27272a] rounded-md text-[11px] font-bold text-[#3f3f46] dark:text-[#d4d4d8]"
                        >
                          {s.signChar}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#f4f4f5] dark:border-[#27272a] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#71717a] dark:text-[#a1a1aa]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{plan.estimatedMinutes} mins</span>
                    </div>
                    <button
                      onClick={() => handleStartWorkout(plan)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Start</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Recommended Signs Feed */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#18181b] dark:text-white flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-500" />
                  <span>Prioritized Sign Recommendations</span>
                </h2>
                <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">
                  Targeted drills based on low accuracy, joint mistakes, and spaced review deadlines.
                </p>
              </div>

              {/* Urgency Filter */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-xs text-[#71717a] dark:text-[#a1a1aa] font-medium mr-1">Urgency:</span>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'high', label: 'Critical' },
                  { id: 'medium', label: 'SRS Due' },
                  { id: 'low', label: 'Frontier' }
                ].map(urg => (
                  <button
                    key={urg.id}
                    onClick={() => setSelectedUrgencyFilter(urg.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedUrgencyFilter === urg.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'text-[#71717a] dark:text-[#a1a1aa] hover:bg-[#f4f4f5] dark:hover:bg-[#27272a]'
                    }`}
                  >
                    {urg.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredRecommendations.length === 0 ? (
              <div className="bg-white dark:bg-[#18181b] rounded-2xl p-12 text-center border border-[#e4e4e7] dark:border-[#27272a]">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#18181b] dark:text-white">All Caught Up!</h3>
                <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] max-w-sm mx-auto mt-1">
                  You have addressed all critical weak spots in this filter. Explore new vocabulary or check your full learning history.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecommendations.map(rec => {
                  const isHigh = rec.urgency === 'high';
                  const isMedium = rec.urgency === 'medium';
                  const isSRS = rec.reasonType === 'spaced_repetition_due';
                  const isConfusion = rec.reasonType === 'confusion_pair';

                  return (
                    <div
                      key={rec.id}
                      className={`relative bg-white dark:bg-[#18181b] rounded-2xl border transition-all p-5 shadow-sm hover:shadow-md flex flex-col justify-between ${
                        isHigh
                          ? 'border-rose-300 dark:border-rose-900/50 hover:border-rose-400 ring-1 ring-rose-500/10'
                          : isSRS
                          ? 'border-amber-300 dark:border-amber-900/50 hover:border-amber-400 ring-1 ring-amber-500/10'
                          : isConfusion
                          ? 'border-purple-300 dark:border-purple-900/50 hover:border-purple-400'
                          : 'border-[#e4e4e7] dark:border-[#27272a] hover:border-indigo-400'
                      }`}
                    >
                      {/* Urgency Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              isHigh
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                                : isSRS
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                                : isConfusion
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40'
                                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40'
                            }`}
                          >
                            {isHigh ? 'Critical Weakness' : isSRS ? 'Memory Review' : isConfusion ? 'Confusion Drill' : 'Vocabulary Horizon'}
                          </span>
                          <span className="text-[11px] font-bold text-[#71717a] dark:text-[#a1a1aa]">
                            {rec.signLanguage}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                          <Zap className="w-3.5 h-3.5 fill-amber-500" />
                          <span>+{rec.xpBonus} XP</span>
                        </span>
                      </div>

                      {/* Sign Title & Char */}
                      <div className="mt-4 flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-[#27272a] dark:to-[#18181b] border border-indigo-100 dark:border-[#3f3f46] flex flex-col items-center justify-center shrink-0 shadow-xs">
                          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                            {rec.signChar}
                          </span>
                          {rec.hindiChar && (
                            <span className="text-[10px] text-[#71717a] dark:text-[#a1a1aa] font-medium">
                              {rec.hindiChar}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <h3 className="text-sm font-extrabold text-[#18181b] dark:text-white truncate">
                            {rec.headline}
                          </h3>
                          <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] line-clamp-2">
                            {rec.detailedReason}
                          </p>
                        </div>
                      </div>

                      {/* Anatomical Coaching Tip Box */}
                      <div className="mt-4 p-3 rounded-xl bg-[#f8fafc] dark:bg-[#27272a]/60 border border-[#e2e8f0] dark:border-[#334155] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          <Target className="w-3.5 h-3.5" />
                          <span>AI Coach Tip:</span>
                        </div>
                        <p className="text-xs text-[#334155] dark:text-[#cbd5e1] leading-relaxed">
                          {rec.coachingTip}
                        </p>

                        {rec.anatomicalFocus && rec.anatomicalFocus.length > 0 && (
                          <div className="pt-1 flex flex-wrap items-center gap-1">
                            {rec.anatomicalFocus.map((focus, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#3f3f46] text-[10px] text-[#475569] dark:text-[#94a3b8] font-medium"
                              >
                                {focus}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Performance Metric & Actions */}
                      <div className="mt-5 pt-3 border-t border-[#f4f4f5] dark:border-[#27272a] flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] text-[#71717a] dark:text-[#a1a1aa]">Current vs Target</div>
                          <div className="text-xs font-bold text-[#18181b] dark:text-white">
                            <span className={isHigh ? 'text-rose-500' : 'text-amber-500'}>{rec.currentAccuracy}%</span>
                            <span className="text-[#a1a1aa]"> → </span>
                            <span className="text-emerald-500">{rec.targetAccuracy}%</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {onOpenDictionary && (
                            <button
                              onClick={() => onOpenDictionary(rec.signChar, rec.signLanguage as 'ASL' | 'ISL')}
                              className="px-2.5 py-1.5 rounded-xl border border-[#e4e4e7] dark:border-[#3f3f46] text-xs font-bold text-[#3f3f46] dark:text-[#d4d4d8] hover:bg-[#f4f4f5] dark:hover:bg-[#27272a] transition-all"
                              title="Inspect Reference Guide"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (onOpenEvaluator) {
                                onOpenEvaluator(rec.signChar, rec.signLanguage as 'ASL' | 'ISL');
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Practice</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WEAKNESS DEEP-DIVE (Diagnostics, Mistake Frequencies, Retention) */}
      {/* ========================================================================= */}
      {activeTab === 'weaknesses' && (
        <div className="space-y-6" id="view-weakness-deep-dive">
          {/* Mastery Tier Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'critical_weakness', label: 'Critical Weakness', count: summary.criticalWeaknessCount, color: 'text-rose-500 border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20' },
              { id: 'developing', label: 'Developing', count: summary.developingCount, color: 'text-amber-500 border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20' },
              { id: 'proficient', label: 'Proficient', count: summary.proficientCount, color: 'text-blue-500 border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20' },
              { id: 'mastered', label: 'Mastered', count: summary.masteredCount, color: 'text-emerald-500 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20' }
            ].map(tier => (
              <button
                key={tier.id}
                onClick={() => setSelectedMasteryFilter(selectedMasteryFilter === tier.id ? 'all' : tier.id)}
                className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${tier.color} ${
                  selectedMasteryFilter === tier.id ? 'ring-2 ring-indigo-500 shadow-sm' : ''
                }`}
              >
                <span className="text-xs font-bold opacity-80">{tier.label}</span>
                <div className="mt-2 text-2xl font-black">{tier.count}</div>
              </button>
            ))}
          </div>

          {/* Weakness Diagnostic Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#18181b] dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Gesture Diagnostics & Mistake Breakdown</span>
              </h2>
              <span className="text-xs text-[#71717a] dark:text-[#a1a1aa]">
                Showing {filteredWeaknesses.length} analysed signs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWeaknesses.map(item => {
                const tierColor =
                  item.masteryTier === 'critical_weakness' ? 'text-rose-500 bg-rose-100 dark:bg-rose-950/60' :
                  item.masteryTier === 'developing' ? 'text-amber-500 bg-amber-100 dark:bg-amber-950/60' :
                  item.masteryTier === 'proficient' ? 'text-blue-500 bg-blue-100 dark:bg-blue-950/60' :
                  'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/60';

                return (
                  <div
                    key={`${item.signChar}_${item.signLanguage}`}
                    className="bg-white dark:bg-[#18181b] border border-[#e4e4e7] dark:border-[#27272a] rounded-2xl p-5 shadow-sm space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-[#27272a] border border-indigo-100 dark:border-[#3f3f46] flex flex-col items-center justify-center font-black text-lg text-indigo-600 dark:text-indigo-400">
                          {item.signChar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-[#18181b] dark:text-white">
                              {item.englishTitle}
                            </h3>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f4f4f5] dark:bg-[#27272a] text-[#71717a] dark:text-[#a1a1aa]">
                              {item.signLanguage}
                            </span>
                          </div>
                          <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">
                            {item.totalAttempts} total attempts • Last practiced {item.daysSinceLastPractice}d ago
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${tierColor}`}>
                        {item.masteryTier.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Performance Gauges */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-[#f8fafc] dark:bg-[#27272a]/50 rounded-xl text-center">
                      <div>
                        <div className="text-[10px] text-[#71717a] dark:text-[#a1a1aa]">Accuracy</div>
                        <div className={`text-sm font-black ${item.recentAccuracy >= 80 ? 'text-emerald-500' : item.recentAccuracy >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {item.recentAccuracy}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#71717a] dark:text-[#a1a1aa]">Memory Retention</div>
                        <div className={`text-sm font-black ${item.retentionScore >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {item.retentionScore}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#71717a] dark:text-[#a1a1aa]">Weakness Index</div>
                        <div className="text-sm font-black text-indigo-500">
                          {item.weaknessScore}/100
                        </div>
                      </div>
                    </div>

                    {/* Detected Joint Mistakes */}
                    {item.topMistakes.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-[#71717a] dark:text-[#a1a1aa] flex items-center gap-1">
                          <Target className="w-3 h-3 text-rose-500" />
                          <span>Detected Anatomical Faults:</span>
                        </div>
                        {item.topMistakes.map((mistake, mIdx) => (
                          <div
                            key={mIdx}
                            className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs flex items-start gap-2 text-rose-900 dark:text-rose-200"
                          >
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <div className="font-bold flex items-center gap-2">
                                <span>{mistake.fingerOrJoint}</span>
                                <span className="text-[10px] text-rose-600 dark:text-rose-400">
                                  ({mistake.frequency}% of attempts)
                                </span>
                              </div>
                              <p className="text-[11px] opacity-90">{mistake.issueDescription}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Confusion Partners */}
                    {item.confusionPartners && item.confusionPartners.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-xs flex items-center justify-between text-purple-900 dark:text-purple-200">
                        <span className="text-[11px] font-medium">
                          Often confused with: <strong>{item.confusionPartners.join(', ')}</strong>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          Contrast Drill
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-[#f4f4f5] dark:border-[#27272a] flex items-center justify-end gap-2">
                      {onOpenDictionary && (
                        <button
                          onClick={() => onOpenDictionary(item.signChar, item.signLanguage as 'ASL' | 'ISL')}
                          className="px-3 py-1.5 rounded-xl border border-[#e4e4e7] dark:border-[#3f3f46] text-xs font-bold text-[#3f3f46] dark:text-[#d4d4d8] hover:bg-[#f4f4f5] dark:hover:bg-[#27272a] transition-all"
                        >
                          Dictionary
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (onOpenEvaluator) {
                            onOpenEvaluator(item.signChar, item.signLanguage as 'ASL' | 'ISL');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Practice Sign</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LEARNING HISTORY (Full Session Log & Sub-scores) */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6" id="view-learning-history-log">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#18181b] dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                <span>Complete Evaluation & Practice Log</span>
              </h2>
              <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">
                Every single practice session, AI coach evaluation, quiz, and multiplayer drill.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Source Filter */}
              <select
                value={historySourceFilter}
                onChange={e => setHistorySourceFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#f4f4f5] dark:bg-[#27272a] border border-[#e4e4e7] dark:border-[#3f3f46] rounded-xl text-xs text-[#18181b] dark:text-white outline-none cursor-pointer"
              >
                <option value="all">All Sources</option>
                <option value="evaluator">AI Coach Evaluator</option>
                <option value="daily_practice">Daily Practice</option>
                <option value="curriculum_quiz">Curriculum Quiz</option>
                <option value="multiplayer">Multiplayer</option>
              </select>

              <button
                onClick={() => setShowAddLogModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span>+ Log Practice</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="p-2 rounded-xl bg-[#f4f4f5] dark:bg-[#27272a] border border-[#e4e4e7] dark:border-[#3f3f46] text-[#71717a] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white transition-all cursor-pointer"
                title="Export History JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* History Timeline Cards */}
          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="bg-white dark:bg-[#18181b] rounded-2xl p-12 text-center border border-[#e4e4e7] dark:border-[#27272a]">
                <Clock className="w-12 h-12 text-[#a1a1aa] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#18181b] dark:text-white">No Practice Logs Found</h3>
                <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] max-w-sm mx-auto mt-1">
                  Start practicing in the AI Coach Evaluator or log your first manual session to build your history!
                </p>
              </div>
            ) : (
              filteredHistory.map(entry => {
                const isHigh = entry.score >= 90;
                const isGood = entry.score >= 75 && entry.score < 90;
                const isLow = entry.score < 75;

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedHistoryEntry(entry)}
                    className="bg-white dark:bg-[#18181b] border border-[#e4e4e7] dark:border-[#27272a] hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-[#27272a] border border-indigo-100 dark:border-[#3f3f46] flex flex-col items-center justify-center font-black text-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                        {entry.signChar}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[#18181b] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {entry.englishTitle || `Sign ${entry.signChar}`}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f4f4f5] dark:bg-[#27272a] text-[#71717a] dark:text-[#a1a1aa]">
                            {entry.signLanguage}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            {entry.source.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#71717a] dark:text-[#a1a1aa]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(entry.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {entry.durationSeconds && (
                            <span>• {entry.durationSeconds}s duration</span>
                          )}
                          {entry.mistakesRecorded && entry.mistakesRecorded.length > 0 && (
                            <span className="text-rose-500 font-semibold truncate max-w-xs">
                              • {entry.mistakesRecorded[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                      <div className="text-right">
                        <div className={`text-lg font-black ${isHigh ? 'text-emerald-500' : isGood ? 'text-blue-500' : 'text-rose-500'}`}>
                          {entry.score}%
                        </div>
                        <div className="text-[10px] font-semibold text-[#71717a] dark:text-[#a1a1aa]">
                          {entry.accuracyGrade || (isHigh ? 'Mastered' : isGood ? 'Good' : 'Needs Practice')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (onOpenEvaluator) {
                              onOpenEvaluator(entry.signChar, entry.signLanguage as 'ASL' | 'ISL');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                        >
                          Retest
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#a1a1aa] group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: INTERACTIVE WORKOUT RUNNER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isWorkoutActive && activePlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#18181b] rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-[#e4e4e7] dark:border-[#27272a] space-y-6"
            >
              {!isWorkoutCompleted ? (
                <div className="space-y-6">
                  {/* Workout Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#71717a] dark:text-[#a1a1aa]">
                      <span>{activePlan.title}</span>
                      <span>
                        Sign {workoutCurrentIndex + 1} of {activePlan.targetSigns.length}
                      </span>
                    </div>
                    <div className="w-full bg-[#f4f4f5] dark:bg-[#27272a] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full transition-all duration-300"
                        style={{
                          width: `${((workoutCurrentIndex) / activePlan.targetSigns.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Active Sign Exercise Card */}
                  {activePlan.targetSigns[workoutCurrentIndex] && (
                    <div className="space-y-4 text-center">
                      <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-500/25">
                        <span className="text-4xl font-black">
                          {activePlan.targetSigns[workoutCurrentIndex].signChar}
                        </span>
                        {activePlan.targetSigns[workoutCurrentIndex].hindiChar && (
                          <span className="text-xs opacity-90">
                            {activePlan.targetSigns[workoutCurrentIndex].hindiChar}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xl font-extrabold text-[#18181b] dark:text-white">
                          {activePlan.targetSigns[workoutCurrentIndex].englishTitle || `Sign ${activePlan.targetSigns[workoutCurrentIndex].signChar}`}
                        </h3>
                        <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] mt-1 max-w-sm mx-auto">
                          {activePlan.targetSigns[workoutCurrentIndex].detailedReason}
                        </p>
                      </div>

                      {/* Coaching Tip box */}
                      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-left space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          <Target className="w-4 h-4" />
                          <span>Forming Instructions:</span>
                        </div>
                        <ul className="text-xs text-[#334155] dark:text-[#cbd5e1] space-y-1 pl-4 list-disc">
                          {activePlan.targetSigns[workoutCurrentIndex].sampleSteps.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Practice Scoring Input / AI Match simulation */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-center text-[#71717a] dark:text-[#a1a1aa]">
                      How accurately did you execute this sign?
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleWorkoutNext(60)}
                        className="py-3 px-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 transition-all"
                      >
                        Needs Work (60%)
                      </button>
                      <button
                        onClick={() => handleWorkoutNext(80)}
                        className="py-3 px-2 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 transition-all"
                      >
                        Good (80%)
                      </button>
                      <button
                        onClick={() => handleWorkoutNext(95)}
                        className="py-3 px-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-all"
                      >
                        Mastered (95%)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        const cur = activePlan.targetSigns[workoutCurrentIndex];
                        setIsWorkoutActive(false);
                        if (onOpenEvaluator) {
                          onOpenEvaluator(cur.signChar, cur.signLanguage as 'ASL' | 'ISL');
                        }
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Open in Live Webcam Evaluator</span>
                    </button>

                    <button
                      onClick={() => setIsWorkoutActive(false)}
                      className="text-xs text-[#71717a] dark:text-[#a1a1aa] hover:underline"
                    >
                      Exit Workout
                    </button>
                  </div>
                </div>
              ) : (
                /* Workout Completion View */
                <div className="text-center space-y-6 py-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Award className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-[#18181b] dark:text-white">
                      Workout Completed!
                    </h3>
                    <p className="text-xs text-[#71717a] dark:text-[#a1a1aa]">
                      Great job targeting your weaknesses today. Your muscle memory retention has been updated!
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#27272a] border border-[#e2e8f0] dark:border-[#3f3f46] grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xs text-[#71717a] dark:text-[#a1a1aa]">XP Earned</div>
                      <div className="text-xl font-black text-amber-500">+{activePlan.totalXpReward} XP</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#71717a] dark:text-[#a1a1aa]">Average Score</div>
                      <div className="text-xl font-black text-emerald-500">
                        {Math.round(workoutScore / activePlan.targetSigns.length)}%
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsWorkoutActive(false);
                      setActivePlan(null);
                    }}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all"
                  >
                    Done & Return to Recommendations
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: HISTORY ENTRY DETAILS MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedHistoryEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#18181b] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#e4e4e7] dark:border-[#27272a] space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-[#27272a] border border-indigo-100 dark:border-[#3f3f46] flex flex-col items-center justify-center font-black text-2xl text-indigo-600 dark:text-indigo-400">
                    {selectedHistoryEntry.signChar}
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#18181b] dark:text-white">
                      {selectedHistoryEntry.englishTitle || `Sign ${selectedHistoryEntry.signChar}`}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#71717a] dark:text-[#a1a1aa]">
                      <span>{selectedHistoryEntry.signLanguage}</span>
                      <span>•</span>
                      <span>{new Date(selectedHistoryEntry.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedHistoryEntry(null)}
                  className="p-1 rounded-full text-[#a1a1aa] hover:text-black dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Overall Score */}
              <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#27272a] border border-[#e2e8f0] dark:border-[#3f3f46] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#71717a] dark:text-[#a1a1aa]">Evaluation Score</div>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {selectedHistoryEntry.score}%
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {selectedHistoryEntry.accuracyGrade || 'Evaluated'}
                </span>
              </div>

              {/* Sub-score Breakdown */}
              {selectedHistoryEntry.subScores && (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-[#18181b] dark:text-white">
                    Anatomical Sub-score Analysis
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Finger Extension', val: selectedHistoryEntry.subScores.fingerExtension },
                      { label: 'Thumb Opposition', val: selectedHistoryEntry.subScores.thumbOpposition },
                      { label: 'Palm Orientation', val: selectedHistoryEntry.subScores.palmOrientation },
                      { label: 'Joint Curvature', val: selectedHistoryEntry.subScores.jointCurvature },
                      { label: 'Abduction / Spread', val: selectedHistoryEntry.subScores.abductionSpread }
                    ].map((sub, sIdx) => {
                      if (sub.val === undefined) return null;
                      return (
                        <div key={sIdx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-[#71717a] dark:text-[#a1a1aa]">{sub.label}</span>
                            <span className={sub.val >= 80 ? 'text-emerald-500' : sub.val >= 60 ? 'text-amber-500' : 'text-rose-500'}>
                              {sub.val}%
                            </span>
                          </div>
                          <div className="w-full bg-[#f4f4f5] dark:bg-[#27272a] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                sub.val >= 80 ? 'bg-emerald-400' : sub.val >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                              }`}
                              style={{ width: `${sub.val}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recorded Mistakes */}
              {selectedHistoryEntry.mistakesRecorded && selectedHistoryEntry.mistakesRecorded.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Recorded Faults During Attempt:</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                    {selectedHistoryEntry.mistakesRecorded.map((m, idx) => (
                      <p key={idx}>• {m}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedHistoryEntry(null)}
                  className="px-4 py-2 rounded-xl border border-[#e4e4e7] dark:border-[#3f3f46] text-xs font-bold hover:bg-[#f4f4f5] dark:hover:bg-[#27272a]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const sign = selectedHistoryEntry.signChar;
                    const lang = selectedHistoryEntry.signLanguage as 'ASL' | 'ISL';
                    setSelectedHistoryEntry(null);
                    if (onOpenEvaluator) {
                      onOpenEvaluator(sign, lang);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Retest in AI Coach
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: MANUAL LOG PRACTICE SESSION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAddLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e4e4e7] dark:border-[#27272a] space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#18181b] dark:text-white">
                  Log a Practice Attempt
                </h3>
                <button
                  onClick={() => setShowAddLogModal(false)}
                  className="text-[#a1a1aa] hover:text-black dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#71717a] dark:text-[#a1a1aa] mb-1">
                    Sign Character / Word
                  </label>
                  <input
                    type="text"
                    value={manualSign}
                    onChange={e => setManualSign(e.target.value.toUpperCase())}
                    placeholder="e.g. A, B, NAMASTE, HELP"
                    className="w-full px-3 py-2 bg-[#f4f4f5] dark:bg-[#27272a] border border-[#e4e4e7] dark:border-[#3f3f46] rounded-xl text-sm font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#71717a] dark:text-[#a1a1aa] mb-1">
                      Sign Language
                    </label>
                    <select
                      value={manualLang}
                      onChange={e => setManualLang(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#f4f4f5] dark:bg-[#27272a] border border-[#e4e4e7] dark:border-[#3f3f46] rounded-xl outline-none"
                    >
                      <option value="ASL">ASL</option>
                      <option value="ISL">ISL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#71717a] dark:text-[#a1a1aa] mb-1">
                      Score ({manualScore}%)
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      value={manualScore}
                      onChange={e => setManualScore(Number(e.target.value))}
                      className="w-full accent-indigo-600 mt-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#71717a] dark:text-[#a1a1aa] mb-1">
                    Mistake / Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualMistake}
                    onChange={e => setManualMistake(e.target.value)}
                    placeholder="e.g. Thumb was too loose"
                    className="w-full px-3 py-2 bg-[#f4f4f5] dark:bg-[#27272a] border border-[#e4e4e7] dark:border-[#3f3f46] rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowAddLogModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#e4e4e7] dark:border-[#3f3f46] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAddLog}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Save Log Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
