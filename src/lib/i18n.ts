export type UILanguage = 'en' | 'hi' | 'kn' | 'ml' | 'ta';

export interface LanguageInfo {
  code: UILanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const fontMap: Record<UILanguage, string> = {
  en: 'font-sans',
  hi: 'font-sans',
  kn: 'font-sans',
  ml: 'font-sans',
  ta: 'font-sans'
};

export const SUPPORTED_UI_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🌐' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
];

export interface TranslationDictionary {
  appTitle: string;
  tagline: string;
  liveTranslator: string;
  interactiveLearning: string;
  aslDictionary: string;
  roadmap: string;
  gestureCollector: string;
  datasetsHub: string;
  datasetLabeler: string;
  gestureReplay: string;
  modelCorrections: string;
  gestureTrainer: string;
  analytics: string;
  continuousConversation: string;
  offlineMode: string;
  profile: string;
  admin: string;
  startCamera: string;
  stopCamera: string;
  clearText: string;
  copyText: string;
  readAloud: string;
  markWrong: string;
  settings: string;
  uiLanguage: string;
  targetLanguage: string;
  autoDetect: string;
  confidence: string;
  recognized: string;
  history: string;
  shortcuts: string;
  online: string;
  offline: string;
  smoothedGesture: string;
  realTimeFeed: string;
  formedSentence: string;
  spokenOutput: string;
  fps: string;
  latency: string;
  theme: string;
  colorScheme: string;
  switchLanguage: string;
  ready: string;
  cameraActive: string;
  cameraInactive: string;
  feedbackSubmitted: string;
  accuracy: string;
  quickActions: string;
  keyboardShortcuts: string;
  close: string;
  developerMode: string;
  activeModel: string;
  customNeuralNet: string;
}

