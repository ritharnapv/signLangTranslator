import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import { 
  Award, 
  BookOpen, 
  Flame, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Zap
} from 'lucide-react';
import { 
  CategoryProgressItem, 
  SpacedRepetitionItem 
} from '../../utils/analyticsEngine';

interface LearningProgressViewProps {
  categoryProgress: CategoryProgressItem[];
  spacedRepetitionItems: SpacedRepetitionItem[];
  totalMasteredCount: number;
  totalProficientCount: number;
  totalLearningCount: number;
  totalUntestedCount: number;
  totalPracticeMinutes: number;
  currentStreakDays: number;
  totalXpEarned: number;
  onSelectSignForPractice?: (signChar: string, signLanguage: 'ASL' | 'ISL') => void;
}

export const LearningProgressView: React.FC<LearningProgressViewProps> = ({
  categoryProgress,
  spacedRepetitionItems,
  totalMasteredCount,
  totalProficientCount,
  totalLearningCount,
  totalUntestedCount,
  totalPracticeMinutes,
  currentStreakDays,
  totalXpEarned,
  onSelectSignForPractice
}) => {
  const totalVocabulary = totalMasteredCount + totalProficientCount + totalLearningCount + totalUntestedCount;
  const overallMasteryRate = totalVocabulary > 0 
    ? Math.round(((totalMasteredCount + totalProficientCount * 0.7) / totalVocabulary) * 100)
    : 78;

  const funnelData = [
    { name: 'Mastered (≥85%)', value: totalMasteredCount, color: '#10b981' },
    { name: 'Proficient (70-84%)', value: totalProficientCount, color: '#7c8d7c' },
    { name: 'In-Learning (<70%)', value: totalLearningCount, color: '#f59e0b' },
    { name: 'Untested Queue', value: totalUntestedCount, color: '#94a3b8' }
  ];

  return (
    <div className="space-y-6" id="learning-progress-subview">
      {/* 1. VOCABULARY MASTERY FUNNEL & KEY PROGRESS METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Global Vocabulary Funnel Card */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                Curriculum & Vocabulary Mastery Funnel
              </h3>
              <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
                Distribution of sign gestures across mastery tiers based on recent landmark precision.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#5a6b5a] dark:text-[#9cd39c] bg-[#7c8d7c]/15 px-2.5 py-1 rounded-xl">
              {totalVocabulary} TOTAL GESTURES
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Donut Chart */}
            <div className="h-56 w-full relative flex items-center justify-center font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={funnelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {funnelData.map((entry, index) => (
                      <Cell key={`funnel-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.96)',
                      border: '1px solid #ebdcd1',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-[#2d2d28] dark:text-[#f4f4f5] block font-sans">
                  {overallMasteryRate}%
                </span>
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">
                  Fluency
                </span>
              </div>
            </div>

            {/* Funnel Breakdown List */}
            <div className="space-y-2.5 font-mono text-xs">
              {funnelData.map(item => (
                <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-[#fcfdfa] dark:bg-zinc-900/40 border border-neutral-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-sans text-neutral-700 dark:text-zinc-300 font-semibold">{item.name}</span>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {item.value} ({Math.round((item.value / totalVocabulary) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Practice Velocity & Time Investment Bento */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {/* Total Practice Time */}
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 space-y-2 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Practice Time</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5]">
                {totalPracticeMinutes}m
              </span>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+35m this week</span>
              </p>
            </div>
          </div>

          {/* Active Learning Streak */}
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 space-y-2 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Streak</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5]">
                {currentStreakDays} Days
              </span>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                Top 8% consistency
              </p>
            </div>
          </div>

          {/* Cumulative XP Earned */}
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 space-y-2 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Mastery XP</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5]">
                {totalXpEarned.toLocaleString()}
              </span>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-1">
                League Division I
              </p>
            </div>
          </div>

          {/* Fluency Milestone Progress */}
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 space-y-2 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Milestone</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-base sm:text-lg font-black text-[#2d2d28] dark:text-[#f4f4f5] truncate block">
                B2 Fluent
              </span>
              <p className="text-[10px] text-neutral-500 dark:text-zinc-400 font-bold mt-1">
                4 signs to Level C1
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY COMPLETION MATRIX WITH PROGRESS BARS */}
      <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
              Curriculum Track & Category Completion
            </h3>
            <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
              Breakdown of vocabulary progress across alphabet sets, conversational greetings, and emergency phrases.
            </p>
          </div>
          <BookOpen className="w-4 h-4 text-neutral-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {categoryProgress.map(cat => (
            <div key={cat.category} className="bg-[#fcfdfa] dark:bg-zinc-900/40 p-4 rounded-2xl border border-neutral-100 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-800 dark:text-zinc-200">{cat.displayName}</span>
                <span className="font-mono font-bold text-neutral-500 dark:text-zinc-400">
                  {cat.mastered}/{cat.total} Signs ({cat.percentage}%)
                </span>
              </div>
              {/* Progress Track */}
              <div className="w-full bg-neutral-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SPACED REPETITION & RETENTION DECAY (EBBINGHAUS CURVE) */}
      <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                Spaced Repetition & Memory Retention Decay (Ebbinghaus Model)
              </h3>
            </div>
            <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
              Algorithmic memory decay alerts indicating which gestures require refresher repetitions before neural recall drops.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
            ADAPTIVE SPACED REPETITION
          </span>
        </div>

        {/* Spaced repetition review list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {spacedRepetitionItems.map(item => {
            const isCritical = item.status === 'Critical Decay' || item.status === 'Due for Review';
            return (
              <div
                key={item.signChar}
                className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                  isCritical
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                    : 'bg-[#fcfdfa] dark:bg-zinc-900/40 border-neutral-100 dark:border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-[#7c8d7c] text-white">
                        {item.signChar}
                      </span>
                      <span className="text-[10px] uppercase font-bold font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400">
                        {item.signLanguage}
                      </span>
                    </div>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Critical Decay'
                        ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                        : item.status === 'Due for Review'
                        ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-neutral-800 dark:text-zinc-200 mt-2 line-clamp-1">
                    {item.englishTitle}
                  </p>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-neutral-500">Retention Score</span>
                      <span className="font-bold">{item.retentionScore}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.retentionScore}%`,
                          backgroundColor: item.retentionScore >= 80 ? '#10b981' : item.retentionScore >= 60 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                  <span className="text-neutral-400 font-mono">
                    Practiced {item.lastPracticedDaysAgo}d ago
                  </span>
                  {onSelectSignForPractice && (
                    <button
                      onClick={() => onSelectSignForPractice(item.signChar, item.signLanguage)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-xs font-bold text-neutral-800 dark:text-zinc-200 hover:bg-neutral-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LearningProgressView;
