import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Trophy,
  Cpu,
  Flame,
  Target,
  Sparkles,
  CheckCheck,
  Trash2,
  Settings,
  X,
  Volume2,
  VolumeX,
  Clock,
  Calendar,
  Globe,
  Sliders,
  CheckCircle,
  AlertCircle,
  Play,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { AppNotification, NotificationPreferences, NotificationType } from '../types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearReadNotifications,
  getNotificationPreferences,
  saveNotificationPreferences,
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  triggerPracticeReminder,
  triggerAchievementNotification,
  triggerModelUpdateNotification,
  triggerStreakAlert,
  notificationAudio
} from '../utils/notificationEngine';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string, payload?: any) => void;
}

export default function NotificationCenterModal({
  isOpen,
  onClose,
  onNavigateTab
}: NotificationCenterModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'settings'>('notifications');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'practice_reminder' | 'achievement' | 'model_update' | 'unread'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getNotifications());
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => getNotificationPreferences());
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(() => getBrowserNotificationPermission());
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  // Sync state when custom event triggers
  const refreshNotifications = () => {
    setNotifications(getNotifications());
    setPreferences(getNotificationPreferences());
    setBrowserPermission(getBrowserNotificationPermission());
  };

  useEffect(() => {
    refreshNotifications();
    const handleUpdate = () => refreshNotifications();
    window.addEventListener('sign_ai_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('sign_ai_notifications_updated', handleUpdate);
    };
  }, [isOpen]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      if (categoryFilter === 'unread') return !item.read;
      if (categoryFilter === 'practice_reminder') return item.type === 'practice_reminder' || item.type === 'streak_alert';
      if (categoryFilter === 'achievement') return item.type === 'achievement';
      if (categoryFilter === 'model_update') return item.type === 'model_update';
      return true;
    });
  }, [notifications, categoryFilter]);

  const handleUpdatePrefs = (patch: Partial<NotificationPreferences>) => {
    const updated = saveNotificationPreferences(patch);
    setPreferences(updated);
  };

  const handleRequestBrowserPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      setTestNotificationFeedback('✅ Browser notifications enabled successfully!');
    } else if (res === 'denied') {
      setTestNotificationFeedback('⚠️ Permission was denied by browser or iframe policy.');
    } else {
      setTestNotificationFeedback('ℹ️ Browser notifications not supported in this browser.');
    }
    setTimeout(() => setTestNotificationFeedback(null), 4000);
  };

  const handleTestPractice = () => {
    const sampleSigns = ['A', 'Namaste', 'Help', 'B', 'Thank You'];
    const randomSign = sampleSigns[Math.floor(Math.random() * sampleSigns.length)];
    triggerPracticeReminder({ signChar: randomSign, streakDays: 3 });
    setTestNotificationFeedback(`Triggered practice reminder for '${randomSign}'`);
    setTimeout(() => setTestNotificationFeedback(null), 3000);
  };

  const handleTestAchievement = () => {
    const sampleBadges = [
      { title: 'Speed Signer', tier: 'gold' as const, description: 'Completed 5 signs under 10 seconds with 90%+ accuracy', xpEarned: 150 },
      { title: 'Consistency Champion', tier: 'diamond' as const, description: 'Maintained a 7-day practice streak', xpEarned: 300 },
      { title: 'ISL Explorer', tier: 'silver' as const, description: 'Learned first 10 Indian Sign Language gestures', xpEarned: 80 }
    ];
    const randomBadge = sampleBadges[Math.floor(Math.random() * sampleBadges.length)];
    triggerAchievementNotification(randomBadge);
    setTestNotificationFeedback(`Unlocked achievement: ${randomBadge.title}`);
    setTimeout(() => setTestNotificationFeedback(null), 3000);
  };

  const handleTestModelUpdate = () => {
    triggerModelUpdateNotification({
      modelName: 'ISL & ASL Transformer Neural Net',
      modelVersion: 'v3.4.1',
      accuracy: 98.6,
      description: 'Model weights updated with improved two-handed gesture orientation recognition.'
    });
    setTestNotificationFeedback('Synchronized AI Model v3.4.1 update');
    setTimeout(() => setTestNotificationFeedback(null), 3000);
  };

  const handleNotificationClick = (item: AppNotification) => {
    markNotificationAsRead(item.id);
    if (item.actionTab) {
      onClose();
      onNavigateTab(item.actionTab, item.actionPayload);
    }
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay === 1) return 'Yesterday';
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      id="notification-center-backdrop"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#1a1a1e] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-stone-900 dark:text-stone-100"
        id="notification-center-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Notification Center"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-[#141416]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  Notification Center
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-sm animate-pulse">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Practice reminders, achievement milestones, and neural model syncs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sub-tab Switcher: Notifications vs Settings */}
            <div className="flex items-center bg-stone-200/70 dark:bg-stone-800/80 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveSubTab('notifications')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'notifications'
                    ? 'bg-white dark:bg-[#202024] text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Inbox</span>
              </button>
              <button
                onClick={() => setActiveSubTab('settings')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'settings'
                    ? 'bg-white dark:bg-[#202024] text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
              aria-label="Close notification center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Banner if test triggered */}
        {testNotificationFeedback && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              {testNotificationFeedback}
            </span>
            <button
              onClick={() => setTestNotificationFeedback(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline text-[10px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* --- SUB-TAB 1: NOTIFICATIONS INBOX --- */}
        {activeSubTab === 'notifications' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter Pills Bar & Quick Actions */}
            <div className="px-6 py-3 border-b border-stone-200 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-900/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All', icon: Bell, count: notifications.length },
                  { id: 'practice_reminder', label: 'Practice', icon: Target, count: notifications.filter(n => n.type === 'practice_reminder' || n.type === 'streak_alert').length },
                  { id: 'achievement', label: 'Achievements', icon: Trophy, count: notifications.filter(n => n.type === 'achievement').length },
                  { id: 'model_update', label: 'Model Syncs', icon: Cpu, count: notifications.filter(n => n.type === 'model_update').length },
                  { id: 'unread', label: 'Unread', icon: Sparkles, count: unreadCount }
                ].map(tab => {
                  const Icon = tab.icon;
                  const active = categoryFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCategoryFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        active
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/80 border border-stone-200/60 dark:border-stone-700/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        active ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-1"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
                {notifications.some(n => n.read) && (
                  <button
                    onClick={clearReadNotifications}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1"
                    title="Clear already read notifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear read</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notifications Scrollable List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-stone-100 dark:bg-stone-800/80 text-stone-400 flex items-center justify-center border border-stone-200 dark:border-stone-700">
                    <Bell className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300">
                      No notifications in this category
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mt-1">
                      {categoryFilter === 'unread'
                        ? "You're all caught up! Great job staying active with your sign language practice."
                        : 'Notifications for achievements, practice recommendations, and AI models will appear here.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleTestPractice}
                      className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                    >
                      Trigger Test Reminder
                    </button>
                  </div>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const isAchievement = item.type === 'achievement';
                  const isModelUpdate = item.type === 'model_update';
                  const isPractice = item.type === 'practice_reminder' || item.type === 'streak_alert';

                  const getIconBadge = () => {
                    if (isAchievement) {
                      return (
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                      );
                    }
                    if (isModelUpdate) {
                      return (
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                          <Cpu className="w-5 h-5" />
                        </div>
                      );
                    }
                    if (item.type === 'streak_alert') {
                      return (
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                          <Flame className="w-5 h-5 animate-pulse" />
                        </div>
                      );
                    }
                    return (
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                    );
                  };

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        !item.read
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-sm'
                          : 'bg-white dark:bg-[#202024]/60 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-[#25252a]'
                      }`}
                      id={`notification-card-${item.id}`}
                    >
                      {/* Left: Icon & Details */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {getIconBadge()}
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {!item.read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            )}
                            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                              {item.title}
                            </h4>
                            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                              • {formatTimestamp(item.timestamp)}
                            </span>
                          </div>

                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2">
                            {item.message}
                          </p>

                          {/* Metadata chips */}
                          {item.actionPayload && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {item.actionPayload.signChar && (
                                <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                                  Target: {item.actionPayload.signChar}
                                </span>
                              )}
                              {item.actionPayload.xpEarned && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                                  +{item.actionPayload.xpEarned} XP
                                </span>
                              )}
                              {item.actionPayload.modelAccuracy && (
                                <span className="px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300 text-[10px] font-bold border border-cyan-200 dark:border-cyan-800">
                                  {item.actionPayload.modelAccuracy.toFixed(1)}% Acc
                                </span>
                              )}
                              {item.actionPayload.streakDays && (
                                <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 text-[10px] font-bold border border-orange-200 dark:border-orange-800">
                                  {item.actionPayload.streakDays} Day Streak
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                        {item.actionTab && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(item);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            <span>{item.actionLabel || 'Open'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(item.id);
                          }}
                          className="p-2 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Test Bar at Bottom of Inbox */}
            <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#141416] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick Test Simulators:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTestPractice}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                >
                  + Practice Reminder
                </button>
                <button
                  onClick={handleTestAchievement}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                >
                  + Achievement Unlock
                </button>
                <button
                  onClick={handleTestModelUpdate}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                >
                  + Model Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- SUB-TAB 2: NOTIFICATION PREFERENCES & SETTINGS --- */}
        {activeSubTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Browser Web Notifications Permission Card */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-[#202024] border border-stone-200 dark:border-stone-800 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <span>Browser Desktop Notifications</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        browserPermission === 'granted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : browserPermission === 'denied'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {browserPermission}
                      </span>
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      Receive system alerts even when the tab is running in the background or minimized.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRequestBrowserPermission}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    browserPermission === 'granted'
                      ? 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                  }`}
                >
                  {browserPermission === 'granted' ? 'Re-verify' : 'Enable Permission'}
                </button>
              </div>

              {browserPermission !== 'granted' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    Note: If running in an embedded preview frame, permissions might require opening the app in a new dedicated browser tab.
                  </span>
                </div>
              )}
            </div>

            {/* 2. Practice Reminders Schedule Card */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-[#202024] border border-stone-200 dark:border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Practice Reminders
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Spaced repetition alerts for weak gestures and streak preservation
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.practiceRemindersEnabled}
                    onChange={(e) => handleUpdatePrefs({ practiceRemindersEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {preferences.practiceRemindersEnabled && (
                <div className="pt-3 border-t border-stone-200 dark:border-stone-700/60 space-y-4">
                  {/* Daily Reminder Time Picker */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        Preferred Daily Reminder Time:
                      </span>
                      <p className="text-[11px] text-stone-400">
                        When you prefer to receive daily gesture practice prompts
                      </p>
                    </div>
                    <input
                      type="time"
                      value={preferences.practiceReminderTime}
                      onChange={(e) => handleUpdatePrefs({ practiceReminderTime: e.target.value })}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Day of Week Selector */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      Active Reminder Days:
                    </span>
                    <div className="grid grid-cols-7 gap-1.5">
                      {[
                        { day: 0, label: 'Sun' },
                        { day: 1, label: 'Mon' },
                        { day: 2, label: 'Tue' },
                        { day: 3, label: 'Wed' },
                        { day: 4, label: 'Thu' },
                        { day: 5, label: 'Fri' },
                        { day: 6, label: 'Sat' }
                      ].map(d => {
                        const isSelected = preferences.practiceReminderDays.includes(d.day);
                        return (
                          <button
                            key={d.day}
                            type="button"
                            onClick={() => {
                              const existing = preferences.practiceReminderDays;
                              const updated = isSelected
                                ? existing.filter(x => x !== d.day)
                                : [...existing, d.day].sort();
                              handleUpdatePrefs({ practiceReminderDays: updated.length > 0 ? updated : [1, 2, 3, 4, 5] });
                            }}
                            className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Category Toggles (Achievements & Models & Streaks) */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-[#202024] border border-stone-200 dark:border-stone-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Alert Types & Notification Categories
              </h4>

              {/* Achievements Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Achievement & Badge Unlocks
                    </h5>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Celebrate score records, sign mastery, and milestone XP gains
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.achievementAlertsEnabled}
                    onChange={(e) => handleUpdatePrefs({ achievementAlertsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Model Updates Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      AI Model Updates & Dataset Sync
                    </h5>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Notify when neural models finish retraining or new checkpoints download
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.modelUpdatesEnabled}
                    onChange={(e) => handleUpdatePrefs({ modelUpdatesEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              {/* Streak Protection Alerts */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Daily Streak Protection Alerts
                    </h5>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Timely warnings before streak expiration resets your daily progress
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.streakProtectionAlerts}
                    onChange={(e) => handleUpdatePrefs({ streakProtectionAlerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>

            {/* 4. Audio Sound Chimes & Quiet Hours */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-[#202024] border border-stone-200 dark:border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Audio Notification Chimes
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Synthesized melodic audio alerts for achievements and reminders
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => notificationAudio.playAchievementChime()}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>Test Sound</span>
                  </button>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.soundEnabled}
                      onChange={(e) => handleUpdatePrefs({ soundEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              {/* Quiet Hours Configuration */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Quiet Hours (Do Not Disturb)
                    </h5>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Mute all audio chimes and popups during sleeping hours
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.quietHoursEnabled}
                      onChange={(e) => handleUpdatePrefs({ quietHoursEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {preferences.quietHoursEnabled && (
                  <div className="flex items-center gap-3 pt-2 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-500">From:</span>
                      <input
                        type="time"
                        value={preferences.quietHoursStart}
                        onChange={(e) => handleUpdatePrefs({ quietHoursStart: e.target.value })}
                        className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-500">To:</span>
                      <input
                        type="time"
                        value={preferences.quietHoursEnd}
                        onChange={(e) => handleUpdatePrefs({ quietHoursEnd: e.target.value })}
                        className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Footer */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#141416]/70 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            Sign Language AI Notification Engine v3.2
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
