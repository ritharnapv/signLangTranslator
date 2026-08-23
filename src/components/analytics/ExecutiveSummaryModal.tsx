import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  Activity,
  Layers
} from 'lucide-react';
import { ExecutiveSummaryInsights, BiomechanicalAxisScore } from '../../utils/analyticsEngine';

interface ExecutiveSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  insights: ExecutiveSummaryInsights;
  biomechanicalSkills: BiomechanicalAxisScore[];
  totalPracticeMinutes: number;
  totalMasteredSigns: number;
  overallAccuracy: number;
}

export const ExecutiveSummaryModal: React.FC<ExecutiveSummaryModalProps> = ({
  isOpen,
  onClose,
  insights,
  biomechanicalSkills,
  totalPracticeMinutes,
  totalMasteredSigns,
  overallAccuracy
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1c1c1f] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#ecece0] dark:border-[#2d2d32] flex items-center justify-between bg-[#fcfdfa] dark:bg-[#18181a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2d2d28] dark:text-[#f4f4f5]">
                Executive Diagnostic Brief & Sign Fluency Audit
              </h3>
              <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa]">
                Generated on {currentDate} • Verified Biomechanical Assessment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-xs font-bold text-neutral-800 dark:text-zinc-200 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Report Document */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#2d2d28] dark:text-[#f4f4f5]">
          {/* Top Score Banner */}
          <div className="bg-linear-to-br from-[#7c8d7c]/15 to-emerald-500/10 border border-[#7c8d7c]/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#5a6b5a] dark:text-[#9cd39c]">
                Sign Fluency Index
              </span>
              <h4 className="text-2xl font-black">
                {insights.overallHealthScore}% Optimal Calibration
              </h4>
              <p className="text-xs text-neutral-600 dark:text-zinc-300">
                {insights.fluencyVelocity}
              </p>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs border-t sm:border-t-0 sm:border-l border-[#7c8d7c]/20 pt-3 sm:pt-0 sm:pl-6">
              <div>
                <span className="text-neutral-400 block text-[10px]">Mastered Signs</span>
                <span className="text-lg font-black text-[#2d2d28] dark:text-[#f4f4f5]">{totalMasteredSigns} Signs</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">Practice Investment</span>
                <span className="text-lg font-black text-[#2d2d28] dark:text-[#f4f4f5]">{totalPracticeMinutes} mins</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">Est. C2 Mastery</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">~{insights.predictedDaysToMastery} days</span>
              </div>
            </div>
          </div>

          {/* Core Findings & AI Coaching Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Strength */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Primary Technical Strength</span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed font-sans">
                {insights.primaryStrength}
              </p>
            </div>

            {/* Growth Area */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Recommended Focus Area</span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed font-sans">
                {insights.topGrowthArea}
              </p>
            </div>
          </div>

          {/* AI Coaching Takeaway */}
          <div className="p-4 rounded-2xl bg-[#f8f9f4] dark:bg-zinc-900/50 border border-[#ecece0] dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-[#5a6b5a] dark:text-[#9cd39c] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Coaching Recommendation</span>
            </div>
            <p className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
              {insights.aiCoachingTip}
            </p>
          </div>

          {/* 6-Axis Biomechanical Audit Table */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase font-mono tracking-wider text-neutral-500">
              Biomechanical Landmark Precision Breakdown
            </h5>
            <div className="divide-y divide-neutral-100 dark:divide-zinc-800 border border-neutral-100 dark:border-zinc-800 rounded-2xl overflow-hidden font-mono text-xs">
              {biomechanicalSkills.map(skill => (
                <div key={skill.axis} className="p-3 bg-[#fdfcf9] dark:bg-zinc-900/40 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-sans font-bold text-neutral-800 dark:text-zinc-200 block">{skill.axis}</span>
                    <span className="text-[10px] text-neutral-400 font-sans">{skill.description}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      skill.status === 'Mastered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' :
                      skill.status === 'Optimal' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                    }`}>
                      {skill.status}
                    </span>
                    <span className="font-black text-sm text-[#2d2d28] dark:text-[#f4f4f5] w-12 text-right">
                      {skill.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#ecece0] dark:border-[#2d2d32] bg-[#fcfdfa] dark:bg-[#18181a] flex items-center justify-between text-xs text-neutral-400">
          <span className="font-mono text-[10px]">
            SignSense Machine Learning Telemetry • v3.8.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#7c8d7c] hover:bg-[#6b7c6b] text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummaryModal;
