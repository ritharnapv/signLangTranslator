import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Target,
  Flame,
  Bot,
  Users,
  Globe,
  Trophy,
  Sparkles,
  Shield,
  Clock,
  Play,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  ChevronRight,
  Video,
  Volume2
} from 'lucide-react';
import { MultiplayerGameMode, MultiplayerDifficulty, MultiplayerPlayer } from '../types';

interface MultiplayerChallengeLobbyProps {
  onStartMatch: (config: {
    gameMode: MultiplayerGameMode;
    difficulty: MultiplayerDifficulty;
    signLanguage: 'ASL' | 'ISL';
    totalRounds: number;
    roundTimeLimitSec: number;
    opponentType: 'ai' | 'local_split' | 'online_room';
    p1: MultiplayerPlayer;
    p2: MultiplayerPlayer;
    roomCode?: string;
  }) => void;
  availableCameras?: MediaDeviceInfo[];
  className?: string;
}

const AVATAR_OPTIONS = ['🚀', '👑', '⚡', '🥋', '🌺', '🦊', '🐉', '🤖', '🎯', '🌟', '🦄', '🔥'];

const GAME_MODES: Array<{
  id: MultiplayerGameMode;
  title: string;
  badge: string;
  icon: any;
  description: string;
  gradient: string;
}> = [
  {
    id: 'speed_duel',
    title: 'Speed Duel',
    badge: 'Fastest Hands',
    icon: Zap,
    description: 'First player to reach ≥85% accuracy locks the round point. Reflexes and rapid muscle memory win!',
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    id: 'precision_clash',
    title: 'Precision Clash',
    badge: 'Perfect Biometrics',
    icon: Target,
    description: 'Pose hold challenge! The player with the highest biomechanical accuracy score claims the victory.',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'sign_gauntlet',
    title: 'Sign Gauntlet',
    badge: 'Endurance Streak',
    icon: Flame,
    description: 'Rapid-fire sign stream with decreasing timers. Maintain combos without breaking your streak!',
    gradient: 'from-red-500 to-pink-600'
  },
  {
    id: 'mimic_battle',
    title: 'Echo Mimic',
    badge: 'Mirror Challenge',
    icon: Trophy,
    description: 'Identify and replicate the requested dynamic hand shape before the countdown buzzer rings.',
    gradient: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'sudden_death',
    title: 'Sudden Death',
    badge: 'High Stakes 1v1',
    icon: Shield,
    description: 'Single high-tension 3-second round. Zero room for error — winner takes all glory!',
    gradient: 'from-rose-600 to-red-700'
  }
];

