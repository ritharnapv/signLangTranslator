import { AppNotification, NotificationPreferences, NotificationType, NotificationPriority } from '../types';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const NOTIFICATIONS_STORAGE_KEY = 'sign_ai_notifications_list';
const PREFERENCES_STORAGE_KEY = 'sign_ai_notification_prefs';
const LAST_REMINDER_DATE_KEY = 'sign_ai_last_reminder_date';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  browserNotificationsEnabled: false,
  practiceRemindersEnabled: true,
  practiceReminderTime: '18:00', // 6:00 PM
  practiceReminderDays: [0, 1, 2, 3, 4, 5, 6], // Every day (Sun-Sat)
  practiceIntervalHours: 24,
  achievementAlertsEnabled: true,
  modelUpdatesEnabled: true,
  streakProtectionAlerts: true,
  soundEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00'
};

// Default seed notifications for fresh profiles
export const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-welcome-model',
    title: 'Model Ready: ASL & ISL Neural Net v3.2',
    message: 'MediaPipe + TF.js gesture recognition engine is optimized with 100+ hand landmarks and 98.4% baseline accuracy.',
    type: 'model_update',
    priority: 'normal',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    read: false,
    actionTab: 'trainer',
    actionLabel: 'Inspect Model',
    iconType: 'cpu',
    actionPayload: {
      modelName: 'SignSense Baseline Hybrid',
      modelVersion: 'v3.2.0',
      modelAccuracy: 98.4
    }
  },
  {
    id: 'notif-welcome-practice',
    title: 'Daily Practice Goal Active 🎯',
    message: 'Complete 3 sign evaluations today to keep your daily streak alive and earn +50 XP bonus.',
    type: 'practice_reminder',
    priority: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: false,
    actionTab: 'practice_recommendations',
    actionLabel: 'Start Practice',
    iconType: 'target',
    actionPayload: {
      signChar: 'A',
      signLanguage: 'ASL'
    }
  },
  {
    id: 'notif-welcome-achievement',
    title: 'Welcome to Sign Language AI 🏆',
    message: 'You unlocked the "Pioneer Signer" badge! Explore the AI Coach and Gesture Search.',
    type: 'achievement',
    priority: 'normal',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    read: true,
    actionTab: 'learning_dashboard',
    actionLabel: 'View Badges',
    iconType: 'trophy',
    actionPayload: {
      badgeTitle: 'Pioneer Signer',
      badgeTier: 'bronze',
      xpEarned: 100
    }
  }
];

// --- Audio Synthesizer for In-App Notification Chimes ---
class NotificationSoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  playAchievementChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Arpeggiated C Major 7th chord: C5, E5, G5, B5, C6
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.55);
      });
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }

  playPracticeReminderChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Gentle warm two-tone marimba chime (E4 -> A4 -> C#5)
      const notes = [329.63, 440.00, 554.37];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.65);
      });
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }

  playModelUpdateChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Modern digital sweep double beep (D5 -> A5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.15);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }

  playGeneralChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }
}

export const notificationAudio = new NotificationSoundSynthesizer();

// --- Storage & Preference Helpers ---

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse notification preferences:', e);
  }
  return { ...DEFAULT_NOTIFICATION_PREFERENCES };
}

export function saveNotificationPreferences(prefs: Partial<NotificationPreferences>): NotificationPreferences {
  const current = getNotificationPreferences();
  const updated = { ...current, ...prefs };
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    dispatchNotificationsEvent();

    if (auth.currentUser) {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'notifications');
      setDoc(docRef, updated, { merge: true }).catch(err => {
        console.warn('Failed to sync notification preferences to Firestore:', err);
      });
    }
  } catch (e) {
    console.error('Failed to save notification preferences:', e);
  }
  return updated;
}

export function getNotifications(): AppNotification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Initialize with defaults if empty
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
    return DEFAULT_NOTIFICATIONS;
  } catch (e) {
    console.error('Failed to get notifications:', e);
    return DEFAULT_NOTIFICATIONS;
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    const capped = notifications.slice(0, 60); // Keep latest 60
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(capped));
    dispatchNotificationsEvent();
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
}

export function markNotificationAsRead(id: string): void {
  const list = getNotifications();
  const updated = list.map(item => item.id === id ? { ...item, read: true } : item);
  saveNotifications(updated);
}

export function markAllNotificationsAsRead(): void {
  const list = getNotifications();
  const updated = list.map(item => ({ ...item, read: true }));
  saveNotifications(updated);
}

export function deleteNotification(id: string): void {
  const list = getNotifications();
  const updated = list.filter(item => item.id !== id);
  saveNotifications(updated);
}

export function clearReadNotifications(): void {
  const list = getNotifications();
  const updated = list.filter(item => !item.read);
  saveNotifications(updated);
}

export function getUnreadNotificationCount(): number {
  const list = getNotifications();
  return list.filter(item => !item.read).length;
}

function dispatchNotificationsEvent(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sign_ai_notifications_updated'));
  }
}

// --- Quiet Hours Checker ---

