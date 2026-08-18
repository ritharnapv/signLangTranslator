import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  ArrowRight,
  Eye,
  Hand,
  Layers,
  Volume2
} from 'lucide-react';
import { ImageSearchResultData, ImageSearchMatch } from '../types';
import { searchGestureByImage } from '../utils/gestureSearchEngine';

interface ImageGestureSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  signLanguage?: 'ALL' | 'ASL' | 'ISL';
  onSelectMatchedSign?: (signChar: string, signLanguage: string) => void;
  onOpenEvaluator?: (signName: string, lang: 'ASL' | 'ISL') => void;
}

// Sample test presets with realistic SVG/Data for instant testing without camera
const SAMPLE_PRESETS = [
  {
    id: 'sample_v_peace',
    name: 'Peace / Letter V',
    desc: 'Two fingers extended (Index & Middle)',
    signLanguage: 'ASL',
    char: 'V',
    accent: 'from-blue-500 to-indigo-600',
    svgPose: '✌️'
  },
  {
    id: 'sample_a_fist',
    name: 'Closed Fist / Letter A',
    desc: 'Solid fist with thumb upright',
    signLanguage: 'ASL',
    char: 'A',
    accent: 'from-emerald-500 to-teal-600',
    svgPose: '✊'
  },
  {
    id: 'sample_namaste',
    name: 'Namaste (Anjali Mudra)',
    desc: 'Two palms flat together at chest',
    signLanguage: 'ISL',
    char: 'NAMASTE',
    accent: 'from-amber-500 to-orange-600',
    svgPose: '🙏'
  },
  {
    id: 'sample_ily',
    name: 'I Love You (ILY)',
    desc: 'Thumb, index, and pinky raised',
    signLanguage: 'ASL',
    char: 'LOVE',
    accent: 'from-rose-500 to-pink-600',
    svgPose: '🤟'
  },
  {
    id: 'sample_dhanyawad',
    name: 'Thank You / Dhanyawad',
    desc: 'Open palm sweeping forward',
    signLanguage: 'ISL',
    char: 'DHANYAWAD',
    accent: 'from-purple-500 to-indigo-600',
    svgPose: '🖐️'
  }
];

