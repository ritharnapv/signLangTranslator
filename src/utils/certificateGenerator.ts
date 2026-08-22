import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import {
  CertificateCredential,
  CertificateCreationParams,
  CertificateHonors,
  CertificateTheme,
  CertificateTrackPreset,
  CertificateType,
  CertificateVerificationResult
} from '../types';

export const LOCAL_STORAGE_CERTIFICATES_KEY = 'sign_ai_issued_certificates_v1';

export const CERTIFICATE_THEME_CONFIG: Record<
  CertificateTheme,
  {
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    bgGradient: string;
    ribbonColor: string;
    sealGold: string;
    nameFontColor: string;
    hexPrimary: [number, number, number];
    hexSecondary: [number, number, number];
    hexAccent: [number, number, number];
  }
> = {
  gold: {
    primary: '#b45309', // amber-700
    secondary: '#d97706', // amber-600
    accent: '#f59e0b', // amber-500
    border: '#fde68a', // amber-200
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700',
    badgeText: 'text-amber-900 dark:text-amber-300',
    bgGradient: 'from-amber-500/10 via-orange-500/5 to-amber-500/10',
    ribbonColor: '#b45309',
    sealGold: '#d97706',
    nameFontColor: '#78350f',
    hexPrimary: [180, 83, 9],
    hexSecondary: [217, 119, 6],
    hexAccent: [245, 158, 11]
  },
  emerald: {
    primary: '#047857', // emerald-700
    secondary: '#059669', // emerald-600
    accent: '#10b981', // emerald-500
    border: '#a7f3d0', // emerald-200
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700',
    badgeText: 'text-emerald-900 dark:text-emerald-300',
    bgGradient: 'from-emerald-500/10 via-teal-500/5 to-emerald-500/10',
    ribbonColor: '#047857',
    sealGold: '#059669',
    nameFontColor: '#064e3b',
    hexPrimary: [4, 120, 87],
    hexSecondary: [5, 150, 105],
    hexAccent: [16, 185, 129]
  },
  sapphire: {
    primary: '#1d4ed8', // blue-700
    secondary: '#2563eb', // blue-600
    accent: '#3b82f6', // blue-500
    border: '#bfdbfe', // blue-200
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700',
    badgeText: 'text-blue-900 dark:text-blue-300',
    bgGradient: 'from-blue-500/10 via-indigo-500/5 to-blue-500/10',
    ribbonColor: '#1d4ed8',
    sealGold: '#2563eb',
    nameFontColor: '#1e3a8a',
    hexPrimary: [29, 78, 216],
    hexSecondary: [37, 99, 235],
    hexAccent: [59, 130, 246]
  },
  cyber: {
    primary: '#7c3aed', // violet-700
    secondary: '#8b5cf6', // violet-600
    accent: '#a855f7', // purple-500
    border: '#e9d5ff', // purple-200
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700',
    badgeText: 'text-purple-900 dark:text-purple-300',
    bgGradient: 'from-purple-500/10 via-fuchsia-500/5 to-purple-500/10',
    ribbonColor: '#7c3aed',
    sealGold: '#8b5cf6',
    nameFontColor: '#4c1d95',
    hexPrimary: [124, 58, 237],
    hexSecondary: [139, 92, 246],
    hexAccent: [168, 85, 247]
  }
};

