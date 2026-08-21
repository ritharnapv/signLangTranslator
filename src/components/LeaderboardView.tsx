import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CompletionBadge, 
  LeaderboardFilterOptions, 
  LeaderboardTimeframe, 
  LeaderboardUser, 
  LeagueTier 
} from '../types';
import { 
  getRankedLeaderboardUsers, 
  filterAndSortLeaderboard, 
  getDailyResetCountdown, 
  getWeeklyResetCountdown, 
  getLeagueDefinition,
  getCurrentUserScoreTelemetry,
  getLeagueForXp
} from '../utils/leaderboardEngine';
import { ALL_COMPLETION_BADGES } from '../data/learningCurriculumData';
import { LEAGUE_DEFINITIONS } from '../data/leaderboardData';
import BadgeInspectorModal from './BadgeInspectorModal';
import LeaderboardUserProfileModal from './LeaderboardUserProfileModal';
import LeagueInfoModal from './LeagueInfoModal';
import { 
  Trophy, 
  Flame, 
  Target, 
  Sparkles, 
  Award, 
  Search, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Crown, 
  ShieldCheck, 
  Filter, 
  Calendar, 
  Swords, 
  Zap, 
  CheckCircle2, 
  Lock, 
  Info, 
  RefreshCw, 
  ChevronRight, 
  UserCheck, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface LeaderboardViewProps {
  currentUser?: any;
  preferredLanguage?: 'ASL' | 'ISL' | 'BOTH';
  onNavigateTab?: (tab: string, payload?: any) => void;
}

export default function LeaderboardView({
  currentUser,
  preferredLanguage = 'ISL',
  onNavigateTab
}: LeaderboardViewProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Filters
  const [activeTimeframe, setActiveTimeframe] = useState<LeaderboardTimeframe>('weekly');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges'>('leaderboard');
  const [selectedSignLanguage, setSelectedSignLanguage] = useState<'ALL' | 'ASL' | 'ISL'>('ALL');
  const [selectedLeague, setSelectedLeague] = useState<'ALL' | LeagueTier>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Badges View Filters
  const [badgeTierFilter, setBadgeTierFilter] = useState<'ALL' | 'bronze' | 'silver' | 'gold' | 'diamond'>('ALL');
  const [badgeCategoryFilter, setBadgeCategoryFilter] = useState<string>('ALL');

  // Modals
  const [selectedBadge, setSelectedBadge] = useState<CompletionBadge | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isLeagueModalOpen, setIsLeagueModalOpen] = useState<boolean>(false);

  // Timers
  const [dailyCountdown, setDailyCountdown] = useState<string>(getDailyResetCountdown());
  const [weeklyCountdown, setWeeklyCountdown] = useState<string>(getWeeklyResetCountdown());

  const userRowRef = useRef<HTMLDivElement | null>(null);

  // Load Leaderboard Users
  const loadLeaderboardData = async () => {
    try {
      const data = await getRankedLeaderboardUsers(currentUser, preferredLanguage);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();

    // Listen for leaderboard updates
    const handleUpdate = () => {
      loadLeaderboardData();
    };
    window.addEventListener('sign_ai_leaderboard_updated' as any, handleUpdate);

    // Live countdown timer (updates every second)
    const timer = setInterval(() => {
      setDailyCountdown(getDailyResetCountdown());
      setWeeklyCountdown(getWeeklyResetCountdown());
    }, 1000);

    return () => {
      window.removeEventListener('sign_ai_leaderboard_updated' as any, handleUpdate);
      clearInterval(timer);
    };
  }, [currentUser, preferredLanguage]);

  // Current User Profile Representation
  const currentUserProfile = useMemo(() => {
    return users.find(u => u.isCurrentUser);
  }, [users]);

  // Filtered & Sorted Users
  const filterOptions: LeaderboardFilterOptions = useMemo(() => ({
    timeframe: activeTimeframe,
    signLanguage: selectedSignLanguage,
    league: selectedLeague,
    searchQuery
  }), [activeTimeframe, selectedSignLanguage, selectedLeague, searchQuery]);

  const filteredUsers = useMemo(() => {
    return filterAndSortLeaderboard(users, filterOptions);
  }, [users, filterOptions]);

  // Top 3 Podium Users
  const podiumTop3 = useMemo(() => {
    return filteredUsers.slice(0, 3);
  }, [filteredUsers]);

  // Remaining Users
  const rankedRest = useMemo(() => {
    return filteredUsers.slice(3);
  }, [filteredUsers]);

  // Filtered Badges Matrix
  const filteredBadges = useMemo(() => {
    let list = ALL_COMPLETION_BADGES;
    if (badgeTierFilter !== 'ALL') {
      list = list.filter(b => b.tier === badgeTierFilter);
    }
    if (badgeCategoryFilter !== 'ALL') {
      list = list.filter(b => b.category === badgeCategoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b => b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q));
    }
    return list;
  }, [badgeTierFilter, badgeCategoryFilter, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboardData();
  };

  const handleInspectBadge = (badge: CompletionBadge) => {
    setSelectedBadge(badge);
    setIsBadgeModalOpen(true);
  };

  const handleInspectUser = (user: LeaderboardUser) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const scrollToMyRank = () => {
    if (userRowRef.current) {
      userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const currentLeagueDef = getLeagueDefinition(currentUserProfile?.league || 'silver');

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-3 sm:px-6" id="leaderboard-root-container">
      {/* Top Header & Overview Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-900/20 border border-amber-200/60 dark:border-amber-900/40 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1.5 shadow-xs">
                <Trophy className="w-3.5 h-3.5 fill-white" />
                <span>Global League</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/80 dark:bg-black/40 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 flex items-center gap-1">
                <span>{currentLeagueDef.icon}</span>
                <span>{currentLeagueDef.title}</span>
              </span>
              <button
                onClick={() => setIsLeagueModalOpen(true)}
                className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Rules & Rewards</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
              Sign Language Leaderboard & Leagues
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-2xl">
              Compete daily across ASL & ISL precision evaluations, earn weekly league promotions, and showcase unlocked achievement badges to the global signer community.
            </p>
          </div>

          {/* Reset Clocks & Quick Action */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/90 dark:bg-[#1c1c20]/90 border border-stone-200 dark:border-stone-800 shadow-sm flex-1 sm:flex-initial">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Daily Reset</span>
              </div>
              <div className="text-xs sm:text-sm font-mono font-black text-stone-900 dark:text-white mt-0.5">
                {dailyCountdown}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/90 dark:bg-[#1c1c20]/90 border border-stone-200 dark:border-stone-800 shadow-sm flex-1 sm:flex-initial">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <Calendar className="w-3 h-3 text-indigo-500" />
                <span>Weekly Cutoff</span>
              </div>
              <div className="text-xs sm:text-sm font-mono font-black text-stone-900 dark:text-white mt-0.5">
                {weeklyCountdown}
              </div>
            </div>

            <button
              onClick={handleRefresh}
              className="p-3 rounded-2xl bg-white/90 dark:bg-[#1c1c20]/90 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-sm transition-all cursor-pointer flex items-center justify-center"
              title="Refresh Leaderboard"
              aria-label="Refresh Leaderboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* User's "My Standing" Highlight Card */}
      {currentUserProfile && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181b] border-2 border-emerald-500/50 dark:border-emerald-500/40 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {/* User Avatar with Ring */}
              <div className="relative">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentUserProfile.avatarColor} text-white font-black text-xl flex items-center justify-center shadow-md border-2 border-white dark:border-[#18181b]`}>
                  {currentUserProfile.initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center ring-2 ring-white dark:ring-[#18181b]">
                  {currentUserProfile.countryFlag}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white">
                    YOUR STANDING
                  </span>
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-400">
                    {currentUserProfile.levelTitle} (Lvl {currentUserProfile.level})
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <span>{currentUserProfile.displayName}</span>
                  <span className="text-xs font-mono font-normal text-stone-400">@{currentUserProfile.username}</span>
                </h3>
                <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{currentUserProfile.streak} Day Streak</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Target className="w-3.5 h-3.5" />
                    <span>{currentUserProfile.overallAccuracy}% Accuracy</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                    <Award className="w-3.5 h-3.5" />
                    <span>{currentUserProfile.unlockedBadges.length} Badges</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Score Grid & Rank Badge */}
            <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end flex-wrap sm:flex-nowrap">
              {/* Daily Score Pill */}
              <div className="p-3 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-stone-200 dark:border-stone-800 text-center min-w-[90px]">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Daily XP</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">+{currentUserProfile.dailyScore}</span>
                <span className="text-[9px] text-stone-400 block">{currentUserProfile.dailySignsCount} signs today</span>
              </div>

              {/* Weekly Score Pill */}
              <div className="p-3 rounded-2xl bg-[#f8f9f6] dark:bg-[#202024] border border-stone-200 dark:border-stone-800 text-center min-w-[90px]">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Weekly XP</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{currentUserProfile.weeklyScore.toLocaleString()}</span>
                <span className="text-[9px] text-stone-400 block">Top 15%</span>
              </div>

              {/* Rank Position Pill */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white text-center shadow-md min-w-[100px]">
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">
                  {activeTimeframe === 'daily' ? 'Daily Rank' : activeTimeframe === 'weekly' ? 'Weekly Rank' : 'Overall Rank'}
                </span>
                <span className="text-2xl font-black">
                  #{activeTimeframe === 'daily' ? currentUserProfile.rankDaily : activeTimeframe === 'weekly' ? currentUserProfile.rankWeekly : currentUserProfile.rankAllTime}
                </span>
                <span className="text-[9px] font-bold flex items-center justify-center gap-0.5 opacity-90">
                  <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                  <span>+{currentUserProfile.trendDelta} today</span>
                </span>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('evaluator')}
                  className="hidden xl:flex items-center gap-1.5 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-sm cursor-pointer shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Practice to Climb (+XP)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main View Mode Selector (Leaderboard vs Achievement Badges) */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
            id="tab-view-leaderboard-btn"
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard Standings</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
            id="tab-view-badges-btn"
          >
            <Award className="w-4 h-4" />
            <span>Achievement Badges Matrix ({ALL_COMPLETION_BADGES.length})</span>
          </button>
        </div>

        {activeTab === 'leaderboard' && (
          <div className="flex items-center bg-[#f0f2ee] dark:bg-[#1f1f22] p-1 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs font-bold shadow-xs">
            <button
              onClick={() => setActiveTimeframe('daily')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTimeframe === 'daily'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Daily Score</span>
            </button>

            <button
              onClick={() => setActiveTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTimeframe === 'weekly'
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Weekly League</span>
            </button>

            <button
              onClick={() => setActiveTimeframe('all_time')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTimeframe === 'all_time'
                  ? 'bg-amber-600 text-white shadow-xs font-black'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>All-Time</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'leaderboard' ? (
        <>
          {/* Filters & Search Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search signers by name..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#f8f9f6] dark:bg-[#202024] border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Language and League Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {/* Sign Language System */}
              <div className="flex items-center bg-[#f0f2ee] dark:bg-[#202024] p-1 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-bold shrink-0">
                {(['ALL', 'ISL', 'ASL'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedSignLanguage(lang)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      selectedSignLanguage === lang
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'ALL' ? 'All Languages' : lang === 'ISL' ? 'ISL 🇮🇳' : 'ASL 🇺🇸'}
                  </button>
                ))}
              </div>

              {/* League Selector */}
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value as any)}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-[#f0f2ee] dark:bg-[#202024] border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 shrink-0 cursor-pointer"
              >
                <option value="ALL">All Leagues</option>
                {LEAGUE_DEFINITIONS.map(l => (
                  <option key={l.id} value={l.id}>{l.icon} {l.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Top 3 Podium Showcase */}
          {podiumTop3.length >= 3 && !searchQuery.trim() && (
            <div className="py-4 px-2">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-4xl mx-auto items-end pt-8">
                {/* 2nd Place (Silver) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => handleInspectUser(podiumTop3[1])}
                  className="flex flex-col items-center text-center cursor-pointer group"
                >
                  <div className="relative mb-2">
                    <div className={`w-14 sm:w-20 h-14 sm:h-20 rounded-2xl bg-gradient-to-br ${podiumTop3[1].avatarColor} text-white font-black text-base sm:text-2xl flex items-center justify-center shadow-lg border-2 border-slate-300 dark:border-slate-500 group-hover:scale-105 transition-transform`}>
                      {podiumTop3[1].initials}
                    </div>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl sm:text-2xl">
                      🥈
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-sm sm:text-base">
                      {podiumTop3[1].countryFlag}
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm font-black text-stone-900 dark:text-white truncate max-w-[100px] sm:max-w-[150px]">
                    {podiumTop3[1].displayName}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    Lvl {podiumTop3[1].level} • {podiumTop3[1].league.toUpperCase()}
                  </div>

                  {/* Podium Pedestal */}
                  <div className="w-full mt-2 pt-4 pb-6 rounded-t-2xl bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border-t-2 border-slate-300 shadow-md flex flex-col items-center justify-center">
                    <span className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-200">#2</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {activeTimeframe === 'daily' ? `+${podiumTop3[1].dailyScore} XP` : activeTimeframe === 'weekly' ? `${podiumTop3[1].weeklyScore.toLocaleString()} XP` : `${podiumTop3[1].allTimeScore.toLocaleString()} XP`}
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-0.5 mt-0.5">
                      <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{podiumTop3[1].streak}d streak</span>
                    </span>
                  </div>
                </motion.div>

                {/* 1st Place (Gold Crown) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => handleInspectUser(podiumTop3[0])}
                  className="flex flex-col items-center text-center cursor-pointer group -mt-6"
                >
                  <div className="relative mb-2">
                    <div className={`w-18 sm:w-26 h-18 sm:h-26 rounded-3xl bg-gradient-to-br ${podiumTop3[0].avatarColor} text-white font-black text-xl sm:text-3xl flex items-center justify-center shadow-2xl border-4 border-yellow-400 dark:border-yellow-500 group-hover:scale-105 transition-transform`}>
                      {podiumTop3[0].initials}
                    </div>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl animate-bounce">
                      👑
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-base sm:text-lg">
                      {podiumTop3[0].countryFlag}
                    </span>
                  </div>

                  <div className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 truncate max-w-[110px] sm:max-w-[180px]">
                    {podiumTop3[0].displayName}
                  </div>
                  <div className="text-[10px] sm:text-xs text-stone-500 font-mono font-bold">
                    {podiumTop3[0].levelTitle}
                  </div>

                  {/* Podium Pedestal */}
                  <div className="w-full mt-2 pt-6 pb-8 rounded-t-3xl bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 dark:from-yellow-600 dark:via-amber-700 dark:to-orange-900 border-t-4 border-yellow-300 shadow-xl flex flex-col items-center justify-center text-white">
                    <span className="text-2xl sm:text-3xl font-black">#1</span>
                    <span className="text-sm sm:text-base font-black">
                      {activeTimeframe === 'daily' ? `+${podiumTop3[0].dailyScore} XP` : activeTimeframe === 'weekly' ? `${podiumTop3[0].weeklyScore.toLocaleString()} XP` : `${podiumTop3[0].allTimeScore.toLocaleString()} XP`}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold flex items-center gap-1 mt-0.5 opacity-95">
                      <Flame className="w-3 h-3 fill-yellow-200 text-yellow-200" />
                      <span>{podiumTop3[0].streak}d • {podiumTop3[0].overallAccuracy}%</span>
                    </span>
                  </div>
                </motion.div>

                {/* 3rd Place (Bronze) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => handleInspectUser(podiumTop3[2])}
                  className="flex flex-col items-center text-center cursor-pointer group"
                >
                  <div className="relative mb-2">
                    <div className={`w-14 sm:w-20 h-14 sm:h-20 rounded-2xl bg-gradient-to-br ${podiumTop3[2].avatarColor} text-white font-black text-base sm:text-2xl flex items-center justify-center shadow-lg border-2 border-amber-700 dark:border-amber-600 group-hover:scale-105 transition-transform`}>
                      {podiumTop3[2].initials}
                    </div>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl sm:text-2xl">
                      🥉
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-sm sm:text-base">
                      {podiumTop3[2].countryFlag}
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm font-black text-stone-900 dark:text-white truncate max-w-[100px] sm:max-w-[150px]">
                    {podiumTop3[2].displayName}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    Lvl {podiumTop3[2].level} • {podiumTop3[2].league.toUpperCase()}
                  </div>

                  {/* Podium Pedestal */}
                  <div className="w-full mt-2 pt-3 pb-5 rounded-t-2xl bg-gradient-to-b from-amber-700/60 via-amber-800/80 to-amber-900 dark:from-amber-900 dark:via-stone-900 dark:to-stone-950 border-t-2 border-amber-700 shadow-md flex flex-col items-center justify-center text-amber-100">
                    <span className="text-xl sm:text-2xl font-black">#3</span>
                    <span className="text-xs sm:text-sm font-black">
                      {activeTimeframe === 'daily' ? `+${podiumTop3[2].dailyScore} XP` : activeTimeframe === 'weekly' ? `${podiumTop3[2].weeklyScore.toLocaleString()} XP` : `${podiumTop3[2].allTimeScore.toLocaleString()} XP`}
                    </span>
                    <span className="text-[10px] opacity-90 flex items-center gap-0.5 mt-0.5">
                      <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{podiumTop3[2].streak}d streak</span>
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Full Rankings Card List / Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-500 dark:text-stone-400 px-4 py-1">
              <span>Signer Ranks ({filteredUsers.length})</span>
              <span>{activeTimeframe === 'daily' ? 'Today\'s XP Score' : activeTimeframe === 'weekly' ? 'Weekly Tournament XP' : 'All-Time Cumulative XP'}</span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 space-y-3">
                <Search className="w-8 h-8 text-stone-400 mx-auto" />
                <h3 className="text-base font-black text-stone-900 dark:text-white">No signers found</h3>
                <p className="text-xs text-stone-500">Try adjusting your search query or league filters.</p>
              </div>
            ) : (
              filteredUsers.map((user, idx) => {
                const rankNumber = idx + 1;
                const isTop5 = rankNumber <= 5;
                const isCurrentUser = user.isCurrentUser;
                const userLeagueDef = getLeagueDefinition(user.league);

                return (
                  <div
                    key={user.id}
                    ref={isCurrentUser ? userRowRef : null}
                    onClick={() => handleInspectUser(user)}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-xs ${
                      isCurrentUser
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                        : rankNumber === 1
                        ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                        : rankNumber === 2
                        ? 'bg-slate-200/40 dark:bg-slate-800/30 border-slate-300 dark:border-slate-700'
                        : rankNumber === 3
                        ? 'bg-orange-500/5 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800'
                        : 'bg-white dark:bg-[#18181b] border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                    }`}
                  >
                    {/* Left: Rank Number + Trend + Avatar + Info */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {/* Rank Indicator */}
                      <div className="flex flex-col items-center justify-center w-8 shrink-0">
                        <span className={`font-black text-sm sm:text-base ${
                          rankNumber === 1 ? 'text-amber-500 text-lg' : rankNumber === 2 ? 'text-slate-400 text-base' : rankNumber === 3 ? 'text-amber-700 text-base' : 'text-stone-700 dark:text-stone-300'
                        }`}>
                          #{rankNumber}
                        </span>
                        {user.dailyTrend === 'up' ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                            <ArrowUp className="w-2.5 h-2.5 stroke-[3]" />
                            <span>{user.trendDelta}</span>
                          </span>
                        ) : user.dailyTrend === 'down' ? (
                          <span className="text-[10px] font-bold text-rose-500 flex items-center">
                            <ArrowDown className="w-2.5 h-2.5 stroke-[3]" />
                            <span>{user.trendDelta}</span>
                          </span>
                        ) : (
                          <Minus className="w-2.5 h-2.5 text-stone-400" />
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-to-br ${user.avatarColor} text-white font-black text-sm sm:text-base flex items-center justify-center shadow-xs border border-white dark:border-[#18181b]`}>
                          {user.initials}
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-xs">
                          {user.countryFlag}
                        </span>
                      </div>

                      {/* Name & Handle & League */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-xs sm:text-sm text-stone-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {user.displayName}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-stone-900 dark:bg-white text-white dark:text-stone-900">
                              YOU
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hidden sm:inline-flex items-center gap-0.5">
                            <span>{userLeagueDef.icon}</span>
                            <span>{userLeagueDef.title.split(' ')[0]}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 flex-wrap">
                          <span className="font-mono">@{user.username}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{user.streak}d</span>
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {user.overallAccuracy}% Acc
                          </span>
                        </div>

                        {/* Highlighted Badge Chips */}
                        <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                          {user.unlockedBadges.slice(0, 3).map(b => (
                            <button
                              key={b.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInspectBadge(b);
                              }}
                              className="px-1.5 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-stone-200 dark:border-stone-700 text-[10px] flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                              title={`${b.title} (${b.tier.toUpperCase()})`}
                            >
                              <span>{b.icon}</span>
                              <span className="hidden md:inline font-semibold text-stone-700 dark:text-stone-300">{b.title}</span>
                            </button>
                          ))}
                          {user.unlockedBadges.length > 3 && (
                            <span className="text-[10px] text-stone-400 font-bold">
                              +{user.unlockedBadges.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Scores & Promotion Status */}
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-black text-stone-900 dark:text-white">
                        {activeTimeframe === 'daily' ? (
                          <span className="text-emerald-600 dark:text-emerald-400">+{user.dailyScore} XP</span>
                        ) : activeTimeframe === 'weekly' ? (
                          <span className="text-indigo-600 dark:text-indigo-400">{user.weeklyScore.toLocaleString()} XP</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">{user.allTimeScore.toLocaleString()} XP</span>
                        )}
                      </div>

                      <div className="text-[10px] text-stone-400 font-medium">
                        {activeTimeframe === 'daily' 
                          ? `${user.dailySignsCount} gestures` 
                          : activeTimeframe === 'weekly'
                          ? isTop5 ? '🚀 Promotion Zone' : '🛡️ Safe Zone'
                          : `Lvl ${user.level} Total`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Achievement Badges Matrix Showcase View */
        <div className="space-y-6">
          {/* Badge Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Tier Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {(['ALL', 'diamond', 'gold', 'silver', 'bronze'] as const).map(tier => (
                <button
                  key={tier}
                  onClick={() => setBadgeTierFilter(tier)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    badgeTierFilter === tier
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {tier === 'ALL' ? 'All Tiers' : tier}
                </button>
              ))}
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'All Categories' },
                { id: 'streak', label: '🔥 Streak' },
                { id: 'accuracy', label: '🎯 Accuracy' },
                { id: 'speed', label: '⚡ Speed' },
                { id: 'mastery', label: '🏆 Mastery' },
                { id: 'culture', label: '🇮🇳 Culture' },
                { id: 'curriculum', label: '📚 Lessons' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setBadgeCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    badgeCategoryFilter === cat.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => {
              const progressPercent = Math.min(100, Math.round((badge.currentProgress / (badge.maxProgress || 1)) * 100));

              return (
                <div
                  key={badge.id}
                  onClick={() => handleInspectBadge(badge)}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 cursor-pointer group shadow-sm hover:scale-[1.01] ${
                    badge.unlocked
                      ? 'bg-white dark:bg-[#18181b] border-amber-300/80 dark:border-amber-600/40 hover:border-amber-400'
                      : 'bg-stone-50/70 dark:bg-[#121214] border-stone-200 dark:border-stone-800 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-xs">
                          {badge.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              badge.tier === 'diamond'
                                ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300'
                                : badge.tier === 'gold'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : badge.tier === 'silver'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                                : 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300'
                            }`}>
                              {badge.tier}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-stone-400">
                              {badge.category}
                            </span>
                          </div>
                          <h3 className="font-black text-sm text-stone-900 dark:text-white mt-1">
                            {badge.title}
                          </h3>
                        </div>
                      </div>

                      {badge.unlocked ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-500 flex items-center justify-center">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                      {badge.description}
                    </p>
                  </div>

                  {/* Progress & Reward Footer */}
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-stone-400">Requirement: {badge.requirement}</span>
                      <span className="text-amber-600 dark:text-amber-400">+{badge.xpValue} XP</span>
                    </div>

                    <div className="h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badge.unlocked ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Badge Inspector Modal */}
      <BadgeInspectorModal
        badge={selectedBadge}
        isOpen={isBadgeModalOpen}
        onClose={() => setIsBadgeModalOpen(false)}
        onNavigateTab={onNavigateTab}
      />

      {/* Leaderboard User Profile Modal */}
      <LeaderboardUserProfileModal
        user={selectedUser}
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSelectBadge={(b) => {
          setSelectedBadge(b);
          setIsBadgeModalOpen(true);
        }}
        onNavigateTab={onNavigateTab}
      />

      {/* League Info Modal */}
      <LeagueInfoModal
        isOpen={isLeagueModalOpen}
        onClose={() => setIsLeagueModalOpen(false)}
      />
    </div>
  );
}
