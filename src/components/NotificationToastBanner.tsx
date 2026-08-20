import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Trophy,
  Cpu,
  Flame,
  Target,
  X,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  ExternalLink
} from 'lucide-react';
import { AppNotification } from '../types';
import { markNotificationAsRead, getNotificationPreferences, saveNotificationPreferences } from '../utils/notificationEngine';

interface NotificationToastBannerProps {
  onNavigateTab?: (tab: string, payload?: any) => void;
  onOpenNotificationCenter?: () => void;
}

export default function NotificationToastBanner({
  onNavigateTab,
  onOpenNotificationCenter
}: NotificationToastBannerProps) {
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => getNotificationPreferences().soundEnabled);

  useEffect(() => {
    const handleToastEvent = (e: CustomEvent<AppNotification>) => {
      const newNotif = e.detail;
      if (!newNotif) return;

      setActiveToasts(prev => {
        // Avoid duplicate toasts
        const filtered = prev.filter(t => t.id !== newNotif.id);
        return [newNotif, ...filtered].slice(0, 3); // Max 3 simultaneous toasts
      });

      // Auto dismiss after 6.5 seconds
      setTimeout(() => {
        setActiveToasts(prev => prev.filter(t => t.id !== newNotif.id));
      }, 6500);
    };

    window.addEventListener('sign_ai_toast_notification' as any, handleToastEvent);
    return () => {
      window.removeEventListener('sign_ai_toast_notification' as any, handleToastEvent);
    };
  }, []);

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAction = (toast: AppNotification) => {
    markNotificationAsRead(toast.id);
    handleDismiss(toast.id);
    if (toast.actionTab && onNavigateTab) {
      onNavigateTab(toast.actionTab, toast.actionPayload);
    } else if (onOpenNotificationCenter) {
      onOpenNotificationCenter();
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    saveNotificationPreferences({ soundEnabled: next });
  };

  if (activeToasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications Alerts"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] pointer-events-none"
      id="notification-toast-container"
    >
      <AnimatePresence>
        {activeToasts.map((toast) => {
          const isAchievement = toast.type === 'achievement';
          const isModelUpdate = toast.type === 'model_update';
          const isPractice = toast.type === 'practice_reminder' || toast.type === 'streak_alert';

          const getBorderAndBg = () => {
            if (isAchievement) {
              return 'bg-gradient-to-r from-amber-950/95 via-stone-900/95 to-amber-950/90 border-amber-500/50 text-amber-100 shadow-amber-500/20';
            }
            if (isModelUpdate) {
              return 'bg-gradient-to-r from-cyan-950/95 via-stone-900/95 to-blue-950/90 border-cyan-500/50 text-cyan-100 shadow-cyan-500/20';
            }
            if (isPractice) {
              return 'bg-gradient-to-r from-emerald-950/95 via-stone-900/95 to-teal-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-500/20';
            }
            return 'bg-stone-900/95 border-stone-700 text-stone-100 shadow-stone-900/40';
          };

          const getIcon = () => {
            if (isAchievement) {
              return <Trophy className="w-5 h-5 text-amber-400 animate-bounce shrink-0" />;
            }
            if (isModelUpdate) {
              return <Cpu className="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />;
            }
            if (toast.iconType === 'flame' || toast.type === 'streak_alert') {
              return <Flame className="w-5 h-5 text-orange-400 animate-pulse shrink-0" />;
            }
            if (toast.iconType === 'target') {
              return <Target className="w-5 h-5 text-emerald-400 shrink-0" />;
            }
            return <Bell className="w-5 h-5 text-emerald-400 shrink-0" />;
          };

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={() => handleAction(toast)}
              className={`pointer-events-auto cursor-pointer rounded-2xl p-4 border backdrop-blur-xl shadow-2xl transition-all hover:scale-[1.02] flex flex-col gap-2.5 relative overflow-hidden ${getBorderAndBg()}`}
              role="alert"
              id={`toast-${toast.id}`}
            >
              {/* Category pill and quick controls */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-black/40 border border-white/10">
                    {getIcon()}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 border border-white/10 backdrop-blur-sm">
                    {isAchievement ? 'Achievement' : isModelUpdate ? 'Model Update' : 'Practice Reminder'}
                  </span>
                  {toast.priority === 'high' && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40">
                      Priority
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleSound}
                    className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
                  </button>
                  <button
                    onClick={(e) => handleDismiss(toast.id, e)}
                    className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    title="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Message */}
              <div>
                <h4 className="text-sm font-bold text-white leading-snug flex items-center gap-1.5">
                  {toast.title}
                </h4>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed line-clamp-2">
                  {toast.message}
                </p>
              </div>

              {/* Action footer */}
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                <span className="text-[10px] text-stone-400 font-mono">
                  Just now
                </span>
                <div className="flex items-center gap-1 font-bold text-white hover:underline text-xs">
                  <span>{toast.actionLabel || 'View Details'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                </div>
              </div>

              {/* Animated bottom progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6.5, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-1 ${
                  isAchievement
                    ? 'bg-amber-400'
                    : isModelUpdate
                    ? 'bg-cyan-400'
                    : 'bg-emerald-400'
                }`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </aside>
  );
}
