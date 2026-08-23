import React from 'react';
import { 
  BarChart2, 
  Download, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Filter, 
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Award
} from 'lucide-react';
import { AnalyticsTimeframe, AnalyticsSignLanguageFilter } from '../../utils/analyticsEngine';

interface AnalyticsHeaderProps {
  timeframe: AnalyticsTimeframe;
  setTimeframe: (tf: AnalyticsTimeframe) => void;
  signLanguageFilter: AnalyticsSignLanguageFilter;
  setSignLanguageFilter: (sl: AnalyticsSignLanguageFilter) => void;
  useSimulatedData: boolean;
  setUseSimulatedData: (val: boolean) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onOpenExecutiveSummary: () => void;
  onClearHistory: () => void;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  timeframe,
  setTimeframe,
  signLanguageFilter,
  setSignLanguageFilter,
  useSimulatedData,
  setUseSimulatedData,
  onExportJSON,
  onExportCSV,
  onOpenExecutiveSummary,
  onClearHistory
}) => {
  return (
    <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4" id="analytics-header-card">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#7c8d7c]/15 dark:bg-[#7c8d7c]/25 flex items-center justify-center text-[#5a6b5a] dark:text-[#9cd39c]">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#2d2d28] dark:text-[#f4f4f5] tracking-tight">
                Advanced Analytics Suite
              </h2>
              <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa]">
                Accuracy trends, curriculum mastery progression, neural model inference statistics, and interactive telemetry charts.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Executive Summary Button */}
          <button
            onClick={onOpenExecutiveSummary}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-950 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all cursor-pointer shadow-xs active:scale-95"
            id="btn-executive-summary"
            title="Generate Executive Diagnostic Report"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Executive Brief</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all cursor-pointer shadow-xs active:scale-95"
            id="btn-export-csv"
            title="Export full telemetry to CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={onExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#5c3c35] dark:text-[#ebdcd1] bg-[#fcf9f6] dark:bg-[#2b2520] border border-[#ebdcd1] dark:border-[#523d32] rounded-xl hover:bg-[#ebdcd1]/30 transition-all cursor-pointer shadow-xs active:scale-95"
            id="btn-export-json"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          {/* Clear Data */}
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/55 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/45 transition-all cursor-pointer shadow-xs active:scale-95"
            id="btn-clear-analytics"
            title="Reset telemetry logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Control Bar: Timeframe & Filters & Simulated Switch */}
      <div className="pt-3 border-t border-[#ecece0] dark:border-[#2d2d32] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1.5 bg-[#f6f7f2] dark:bg-[#161619] p-1 rounded-2xl border border-[#ecece0] dark:border-[#2d2d32]">
          <Calendar className="w-3.5 h-3.5 text-neutral-400 ml-1.5" />
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 mr-1">Timeframe:</span>
          {(['7d', '14d', '30d', '90d', 'all'] as AnalyticsTimeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-white dark:bg-zinc-800 text-[#5a6b5a] dark:text-[#9cd39c] shadow-xs border border-[#e0e4db] dark:border-zinc-700'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-200'
              }`}
            >
              {tf === 'all' ? 'All Time' : tf.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Sign Language Filter & Demo Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sign Language filter */}
          <div className="flex items-center gap-1.5 bg-[#f6f7f2] dark:bg-[#161619] p-1 rounded-2xl border border-[#ecece0] dark:border-[#2d2d32]">
            <Filter className="w-3.5 h-3.5 text-neutral-400 ml-1.5" />
            {(['ALL', 'ASL', 'ISL'] as AnalyticsSignLanguageFilter[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setSignLanguageFilter(lang)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  signLanguageFilter === lang
                    ? 'bg-[#7c8d7c] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-200'
                }`}
              >
                {lang === 'ALL' ? 'All Languages' : lang}
              </button>
            ))}
          </div>

          {/* Simulated / Rich Telemetry Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-[#f6f7f2] dark:bg-[#161619] px-3 py-1.5 rounded-2xl border border-[#ecece0] dark:border-[#2d2d32] select-none">
            <input
              type="checkbox"
              checked={useSimulatedData}
              onChange={(e) => setUseSimulatedData(e.target.checked)}
              className="rounded text-[#7c8d7c] focus:ring-[#7c8d7c] cursor-pointer"
            />
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Full Historical Telemetry</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsHeader;
