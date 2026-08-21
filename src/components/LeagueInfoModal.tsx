import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LEAGUE_DEFINITIONS } from '../data/leaderboardData';
import { 
  X, 
  Trophy, 
  ShieldCheck, 
  ArrowUpRight, 
  Sparkles, 
  Flame, 
  Award, 
  Zap, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

interface LeagueInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeagueInfoModal({ isOpen, onClose }: LeagueInfoModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="league-info-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-[#fdfcf9] dark:bg-[#151518] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          id="league-info-modal-container"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-amber-900/20 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 id="league-info-title" className="text-xl font-black text-stone-900 dark:text-white">
                  Competitive Leagues & Scoring Guide
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  How daily scores, weekly promotions, and achievement badges power your ranking
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/80 dark:bg-black/40 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
              aria-label="Close League Info"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* 3 Pillars of Ranking */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c20] border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black">
                  <Clock className="w-4 h-4" />
                  <span className="uppercase tracking-wider text-[11px]">1. Daily Score</span>
                </div>
                <p className="text-stone-600 dark:text-stone-300">
                  Calculated from lessons, quizzes, and live AI Coach camera evaluations completed during the current 24-hour cycle. Resets nightly at 00:00 UTC.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c20] border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black">
                  <Sparkles className="w-4 h-4" />
                  <span className="uppercase tracking-wider text-[11px]">2. Weekly League</span>
                </div>
                <p className="text-stone-600 dark:text-stone-300">
                  Total XP gathered in the ongoing 7-day tournament. Top 5 signers in each division earn automatic league promotion and bonus XP rewards every Sunday.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c20] border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black">
                  <Award className="w-4 h-4" />
                  <span className="uppercase tracking-wider text-[11px]">3. Achievement Badges</span>
                </div>
                <p className="text-stone-600 dark:text-stone-300">
                  Milestone feats unlock permanent badge cosmetics and inject large XP bursts (+50 to +1,200 XP) directly into your All-Time & Weekly standings.
                </p>
              </div>
            </div>

            {/* League Tier Progression Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>The 6 Competitive League Tiers</span>
              </h3>

              <div className="space-y-2.5">
                {LEAGUE_DEFINITIONS.map((tier) => (
                  <div
                    key={tier.id}
                    className={`p-3.5 rounded-2xl bg-gradient-to-r ${tier.bgGradient} border ${tier.badgeBorder} flex items-center justify-between gap-4`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl shrink-0">{tier.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm ${tier.color}`}>
                            {tier.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 dark:bg-black/40 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                            {tier.minXp.toLocaleString()}+ Min XP
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 line-clamp-1">
                          {tier.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block">
                        Weekly Reward
                      </span>
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {tier.rewards.split('•')[0]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-stone-50 dark:bg-[#101012] border-t border-stone-200 dark:border-stone-800 flex justify-end">
            <button
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-black hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              Got It
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
