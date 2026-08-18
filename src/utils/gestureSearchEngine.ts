import { ASLGesture, GestureSearchFilters, ImageSearchMatch, ImageSearchResultData } from '../types';
import { COMPLETE_ISL_DICTIONARY, ISLSignItem } from '../data/islDictionaryData';
import { REFERENCE_SIGN_BLUEPRINTS, SignReferenceBlueprint } from './signEvaluatorEngine';

export interface UnifiedGestureItem {
  id: string;
  char: string;
  hindiChar?: string;
  englishTitle: string;
  category: string;
  categoryLabel: string;
  signLanguage: 'ASL' | 'ISL';
  isTwoHanded: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  visualTip: string;
  meaning: string;
  synonyms: string[];
  steps: string[];
  grammaticalRole: string;
  tags: string[];
  movementType: string;
  movementDescription?: string;
  referenceLandmarks?: Array<{ x: number; y: number; z?: number }>;
  isBookmarked?: boolean;
}

// Transform ASL blueprints to UnifiedGestureItem
export function getAslUnifiedGestures(): UnifiedGestureItem[] {
  return Object.values(REFERENCE_SIGN_BLUEPRINTS)
    .filter((bp) => bp.signLanguage === 'ASL')
    .map((bp: SignReferenceBlueprint) => {
      const isWord = bp.char.length > 1;
      return {
        id: `asl_${bp.id}`,
        char: bp.char,
        englishTitle: bp.name || `ASL ${bp.char}`,
        category: bp.category || (isWord ? 'common' : 'alphabet'),
        categoryLabel: (bp.category === 'alphabet' || !isWord) ? 'Alphabet' : 'Common Signs',
        signLanguage: 'ASL',
        isTwoHanded: bp.isTwoHanded || false,
        difficulty: isWord ? 'medium' : 'easy',
        description: bp.visualTip || `Form the ASL gesture for "${bp.char}".`,
        visualTip: bp.visualTip,
        meaning: `American Sign Language sign for ${bp.char}.`,
        synonyms: [bp.char, bp.name],
        steps: [
          `Position your hand with palm ${bp.palmOrientation.replace('_', ' ')}.`,
          `Configure your fingers according to the ${bp.char} blueprint.`,
          `Hold posture steadily for clear communication.`
        ],
        grammaticalRole: isWord ? 'Vocabulary' : 'Letter',
        tags: ['ASL', bp.category || 'alphabet', bp.char],
        movementType: 'static',
        referenceLandmarks: bp.referenceLandmarks
      };
    });
}

// Transform ISL dictionary to UnifiedGestureItem
export function getIslUnifiedGestures(): UnifiedGestureItem[] {
  return COMPLETE_ISL_DICTIONARY.map((item: ISLSignItem) => {
    return {
      id: `isl_${item.id}`,
      char: item.char,
      hindiChar: item.hindiChar,
      englishTitle: item.englishTitle,
      category: item.category,
      categoryLabel: formatCategoryLabel(item.category),
      signLanguage: 'ISL',
      isTwoHanded: item.isTwoHanded,
      difficulty: item.difficulty || 'medium',
      description: item.description,
      visualTip: item.visualTip,
      meaning: item.meaning,
      synonyms: item.synonyms || [],
      steps: item.steps || [],
      grammaticalRole: item.grammaticalRole || 'Vocabulary',
      tags: item.tags || ['ISL', item.category],
      movementType: item.movementType || 'static',
      movementDescription: item.movementDescription,
      referenceLandmarks: item.rightHandLandmarks ? item.rightHandLandmarks.map(p => ({ x: p.x, y: p.y, z: 0 })) : undefined
    };
  });
}

