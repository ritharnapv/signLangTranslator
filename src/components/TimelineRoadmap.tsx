import React, { useState } from 'react';
import { MilestoneDay } from '../types';
import { Calendar, CheckCircle2, ChevronRight, Circle, Clock, Info, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

const ROADMAP_DAYS: MilestoneDay[] = [
  {
    day: 1,
    title: "Project Foundation & Gateway Setup",
    focusArea: "Applet Architecture",
    description: "Initialize Vite + React framework integrated with local Express server middleware, camera permission scopes, and fallback AI endpoints.",
    tasks: [
      "Vite React environment setup with Tailwind v4 styling",
      "Express backend routing setup on port 3000",
      "Camera integration permissions schema",
      "JSON structure fallback simulation model",
      "Connect and verify full-stack connection health"
    ],
    status: 'active'
  },
  {
    day: 5,
    title: "Static Sign Dictionary Expansion",
    focusArea: "ASL Vocabulary",
    description: "Incorporate comprehensive dictionary representations for standard alphabets (A-Z) and standard visual guidelines to instruct learners.",
    tasks: [
      "A-Z complete responsive reference grid",
      "Add interactive practicing triggers for active targets",
      "Include key visual cues & thumb posture notes",
      "Add custom illustration cards with Lucide icons"
    ],
    status: 'upcoming'
  },
  {
    day: 10,
    title: "Multimodal Gemini API Deep Integration",
    focusArea: "AI Vision Service",
    description: "Implement direct camera stream frame-by-frame snapshot analysis connected directly with the Google Gemini Multimodal API.",
    tasks: [
      "Construct base64 secure binary packet parser on backend",
      "Implement Gemini-3.5-flash with custom interpreter prompts",
      "Integrate validation schema enforcing JSON responses",
      "Add latency optimizer caching matching signs"
    ],
    status: 'upcoming'
  },
  {
    day: 18,
    title: "Practice Mode Achievements & Multi-frame Sequence",
    focusArea: "Interactive Gamification",
    description: "Launch targeted training goals with active streaks, high score accuracy targets, and basic motion delta capture techniques.",
    tasks: [
      "Generate dynamic letter prompts for user to replicate",
      "Implement multi-shot progress recording",
      "Add scoring system showing visual similarity percentages",
      "Track practice stats to localStorage"
    ],
    status: 'upcoming'
  },
  {
    day: 25,
    title: "Generative Dialogue & Conversational Practice",
    focusArea: "GenAI Tutor Engine",
    description: "Create an AI Conversation Simulator where users learn full sentences and the AI checks for correct conversational sequence structure.",
    tasks: [
      "Incorporate conversational practice prompts via Gemini Chat mode",
      "Implement smart spelling correction routines",
      "Include synthetic feedback coaching voices with TTS Modality",
      "Record learning history logs and metrics"
    ],
    status: 'upcoming'
  },
  {
    day: 30,
    title: "Refinement & Final Cloud Production Ship",
    focusArea: "Polishing & Deployment",
    description: "Optimize build bundling size, clean up CSS transitions, test remote device camera ratios, and deploy to live production containers.",
    tasks: [
      "Execute asset compiling optimization using esbuild",
      "Address frame bottlenecks on low-spec client webcams",
      "Launch live interactive sign dictionary showcase",
      "Distribute app for beta-testing"
    ],
    status: 'upcoming'
  }
];

export default function TimelineRoadmap() {
  const [selectedDay, setSelectedDay] = useState<MilestoneDay>(ROADMAP_DAYS[0]);

  return (
    <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm" id="roadmap-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#f0f2ee] dark:bg-[#1c1c1f] text-[#7c8d7c] dark:text-[#abcbaa] rounded-2xl border border-[#e0e4db] dark:border-[#2d2d32]">
            <Calendar className="w-6 h-6" id="calendar-icon" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2d2d28] dark:text-[#f4f4f5] font-sans tracking-tight">30-Day Development Roadmap</h2>
            <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa]">Interactive design sequence from foundational API mockups to certified real-time ASL scanning</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#f0f2ee] dark:bg-[#152e15]/40 text-[#52a447] dark:text-emerald-400 rounded-full text-xs font-semibold border border-[#e0e4db] dark:border-[#1d4a1d]">
          <span className="w-1.5 h-1.5 bg-[#52a447] dark:bg-emerald-400 rounded-full animate-ping"></span>
          Day 1 Live
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline navigation panel */}
        <div className="lg:col-span-5 space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbarScroll font-sans" id="timeline-navigation">
          {ROADMAP_DAYS.map((milestone) => {
            const isActive = selectedDay.day === milestone.day;
            return (
              <button
                key={milestone.day}
                id={`timeline-btn-${milestone.day}`}
                onClick={() => setSelectedDay(milestone)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                  isActive
                    ? "bg-[#f0f2ee] dark:bg-[#1c1c1f] border-[#7c8d7c] dark:border-[#abcbaa] text-[#2d2d28] dark:text-white shadow-sm"
                    : "bg-[#fdfcf9] dark:bg-[#151518]/60 border-[#ecece0]/80 dark:border-[#2d2d32]/60 hover:bg-[#f0f2ee]/50 dark:hover:bg-neutral-800/40 hover:border-[#7c8d7c]/40 hover:scale-[1.01]"
                }`}
              >
                <div className="mt-1">
                  {milestone.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-[#52a447] dark:text-[#a4dda4]" />
                  ) : milestone.status === 'active' ? (
                    <div className="relative">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[#7c8d7c] opacity-60 animate-ping"></span>
                      <Circle className="w-5 h-5 text-[#7c8d7c] relative fill-[#f0f2ee] dark:fill-[#151518]" />
                    </div>
                  ) : (
                    <Clock className="w-5 h-5 text-[#9a9a8a] dark:text-[#cbd5e1]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold font-mono tracking-widest ${
                      milestone.status === 'active' ? "text-[#7c8d7c] dark:text-emerald-400" : "text-[#7a7a6a] dark:text-[#a1a1aa]"
                    }`}>
                      DAY {milestone.day}
                    </span>
                    <span className="text-[9px] text-[#5a6b5a] dark:text-[#cbdcbc] font-semibold bg-[#e0e4db]/40 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-[#e0e4db]/85 dark:border-emerald-900/40">
                      {milestone.focusArea}
                    </span>
                  </div>
                  <h3 className={`text-sm font-semibold truncate ${isActive ? "text-[#2d2d28] dark:text-white" : "text-[#4a4a40]"}`}>
                    {milestone.title}
                  </h3>
                </div>
                <ChevronRight className={`w-4 h-4 self-center transition-transform ${isActive ? "text-[#7c8d7c] dark:text-[#abcbaa] translate-x-1" : "text-[#9a9a8a] dark:text-zinc-500"}`} />
              </button>
            );
          })}
        </div>

        {/* Milestone Detail Card */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-[#fdfcf9] dark:bg-[#151518] border border-[#e8e4db] dark:border-[#2d2d32] rounded-2xl p-5" id="milestone-details">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-[#ecece0] dark:border-[#2d2d32] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#7c8d7c] dark:text-emerald-400 tracking-wider font-mono">
                  MILESTONE DETAILS • DAY {selectedDay.day}
                </span>
                <h3 className="text-base font-bold text-[#2d2d28] dark:text-[#f4f4f5] mt-1 font-sans">
                  {selectedDay.title}
                </h3>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                selectedDay.status === 'completed'
                  ? "bg-[#ebdcd1] dark:bg-emerald-950/30 text-[#a36b5e] dark:text-emerald-300 border border-[#ebdcd1] dark:border-emerald-900/45"
                  : selectedDay.status === 'active'
                  ? "bg-[#f0f2ee] dark:bg-emerald-950/20 text-[#7c8d7c] dark:text-emerald-400 border border-[#e0e4db] dark:border-emerald-900/40 animate-pulse"
                  : "bg-neutral-100 dark:bg-[#1c1c1f]/40 text-[#9a9a8a] dark:text-[#a1a1aa] border border-neutral-200 dark:border-[#2d2d32]"
              }`}>
                {selectedDay.status.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-[#5c5c50] dark:text-[#d1d5db] leading-relaxed font-sans mb-4">
              {selectedDay.description}
            </p>

            <span className="text-[10px] font-bold text-[#7a7a6a] dark:text-[#a1a1aa] uppercase tracking-widest font-mono block mb-2">
              Deliverables Checkpoint:
            </span>
            <ul className="space-y-2 text-xs text-[#4a4a40] dark:text-[#cbd5e1]" id="roadmap-tasks">
              {selectedDay.tasks.map((task, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${
                    selectedDay.status === 'completed'
                      ? "text-[#52a447] dark:text-[#a4dda4]"
                      : selectedDay.status === 'active' && idx === 0
                      ? "text-[#7c8d7c] dark:text-emerald-400"
                      : "text-neutral-300 dark:text-zinc-650"
                  }`} />
                  <span className={selectedDay.status === 'completed' ? "line-through text-[#7a7a6a] dark:text-zinc-500" : ""}>{task}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t border-[#ecece0] dark:border-[#2d2d22] flex items-center gap-2 text-[#7a7a6a] dark:text-[#a1a1aa] text-[11px] font-sans">
            <Info className="w-4 h-4 text-[#7c8d7c] shrink-0" />
            <span>Select days to read our step-by-step development strategy.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