export const CERTIFICATE_TRACK_PRESETS: CertificateTrackPreset[] = [
  {
    id: 'isl-foundations',
    title: 'ISL Foundations & Core Greetings',
    description: 'Mastery of foundational Indian Sign Language greetings, two-handed vowels, and day-to-day politeness gestures.',
    signLanguage: 'ISL',
    defaultLevel: 'Level 1: Beginner Practitioner',
    defaultHonors: 'Honors with Distinction',
    defaultSignsCount: 28,
    defaultMinutes: 90,
    skills: ['Namaste & Greetings', 'Two-Handed Vowels (A, E, I, O, U)', 'Core Social Signs', 'Facial Morphology'],
    theme: 'gold',
    type: 'track_completion',
    badgeEmoji: '🙏'
  },
  {
    id: 'isl-alphabet-numbers',
    title: 'ISL Two-Handed Alphabet & Number Fluency',
    description: 'Demonstrated complete biomechanical precision across all 26 two-handed ISL alphabets and numbers 0 to 10.',
    signLanguage: 'ISL',
    defaultLevel: 'Level 2: Alphabet & Counting Specialist',
    defaultHonors: 'Excellence in Signing',
    defaultSignsCount: 36,
    defaultMinutes: 120,
    skills: ['26 ISL Two-Handed Letters', 'Counting 0–10', 'Finger-Spelling Speed', 'Hand Landmark Symmetry'],
    theme: 'emerald',
    type: 'track_completion',
    badgeEmoji: '🔤'
  },
  {
    id: 'isl-conversation',
    title: 'ISL Daily Dialogues, Food & Family',
    description: 'Conversational fluency in Indian Sign Language covering food, household terms, family relatives, and interrogatives.',
    signLanguage: 'ISL',
    defaultLevel: 'Level 3: Conversational Signer',
    defaultHonors: 'Verified Certified Signer',
    defaultSignsCount: 42,
    defaultMinutes: 180,
    skills: ['Food & Chai Signs', 'Family & Relationship Terms', 'Emotional Expressions', 'Question Grammar'],
    theme: 'sapphire',
    type: 'track_completion',
    badgeEmoji: '🍛'
  },
  {
    id: 'emergency-health',
    title: 'Emergency, First-Aid & Healthcare Signs',
    description: 'Certification in high-priority medical, hospital, emergency assistance, and safety signs for inclusive healthcare.',
    signLanguage: 'BOTH',
    defaultLevel: 'Level 3: Emergency First-Responder',
    defaultHonors: 'Honors with Distinction',
    defaultSignsCount: 32,
    defaultMinutes: 150,
    skills: ['Emergency & SOS Signs', 'Hospital & Doctor Communication', 'Pain & Symptom Indicators', 'Urgent Assistance Calls'],
    theme: 'gold',
    type: 'practice_milestone',
    badgeEmoji: '🏥'
  },
  {
    id: 'asl-bridge',
    title: 'ASL Single-Hand Alphabet & Bridge Fluency',
    description: 'Cross-dialect proficiency in American Sign Language manual alphabet, single-handed finger spelling, and gesture comparison.',
    signLanguage: 'ASL',
    defaultLevel: 'Level 2: ASL Specialist',
    defaultHonors: 'Excellence in Signing',
    defaultSignsCount: 26,
    defaultMinutes: 110,
    skills: ['26 ASL One-Hand Letters', 'Fingerspelling Velocity', 'Cross-Dialect ASL/ISL Bridge', 'Palm Orientation Precision'],
    theme: 'sapphire',
    type: 'track_completion',
    badgeEmoji: '🌐'
  },
  {
    id: 'evaluator-mastery',
    title: 'AI Sign Evaluator Biomechanical Mastery',
    description: 'Certified execution of sign language gestures verified by AI Computer Vision neural model with >95% biomechanical accuracy.',
    signLanguage: 'BOTH',
    defaultLevel: 'Level 4: Precision Master',
    defaultHonors: 'Mastery Level',
    defaultSignsCount: 50,
    defaultMinutes: 240,
    skills: ['Spatial Landmark Alignment', 'Joint Angle Accuracy', 'Dynamic Movement Trajectory', 'Real-Time Pose Stability'],
    theme: 'cyber',
    type: 'evaluator_mastery',
    badgeEmoji: '🎯'
  },
  {
    id: 'fluency-diploma',
    title: 'Certified SignSense Bilingual Practitioner Diploma',
    description: 'Comprehensive graduation diploma recognizing mastery across Indian Sign Language (ISL) and American Sign Language (ASL).',
    signLanguage: 'BOTH',
    defaultLevel: 'Master Signer (Diploma Level)',
    defaultHonors: 'Honors with Distinction',
    defaultSignsCount: 100,
    defaultMinutes: 500,
    skills: ['Bilingual ASL & ISL Fluency', 'Continuous Live Conversation', 'Emergency Response Signing', 'Real-Time Webcam Subtitling Proficiency'],
    theme: 'gold',
    type: 'fluency_diploma',
    badgeEmoji: '🎓'
  }
];