export default function ImageGestureSearchModal({
  isOpen,
  onClose,
  signLanguage = 'ALL',
  onSelectMatchedSign,
  onOpenEvaluator
}: ImageGestureSearchModalProps) {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'camera' | 'presets'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<ImageSearchResultData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Webcam stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Stop camera when closing modal or switching away from camera mode
  useEffect(() => {
    if (!isOpen || activeInputMode !== 'camera') {
      stopCameraStream();
    } else if (isOpen && activeInputMode === 'camera') {
      startCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeInputMode]);

  const startCameraStream = async () => {
    setCameraLoading(true);
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMsg('Unable to access webcam. Please check browser permissions or upload an image file.');
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Capture current webcam snapshot
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countInterval);
          executeCapture();
          return null;
        }
        return prev - 1;
      });
    }, 600);
  };

  const executeCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror horizontal for intuitive selfie view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      analyzeImage(dataUrl);
    }
  };

  // Handle File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Process Preset Selection
  const handlePresetSelect = (preset: typeof SAMPLE_PRESETS[0]) => {
    // Generate high-resolution canvas snapshot of the preset hand shape
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 400, 400);
      ctx.font = '140px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(preset.svgPose, 200, 200);
      const dataUrl = canvas.toDataURL('image/png');
      setSelectedImage(dataUrl);
      analyzeImage(dataUrl, preset.signLanguage as any);
    }
  };

  // Call Reverse Image Search API
  const analyzeImage = async (imgData: string, lang: 'ALL' | 'ASL' | 'ISL' = signLanguage) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setSearchResult(null);

    try {
      const result = await searchGestureByImage(imgData, lang);
      setSearchResult(result);
    } catch (err: any) {
      console.error('Image analysis error:', err);
      setErrorMsg(err.message || 'Failed to analyze gesture in image. Please try another angle or clearer lighting.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Text-To-Speech
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#ffffff] dark:bg-[#121214] border border-[#e2e8f0] dark:border-[#27272a] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#1e293b] dark:text-[#f8fafc]"
        id="image-gesture-search-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] dark:border-[#27272a] bg-[#f8fafc] dark:bg-[#18181b]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-[#0f172a] dark:text-[#ffffff]">
                  Search Gesture by Image
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  AI Multimodal Vision
                </span>
              </div>
              <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                Upload a hand sign photo or capture with your webcam to identify matched signs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748b] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#e2e8f0] dark:hover:bg-[#27272a] transition-all"
            id="close-image-search-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Mode Selector Bar */}
        <div className="flex border-b border-[#e2e8f0] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] px-6 pt-3 gap-2">
          <button
            onClick={() => { setActiveInputMode('upload'); stopCameraStream(); }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeInputMode === 'upload'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a] dark:hover:text-[#f8fafc]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
          <button
            onClick={() => { setActiveInputMode('camera'); }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeInputMode === 'camera'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a] dark:hover:text-[#f8fafc]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Webcam Snapshot</span>
          </button>
          <button
            onClick={() => { setActiveInputMode('presets'); stopCameraStream(); }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeInputMode === 'presets'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a] dark:hover:text-[#f8fafc]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Sample Hand Poses</span>
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Input Panes */}
          {!selectedImage && (
            <div>
              {/* 1. Upload Pane */}
              {activeInputMode === 'upload' && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
                  }}
                  className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all flex flex-col items-center justify-center gap-4 ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01]'
                      : 'border-[#cbd5e1] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#18181b]/50 hover:border-indigo-400'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0f172a] dark:text-[#f8fafc]">
                      Drag & Drop Hand Sign Image Here
                    </h4>
                    <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
                      Supports JPG, PNG, WebP up to 10MB
                    </p>
                  </div>
                  <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Browse Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* 2. Webcam Pane */}
              {activeInputMode === 'camera' && (
                <div className="bg-[#0f172a] rounded-3xl overflow-hidden border border-[#334155] relative flex flex-col items-center justify-center min-h-[340px]">
                  {cameraLoading ? (
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                      <p className="text-xs font-medium">Initializing camera feed...</p>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-h-[380px] object-cover scale-x-[-1]"
                      />

                      {/* Viewfinder Target Silhouette Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-56 h-72 border-2 border-indigo-400/60 rounded-3xl border-dashed animate-pulse flex flex-col items-center justify-between p-4">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 bg-black/60 px-2 py-0.5 rounded-full">
                            Align Hand in Frame
                          </span>
                          <span className="text-[10px] text-slate-400 bg-black/60 px-2 py-0.5 rounded-full">
                            Hold gesture steady
                          </span>
                        </div>
                      </div>

                      {/* Countdown Flash */}
                      {countdown !== null && (
                        <div className="absolute inset-0 bg-indigo-600/40 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-7xl font-extrabold text-white animate-ping">
                            {countdown}
                          </span>
                        </div>
                      )}

                      {/* Snap Action Button */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <button
                          onClick={captureSnapshot}
                          disabled={countdown !== null}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-xs shadow-xl flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                          id="snap-gesture-photo-btn"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Snap Gesture Photo</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 3. Sample Presets Pane */}
              {activeInputMode === 'presets' && (
                <div className="space-y-4">
                  <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                    Click any sample gesture below to run reverse visual search instantly:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {SAMPLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset)}
                        className="p-4 rounded-2xl border border-[#e2e8f0] dark:border-[#27272a] bg-[#f8fafc] dark:bg-[#18181b] hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-left transition-all group flex items-start gap-3.5 shadow-sm"
                      >
                        <div className="text-3xl p-2 rounded-xl bg-white dark:bg-[#27272a] shadow-sm group-hover:scale-110 transition-transform">
                          {preset.svgPose}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#0f172a] dark:text-white truncate">
                              {preset.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {preset.signLanguage}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] mt-0.5 line-clamp-2">
                            {preset.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Image Preview & Results Section */}
          {selectedImage && (
            <div className="space-y-6">
              {/* Top Banner: Image Thumbnail + Analysis Status */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a]">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-indigo-400 shadow-md bg-slate-900 flex-shrink-0">
                  <img
                    src={selectedImage}
                    alt="Captured Hand Sign"
                    className="w-full h-full object-cover"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-indigo-950/70 backdrop-blur-[2px] flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-indigo-300 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Input Snapshot
                    </span>
                    {isAnalyzing ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse">
                        Analyzing Hand Anatomy...
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Analysis Complete
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                    {searchResult?.detectedHandPose || 'Identifying finger flexions, thumb oppositions, and manual alphabet configurations.'}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setSearchResult(null);
                        if (activeInputMode === 'camera') startCameraStream();
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[#cbd5e1] dark:border-[#334155] text-xs font-semibold hover:bg-white dark:hover:bg-[#27272a] transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Scan Another Gesture</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Callout */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Notice:</span> {errorMsg}
                  </div>
                </div>
              )}

              {/* Matches List */}
              {searchResult && searchResult.matches && searchResult.matches.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8] flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-500" />
                      <span>Closest Matching Gestures ({searchResult.matches.length})</span>
                    </h4>
                    <span className="text-[11px] text-[#64748b] dark:text-[#94a3b8]">
                      Ranked by Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {searchResult.matches.map((match, idx) => {
                      const isTopMatch = idx === 0;
                      return (
                        <div
                          key={`${match.char}_${idx}`}
                          className={`p-4 rounded-2xl border transition-all space-y-3 ${
                            isTopMatch
                              ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md ring-1 ring-indigo-300 dark:ring-indigo-700'
                              : 'border-[#e2e8f0] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#18181b] hover:border-indigo-300'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                                {match.char.length <= 2 ? match.char : match.char.charAt(0)}
                              </span>
                              <div>
                                <h5 className="text-sm font-bold text-[#0f172a] dark:text-white flex items-center gap-1.5">
                                  <span>{match.englishTitle || match.char}</span>
                                  {isTopMatch && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-400 text-amber-950 uppercase">
                                      Best Match
                                    </span>
                                  )}
                                </h5>
                                <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8]">
                                  {match.signLanguage} • {match.category}
                                </span>
                              </div>
                            </div>

                            {/* Confidence Badge */}
                            <div className="text-right">
                              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                                {Math.round(match.confidence)}%
                              </span>
                              <span className="block text-[9px] text-[#64748b] dark:text-[#94a3b8]">
                                Match Score
                              </span>
                            </div>
                          </div>

                          {/* Match Reason */}
                          <p className="text-xs text-[#334155] dark:text-[#cbd5e1] leading-relaxed">
                            {match.matchReason}
                          </p>

                          {/* Finger breakdown if available */}
                          {match.fingerBreakdown && (
                            <div className="text-[11px] p-2 rounded-xl bg-[#f1f5f9] dark:bg-[#27272a]/60 text-[#475569] dark:text-[#94a3b8]">
                              <span className="font-bold text-[#0f172a] dark:text-[#e2e8f0]">Anatomy: </span>
                              {match.fingerBreakdown}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1 border-t border-[#e2e8f0] dark:border-[#27272a]">
                            <button
                              onClick={() => speakText(`${match.englishTitle || match.char}. Sign Language: ${match.signLanguage}`)}
                              className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#27272a] transition-all"
                              title="Pronounce with Audio"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>

                            {onOpenEvaluator && (
                              <button
                                onClick={() => {
                                  onOpenEvaluator(match.char, match.signLanguage as any);
                                  onClose();
                                }}
                                className="ml-auto px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                              >
                                <span>Practice in AI Coach</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onSelectMatchedSign && (
                              <button
                                onClick={() => {
                                  onSelectMatchedSign(match.char, match.signLanguage);
                                  onClose();
                                }}
                                className="px-3 py-1.5 rounded-xl border border-[#cbd5e1] dark:border-[#334155] text-xs font-bold hover:bg-[#f8fafc] dark:hover:bg-[#27272a] transition-all"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Practical Tips */}
                  {searchResult.suggestions && searchResult.suggestions.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1.5">
                      <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>Camera & Precision Tips:</span>
                      </div>
                      <ul className="list-disc list-inside text-amber-800 dark:text-amber-200/90 space-y-0.5 pl-1">
                        {searchResult.suggestions.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] dark:border-[#27272a] bg-[#f8fafc] dark:bg-[#18181b]">
          <span className="text-xs text-[#64748b] dark:text-[#94a3b8] flex items-center gap-1.5">
            <Hand className="w-4 h-4 text-indigo-500" />
            <span>Covers ASL & ISL Manual Alphabets, Numbers, & Vocabulary</span>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#cbd5e1] dark:border-[#334155] text-xs font-bold hover:bg-[#e2e8f0] dark:hover:bg-[#27272a] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
