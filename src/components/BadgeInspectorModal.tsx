import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CompletionBadge, LeagueTier } from '../types';
import { 
  X, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Calendar, 
  Share2, 
  Star, 
  Zap, 
  Flame, 
  Target, 
  BookOpen, 
  Check 
} from 'lucide-react';

interface BadgeInspectorModalProps {
  badge: CompletionBadge | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string, payload?: any) => void;
  onEquipFeaturedBadge?: (badge: CompletionBadge) => void;
  isEquippedAsFeatured?: boolean;
}

export default function BadgeInspectorModal({
  badge,
  isOpen,
  onClose,
  onNavigateTab,
  onEquipFeaturedBadge,
  isEquippedAsFeatured = false
}: BadgeInspectorModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !badge) return null;

  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'diamond':
        return {
          border: 'border-cyan-400 dark:border-cyan-500',
          bg: 'bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-900/30',
          text: 'text-cyan-600 dark:text-cyan-400',
          pill: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
          glow: 'shadow-[0_0_25px_rgba(6,182,212,0.35)]'
        };
      case 'gold':
        return {
          border: 'border-yellow-400 dark:border-yellow-500',
          bg: 'bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-900/30',
          text: 'text-amber-600 dark:text-amber-400',
          pill: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          glow: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]'
        };
      case 'silver':
        return {
          border: 'border-slate-300 dark:border-slate-500',
          bg: 'bg-gradient-to-br from-slate-400/20 via-zinc-500/10 to-stone-900/30',
          text: 'text-slate-600 dark:text-slate-300',
          pill: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600',
          glow: 'shadow-[0_0_20px_rgba(148,163,184,0.25)]'
        };
      default:
        return {
          border: 'border-amber-700/50 dark:border-amber-700',
          bg: 'bg-gradient-to-br from-amber-700/20 via-orange-900/10 to-stone-900/30',
          text: 'text-amber-800 dark:text-amber-500',
          pill: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          glow: 'shadow-[0_0_15px_rgba(180,83,9,0.2)]'
        };
    }
  };

  const tierStyle = getTierStyles(badge.tier);
  const progressPercent = Math.min(100, Math.round((badge.currentProgress / (badge.maxProgress || 1)) * 100));

  const handleShare = () => {
    const text = `🏆 I ${badge.unlocked ? 'unlocked' : 'am working on'} the "${badge.title}" badge on SignSense AI! ${badge.flavorText || badge.description}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-inspector-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-md bg-[#fdfcf9] dark:bg-[#151518] rounded-3xl border ${tierStyle.border} shadow-2xl overflow-hidden relative ${tierStyle.glow}`}
          id="badge-inspector-modal-container"
        >
          {/* Header Banner */}
          <div className={`p-6 ${tierStyle.bg} border-b border-[#e8ece3] dark:border-[#27272a] relative`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 dark:bg-black/40 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
              aria-label="Close Badge Inspector"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Badge Icon Emblem */}
              <div className="relative mb-3">
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl bg-white dark:bg-[#1e1e24] border-2 ${tierStyle.border} shadow-lg relative z-10 transition-transform hover:scale-110`}>
                  {badge.icon}
                </div>
                {badge.unlocked && (
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-[#151518] z-20 shadow-sm">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
                {!badge.unlocked && (
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-stone-700 text-stone-200 flex items-center justify-center ring-2 ring-white dark:ring-[#151518] z-20 shadow-sm">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Title and Category */}
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${tierStyle.pill}`}>
                  {badge.tier}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  {badge.category}
                </span>
              </div>

              <h2 id="badge-inspector-title" className="text-xl font-black text-stone-900 dark:text-white">
                {badge.title}
              </h2>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            {/* Description & Lore */}
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 leading-relaxed">
                {badge.description}
              </p>
              {badge.flavorText && (
                <p className="text-xs italic text-stone-500 dark:text-stone-400 bg-stone-100/70 dark:bg-stone-900/60 p-2.5 rounded-xl border border-stone-200/50 dark:border-stone-800/50">
                  "{badge.flavorText}"
                </p>
              )}
            </div>

            {/* Unlock Requirement Card */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1c1c20] border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">Requirement</span>
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+{badge.xpValue} XP</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{badge.requirement}</span>
              </div>

              {/* Progress Bar */}
              <div className="pt-1.5 space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-stone-500 dark:text-stone-400">Completion</span>
                  <span className={badge.unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'}>
                    {badge.currentProgress} / {badge.maxProgress} ({progressPercent}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      badge.unlocked 
                        ? 'bg-emerald-500' 
                        : badge.tier === 'diamond' 
                        ? 'bg-cyan-500' 
                        : badge.tier === 'gold' 
                        ? 'bg-amber-500' 
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Unlocked Date / Lock Status Footer */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
              {badge.unlocked ? (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Unlocked on {badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString() : 'Active Journey'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-stone-400 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>In progress • Keep signing daily to unlock</span>
                </div>
              )}

              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-[11px] font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              {badge.unlocked && onEquipFeaturedBadge && (
                <button
                  onClick={() => {
                    onEquipFeaturedBadge(badge);
                    onClose();
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isEquippedAsFeatured
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:scale-[1.01] active:scale-[0.99] shadow-sm'
                  }`}
                  id="equip-badge-btn"
                >
                  <Award className="w-4 h-4" />
                  <span>{isEquippedAsFeatured ? 'Equipped as Featured Badge' : 'Showcase Badge on My Profile'}</span>
                </button>
              )}

              {!badge.unlocked && onNavigateTab && (
                <button
                  onClick={() => {
                    onClose();
                    if (badge.category === 'streak' || badge.category === 'curriculum') {
                      onNavigateTab('learning_dashboard');
                    } else if (badge.category === 'accuracy') {
                      onNavigateTab('evaluator');
                    } else {
                      onNavigateTab('practice_recommendations');
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  id="practice-unlock-badge-btn"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Practice to Unlock (+{badge.xpValue} XP)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
