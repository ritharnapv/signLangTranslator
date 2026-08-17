import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  XCircle,
  Share2,
  Copy,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Shield,
  Target
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { MultiplayerMatchState, MultiplayerRoundResult } from '../types';

interface MultiplayerMatchSummaryModalProps {
  matchState: MultiplayerMatchState;
  isOpen: boolean;
  onClose: () => void;
  onRematch: () => void;
  onNewGame: () => void;
}

export default function MultiplayerMatchSummaryModal({
  matchState,
  isOpen,
  onClose,
  onRematch,
  onNewGame
}: MultiplayerMatchSummaryModalProps) {
  if (!isOpen) return null;

  const { p1, p2, roundHistory, totalRounds, gameMode, difficulty, signLanguage } = matchState;

  const isP1Winner = p1.roundWins > p2.roundWins;
  const isTie = p1.roundWins === p2.roundWins;
  const winner = isP1Winner ? p1 : p2;

  // Compute Match Summary Analytics
  const p1AvgAccuracy = roundHistory.length > 0
    ? roundHistory.reduce((acc, r) => acc + r.p1Accuracy, 0) / roundHistory.length
    : p1.currentAccuracy;

  const p2AvgAccuracy = roundHistory.length > 0
    ? roundHistory.reduce((acc, r) => acc + r.p2Accuracy, 0) / roundHistory.length
    : p2.currentAccuracy;

  const p1AvgReaction = roundHistory.length > 0
    ? roundHistory.reduce((acc, r) => acc + r.p1TimeMs, 0) / roundHistory.length
    : p1.bestReactionMs;

  const p2AvgReaction = roundHistory.length > 0
    ? roundHistory.reduce((acc, r) => acc + r.p2TimeMs, 0) / roundHistory.length
    : p2.bestReactionMs;

  // Chart data for Recharts
  const chartData = roundHistory.map((round) => ({
    name: `Round ${round.roundNumber} (${round.targetSign})`,
    p1Acc: round.p1Accuracy,
    p2Acc: round.p2Accuracy
  }));

  // Match XP & ELO reward simulation
  const earnedXp = isP1Winner ? 250 : isTie ? 100 : 50;
  const eloDelta = isP1Winner ? '+32' : isTie ? '+5' : '-12';

  const [copied, setCopied] = React.useState(false);

  const handleShareMatch = () => {
    const summaryText = `🏆 SignSense Multiplayer Duel Recap\n${p1.name} (${p1.roundWins} Wins, ${p1AvgAccuracy.toFixed(1)}% Acc) vs ${p2.name} (${p2.roundWins} Wins, ${p2AvgAccuracy.toFixed(1)}% Acc)\nMode: ${gameMode} • Language: ${signLanguage}\nPlay on Sign AI Pro!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6"
      >
        {/* Header Ribbon */}
        <div className={`p-6 text-center relative overflow-hidden ${
          isTie
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
            : isP1Winner
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white'
            : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white'
        }`}>
          {/* Decorative Sparkles & Rings */}
          <div className="absolute top-2 left-4 opacity-20 pointer-events-none">
            <Sparkles className="w-16 h-16" />
          </div>
          <div className="absolute bottom-2 right-4 opacity-20 pointer-events-none">
            <Trophy className="w-20 h-20" />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl mx-auto mb-3 shadow-lg">
              {isTie ? '🤝' : winner.avatar}
            </div>

            <h2 className="text-2xl font-black tracking-tight">
              {isTie ? 'Honorable Stalemate!' : `${winner.name} Claims Victory!`}
            </h2>
            <p className="text-xs text-white/80 font-medium mt-1">
              {signLanguage} Arena • {gameMode.replace('_', ' ').toUpperCase()} • {difficulty.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Podium / Head to Head Comparison */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Player 1 Recap */}
            <div className={`p-4 rounded-2xl border ${
              isP1Winner
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 shadow-sm'
                : 'bg-slate-50 dark:bg-[#202024] border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p1.avatar}</span>
                  <div>
                    <div className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1">
                      <span>{p1.name}</span>
                      {isP1Winner && <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Challenger 1</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{p1.roundWins}</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Wins</div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Average Accuracy:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{p1AvgAccuracy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Avg Reaction Time:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{(p1AvgReaction / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Total Match XP:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">+{earnedXp} XP</span>
                </div>
              </div>
            </div>

            {/* Player 2 Recap */}
            <div className={`p-4 rounded-2xl border ${
              !isP1Winner && !isTie
                ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-300 dark:border-purple-700 shadow-sm'
                : 'bg-slate-50 dark:bg-[#202024] border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p2.avatar}</span>
                  <div>
                    <div className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1">
                      <span>{p2.name}</span>
                      {!isP1Winner && !isTie && <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {p2.isAi ? 'AI Sparring Bot' : 'Rival 2'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{p2.roundWins}</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Wins</div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Average Accuracy:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{p2AvgAccuracy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Avg Reaction Time:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{(p2AvgReaction / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Final Match Score:</span>
                  <span className="font-black text-slate-900 dark:text-white">{p2.currentScore.toLocaleString()} pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Round-by-Round Accuracy Comparison Chart */}
          {chartData.length > 0 && (
            <div className="bg-slate-50 dark:bg-[#202024] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-black text-slate-800 dark:text-white mb-2 flex items-center justify-between">
                <span>Round-by-Round Accuracy Comparison</span>
                <span className="text-[10px] text-slate-500 font-normal">Threshold Target: 85%</span>
              </div>
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#ffffff'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Bar dataKey="p1Acc" name={`${p1.name} (%)`} fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="p2Acc" name={`${p2.name} (%)`} fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Rating ELO & XP Summary Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                ⚡
              </div>
              <div>
                <div className="text-xs font-black text-amber-900 dark:text-amber-300">
                  Arena ELO Rating Update
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400">
                  New Rating: <span className="font-bold">1,882 ELO</span> ({eloDelta} rating shift)
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black px-2.5 py-1 bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-xl border border-amber-300 dark:border-amber-700">
                +{earnedXp} Mastery XP
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 bg-slate-50 dark:bg-[#202024] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleShareMatch}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-98 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Recap Copied!' : 'Share Match Recap'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewGame}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-98 text-xs font-bold text-slate-800 dark:text-white transition-all cursor-pointer"
            >
              Lobby
            </button>
            <button
              onClick={onRematch}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-98 text-xs font-black text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Instant Rematch</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