export function isInQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHoursEnabled) return false;
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Wraps around midnight (e.g. 22:00 to 08:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  } catch {
    return false;
  }
}

// --- Browser Web Notification API Integration ---

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      saveNotificationPreferences({ browserNotificationsEnabled: true });
    } else {
      saveNotificationPreferences({ browserNotificationsEnabled: false });
    }
    return permission;
  } catch (err) {
    console.warn('Notification.requestPermission error (likely sandboxed iframe):', err);
    return 'denied';
  }
}

export function sendBrowserNotification(notification: AppNotification): boolean {
  if (!isBrowserNotificationSupported()) return false;
  const prefs = getNotificationPreferences();
  if (!prefs.browserNotificationsEnabled || Notification.permission !== 'granted') {
    return false;
  }
  if (isInQuietHours(prefs)) {
    return false;
  }

  try {
    const options: any = {
      body: notification.message,
      icon: '/icon.png',
      badge: '/icon.png',
      tag: notification.id,
      renotify: true,
      data: {
        actionTab: notification.actionTab,
        actionPayload: notification.actionPayload
      }
    };

    const nativeNotif = new Notification(notification.title, options);
    nativeNotif.onclick = () => {
      window.focus();
      if (notification.actionTab) {
        window.dispatchEvent(new CustomEvent('sign_ai_navigate_tab', {
          detail: { tab: notification.actionTab, payload: notification.actionPayload }
        }));
      }
      nativeNotif.close();
    };

    return true;
  } catch (err) {
    console.warn('Could not dispatch browser notification (iframe security policy):', err);
    return false;
  }
}

// --- Primary Notification Creator & Dispatcher ---

export interface CreateNotificationOptions {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  actionTab?: AppNotification['actionTab'];
  actionLabel?: string;
  actionPayload?: AppNotification['actionPayload'];
  iconType?: AppNotification['iconType'];
  skipSound?: boolean;
  skipBrowser?: boolean;
}

export function triggerAppNotification(options: CreateNotificationOptions): AppNotification {
  const prefs = getNotificationPreferences();
  const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const newNotification: AppNotification = {
    id,
    title: options.title,
    message: options.message,
    type: options.type,
    priority: options.priority || 'normal',
    timestamp: new Date().toISOString(),
    read: false,
    actionTab: options.actionTab,
    actionLabel: options.actionLabel,
    actionPayload: options.actionPayload,
    iconType: options.iconType || (
      options.type === 'achievement' ? 'trophy' :
      options.type === 'model_update' ? 'cpu' :
      options.type === 'streak_alert' ? 'flame' : 'bell'
    ),
    sentToBrowser: false
  };

  // 1. Save to local notification store
  const currentList = getNotifications();
  const updatedList = [newNotification, ...currentList.filter(n => n.id !== id)].slice(0, 60);
  saveNotifications(updatedList);

  // 2. Play synthesized Web Audio chime if enabled and not in quiet hours
  if (prefs.soundEnabled && !options.skipSound && !isInQuietHours(prefs)) {
    if (options.type === 'achievement') {
      notificationAudio.playAchievementChime();
    } else if (options.type === 'practice_reminder' || options.type === 'streak_alert') {
      notificationAudio.playPracticeReminderChime();
    } else if (options.type === 'model_update') {
      notificationAudio.playModelUpdateChime();
    } else {
      notificationAudio.playGeneralChime();
    }
  }

  // 3. Dispatch native browser notification
  if (!options.skipBrowser) {
    const sent = sendBrowserNotification(newNotification);
    newNotification.sentToBrowser = sent;
  }

  // 4. Dispatch in-app toast event for instant UI banner animation
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sign_ai_toast_notification', { detail: newNotification }));
  }

  return newNotification;
}

// --- Specialized Notification Helper Generators ---

/**
 * 1. Practice Reminders
 */
export function triggerPracticeReminder(data?: {
  signChar?: string;
  signLanguage?: 'ASL' | 'ISL';
  streakDays?: number;
  dueSignsCount?: number;
  customMessage?: string;
}): AppNotification | null {
  const prefs = getNotificationPreferences();
  if (!prefs.practiceRemindersEnabled) return null;

  const streak = data?.streakDays ?? 0;
  const sign = data?.signChar;
  const lang = data?.signLanguage || 'ASL';

  let title = 'Time to Practice Signs! 🎯';
  let message = data?.customMessage || 'Take 3 minutes to test your gestures and boost muscle memory.';

  if (sign) {
    title = `Practice Due: '${sign}' (${lang})`;
    message = `Your AI Coach recommends reviewing sign '${sign}' to strengthen finger alignment and retention.`;
  } else if (streak > 0) {
    title = `Keep Your ${streak}-Day Streak Alive! 🔥`;
    message = `You are on a roll! Complete your daily sign evaluation today to maintain your learning streak.`;
  } else if (data?.dueSignsCount && data.dueSignsCount > 0) {
    title = `${data.dueSignsCount} Signs Ready for Review 🧠`;
    message = `Spaced repetition queue has ${data.dueSignsCount} gestures waiting for high-accuracy practice.`;
  }

  return triggerAppNotification({
    title,
    message,
    type: 'practice_reminder',
    priority: streak > 2 ? 'high' : 'normal',
    actionTab: sign ? 'evaluator' : 'practice_recommendations',
    actionLabel: sign ? `Practice '${sign}'` : 'Open Recommendations',
    actionPayload: {
      signChar: sign,
      signLanguage: lang,
      streakDays: streak
    },
    iconType: streak > 0 ? 'flame' : 'target'
  });
}

