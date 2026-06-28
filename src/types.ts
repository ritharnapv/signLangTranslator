export interface ASLGesture {
  id: string;
  char: string;
  videoUrl?: string;
  description: string;
  category: 'alphabet' | 'greeting' | 'common' | 'custom' | string;
  visualTip: string;
  meaning?: string;
  synonyms?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  steps?: string[];
  grammaticalRole?: string;
}

export interface TranslationResult {
  predictedChar: string;
  confidence: number;
  explanation: string;
  tips: string[];
  grammarMatches?: string[];
}

export interface MilestoneDay {
  day: number;
  title: string;
  focusArea: string;
  description: string;
  tasks: string[];
  status: 'completed' | 'active' | 'upcoming';
}

export interface SessionHistoryItem {
  id: string;
  timestamp: string;
  caption: string;
  confidence: number;
  canvasImage?: string; // fallback base64
}

export interface CollectedSample {
  id: string;
  label: string;
  timestamp: string;
  landmarks: Array<{x: number, y: number, z: number}>;
  handType?: string;
}

export interface TranslationLogItem {
  id: string;
  timestamp: string;
  inputText: string;
  translatedText: string;
  targetLanguage: string;
}
