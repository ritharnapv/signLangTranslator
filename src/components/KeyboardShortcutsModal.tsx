import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keyboard, 
  X, 
  Command, 
  Sun, 
  Eye, 
  Type, 
  Camera, 
  Volume2, 
  Trash2, 
  LayoutGrid, 
  Check, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keyCombo: string[];
  description: string;
  category: 'Accessibility' | 'Camera & Speech' | 'Tab Navigation';
  icon?: React.ReactNode;
}

export const SHORTCUTS_LIST: ShortcutItem[] = [
  // Accessibility
  {
    keyCombo: ['Alt', 'H'],
    description: 'Toggle High Contrast Mode on / off',
    category: 'Accessibility',
    icon: <Eye className="w-4 h-4 text-amber-500" />
  },
  {
    keyCombo: ['Alt', 'T'],
    description: 'Cycle Text Size (Standard → Large → Extra Large)',
    category: 'Accessibility',
    icon: <Type className="w-4 h-4 text-emerald-500" />
  },
  {
    keyCombo: ['Alt', 'D'],
    description: 'Toggle Dark / Light appearance mode',
    category: 'Accessibility',
    icon: <Sun className="w-4 h-4 text-indigo-500" />
  },
  {
    keyCombo: ['Alt', 'P'],
    description: 'Open Theme & Accessibility Customizer',
    category: 'Accessibility',
    icon: <Sparkles className="w-4 h-4 text-purple-500" />
  },
  {
    keyCombo: ['Alt', 'K'],
    description: 'Open / Close this Keyboard Shortcuts guide',
    category: 'Accessibility',
    icon: <Keyboard className="w-4 h-4 text-sky-500" />
  },

  // Camera & Speech
  {
    keyCombo: ['Alt', 'C'],
    description: 'Toggle Live Camera stream active state',
    category: 'Camera & Speech',
    icon: <Camera className="w-4 h-4 text-rose-500" />
  },
  {
    keyCombo: ['Alt', 'V'],
    description: 'Toggle Speech Synthesizer (Text-to-Speech)',
    category: 'Camera & Speech',
    icon: <Volume2 className="w-4 h-4 text-teal-500" />
  },
  {
    keyCombo: ['Alt', 'X'],
    description: 'Clear active recognized sign sentence buffer',
    category: 'Camera & Speech',
    icon: <Trash2 className="w-4 h-4 text-orange-500" />
  },

  // Navigation
  {
    keyCombo: ['Alt', '1'],
    description: 'Switch to Real-Time Translation tab',
    category: 'Tab Navigation',
    icon: <LayoutGrid className="w-4 h-4 text-emerald-500" />
  },
  {
    keyCombo: ['Alt', '2'],
    description: 'Switch to Interactive Learning tab',
    category: 'Tab Navigation'
  },
  {
    keyCombo: ['Alt', '3'],
    description: 'Switch to Sign Dictionary tab',
    category: 'Tab Navigation'
  },
  {
    keyCombo: ['Alt', '4'],
    description: 'Switch to Continuous Conversation tab',
    category: 'Tab Navigation'
  },
  {
    keyCombo: ['Alt', '5'],
    description: 'Switch to Dataset Collector tab',
    category: 'Tab Navigation'
  },
  {
    keyCombo: ['Alt', '6'],
    description: 'Switch to Model Trainer tab',
    category: 'Tab Navigation'
  },
  {
    keyCombo: ['Alt', '7'],
    description: 'Switch to Analytics Dashboard tab',
    category: 'Tab Navigation'
  },
  {
    keyCombo: ['Alt', '8'],
    description: 'Switch to User Profile & Preferences tab',
    category: 'Tab Navigation'
  }
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const categories = ['Accessibility', 'Camera & Speech', 'Tab Navigation'] as const;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        id="keyboard-shortcuts-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#18181b] border border-[#ecece0] dark:border-[#2d2d32] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8"
          id="keyboard-shortcuts-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f2ee] dark:border-[#27272a] bg-[#fafaf7] dark:bg-[#1f1f23]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 border border-sky-100 dark:border-sky-800">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 id="shortcuts-modal-title" className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Keyboard Shortcuts Guide
                  <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    Accessibility Ready
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quick hotkeys to operate the sign language translator hands-free
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#3f3f46] text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
              title="Close shortcuts window (Escape)"
              aria-label="Close shortcuts guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/50 p-3.5 rounded-2xl text-xs text-sky-900 dark:text-sky-200 flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>
                Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#27272a] rounded border font-mono font-bold text-[11px] shadow-2xs">Alt</kbd> or <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#27272a] rounded border font-mono font-bold text-[11px] shadow-2xs">Option</kbd> together with the indicated key. You can also press <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#27272a] rounded border font-mono font-bold text-[11px] shadow-2xs">Esc</kbd> anytime to close dialogs.
              </span>
            </div>

            {categories.map((cat) => {
              const items = SHORTCUTS_LIST.filter(s => s.category === cat);
              return (
                <div key={cat} className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 font-mono block">
                    {cat}
                  </h4>

                  <div className="grid grid-cols-1 gap-2.5">
                    {items.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202024] border border-gray-200/70 dark:border-[#2e2e33] flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-2.5">
                          {item.icon && <span className="shrink-0">{item.icon}</span>}
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {item.description}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 font-mono">
                          {item.keyCombo.map((k, kIdx) => (
                            <React.Fragment key={kIdx}>
                              <kbd className="px-2 py-1 bg-white dark:bg-[#2e2e35] text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-[#3f3f46] rounded-lg text-xs font-bold shadow-xs">
                                {k}
                              </kbd>
                              {kIdx < item.keyCombo.length - 1 && (
                                <span className="text-xs text-gray-400 font-bold">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#fafaf7] dark:bg-[#1f1f23] border-t border-[#f0f2ee] dark:border-[#27272a]">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              Screen reader announcements active
            </span>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
            >
              <Check className="w-4 h-4" />
              <span>Got it</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
