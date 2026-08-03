import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  CloudRain, 
  ShieldCheck, 
  RefreshCcw, 
  Clock, 
  HardDrive, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  DownloadCloud, 
  UploadCloud, 
  Settings, 
  Database, 
  Zap, 
  Lock, 
  Sliders,
  Sparkles,
  FileText,
  Activity,
  Layers,
  Check
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  AutoBackupSettings, 
  CloudBackupSnapshot, 
  getLocalAutoBackupSettings, 
  saveLocalAutoBackupSettings, 
  createCloudBackupSnapshot, 
  listCloudBackupSnapshots, 
  deleteCloudBackupSnapshot,
  getDeviceMetadata 
} from '../lib/cloudAutoBackup';
import { getOrCreateDeviceId, registerDeviceHeartbeat } from '../lib/cloudDataSync';
import { useLanguage } from '../context/LanguageContext';

interface CloudAutoBackupSyncProps {
  user: User | null;
  localSessions?: any[];
  localSamples?: any[];
  localGestures?: any[];
  translationHistory?: any[];
  themeSettings?: any;
  onRestoreData?: (snapshot: CloudBackupSnapshot) => void;
}

export default function CloudAutoBackupSync({
  user,
  localSessions = [],
  localSamples = [],
  localGestures = [],
  translationHistory = [],
  themeSettings,
  onRestoreData
}: CloudAutoBackupSyncProps) {
  const { t } = useLanguage();
  const [backupSettings, setBackupSettings] = useState<AutoBackupSettings>(getLocalAutoBackupSettings());
  const [snapshots, setSnapshots] = useState<CloudBackupSnapshot[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'auto_backup' | 'snapshots' | 'security'>('overview');

  const deviceMeta = getDeviceMetadata();
  const deviceId = getOrCreateDeviceId();

  const loadSnapshotsList = async () => {
    if (!user) return;
    setLoadingSnapshots(true);
    try {
      const list = await listCloudBackupSnapshots(user.uid);
      setSnapshots(list);
    } catch (err: any) {
      console.warn("Failed loading snapshots:", err);
    } finally {
      setLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSnapshotsList();
      registerDeviceHeartbeat(user.uid);
    }
  }, [user]);

  const handleUpdateSettings = (updated: Partial<AutoBackupSettings>) => {
    const newSettings = { ...backupSettings, ...updated };
    setBackupSettings(newSettings);
    saveLocalAutoBackupSettings(newSettings);
    setStatusMessage({
      type: 'success',
      text: 'Auto Backup preferences updated and saved!'
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleManualBackupNow = async () => {
    if (!user) {
      setStatusMessage({
        type: 'error',
        text: 'You must be signed in to back up data to the cloud.'
      });
      return;
    }

    setIsBackingUp(true);
    setStatusMessage({ type: 'info', text: 'Encrypted cloud snapshot in progress...' });

    try {
      const backupPayload = {
        sessions: backupSettings.backupHistory ? localSessions : [],
        samples: backupSettings.backupDatasets ? localSamples : [],
        gestures: backupSettings.backupGestures ? localGestures : [],
        translationHistory: backupSettings.backupHistory ? translationHistory : [],
        themeSettings: backupSettings.backupSettings ? themeSettings : null
      };

      const newSnapshot = await createCloudBackupSnapshot(user.uid, backupPayload, false);

      setStatusMessage({
        type: 'success',
        text: `Cloud Backup Complete! Saved ${newSnapshot.snapshotSizeKb} KB snapshot across devices.`
      });
      await loadSnapshotsList();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Cloud Backup Failed: ${err.message || err}`
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreSnapshot = async (snapshot: CloudBackupSnapshot) => {
    if (!user) return;
    setRestoringId(snapshot.id);
    try {
      if (onRestoreData) {
        onRestoreData(snapshot);
      }
      setStatusMessage({
        type: 'success',
        text: `Snapshot successfully restored! Loaded ${snapshot.counts.sessionsCount} sessions, ${snapshot.counts.gesturesCount} gestures.`
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Restore failed: ${err.message || err}`
      });
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    if (!user) return;
    setDeletingId(snapshotId);
    try {
      const ok = await deleteCloudBackupSnapshot(user.uid, snapshotId);
      if (ok) {
        setStatusMessage({
          type: 'success',
          text: 'Cloud snapshot deleted permanently.'
        });
        await loadSnapshotsList();
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Failed to delete snapshot.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Deletion error: ${err.message || err}`
      });
    } finally {
      setDeletingId(null);
    }
  };

  const totalCloudItemsCount = localSessions.length + localSamples.length + localGestures.length + translationHistory.length;
  const rawDataKb = Math.round((JSON.stringify({ localSessions, localSamples, localGestures }).length * 2) / 1024 * 10) / 10;

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans text-neutral-900 dark:text-neutral-100">
      
      {/* Top Banner: Cross-Device Cloud Sync Hero */}
      <div className="bg-gradient-to-br from-indigo-900 via-stone-900 to-black text-white p-6 sm:p-8 rounded-[32px] border border-stone-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono uppercase font-black tracking-widest px-3 py-1 rounded-full">
                SECURE CROSS-DEVICE CLOUD SYNC
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono uppercase font-black tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> FIRESTORE TLS 1.3
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3">
              <Cloud className="w-7 h-7 text-indigo-400" />
              <span>Multi-Device Storage & Auto Backup</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl">
              Seamlessly synchronize your custom sign gestures, AI training datasets, translation transcripts, and workspace settings across mobile, laptop, and desktop devices.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={handleManualBackupNow}
              disabled={isBackingUp || !user}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <UploadCloud className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
              <span>{isBackingUp ? 'Creating Cloud Backup...' : 'Create Cloud Backup Now'}</span>
            </button>
            <button
              onClick={loadSnapshotsList}
              disabled={loadingSnapshots || !user}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-stone-700"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${loadingSnapshots ? 'animate-spin' : ''}`} />
              <span>Refresh Snapshots</span>
            </button>
          </div>
        </div>

        {/* User auth details line */}
        <div className="mt-6 pt-4 border-t border-stone-800/80 flex flex-wrap items-center justify-between text-xs text-stone-400 gap-4">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>User Account Scope:</span>
            <span className="font-bold text-white font-mono">{user?.email || 'Guest Session (Local Mode)'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Laptop className="w-3.5 h-3.5 text-stone-400" />
              {deviceMeta.deviceName} ({deviceMeta.browserInfo})
            </span>
            <span className="font-mono text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md">
              ID: {deviceId.substring(0, 14)}...
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Feedback Notification Banner */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-sm border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-900 dark:text-rose-200'
              : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 text-indigo-900 dark:text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            {statusMessage.type === 'info' && <RefreshCcw className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-[10px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Cloud Storage Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('auto_backup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'auto_backup'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Auto Backup Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'snapshots'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Snapshot History ({snapshots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure Sync Protocols</span>
        </button>
      </div>

      {/* TAB 1: CLOUD STORAGE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span className="text-xs font-bold">Total Stored Data</span>
                <Database className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-stone-900 dark:text-white">
                ~{rawDataKb} KB
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Across {totalCloudItemsCount} synced user entities
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span className="text-xs font-bold">Custom Gestures</span>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {localGestures.length} Classes
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Saved under users/{user?.uid ? 'uid' : 'guest'}/gestures
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span className="text-xs font-bold">Collected Datasets</span>
                <Layers className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {localSamples.length} Landmark Samples
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Auto-synchronized with cloud repository
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span className="text-xs font-bold">Translation Logs</span>
                <FileText className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {localSessions.length + translationHistory.length} Transcripts
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Accessible from any connected device
              </p>
            </div>
          </div>

          {/* Sync Status Details Card */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              <span>Cloud Persistence & Multi-Device Realtime Sync</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2">
                <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Real-time Device Mirroring</span>
                </div>
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                  When signed in, any change made on your laptop (such as creating new gesture classes or updating preferences) is automatically broadcasted to your phone and tablet via Firestore <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded font-mono text-[10px]">onSnapshot</code> listeners.
                </p>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2">
                <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>Cloud Storage Rules Enforcement</span>
                </div>
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                  All cloud documents are locked to your Firebase Authentication UID (<code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded font-mono text-[10px]">request.auth.uid == userId</code>). Unauthorized cross-account access is strictly prevented at the database level.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTO BACKUP ENGINE SETTINGS */}
      {activeTab === 'auto_backup' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-500" />
                <span>Automated Cloud Backup Engine</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Configure background auto-save parameters to ensure no gesture data or translation history is lost.
              </p>
            </div>

            {/* Toggle Enable Auto Backup */}
            <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800 p-3 rounded-2xl border border-stone-200 dark:border-stone-700 self-start sm:self-auto">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                {backupSettings.enabled ? 'Auto Backup Active' : 'Auto Backup Disabled'}
              </span>
              <button
                onClick={() => handleUpdateSettings({ enabled: !backupSettings.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  backupSettings.enabled ? 'bg-indigo-600' : 'bg-stone-300 dark:bg-stone-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  backupSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Interval and Limit Settings */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  Auto Backup Frequency / Interval
                </label>
                <select
                  value={backupSettings.intervalMinutes}
                  onChange={(e) => handleUpdateSettings({ intervalMinutes: Number(e.target.value) })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-3 text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>Every 1 minute (Instant High Frequency)</option>
                  <option value={5}>Every 5 minutes (Recommended Default)</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every 1 hour</option>
                </select>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Controls how frequently the system takes automated Firestore cloud snapshots.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  Maximum Snapshot History Retention
                </label>
                <select
                  value={backupSettings.maxSnapshots}
                  onChange={(e) => handleUpdateSettings({ maxSnapshots: Number(e.target.value) })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-3 text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={5}>Keep Last 5 Snapshots</option>
                  <option value={10}>Keep Last 10 Snapshots (Recommended)</option>
                  <option value={20}>Keep Last 20 Snapshots</option>
                  <option value={50}>Keep Last 50 Snapshots</option>
                </select>
              </div>

              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Last Auto Backup Timestamp:
                </p>
                <p className="text-indigo-700 dark:text-indigo-300 font-mono text-[11px]">
                  {backupSettings.lastBackupTime ? new Date(backupSettings.lastBackupTime).toLocaleString() : 'No automated backup recorded yet'}
                </p>
              </div>
            </div>

            {/* Right Column: Component Selection Switches */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                Include in Auto Backup Payload
              </label>

              <div className="space-y-3">
                {[
                  { key: 'backupGestures', label: 'Custom Gestures & Class Names', desc: 'Saves your trained gesture definitions' },
                  { key: 'backupDatasets', label: 'Collected Landmark Samples', desc: 'Saves raw hand landmark landmark coordinates' },
                  { key: 'backupHistory', label: 'Translation & Session Logs', desc: 'Saves full translation transcripts and analytics logs' },
                  { key: 'backupSettings', label: 'UI Theme & Preferences', desc: 'Saves dark mode, language selector, and TTS voices' },
                ].map((item) => (
                  <div key={item.key} className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-white">{item.label}</p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean((backupSettings as any)[item.key])}
                      onChange={(e) => handleUpdateSettings({ [item.key]: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-stone-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLOUD SNAPSHOT HISTORY EXPLORER */}
      {activeTab === 'snapshots' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span>Cloud Snapshot History & Recovery Hub</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Restore data from any point in time across devices or delete old backup points.
              </p>
            </div>

            <button
              onClick={handleManualBackupNow}
              disabled={isBackingUp || !user}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Create Snapshot</span>
            </button>
          </div>

          {loadingSnapshots ? (
            <div className="p-8 text-center space-y-3">
              <RefreshCcw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-stone-500">Fetching cloud backup snapshots from Firestore...</p>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl space-y-3">
              <CloudRain className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-sm font-bold text-stone-700 dark:text-stone-300">No cloud snapshots recorded yet</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Click "Create Cloud Backup Now" above or enable Auto Backup to generate your first device snapshot.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snap) => (
                <div 
                  key={snap.id}
                  className="p-4 bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900 dark:text-white">
                        {new Date(snap.createdAt).toLocaleString()}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        snap.isAutoBackup
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300'
                      }`}>
                        {snap.isAutoBackup ? 'Auto Snapshot' : 'Manual Snapshot'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400">
                      <span>Device: <strong>{snap.deviceName}</strong> ({snap.browserInfo})</span>
                      <span>•</span>
                      <span>Size: <strong>{snap.snapshotSizeKb} KB</strong></span>
                      <span>•</span>
                      <span>Gestures: <strong>{snap.counts.gesturesCount}</strong></span>
                      <span>•</span>
                      <span>Datasets: <strong>{snap.counts.samplesCount}</strong></span>
                      <span>•</span>
                      <span>Logs: <strong>{snap.counts.sessionsCount}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRestoreSnapshot(snap)}
                      disabled={restoringId === snap.id}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                    >
                      <DownloadCloud className={`w-3.5 h-3.5 ${restoringId === snap.id ? 'animate-bounce' : ''}`} />
                      <span>{restoringId === snap.id ? 'Restoring...' : 'Restore'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSnapshot(snap.id)}
                      disabled={deletingId === snap.id}
                      className="p-2 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-300 text-stone-600 dark:text-stone-300 transition-all disabled:opacity-50"
                      title="Delete Snapshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SECURE SYNC PROTOCOLS */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <span>Secure Cloud Synchronization Protocols</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>End-to-End Auth Lock</span>
              </div>
              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                All sync endpoints require active Firebase Auth tokens. Anonymous or unauthenticated network requests are denied instantly by Firestore rules.
              </p>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Isolated User Data Paths</span>
              </div>
              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                Database paths strictly enforce <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded font-mono text-[10px]">match /users/{'{userId}'}</code> permissions so users can only read or write their own documents.
              </p>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                <HardDrive className="w-4 h-4" />
                <span>Offline Fallback Cache</span>
              </div>
              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                IndexedDB persistent local cache queues mutations locally when offline and safely syncs when connectivity is restored.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
