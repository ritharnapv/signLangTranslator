import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Tag, 
  FileText, 
  Send, 
  Sparkles, 
  Database,
  Cloud,
  Check
} from 'lucide-react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PredictionFeedback } from '../types';

interface PredictionCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictedChar: string;
  confidence?: number;
  predictionSource?: string;
  currentUser?: any;
  landmarksSnapshot?: Array<{ x: number; y: number; z: number }>;
  onFeedbackSubmitted?: (feedback: PredictionFeedback) => void;
}

const COMMON_GESTURE_LABELS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'Hello', 'Thank You', 'Yes', 'No', 'Help', 'Love', 'Please', 'Sorry', 'I Love You'
];

export default function PredictionCorrectionModal({
  isOpen,
  onClose,
  predictedChar,
  confidence = 0,
  predictionSource = 'TF.js Neural Network',
  currentUser,
  landmarksSnapshot,
  onFeedbackSubmitted
}: PredictionCorrectionModalProps) {
  const [correctLabel, setCorrectLabel] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectLabel = (label: string) => {
    setCorrectLabel(label);
    setCustomInput('');
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInput(e.target.value);
    setCorrectLabel(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalLabel = (correctLabel || customInput).trim();
    if (!finalLabel) {
      setErrorMessage('Please select or enter the correct gesture label.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newFeedback: PredictionFeedback = {
      id: feedbackId,
      predictedChar: predictedChar || 'Unknown',
      correctLabel: finalLabel,
      confidence: Number(confidence.toFixed(1)),
      predictionSource,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      userId: currentUser?.uid || 'guest_user',
      userEmail: currentUser?.email || 'guest@aslstudio.local',
      status: 'pending_review',
      landmarksSnapshot
    };

    try {
      // 1. Save to Local Storage for offline access
      const localStored = localStorage.getItem('asl_prediction_feedback');
      const feedbackArray: PredictionFeedback[] = localStored ? JSON.parse(localStored) : [];
      feedbackArray.unshift(newFeedback);
      localStorage.setItem('asl_prediction_feedback', JSON.stringify(feedbackArray));

      // 2. Save to Firestore DB
      if (db) {
        try {
          await setDoc(doc(db, 'prediction_feedback', feedbackId), {
            id: newFeedback.id,
            predictedChar: newFeedback.predictedChar,
            correctLabel: newFeedback.correctLabel,
            confidence: newFeedback.confidence,
            predictionSource: newFeedback.predictionSource,
            notes: newFeedback.notes,
            createdAt: newFeedback.createdAt,
            userId: newFeedback.userId,
            userEmail: newFeedback.userEmail,
            status: newFeedback.status,
            landmarksCount: landmarksSnapshot ? landmarksSnapshot.length : 0
          });

          // Also save in user subcollection if signed in
          if (currentUser?.uid) {
            await setDoc(doc(db, 'users', currentUser.uid, 'prediction_feedback', feedbackId), {
              id: newFeedback.id,
              predictedChar: newFeedback.predictedChar,
              correctLabel: newFeedback.correctLabel,
              createdAt: newFeedback.createdAt
            });
          }
        } catch (dbErr: any) {
          console.warn('Firestore write warning (saved locally):', dbErr);
        }
      }

      setSuccessMessage(`Correction logged! Marked wrong prediction '${predictedChar}' → Correct: '${finalLabel}'`);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(newFeedback);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage(null);
        setCorrectLabel('');
        setCustomInput('');
        setNotes('');
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setErrorMessage(err.message || 'Failed to submit correction.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-[32px] max-w-lg w-full p-6 shadow-2xl relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5]">
                Correct AI Prediction
              </h3>
              <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
                Submit wrong prediction feedback to improve the gesture model
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prediction Context Banner */}
        <div className="p-4 bg-[#fdfcf9] dark:bg-[#151518] border border-[#e0e4db] dark:border-[#2d2d32] rounded-2xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase font-mono tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Flagged Wrong AI Output
            </div>
            <div className="text-2xl font-black font-mono text-[#2d2d28] dark:text-white">
              "{predictedChar || '?'}"
            </div>
            <div className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono">
              Engine: {predictionSource} • Confidence: {confidence.toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-rose-100/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-2xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider block">Action</span>
            <span className="text-xs font-black">Submit Label</span>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label selector chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2d2d28] dark:text-[#e4e4e7] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#7c8d7c]" />
              Select Correct Gesture Ground Truth:
            </label>
            <div className="max-h-36 overflow-y-auto p-2 bg-[#fbfbf6] dark:bg-[#161619] border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-wrap gap-1.5">
              {COMMON_GESTURE_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleSelectLabel(label)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    correctLabel === label
                      ? 'bg-[#7c8d7c] text-white shadow-sm scale-105'
                      : 'bg-white dark:bg-[#222226] text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 hover:border-[#7c8d7c]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Label Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600 dark:text-zinc-400">
              Or type custom correct label:
            </label>
            <input
              type="text"
              value={customInput}
              onChange={handleCustomInputChange}
              placeholder="e.g. CUSTOM_POSTURE_1, THANK_YOU, Z"
              className="w-full px-3.5 py-2 text-xs font-mono text-gray-800 dark:text-zinc-200 bg-[#fbfbf6] dark:bg-[#161619] border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#7c8d7c]"
            />
          </div>

          {/* Notes / Context */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#2d2d28] dark:text-[#e4e4e7] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#7c8d7c]" />
              Additional Notes (Optional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Hand was rotated slightly sideways, lighting was dim..."
              className="w-full p-3 text-xs text-gray-700 dark:text-zinc-300 bg-[#fbfbf6] dark:bg-[#161619] border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#7c8d7c] resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f2ee] dark:border-[#2d2d32]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !correctLabel}
              className="px-5 py-2 bg-[#7c8d7c] hover:bg-[#6b7c6b] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Correction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
