import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Play, 
  Pause, 
  Send, 
  Trash2, 
  Volume2, 
  Copy, 
  Check, 
  User, 
  Sparkles,
  Download,
  Clock,
  ArrowRightLeft,
  Settings,
  HelpCircle,
  Mic,
  MicOff
} from 'lucide-react';

interface ConversationMessage {
  id: string;
  sender: 'asl' | 'partner';
  rawText?: string;
  text: string;
  language: string;
  timestamp: string;
}

interface ContinuousConversationProps {
  formedSentence: string;
  setFormedSentence: React.Dispatch<React.SetStateAction<string>>;
  translationLang: string;
  onLogTranslation: (text: string, translated: string, target: string) => void;
  onSpeak: (text: string, lang?: string) => void;
  cameraActive: boolean;
  detectedHandsCount: number;
}

export default function ContinuousConversation({
  formedSentence,
  setFormedSentence,
  translationLang,
  onLogTranslation,
  onSpeak,
  cameraActive,
  detectedHandsCount
}: ContinuousConversationProps) {
  // Mode configuration
  const [isActive, setIsActive] = useState<boolean>(true); // Pause/Resume state
  const [messages, setMessages] = useState<ConversationMessage[]>(() => {
    try {
      const stored = localStorage.getItem('asl_conversation_history');
      return stored ? JSON.parse(stored) : [
        {
          id: 'welcome',
          sender: 'partner',
          text: 'Hello! I am ready for our continuous conversation. Start making ASL signs, and when you rest your hand, the AI will translate and speak it aloud.',
          language: 'English',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    } catch {
      return [];
    }
  });

  const [partnerInput, setPartnerInput] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Real-time automatic finalizer (Inactivity auto-translation)
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownDuration = 2.5; // Seconds of no hand detected before automatic finalize
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Quick partner response presets for full two-way simulation
  const partnerPresets = [
    "Yes, I understand!",
    "That was a great sign, do it again!",
    "Hello! Nice to meet you.",
    "Can you please repeat the last sentence?",
    "Perfect! What's next?"
  ];

  // Speech Recognition States
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [interimVoiceTranscript, setInterimVoiceTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync messages with local storage
  useEffect(() => {
    localStorage.setItem('asl_conversation_history', JSON.stringify(messages));
  }, [messages]);

  // Handle auto-finalization when hand is absent and text exists
  useEffect(() => {
    if (!isActive || !cameraActive || !formedSentence.trim()) {
      setCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    // If hands are detected, freeze/reset the translation countdown
    if (detectedHandsCount > 0) {
      setCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    // If hand is absent and text exists, start/restart the finalizer countdown
    if (detectedHandsCount === 0 && countdown === null) {
      let remaining = countdownDuration;
      setCountdown(remaining);

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      countdownIntervalRef.current = setInterval(() => {
        remaining -= 0.1;
        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          setCountdown(null);
          finalizeSentence(formedSentence, translationLang);
        } else {
          setCountdown(Math.max(0, parseFloat(remaining.toFixed(1))));
        }
      }, 100);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [formedSentence, detectedHandsCount, isActive, cameraActive, countdown]);

  // Continuous speech-to-text / SpeechRecognition hook for partner voice input
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(true);

    if (!isActive || !isMicListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setVoiceError(null);
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (interim.trim()) {
        setInterimVoiceTranscript(interim);
      }

      if (final.trim()) {
        setInterimVoiceTranscript('');
        handleSendPartnerMessage(final.trim());
      }
    };

    rec.onerror = (event: any) => {
      console.warn("SpeechRecognition error:", event.error);
      if (event.error === 'not-allowed') {
        setVoiceError('Microphone permissions denied. Enable mic access to transcribe partner voice.');
        setIsMicListening(false);
      } else if (event.error === 'no-speech') {
        // Soft error, keep listening
      } else {
        setVoiceError(`Microphone issue: ${event.error}`);
      }
    };

    rec.onend = () => {
      if (isActive && isMicListening) {
        try {
          rec.start();
        } catch (e) {}
      }
    };

    recognitionRef.current = rec;

    try {
      rec.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsMicListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isActive, isMicListening]);

  // Translate and append sentence
  const finalizeSentence = async (textToFinalize: string, lang: string) => {
    if (!textToFinalize.trim() || isTranslating) return;

    setIsTranslating(true);
    const textSnapshot = textToFinalize.trim();
    
    // Optimistically reset notepad immediately to allow typing/gesturing next sentence while API resolves
    setFormedSentence('');

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textSnapshot, targetLanguage: lang })
      });

      if (!res.ok) throw new Error('Translation failed');
      const data = await res.json();
      const translated = data.translated || textSnapshot;

      // Add to conversation
      const newMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        sender: 'asl',
        rawText: textSnapshot,
        text: translated,
        language: lang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newMessage]);
      
      // Speak translation aloud immediately
      onSpeak(translated, lang);

      // Log globally to make it show in history/database
      onLogTranslation(textSnapshot, translated, lang);

    } catch (err) {
      console.error('Error auto-translating continuous mode:', err);
      // Restore text to let user retry if it fails
      setFormedSentence(textSnapshot);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleManualFinalize = () => {
    if (formedSentence.trim()) {
      finalizeSentence(formedSentence, translationLang);
    }
  };

  const handleSendPartnerMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const newMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'partner',
      text: textToSend.trim(),
      language: 'English',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    onSpeak(textToSend.trim(), 'English');
    setPartnerInput('');
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const handleClearConversation = () => {
    if (window.confirm('Wipe the live transcript and restart conversation session?')) {
      setMessages([]);
      localStorage.removeItem('asl_conversation_history');
    }
  };

  const handleExportTranscript = () => {
    if (messages.length === 0) return;
    const formattedTranscript = messages.map(msg => {
      const senderLabel = msg.sender === 'asl' ? 'ASL Signer (You)' : 'Partner (Voice)';
      const rawString = msg.rawText ? ` [Raw Gestures: "${msg.rawText}"]` : '';
      return `[${msg.timestamp}] ${senderLabel}: ${msg.text}${rawString}`;
    }).join('\n\n');

    const blob = new Blob([formattedTranscript], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ASL_Continuous_Conversation_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-[32px] p-6 shadow-sm space-y-5 animate-fadeIn" id="continuous-conversation-card">
      
      {/* Header Panel Controls */}
      <div className="border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#7c8d7c] animate-pulse" />
              Continuous Conversation Mode
            </h3>
            <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-950 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider font-mono">
              Live
            </span>
          </div>
          <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa]">
            Gesture complete phrases. REST your hand to automatically translate & vocalize sentences.
          </p>
        </div>

        {/* Global Action items */}
        <div className="flex items-center gap-2.5">
          {/* Pause / Resume button */}
          <button
            onClick={() => setIsActive(!isActive)}
            className={`py-2 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-xs border ${
              isActive 
                ? 'bg-[#f0f4ee] dark:bg-[#1a2f1a] border-[#d2e8cc] dark:border-[#254d25] text-[#3d652b] dark:text-emerald-400 hover:bg-[#e4ece0]' 
                : 'bg-[#fbfbf6] dark:bg-[#151518] border-gray-200 dark:border-[#2d2d32] text-gray-500 hover:border-gray-350'
            }`}
            title={isActive ? "Pause listening cycle" : "Resume listening cycle"}
          >
            {isActive ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Running</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Paused</span>
              </>
            )}
          </button>

          {/* Export Transcript */}
          {messages.length > 0 && (
            <button
              onClick={handleExportTranscript}
              className="p-2 border border-[#e0e4db] dark:border-[#2d2d32] text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
              title="Export Conversation Transcript as TXT"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Wipe history */}
          {messages.length > 0 && (
            <button
              onClick={handleClearConversation}
              className="p-2 border border-rose-100 dark:border-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
              title="Wipe Conversation History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Help button */}
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              showExplanation 
                ? 'bg-[#ebdcd1] text-[#5c3c35] border-[#ebdcd1]' 
                : 'border-[#e0e4db] dark:border-[#2d2d32] text-gray-500'
            }`}
            title="Toggle Continuous Conversation Guidelines"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guidelines Accordion Info Box */}
      {showExplanation && (
        <div className="bg-[#fdfcf9] dark:bg-[#151518] border border-[#e2e2d0] dark:border-[#2d2d32] rounded-2xl p-4.5 text-xs text-[#5c5c50] dark:text-[#a1a1aa] leading-relaxed space-y-2 animate-fadeIn">
          <span className="font-bold text-[#2d2d28] dark:text-white block uppercase tracking-wide text-[10px] font-mono">How Continuous Mode Works:</span>
          <p>
            1. **Active Gesturing**: Make letters or full sign gestures. Your letters compile inside the active notepad.
          </p>
          <p>
            2. **Smart Rest Silence**: Once you finished gesturing your sentence, simply **lower your hand** or leave the camera viewport.
          </p>
          <p>
            3. **Inactivity Finalizer**: The system senses your hand is absent and triggers a **2.5 second** countdown. When it expires, your compiled gestures are sent to our language translation model, polished, spoke aloud via audio reader, and appended to the Live Transcript.
          </p>
          <p>
            4. **Seamless Replies**: A vocal partner can easily type replies or select one-click custom response presets to keep a fluid two-way dialogue flow going.
          </p>
        </div>
      )}

      {/* Real-time Buffer & Countdown HUD */}
      <div className="bg-[#fbfbf6] dark:bg-[#161619] border border-[#e2e2d0] dark:border-[#2d2d32] rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#5c6e5a] dark:text-emerald-400 font-mono flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {isActive ? "Active Conversation listener" : "Listener paused"}
          </span>
          
          {countdown !== null && (
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold font-mono animate-pulse bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-100/30">
              Finalizing in {countdown}s
            </span>
          )}
        </div>

        {/* Current sentence buffer */}
        <div className="space-y-2">
          <div className="text-[11px] text-gray-500 font-sans">
            Current Unsent Gesture Phrase:
          </div>
          <div className="relative">
            <input
              type="text"
              value={formedSentence}
              onChange={(e) => setFormedSentence(e.target.value)}
              placeholder={
                !cameraActive 
                  ? "Awaiting webcam stream... Enable camera to start gesturing." 
                  : !isActive 
                    ? "Listener is paused. Click 'Paused' above to resume."
                    : "No unsent words. Gesture symbols or spell out phrases to compile text..."
              }
              className="w-full px-4 py-3 bg-white dark:bg-[#1c1c20] text-[#2d2d28] dark:text-white border border-[#e2e2d0] dark:border-[#2d2d32] rounded-xl focus:outline-none focus:border-[#7c8d7c] font-sans text-xs font-semibold pr-24"
            />
            {formedSentence.trim() && (
              <button
                onClick={handleManualFinalize}
                disabled={isTranslating}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#7c8d7c] hover:bg-[#687a68] text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 disabled:opacity-40"
              >
                <Send className="w-3 h-3" />
                <span>Send</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Countdown progress bar */}
        {countdown !== null && (
          <div className="w-full bg-gray-200 dark:bg-[#252528] h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#7c8d7c] dark:bg-emerald-500 h-full transition-all duration-100 ease-linear"
              style={{ width: `${(countdown / countdownDuration) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Live Transcript Conversation Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-[#f2f2e6] dark:border-[#2b2a26]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#9a9a8a] dark:text-[#a1a1aa] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Live Conversation Transcript
          </span>
          <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">
            {messages.length} exchanges
          </span>
        </div>

        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 select-none flex flex-col pt-1" id="continuous-messages-feed">
          {messages.length > 0 ? (
            messages.map((msg) => {
              const isAsl = msg.sender === 'asl';
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-[85%] ${isAsl ? 'self-start text-left' : 'self-end flex-row-reverse text-right'}`}
                >
                  {/* Sender Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    isAsl 
                      ? 'bg-amber-50 dark:bg-[#2b2520] border-amber-100 dark:border-[#3d322b] text-amber-700 dark:text-[#ebdcd1]' 
                      : 'bg-[#f0f4ee] dark:bg-[#1a2f1a] border-[#d2e8cc] dark:border-[#254d25] text-[#3d652b] dark:text-emerald-400'
                  }`}>
                    {isAsl ? (
                      <Sparkles className="w-3.5 h-3.5" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Speech Bubble */}
                  <div className="space-y-1">
                    {/* Header meta */}
                    <div className={`flex items-center gap-1.5 text-[9px] text-gray-400 dark:text-zinc-500 font-sans ${isAsl ? 'justify-start' : 'justify-end'}`}>
                      <span className="font-bold text-gray-600 dark:text-zinc-400">
                        {isAsl ? "ASL Signer (You)" : "Spoken Counterpart"}
                      </span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {isAsl && (
                        <span className="bg-amber-100/50 dark:bg-[#322c26] text-amber-800 dark:text-amber-300 px-1 rounded text-[8px] font-mono font-semibold uppercase">
                          {msg.language}
                        </span>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div className={`p-3.5 rounded-2xl relative group ${
                      isAsl 
                        ? 'bg-[#fcfbf9] dark:bg-[#1c1a16] border border-[#e2e2d0] dark:border-[#2d2d32] rounded-tl-xs text-[#2d2d28] dark:text-zinc-200' 
                        : 'bg-[#7c8d7c] dark:bg-[#4a5c4e] text-white rounded-tr-xs shadow-sm'
                    }`}>
                      {/* Raw text disclosure for ASL */}
                      {isAsl && msg.rawText && (
                        <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-gray-400 dark:text-gray-500 mb-1">
                          Gesture Match: "{msg.rawText}"
                        </div>
                      )}
                      
                      {/* Output Text */}
                      <p className="text-xs leading-relaxed font-semibold">
                        {msg.text}
                      </p>

                      {/* Micro actions overlay (visible on hover) */}
                      <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/95 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 px-1.5 py-1 rounded-lg shadow-sm ${
                        isAsl ? '-right-24' : '-left-24'
                      }`}>
                        <button
                          onClick={() => onSpeak(msg.text, isAsl ? msg.language : 'English')}
                          className="p-1 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded text-gray-500 dark:text-zinc-400 transition-colors"
                          title="Speak Aloud"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className="p-1 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded text-gray-500 dark:text-zinc-400 transition-colors"
                          title="Copy Message Text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 hover:bg-rose-50 hover:text-rose-600 rounded text-gray-400 transition-colors"
                          title="Delete message from history"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 bg-[#fdfcf9] dark:bg-[#151518]/30 border border-dashed border-[#e2e2d0] dark:border-[#2d2d32] rounded-2xl flex flex-col items-center text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-neutral-300 dark:text-zinc-700" />
              <div>
                <h4 className="text-xs font-bold text-[#2d2d28] dark:text-[#cbd5e1] uppercase tracking-wide">Transcript Blank</h4>
                <p className="text-[11px] text-[#5c5c50] dark:text-[#a1a1aa] max-w-xs mt-0.5">
                  Begin gesturing inside active camera stream frame or type unsent phrase above to kickstart the continuous conversation logging system.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spoken Partner Simulator Input Controls */}
      <div className="bg-[#fdfcfb] dark:bg-[#18181c] border border-[#ebdcd1]/60 dark:border-[#3a312c] rounded-2xl p-4.5 space-y-3.5">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-[#a36b5e] dark:text-orange-400 font-mono flex items-center gap-1">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Voice Partner simulator (Two-Way Practice)
          </span>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
            Send spoken response bubbles to simulate fluid 2-way learning conversation sessions.
          </p>
        </div>

        {/* Quick presets buttons */}
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider block font-mono">Quick Preset Replies:</label>
          <div className="flex flex-wrap gap-1.5">
            {partnerPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendPartnerMessage(preset)}
                className="text-[10.5px] bg-white dark:bg-zinc-900 text-[#2d2d28] dark:text-zinc-200 border border-gray-200 dark:border-zinc-800 hover:border-[#a36b5e] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Typing and Mic reply */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsMicListening(!isMicListening)}
              disabled={!isActive || !speechSupported}
              className={`p-3 rounded-xl transition-all border flex items-center justify-center cursor-pointer ${
                isMicListening
                  ? "bg-rose-500 border-rose-600 text-white animate-pulse"
                  : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
              }`}
              title={isMicListening ? "Stop live microphone" : "Start live microphone transcription"}
            >
              {isMicListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={partnerInput}
              onChange={(e) => setPartnerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendPartnerMessage(partnerInput);
              }}
              placeholder={isMicListening ? "Speak now or type a message..." : "Type a custom response on behalf of your hearing partner..."}
              className="flex-1 px-3 py-2 bg-white dark:bg-[#1c1c20] text-xs font-medium border border-[#ebdcd1] dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#a36b5e]"
            />
            <button
              onClick={() => handleSendPartnerMessage(partnerInput)}
              className="py-2 px-3.5 bg-[#a36b5e] hover:bg-[#8f5a4e] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>

          {/* Real-time interim voice display */}
          {isMicListening && (
            <div className="bg-rose-500/5 border border-rose-500/20 px-3 py-2 rounded-xl flex items-center gap-2 text-[11px] text-rose-800 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span className="font-bold">Voice Live Transcript Feed:</span>
              <span className="italic">"{interimVoiceTranscript || 'Listening...'}"</span>
            </div>
          )}

          {voiceError && (
            <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded-xl text-[10.5px] text-amber-800 dark:text-amber-400">
              {voiceError}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
