import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Camera,
  Filter,
  SlidersHorizontal,
  Bookmark,
  BookmarkCheck,
  Volume2,
  Sparkles,
  Zap,
  Hand,
  Layers,
  ArrowUpDown,
  X,
  ChevronRight,
  ExternalLink,
  Info,
  Check,
  RotateCcw,
  LayoutGrid,
  List,
  Flame,
  Award,
  Globe,
  Tag,
  BookOpen
} from 'lucide-react';
import { ASLGesture, GestureSearchFilters } from '../types';
import {
  UnifiedGestureItem,
  getAllUnifiedGestures,
  getGestureCategories,
  filterGestures,
  GestureCategoryMeta
} from '../utils/gestureSearchEngine';
import ImageGestureSearchModal from './ImageGestureSearchModal';

interface GestureSearchProps {
  customGestures?: ASLGesture[];
  onOpenEvaluator?: (signName: string, lang?: 'ASL' | 'ISL') => void;
  onSelectSignForDictionary?: (signName: string, lang?: 'ASL' | 'ISL') => void;
  initialQuery?: string;
  initialCategory?: string;
}

export default function GestureSearch({
  customGestures = [],
  onOpenEvaluator,
  onSelectSignForDictionary,
  initialQuery = '',
  initialCategory = 'all'
}: GestureSearchProps) {
  // All unified signs
  const allGestures = useMemo(() => getAllUnifiedGestures(customGestures), [customGestures]);
  const categoryMetas = useMemo(() => getGestureCategories(allGestures), [allGestures]);

  // Bookmarks state (persistent in localStorage)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sign_ai_bookmarked_gestures');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('sign_ai_bookmarked_gestures', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error('Failed to save bookmark:', err);
      }
      return next;
    });
  };

  // Search & Filter State
  const [filters, setFilters] = useState<GestureSearchFilters>({
    query: initialQuery,
    selectedCategories: initialCategory === 'all' ? ['all'] : [initialCategory],
    signLanguage: 'ALL',
    difficulty: 'all',
    handedness: 'all',
    movementType: 'all',
    sortBy: 'relevance'
  });

  // UI view options
  const [viewLayout, setViewLayout] = useState<'grid' | 'compact' | 'detailed'>('grid');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [isImageSearchModalOpen, setIsImageSearchModalOpen] = useState<boolean>(false);
  const [selectedGestureDetail, setSelectedGestureDetail] = useState<UnifiedGestureItem | null>(null);

  // Recent Search Queries History
  const [recentQueries, setRecentQueries] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sign_ai_recent_gesture_searches');
      return saved ? JSON.parse(saved) : ['Namaste', 'Hello', 'Thank You', 'A', 'Peace', 'Help'];
    } catch {
      return ['Namaste', 'Hello', 'Thank You', 'A', 'Peace', 'Help'];
    }
  });

  const saveQueryToHistory = (queryText: string) => {
    const clean = queryText.trim();
    if (!clean || clean.length < 2) return;
    setRecentQueries((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== clean.toLowerCase());
      const next = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('sign_ai_recent_gesture_searches', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  // Run fast multi-field filtering engine
  const { items: filteredGestures, executionTimeMs } = useMemo(() => {
    return filterGestures(allGestures, filters, bookmarkedIds);
  }, [allGestures, filters, bookmarkedIds]);

  // Audio Speech Synthesis
  const speakSign = (item: UnifiedGestureItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = item.hindiChar
        ? `${item.englishTitle}. ${item.hindiChar}`
        : `${item.englishTitle}. ${item.meaning || item.description}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Search input change handler
  const handleQueryChange = (val: string) => {
    setFilters((prev) => ({ ...prev, query: val }));
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filters.query.trim()) {
      saveQueryToHistory(filters.query);
    }
  };

  // Category selection handler
  const handleCategoryToggle = (catId: string) => {
    setFilters((prev) => {
      if (catId === 'all') {
        return { ...prev, selectedCategories: ['all'] };
      }
      const existing = prev.selectedCategories.filter((c) => c !== 'all');
      if (existing.includes(catId)) {
        const next = existing.filter((c) => c !== catId);
        return { ...prev, selectedCategories: next.length === 0 ? ['all'] : next };
      } else {
        return { ...prev, selectedCategories: [...existing, catId] };
      }
    });
  };

  // Reset all filters to default
  const resetFilters = () => {
    setFilters({
      query: '',
      selectedCategories: ['all'],
      signLanguage: 'ALL',
      difficulty: 'all',
      handedness: 'all',
      movementType: 'all',
      sortBy: 'relevance'
    });
  };

  // Keyboard shortcut listener (Cmd/Ctrl + K to focus search)
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (selectedGestureDetail) setSelectedGestureDetail(null);
        if (isImageSearchModalOpen) setIsImageSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGestureDetail, isImageSearchModalOpen]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.selectedCategories.length > 0 && !filters.selectedCategories.includes('all')) count++;
    if (filters.signLanguage !== 'ALL') count++;
    if (filters.difficulty !== 'all') count++;
    if (filters.handedness !== 'all') count++;
    if (filters.movementType !== 'all') count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4" id="gesture-search-view">
      {/* 1. Header Hero Bar: Search Bar + Visual Search Trigger */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-900/90 via-slate-900 to-[#0f172a] text-white border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  Universal Gesture Search
                </span>
                <span className="text-xs text-slate-400">
                  {allGestures.length} Gestures Indexed (ASL & ISL)
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Find Any Sign in Milliseconds
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
                Search across Indian Sign Language (ISL) & American Sign Language (ASL) by word, category, or upload an image to reverse-identify gestures with AI vision.
              </p>
            </div>

            {/* Quick Stats / Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsImageSearchModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-indigo-400/40"
                id="open-image-search-btn"
              >
                <Camera className="w-4 h-4" />
                <span>Search by Image / Camera</span>
              </button>
            </div>
          </div>

          {/* Search Input Box */}
          <form onSubmit={handleQuerySubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-indigo-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={filters.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search by English word, Hindi translation, letter, meaning, or hand action... (Press ⌘K)"
                className="w-full pl-12 pr-28 py-3.5 sm:py-4 rounded-2xl bg-white/10 dark:bg-black/40 border border-white/20 dark:border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition-all text-sm sm:text-base shadow-inner backdrop-blur-md"
                id="gesture-search-input"
              />
              {filters.query && (
                <button
                  type="button"
                  onClick={() => handleQueryChange('')}
                  className="absolute right-14 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow transition-all"
              >
                Search
              </button>
            </div>
          </form>

          {/* Recent / Suggested Search Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Searches:
            </span>
            {recentQueries.map((queryText) => (
              <button
                key={queryText}
                type="button"
                onClick={() => {
                  handleQueryChange(queryText);
                  saveQueryToHistory(queryText);
                }}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-[11px] font-medium transition-all border border-white/10"
              >
                {queryText}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Interactive Category Browser Pills */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Search by Category</span>
          </h3>
          <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">
            {filters.selectedCategories.includes('all')
              ? 'Showing all categories'
              : `${filters.selectedCategories.length} selected`}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categoryMetas.map((cat) => {
            const isSelected = filters.selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryToggle(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border flex-shrink-0 shadow-sm ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20'
                    : 'bg-white dark:bg-[#18181b] text-[#334155] dark:text-[#cbd5e1] border-[#e2e8f0] dark:border-[#27272a] hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'
                }`}
                id={`cat-pill-${cat.id}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected
                      ? 'bg-indigo-800 text-indigo-100'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}

          {/* Bookmarked Filter Pill */}
          <button
            onClick={() => handleCategoryToggle('bookmarked')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border flex-shrink-0 shadow-sm ${
              filters.selectedCategories.includes('bookmarked')
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-[#18181b] text-[#334155] dark:text-[#cbd5e1] border-[#e2e8f0] dark:border-[#27272a] hover:border-amber-400'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Saved Favorites</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filters.selectedCategories.includes('bookmarked')
                  ? 'bg-amber-800 text-amber-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {bookmarkedIds.size}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Fast Filtering Toolbar & Facet Bar */}
      <div className="bg-white dark:bg-[#18181b] p-4 rounded-2xl border border-[#e2e8f0] dark:border-[#27272a] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Quick Facet Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sign Language Selector */}
          <div className="flex items-center rounded-xl bg-[#f1f5f9] dark:bg-[#27272a] p-1 border border-[#e2e8f0] dark:border-[#334155] text-xs">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, signLanguage: 'ALL' }))}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filters.signLanguage === 'ALL'
                  ? 'bg-white dark:bg-[#18181b] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a] dark:hover:text-white'
              }`}
            >
              All Systems
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, signLanguage: 'ISL' }))}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                filters.signLanguage === 'ISL'
                  ? 'bg-white dark:bg-[#18181b] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a] dark:hover:text-white'
              }`}
            >
              <span>ISL (Indian)</span>
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, signLanguage: 'ASL' }))}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                filters.signLanguage === 'ASL'
                  ? 'bg-white dark:bg-[#18181b] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a] dark:hover:text-white'
              }`}
            >
              <span>ASL (American)</span>
            </button>
          </div>

          {/* Difficulty Dropdown */}
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters((prev) => ({ ...prev, difficulty: e.target.value as any }))}
            className="px-3 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#27272a] border border-[#e2e8f0] dark:border-[#334155] text-xs font-bold text-[#334155] dark:text-[#cbd5e1] focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Any Difficulty</option>
            <option value="easy">Easy / Beginner</option>
            <option value="medium">Medium / Intermediate</option>
            <option value="hard">Hard / Advanced</option>
          </select>

          {/* Handedness Dropdown */}
          <select
            value={filters.handedness}
            onChange={(e) => setFilters((prev) => ({ ...prev, handedness: e.target.value as any }))}
            className="px-3 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#27272a] border border-[#e2e8f0] dark:border-[#334155] text-xs font-bold text-[#334155] dark:text-[#cbd5e1] focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Any Handedness</option>
            <option value="one_handed">1-Hand (Single)</option>
            <option value="two_handed">2-Hands (Dual)</option>
          </select>

          {/* Movement Type */}
          <select
            value={filters.movementType}
            onChange={(e) => setFilters((prev) => ({ ...prev, movementType: e.target.value as any }))}
            className="px-3 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#27272a] border border-[#e2e8f0] dark:border-[#334155] text-xs font-bold text-[#334155] dark:text-[#cbd5e1] focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Static & Dynamic</option>
            <option value="static">Static Posture</option>
            <option value="dynamic">Dynamic Motion</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#64748b]" />
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="px-3 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-[#27272a] border border-[#e2e8f0] dark:border-[#334155] text-xs font-bold text-[#334155] dark:text-[#cbd5e1] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="relevance">Best Relevance</option>
              <option value="alphabetical_asc">Alphabetical (A - Z)</option>
              <option value="alphabetical_desc">Alphabetical (Z - A)</option>
              <option value="difficulty_asc">Difficulty (Easy → Hard)</option>
              <option value="difficulty_desc">Difficulty (Hard → Easy)</option>
              <option value="popular">Most Common</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right: Layout Switcher & Benchmark Counter */}
        <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#e2e8f0] dark:border-[#27272a]">
          {/* Performance Benchmark badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            <Zap className="w-3 h-3 text-emerald-500" />
            <span>{filteredGestures.length} matches</span>
            <span className="text-[9px] text-emerald-600/70 font-normal">({executionTimeMs}ms)</span>
          </div>

          {/* View Mode Grid/List buttons */}
          <div className="flex items-center rounded-xl bg-[#f1f5f9] dark:bg-[#27272a] p-0.5 border border-[#e2e8f0] dark:border-[#334155]">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewLayout === 'grid'
                  ? 'bg-white dark:bg-[#18181b] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a] dark:hover:text-white'
              }`}
              title="Bento Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewLayout('compact')}
              className={`p-1.5 rounded-lg transition-all ${
                viewLayout === 'compact'
                  ? 'bg-white dark:bg-[#18181b] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a] dark:hover:text-white'
              }`}
              title="Compact List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Results Display Grid / List */}
      {filteredGestures.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white dark:bg-[#18181b] rounded-3xl border border-[#e2e8f0] dark:border-[#27272a] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto shadow-inner">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#0f172a] dark:text-white">
              No sign gestures found for "{filters.query}"
            </h4>
            <p className="text-xs text-[#64748b] dark:text-[#94a3b8] max-w-md mx-auto mt-1">
              Try searching with broader keywords, adjusting your category or language filters, or use Visual Search to scan a hand gesture with your camera.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition-all"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setIsImageSearchModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-[#cbd5e1] dark:border-[#334155] text-xs font-bold hover:bg-[#f8fafc] dark:hover:bg-[#27272a] transition-all flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-indigo-500" />
              <span>Try Search by Image</span>
            </button>
          </div>
        </div>
      ) : viewLayout === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGestures.map((item) => {
            const isBookmarked = bookmarkedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => setSelectedGestureDetail(item)}
                className="group relative bg-white dark:bg-[#18181b] rounded-2xl border border-[#e2e8f0] dark:border-[#27272a] p-4 hover:border-indigo-400 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
                id={`gesture-card-${item.id}`}
              >
                <div>
                  {/* Top Bar: Language Badge & Bookmark */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          item.signLanguage === 'ISL'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                        }`}
                      >
                        {item.signLanguage}
                      </span>
                      <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8] font-medium truncate max-w-[110px]">
                        {item.categoryLabel}
                      </span>
                    </div>

                    <button
                      onClick={(e) => toggleBookmark(item.id, e)}
                      className={`p-1.5 rounded-xl transition-all ${
                        isBookmarked
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                          : 'text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#27272a]'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Sign'}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 fill-amber-400 text-amber-500" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Visual Sign Symbol / Main Title */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-50 to-slate-100 dark:from-slate-800 dark:to-[#27272a] border border-[#e2e8f0] dark:border-[#334155] text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-lg shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      {item.char.length <= 3 ? item.char : item.char.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <h4 className="text-base font-extrabold text-[#0f172a] dark:text-white truncate">
                          {item.char}
                        </h4>
                        {item.hindiChar && (
                          <span className="text-xs font-semibold text-[#64748b] dark:text-[#94a3b8]">
                            ({item.hindiChar})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                        {item.englishTitle}
                      </p>
                    </div>
                  </div>

                  {/* Sign Description */}
                  <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-3 line-clamp-2 leading-relaxed">
                    {item.description || item.meaning}
                  </p>

                  {/* Synonyms / Tags Chips */}
                  {item.synonyms && item.synonyms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {item.synonyms.slice(0, 3).map((syn, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-[#27272a] text-[#64748b] dark:text-[#cbd5e1]"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Handedness & Actions */}
                <div className="pt-3 mt-3 border-t border-[#e2e8f0] dark:border-[#27272a] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8] font-medium flex items-center gap-1">
                    <Hand className="w-3 h-3 text-indigo-500" />
                    {item.isTwoHanded ? 'Two-Handed' : '1-Hand'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => speakSign(item, e)}
                      className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#27272a] transition-all"
                      title="Pronounce"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {onOpenEvaluator && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEvaluator(item.char, item.signLanguage);
                        }}
                        className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold transition-all"
                        title="Practice with AI Coach"
                      >
                        Coach
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact List Layout */
        <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#e2e8f0] dark:border-[#27272a] overflow-hidden shadow-sm divide-y divide-[#e2e8f0] dark:divide-[#27272a]">
          {filteredGestures.map((item) => {
            const isBookmarked = bookmarkedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => setSelectedGestureDetail(item)}
                className="p-4 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-[#27272a] text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-sm flex-shrink-0 border border-indigo-100 dark:border-[#334155]">
                    {item.char.length <= 2 ? item.char : item.char.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-[#0f172a] dark:text-white truncate">
                        {item.char}
                      </h4>
                      {item.hindiChar && (
                        <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                          ({item.hindiChar})
                        </span>
                      )}
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        • {item.englishTitle}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          item.signLanguage === 'ISL'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                        }`}
                      >
                        {item.signLanguage}
                      </span>
                    </div>

                    <p className="text-xs text-[#64748b] dark:text-[#94a3b8] truncate mt-0.5">
                      {item.description || item.meaning}
                    </p>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8] px-2 py-1 rounded bg-slate-100 dark:bg-[#27272a]">
                    {item.isTwoHanded ? '2-Hands' : '1-Hand'}
                  </span>

                  <button
                    onClick={(e) => speakSign(item, e)}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#27272a] transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => toggleBookmark(item.id, e)}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-amber-500 transition-all"
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4 fill-amber-400 text-amber-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>

                  {onOpenEvaluator && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEvaluator(item.char, item.signLanguage);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
                    >
                      Practice
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Gesture Detail Modal / Inspector Drawer */}
      {selectedGestureDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-[#121214] border border-[#e2e8f0] dark:border-[#27272a] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#1e293b] dark:text-[#f8fafc]"
            id="gesture-detail-modal"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] dark:border-[#27272a] bg-[#f8fafc] dark:bg-[#18181b]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-base shadow">
                  {selectedGestureDetail.char.length <= 2
                    ? selectedGestureDetail.char
                    : selectedGestureDetail.char.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#0f172a] dark:text-white">
                      {selectedGestureDetail.char}
                    </h3>
                    {selectedGestureDetail.hindiChar && (
                      <span className="text-sm font-semibold text-[#64748b]">
                        ({selectedGestureDetail.hindiChar})
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      {selectedGestureDetail.signLanguage}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    {selectedGestureDetail.englishTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => toggleBookmark(selectedGestureDetail.id, e)}
                  className={`p-2 rounded-xl transition-all ${
                    bookmarkedIds.has(selectedGestureDetail.id)
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                      : 'text-[#64748b] hover:bg-[#e2e8f0] dark:hover:bg-[#27272a]'
                  }`}
                >
                  {bookmarkedIds.has(selectedGestureDetail.id) ? (
                    <BookmarkCheck className="w-5 h-5 fill-amber-400 text-amber-500" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => setSelectedGestureDetail(null)}
                  className="p-2 rounded-xl text-[#64748b] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#e2e8f0] dark:hover:bg-[#27272a] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Meaning & Tip */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Execution & Visual Guide</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#334155] dark:text-[#cbd5e1] leading-relaxed">
                  {selectedGestureDetail.visualTip || selectedGestureDetail.description}
                </p>
              </div>

              {/* Step-by-Step Breakdown */}
              {selectedGestureDetail.steps && selectedGestureDetail.steps.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Step-by-Step Instructions</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedGestureDetail.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-[#f8fafc] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a]"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-[#334155] dark:text-[#cbd5e1] leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#f8fafc] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a]">
                  <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8] block">Category</span>
                  <span className="text-xs font-bold text-[#0f172a] dark:text-white">
                    {selectedGestureDetail.categoryLabel}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#f8fafc] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a]">
                  <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8] block">Handedness</span>
                  <span className="text-xs font-bold text-[#0f172a] dark:text-white">
                    {selectedGestureDetail.isTwoHanded ? 'Two-Handed (Dual)' : 'Single Hand (1-Hand)'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#f8fafc] dark:bg-[#18181b] border border-[#e2e8f0] dark:border-[#27272a]">
                  <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8] block">Difficulty</span>
                  <span className="text-xs font-bold capitalize text-emerald-600 dark:text-emerald-400">
                    {selectedGestureDetail.difficulty}
                  </span>
                </div>
              </div>

              {/* Synonyms & Tags */}
              {selectedGestureDetail.synonyms && selectedGestureDetail.synonyms.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#64748b] dark:text-[#94a3b8] flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Synonyms & Aliases:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGestureDetail.synonyms.map((syn, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-[#27272a] text-[#334155] dark:text-[#cbd5e1] font-medium"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] dark:border-[#27272a] bg-[#f8fafc] dark:bg-[#18181b]">
              <button
                onClick={() => speakSign(selectedGestureDetail)}
                className="px-3.5 py-2 rounded-xl border border-[#cbd5e1] dark:border-[#334155] text-xs font-bold hover:bg-white dark:hover:bg-[#27272a] transition-all flex items-center gap-1.5"
              >
                <Volume2 className="w-4 h-4 text-indigo-500" />
                <span>Pronounce</span>
              </button>

              <div className="flex items-center gap-2">
                {onSelectSignForDictionary && (
                  <button
                    onClick={() => {
                      onSelectSignForDictionary(selectedGestureDetail.char, selectedGestureDetail.signLanguage);
                      setSelectedGestureDetail(null);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#cbd5e1] dark:border-[#334155] text-xs font-bold hover:bg-white dark:hover:bg-[#27272a] transition-all"
                  >
                    View in Dictionary
                  </button>
                )}

                {onOpenEvaluator && (
                  <button
                    onClick={() => {
                      onOpenEvaluator(selectedGestureDetail.char, selectedGestureDetail.signLanguage);
                      setSelectedGestureDetail(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>Practice with AI Coach</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Visual Image Search Modal */}
      <ImageGestureSearchModal
        isOpen={isImageSearchModalOpen}
        onClose={() => setIsImageSearchModalOpen(false)}
        signLanguage={filters.signLanguage}
        onSelectMatchedSign={(signChar, lang) => {
          handleQueryChange(signChar);
          setFilters((prev) => ({ ...prev, query: signChar }));
        }}
        onOpenEvaluator={onOpenEvaluator}
      />
    </div>
  );
}
