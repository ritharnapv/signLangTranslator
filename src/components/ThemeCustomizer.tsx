import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  X, 
  Sliders, 
  RotateCcw, 
  Sparkles,
  Eye,
  CheckCircle2
} from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorTheme = 'emerald' | 'ocean' | 'sunset' | 'violet' | 'amber' | 'onyx';
export type BorderRadiusOption = 'crisp' | 'standard' | 'rounded';

export interface ThemeSettings {
  themeMode: ThemeMode;
  colorTheme: ColorTheme;
  borderRadius: BorderRadiusOption;
  highContrast: boolean;
}

export interface ThemePreset {
  id: ColorTheme;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentBgLight: string;
  accentBgDark: string;
  badge: string;
}

export const COLOR_THEMES: ThemePreset[] = [
  {
    id: 'emerald',
    name: 'Emerald Sage',
    description: 'Natural organic sage green with warm clay accents',
    primaryColor: '#7c8d7c',
    secondaryColor: '#a36b5e',
    accentBgLight: '#f0f2ee',
    accentBgDark: '#1f1f22',
    badge: 'Classic Default'
  },
  {
    id: 'ocean',
    name: 'Pacific Sky',
    description: 'Vibrant azure blue with deep sapphire highlights',
    primaryColor: '#0284c7',
    secondaryColor: '#2563eb',
    accentBgLight: '#e0f2fe',
    accentBgDark: '#0f1d33',
    badge: 'High Focus'
  },
  {
    id: 'sunset',
    name: 'Terracotta Rose',
    description: 'Warm coral sunset with deep rose terracotta',
    primaryColor: '#e11d48',
    secondaryColor: '#ea580c',
    accentBgLight: '#ffe4e6',
    accentBgDark: '#260f15',
    badge: 'Warm & Vivid'
  },
  {
    id: 'violet',
    name: 'Royal Amethyst',
    description: 'Deep royal purple with bright magenta glow',
    primaryColor: '#7c3aed',
    secondaryColor: '#c026d3',
    accentBgLight: '#f3e8ff',
    accentBgDark: '#1e0f33',
    badge: 'Modern Studio'
  },
  {
    id: 'amber',
    name: 'Golden Ochre',
    description: 'Warm amber harvest gold with bronze accents',
    primaryColor: '#d97706',
    secondaryColor: '#ca8a04',
    accentBgLight: '#fef3c7',
    accentBgDark: '#21160a',
    badge: 'Eye-Safe Warm'
  },
  {
    id: 'onyx',
    name: 'Midnight Onyx',
    description: 'Sleek dark slate with crisp monochromatic contrast',
    primaryColor: '#475569',
    secondaryColor: '#3b82f6',
    accentBgLight: '#f1f5f9',
    accentBgDark: '#0f172a',
    badge: 'Stealth Minimal'
  }
];

