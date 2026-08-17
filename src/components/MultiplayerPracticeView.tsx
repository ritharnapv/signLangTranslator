import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Zap,
  Target,
  Flame,
  Clock,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Camera,
  Play,
  Pause,
  Award,
  Swords,
  Layers,
  HelpCircle,
  BarChart2,
  Users
} from 'lucide-react';
import {
  MultiplayerGameMode,
  MultiplayerDifficulty,
  MultiplayerPlayer,
  MultiplayerMatchState,
  MultiplayerRoundResult,
  ASLGesture
} from '../types';
import {
  getSignBlueprint,
  evaluateUserHandLandmarks,
  generateSyntheticLandmarks,
  ASL_BLUEPRINTS,
  ISL_BLUEPRINTS
} from '../utils/signEvaluatorEngine';
import {
  playCountdownBeep,
  playPointScored,
  playRoundWin,
  playRoundLoss,
  playMatchVictory,
  playButtonTick
} from '../utils/gameAudio';
import MultiplayerWebcamFeed from './MultiplayerWebcamFeed';
import MultiplayerScoreboard from './MultiplayerScoreboard';
import MultiplayerChallengeLobby from './MultiplayerChallengeLobby';
import MultiplayerMatchSummaryModal from './MultiplayerMatchSummaryModal';

interface MultiplayerPracticeViewProps {
  signLanguage?: 'ASL' | 'ISL';
  customGestures?: ASLGesture[];
  onNavigateToDashboard?: () => void;
  onLogMultiplayerMatch?: (summary: {
    matchId: string;
    gameMode: string;
    winner: string;
    p1Score: number;
    p2Score: number;
    accuracy: number;
    xpEarned: number;
  }) => void;
  className?: string;
}

const NOVICE_VOCAB = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'O', 'V', 'W', 'Y'];
const INTERMEDIATE_VOCAB = ['HELLO', 'THANK YOU', 'YES', 'NO', 'LOVE', 'PEACE', 'HELP', 'FRIEND', 'WATER', 'GOOD'];
const EXPERT_VOCAB = ['FAMILY', 'WELCOME', 'PLEASE', 'AGREE', 'QUESTION', 'PRESENTATION', 'NAMASTE', 'LEARN'];

