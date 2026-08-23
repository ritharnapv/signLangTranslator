import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Line,
  ComposedChart
} from 'recharts';
import { 
  BarChart2, 
  TrendingUp, 
  Award, 
  Clock, 
  Target, 
  Search, 
  ArrowUpDown, 
  CheckCircle2, 
  Download, 
  Trash2, 
  HelpCircle, 
  Activity, 
  Flame,
  Globe,
  Plus,
  RefreshCw,
  Cpu,
  Layers,
  BookOpen,
  Shuffle,
  FileSpreadsheet,
  FileText,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SessionHistoryItem, TranslationLogItem } from '../types';
import { 
  AnalyticsTimeframe, 
  AnalyticsSignLanguageFilter,
  generateHistoricalAnalyticsData,
  getBiomechanicalSkillsData,
  getCurriculumProgressData,
  getSpacedRepetitionData,
  getLatencyBenchmarks,
  getConfidenceDistribution,
  getTopConfusionPairs,
  getHourlyPracticeDistribution,
  getDayOfWeekDistribution,
  computeExecutiveSummary,
  exportAnalyticsToCSV
} from '../utils/analyticsEngine';
import { AnalyticsHeader } from './analytics/AnalyticsHeader';
import { AccuracyTrendsView } from './analytics/AccuracyTrendsView';
import { LearningProgressView } from './analytics/LearningProgressView';
import { PredictionStatisticsView } from './analytics/PredictionStatisticsView';
import { ExecutiveSummaryModal } from './analytics/ExecutiveSummaryModal';

export type AnalyticsSubTab = 'overview' | 'accuracy' | 'learning' | 'prediction' | 'ledger';

interface AnalyticsDashboardProps {
  sessions: SessionHistoryItem[];
  translations: TranslationLogItem[];
  onClearHistory: () => void;
  onExportJSON: () => void;
  onSelectSignForPractice?: (signChar: string, signLanguage: 'ASL' | 'ISL') => void;
  onNavigateToLearning?: () => void;
  onNavigateToEvaluator?: () => void;
}

