import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  HelpCircle,
  Eye,
  Hand,
  Volume2,
  Flame,
  Award
} from 'lucide-react';
import { ISLSignItem } from '../data/islDictionaryData';

interface ISLFlashcardQuizModalProps {
  signs: ISLSignItem[];
  onClose: () => void;
  onSelectForPractice: (sign: ISLSignItem) => void;
}

export default function ISLFlashcardQuizModal({ signs, onClose, onSelectForPractice }: ISLFlashcardQuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [quizMode, setQuizMode] = useState<'flashcard' | 'quiz'>('flashcard');
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<string | null>(null);

  const currentSign = signs[currentIndex] || signs[0];

  const handleNext = () => {
    setIsFlipped(false);
    setQuizAnswerSelected(null);
    if (currentIndex < signs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setQuizAnswerSelected(null);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(signs.length - 1);
    }
  };

  const handleMarkKnown = (known: boolean) => {
    if (known && !reviewedIds.includes(currentSign.id)) {
      setScore(prev => prev + 1);
      setReviewedIds(prev => [...prev, currentSign.id]);
    }
    handleNext();
  };

  // Generate 4 randomized quiz options
  const quizOptions = React.useMemo(() => {
    if (!currentSign) return [];
    const correct = currentSign.char;
    const others = signs.filter(s => s.char !== correct).map(s => s.char);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    return [correct, ...shuffledOthers].sort(() => Math.random() - 0.5);
  }, [currentSign, signs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                ISL Interactive Flashcard Studio
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {currentIndex + 1} of {signs.length}
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Master Indian Sign Language vocabulary with self-paced flashcards and recall tests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switch */}
            <div className="flex items-center bg-neutral-200 dark:bg-neutral-800 p-1 rounded-xl">
              <button
                onClick={() => { setQuizMode('flashcard'); setIsFlipped(false); }}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  quizMode === 'flashcard' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Flashcards
              </button>
              <button
                onClick={() => { setQuizMode('quiz'); setQuizAnswerSelected(null); }}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  quizMode === 'quiz' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Quiz Mode
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[360px]">
          
          {quizMode === 'flashcard' ? (
            /* Flashcard 3D Flip Card */
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full max-w-lg aspect-[16/10] perspective-1000 cursor-pointer group select-none"
            >
              <div 
                className={`relative w-full h-full rounded-3xl p-8 transition-transform duration-500 transform-style-3d border shadow-xl flex flex-col items-center justify-center text-center ${
                  isFlipped 
                    ? 'bg-emerald-900/90 text-white border-emerald-700' 
                    : 'bg-gradient-to-br from-[#fafaf8] to-[#f0f2ee] dark:from-neutral-800 dark:to-neutral-900 text-neutral-900 dark:text-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                {/* Flip Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 group-hover:text-emerald-500 transition-colors">
                  <RotateCw className="w-3.5 h-3.5" />
                  Click to Flip
                </div>

                {!isFlipped ? (
                  /* Front of Card: Word, Hindi & Visual Tip */
                  <div className="space-y-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {currentSign.category.replace('isl-', '').replace('-', ' ').toUpperCase()} • {currentSign.isTwoHanded ? '2-HANDED' : '1-HANDED'}
                    </span>
                    <h3 className="text-3xl font-black tracking-tight">{currentSign.char}</h3>
                    {currentSign.hindiChar && (
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                        {currentSign.hindiChar}
                      </p>
                    )}
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-sm mx-auto leading-relaxed">
                      💡 {currentSign.visualTip}
                    </p>
                  </div>
                ) : (
                  /* Back of Card: Meaning, Signing Steps & Cultural Note */
                  <div className="space-y-3 max-w-md text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-300 block">
                      Semantic Meaning & Instructions
                    </span>
                    <p className="text-xs text-emerald-50 leading-relaxed font-medium">
                      {currentSign.meaning || currentSign.description}
                    </p>

                    {currentSign.steps && (
                      <div className="space-y-1.5 pt-2 border-t border-emerald-800/80">
                        {currentSign.steps.slice(0, 2).map((st, i) => (
                          <div key={i} className="text-[11px] text-emerald-100 flex items-start gap-2">
                            <span className="font-bold text-emerald-300">{i + 1}.</span>
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentSign.culturalContext && (
                      <p className="text-[10px] text-emerald-200/80 italic pt-1">
                        🇮🇳 {currentSign.culturalContext}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Mode View */
            <div className="w-full max-w-lg space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                  Identify the Indian Sign Language Sign
                </span>
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    "{currentSign.description}"
                  </p>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-2">
                    💡 Tip: {currentSign.visualTip} ({currentSign.isTwoHanded ? '2-Handed' : '1-Handed'})
                  </span>
                </div>
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-2 gap-3">
                {quizOptions.map((opt) => {
                  const isSelected = quizAnswerSelected === opt;
                  const isCorrect = opt === currentSign.char;
                  const showResult = quizAnswerSelected !== null;

                  return (
                    <button
                      key={opt}
                      onClick={() => setQuizAnswerSelected(opt)}
                      disabled={showResult}
                      className={`p-4 rounded-2xl text-center font-bold text-sm border transition-all cursor-pointer ${
                        !showResult
                          ? 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border-neutral-200 dark:border-neutral-700'
                          : isCorrect
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg'
                          : isSelected
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-400 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quizAnswerSelected && (
                <div className="text-center">
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
                  >
                    Next Question →
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Previous Sign"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Next Sign"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSelectForPractice(currentSign);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 fill-white" />
              Practice with Camera Live
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
