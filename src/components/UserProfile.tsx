import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { updateProfile, updatePassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  User, 
  Mail, 
  Settings, 
  Save, 
  CloudUpload, 
  CloudDownload, 
  Award, 
  LogOut, 
  Flame, 
  CheckCircle, 
  RotateCw, 
  Target, 
  UserSquare2, 
  TrendingUp, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { CollectedSample, SessionHistoryItem } from '../types';

interface UserProfileProps {
  localSessions: SessionHistoryItem[];
  localSamples: CollectedSample[];
  onRestoreSessions: (sessions: SessionHistoryItem[]) => void;
  onRestoreSamples: (samples: CollectedSample[]) => void;
  onSignOut: () => void;
}

export default function UserProfile({ 
  localSessions, 
  localSamples, 
  onRestoreSessions, 
  onRestoreSamples,
  onSignOut 
}: UserProfileProps) {
  const user = auth.currentUser;
  
  // Profile edit states
  const [displayName, setDisplayName] = useState<string>(user?.displayName || '');
  const [dailyGoal, setDailyGoal] = useState<number>(5);
  const [experience, setExperience] = useState<string>('Beginner');
  const [practiceTime, setPracticeTime] = useState<string>('Morning');
  
  // Status feedback states
  const [syncing, setSyncing] = useState<boolean>(false);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null);

  // Load user settings from Firestore on mount
  useEffect(() => {
    if (!user) return;
    
    const loadSettings = async () => {
      setSyncing(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.dailySignsGoal) setDailyGoal(data.dailySignsGoal);
          if (data.experienceLevel) setExperience(data.experienceLevel);
          if (data.displayName) setDisplayName(data.displayName);
          if (data.preferredPracticeTime) setPracticeTime(data.preferredPracticeTime);
        }
      } catch (err) {
        console.error("Error loading profile configurations from Firestore:", err);
      } finally {
        setSyncing(false);
      }
    };
    
    loadSettings();
  }, [user]);

  // Save general settings to Firestore
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingSettings(true);
    setSettingsStatus(null);

    try {
      // 1. Update Firebase Auth Profile for realtime display
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }

      // 2. Persist metadata configurations to Firestore (Cloud Database)
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        displayName,
        dailySignsGoal: Number(dailyGoal),
        experienceLevel: experience,
        preferredPracticeTime: practiceTime,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSettingsStatus('Settings synced to Firestore database!');
      setTimeout(() => setSettingsStatus(null), 3000);
    } catch (err: any) {
      console.error("Settings saving error:", err);
      setSettingsStatus(`Save failed: ${err.message || err}`);
    } finally {
      setSavingSettings(false);
    }
  };

  // Cloud Backup local sessions and samples state to Firestore
  const handleCloudBackup = async () => {
    if (!user) return;
    setBackupStatus('Syncing dynamic metrics in background...');
    
    try {
      const backupDocRef = doc(db, 'users', user.uid, 'backups', 'latest');
      await setDoc(backupDocRef, {
        sessions: localSessions,
        samples: localSamples,
        backedUpAt: new Date().toISOString(),
        totalSessions: localSessions.length,
        totalSamples: localSamples.length
      });
      
      setBackupStatus(`Success! Synced ${localSessions.length} logs and ${localSamples.length} samples.`);
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err: any) {
      console.error("Backup failed:", err);
      setBackupStatus(`Backup Error: ${err.message || err}`);
    }
  };

  // Restore session records and landmark captures from Firestore Cloud
  const handleCloudRestore = async () => {
    if (!user) return;
    setLoadStatus('Connecting to Firestore to fetch restore coordinates...');
    
    try {
      const backupDocRef = doc(db, 'users', user.uid, 'backups', 'latest');
      const docSnap = await getDoc(backupDocRef);
      
      if (!docSnap.exists()) {
        setLoadStatus('No data backups found under your user coordinates.');
        setTimeout(() => setLoadStatus(null), 3500);
        return;
      }
      
      const backupData = docSnap.data();
      const sessions = backupData.sessions || [];
      const samples = backupData.samples || [];
      
      onRestoreSessions(sessions);
      onRestoreSamples(samples);
      
      setLoadStatus(`Restored successfully! Loaded ${sessions.length} sessions, ${samples.length} custom samples.`);
      setTimeout(() => setLoadStatus(null), 4000);
    } catch (err: any) {
      console.error("Restore failed:", err);
      setLoadStatus(`Restore Error: ${err.message || err}`);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await signOut(auth);
      onSignOut();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const creationDate = user?.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })
    : 'Unknown Date';

  return (
    <div className="space-y-6" id="user-profile-viewport">
      
      {/* Profile Overview Layout Banner */}
      <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-[32px] overflow-hidden shadow-sm" id="profile-banner-card">
        
        {/* Banner Deco Top Graphic */}
        <div className="h-40 bg-[#7c8d7c] dark:bg-[#2d3a2d] relative p-8 flex items-end justify-between" id="profile-deco-bg">
          <div className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest text-white/50 font-mono">
            OPERATOR PLATFORM STATUS • ACTIVE
          </div>
          <span className="bg-[#ebdcd1]/90 text-[#a36b5e] font-sans text-[10px] px-3 py-1 rounded-full border border-[#d8c0b5] font-black uppercase tracking-wider relative z-10">
            PRO Verified
          </span>
        </div>

        {/* Header Metadata block alignment inside wrapper */}
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative" id="header-details-block">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 -mt-16 sm:-mt-20 relative z-20">
            {/* Avatar Circle */}
            <div className="w-24 h-24 rounded-3xl bg-[#fdfcf9] dark:bg-[#121214] border-4 border-white dark:border-[#1e1e22] shadow-md flex items-center justify-center text-[#7c8d7c] text-3xl font-black font-sans uppercase">
              {user?.displayName ? user.displayName.substring(0, 2) : user?.email?.substring(0, 2) || 'OP'}
            </div>
            
            <div className="text-center sm:text-left space-y-1.5 mt-2 sm:mt-4">
              <h1 className="text-xl font-bold font-sans tracking-tight text-[#2d2d28] dark:text-[#f4f4f5]">
                {user?.displayName || 'SignSense Operator'}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#7a7a6a] dark:text-[#a1a1aa] font-sans">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#7c8d7c]" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#7c8d7c]" />
                  Member since: {creationDate}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="w-full md:w-auto py-2.5 px-5 border border-rose-200 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[#a36b5e] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            id="profile-logout-btn"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Workspace</span>
          </button>

        </div>

      </div>

      {/* Main Grid: Info Cards, Goal setting, and data synchronization backup center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="profile-dashboard-grid">
        
        {/* Left Side: General Profile Settings & Firestore Sync Forms */}
        <div className="lg:col-span-7 space-y-6" id="profile-left-column">
          
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5" id="settings-card">
            
            <div className="border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4">
              <h2 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#7c8d7c]" />
                Interactive Profile Preferences
              </h2>
              <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">Customize your member coordinates and daily signs goals stored directly in the sandbox database.</p>
            </div>

            {settingsStatus && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-semibold animate-fadeIn" id="settings-status">
                {settingsStatus}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4" id="preferences-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono block">
                    Public Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#fdfcf9] dark:bg-[#121214] border border-[#e0e4db] dark:border-[#2d2d32] rounded-xl text-xs font-semibold text-[#2d2d28] dark:text-white py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#7c8d7c] transition-all font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono block">
                    Daily Signs Study Goal
                  </label>
                  <select
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Number(e.target.value))}
                    className="w-full bg-[#fdfcf9] dark:bg-[#121214] border border-[#e0e4db] dark:border-[#2d2d32] rounded-xl text-xs font-semibold text-[#2d2d28] dark:text-white py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#7c8d7c] transition-all font-sans"
                  >
                    <option value={3}>3 Signs / day</option>
                    <option value={5}>5 Signs / day</option>
                    <option value={10}>10 Signs / day</option>
                    <option value={15}>15 Signs / day</option>
                    <option value={20}>20 Signs / day</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono block">
                    ASL Experience Tier
                  </label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full bg-[#fdfcf9] dark:bg-[#121214] border border-[#e0e4db] dark:border-[#2d2d32] rounded-xl text-xs font-semibold text-[#2d2d28] dark:text-white py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#7c8d7c] transition-all font-sans"
                  >
                    <option value="Beginner">Beginner level (A-Z Alphabets)</option>
                    <option value="Intermediate">Intermediate level (Words & Signs)</option>
                    <option value="Expert">Expert level (Real-time sentence parser)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono block">
                    Target Practice Time
                  </label>
                  <select
                    value={practiceTime}
                    onChange={(e) => setPracticeTime(e.target.value)}
                    className="w-full bg-[#fdfcf9] dark:bg-[#121214] border border-[#e0e4db] dark:border-[#2d2d32] rounded-xl text-xs font-semibold text-[#2d2d28] dark:text-white py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#7c8d7c] transition-all font-sans"
                  >
                    <option value="Morning">Morning Routines (6:00 AM - 11:59 AM)</option>
                    <option value="Afternoon">Afternoon Breaks (12:00 PM - 5:59 PM)</option>
                    <option value="Evening">Evening Focus hours (6:00 PM - 11:59 PM)</option>
                  </select>
                </div>

              </div>

              <div className="pt-3 border-t border-[#f0f2ee] dark:border-[#2d2d32] flex items-center justify-between gap-4">
                <span className="text-[10px] text-[#9a9a8a] dark:text-zinc-500 font-mono uppercase font-semibold">
                  {syncing ? "Fetching database connection..." : "Database location: Asia-Southeast1"}
                </span>
                
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="py-2 px-4 bg-[#7c8d7c] dark:bg-[#4a5c4e] text-white hover:bg-[#6c7d6c] dark:hover:bg-[#3d4c3f] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-40"
                  id="profile-save-btn"
                >
                  {savingSettings ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{savingSettings ? "Saving Settings..." : "Save Preferences"}</span>
                </button>
              </div>

            </form>

          </div>

          {/* Cloud Database Backup & Restore Center */}
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5" id="profile-cloud-persistence">
            <div className="border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4">
              <h2 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] flex items-center gap-2">
                <CloudUpload className="w-5 h-5 text-[#a36b5e]" />
                Durable Cloud Persistence Center
              </h2>
              <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">Securely backup and synchronize local workspace practice sheets, sessions logging, and recorded custom landmarks.</p>
            </div>

            {backupStatus && (
              <div className="bg-[#fcf7f2] dark:bg-[#2b1f1a]/40 border border-[#ebdcd1]/60 dark:border-amber-900/40 text-[#a36b5e] dark:text-amber-400 p-3 rounded-xl text-xs font-medium animate-fadeIn">
                {backupStatus}
              </div>
            )}

            {loadStatus && (
              <div className="bg-blue-50 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 p-3 rounded-xl text-xs font-medium animate-fadeIn">
                {loadStatus}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Backup Card block */}
              <div className="p-4 bg-[#fdfcf9] dark:bg-[#151518]/50 border border-[#e8e4db] dark:border-[#2d2d32] rounded-2xl space-y-3 flex flex-col justify-between" id="backup-action-block">
                <div>
                  <h3 className="text-xs font-bold text-[#2d2d28] dark:text-[#cbd5e1] uppercase tracking-wide">Sync State to Cloud</h3>
                  <p className="text-[11px] text-[#5c5c50] dark:text-[#a1a1aa] leading-relaxed mt-1">
                    Push your existing local workspace logs ({localSessions.length} sessions and {localSamples.length} recorded landmarks) to active Firestore storage.
                  </p>
                </div>
                <button
                  onClick={handleCloudBackup}
                  className="py-2.5 px-4 bg-[#ebdcd1] dark:bg-[#453730] text-[#a36b5e] dark:text-[#ebdcd1] hover:bg-[#a36b5e] hover:text-white dark:hover:bg-[#a36b5e] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#ebdcd1] dark:border-[#2d2d32]"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>Backup State</span>
                </button>
              </div>

              {/* Restore Card block */}
              <div className="p-4 bg-[#fdfcf9] dark:bg-[#151518]/50 border border-[#e8e4db] dark:border-[#2d2d32] rounded-2xl space-y-3 flex flex-col justify-between" id="restore-action-block">
                <div>
                  <h3 className="text-xs font-bold text-[#2d2d28] dark:text-[#cbd5e1] uppercase tracking-wide">Restore State from Cloud</h3>
                  <p className="text-[11px] text-[#5c5c50] dark:text-[#a1a1aa] leading-relaxed mt-1">
                    Restore previously backed up practice sheets and custom training landmarks. This action replaces current browser temporary cached structures.
                  </p>
                </div>
                <button
                  onClick={handleCloudRestore}
                  className="py-2.5 px-4 bg-[#f0f2ee] dark:bg-[#1f221f] text-[#7c8d7c] dark:text-[#cbdcbc] hover:bg-[#7c8d7c] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#e0e4db] dark:border-[#2d2d32]"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>Restore Backup</span>
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Right Side: Account Milestones & Performance stats dashboard */}
        <div className="lg:col-span-5 space-y-6" id="profile-right-column">
          
          {/* Practice Dashboard Stats Overview */}
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4" id="stats-summary-card">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#9a9a8a] dark:text-zinc-400 font-mono block">
              OPERATOR INSIGHTS
            </h2>

            <div className="grid grid-cols-2 gap-4">
              
              <div className="p-4 bg-[#fdfcf9] dark:bg-[#151518]/80 border border-[#e8e4db] dark:border-[#2d2d32] rounded-2xl flex flex-col justify-center">
                <span className="text-[10px] font-black tracking-wider text-[#7a7a6a] dark:text-[#a1a1aa] uppercase font-mono">Sessions Logged</span>
                <span className="text-2xl font-black text-[#2d2d28] dark:text-white mt-1">{localSessions.length}</span>
                <span className="text-[9px] text-[#7c8d7c] dark:text-emerald-400 font-bold mt-1">Active Tracker</span>
              </div>

              <div className="p-4 bg-[#fdfcf9] dark:bg-[#151518]/80 border border-[#e8e4db] dark:border-[#2d2d32] rounded-2xl flex flex-col justify-center">
                <span className="text-[10px] font-black tracking-wider text-[#7a7a6a] dark:text-[#a1a1aa] uppercase font-mono">Landmarks Rec</span>
                <span className="text-2xl font-black text-[#2d2d28] dark:text-white mt-1">{localSamples.length}</span>
                <span className="text-[9px] text-[#a36b5e] dark:text-amber-400 font-bold mt-1">Ready for Classifiers</span>
              </div>

            </div>

            {/* Target Goals progression gauge */}
            <div className="p-4 bg-[#fdfcf9] dark:bg-[#151518] border border-[#e8e4db] dark:border-[#2d2d32] rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="font-bold flex items-center gap-1">
                  <Target className="w-4 h-4 text-[#7c8d7c]" />
                  Active signs practicing daily:
                </span>
                <span className="font-bold font-mono text-[#7c8d7c] dark:text-emerald-400">{dailyGoal} signs goal</span>
              </div>
              <p className="text-[11px] text-[#7a7a6a] dark:text-[#a1a1aa] leading-relaxed">
                Your target is set in the cloud database to help calibrate feedback algorithms to recommend characters during auto-scans.
              </p>
            </div>

          </div>

          {/* Practice Certificate milestones */}
          <div className="bg-[#fcfdfa] dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-4" id="practice-milestone-achievements">
            <h2 className="text-sm font-bold text-[#2d2d28] dark:text-[#f4f4f5] flex items-center gap-2 pb-2 border-b border-[#f0f2ee] dark:border-[#2d2d32]">
              <Award className="w-5 h-5 text-[#7c8d7c]" />
              Study Milestones
            </h2>

            <div className="space-y-3.5">
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30 font-bold mt-0.5 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2d2d28] dark:text-[#f4f4f5]">Day 1 Sandbox Gateway</h4>
                  <p className="text-[11px] text-[#5a5a4a] dark:text-[#a1a1aa] mt-0.5">Unlocked 100% stable setup with camera visualizer coordinate rendering support.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 opacity-60">
                <div className="p-2 bg-neutral-100 dark:bg-[#1c1c1f] text-neutral-400 rounded-xl border border-neutral-200 mt-0.5 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2d2d28] dark:text-[#f4f4f5]">Dataset Collector Milestone</h4>
                  <p className="text-[11px] text-[#5a5a4a] dark:text-[#a1a1aa] mt-0.5">Collect at least 25 landmarks to qualify for direct offline client-side model trainer compiler.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 opacity-60">
                <div className="p-2 bg-neutral-100 dark:bg-[#1c1c1f] text-neutral-400 rounded-xl border border-neutral-200 mt-0.5 shrink-0">
                  <UserSquare2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2d2d28] dark:text-[#f4f4f5]">Certified Real-time ASL Master</h4>
                  <p className="text-[11px] text-[#5a5a4a] dark:text-[#a1a1aa] mt-0.5">Recognize and classify 10 separate characters sequentially with accuracy confidence counts &gt; 90%.</p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
