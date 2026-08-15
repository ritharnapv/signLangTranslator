import React, { useState, useEffect, useMemo } from 'react';
import { ASLGesture } from '../types';
import { 
  BookOpen, 
  Sparkles, 
  Star, 
  Search, 
  Flame, 
  Award, 
  Volume2, 
  Info, 
  ChevronRight, 
  Bookmark, 
  Filter, 
  RotateCcw, 
  AlertCircle, 
  Activity, 
  CheckCircle2, 
  HelpCircle, 
  Sliders,
  Play,
  Grid,
  Layers,
  GraduationCap,
  Share2,
  Hand,
  Globe,
  Compass,
  X,
  Trophy
} from 'lucide-react';
import { COMPLETE_ISL_DICTIONARY, ISL_CATEGORIES, ISLSignItem } from '../data/islDictionaryData';
import ISLVideoDemonstrator from './ISLVideoDemonstrator';
import ISLFlashcardQuizModal from './ISLFlashcardQuizModal';
import ISLAlphabetChartModal from './ISLAlphabetChartModal';

// ASL Baseline Gestures
const ASL_DICTIONARY_GESTURES: ASLGesture[] = [
  {
    id: "sign_asl_a",
    char: "A",
    englishTitle: "ASL Letter A",
    description: "Make a tightly closed fist, keeping your thumb vertically aligned on the outside edge of your index finger.",
    category: "alphabet",
    signLanguage: "ASL",
    isTwoHanded: false,
    visualTip: "Fist closed tightly, thumb aligned vertically touching the index finger's side.",
    meaning: "The first letter of the ASL manual alphabet, representing the character 'A' or used as a baseline fist posture.",
    synonyms: ["Letter A", "First Alphabet", "Initial A"],
    difficulty: "easy",
    grammaticalRole: "Alphabet",
    steps: [
      "Form a tightly closed fist with your dominant hand.",
      "Keep all four fingers curled inward flat against your palm skin.",
      "Extend your thumb upwards along the outer side edge of your index finger knuckle."
    ]
  },
  {
    id: "sign_asl_b",
    char: "B",
    englishTitle: "ASL Letter B",
    description: "Hold your four fingers flat and straight up. Tuck your thumb folded inside across your palm.",
    category: "alphabet",
    signLanguage: "ASL",
    isTwoHanded: false,
    visualTip: "Open flat upright palm, thumb securely folded inward across the palm skin.",
    meaning: "The second letter of the ASL manual alphabet, also representing the number '4' or used to depict flat surfaces.",
    synonyms: ["Letter B", "Flat Palm", "Number 4"],
    difficulty: "easy",
    grammaticalRole: "Alphabet",
    steps: [
      "Hold your four fingers flat, vertical, and pressed tightly together side-by-side.",
      "Fold your thumb horizontally inward across your palm, resting near the base of your pinky.",
      "Keep your wrist straight and hand parallel to your body."
    ]
  },
  {
    id: "sign_asl_c",
    char: "C",
    englishTitle: "ASL Letter C",
    description: "Curve all four fingers and your thumb to mimic a semi-circular cup shape resembling the letter C.",
    category: "alphabet",
    signLanguage: "ASL",
    isTwoHanded: false,
    visualTip: "Clear semi-circular profile shape, ensuring distinct space between finger tips and thumb.",
    meaning: "The third letter of the manual alphabet, representing the letter 'C' or used as a classifier for drinking cups.",
    synonyms: ["Letter C", "Cup Shape", "Semicircle"],
    difficulty: "easy",
    grammaticalRole: "Alphabet",
    steps: [
      "Slightly bend all four fingers forward together in an arched curve.",
      "Oppose your thumb pointing upward and curve it to match, forming a semi-circular ring profile."
    ]
  },
  {
    id: "sign_asl_d",
    char: "D",
    englishTitle: "ASL Letter D",
    description: "Extend your index finger straight up. Touch your middle, ring, and pinky finger tips directly to your thumb tip.",
    category: "alphabet",
    signLanguage: "ASL",
    isTwoHanded: false,
    visualTip: "Index pointing vertically alone, other three fingers forming a tight circular contact loop with thumb.",
    meaning: "The fourth letter of the ASL alphabet, representing the character 'D'.",
    synonyms: ["Letter D", "Pointer", "Delta"],
    difficulty: "medium",
    grammaticalRole: "Alphabet",
    steps: [
      "Extend your index finger straight up pointing to the sky.",
      "Curve your middle, ring, and pinky fingers downward in a circle touching thumb."
    ]
  },
  {
    id: "sign_asl_hello",
    char: "Hello",
    englishTitle: "ASL Hello",
    description: "Place your hand at your forehead with fingers flat and palm facing down, then sweep it outward in a small salute.",
    category: "greeting",
    signLanguage: "ASL",
    isTwoHanded: false,
    visualTip: "Flat vertical hand starting close to the eyebrow peak and moving gracefully outwards.",
    meaning: "A universal friendly greeting or salute used to initiate conversations in American Sign Language.",
    synonyms: ["Hi", "Hey", "Greetings", "Salute"],
    difficulty: "easy",
    grammaticalRole: "Greeting",
    steps: [
      "Bring your flat open dominant hand up to the side of your forehead.",
      "Sweep your hand horizontally outward in a brief saluting wave gesture."
    ]
  },
  {
    id: "sign_asl_thanks",
    char: "Thank You",
    englishTitle: "ASL Thank You",
    description: "Touch the fingers of your flat open dominant hand to your lips or chin, then move your hand forward and downward toward the other person.",
    category: "greeting",
    signLanguage: "ASL",
    isTwoHanded: false,
    visualTip: "Fingertips moving away from chin with palm opening upward.",
    meaning: "Polite expression of gratitude and appreciation in ASL.",
    synonyms: ["Thanks", "Gratitude", "Appreciation"],
    difficulty: "easy",
    grammaticalRole: "Politeness",
    steps: [
      "Place the fingertips of your dominant hand on your chin/lips.",
      "Move your hand forward and downward toward the recipient with palm facing up."
    ]
  }
];

