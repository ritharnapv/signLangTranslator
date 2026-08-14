import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Gauge, 
  Maximize2, 
  Sparkles, 
  Eye, 
  Smile, 
  Activity, 
  ArrowRight,
  Hand,
  Volume2,
  CheckCircle2
} from 'lucide-react';
import { ISLSignItem } from '../data/islDictionaryData';

interface ISLVideoDemonstratorProps {
  sign: ISLSignItem;
  className?: string;
}

export default function ISLVideoDemonstrator({ sign, className = '' }: ISLVideoDemonstratorProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [progress, setProgress] = useState(0);
  const [activeAngle, setActiveAngle] = useState<'front' | 'angled' | 'skeleton'>('front');
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showFacialMarkers, setShowFacialMarkers] = useState(true);

  // Animation frame loop for dynamic video simulation
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
  }, [sign.id]);

  useEffect(() => {
    let currentProgress = progress;

    const animate = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (isPlaying) {
        // Cycle period is 3.5 seconds
        const step = (delta / (3500 / playbackSpeed)) * 100;
        currentProgress = (currentProgress + step) % 100;
        setProgress(currentProgress);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Compute animated transform coordinates based on sign movement type
  const t = progress / 100; // 0 to 1
  const sinWave = Math.sin(t * Math.PI * 2);
  const cosWave = Math.cos(t * Math.PI * 2);
  const bounceWave = Math.abs(Math.sin(t * Math.PI * 2));

  let dominantOffsetX = 0;
  let dominantOffsetY = 0;
  let dominantRotate = 0;
  let dominantScale = 1;

  let nonDomOffsetX = 0;
  let nonDomOffsetY = 0;
  let nonDomRotate = 0;

  if (sign.movementType === 'contact') {
    // Coming together and touching with a slight bounce pulse
    dominantOffsetX = -18 * (1 - Math.abs(Math.sin(t * Math.PI)));
    dominantOffsetY = -8 * Math.sin(t * Math.PI);
    nonDomOffsetX = 18 * (1 - Math.abs(Math.sin(t * Math.PI)));
    nonDomOffsetY = -8 * Math.sin(t * Math.PI);
  } else if (sign.movementType === 'linear') {
    // Linear sweeping motion
    dominantOffsetX = 22 * sinWave;
    dominantOffsetY = -15 * bounceWave;
  } else if (sign.movementType === 'circular') {
    // Circular orbit motion
    dominantOffsetX = 18 * cosWave;
    dominantOffsetY = 14 * sinWave;
    dominantRotate = 10 * sinWave;
  } else if (sign.movementType === 'repetitive') {
    // Rapid nodding / tapping
    dominantOffsetY = 12 * Math.sin(t * Math.PI * 4);
    dominantRotate = 8 * Math.sin(t * Math.PI * 4);
  } else if (sign.movementType === 'arching') {
    // Arching curve
    dominantOffsetX = 24 * (t - 0.5);
    dominantOffsetY = -20 * (1 - 4 * Math.pow(t - 0.5, 2));
    nonDomOffsetX = -24 * (t - 0.5);
    nonDomOffsetY = -20 * (1 - 4 * Math.pow(t - 0.5, 2));
  }

  // Facial non-manual markers reaction
  const isQuestion = sign.category === 'isl-daily-phrase' || sign.englishTitle.includes('?');
  const isJoy = sign.category === 'isl-emotion' && sign.char === 'Khush';
  const isSad = sign.category === 'isl-emotion' && sign.char === 'Udaas';
  const isPain = sign.category === 'isl-health-emergency' && (sign.char === 'Dard' || sign.char === 'Gussa');

  return (
    <div className={`relative bg-neutral-950 text-white rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col ${className}`}>
      
      {/* Video Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/90 border-b border-neutral-800/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <div>
            <span className="text-[11px] font-mono font-black text-emerald-400 uppercase tracking-wider">
              ISL HD Video Demonstration
            </span>
            <p className="text-[10px] text-zinc-400 font-sans">
              {sign.char} {sign.hindiChar ? `• ${sign.hindiChar}` : ''} ({sign.isTwoHanded ? '2-Handed' : '1-Handed'})
            </p>
          </div>
        </div>

        {/* View Angle Switcher */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveAngle('front')}
            className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${
              activeAngle === 'front' ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setActiveAngle('angled')}
            className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${
              activeAngle === 'angled' ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            45° Side
          </button>
          <button
            onClick={() => setActiveAngle('skeleton')}
            className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${
              activeAngle === 'skeleton' ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Skeleton
          </button>
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="relative aspect-[16/10] w-full bg-gradient-to-b from-[#121417] via-[#0d0f12] to-[#08090a] flex items-center justify-center overflow-hidden select-none">
        
        {/* Dynamic Studio Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f242c15_1px,transparent_1px),linear-gradient(to_bottom,#1f242c15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Non-Manual Marker: Realistic Facial & Head Rig */}
        {showFacialMarkers && (
          <div className="absolute top-6 flex flex-col items-center pointer-events-none z-10">
            <div className="relative w-20 h-24 rounded-full bg-gradient-to-b from-[#2a2d34] to-[#1e2026] border-2 border-neutral-700/80 shadow-lg flex flex-col items-center pt-3">
              {/* Eyebrows */}
              <div className="flex gap-4 mb-1">
                <div 
                  className={`w-3.5 h-1 bg-amber-200/90 rounded-full transition-transform duration-300 ${
                    isQuestion ? '-rotate-12 -translate-y-1' : isPain ? 'rotate-12 translate-y-0.5' : ''
                  }`}
                />
                <div 
                  className={`w-3.5 h-1 bg-amber-200/90 rounded-full transition-transform duration-300 ${
                    isQuestion ? 'rotate-12 -translate-y-1' : isPain ? '-rotate-12 translate-y-0.5' : ''
                  }`}
                />
              </div>

              {/* Eyes */}
              <div className="flex gap-4 mb-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                </div>
              </div>

              {/* Nose */}
              <div className="w-1 h-3 bg-neutral-600 rounded-full mb-1"></div>

              {/* Mouth */}
              <div 
                className={`transition-all duration-300 ${
                  isJoy 
                    ? 'w-6 h-3 rounded-b-full border-b-2 border-amber-300' 
                    : isSad 
                    ? 'w-5 h-2.5 rounded-t-full border-t-2 border-rose-300 translate-y-1' 
                    : isQuestion
                    ? 'w-3 h-3 rounded-full border-2 border-amber-300'
                    : 'w-4 h-1 bg-amber-200/60 rounded-full'
                }`}
              />
            </div>
            <span className="mt-1 text-[8px] font-mono text-zinc-400 font-bold uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded-md border border-neutral-800">
              Facial Marker: {sign.facialExpression ? 'Active' : 'Neutral'}
            </span>
          </div>
        )}

        {/* Hands Movement Vector Stage */}
        <div 
          className={`relative w-full h-full flex items-center justify-center transition-all duration-500 ${
            activeAngle === 'angled' ? 'perspective-500 rotate-y-12' : ''
          }`}
        >
          {/* Spatial Trajectory Path Trails */}
          {showTrajectory && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {sign.movementType === 'contact' && (
                <g stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" opacity="0.6">
                  <line x1="30%" y1="65%" x2="50%" y2="65%" />
                  <line x1="70%" y1="65%" x2="50%" y2="65%" />
                  <circle cx="50%" cy="65%" r="14" fill="#10b981" fillOpacity="0.15" className="animate-ping" />
                </g>
              )}
              {sign.movementType === 'circular' && (
                <ellipse cx="50%" cy="65%" rx="45" ry="25" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" opacity="0.7" />
              )}
              {sign.movementType === 'linear' && (
                <path d="M 40% 70% Q 50% 50% 65% 70%" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" opacity="0.7" />
              )}
              {sign.movementType === 'arching' && (
                <path d="M 30% 75% Q 50% 45% 70% 75%" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" opacity="0.7" />
              )}
            </svg>
          )}

          {/* Non-Dominant Hand (if two-handed) */}
          {sign.isTwoHanded && (
            <div 
              className="absolute transition-transform duration-75"
              style={{
                transform: `translate(${nonDomOffsetX - 42}px, ${nonDomOffsetY + 28}px) rotate(${nonDomRotate - 8}deg)`
              }}
            >
              <div className={`relative p-3 rounded-2xl ${activeAngle === 'skeleton' ? 'border-2 border-cyan-400 bg-cyan-950/40' : 'bg-gradient-to-br from-emerald-950/80 to-neutral-900 border border-emerald-500/30'} shadow-lg backdrop-blur-sm`}>
                <div className="flex flex-col items-center">
                  <Hand className="w-16 h-16 text-emerald-400 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transform -scale-x-100" />
                  <span className="text-[9px] font-mono font-bold text-emerald-300 mt-1 uppercase">
                    Non-Dominant (Left)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dominant Hand */}
          <div 
            className="absolute transition-transform duration-75"
            style={{
              transform: `translate(${dominantOffsetX + (sign.isTwoHanded ? 42 : 0)}px, ${dominantOffsetY + 28}px) rotate(${dominantRotate + 8}deg) scale(${dominantScale})`
            }}
          >
            <div className={`relative p-3 rounded-2xl ${activeAngle === 'skeleton' ? 'border-2 border-emerald-400 bg-emerald-950/40' : 'bg-gradient-to-br from-emerald-900/90 to-neutral-900 border border-emerald-400/50'} shadow-xl backdrop-blur-sm`}>
              <div className="flex flex-col items-center">
                <Hand className="w-16 h-16 text-emerald-300 filter drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                <span className="text-[9px] font-mono font-bold text-emerald-200 mt-1 uppercase">
                  Dominant (Right)
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Real-time Movement Trajectory Indicator HUD Pill */}
        <div className="absolute bottom-3 left-4 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase">
            Trajectory: {sign.movementType} motion
          </span>
        </div>

        {/* Difficulty Badge */}
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800">
          <span className="text-[10px] font-mono text-zinc-400">Difficulty:</span>
          <span className={`text-[10px] font-mono font-bold uppercase ${
            sign.difficulty === 'easy' ? 'text-emerald-400' : sign.difficulty === 'medium' ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {sign.difficulty}
          </span>
        </div>

      </div>

      {/* Video Progress Scrubber */}
      <div className="w-full bg-neutral-900 h-1.5 relative cursor-pointer group" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newPct = (clickX / rect.width) * 100;
        setProgress(newPct);
      }}>
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>

      {/* Video Playback Controller Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-neutral-900/90 border-t border-neutral-800/80 gap-3">
        
        {/* Play/Pause & Step Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>
          <button
            onClick={() => setProgress(0)}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
            title="Replay from start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Selector (0.5x, 0.75x, 1x, 1.5x) */}
        <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-xl border border-neutral-800">
          <Gauge className="w-3 h-3 text-zinc-400" />
          <span className="text-[9px] font-mono text-zinc-400 mr-1">Speed:</span>
          {[0.5, 0.75, 1.0, 1.5].map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded transition-all ${
                playbackSpeed === spd ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Toggle Overlays (Motion Trail & Face Markers) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowTrajectory(p => !p)}
            className={`px-2 py-1 text-[9px] font-mono font-bold rounded-lg border transition-all ${
              showTrajectory 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' 
                : 'bg-neutral-800/60 text-zinc-400 border-neutral-700/60'
            }`}
          >
            Trails: {showTrajectory ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowFacialMarkers(p => !p)}
            className={`px-2 py-1 text-[9px] font-mono font-bold rounded-lg border transition-all ${
              showFacialMarkers 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' 
                : 'bg-neutral-800/60 text-zinc-400 border-neutral-700/60'
            }`}
          >
            Face: {showFacialMarkers ? 'ON' : 'OFF'}
          </button>
        </div>

      </div>

      {/* Movement Description Footer */}
      <div className="px-4 py-2.5 bg-black/70 border-t border-neutral-800/60 text-[11px] text-zinc-300 font-sans flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Motion Dynamics:</strong> {sign.movementDescription || sign.description}
        </p>
      </div>

    </div>
  );
}
