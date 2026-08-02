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
  FileText,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { TranslationLogItem } from '../types';
import { jsPDF } from 'jspdf';

interface TranslationHistoryProps {
  translations: TranslationLogItem[];
  onDeleteIndividual: (id: string) => void;
  onClearHistory: () => void;
  onSpeak: (text: string, lang: string) => void;
  currentUser?: any;
  onOpenCorrectionModal?: (predictedChar: string, confidence?: number, source?: string) => void;
}

export default function TranslationHistory({
  translations,
  onDeleteIndividual,
  onClearHistory,
  onSpeak,
  currentUser,
  onOpenCorrectionModal
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

  // Export clean PDF report matching sage/slate aesthetic with timestamps and user details
  const exportToPDF = () => {
    if (filteredTranslations.length === 0) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color definitions
    // Sage Accent: [124, 141, 124]
    // Dark Charcoal Text: [45, 45, 40]
    // Subtle Sage-Tint Box bg: [251, 251, 246]
    // Border line color: [224, 228, 219]

    const margin = 15;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - (margin * 2);

    let y = margin;

    // Header Sage Line
    doc.setFillColor(124, 141, 124);
    doc.rect(margin, y, contentWidth, 3, 'F');
    y += 10;

    // Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(45, 45, 40);
    doc.text('ASL Sign Language Translation Report', margin, y);
    y += 6;

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(122, 122, 106);
    doc.text('Official translation archive & learning activity logs generated via ASL Studio.', margin, y);
    y += 8;

    // Horizontal Divider
    doc.setDrawColor(224, 228, 219);
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    // User & Session Context Summary Block
    doc.setFillColor(251, 251, 246);
    doc.rect(margin, y, contentWidth, 28, 'F');
    doc.setDrawColor(224, 228, 219);
    doc.rect(margin, y, contentWidth, 28, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(45, 45, 40);
    doc.text('SECURITY STATUS & USER INFORMATION', margin + 5, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 70);
    
    const userEmail = currentUser?.email || 'Guest Learner (Offline Session)';
    const userUID = currentUser?.uid ? `UID: ${currentUser.uid}` : 'Local-only guest session';
    doc.text(`Account Email: ${userEmail}`, margin + 5, y + 12);
    doc.text(`Security Node: ${userUID}`, margin + 5, y + 17);

    const formattedNow = new Date().toLocaleString([], {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    doc.text(`Exported On: ${formattedNow}`, margin + 5, y + 22);

    // Language statistics
    const languageStats = filteredTranslations.reduce((acc, curr) => {
      acc[curr.targetLanguage] = (acc[curr.targetLanguage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const statsString = Object.entries(languageStats).map(([lang, count]) => `${lang}: ${count}`).join(', ');

    doc.setFont('helvetica', 'bold');
    doc.text('ARCHIVE INSIGHTS', margin + contentWidth - 80, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Records Displayed: ${filteredTranslations.length}`, margin + contentWidth - 80, y + 12);
    doc.text(`Language Breakdown:`, margin + contentWidth - 80, y + 17);
    doc.setFontSize(7.5);
    doc.text(statsString || 'None', margin + contentWidth - 80, y + 21, { maxWidth: 75 });

    y += 36;

    // Table Columns Headers
    doc.setFillColor(240, 242, 238);
    doc.rect(margin, y - 8, contentWidth, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(45, 45, 40);
    doc.text('TIMESTAMP / ID', margin + 3, y - 2.5);
    doc.text('DETECTED SIGN GESTURES', margin + 55, y - 2.5);
    doc.text('TRANSLATED OUTPUT (TARGET LOCALE)', margin + 110, y - 2.5);

    // Items list
    filteredTranslations.forEach((item, index) => {
      const splitInput = doc.splitTextToSize(item.inputText || 'N/A', 50);
      const splitTrans = doc.splitTextToSize(`[${item.targetLanguage}] ${item.translatedText || ''}`, contentWidth - 113);
      
      const linesCount = Math.max(splitInput.length, splitTrans.length, 2);
      const itemHeight = (linesCount * 4.5) + 8; // dynamic cell height with safe line spacing

      // Check if we overflow current page (A4 height is 297, margin is 15, footer is 15)
      if (y + itemHeight > pageHeight - margin - 15) {
        doc.addPage();
        y = margin + 15;
        
        // Page border line at top of new page
        doc.setFillColor(124, 141, 124);
        doc.rect(margin, y - 10, contentWidth, 2, 'F');

        // Draw headers on new page
        doc.setFillColor(240, 242, 238);
        doc.rect(margin, y - 8, contentWidth, 8, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(45, 45, 40);
        doc.text('TIMESTAMP / ID', margin + 3, y - 2.5);
        doc.text('DETECTED SIGN GESTURES', margin + 55, y - 2.5);
        doc.text('TRANSLATED OUTPUT (TARGET LOCALE)', margin + 110, y - 2.5);
      }

      // Draw alternate zebra background rows
      if (index % 2 === 1) {
        doc.setFillColor(253, 252, 249);
        doc.rect(margin, y, contentWidth, itemHeight, 'F');
      }

      // Border line separating entries
      doc.setDrawColor(240, 242, 238);
      doc.setLineWidth(0.3);
      doc.line(margin, y + itemHeight, margin + contentWidth, y + itemHeight);

      // Col 1: Timestamp
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 100);
      doc.text(item.timestamp || 'N/A', margin + 3, y + 6);
      doc.setFont('helvetica', 'italic');
      doc.text(`ID: ${item.id}`, margin + 3, y + 11);

      // Col 2: Input Sign Phrase (bold)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 65);
      doc.text(splitInput, margin + 55, y + 6);

      // Col 3: Translated Sentences
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(45, 45, 40);
      doc.text(splitTrans, margin + 110, y + 6);

      y += itemHeight;
    });

    // Add running headers / page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(122, 122, 106);
      doc.text(`Page ${i} of ${pageCount}`, margin, pageHeight - 10);
      doc.text(`ASL Studio Translation Utility - Academic & Personal Logs`, margin + contentWidth - 95, pageHeight - 10);
    }

    doc.save(`ASL_Translation_History_${Date.now()}.pdf`);
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
              <div className="w-px h-4 bg-gray-200 dark:bg-zinc-800" />
              <button
                onClick={exportToPDF}
                className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-[#5a5a4a] dark:text-zinc-300 hover:text-[#7c8d7c] transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase font-mono tracking-wider"
                title="Export History as PDF Report"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
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
            <option value="Tamil">🇮🇳 Tamil</option>
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
              "Malayalam": "🇮🇳",
              "Tamil": "🇮🇳"
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
                  {/* Mark Prediction Wrong */}
                  {onOpenCorrectionModal && (
                    <button
                      onClick={() => onOpenCorrectionModal(item.inputText || '?', 92.0, 'Translation Log Archive')}
                      className="p-2 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl text-xs transition-all cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1"
                      title="Flag wrong prediction & submit correction"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="sm:hidden font-bold uppercase tracking-wider font-mono text-[9px]">Flag</span>
                    </button>
                  )}

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