// Hand Skeleton connection lines
const SKELETON_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Knuckles base connections
  [5, 9], [9, 13], [13, 17]
];

// Helper to construct realistic procedural coordinates for hand bones
function getHandLandmarks(char: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const wrist = { x: 100, y: 175 };
  points.push(wrist); // Index 0
  
  const c = char.toUpperCase().charAt(0);

  const addFinger = (
    baseX: number, 
    baseY: number, 
    angleDeg: number, 
    length: number, 
    isFolded: boolean, 
    isCurved: boolean, 
    curveDir = 1
  ) => {
    const angle = (angleDeg * Math.PI) / 180;
    const numJoints = 4;
    let currX = baseX;
    let currY = baseY;
    
    for (let j = 1; j <= numJoints; j++) {
      const segmentLen = length / numJoints;
      let segAngle = angle;
      
      if (isFolded) {
        segAngle = angle + (Math.PI * 0.45 * (j / numJoints) * curveDir);
      } else if (isCurved) {
        segAngle = angle + (Math.PI * 0.25 * (j / numJoints) * curveDir);
      }
      
      currX += Math.sin(segAngle) * segmentLen;
      currY -= Math.cos(segAngle) * segmentLen;
      
      points.push({
        x: Math.round(currX * 10) / 10,
        y: Math.round(currY * 10) / 10
      });
    }
  };

  let thumbFolded = false;
  let indexFolded = false;
  let middleFolded = false;
  let ringFolded = false;
  let pinkyFolded = false;

  let thumbCurved = false;
  let indexCurved = false;
  let middleCurved = false;
  let ringCurved = false;
  let pinkyCurved = false;

  let thumbAngle = -45;
  let indexAngle = -12;
  let middleAngle = 0;
  let ringAngle = 12;
  let pinkyAngle = 25;
  const fingerLength = 55;

  if (c === 'A') {
    indexFolded = true; middleFolded = true; ringFolded = true; pinkyFolded = true;
    thumbAngle = 0;
  } else if (c === 'B') {
    thumbFolded = true;
    indexAngle = -5; middleAngle = 0; ringAngle = 5; pinkyAngle = 10;
  } else if (c === 'C') {
    thumbCurved = true; indexCurved = true; middleCurved = true; ringCurved = true; pinkyCurved = true;
    thumbAngle = -30; indexAngle = -15; middleAngle = 0; ringAngle = 15; pinkyAngle = 30;
  } else if (c === 'D') {
    middleFolded = true; ringFolded = true; pinkyFolded = true; thumbCurved = true;
    indexAngle = 0; thumbAngle = 15;
  } else {
    // Standard open palm
    thumbAngle = -50;
    indexAngle = -15; middleAngle = 0; ringAngle = 15; pinkyAngle = 30;
  }

  // Draw 5 fingers
  addFinger(82, 145, thumbAngle, fingerLength * 0.70, thumbFolded, thumbCurved, -1);
  addFinger(86, 115, indexAngle, fingerLength, indexFolded, indexCurved, 1);
  addFinger(100, 110, middleAngle, fingerLength * 1.05, middleFolded, middleCurved, 1);
  addFinger(114, 115, ringAngle, fingerLength * 0.95, ringFolded, ringCurved, 1);
  addFinger(128, 125, pinkyAngle, fingerLength * 0.80, pinkyFolded, pinkyCurved, 1);

  return points;
}

