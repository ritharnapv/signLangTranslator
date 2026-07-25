import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, WifiOff, HardDrive, Cpu, RefreshCw, CheckCircle2, AlertTriangle, 
  Database, RefreshCcw, DownloadCloud, Zap, ShieldCheck, Layers, HelpCircle, ArrowUpRight
} from 'lucide-react';
import { 
  getOfflineModelDetails, 
  ensureBaselineModelCached, 
  precacheMediaPipeAssets, 
  ModelCacheStatus 
} from '../lib/offlineModelCache';
import { 
  getOfflineSyncQueue, 
  syncOfflineDataToCloud, 
  getLastSyncedAt, 
  OfflineQueueItem 
} from '../lib/offlineSync';

interface OfflineModeManagerProps {
  isOnline: boolean;
  onSimulateOfflineToggle?: (forcedOffline: boolean) => void;
  forcedOffline?: boolean;
}

export default function OfflineModeManager({
  isOnline,
  onSimulateOfflineToggle,
  forcedOffline = false
}: OfflineModeManagerProps) {
  const [modelDetails, setModelDetails] = useState<ModelCacheStatus | null>(null);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(getLastSyncedAt());
  const [isCachingModel, setIsCachingModel] = useState<boolean>(false);
  const [isPrecachingWasm, setIsPrecachingWasm] = useState<boolean>(false);
  const [wasmProgress, setWasmProgress] = useState<{ msg: string; percent: number }>({ msg: '', percent: 0 });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadStatus = async () => {
    const details = await getOfflineModelDetails();
    setModelDetails(details);
    setQueue(getOfflineSyncQueue());
    setLastSynced(getLastSyncedAt());
  };

  useEffect(() => {
    loadStatus();
  }, [isOnline]);

  const handleCacheModel = async () => {
    setIsCachingModel(true);
    setSyncFeedback(null);
    try {
      const ok = await ensureBaselineModelCached(true);
      if (ok) {
        setSyncFeedback("Successfully compiled & cached TensorFlow.js model to browser IndexedDB!");
        await loadStatus();
      } else {
        setSyncFeedback("Failed to write model to IndexedDB. Check browser storage permissions.");
      }
    } catch (err: any) {
      setSyncFeedback(`Model caching error: ${err.message || err}`);
    } finally {
      setIsCachingModel(false);
    }
  };

  const handlePrecacheWasm = async () => {
    setIsPrecachingWasm(true);
    setSyncFeedback(null);
    try {
      const ok = await precacheMediaPipeAssets((msg, percent) => {
        setWasmProgress({ msg, percent });
      });
      if (ok) {
        setSyncFeedback("All MediaPipe WASM and AI vision components are precached in CacheStorage!");
        await loadStatus();
      } else {
        setSyncFeedback("MediaPipe WASM precaching encountered errors.");
      }
    } catch (err: any) {
      setSyncFeedback(`WASM precache exception: ${err.message || err}`);
    } finally {
      setIsPrecachingWasm(false);
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline && !forcedOffline) {
      setSyncFeedback("Cannot sync while offline. Reconnect to the internet first.");
      return;
    }
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncOfflineDataToCloud();
      if (res.syncedCount > 0) {
        setSyncFeedback(`Cloud sync complete! Successfully synced ${res.syncedCount} items.`);
      } else {
        setSyncFeedback("Cloud database is fully up to date! No pending changes queued.");
      }
      await loadStatus();
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const activeOnlineState = isOnline && !forcedOffline;

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans p-2">
      {/* Network & Offline Status Banner */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${
        activeOnlineState
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
          : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${
            activeOnlineState
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
          }`}>
            {activeOnlineState ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg tracking-tight">
                {activeOnlineState ? 'Online Mode Active' : 'Offline Mode Active'}
              </h3>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                activeOnlineState 
                  ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100'
                  : 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100'
              }`}>
                {activeOnlineState ? 'Connected to Cloud' : 'Isolated Environment'}
              </span>
            </div>
            <p className="text-xs opacity-85 mt-1 leading-relaxed max-w-xl">
              {activeOnlineState
                ? 'Your device is connected. All camera landmarks, gesture models, and local datasets are automatically synced with Firestore.'
                : 'No internet connection detected. The system is running 100% on local browser IndexedDB using client TensorFlow.js inference and offline NLP.'}
            </p>
          </div>
        </div>

        {/* Simulator toggle for testing */}
        {onSimulateOfflineToggle && (
          <div className="flex items-center gap-3 bg-white/80 dark:bg-neutral-900/80 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 self-start md:self-auto">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Simulate Offline
            </span>
            <button
              onClick={() => onSimulateOfflineToggle(!forcedOffline)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                forcedOffline ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                forcedOffline ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        )}
      </div>

      {/* Sync Status Banner */}
      {syncFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium flex items-center justify-between gap-3 shadow-md"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button 
            onClick={() => setSyncFeedback(null)}
            className="text-[10px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Main Grid: AI Model Caching & Offline Cloud Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Local AI Model Storage */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Local AI Model Cache
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  IndexedDB persistent neural classifier
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              modelDetails?.isModelCached
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
            }`}>
              {modelDetails?.isModelCached ? 'Cached in IndexedDB' : 'Baseline Memory Only'}
            </span>
          </div>

          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-700 dark:text-neutral-300">
            <div className="flex justify-between items-center py-1 border-b border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-neutral-500 dark:text-neutral-400">Model Storage:</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-[11px]">
                indexeddb://asl_trained_mlp_model
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-neutral-500 dark:text-neutral-400">Gesture Classes:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {modelDetails?.classCount || 32} Classes (A-Z, 0-5)
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-neutral-500 dark:text-neutral-400">Estimated Footprint:</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-[11px]">
                ~{modelDetails?.sizeEstimateKb || 180} KB
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-500 dark:text-neutral-400">Last Cached:</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-[11px]">
                {modelDetails?.lastUpdated ? new Date(modelDetails.lastUpdated).toLocaleTimeString() : 'Not cached yet'}
              </span>
            </div>
          </div>

          <button
            onClick={handleCacheModel}
            disabled={isCachingModel}
            className="w-full py-2.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isCachingModel ? 'animate-spin' : ''}`} />
            <span>{isCachingModel ? 'Building & Caching Model...' : 'Pre-compile & Cache Model to IndexedDB'}</span>
          </button>
        </div>

        {/* Card 2: Offline Cloud Sync Queue */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Cloud Data Sync Manager
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Firestore local cache & sync queue
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              queue.length > 0
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
            }`}>
              {queue.length > 0 ? `${queue.length} Pending` : 'All Synced'}
            </span>
          </div>

          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-700 dark:text-neutral-300">
            <div className="flex justify-between items-center py-1 border-b border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-neutral-500 dark:text-neutral-400">Pending Sync Items:</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                {queue.length} mutations queued
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-neutral-500 dark:text-neutral-400">Firestore Persistence:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                IndexedDB Persistent Cache Active
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-500 dark:text-neutral-400">Last Cloud Sync:</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-[11px]">
                {lastSynced ? new Date(lastSynced).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing || (!activeOnlineState && queue.length === 0)}
            className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing to Cloud...' : 'Sync Queued Data to Cloud Now'}</span>
          </button>
        </div>
      </div>

      {/* MediaPipe WASM Vision Pre-cacher */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                MediaPipe WASM & Vision Asset Cache
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Precache camera hand-tracking binaries for instant zero-lag offline launch
              </p>
            </div>
          </div>

          <button
            onClick={handlePrecacheWasm}
            disabled={isPrecachingWasm}
            className="py-2.5 px-5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 self-start md:self-auto"
          >
            <DownloadCloud className={`w-4 h-4 ${isPrecachingWasm ? 'animate-bounce' : ''}`} />
            <span>{isPrecachingWasm ? 'Downloading WASM Binaries...' : 'Precache MediaPipe WASM Files'}</span>
          </button>
        </div>

        {isPrecachingWasm && wasmProgress.msg && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
              <span>{wasmProgress.msg}</span>
              <span>{wasmProgress.percent}%</span>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-teal-500 h-full transition-all duration-300"
                style={{ width: `${wasmProgress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Offline Capabilities Overview */}
      <div className="bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 space-y-4">
        <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Complete Offline Mode Capabilities</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-white dark:bg-neutral-800/80 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 space-y-1">
            <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              <span>TF.js Offline Inference</span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Executes neural network predictions locally on client WebGL/WASM with 0ms server latency.
            </p>
          </div>

          <div className="p-3.5 bg-white dark:bg-neutral-800/80 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 space-y-1">
            <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Native Web Speech TTS</span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Uses system browser text-to-speech engine to speak translated signs without internet.
            </p>
          </div>

          <div className="p-3.5 bg-white dark:bg-neutral-800/80 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 space-y-1">
            <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>IndexedDB & Queue Sync</span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Saves datasets, gestures, & history offline, auto-syncing with Firestore when online.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
