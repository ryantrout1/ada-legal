/**
 * useSpeechOutput — text-to-speech via the browser's SpeechSynthesis API.
 *
 * A blind user or one with visual-processing difficulty shouldn't need
 * a screen reader to hear what Ada is saying — Ada can speak directly.
 * Opt-in via a toggle; remembered per-session via localStorage so the
 * user doesn't have to re-enable it every page load.
 *
 * Browser support:
 *   - All modern browsers including mobile (Chrome, Safari, Edge, Firefox)
 *   - Voice selection varies by platform; we use the default unless
 *     a specific voice was chosen.
 *
 * If the API isn't available, isSupported returns false and the UI
 * should hide the toggle rather than showing a dead one.
 *
 * Ref: docs/ARCHITECTURE.md §15 accessibility
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'ada2-tts-enabled';

export interface SpeechOutputState {
  /** SpeechSynthesis API is available. */
  isSupported: boolean;
  /** User has opted in to TTS (persisted). */
  enabled: boolean;
  /** Currently speaking something. */
  speaking: boolean;
  /** Toggle TTS on/off. Cancels any in-flight speech if turned off. */
  setEnabled: (on: boolean) => void;
  /** Speak the given text. No-op if disabled or unsupported. */
  speak: (text: string) => void;
  /** Stop speaking immediately. */
  cancel: () => void;
}

function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function loadStoredPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistPreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // localStorage disabled — session-only preference is still fine.
  }
}

export function useSpeechOutput(): SpeechOutputState {
  const supported = isSpeechSupported();
  const [enabled, setEnabledState] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (!supported) return;
    setEnabledState(loadStoredPreference());
  }, [supported]);

  // Keep speaking state in sync with the API's actual status. Chrome's
  // speechSynthesis has quirks where onend doesn't always fire on
  // cancel(), so we poll conservatively.
  useEffect(() => {
    if (!supported) return;
    const interval = setInterval(() => {
      const isActuallySpeaking = window.speechSynthesis.speaking;
      setSpeaking((prev) => (prev !== isActuallySpeaking ? isActuallySpeaking : prev));
    }, 250);
    return () => clearInterval(interval);
  }, [supported]);

  // Cancel any pending speech on unmount so we don't leave Ada talking
  // to an empty page after the user navigates away.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  const setEnabled = useCallback(
    (on: boolean) => {
      setEnabledState(on);
      persistPreference(on);
      if (!on && supported) {
        window.speechSynthesis.cancel();
      }
    },
    [supported],
  );

  const lastSpokenRef = useRef<string>('');

  const speak = useCallback(
    (text: string) => {
      if (!supported || !enabled) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      // Dedupe — React's strict mode + conversation state updates can
      // trigger the same text twice in quick succession.
      if (trimmed === lastSpokenRef.current && window.speechSynthesis.speaking) {
        return;
      }
      lastSpokenRef.current = trimmed;

      // Cancel anything currently queued before speaking. This gives
      // the user "here's the latest thing Ada said" rather than a
      // backlog of old messages.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmed);
      // A slightly slower default rate is friendlier to cognitive
      // accessibility. Users can install platform voices they prefer
      // and those override the default.
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [supported, enabled],
  );

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return {
    isSupported: supported,
    enabled,
    speaking,
    setEnabled,
    speak,
    cancel,
  };
}
