import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CompletionBadge, LeaderboardUser } from '../types';
import { getLeagueDefinition } from '../utils/leaderboardEngine';
import { 
  X, 
  Trophy, 
  Flame, 
  Target, 
  Swords, 
  Sparkles, 
  Award, 
  Calendar, 
  CheckCircle2, 
  UserPlus, 
  Heart, 
  ExternalLink 
} from 'lucide-react';

interface LeaderboardUserProfileModalProps {
  user: LeaderboardUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectBadge: (badge: CompletionBadge) => void;
  onNavigateTab?: (tab: string, payload?: any) => void;
}

export default function LeaderboardUserProfileModal({
  user,
  isOpen,
  onClose,
  onSelectBadge,
  onNavigateTab
}: LeaderboardUserProfileModalProps) {
  const [kudosSent, setKudosSent] = useState(false);

  if (!isOpen || !user) return null;

  const league = getLeagueDefinition(user.league);

  const handleSendKudos = () => {
    setKudosSent(true);
    setTimeout(() => setKudosSent(false), 3000);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-modal-name"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-[#fdfcf9] dark:bg-[#151518] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          id="leaderboard-user-modal-container"
        >
          {/* Header Banner with League Backdrop */}
          <div className={`p-6 bg-gradient-to-r ${league.bgGradient} border-b border-stone-200 dark:border-stone-800 relative`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 dark:bg-black/40 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
              aria-label="Close Profile Modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br ${user.avatarColor} text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white dark:border-[#151518]`}>
                  {user.initials}
                </div>
                <span className="absolute -bottom-1 -right-1 text-lg" title={user.signLanguage}>
                  {user.countryFlag}
                </span>
              </div>

              {/* Names & Titles */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/80 dark:bg-black/40 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-1">
                    <span>{league.icon}</span>
                    <span>{league.title}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    {user.signLanguage} Mode
                  </span>
                  {user.isCurrentUser && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-900 dark:bg-white text-white dark:text-stone-900">
                      YOU
                    </span>
                  )}
                </div>

                <h2 id="user-profile-modal-name" className="text-xl font-black text-stone-900 dark:text-white truncate">
                  {user.displayName}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                  @{user.username} • {user.levelTitle} (Lvl {user.level})
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Bio */}
            {user.bio && (
              <p className="text-xs text-stone-600 dark:text-stone-300 italic bg-stone-100/60 dark:bg-stone-900/60 p-3 rounded-2xl border border-stone-200/50 dark:border-stone-800/50">
                "{user.bio}"
              </p>
            )}

            {/* Core Score & Performance Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-white dark:bg-[#1c1c20] border border-stone-200 dark:border-stone-800 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                  <Flame className="w-4 h-4 fill-amber-500" />
                  <span className="text-xs font-bold uppercase text-stone-400">Streak</span>
                </div>
                <div className="text-lg font-black text-stone-900 dark:text-white">{user.streak}d</div>
                <div className="text-[10px] text-stone-400 font-medium">Daily consistency</div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#1c1c20] border border-stone-200 dark:border-stone-800 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase text-stone-400">Accuracy</span>
                </div>
                <div className="text-lg font-black text-stone-900 dark:text-white">{user.overallAccuracy}%</div>
                <div className="text-[10px] text-stone-400 font-medium">Camera tracking</div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#1c1c20] border border-stone-200 dark:border-stone-800 text-center">
                <div className="flex items-center justify-center gap-1 text-indigo-500 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase text-stone-400">Weekly XP</span>
                </div>
                <div className="text-lg font-black text-stone-900 dark:text-white">{user.weeklyScore.toLocaleString()}</div>
                <div className="text-[10px] text-stone-400 font-medium">{user.weeklySignsCount} signs/wk</div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#1c1c20] border border-stone-200 dark:border-stone-800 text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                  <Trophy className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase text-stone-400">All-Time</span>
                </div>
                <div className="text-lg font-black text-stone-900 dark:text-white">{user.allTimeScore.toLocaleString()}</div>
                <div className="text-[10px] text-stone-400 font-medium">Total points</div>
              </div>
            </div>

            {/* Daily Performance Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-emerald-900 dark:text-emerald-300">
                  Today's Daily Activity
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  +{user.dailyScore} XP earned today • {user.dailySignsCount} gestures practiced
                </div>
              </div>
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-xl bg-white dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700">
                Active {user.lastActive}
              </div>
            </div>

            {/* Achievement Badges Showcase */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Unlocked Badges ({user.unlockedBadges.length})</span>
                </div>
                <span className="text-[11px] text-stone-400">Click to inspect criteria</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {user.unlockedBadges.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onSelectBadge(b)}
                    className="p-2.5 rounded-2xl bg-white dark:bg-[#1c1c20] border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500 hover:scale-[1.02] transition-all text-left flex items-start gap-2.5 group cursor-pointer shadow-xs"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform shrink-0">
                      {b.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                        {b.title}
                      </div>
                      <div className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                        {b.tier} • +{b.xpValue} XP
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 bg-stone-50 dark:bg-[#101012] border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
            <button
              onClick={handleSendKudos}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                kudosSent 
                  ? 'bg-rose-500 text-white' 
                  : 'bg-white dark:bg-[#1c1c20] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${kudosSent ? 'fill-white animate-bounce' : 'text-rose-500'}`} />
              <span>{kudosSent ? 'Kudos Sent! 👏' : 'Send High-Five'}</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('multiplayer');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Swords className="w-4 h-4" />
                <span>Challenge in Arena</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
