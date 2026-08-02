import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { UILanguage, SUPPORTED_UI_LANGUAGES } from '../lib/i18n';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'dropdown' | 'pills';
  className?: string;
}

export default function LanguageSelector({ variant = 'dropdown', className = '' }: LanguageSelectorProps) {
  const { language, setLanguage, currentLanguageInfo, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'pills') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {supportedLanguages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#f0f2ee] dark:bg-[#252528] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
              <span className="text-[10px] opacity-75 font-normal">({lang.name})</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f0f2ee] dark:bg-[#202024] hover:bg-[#e4e8e1] dark:hover:bg-[#2a2a2e] text-[#2d2d28] dark:text-[#f4f4f5] border border-[#d8dcd3] dark:border-[#333338] text-xs font-bold transition shadow-xs"
        aria-label="Select UI Language"
        title="Change interface language (English, Hindi, Kannada, Malayalam, Tamil)"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-mono">{currentLanguageInfo.flag}</span>
        <span className="font-medium">{currentLanguageInfo.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#1c1c20] rounded-2xl shadow-xl border border-[#ecece0] dark:border-[#2d2d32] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-[#ecece0] dark:border-[#2d2d32] mb-1">
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-stone-400">
              Select UI Language / ಭಾಷೆ / भाषा / ഭാഷ / மொழி
            </p>
          </div>
          {supportedLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition ${
                  isSelected ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30' : 'text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{lang.flag}</span>
                  <div>
                    <span className="font-bold block leading-tight">{lang.nativeName}</span>
                    <span className="text-[10px] text-stone-400 font-normal">{lang.name}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
