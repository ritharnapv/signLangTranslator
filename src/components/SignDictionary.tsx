import React, { useState } from 'react';
import { ASLGesture } from '../types';
import { BookOpen, Sparkles, Star, Search, Flame } from 'lucide-react';

const DICTIONARY_GESTURES: ASLGesture[] = [
  {
    id: "sign_a",
    char: "A",
    description: "Make a tightly closed fist, keeping your thumb vertically aligned on the outside edge of your index finger.",
    category: "alphabet",
    visualTip: "Fist closed tightly, thumb aligned vertically touching the index finger's side."
  },
  {
    id: "sign_b",
    char: "B",
    description: "Hold your four fingers flat and straight up. Tuck your thumb folded inside across your palm.",
    category: "alphabet",
    visualTip: "Open flat upright palm, thumb securely folded inward across the palm skin."
  },
  {
    id: "sign_c",
    char: "C",
    description: "Curve all four fingers and your thumb to mimic a semi-circular cup shape resembling the letter C.",
    category: "alphabet",
    visualTip: "Clear semi-circular profile shape, ensuring distinct space between finger tips and thumb."
  },
  {
    id: "sign_d",
    char: "D",
    description: "Extend your index finger straight up. Touch your middle, ring, and pinky finger tips directly to your thumb tip.",
    category: "alphabet",
    visualTip: "Index pointing vertically alone, other three fingers forming a tight circular contact loop with thumb."
  },
  {
    id: "sign_e",
    char: "E",
    description: "Fold your four fingers slightly to touch their pads to the top edge of your tucked-in thumb.",
    category: "alphabet",
    visualTip: "Curled knuckles layout directly stacked upon horizontal thumb baseline. Looks like an outline curve."
  },
  {
    id: "sign_f",
    char: "F",
    description: "Touch the tip of your index finger directly to your thumb tip, keeping the other three fingers flared straight and apart.",
    category: "alphabet",
    visualTip: "Circle formed by index and thumb, upper three fingers spread upward like a fan."
  },
  {
    id: "sign_y",
    char: "Y",
    description: "Extend only your pinky finger and your thumb outward, folding your three middle fingers into your palm.",
    category: "alphabet",
    visualTip: "Pinky and thumb pointing in opposite directions, middle joints fully compressed."
  },
  {
    id: "sign_hello",
    char: "Hello",
    description: "Place your hand at your forehead with fingers flat and palm facing down, then sweep it outward in a small wave like a salute.",
    category: "greeting",
    visualTip: "Flat vertical hand starting close to the eyebrow peak and moving gracefully outwards."
  },
  {
    id: "sign_thanks",
    char: "Thank You",
    description: "Touch the fingers of your flat, open hand to your lips, then move your hand downward and forward toward the person.",
    category: "greeting",
    visualTip: "Start flat at mouth height, motioning fluidly outwards with palm face facing upward."
  }
];

interface SignDictionaryProps {
  onSelectGesture: (gesture: ASLGesture) => void;
  activeGesture: ASLGesture | null;
}

export default function SignDictionary({ onSelectGesture, activeGesture }: SignDictionaryProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'alphabet' | 'greeting'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGestures = DICTIONARY_GESTURES.filter(gesture => {
    const matchesCategory = activeCategory === 'all' || gesture.category === activeCategory;
    const matchesSearch = gesture.char.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          gesture.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white border border-[#ecece0] rounded-3xl p-6 shadow-sm" id="dictionary-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#f0f2ee] text-[#7c8d7c] rounded-2xl border border-[#e0e4db]">
            <BookOpen className="w-6 h-6" id="book-icon" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2d2d28] font-sans tracking-tight">ASL Reference Guide</h2>
            <p className="text-xs text-[#7a7a6a]">Select a letter or word below to lock it inside the AI Webcam Scanner</p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 bg-[#fdfcf9] p-1 rounded-xl border border-[#ecece0]" id="category-tabs">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === 'all'
                ? "bg-[#7c8d7c] text-white shadow-sm"
                : "text-[#7a7a6a] hover:text-[#2d2d28]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveCategory('alphabet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === 'alphabet'
                ? "bg-[#7c8d7c] text-white shadow-sm"
                : "text-[#7a7a6a] hover:text-[#2d2d28]"
            }`}
          >
            A-Z Alphabet
          </button>
          <button
            onClick={() => setActiveCategory('greeting')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === 'greeting'
                ? "bg-[#7c8d7c] text-white shadow-sm"
                : "text-[#7a7a6a] hover:text-[#2d2d28]"
            }`}
          >
            Greetings
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-5" id="search-container">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9a9a8a]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search signs, hand configurations, or words..."
          className="w-full bg-[#fdfcf9] border border-[#ecece0] focus:border-[#7c8d7c] rounded-xl py-2.5 pl-11 pr-4 text-xs text-[#4a4a40] placeholder-[#9a9a8a] outline-none transition-all font-sans"
        />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbarScroll" id="dictionary-grid">
        {filteredGestures.map((gesture) => {
          const isTargeted = activeGesture?.id === gesture.id;
          return (
            <div
              key={gesture.id}
              onClick={() => onSelectGesture(gesture)}
              className={`group p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                isTargeted
                  ? "bg-[#f0f2ee] border-[#7c8d7c] shadow-sm ring-1 ring-[#7c8d7c]/30"
                  : "bg-[#fdfcf9] border-[#ecece0] hover:border-[#7c8d7c]/60 hover:bg-[#f0f2ee]/30"
              }`}
              id={`dict-card-${gesture.char}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-sans tracking-tight text-[#2d2d28] group-hover:text-[#7c8d7c] transition-colors">
                      {gesture.char}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-sans font-semibold uppercase ${
                      gesture.category === 'alphabet' ? 'bg-[#f0f2ee] text-[#7c8d7c] border border-[#e0e4db]' : 'bg-[#ebdcd1] text-[#a36b5e] border border-[#ebdcd1]'
                    }`}>
                      {gesture.category}
                    </span>
                  </div>
                  {isTargeted && (
                    <div className="flex items-center gap-1 text-[9px] text-[#7c8d7c] font-bold bg-[#f0f2ee] px-2 py-0.5 rounded-md border border-[#e0e4db]">
                      <Flame className="w-3.5 h-3.5 fill-[#7c8d7c] text-[#7c8d7c] shrink-0" />
                      Target
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#5a5a4a] leading-relaxed font-sans mb-3 line-clamp-2 group-hover:text-[#2d2d28] transition-all">
                  {gesture.description}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-[#ecece0] flex items-center gap-1.5 text-[10px] text-[#7c8d7c] font-medium font-sans">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#a36b5e]" />
                <span className="truncate text-slate-500 italic">{gesture.visualTip}</span>
              </div>
            </div>
          );
        })}

        {filteredGestures.length === 0 && (
          <div className="col-span-full py-8 text-center" id="no-dict-results">
            <p className="text-sm text-[#7a7a6a] font-sans">No matching ASL hand configurations found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
