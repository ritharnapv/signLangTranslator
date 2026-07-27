import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  BarChart2, 
  Database, 
  Cpu, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Filter, 
  UserPlus, 
  UserCheck, 
  UserX, 
  MoreVertical, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Download, 
  RefreshCw, 
  Zap, 
  Layers, 
  TrendingUp, 
  Clock, 
  FileText, 
  Lock, 
  Eye, 
  Award, 
  HardDrive, 
  Server, 
  Terminal, 
  Check, 
  X,
  ChevronRight,
  Globe,
  Sliders,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

// Admin User Interface
export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'editor' | 'contributor' | 'user';
  status: 'active' | 'suspended' | 'pending';
  lastActive: string;
  totalPracticed: number;
  datasetsContributed: number;
  registeredAt: string;
}

// Dataset Item Interface
export interface AdminDataset {
  id: string;
  name: string;
  ownerEmail: string;
  sampleCount: number;
  sizeKb: number;
  status: 'verified' | 'unverified' | 'flagged';
  category: string;
  qualityScore: number;
  createdAt: string;
}

// System Audit Log Interface
export interface SystemAuditLog {
  id: string;
  timestamp: string;
  event: string;
  userEmail: string;
  category: 'AUTH' | 'DATASET' | 'MODEL' | 'SYSTEM' | 'SECURITY';
  status: 'success' | 'warning' | 'error';
  ip: string;
}

// Model Class Performance
export interface ClassAccuracyMetric {
  className: string;
  accuracy: number;
  precision: number;
  recall: number;
  sampleCount: number;
}

