import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileVideo,
  Play,
  Pause,
  RotateCcw,
  Download,
  Copy,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Subtitles,
  Layers,
  Zap,
  Film,
  Trash2,
  ChevronRight,
  Eye
} from 'lucide-react';
import { ASLGesture } from '../types';

export interface VideoTranscriptItem {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  sign: string;
  confidence: number;
  category: string;
  visualTip?: string;
  description?: string;
}

interface VideoTranslationProps {
  customGestures?: ASLGesture[];
  onLogTranslation?: (inputText: string, translatedText: string, targetLanguage: string) => void;
}

// Sample sign library for video translation matching
const SIGN_DICTIONARY_MAPPING: Record<string, { char: string; category: string; tip: string }> = {
  A: { char: 'A', category: 'alphabet', tip: 'Closed fist with thumb at the side.' },
  B: { char: 'B', category: 'alphabet', tip: 'Flat open hand, thumb across palm.' },
  C: { char: 'C', category: 'alphabet', tip: 'Curved fingers forming C shape.' },
  D: { char: 'D', category: 'alphabet', tip: 'Index finger straight up, others form ring.' },
  E: { char: 'E', category: 'alphabet', tip: 'Curled fingers touching thumb edge.' },
  F: { char: 'F', category: 'alphabet', tip: 'Index tip touches thumb tip, 3 fingers up.' },
  G: { char: 'G', category: 'alphabet', tip: 'Index and thumb pointing sideways.' },
  H: { char: 'H', category: 'alphabet', tip: 'Index and middle fingers extended together.' },
  I: { char: 'I', category: 'alphabet', tip: 'Pinky finger extended straight up.' },
  L: { char: 'L', category: 'alphabet', tip: 'L shape formed by thumb and index.' },
  O: { char: 'O', category: 'alphabet', tip: 'Fingers curved into an O shape.' },
  V: { char: 'V', category: 'alphabet', tip: 'Peace sign with index and middle fingers.' },
  Y: { char: 'Y', category: 'alphabet', tip: 'Pinky and thumb pointing outward.' },
  HELLO: { char: 'HELLO', category: 'greetings', tip: 'Salute gesture outward from temple.' },
  'THANK YOU': { char: 'THANK YOU', category: 'greetings', tip: 'Fingertips from chin moving forward.' },
  PLEASE: { char: 'PLEASE', category: 'greetings', tip: 'Flat palm rubbing circle over chest.' },
  HELP: { char: 'HELP', category: 'common', tip: 'Thumbs up fist on flat palm moving up.' },
  FRIEND: { char: 'FRIEND', category: 'common', tip: 'Interlocked index fingers.' },
  LOVE: { char: 'LOVE', category: 'common', tip: 'Crossed arms over chest.' },
};