/**
 * 2. Achievement Notifications
 */
export function triggerAchievementNotification(badge: {
  id?: string;
  title: string;
  description: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
  xpEarned?: number;
  icon?: string;
}): AppNotification | null {
  const prefs = getNotificationPreferences();
  if (!prefs.achievementAlertsEnabled) return null;

  const tierBadge = badge.tier ? `[${badge.tier.toUpperCase()}] ` : '';
  const xpText = badge.xpEarned ? ` (+${badge.xpEarned} XP)` : '';

  return triggerAppNotification({
    title: `Achievement Unlocked: ${tierBadge}${badge.title} 🏆`,
    message: `${badge.description}${xpText}. Great work mastering sign communication!`,
    type: 'achievement',
    priority: 'high',
    actionTab: 'learning_dashboard',
    actionLabel: 'View Trophies',
    actionPayload: {
      badgeId: badge.id,
      badgeTitle: badge.title,
      badgeTier: badge.tier || 'bronze',
      xpEarned: badge.xpEarned || 50
    },
    iconType: 'trophy'
  });
}

/**
 * 3. Model Updates Notifications
 */
export function triggerModelUpdateNotification(modelInfo: {
  modelName: string;
  modelVersion?: string;
  accuracy?: number;
  epochs?: number;
  sampleCount?: number;
  description?: string;
  isCustom?: boolean;
}): AppNotification | null {
  const prefs = getNotificationPreferences();
  if (!prefs.modelUpdatesEnabled) return null;

  const accStr = modelInfo.accuracy ? ` (${modelInfo.accuracy.toFixed(1)}% accuracy)` : '';
  const title = modelInfo.isCustom
    ? `Custom Model Trained: ${modelInfo.modelName} ⚡`
    : `AI Model Updated: ${modelInfo.modelName} ${modelInfo.modelVersion || 'v3.2'} 🤖`;

  const message = modelInfo.description ||
    `Neural network inference model was updated successfully${accStr}. Real-time landmark classification is now active.`;

  return triggerAppNotification({
    title,
    message,
    type: 'model_update',
    priority: 'normal',
    actionTab: 'trainer',
    actionLabel: 'Inspect Model',
    actionPayload: {
      modelName: modelInfo.modelName,
      modelVersion: modelInfo.modelVersion || 'v3.2',
      modelAccuracy: modelInfo.accuracy
    },
    iconType: 'cpu'
  });
}

/**
 * 4. Streak Alert Notifications
 */
export function triggerStreakAlert(days: number): AppNotification | null {
  const prefs = getNotificationPreferences();
  if (!prefs.streakProtectionAlerts) return null;

  return triggerAppNotification({
    title: `Streak Protected: ${days} Days! 🔥`,
    message: `You completed your daily sign exercises. Come back tomorrow to reach ${days + 1} days!`,
    type: 'streak_alert',
    priority: 'normal',
    actionTab: 'learning_dashboard',
    actionLabel: 'View Streak Stats',
    actionPayload: { streakDays: days },
    iconType: 'flame'
  });
}

// --- Automated Daily Practice Reminder Check ---

export function checkAndTriggerAutomatedPracticeReminder(): void {
  const prefs = getNotificationPreferences();
  if (!prefs.practiceRemindersEnabled) return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentDayOfWeek = now.getDay(); // 0=Sun, 6=Sat

  // Check if today is an active reminder day
  if (!prefs.practiceReminderDays.includes(currentDayOfWeek)) {
    return;
  }

  // Check if we already sent a reminder today
  const lastReminderDate = localStorage.getItem(LAST_REMINDER_DATE_KEY);
  if (lastReminderDate === todayStr) {
    return;
  }

  // Check if practice was already completed today
  try {
    const dailyStatsRaw = localStorage.getItem('asl_daily_practice_stats');
    if (dailyStatsRaw) {
      const stats = JSON.parse(dailyStatsRaw);
      if (stats.date === todayStr && stats.isDailyGoalMet) {
        return; // Goal already met today, no reminder needed
      }
    }
  } catch (e) {
    // continue
  }

  // Check reminder hour
  const [targetH, targetM] = prefs.practiceReminderTime.split(':').map(Number);
  const currentH = now.getHours();
  const currentM = now.getMinutes();

  if (currentH > targetH || (currentH === targetH && currentM >= targetM)) {
    // Trigger reminder
    localStorage.setItem(LAST_REMINDER_DATE_KEY, todayStr);
    triggerPracticeReminder();
  }
}
