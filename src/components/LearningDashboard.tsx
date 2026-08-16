import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  CheckCircle2,
  Trophy,
  Sparkles,
  Award,
  Calendar,
  Zap,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Star,
  ChevronRight,
  ChevronLeft,
  Info,
  Check,
  X,
  Clock,
  BookOpen,
  Target,
  Filter,
  Share2,
  Lock,
  Layers,
  HeartHandshake,
  Activity,
  Smile,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { 
  LearningLesson, 
  LearningTrack, 
  PracticeGoal, 
  CompletionBadge, 
  LearningDashboardStats 
} from '../types';
import { 
  LEARNING_TRACKS, 
  CURRICULUM_LESSONS, 
  INITIAL_PRACTICE_GOALS, 
  ALL_COMPLETION_BADGES 
} from '../data/learningCurriculumData';
import ActiveLessonModal from './ActiveLessonModal';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LearningDashboardProps {
  onNavigateToDictionary?: () => void;
  onNavigateToCamera?: () => void;
  cameraActive?: boolean;
  onToggleCamera?: () => void;
  onOpenEvaluator?: (signName: string, lang?: 'ASL' | 'ISL') => void;
}

export default function LearningDashboard({
  onNavigateToDictionary,
  onNavigateToCamera,
  cameraActive = false,
  onToggleCamera,
  onOpenEvaluator
}: LearningDashboardProps) {
  // Navigation & Sub-views: 'all' | 'lessons' | 'progress' | 'goals' | 'badges'
  const [activeSection, setActiveSection] = useState<'overview' | 'lessons' | 'progress' | 'goals' | 'badges'>('overview');
  
  // Selected Track Filter
  const [selectedTrackId, setSelectedTrackId] = useState<string>('all');
  const [selectedLangFilter, setSelectedLangFilter] = useState<'ALL' | 'ISL' | 'ASL'>('ALL');
  
  // Active Lesson Modal
  const [activeLesson, setActiveLesson] = useState<LearningLesson | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState<boolean>(false);

  // Active Badge Detail Modal
  const [selectedBadge, setSelectedBadge] = useState<CompletionBadge | null>(null);
  const [badgeFilterTier, setBadgeFilterTier] = useState<string>('all');

  // Goals customization modal
  const [isCustomizingGoals, setIsCustomizingGoals] = useState<boolean>(false);
  const [selectedPace, setSelectedPace] = useState<'casual' | 'regular' | 'intensive'>('regular');

  // App State: Lessons, Goals, Badges, and Stats
  const [lessons, setLessons] = useState<LearningLesson[]>(() => {
    try {
      const saved = localStorage.getItem('asl_learning_lessons');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return CURRICULUM_LESSONS;
  });

  const [goals, setGoals] = useState<PracticeGoal[]>(() => {
    try {
      const saved = localStorage.getItem('asl_practice_goals');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PRACTICE_GOALS;
  });

  const [badges, setBadges] = useState<CompletionBadge[]>(() => {
    try {
      const saved = localStorage.getItem('asl_completion_badges');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return ALL_COMPLETION_BADGES;
  });

  const [stats, setStats] = useState<LearningDashboardStats>(() => {
    try {
      const saved = localStorage.getItem('asl_learning_stats');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      totalXp: 850,
      level: 4,
      levelTitle: 'ISL Practitioner',
      nextLevelXp: 1200,
      currentLevelXpProgress: 350,
      currentStreak: 5,
      bestStreak: 12,
      totalPracticedDays: 18,
      signsMasteredCount: 34,
      totalLessonsCompleted: 3,
      overallAccuracy: 92,
      practiceMinutesThisWeek: 48,
      streakFreezeAvailable: 2,
      lastPracticedDate: new Date().toISOString().split('T')[0]
    };
  });

  // Load from Firestore if user is authenticated
  useEffect(() => {
    const user = auth?.currentUser;
    if (user?.uid && db) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.learningStats) {
              setStats(prev => ({ ...prev, ...data.learningStats }));
            }
            if (data.learningLessons) {
              setLessons(data.learningLessons);
            }
            if (data.practiceGoals) {
              setGoals(data.practiceGoals);
            }
            if (data.completionBadges) {
              setBadges(data.completionBadges);
            }
          }
        })
        .catch(err => console.error("Could not fetch user learning data from Firestore:", err));
    }
  }, []);

  // Save to LocalStorage & Firestore on updates
  const persistState = (
    updatedLessons: LearningLesson[], 
    updatedGoals: PracticeGoal[], 
    updatedBadges: CompletionBadge[], 
    updatedStats: LearningDashboardStats
  ) => {
    localStorage.setItem('asl_learning_lessons', JSON.stringify(updatedLessons));
    localStorage.setItem('asl_practice_goals', JSON.stringify(updatedGoals));
    localStorage.setItem('asl_completion_badges', JSON.stringify(updatedBadges));
    localStorage.setItem('asl_learning_stats', JSON.stringify(updatedStats));

    const user = auth?.currentUser;
    if (user?.uid && db) {
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, {
        learningStats: updatedStats,
        learningLessons: updatedLessons,
        practiceGoals: updatedGoals,
        completionBadges: updatedBadges,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.error("Error saving learning state:", err));
    }
  };

  // Handle lesson completion from modal
  const handleCompleteLesson = (lessonId: string, score: number, stars: number, xpEarned: number) => {
    const updatedLessons = lessons.map(l => {
      if (l.id === lessonId) {
        return {
          ...l,
          completed: true,
          score,
          stars,
          completedAt: new Date().toISOString()
        };
      }
      return l;
    });
    setLessons(updatedLessons);

    // Calculate new stats
    const totalDone = updatedLessons.filter(l => l.completed).length;
    const newXp = stats.totalXp + xpEarned;
    const newLevel = Math.floor(newXp / 300) + 1;
    const levelTitles = ['Novice Signer', 'Curious Learner', 'Sign Apprentice', 'ISL Practitioner', 'Fluent Conversationalist', 'ISL Master', 'Grandmaster'];
    const levelTitle = levelTitles[Math.min(newLevel - 1, levelTitles.length - 1)];

    const updatedStats: LearningDashboardStats = {
      ...stats,
      totalXp: newXp,
      level: newLevel,
      levelTitle,
      totalLessonsCompleted: totalDone,
      signsMasteredCount: stats.signsMasteredCount + 4,
      practiceMinutesThisWeek: stats.practiceMinutesThisWeek + 10,
      lastPracticedDate: new Date().toISOString().split('T')[0]
    };
    setStats(updatedStats);

    // Update goals progress
    const updatedGoals = goals.map(g => {
      if (g.type === 'daily_signs') {
        const nextVal = Math.min(g.currentValue + 3, g.targetValue);
        return { ...g, currentValue: nextVal, isCompleted: nextVal >= g.targetValue };
      }
      if (g.type === 'weekly_lessons') {
        const nextVal = Math.min(g.currentValue + 1, g.targetValue);
        return { ...g, currentValue: nextVal, isCompleted: nextVal >= g.targetValue };
      }
      if (g.type === 'weekly_xp') {
        const nextVal = Math.min(g.currentValue + xpEarned, g.targetValue);
        return { ...g, currentValue: nextVal, isCompleted: nextVal >= g.targetValue };
      }
      return g;
    });
    setGoals(updatedGoals);

    // Update badges
    const updatedBadges = badges.map(b => {
      if (b.id === 'badge_first_steps' && !b.unlocked) {
        return { ...b, unlocked: true, currentProgress: 1, unlockedAt: new Date().toISOString() };
      }
      if (b.id === 'badge_vocabulary_50') {
        const nextProg = Math.min(stats.signsMasteredCount + 4, 50);
        return { ...b, currentProgress: nextProg, unlocked: nextProg >= 50 };
      }
      return b;
    });
    setBadges(updatedBadges);

    persistState(updatedLessons, updatedGoals, updatedBadges, updatedStats);
  };

  // Launch Active Lesson
  const handleStartLesson = (lesson: LearningLesson) => {
    setActiveLesson(lesson);
    setIsLessonModalOpen(true);
  };

  // Filtered Lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      if (selectedTrackId !== 'all' && l.trackId !== selectedTrackId) return false;
      if (selectedLangFilter === 'ISL' && l.signLanguage === 'ASL') return false;
      if (selectedLangFilter === 'ASL' && l.signLanguage === 'ISL') return false;
      return true;
    });
  }, [lessons, selectedTrackId, selectedLangFilter]);

  // Daily Spotlight Lesson (Next incomplete lesson)
  const spotlightLesson = useMemo(() => {
    return lessons.find(l => !l.completed) || lessons[0];
  }, [lessons]);

  // Filtered Badges
  const filteredBadges = useMemo(() => {
    return badges.filter(b => {
      if (badgeFilterTier === 'unlocked') return b.unlocked;
      if (badgeFilterTier === 'locked') return !b.unlocked;
      if (badgeFilterTier !== 'all' && b.tier !== badgeFilterTier) return false;
      return true;
    });
  }, [badges, badgeFilterTier]);

  // Adjust Practice Pace
  const handleApplyPace = (pace: 'casual' | 'regular' | 'intensive') => {
    setSelectedPace(pace);
    const signTarget = pace === 'casual' ? 3 : pace === 'regular' ? 5 : 10;
    const timeTarget = pace === 'casual' ? 5 : pace === 'regular' ? 10 : 20;

    const updatedGoals = goals.map(g => {
      if (g.type === 'daily_signs') {
        return { ...g, targetValue: signTarget, isCompleted: g.currentValue >= signTarget };
      }
      if (g.type === 'daily_time') {
        return { ...g, targetValue: timeTarget, isCompleted: g.currentValue >= timeTarget };
      }
      return g;
    });
    setGoals(updatedGoals);
    persistState(lessons, updatedGoals, badges, stats);
    setIsCustomizingGoals(false);
  };

  return (
    <div className="space-y-8" id="learning-dashboard-root">
      
      {/* Top Header & Overview Hero */}
      <div className="bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 dark:from-[#1b1b1f] dark:via-[#201c18] dark:to-[#17171a] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-lg border border-orange-200 dark:border-orange-900/60 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Interactive Learning Dashboard</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                ISL & ASL Standard
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-[#2d2d28] dark:text-white tracking-tight">
              Master Indian Sign Language Daily
            </h1>
            <p className="text-xs sm:text-sm text-[#5a5a4a] dark:text-[#cbd5e1] leading-relaxed">
              Structured daily micro-lessons, real-time posture tracking, customizable practice goals, and verifiable completion badges.
            </p>
          </div>

          {/* Level & XP Capsule */}
          <div className="bg-white dark:bg-[#141416] border border-[#e0e4db] dark:border-[#2d2d32] rounded-2xl p-4 shadow-sm min-w-[260px] space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 font-mono block">Current Rank</span>
                <span className="text-sm font-bold text-stone-900 dark:text-white font-sans">
                  Level {stats.level} • {stats.levelTitle}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                L{stats.level}
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                <span>XP Progress</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{stats.totalXp} / {stats.level * 300} XP</span>
              </div>
              <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.totalXp % 300) / 3, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Quick Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-200/60 dark:border-stone-800">
          <div className="bg-white/80 dark:bg-[#151518]/80 border border-stone-200/80 dark:border-stone-800 p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs font-bold font-mono uppercase">
              <Flame className="w-4 h-4 fill-orange-500" />
              <span>Day Streak</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-stone-900 dark:text-white font-mono">{stats.currentStreak}</span>
              <span className="text-[10px] text-stone-400 font-mono">days (Best: {stats.bestStreak})</span>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#151518]/80 border border-stone-200/80 dark:border-stone-800 p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>Signs Mastered</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-stone-900 dark:text-white font-mono">{stats.signsMasteredCount}</span>
              <span className="text-[10px] text-stone-400 font-mono">postures</span>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#151518]/80 border border-stone-200/80 dark:border-stone-800 p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Lessons Done</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-stone-900 dark:text-white font-mono">{stats.totalLessonsCompleted}</span>
              <span className="text-[10px] text-stone-400 font-mono">/ {lessons.length}</span>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#151518]/80 border border-stone-200/80 dark:border-stone-800 p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-bold font-mono uppercase">
              <Zap className="w-4 h-4" />
              <span>Avg Accuracy</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-stone-900 dark:text-white font-mono">{stats.overallAccuracy}%</span>
              <span className="text-[10px] text-emerald-500 font-bold font-mono">Top 5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e0e4db] dark:border-[#2d2d32] pb-3" id="learning-module-nav">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'overview', label: 'All Modules', icon: Layers },
            { id: 'lessons', label: 'Daily Lessons', icon: BookOpen, count: lessons.length },
            { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
            { id: 'goals', label: 'Practice Goals', icon: Target, count: goals.length },
            { id: 'badges', label: 'Completion Badges', icon: Trophy, count: badges.filter(b => b.unlocked).length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#7c8d7c] dark:bg-[#4a5c4e] text-white shadow-sm ring-1 ring-[#7c8d7c]'
                    : 'bg-white dark:bg-[#18181c] text-stone-600 dark:text-stone-300 border border-[#e0e4db] dark:border-[#2d2d32] hover:bg-stone-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-black/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Language Filter */}
        <div className="flex items-center bg-[#f0f2ee] dark:bg-[#202024] p-1 rounded-xl border border-[#d8dcd3] dark:border-[#333338] text-xs font-bold">
          {(['ALL', 'ISL', 'ASL'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLangFilter(lang)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedLangFilter === lang
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ALL' ? 'All Signs' : lang === 'ISL' ? 'ISL 🇮🇳' : 'ASL 🇺🇸'}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. DAILY LESSONS MODULE */}
      {/* ============================================================ */}
      {(activeSection === 'overview' || activeSection === 'lessons') && (
        <section className="space-y-6" id="daily-lessons-module">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#2d2d28] dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span>Daily Structured Lessons</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Step-by-step curriculum designed for clear retention with interactive quizzes and posture checks.
              </p>
            </div>

            {activeSection === 'overview' && (
              <button
                onClick={() => setActiveSection('lessons')}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>View All Lessons</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Spotlight "Lesson of the Day" Card */}
          {spotlightLesson && (
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-xl z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-lg">
                    ⭐ Recommended Next Lesson
                  </span>
                  <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded-lg">
                    Day {spotlightLesson.dayNumber}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black leading-tight">
                  {spotlightLesson.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
                  {spotlightLesson.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-white/90">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {spotlightLesson.durationMin} Minutes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    +{spotlightLesson.xpReward} XP Reward
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    {spotlightLesson.signs.length} Key Signs
                  </span>
                </div>
              </div>

              <div className="shrink-0 z-10">
                <button
                  onClick={() => handleStartLesson(spotlightLesson)}
                  className="w-full sm:w-auto py-3.5 px-8 bg-white text-orange-700 hover:bg-stone-50 active:scale-95 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-orange-700" />
                  <span>Start Lesson Now</span>
                </button>
              </div>

              {/* Decorative background watermark */}
              <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 text-white/10 font-black text-9xl pointer-events-none select-none">
                ISL
              </div>
            </div>
          )}

          {/* Curriculum Tracks Carousel & Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedTrackId('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedTrackId === 'all'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              All Tracks ({LEARNING_TRACKS.length})
            </button>
            {LEARNING_TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrackId(track.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedTrackId === track.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                <span>{track.icon}</span>
                <span>{track.title}</span>
              </button>
            ))}
          </div>

          {/* Lessons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-[#18181c] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2.5 py-1 rounded-lg">
                      Day {lesson.dayNumber}
                    </span>

                    {lesson.completed ? (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed</span>
                        {lesson.stars && (
                          <span className="text-amber-500 font-sans ml-1">
                            {'★'.repeat(lesson.stars)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/40">
                        Available
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-stone-900 dark:text-white group-hover:text-orange-600 transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {lesson.description}
                    </p>
                  </div>

                  {/* Signs Included Pills */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                      Signs in this lesson:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {lesson.signs.map((s) => (
                        <span
                          key={s.id}
                          className="text-[10px] font-mono font-semibold bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 px-2 py-0.5 rounded-md"
                        >
                          {s.char}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-[11px] font-mono text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {lesson.durationMin}m
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Sparkles className="w-3 h-3" />
                      +{lesson.xpReward} XP
                    </span>
                  </div>

                  <button
                    onClick={() => handleStartLesson(lesson)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      lesson.completed
                        ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200'
                        : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                    }`}
                  >
                    <span>{lesson.completed ? 'Review' : 'Start'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 2. PROGRESS TRACKING MODULE */}
      {/* ============================================================ */}
      {(activeSection === 'overview' || activeSection === 'progress') && (
        <section className="space-y-6" id="progress-tracking-module">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#2d2d28] dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Progress Tracking & Mastery Analytics</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Detailed breakdowns of your retention rate, active daily streak, and category coverage.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Weekly Activity & Heatmap */}
            <div className="lg:col-span-7 bg-white dark:bg-[#18181c] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  7-Day Practice Accuracy & Minutes
                </span>
                <span className="text-[10px] font-mono text-stone-400">Past 7 Days</span>
              </div>

              {/* Responsive 7-Day Bar Visualization */}
              <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center">
                {[
                  { day: 'Mon', mins: 12, acc: 94, isToday: false },
                  { day: 'Tue', mins: 15, acc: 96, isToday: false },
                  { day: 'Wed', mins: 8, acc: 88, isToday: false },
                  { day: 'Thu', mins: 14, acc: 92, isToday: false },
                  { day: 'Fri', mins: 20, acc: 98, isToday: false },
                  { day: 'Sat', mins: 10, acc: 90, isToday: false },
                  { day: 'Sun', mins: 18, acc: 95, isToday: true }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className="text-[10px] font-mono text-stone-400">{item.mins}m</div>
                    <div className="w-full max-w-[32px] h-28 bg-stone-100 dark:bg-stone-800 rounded-xl overflow-hidden flex flex-col justify-end p-1">
                      <div 
                        className={`w-full rounded-lg transition-all ${
                          item.isToday 
                            ? 'bg-gradient-to-t from-orange-500 to-amber-400' 
                            : 'bg-emerald-500/80 dark:bg-emerald-600/70'
                        }`}
                        style={{ height: `${(item.mins / 20) * 100}%` }}
                        title={`${item.day}: ${item.mins} mins, ${item.acc}% accuracy`}
                      />
                    </div>
                    <span className={`text-[11px] font-mono font-bold ${
                      item.isToday ? 'text-orange-600 dark:text-orange-400' : 'text-stone-600 dark:text-stone-400'
                    }`}>
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>

              {/* 30-Day Activity Heatmap Grid */}
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                  <span className="font-bold uppercase tracking-wider">30-Day Streak Consistency</span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span>Less</span>
                    <span className="w-2.5 h-2.5 rounded-xs bg-stone-100 dark:bg-stone-800 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-300 dark:bg-emerald-800 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-500 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-400 inline-block" />
                    <span>More</span>
                  </div>
                </div>

                <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 pt-1">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const hasPracticed = i < 18;
                    const isHigh = i % 3 === 0;
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-md transition-all ${
                          hasPracticed
                            ? isHigh 
                              ? 'bg-emerald-600 dark:bg-emerald-500' 
                              : 'bg-emerald-400 dark:bg-emerald-700'
                            : 'bg-stone-100 dark:bg-stone-800'
                        }`}
                        title={`Day ${i + 1}: ${hasPracticed ? 'Practiced' : 'No activity'}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Category Mastery Progress */}
            <div className="lg:col-span-5 bg-white dark:bg-[#18181c] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 font-mono uppercase tracking-wider block border-b border-stone-100 dark:border-stone-800 pb-3">
                Vocabulary Mastery by Category
              </span>

              <div className="space-y-4">
                {[
                  { label: 'Greetings & Etiquette', icon: '🙏', progress: 100, mastered: '8/8 Signs' },
                  { label: 'Two-Handed Alphabets', icon: '🔤', progress: 75, mastered: '19/26 Signs' },
                  { label: 'Numbers & Counting', icon: '🔢', progress: 90, mastered: '10/11 Signs' },
                  { label: 'Food & Dining (Chai/Water)', icon: '🍛', progress: 60, mastered: '5/8 Signs' },
                  { label: 'Family & Relations', icon: '👨‍👩‍👧', progress: 50, mastered: '4/8 Signs' },
                  { label: 'Health & Emergency', icon: '🏥', progress: 40, mastered: '3/7 Signs' }
                ].map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-stone-700 dark:text-stone-300">
                      <span className="flex items-center gap-1.5">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                      <span className="font-mono text-stone-400 text-[11px]">{cat.mastered}</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${cat.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={onNavigateToDictionary}
                  className="w-full py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  <span>Open Full ISL Dictionary</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 3. PRACTICE GOALS MODULE */}
      {/* ============================================================ */}
      {(activeSection === 'overview' || activeSection === 'goals') && (
        <section className="space-y-6" id="practice-goals-module">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#2d2d28] dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Practice Goals & Daily Commitments</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Personalized targets to keep your muscle memory sharp without feeling overwhelmed.
              </p>
            </div>

            <button
              onClick={() => setIsCustomizingGoals(!isCustomizingGoals)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 px-3.5 py-1.5 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isCustomizingGoals ? 'Close Pace Settings' : 'Customize Daily Pace'}</span>
            </button>
          </div>

          {/* Goal Pace Customizer Card */}
          {isCustomizingGoals && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-3xl p-5 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300 font-mono uppercase tracking-wider">
                  Select Your Daily Learning Pace
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                  Current: {selectedPace.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'casual', label: 'Casual Pace', signs: '3 Signs / Day', time: '5 Mins / Day', xp: '50 XP', desc: 'Gentle introduction for busy schedules' },
                  { id: 'regular', label: 'Regular Pace (Recommended)', signs: '5 Signs / Day', time: '10 Mins / Day', xp: '100 XP', desc: 'Optimal retention balance for everyday learners' },
                  { id: 'intensive', label: 'Intensive Immersion', signs: '10 Signs / Day', time: '20 Mins / Day', xp: '250 XP', desc: 'Rapid fluency sprint for interpreters and families' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyPace(p.id as any)}
                    className={`p-4 rounded-2xl border text-left space-y-2 transition-all cursor-pointer ${
                      selectedPace === p.id
                        ? 'bg-white dark:bg-[#18181c] border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white/60 dark:bg-[#18181c]/60 border-blue-200/60 dark:border-blue-900/40 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-stone-900 dark:text-white">{p.label}</strong>
                      {selectedPace === p.id && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="text-[11px] font-mono text-blue-700 dark:text-blue-300 space-y-0.5">
                      <div>🎯 {p.signs}</div>
                      <div>⏱️ {p.time}</div>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight pt-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const pct = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
              return (
                <div
                  key={goal.id}
                  className={`border rounded-3xl p-5 shadow-sm space-y-3 transition-all ${
                    goal.isCompleted
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                      : 'bg-white dark:bg-[#18181c] border-[#ecece0] dark:border-[#2d2d32]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      goal.period === 'daily' 
                        ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400' 
                        : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400'
                    }`}>
                      {goal.period} Goal
                    </span>

                    {goal.isCompleted ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Achieved!</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono font-bold text-stone-400">
                        +{goal.xpReward} XP
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                      {goal.title}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-normal">
                      {goal.description}
                    </p>
                  </div>

                  {/* Progress Bar & Numeric Count */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-stone-500">Progress</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {goal.currentValue} / {goal.targetValue} {goal.unit} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          goal.isCompleted 
                            ? 'bg-emerald-500' 
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 4. COMPLETION BADGES & ACHIEVEMENTS MODULE */}
      {/* ============================================================ */}
      {(activeSection === 'overview' || activeSection === 'badges') && (
        <section className="space-y-6" id="completion-badges-module">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#2d2d28] dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span>Completion Badges & Milestones</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Unlock prestigious recognition tokens for speed, precision, cultural knowledge, and continuous streaks.
              </p>
            </div>

            {/* Badge Tier Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Badges' },
                { id: 'unlocked', label: 'Unlocked' },
                { id: 'bronze', label: '🥉 Bronze' },
                { id: 'silver', label: '🥈 Silver' },
                { id: 'gold', label: '🥇 Gold' },
                { id: 'diamond', label: '💎 Diamond' }
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setBadgeFilterTier(tier.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    badgeFilterTier === tier.id
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBadges.map((badge) => {
              const tierColors = {
                bronze: 'border-amber-700/30 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300',
                silver: 'border-slate-300 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200',
                gold: 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200',
                diamond: 'border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200'
              };

              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group hover:scale-102 hover:shadow-md ${
                    badge.unlocked
                      ? tierColors[badge.tier]
                      : 'bg-stone-50/70 dark:bg-[#151518]/70 border-stone-200 dark:border-[#2d2d32] text-stone-400 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1a1a1d] shadow-sm flex items-center justify-center text-2xl shrink-0 group-hover:rotate-6 transition-transform">
                      {badge.icon}
                    </div>

                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10">
                      {badge.tier}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                        {badge.title}
                      </h4>
                      {badge.unlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>

                  {/* Unlock Requirement or Progress */}
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono">
                    <span className="truncate max-w-[150px]">{badge.requirement}</span>
                    <span className="font-bold">+{badge.xpValue} XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Active Lesson Modal */}
      {activeLesson && (
        <ActiveLessonModal
          lesson={activeLesson}
          isOpen={isLessonModalOpen}
          onClose={() => {
            setIsLessonModalOpen(false);
            setActiveLesson(null);
          }}
          onCompleteLesson={handleCompleteLesson}
          cameraActive={cameraActive}
          onToggleCamera={onToggleCamera}
          onLaunchEvaluator={(signName, lang) => {
            setIsLessonModalOpen(false);
            if (onOpenEvaluator) {
              onOpenEvaluator(signName, lang);
            }
          }}
        />
      )}

      {/* Badge Inspect Modal */}
      {selectedBadge && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedBadge(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#18181c] border border-stone-200 dark:border-[#2d2d32] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-4xl shadow-lg">
              {selectedBadge.icon}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/40">
                {selectedBadge.tier} Tier Badge
              </span>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                {selectedBadge.title}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {selectedBadge.description}
              </p>
            </div>

            {selectedBadge.flavorText && (
              <div className="bg-stone-50 dark:bg-stone-900/60 p-3 rounded-2xl text-xs italic text-stone-500 leading-relaxed font-serif">
                "{selectedBadge.flavorText}"
              </div>
            )}

            <div className="bg-stone-50 dark:bg-stone-900 p-3.5 rounded-2xl text-left text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-400">Status:</span>
                <span className={`font-bold ${selectedBadge.unlocked ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedBadge.unlocked ? '✓ UNLOCKED' : 'IN PROGRESS'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Requirement:</span>
                <span className="text-stone-800 dark:text-stone-200">{selectedBadge.requirement}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Reward Value:</span>
                <span className="text-amber-600 font-bold">+{selectedBadge.xpValue} XP</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              Close Badge Preview
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