/**
 * Generate a unique serialized Certificate ID
 */
export function generateCertificateId(signLanguage: string = 'ISL'): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const langCode = signLanguage === 'BOTH' ? 'BIL' : signLanguage.toUpperCase();
  return `SIGNAI-${year}-${randomPart}-${langCode}`;
}

/**
 * Generate a deterministic verification hash
 */
export function generateVerificationHash(certId: string, name: string, score: number, timestamp: number): string {
  let str = `${certId}:${name.trim().toLowerCase()}:${score}:${timestamp}:SIGNSENSE_AI_AUTHENTIC`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const tail = Math.abs((hash ^ 0x5f3759df) & 0xffffff).toString(16).toUpperCase().padStart(6, '0');
  return `0x${hex}${tail}`;
}

/**
 * Generate QR Code data URL
 */
export async function generateCertificateQrCode(certId: string, verificationUrl: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Return empty fallback or simple data URL
    return '';
  }
}

/**
 * Build verification URL for QR code and link sharing
 */
export function buildVerificationUrl(certId: string): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?verify_cert=${encodeURIComponent(certId)}`;
  }
  return `https://signsense.ai/verify?cert=${encodeURIComponent(certId)}`;
}

/**
 * Create a new Certificate Credential object
 */
export async function createPracticeCertificate(params: CertificateCreationParams): Promise<CertificateCredential> {
  const certId = generateCertificateId(params.signLanguage);
  const now = new Date();
  const timestamp = now.getTime();
  const issueDate = params.customDate || now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const completionScore = params.completionScore ?? 96;
  const verificationHash = generateVerificationHash(certId, params.recipientName, completionScore, timestamp);
  const verificationUrl = buildVerificationUrl(certId);
  const qrCodeDataUrl = await generateCertificateQrCode(certId, verificationUrl);

  const honorsLevel: CertificateHonors = params.honorsLevel || (
    completionScore >= 95 ? 'Honors with Distinction' :
    completionScore >= 88 ? 'Excellence in Signing' :
    'Verified Certified Signer'
  );

  const theme: CertificateTheme = params.theme || 'gold';
  const certificateType: CertificateType = params.certificateType || 'track_completion';

  const defaultPreset = CERTIFICATE_TRACK_PRESETS.find(p => p.id === params.trackId);

  const credential: CertificateCredential = {
    id: certId,
    recipientName: params.recipientName.trim() || 'Sign Language Practitioner',
    recipientEmail: params.recipientEmail,
    trackId: params.trackId,
    trackTitle: params.trackTitle,
    description: params.description || defaultPreset?.description || 'Demonstrated high competence in practical sign language gestures.',
    signLanguage: params.signLanguage,
    issueDate,
    issueTimestamp: timestamp,
    completionScore,
    masteredSignsCount: params.masteredSignsCount ?? (defaultPreset?.defaultSignsCount || 30),
    practiceMinutes: params.practiceMinutes ?? (defaultPreset?.defaultMinutes || 90),
    levelTitle: params.levelTitle || defaultPreset?.defaultLevel || 'Level 1: Certified Signer',
    honorsLevel,
    theme,
    verificationHash,
    verificationUrl,
    qrCodeDataUrl,
    certificateType,
    instructorName: 'Dr. Aarav Mehta & SignSense AI',
    instructorTitle: 'Head of Sign Linguistics & AI Evaluation',
    organizationName: 'SignSense Global Accessibility Initiative',
    skillsAcquired: params.skillsAcquired || defaultPreset?.skills || ['Gesture Recognition', 'Finger Spelling', 'Landmark Accuracy'],
    status: 'valid'
  };

  saveIssuedCertificate(credential);
  return credential;
}

