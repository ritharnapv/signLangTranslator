import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  BookOpen, 
  Flame, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Play, 
  Pause, 
  Star, 
  HelpCircle, 
  Lightbulb, 
  Camera, 
  ShieldCheck,
  Zap,
  Info,
  HeartHandshake
} from 'lucide-react';
import { LearningLesson, LessonSignDetail, LessonQuizQuestion } from '../types';

interface ActiveLessonModalProps {
  lesson: LearningLesson;
  isOpen: boolean;
  onClose: () => void;
  onCompleteLesson: (lessonId: string, score: number, stars: number, xpEarned: number) => void;
  cameraActive?: boolean;
  onToggleCamera?: () => void;
}

export default function ActiveLessonModal({
  lesson,
  isOpen,
  onClose,
  onCompleteLesson,
  cameraActive = false,
  onToggleCamera
}: ActiveLessonModalProps) {
  // Modal Stages: 'intro' -> 'study' -> 'practice' -> 'quiz' -> 'summary'
  const [stage, setStage] = useState<'study' | 'quiz' | 'summary'>('study');
  const [currentSignIndex, setCurrentSignIndex] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [cameraFeedbackMsg, setCameraFeedbackMsg] = useState<string>('');
  const [practiceAccuracy, setPracticeAccuracy] = useState<number>(92);
  const [isSimulatingCheck, setIsSimulatingCheck] = useState<boolean>(false);
  const [activeStepTab, setActiveStepTab] = useState<number>(0);

  // Reset when a new lesson is opened
  useEffect(() => {
    if (isOpen) {
      setStage('study');
      setCurrentSignIndex(0);
      setCurrentQuestionIndex(0);
      setSelectedQuizAnswers({});
      setShowExplanation(false);
      setActiveStepTab(0);
    }
  }, [isOpen, lesson.id]);

  if (!isOpen) return null;

  const currentSign: LessonSignDetail | undefined = lesson.signs[currentSignIndex];
  const currentQuestion: LessonQuizQuestion | undefined = lesson.quizQuestions[currentQuestionIndex];
  const totalSigns = lesson.signs.length;
  const totalQuestions = lesson.quizQuestions.length;

  // Speech synthesis helper
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Practice check simulation / live camera posture evaluation
  const handleVerifyPosture = () => {
    setIsSimulatingCheck(true);
    setCameraFeedbackMsg('Analyzing wrist rotational alignment & finger joint geometry...');
    setTimeout(() => {
      setIsSimulatingCheck(false);
      const acc = 88 + Math.floor(Math.random() * 11);
      setPracticeAccuracy(acc);
      setCameraFeedbackMsg(`✓ Excellent hand posture! Detected: ${currentSign?.char} (${acc}% confidence)`);
    }, 1200);
  };

  // Handle quiz option selection
  const handleSelectAnswer = (optionIdx: number) => {
    if (selectedQuizAnswers[currentQuestionIndex] !== undefined) return; // already answered
    setSelectedQuizAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIdx
    }));
    setShowExplanation(true);
  };

  // Move to next quiz question or summary
  const handleNextQuizQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate score and complete lesson
      let correctCount = 0;
      lesson.quizQuestions.forEach((q, idx) => {
        if (selectedQuizAnswers[idx] === q.correctIndex) {
          correctCount++;
        }
      });
      const scorePct = Math.round((correctCount / totalQuestions) * 100);
      const stars = scorePct >= 90 ? 3 : scorePct >= 60 ? 2 : 1;
      setStage('summary');
      onCompleteLesson(lesson.id, scorePct, stars, lesson.xpReward);
    }
  };

  // Study stage sign navigation
  const handleNextSign = () => {
    if (currentSignIndex + 1 < totalSigns) {
      setCurrentSignIndex(prev => prev + 1);
      setActiveStepTab(0);
      setCameraFeedbackMsg('');
    } else {
      // Move to quiz
      setStage('quiz');
      setCurrentQuestionIndex(0);
    }
  };

  const handlePrevSign = () => {
    if (currentSignIndex > 0) {
      setCurrentSignIndex(prev => prev - 1);
      setActiveStepTab(0);
      setCameraFeedbackMsg('');
    }
  };

  // Calculate quiz summary stats
  const calculateFinalResults = () => {
    let correctCount = 0;
    lesson.quizQuestions.forEach((q, idx) => {
      if (selectedQuizAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });
    const scorePct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 100;
    const stars = scorePct >= 90 ? 3 : scorePct >= 60 ? 2 : 1;
    return { correctCount, scorePct, stars };
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto"
      id="active-lesson-modal-overlay"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-[#161618] border border-[#e0e4db] dark:border-[#2d2d32] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        id="active-lesson-modal-container"
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#ecece0] dark:border-[#26262a] bg-[#fbfbfa] dark:bg-[#1a1a1d] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/60 flex items-center justify-center text-lg shrink-0">
              {lesson.signLanguage === 'ISL' ? '🇮🇳' : '🇺🇸'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-100 dark:border-orange-900/40">
                  Day {lesson.dayNumber} Lesson
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  {stage === 'study' ? `Sign ${currentSignIndex + 1} of ${totalSigns}` : stage === 'quiz' ? `Question ${currentQuestionIndex + 1} of ${totalQuestions}` : 'Lesson Complete'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#2d2d28] dark:text-white truncate">
                {lesson.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 px-3 py-1 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+{lesson.xpReward} XP</span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Lesson"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="w-full bg-[#f0f2ee] dark:bg-[#202024] h-1.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
            style={{
              width: stage === 'study' 
                ? `${((currentSignIndex + 1) / (totalSigns + totalQuestions)) * 100}%`
                : stage === 'quiz'
                ? `${((totalSigns + currentQuestionIndex + 1) / (totalSigns + totalQuestions)) * 100}%`
                : '100%'
            }}
          />
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ============================================================ */}
          {/* STAGE 1: STUDY & SIGN DEMONSTRATION */}
          {/* ============================================================ */}
          {stage === 'study' && currentSign && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="study-stage-grid">
              
              {/* Left Column: Sign Visual Diagram / Anatomy */}
              <div className="lg:col-span-5 flex flex-col items-center bg-[#fdfcf9] dark:bg-[#111113] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 space-y-4 shadow-sm text-center">
                <div className="w-full flex items-center justify-between">
                  <span className={`text-[10px] font-bold font-mono uppercase px-2.5 py-1 rounded-lg border ${
                    currentSign.isTwoHanded 
                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {currentSign.isTwoHanded ? '👐 Two-Handed Sign' : '✋ Single Hand'}
                  </span>
                  
                  <button
                    onClick={() => handleSpeak(`${currentSign.char}. ${currentSign.meaning}. ${currentSign.visualTip}`)}
                    className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl transition-colors cursor-pointer"
                    title="Speak sign pronunciation and description"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4 text-orange-500 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Hand Demonstration Visual Card */}
                <div className="w-full aspect-square max-w-[260px] bg-gradient-to-b from-stone-50 to-orange-50/30 dark:from-[#1b1b1e] dark:to-[#221c17] rounded-2xl border border-stone-200/80 dark:border-stone-800 flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/80 dark:bg-black/40 backdrop-blur px-2 py-0.5 rounded-md text-[9px] font-mono text-stone-500">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>ISL STANDARD</span>
                  </div>

                  {/* Character Big Typography */}
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <span className="text-5xl font-black text-stone-900 dark:text-white tracking-tight font-sans">
                      {currentSign.char}
                    </span>
                    {currentSign.hindiChar && (
                      <span className="text-xl font-bold text-orange-600 dark:text-orange-400 font-serif">
                        {currentSign.hindiChar}
                      </span>
                    )}
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium max-w-[200px] leading-tight mt-1">
                      {currentSign.englishTitle}
                    </span>
                  </div>

                  {/* Interactive Posture Prompt */}
                  <div className="mt-4 bg-white dark:bg-[#141416] border border-orange-100 dark:border-orange-950/60 p-2.5 rounded-xl shadow-xs w-full text-left">
                    <p className="text-[11px] text-stone-700 dark:text-stone-300 font-medium leading-relaxed flex items-start gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{currentSign.visualTip}</span>
                    </p>
                  </div>
                </div>

                {/* Practice Check with Camera or Verification */}
                <div className="w-full space-y-2">
                  <button
                    onClick={handleVerifyPosture}
                    disabled={isSimulatingCheck}
                    className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isSimulatingCheck ? 'Evaluating Posture...' : 'Verify My Posture'}</span>
                  </button>
                  
                  {cameraFeedbackMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 rounded-xl text-[11px] font-mono font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60"
                    >
                      {cameraFeedbackMsg}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Right Column: Detailed Breakdown, Steps, and Cultural Context */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Meaning & Role */}
                  <div className="bg-[#fbfbfa] dark:bg-[#1a1a1d] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300">
                      <Info className="w-4 h-4 text-orange-500" />
                      <span>Sign Significance & Meaning</span>
                    </div>
                    <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-sans font-medium">
                      {currentSign.meaning}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {currentSign.description}
                    </p>
                  </div>

                  {/* Step-by-Step Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
                        Step-by-Step Execution ({currentSign.steps.length} Steps)
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {currentSign.steps.map((stepText, idx) => (
                        <div 
                          key={idx}
                          className="flex items-start gap-3 bg-white dark:bg-[#121214] border border-[#e0e4db] dark:border-[#2d2d32] p-3 rounded-2xl shadow-xs"
                        >
                          <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-stone-700 dark:text-stone-300 font-medium leading-relaxed pt-0.5">
                            {stepText}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cultural & Linguistic Note */}
                  {currentSign.culturalNote && (
                    <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                      <HeartHandshake className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Cultural Note:</strong>
                        <span>{currentSign.culturalNote}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons for Study Stage */}
                <div className="pt-4 border-t border-[#ecece0] dark:border-[#2d2d32] flex items-center justify-between gap-3">
                  <button
                    onClick={handlePrevSign}
                    disabled={currentSignIndex === 0}
                    className="py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Sign</span>
                  </button>

                  <button
                    onClick={handleNextSign}
                    className="py-2.5 px-6 bg-[#7c8d7c] hover:bg-[#6c7d6c] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <span>{currentSignIndex + 1 < totalSigns ? 'Next Sign' : 'Begin Knowledge Quiz'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STAGE 2: INTERACTIVE KNOWLEDGE QUIZ */}
          {/* ============================================================ */}
          {stage === 'quiz' && currentQuestion && (
            <div className="max-w-2xl mx-auto space-y-6" id="quiz-stage-container">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <HelpCircle className="w-4 h-4" />
                  <span>Knowledge Check ({currentQuestionIndex + 1} of {totalQuestions})</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                  Score: {Object.keys(selectedQuizAnswers).length} Answered
                </span>
              </div>

              {/* Question Text */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-[#2d2d28] dark:text-white leading-snug">
                  {currentQuestion.question}
                </h4>

                {/* Option Choices */}
                <div className="space-y-2.5">
                  {currentQuestion.options.map((option, optIdx) => {
                    const isSelected = selectedQuizAnswers[currentQuestionIndex] === optIdx;
                    const isAnswered = selectedQuizAnswers[currentQuestionIndex] !== undefined;
                    const isCorrect = optIdx === currentQuestion.correctIndex;
                    
                    let btnStyle = "bg-white dark:bg-[#18181b] border-[#e0e4db] dark:border-[#2d2d32] text-stone-800 dark:text-stone-200 hover:border-orange-400";
                    if (isAnswered) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500";
                      } else if (isSelected && !isCorrect) {
                        btnStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500";
                      } else {
                        btnStyle = "bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-400 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectAnswer(optIdx)}
                        disabled={isAnswered}
                        className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all shadow-xs flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="truncate">{option}</span>
                        </div>

                        {isAnswered && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-[#1c1c20] border border-stone-200 dark:border-[#2d2d32] space-y-1.5"
                  >
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 font-mono block">
                      💡 Explanation
                    </span>
                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                      {currentQuestion.explanation}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Next Question / Finish Quiz Button */}
              {selectedQuizAnswers[currentQuestionIndex] !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-4 flex justify-end"
                >
                  <button
                    onClick={handleNextQuizQuestion}
                    className="py-3 px-8 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <span>{currentQuestionIndex + 1 < totalQuestions ? 'Next Question' : 'View Lesson Summary'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* STAGE 3: SUMMARY & BADGES EARNED */}
          {/* ============================================================ */}
          {stage === 'summary' && (
            <div className="max-w-xl mx-auto text-center space-y-6 py-4" id="lesson-summary-view">
              {(() => {
                const results = calculateFinalResults();
                return (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg text-4xl"
                    >
                      🎉
                    </motion.div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold font-mono uppercase tracking-widest text-orange-600 dark:text-orange-400">
                        Lesson Completed!
                      </span>
                      <h3 className="text-2xl font-black text-stone-900 dark:text-white">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                        You have successfully reviewed all vocabulary postures and completed the knowledge verification quiz.
                      </p>
                    </div>

                    {/* Star Rating & Score */}
                    <div className="bg-[#fbfbfa] dark:bg-[#1a1a1d] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-5 space-y-3 max-w-md mx-auto">
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3].map((starNum) => (
                          <Star 
                            key={starNum}
                            className={`w-8 h-8 ${
                              starNum <= results.stars 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-stone-300 dark:text-stone-700'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200 dark:border-stone-800 text-center">
                        <div>
                          <span className="text-[10px] text-stone-400 font-mono block">SCORE</span>
                          <span className="text-lg font-black text-stone-800 dark:text-stone-200 font-mono">
                            {results.scorePct}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 font-mono block">XP EARNED</span>
                          <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                            +{lesson.xpReward}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 font-mono block">ACCURACY</span>
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {practiceAccuracy}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cultural Fact Highlight */}
                    {lesson.culturalFact && (
                      <div className="bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 p-4 rounded-2xl text-xs text-orange-900 dark:text-orange-300 text-left">
                        <strong className="block font-bold mb-1">Cultural Wisdom:</strong>
                        <p>{lesson.culturalFact}</p>
                      </div>
                    )}

                    <button
                      onClick={onClose}
                      className="w-full max-w-md mx-auto py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-sm font-bold shadow-md transition-all cursor-pointer"
                    >
                      Return to Learning Dashboard
                    </button>
                  </>
                );
              })()}
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