interface ThemeCustomizerProps {
  settings: ThemeSettings;
  onChange: (newSettings: Partial<ThemeSettings>) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeCustomizer({
  settings,
  onChange,
  onReset,
  isOpen,
  onClose
}: ThemeCustomizerProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        id="theme-customizer-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#18181b] border border-[#ecece0] dark:border-[#2d2d32] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8"
          id="theme-customizer-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f2ee] dark:border-[#27272a] bg-[#fafaf7] dark:bg-[#1f1f23]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f0f4ee] dark:bg-[#2d2d32] flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Palette className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Theme Customization
                  <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Live Preview
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Personalize light/dark mode, accent palette, and border curvature
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#3f3f46] text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Section 1: Appearance Mode (Light / Dark / System) */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 font-mono block">
                1. Appearance Mode
              </label>
              
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => onChange({ themeMode: 'light' })}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    settings.themeMode === 'light'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 font-bold shadow-sm'
                      : 'bg-gray-50 dark:bg-[#202024] border-gray-200 dark:border-[#2e2e33] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#27272a]'
                  }`}
                >
                  <Sun className={`w-5 h-5 ${settings.themeMode === 'light' ? 'text-amber-500' : ''}`} />
                  <span className="text-xs font-semibold">Light Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ themeMode: 'dark' })}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    settings.themeMode === 'dark'
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-900 dark:text-indigo-300 font-bold shadow-sm'
                      : 'bg-gray-50 dark:bg-[#202024] border-gray-200 dark:border-[#2e2e33] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#27272a]'
                  }`}
                >
                  <Moon className={`w-5 h-5 ${settings.themeMode === 'dark' ? 'text-indigo-400' : ''}`} />
                  <span className="text-xs font-semibold">Dark Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ themeMode: 'system' })}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    settings.themeMode === 'system'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold shadow-sm'
                      : 'bg-gray-50 dark:bg-[#202024] border-gray-200 dark:border-[#2e2e33] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#27272a]'
                  }`}
                >
                  <Monitor className={`w-5 h-5 ${settings.themeMode === 'system' ? 'text-emerald-500' : ''}`} />
                  <span className="text-xs font-semibold">System Auto</span>
                </button>
              </div>
            </div>

            {/* Section 2: Color Palette Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 font-mono block">
                  2. Color Palette Accent
                </label>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Select primary app brand theme
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COLOR_THEMES.map((theme) => {
                  const isSelected = settings.colorTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => onChange({ colorTheme: theme.id })}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-2 bg-white dark:bg-[#202024] shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-gray-50/60 dark:bg-[#1d1d20]/60 border-gray-200 dark:border-[#2d2d32] hover:bg-gray-100 dark:hover:bg-[#252529]'
                      }`}
                      style={{
                        borderColor: isSelected ? theme.primaryColor : undefined
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-white/40 shadow-xs" 
                            style={{ backgroundColor: theme.primaryColor }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border border-white/40 shadow-xs -ml-1.5" 
                            style={{ backgroundColor: theme.secondaryColor }}
                          />
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {theme.name}
                          </span>
                        </div>

                        {isSelected ? (
                          <span 
                            className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: theme.primaryColor }}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-gray-200/60 dark:bg-[#2e2e33] text-gray-500 dark:text-gray-400">
                            {theme.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                        {theme.description}
                      </p>

                      {/* Mini Preview Swatch Bar */}
                      <div className="flex items-center gap-1 pt-1 border-t border-gray-100 dark:border-[#27272a]">
                        <div 
                          className="h-2 flex-1 rounded-full" 
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <div 
                          className="h-2 flex-1 rounded-full" 
                          style={{ backgroundColor: theme.secondaryColor }}
                        />
                        <div 
                          className="h-2 flex-1 rounded-full opacity-30" 
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: UI Corner Radius */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 font-mono block">
                3. UI Border Curvature
              </label>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => onChange({ borderRadius: 'crisp' })}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    settings.borderRadius === 'crisp'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent font-bold shadow-sm'
                      : 'bg-gray-50 dark:bg-[#202024] border-gray-200 dark:border-[#2e2e33] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#27272a]'
                  }`}
                >
                  <div className="w-6 h-4 border-2 border-current rounded-sm mx-auto mb-1 opacity-70" />
                  <span className="text-xs">Crisp (8px)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ borderRadius: 'standard' })}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    settings.borderRadius === 'standard'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent font-bold shadow-sm'
                      : 'bg-gray-50 dark:bg-[#202024] border-gray-200 dark:border-[#2e2e33] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#27272a]'
                  }`}
                >
                  <div className="w-6 h-4 border-2 border-current rounded-lg mx-auto mb-1 opacity-70" />
                  <span className="text-xs">Balanced (16px)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ borderRadius: 'rounded' })}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    settings.borderRadius === 'rounded'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent font-bold shadow-sm'
                      : 'bg-gray-50 dark:bg-[#202024] border-gray-200 dark:border-[#2e2e33] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#27272a]'
                  }`}
                >
                  <div className="w-6 h-4 border-2 border-current rounded-full mx-auto mb-1 opacity-70" />
                  <span className="text-xs">Rounded (24px)</span>
                </button>
              </div>
            </div>

            {/* Section 4: Accessibility High Contrast Switch */}
            <div className="bg-gray-50 dark:bg-[#202024] border border-gray-200 dark:border-[#2e2e33] p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-[#2e2e33] flex items-center justify-center text-gray-700 dark:text-gray-200">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">High Contrast Mode</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Increases text contrast and border outlines for maximum readability</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => onChange({ highContrast: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#fafaf7] dark:bg-[#1f1f23] border-t border-[#f0f2ee] dark:border-[#27272a]">
            <button
              type="button"
              onClick={onReset}
              className="px-3.5 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
