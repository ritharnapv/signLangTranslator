import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Award,
  Zap,
  Flame,
  Clock,
  Shield,
  TrendingUp,
  Target,
  Sparkles,
  Medal,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BarChart2
} from 'lucide-react';
import { MultiplayerMatchState, MultiplayerLeaderboardEntry, MultiplayerRoundResult } from '../types';

interface MultiplayerScoreboardProps {
  matchState: MultiplayerMatchState;
  leaderboardData?: MultiplayerLeaderboardEntry[];
  onRematch?: () => void;
  onNewGame?: () => void;
  className?: string;
}

const DEFAULT_LEADERBOARD: MultiplayerLeaderboardEntry[] = [
  { rank: 1, playerName: 'Aarav_MasterSign', avatar: '👑', eloRating: 2450, tier: 'Grandmaster', wins: 142, losses: 18, winRate: 88.7, avgAccuracy: 96.4, highestStreak: 21 },
  { rank: 2, playerName: 'Elena_SwiftHands', avatar: '⚡', eloRating: 2310, tier: 'Grandmaster', wins: 119, losses: 26, winRate: 82.0, avgAccuracy: 95.1, highestStreak: 16 },
  { rank: 3, playerName: 'Rohan_SignPro', avatar: '🌟', eloRating: 2180, tier: 'Diamond', wins: 98, losses: 31, winRate: 75.9, avgAccuracy: 93.8, highestStreak: 12 },
  { rank: 4, playerName: 'You (Champion)', avatar: '🚀', eloRating: 1850, tier: 'Platinum', wins: 46, losses: 14, winRate: 76.6, avgAccuracy: 92.3, highestStreak: 9, isUser: true },
  { rank: 5, playerName: 'Maya_GestureTech', avatar: '🎯', eloRating: 1790, tier: 'Platinum', wins: 64, losses: 28, winRate: 69.5, avgAccuracy: 90.7, highestStreak: 8 },
  { rank: 6, playerName: 'Cyber_Signer99', avatar: '🤖', eloRating: 1620, tier: 'Gold', wins: 41, losses: 35, winRate: 53.9, avgAccuracy: 88.2, highestStreak: 6 },
  { rank: 7, playerName: 'Priya_Learner', avatar: '🌺', eloRating: 1540, tier: 'Gold', wins: 33, losses: 29, winRate: 53.2, avgAccuracy: 86.9, highestStreak: 5 },
  { rank: 8, playerName: 'Sam_DeafAdvocate', avatar: '🤝', eloRating: 1490, tier: 'Silver', wins: 28, losses: 32, winRate: 46.6, avgAccuracy: 85.0, highestStreak: 4 }
];