// Format raw category slugs to human-friendly labels
export function formatCategoryLabel(categorySlug: string): string {
  const map: Record<string, string> = {
    'all': 'All Categories',
    'alphabet': 'Alphabet (A-Z)',
    'common': 'Common Phrases',
    'greeting': 'Greetings & Social',
    'isl-alphabet': 'Alphabet (A-Z)',
    'isl-number': 'Numbers (0-10+)',
    'isl-greeting': 'Greetings & Respect',
    'isl-daily-phrase': 'Daily Phrases',
    'isl-family': 'Family & Relations',
    'isl-food': 'Food & Dining',
    'isl-emotion': 'Emotions & Feelings',
    'isl-health-emergency': 'Health & Emergency',
    'isl-time': 'Time & Calendar',
    'isl-culture-places': 'Places & Culture',
    'custom': 'Custom Trained'
  };
  return map[categorySlug] || categorySlug.replace(/^isl-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Master gesture index cache
let cachedUnifiedGestures: UnifiedGestureItem[] | null = null;

export function getAllUnifiedGestures(customGestures: ASLGesture[] = []): UnifiedGestureItem[] {
  if (!cachedUnifiedGestures) {
    const aslList = getAslUnifiedGestures();
    const islList = getIslUnifiedGestures();
    cachedUnifiedGestures = [...aslList, ...islList];
  }

  // If custom gestures provided, merge them
  if (customGestures.length > 0) {
    const customList: UnifiedGestureItem[] = customGestures.map(cg => ({
      id: `custom_${cg.id}`,
      char: cg.char,
      hindiChar: cg.hindiChar,
      englishTitle: cg.englishTitle || cg.char,
      category: 'custom',
      categoryLabel: 'Custom Trained',
      signLanguage: (cg.signLanguage === 'ISL' ? 'ISL' : 'ASL') as 'ASL' | 'ISL',
      isTwoHanded: cg.isTwoHanded || false,
      difficulty: cg.difficulty || 'medium',
      description: cg.description || `Custom recorded sign for ${cg.char}`,
      visualTip: cg.visualTip || `Execute custom hand shape for ${cg.char}`,
      meaning: cg.meaning || cg.description || '',
      synonyms: cg.synonyms || [],
      steps: cg.steps || ['Execute recorded hand posture.', 'Hold firmly in camera center.'],
      grammaticalRole: cg.grammaticalRole || 'Custom Sign',
      tags: cg.tags || ['Custom', 'User-Trained'],
      movementType: cg.movementType || 'static'
    }));

    return [...cachedUnifiedGestures, ...customList];
  }

  return cachedUnifiedGestures;
}

// Category metadata list with icons and counts
export interface GestureCategoryMeta {
  id: string;
  label: string;
  icon: string;
  signLanguage?: 'ASL' | 'ISL' | 'ALL';
  count: number;
  description: string;
}

export function getGestureCategories(gestures: UnifiedGestureItem[]): GestureCategoryMeta[] {
  const counts: Record<string, number> = {};
  gestures.forEach(g => {
    counts[g.category] = (counts[g.category] || 0) + 1;
  });

  const categories: GestureCategoryMeta[] = [
    { id: 'all', label: 'All Categories', icon: '🌟', count: gestures.length, description: 'Complete sign language corpus' },
    { id: 'alphabet', label: 'ASL Alphabet', icon: '🔤', signLanguage: 'ASL', count: counts['alphabet'] || 0, description: 'One-handed American manual alphabet' },
    { id: 'isl-alphabet', label: 'ISL Alphabet', icon: '🤲', signLanguage: 'ISL', count: counts['isl-alphabet'] || 0, description: 'Two-handed Indian manual alphabet' },
    { id: 'isl-number', label: 'Numbers & Counting', icon: '🔢', signLanguage: 'ISL', count: counts['isl-number'] || 0, description: 'Numeric quantities, digits, and values' },
    { id: 'isl-greeting', label: 'Greetings & Etiquette', icon: '🙏', signLanguage: 'ISL', count: (counts['isl-greeting'] || 0) + (counts['greeting'] || 0), description: 'Namaste, Hello, Thank You, and respectful phrases' },
    { id: 'isl-daily-phrase', label: 'Daily Phrases', icon: '💬', signLanguage: 'ISL', count: (counts['isl-daily-phrase'] || 0) + (counts['common'] || 0), description: 'Everyday conversational queries and answers' },
    { id: 'isl-family', label: 'Family & Relations', icon: '👨‍👩‍👧', signLanguage: 'ISL', count: counts['isl-family'] || 0, description: 'Mother, Father, Friends, and Kinship' },
    { id: 'isl-food', label: 'Food & Dining', icon: '🍛', signLanguage: 'ISL', count: counts['isl-food'] || 0, description: 'Meals, Water, Tea, Dining, and Snacks' },
    { id: 'isl-emotion', label: 'Emotions & Feelings', icon: '❤️', signLanguage: 'ISL', count: counts['isl-emotion'] || 0, description: 'Love, Happiness, Peace, and Feelings' },
    { id: 'isl-health-emergency', label: 'Health & Emergency', icon: '🏥', signLanguage: 'ISL', count: counts['isl-health-emergency'] || 0, description: 'Medical help, Doctor, Hospital, and Emergency' },
    { id: 'isl-time', label: 'Time & Calendar', icon: '⏰', signLanguage: 'ISL', count: counts['isl-time'] || 0, description: 'Days, Today, Tomorrow, Morning, and Time' },
    { id: 'isl-culture-places', label: 'Places & Culture', icon: '🇮🇳', signLanguage: 'ISL', count: counts['isl-culture-places'] || 0, description: 'India, Home, School, Temple, and Places' },
    { id: 'custom', label: 'Custom Trained', icon: '⚡', count: counts['custom'] || 0, description: 'User-trained personalized signs' }
  ];

  return categories.filter(cat => cat.id === 'all' || cat.count > 0);
}

/**
 * Fast Multi-Field Gesture Filtering Engine
 * Executed in sub-millisecond time on client
 */
export function filterGestures(
  gestures: UnifiedGestureItem[],
  filters: GestureSearchFilters,
  bookmarkedIds: Set<string> = new Set()
): { items: UnifiedGestureItem[]; executionTimeMs: number } {
  const startTime = performance.now();

  const queryClean = filters.query.trim().toLowerCase();
  const queryWords = queryClean.split(/\s+/).filter(Boolean);

  let filtered = gestures.filter((item) => {
    // 1. Language filter
    if (filters.signLanguage !== 'ALL' && item.signLanguage !== filters.signLanguage) {
      return false;
    }

    // 2. Category filter
    if (filters.selectedCategories.length > 0 && !filters.selectedCategories.includes('all')) {
      const matchesCat = filters.selectedCategories.some((cat) => {
        if (cat === 'bookmarked') return bookmarkedIds.has(item.id);
        if (cat === 'isl-greeting' && item.category === 'greeting') return true;
        if (cat === 'isl-daily-phrase' && item.category === 'common') return true;
        return item.category === cat;
      });
      if (!matchesCat) return false;
    }

    // 3. Difficulty filter
    if (filters.difficulty !== 'all' && item.difficulty !== filters.difficulty) {
      return false;
    }

    // 4. Handedness filter
    if (filters.handedness === 'one_handed' && item.isTwoHanded) return false;
    if (filters.handedness === 'two_handed' && !item.isTwoHanded) return false;

    // 5. Movement Type filter
    if (filters.movementType !== 'all') {
      const isStatic = item.movementType === 'static' || !item.movementType;
      if (filters.movementType === 'static' && !isStatic) return false;
      if (filters.movementType === 'dynamic' && isStatic) return false;
    }

    // 6. Query Search (Word, Synonyms, Hindi, Description, Steps, Tags)
    if (queryWords.length > 0) {
      const charLower = item.char.toLowerCase();
      const titleLower = item.englishTitle.toLowerCase();
      const hindiLower = (item.hindiChar || '').toLowerCase();
      const descLower = item.description.toLowerCase();
      const meaningLower = (item.meaning || '').toLowerCase();
      const tipLower = (item.visualTip || '').toLowerCase();
      const tagsLower = (item.tags || []).join(' ').toLowerCase();
      const synonymsLower = (item.synonyms || []).join(' ').toLowerCase();
      const roleLower = (item.grammaticalRole || '').toLowerCase();

      const matchesAllWords = queryWords.every((word) => {
        return (
          charLower.includes(word) ||
          titleLower.includes(word) ||
          hindiLower.includes(word) ||
          synonymsLower.includes(word) ||
          descLower.includes(word) ||
          meaningLower.includes(word) ||
          tipLower.includes(word) ||
          tagsLower.includes(word) ||
          roleLower.includes(word)
        );
      });

      if (!matchesAllWords) return false;
    }

    return true;
  });

  // Calculate Relevance score for sorting
  if (queryClean.length > 0 && filters.sortBy === 'relevance') {
    filtered.sort((a, b) => {
      const scoreA = computeRelevanceScore(a, queryClean);
      const scoreB = computeRelevanceScore(b, queryClean);
      return scoreB - scoreA;
    });
  } else {
    // Other Sort Options
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'alphabetical_asc':
          return a.char.localeCompare(b.char);
        case 'alphabetical_desc':
          return b.char.localeCompare(a.char);
        case 'difficulty_asc': {
          const diffWeight = { easy: 1, medium: 2, hard: 3 };
          return (diffWeight[a.difficulty] || 2) - (diffWeight[b.difficulty] || 2);
        }
        case 'difficulty_desc': {
          const diffWeight = { easy: 1, medium: 2, hard: 3 };
          return (diffWeight[b.difficulty] || 2) - (diffWeight[a.difficulty] || 2);
        }
        case 'popular':
        default:
          return (b.synonyms?.length || 0) - (a.synonyms?.length || 0);
      }
    });
  }

  const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
  return { items: filtered, executionTimeMs };
}

