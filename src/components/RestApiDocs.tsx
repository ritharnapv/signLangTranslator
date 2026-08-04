import React, { useState } from 'react';
import { 
  Code, 
  Play, 
  Copy, 
  Check, 
  Terminal, 
  Layers, 
  User, 
  History, 
  UploadCloud, 
  Sparkles, 
  ExternalLink, 
  Key, 
  ShieldCheck, 
  BookOpen, 
  RefreshCw,
  FileCode,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface RestApiDocsProps {
  currentUserId?: string | null;
}

type EndpointKey = 'translate' | 'user' | 'user_update' | 'history_get' | 'history_post' | 'dataset_upload';
type LanguageSnippet = 'curl' | 'js' | 'python' | 'node';

export default function RestApiDocs({ currentUserId }: RestApiDocsProps) {
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointKey>('translate');
  const [snippetLang, setSnippetLang] = useState<LanguageSnippet>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  
  // Interactive Tester state
  const [apiKeyInput, setApiKeyInput] = useState('demo_api_key_89234');
  const [customUserId, setCustomUserId] = useState(currentUserId || 'usr_demo_102');
  
  // Custom request payload state
  const [requestBodies, setRequestBodies] = useState<Record<EndpointKey, string>>({
    translate: JSON.stringify({
      image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...",
      targetGesture: "A",
      targetLanguage: "English"
    }, null, 2),
    user: '',
    user_update: JSON.stringify({
      userId: currentUserId || "usr_demo_102",
      preferences: {
        language: "English",
        themeMode: "dark",
        autoBackup: true
      },
      displayName: "Alex Rivera (API Developer)"
    }, null, 2),
    history_get: '',
    history_post: JSON.stringify({
      userId: currentUserId || "usr_demo_102",
      phrase: "Hello, nice to meet you!",
      sourceLanguage: "ASL Gestures",
      targetLanguage: "English",
      confidence: 96.8,
      emotion: "happy"
    }, null, 2),
    dataset_upload: JSON.stringify({
      name: "Custom Classroom ASL Signs",
      description: "Landmark arrays recorded during live interactive practice session.",
      samples: [
        {
          label: "A",
          landmarks: Array.from({ length: 21 }, (_, i) => ({
            x: 0.5 + Math.sin(i / 3) * 0.1,
            y: 0.6 - (i / 20) * 0.3,
            z: -0.05 + i * 0.01
          }))
        },
        {
          label: "B",
          landmarks: Array.from({ length: 21 }, (_, i) => ({
            x: 0.45 + Math.cos(i / 4) * 0.12,
            y: 0.55 - (i / 20) * 0.35,
            z: -0.02 + i * 0.008
          }))
        }
      ]
    }, null, 2)
  });

  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);

  const endpointMeta: Record<EndpointKey, {
    method: 'GET' | 'POST' | 'PUT';
    path: string;
    title: string;
    description: string;
    icon: any;
    tag: string;
  }> = {
    translate: {
      method: 'POST',
      path: '/api/v1/translate-gesture',
      title: '1. Translate Gesture',
      description: 'Translates a sign language webcam frame or gesture landmarks into predicted letter/word with confidence, tips, and facial emotion.',
      icon: Zap,
      tag: 'Core Inference'
    },
    user: {
      method: 'GET',
      path: '/api/v1/user/data',
      title: '2. Fetch User Data',
      description: 'Retrieves user account preferences, backup metadata, and device sync state from Firestore database.',
      icon: User,
      tag: 'User Management'
    },
    user_update: {
      method: 'POST',
      path: '/api/v1/user/data',
      title: '2b. Update User Data',
      description: 'Updates account preferences, display name, or theme settings for a specific user ID.',
      icon: User,
      tag: 'User Management'
    },
    history_get: {
      method: 'GET',
      path: '/api/v1/history',
      title: '3. Fetch History Logs',
      description: 'Returns paginated translation history logs and past gesture recognition sessions.',
      icon: History,
      tag: 'History & Logs'
    },
    history_post: {
      method: 'POST',
      path: '/api/v1/history',
      title: '3b. Record History Entry',
      description: 'Appends a new gesture translation log or conversation phrase to user history.',
      icon: History,
      tag: 'History & Logs'
    },
    dataset_upload: {
      method: 'POST',
      path: '/api/v1/datasets/upload',
      title: '4. Upload Custom Dataset',
      description: 'Compiles, calculates categories and statistics, and uploads a new gesture dataset containing landmark arrays.',
      icon: UploadCloud,
      tag: 'Data Pipeline'
    }
  };

  const handleExecuteRequest = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseOutput(null);
    setResponseTime(null);

    const startTime = performance.now();
    const currentMeta = endpointMeta[activeEndpoint];
    const baseUrl = window.location.origin;
    let targetUrl = `${baseUrl}${currentMeta.path}`;

    if (currentMeta.method === 'GET') {
      if (activeEndpoint === 'user') {
        targetUrl += `?userId=${encodeURIComponent(customUserId)}`;
      } else if (activeEndpoint === 'history_get') {
        targetUrl += `?userId=${encodeURIComponent(customUserId)}&limit=10`;
      }
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKeyInput) {
        headers['x-api-key'] = apiKeyInput;
      }

      const fetchOptions: RequestInit = {
        method: currentMeta.method,
        headers: headers
      };

      if (currentMeta.method !== 'GET') {
        fetchOptions.body = requestBodies[activeEndpoint];
      }

      const res = await fetch(targetUrl, fetchOptions);
      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime);

      setResponseStatus(res.status);
      setResponseTime(elapsed);

      const json = await res.json();
      setResponseOutput(JSON.stringify(json, null, 2));

    } catch (err: any) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(500);
      setResponseOutput(JSON.stringify({
        error: "Network / Execution Error",
        message: err.message || "Failed to reach server endpoint."
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const generateCodeSnippet = (): string => {
    const meta = endpointMeta[activeEndpoint];
    const origin = window.location.origin;
    let url = `${origin}${meta.path}`;

    if (meta.method === 'GET') {
      if (activeEndpoint === 'user') url += `?userId=${customUserId}`;
      if (activeEndpoint === 'history_get') url += `?userId=${customUserId}&limit=10`;
    }

    const bodyStr = meta.method !== 'GET' ? requestBodies[activeEndpoint] : '';

    if (snippetLang === 'curl') {
      let cmd = `curl -X ${meta.method} "${url}" \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: ${apiKeyInput}"`;
      if (bodyStr) {
        cmd += ` \\\n  -d '${bodyStr.replace(/'/g, "'\\''")}'`;
      }
      return cmd;
    }

    if (snippetLang === 'js') {
      if (meta.method === 'GET') {
        return `// JavaScript (fetch)
const response = await fetch('${url}', {
  headers: {
    'x-api-key': '${apiKeyInput}'
  }
});
const data = await response.json();
console.log(data);`;
      } else {
        return `// JavaScript (fetch)
const response = await fetch('${url}', {
  method: '${meta.method}',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKeyInput}'
  },
  body: JSON.stringify(${bodyStr})
});
const data = await response.json();
console.log(data);`;
      }
    }

    if (snippetLang === 'python') {
      if (meta.method === 'GET') {
        return `# Python (requests)
import requests

headers = {'x-api-key': '${apiKeyInput}'}
response = requests.get('${url}', headers=headers)
data = response.json()
print(data)`;
      } else {
        return `# Python (requests)
import requests

headers = {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKeyInput}'
}
payload = ${bodyStr}

response = requests.post('${url}', headers=headers, json=payload)
data = response.json()
print(data)`;
      }
    }

    if (snippetLang === 'node') {
      return `// Node.js (axios)
const axios = require('axios');

async function callSignSenseApi() {
  try {
    const res = await axios({
      method: '${meta.method.toLowerCase()}',
      url: '${url}',
      headers: {
        'x-api-key': '${apiKeyInput}'
      }${bodyStr ? `,\n      data: ${bodyStr}` : ''}
    });
    console.log(res.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
  }
}

callSignSenseApi();`;
    }

    return '';
  };

  const copyToClipboard = (text: string, type: 'snippet' | 'response') => {
    navigator.clipboard.writeText(text);
    if (type === 'snippet') {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const currentMeta = endpointMeta[activeEndpoint];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 text-[#2d2d28] dark:text-[#f0f0f2]">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl relative overflow-hidden border border-emerald-700/50">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Terminal className="w-64 h-64 text-emerald-300" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl backdrop-blur-md">
                <Code className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                  External REST API Center
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-mono font-bold">
                    v1.0 Production
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-emerald-200/80">
                  Full programmatic integration for external applications, mobile apps, and machine learning pipelines.
                </p>
              </div>
            </div>

            <a
              href="/api/v1/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>OpenAPI Spec (JSON)</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
            </a>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-emerald-300/80 font-medium block">Translate Gesture</span>
              <span className="font-bold text-white font-mono">POST /api/v1/translate-gesture</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-emerald-300/80 font-medium block">User Data</span>
              <span className="font-bold text-white font-mono">GET /api/v1/user/data</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-emerald-300/80 font-medium block">History Logs</span>
              <span className="font-bold text-white font-mono">GET/POST /api/v1/history</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-emerald-300/80 font-medium block">Dataset Upload</span>
              <span className="font-bold text-white font-mono">POST /api/v1/datasets/upload</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Endpoint Selection */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#18181b] border border-[#e0e4db] dark:border-[#27272a] shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#5c6d5c] dark:text-[#a1a1aa] uppercase tracking-wider flex items-center justify-between">
              <span>API Endpoints</span>
              <span className="text-[10px] font-mono bg-[#f0f2ee] dark:bg-[#27272a] px-2 py-0.5 rounded-md text-[#7c8d7c] dark:text-[#a1a1aa]">
                6 Available
              </span>
            </h3>

            <div className="space-y-1.5">
              {(Object.keys(endpointMeta) as EndpointKey[]).map((key) => {
                const item = endpointMeta[key];
                const IconComponent = item.icon;
                const isSelected = activeEndpoint === key;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveEndpoint(key);
                      setResponseStatus(null);
                      setResponseOutput(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all border flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-900 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
                        : 'bg-[#fcfdfa] dark:bg-[#202023] border-[#e8ece3] dark:border-[#2e2e33] hover:bg-[#f2f5ef] dark:hover:bg-[#28282d] text-[#3a443a] dark:text-[#d4d4d8]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      item.method === 'GET' 
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' 
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          item.method === 'GET' ? 'bg-blue-500 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {item.method}
                        </span>
                        <span className="text-xs font-bold truncate">{item.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#7c8d7c] dark:text-[#a1a1aa] truncate block mt-0.5">
                        {item.path}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Authentication & Security Credentials box */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#18181b] border border-[#e0e4db] dark:border-[#27272a] shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5c6d5c] dark:text-[#a1a1aa] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Authentication Credentials</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-[#7c8d7c] dark:text-[#a1a1aa]">
                  API Key Header (`x-api-key`)
                </label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#f0f2ee] dark:bg-[#27272a] border border-[#e0e4db] dark:border-[#3f3f46] font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Enter API Key"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-[#7c8d7c] dark:text-[#a1a1aa]">
                  Simulated User ID (`userId`)
                </label>
                <input
                  type="text"
                  value={customUserId}
                  onChange={(e) => setCustomUserId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#f0f2ee] dark:bg-[#27272a] border border-[#e0e4db] dark:border-[#3f3f46] font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Target UID"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Requests also accept standard Firebase Authentication ID tokens in the <code className="font-mono bg-amber-500/20 px-1 rounded">Authorization: Bearer &lt;idToken&gt;</code> header.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area: Interactive Sandbox & Code Generator */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Endpoint Info Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-[#e0e4db] dark:border-[#27272a] shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f2ee] dark:border-[#27272a] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    currentMeta.method === 'GET' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {currentMeta.method}
                  </span>
                  <span className="font-mono text-sm font-black text-[#2d2d28] dark:text-white">
                    {currentMeta.path}
                  </span>
                </div>
                <h3 className="text-base font-bold">{currentMeta.title}</h3>
                <p className="text-xs text-[#7c8d7c] dark:text-[#a1a1aa]">
                  {currentMeta.description}
                </p>
              </div>

              <button
                onClick={handleExecuteRequest}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Request...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Test Endpoint</span>
                  </>
                )}
              </button>
            </div>

            {/* Request Body Editor (If POST/PUT) */}
            {currentMeta.method !== 'GET' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#5c6d5c] dark:text-[#a1a1aa] flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Request Payload (JSON)</span>
                  </label>
                  <span className="text-[10px] text-[#7c8d7c] dark:text-[#a1a1aa] font-mono">
                    application/json
                  </span>
                </div>

                <textarea
                  value={requestBodies[activeEndpoint]}
                  onChange={(e) => setRequestBodies({
                    ...requestBodies,
                    [activeEndpoint]: e.target.value
                  })}
                  rows={7}
                  className="w-full p-3 rounded-xl bg-[#1e1e24] text-emerald-300 font-mono text-xs border border-[#2d2d38] focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y leading-relaxed"
                  spellCheck={false}
                />
              </div>
            )}

            {/* Live Test Response Display */}
            {(responseStatus !== null || loading) && (
              <div className="space-y-2 pt-2 border-t border-[#f0f2ee] dark:border-[#27272a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span>Server Execution Output</span>
                    {responseStatus && (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        responseStatus >= 200 && responseStatus < 300 
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}>
                        HTTP {responseStatus}
                      </span>
                    )}
                    {responseTime && (
                      <span className="text-[11px] text-[#7c8d7c] dark:text-[#a1a1aa] font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-500" />
                        {responseTime} ms
                      </span>
                    )}
                  </div>

                  {responseOutput && (
                    <button
                      onClick={() => copyToClipboard(responseOutput, 'response')}
                      className="text-[11px] text-[#7c8d7c] dark:text-[#a1a1aa] hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedResponse ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="p-6 rounded-xl bg-[#1e1e24] border border-[#2d2d38] flex items-center justify-center gap-3 text-emerald-400 font-mono text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Sending REST request to {currentMeta.path}...</span>
                  </div>
                ) : (
                  <pre className="p-4 rounded-xl bg-[#18181c] text-emerald-300 font-mono text-xs overflow-x-auto border border-[#2b2b32] max-h-80 leading-relaxed">
                    <code>{responseOutput}</code>
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Code Snippets Generator Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-[#e0e4db] dark:border-[#27272a] shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f2ee] dark:border-[#27272a] pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5c6d5c] dark:text-[#a1a1aa] flex items-center gap-1.5">
                <Code className="w-4 h-4 text-emerald-500" />
                <span>Code Integration Snippets</span>
              </h4>

              {/* Language Selector Pills */}
              <div className="flex items-center gap-1 bg-[#f0f2ee] dark:bg-[#27272a] p-1 rounded-xl">
                {(['curl', 'js', 'python', 'node'] as LanguageSnippet[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSnippetLang(lang)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                      snippetLang === lang
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-[#7c8d7c] dark:text-[#a1a1aa] hover:text-[#2d2d28] dark:hover:text-white'
                    }`}
                  >
                    {lang === 'js' ? 'JS (fetch)' : lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-[#1e1e24] text-sky-300 font-mono text-xs overflow-x-auto border border-[#2d2d38] leading-relaxed">
                <code>{generateCodeSnippet()}</code>
              </pre>

              <button
                onClick={() => copyToClipboard(generateCodeSnippet(), 'snippet')}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all border border-white/10 cursor-pointer"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
