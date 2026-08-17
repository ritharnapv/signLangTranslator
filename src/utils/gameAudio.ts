// Web Audio API Sound Generator for Multiplayer Challenge & Game Cues
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playCountdownBeep(isFinal = false): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = isFinal ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isFinal ? 880 : 440, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinal ? 0.35 : 0.18));
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + (isFinal ? 0.4 : 0.2));
  } catch (e) {}
}

export function playPointScored(streak = 1): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Arpeggio chime
    const baseFreq = 523.25; // C5
    const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];
    
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * (1 + (streak > 2 ? 0.1 : 0)), now + idx * 0.05);
      
      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.18);
    });
  } catch (e) {}
}

export function playRoundWin(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    const notes = [587.33, 659.25, 880, 1046.5]; // D5, E5, A5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.32);
    });
  } catch (e) {}
}

export function playRoundLoss(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.3);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.38);
  } catch (e) {}
}

export function playMatchVictory(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Victory fanfare chords
    const chord1 = [523.25, 659.25, 783.99]; // C Major
    const chord2 = [587.33, 739.99, 880.00]; // D Major
    const chord3 = [659.25, 830.61, 987.77]; // E Major
    const chord4 = [1046.50, 1318.51, 1567.98]; // C High Fanfare
    
    const chords = [
      { notes: chord1, start: 0, dur: 0.2 },
      { notes: chord2, start: 0.22, dur: 0.2 },
      { notes: chord3, start: 0.44, dur: 0.25 },
      { notes: chord4, start: 0.72, dur: 0.7 }
    ];
    
    chords.forEach(({ notes, start, dur }) => {
      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);
        
        gain.gain.setValueAtTime(0.15, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
    });
  } catch (e) {}
}

export function playButtonTick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}
