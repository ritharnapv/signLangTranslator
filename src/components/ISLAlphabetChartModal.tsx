import React from 'react';
import { X, Sparkles, Hand, ChevronRight, CheckCircle2 } from 'lucide-react';
import { COMPLETE_ISL_DICTIONARY, ISLSignItem } from '../data/islDictionaryData';

interface ISLAlphabetChartModalProps {
  onClose: () => void;
  onSelectSign: (sign: ISLSignItem) => void;
}

export default function ISLAlphabetChartModal({ onClose, onSelectSign }: ISLAlphabetChartModalProps) {
  const alphabetSigns = COMPLETE_ISL_DICTIONARY.filter(s => s.category === 'isl-alphabet');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/40">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="text-xl">🔤</span>
              Complete Indian Sign Language (ISL) Two-Handed Alphabet (A-Z)
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Reference chart for the 26 two-handed manual finger-spelling letters used throughout India.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alphabet Grid */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {alphabetSigns.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectSign(item);
                  onClose();
                }}
                className="group p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center shadow-sm">
                      {item.char}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {item.hindiChar}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 line-clamp-2 leading-snug">
                    {item.visualTip}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-[10px] text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-mono font-bold">
                  <span>{item.isTwoHanded ? '2-Hand' : '1-Hand'}</span>
                  <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-500">
          <span className="font-sans">
            📌 <strong>Vowel Touch Tip:</strong> In ISL, the 5 fingers of the open non-dominant hand represent vowels A (Thumb), E (Index), I (Middle), O (Ring), U (Pinky).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl text-xs"
          >
            Close Chart
          </button>
        </div>

      </div>
    </div>
  );
}
