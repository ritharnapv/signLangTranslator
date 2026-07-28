import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tag, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  Download, 
  Upload, 
  Eye, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  Grid, 
  List, 
  Sliders, 
  X, 
  Plus, 
  Database, 
  ShieldAlert, 
  Save, 
  FileSpreadsheet, 
  FileJson, 
  Wand2, 
  ArrowRightLeft,
  Check,
  Zap,
  HardDrive,
  Cloud
} from 'lucide-react';
import { CollectedSample } from '../types';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

interface DatasetLabelingToolProps {
  collectedSamples: CollectedSample[];
  onUpdateSamples: (samples: CollectedSample[]) => void;
  currentUser?: any;
}

// Preset common ASL Labels
const PRESET_LABELS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'HELLO', 'THANK YOU', 'PLEASE', 'YES', 'NO', 'HELP', 'EMERGENCY'
];

// Hand skeletal bones connection pairs (0-indexed 21 keypoint MediaPipe hand topology)
const HAND_BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // Index
  [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
  [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
  [5, 9], [9, 13], [13, 17]                 // Palm transverses
];

// Canvas Component for rendering 21 Hand Landmarks Skeleton
function HandSkeletonCanvas({ landmarks, width = 160, height = 160, isSelected = false }: { 
  landmarks: Array<{x: number, y: number, z?: number}>; 
  width?: number; 
  height?: number;
  isSelected?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Fill background grid
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, width, height);

    if (!landmarks || landmarks.length === 0) {
      ctx.fillStyle = '#71717a';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO KEYPOINTS', width / 2, height / 2);
      return;
    }

    // Normalize coordinates to canvas dimension
    // Find bounding box to scale hand nicely
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    landmarks.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });

    const rangeX = (maxX - minX) || 0.001;
    const rangeY = (maxY - minY) || 0.001;
    const padding = 20;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;
    const scale = Math.min(drawWidth / rangeX, drawHeight / rangeY);

    const offsetX = padding + (drawWidth - rangeX * scale) / 2;
    const offsetY = padding + (drawHeight - rangeY * scale) / 2;

    const project = (pt: {x: number, y: number}) => ({
      x: (pt.x - minX) * scale + offsetX,
      y: (pt.y - minY) * scale + offsetY
    });

    // Draw bones
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isSelected ? '#a3e635' : '#7c8d7c';
    HAND_BONES.forEach(([i, j]) => {
      if (landmarks[i] && landmarks[j]) {
        const p1 = project(landmarks[i]);
        const p2 = project(landmarks[j]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    // Draw landmark joints
    landmarks.forEach((pt, idx) => {
      const p = project(pt);
      ctx.beginPath();
      let radius = 3;
      let color = '#22c55e'; // default palm/joint green
      if (idx === 0) {
        radius = 5;
        color = '#ef4444'; // wrist red
      } else if (idx === 4) {
        radius = 4;
        color = '#f59e0b'; // thumb tip amber
      } else if (idx === 8) {
        radius = 4;
        color = '#3b82f6'; // index tip blue
      } else if (idx === 12 || idx === 16 || idx === 20) {
        radius = 4;
        color = '#a855f7'; // finger tips purple
      }

      ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  }, [landmarks, width, height, isSelected]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="rounded-xl border border-zinc-800 shadow-inner block"
    />
  );
}

export default function DatasetLabelingTool({ 
  collectedSamples, 
  onUpdateSamples,
  currentUser 
}: DatasetLabelingToolProps) {
  // Main local editable copy of samples
  const [samples, setSamples] = useState<CollectedSample[]>(collectedSamples || []);
  
  // Sync if parent updates collectedSamples externally
  useEffect(() => {
    setSamples(collectedSamples || []);
  }, [collectedSamples]);

  // Selection & UI Modes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string>('ALL');
  const [qualityFilter, setQualityFilter] = useState<'ALL' | 'VALID' | 'ANOMALY'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'LABEL_ASC' | 'JOINTS_COUNT'>('NEWEST');

  // Relabeling modals and inputs
  const [editingSample, setEditingSample] = useState<CollectedSample | null>(null);
  const [singleNewLabel, setSingleNewLabel] = useState('');
  
  const [isBulkRelabelOpen, setIsBulkRelabelOpen] = useState(false);
  const [bulkNewLabel, setBulkNewLabel] = useState('');

  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [sourceLabelToMerge, setSourceLabelToMerge] = useState('');
  const [targetLabelToMerge, setTargetLabelToMerge] = useState('');

  // Inspection Modal
  const [inspectingSample, setInspectingSample] = useState<CollectedSample | null>(null);

  // Auto-Detect Bad Samples state
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [showQualityReport, setShowQualityReport] = useState(false);

  // Toast message
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper to check sample validity
  const checkIsSampleValid = (sample: CollectedSample): { isValid: boolean; reason?: string } => {
    if (!sample.landmarks || !Array.isArray(sample.landmarks)) {
      return { isValid: false, reason: 'Missing or non-array landmarks property' };
    }
    if (sample.landmarks.length !== 21) {
      return { isValid: false, reason: `Joint count is ${sample.landmarks.length} instead of 21 keypoints` };
    }
    const hasZeroOrNaN = sample.landmarks.some(pt => pt.x === undefined || pt.y === undefined || isNaN(pt.x) || isNaN(pt.y));
    if (hasZeroOrNaN) {
      return { isValid: false, reason: 'Contains NaN or undefined joint coordinates' };
    }
    return { isValid: true };
  };

  // Unique labels present in current dataset
  const datasetUniqueLabels = useMemo(() => {
    const set = new Set<string>();
    samples.forEach(s => {
      if (s.label) set.add(s.label.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [samples]);

  // Compute anomaly count whenever samples change
  useEffect(() => {
    let count = 0;
    samples.forEach(s => {
      if (!checkIsSampleValid(s).isValid) count++;
    });
    setAnomalyCount(count);
  }, [samples]);

  // Filtered & Sorted list
  const filteredSamples = useMemo(() => {
    return samples.filter(s => {
      // Search query filter
      const matchesSearch = s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.timestamp && s.timestamp.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Label filter
      const matchesLabel = selectedLabelFilter === 'ALL' || s.label.toUpperCase() === selectedLabelFilter.toUpperCase();

      // Quality filter
      const validation = checkIsSampleValid(s);
      const matchesQuality = qualityFilter === 'ALL' 
        ? true 
        : qualityFilter === 'VALID' ? validation.isValid : !validation.isValid;

      return matchesSearch && matchesLabel && matchesQuality;
    }).sort((a, b) => {
      if (sortBy === 'NEWEST') return b.id.localeCompare(a.id);
      if (sortBy === 'OLDEST') return a.id.localeCompare(b.id);
      if (sortBy === 'LABEL_ASC') return a.label.localeCompare(b.label);
      if (sortBy === 'JOINTS_COUNT') return (b.landmarks?.length || 0) - (a.landmarks?.length || 0);
      return 0;
    });
  }, [samples, searchQuery, selectedLabelFilter, qualityFilter, sortBy]);

  // Handle Updates
  const notifyParentUpdate = (updatedList: CollectedSample[]) => {
    setSamples(updatedList);
    onUpdateSamples(updatedList);
  };

  // ---------------------------------------------------------------------------
  // 1. EDIT ACTIONS
  // ---------------------------------------------------------------------------
  const handleSingleRelabel = (id: string, newLabel: string) => {
    const formatted = newLabel.trim().toUpperCase();
    if (!formatted) return;
    const updated = samples.map(s => s.id === id ? { ...s, label: formatted } : s);
    notifyParentUpdate(updated);
    setEditingSample(null);
    setSingleNewLabel('');
    showToast(`Relabeled sample to "${formatted}"`);
  };

  const handleBulkRelabel = () => {
    const formatted = bulkNewLabel.trim().toUpperCase();
    if (!formatted || selectedIds.length === 0) return;
    const selectedSet = new Set(selectedIds);
    const updated = samples.map(s => selectedSet.has(s.id) ? { ...s, label: formatted } : s);
    notifyParentUpdate(updated);
    setSelectedIds([]);
    setIsBulkRelabelOpen(false);
    setBulkNewLabel('');
    showToast(`Relabeled ${selectedSet.size} selected samples to "${formatted}"`);
  };

  const handleMergeLabels = () => {
    const src = sourceLabelToMerge.trim().toUpperCase();
    const tgt = targetLabelToMerge.trim().toUpperCase();
    if (!src || !tgt || src === tgt) return;

    let count = 0;
    const updated = samples.map(s => {
      if (s.label.toUpperCase() === src) {
        count++;
        return { ...s, label: tgt };
      }
      return s;
    });

    notifyParentUpdate(updated);
    setIsMergeModalOpen(false);
    setSourceLabelToMerge('');
    setTargetLabelToMerge('');
    showToast(`Merged ${count} samples from "${src}" to "${tgt}"`);
  };

  // ---------------------------------------------------------------------------
  // 2. REMOVE ACTIONS
  // ---------------------------------------------------------------------------
  const handleDeleteSingle = (id: string) => {
    const updated = samples.filter(s => s.id !== id);
    notifyParentUpdate(updated);
    if (inspectingSample?.id === id) setInspectingSample(null);
    showToast('Removed bad gesture sample', 'info');
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedSet = new Set(selectedIds);
    const updated = samples.filter(s => !selectedSet.has(s.id));
    notifyParentUpdate(updated);
    setSelectedIds([]);
    showToast(`Purged ${selectedSet.size} selected bad samples`, 'info');
  };

  const handlePurgeAllAnomalies = () => {
    const updated = samples.filter(s => checkIsSampleValid(s).isValid);
    const purgedCount = samples.length - updated.length;
    notifyParentUpdate(updated);
    setShowQualityReport(false);
    showToast(`Purged ${purgedCount} corrupted or invalid landmark samples`, 'warn');
  };

  // Select / Deselect All
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredSamples.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSamples.map(s => s.id));
    }
  };

  const handleToggleSelectId = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Export JSON / CSV
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(samples, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `labeled_asl_dataset_${samples.length}_items.json`);
    dlAnchor.click();
    showToast('Exported dataset as JSON');
  };

  const handleExportCSV = () => {
    let csv = "id,label,timestamp,joints_count,wrist_x,wrist_y,wrist_z\n";
    samples.forEach(s => {
      const wrist = s.landmarks && s.landmarks[0] ? s.landmarks[0] : { x: 0, y: 0, z: 0 };
      csv += `"${s.id}","${s.label}","${s.timestamp}",${s.landmarks?.length || 0},${wrist.x},${wrist.y},${wrist.z || 0}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labeled_asl_dataset_${samples.length}_items.csv`;
    a.click();
    showToast('Exported dataset as CSV');
  };

  // Upload external JSON to merge/review
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const validItems: CollectedSample[] = parsed.filter((item: any) => item.label && Array.isArray(item.landmarks));
          const merged = [...validItems, ...samples];
          notifyParentUpdate(merged);
          showToast(`Imported ${validItems.length} samples into labeling tool`);
        } else {
          showToast('File format invalid. Expecting an array of samples.', 'warn');
        }
      } catch (err) {
        showToast('Could not parse JSON file', 'warn');
      }
    };
    reader.readAsText(file);
  };

  // Save to Firestore
  const handleSaveToFirestore = async () => {
    if (!currentUser) {
      showToast('Please sign in to save dataset to Cloud Firestore', 'warn');
      return;
    }
    try {
      const datasetId = `labeled_ds_${Date.now()}`;
      const docRef = doc(db, "users", currentUser.uid, "datasets", datasetId);
      await setDoc(docRef, {
        id: datasetId,
        name: `Labeled Gesture Dataset (${samples.length} items)`,
        description: `Verified and labeled dataset created on ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        samples: samples,
        categories: datasetUniqueLabels,
        size: `${(JSON.stringify(samples).length / 1024).toFixed(1)} KB`,
        ownerEmail: currentUser.email
      });
      showToast('Saved cleaned dataset to Firestore cloud account!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save to Firestore', 'warn');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn" id="dataset-labeler-root">
      
      {/* Toast Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-emerald-600 text-white border-emerald-400' 
                : toast.type === 'warn'
                ? 'bg-amber-600 text-white border-amber-400'
                : 'bg-blue-600 text-white border-blue-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2a302a] via-[#1c201c] to-[#121412] text-white p-6 sm:p-8 border border-[#3e453e] shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c8d7c]/30 text-[#cbdcbc] border border-[#7c8d7c]/40 text-xs font-mono font-bold tracking-wider uppercase">
              <Tag className="w-3.5 h-3.5 text-[#cbdcbc]" />
              <span>Gesture Dataset Curator & Labeler</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dataset Labeling & Quality Tool
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Review recorded hand keypoint gestures, re-label misclassified samples, purge invalid or noisy landmarks, and export clean datasets for model training.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10">
            <div className="px-3 py-1.5 text-center">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total Samples</p>
              <p className="text-lg font-black text-emerald-400">{samples.length}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="px-3 py-1.5 text-center">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Unique Classes</p>
              <p className="text-lg font-black text-amber-400">{datasetUniqueLabels.length}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="px-3 py-1.5 text-center">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Quality Anomalies</p>
              <p className={`text-lg font-black ${anomalyCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {anomalyCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls & Filter Toolbar */}
      <div className="bg-white dark:bg-[#18181b] p-4 rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm space-y-4">
        
        {/* Top Row: Search, Quality Inspector, Bulk Actions */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search label, hash, or date..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#7c8d7c]"
            />
          </div>

          {/* Label & Quality Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Label Selector */}
            <select
              value={selectedLabelFilter}
              onChange={(e) => setSelectedLabelFilter(e.target.value)}
              className="px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none"
            >
              <option value="ALL">All Class Labels ({samples.length})</option>
              {datasetUniqueLabels.map(lbl => (
                <option key={lbl} value={lbl}>Class: "{lbl}"</option>
              ))}
            </select>

            {/* Quality Filter */}
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value as any)}
              className="px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none"
            >
              <option value="ALL">All Quality Statuses</option>
              <option value="VALID">Valid Landmarks Only</option>
              <option value="ANOMALY">Anomalies / Corrupted Only</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="LABEL_ASC">Label Alphabetical</option>
              <option value="JOINTS_COUNT">Joint Count</option>
            </select>

            {/* View Switcher Toggle */}
            <div className="flex items-center bg-[#f0f2ee] dark:bg-[#202024] p-1 rounded-2xl border border-[#e0e4db] dark:border-[#2d2d32]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-[#2d2d32] text-[#7c8d7c] dark:text-[#cbdcbc] shadow-sm font-bold' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
                title="Grid Preview Mode"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-[#2d2d32] text-[#7c8d7c] dark:text-[#cbdcbc] shadow-sm font-bold' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
                title="Dense Table Mode"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Second Row: Bulk Tool Operations & Import/Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#f0f2ee] dark:border-[#2d2d32]">
          
          {/* Left: Selection & Bulk Operations */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f0f2ee] dark:bg-[#202024] hover:bg-[#e0e4db] dark:hover:bg-[#2a2a2e] text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all min-h-[38px]"
            >
              {selectedIds.length > 0 && selectedIds.length === filteredSamples.length ? (
                <CheckSquare className="w-4 h-4 text-[#7c8d7c]" />
              ) : (
                <Square className="w-4 h-4 text-neutral-400" />
              )}
              <span>Select All ({selectedIds.length}/{filteredSamples.length})</span>
            </button>

            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={() => setIsBulkRelabelOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7c8d7c] hover:bg-[#6c7d6c] text-white text-xs font-bold shadow-sm transition-all min-h-[38px]"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Batch Relabel ({selectedIds.length})</span>
                </button>

                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all min-h-[38px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Selected ({selectedIds.length})</span>
                </button>
              </>
            )}

            <button
              onClick={() => setIsMergeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/30 transition-all min-h-[38px]"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Merge/Rename Class</span>
            </button>

            {anomalyCount > 0 && (
              <button
                onClick={() => setShowQualityReport(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-500/30 hover:bg-rose-500/20 transition-all min-h-[38px] animate-pulse"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>Fix Bad Samples ({anomalyCount})</span>
              </button>
            )}
          </div>

          {/* Right: Import / Export / Cloud Sync */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer transition-all min-h-[38px]">
              <Upload className="w-3.5 h-3.5 text-neutral-500" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all min-h-[38px]"
            >
              <FileJson className="w-3.5 h-3.5 text-blue-500" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all min-h-[38px]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>

            {currentUser && (
              <button
                onClick={handleSaveToFirestore}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7c8d7c] hover:bg-[#6c7d6c] text-white text-xs font-bold shadow-sm transition-all min-h-[38px]"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Save to Cloud</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN SAMPLES LIST AREA */}
      {filteredSamples.length === 0 ? (
        <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#f0f2ee] dark:bg-[#202024] text-[#7c8d7c] flex items-center justify-center mx-auto">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">No gesture samples found</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {samples.length === 0 
              ? 'No gesture landmarks recorded yet. Record gestures using the Recording Desk camera or import a JSON dataset to review and label.'
              : 'No gesture samples match your search or filter options. Try adjusting your query or resetting filters.'}
          </p>
          {samples.length > 0 && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedLabelFilter('ALL'); setQualityFilter('ALL'); }}
              className="px-4 py-2 rounded-xl bg-[#7c8d7c] text-white text-xs font-bold hover:bg-[#6c7d6c] transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredSamples.map((sample) => {
            const isSelected = selectedIds.includes(sample.id);
            const validation = checkIsSampleValid(sample);
            const isEditingThis = editingSample?.id === sample.id;

            return (
              <div
                key={sample.id}
                className={`group relative bg-white dark:bg-[#18181b] rounded-3xl border p-4 transition-all duration-200 flex flex-col justify-between space-y-3 ${
                  isSelected 
                    ? 'border-[#7c8d7c] ring-2 ring-[#7c8d7c]/30 shadow-md bg-[#7c8d7c]/5' 
                    : !validation.isValid
                    ? 'border-rose-400 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-[#e0e4db] dark:border-[#2d2d32] hover:border-[#7c8d7c]/50 shadow-sm'
                }`}
              >
                {/* Card Top: Checkbox & Label Badge */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleSelectId(sample.id)}
                    className="text-neutral-400 hover:text-[#7c8d7c] transition-colors p-1"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#7c8d7c]" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono bg-[#7c8d7c] dark:bg-[#4a5c4e] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full truncate uppercase">
                      {sample.label}
                    </span>
                    {!validation.isValid && (
                      <span className="p-1 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300" title={validation.reason}>
                        <AlertTriangle className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Skeleton Canvas */}
                <div 
                  className="flex items-center justify-center py-2 cursor-pointer relative group/canvas"
                  onClick={() => setInspectingSample(sample)}
                >
                  <HandSkeletonCanvas landmarks={sample.landmarks} width={140} height={140} isSelected={isSelected} />
                  <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/canvas:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <Eye className="w-4 h-4" />
                    <span>Inspect</span>
                  </div>
                </div>

                {/* Quick Edit Label or Normal Details */}
                {isEditingThis ? (
                  <div className="space-y-2 pt-2 border-t border-[#f0f2ee] dark:border-[#2d2d32]">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Edit Label:</p>
                    <input
                      type="text"
                      value={singleNewLabel}
                      onChange={(e) => setSingleNewLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSingleRelabel(sample.id, singleNewLabel);
                      }}
                      autoFocus
                      placeholder="e.g. A, B, HELLO"
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#7c8d7c] focus:outline-none uppercase"
                    />
                    
                    {/* Quick presets buttons */}
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {['A', 'B', 'C', 'V', 'HELLO', 'HELP'].map(p => (
                        <button
                          key={p}
                          onClick={() => handleSingleRelabel(sample.id, p)}
                          className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-[#7c8d7c] hover:text-white transition-all"
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSingleRelabel(sample.id, singleNewLabel)}
                        className="flex-1 py-1 rounded-xl bg-[#7c8d7c] text-white text-[10px] font-bold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSample(null)}
                        className="px-2 py-1 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-[#f0f2ee] dark:border-[#2d2d32]">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>{sample.landmarks?.length || 0} joints</span>
                      <span>{sample.timestamp?.split(' ')[1] || 'Today'}</span>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        onClick={() => {
                          setEditingSample(sample);
                          setSingleNewLabel(sample.label);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-[#f0f2ee] dark:bg-[#202024] hover:bg-[#e0e4db] dark:hover:bg-[#2a2a2e] text-[#5a6b5a] dark:text-[#a1a1aa] text-[11px] font-bold transition-all"
                        title="Edit Label"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Relabel</span>
                      </button>

                      <button
                        onClick={() => handleDeleteSingle(sample.id)}
                        className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition-all"
                        title="Delete Bad Sample"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW MODE */
        <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9f6] dark:bg-[#202024] text-neutral-500 font-bold uppercase tracking-wider border-b border-[#e0e4db] dark:border-[#2d2d32]">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <button onClick={handleToggleSelectAll} className="p-1">
                      {selectedIds.length > 0 && selectedIds.length === filteredSamples.length ? (
                        <CheckSquare className="w-4 h-4 text-[#7c8d7c]" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Preview</th>
                  <th className="px-4 py-3.5">Class Label</th>
                  <th className="px-4 py-3.5">Quality Status</th>
                  <th className="px-4 py-3.5">Joint Count</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e4db] dark:divide-[#2d2d32]">
                {filteredSamples.map((sample) => {
                  const isSelected = selectedIds.includes(sample.id);
                  const validation = checkIsSampleValid(sample);

                  return (
                    <tr 
                      key={sample.id} 
                      className={`hover:bg-[#f8f9f6]/60 dark:hover:bg-white/5 transition-all ${
                        isSelected ? 'bg-[#7c8d7c]/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleSelectId(sample.id)} className="p-1">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#7c8d7c]" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div 
                          className="cursor-pointer inline-block"
                          onClick={() => setInspectingSample(sample)}
                          title="Click to Inspect Coordinates"
                        >
                          <HandSkeletonCanvas landmarks={sample.landmarks} width={42} height={42} isSelected={isSelected} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono bg-[#7c8d7c] dark:bg-[#4a5c4e] text-white text-xs font-black px-2.5 py-1 rounded-full uppercase">
                          {sample.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {validation.isValid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Valid (21 pts)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300" title={validation.reason}>
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span>Anomaly</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-neutral-700 dark:text-neutral-300">
                        {sample.landmarks?.length || 0} pts
                      </td>
                      <td className="px-4 py-3 font-mono text-neutral-500 text-[11px]">
                        {sample.timestamp || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => setInspectingSample(sample)}
                          className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-all"
                          title="Inspect Sample"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSample(sample);
                            setSingleNewLabel(sample.label);
                          }}
                          className="p-1.5 rounded-xl bg-[#f0f2ee] dark:bg-[#202024] hover:bg-[#e0e4db] text-[#5a6b5a] dark:text-[#a1a1aa] transition-all"
                          title="Relabel Sample"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(sample.id)}
                          className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-200 transition-all"
                          title="Remove Sample"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: BULK RELABEL MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {isBulkRelabelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#18181b] border border-[#e0e4db] dark:border-[#2d2d32] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#7c8d7c]" />
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Batch Relabel Gestures</h3>
                </div>
                <button onClick={() => setIsBulkRelabelOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                You are about to re-assign <strong className="text-neutral-900 dark:text-neutral-100">{selectedIds.length}</strong> selected gesture samples to a new class label.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Target Label Class:</label>
                <input
                  type="text"
                  value={bulkNewLabel}
                  onChange={(e) => setBulkNewLabel(e.target.value)}
                  placeholder="e.g. A, B, HELLO, PLEASE"
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-mono font-bold focus:outline-none uppercase"
                />
              </div>

              {/* Preset Buttons Grid */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-neutral-400">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-[#f8f9f6] dark:bg-[#202024] rounded-2xl border border-[#e0e4db] dark:border-[#2d2d32]">
                  {PRESET_LABELS.map(lbl => (
                    <button
                      key={lbl}
                      onClick={() => setBulkNewLabel(lbl)}
                      className={`px-2 py-1 text-[10px] font-mono font-bold rounded-xl transition-all ${
                        bulkNewLabel === lbl 
                          ? 'bg-[#7c8d7c] text-white shadow-sm' 
                          : 'bg-white dark:bg-[#2d2d32] text-neutral-700 dark:text-neutral-300 hover:bg-[#7c8d7c] hover:text-white'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f2ee] dark:border-[#2d2d32]">
                <button
                  onClick={() => setIsBulkRelabelOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkRelabel}
                  disabled={!bulkNewLabel.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-[#7c8d7c] hover:bg-[#6c7d6c] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40"
                >
                  Apply Batch Relabel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL 2: CLASS MERGE / RENAME MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {isMergeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#18181b] border border-[#e0e4db] dark:border-[#2d2d32] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Merge or Rename Label Class</h3>
                </div>
                <button onClick={() => setIsMergeModalOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Rename all samples under an existing class label into a unified target class (e.g. merge "a" into "A").
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Source Label (To Change):</label>
                  <select
                    value={sourceLabelToMerge}
                    onChange={(e) => setSourceLabelToMerge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-mono font-bold"
                  >
                    <option value="">Select source label...</option>
                    {datasetUniqueLabels.map(lbl => (
                      <option key={lbl} value={lbl}>{lbl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Target Label (New Name):</label>
                  <input
                    type="text"
                    value={targetLabelToMerge}
                    onChange={(e) => setTargetLabelToMerge(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f2ee] dark:border-[#2d2d32]">
                <button
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMergeLabels}
                  disabled={!sourceLabelToMerge || !targetLabelToMerge.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40"
                >
                  Merge Class
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL 3: QUALITY REPORT & BAD SAMPLE PURGER */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {showQualityReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#18181b] border border-[#e0e4db] dark:border-[#2d2d32] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Dataset Quality Inspector</h3>
                </div>
                <button onClick={() => setShowQualityReport(false)} className="p-1 text-neutral-400 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-2">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  Detected {anomalyCount} corrupted or non-standard gesture samples!
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed">
                  Bad samples contain incomplete landmark counts (less or more than 21 MediaPipe hand points) or invalid NaN/undefined vector values which degrade AI model training accuracy.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#f8f9f6] dark:bg-[#202024] rounded-2xl border border-[#e0e4db] dark:border-[#2d2d32] text-xs">
                <span>Valid Gestures: <strong className="text-emerald-600 font-mono">{samples.length - anomalyCount}</strong></span>
                <span>Anomalies: <strong className="text-rose-600 font-mono">{anomalyCount}</strong></span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f2ee] dark:border-[#2d2d32]">
                <button
                  onClick={() => setShowQualityReport(false)}
                  className="px-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300"
                >
                  Close
                </button>
                <button
                  onClick={handlePurgeAllAnomalies}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  Purge All Bad Samples ({anomalyCount})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL 4: DETAILED SAMPLE INSPECTOR MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {inspectingSample && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#18181b] border border-[#e0e4db] dark:border-[#2d2d32] rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#7c8d7c]" />
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Sample Landmark Vector Inspector</h3>
                </div>
                <button onClick={() => setInspectingSample(null)} className="p-1 text-neutral-400 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Canvas Render */}
                <div className="flex flex-col items-center justify-center bg-[#18181b] p-4 rounded-2xl border border-zinc-800 space-y-2">
                  <HandSkeletonCanvas landmarks={inspectingSample.landmarks} width={200} height={200} />
                  <span className="text-[10px] text-zinc-400 font-mono">21 Keypoints Hand Mesh</span>
                </div>

                {/* Details Meta */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">Class Label</span>
                    <span className="font-mono bg-[#7c8d7c] text-white px-3 py-1 rounded-full text-xs font-black uppercase inline-block mt-1">
                      {inspectingSample.label}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">Sample Hash ID</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300 font-bold break-all">
                      {inspectingSample.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">Timestamp</span>
                    <span className="font-mono text-neutral-600 dark:text-neutral-400">
                      {inspectingSample.timestamp || 'Recorded Today'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">Quality Evaluation</span>
                    {checkIsSampleValid(inspectingSample).isValid ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Valid MediaPipe Topology
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> {checkIsSampleValid(inspectingSample).reason}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Raw Coordinates Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">Raw 3D Keypoint Coordinates (x, y, z):</span>
                <div className="max-h-48 overflow-y-auto rounded-2xl border border-[#e0e4db] dark:border-[#2d2d32] bg-[#f8f9f6] dark:bg-[#202024] p-3 text-[10px] font-mono">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-neutral-400 uppercase border-b border-neutral-300 dark:border-neutral-700">
                        <th className="pb-1">Joint</th>
                        <th className="pb-1">X</th>
                        <th className="pb-1">Y</th>
                        <th className="pb-1">Z</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectingSample.landmarks?.map((pt, idx) => (
                        <tr key={idx} className="border-b border-neutral-200/50 dark:border-neutral-800/50">
                          <td className="py-0.5 font-bold text-[#7c8d7c]">#{idx}</td>
                          <td className="py-0.5 text-neutral-600 dark:text-neutral-300">{pt.x?.toFixed(4)}</td>
                          <td className="py-0.5 text-neutral-600 dark:text-neutral-300">{pt.y?.toFixed(4)}</td>
                          <td className="py-0.5 text-neutral-500">{pt.z?.toFixed(4) || '0.0000'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#f0f2ee] dark:border-[#2d2d32]">
                <button
                  onClick={() => handleDeleteSingle(inspectingSample.id)}
                  className="px-4 py-2 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-200 transition-all"
                >
                  Delete Sample
                </button>
                <button
                  onClick={() => setInspectingSample(null)}
                  className="px-5 py-2 rounded-2xl bg-[#7c8d7c] text-white text-xs font-bold"
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
