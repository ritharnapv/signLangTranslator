import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Activity, 
  Sparkles, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Sliders
} from 'lucide-react';
import { 
  AccuracyTrendPoint, 
  SignComparativeTrendPoint, 
  BiomechanicalAxisScore, 
  HourlyPracticeDistribution, 
  DayOfWeekDistribution 
} from '../../utils/analyticsEngine';

interface AccuracyTrendsViewProps {
  accuracyTrends: AccuracyTrendPoint[];
  comparativeTrends: SignComparativeTrendPoint[];
  biomechanicalSkills: BiomechanicalAxisScore[];
  hourlyDistribution: HourlyPracticeDistribution[];
  dayOfWeekDistribution: DayOfWeekDistribution[];
  topCalibratedSigns: Array<{ name: string; accuracy: number }>;
  needsPracticeSigns: Array<{ name: string; accuracy: number }>;
}

const COMPARATIVE_SIGNS = [
  { id: 'A', label: 'Sign A (ASL)', color: '#7c8d7c' },
  { id: 'B', label: 'Sign B (ASL)', color: '#3b82f6' },
  { id: 'C', label: 'Sign C (ASL)', color: '#8b5cf6' },
  { id: 'HELLO', label: 'Hello (ASL)', color: '#0d9488' },
  { id: 'THANK YOU', label: 'Thank You (ASL)', color: '#e0a96d' },
  { id: 'NAMASTE', label: 'Namaste (ISL)', color: '#f59e0b' }
];