export default function AnalyticsDashboard({
  sessions,
  translations,
  onClearHistory,
  onExportJSON,
  onSelectSignForPractice,
  onNavigateToLearning,
  onNavigateToEvaluator
}: AnalyticsDashboardProps) {
  // Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<AnalyticsSubTab>('overview');

  // Filters
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('30d');
  const [signLanguageFilter, setSignLanguageFilter] = useState<AnalyticsSignLanguageFilter>('ALL');
  const [useSimulatedData, setUseSimulatedData] = useState<boolean>(true);

  // Ledger state
  const [reportType, setReportType] = useState<'all' | 'translations' | 'gestures'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('All');

  // Executive Summary Modal
  const [isExecutiveSummaryOpen, setIsExecutiveSummaryOpen] = useState(false);

  // --- 1. COMPUTED STATS ---
  const totalTranslationsCount = translations.length;
  const totalGesturesCount = sessions.length;
  
  const averageAccuracy = useMemo(() => {
    if (sessions.length === 0) return 89.4; // High standard baseline
    const sum = sessions.reduce((acc, curr) => acc + curr.confidence, 0);
    return Number((sum / sessions.length).toFixed(1));
  }, [sessions]);

  // Telemetry trend points
  const { accuracyTrends, comparativeTrends } = useMemo(() => {
    return generateHistoricalAnalyticsData(timeframe, signLanguageFilter, sessions, translations);
  }, [timeframe, signLanguageFilter, sessions, translations]);

  // Biomechanical & Radar data
  const biomechanicalSkills = useMemo(() => getBiomechanicalSkillsData(), []);

  // Curriculum Category Progress
  const categoryProgress = useMemo(() => getCurriculumProgressData(signLanguageFilter), [signLanguageFilter]);

  // Spaced Repetition items
  const spacedRepetitionItems = useMemo(() => getSpacedRepetitionData(), []);

  // Latency benchmarks & Confidence histogram
  const latencyBenchmarks = useMemo(() => getLatencyBenchmarks(), []);
  const confidenceBuckets = useMemo(() => getConfidenceDistribution(), []);
  const confusionPairs = useMemo(() => getTopConfusionPairs(), []);

  // Diurnal & Weekly patterns
  const hourlyDistribution = useMemo(() => getHourlyPracticeDistribution(), []);
  const dayOfWeekDistribution = useMemo(() => getDayOfWeekDistribution(), []);

  // Executive Insights
  const executiveInsights = useMemo(() => {
    return computeExecutiveSummary(averageAccuracy, totalGesturesCount, totalTranslationsCount);
  }, [averageAccuracy, totalGesturesCount, totalTranslationsCount]);

  // Gesture Accuracy groupings
  const gestureAccuracyData = useMemo(() => {
    const groupings: Record<string, { sum: number; count: number }> = {};
    
    sessions.forEach(item => {
      const match = item.caption.match(/'([^']+)'/);
      const char = match ? match[1] : 'Unknown';
      if (!groupings[char]) {
        groupings[char] = { sum: 0, count: 0 };
      }
      groupings[char].sum += item.confidence;
      groupings[char].count++;
    });

    const list = Object.keys(groupings).map(char => ({
      name: char,
      accuracy: Number((groupings[char].sum / groupings[char].count).toFixed(1))
    }));

    if (list.length < 3) {
      return [
        { name: 'A', accuracy: 95.2 },
        { name: 'B', accuracy: 91.4 },
        { name: 'C', accuracy: 92.8 },
        { name: 'THANK YOU', accuracy: 94.0 },
        { name: 'HELLO', accuracy: 93.5 },
        { name: 'NAMASTE', accuracy: 96.1 },
        { name: 'M', accuracy: 72.4 },
        { name: 'T', accuracy: 68.0 }
      ];
    }

    return list.sort((a, b) => b.accuracy - a.accuracy);
  }, [sessions]);

  const topCalibratedSigns = useMemo(() => {
    return [...gestureAccuracyData].sort((a, b) => b.accuracy - a.accuracy).slice(0, 5);
  }, [gestureAccuracyData]);

  const needsPracticeSigns = useMemo(() => {
    return [...gestureAccuracyData].sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
  }, [gestureAccuracyData]);

  // --- 2. LANGUAGE DISTRIBUTION DATA ---
  const languageData = useMemo(() => {
    const counts: Record<string, number> = {
      English: 0,
      Hindi: 0,
      Kannada: 0,
      Malayalam: 0
    };
    
    translations.forEach(item => {
      const lang = item.targetLanguage || 'English';
      if (counts[lang] !== undefined) {
        counts[lang]++;
      } else {
        counts[lang] = 1;
      }
    });

    if (translations.length === 0) {
      return [
        { name: 'English', value: 14, color: '#7c8d7c' },
        { name: 'Hindi', value: 9, color: '#5c3c35' },
        { name: 'Kannada', value: 6, color: '#e0a96d' },
        { name: 'Malayalam', value: 4, color: '#0d9488' }
      ];
    }

    return Object.keys(counts)
      .map(key => ({
        name: key,
        value: counts[key],
        color: key === 'English' ? '#7c8d7c' : 
               key === 'Hindi' ? '#5c3c35' : 
               key === 'Kannada' ? '#e0a96d' : '#0d9488'
      }))
      .filter(item => item.value > 0);
  }, [translations]);

  // --- 3. COMBINED REPORTS TABLE LOGS ---
  const combinedReports = useMemo(() => {
    const logs: Array<{
      id: string;
      type: 'Translation' | 'Gesture Practice';
      time: string;
      primary: string;
      secondary: string;
      metric: string;
      meta?: string;
    }> = [];

    translations.forEach(item => {
      logs.push({
        id: item.id,
        type: 'Translation',
        time: item.timestamp,
        primary: item.inputText,
        secondary: item.translatedText,
        metric: item.targetLanguage,
        meta: 'API Server'
      });
    });

    sessions.forEach(item => {
      logs.push({
        id: item.id,
        type: 'Gesture Practice',
        time: item.timestamp,
        primary: item.caption,
        secondary: 'Skeletal Landmark Analysis',
        metric: `${item.confidence.toFixed(1)}%`,
        meta: item.confidence >= 80 ? 'Mastered' : item.confidence >= 70 ? 'Passed' : 'Needs Practice'
      });
    });

    // If empty, supply high-fidelity logs for inspection
    if (logs.length === 0 && useSimulatedData) {
      const now = Date.now();
      logs.push(
        { id: 'demo-1', type: 'Gesture Practice', time: new Date(now - 1000 * 60 * 12).toISOString(), primary: "Practiced Letter 'A'", secondary: "Skeletal Landmark Analysis", metric: "96.4%", meta: "Mastered" },
        { id: 'demo-2', type: 'Gesture Practice', time: new Date(now - 1000 * 60 * 35).toISOString(), primary: "Practiced ISL 'NAMASTE'", secondary: "Two-Handed Coordination", metric: "94.8%", meta: "Mastered" },
        { id: 'demo-3', type: 'Translation', time: new Date(now - 1000 * 60 * 65).toISOString(), primary: "Hello how are you", secondary: "नमस्ते आप कैसे हैं", metric: "Hindi", meta: "API Server" },
        { id: 'demo-4', type: 'Gesture Practice', time: new Date(now - 1000 * 60 * 120).toISOString(), primary: "Practiced Letter 'T'", secondary: "Thumb-Tuck Articulation", metric: "68.2%", meta: "Needs Practice" },
        { id: 'demo-5', type: 'Translation', time: new Date(now - 1000 * 60 * 180).toISOString(), primary: "Thank you for the guidance", secondary: "ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು", metric: "Kannada", meta: "API Server" }
      );
    }

    let filtered = logs.filter(log => {
      if (reportType === 'translations' && log.type !== 'Translation') return false;
      if (reportType === 'gestures' && log.type !== 'Gesture Practice') return false;
      if (selectedLanguageFilter !== 'All' && log.type === 'Translation' && log.metric !== selectedLanguageFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          log.primary.toLowerCase().includes(query) ||
          log.secondary.toLowerCase().includes(query) ||
          log.metric.toLowerCase().includes(query)
        );
      }
      return true;
    });

    filtered.sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.time.localeCompare(a.time) 
        : a.time.localeCompare(b.time);
    });

    return filtered;
  }, [sessions, translations, reportType, searchTerm, sortOrder, selectedLanguageFilter, useSimulatedData]);

  // Handle CSV Export
  const handleExportCSV = () => {
    exportAnalyticsToCSV(sessions, translations, accuracyTrends);
  };

  return (
    <div className="space-y-6" id="analytics-tab-view">
      {/* Analytics Control Header */}
      <AnalyticsHeader
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        signLanguageFilter={signLanguageFilter}
        setSignLanguageFilter={setSignLanguageFilter}
        useSimulatedData={useSimulatedData}
        setUseSimulatedData={setUseSimulatedData}
        onExportJSON={onExportJSON}
        onExportCSV={handleExportCSV}
        onOpenExecutiveSummary={() => setIsExecutiveSummaryOpen(true)}
        onClearHistory={onClearHistory}
      />

      {/* Subtab Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl shadow-xs" id="analytics-subtab-navigation">
        {[
          { id: 'overview', label: 'Overview & KPIs', icon: BarChart2 },
          { id: 'accuracy', label: 'Accuracy Trends', icon: TrendingUp },
          { id: 'learning', label: 'Learning Progress', icon: BookOpen },
          { id: 'prediction', label: 'Prediction Statistics', icon: Cpu },
          { id: 'ledger', label: 'Telemetry Ledger', icon: Layers }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as AnalyticsSubTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-[#7c8d7c] text-white shadow-xs'
                  : 'text-[#7a7a6a] dark:text-[#a1a1aa] hover:bg-[#f6f7f2] dark:hover:bg-zinc-800 hover:text-[#2d2d28] dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SUBVIEW 1: OVERVIEW & EXECUTIVE KPIS */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn" id="analytics-overview-subview">
          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="analytics-bento-grid">
            {/* Total Translations */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-5 space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#7a7a6a] dark:text-[#a1a1aa] uppercase tracking-wider">Translations Logged</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-[#7c8d7c] dark:text-emerald-400">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5] font-sans">
                  {totalTranslationsCount > 0 ? totalTranslationsCount : 33}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <TrendingUp className="w-3 h-3" />
                  <span>4 target languages</span>
                </div>
              </div>
            </div>

            {/* Total Gestures Practiced */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-5 space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#7a7a6a] dark:text-[#a1a1aa] uppercase tracking-wider">Gestures Practiced</span>
                <div className="w-8 h-8 rounded-lg bg-[#5c3c35]/10 dark:bg-[#5c3c35]/30 flex items-center justify-center text-[#5c3c35] dark:text-[#ebdcd1]">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5] font-sans">
                  {totalGesturesCount > 0 ? totalGesturesCount : 84}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-[#5c3c35] dark:text-[#ebdcd1] font-bold">
                  <Clock className="w-3 h-3" />
                  <span>145 total minutes</span>
                </div>
              </div>
            </div>

            {/* Average Skeletal Accuracy */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-5 space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#7a7a6a] dark:text-[#a1a1aa] uppercase tracking-wider">Average Accuracy</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-[#e0a96d] dark:text-amber-400">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5] font-sans">
                  {averageAccuracy}%
                </span>
                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  <Award className="w-3 h-3" />
                  <span>Above 85% goal line</span>
                </div>
              </div>
            </div>

            {/* Daily Practice Streak */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-5 space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#7a7a6a] dark:text-[#a1a1aa] uppercase tracking-wider">Active Streak</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 dark:text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5] font-sans">
                  7 Days
                </span>
                <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                  <span>1,420 XP total score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Composed Chart: Practice Volume & Accuracy Combined */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Daily Activity & Accuracy Composed Chart */}
            <div className="lg:col-span-8 bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                    Daily Practice Volume & Accuracy Trajectory
                  </h3>
                  <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
                    Dual-axis composite visualization of practice repetitions and skeletal confidence over time.
                  </p>
                </div>
                <button
                  onClick={() => setActiveSubTab('accuracy')}
                  className="text-xs font-bold text-[#5a6b5a] dark:text-[#9cd39c] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Detailed Trends</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-72 w-full font-mono text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={accuracyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1e8" className="dark:stroke-zinc-800" />
                    <XAxis dataKey="displayDate" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                    <YAxis yAxisId="left" domain={[50, 100]} stroke="#a1a1aa" fontSize={10} tickLine={false} unit="%" />
                    <YAxis yAxisId="right" orientation="right" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.96)',
                        border: '1px solid #ebdcd1',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    <Bar yAxisId="right" dataKey="sessionsCount" name="Practice Sessions" fill="#e0e4db" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="avgAccuracy" name="Avg Accuracy %" stroke="#7c8d7c" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line yAxisId="left" type="monotone" dataKey="rollingAverage" name="5d Rolling Average" stroke="#5c3c35" strokeWidth={1.8} strokeDasharray="3 3" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Language Distribution Donut */}
            <div className="lg:col-span-4 bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                  Target Language Shares
                </h3>
                <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
                  Proportion of text & vocal translations by target locale.
                </p>
              </div>

              <div className="h-48 w-full relative flex items-center justify-center font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {languageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
              </div>

              <div className="space-y-1.5 font-mono text-xs border-t border-neutral-100 dark:border-zinc-800 pt-3">
                {languageData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-sans text-neutral-700 dark:text-zinc-300 font-semibold">{item.name}</span>
                    </div>
                    <span className="font-bold text-neutral-800 dark:text-zinc-200">{item.value} logs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Subview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Accuracy Drilldown Card */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 space-y-3 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Accuracy Dynamics</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <h4 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] mt-1">
                  Biomechanical Precision
                </h4>
                <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Analyze joint-by-joint finger curl precision, wrist rotation stability, and comparative sign trajectories.
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('accuracy')}
                className="w-full py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-xs font-bold text-neutral-800 dark:text-zinc-200 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Explore Accuracy Trends</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Learning Progress Card */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 space-y-3 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Curriculum Mastery</span>
                  <BookOpen className="w-4 h-4 text-blue-500" />
                </div>
                <h4 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] mt-1">
                  Vocabulary Retention
                </h4>
                <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Track category milestones, Ebbinghaus spaced repetition memory decay curve, and fluency milestones.
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('learning')}
                className="w-full py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-xs font-bold text-neutral-800 dark:text-zinc-200 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Learning Progress</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Prediction Telemetry Card */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 space-y-3 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Neural Telemetry</span>
                  <Cpu className="w-4 h-4 text-purple-500" />
                </div>
                <h4 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] mt-1">
                  Prediction Telemetry
                </h4>
                <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Inspect model inference latency benchmarks, confidence distribution histograms, and confusion matrix remedies.
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('prediction')}
                className="w-full py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-xs font-bold text-neutral-800 dark:text-zinc-200 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Inspect ML Telemetry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 2: ACCURACY TRENDS & BIOMECHANICS */}
      {/* ========================================================================= */}
      {activeSubTab === 'accuracy' && (
        <div className="animate-fadeIn">
          <AccuracyTrendsView
            accuracyTrends={accuracyTrends}
            comparativeTrends={comparativeTrends}
            biomechanicalSkills={biomechanicalSkills}
            hourlyDistribution={hourlyDistribution}
            dayOfWeekDistribution={dayOfWeekDistribution}
            topCalibratedSigns={topCalibratedSigns}
            needsPracticeSigns={needsPracticeSigns}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 3: LEARNING PROGRESS & VOCABULARY VELOCITY */}
      {/* ========================================================================= */}
      {activeSubTab === 'learning' && (
        <div className="animate-fadeIn">
          <LearningProgressView
            categoryProgress={categoryProgress}
            spacedRepetitionItems={spacedRepetitionItems}
            totalMasteredCount={54}
            totalProficientCount={28}
            totalLearningCount={14}
            totalUntestedCount={12}
            totalPracticeMinutes={145}
            currentStreakDays={7}
            totalXpEarned={1420}
            onSelectSignForPractice={onSelectSignForPractice}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 4: PREDICTION STATISTICS & ML TELEMETRY */}
      {/* ========================================================================= */}
      {activeSubTab === 'prediction' && (
        <div className="animate-fadeIn">
          <PredictionStatisticsView
            latencyBenchmarks={latencyBenchmarks}
            confidenceBuckets={confidenceBuckets}
            confusionPairs={confusionPairs}
            totalInferencesCount={890}
            avgLatencyMs={38}
            correctionsFeedbackCount={34}
            correctionsAppliedCount={29}
            onOpenCorrectionTool={() => {
              // Switch to ledger or trigger learning
              setActiveSubTab('ledger');
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 5: TELEMETRY LEDGER */}
      {/* ========================================================================= */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5 animate-fadeIn" id="analytics-ledger-table-container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5]">
                Telemetry Activity Ledger
              </h3>
              <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
                Audit trail of all live subtitles, translations, and gesture verification sessions.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter */}
              <div className="flex bg-[#f6f7f2] dark:bg-[#161619] p-1 rounded-xl border border-[#ecece0] dark:border-[#2d2d32] text-xs">
                <button
                  onClick={() => setReportType('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reportType === 'all' 
                      ? 'bg-white dark:bg-zinc-800 text-[#5a6b5a] dark:text-[#9cd39c] shadow-xs' 
                      : 'text-neutral-500'
                  }`}
                >
                  All ({combinedReports.length})
                </button>
                <button
                  onClick={() => setReportType('translations')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reportType === 'translations' 
                      ? 'bg-white dark:bg-zinc-800 text-[#5a6b5a] dark:text-[#9cd39c] shadow-xs' 
                      : 'text-neutral-500'
                  }`}
                >
                  Translations
                </button>
                <button
                  onClick={() => setReportType('gestures')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reportType === 'gestures' 
                      ? 'bg-white dark:bg-zinc-800 text-[#5a6b5a] dark:text-[#9cd39c] shadow-xs' 
                      : 'text-neutral-500'
                  }`}
                >
                  Gestures
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-[#f6f7f2] dark:bg-[#161619] border border-[#ecece0] dark:border-[#2d2d32] rounded-xl focus:outline-none focus:border-[#7c8d7c] w-40 sm:w-52"
                />
              </div>

              {/* Sort Order Toggle */}
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="p-2 bg-[#f6f7f2] dark:bg-[#161619] border border-[#ecece0] dark:border-[#2d2d32] rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-colors cursor-pointer"
                title="Toggle Date Sort Order"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl overflow-hidden font-mono text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fcfdfa] dark:bg-zinc-900 border-b border-[#ecece0] dark:border-[#2d2d32] text-[#7a7a6a] dark:text-[#a1a1aa] text-[10px] uppercase tracking-wider font-bold">
                    <th className="p-3.5 pl-4">Timestamp</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Sign / Input Event</th>
                    <th className="p-3.5">Translation / Result</th>
                    <th className="p-3.5">Confidence / Target</th>
                    <th className="p-3.5 text-right pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ecece0] dark:divide-[#2d2d32]">
                  {combinedReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400 font-sans">
                        No telemetry logs matching the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    combinedReports.map(log => (
                      <tr key={log.id} className="hover:bg-[#fcfdfa] dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="p-3.5 pl-4 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.type === 'Translation'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#5a6b5a] dark:text-[#9cd39c]'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="p-3.5 font-sans font-bold text-neutral-900 dark:text-zinc-100 max-w-xs truncate">
                          {log.primary}
                        </td>
                        <td className="p-3.5 font-sans text-neutral-600 dark:text-zinc-300 max-w-xs truncate">
                          {log.secondary}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-neutral-800 dark:text-zinc-200">
                          {log.metric}
                        </td>
                        <td className="p-3.5 text-right pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.meta === 'Mastered' || log.meta === 'Passed' || log.meta === 'API Server'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {log.meta || 'Logged'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Executive Summary Modal */}
      <ExecutiveSummaryModal
        isOpen={isExecutiveSummaryOpen}
        onClose={() => setIsExecutiveSummaryOpen(false)}
        insights={executiveInsights}
        biomechanicalSkills={biomechanicalSkills}
        totalPracticeMinutes={145}
        totalMasteredSigns={54}
        overallAccuracy={averageAccuracy}
      />
    </div>
  );
}
