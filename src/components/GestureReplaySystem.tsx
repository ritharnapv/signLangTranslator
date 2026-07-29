import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Repeat, 
  Maximize2, 
  Download, 
  Upload, 
  Save, 
  Trash2, 
  Edit3, 
  Video, 
  Film, 
  Layers, 
  Sliders, 
  Eye, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Grid, 
  List, 
  Tag, 
  Clock, 
  Compass, 
  HelpCircle, 
  Zap, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Share2, 
  FileJson, 
  FileSpreadsheet, 
  Cloud, 
  Scissors, 
  Target, 
  Gauge, 
  Volume2, 
  VolumeX, 
  Move3D, 
  CircleDot,
  Search
} from 'lucide-react';
import { GestureRecording, GestureFrame } from '../types';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface GestureReplaySystemProps {
  currentUser?: any;
  onSelectFrameSample?: (frame: GestureFrame) => void;
}

// MediaPipe 21 Joint Connections for hand skeleton
const HAND_BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // Index
  [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
  [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
  [5, 9], [9, 13], [13, 17]                 // Palm transverses
];

const JOINT_NAMES = [
  '0: Wrist', '1: Thumb CMC', '2: Thumb MCP', '3: Thumb IP', '4: Thumb Tip',
  '5: Index MCP', '6: Index PIP', '7: Index DIP', '8: Index Tip',
  '9: Middle MCP', '10: Middle PIP', '11: Middle DIP', '12: Middle Tip',
  '13: Ring MCP', '14: Ring PIP', '15: Ring DIP', '16: Ring Tip',
  '17: Pinky MCP', '18: Pinky PIP', '19: Pinky DIP', '20: Pinky Tip'
];

// Helper to generate synthetic realistic gesture trajectory frames for initial demo recordings
function generateSampleRecording(id: string, title: string, label: string, gestureType: 'HELLO' | 'THANK_YOU' | 'ASL' | 'A_TO_E'): GestureRecording {
  const fps = 30;
  const numFrames = gestureType === 'HELLO' ? 45 : gestureType === 'THANK_YOU' ? 40 : gestureType === 'ASL' ? 60 : 50;
  const frames: GestureFrame[] = [];

  for (let f = 0; f < numFrames; f++) {
    const t = f / numFrames;
    const progressAngle = t * Math.PI * 2;
    const waveOffset = gestureType === 'HELLO' ? Math.sin(progressAngle * 2) * 0.12 : Math.sin(progressAngle) * 0.05;
    
    // Base 21 keypoints
    const landmarks = [
      { x: 0.5 + waveOffset * 0.3, y: 0.7, z: 0.0 }, // 0: Wrist
      // Thumb
      { x: 0.42 + waveOffset * 0.2, y: 0.62, z: -0.02 },
      { x: 0.38 + waveOffset * 0.2, y: 0.52, z: -0.04 },
      { x: 0.35 + waveOffset * 0.2, y: 0.44, z: -0.05 },
      { x: 0.32 + waveOffset * 0.2, y: 0.38, z: -0.06 },
      // Index
      { x: 0.46 + waveOffset * 0.3, y: 0.48, z: -0.01 },
      { x: 0.45 + waveOffset * 0.3, y: 0.38, z: -0.03 },
      { x: 0.44 + waveOffset * 0.3, y: 0.30, z: -0.04 },
      { x: 0.43 + waveOffset * 0.3, y: 0.22, z: -0.05 },
      // Middle
      { x: 0.50 + waveOffset * 0.3, y: 0.47, z: 0.0 },
      { x: 0.50 + waveOffset * 0.3, y: 0.36, z: -0.02 },
      { x: 0.50 + waveOffset * 0.3, y: 0.27, z: -0.03 },
      { x: 0.50 + waveOffset * 0.3, y: 0.18, z: -0.04 },
      // Ring
      { x: 0.54 + waveOffset * 0.3, y: 0.48, z: 0.01 },
      { x: 0.55 + waveOffset * 0.3, y: 0.38, z: -0.01 },
      { x: 0.56 + waveOffset * 0.3, y: 0.30, z: -0.02 },
      { x: 0.57 + waveOffset * 0.3, y: 0.22, z: -0.03 },
      // Pinky
      { x: 0.58 + waveOffset * 0.3, y: 0.51, z: 0.02 },
      { x: 0.60 + waveOffset * 0.3, y: 0.43, z: 0.01 },
      { x: 0.61 + waveOffset * 0.3, y: 0.37, z: 0.0 },
      { x: 0.62 + waveOffset * 0.3, y: 0.31, z: -0.01 }
    ];

    let predictedChar = label;
    if (gestureType === 'ASL') {
      predictedChar = f < 20 ? 'A' : f < 40 ? 'S' : 'L';
    } else if (gestureType === 'A_TO_E') {
      predictedChar = ['A', 'B', 'C', 'D', 'E'][Math.floor(f / 10) % 5];
    }

    frames.push({
      frameIndex: f,
      timestampOffsetMs: Math.round(f * (1000 / fps)),
      landmarks,
      predictedChar,
      confidence: Math.round((0.88 + Math.sin(f * 0.5) * 0.09) * 100) / 100,
      notes: f === 0 ? 'Start gesture posture' : f === Math.floor(numFrames / 2) ? 'Peak articulation point' : undefined
    });
  }

  return {
    id,
    title,
    label,
    description: `High-fidelity 30 FPS gesture trajectory benchmark for ${label}.`,
    createdAt: new Date().toISOString(),
    durationMs: Math.round(numFrames * (1000 / fps)),
    fps,
    frames,
    handType: 'Right',
    category: gestureType === 'HELLO' || gestureType === 'THANK_YOU' ? 'Greeting' : 'Alphabet',
    author: 'ASL AI Studio Team'
  };
}

export default function GestureReplaySystem({ currentUser, onSelectFrameSample }: GestureReplaySystemProps) {
  // Demo Seeded Recordings
  const defaultRecordings = useMemo(() => [
    generateSampleRecording('rec_hello_01', 'Wave Greeting "HELLO"', 'HELLO', 'HELLO'),
    generateSampleRecording('rec_thankyou_01', 'Expression "THANK YOU"', 'THANK YOU', 'THANK_YOU'),
    generateSampleRecording('rec_asl_seq_01', 'Spelling Sequence "A-S-L"', 'ASL', 'ASL'),
    generateSampleRecording('rec_atoe_01', 'Alphabet Transition "A to E"', 'A-E', 'A_TO_E')
  ], []);

  // State
  const [recordings, setRecordings] = useState<GestureRecording[]>(() => {
    try {
      const saved = localStorage.getItem('asl_gesture_recordings');
      return saved ? JSON.parse(saved) : defaultRecordings;
    } catch {
      return defaultRecordings;
    }
  });

  const [activeRecordingId, setActiveRecordingId] = useState<string>(recordings[0]?.id || 'rec_hello_01');
  const activeRecording = useMemo(() => {
    return recordings.find(r => r.id === activeRecordingId) || recordings[0] || defaultRecordings[0];
  }, [recordings, activeRecordingId, defaultRecordings]);

  // Playback Player State
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [showTrajectory, setShowTrajectory] = useState<boolean>(true);
  const [show3DView, setShow3DView] = useState<boolean>(false);
  const [orbitAngle, setOrbitAngle] = useState<{ x: number; y: number }>({ x: 20, y: -30 });
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const orbitStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Inspection & Joint selection
  const [selectedJoint1, setSelectedJoint1] = useState<number>(4); // Thumb tip
  const [selectedJoint2, setSelectedJoint2] = useState<number>(8); // Index tip
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // New Recording Modal / Live Capture Simulation
  const [isNewRecordingModalOpen, setIsNewRecordingModalOpen] = useState(false);
  const [newRecTitle, setNewRecTitle] = useState('');
  const [newRecLabel, setNewRecLabel] = useState('CUSTOM');
  const [newRecCategory, setNewRecCategory] = useState('Custom');
  const [newRecFPS, setNewRecFPS] = useState<number>(30);

  // Edit Recording Modal
  const [editingRecording, setEditingRecording] = useState<GestureRecording | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('asl_gesture_recordings', JSON.stringify(recordings));
    } catch (e) {
      console.warn('Failed to save gesture recordings locally', e);
    }
  }, [recordings]);

  // Reset frame when switching active recording
  useEffect(() => {
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  }, [activeRecordingId]);

  // Playback Interval Loop Engine
  useEffect(() => {
    if (!isPlaying || !activeRecording || activeRecording.frames.length === 0) return;

    const fps = activeRecording.fps || 30;
    const intervalMs = (1000 / fps) / playbackSpeed;

    const timer = setInterval(() => {
      setCurrentFrameIndex(prev => {
        if (prev >= activeRecording.frames.length - 1) {
          if (isLooping) {
            return 0;
          } else {
            setIsPlaying(false);
            return prev;
          }
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, activeRecording, playbackSpeed, isLooping]);

  // Keyboard Shortcuts (Space: Play/Pause, Left Arrow: Prev Frame, Right Arrow: Next Frame)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid handling if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentFrameIndex(p => Math.max(0, p - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentFrameIndex(p => Math.min(activeRecording.frames.length - 1, p + 1));
      } else if (e.code === 'Home') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentFrameIndex(0);
      } else if (e.code === 'End') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentFrameIndex(activeRecording.frames.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRecording]);

  // Current Active Frame Data
  const currentFrame = useMemo(() => {
    if (!activeRecording || !activeRecording.frames || activeRecording.frames.length === 0) {
      return null;
    }
    const idx = Math.min(Math.max(0, currentFrameIndex), activeRecording.frames.length - 1);
    return activeRecording.frames[idx];
  }, [activeRecording, currentFrameIndex]);

  // Distance & Angle Measurements
  const jointMetrics = useMemo(() => {
    if (!currentFrame || !currentFrame.landmarks) return null;

    const p1 = currentFrame.landmarks[selectedJoint1];
    const p2 = currentFrame.landmarks[selectedJoint2];

    if (!p1 || !p2) return null;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = (p2.z || 0) - (p1.z || 0);
    const EuclideanDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Compute knuckle bend angle for Index Finger (Joints 5, 6, 7)
    let flexAngleDeg = 0;
    const j5 = currentFrame.landmarks[5];
    const j6 = currentFrame.landmarks[6];
    const j7 = currentFrame.landmarks[7];

    if (j5 && j6 && j7) {
      const v1 = { x: j5.x - j6.x, y: j5.y - j6.y, z: (j5.z || 0) - (j6.z || 0) };
      const v2 = { x: j7.x - j6.x, y: j7.y - j6.y, z: (j7.z || 0) - (j6.z || 0) };
      const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
      const m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
      const m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
      if (m1 * m2 > 0) {
        const cosAngle = Math.max(-1, Math.min(1, dot / (m1 * m2)));
        flexAngleDeg = Math.round((Math.acos(cosAngle) * 180) / Math.PI);
      }
    }

    return {
      distanceNormalized: Math.round(EuclideanDistance * 1000) / 1000,
      dx: Math.round(dx * 1000) / 1000,
      dy: Math.round(dy * 1000) / 1000,
      dz: Math.round(dz * 1000) / 1000,
      indexFlexAngle: flexAngleDeg
    };
  }, [currentFrame, selectedJoint1, selectedJoint2]);

  // Main Replay Canvas Renderer
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0f1410');
    bgGrad.addColorStop(1, '#18201a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid Overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (!currentFrame || !currentFrame.landmarks || currentFrame.landmarks.length === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO LANDMARK DATA FOR FRAME', width / 2, height / 2);
      return;
    }

    const landmarks = currentFrame.landmarks;

    // Normalize and center landmarks
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    landmarks.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });

    const rangeX = (maxX - minX) || 0.001;
    const rangeY = (maxY - minY) || 0.001;
    const padding = 50;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;
    const scale = Math.min(drawWidth / rangeX, drawHeight / rangeY);

    const offsetX = padding + (drawWidth - rangeX * scale) / 2;
    const offsetY = padding + (drawHeight - rangeY * scale) / 2;

    // Projection transform (2D vs 3D rotation)
    const project = (pt: { x: number; y: number; z?: number }) => {
      if (!show3DView) {
        return {
          x: (pt.x - minX) * scale + offsetX,
          y: (pt.y - minY) * scale + offsetY
        };
      }

      // 3D Isometric / Orbit Matrix Transform
      const radX = (orbitAngle.x * Math.PI) / 180;
      const radY = (orbitAngle.y * Math.PI) / 180;

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const cz = 0;

      let x0 = pt.x - cx;
      let y0 = pt.y - cy;
      let z0 = (pt.z || 0) - cz;

      // Rotate around Y
      let x1 = x0 * Math.cos(radY) + z0 * Math.sin(radY);
      let z1 = -x0 * Math.sin(radY) + z0 * Math.cos(radY);

      // Rotate around X
      let y2 = y0 * Math.cos(radX) - z1 * Math.sin(radX);

      return {
        x: width / 2 + x1 * scale * 1.2,
        y: height / 2 + y2 * scale * 1.2
      };
    };

    // Draw Motion Trajectory Trail (Past 10 frames)
    if (showTrajectory && activeRecording && activeRecording.frames.length > 0) {
      const trailStart = Math.max(0, currentFrameIndex - 12);
      const trailKeypoints = [4, 8, 20]; // Thumb, Index, Pinky tips

      trailKeypoints.forEach(jointIdx => {
        ctx.beginPath();
        let first = true;
        for (let i = trailStart; i <= currentFrameIndex; i++) {
          const frameLms = activeRecording.frames[i]?.landmarks;
          if (frameLms && frameLms[jointIdx]) {
            const p = project(frameLms[jointIdx]);
            if (first) {
              ctx.moveTo(p.x, p.y);
              first = false;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          }
        }
        ctx.strokeStyle = jointIdx === 8 ? 'rgba(59, 130, 246, 0.45)' : jointIdx === 4 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(168, 85, 247, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Draw Skeleton Bones
    HAND_BONES.forEach(([i, j]) => {
      if (landmarks[i] && landmarks[j]) {
        const p1 = project(landmarks[i]);
        const p2 = project(landmarks[j]);

        const boneGrad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        boneGrad.addColorStop(0, '#7c8d7c');
        boneGrad.addColorStop(1, '#a8c3a8');

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = 4;
        ctx.strokeStyle = boneGrad;
        ctx.stroke();
      }
    });

    // Draw Keypoint Nodes
    landmarks.forEach((pt, idx) => {
      const p = project(pt);
      const isSelected = idx === selectedJoint1 || idx === selectedJoint2;

      ctx.beginPath();
      let radius = isSelected ? 8 : 5;
      let color = '#22c55e'; // default green

      if (idx === 0) {
        radius = isSelected ? 9 : 6;
        color = '#ef4444'; // Wrist
      } else if (idx === 4) {
        color = '#f59e0b'; // Thumb tip
      } else if (idx === 8) {
        color = '#3b82f6'; // Index tip
      } else if (idx === 12 || idx === 16 || idx === 20) {
        color = '#a855f7'; // Tips
      }

      ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? '#a3e635' : color;
      ctx.fill();

      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.8)';
      ctx.stroke();

      // Label joint index number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(idx.toString(), p.x, p.y - radius - 3);
    });

    // Draw Measurement Connection line between selected joints
    if (landmarks[selectedJoint1] && landmarks[selectedJoint2]) {
      const p1 = project(landmarks[selectedJoint1]);
      const p2 = project(landmarks[selectedJoint2]);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [currentFrame, activeRecording, currentFrameIndex, showTrajectory, show3DView, orbitAngle, selectedJoint1, selectedJoint2]);

  // Orbit drag handlers for 3D View
  const handleOrbitMouseDown = (e: React.MouseEvent) => {
    if (!show3DView) return;
    setIsOrbiting(true);
    orbitStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleOrbitMouseMove = (e: React.MouseEvent) => {
    if (!isOrbiting) return;
    const dx = e.clientX - orbitStartRef.current.x;
    const dy = e.clientY - orbitStartRef.current.y;
    orbitStartRef.current = { x: e.clientX, y: e.clientY };

    setOrbitAngle(prev => ({
      x: Math.max(-80, Math.min(80, prev.x + dy * 0.5)),
      y: prev.y + dx * 0.5
    }));
  };

  const handleOrbitMouseUp = () => {
    setIsOrbiting(false);
  };

  // Actions
  const handleSaveRecordingToCloud = async (rec: GestureRecording) => {
    if (!currentUser) {
      showToast('Sign in to sync gesture recordings to Cloud Firestore', 'warn');
      return;
    }
    try {
      const docRef = doc(db, "users", currentUser.uid, "recordings", rec.id);
      await setDoc(docRef, {
        ...rec,
        savedAt: new Date().toISOString()
      });
      showToast(`Saved "${rec.title}" to Cloud Firestore!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save recording to Firestore', 'warn');
    }
  };

  const handleDeleteRecording = (id: string) => {
    const updated = recordings.filter(r => r.id !== id);
    if (updated.length === 0) {
      showToast('Cannot delete last remaining recording', 'warn');
      return;
    }
    setRecordings(updated);
    if (activeRecordingId === id) {
      setActiveRecordingId(updated[0].id);
    }
    showToast('Deleted gesture recording', 'info');
  };

  const handleExportRecordingJSON = (rec: GestureRecording) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rec, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${rec.title.toLowerCase().replace(/\s+/g, '_')}_replay.json`);
    dlAnchor.click();
    showToast('Exported gesture recording JSON');
  };

  const handleImportRecordingJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.frames && Array.isArray(parsed.frames)) {
          const newRec: GestureRecording = {
            id: parsed.id || `imported_rec_${Date.now()}`,
            title: parsed.title || file.name.replace(/\.[^/.]+$/, ""),
            label: parsed.label || 'IMPORTED',
            description: parsed.description || 'Imported gesture replay recording.',
            createdAt: parsed.createdAt || new Date().toISOString(),
            durationMs: parsed.durationMs || parsed.frames.length * 33,
            fps: parsed.fps || 30,
            frames: parsed.frames,
            category: parsed.category || 'Imported'
          };
          setRecordings(prev => [newRec, ...prev]);
          setActiveRecordingId(newRec.id);
          showToast(`Imported recording "${newRec.title}" (${newRec.frames.length} frames)`);
        } else {
          showToast('Invalid gesture recording file structure', 'warn');
        }
      } catch (err) {
        showToast('Error reading gesture recording JSON', 'warn');
      }
    };
    reader.readAsText(file);
  };

  // Trim start or end frame
  const handleTrimStartFrame = () => {
    if (!activeRecording || currentFrameIndex === 0) return;
    const trimmedFrames = activeRecording.frames.slice(currentFrameIndex).map((f, i) => ({
      ...f,
      frameIndex: i
    }));
    const updatedRec = { ...activeRecording, frames: trimmedFrames, durationMs: trimmedFrames.length * (1000 / activeRecording.fps) };
    setRecordings(prev => prev.map(r => r.id === activeRecording.id ? updatedRec : r));
    setCurrentFrameIndex(0);
    showToast(`Trimmed ${currentFrameIndex} leading frames`);
  };

  const handleTrimEndFrame = () => {
    if (!activeRecording || currentFrameIndex >= activeRecording.frames.length - 1) return;
    const trimmedFrames = activeRecording.frames.slice(0, currentFrameIndex + 1);
    const updatedRec = { ...activeRecording, frames: trimmedFrames, durationMs: trimmedFrames.length * (1000 / activeRecording.fps) };
    setRecordings(prev => prev.map(r => r.id === activeRecording.id ? updatedRec : r));
    showToast(`Trimmed trailing frames after frame #${currentFrameIndex}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn" id="gesture-replay-root">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-emerald-600 text-white border-emerald-400' 
                : toast.type === 'warn'
                ? 'bg-amber-600 text-white border-amber-400'
                : 'bg-blue-600 text-white border-blue-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#202822] via-[#161c18] to-[#0f1411] text-white p-6 sm:p-8 border border-[#374539] shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c8d7c]/30 text-[#cbdcbc] border border-[#7c8d7c]/40 text-xs font-mono font-bold tracking-wider uppercase">
              <Film className="w-3.5 h-3.5 text-[#cbdcbc]" />
              <span>Multi-Frame Motion Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gesture Replay & Frame Analysis System
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Record, inspect, scrub, and analyze hand landmark gesture trajectories frame-by-frame. Includes 3D isometric rotatable views, keypoint metric calculators, and filmstrip navigation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/5 backdrop-blur-md p-2.5 rounded-2xl border border-white/10">
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportRecordingJSON} className="hidden" />
            </label>

            <button
              onClick={() => handleExportRecordingJSON(activeRecording)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Active</span>
            </button>

            {currentUser && (
              <button
                onClick={() => handleSaveRecordingToCloud(activeRecording)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7c8d7c] hover:bg-[#6c7d6c] text-white text-xs font-bold shadow-md transition-all"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Sync Cloud</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Library Sidebar + Right Playback & Frame Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDEBAR: Saved Recordings List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] p-5 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7c8d7c]" />
                <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                  Gesture Library ({recordings.length})
                </h2>
              </div>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recordings..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#7c8d7c]"
              />
            </div>

            {/* Recordings Item List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {recordings
                .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(rec => {
                  const isActive = rec.id === activeRecordingId;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => setActiveRecordingId(rec.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-[#7c8d7c]/10 border-[#7c8d7c] shadow-sm ring-1 ring-[#7c8d7c]/40'
                          : 'bg-[#f8f9f6] dark:bg-[#202024] border-[#e0e4db] dark:border-[#2d2d32] hover:border-[#7c8d7c]/50'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-[#7c8d7c] dark:bg-[#4a5c4e] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                            {rec.label}
                          </span>
                          <h3 className="font-bold text-xs text-neutral-800 dark:text-neutral-200 truncate">
                            {rec.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Film className="w-3 h-3 text-neutral-400" />
                            {rec.frames?.length || 0} frames
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            {((rec.durationMs || 0) / 1000).toFixed(1)}s ({rec.fps || 30} FPS)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportRecordingJSON(rec);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-black/5 transition-all"
                          title="Export Recording JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecording(rec.id);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                          title="Delete Recording"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Shortcuts & Controls Cheat Sheet */}
          <div className="bg-[#f8f9f6] dark:bg-[#18181b] rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] p-4 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-neutral-800 dark:text-neutral-200">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Keyboard Controls</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
              <div className="bg-white dark:bg-[#202024] p-2 rounded-xl border border-[#e0e4db] dark:border-[#2d2d32]">
                <strong className="text-[#7c8d7c]">Space:</strong> Play / Pause
              </div>
              <div className="bg-white dark:bg-[#202024] p-2 rounded-xl border border-[#e0e4db] dark:border-[#2d2d32]">
                <strong className="text-[#7c8d7c]">Left/Right:</strong> Step 1 Frame
              </div>
              <div className="bg-white dark:bg-[#202024] p-2 rounded-xl border border-[#e0e4db] dark:border-[#2d2d32]">
                <strong className="text-[#7c8d7c]">Home:</strong> Jump to Start
              </div>
              <div className="bg-white dark:bg-[#202024] p-2 rounded-xl border border-[#e0e4db] dark:border-[#2d2d32]">
                <strong className="text-[#7c8d7c]">End:</strong> Jump to End
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT MAIN PANEL: Playback Screen, Filmstrip, and Keypoint Inspector */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. PLAYBACK CANVAS CARD */}
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] p-6 shadow-sm space-y-5">
            
            {/* Playback Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-[#7c8d7c] text-white text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                    {activeRecording.label}
                  </span>
                  <h2 className="font-extrabold text-lg text-neutral-900 dark:text-neutral-100">
                    {activeRecording.title}
                  </h2>
                </div>
                <p className="text-xs text-neutral-500">
                  {activeRecording.description || 'Recorded gesture sequence analysis'}
                </p>
              </div>

              {/* View Mode Toggles (2D vs 3D Orbit, Trajectory) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTrajectory(t => !t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    showTrajectory 
                      ? 'bg-[#7c8d7c]/10 text-[#7c8d7c] border-[#7c8d7c]' 
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-transparent'
                  }`}
                  title="Toggle Joint Motion Trajectory Trails"
                >
                  <CircleDot className="w-3.5 h-3.5" />
                  <span>Trails</span>
                </button>

                <button
                  onClick={() => setShow3DView(v => !v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    show3DView 
                      ? 'bg-purple-500/10 text-purple-600 border-purple-400' 
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-transparent'
                  }`}
                  title="Toggle Rotatable 3D Orbit View"
                >
                  <Move3D className="w-3.5 h-3.5" />
                  <span>3D Orbit</span>
                </button>
              </div>
            </div>

            {/* Replay Canvas Stage */}
            <div 
              className="relative aspect-video bg-[#0f1410] rounded-2xl overflow-hidden border border-[#2d372e] shadow-inner select-none cursor-grab active:cursor-grabbing"
              onMouseDown={handleOrbitMouseDown}
              onMouseMove={handleOrbitMouseMove}
              onMouseUp={handleOrbitMouseUp}
              onMouseLeave={handleOrbitMouseUp}
            >
              <canvas
                ref={mainCanvasRef}
                width={640}
                height={360}
                className="w-full h-full object-contain block"
              />

              {/* OSD (On-Screen Display) Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white font-mono text-xs font-bold border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Frame #{currentFrameIndex + 1} / {activeRecording.frames.length}</span>
                </div>
                {currentFrame?.predictedChar && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600/80 backdrop-blur-md text-white font-mono text-xs font-bold border border-emerald-400">
                    <span>Recognized:</span>
                    <span className="text-amber-300 font-extrabold text-sm">{currentFrame.predictedChar}</span>
                    <span className="text-[10px] text-emerald-100">({Math.round((currentFrame.confidence || 0.9) * 100)}%)</span>
                  </div>
                )}
              </div>

              {show3DView && (
                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-neutral-300 font-mono text-[10px]">
                  Drag canvas to rotate 3D orbit (X: {Math.round(orbitAngle.x)}°, Y: {Math.round(orbitAngle.y)}°)
                </div>
              )}

              {/* Frame Timestamp OSD Right */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white font-mono text-xs font-bold border border-white/10">
                {currentFrame ? `${(currentFrame.timestampOffsetMs / 1000).toFixed(2)}s` : '0.00s'} / {((activeRecording.durationMs || 0) / 1000).toFixed(2)}s
              </div>
            </div>

            {/* TIMELINE SCRUBBER BAR */}
            <div className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, activeRecording.frames.length - 1)}
                  value={currentFrameIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentFrameIndex(parseInt(e.target.value, 10));
                  }}
                  className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#7c8d7c]"
                />
              </div>

              {/* TRANSPORT CONTROLS ROW */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                
                {/* Left: Playback Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setIsPlaying(false); setCurrentFrameIndex(0); }}
                    className="p-2 rounded-xl bg-[#f0f2ee] dark:bg-[#202024] hover:bg-[#e0e4db] text-neutral-700 dark:text-neutral-300 transition-all"
                    title="Jump to Start (Home)"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { setIsPlaying(false); setCurrentFrameIndex(p => Math.max(0, p - 1)); }}
                    className="p-2 rounded-xl bg-[#f0f2ee] dark:bg-[#202024] hover:bg-[#e0e4db] text-neutral-700 dark:text-neutral-300 transition-all"
                    title="Previous Frame (Left Arrow)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(p => !p)}
                    className="px-5 py-2.5 rounded-2xl bg-[#7c8d7c] hover:bg-[#6c7d6c] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Play Replay</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => { setIsPlaying(false); setCurrentFrameIndex(p => Math.min(activeRecording.frames.length - 1, p + 1)); }}
                    className="p-2 rounded-xl bg-[#f0f2ee] dark:bg-[#202024] hover:bg-[#e0e4db] text-neutral-700 dark:text-neutral-300 transition-all"
                    title="Next Frame (Right Arrow)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { setIsPlaying(false); setCurrentFrameIndex(activeRecording.frames.length - 1); }}
                    className="p-2 rounded-xl bg-[#f0f2ee] dark:bg-[#202024] hover:bg-[#e0e4db] text-neutral-700 dark:text-neutral-300 transition-all"
                    title="Jump to End (End)"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Right: Speed & Loop & Frame Trimming Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Speed Selector */}
                  <div className="flex items-center bg-[#f0f2ee] dark:bg-[#202024] p-1 rounded-2xl border border-[#e0e4db] dark:border-[#2d2d32]">
                    {[0.25, 0.5, 1.0, 2.0].map(speed => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                          playbackSpeed === speed 
                            ? 'bg-white dark:bg-[#2d2d32] text-[#7c8d7c] dark:text-[#cbdcbc] shadow-sm' 
                            : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  {/* Loop Toggle */}
                  <button
                    onClick={() => setIsLooping(l => !l)}
                    className={`p-2 rounded-xl border transition-all ${
                      isLooping 
                        ? 'bg-[#7c8d7c]/10 text-[#7c8d7c] border-[#7c8d7c]' 
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-transparent'
                    }`}
                    title={isLooping ? 'Looping Enabled' : 'Looping Disabled'}
                  >
                    <Repeat className="w-4 h-4" />
                  </button>

                  {/* Frame Trimming Tools */}
                  <button
                    onClick={handleTrimStartFrame}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-amber-500/20 transition-all"
                    title="Trim All Frames Before Current Frame"
                  >
                    <Scissors className="w-3 h-3" />
                    <span>Trim Start</span>
                  </button>

                  <button
                    onClick={handleTrimEndFrame}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-amber-500/20 transition-all"
                    title="Trim All Frames After Current Frame"
                  >
                    <Scissors className="w-3 h-3" />
                    <span>Trim End</span>
                  </button>
                </div>

              </div>
            </div>

          </div>

          {/* 2. FRAME-BY-FRAME FILMSTRIP CAROUSEL */}
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#7c8d7c]" />
                <h3 className="font-bold text-xs uppercase text-neutral-800 dark:text-neutral-200 tracking-wider">
                  Frame Filmstrip Carousel ({activeRecording.frames.length} frames)
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">
                Click frame to jump directly
              </span>
            </div>

            {/* Horizontal Scrollable Frames Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {activeRecording.frames.map((frame, idx) => {
                const isCurrent = idx === currentFrameIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentFrameIndex(idx);
                    }}
                    className={`flex-shrink-0 w-24 p-2 rounded-2xl border transition-all cursor-pointer text-center space-y-1.5 ${
                      isCurrent 
                        ? 'bg-[#7c8d7c] text-white border-[#7c8d7c] shadow-md scale-105 ring-2 ring-[#7c8d7c]/40' 
                        : 'bg-[#f8f9f6] dark:bg-[#202024] border-[#e0e4db] dark:border-[#2d2d32] hover:border-[#7c8d7c]'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold">
                      #{idx + 1}
                    </div>

                    {/* Miniature frame dot indicator */}
                    <div className="h-10 bg-black/40 rounded-xl flex items-center justify-center font-mono text-[9px] font-bold text-emerald-400">
                      {frame.predictedChar || 'G'}
                    </div>

                    <div className="text-[9px] font-mono opacity-80">
                      {(frame.timestampOffsetMs / 1000).toFixed(2)}s
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. DETAILED 21-JOINT KEYPOINT INSPECTOR & MEASUREMENT CALCULATOR */}
          <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-[#e0e4db] dark:border-[#2d2d32] p-6 shadow-sm space-y-5">
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#7c8d7c]" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                  Frame #{currentFrameIndex + 1} Biomechanical Joint Inspector
                </h3>
              </div>

              {/* Joint Selector Measure Tool */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-neutral-600 dark:text-neutral-400">Measure Distance:</span>
                <select
                  value={selectedJoint1}
                  onChange={(e) => setSelectedJoint1(parseInt(e.target.value, 10))}
                  className="px-2.5 py-1 rounded-xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] font-mono text-xs font-bold"
                >
                  {JOINT_NAMES.map((name, i) => (
                    <option key={i} value={i}>{name}</option>
                  ))}
                </select>
                <span className="text-neutral-400">to</span>
                <select
                  value={selectedJoint2}
                  onChange={(e) => setSelectedJoint2(parseInt(e.target.value, 10))}
                  className="px-2.5 py-1 rounded-xl bg-[#f8f9f6] dark:bg-[#202024] border border-[#e0e4db] dark:border-[#2d2d32] font-mono text-xs font-bold"
                >
                  {JOINT_NAMES.map((name, i) => (
                    <option key={i} value={i}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculated Metrics Banner */}
            {jointMetrics && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#f8f9f6] dark:bg-[#202024] p-4 rounded-2xl border border-[#e0e4db] dark:border-[#2d2d32]">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Inter-Joint Distance</p>
                  <p className="text-base font-black font-mono text-[#7c8d7c] dark:text-[#a8c3a8]">
                    {jointMetrics.distanceNormalized} <span className="text-xs font-normal text-neutral-400">units</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Index Knuckle Flex Angle</p>
                  <p className="text-base font-black font-mono text-amber-500">
                    {jointMetrics.indexFlexAngle}°
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Delta (ΔX, ΔY, ΔZ)</p>
                  <p className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                    X:{jointMetrics.dx}, Y:{jointMetrics.dy}, Z:{jointMetrics.dz}
                  </p>
                </div>
              </div>
            )}

            {/* Keypoint Coordinates Table */}
            <div className="overflow-x-auto max-h-72 border border-[#e0e4db] dark:border-[#2d2d32] rounded-2xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#f8f9f6] dark:bg-[#202024] text-neutral-500 font-bold uppercase tracking-wider sticky top-0 border-b border-[#e0e4db] dark:border-[#2d2d32]">
                  <tr>
                    <th className="px-4 py-2.5">Joint ID & Name</th>
                    <th className="px-4 py-2.5">X (Normalized)</th>
                    <th className="px-4 py-2.5">Y (Normalized)</th>
                    <th className="px-4 py-2.5">Z (Depth)</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e4db] dark:divide-[#2d2d32]">
                  {currentFrame?.landmarks?.map((pt, idx) => {
                    const isSelected = idx === selectedJoint1 || idx === selectedJoint2;
                    return (
                      <tr 
                        key={idx}
                        className={`hover:bg-[#f8f9f6]/60 dark:hover:bg-white/5 transition-all ${
                          isSelected ? 'bg-[#7c8d7c]/10 font-bold' : ''
                        }`}
                      >
                        <td className="px-4 py-2 font-bold text-neutral-800 dark:text-neutral-200">
                          {JOINT_NAMES[idx] || `Joint #${idx}`}
                        </td>
                        <td className="px-4 py-2 text-emerald-600 dark:text-emerald-400">
                          {pt.x.toFixed(4)}
                        </td>
                        <td className="px-4 py-2 text-blue-600 dark:text-blue-400">
                          {pt.y.toFixed(4)}
                        </td>
                        <td className="px-4 py-2 text-purple-600 dark:text-purple-400">
                          {(pt.z || 0).toFixed(4)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded bg-[#7c8d7c] text-white text-[10px] font-bold">
                              Selected
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-[10px]">Tracked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