export const AccuracyTrendsView: React.FC<AccuracyTrendsViewProps> = ({
  accuracyTrends,
  comparativeTrends,
  biomechanicalSkills,
  hourlyDistribution,
  dayOfWeekDistribution,
  topCalibratedSigns,
  needsPracticeSigns
}) => {
  const [selectedSigns, setSelectedSigns] = useState<string[]>(['A', 'B', 'NAMASTE']);
  const [chartViewMode, setChartViewMode] = useState<'area' | 'envelope'>('area');

  const toggleSign = (signId: string) => {
    setSelectedSigns(prev => 
      prev.includes(signId)
        ? (prev.length > 1 ? prev.filter(s => s !== signId) : prev)
        : [...prev, signId]
    );
  };

  const currentAverage = accuracyTrends.length > 0
    ? accuracyTrends[accuracyTrends.length - 1].avgAccuracy
    : 89.2;
  const startAverage = accuracyTrends.length > 0
    ? accuracyTrends[0].avgAccuracy
    : 72.0;
  const overallImprovement = Number((currentAverage - startAverage).toFixed(1));

  return (
    <div className="space-y-6" id="accuracy-trends-subview">
      {/* 1. PRIMARY ACCURACY TRAJECTORY HERO CARD */}
      <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                Overall Landmark & Subtitle Accuracy Trajectory
              </h3>
            </div>
            <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
              Continuous time-series tracking of prediction match precision with 5-period moving average and 85% mastery threshold.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#f6f7f2] dark:bg-[#161619] p-1 rounded-xl border border-[#ecece0] dark:border-[#2d2d32] text-xs">
              <button
                onClick={() => setChartViewMode('area')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  chartViewMode === 'area'
                    ? 'bg-white dark:bg-zinc-800 text-[#5a6b5a] dark:text-[#9cd39c] shadow-xs'
                    : 'text-neutral-500'
                }`}
              >
                Standard Area
              </button>
              <button
                onClick={() => setChartViewMode('envelope')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  chartViewMode === 'envelope'
                    ? 'bg-white dark:bg-zinc-800 text-[#5a6b5a] dark:text-[#9cd39c] shadow-xs'
                    : 'text-neutral-500'
                }`}
              >
                Range Envelope
              </button>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="w-4 h-4" />
              <span>{overallImprovement >= 0 ? `+${overallImprovement}%` : `${overallImprovement}%`} Gain</span>
            </div>
          </div>
        </div>

        {/* The Recharts Area/Line Graph */}
        <div className="h-80 w-full font-mono text-xs pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={accuracyTrends} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c8d7c" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#7c8d7c" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="envelopeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1e8" className="dark:stroke-zinc-800" />
              <XAxis dataKey="displayDate" stroke="#a1a1aa" fontSize={10} tickLine={false} />
              <YAxis domain={[40, 100]} stroke="#a1a1aa" fontSize={10} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.96)',
                  border: '1px solid #ebdcd1',
                  borderRadius: '12px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              
              {/* Mastery Target Line */}
              <ReferenceLine y={85} stroke="#e0a96d" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '85% Mastery Goal', fill: '#e0a96d', fontSize: 10, position: 'insideTopRight' }} />

              {chartViewMode === 'envelope' && (
                <>
                  <Area type="monotone" dataKey="maxAccuracy" stroke="transparent" fill="#3b82f6" fillOpacity={0.15} name="Max Accuracy Range" />
                  <Area type="monotone" dataKey="minAccuracy" stroke="transparent" fill="transparent" name="Min Accuracy Range" />
                </>
              )}

              <Area
                type="monotone"
                dataKey="avgAccuracy"
                name="Daily Average Accuracy"
                stroke="#7c8d7c"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#accuracyGradient)"
                activeDot={{ r: 6, fill: '#5a6b5a', stroke: '#ffffff', strokeWidth: 2 }}
              />

              <Line
                type="monotone"
                dataKey="rollingAverage"
                name="5-Day Rolling Trendline"
                stroke="#5c3c35"
                strokeWidth={2}
                dot={false}
                strokeDasharray="3 3"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. SIGN-BY-SIGN COMPARATIVE TRAJECTORY & RADAR SKILLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sign-by-Sign Comparative Trajectory */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                Sign-by-Sign Improvement Comparison
              </h3>
              <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
                Toggle signs to analyze how quickly specific hand postures converge to mastery.
              </p>
            </div>
          </div>

          {/* Toggleable Sign Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMPARATIVE_SIGNS.map(sign => {
              const active = selectedSigns.includes(sign.id);
              return (
                <button
                  key={sign.id}
                  onClick={() => toggleSign(sign.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'text-white shadow-xs'
                      : 'bg-[#f6f7f2] dark:bg-zinc-800/80 text-neutral-600 dark:text-zinc-400 hover:bg-neutral-200 dark:hover:bg-zinc-700'
                  }`}
                  style={{ backgroundColor: active ? sign.color : undefined }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? '#ffffff' : sign.color }} />
                  <span>{sign.label}</span>
                </button>
              );
            })}
          </div>

          <div className="h-64 w-full font-mono text-xs pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparativeTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1e8" className="dark:stroke-zinc-800" />
                <XAxis dataKey="displayDate" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                <YAxis domain={[50, 100]} stroke="#a1a1aa" fontSize={10} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #ebdcd1',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                {COMPARATIVE_SIGNS.filter(s => selectedSigns.includes(s.id)).map(s => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.id}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2.2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6-Axis Biomechanical Skills Radar */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                Biomechanical Skills Radar
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#7c8d7c]/15 text-[#5a6b5a] dark:text-[#9cd39c]">
                6-AXIS TELEMETRY
              </span>
            </div>
            <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
              Holistic assessment of skeletal landmark stability, articulation, rotation, and speed.
            </p>
          </div>

          <div className="h-60 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={biomechanicalSkills} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                <PolarGrid stroke="#e5e7eb" className="dark:stroke-zinc-800" />
                <PolarAngleAxis dataKey="axis" stroke="#71717a" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#a1a1aa" fontSize={8} />
                <Radar
                  name="Mastery Score"
                  dataKey="score"
                  stroke="#7c8d7c"
                  fill="#7c8d7c"
                  fillOpacity={0.45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #ebdcd1',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Axis Summary Pills */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100 dark:border-zinc-800 text-[10px] font-mono">
            {biomechanicalSkills.slice(0, 4).map(skill => (
              <div key={skill.axis} className="flex items-center justify-between bg-[#fdfcf9] dark:bg-zinc-900/40 p-1.5 rounded-lg border border-neutral-100 dark:border-zinc-800">
                <span className="text-neutral-600 dark:text-zinc-400 font-sans truncate">{skill.axis}</span>
                <span className="font-black text-[#5a6b5a] dark:text-[#9cd39c]">{skill.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. DIURNAL & WEEKLY PRACTICE TIMING DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Distribution Bar Chart */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                Hourly Peak Accuracy Distribution
              </h3>
              <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
                Comparison of practice volume and accuracy by hour of day (identifies optimal learning windows).
              </p>
            </div>
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>

          <div className="h-56 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1e8" className="dark:stroke-zinc-800" />
                <XAxis dataKey="hour" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                <YAxis domain={[70, 100]} stroke="#a1a1aa" fontSize={10} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #ebdcd1',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="avgAccuracy" name="Avg Accuracy %" fill="#7c8d7c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of Week Distribution */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
                Weekly Rhythm & Daily Consistency
              </h3>
              <p className="text-[10px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
                Average accuracy across weekdays vs weekend intensive practice sessions.
              </p>
            </div>
            <Calendar className="w-4 h-4 text-neutral-400" />
          </div>

          <div className="h-56 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1e8" className="dark:stroke-zinc-800" />
                <XAxis dataKey="day" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                <YAxis domain={[70, 100]} stroke="#a1a1aa" fontSize={10} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #ebdcd1',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="avgAccuracy" name="Avg Accuracy %" fill="#5c3c35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. TOP CALIBRATED VS NEEDS ROTATIONAL PRACTICE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Calibrated */}
        <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
              Top 5 Calibrated Signs (Mastery Grade)
            </h4>
          </div>
          <div className="space-y-2">
            {topCalibratedSigns.map(sign => (
              <div key={sign.name} className="flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-xs font-bold font-mono text-neutral-800 dark:text-zinc-200">
                  Sign '{sign.name}'
                </span>
                <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-400">
                  {sign.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Rotational Practice */}
        <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
            <h4 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] uppercase tracking-wider">
              Needs Rotational / Thumb Practice
            </h4>
          </div>
          <div className="space-y-2">
            {needsPracticeSigns.map(sign => (
              <div key={sign.name} className="flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30">
                <span className="text-xs font-bold font-mono text-neutral-800 dark:text-zinc-200">
                  Sign '{sign.name}'
                </span>
                <span className="text-xs font-black font-mono text-amber-700 dark:text-amber-400">
                  {sign.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccuracyTrendsView;