export default function MultiplayerChallengeLobby({
  onStartMatch,
  availableCameras = [],
  className = ''
}: MultiplayerChallengeLobbyProps) {
  const [gameMode, setGameMode] = useState<MultiplayerGameMode>('speed_duel');
  const [difficulty, setDifficulty] = useState<MultiplayerDifficulty>('intermediate');
  const [signLanguage, setSignLanguage] = useState<'ASL' | 'ISL'>('ISL');
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [roundTimeLimitSec, setRoundTimeLimitSec] = useState<number>(10);
  const [opponentType, setOpponentType] = useState<'ai' | 'local_split' | 'online_room'>('ai');

  // Player custom states
  const [p1Name, setP1Name] = useState<string>('Player 1');
  const [p1Avatar, setP1Avatar] = useState<string>('🚀');

  const [p2Name, setP2Name] = useState<string>('Apex AI');
  const [p2Avatar, setP2Avatar] = useState<string>('🤖');
  const [aiDifficulty, setAiDifficulty] = useState<'novice' | 'intermediate' | 'expert'>('intermediate');

  const [roomCode, setRoomCode] = useState<string>('SIGN-' + Math.floor(1000 + Math.random() * 9000));
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const handleCopyRoomCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLaunch = () => {
    const player1: MultiplayerPlayer = {
      id: 'p1',
      name: p1Name.trim() || 'Player 1',
      avatar: p1Avatar,
      cameraActive: true,
      currentScore: 0,
      roundWins: 0,
      currentAccuracy: 0,
      currentSignAttempt: '',
      streak: 0,
      bestReactionMs: 0,
      isReady: true
    };

    const player2: MultiplayerPlayer = {
      id: 'p2',
      name: opponentType === 'ai' ? `${aiDifficulty.toUpperCase()} Bot` : p2Name.trim() || 'Player 2',
      avatar: opponentType === 'ai' ? '🤖' : p2Avatar,
      isAi: opponentType === 'ai',
      aiDifficulty: opponentType === 'ai' ? aiDifficulty : undefined,
      cameraActive: opponentType !== 'ai',
      currentScore: 0,
      roundWins: 0,
      currentAccuracy: 0,
      currentSignAttempt: '',
      streak: 0,
      bestReactionMs: 0,
      isReady: true
    };

    onStartMatch({
      gameMode,
      difficulty,
      signLanguage,
      totalRounds,
      roundTimeLimitSec,
      opponentType,
      p1: player1,
      p2: player2,
      roomCode: opponentType === 'online_room' ? roomCode : undefined
    });
  };

  return (
    <div className={`bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multiplayer Battle Arena</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Sign Language Multiplayer Duel
            </h2>
            <p className="text-xs sm:text-sm text-white/90 font-medium mt-1">
              Challenge peers or AI rivals in live webcam gesture accuracy duels with real-time biometric evaluation!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSignLanguage(signLanguage === 'ISL' ? 'ASL' : 'ISL')}
              className="px-3.5 py-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-white/30"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Language: {signLanguage}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Setup Controls */}
      <div className="p-6 space-y-6">
        {/* Section 1: Choose Game Mode */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-orange-500" />
            <span>1. Select Challenge Mode</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GAME_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = gameMode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => setGameMode(mode.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-500 dark:border-orange-600 ring-2 ring-orange-500/40 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#202024] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${mode.gradient} text-white flex items-center justify-center shadow-xs`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {mode.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{mode.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{mode.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Opponent & Match Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Opponent Selection */}
          <div className="bg-slate-50 dark:bg-[#202024] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-500" />
              <span>2. Opponent Arena Mode</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setOpponentType('ai')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  opponentType === 'ai'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500 font-bold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Bot className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                <div className="text-xs font-black">AI Sparring</div>
                <div className="text-[9px] text-slate-400">Solo Training</div>
              </button>

              <button
                onClick={() => setOpponentType('local_split')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  opponentType === 'local_split'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500 font-bold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                <div className="text-xs font-black">Dual Local</div>
                <div className="text-[9px] text-slate-400">1 Screen / 2 Cam</div>
              </button>

              <button
                onClick={() => setOpponentType('online_room')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  opponentType === 'online_room'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500 font-bold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Globe className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                <div className="text-xs font-black">Online Room</div>
                <div className="text-[9px] text-slate-400">Shareable Code</div>
              </button>
            </div>

            {/* Sub-config for Opponent */}
            {opponentType === 'ai' && (
              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">AI Bot Skill Tier</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['novice', 'intermediate', 'expert'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setAiDifficulty(tier)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        aiDifficulty === tier
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {opponentType === 'online_room' && (
              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Arena Room Code</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-black tracking-widest text-center"
                  />
                  <button
                    onClick={handleCopyRoomCode}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Match Rules & Length */}
          <div className="bg-slate-50 dark:bg-[#202024] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-orange-500" />
              <span>3. Match Rules & Difficulty</span>
            </label>

            {/* Difficulty Level */}
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Vocabulary Tier</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'novice', label: 'Novice (A-Z, 0-9)' },
                  { id: 'intermediate', label: 'Medium (Words)' },
                  { id: 'expert', label: 'Expert (Phrases)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDifficulty(item.id as any)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                      difficulty === item.id
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Rounds */}
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Match Rounds</div>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 7, 10].map((rounds) => (
                  <button
                    key={rounds}
                    onClick={() => setTotalRounds(rounds)}
                    className={`py-2 rounded-xl text-xs font-black text-center transition-all cursor-pointer ${
                      totalRounds === rounds
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Best of {rounds}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Limit */}
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Round Time Limit</div>
              <div className="grid grid-cols-4 gap-2">
                {[5, 8, 10, 15].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setRoundTimeLimitSec(sec)}
                    className={`py-1.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                      roundTimeLimitSec === sec
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {sec}s / sign
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Player Customization Card */}
        <div className="p-4 bg-slate-50 dark:bg-[#202024] rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Player 1 Profile */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Player 1 (Challenger)</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={p1Avatar}
                  onChange={(e) => setP1Avatar(e.target.value)}
                  className="bg-white dark:bg-slate-800 text-lg rounded-xl p-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {AVATAR_OPTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  placeholder="Your Name"
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Player 2 Profile (if not AI) */}
            {opponentType !== 'ai' && (
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Player 2 (Rival)</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={p2Avatar}
                    onChange={(e) => setP2Avatar(e.target.value)}
                    className="bg-white dark:bg-slate-800 text-lg rounded-xl p-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {AVATAR_OPTIONS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={p2Name}
                    onChange={(e) => setP2Name(e.target.value)}
                    placeholder="Opponent Name"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Button Ribbon */}
      <div className="p-6 bg-slate-50/80 dark:bg-[#202024] border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Ready to enter the <span className="font-bold text-slate-800 dark:text-white">{signLanguage} Arena</span> with{' '}
          <span className="font-bold text-orange-600 dark:text-orange-400">{gameMode.replace('_', ' ').toUpperCase()}</span> rules.
        </div>

        <button
          onClick={handleLaunch}
          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 active:scale-98 text-white rounded-2xl font-black text-sm transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Enter Battle Arena</span>
        </button>
      </div>
    </div>
  );
}