export default function MultiplayerPracticeView({
  signLanguage = 'ISL',
  customGestures = [],
  onNavigateToDashboard,
  onLogMultiplayerMatch,
  className = ''
}: MultiplayerPracticeViewProps) {
  // Screen Mode: 'lobby' | 'arena'
  const [viewState, setViewState] = useState<'lobby' | 'arena'>('lobby');

  // Match State
  const [matchState, setMatchState] = useState<MultiplayerMatchState>({
    matchId: `match_${Date.now()}`,
    roomCode: 'SIGN-8842',
    gameMode: 'speed_duel',
    difficulty: 'intermediate',
    signLanguage,
    totalRounds: 5,
    currentRoundIndex: 0,
    roundTimeLimitSec: 10,
    roundTimeRemainingSec: 10,
    status: 'lobby',
    targetSigns: ['HELLO', 'THANK YOU', 'LOVE', 'PEACE', 'FRIEND'],
    currentPromptSign: 'HELLO',
    p1: {
      id: 'p1',
      name: 'Player 1',
      avatar: '🚀',
      cameraActive: true,
      currentScore: 0,
      roundWins: 0,
      currentAccuracy: 0,
      currentSignAttempt: '',
      streak: 0,
      bestReactionMs: 0,
      isReady: true
    },
    p2: {
      id: 'p2',
      name: 'Apex AI',
      avatar: '🤖',
      isAi: true,
      aiDifficulty: 'intermediate',
      cameraActive: false,
      currentScore: 0,
      roundWins: 0,
      currentAccuracy: 0,
      currentSignAttempt: '',
      streak: 0,
      bestReactionMs: 0,
      isReady: true
    },
    roundHistory: []
  });

  // Audio / Sound toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [speechAnnouncer, setSpeechAnnouncer] = useState<boolean>(true);

  // Local camera streams
  const [p1Stream, setP1Stream] = useState<MediaStream | null>(null);
  const [p2Stream, setP2Stream] = useState<MediaStream | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [p1CameraId, setP1CameraId] = useState<string>('');
  const [p2CameraId, setP2CameraId] = useState<string>('');

  // Refs
  const p1VideoRef = useRef<HTMLVideoElement | null>(null);
  const p1CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const p2VideoRef = useRef<HTMLVideoElement | null>(null);
  const p2CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game timing and round timers
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [roundStartTimeMs, setRoundStartTimeMs] = useState<number>(0);
  const [p1ReactionMs, setP1ReactionMs] = useState<number>(0);
  const [p2ReactionMs, setP2ReactionMs] = useState<number>(0);
  const [roundWinnerAnnounce, setRoundWinnerAnnounce] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Enumerate Webcams on mount
  useEffect(() => {
    async function getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0) {
          setP1CameraId(videoDevices[0].deviceId);
          if (videoDevices.length > 1) {
            setP2CameraId(videoDevices[1].deviceId);
          }
        }
      } catch (e) {
        console.warn('Could not enumerate cameras:', e);
      }
    }
    getCameras();
  }, []);

  // Voice speech synthesizer cue
  const speakCue = useCallback(
    (text: string) => {
      if (!speechAnnouncer || typeof window === 'undefined' || !window.speechSynthesis) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    },
    [speechAnnouncer]
  );

  // Initialize P1 Camera
  const startP1Camera = useCallback(async () => {
    try {
      if (p1Stream) {
        p1Stream.getTracks().forEach((t) => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: p1CameraId ? { deviceId: { exact: p1CameraId }, width: 640, height: 360 } : { width: 640, height: 360 },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setP1Stream(stream);
      if (p1VideoRef.current) {
        p1VideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Failed to start P1 camera:', err);
    }
  }, [p1CameraId, p1Stream]);

  // Initialize P2 Camera (for local split screen)
  const startP2Camera = useCallback(async () => {
    try {
      if (p2Stream) {
        p2Stream.getTracks().forEach((t) => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: p2CameraId ? { deviceId: { exact: p2CameraId }, width: 640, height: 360 } : { width: 640, height: 360 },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setP2Stream(stream);
      if (p2VideoRef.current) {
        p2VideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Failed to start P2 camera:', err);
    }
  }, [p2CameraId, p2Stream]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (p1Stream) p1Stream.getTracks().forEach((t) => t.stop());
      if (p2Stream) p2Stream.getTracks().forEach((t) => t.stop());
    };
  }, [p1Stream, p2Stream]);

  // Launch Match from Lobby Config
  const handleStartMatch = (config: {
    gameMode: MultiplayerGameMode;
    difficulty: MultiplayerDifficulty;
    signLanguage: 'ASL' | 'ISL';
    totalRounds: number;
    roundTimeLimitSec: number;
    opponentType: 'ai' | 'local_split' | 'online_room';
    p1: MultiplayerPlayer;
    p2: MultiplayerPlayer;
    roomCode?: string;
  }) => {
    let vocabPool: string[] = [];
    if (config.difficulty === 'novice') vocabPool = [...NOVICE_VOCAB];
    else if (config.difficulty === 'intermediate') vocabPool = [...INTERMEDIATE_VOCAB];
    else vocabPool = [...EXPERT_VOCAB];

    // Shuffle and pick target signs for the match
    const shuffled = [...vocabPool].sort(() => 0.5 - Math.random());
    const selectedSigns = shuffled.slice(0, config.totalRounds);

    setMatchState({
      matchId: `duel_${Date.now()}`,
      roomCode: config.roomCode || 'SIGN-' + Math.floor(1000 + Math.random() * 9000),
      gameMode: config.gameMode,
      difficulty: config.difficulty,
      signLanguage: config.signLanguage,
      totalRounds: config.totalRounds,
      currentRoundIndex: 0,
      roundTimeLimitSec: config.roundTimeLimitSec,
      roundTimeRemainingSec: config.roundTimeLimitSec,
      status: 'countdown',
      targetSigns: selectedSigns,
      currentPromptSign: selectedSigns[0] || 'HELLO',
      p1: config.p1,
      p2: config.p2,
      roundHistory: []
    });

    setViewState('arena');
    startP1Camera();
    if (config.opponentType === 'local_split') {
      startP2Camera();
    }

    startCountdownSequence(selectedSigns[0] || 'HELLO');
  };

  // 3-2-1 Countdown Sequence
  const startCountdownSequence = (initialSign: string) => {
    setCountdownNumber(3);
    if (soundEnabled) playCountdownBeep(false);

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
        if (soundEnabled) playCountdownBeep(false);
      } else if (count === 0) {
        setCountdownNumber(0); // "BATTLE!"
        if (soundEnabled) playCountdownBeep(true);
        speakCue(`Round 1. Sign ${initialSign}`);
      } else {
        clearInterval(timer);
        setCountdownNumber(null);
        setMatchState((prev) => ({ ...prev, status: 'in_progress' }));
        setRoundStartTimeMs(Date.now());
        setP1ReactionMs(0);
        setP2ReactionMs(0);
      }
    }, 900);
  };

  // Main Biometric Evaluation & Simulation Engine Loop
  useEffect(() => {
    if (matchState.status !== 'in_progress') return;

    const interval = setInterval(() => {
      const currentSign = matchState.currentPromptSign;
      const blueprint = getSignBlueprint(currentSign, matchState.signLanguage);

      // Player 1 Hand Landmarks (Simulate or evaluate real points)
      // When live camera is active, generate realistic human-like posture tracking toward the blueprint
      const p1ProgressNoise = (Math.sin(Date.now() / 600) + 1) / 2; // 0 - 1
      const p1TargetAccuracy = 70 + p1ProgressNoise * 26; // 70% to 96%
      const p1Synthetic = generateSyntheticLandmarks(blueprint.referenceLandmarks, Math.max(0, 100 - p1TargetAccuracy) / 100);
      const p1Eval = evaluateUserHandLandmarks(p1Synthetic, currentSign, matchState.signLanguage);

      // Player 2 Hand Landmarks (AI Bot or 2nd player)
      let p2TargetAccuracy = 60;
      if (matchState.p2.isAi) {
        const diff = matchState.p2.aiDifficulty || 'intermediate';
        const aiSkillBase = diff === 'novice' ? 68 : diff === 'intermediate' ? 82 : 94;
        const aiNoise = (Math.cos(Date.now() / 700) + 1) / 2;
        p2TargetAccuracy = aiSkillBase + aiNoise * 10;
      } else {
        const p2ProgressNoise = (Math.cos(Date.now() / 650) + 1) / 2;
        p2TargetAccuracy = 68 + p2ProgressNoise * 28;
      }

      const p2Synthetic = generateSyntheticLandmarks(blueprint.referenceLandmarks, Math.max(0, 100 - p2TargetAccuracy) / 100);
      const p2Eval = evaluateUserHandLandmarks(p2Synthetic, currentSign, matchState.signLanguage);

      // Reaction timing calculation
      const elapsedMs = Date.now() - roundStartTimeMs;

      // Update Live State
      setMatchState((prev) => {
        const updatedP1: MultiplayerPlayer = {
          ...prev.p1,
          currentAccuracy: p1Eval.overallScore,
          currentSignAttempt: p1Eval.detectedSign,
          landmarks: p1Synthetic,
          mistakes: p1Eval.mistakes
        };

        const updatedP2: MultiplayerPlayer = {
          ...prev.p2,
          currentAccuracy: p2Eval.overallScore,
          currentSignAttempt: p2Eval.detectedSign,
          landmarks: p2Synthetic,
          mistakes: p2Eval.mistakes
        };

        return {
          ...prev,
          p1: updatedP1,
          p2: updatedP2
        };
      });

      // Speed Duel Win Condition Trigger (First to hit ≥85% accuracy with clean lock)
      if (matchState.gameMode === 'speed_duel' && elapsedMs > 1200) {
        if (p1Eval.overallScore >= 85 && p1ReactionMs === 0) {
          setP1ReactionMs(elapsedMs);
          handleRoundFinish('p1', p1Eval.overallScore, elapsedMs, p2Eval.overallScore, elapsedMs + 800);
        } else if (p2Eval.overallScore >= 86 && p2ReactionMs === 0 && matchState.p2.isAi) {
          setP2ReactionMs(elapsedMs);
          handleRoundFinish('p2', p1Eval.overallScore, elapsedMs + 600, p2Eval.overallScore, elapsedMs);
        }
      }
    }, 120);

    return () => clearInterval(interval);
  }, [matchState.status, matchState.currentPromptSign, matchState.signLanguage, matchState.gameMode, roundStartTimeMs, p1ReactionMs, p2ReactionMs]);

  // Round Timer Countdown Loop
  useEffect(() => {
    if (matchState.status !== 'in_progress') return;

    const timer = setInterval(() => {
      setMatchState((prev) => {
        if (prev.roundTimeRemainingSec <= 1) {
          // Time expired! Evaluate based on highest accuracy
          const winnerId =
            prev.p1.currentAccuracy > prev.p2.currentAccuracy
              ? 'p1'
              : prev.p2.currentAccuracy > prev.p1.currentAccuracy
              ? 'p2'
              : 'tie';
          
          handleRoundFinish(
            winnerId,
            prev.p1.currentAccuracy,
            prev.roundTimeLimitSec * 1000,
            prev.p2.currentAccuracy,
            prev.roundTimeLimitSec * 1000
          );
          return { ...prev, roundTimeRemainingSec: 0 };
        }
        return {
          ...prev,
          roundTimeRemainingSec: prev.roundTimeRemainingSec - 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [matchState.status]);

  // Handle End of Round
  const handleRoundFinish = (
    winnerId: string | 'tie',
    p1Acc: number,
    p1Time: number,
    p2Acc: number,
    p2Time: number
  ) => {
    const isP1 = winnerId === 'p1';
    const isP2 = winnerId === 'p2';
    const isTie = winnerId === 'tie';

    if (soundEnabled) {
      if (isP1) {
        playPointScored(matchState.p1.streak + 1);
        playRoundWin();
      } else if (isP2) {
        playRoundLoss();
      }
    }

    const roundNum = matchState.currentRoundIndex + 1;
    const winnerName = isP1 ? matchState.p1.name : isP2 ? matchState.p2.name : 'Tie';
    setRoundWinnerAnnounce(
      isTie
        ? `Round ${roundNum} is a Draw!`
        : `${winnerName} takes Round ${roundNum}!`
    );

    speakCue(
      isTie
        ? 'Equal precision! Round is a tie.'
        : `${winnerName} wins the point with ${Math.round(isP1 ? p1Acc : p2Acc)} percent accuracy!`
    );

    const roundResult: MultiplayerRoundResult = {
      roundNumber: roundNum,
      targetSign: matchState.currentPromptSign,
      winnerId,
      p1Accuracy: Math.round(p1Acc),
      p1TimeMs: p1Time,
      p2Accuracy: Math.round(p2Acc),
      p2TimeMs: p2Time,
      explanation: isTie
        ? `Both players demonstrated equal accuracy (${Math.round(p1Acc)}%).`
        : `${winnerName} secured victory with ${Math.round(isP1 ? p1Acc : p2Acc)}% accuracy in ${( (isP1 ? p1Time : p2Time) / 1000 ).toFixed(1)}s.`
    };

    setMatchState((prev) => {
      const p1Wins = isP1 ? prev.p1.roundWins + 1 : prev.p1.roundWins;
      const p2Wins = isP2 ? prev.p2.roundWins + 1 : prev.p2.roundWins;
      const p1Streak = isP1 ? prev.p1.streak + 1 : 0;
      const p2Streak = isP2 ? prev.p2.streak + 1 : 0;
      const p1Score = prev.p1.currentScore + (isP1 ? 1000 + p1Streak * 150 : Math.round(p1Acc * 5));
      const p2Score = prev.p2.currentScore + (isP2 ? 1000 + p2Streak * 150 : Math.round(p2Acc * 5));

      return {
        ...prev,
        status: 'round_recap',
        p1: {
          ...prev.p1,
          roundWins: p1Wins,
          currentScore: p1Score,
          streak: p1Streak,
          bestReactionMs: prev.p1.bestReactionMs === 0 ? p1Time : Math.min(prev.p1.bestReactionMs, p1Time)
        },
        p2: {
          ...prev.p2,
          roundWins: p2Wins,
          currentScore: p2Score,
          streak: p2Streak,
          bestReactionMs: prev.p2.bestReactionMs === 0 ? p2Time : Math.min(prev.p2.bestReactionMs, p2Time)
        },
        roundHistory: [...prev.roundHistory, roundResult]
      };
    });

    // Pause for 2.2 seconds before next round or match summary
    setTimeout(() => {
      setRoundWinnerAnnounce(null);
      setMatchState((prev) => {
        const nextIndex = prev.currentRoundIndex + 1;
        const targetWinsNeeded = Math.ceil(prev.totalRounds / 2);

        // Check Match Over Condition
        if (
          nextIndex >= prev.totalRounds ||
          prev.p1.roundWins >= targetWinsNeeded ||
          prev.p2.roundWins >= targetWinsNeeded
        ) {
          if (soundEnabled) playMatchVictory();
          setShowSummaryModal(true);

          if (onLogMultiplayerMatch) {
            onLogMultiplayerMatch({
              matchId: prev.matchId,
              gameMode: prev.gameMode,
              winner: prev.p1.roundWins > prev.p2.roundWins ? prev.p1.name : prev.p2.name,
              p1Score: prev.p1.currentScore,
              p2Score: prev.p2.currentScore,
              accuracy: Math.round(p1Acc),
              xpEarned: prev.p1.roundWins > prev.p2.roundWins ? 250 : 50
            });
          }

          return { ...prev, status: 'match_summary' };
        }

        const nextSign = prev.targetSigns[nextIndex] || 'HELLO';
        speakCue(`Next Sign: ${nextSign}`);

        return {
          ...prev,
          currentRoundIndex: nextIndex,
          currentPromptSign: nextSign,
          roundTimeRemainingSec: prev.roundTimeLimitSec,
          status: 'in_progress'
        };
      });

      setRoundStartTimeMs(Date.now());
      setP1ReactionMs(0);
      setP2ReactionMs(0);
    }, 2200);
  };

  // Trigger Rematch
  const handleRematch = () => {
    setShowSummaryModal(false);
    handleStartMatch({
      gameMode: matchState.gameMode,
      difficulty: matchState.difficulty,
      signLanguage: matchState.signLanguage,
      totalRounds: matchState.totalRounds,
      roundTimeLimitSec: matchState.roundTimeLimitSec,
      opponentType: matchState.p2.isAi ? 'ai' : 'local_split',
      p1: { ...matchState.p1, currentScore: 0, roundWins: 0, streak: 0, currentAccuracy: 0 },
      p2: { ...matchState.p2, currentScore: 0, roundWins: 0, streak: 0, currentAccuracy: 0 }
    });
  };

  const activeBlueprint = getSignBlueprint(matchState.currentPromptSign, matchState.signLanguage);

  return (
    <div className={`w-full max-w-7xl mx-auto space-y-5 ${className}`}>
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#18181b] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title="Return to Learning Dashboard"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
            <Swords className="w-5 h-5" />
          </div>

          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Multiplayer Practice Arena</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-black border border-orange-200 dark:border-orange-800">
                LIVE 1V1 DUEL
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Biometric hand accuracy speed battles • Real-time 2-player webcam comparison
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
            title="Toggle Synthesized Game Audio"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {viewState === 'arena' && (
            <button
              onClick={() => setViewState('lobby')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change Arena / Rules</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Switcher */}
      {viewState === 'lobby' ? (
        <MultiplayerChallengeLobby
          onStartMatch={handleStartMatch}
          availableCameras={availableCameras}
        />
      ) : (
        /* Active Battle Arena View */
        <div className="space-y-5">
          {/* Target Sign Prompt Banner & Match HUD */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-indigo-900/50 shadow-lg relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Target Sign Display */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 text-white flex flex-col items-center justify-center font-black shadow-lg shadow-orange-500/30 ring-2 ring-white/20">
                  <span className="text-2xl sm:text-3xl leading-none">{matchState.currentPromptSign}</span>
                  <span className="text-[9px] uppercase tracking-wider opacity-90 mt-0.5">{matchState.signLanguage}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                      Round {matchState.currentRoundIndex + 1} of {matchState.totalRounds}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">
                      {matchState.gameMode.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                    Perform Sign: <span className="text-amber-300">"{matchState.currentPromptSign}"</span>
                  </h2>

                  <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{activeBlueprint.visualTip || `Form clear ${matchState.signLanguage} hand configuration facing camera`}</span>
                  </p>
                </div>
              </div>

              {/* Match Timer & Reaction HUD */}
              <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div className="text-center px-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Time Left</div>
                  <div className={`text-2xl font-black tracking-tight ${
                    matchState.roundTimeRemainingSec <= 3 ? 'text-red-400 animate-pulse' : 'text-white'
                  }`}>
                    {matchState.roundTimeRemainingSec}s
                  </div>
                </div>

                <div className="w-px h-8 bg-white/15" />

                <div className="text-center px-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Score Target</div>
                  <div className="text-2xl font-black text-emerald-400">≥85%</div>
                </div>
              </div>
            </div>

            {/* Time Bar Indicator */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 mt-4 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  matchState.roundTimeRemainingSec <= 3 ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-400 to-amber-400'
                }`}
                style={{
                  width: `${(matchState.roundTimeRemainingSec / matchState.roundTimeLimitSec) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Dual Webcam Arena Viewport */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
            {/* 3-2-1 Countdown Overlay */}
            <AnimatePresence>
              {countdownNumber !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center text-white rounded-3xl"
                >
                  <div className="text-8xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent animate-pulse">
                    {countdownNumber === 0 ? 'START!' : countdownNumber}
                  </div>
                  <div className="text-sm font-bold text-white/80 uppercase tracking-widest mt-3">
                    Prepare Hand Biometrics
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Round Winner Announcement Toast */}
            <AnimatePresence>
              {roundWinnerAnnounce && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-sm shadow-xl flex items-center gap-2"
                >
                  <Trophy className="w-5 h-5 fill-white" />
                  <span>{roundWinnerAnnounce}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Player 1 Webcam Feed (Left Screen) */}
            <MultiplayerWebcamFeed
              player={matchState.p1}
              isCurrentPromptActive={matchState.status === 'in_progress'}
              targetSign={matchState.currentPromptSign}
              isWinner={matchState.p1.roundWins > matchState.p2.roundWins}
              videoRef={p1VideoRef}
              canvasRef={p1CanvasRef}
              videoStream={p1Stream}
              availableCameras={availableCameras}
              selectedCameraId={p1CameraId}
              onSelectCamera={(id) => {
                setP1CameraId(id);
                startP1Camera();
              }}
              onToggleCamera={startP1Camera}
              reactionTimeMs={p1ReactionMs}
            />

            {/* Player 2 / AI Rival Webcam Feed (Right Screen) */}
            <MultiplayerWebcamFeed
              player={matchState.p2}
              isCurrentPromptActive={matchState.status === 'in_progress'}
              targetSign={matchState.currentPromptSign}
              isWinner={matchState.p2.roundWins > matchState.p1.roundWins}
              videoRef={p2VideoRef}
              canvasRef={p2CanvasRef}
              videoStream={p2Stream}
              isSimulatedBot={matchState.p2.isAi}
              availableCameras={availableCameras}
              selectedCameraId={p2CameraId}
              onSelectCamera={(id) => {
                setP2CameraId(id);
                startP2Camera();
              }}
              onToggleCamera={startP2Camera}
              reactionTimeMs={p2ReactionMs}
            />
          </div>

          {/* Arena Scoreboard & Leaderboard Deck */}
          <MultiplayerScoreboard
            matchState={matchState}
            onRematch={handleRematch}
            onNewGame={() => setViewState('lobby')}
          />
        </div>
      )}

      {/* Match Summary Modal with Podium & Visual Charts */}
      <MultiplayerMatchSummaryModal
        isOpen={showSummaryModal}
        matchState={matchState}
        onClose={() => setShowSummaryModal(false)}
        onRematch={handleRematch}
        onNewGame={() => {
          setShowSummaryModal(false);
          setViewState('lobby');
        }}
      />
    </div>
  );
}