export const TRANSLATIONS: Record<UILanguage, TranslationDictionary> = {
  en: {
    appTitle: 'Sign AI Pro',
    tagline: 'Real-time ASL Sign Language Translation & AI Workspace',
    liveTranslator: 'Live Translator',
    interactiveLearning: 'Interactive Learning',
    aslDictionary: 'ASL Dictionary',
    roadmap: 'Learning Roadmap',
    gestureCollector: 'Data Collector',
    datasetsHub: 'Datasets Hub',
    datasetLabeler: 'Dataset Labeler',
    gestureReplay: 'Gesture Replay',
    modelCorrections: 'Model Corrections',
    gestureTrainer: 'AI Trainer',
    analytics: 'Analytics Dashboard',
    continuousConversation: 'Continuous Conversation',
    offlineMode: 'Offline & Sync',
    profile: 'User Profile',
    admin: 'Admin Panel',
    startCamera: 'Start Camera',
    stopCamera: 'Stop Camera',
    clearText: 'Clear Text',
    copyText: 'Copy Text',
    readAloud: 'Read Aloud',
    markWrong: 'Mark Wrong',
    settings: 'Settings',
    uiLanguage: 'UI Language',
    targetLanguage: 'Translation Target',
    autoDetect: 'Auto Language Detection',
    confidence: 'Confidence',
    recognized: 'Recognized Gesture',
    history: 'Translation History',
    shortcuts: 'Keyboard Shortcuts',
    online: 'Online',
    offline: 'Offline',
    smoothedGesture: 'Smoothed Gesture',
    realTimeFeed: 'Real-time Camera Feed',
    formedSentence: 'Formed Sentence Output',
    spokenOutput: 'Spoken Audio',
    fps: 'FPS',
    latency: 'Latency',
    theme: 'Theme Settings',
    colorScheme: 'Color Scheme',
    switchLanguage: 'Switch Interface Language',
    ready: 'Ready',
    cameraActive: 'Camera Active & Detecting',
    cameraInactive: 'Camera Powered Off',
    feedbackSubmitted: 'Correction Submitted!',
    accuracy: 'Accuracy',
    quickActions: 'Quick Actions',
    keyboardShortcuts: 'Shortcuts',
    close: 'Close',
    developerMode: 'Dev Mode',
    activeModel: 'Active AI Model',
    customNeuralNet: 'Custom Neural Net'
  },
  hi: {
    appTitle: 'साइन एआई प्रो',
    tagline: 'रियल-टाइम एएसएल सांकेतिक भाषा अनुवाद और एआई कार्यक्षेत्र',
    liveTranslator: 'लाइव अनुवादक',
    interactiveLearning: 'इंटरएक्टिव लर्निंग',
    aslDictionary: 'एएसएल शब्दकोश',
    roadmap: 'लर्निंग रोडमैप',
    gestureCollector: 'डेटा संग्राहक',
    datasetsHub: 'डेटासेट हब',
    datasetLabeler: 'डेटासेट लेबलर',
    gestureReplay: 'जेस्चर रीप्ले',
    modelCorrections: 'मॉडल सुधार',
    gestureTrainer: 'एआई ट्रेनर',
    analytics: 'विश्लेषण डैशबोर्ड',
    continuousConversation: 'सतत बातचीत',
    offlineMode: 'ऑफ़लाइन और सिंक',
    profile: 'उपयोगकर्ता प्रोफ़ाइल',
    admin: 'एडमिन पैनल',
    startCamera: 'कैमरा चालू करें',
    stopCamera: 'कैमरा बंद करें',
    clearText: 'टेक्स्ट साफ़ करें',
    copyText: 'कॉपी करें',
    readAloud: 'जोर से पढ़ें',
    markWrong: 'गलत चिह्नित करें',
    settings: 'सेटिंग्स',
    uiLanguage: 'यूआई भाषा',
    targetLanguage: 'अनुवाद लक्ष्य',
    autoDetect: 'ऑटो भाषा पहचान',
    confidence: 'विश्वास दर',
    recognized: 'पहचाना गया इशारा',
    history: 'अनुवाद इतिहास',
    shortcuts: 'कीबोर्ड शॉर्टकट',
    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन',
    smoothedGesture: 'स्मूथ किया गया इशारा',
    realTimeFeed: 'रियल-टाइम कैमरा फ़ीड',
    formedSentence: 'गठित वाक्य आउटपुट',
    spokenOutput: 'वॉयस आउटपुट',
    fps: 'एफपीएस',
    latency: 'लेटेंसी',
    theme: 'थीम सेटिंग्स',
    colorScheme: 'रंग योजना',
    switchLanguage: 'इंटरफ़ेस भाषा बदलें',
    ready: 'तैयार',
    cameraActive: 'कैमरा सक्रिय और पहचान जारी',
    cameraInactive: 'कैमरा बंद है',
    feedbackSubmitted: 'सुधार सफलतापूर्वक भेजा गया!',
    accuracy: 'सटीकता',
    quickActions: 'त्वरित कार्रवाई',
    keyboardShortcuts: 'शॉर्टकट',
    close: 'बंद करें',
    developerMode: 'डेवलपर मोड',
    activeModel: 'सक्रिय एआई मॉडल',
    customNeuralNet: 'कस्टम न्यूरल नेटवर्क'
  },
  kn: {
    appTitle: 'ಸೈನ್ ಎಐ ಪ್ರೊ',
    tagline: 'ನೈಜ-ಸಮಯದ ಎಎಸ್‌ಎಲ್ ಚಿಹ್ನೆ ಭಾಷೆ ಅನುವಾದ ಮತ್ತು ಎಐ ಕಾರ್ಯಕ್ಷೇತ್ರ',
    liveTranslator: 'ಲೈವ್ ಅನುವಾದಕ',
    interactiveLearning: 'ಇಂಟರ್ಯಾಕ್ಟಿವ್ ಕಲಿಕೆ',
    aslDictionary: 'ಎಎಸ್‌ಎಲ್ ನಿಘಂಟು',
    roadmap: 'ಕಲಿಕೆಯ ಮಾರ್ಗಸೂಚಿ',
    gestureCollector: 'ಡೇಟಾ ಸಂಗ್ರಾಹಕ',
    datasetsHub: 'ಡೇಟಾಸೆಟ್ ಹಬ್',
    datasetLabeler: 'ಡೇಟಾಸೆಟ್ ಲೇಬಲರ್',
    gestureReplay: 'ಸಂಜ್ಞೆ ಮರುಪ್ಲೇ',
    modelCorrections: 'ಮಾದರಿ ತಿದ್ದುಪಡಿ',
    gestureTrainer: 'ಎಐ ತರಬೇತುದಾರ',
    analytics: 'ವಿಶ್ಲೇಷಣೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    continuousConversation: 'ನಿರಂತರ ಸಂಭಾಷಣೆ',
    offlineMode: 'ಆಫ್‌ಲೈನ್ ಮತ್ತು ಸಿಂಕ್',
    profile: 'ಬಳಕೆದಾರರ ಪ್ರೊಫೈಲ್',
    admin: 'ಅಡ್ಮಿನ್ ಪ್ಯಾನಲ್',
    startCamera: 'ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ',
    stopCamera: 'ಕ್ಯಾಮೆರಾ ನಿಲ್ಲಿಸಿ',
    clearText: 'ಪಠ್ಯ ಅಳಿಸಿ',
    copyText: 'ಪಠ್ಯ ನಕಲಿಸಿ',
    readAloud: 'ಗಟ್ಟಿಯಾಗಿ ಓದಿ',
    markWrong: 'ತಪ್ಪು ಎಂದು ಗುರುತಿಸಿ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    uiLanguage: 'ಯುಐ ಭಾಷೆ',
    targetLanguage: 'ಅನುವಾದ ಗುರಿ',
    autoDetect: 'ಸ್ವಯಂ ಭಾಷೆ ಪತ್ತೆ',
    confidence: 'ಆತ್ಮವಿಶ್ವಾಸ',
    recognized: 'ಗುರುತಿಸಲಾದ ಸಂಜ್ಞೆ',
    history: 'ಅನುವಾದ ಇತಿಹಾಸ',
    shortcuts: 'ಕೀಬೋರ್ಡ್ ಶಾರ್ಟ್‌ಕಟ್‌ಗಳು',
    online: 'ಆನ್‌ಲೈನ್',
    offline: 'ಆಫ್‌ಲೈನ್',
    smoothedGesture: 'ಸಂಸ್ಕರಿಸಿದ ಸಂಜ್ಞೆ',
    realTimeFeed: 'ನೈಜ-ಸಮಯದ ಕ್ಯಾಮೆರಾ ಫೀಡ್',
    formedSentence: 'ರಚಿಸಲಾದ ವಾಕ್ಯ',
    spokenOutput: 'ಧ್ವನಿ ಔಟ್‌ಪುಟ್',
    fps: 'ಎಫ್‌ಪಿಎಸ್',
    latency: 'ವಿಳಂಬ',
    theme: 'ಥೀಮ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    colorScheme: 'ಬಣ್ಣದ ಯೋಜನೆ',
    switchLanguage: 'ಇಂಟರ್ಫೇಸ್ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ',
    ready: 'ಸಿದ್ಧವಾಗಿದೆ',
    cameraActive: 'ಕ್ಯಾಮೆರಾ ಸಕ್ರಿಯವಾಗಿದೆ',
    cameraInactive: 'ಕ್ಯಾಮೆರಾ ಆಫ್ ಆಗಿದೆ',
    feedbackSubmitted: 'ತಿದ್ದುಪಡಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!',
    accuracy: 'ನಿಖರತೆ',
    quickActions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',
    keyboardShortcuts: 'ಶಾರ್ಟ್‌ಕಟ್‌ಗಳು',
    close: 'ಮುಚ್ಚಿ',
    developerMode: 'ಡೆವಲಪರ್ ಮೋಡ್',
    activeModel: 'ಸಕ್ರಿಯ ಎಐ ಮಾದರಿ',
    customNeuralNet: 'ಕಸ್ಟಮ್ ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್'
  },
  ml: {
    appTitle: 'സൈൻ എഐ പ്രോ',
    tagline: 'തത്സമയ എഎസ്എൽ ആംഗ്യഭാഷാ പരിഭാഷയും എഐ വർക്ക്സ്പേസും',
    liveTranslator: 'ലൈവ് പരിഭാഷകൻ',
    interactiveLearning: 'ഇന്ററാക്ടീവ് പഠനം',
    aslDictionary: 'എഎസ്എൽ നിഘണ്ടു',
    roadmap: 'പഠന റോഡ്മാപ്പ്',
    gestureCollector: 'ഡാറ്റ ശേഖരണം',
    datasetsHub: 'ഡാറ്റാസെറ്റ് കേന്ദ്രം',
    datasetLabeler: 'ഡാറ്റാസെറ്റ് ലേബലർ',
    gestureReplay: 'ജെസ്റ്റർ റീപ്ലേ',
    modelCorrections: 'മോഡൽ തിരുത്തലുകൾ',
    gestureTrainer: 'എഐ ട്രെയിനർ',
    analytics: 'വിശകലന ഡാഷ്‌ബോർഡ്',
    continuousConversation: 'തുടർച്ചയായ സംഭാഷണം',
    offlineMode: 'ഓഫ്‌ലൈനും സിങ്കും',
    profile: 'പ്രൊഫൈൽ',
    admin: 'അഡ്മിൻ പാനൽ',
    startCamera: 'ക്യാമറ ആരംഭിക്കുക',
    stopCamera: 'ക്യാമറ നിർത്തുക',
    clearText: 'ടെക്സ്റ്റ് മായ്ക്കുക',
    copyText: 'പകർപ്പ് എടുക്കുക',
    readAloud: 'ഉച്ചത്തിൽ വായിക്കുക',
    markWrong: 'തെറ്റായി അടയാളപ്പെടുത്തുക',
    settings: 'സജ്ജീകരണങ്ങൾ',
    uiLanguage: 'UI ഭാഷ',
    targetLanguage: 'പരിഭാഷ ലക്ഷ്യം',
    autoDetect: 'ഓട്ടോ ഡിറ്റക്റ്റ്',
    confidence: 'വിശ്വാസ്യത',
    recognized: 'തിരിച്ചറിഞ്ഞ ആംഗ്യം',
    history: 'പരിഭാഷ ചരിത്രം',
    shortcuts: 'കുറുക്കുവഴികൾ',
    online: 'ഓൺലൈൻ',
    offline: 'ഓഫ്‌ലൈൻ',
    smoothedGesture: 'സൂക്ഷ്മ ആംഗ്യം',
    realTimeFeed: 'തത്സമയ ക്യാമറ ഫീഡ്',
    formedSentence: 'രൂപീകരിച്ച വാചകം',
    spokenOutput: 'ശബ്ദ ഔട്ട്പുട്ട്',
    fps: 'എഫ്‌പിഎസ്',
    latency: 'ലേറ്റൻസി',
    theme: 'തീം സജ്ജീകരണങ്ങൾ',
    colorScheme: 'വർണ്ണ പദ്ധതി',
    switchLanguage: 'ഇന്റർഫേസ് ഭാഷ മാറ്റുക',
    ready: 'സജ്ജമാണ്',
    cameraActive: 'ക്യാമറ സജീവമാണ്',
    cameraInactive: 'ക്യാമറ ഓഫാണ്',
    feedbackSubmitted: 'തിരുത്തൽ സമർപ്പിച്ചു!',
    accuracy: 'കൃത്യത',
    quickActions: 'പെട്ടെന്നുള്ള പ്രവർത്തനങ്ങൾ',
    keyboardShortcuts: 'കുറുക്കുവഴികൾ',
    close: 'അടയ്ക്കുക',
    developerMode: 'ഡെവലപ്പർ മോഡ്',
    activeModel: 'സജീവ എഐ മോഡൽ',
    customNeuralNet: 'കസ്റ്റം ന്യൂറൽ നെറ്റ്'
  },
  ta: {
    appTitle: 'சைன் AI புரோ',
    tagline: 'நேரலை ASL சைகை மொழிபெயர்ப்பு மற்றும் AI பணிப்பகுதி',
    liveTranslator: 'நேரலை மொழிபெயர்ப்பாளர்',
    interactiveLearning: 'ஊடாடும் கற்றல்',
    aslDictionary: 'ASL அகராதி',
    roadmap: 'கற்றல் பாதை',
    gestureCollector: 'தரவு சேகரிப்பான்',
    datasetsHub: 'தரவுத்தொகுப்பு மையம்',
    datasetLabeler: 'தரவுத்தொகுப்பு லேபிளர்',
    gestureReplay: 'சைகை மறுஇயக்கம்',
    modelCorrections: 'மாதிரி திருத்தங்கள்',
    gestureTrainer: 'AI பயிற்சியாளர்',
    analytics: 'பகுப்பாய்வு குழு',
    continuousConversation: 'தொடர்ச்சியான உரையாடல்',
    offlineMode: 'ஆஃப்லைன் மற்றும் ஒத்திசைவு',
    profile: 'பயனர் சுயவிவரம்',
    admin: 'நிர்வாகக் குழு',
    startCamera: 'கேமராவைத் தொடங்கு',
    stopCamera: 'கேமராவை நிறுத்து',
    clearText: 'உரையை அழி',
    copyText: 'உரையை நகலெடு',
    readAloud: 'சத்தமாகப் படி',
    markWrong: 'தவறு என குறி',
    settings: 'அமைப்புகள்',
    uiLanguage: 'UI மொழி',
    targetLanguage: 'மொழிபெயர்ப்பு இலக்கு',
    autoDetect: 'தானியங்கி மொழி கண்டறிதல்',
    confidence: 'நம்பிக்கை',
    recognized: 'கண்டறியப்பட்ட சைகை',
    history: 'மொழிபெயர்ப்பு வரலாறு',
    shortcuts: 'விசைப்பலகை குறுக்குவழிகள்',
    online: 'ஆன்லைன்',
    offline: 'ஆஃப்லைன்',
    smoothedGesture: 'சீரமைக்கப்பட்ட சைகை',
    realTimeFeed: 'நேரலை கேமரா ஓடை',
    formedSentence: 'உருவாக்கப்பட்ட வாக்கியம்',
    spokenOutput: 'குரல் வெளியீடு',
    fps: 'FPS',
    latency: 'தாமதம்',
    theme: 'கருப்பொருள் அமைப்புகள்',
    colorScheme: 'வண்ணத் திட்டம்',
    switchLanguage: 'இடைமுக மொழியை மாற்றுக',
    ready: 'தயார்',
    cameraActive: 'கேமரா செயல்படுகிறது',
    cameraInactive: 'கேமரா அணைக்கப்பட்டது',
    feedbackSubmitted: 'திருத்தம் சமர்ப்பிக்கப்பட்டது!',
    accuracy: 'துல்லியம்',
    quickActions: 'விரைவான நடவடிக்கைகள்',
    keyboardShortcuts: 'குறுக்குவழிகள்',
    close: 'மூடு',
    developerMode: 'தேவல்பர் பயன்முறை',
    activeModel: 'செயலில் உள்ள AI மாதிரி',
    customNeuralNet: 'தனிப்பயன் நியூரல் நெட்'
  }
};

export const getTranslation = (lang: UILanguage, key: keyof TranslationDictionary): string => {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  return dict[key] || TRANSLATIONS['en'][key] || String(key);
};