// Compute relevance score for search ranking
function computeRelevanceScore(item: UnifiedGestureItem, query: string): number {
  const q = query.toLowerCase();
  const c = item.char.toLowerCase();
  const t = item.englishTitle.toLowerCase();
  const h = (item.hindiChar || '').toLowerCase();

  let score = 0;
  if (c === q) score += 100; // Exact match on sign char/name
  else if (c.startsWith(q)) score += 80;
  else if (c.includes(q)) score += 60;

  if (t === q) score += 90;
  else if (t.startsWith(q)) score += 70;
  else if (t.includes(q)) score += 50;

  if (h === q) score += 85;

  if (item.synonyms && item.synonyms.some(s => s.toLowerCase() === q)) score += 75;
  else if (item.synonyms && item.synonyms.some(s => s.toLowerCase().includes(q))) score += 40;

  if (item.meaning && item.meaning.toLowerCase().includes(q)) score += 30;
  if (item.description.toLowerCase().includes(q)) score += 20;
  if (item.visualTip.toLowerCase().includes(q)) score += 15;

  return score;
}

// Visual Search API Client Caller
export async function searchGestureByImage(
  imageBase64: string,
  signLanguage: 'ALL' | 'ASL' | 'ISL' = 'ALL'
): Promise<ImageSearchResultData> {
  const response = await fetch('/api/search-gesture-by-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, signLanguage })
  });

  if (!response.ok) {
    throw new Error(`Reverse gesture search failed: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.data) {
    return json.data;
  }
  throw new Error(json.error || 'No gesture matches found for this image.');
}
