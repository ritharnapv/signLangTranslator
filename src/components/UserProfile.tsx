import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import CloudAutoBackupSync from './CloudAutoBackupSync';
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
  Clock,
  Camera,
  UserCheck,
  Trash2,
  Lock,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import { CollectedSample, SessionHistoryItem } from '../types';
import { ThemeSettings, COLOR_THEMES } from './ThemeCustomizer';

interface UserProfileProps {
  localSessions: SessionHistoryItem[];
  localSamples: CollectedSample[];
  onRestoreSessions: (sessions: SessionHistoryItem[]) => void;
  onRestoreSamples: (samples: CollectedSample[]) => void;
  onSignOut: () => void;
  themeSettings?: ThemeSettings;
  onUpdateThemeSettings?: (settings: Partial<ThemeSettings>) => void;
  onOpenThemeCustomizer?: () => void;
}

export default function UserProfile({ 
  localSessions, 
  localSamples, 
  onRestoreSessions, 
  onRestoreSamples,
  onSignOut,
  themeSettings,
  onUpdateThemeSettings,
  onOpenThemeCustomizer
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

  // Biometric Face ID states
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [enrolledAt, setEnrolledAt] = useState<string>('');
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [enrollLoading, setEnrollLoading] = useState<boolean>(false);
  const [enrollStatus, setEnrollStatus] = useState<string | null>(null);
  const [enrollCameraActive, setEnrollCameraActive] = useState<boolean>(false);
  const enrollVideoRef = useRef<HTMLVideoElement | null>(null);

  // Check existing Face ID enrollment on mount
  useEffect(() => {
    if (!user) return;
    const checkEnrollment = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'face_profiles', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsEnrolled(true);
          if (data.enrolledAt) {
            setEnrolledAt(new Date(data.enrolledAt).toLocaleDateString(undefined, {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }));
          }
        }
      } catch (err) {
        console.error("Error loading Face ID enrollment status:", err);
      }
    };
    checkEnrollment();
  }, [user]);

  // Set up camera session for Face ID enrollment view finder
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    if (isEnrolling) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false
          });
          activeStream = stream;
          if (enrollVideoRef.current) {
            enrollVideoRef.current.srcObject = stream;
          }
          setEnrollCameraActive(true);
        } catch (err: any) {
          console.error("Error starting camera for Face ID Enrollment:", err);
          setEnrollStatus("Failed to access camera. Please allow webcam permission.");
          setEnrollCameraActive(false);
        }
      };
      startCamera();
    } else {
      setEnrollCameraActive(false);
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isEnrolling]);

  const handleEnrollFace = async () => {
    if (!enrollVideoRef.current || !user) return;
    setEnrollLoading(true);
    setEnrollStatus("Capturing face snapshot...");

    try {
      // 1. Capture snapshot from video
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not construct 2D context canvas.");
      
      ctx.drawImage(enrollVideoRef.current, 0, 0, 640, 480);
      const snapshotBase64 = canvas.toDataURL('image/jpeg', 0.85);

      setEnrollStatus("Analyzing facial landmarks & storing biometric signature...");

      // 2. Obtain Firebase client auth ID token to verify backend request
      const idToken = await user.getIdToken();

      // Submit enrollment package to backend
      const response = await fetch('/api/face-auth/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          email: user.email,
          image: snapshotBase64
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Face enrollment registration rejected by security center.");
      }

      setIsEnrolled(true);
      setEnrolledAt(new Date().toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }));
      setEnrollStatus("Face ID Enrollment Secured successfully!");
      setIsEnrolling(false);
      setTimeout(() => setEnrollStatus(null), 3500);
    } catch (err: any) {
      console.error("Face ID Enrollment error:", err);
      setEnrollStatus(`Enrollment Error: ${err.message || err}`);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleDeleteFaceId = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to permanently delete your registered Face ID biometric template? This cannot be undone.")) return;
    
    setEnrollLoading(true);
    setEnrollStatus("Deleting biometric record...");

    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'face_profiles', user.uid));
      setIsEnrolled(false);
      setEnrolledAt('');
      setEnrollStatus("Biometric Face ID deleted.");
      setTimeout(() => setEnrollStatus(null), 3000);
    } catch (err: any) {
      console.error("Face ID deletion error:", err);
      setEnrollStatus(`Deletion error: ${err.message || err}`);
    } finally {
      setEnrollLoading(false);
    }
  };

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

          {/* Visual Theme & Appearance Customization Card */}
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5" id="profile-theme-settings-card">
            <div className="border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[var(--color-primary)]" />
                  Theme Customization
                </h2>
                <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">Customize dark mode, color palette presets, and UI border styles</p>
              </div>

              {onOpenThemeCustomizer && (
                <button
                  type="button"
                  onClick={onOpenThemeCustomizer}
                  className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Open Full Customizer</span>
                </button>
              )}
            </div>

            {themeSettings && onUpdateThemeSettings && (
              <div className="space-y-4">
                {/* Mode Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono block">
                    Appearance Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onUpdateThemeSettings({ themeMode: 'light' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        themeSettings.themeMode === 'light'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 shadow-xs'
                          : 'bg-[#fdfcf9] dark:bg-[#121214] border-[#e0e4db] dark:border-[#2d2d32] text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateThemeSettings({ themeMode: 'dark' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        themeSettings.themeMode === 'dark'
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-900 dark:text-indigo-300 shadow-xs'
                          : 'bg-[#fdfcf9] dark:bg-[#121214] border-[#e0e4db] dark:border-[#2d2d32] text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-indigo-400" />
                      <span>Dark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateThemeSettings({ themeMode: 'system' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        themeSettings.themeMode === 'system'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-300 shadow-xs'
                          : 'bg-[#fdfcf9] dark:bg-[#121214] border-[#e0e4db] dark:border-[#2d2d32] text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span>System Auto</span>
                    </button>
                  </div>
                </div>

                {/* Color Palette Quick Swatch */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono block">
                    Active Color Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COLOR_THEMES.map((theme) => {
                      const isSelected = themeSettings.colorTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => onUpdateThemeSettings({ colorTheme: theme.id })}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-white dark:bg-[#121214] border-2 shadow-xs'
                              : 'bg-[#fdfcf9] dark:bg-[#121214]/60 border-[#e0e4db] dark:border-[#2d2d32] opacity-80 hover:opacity-100'
                          }`}
                          style={{ borderColor: isSelected ? theme.primaryColor : undefined }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{theme.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cloud Database Backup & Restore Center */}
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5" id="profile-cloud-persistence">
            <CloudAutoBackupSync
              user={user}
              localSessions={localSessions}
              localSamples={localSamples}
              themeSettings={themeSettings}
              onRestoreData={(snapshot) => {
                if (snapshot.data) {
                  if (snapshot.data.sessions) onRestoreSessions(snapshot.data.sessions);
                  if (snapshot.data.samples) onRestoreSamples(snapshot.data.samples);
                }
              }}
            />
          </div>

          {/* Secure Biometric Face ID Configuration Card */}
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5 animate-fadeIn" id="face-id-enroll-card">
            <div className="border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#7c8d7c]" />
                  Secure Biometric Face ID
                </h2>
                <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
                  Register your facial geometry template to log in securely with your webcam from any machine.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#f0f2ee] dark:bg-[#151518] px-2.5 py-1 rounded-full border border-[#e0e4db] dark:border-[#2d2d32]">
                <span className={`w-2 h-2 rounded-full ${isEnrolled ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
                <span className="text-[9px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono">
                  {isEnrolled ? "Secured" : "Inactive"}
                </span>
              </div>
            </div>

            {enrollStatus && (
              <div className="bg-[#fdfcf9] dark:bg-[#151518] border border-[#e0e4db] dark:border-[#2d2d32] text-[#2d2d28] dark:text-[#cbd5e1] p-3.5 rounded-xl text-xs font-semibold font-sans animate-fadeIn" id="enroll-status-alert">
                {enrollStatus}
              </div>
            )}

            {!isEnrolling ? (
              <div className="space-y-4">
                {isEnrolled ? (
                  <div className="p-4 bg-[#fdfcf9] dark:bg-[#151518]/50 border border-[#e0e4db] dark:border-[#2d2d32] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Webcam Biometrics Registered
                      </h3>
                      <p className="text-[11px] text-[#5c5c50] dark:text-[#a1a1aa] leading-relaxed">
                        Your Face ID credentials are active and synchronized. Registered on: <strong className="font-semibold text-[#2d2d28] dark:text-white">{enrolledAt}</strong>.
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto self-stretch sm:self-center">
                      <button
                        onClick={() => setIsEnrolling(true)}
                        className="flex-1 sm:flex-initial py-2 px-3 border border-[#cbdcbc] text-[#7c8d7c] hover:bg-[#7c8d7c] hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Update Face</span>
                      </button>
                      <button
                        onClick={handleDeleteFaceId}
                        className="py-2 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#fdfcf9] dark:bg-[#151518]/50 border border-[#e0e4db] dark:border-[#2d2d32] rounded-2xl flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-neutral-100 dark:bg-[#1e1e22] border border-[#e0e4db] dark:border-[#2d2d32] rounded-full flex items-center justify-center text-neutral-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#2d2d28] dark:text-[#cbd5e1] uppercase tracking-wide">Enroll Face ID Biometrics</h3>
                      <p className="text-[11px] text-[#5c5c50] dark:text-[#a1a1aa] leading-relaxed mt-1 max-w-sm">
                        Activate biometric security logins. This creates a secure, mathematically mapped neural signature of your face using your system webcam.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEnrolling(true)}
                      className="py-2.5 px-4 bg-[#7c8d7c] dark:bg-[#4a5c4e] text-white hover:bg-[#6c7d6c] dark:hover:bg-[#3d4c3f] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Enrollment</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn" id="enrollment-webcam-panel">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono block">
                    Webcam View Finder
                  </span>
                  <div className="relative aspect-video bg-neutral-950 rounded-2xl overflow-hidden border border-[#e0e4db] dark:border-[#2d2d32] shadow-inner flex items-center justify-center">
                    {enrollCameraActive ? (
                      <video
                        ref={enrollVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="text-center p-4 text-neutral-500 font-mono text-[10px] uppercase">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7c8d7c]" />
                        Accessing Webcam Feed...
                      </div>
                    )}

                    {/* Secure Scan Lines Layer */}
                    {enrollCameraActive && (
                      <div className="absolute inset-0 pointer-events-none border border-[#7c8d7c]/20 rounded-2xl overflow-hidden">
                        <div className="w-full h-0.5 bg-[#7c8d7c] opacity-40 shadow-[0_0_8px_#7c8d7c] absolute top-0 left-0 animate-scan" />
                      </div>
                    )}

                    {enrollLoading && (
                      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-3 relative z-30">
                        <RefreshCw className="w-10 h-10 animate-spin text-[#7c8d7c]" />
                        <span className="text-xs font-bold text-white tracking-wide uppercase">Registering Face Signature</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setIsEnrolling(false)}
                    disabled={enrollLoading}
                    className="py-2.5 px-4 border border-[#e0e4db] text-neutral-600 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-40 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnrollFace}
                    disabled={enrollLoading || !enrollCameraActive}
                    className="py-2.5 px-5 bg-[#7c8d7c] dark:bg-[#4a5c4e] text-white hover:bg-[#6c7d6c] dark:hover:bg-[#3d4c3f] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-40"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture & Enroll Face</span>
                  </button>
                </div>
              </div>
            )}
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