export default function MultiplayerScoreboard({
  matchState,
  leaderboardData = DEFAULT_LEADERBOARD,
  onRematch,
  onNewGame,
  className = ''
}: MultiplayerScoreboardProps) {
  const [scoreboardTab, setScoreboardTab] = useState<'match' | 'rounds' | 'leaderboard'>('match');
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | 'weekly' | 'friends'>('all');

  const { p1, p2, roundHistory, currentRoundIndex, totalRounds, gameMode } = matchState;

  // Formatting game mode labels
  const getGameModeLabel = (mode: string) => {
    switch (mode) {
      case 'speed_duel': return '⚡ Speed Duel';
      case 'precision_clash': return '🎯 Precision Clash';
      case 'sign_gauntlet': return '🥊 Sign Gauntlet';
      case 'mimic_battle': return '🎭 Mimic Echo';
      case 'sudden_death': return '💀 Sudden Death';
      default: return 'Arena Duel';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Grandmaster': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60';
      case 'Diamond': return 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700/60';
      case 'Platinum': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60';
      case 'Gold': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-700/60';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className={`bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Scoreboard Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#202024] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>Arena Scoreboard</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-800">
                {getGameModeLabel(gameMode)}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Round {Math.min(currentRoundIndex + 1, totalRounds)} of {totalRounds} • First to {Math.ceil(totalRounds / 2)} wins
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setScoreboardTab('match')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              scoreboardTab === 'match'
                ? 'bg-white dark:bg-[#27272a] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Live Match
          </button>
          <button
            onClick={() => setScoreboardTab('rounds')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              scoreboardTab === 'rounds'
                ? 'bg-white dark:bg-[#27272a] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Rounds ({roundHistory.length})
          </button>
          <button
            onClick={() => setScoreboardTab('leaderboard')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              scoreboardTab === 'leaderboard'
                ? 'bg-white dark:bg-[#27272a] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Rankings
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {scoreboardTab === 'match' && (
            <motion.div
              key="match-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              {/* Head to Head Duel Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Player 1 Card */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  p1.roundWins > p2.roundWins
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-[#202024] border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p1.avatar}</span>
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1">
                          <span>{p1.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-bold">P1</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Streak: <span className="font-bold text-amber-500">🔥 {p1.streak}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900 dark:text-white">{p1.roundWins}</div>
                      <div className="text-[9px] font-bold uppercase text-slate-400">Wins</div>
                    </div>
                  </div>

                  {/* Player 1 Stats */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Total Score:</span>
                      <span className="font-black text-slate-900 dark:text-white">{p1.currentScore.toLocaleString()} pts</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Live Accuracy:</span>
                      <span className={`font-bold ${p1.currentAccuracy >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                        {p1.currentAccuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Best Speed:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{p1.bestReactionMs > 0 ? `${(p1.bestReactionMs / 1000).toFixed(2)}s` : '--'}</span>
                    </div>
                  </div>
                </div>

                {/* Player 2 Card */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  p2.roundWins > p1.roundWins
                    ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
                    : 'bg-slate-50 dark:bg-[#202024] border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p2.avatar}</span>
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1">
                          <span>{p2.name}</span>
                          {p2.isAi && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded font-bold">AI BOT</span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded font-bold">P2</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Streak: <span className="font-bold text-amber-500">🔥 {p2.streak}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900 dark:text-white">{p2.roundWins}</div>
                      <div className="text-[9px] font-bold uppercase text-slate-400">Wins</div>
                    </div>
                  </div>

                  {/* Player 2 Stats */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Total Score:</span>
                      <span className="font-black text-slate-900 dark:text-white">{p2.currentScore.toLocaleString()} pts</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Live Accuracy:</span>
                      <span className={`font-bold ${p2.currentAccuracy >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                        {p2.currentAccuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Best Speed:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{p2.bestReactionMs > 0 ? `${(p2.bestReactionMs / 1000).toFixed(2)}s` : '--'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Dots Bar */}
              <div className="bg-slate-50 dark:bg-[#202024] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>Match Round Progression</span>
                  <span className="text-slate-400 font-normal">Target: First to {Math.ceil(totalRounds / 2)}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: totalRounds }).map((_, idx) => {
                    const roundResult = roundHistory[idx];
                    let statusBg = 'bg-slate-200 dark:bg-slate-700';
                    let statusLabel = `R${idx + 1}`;

                    if (roundResult) {
                      if (roundResult.winnerId === p1.id) {
                        statusBg = 'bg-emerald-500 text-white shadow-xs';
                        statusLabel = 'P1 Win';
                      } else if (roundResult.winnerId === p2.id) {
                        statusBg = 'bg-purple-500 text-white shadow-xs';
                        statusLabel = 'P2 Win';
                      } else {
                        statusBg = 'bg-amber-500 text-white';
                        statusLabel = 'Tie';
                      }
                    } else if (idx === currentRoundIndex) {
                      statusBg = 'bg-orange-500 text-white animate-pulse shadow-sm';
                      statusLabel = 'Live';
                    }

                    return (
                      <div
                        key={idx}
                        className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${statusBg}`}
                      >
                        {statusLabel}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {scoreboardTab === 'rounds' && (
            <motion.div
              key="rounds-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-2"
            >
              {roundHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No rounds finished yet. Start practicing to generate round telemetry!
                </div>
              ) : (
                roundHistory.map((round, idx) => {
                  const isP1Win = round.winnerId === p1.id;
                  const isP2Win = round.winnerId === p2.id;
                  const isTie = round.winnerId === 'tie';

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-[#202024] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-200">
                          #{round.roundNumber}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                            <span>Sign: <span className="text-orange-600 dark:text-orange-400">"{round.targetSign}"</span></span>
                            {isP1Win && <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-bold">P1 Winner</span>}
                            {isP2Win && <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded font-bold">P2 Winner</span>}
                            {isTie && <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded font-bold">Draw</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{round.explanation}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="text-[11px] font-bold text-slate-800 dark:text-white">{round.p1Accuracy}% <span className="text-[9px] text-slate-400 font-normal">({(round.p1TimeMs/1000).toFixed(1)}s)</span></div>
                          <div className="text-[9px] text-slate-400 font-semibold">P1 Stats</div>
                        </div>
                        <div className="text-slate-300 dark:text-slate-700">|</div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-800 dark:text-white">{round.p2Accuracy}% <span className="text-[9px] text-slate-400 font-normal">({(round.p2TimeMs/1000).toFixed(1)}s)</span></div>
                          <div className="text-[9px] text-slate-400 font-semibold">P2 Stats</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {scoreboardTab === 'leaderboard' && (
            <motion.div
              key="leaderboard-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3"
            >
              {/* Leaderboard Filter */}
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                <button
                  onClick={() => setLeaderboardFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    leaderboardFilter === 'all'
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Global Tier
                </button>
                <button
                  onClick={() => setLeaderboardFilter('weekly')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    leaderboardFilter === 'weekly'
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setLeaderboardFilter('friends')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    leaderboardFilter === 'friends'
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Friends Arena
                </button>
              </div>

              {/* Leaderboard Table List */}
              <div className="space-y-1.5">
                {leaderboardData.map((player) => (
                  <div
                    key={player.rank}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      player.isUser
                        ? 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 shadow-xs'
                        : 'bg-slate-50 dark:bg-[#202024] border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                        player.rank === 1 ? 'bg-amber-400 text-amber-950' :
                        player.rank === 2 ? 'bg-slate-300 text-slate-800' :
                        player.rank === 3 ? 'bg-amber-600 text-white' :
                        'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {player.rank}
                      </div>
                      <span className="text-base">{player.avatar}</span>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <span>{player.playerName}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full border font-bold ${getTierColor(player.tier)}`}>
                            {player.tier}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {player.wins}W - {player.losses}L • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{player.winRate}% Win Rate</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-slate-900 dark:text-white flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>{player.eloRating} ELO</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Avg Acc: <span className="font-semibold text-slate-700 dark:text-slate-300">{player.avgAccuracy}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="p-3 bg-slate-50/80 dark:bg-[#202024] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>Earn +50 XP per round win</span>
        </div>
        <div className="flex items-center gap-2">
          {onRematch && (
            <button
              onClick={onRematch}
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rematch</span>
            </button>
          )}
          {onNewGame && (
            <button
              onClick={onNewGame}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-98 text-slate-800 dark:text-white font-bold transition-all cursor-pointer"
            >
              New Arena
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