export default function AdminDashboard() {
  // Navigation within Admin Dashboard
  const [adminTab, setAdminTab] = useState<'users' | 'analytics' | 'datasets' | 'model'>('users');
  
  // Quick status alert banner
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // 1. USER MANAGEMENT STATE & LOGIC
  // ---------------------------------------------------------------------------
  const [usersList, setUsersList] = useState<AdminUser[]>([
    {
      uid: 'usr_001',
      email: 'ritharnapv@gmail.com',
      displayName: 'Ritharna P V (Admin)',
      role: 'admin',
      status: 'active',
      lastActive: 'Just now',
      totalPracticed: 342,
      datasetsContributed: 8,
      registeredAt: '2026-01-10'
    },
    {
      uid: 'usr_002',
      email: 'alex.chen@signflow.org',
      displayName: 'Alex Chen',
      role: 'editor',
      status: 'active',
      lastActive: '12 mins ago',
      totalPracticed: 184,
      datasetsContributed: 4,
      registeredAt: '2026-02-14'
    },
    {
      uid: 'usr_003',
      email: 'sarah.m@accessibility.edu',
      displayName: 'Sarah Miller',
      role: 'contributor',
      status: 'active',
      lastActive: '2 hours ago',
      totalPracticed: 95,
      datasetsContributed: 2,
      registeredAt: '2026-03-01'
    },
    {
      uid: 'usr_004',
      email: 'guest_user_99@dev.io',
      displayName: 'Guest Demo User',
      role: 'user',
      status: 'active',
      lastActive: '1 day ago',
      totalPracticed: 28,
      datasetsContributed: 0,
      registeredAt: '2026-04-12'
    },
    {
      uid: 'usr_005',
      email: 'suspicious_bot@spam.net',
      displayName: 'Unverified Crawler',
      role: 'user',
      status: 'suspended',
      lastActive: '5 days ago',
      totalPracticed: 2,
      datasetsContributed: 0,
      registeredAt: '2026-05-18'
    }
  ]);

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor' | 'contributor' | 'user'>('user');

  // Try loading users from Firestore if available
  useEffect(() => {
    const fetchFirestoreUsers = async () => {
      try {
        if (!db) return;
        const querySnapshot = await getDocs(collection(db, 'users'));
        if (!querySnapshot.empty) {
          const loadedUsers: AdminUser[] = [];
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loadedUsers.push({
              uid: docSnap.id,
              email: data.email || `${docSnap.id}@registered.app`,
              displayName: data.displayName || 'Registered User',
              role: data.role || 'user',
              status: data.status || 'active',
              lastActive: data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : 'Recently',
              totalPracticed: data.dailySignsGoal ? data.dailySignsGoal * 5 : 24,
              datasetsContributed: 1,
              registeredAt: data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : '2026-06-01'
            });
          });
          if (loadedUsers.length > 0) {
            setUsersList(prev => {
              const combined = [...loadedUsers];
              prev.forEach(p => {
                if (!combined.some(c => c.uid === p.uid)) {
                  combined.push(p);
                }
              });
              return combined;
            });
          }
        }
      } catch (err) {
        console.warn('Firestore user fetch note:', err);
      }
    };
    fetchFirestoreUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchesSearch = u.displayName.toLowerCase().includes(userSearch.toLowerCase()) || 
                            u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                            u.uid.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersList, userSearch, roleFilter, statusFilter]);

  const handleUpdateRole = (uid: string, newRole: 'admin' | 'editor' | 'contributor' | 'user') => {
    setUsersList(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    if (selectedUser && selectedUser.uid === uid) {
      setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
    }
    showToast(`Updated user role to ${newRole.toUpperCase()}`);
  };

  const handleToggleUserStatus = (uid: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.uid === uid) {
        const nextStatus = u.status === 'active' ? 'suspended' : 'active';
        showToast(`Account status set to ${nextStatus.toUpperCase()}`, nextStatus === 'active' ? 'success' : 'info');
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleDeleteUser = (uid: string) => {
    setUsersList(prev => prev.filter(u => u.uid !== uid));
    if (selectedUser?.uid === uid) setSelectedUser(null);
    showToast('User account successfully purged', 'info');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    const created: AdminUser = {
      uid: `usr_${Date.now().toString().slice(-4)}`,
      email: newUserEmail,
      displayName: newUserName.trim() || newUserEmail.split('@')[0],
      role: newUserRole,
      status: 'active',
      lastActive: 'Just registered',
      totalPracticed: 0,
      datasetsContributed: 0,
      registeredAt: new Date().toISOString().split('T')[0]
    };
    setUsersList(prev => [created, ...prev]);
    setNewUserEmail('');
    setNewUserName('');
    setIsAddUserModalOpen(false);
    showToast(`Registered new user ${created.displayName}`);
  };

  // ---------------------------------------------------------------------------
  // 2. ANALYTICS & AUDIT LOGS STATE & LOGIC
  // ---------------------------------------------------------------------------
  const activityData = [
    { date: 'Mon', translations: 120, gestureInferences: 450, latencyMs: 14 },
    { date: 'Tue', translations: 190, gestureInferences: 620, latencyMs: 13 },
    { date: 'Wed', translations: 240, gestureInferences: 810, latencyMs: 15 },
    { date: 'Thu', translations: 310, gestureInferences: 980, latencyMs: 12 },
    { date: 'Fri', translations: 420, gestureInferences: 1240, latencyMs: 11 },
    { date: 'Sat', translations: 510, gestureInferences: 1560, latencyMs: 10 },
    { date: 'Sun', translations: 680, gestureInferences: 1890, latencyMs: 12 }
  ];

  const deviceDistributionData = [
    { name: 'Desktop Camera', value: 55, color: '#7c8d7c' },
    { name: 'Mobile Rear Cam', value: 25, color: '#0d9488' },
    { name: 'Mobile Front Cam', value: 15, color: '#e0a96d' },
    { name: 'Offline Sandbox', value: 5, color: '#5c3c35' }
  ];

  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([
    {
      id: 'log_901',
      timestamp: '2026-07-27 16:42:10',
      event: 'MODEL_INFERENCE_OPTIMIZED',
      userEmail: 'ritharnapv@gmail.com',
      category: 'MODEL',
      status: 'success',
      ip: '192.168.1.42'
    },
    {
      id: 'log_902',
      timestamp: '2026-07-27 15:30:05',
      event: 'DATASET_VERIFIED_ASL_ALPHABET',
      userEmail: 'alex.chen@signflow.org',
      category: 'DATASET',
      status: 'success',
      ip: '10.0.0.15'
    },
    {
      id: 'log_903',
      timestamp: '2026-07-27 14:15:22',
      event: 'USER_ROLE_PROMOTED_ADMIN',
      userEmail: 'ritharnapv@gmail.com',
      category: 'SECURITY',
      status: 'success',
      ip: '192.168.1.42'
    },
    {
      id: 'log_904',
      timestamp: '2026-07-27 12:00:41',
      event: 'EXCESSIVE_INFERENCE_BURST',
      userEmail: 'suspicious_bot@spam.net',
      category: 'SECURITY',
      status: 'warning',
      ip: '185.220.101.4'
    },
    {
      id: 'log_905',
      timestamp: '2026-07-27 09:12:33',
      event: 'OFFLINE_CACHE_SYNCHRONIZED',
      userEmail: 'sarah.m@accessibility.edu',
      category: 'SYSTEM',
      status: 'success',
      ip: '172.16.0.8'
    }
  ]);

  const [logSearch, setLogSearch] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(l => 
      l.event.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.category.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [auditLogs, logSearch]);

  const exportAuditReport = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Exported audit report JSON');
  };

  // ---------------------------------------------------------------------------
  // 3. DATASET MONITORING STATE & LOGIC
  // ---------------------------------------------------------------------------
  const [datasetsList, setDatasetsList] = useState<AdminDataset[]>([
    {
      id: 'ds_asl_alphabet_v2',
      name: 'ASL Alphabet Master Standard',
      ownerEmail: 'ritharnapv@gmail.com',
      sampleCount: 1250,
      sizeKb: 4850,
      status: 'verified',
      category: 'Alphabet',
      qualityScore: 99.2,
      createdAt: '2026-01-15'
    },
    {
      id: 'ds_medical_phrases',
      name: 'Emergency & Medical Signs',
      ownerEmail: 'sarah.m@accessibility.edu',
      sampleCount: 420,
      sizeKb: 1820,
      status: 'verified',
      category: 'Healthcare',
      qualityScore: 96.8,
      createdAt: '2026-02-20'
    },
    {
      id: 'ds_custom_numbers_09',
      name: 'Numeric Signs 0-9 High Precision',
      ownerEmail: 'alex.chen@signflow.org',
      sampleCount: 380,
      sizeKb: 1400,
      status: 'verified',
      category: 'Numbers',
      qualityScore: 98.1,
      createdAt: '2026-03-10'
    },
    {
      id: 'ds_user_submissions_raw',
      name: 'Crowdsourced Classroom Expressions',
      ownerEmail: 'guest_user_99@dev.io',
      sampleCount: 190,
      sizeKb: 890,
      status: 'unverified',
      category: 'Community',
      qualityScore: 84.5,
      createdAt: '2026-06-02'
    },
    {
      id: 'ds_noisy_hand_landmarks',
      name: 'Uncalibrated Lighting Samples',
      ownerEmail: 'suspicious_bot@spam.net',
      sampleCount: 45,
      sizeKb: 210,
      status: 'flagged',
      category: 'Experimental',
      qualityScore: 42.0,
      createdAt: '2026-06-12'
    }
  ]);

  const [datasetSearch, setDatasetSearch] = useState('');
  const [selectedDatasetInspect, setSelectedDatasetInspect] = useState<AdminDataset | null>(null);

  const filteredDatasets = useMemo(() => {
    return datasetsList.filter(d => 
      d.name.toLowerCase().includes(datasetSearch.toLowerCase()) ||
      d.ownerEmail.toLowerCase().includes(datasetSearch.toLowerCase()) ||
      d.category.toLowerCase().includes(datasetSearch.toLowerCase())
    );
  }, [datasetsList, datasetSearch]);

  const handleVerifyDataset = (id: string) => {
    setDatasetsList(prev => prev.map(d => d.id === id ? { ...d, status: 'verified', qualityScore: Math.max(d.qualityScore, 95.0) } : d));
    showToast(`Dataset ${id} verified and approved`);
  };

  const handleFlagDataset = (id: string) => {
    setDatasetsList(prev => prev.map(d => d.id === id ? { ...d, status: 'flagged' } : d));
    showToast(`Dataset ${id} flagged for quality audit`, 'info');
  };

  const handleDeleteDataset = (id: string) => {
    setDatasetsList(prev => prev.filter(d => d.id !== id));
    if (selectedDatasetInspect?.id === id) setSelectedDatasetInspect(null);
    showToast(`Dataset ${id} removed from system storage`, 'info');
  };

  // ---------------------------------------------------------------------------
  // 4. MODEL PERFORMANCE STATS STATE & LOGIC
  // ---------------------------------------------------------------------------
  const classAccuracyMetrics: ClassAccuracyMetric[] = [
    { className: 'Letter A', accuracy: 99.4, precision: 99.1, recall: 99.7, sampleCount: 140 },
    { className: 'Letter B', accuracy: 98.7, precision: 98.2, recall: 99.1, sampleCount: 135 },
    { className: 'Letter C', accuracy: 97.9, precision: 97.5, recall: 98.3, sampleCount: 120 },
    { className: 'Hello Sign', accuracy: 99.1, precision: 99.0, recall: 99.2, sampleCount: 180 },
    { className: 'Thank You', accuracy: 96.5, precision: 95.8, recall: 97.2, sampleCount: 110 },
    { className: 'Help / Emergency', accuracy: 99.8, precision: 99.7, recall: 99.9, sampleCount: 210 }
  ];

  const [modelStatus, setModelStatus] = useState({
    activeVersion: 'v2.4.0-Production-tfjs',
    accuracy: 98.4,
    loss: 0.024,
    latencyMs: 12,
    fps: 60,
    tensorMemoryMb: 42.8,
    backend: 'WebGL (GPU Accelerated)',
    isRetraining: false
  });

  const handleTriggerRetrain = () => {
    setModelStatus(prev => ({ ...prev, isRetraining: true }));
    showToast('Initiating global TF.js model retraining pipeline...', 'info');
    setTimeout(() => {
      setModelStatus(prev => ({
        ...prev,
        isRetraining: false,
        accuracy: 98.9,
        loss: 0.018,
        activeVersion: `v2.4.1-Production-tfjs`
      }));
      showToast('Global AI gesture model successfully retrained and deployed!');
    }, 3000);
  };

  const handleClearModelCache = () => {
    if (window.indexedDB) {
      window.indexedDB.deleteDatabase('tensorflow');
    }
    showToast('Local browser model cache cleared', 'info');
  };

  // ---------------------------------------------------------------------------
  // RENDER COMPONENT
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="admin-dashboard-container">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${
              notification.type === 'success' 
                ? 'bg-emerald-500/90 text-white border-emerald-400' 
                : notification.type === 'error'
                ? 'bg-rose-500/90 text-white border-rose-400'
                : 'bg-blue-600/90 text-white border-blue-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wide">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2d322d] via-[#1f221f] to-[#121412] text-white p-6 sm:p-8 border border-[#3e453e] shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>System Admin Console v3.2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Control Center & Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Manage system access permissions, review live gesture inference analytics, inspect dataset pipelines, and monitor real-time AI model performance metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10">
            <div className="px-3 py-1.5 text-center">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">System Users</p>
              <p className="text-lg font-black text-emerald-400">{usersList.length}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="px-3 py-1.5 text-center">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Datasets</p>
              <p className="text-lg font-black text-amber-400">{datasetsList.length}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="px-3 py-1.5 text-center">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">AI Accuracy</p>
              <p className="text-lg font-black text-blue-400">{modelStatus.accuracy}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="bg-white dark:bg-[#18181b] p-1.5 rounded-2xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm flex flex-wrap gap-1" id="admin-subtabs">
        {[
          { id: 'users', label: 'User Management', icon: Users, badge: usersList.length },
          { id: 'analytics', label: 'View Analytics', icon: BarChart2 },
          { id: 'datasets', label: 'Dataset Monitoring', icon: Database, badge: datasetsList.length },
          { id: 'model', label: 'Model Performance Stats', icon: Cpu }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] touch-manipulation ${
                isActive
                  ? 'bg-[#7c8d7c] dark:bg-[#4a5c4e] text-white shadow-sm'
                  : 'text-[#5a6b5a] dark:text-[#a1a1aa] hover:bg-[#f0f2ee] dark:hover:bg-white/5'
              }`}
              id={`admin-tab-${tab.id}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* 1. USER MANAGEMENT TAB */}
      {/* ===================================================================== */}
      {adminTab === 'users' && (
        <div className="space-y-6 animate-fadeIn" id="user-management-section">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-[#18181b] p-4 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name, email, UID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#7c8d7c]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="contributor">Contributor</option>
                <option value="user">Standard User</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#7c8d7c] hover:bg-[#6b7b6b] text-white text-xs font-bold shadow-sm transition-all min-h-[44px]"
                id="add-user-btn"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register User</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f9f6] dark:bg-[#202024] text-neutral-500 font-bold uppercase tracking-wider border-b border-[#e0e4db] dark:border-[#2d2d32]">
                  <tr>
                    <th className="px-6 py-4">User Info</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Practiced</th>
                    <th className="px-6 py-4">Datasets</th>
                    <th className="px-6 py-4">Last Active</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e4db] dark:divide-[#2d2d32]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                        No user accounts match your search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-[#f8f9f6]/60 dark:hover:bg-white/5 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#7c8d7c]/20 text-[#7c8d7c] font-black flex items-center justify-center uppercase">
                              {u.displayName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-neutral-900 dark:text-neutral-100">{u.displayName}</p>
                              <p className="text-[11px] text-neutral-400 font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin' 
                              ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : u.role === 'editor'
                              ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : u.role === 'contributor'
                              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            u.status === 'active' 
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' 
                              : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-neutral-700 dark:text-neutral-300">
                          {u.totalPracticed} signs
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-neutral-700 dark:text-neutral-300">
                          {u.datasetsContributed}
                        </td>
                        <td className="px-6 py-4 text-neutral-500 text-[11px]">
                          {u.lastActive}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-all"
                            title="Inspect & Edit Permissions"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u.uid)}
                            className={`p-2 rounded-xl transition-all ${
                              u.status === 'active' 
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200' 
                                : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                            }`}
                            title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                          >
                            {u.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.uid)}
                            className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-200 transition-all"
                            title="Purge User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. VIEW ANALYTICS TAB */}
      {/* ===================================================================== */}
      {adminTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn" id="view-analytics-section">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#18181b] p-5 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Translations</span>
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">2,530</p>
              <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <span>+24.8% vs last week</span>
              </p>
            </div>

            <div className="bg-white dark:bg-[#18181b] p-5 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Daily Users</span>
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">142 DAU</p>
              <p className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                <span>89% mobile touch session</span>
              </p>
            </div>

            <div className="bg-white dark:bg-[#18181b] p-5 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Average Latency</span>
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">12.4 ms</p>
              <p className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
                <span>WebGL hardware accelerated</span>
              </p>
            </div>

            <div className="bg-white dark:bg-[#18181b] p-5 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">System Uptime</span>
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600">
                  <Server className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">99.98%</p>
              <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                <span>Offline local sync fallback active</span>
              </p>
            </div>
          </div>

          {/* Activity Area Chart & Device Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Gesture Inference & Translation Traffic</h3>
                  <p className="text-xs text-neutral-500">Weekly query trends and real-time processing loads</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#f0f2ee] dark:bg-[#202024] text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                  Past 7 Days
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTranslations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c8d7c" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#7c8d7c" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInferences" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="gestureInferences" stroke="#0d9488" fillOpacity={1} fill="url(#colorInferences)" name="Hand Landmarks Inferences" />
                    <Area type="monotone" dataKey="translations" stroke="#7c8d7c" fillOpacity={1} fill="url(#colorTranslations)" name="Sentence Translations" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Camera Source Breakdown</h3>
                <p className="text-xs text-neutral-500">Device stream distributions</p>
              </div>

              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {deviceDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium truncate">{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Security & Event Audit Trail</h3>
                <p className="text-xs text-neutral-500">Real-time system interactions and security alerts</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter audit logs..."
                  className="px-3 py-2 rounded-xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs focus:outline-none"
                />
                <button
                  onClick={exportAuditReport}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f9f6] dark:bg-[#202024] text-neutral-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Event Identifier</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e4db] dark:divide-[#2d2d32]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#f8f9f6]/60 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-neutral-500 text-[11px]">{log.timestamp}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {log.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold font-mono text-neutral-800 dark:text-neutral-200">
                        {log.event}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{log.userEmail}</td>
                      <td className="px-4 py-3 font-mono text-neutral-400 text-[11px]">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. DATASET MONITORING TAB */}
      {/* ===================================================================== */}
      {adminTab === 'datasets' && (
        <div className="space-y-6 animate-fadeIn" id="dataset-monitoring-section">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-[#18181b] p-4 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
              <input
                type="text"
                value={datasetSearch}
                onChange={(e) => setDatasetSearch(e.target.value)}
                placeholder="Search datasets, owner, category..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#7c8d7c]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-500">
                Total Datasets: <strong className="text-neutral-900 dark:text-neutral-100 font-mono">{datasetsList.length}</strong>
              </span>
            </div>
          </div>

          {/* Datasets Grid / Table */}
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f9f6] dark:bg-[#202024] text-neutral-500 font-bold uppercase tracking-wider border-b border-[#e0e4db] dark:border-[#2d2d32]">
                  <tr>
                    <th className="px-6 py-4">Dataset Name & ID</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Landmarks Samples</th>
                    <th className="px-6 py-4">Storage Size</th>
                    <th className="px-6 py-4">Quality Score</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e4db] dark:divide-[#2d2d32]">
                  {filteredDatasets.map((ds) => (
                    <tr key={ds.id} className="hover:bg-[#f8f9f6]/60 dark:hover:bg-white/5 transition-all">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-neutral-100">{ds.name}</p>
                          <p className="text-[11px] text-neutral-400 font-mono">{ds.id} • {ds.ownerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {ds.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        {ds.sampleCount} frames
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-600 dark:text-neutral-400">
                        {(ds.sizeKb / 1024).toFixed(2)} MB
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={ds.qualityScore > 90 ? 'text-emerald-600' : ds.qualityScore > 75 ? 'text-amber-600' : 'text-rose-600'}>
                          {ds.qualityScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          ds.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : ds.status === 'flagged'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}>
                          {ds.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedDatasetInspect(ds)}
                          className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-all"
                          title="Inspect Coordinates Sample"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {ds.status !== 'verified' && (
                          <button
                            onClick={() => handleVerifyDataset(ds.id)}
                            className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-all"
                            title="Verify & Approve Dataset"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {ds.status !== 'flagged' && (
                          <button
                            onClick={() => handleFlagDataset(ds.id)}
                            className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 transition-all"
                            title="Flag Dataset"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDataset(ds.id)}
                          className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-200 transition-all"
                          title="Purge Dataset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. MODEL PERFORMANCE STATS TAB */}
      {/* ===================================================================== */}
      {adminTab === 'model' && (
        <div className="space-y-6 animate-fadeIn" id="model-performance-section">
          {/* Active Model Summary Banner */}
          <div className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-lg text-neutral-900 dark:text-neutral-100">
                  {modelStatus.activeVersion}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 font-mono">
                Engine: @tensorflow/tfjs • Acceleration: {modelStatus.backend}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleTriggerRetrain}
                disabled={modelStatus.isRetraining}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 min-h-[44px]"
              >
                <RefreshCw className={`w-4 h-4 ${modelStatus.isRetraining ? 'animate-spin' : ''}`} />
                <span>{modelStatus.isRetraining ? 'Retraining Baseline...' : 'Trigger Global Retrain'}</span>
              </button>

              <button
                onClick={handleClearModelCache}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all min-h-[44px]"
              >
                <HardDrive className="w-4 h-4" />
                <span>Clear IndexedDB Cache</span>
              </button>
            </div>
          </div>

          {/* Key Model KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#18181b] p-5 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Overall Accuracy</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{modelStatus.accuracy}%</p>
              <p className="text-[10px] text-neutral-400 mt-1">Cross-validation score</p>
            </div>

            <div className="bg-white dark:bg-[#18181b] p-5 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Categorical Loss</p>
              <p className="text-3xl font-black text-blue-600 mt-1">{modelStatus.loss}</p>
              <p className="text-[10px] text-neutral-400 mt-1">Sparse categorical cross-entropy</p>
            </div>

            <div className="bg-white dark:bg-[#18181b] p-5 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Inference Latency</p>
              <p className="text-3xl font-black text-purple-600 mt-1">{modelStatus.latencyMs} ms</p>
              <p className="text-[10px] text-neutral-400 mt-1">~{modelStatus.fps} FPS real-time tracking</p>
            </div>

            <div className="bg-white dark:bg-[#18181b] p-5 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tensor Memory</p>
              <p className="text-3xl font-black text-amber-600 mt-1">{modelStatus.tensorMemoryMb} MB</p>
              <p className="text-[10px] text-neutral-400 mt-1">WebGL buffer allocated</p>
            </div>
          </div>

          {/* Class Accuracy & Precision Bar Chart */}
          <div className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Sign Class Accuracy & Precision Breakdown</h3>
              <p className="text-xs text-neutral-500">Per-sign landmark recognition performance metrics</p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classAccuracyMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                  <YAxis domain={[90, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#7c8d7c" name="Accuracy %" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="precision" fill="#0d9488" name="Precision %" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="recall" fill="#e0a96d" name="Recall %" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* USER INSPECTION & ROLE EDIT MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#18181b] border border-[#e0e4db] dark:border-[#2d2d32] rounded-3xl p-6 w-full max-w-lg space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-[#e0e4db] dark:border-[#2d2d32] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#7c8d7c]/20 text-[#7c8d7c] font-black flex items-center justify-center uppercase">
                    {selectedUser.displayName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">{selectedUser.displayName}</h3>
                    <p className="text-xs text-neutral-400 font-mono">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-500 font-bold uppercase text-[10px] mb-1">Assigned System Role</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => handleUpdateRole(selectedUser.uid, e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] font-bold focus:outline-none"
                  >
                    <option value="user">Standard User (Practice & Translate)</option>
                    <option value="contributor">Contributor (Record & Upload Datasets)</option>
                    <option value="editor">Editor (Verify & Edit Public Signs)</option>
                    <option value="admin">Admin (Full Control Center Access)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-[#f8f9f6] dark:bg-[#202024] rounded-2xl border border-[#e0e4db] dark:border-[#2d2d32]">
                  <div>
                    <p className="text-neutral-400 text-[10px] font-bold uppercase">Account UID</p>
                    <p className="font-mono text-neutral-800 dark:text-neutral-200 font-bold truncate">{selectedUser.uid}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-[10px] font-bold uppercase">Registered Date</p>
                    <p className="font-mono text-neutral-800 dark:text-neutral-200 font-bold">{selectedUser.registeredAt}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-[10px] font-bold uppercase">Total Signs Practiced</p>
                    <p className="font-mono text-neutral-800 dark:text-neutral-200 font-bold">{selectedUser.totalPracticed}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-[10px] font-bold uppercase">Datasets Shared</p>
                    <p className="font-mono text-neutral-800 dark:text-neutral-200 font-bold">{selectedUser.datasetsContributed}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#e0e4db] dark:border-[#2d2d32] pt-4">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTER USER MODAL */}
      <AnimatePresence>
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#18181b] border border-[#e0e4db] dark:border-[#2d2d32] rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#e0e4db] dark:border-[#2d2d32] pb-3">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#7c8d7c]" />
                  <span>Register User Account</span>
                </h3>
                <button onClick={() => setIsAddUserModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-500 font-bold uppercase text-[10px] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@organization.com"
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 font-bold uppercase text-[10px] mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 font-bold uppercase text-[10px] mb-1">Assign Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] font-bold focus:outline-none"
                  >
                    <option value="user">Standard User</option>
                    <option value="contributor">Contributor</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#7c8d7c] text-white font-bold hover:bg-[#6b7b6b]"
                  >
                    Register Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DATASET SAMPLE INSPECTOR MODAL */}
      <AnimatePresence>
        {selectedDatasetInspect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#18181b] border border-[#e0e4db] dark:border-[#2d2d32] rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#e0e4db] dark:border-[#2d2d32] pb-3">
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">{selectedDatasetInspect.name}</h3>
                  <p className="text-xs text-neutral-400 font-mono">{selectedDatasetInspect.id}</p>
                </div>
                <button onClick={() => setSelectedDatasetInspect(null)} className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#f8f9f6] dark:bg-[#202024] rounded-2xl border border-[#e0e4db] dark:border-[#2d2d32] font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                  <p><strong>Owner:</strong> {selectedDatasetInspect.ownerEmail}</p>
                  <p><strong>Category:</strong> {selectedDatasetInspect.category}</p>
                  <p><strong>Frame Samples:</strong> {selectedDatasetInspect.sampleCount}</p>
                  <p><strong>Quality Score:</strong> {selectedDatasetInspect.qualityScore}%</p>
                </div>

                <p className="font-bold text-neutral-500 uppercase text-[10px]">Landmark Vector Schema Preview</p>
                <div className="p-3 bg-[#18181b] text-emerald-400 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-36">
                  {`{\n  "landmarksCount": 21,\n  "dimension": "3D (x, y, z)",\n  "sampleFrame": [\n    {"x": 0.512, "y": 0.814, "z": -0.012},\n    {"x": 0.498, "y": 0.780, "z": -0.024}\n  ]\n}`}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#e0e4db] dark:border-[#2d2d32]">
                <button
                  onClick={() => setSelectedDatasetInspect(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
