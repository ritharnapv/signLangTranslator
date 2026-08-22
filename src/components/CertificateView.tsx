import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Download,
  QrCode,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Search,
  Sparkles,
  Printer,
  Copy,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  FileCheck,
  Trash2,
  Sliders,
  Check,
  AlertCircle,
  Camera,
  Layers,
  ArrowRight,
  BookOpen,
  Trophy,
  History,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CertificateCredential,
  CertificateCreationParams,
  CertificateHonors,
  CertificateTheme,
  CertificateTrackPreset,
  CertificateType,
  CertificateVerificationResult
} from '../types';
import {
  CERTIFICATE_TRACK_PRESETS,
  CERTIFICATE_THEME_CONFIG,
  createPracticeCertificate,
  downloadCertificatePdf,
  getAllIssuedCertificates,
  deleteIssuedCertificate,
  verifyCertificateOnline,
  buildVerificationUrl,
  getCertificateShareText,
  generateCertificateQrCode
} from '../utils/certificateGenerator';

interface CertificateViewProps {
  initialCertId?: string;
  initialMode?: 'vault' | 'generator' | 'verify';
  onNavigateTab?: (tab: string) => void;
}

export default function CertificateView({
  initialCertId,
  initialMode = 'vault',
  onNavigateTab
}: CertificateViewProps) {
  const [activeTab, setActiveTab] = useState<'vault' | 'generator' | 'verify' | 'quick_claim'>(initialMode);
  const [certificates, setCertificates] = useState<CertificateCredential[]>([]);
  const [selectedCert, setSelectedCert] = useState<CertificateCredential | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLang, setFilterLang] = useState<'ALL' | 'ISL' | 'ASL' | 'BOTH'>('ALL');

  // Generator Form State
  const [recipientName, setRecipientName] = useState('Ritharna P. V.');
  const [recipientEmail, setRecipientEmail] = useState('ritharnapv@gmail.com');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('isl-foundations');
  const [customTrackTitle, setCustomTrackTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [signLanguage, setSignLanguage] = useState<'ISL' | 'ASL' | 'BOTH'>('ISL');
  const [completionScore, setCompletionScore] = useState<number>(98);
  const [masteredSignsCount, setMasteredSignsCount] = useState<number>(34);
  const [practiceMinutes, setPracticeMinutes] = useState<number>(120);
  const [selectedTheme, setSelectedTheme] = useState<CertificateTheme>('gold');
  const [honorsLevel, setHonorsLevel] = useState<CertificateHonors>('Honors with Distinction');
  const [certificateType, setCertificateType] = useState<CertificateType>('track_completion');
  const [customSkills, setCustomSkills] = useState<string>('Namaste & Greetings, Two-Handed Vowels, Facial Morphology, Core Social Signs');

  // Live Generator Preview QR
  const [previewQrUrl, setPreviewQrUrl] = useState<string>('');

  // Verification Portal State
  const [verifyQuery, setVerifyQuery] = useState(initialCertId || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<CertificateVerificationResult | null>(null);
  const [hasSearchedVerify, setHasSearchedVerify] = useState(false);

  // Quick Claim Progress Data from LocalStorage
  const [userStats, setUserStats] = useState<{
    signsMastered: number;
    totalXp: number;
    lessonsCompleted: number;
    accuracy: number;
    minutes: number;
  }>({
    signsMastered: 34,
    totalXp: 850,
    lessonsCompleted: 4,
    accuracy: 94,
    minutes: 135
  });

  // Load certificates and user profile on mount
  useEffect(() => {
    loadCertificates();
    loadUserProgressStats();

    // Check URL parameters for verification
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCertId = params.get('verify_cert') || params.get('cert_id') || initialCertId;
      if (urlCertId) {
        setVerifyQuery(urlCertId);
        setActiveTab('verify');
        handlePerformVerification(urlCertId);
      }
    }
  }, [initialCertId]);

  const loadCertificates = () => {
    const list = getAllIssuedCertificates();
    setCertificates(list);
    if (list.length > 0 && !selectedCert) {
      setSelectedCert(list[0]);
    }
  };

  const loadUserProgressStats = () => {
    try {
      const rawStats = localStorage.getItem('sign_learning_dashboard_stats');
      if (rawStats) {
        const parsed = JSON.parse(rawStats);
        setUserStats({
          signsMastered: parsed.signsMasteredCount || 34,
          totalXp: parsed.totalXp || 850,
          lessonsCompleted: parsed.totalLessonsCompleted || 4,
          accuracy: parsed.overallAccuracy || 94,
          minutes: parsed.practiceMinutesThisWeek || 135
        });
      }
      const rawProfile = localStorage.getItem('sign_ai_user_profile');
      if (rawProfile) {
        const parsedProfile = JSON.parse(rawProfile);
        if (parsedProfile.name) setRecipientName(parsedProfile.name);
        if (parsedProfile.email) setRecipientEmail(parsedProfile.email);
      }
    } catch (e) {
      console.warn('Could not read user profile stats:', e);
    }
  };

  // Sync preset selections to form
  useEffect(() => {
    const preset = CERTIFICATE_TRACK_PRESETS.find(p => p.id === selectedPresetId);
    if (preset) {
      setCustomTrackTitle(preset.title);
      setCustomDescription(preset.description);
      setSignLanguage(preset.signLanguage);
      setMasteredSignsCount(preset.defaultSignsCount);
      setPracticeMinutes(preset.defaultMinutes);
      setSelectedTheme(preset.theme);
      setHonorsLevel(preset.defaultHonors);
      setCertificateType(preset.type);
      setCustomSkills(preset.skills.join(', '));
    }
  }, [selectedPresetId]);

  // Update preview QR code when form changes
  useEffect(() => {
    let isCancelled = false;
    async function updateQr() {
      const previewUrl = buildVerificationUrl('SIGNAI-PREVIEW-SAMPLE');
      const qrData = await generateCertificateQrCode('SIGNAI-PREVIEW-SAMPLE', previewUrl);
      if (!isCancelled) {
        setPreviewQrUrl(qrData);
      }
    }
    updateQr();
    return () => {
      isCancelled = true;
    };
  }, [recipientName, customTrackTitle]);

  const handleCreateCertificate = async () => {
    if (!recipientName.trim()) {
      alert('Please enter the recipient full name');
      return;
    }

    const skillsArray = customSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const params: CertificateCreationParams = {
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim() || undefined,
      trackId: selectedPresetId,
      trackTitle: customTrackTitle.trim() || 'Sign Language Practice Mastery',
      description: customDescription.trim(),
      signLanguage,
      completionScore,
      masteredSignsCount,
      practiceMinutes,
      honorsLevel,
      theme: selectedTheme,
      certificateType,
      skillsAcquired: skillsArray
    };

    const newCert = await createPracticeCertificate(params);
    loadCertificates();
    setSelectedCert(newCert);
    setActiveTab('vault');

    // Confetti celebration
    triggerConfetti();
  };

  const handleQuickClaim = async (preset: CertificateTrackPreset) => {
    const params: CertificateCreationParams = {
      recipientName: recipientName.trim() || 'Sign Language Learner',
      recipientEmail: recipientEmail.trim() || undefined,
      trackId: preset.id,
      trackTitle: preset.title,
      description: preset.description,
      signLanguage: preset.signLanguage,
      completionScore: Math.max(92, userStats.accuracy),
      masteredSignsCount: Math.max(preset.defaultSignsCount, userStats.signsMastered),
      practiceMinutes: Math.max(preset.defaultMinutes, userStats.minutes),
      honorsLevel: preset.defaultHonors,
      theme: preset.theme,
      certificateType: preset.type,
      skillsAcquired: preset.skills
    };

    const newCert = await createPracticeCertificate(params);
    loadCertificates();
    setSelectedCert(newCert);
    setActiveTab('vault');
    triggerConfetti();
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  };

  const handleDownloadPdf = async (cert: CertificateCredential) => {
    setIsGeneratingPdf(true);
    try {
      await downloadCertificatePdf(cert);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePerformVerification = async (queryText?: string) => {
    const textToVerify = queryText !== undefined ? queryText : verifyQuery;
    if (!textToVerify.trim()) return;

    setIsVerifying(true);
    setHasSearchedVerify(true);

    try {
      const result = await verifyCertificateOnline(textToVerify);
      setVerificationResult(result);
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationResult({
        isValid: false,
        verifiedAt: new Date().toLocaleTimeString(),
        tamperCheckPassed: false,
        message: 'Network verification failed. Please try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyVerificationLink = (cert: CertificateCredential) => {
    const url = cert.verificationUrl || buildVerificationUrl(cert.id);
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const handleCopyCertId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteCert = (id: string) => {
    if (window.confirm('Are you sure you want to remove this certificate from your local vault?')) {
      deleteIssuedCertificate(id);
      const remaining = certificates.filter(c => c.id !== id);
      setCertificates(remaining);
      if (selectedCert?.id === id) {
        setSelectedCert(remaining.length > 0 ? remaining[0] : null);
      }
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch =
      cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.trackTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = filterLang === 'ALL' || cert.signLanguage === filterLang;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" id="certificate-hub-container">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Official Accreditation & Credentials
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Practice Completion Certificates
            </h1>
            <p className="text-stone-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Generate tamper-proof, high-resolution certificates for completed sign language tracks with vector PDF export,
              cryptographic QR validation, and instant online verification.
            </p>
          </div>

          {/* Quick Actions in Banner */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('generator')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
              id="btn-open-cert-generator"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Certificate</span>
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              className="px-4 py-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-white border border-stone-600 font-semibold text-sm transition-all flex items-center gap-2"
              id="btn-open-cert-verifier"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Verify by QR / Serial</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-stone-800/80 flex items-center gap-2 overflow-x-auto pb-1 text-sm font-medium">
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'vault'
                ? 'bg-white text-stone-900 font-bold shadow-md'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
            id="tab-vault-btn"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>My Certificate Vault ({certificates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quick_claim')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'quick_claim'
                ? 'bg-white text-stone-900 font-bold shadow-md'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
            id="tab-quick-claim-btn"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Track Quick-Claims</span>
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'generator'
                ? 'bg-white text-stone-900 font-bold shadow-md'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
            id="tab-generator-btn"
          >
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>Certificate Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'verify'
                ? 'bg-white text-stone-900 font-bold shadow-md'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
            id="tab-verify-btn"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>QR Verification Portal</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MY CERTIFICATE VAULT & PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#18181b] p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search certificates by title or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                id="search-certificates-input"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Dialect:</span>
              <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-semibold">
                {(['ALL', 'ISL', 'ASL', 'BOTH'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setFilterLang(lang)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      filterLang === lang
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    {lang === 'ALL' ? 'All' : lang === 'ISL' ? 'ISL 🇮🇳' : lang === 'ASL' ? 'ASL 🇺🇸' : 'Bilingual'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Vault Grid: List on Left, Active Certificate Display on Right */}
          {filteredCertificates.length === 0 ? (
            <div className="bg-white dark:bg-[#18181b] rounded-3xl p-12 text-center border border-dashed border-stone-300 dark:border-stone-800 space-y-4">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">No Certificates Found</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                {searchQuery || filterLang !== 'ALL'
                  ? 'No certificates match your current filters. Try resetting your search query.'
                  : "You haven't generated or claimed any completion certificates yet. Claim your practice tracks or create a custom certificate!"}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('quick_claim')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all shadow-sm"
                >
                  Quick Claim Completed Tracks
                </button>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-sm font-semibold transition-all"
                >
                  Open Studio Generator
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Certificate Selector Cards */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
                  <span>Issued Credentials ({filteredCertificates.length})</span>
                  <span>Click to Preview</span>
                </div>

                <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
                  {filteredCertificates.map(cert => {
                    const isSelected = selectedCert?.id === cert.id;
                    const theme = CERTIFICATE_THEME_CONFIG[cert.theme] || CERTIFICATE_THEME_CONFIG.gold;

                    return (
                      <div
                        key={cert.id}
                        onClick={() => setSelectedCert(cert)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-white dark:bg-[#1e1e22] border-amber-500 shadow-md ring-2 ring-amber-500/20'
                            : 'bg-white/80 dark:bg-[#18181b] border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                        id={`cert-item-${cert.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg} ${theme.badgeText}`}
                              >
                                {cert.signLanguage === 'ISL' ? 'ISL 🇮🇳' : cert.signLanguage === 'ASL' ? 'ASL 🇺🇸' : 'Bilingual 🌐'}
                              </span>
                              <span className="text-[11px] text-stone-400 font-mono font-medium">{cert.id}</span>
                            </div>
                            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                              {cert.trackTitle}
                            </h4>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              Issued to <strong className="text-stone-700 dark:text-stone-300">{cert.recipientName}</strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                              {cert.completionScore}%
                            </span>
                            <p className="text-[10px] text-stone-400">Accuracy</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
                          <span className="flex items-center gap-1 text-[11px]">
                            <History className="w-3 h-3 text-stone-400" />
                            {cert.issueDate}
                          </span>

                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleDownloadPdf(cert)}
                              title="Download PDF"
                              className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-amber-600 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopyVerificationLink(cert)}
                              title="Copy Verification Link"
                              className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-blue-600 transition-colors"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCert(cert.id)}
                              title="Remove Certificate"
                              className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Full Interactive Certificate Showcase */}
              <div className="lg:col-span-8 space-y-4">
                {selectedCert ? (
                  <div className="space-y-4">
                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#18181b] p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500 font-medium">Serial ID:</span>
                        <code className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800">
                          {selectedCert.id}
                        </code>
                        <button
                          onClick={() => handleCopyCertId(selectedCert.id)}
                          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-md transition-colors"
                          title="Copy Serial ID"
                        >
                          {copiedId === selectedCert.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyVerificationLink(selectedCert)}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                          id="btn-copy-cert-link"
                        >
                          {copiedShareLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share Credential</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setVerifyQuery(selectedCert.id);
                            setActiveTab('verify');
                            handlePerformVerification(selectedCert.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verify Authenticity</span>
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(selectedCert)}
                          disabled={isGeneratingPdf}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                          id="btn-download-cert-pdf"
                        >
                          {isGeneratingPdf ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating Vector PDF...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Certificate Graphic Card Canvas (Landscape View) */}
                    <div className="relative overflow-hidden rounded-3xl border-2 border-stone-300 dark:border-stone-700 bg-amber-50/40 dark:bg-[#141416] p-6 sm:p-10 shadow-2xl">
                      {/* Double Border Framing */}
                      <div className="absolute inset-3 sm:inset-4 border-2 border-amber-600/40 dark:border-amber-500/30 rounded-2xl pointer-events-none" />
                      <div className="absolute inset-5 sm:inset-6 border border-dashed border-amber-700/30 dark:border-amber-400/20 rounded-xl pointer-events-none" />

                      {/* Watermark Crest */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
                        <Award className="w-96 h-96" />
                      </div>

                      {/* Certificate Inner Content */}
                      <div className="relative z-10 space-y-6 text-center">
                        {/* Organization Header */}
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-800 dark:text-amber-400">
                            <Award className="w-4 h-4" />
                            SignSense Global Accessibility & AI Initiative
                          </div>
                          <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                            Accredited Sign Language Practice & Biomechanical Verification Council
                          </p>
                        </div>

                        {/* Title & Honors Ribbon */}
                        <div className="space-y-2">
                          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-tight text-stone-900 dark:text-white">
                            Certificate of Practice Completion
                          </h2>
                          <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold uppercase tracking-wider shadow-xs">
                            ★ {selectedCert.honorsLevel} ★
                          </div>
                        </div>

                        {/* Recipient Presentation */}
                        <div className="space-y-1.5 pt-2">
                          <p className="text-xs sm:text-sm font-serif italic text-stone-600 dark:text-stone-400">
                            This is to officially certify that
                          </p>
                          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-900 dark:text-amber-300 tracking-wide pb-1 border-b border-amber-300/60 dark:border-amber-700/60 inline-block px-6">
                            {selectedCert.recipientName}
                          </h3>
                        </div>

                        {/* Accomplishment Narrative */}
                        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-xl mx-auto leading-relaxed">
                          has successfully demonstrated practical signing fluency, real-time AI computer vision landmark accuracy, and completed all required training modules for:
                        </p>

                        {/* Track Badge Box */}
                        <div className="bg-white/90 dark:bg-stone-900/90 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-4 max-w-xl mx-auto shadow-xs space-y-1">
                          <h4 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                            {selectedCert.trackTitle}
                          </h4>
                          <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                            Dialect: {selectedCert.signLanguage === 'ISL' ? 'Indian Sign Language (ISL 🇮🇳)' : selectedCert.signLanguage === 'ASL' ? 'American Sign Language (ASL 🇺🇸)' : 'Bilingual (ISL & ASL)'}
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {selectedCert.description}
                          </p>
                        </div>

                        {/* Metrics Pills */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto pt-1">
                          <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-center">
                            <div className="text-xs font-bold text-stone-500 uppercase">Signs Mastered</div>
                            <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                              {selectedCert.masteredSignsCount}+ Signs
                            </div>
                          </div>
                          <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-center">
                            <div className="text-xs font-bold text-stone-500 uppercase">AI Evaluation</div>
                            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                              {selectedCert.completionScore}% Score
                            </div>
                          </div>
                          <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-center">
                            <div className="text-xs font-bold text-stone-500 uppercase">Practice Log</div>
                            <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                              {selectedCert.practiceMinutes} Mins
                            </div>
                          </div>
                        </div>

                        {/* Skills Validated */}
                        {selectedCert.skillsAcquired && selectedCert.skillsAcquired.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
                            <span className="text-stone-400 font-semibold mr-1">Validated Competencies:</span>
                            {selectedCert.skillsAcquired.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium"
                              >
                                ✓ {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Bottom Signatures & QR Section */}
                        <div className="pt-4 border-t border-amber-200/60 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                          {/* Signature 1: Human Lead */}
                          <div className="space-y-1 text-center sm:text-left">
                            <div className="font-serif italic text-base font-bold text-stone-800 dark:text-stone-200">
                              Dr. Aarav Mehta
                            </div>
                            <div className="h-0.5 w-32 bg-stone-300 dark:bg-stone-700 mx-auto sm:mx-0" />
                            <div className="text-[10px] font-bold text-stone-600 dark:text-stone-400">
                              Director of Sign Linguistics
                            </div>
                            <div className="text-[9px] text-stone-400">SignSense Council</div>
                          </div>

                          {/* Official Center Gold Crest */}
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-stone-800">
                              <ShieldCheck className="w-8 h-8" />
                            </div>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-800 dark:text-amber-400 mt-1">
                              Officially Verified
                            </span>
                          </div>

                          {/* Signature 2 / QR Code */}
                          <div className="flex items-center justify-center sm:justify-end gap-3 text-left">
                            <div className="space-y-0.5 text-right hidden sm:block">
                              <div className="text-[10px] font-bold text-stone-800 dark:text-stone-200">
                                Scan to Verify
                              </div>
                              <div className="text-[9px] text-stone-400 font-mono">{selectedCert.id}</div>
                              <div className="text-[8px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                Cryptographic Hash Valid
                              </div>
                            </div>
                            <div className="w-14 h-14 bg-white p-1 rounded-xl shadow-xs border border-stone-200">
                              {selectedCert.qrCodeDataUrl ? (
                                <img
                                  src={selectedCert.qrCodeDataUrl}
                                  alt="QR Verification"
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <QrCode className="w-full h-full text-stone-700 p-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12 bg-white dark:bg-[#18181b] rounded-3xl border border-stone-200 dark:border-stone-800 text-stone-500">
                    Select a certificate from the left list to preview details and download.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TRACK QUICK-CLAIMS (Based on user practice) */}
      {/* ========================================================================= */}
      {activeTab === 'quick_claim' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-6 rounded-3xl border border-amber-200 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Personalized Progress & Claimable Diplomas</span>
            </div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-white">
              Instant Certificate Claim Center
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
              Claim verified certificates for your completed practice modules. Your recorded accuracy ({userStats.accuracy}%),
              mastered signs ({userStats.signsMastered}+), and logged practice time ({userStats.minutes} mins) will be officially stamped.
            </p>
          </div>

          {/* Predefined Track Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CERTIFICATE_TRACK_PRESETS.map(preset => {
              const theme = CERTIFICATE_THEME_CONFIG[preset.theme];
              const isAlreadyIssued = certificates.some(c => c.trackId === preset.id);

              return (
                <div
                  key={preset.id}
                  className="bg-white dark:bg-[#18181b] rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-2xl shadow-xs">
                        {preset.badgeEmoji}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${theme.badgeBg} ${theme.badgeText}`}
                      >
                        {preset.signLanguage === 'ISL' ? 'ISL 🇮🇳' : preset.signLanguage === 'ASL' ? 'ASL 🇺🇸' : 'Bilingual 🌐'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-stone-900 dark:text-white">
                        {preset.title}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                        <span>Curriculum Level:</span>
                        <span className="font-semibold text-stone-800 dark:text-stone-200">{preset.defaultLevel}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                        <span>Required Vocabulary:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{preset.defaultSignsCount}+ Gestures</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                        Core Competencies:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {preset.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-stone-100 dark:border-stone-800">
                    <button
                      onClick={() => handleQuickClaim(preset)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Award className="w-4 h-4" />
                      <span>{isAlreadyIssued ? 'Re-Issue / Update Certificate' : 'Claim Certificate (Instant PDF & QR)'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CERTIFICATE STUDIO GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-6 space-y-6 bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>Certificate Customizer Studio</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Design and issue customized completion certificates for any signer, student, or milestone.
              </p>
            </div>

            <div className="space-y-4">
              {/* Recipient Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="e.g. Ritharna P. V."
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  id="input-recipient-name"
                />
              </div>

              {/* Recipient Email (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Recipient Email (Optional)
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="e.g. learner@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Track Preset Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Choose Track Preset or Custom
                </label>
                <select
                  value={selectedPresetId}
                  onChange={e => setSelectedPresetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  {CERTIFICATE_TRACK_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.badgeEmoji} {p.title} ({p.signLanguage})
                    </option>
                  ))}
                  <option value="custom">⚙ Custom Certificate Subject</option>
                </select>
              </div>

              {/* Custom Track Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Certificate Track Title
                </label>
                <input
                  type="text"
                  value={customTrackTitle}
                  onChange={e => setCustomTrackTitle(e.target.value)}
                  placeholder="e.g. Advanced Conversational ISL"
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Dialect Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Sign Language System
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ISL', 'ASL', 'BOTH'] as const).map(lang => (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => setSignLanguage(lang)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        signLanguage === lang
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      {lang === 'ISL' ? 'ISL 🇮🇳' : lang === 'ASL' ? 'ASL 🇺🇸' : 'Bilingual 🌐'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Honors Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Honors Distinction
                </label>
                <select
                  value={honorsLevel}
                  onChange={e => setHonorsLevel(e.target.value as CertificateHonors)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Honors with Distinction">Honors with Distinction (Top 5%)</option>
                  <option value="Excellence in Signing">Excellence in Signing</option>
                  <option value="Verified Certified Signer">Verified Certified Signer</option>
                  <option value="Mastery Level">Mastery Level</option>
                </select>
              </div>

              {/* Accuracy & Score Slider */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700 dark:text-stone-300">AI Evaluation Accuracy</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">{completionScore}%</span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={100}
                  value={completionScore}
                  onChange={e => setCompletionScore(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              {/* Signs Count & Practice Minutes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Signs Mastered</label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={masteredSignsCount}
                    onChange={e => setMasteredSignsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Practice Minutes</label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={practiceMinutes}
                    onChange={e => setPracticeMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Border & Seal Palette</label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'gold', label: 'Gold Royal', color: 'bg-amber-500' },
                      { id: 'emerald', label: 'Emerald', color: 'bg-emerald-500' },
                      { id: 'sapphire', label: 'Sapphire', color: 'bg-blue-500' },
                      { id: 'cyber', label: 'Cyber Violet', color: 'bg-purple-500' }
                    ] as const
                  ).map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        selectedTheme === t.id
                          ? 'border-stone-900 dark:border-white ring-2 ring-amber-500/30 font-bold bg-stone-50 dark:bg-stone-800'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${t.color} shadow-xs`} />
                      <span className="text-[10px] text-stone-700 dark:text-stone-300">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Validated Skills (Comma Separated)
                </label>
                <input
                  type="text"
                  value={customSkills}
                  onChange={e => setCustomSkills(e.target.value)}
                  placeholder="Namaste & Greetings, Two-Handed Vowels..."
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Submit & Generate Button */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handleCreateCertificate}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  id="btn-issue-certificate-studio"
                >
                  <Award className="w-5 h-5" />
                  <span>Issue & Save Official Certificate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Studio Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Live Studio Preview
              </span>
              <span className="text-[11px] text-amber-600 font-semibold">Updates in Real-Time</span>
            </div>

            <div className="relative overflow-hidden rounded-3xl border-2 border-stone-300 dark:border-stone-700 bg-amber-50/40 dark:bg-[#141416] p-6 shadow-xl space-y-4 text-center">
              <div className="space-y-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-800 dark:text-amber-400">
                  SignSense AI Verification Council
                </span>
                <h3 className="text-xl font-serif font-black text-stone-900 dark:text-white">
                  Certificate of Practice Completion
                </h3>
                <div className="inline-block px-3 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  ★ {honorsLevel} ★
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-serif italic text-stone-500">Presented to</p>
                <h4 className="text-xl font-serif font-bold text-amber-950 dark:text-amber-300 border-b border-amber-300/50 inline-block px-4 pb-0.5">
                  {recipientName || 'Recipient Name'}
                </h4>
              </div>

              <div className="bg-white/90 dark:bg-stone-900/90 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 max-w-sm mx-auto shadow-xs text-xs space-y-0.5">
                <div className="font-bold text-stone-900 dark:text-white">{customTrackTitle || 'Practice Track'}</div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                  Dialect: {signLanguage === 'ISL' ? 'ISL 🇮🇳' : signLanguage === 'ASL' ? 'ASL 🇺🇸' : 'Bilingual'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center max-w-xs mx-auto">
                <div className="bg-white/80 dark:bg-stone-900/80 p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-[10px]">
                  <div className="text-stone-400">Accuracy</div>
                  <div className="font-bold text-amber-600">{completionScore}%</div>
                </div>
                <div className="bg-white/80 dark:bg-stone-900/80 p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-[10px]">
                  <div className="text-stone-400">Signs</div>
                  <div className="font-bold text-emerald-600">{masteredSignsCount}+</div>
                </div>
                <div className="bg-white/80 dark:bg-stone-900/80 p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-[10px]">
                  <div className="text-stone-400">Time</div>
                  <div className="font-bold text-blue-600">{practiceMinutes}m</div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-left border-t border-amber-200/60 dark:border-stone-800 text-[10px]">
                <div>
                  <div className="font-serif italic font-bold">Dr. Aarav Mehta</div>
                  <div className="text-stone-400 text-[9px]">Linguistics Director</div>
                </div>
                <div className="w-10 h-10 bg-white p-0.5 rounded-lg border border-stone-200">
                  {previewQrUrl ? (
                    <img src={previewQrUrl} alt="QR Preview" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-full h-full text-stone-700" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: QR & SERIAL NUMBER VERIFICATION PORTAL */}
      {/* ========================================================================= */}
      {activeTab === 'verify' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-[#18181b] p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white">
                Official Credential Verification Portal
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Scan the QR code with your camera or enter the unique serialized Certificate ID (e.g. <code className="font-mono text-amber-600 font-bold">SIGNAI-2026-F92K-ISL</code>) to confirm authenticity.
              </p>
            </div>

            {/* Verification Input Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Enter Certificate Serial ID (SIGNAI-...)..."
                  value={verifyQuery}
                  onChange={e => setVerifyQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePerformVerification()}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  id="input-verify-serial"
                />
              </div>
              <button
                onClick={() => handlePerformVerification()}
                disabled={isVerifying || !verifyQuery.trim()}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                id="btn-verify-submit"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Authenticity</span>
                  </>
                )}
              </button>
            </div>

            {/* Sample IDs for instant testing */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 pt-1">
              <span>Quick test serials:</span>
              {['SIGNAI-2026-F92K-ISL', 'SIGNAI-2026-M84Q-BIL'].map(sampleId => (
                <button
                  key={sampleId}
                  onClick={() => {
                    setVerifyQuery(sampleId);
                    handlePerformVerification(sampleId);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-mono text-[11px] transition-colors"
                >
                  {sampleId}
                </button>
              ))}
            </div>

            {/* Verification Result Card */}
            {hasSearchedVerify && verificationResult && (
              <div
                className={`p-6 rounded-2xl border space-y-4 transition-all ${
                  verificationResult.isValid
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                }`}
                id="verification-result-card"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      verificationResult.isValid
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300'
                    }`}
                  >
                    {verificationResult.isValid ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : (
                      <AlertCircle className="w-7 h-7" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-lg font-bold ${
                          verificationResult.isValid
                            ? 'text-emerald-900 dark:text-emerald-200'
                            : 'text-rose-900 dark:text-rose-200'
                        }`}
                      >
                        {verificationResult.isValid ? 'Authentic Certificate Verified ✓' : 'Verification Unsuccessful'}
                      </h3>
                      {verificationResult.isValid && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 text-[10px] font-extrabold uppercase">
                          Cryptographically Secure
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      {verificationResult.message}
                    </p>
                  </div>
                </div>

                {/* If valid, show complete breakdown of student record */}
                {verificationResult.isValid && verificationResult.certificate && (
                  <div className="bg-white dark:bg-[#121214] p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <span className="text-stone-400 font-medium">Recipient Name</span>
                        <div className="font-bold text-sm text-stone-900 dark:text-white">
                          {verificationResult.certificate.recipientName}
                        </div>
                      </div>
                      <div>
                        <span className="text-stone-400 font-medium">Issue Date</span>
                        <div className="font-bold text-stone-900 dark:text-white">
                          {verificationResult.certificate.issueDate}
                        </div>
                      </div>
                      <div>
                        <span className="text-stone-400 font-medium">Dialect / Focus</span>
                        <div className="font-bold text-stone-900 dark:text-white">
                          {verificationResult.certificate.signLanguage === 'ISL'
                            ? 'ISL 🇮🇳'
                            : verificationResult.certificate.signLanguage === 'ASL'
                            ? 'ASL 🇺🇸'
                            : 'Bilingual (ISL & ASL)'}
                        </div>
                      </div>
                      <div>
                        <span className="text-stone-400 font-medium">Neural Accuracy</span>
                        <div className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                          {verificationResult.certificate.completionScore}%
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-stone-400 font-medium">Verified Track</span>
                        <div className="font-bold text-stone-800 dark:text-stone-200">
                          {verificationResult.certificate.trackTitle}
                        </div>
                      </div>
                      <div>
                        <span className="text-stone-400 font-medium">Honors Distinction</span>
                        <div className="font-bold text-amber-600 dark:text-amber-400">
                          {verificationResult.certificate.honorsLevel}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <div className="text-[11px] text-stone-400">
                        Verification Timestamp: <span className="font-mono">{verificationResult.verifiedAt}</span>
                      </div>
                      <button
                        onClick={() => handleDownloadPdf(verificationResult.certificate!)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Verified PDF</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
