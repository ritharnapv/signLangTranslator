import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Subtitles,
  Sparkles,
  Settings,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Users,
  Copy,
  Check,
  Download,
  Clock,
  Zap,
  Activity,
  Layers,
  Globe,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sliders,
  Radio,
  Share2,
  PhoneOff,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ASLGesture } from '../types';

export interface MeetingSubtitleEntry {
  id: string;
  speaker: string;
  text: string;
  translatedText?: string;
  timestamp: string;
  confidence: number;
  isFinal: boolean;
}

interface LiveMeetingTranslatorProps {
  cameraActive: boolean;
  onToggleCamera: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  landmarkCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  detectedGestureChar?: string;
  detectedGestureConfidence?: number;
  formedSentence?: string;
  customGestures?: ASLGesture[];
  onLogTranslation?: (inputText: string, translatedText: string, targetLanguage: string) => void;
}

// Preset Sign Sentences for Low-Latency Continuous Live Meeting Simulation
const MEETING_GESTURE_PRESETS = [
  { char: 'HELLO', text: 'Hello everyone', category: 'greetings' },
  { char: 'WELCOME', text: 'Welcome to our project meeting', category: 'greetings' },
  { char: 'THANK YOU', text: 'Thank you for joining today', category: 'greetings' },
  { char: 'PRESENTATION', text: 'Let us begin the presentation', category: 'business' },
  { char: 'AGREE', text: 'I agree with this decision', category: 'common' },
  { char: 'QUESTION', text: 'I have a quick question regarding the timeline', category: 'common' },
  { char: 'PLEASE', text: 'Please review the slide deck', category: 'business' },
  { char: 'GOOD', text: 'Everything looks great', category: 'common' },
  { char: 'HELP', text: 'Can anyone assist with this task?', category: 'common' },
  { char: 'FINISHED', text: 'I have finished my updates', category: 'business' }
];

