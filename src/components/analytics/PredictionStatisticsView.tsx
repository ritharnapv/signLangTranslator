import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Cpu, 
  Zap, 
  Activity, 
  Shuffle, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  LatencyBenchmarkItem, 
  ConfidenceBucketItem, 
  ConfusionPairItem 
} from '../../utils/analyticsEngine';

interface PredictionStatisticsViewProps {
  latencyBenchmarks: LatencyBenchmarkItem[];
  confidenceBuckets: ConfidenceBucketItem[];
  confusionPairs: ConfusionPairItem[];
  totalInferencesCount: number;
  avgLatencyMs: number;
  correctionsFeedbackCount: number;
  correctionsAppliedCount: number;
  onOpenCorrectionTool?: () => void;
}

export const PredictionStatisticsView: React.FC<PredictionStatisticsViewProps> = ({
  latencyBenchmarks,
  confidenceBuckets,
  confusionPairs,
  totalInferencesCount,
  avgLatencyMs,
  correctionsFeedbackCount,
  correctionsAppliedCount,
  onOpenCorrectionTool
}) => {
  const engineDistribution = [
    { name: 'On-Device Custom TF.js', value: 58, color: '#7c8d7c' },
    { name: 'MediaPipe Joint Heuristics', value: 24, color: '#e0a96d' },
    { name: 'Gemini 2.5 Multimodal API', value: 12, color: '#3b82f6' },
    { name: 'Hybrid Fallback Ensemble', value: 6, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6" id="prediction-statistics-subview">
      {/* 1. TOP TELEMETRY BENCHMARK METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Neural Inferences */}
        <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-5 space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Inference Events</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-[#7c8d7c] dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5] font-sans">
              {totalInferencesCount.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              <Zap className="w-3 h-3" />
              <span>Real-time frame matching</span>
            </div>
          </div>
        </div>

        {/* Average Latency */}
        <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-5 space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avg Latency</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5] font-sans">
              {avgLatencyMs}ms
            </span>
            <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
              <Zap className="w-3 h-3" />
              <span>Sub-50ms On-Device target</span>
            </div>
          </div>
        </div>

        {/* Model Precision Index */}
        <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-5 space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Model Precision</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5] font-sans">
              96.4%
            </span>
            <div className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Top-1 validation score</span>
            </div>
          </div>
        </div>

        {/* Active Corrections Rate */}
        <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-5 space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Feedback</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-[#2d2d28] dark:text-[#f4f4f5] font-sans">
              {correctionsAppliedCount}/{correctionsFeedbackCount}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
              <span>Applied to neural model</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONFIDENCE DISTRIBUTION HISTOGRAM & ENGINE LATENCY BENCHMARKS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confidence Distribution Histogram */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                Prediction Confidence Distribution
              </h3>
              <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
                Histogram breakdown of inference confidence percentages across all live meeting and practice frames.
              </p>
            </div>
          </div>

          <div className="h-64 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1e8" className="dark:stroke-zinc-800" />
                <XAxis dataKey="bucket" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #ebdcd1',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="count" name="Frame Occurrences" radius={[4, 4, 0, 0]}>
                  {confidenceBuckets.map((entry, index) => (
                    <Cell key={`conf-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 dark:border-zinc-800 text-[10px] font-mono text-center">
            <div>
              <span className="text-neutral-400 block">High Conf (&gt;85%)</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">82.1%</span>
            </div>
            <div>
              <span className="text-neutral-400 block">Acceptable (70-84%)</span>
              <span className="font-black text-amber-600 dark:text-amber-400 text-xs">12.6%</span>
            </div>
            <div>
              <span className="text-neutral-400 block">Low / Noise (&lt;70%)</span>
              <span className="font-black text-rose-600 dark:text-rose-400 text-xs">5.3%</span>
            </div>
          </div>
        </div>

        {/* Engine Latency Benchmarks */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                Inference Latency & Throughput Benchmark
              </h3>
              <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
                Comparison of latency (milliseconds) and frames-per-second throughput across recognition architectures.
              </p>
            </div>
          </div>

          <div className="h-64 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyBenchmarks} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1e8" className="dark:stroke-zinc-800" />
                <XAxis type="number" stroke="#a1a1aa" fontSize={10} tickLine={false} unit="ms" />
                <YAxis dataKey="engine" type="category" stroke="#a1a1aa" fontSize={9} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #ebdcd1',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="avgLatencyMs" name="Avg Latency (ms)" radius={[0, 4, 4, 0]}>
                  {latencyBenchmarks.map((entry, index) => (
                    <Cell key={`latency-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-zinc-800 text-[10px] font-mono">
            <span className="text-neutral-500">Fastest Engine: MediaPipe Heuristics (14ms)</span>
            <span className="text-neutral-500">Highest Accuracy: Gemini 2.5 API (98.4%)</span>
          </div>
        </div>
      </div>

      {/* 3. CONFUSION MATRIX & MISCLASSIFICATION ANALYSIS */}
      <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Shuffle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                Confusion Matrix & Frequent Misclassifications
              </h3>
            </div>
            <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
              Empirical analysis of sign pairs with overlapping hand landmarks, with specific biomechanical corrective remedies.
            </p>
          </div>

          {onOpenCorrectionTool && (
            <button
              onClick={onOpenCorrectionTool}
              className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 self-start sm:self-auto"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Prediction Correction Tool</span>
            </button>
          )}
        </div>

        {/* Confusion pairs table / grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {confusionPairs.map((pair, idx) => (
            <div
              key={`${pair.intendedSign}-${pair.predictedSign}`}
              className="p-4 rounded-2xl bg-[#fcfdfa] dark:bg-zinc-900/40 border border-neutral-100 dark:border-zinc-800 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-[#7c8d7c] text-white">
                      {pair.intendedSign}
                    </span>
                    <ArrowRight className="w-3 h-3 text-neutral-400" />
                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-rose-500 text-white">
                      {pair.predictedSign}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                    {pair.errorRate}% error rate
                  </span>
                </div>

                <div className="mt-2.5 space-y-1.5 text-xs">
                  <p className="text-neutral-700 dark:text-zinc-300 font-sans text-[11px] leading-relaxed">
                    <strong className="font-semibold text-neutral-900 dark:text-white">Cause: </strong>
                    {pair.anatomicalReason}
                  </p>
                  <p className="text-neutral-500 dark:text-zinc-400 font-sans text-[10px] leading-relaxed bg-neutral-100/70 dark:bg-zinc-800/60 p-2 rounded-xl border border-neutral-200/40 dark:border-zinc-700/40">
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Fix: </strong>
                    {pair.remedyTip}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>{pair.frequency} occurrences</span>
                <span>{pair.signLanguage} Track</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PredictionStatisticsView;
