import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'unmesh-portfolio-sound';

type SoundListener = () => void;

const listeners = new Set<SoundListener>();
let audioCtx: AudioContext | null = null;
let unlocked = false;

function readInitialEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'off') return false;
    return true;
  } catch {
    return true;
  }
}

let soundEnabled = readInitialEnabled();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function unlockSpatialAudio() {
  if (unlocked || !soundEnabled) return;
  unlocked = true;
  getAudioContext();
}

if (typeof window !== 'undefined') {
  const handleFirstGesture = () => {
    unlockSpatialAudio();
    window.removeEventListener('pointerdown', handleFirstGesture);
    window.removeEventListener('keydown', handleFirstGesture);
  };
  window.addEventListener('pointerdown', handleFirstGesture, { passive: true, once: true });
  window.addEventListener('keydown', handleFirstGesture, { passive: true, once: true });
}

export function setSpatialSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Ignore storage errors in restricted environments
  }
  if (enabled) {
    getAudioContext();
  }
  emitChange();
}

export function toggleSpatialSound() {
  setSpatialSoundEnabled(!soundEnabled);
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Ultra-subtle Apple-style glass micro-tap for primary controls and toggles.
 */
export function playSpatialTap() {
  if (!soundEnabled || prefersReducedMotion()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.028);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.024, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.036);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Ignore Web Audio errors when autoplay is blocked
  }
}

/**
 * Soft harmonic glass shift for spatial route/tab transitions.
 */
export function playSpatialSwitch() {
  if (!soundEnabled || prefersReducedMotion()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.048);

    harmonic.type = 'triangle';
    harmonic.frequency.setValueAtTime(1040, now);
    harmonic.frequency.exponentialRampToValueAtTime(1320, now + 0.048);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.02, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    harmonic.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    harmonic.start(now);
    osc.stop(now + 0.065);
    harmonic.stop(now + 0.065);
  } catch {
    // Ignore Web Audio errors
  }
}

/**
 * Subtle ascending/descending glass shimmer for modal open and close.
 */
export function playSpatialModal(open: boolean) {
  if (!soundEnabled || prefersReducedMotion()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (open) {
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.06);
    } else {
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.055);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.02, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.075);
  } catch {
    // Ignore Web Audio errors
  }
}

function subscribe(listener: SoundListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return soundEnabled;
}

export function useSpatialAudio() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, () => true);
  return {
    soundEnabled: enabled,
    toggleSound: toggleSpatialSound,
    setSoundEnabled: setSpatialSoundEnabled,
    playTap: playSpatialTap,
    playSwitch: playSpatialSwitch,
    playModal: playSpatialModal,
  };
}