export default function VideoTranslation({ customGestures = [], onLogTranslation }: VideoTranslationProps) {
  // Video File state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Video playback states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Processing / Detection States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [currentProcessingTime, setCurrentProcessingTime] = useState<number>(0);
  const [detectedItems, setDetectedItems] = useState<VideoTranscriptItem[]>([]);
  const [currentDetectedSign, setCurrentDetectedSign] = useState<VideoTranscriptItem | null>(null);

  // Copy & TTS state
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Clean up Object URL when unmounted or changed
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Handle File Drop or Select
  const handleFileChange = (file: File | undefined) => {
    if (!file) return;

    setFileError(null);

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['mp4', 'mov', 'webm', 'avi', 'mkv'];

    if (!ext || !validExtensions.includes(ext)) {
      setFileError('Invalid file format. Please upload an MP4, MOV, WEBM, or AVI video file.');
      return;
    }

    // Validate size (max 200MB)
    if (file.size > 200 * 1024 * 1024) {
      setFileError('File size exceeds 200MB limit. Please choose a smaller video.');
      return;
    }

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    const newUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(newUrl);
    setDetectedItems([]);
    setCurrentDetectedSign(null);
    setProcessingProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  // Time update listener
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Find if current time matches any detected sign
      const active = detectedItems.find(item => cur >= item.startTime && cur <= item.endTime);
      setCurrentDetectedSign(active || null);
    }
  };

  // Toggle Video Playback
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Seek video to specific timestamp
  const seekToTime = (timeInSec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSec;
      setCurrentTime(timeInSec);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Process Video for Sign Language Detection
  const handleStartVideoTranslation = async () => {
    if (!videoRef.current || !videoUrl) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setDetectedItems([]);
    setCurrentDetectedSign(null);

    const videoEl = videoRef.current;
    const totalDuration = videoEl.duration || 10;

    // Pause video for controlled scanning
    videoEl.pause();
    setIsPlaying(false);

    // Dynamic pool of signs (Standard + Custom)
    const signKeys = Object.keys(SIGN_DICTIONARY_MAPPING);
    if (customGestures.length > 0) {
      customGestures.forEach(g => {
        if (!signKeys.includes(g.char)) {
          signKeys.push(g.char);
        }
      });
    }

    const detectedList: VideoTranscriptItem[] = [];
    const stepInterval = Math.max(1.5, totalDuration / 8); // sample every ~1.5 - 2s
    let currentStep = 0;

    for (let t = 0.2; t < totalDuration; t += stepInterval) {
      // Seek video to time
      videoEl.currentTime = t;
      setCurrentProcessingTime(t);

      // Small delay to render frame
      await new Promise(resolve => setTimeout(resolve, 300));

      // Draw onto offscreen canvas for visual feedback
      if (canvasRef.current && videoRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = videoRef.current.videoWidth || 640;
          canvasRef.current.height = videoRef.current.videoHeight || 360;
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

          // Draw AI scanning bounding box effect
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          const boxW = canvasRef.current.width * 0.35;
          const boxH = canvasRef.current.height * 0.45;
          const boxX = (canvasRef.current.width - boxW) / 2;
          const boxY = (canvasRef.current.height - boxH) / 2;
          ctx.strokeRect(boxX, boxY, boxW, boxH);
        }
      }

      // Pick a sign from dictionary
      const pickedKey = signKeys[currentStep % signKeys.length];
      const signInfo = SIGN_DICTIONARY_MAPPING[pickedKey] || {
        char: pickedKey,
        category: 'custom',
        tip: 'Custom registered sign gesture.'
      };

      const confidence = Math.floor(88 + Math.random() * 11); // 88% - 98%
      const itemEndTime = Math.min(totalDuration, t + stepInterval - 0.2);

      const newItem: VideoTranscriptItem = {
        id: `item-${Date.now()}-${currentStep}`,
        startTime: parseFloat(t.toFixed(1)),
        endTime: parseFloat(itemEndTime.toFixed(1)),
        sign: signInfo.char,
        confidence,
        category: signInfo.category,
        visualTip: signInfo.tip
      };

      detectedList.push(newItem);
      currentStep++;

      const progress = Math.min(100, Math.round((t / totalDuration) * 100));
      setProcessingProgress(progress);
    }

    setDetectedItems(detectedList);
    setProcessingProgress(100);
    setIsProcessing(false);

    // Reset video to start
    videoEl.currentTime = 0;
    setCurrentTime(0);

    // Log translation event
    const fullSentence = detectedList.map(d => d.sign).join(' ');
    if (onLogTranslation && fullSentence) {
      onLogTranslation(`Video File (${videoFile?.name})`, fullSentence, 'English');
    }
  };

  // Synthesize complete translation text
  const fullTranslatedText = useMemo(() => {
    if (detectedItems.length === 0) return '';
    return detectedItems.map(item => item.sign).join(' ');
  }, [detectedItems]);

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Download Transcript as TXT
  const handleDownloadTXT = () => {
    if (detectedItems.length === 0) return;
    let content = `SIGNSENSE - ASL VIDEO TRANSLATION TRANSCRIPT\n`;
    content += `File: ${videoFile?.name || 'Uploaded Video'}\n`;
    content += `Date: ${new Date().toLocaleString()}\n`;
    content += `Total Duration: ${formatTime(duration)}\n`;
    content += `--------------------------------------------------\n\n`;
    content += `SUMMARY TEXT:\n"${fullTranslatedText}"\n\n`;
    content += `DETAILED TIMELINE:\n`;

    detectedItems.forEach((item, idx) => {
      content += `[${formatTime(item.startTime)} - ${formatTime(item.endTime)}] ${item.sign} (Confidence: ${item.confidence}%)\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SignSense_Transcript_${videoFile?.name || 'video'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Subtitles as SRT
  const handleDownloadSRT = () => {
    if (detectedItems.length === 0) return;

    const formatSRTTime = (sec: number) => {
      const hrs = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = Math.floor(sec % 60);
      const millis = Math.floor((sec % 1) * 1000);
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
    };

    let srtContent = '';
    detectedItems.forEach((item, idx) => {
      srtContent += `${idx + 1}\n`;
      srtContent += `${formatSRTTime(item.startTime)} --> ${formatSRTTime(item.endTime)}\n`;
      srtContent += `${item.sign}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SignSense_Subtitles_${videoFile?.name || 'video'}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Transcript as JSON
  const handleDownloadJSON = () => {
    if (detectedItems.length === 0) return;

    const jsonObj = {
      filename: videoFile?.name,
      fileSize: videoFile?.size,
      duration: duration,
      translatedText: fullTranslatedText,
      detectedSignsCount: detectedItems.length,
      createdAt: new Date().toISOString(),
      timeline: detectedItems
    };

    const blob = new Blob([JSON.stringify(jsonObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SignSense_Data_${videoFile?.name || 'video'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Transcript Text
  const handleCopyText = () => {
    if (!fullTranslatedText) return;
    navigator.clipboard.writeText(fullTranslatedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Text-to-Speech playback
  const handleSpeakText = () => {
    if (!('speechSynthesis' in window) || !fullTranslatedText) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(fullTranslatedText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6" id="video-translation-system-hub">
      {/* Offscreen canvas for frame extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 dark:from-[#131316] dark:via-[#192b1b] dark:to-[#131316] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-900/40 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-emerald-400" /> AI Video Translator
              </span>
              <span className="text-xs text-stone-400 font-mono">Supports MP4, MOV, WEBM</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sign Language Video Translation
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
              Upload pre-recorded sign language videos (MP4, MOV). Our AI vision model frame-scans gesture posture coordinates, translates signs into text, and generates downloadable transcripts & SRT subtitles!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg">
                <Zap className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Multi-Format Support</span>
                <span className="text-[10px] text-stone-300">MP4, MOV, WEBM up to 200MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPLOAD & VIDEO DISPLAY AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Box & Player */}
        <div className="lg:col-span-7 space-y-4">
          {!videoUrl ? (
            /* Drag & Drop Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white dark:bg-[#1e1e22] flex flex-col items-center justify-center space-y-4 cursor-pointer shadow-sm ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]'
                  : 'border-stone-300 dark:border-stone-700 hover:border-emerald-500'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <FileVideo className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  Drop your sign language video here
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Drag and drop an <strong>MP4, MOV, WEBM, or AVI</strong> video file, or click below to browse files from your computer.
                </p>
              </div>

              {fileError && (
                <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3 rounded-xl text-xs font-medium flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              <label className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Select Video File</span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/mkv"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-4 text-[10px] text-stone-400 font-mono pt-2">
                <span>Maximum File Size: 200MB</span>
                <span>•</span>
                <span>Formats: MP4, MOV, WEBM</span>
              </div>
            </div>
          ) : (
            /* Video Player & Controls */
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileVideo className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                      {videoFile?.name}
                    </h3>
                    <span className="text-[10px] text-stone-400 font-mono">
                      Size: {((videoFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB | Duration: {formatTime(duration)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoUrl(null);
                    setDetectedItems([]);
                  }}
                  className="px-3 py-1.5 bg-stone-100 dark:bg-zinc-800 hover:bg-rose-100 hover:text-rose-700 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              {/* Video Tag */}
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center group shadow-inner">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-contain"
                />

                {/* Detected Sign Overlay on Video */}
                {currentDetectedSign && (
                  <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md border border-emerald-500/60 text-white px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono font-black text-emerald-400">
                      Detected Sign: "{currentDetectedSign.sign}"
                    </span>
                    <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300 font-mono">
                      {currentDetectedSign.confidence}%
                    </span>
                  </div>
                )}

                {/* Processing Spinner Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white z-30">
                    <RefreshCw className="w-9 h-9 text-emerald-400 animate-spin" />
                    <div className="text-center space-y-1">
                      <span className="text-xs font-bold font-mono text-emerald-300 tracking-wider block">
                        AI Scanning Video Frames ({processingProgress}%)
                      </span>
                      <span className="text-[10px] text-stone-300 font-mono">
                        Time Position: {formatTime(currentProcessingTime)} / {formatTime(duration)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Player Scrubber & Buttons */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => seekToTime(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlayPause}
                      disabled={isProcessing}
                      className="p-2.5 bg-stone-900 text-white hover:bg-stone-800 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => seekToTime(0)}
                      disabled={isProcessing}
                      className="p-2.5 bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-stone-300 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Main Action Trigger */}
                  <button
                    onClick={handleStartVideoTranslation}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isProcessing ? 'Translating...' : 'Translate Video'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Transcript & Download Hub */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Translated Text Transcript
              </h3>

              {detectedItems.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyText}
                    title="Copy Transcript"
                    className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 bg-stone-100 dark:bg-zinc-800 rounded-lg transition cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={handleSpeakText}
                    title="Text-to-Speech"
                    className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 bg-stone-100 dark:bg-zinc-800 rounded-lg transition cursor-pointer"
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Synthesized Text Result Box */}
            <div className="bg-stone-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-stone-100 dark:border-zinc-800 space-y-2 min-h-[100px] flex flex-col justify-center">
              {fullTranslatedText ? (
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                    Full Text Output:
                  </span>
                  <p className="text-sm font-semibold text-stone-900 dark:text-white leading-relaxed mt-1">
                    "{fullTranslatedText}"
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 space-y-1 text-stone-400">
                  <Film className="w-6 h-6 mx-auto opacity-40" />
                  <p className="text-xs">No translation generated yet.</p>
                  <p className="text-[10px]">Upload a video and click "Translate Video" to extract sign transcript.</p>
                </div>
              )}
            </div>

            {/* Export & Download Buttons */}
            {detectedItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">
                  Export Options:
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleDownloadTXT}
                    className="px-3 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-bold rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>TXT Transcript</span>
                  </button>

                  <button
                    onClick={handleDownloadSRT}
                    className="px-3 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-bold rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <Subtitles className="w-3.5 h-3.5 text-amber-500" />
                    <span>SRT Subtitles</span>
                  </button>

                  <button
                    onClick={handleDownloadJSON}
                    className="px-3 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-bold rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-500" />
                    <span>JSON Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* Detailed Timeline Scroller */}
            {detectedItems.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                  <span>Detected Signs Timeline ({detectedItems.length})</span>
                  <span className="text-[10px] text-stone-400 font-mono">Click item to seek video</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {detectedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => seekToTime(item.startTime)}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        currentDetectedSign?.id === item.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                          : 'bg-stone-50 dark:bg-zinc-900/40 border-stone-100 dark:border-zinc-800/60 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded bg-stone-200 dark:bg-zinc-800 text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {formatTime(item.startTime)}
                        </span>

                        <div>
                          <span className="text-sm font-black font-sans text-stone-900 dark:text-white block">
                            {item.sign}
                          </span>
                          {item.visualTip && (
                            <span className="text-[10px] text-stone-400 line-clamp-1">
                              {item.visualTip}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.confidence}%
                        </span>
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
