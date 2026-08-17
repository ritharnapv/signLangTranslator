import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  VideoOff,
  RefreshCw,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Maximize2,
  Sparkles,
  Bot,
  User,
  Flame,
  Volume2
} from 'lucide-react';
import { MultiplayerPlayer, SignMistake } from '../types';
import { SKELETON_CONNECTIONS } from '../utils/signEvaluatorEngine';

interface MultiplayerWebcamFeedProps {
  player: MultiplayerPlayer;
  isCurrentPromptActive: boolean;
  targetSign: string;
  isWinner?: boolean;
  videoStream?: MediaStream | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  availableCameras?: MediaDeviceInfo[];
  selectedCameraId?: string;
  onSelectCamera?: (deviceId: string) => void;
  onToggleCamera?: () => void;
  isSimulatedBot?: boolean;
  reactionTimeMs?: number;
  className?: string;
}

export default function MultiplayerWebcamFeed({
  player,
  isCurrentPromptActive,
  targetSign,
  isWinner = false,
  videoStream,
  videoRef: externalVideoRef,
  canvasRef: externalCanvasRef,
  availableCameras = [],
  selectedCameraId = '',
  onSelectCamera,
  onToggleCamera,
  isSimulatedBot = false,
  reactionTimeMs = 0,
  className = ''
}: MultiplayerWebcamFeedProps) {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const videoRef = externalVideoRef || internalVideoRef;
  const canvasRef = externalCanvasRef || internalCanvasRef;

  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [showJointNames, setShowJointNames] = useState<boolean>(false);

  // Sync internal video ref if stream is passed directly
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream, videoRef]);

  // Render hand landmarks skeleton onto the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!player.landmarks || player.landmarks.length < 21) {
      return;
    }

    const landmarks = player.landmarks;
    const width = canvas.width;
    const height = canvas.height;

    // Draw Skeleton Connections
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    SKELETON_CONNECTIONS.forEach(([startIndex, endIndex]) => {
      const p1 = landmarks[startIndex];
      const p2 = landmarks[endIndex];
      if (!p1 || !p2) return;

      const x1 = isMirrored ? (1 - p1.x) * width : p1.x * width;
      const y1 = p1.y * height;
      const x2 = isMirrored ? (1 - p2.x) * width : p2.x * width;
      const y2 = p2.y * height;

      // Color scheme based on player accuracy
      let strokeColor = 'rgba(239, 68, 68, 0.7)'; // Red
      if (player.currentAccuracy >= 85) {
        strokeColor = player.id === 'p1' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(168, 85, 247, 0.9)';
      } else if (player.currentAccuracy >= 65) {
        strokeColor = 'rgba(245, 158, 11, 0.85)'; // Amber
      }

      ctx.strokeStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Draw Landmark Points (Joints)
    landmarks.forEach((p, idx) => {
      const x = isMirrored ? (1 - p.x) * width : p.x * width;
      const y = p.y * height;

      const isTip = [4, 8, 12, 16, 20].includes(idx);
      const isWrist = idx === 0;

      ctx.beginPath();
      ctx.arc(x, y, isTip ? 5.5 : isWrist ? 6 : 4, 0, Math.PI * 2);

      if (player.currentAccuracy >= 85) {
        ctx.fillStyle = isTip ? '#facc15' : '#10b981';
      } else if (player.currentAccuracy >= 65) {
        ctx.fillStyle = isTip ? '#f97316' : '#fbbf24';
      } else {
        ctx.fillStyle = isTip ? '#f87171' : '#ef4444';
      }
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      if (showJointNames && isTip) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`J${idx}`, x + 6, y - 4);
      }
    });
  }, [player.landmarks, player.currentAccuracy, isMirrored, showJointNames, canvasRef]);

  // Color styling based on player identity
  const isP1 = player.id === 'p1';
  const playerThemeColor = isP1 ? 'emerald' : 'purple';
  const borderColor = isWinner
    ? 'ring-4 ring-amber-400 shadow-lg shadow-amber-500/20'
    : isP1
    ? 'ring-2 ring-emerald-500/60'
    : 'ring-2 ring-purple-500/60';

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col shadow-md ${borderColor} ${className}`}>
      {/* Top Overlay Badge Header */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Player Name and Avatar Tag */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white shadow-sm pointer-events-auto">
          <span className="text-base">{player.avatar}</span>
          <div>
            <div className="text-xs font-black flex items-center gap-1.5">
              <span>{player.name}</span>
              {player.isAi ? (
                <span className="text-[9px] px-1.5 py-0.2 bg-purple-500/30 text-purple-300 rounded font-bold border border-purple-500/40">
                  AI ({player.aiDifficulty})
                </span>
              ) : (
                <span className={`text-[9px] px-1.5 py-0.2 ${isP1 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-purple-500/30 text-purple-300'} rounded font-bold`}>
                  {isP1 ? 'P1 Challenger' : 'P2 Rival'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Streak & Round Wins */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {player.streak > 1 && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-black flex items-center gap-1 shadow-sm"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-200 animate-bounce" />
              <span>{player.streak}x STREAK</span>
            </motion.div>
          )}

          <div className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-black flex items-center gap-1">
            <span className="text-amber-400">★</span>
            <span>{player.roundWins} Wins</span>
          </div>
        </div>
      </div>

      {/* Main Video Viewport & Landmark Canvas */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {player.isAi ? (
          /* AI Rival Synthetic Canvas / Virtual Avatar View */
          <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
            
            {/* AI Avatar Core */}
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border-2 border-purple-400/50 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20 mx-auto mb-2 animate-pulse">
                {player.avatar}
              </div>
              <div className="text-xs font-black text-purple-200 uppercase tracking-wider">
                Virtual Neural Sparring Partner
              </div>
              <div className="text-[11px] text-purple-400 mt-0.5">
                Simulating {player.aiDifficulty} sign biometrics
              </div>
            </div>

            {/* Skeleton Canvas Overlay for Bot */}
            <canvas
              ref={canvasRef as any}
              width={640}
              height={360}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
            />
          </div>
        ) : (
          /* Human Webcam Feed & Overlay */
          <div className="relative w-full h-full flex items-center justify-center">
            {player.cameraActive ? (
              <>
                <video
                  ref={videoRef as any}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                />
                <canvas
                  ref={canvasRef as any}
                  width={640}
                  height={360}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <VideoOff className="w-10 h-10 mb-2 opacity-50 text-slate-500" />
                <p className="text-xs font-bold text-slate-300">Camera Inactive</p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  Power on the webcam to start real-time landmark tracking and duel evaluation.
                </p>
                {onToggleCamera && (
                  <button
                    onClick={onToggleCamera}
                    className="mt-3 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Start Video Feed</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reaction Time / Lock Speed Badge */}
        {reactionTimeMs > 0 && (
          <div className="absolute top-14 left-3 z-20 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{(reactionTimeMs / 1000).toFixed(2)}s Reaction</span>
          </div>
        )}

        {/* Live Detected Attempt Floating Banner */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
          {/* Detected Sign & Target Match */}
          <div className="flex-1 bg-black/75 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                player.currentAccuracy >= 85 ? 'bg-emerald-400 animate-ping' :
                player.currentAccuracy >= 65 ? 'bg-amber-400' : 'bg-red-500'
              }`} />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Detected Sign:</div>
                <div className="text-xs font-black tracking-wide text-white">
                  {player.currentSignAttempt || 'Waiting for pose...'}
                </div>
              </div>
            </div>

            {/* Accuracy Score Pill */}
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-semibold">Accuracy:</div>
              <div className={`text-sm font-black ${
                player.currentAccuracy >= 85 ? 'text-emerald-400' :
                player.currentAccuracy >= 65 ? 'text-amber-400' : 'text-slate-300'
              }`}>
                {player.currentAccuracy.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Quick Camera Settings (Mirror / Toggle) */}
          {!player.isAi && (
            <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
              <button
                onClick={() => setIsMirrored(!isMirrored)}
                title="Mirror Camera View"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              {availableCameras.length > 1 && onSelectCamera && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => onSelectCamera(e.target.value)}
                  className="bg-slate-800 text-[10px] text-slate-200 rounded px-1.5 py-1 border border-slate-700 cursor-pointer"
                >
                  {availableCameras.map((cam, idx) => (
                    <option key={cam.deviceId || idx} value={cam.deviceId}>
                      {cam.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Accuracy Progress Gauge Bar */}
      <div className="bg-slate-950 p-2.5 border-t border-slate-800/80">
        <div className="flex justify-between items-center text-[10px] font-bold mb-1">
          <span className="text-slate-400">Match Confidence Target (≥85%)</span>
          <span className={player.currentAccuracy >= 85 ? 'text-emerald-400 font-black' : 'text-slate-400'}>
            {player.currentAccuracy >= 85 ? '✓ Target Met' : `${player.currentAccuracy.toFixed(0)}% / 100%`}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
          {/* Target marker line at 85% */}
          <div className="absolute top-0 bottom-0 left-[85%] w-0.5 bg-amber-400 z-10" />
          <motion.div
            className={`h-full rounded-full transition-all ${
              player.currentAccuracy >= 85
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                : player.currentAccuracy >= 65
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-red-500 to-orange-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, player.currentAccuracy))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