interface SignDictionaryProps {
  onSelectGesture: (gesture: ASLGesture) => void;
  activeGesture: ASLGesture | null;
  customGestures?: ASLGesture[];
  activeSignLanguage?: string;
  onSignLanguageChange?: (lang: string) => void;
  onNavigateToLearningDashboard?: () => void;
}

export default function SignDictionary({ 
  onSelectGesture, 
  activeGesture, 
  customGestures = [],
  activeSignLanguage = 'ISL',
  onSignLanguageChange,
  onNavigateToLearningDashboard
}: SignDictionaryProps) {
  // Primary state variables
  const [activeSignLanguageSystem, setActiveSignLanguageSystem] = useState<string>(activeSignLanguage || 'ISL');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlphabet, setSelectedAlphabet] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [selectedHandType, setSelectedHandType] = useState<'all' | 'one-handed' | 'two-handed'>('all');
  
  // Modals state
  const [showAlphabetModal, setShowAlphabetModal] = useState(false);
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
  const [animateSkeleton, setAnimateSkeleton] = useState(true);
  const [showJointLabels, setShowJointLabels] = useState(false);

  useEffect(() => {
    if (activeSignLanguage && activeSignLanguage !== activeSignLanguageSystem) {
      setActiveSignLanguageSystem(activeSignLanguage);
    }
  }, [activeSignLanguage]);

  const handleLanguageSwitch = (lang: string) => {
    setActiveSignLanguageSystem(lang);
    setActiveCategory('all');
    if (onSignLanguageChange) {
      onSignLanguageChange(lang);
    }
  };
  
  // Bookmarks loaded from local storage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('isl_dictionary_bookmarks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Track currently inspected sign
  const [inspectedGesture, setInspectedGesture] = useState<ASLGesture | null>(null);

  // Sync bookmarks with localStorage
  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const updated = prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id];
      localStorage.setItem('isl_dictionary_bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  // Convert ISL database to ASLGesture format
  const islAsGestures: ASLGesture[] = useMemo(() => {
    return COMPLETE_ISL_DICTIONARY.map(item => ({
      id: item.id,
      char: item.char,
      hindiChar: item.hindiChar,
      englishTitle: item.englishTitle,
      description: item.description,
      category: item.category,
      signLanguage: 'ISL',
      isTwoHanded: item.isTwoHanded,
      visualTip: item.visualTip,
      meaning: item.meaning,
      culturalContext: item.culturalContext,
      facialExpression: item.facialExpression,
      movementType: item.movementType,
      movementDescription: item.movementDescription,
      synonyms: item.synonyms,
      difficulty: item.difficulty,
      steps: item.steps,
      grammaticalRole: item.grammaticalRole,
      tags: item.tags
    }));
  }, []);

  // Combined gesture pool
  const allGestures = useMemo(() => {
    const customWithCategory = customGestures.map(g => ({
      ...g,
      category: 'custom',
      signLanguage: g.signLanguage || 'ISL',
      meaning: g.meaning || "Custom registered gesture captured in workspace.",
      difficulty: g.difficulty || 'medium',
      steps: g.steps || ["Lock posture in scanner", "Perform hand calibration matching joint landmarks"],
      grammaticalRole: g.grammaticalRole || 'Custom Sign'
    }));

    if (activeSignLanguageSystem === 'ISL') {
      return [...islAsGestures, ...customWithCategory.filter(g => g.signLanguage === 'ISL')];
    } else if (activeSignLanguageSystem === 'ASL') {
      return [...ASL_DICTIONARY_GESTURES, ...customWithCategory.filter(g => g.signLanguage === 'ASL')];
    } else {
      return [...islAsGestures, ...ASL_DICTIONARY_GESTURES, ...customWithCategory];
    }
  }, [islAsGestures, customGestures, activeSignLanguageSystem]);

  // Set default inspected gesture on load
  useEffect(() => {
    if (activeGesture) {
      const found = allGestures.find(g => g.id === activeGesture.id);
      if (found) setInspectedGesture(found);
    } else if (allGestures.length > 0 && (!inspectedGesture || !allGestures.some(g => g.id === inspectedGesture.id))) {
      setInspectedGesture(allGestures[0]);
    }
  }, [activeGesture, allGestures]);

  // Filtered gestures
  const filteredGestures = useMemo(() => {
    return allGestures.filter(gesture => {
      // Category filter
      const matchesCategory = 
        activeCategory === 'all' || 
        (activeCategory === 'bookmarked' && bookmarkedIds.includes(gesture.id)) ||
        gesture.category === activeCategory;

      // Difficulty filter
      const matchesDifficulty = 
        selectedDifficulty === 'all' || 
        gesture.difficulty === selectedDifficulty;

      // Hand count filter
      const matchesHandType =
        selectedHandType === 'all' ||
        (selectedHandType === 'two-handed' && gesture.isTwoHanded) ||
        (selectedHandType === 'one-handed' && !gesture.isTwoHanded);

      // Alphabet filter
      const matchesAlphabet = 
        selectedAlphabet === 'ALL' || 
        gesture.char.toUpperCase().startsWith(selectedAlphabet);

      // Multi-field search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        q === '' ||
        gesture.char.toLowerCase().includes(q) || 
        (gesture.hindiChar && gesture.hindiChar.toLowerCase().includes(q)) ||
        (gesture.englishTitle && gesture.englishTitle.toLowerCase().includes(q)) ||
        gesture.description.toLowerCase().includes(q) ||
        (gesture.meaning && gesture.meaning.toLowerCase().includes(q)) ||
        (gesture.culturalContext && gesture.culturalContext.toLowerCase().includes(q)) ||
        (gesture.synonyms && gesture.synonyms.some(s => s.toLowerCase().includes(q))) ||
        (gesture.tags && gesture.tags.some(t => t.toLowerCase().includes(q)));

      return matchesCategory && matchesDifficulty && matchesHandType && matchesSearch && matchesAlphabet;
    });
  }, [allGestures, activeCategory, selectedDifficulty, selectedHandType, searchQuery, selectedAlphabet, bookmarkedIds]);

  // TTS audio reader (Bilingual English & Hindi speech synthesis)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakSign = (gesture: ASLGesture) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `Sign: ${gesture.char}. ${gesture.hindiChar ? `In Hindi: ${gesture.hindiChar}.` : ''} Meaning: ${gesture.meaning || gesture.description}. Formed with a ${gesture.difficulty} ${gesture.isTwoHanded ? 'two-handed' : 'one-handed'} posture.`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.92;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop talking when switching cards
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [inspectedGesture]);

  // Find matching ISL sign item for video demonstrator
  const activeIslSignItem = useMemo(() => {
    if (!inspectedGesture) return COMPLETE_ISL_DICTIONARY[0];
    const match = COMPLETE_ISL_DICTIONARY.find(i => i.id === inspectedGesture.id || i.char === inspectedGesture.char);
    if (match) return match;
    
    // Fallback constructed ISLSignItem
    return {
      id: inspectedGesture.id,
      char: inspectedGesture.char,
      hindiChar: inspectedGesture.hindiChar,
      englishTitle: inspectedGesture.englishTitle || inspectedGesture.char,
      category: (inspectedGesture.category as any) || 'isl-alphabet',
      isTwoHanded: !!inspectedGesture.isTwoHanded,
      dominantHandShape: inspectedGesture.visualTip,
      movementType: (inspectedGesture.movementType as any) || 'linear',
      movementDescription: inspectedGesture.description,
      meaning: inspectedGesture.meaning || inspectedGesture.description,
      culturalContext: inspectedGesture.culturalContext,
      description: inspectedGesture.description,
      visualTip: inspectedGesture.visualTip,
      facialExpression: inspectedGesture.facialExpression,
      steps: inspectedGesture.steps || ["Perform calibrated posture in scanner HUD"],
      synonyms: inspectedGesture.synonyms || [],
      difficulty: inspectedGesture.difficulty || 'easy',
      grammaticalRole: inspectedGesture.grammaticalRole || 'Sign Item',
      tags: inspectedGesture.tags || []
    } as ISLSignItem;
  }, [inspectedGesture]);

  const handLandmarks = useMemo(() => {
    if (!inspectedGesture) return [];
    return getHandLandmarks(inspectedGesture.char);
  }, [inspectedGesture]);

  const alphabetList = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  return (
    <div className="space-y-6" id="isl-dictionary-workspace">
      
      {/* 1. Header Banner & System Switcher */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-neutral-900 border border-emerald-800/60 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden" id="isl-dictionary-banner">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Indian Sign Language (ISL) Database
              </span>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-mono font-bold">
                {COMPLETE_ISL_DICTIONARY.length} Verified Signs
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <span>🇮🇳</span> Complete Indian Sign Language Dictionary
            </h1>
            <p className="text-xs lg:text-sm text-emerald-100/90 leading-relaxed font-sans">
              Comprehensive vocabulary reference featuring <strong>two-handed finger-spelling (A-Z)</strong>, counting numbers, greetings (Namaste), daily phrases, food, relations, and emergency terms with <strong>HD video demonstrations</strong>, <strong>high-contrast diagrams</strong>, and <strong>cultural meanings</strong>.
            </p>
          </div>

          {/* Quick Action Tools */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Open Alphabet Chart Modal */}
            <button
              onClick={() => setShowAlphabetModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/40 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer transform active:scale-95"
            >
              <Grid className="w-4 h-4" />
              <span>A-Z Alphabet Chart</span>
            </button>

            {/* Open Flashcards Studio */}
            <button
              onClick={() => setShowFlashcardsModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600/80 hover:bg-amber-500 border border-amber-400/40 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer transform active:scale-95"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Flashcards & Quiz</span>
            </button>

            {/* Learning Dashboard Link */}
            {onNavigateToLearningDashboard && (
              <button
                onClick={onNavigateToLearningDashboard}
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-600/90 hover:bg-orange-500 border border-orange-400/40 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer transform active:scale-95"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Learning Dashboard</span>
              </button>
            )}

            {/* Language System Switcher */}
            <div className="flex items-center bg-black/60 p-1 rounded-2xl border border-emerald-700/50">
              <button
                onClick={() => handleLanguageSwitch('ISL')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all ${
                  activeSignLanguageSystem === 'ISL'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🇮🇳 ISL (India)
              </button>
              <button
                onClick={() => handleLanguageSwitch('ASL')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all ${
                  activeSignLanguageSystem === 'ASL'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🇺🇸 ASL (US)
              </button>
              <button
                onClick={() => handleLanguageSwitch('ALL')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all ${
                  activeSignLanguageSystem === 'ALL'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Search & Multi-Filter Control Hub */}
      <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 shadow-sm space-y-4" id="search-filter-hub">
        
        {/* Search Bar Input & Filter Controls */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by English, Hindi (नमस्ते / पानी), meaning, phrase, or topic..."
              className="w-full bg-[#f8f9fa] dark:bg-[#151518] border border-[#e0e4db] dark:border-[#2d2d32] rounded-2xl pl-11 pr-10 py-3 text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            
            {/* Handedness Filter */}
            <select
              value={selectedHandType}
              onChange={(e) => setSelectedHandType(e.target.value as any)}
              className="bg-[#f8f9fa] dark:bg-[#151518] border border-[#e0e4db] dark:border-[#2d2d32] rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none"
            >
              <option value="all">✋ All Hands</option>
              <option value="two-handed">👐 Two-Handed (ISL Core)</option>
              <option value="one-handed">🖐️ One-Handed</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="bg-[#f8f9fa] dark:bg-[#151518] border border-[#e0e4db] dark:border-[#2d2d32] rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none"
            >
              <option value="all">📊 All Difficulties</option>
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>

            {/* Reset Filters */}
            {(searchQuery || selectedDifficulty !== 'all' || selectedHandType !== 'all' || activeCategory !== 'all' || selectedAlphabet !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDifficulty('all');
                  setSelectedHandType('all');
                  setActiveCategory('all');
                  setSelectedAlphabet('ALL');
                }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-mono font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 rounded-xl hover:bg-rose-100 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* 3. Alphabet Quick A-Z Selector Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mr-1 shrink-0">
            Letter:
          </span>
          {alphabetList.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedAlphabet(letter)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                selectedAlphabet === letter
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* 4. ISL Category Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-neutral-100 dark:border-neutral-800">
          {ISL_CATEGORIES.map((cat) => {
            const isBookmarkedTab = cat.id === 'bookmarked';
            const badgeCount = isBookmarkedTab 
              ? bookmarkedIds.length 
              : cat.id === 'all' 
              ? allGestures.length 
              : allGestures.filter(g => g.category === cat.id).length;

            if (cat.id !== 'all' && cat.id !== 'bookmarked' && badgeCount === 0) return null;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-emerald-500'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  activeCategory === cat.id 
                    ? 'bg-white/25 text-white' 
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}>
                  {badgeCount}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 5. Main Dual-Pane Content View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="dictionary-dual-pane">
        
        {/* Left / Center: Sign Cards Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Showing {filteredGestures.length} {filteredGestures.length === 1 ? 'sign' : 'signs'}
            </span>
            {searchQuery && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                Matches for "{searchQuery}"
              </span>
            )}
          </div>

          {filteredGestures.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[780px] overflow-y-auto pr-1">
              {filteredGestures.map((gesture) => {
                const isSelected = inspectedGesture?.id === gesture.id;
                const isBookmarked = bookmarkedIds.includes(gesture.id);

                return (
                  <div
                    key={gesture.id}
                    onClick={() => setInspectedGesture(gesture)}
                    className={`group p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-[#1e1e22] border-neutral-200 dark:border-[#2d2d32] hover:border-emerald-400 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Card Top Row: Hand shape tag, difficulty, bookmark */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                            {gesture.isTwoHanded ? '👐 2-HAND' : '🖐️ 1-HAND'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${
                            gesture.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' :
                            gesture.difficulty === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {gesture.difficulty}
                          </span>
                        </div>

                        <button
                          onClick={(e) => toggleBookmark(gesture.id, e)}
                          className="text-neutral-400 hover:text-amber-500 transition-colors p-1"
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark sign'}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </div>

                      {/* Sign Title & Hindi Translation */}
                      <div className="space-y-0.5 mb-2">
                        <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                          {gesture.char}
                          {gesture.signLanguage && (
                            <span className="text-[9px] font-mono font-bold text-neutral-400 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                              {gesture.signLanguage}
                            </span>
                          )}
                        </h3>
                        {gesture.hindiChar && (
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                            {gesture.hindiChar}
                          </p>
                        )}
                      </div>

                      {/* Meaning / Visual Tip summary */}
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                        {gesture.meaning || gesture.description}
                      </p>
                    </div>

                    {/* Card Footer: Video / Inspect CTA */}
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 font-bold">
                        <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                        HD Video & Meaning
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        Inspect
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#1e1e22] border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-3">
              <Search className="w-10 h-10 text-neutral-400 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">No signs matched your search</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Try searching for general words like "Namaste", "Water", "Mother", or clear your filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDifficulty('all');
                  setSelectedHandType('all');
                  setActiveCategory('all');
                }}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </div>

        {/* Right Pane: Complete Inspector, Video Demonstration & Meaning Studio (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6" id="inspector-media-studio">
          
          {inspectedGesture ? (
            <div className="bg-white dark:bg-[#1e1e22] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-lg space-y-5">
              
              {/* Top Details & Audio Reader */}
              <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {inspectedGesture.signLanguage || 'ISL'} • {inspectedGesture.isTwoHanded ? '2-Handed' : '1-Handed'}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase">
                      {inspectedGesture.grammaticalRole || 'Vocabulary Sign'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
                    {inspectedGesture.char}
                  </h2>
                  {inspectedGesture.hindiChar && (
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {inspectedGesture.hindiChar}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Speech Pronunciation Button */}
                  <button
                    onClick={() => speakSign(inspectedGesture)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      isSpeaking
                        ? 'bg-emerald-500 text-white border-emerald-500 animate-pulse'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-emerald-500'
                    }`}
                    title="Audio Pronunciation & Explanation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  {/* Bookmark Toggle */}
                  <button
                    onClick={(e) => toggleBookmark(inspectedGesture.id, e)}
                    className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-amber-500 transition-colors"
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarkedIds.includes(inspectedGesture.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>
                </div>
              </div>

              {/* HD Interactive Video Demonstrator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                    Interactive Video Demonstration
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                    Looping Vector Simulator
                  </span>
                </div>
                <ISLVideoDemonstrator sign={activeIslSignItem} />
              </div>

              {/* Semantic Meaning & Cultural Significance */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  <Info className="w-4 h-4 text-emerald-500" />
                  Semantic Meaning & Cultural Context
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                  {inspectedGesture.meaning || inspectedGesture.description}
                </p>

                {inspectedGesture.culturalContext && (
                  <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800 text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed italic">
                    <strong>🇮🇳 Indian Cultural Context:</strong> {inspectedGesture.culturalContext}
                  </div>
                )}

                {/* Synonyms / Regional equivalents */}
                {inspectedGesture.synonyms && inspectedGesture.synonyms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase mr-1">Equivalent:</span>
                    {inspectedGesture.synonyms.map(syn => (
                      <span key={syn} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                        "{syn}"
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Step-by-Step Instructions */}
              {inspectedGesture.steps && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-400 block">
                    Step-by-step execution guidelines
                  </span>
                  <div className="space-y-2">
                    {inspectedGesture.steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-800">
                          {i + 1}
                        </span>
                        <p className="mt-0.5">{st}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lock into Practice Camera HUD */}
              <div className="pt-2">
                <button
                  onClick={() => onSelectGesture(inspectedGesture)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Flame className="w-4 h-4 fill-white" />
                  Practice Sign in Live Camera HUD
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
                <p className="text-[10px] text-neutral-400 text-center mt-1.5">
                  Directs to the live webcam practice scanner to verify your physical posture and joint calibration.
                </p>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#1e1e22] border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-3">
              <BookOpen className="w-12 h-12 text-neutral-400/50 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Select a sign from the list</h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Explore HD video demonstrations, step instructions, and cultural meanings.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* A-Z Alphabet Chart Modal */}
      {showAlphabetModal && (
        <ISLAlphabetChartModal 
          onClose={() => setShowAlphabetModal(false)}
          onSelectSign={(sign) => {
            const match = allGestures.find(g => g.id === sign.id);
            if (match) setInspectedGesture(match);
          }}
        />
      )}

      {/* Flashcards & Quiz Modal */}
      {showFlashcardsModal && (
        <ISLFlashcardQuizModal
          signs={COMPLETE_ISL_DICTIONARY}
          onClose={() => setShowFlashcardsModal(false)}
          onSelectForPractice={(sign) => {
            const match = allGestures.find(g => g.id === sign.id);
            if (match) onSelectGesture(match);
          }}
        />
      )}

    </div>
  );
}
