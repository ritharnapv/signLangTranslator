import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Download, 
  Trash2, 
  RefreshCw, 
  Tag, 
  Search, 
  Filter, 
  Check, 
  FileJson, 
  FileSpreadsheet,
  ArrowRight,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PredictionFeedback } from '../types';

interface PredictionFeedbackManagerProps {
  currentUser?: any;
}

export default function PredictionFeedbackManager({ currentUser }: PredictionFeedbackManagerProps) {
  const [feedbackList, setFeedbackList] = useState<PredictionFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<PredictionFeedback | null>(null);

  // Load feedback from local storage and Firestore
  const fetchFeedback = async () => {
    setLoading(true);
    let items: PredictionFeedback[] = [];

    // 1. Load from local storage
    const localData = localStorage.getItem('asl_prediction_feedback');
    if (localData) {
      try {
        items = JSON.parse(localData);
      } catch (e) {
        console.warn('Failed parsing local feedback:', e);
      }
    }

    // 2. Fetch from Firestore if available
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'prediction_feedback'));
        const firestoreItems: PredictionFeedback[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreItems.push({
            id: docSnap.id,
            predictedChar: data.predictedChar || '?',
            correctLabel: data.correctLabel || '?',
            confidence: data.confidence || 0,
            predictionSource: data.predictionSource || 'Unknown',
            notes: data.notes || '',
            createdAt: data.createdAt || new Date().toISOString(),
            userId: data.userId || 'guest',
            userEmail: data.userEmail || '',
            status: data.status || 'pending_review'
          });
        });

        // Merge and deduplicate by id
        const mergedMap = new Map<string, PredictionFeedback>();
        [...items, ...firestoreItems].forEach((item) => mergedMap.set(item.id, item));
        items = Array.from(mergedMap.values());
      } catch (e) {
        console.warn('Firestore feedback fetch notice (using local):', e);
      }
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setFeedbackList(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'pending_review' | 'corrected' | 'applied') => {
    const updated = feedbackList.map((item) => item.id === id ? { ...item, status: newStatus } : item);
    setFeedbackList(updated);
    localStorage.setItem('asl_prediction_feedback', JSON.stringify(updated));

    if (db) {
      try {
        await updateDoc(doc(db, 'prediction_feedback', id), { status: newStatus });
      } catch (e) {
        console.warn('Firestore status update error:', e);
      }
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Delete this feedback item?')) return;
    const filtered = feedbackList.filter((item) => item.id !== id);
    setFeedbackList(filtered);
    localStorage.setItem('asl_prediction_feedback', JSON.stringify(filtered));

    if (db) {
      try {
        await deleteDoc(doc(db, 'prediction_feedback', id));
      } catch (e) {
        console.warn('Firestore delete error:', e);
      }
    }
  };

  const filteredFeedback = feedbackList.filter((item) => {
    const matchesSearch = 
      item.predictedChar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.correctLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(feedbackList, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `ASL_Prediction_Feedback_${Date.now()}.json`;
    a.click();
  };

  const exportCSV = () => {
    const headers = ["ID", "Wrong Prediction", "Correct Label", "Confidence", "Source", "Notes", "Status", "Date"];
    const rows = feedbackList.map(item => [
      item.id,
      `"${item.predictedChar}"`,
      `"${item.correctLabel}"`,
      item.confidence || 0,
      `"${item.predictionSource || ''}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      item.status,
      item.createdAt
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASL_Prediction_Feedback_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-[32px] p-6 shadow-sm space-y-6" id="prediction-feedback-manager">
      {/* Header */}
      <div className="border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] flex items-center gap-2">
            <Database className="w-5 h-5 text-[#7c8d7c]" />
            Prediction Feedback & Model Correction Database
          </h3>
          <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
            Store, audit, and apply human corrections for misclassified AI predictions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFeedback}
            className="p-2 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {feedbackList.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#fbfbf6] dark:bg-[#151518] border border-[#e0e4db] dark:border-[#2d2d32] p-1 rounded-xl">
              <button
                onClick={exportJSON}
                className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-[#5a5a4a] dark:text-zinc-300 hover:text-[#7c8d7c] transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase font-mono"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
              <div className="w-px h-4 bg-gray-200 dark:bg-zinc-800" />
              <button
                onClick={exportCSV}
                className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-[#5a5a4a] dark:text-zinc-300 hover:text-[#7c8d7c] transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase font-mono"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-[#fbfbf6] dark:bg-[#151518] border border-[#e0e4db] dark:border-[#2d2d32] rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Pending Review
            </div>
            <div className="text-xl font-black font-mono text-[#2d2d28] dark:text-white">
              {feedbackList.filter(f => f.status === 'pending_review').length}
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#fbfbf6] dark:bg-[#151518] border border-[#e0e4db] dark:border-[#2d2d32] rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Verified / Corrected
            </div>
            <div className="text-xl font-black font-mono text-[#2d2d28] dark:text-white">
              {feedbackList.filter(f => f.status === 'corrected').length}
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#fbfbf6] dark:bg-[#151518] border border-[#e0e4db] dark:border-[#2d2d32] rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Applied to Retraining
            </div>
            <div className="text-xl font-black font-mono text-[#2d2d28] dark:text-white">
              {feedbackList.filter(f => f.status === 'applied').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="relative md:col-span-8">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search wrong predictions, correct ground truth labels, or notes..."
            className="w-full pl-9 pr-4 py-2.5 text-xs text-gray-700 dark:text-zinc-300 bg-[#fbfbf6] dark:bg-[#161619] border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#7c8d7c]"
          />
        </div>

        <div className="relative md:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-xs text-gray-600 dark:text-zinc-400 bg-[#fbfbf6] dark:bg-[#161619] border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#7c8d7c] cursor-pointer"
          >
            <option value="all">All Feedback Statuses</option>
            <option value="pending_review">⏳ Pending Review</option>
            <option value="corrected">✅ Verified Corrected</option>
            <option value="applied">🚀 Applied to Model</option>
          </select>
        </div>
      </div>

      {/* List content */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {filteredFeedback.length > 0 ? (
          filteredFeedback.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-[#fdfcf9] dark:bg-[#151518]/60 border border-[#e0e4db] dark:border-[#2d2d32] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#cbdcbc] dark:hover:border-zinc-700 transition-all"
            >
              <div className="space-y-2 flex-1">
                {/* Status tag & timestamp */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase font-mono tracking-wider ${
                    item.status === 'applied' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : item.status === 'corrected'
                      ? 'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                      : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>

                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Correction Flow Display */}
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-rose-400">Wrong:</span>
                    <span>"{item.predictedChar}"</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-400" />

                  <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-emerald-400">Correct:</span>
                    <span>"{item.correctLabel}"</span>
                  </div>

                  {item.confidence !== undefined && (
                    <span className="text-[11px] text-gray-500 font-mono">
                      ({item.confidence}% conf)
                    </span>
                  )}
                </div>

                {/* Notes if available */}
                {item.notes && (
                  <p className="text-xs text-gray-600 dark:text-zinc-400 italic bg-[#fbfbf6] dark:bg-[#1a1a1d] p-2 rounded-xl border border-gray-100 dark:border-zinc-800">
                    "{item.notes}"
                  </p>
                )}
              </div>

              {/* Status Action controls */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {item.status === 'pending_review' && (
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'corrected')}
                    className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                    title="Mark verified/corrected"
                  >
                    <Check className="w-3 h-3" />
                    <span>Verify</span>
                  </button>
                )}

                {item.status !== 'applied' && (
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'applied')}
                    className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                    title="Apply correction to training queue"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Apply</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteFeedback(item.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer transition-all"
                  title="Delete feedback"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 bg-[#fdfcf9] dark:bg-[#151518]/30 border border-dashed border-[#e2e2d0] dark:border-[#2d2d32] rounded-2xl flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-100 dark:bg-[#1e1e22] rounded-full flex items-center justify-center text-neutral-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#2d2d28] dark:text-[#cbd5e1] uppercase tracking-wide">
                No Prediction Corrections Logged
              </h4>
              <p className="text-[11px] text-[#5c5c50] dark:text-[#a1a1aa] leading-relaxed mt-1 max-w-sm">
                Whenever a gesture is misclassified, use the "Mark Wrong / Correct Prediction" button in the Translation or Replay tools to submit ground-truth feedback.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
