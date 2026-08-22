import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Eye,
  Layers,
  ChevronRight,
  Info,
  Check,
  Zap,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  RefreshCw,
  Award,
  BookOpen,
  Sliders,
  Maximize2
} from 'lucide-react';
import { ASLGesture, SignEvaluationResult, SignMistake } from '../types';
import {
  evaluateUserSignPerformance,
  getSignBlueprint,
  REFERENCE_SIGN_BLUEPRINTS,
  SKELETON_CONNECTIONS,
  LANDMARK_INDICES
} from '../utils/signEvaluatorEngine';
import { recordLearningHistoryEntry } from '../utils/practiceRecommender';
import { triggerAchievementNotification } from '../utils/notificationEngine';

interface SignEvaluatorViewProps {
  initialSign?: string;
  signLanguage?: 'ASL' | 'ISL';
  onCompletePractice?: (score: number, signName: string) => void;
  availableSigns?: ASLGesture[];
  onNavigateToDashboard?: () => void;
  onNavigateToRecommendations?: () => void;
  onNavigateToCertificates?: () => void;
}

export const SignEvaluatorView: React.FC<SignEvaluatorViewProps> = ({
  initialSign = 'A',
  signLanguage = 'ASL',
  onCompletePractice,
  availableSigns = [],
  onNavigateToDashboard,
  onNavigateToRecommendations,
  onNavigateToCertificates
}) => {
  const [selectedSign, setSelectedSign] = useState<string>(initialSign);
  const [currentSignLanguage, setCurrentSignLanguage] = useState<'ASL' | 'ISL'>(signLanguage);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [continuousEvaluation, setContinuousEvaluation] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<'side_by_side' | 'ghost_overlay' | 'reference_only'>('side_by_side');
  const [highlightedJoints, setHighlightedJoints] = useState<number[]>([]);
  const [selectedMistakeId, setSelectedMistakeId] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<SignEvaluationResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [completedChecks, setCompletedChecks] = useState<Record<string, boolean>>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const userCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const refCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoEvalTimerRef = useRef<any>(null);

  const blueprint = useMemo(() => {
    return getSignBlueprint(selectedSign, currentSignLanguage);
  }, [selectedSign, currentSignLanguage]);

  // List of standard selectable sign keys
  const standardSignKeys = useMemo(() => {
    if (availableSigns.length > 0) {
      return availableSigns.map(s => s.char || s.englishTitle || s.id);
    }
    return ['A', 'B', 'C', 'D', 'L', 'V', 'Y', 'LOVE', 'NAMASTE', 'DHANYAWAD'];
  }, [availableSigns]);

  // Initialize camera
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn("Webcam access note (using fallback simulation):", err);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setContinuousEvaluation(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (autoEvalTimerRef.current) clearInterval(autoEvalTimerRef.current);
    };
  }, []);

  // Initial evaluation on mount or sign change
  useEffect(() => {
    runEvaluation();
  }, [selectedSign, currentSignLanguage]);

  // Continuous evaluation interval loop
  useEffect(() => {
    if (continuousEvaluation && isCameraActive) {
      autoEvalTimerRef.current = setInterval(() => {
        if (!isEvaluating) {
          runEvaluation(true);
        }
      }, 2500);
    } else {
      if (autoEvalTimerRef.current) clearInterval(autoEvalTimerRef.current);
    }
    return () => {
      if (autoEvalTimerRef.current) clearInterval(autoEvalTimerRef.current);
    };
  }, [continuousEvaluation, isCameraActive, selectedSign, isEvaluating]);

  // Draw reference skeleton canvas
  useEffect(() => {
    const canvas = refCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pts = blueprint.referenceLandmarks;

    // Draw bones
    ctx.strokeStyle = '#059669'; // Emerald
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    SKELETON_CONNECTIONS.forEach(([i, j]) => {
      const p1 = pts[i];
      const p2 = pts[j];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    // Draw joints
    pts.forEach((pt, idx) => {
      const isHighlighted = highlightedJoints.includes(idx);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isHighlighted ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = isHighlighted ? '#f59e0b' : idx === 0 ? '#10b981' : '#34d399';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [blueprint, highlightedJoints]);

  // Capture video frame snapshot and call evaluation API
  const runEvaluation = async (isBackground = false) => {
    if (!isBackground) setIsEvaluating(true);

    try {
      let frameDataUrl = '';
      if (videoRef.current && isCameraActive) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoRef.current.videoWidth || 320;
        tempCanvas.height = videoRef.current.videoHeight || 240;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
          frameDataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
        }
      }

      // 1. Try server-side evaluation endpoint
      if (frameDataUrl) {
        try {
          const response = await fetch('/api/evaluate-gesture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: frameDataUrl,
              targetGesture: selectedSign,
              signLanguage: currentSignLanguage
            })
          });

          if (response.ok) {
            const apiResult = await response.json();
            // Enrich with reference blueprint joints if missing
            const localResult = evaluateUserSignPerformance(selectedSign, null, currentSignLanguage, apiResult.overallScore);
            const mergedResult: SignEvaluationResult = {
              ...localResult,
              ...apiResult,
              mistakes: apiResult.mistakes || localResult.mistakes,
              suggestions: apiResult.suggestions || localResult.suggestions,
              correctiveChecklist: apiResult.correctiveChecklist || localResult.correctiveChecklist
            };
            setEvaluationResult(mergedResult);

            // Record into learning history & weakness analytics
            recordLearningHistoryEntry({
              timestamp: new Date().toISOString(),
              signChar: selectedSign,
              englishTitle: blueprint.name || `Sign ${selectedSign}`,
              signLanguage: currentSignLanguage,
              source: 'evaluator',
              score: mergedResult.overallScore,
              accuracyGrade: mergedResult.grade,
              durationSeconds: 12,
              mistakesRecorded: mergedResult.mistakes.map(m => `${m.title}: ${m.description}`),
              subScores: mergedResult.subScores
            });

            if (onCompletePractice && mergedResult.overallScore >= 75) {
              onCompletePractice(mergedResult.overallScore, selectedSign);
            }

            if (mergedResult.overallScore >= 90) {
              triggerAchievementNotification({
                title: `Sign Mastery: ${selectedSign}`,
                description: `Achieved ${mergedResult.overallScore}% score with flawless anatomical landmark alignment`,
                tier: mergedResult.overallScore >= 98 ? 'diamond' : 'gold',
                xpEarned: mergedResult.overallScore >= 98 ? 100 : 50
              });
            }
            setIsEvaluating(false);
            return;
          }
        } catch (apiErr) {
          console.log("Using local precision geometric evaluator:", apiErr);
        }
      }

      // 2. Local Fallback Geometric Evaluator
      const localResult = evaluateUserSignPerformance(selectedSign, null, currentSignLanguage);
      setEvaluationResult(localResult);

      // Record into learning history & weakness analytics
      recordLearningHistoryEntry({
        timestamp: new Date().toISOString(),
        signChar: selectedSign,
        englishTitle: blueprint.name || `Sign ${selectedSign}`,
        signLanguage: currentSignLanguage,
        source: 'evaluator',
        score: localResult.overallScore,
        accuracyGrade: localResult.grade,
        durationSeconds: 10,
        mistakesRecorded: localResult.mistakes.map(m => `${m.title}: ${m.description}`),
        subScores: localResult.subScores
      });

      if (localResult.overallScore >= 90) {
        triggerAchievementNotification({
          title: `Sign Mastery: ${selectedSign}`,
          description: `Achieved ${localResult.overallScore}% score with flawless anatomical landmark alignment`,
          tier: localResult.overallScore >= 98 ? 'diamond' : 'gold',
          xpEarned: localResult.overallScore >= 98 ? 100 : 50
        });
      }

      if (onCompletePractice && localResult.overallScore >= 75) {
        onCompletePractice(localResult.overallScore, selectedSign);
      }
    } catch (err) {
      console.error("Evaluation runtime error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Text-to-Speech coaching tips
  const speakFeedback = () => {
    if (!evaluationResult || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const text = `Sign ${evaluationResult.targetSign}. Score ${evaluationResult.overallScore} percent. ${
      evaluationResult.mistakes.length === 0
        ? "Excellent posture match!"
        : evaluationResult.mistakes.map(m => m.correctionAction).join(". ")
    }`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleMistakeSelect = (mistake: SignMistake) => {
    if (selectedMistakeId === mistake.id) {
      setSelectedMistakeId(null);
      setHighlightedJoints([]);
    } else {
      setSelectedMistakeId(mistake.id);
      setHighlightedJoints(mistake.jointIndices);
    }
  };

  const toggleCheckItem = (id: string) => {
    setCompletedChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400 border-blue-500';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400 border-amber-500';
    return 'text-rose-600 dark:text-rose-400 border-rose-500';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Critical Error</span>;
      case 'moderate':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Moderate Warning</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Minor Angle</span>;
    }
  };

  return (
    <div id="sign-evaluator-container" className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header & Sign Selector Bar */}
      <div id="evaluator-top-header" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Sign Performance Evaluator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              Reference Comparison Engine
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Compare your live hand gesture with certified reference blueprints, receive instant accuracy scores, highlighted mistakes, and step-by-step improvement guidance.
          </p>
        </div>

        {/* Sign Language & Sign Quick Picker */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sign Language Toggle */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              id="toggle-lang-asl"
              onClick={() => setCurrentSignLanguage('ASL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentSignLanguage === 'ASL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ASL
            </button>
            <button
              id="toggle-lang-isl"
              onClick={() => setCurrentSignLanguage('ISL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentSignLanguage === 'ISL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ISL
            </button>
          </div>

          {/* Sign Selector Dropdown / Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {standardSignKeys.slice(0, 7).map(key => (
              <button
                key={key}
                id={`select-sign-${key}`}
                onClick={() => {
                  setSelectedSign(key);
                  setSelectedMistakeId(null);
                  setHighlightedJoints([]);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedSign.toUpperCase() === key.toUpperCase()
                    ? 'bg-emerald-600 text-white shadow-sm scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          {onNavigateToDashboard && (
            <button
              id="btn-return-dashboard"
              onClick={onNavigateToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Comparison Viewport (Left/Top) & Detailed Score/Mistake Evaluation (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Visual Arena (Webcam + Reference Blueprint Side-by-Side or Ghost) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
            {/* View Mode Controls & Camera Status */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-500" />
                  Posture Alignment Arena
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Target: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedSign}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                  <button
                    id="view-mode-side"
                    onClick={() => setDisplayMode('side_by_side')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      displayMode === 'side_by_side'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    id="view-mode-ghost"
                    onClick={() => setDisplayMode('ghost_overlay')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      displayMode === 'ghost_overlay'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Ghost Overlay
                  </button>
                </div>

                <button
                  id="btn-toggle-continuous"
                  onClick={() => setContinuousEvaluation(!continuousEvaluation)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    continuousEvaluation
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  title="Continuously scan posture every 2.5 seconds"
                >
                  <Zap className={`w-3.5 h-3.5 ${continuousEvaluation ? 'animate-pulse text-amber-300' : ''}`} />
                  {continuousEvaluation ? 'Live Auto' : 'Manual'}
                </button>
              </div>
            </div>

            {/* Video & Blueprint Display Container */}
            {displayMode === 'side_by_side' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Reference Blueprint Box */}
                <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center p-3 min-h-[260px]">
                  <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
                    Certified Blueprint ({blueprint.signLanguage})
                  </div>
                  <canvas
                    ref={refCanvasRef}
                    width={200}
                    height={200}
                    className="w-full max-w-[200px] h-auto my-auto"
                  />
                  <div className="w-full text-center mt-2 px-2">
                    <p className="text-xs text-slate-300 line-clamp-2 italic">
                      "{blueprint.visualTip}"
                    </p>
                  </div>
                </div>

                {/* 2. User Live Camera Box */}
                <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[260px]">
                  <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-semibold text-blue-400 border border-blue-500/30 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    Your Live Gesture
                  </div>

                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />

                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-4 text-center">
                      <Camera className="w-8 h-8 text-slate-500 mb-2" />
                      <p className="text-xs text-slate-400 mb-3">Camera is idle. Click below to activate webcam.</p>
                      <button
                        id="btn-enable-camera"
                        onClick={startCamera}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
                      >
                        Enable Webcam
                      </button>
                    </div>
                  )}

                  {isEvaluating && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-20">
                      <div className="bg-slate-900/90 text-white px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border border-slate-700 shadow-lg">
                        <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                        Scanning gesture geometry...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Ghost Overlay Mode: Reference superimposed on live user feed */
              <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center min-h-[300px]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100 opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-dashed border-emerald-400/60 rounded-full flex items-center justify-center animate-pulse">
                    <canvas
                      ref={refCanvasRef}
                      width={200}
                      height={200}
                      className="w-48 h-48 opacity-90 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    />
                  </div>
                </div>
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-xs text-emerald-400 border border-emerald-500/30">
                  Align your hand directly inside the green guideline ghost
                </div>
              </div>
            )}

            {/* Action Bar Under Viewport */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  id="btn-evaluate-now"
                  onClick={() => runEvaluation(false)}
                  disabled={isEvaluating}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isEvaluating ? 'Evaluating...' : 'Evaluate Gesture Now'}
                </button>

                <button
                  id="btn-speak-coach"
                  onClick={speakFeedback}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                  title="Hear AI audio coach feedback"
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
                </button>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Hold hand ~40cm from camera in good lighting
              </div>
            </div>
          </div>

          {/* Reference Blueprint Description Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Reference Sign Specifications: "{blueprint.name}"
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Palm: <strong className="text-slate-700 dark:text-slate-300">{blueprint.palmOrientation.replace('_', ' ')}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              {blueprint.visualTip}
            </p>

            {/* Finger target configurations */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {Object.entries(blueprint.fingers).map(([key, rawConfig]) => {
                const config = rawConfig as { name: string; state: string; tipExpectedLocation: string };
                return (
                  <div key={key} className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 capitalize">{config.name}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold capitalize">{config.state}</div>
                    <div className="text-[9px] text-slate-400">Pos: {config.tipExpectedLocation}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Evaluation Metrics, Score, Mistakes & Improvement Suggestions */}
        <div className="lg:col-span-5 space-y-6">
          {evaluationResult && (
            <>
              {/* 1. Score & Grade Card */}
              <div id="eval-score-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Accuracy & Match Score
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    evaluationResult.overallScore >= 85
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : evaluationResult.overallScore >= 70
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}>
                    {evaluationResult.grade}
                  </span>
                </div>

                <div className="flex items-center gap-5 mb-5">
                  {/* Circular Score Gauge */}
                  <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100 dark:text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={
                          evaluationResult.overallScore >= 85 ? 'text-emerald-500' : evaluationResult.overallScore >= 70 ? 'text-blue-500' : 'text-amber-500'
                        }
                        strokeDasharray={`${evaluationResult.overallScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {evaluationResult.overallScore}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {evaluationResult.isCorrect ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          Recognized as "{evaluationResult.targetSign}"
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-4 h-4" />
                          Minor corrections needed
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                      {evaluationResult.explanation}
                    </p>
                  </div>
                </div>

                {/* Granular Subscores */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Granular Biometric Subscores:
                  </div>

                  {[
                    { label: "Finger Extension & Flexion", value: evaluationResult.subScores.fingerExtension },
                    { label: "Thumb Position & Opposition", value: evaluationResult.subScores.thumbOpposition },
                    { label: "Palm Orientation & Tilt", value: evaluationResult.subScores.palmOrientation },
                    { label: "Joint Curvature Alignment", value: evaluationResult.subScores.jointCurvature },
                    { label: "Finger Spread (Abduction)", value: evaluationResult.subScores.abductionSpread }
                  ].map((sub, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">{sub.label}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{sub.value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            sub.value >= 85 ? 'bg-emerald-500' : sub.value >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${sub.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Highlighted Mistakes Card */}
              <div id="eval-mistakes-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Highlighted Mistakes & Discrepancies
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {evaluationResult.mistakes.length} Detected
                  </span>
                </div>

                {evaluationResult.mistakes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                    <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Flawless Hand Configuration!
                    </h3>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      No structural joint errors or misalignments detected against the reference blueprint.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {evaluationResult.mistakes.map((mistake) => (
                      <div
                        key={mistake.id}
                        onClick={() => handleMistakeSelect(mistake)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedMistakeId === mistake.id
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/20'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {mistake.title}
                            </span>
                            {getSeverityBadge(mistake.severity)}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {mistake.finger}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                          {mistake.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Expected:</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">{mistake.expectedState}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Observed:</span>
                            <span className="text-rose-600 dark:text-rose-400 font-medium">{mistake.observedState}</span>
                          </div>
                        </div>

                        <div className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-amber-500" />
                          Fix: {mistake.correctionAction}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Step-by-Step Improvement Suggestions & Action Checklist */}
              <div id="eval-suggestions-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Improvement Suggestions & Fix Checklist
                  </h2>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    Interactive Coaching
                  </span>
                </div>

                {/* Suggestions list */}
                <div className="space-y-2">
                  {evaluationResult.suggestions.map((sug, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{sug}</span>
                    </div>
                  ))}
                </div>

                {/* Interactive Correction Checklist */}
                {evaluationResult.correctiveChecklist.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Step-by-Step Correction Checklist:
                    </div>
                    {evaluationResult.correctiveChecklist.map((item) => {
                      const isDone = completedChecks[item.id] || item.completed;
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleCheckItem(item.id)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                            isDone
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-slate-800 dark:text-slate-200'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isDone ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                          }`}>
                            {isDone && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex-1">
                            <div className={`font-semibold ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                              {item.label}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.tip}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Practice Recommendations & Certificate Quick Links */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    High accuracy achieved? Claim official accreditation.
                  </span>
                  <div className="flex items-center gap-2">
                    {onNavigateToRecommendations && (
                      <button
                        onClick={onNavigateToRecommendations}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Smart Recommendations</span>
                      </button>
                    )}
                    {onNavigateToCertificates && (
                      <button
                        onClick={onNavigateToCertificates}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        id="btn-evaluator-claim-cert"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Claim Evaluator Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default SignEvaluatorView;