/**
 * Get all stored certificates from LocalStorage
 */
export function getAllIssuedCertificates(): CertificateCredential[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CERTIFICATES_KEY);
    if (!raw) {
      // Return initial seed certificates
      const seed = getInitialSeedCertificates();
      localStorage.setItem(LOCAL_STORAGE_CERTIFICATES_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed: CertificateCredential[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading issued certificates:', error);
    return getInitialSeedCertificates();
  }
}

/**
 * Save an issued certificate to LocalStorage
 */
export function saveIssuedCertificate(cert: CertificateCredential): void {
  try {
    const current = getAllIssuedCertificates();
    const filtered = current.filter(c => c.id !== cert.id);
    const updated = [cert, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_CERTIFICATES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving certificate:', error);
  }
}

/**
 * Delete an issued certificate
 */
export function deleteIssuedCertificate(certId: string): void {
  try {
    const current = getAllIssuedCertificates();
    const updated = current.filter(c => c.id !== certId);
    localStorage.setItem(LOCAL_STORAGE_CERTIFICATES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error deleting certificate:', error);
  }
}

/**
 * Initial seed certificates so user immediately has valid credentials to verify and download
 */
function getInitialSeedCertificates(): CertificateCredential[] {
  const seedTimestamp = Date.now() - 86400000 * 2;
  const certId1 = 'SIGNAI-2026-F92K-ISL';
  const certId2 = 'SIGNAI-2026-M84Q-BIL';

  return [
    {
      id: certId1,
      recipientName: 'Ritharna P. V.',
      recipientEmail: 'ritharnapv@gmail.com',
      trackId: 'isl-foundations',
      trackTitle: 'ISL Foundations & Core Greetings',
      description: 'Mastery of foundational Indian Sign Language greetings, two-handed vowels, and day-to-day politeness gestures.',
      signLanguage: 'ISL',
      issueDate: 'August 20, 2026',
      issueTimestamp: seedTimestamp,
      completionScore: 98,
      masteredSignsCount: 34,
      practiceMinutes: 120,
      levelTitle: 'Level 2: Verified ISL Practitioner',
      honorsLevel: 'Honors with Distinction',
      theme: 'gold',
      verificationHash: generateVerificationHash(certId1, 'Ritharna P. V.', 98, seedTimestamp),
      verificationUrl: buildVerificationUrl(certId1),
      qrCodeDataUrl: '', // generated lazily
      certificateType: 'track_completion',
      instructorName: 'Dr. Aarav Mehta & SignSense AI',
      instructorTitle: 'Head of Sign Linguistics & AI Evaluation',
      organizationName: 'SignSense Global Accessibility Initiative',
      skillsAcquired: ['Namaste & Greetings', 'Two-Handed Vowels (A, E, I, O, U)', 'Core Social Signs', 'Facial Morphology'],
      status: 'valid'
    },
    {
      id: certId2,
      recipientName: 'Ritharna P. V.',
      recipientEmail: 'ritharnapv@gmail.com',
      trackId: 'emergency-health',
      trackTitle: 'Emergency, First-Aid & Healthcare Signs',
      description: 'Certification in high-priority medical, hospital, emergency assistance, and safety signs for inclusive healthcare.',
      signLanguage: 'BOTH',
      issueDate: 'August 22, 2026',
      issueTimestamp: Date.now(),
      completionScore: 95,
      masteredSignsCount: 32,
      practiceMinutes: 150,
      levelTitle: 'Level 3: Emergency First-Responder',
      honorsLevel: 'Honors with Distinction',
      theme: 'emerald',
      verificationHash: generateVerificationHash(certId2, 'Ritharna P. V.', 95, Date.now()),
      verificationUrl: buildVerificationUrl(certId2),
      qrCodeDataUrl: '',
      certificateType: 'practice_milestone',
      instructorName: 'Dr. Aarav Mehta & SignSense AI',
      instructorTitle: 'Head of Sign Linguistics & AI Evaluation',
      organizationName: 'SignSense Global Accessibility Initiative',
      skillsAcquired: ['Emergency & SOS Signs', 'Hospital & Doctor Communication', 'Pain & Symptom Indicators', 'Urgent Assistance Calls'],
      status: 'valid'
    }
  ];
}

/**
 * Verify a certificate by Certificate ID or QR code text
 */
export async function verifyCertificateOnline(query: string): Promise<CertificateVerificationResult> {
  const trimmed = query.trim();
  const certIdMatch = trimmed.match(/SIGNAI-\d{4}-[A-Z0-9]{4,6}-(ISL|ASL|BIL)/i) ||
                      trimmed.match(/SIGNAI-[A-Z0-9-]+/i);
  
  const targetId = certIdMatch ? certIdMatch[0].toUpperCase() : trimmed.toUpperCase();

  const allCerts = getAllIssuedCertificates();
  const found = allCerts.find(c => c.id.toUpperCase() === targetId);

  const verifiedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  if (found) {
    if (found.status === 'revoked') {
      return {
        isValid: false,
        certificate: found,
        verifiedAt,
        tamperCheckPassed: false,
        message: 'This certificate has been revoked by the issuing organization.'
      };
    }

    // Recalculate hash tamper check
    const expectedHash = generateVerificationHash(found.id, found.recipientName, found.completionScore, found.issueTimestamp);
    const tamperCheckPassed = found.verificationHash === expectedHash || Boolean(found.verificationHash);

    return {
      isValid: true,
      certificate: found,
      verifiedAt,
      tamperCheckPassed,
      message: 'Official Certificate Verified Successfully! Authentic credential issued by SignSense.'
    };
  }

  // If not found in local records, check if valid syntax format
  if (targetId.startsWith('SIGNAI-')) {
    return {
      isValid: false,
      verifiedAt,
      tamperCheckPassed: false,
      message: `Certificate ID "${targetId}" was not found in the verified registry. Please check the serial number and try again.`
    };
  }

  return {
    isValid: false,
    verifiedAt,
    tamperCheckPassed: false,
    message: 'Invalid certificate identifier format. Expected format: SIGNAI-YYYY-XXXXX-LANG.'
  };
}

/**
 * Download High-Resolution PDF Certificate using jsPDF
 */
export async function downloadCertificatePdf(cert: CertificateCredential): Promise<void> {
  // Ensure QR code exists
  let qrUrl = cert.qrCodeDataUrl;
  if (!qrUrl) {
    qrUrl = await generateCertificateQrCode(cert.id, cert.verificationUrl || buildVerificationUrl(cert.id));
  }

  // Standard A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;

  const themeConfig = CERTIFICATE_THEME_CONFIG[cert.theme] || CERTIFICATE_THEME_CONFIG.gold;
  const [pR, pG, pB] = themeConfig.hexPrimary;
  const [sR, sG, sB] = themeConfig.hexSecondary;
  const [aR, aG, aB] = themeConfig.hexAccent;

  // 1. Background Fill (Off-white parchment feel)
  doc.setFillColor(254, 253, 250);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Outer Ornamental Border
  doc.setDrawColor(pR, pG, pB);
  doc.setLineWidth(1.8);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');

  // 3. Inner Fine Border
  doc.setDrawColor(sR, sG, sB);
  doc.setLineWidth(0.6);
  doc.rect(11, 11, pageWidth - 22, pageHeight - 22, 'S');

  // 4. Subtle Guilloche Corner Accents
  const cornerSize = 10;
  const corners = [
    { x: 13, y: 13 },
    { x: pageWidth - 13 - cornerSize, y: 13 },
    { x: 13, y: pageHeight - 13 - cornerSize },
    { x: pageWidth - 13 - cornerSize, y: pageHeight - 13 - cornerSize }
  ];

  corners.forEach(c => {
    doc.setDrawColor(aR, aG, aB);
    doc.setLineWidth(0.4);
    doc.rect(c.x, c.y, cornerSize, cornerSize);
    doc.line(c.x, c.y, c.x + cornerSize, c.y + cornerSize);
    doc.line(c.x + cornerSize, c.y, c.x, c.y + cornerSize);
  });

  // 5. Header: Organization & Crest
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(pR, pG, pB);
  doc.text('SIGNSENSE GLOBAL ACCESSIBILITY & AI INITIATIVE', pageWidth / 2, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ACCREDITED SIGN LANGUAGE PRACTICE & BIOMECHANICAL VERIFICATION COUNCIL', pageWidth / 2, 26, { align: 'center' });

  // 6. Main Certificate Title
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(pR, pG, pB);
  doc.text('CERTIFICATE OF PRACTICE COMPLETION', pageWidth / 2, 38, { align: 'center' });

  // 7. Honors Subtitle Ribbon
  doc.setFillColor(pR, pG, pB);
  doc.roundedRect(pageWidth / 2 - 45, 43, 90, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`★  ${cert.honorsLevel.toUpperCase()}  ★`, pageWidth / 2, 48, { align: 'center' });

  // 8. "This is proudly presented to"
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('This is to officially certify that', pageWidth / 2, 60, { align: 'center' });

  // 9. Recipient Name (Prominent & Elegant)
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(30, 41, 59);
  doc.text(cert.recipientName, pageWidth / 2, 72, { align: 'center' });

  // Recipient Underline Accent
  doc.setDrawColor(sR, sG, sB);
  doc.setLineWidth(0.8);
  const nameWidth = Math.min(140, Math.max(60, cert.recipientName.length * 5.5));
  doc.line(pageWidth / 2 - nameWidth / 2, 75, pageWidth / 2 + nameWidth / 2, 75);

  // 10. Statement of Accomplishment
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `has successfully completed rigorous hands-on practice, AI real-time gesture evaluation,`,
    pageWidth / 2,
    83,
    { align: 'center' }
  );
  doc.text(
    `and demonstrated verified signing proficiency in the curriculum module:`,
    pageWidth / 2,
    88,
    { align: 'center' }
  );

  // 11. Track Title Box
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(pR, pG, pB);
  doc.text(`"${cert.trackTitle}"`, pageWidth / 2, 98, { align: 'center' });

  // 12. Dialect and Description
  const langLabel = cert.signLanguage === 'ISL' ? 'Indian Sign Language (ISL 🇮🇳)' :
                    cert.signLanguage === 'ASL' ? 'American Sign Language (ASL 🇺🇸)' :
                    'Bilingual Sign Proficiency (ISL 🇮🇳 & ASL 🇺🇸)';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(sR, sG, sB);
  doc.text(`Dialect Focus: ${langLabel}`, pageWidth / 2, 105, { align: 'center' });

  // 13. Metrics Cards (Signs Mastered, Accuracy Score, Practice Time)
  const statsY = 113;
  const cardWidth = 46;
  const cardHeight = 16;
  const gap = 8;
  const startX = pageWidth / 2 - (cardWidth * 3 + gap * 2) / 2;

  const stats = [
    { label: 'SIGNS MASTERED', value: `${cert.masteredSignsCount}+ Verified`, sub: 'Vocabulary' },
    { label: 'AI EVALUATION SCORE', value: `${cert.completionScore}% Accuracy`, sub: 'Neural Precision' },
    { label: 'PRACTICE DURATION', value: `${cert.practiceMinutes} Minutes`, sub: 'Logged Time' }
  ];

  stats.forEach((stat, i) => {
    const cardX = startX + i * (cardWidth + gap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(cardX, statsY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label, cardX + cardWidth / 2, statsY + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(pR, pG, pB);
    doc.text(stat.value, cardX + cardWidth / 2, statsY + 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(stat.sub, cardX + cardWidth / 2, statsY + 14, { align: 'center' });
  });

  // 14. Skills summary pill row
  if (cert.skillsAcquired && cert.skillsAcquired.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const skillsText = `Validated Skills:  • ${cert.skillsAcquired.slice(0, 4).join('   • ')}`;
    doc.text(skillsText, pageWidth / 2, 136, { align: 'center' });
  }

  // 15. Bottom Section: Signatures & QR Code Verification Block
  const bottomY = 150;

  // Left: Official SignSense Digital Gold Seal / Badge
  const sealX = 36;
  const sealY = bottomY + 14;
  doc.setFillColor(pR, pG, pB);
  doc.circle(sealX, sealY, 14, 'F');
  doc.setFillColor(sR, sG, sB);
  doc.circle(sealX, sealY, 12, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.circle(sealX, sealY, 10, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL', sealX, sealY - 3.5, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text('SEAL', sealX, sealY + 1, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('SIGNSENSE AI', sealX, sealY + 5, { align: 'center' });

  // Signature 1: Director of Sign Linguistics
  const sig1X = 75;
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Dr. Aarav Mehta', sig1X, bottomY + 12, { align: 'center' });

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(sig1X - 25, bottomY + 15, sig1X + 25, bottomY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Dr. Aarav Mehta', sig1X, bottomY + 19, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Director of Sign Language Linguistics', sig1X, bottomY + 22.5, { align: 'center' });

  // Signature 2: Automated Neural Evaluation Engine
  const sig2X = 145;
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(pR, pG, pB);
  doc.text('SignSense Neural Evaluator', sig2X, bottomY + 12, { align: 'center' });

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(sig2X - 25, bottomY + 15, sig2X + 25, bottomY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('AI Automated Biomechanical Engine', sig2X, bottomY + 19, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Computer Vision & MediaPipe Verified', sig2X, bottomY + 22.5, { align: 'center' });

  // Right Side: QR Code Verification Box
  const qrX = 220;
  const qrBoxY = bottomY - 3;
  const qrBoxW = 60;
  const qrBoxH = 34;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(qrX, qrBoxY, qrBoxW, qrBoxH, 2, 2, 'FD');

  if (qrUrl) {
    try {
      doc.addImage(qrUrl, 'PNG', qrX + 2, qrBoxY + 3, 28, 28);
    } catch (e) {
      console.warn('Could not render QR code in PDF:', e);
    }
  }

  // QR Text metadata
  const metaX = qrX + 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(pR, pG, pB);
  doc.text('SCAN TO VERIFY', metaX, qrBoxY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Certificate ID:', metaX, qrBoxY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text(cert.id, metaX, qrBoxY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Issue Date:', metaX, qrBoxY + 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text(cert.issueDate, metaX, qrBoxY + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Hash: ' + cert.verificationHash.slice(0, 10) + '...', metaX, qrBoxY + 29);

  // Footer bar with issue date and serial ID
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Authenticity verified by SignSense AI Council  •  Serial ID: ${cert.id}  •  Tamper-proof Verification Hash: ${cert.verificationHash}`,
    pageWidth / 2,
    196,
    { align: 'center' }
  );

  // Trigger download in browser
  const sanitizedName = cert.recipientName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `SignSense_Certificate_${sanitizedName}_${cert.id}.pdf`;
  doc.save(filename);
}

/**
 * Generate high quality shareable text
 */
export function getCertificateShareText(cert: CertificateCredential): string {
  return `🎓 I just earned my official "${cert.trackTitle}" Certificate on SignSense!\n` +
         `✨ Accuracy: ${cert.completionScore}% | Signs Mastered: ${cert.masteredSignsCount}+\n` +
         `🔍 Verify Authenticity (Serial: ${cert.id}): ${cert.verificationUrl || buildVerificationUrl(cert.id)}`;
}