export default function LiveMeetingTranslator({
  cameraActive,
  onToggleCamera,
  videoRef,
  landmarkCanvasRef,
  detectedGestureChar = '',
  detectedGestureConfidence = 0,
  formedSentence = '',
  customGestures = [],
  onLogTranslation
}: LiveMeetingTranslatorProps) {
  // Meeting Controls
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(true);
  const [meetingActive, setMeetingActive] = useState<boolean>(true);
  const [meetingDurationSec, setMeetingDurationSec] = useState<number>(0);

  // Subtitle Customization Settings
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [subtitlePosition, setSubtitlePosition] = useState<'bottom' | 'top' | 'floating'>('bottom');
  const [bgOpacity, setBgOpacity] = useState<number>(85); // 0 - 100
  const [targetLanguage, setTargetLanguage] = useState<string>('English');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [autoSpeechSynthesis, setAutoSpeechSynthesis] = useState<boolean>(true);

  // Participants
  const [participantCount, setParticipantCount] = useState<number>(3);
  const [activeSpeaker, setActiveSpeaker] = useState<'signer' | 'p1' | 'p2'>('signer');

  // Real-Time Subtitles & Transcript State
  const [currentLiveCaption, setCurrentLiveCaption] = useState<string>('Sign language live detection active. Start signing...');
  const [transcriptHistory, setTranscriptHistory] = useState<MeetingSubtitleEntry[]>([
    {
      id: 'm-1',
      speaker: 'Meeting Host (Sarah)',
      text: 'Welcome everyone! Live ASL Real-Time Subtitles are enabled for this call.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      confidence: 99,
      isFinal: true
    }
  ]);

  // Performance & Latency Monitor
  const [latencyMs, setLatencyMs] = useState<number>(28); // Low latency estimation
  const [fps, setFps] = useState<number>(60);
  const [copiedTranscript, setCopiedTranscript] = useState<boolean>(false);

  // Auto-scroll for transcript
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Meeting Duration Timer
  useEffect(() => {
    if (!meetingActive) return;
    const timer = setInterval(() => {
      setMeetingDurationSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [meetingActive]);

  // Latency jitter simulator for realistic meeting performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyMs(Math.floor(22 + Math.random() * 14)); // 22ms - 36ms low latency
      setFps(Math.floor(58 + Math.random() * 4)); // 58 - 61 FPS
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Sync real-time detected gesture into live subtitles
  useEffect(() => {
    if (detectedGestureChar) {
      setCurrentLiveCaption(`[Signing]: ${detectedGestureChar} (${detectedGestureConfidence}% confidence)`);

      // Automatically add to meeting transcript after short pause
      const timeout = setTimeout(() => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newEntry: MeetingSubtitleEntry = {
          id: `sub-${Date.now()}`,
          speaker: 'Signer (You)',
          text: detectedGestureChar,
          timestamp: timeStr,
          confidence: detectedGestureConfidence || 92,
          isFinal: true
        };

        setTranscriptHistory(prev => [...prev, newEntry]);

        if (onLogTranslation) {
          onLogTranslation(detectedGestureChar, detectedGestureChar, targetLanguage);
        }

        // Text-To-Speech for meeting audio stream
        if (autoSpeechSynthesis && 'speechSynthesis' in window) {
          const synth = window.speechSynthesis;
          synth.cancel();
          const utterance = new SpeechSynthesisUtterance(detectedGestureChar);
          utterance.rate = 1.0;
          synth.speak(utterance);
        }
      }, 1400);

      return () => clearTimeout(timeout);
    }
  }, [detectedGestureChar, detectedGestureConfidence, autoSpeechSynthesis, onLogTranslation, targetLanguage]);

  // Scroll transcript to bottom when new entries arrive
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptHistory]);

  // Simulate low-latency gesture input button trigger for quick demonstration
  const triggerSimulatedSign = (preset: typeof MEETING_GESTURE_PRESETS[0]) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const conf = Math.floor(92 + Math.random() * 7);

    setCurrentLiveCaption(`[Signer]: "${preset.text}"`);

    const newEntry: MeetingSubtitleEntry = {
      id: `sim-${Date.now()}`,
      speaker: 'Signer (You)',
      text: preset.text,
      timestamp: timeStr,
      confidence: conf,
      isFinal: true
    };

    setTranscriptHistory(prev => [...prev, newEntry]);

    if (autoSpeechSynthesis && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(preset.text);
      utterance.rate = 1.0;
      synth.speak(utterance);
    }
  };

  // Format Duration MM:SS
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Copy Meeting Transcript
  const handleCopyTranscript = () => {
    const text = transcriptHistory.map(t => `[${t.timestamp}] ${t.speaker}: ${t.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  // Download Transcript File
  const handleDownloadTranscript = () => {
    let content = `SIGNSENSE - LIVE MEETING SUBTITLE TRANSCRIPT\n`;
    content += `Meeting ID: SignSense-Live-#408\n`;
    content += `Date: ${new Date().toLocaleString()}\n`;
    content += `Duration: ${formatDuration(meetingDurationSec)}\n`;
    content += `Target Language: ${targetLanguage}\n`;
    content += `==================================================\n\n`;

    transcriptHistory.forEach(item => {
      content += `[${item.timestamp}] ${item.speaker} (${item.confidence}% confidence):\n"${item.text}"\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Subtitles_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Font class mapping
  const fontClassMap = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg font-bold',
    xl: 'text-lg sm:text-2xl font-black'
  };

  return (
    <div className="space-y-6" id="live-meeting-translator-hub">
      {/* 1. TOP HERO HEADER & METRICS */}
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 dark:from-[#131316] dark:via-[#192b1b] dark:to-[#131316] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-900/40 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Live Meeting Subtitles
              </span>
              <span className="text-xs text-stone-400 font-mono">
                Meeting Duration: {formatDuration(meetingDurationSec)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Real-Time Sign Subtitles in Live Video Calls
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
              Translate sign language seamlessly during video conferences (Zoom, Teams, Meet). Features ultra-low latency continuous frame translation, customizable subtitle overlays, and automatic meeting transcript logging!
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-stone-300 block">Processing Latency</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{latencyMs} ms ({fps} FPS)</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5">
              <Users className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-[10px] text-stone-300 block">Participants</span>
                <span className="text-xs font-mono font-bold text-amber-300">{participantCount} Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN MEETING CALL STAGE & TRANSCRIPT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Stage: Video Call Grid with Subtitle Overlay */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-stone-950 border border-stone-800 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[480px]">
            
            {/* Top Meeting Bar */}
            <div className="flex items-center justify-between text-white z-20 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  LIVE CALL #408
                </span>
                <span className="text-xs text-stone-400 font-mono hidden sm:inline">| Room: Inclusive-Design-Sync</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Subtitle Settings</span>
                </button>
              </div>
            </div>

            {/* Video Grid (Presenters & Signer Webcam) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 z-10 relative flex-1">
              
              {/* Primary Cell: User / Signer Live Webcam */}
              <div className="relative bg-stone-900 rounded-2xl overflow-hidden border border-emerald-500/40 flex items-center justify-center min-h-[220px]">
                {cameraActive && videoRef ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
                      <Video className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-stone-300 max-w-xs mx-auto">
                      Webcam feed is offline. Enable camera to transmit live sign language gestures.
                    </p>
                    <button
                      onClick={onToggleCamera}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Enable Webcam
                    </button>
                  </div>
                )}

                {/* Speaker Label Tag */}
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white flex items-center gap-2 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Signer (You - ASL Presenter)</span>
                </div>
              </div>

              {/* Secondary Cell: Simulated Participant (Sarah) */}
              <div className="relative bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 flex items-center justify-center min-h-[220px]">
                <div className="text-center space-y-2 p-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                    S
                  </div>
                  <span className="text-xs font-bold text-stone-200 block">Sarah Jenkins (Host)</span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Listening to Live Subtitles
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white flex items-center gap-2 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Sarah Jenkins</span>
                </div>
              </div>

            </div>

            {/* REAL-TIME SUBTITLE OVERLAY BANNER */}
            <AnimatePresence>
              {subtitlesEnabled && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{ backgroundColor: `rgba(0, 0, 0, ${bgOpacity / 100})` }}
                  className={`z-30 p-4 rounded-2xl border border-emerald-500/50 backdrop-blur-md text-center shadow-2xl transition-all my-2 ${
                    subtitlePosition === 'top' ? 'order-first mb-4' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> Live Sign Subtitles ({targetLanguage})
                    </span>
                    <span className="text-stone-400">{latencyMs}ms delay</span>
                  </div>

                  <p className={`text-white font-sans ${fontClassMap[fontSize]} leading-snug tracking-wide`}>
                    {currentLiveCaption}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Meeting Controls Dock */}
            <div className="z-20 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-white">
              
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleCamera}
                  className={`p-3 rounded-2xl transition cursor-pointer flex items-center justify-center ${
                    cameraActive ? 'bg-stone-800 hover:bg-stone-700 text-white' : 'bg-rose-600 text-white'
                  }`}
                  title={cameraActive ? 'Turn Off Video' : 'Turn On Video'}
                >
                  {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-3 rounded-2xl transition cursor-pointer flex items-center justify-center ${
                    !isMicMuted ? 'bg-stone-800 hover:bg-stone-700 text-white' : 'bg-rose-600 text-white'
                  }`}
                  title={isMicMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {!isMicMuted ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                    subtitlesEnabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  <Subtitles className="w-4 h-4" />
                  <span>CC Subtitles {subtitlesEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Quick Preset Demonstrator Buttons */}
              <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-sm scrollbar-none">
                <span className="text-[10px] text-stone-400 font-mono shrink-0">Quick Demo:</span>
                {MEETING_GESTURE_PRESETS.slice(0, 3).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerSimulatedSign(p)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-stone-200 text-[11px] font-semibold rounded-lg shrink-0 transition cursor-pointer"
                  >
                    "{p.char}"
                  </button>
                ))}
              </div>

              <button
                onClick={() => setMeetingActive(!meetingActive)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{meetingActive ? 'End Call' : 'Rejoin Call'}</span>
              </button>

            </div>

          </div>
        </div>

        {/* Right Stage: Real-Time Auto-Scrolling Meeting Transcript */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 shadow-sm space-y-4 flex flex-col h-[520px]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-zinc-800 pb-3 shrink-0">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Live Meeting Transcript
              </h3>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyTranscript}
                  title="Copy Transcript"
                  className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 bg-stone-100 dark:bg-zinc-800 rounded-lg transition cursor-pointer"
                >
                  {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleDownloadTranscript}
                  title="Download Transcript"
                  className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 bg-stone-100 dark:bg-zinc-800 rounded-lg transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Transcript Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {transcriptHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-stone-50 dark:bg-zinc-900/60 border border-stone-100 dark:border-zinc-800/80 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{item.speaker}</span>
                    <span>{item.timestamp}</span>
                  </div>

                  <p className="text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                    "{item.text}"
                  </p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Demo Practice Phrases */}
            <div className="pt-3 border-t border-stone-100 dark:border-zinc-800 space-y-2 shrink-0">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">
                Inject Meeting Sign Gesture:
              </span>

              <div className="grid grid-cols-2 gap-1.5">
                {MEETING_GESTURE_PRESETS.slice(0, 4).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerSimulatedSign(p)}
                    className="p-2 bg-stone-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-700 dark:text-stone-200 text-[11px] font-semibold rounded-xl transition text-left truncate cursor-pointer border border-transparent hover:border-emerald-300"
                  >
                    + {p.char}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. SUBTITLE CUSTOMIZATION SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1a1a1d] border border-stone-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-600" />
                  Live Subtitle Preferences
                </h3>

                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Font Size Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  Subtitle Font Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                        fontSize === size
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  Overlay Position
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSubtitlePosition('bottom')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      subtitlePosition === 'bottom'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Bottom Overlay
                  </button>
                  <button
                    onClick={() => setSubtitlePosition('top')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      subtitlePosition === 'top'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Top Overlay
                  </button>
                </div>
              </div>

              {/* Background Opacity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                  <span>Background Opacity</span>
                  <span className="font-mono">{bgOpacity}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={bgOpacity}
                  onChange={(e) => setBgOpacity(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Speech Synthesis Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-zinc-800">
                <div>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                    Speak Subtitles Aloud (TTS)
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Meeting participants will hear translated signs via audio.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={autoSpeechSynthesis}
                  onChange={(e) => setAutoSpeechSynthesis(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Save & Apply Settings
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
