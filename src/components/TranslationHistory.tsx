import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  Download, 
  Volume2, 
  Copy, 
  Check, 
  Globe,
  Filter,
  FileJson,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';
import { TranslationLogItem } from '../types';

interface TranslationHistoryProps {
  translations: TranslationLogItem[];
  onDeleteIndividual: (id: string) => void;
  onClearHistory: () => void;
  onSpeak: (text: string, lang: string) => void;
}

export default function TranslationHistory({
  translations,
  onDeleteIndividual,
  onClearHistory,
  onSpeak,
}: TranslationHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyItem = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTranslations = useMemo(() => {
    return translations.filter(item => {
      // Search matches source text, translated text, or target language
      const matchesSearch = searchTerm.trim() === '' || 
        (item.inputText || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.translatedText || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLang = selectedLanguage === 'All' || item.targetLanguage === selectedLanguage;
      
      return matchesSearch && matchesLang;
    });
  }, [translations, searchTerm, selectedLanguage]);

  // Export JSON
  const exportToJSON = () => {
    if (translations.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(translations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ASL_Translation_History_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
  const exportToCSV = () => {
    if (translations.length === 0) return;
    const headers = ["ID", "Timestamp", "Input Phrase", "Translated Text", "Target Language"];
    const rows = translations.map(item => [
      item.id,
      item.timestamp,
      `"${(item.inputText || '').replace(/"/g, '""')}"`,
      `"${(item.translatedText || '').replace(/"/g, '""')}"`,
      item.targetLanguage
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ASL_Translation_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-[32px] p-6 shadow-sm space-y-5 animate-fadeIn" id="translation-history-panel">
      {/* Header section with counts and global controls */}
      <div className="border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] flex items-center gap-2">
            <History className="w-5 h-5 text-[#7c8d7c]" />
            Translation History & Archive
          </h3>
          <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] mt-0.5">
            View, search, and manage history of all translated sign language sentences.
          </p>
        </div>

        {translations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Export options */}
            <div className="flex items-center gap-1.5 bg-[#fbfbf6] dark:bg-[#151518] border border-[#e0e4db] dark:border-[#2d2d32] p-1 rounded-xl">
              <button
                onClick={exportToJSON}
                className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-[#5a5a4a] dark:text-zinc-300 hover:text-[#7c8d7c] transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase font-mono tracking-wider"
                title="Export History as JSON"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
              <div className="w-px h-4 bg-gray-200 dark:bg-zinc-800" />
              <button
                onClick={exportToCSV}
                className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-[#5a5a4a] dark:text-zinc-300 hover:text-[#7c8d7c] transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase font-mono tracking-wider"
                title="Export History as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            {/* Clear All Button */}
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete ALL translation history? This cannot be undone.")) {
                  onClearHistory();
                }
              }}
              className="py-2 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
              title="Delete all translation history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and search controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search bar */}
        <div className="relative md:col-span-8">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search translated sentences or key phrases..."
            className="w-full pl-9 pr-4 py-2.5 text-xs font-sans text-gray-700 dark:text-zinc-300 bg-[#fbfbf6] dark:bg-[#161619] border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#7c8d7c] focus:ring-1 focus:ring-[#7c8d7c] font-medium placeholder-gray-400"
          />
        </div>

        {/* Language selector */}
        <div className="relative md:col-span-4">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-3 py-2.5 text-xs text-gray-600 dark:text-zinc-400 bg-[#fbfbf6] dark:bg-[#161619] border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#7c8d7c] cursor-pointer font-sans font-medium"
          >
            <option value="All">All Languages</option>
            <option value="English">🇬🇧 English</option>
            <option value="Hindi">🇮🇳 Hindi</option>
            <option value="Kannada">🇮🇳 Kannada</option>
            <option value="Malayalam">🇮🇳 Malayalam</option>
          </select>
        </div>
      </div>

      {/* List content of history */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 select-none" id="history-items-list">
        {filteredTranslations.length > 0 ? (
          filteredTranslations.map((item) => {
            const flagMap: Record<string, string> = {
              "English": "🇬🇧",
              "Hindi": "🇮🇳",
              "Kannada": "🇮🇳",
              "Malayalam": "🇮🇳"
            };
            return (
              <div 
                key={item.id} 
                className="p-4 bg-[#fdfcf9] dark:bg-[#151518]/60 border border-[#e0e4db] dark:border-[#2d2d32] rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-[#cbdcbc] dark:hover:border-zinc-700 transition-all duration-250 animate-fadeIn"
              >
                <div className="space-y-2 flex-1 w-full">
                  {/* Item top metadata row */}
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-50 dark:bg-[#2b2520] text-amber-700 dark:text-[#ebdcd1] border border-amber-100/30 flex items-center gap-1">
                      <span>{flagMap[item.targetLanguage] || "🌐"}</span>
                      <span>{item.targetLanguage}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-sans font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.timestamp}
                    </span>
                  </div>

                  {/* Sentences content */}
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-mono font-bold">
                      Detected Sign:
                    </div>
                    <div className="text-xs font-mono font-semibold text-gray-800 dark:text-zinc-200">
                      {item.inputText}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-mono font-bold">
                      Translation:
                    </div>
                    <div className="text-sm font-sans font-bold text-[#2d2d28] dark:text-white leading-relaxed">
                      {item.translatedText}
                    </div>
                  </div>
                </div>

                {/* Individual item micro-actions */}
                <div className="flex sm:flex-col gap-2 w-full sm:w-auto self-stretch sm:self-center justify-end sm:justify-center border-t sm:border-t-0 border-[#f0f2ee] dark:border-[#2d2d32] pt-3 sm:pt-0">
                  {/* Speak */}
                  <button
                    onClick={() => onSpeak(item.translatedText, item.targetLanguage)}
                    className="p-2 border border-[#e0e4db] dark:border-[#2d2d32] text-gray-500 dark:text-zinc-400 hover:bg-[#7c8d7c] hover:text-white dark:hover:bg-[#4a5c4e] rounded-xl text-xs transition-all cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1"
                    title="Speak Translation Aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="sm:hidden font-bold uppercase tracking-wider font-mono text-[9px]">Speak</span>
                  </button>

                  {/* Copy */}
                  <button
                    onClick={() => handleCopyItem(item.id, item.translatedText)}
                    className="p-2 border border-[#e0e4db] dark:border-[#2d2d32] text-gray-500 dark:text-zinc-400 hover:bg-[#7c8d7c] hover:text-white dark:hover:bg-[#4a5c4e] rounded-xl text-xs transition-all cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1"
                    title="Copy Translation Text"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="sm:hidden font-bold uppercase tracking-wider font-mono text-[9px]">
                      {copiedId === item.id ? "Copied" : "Copy"}
                    </span>
                  </button>

                  {/* Delete individual */}
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this translation record from history?")) {
                        onDeleteIndividual(item.id);
                      }
                    }}
                    className="p-2 border border-rose-100 dark:border-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-xs transition-all cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="sm:hidden font-bold uppercase tracking-wider font-mono text-[9px]">Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 bg-[#fdfcf9] dark:bg-[#151518]/30 border border-dashed border-[#e2e2d0] dark:border-[#2d2d32] rounded-2xl flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-100 dark:bg-[#1e1e22] border border-[#e0e4db] dark:border-[#2d2d32] rounded-full flex items-center justify-center text-neutral-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#2d2d28] dark:text-[#cbd5e1] uppercase tracking-wide">
                {searchTerm.trim() || selectedLanguage !== 'All' ? "No Matching Records" : "Archive Empty"}
              </h4>
              <p className="text-[11px] text-[#5c5c50] dark:text-[#a1a1aa] leading-relaxed mt-1 max-w-sm">
                {searchTerm.trim() || selectedLanguage !== 'All' 
                  ? "Try adjusting your query or filter to locate the translation record."
                  : "Start translating your gesture sentences or typed phrases above to compile a permanent historical translation archive."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
