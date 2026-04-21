/**
 * useSpeechInput — dictation via the browser's Web Speech API.
 *
 * For users who cannot type — motor impairment, vision impairment,
 * severe pain, or anyone who simply finds dictation easier. No external
 * service, no network call, no API key. Runs entirely in the browser.
 *
 * Browser support:
 *   - Chrome, Edge: yes (webkitSpeechRecognition)
 *   - Safari: yes (14+)
 *   - Firefox: no (as of 2026)
 *   - Mobile Safari, Chrome Android: yes
 *
 * If the API isn't available, isSupported returns false and the UI
 * should hide the microphone button rather than showing a dead one.
 *
 * Ref: docs/ARCHITECTURE.md §15 accessibility
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The Web Speech API types aren't in the default TS lib. These are the
 * minimal shapes we actually use. Everything else is `any`-adjacent and
 * we just don't touch it.
 */
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult:
    | ((this: SpeechRecognitionLike, ev: SpeechRecognitionEventLike) => unknown)
    | null;
  onerror:
    | ((
        this: SpeechRecognitionLike,
        ev: SpeechRecognitionErrorEventLike,
      ) => unknown)
    | null;
  onend: ((this: SpeechRecognitionLike, ev: Event) => unknown) | null;
  onstart: ((this: SpeechRecognitionLike, ev: Event) => unknown) | null;
}

function getSpeechRecognitionConstructor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface SpeechInputState {
  /** The Speech Recognition API is available on this platform. */
  isSupported: boolean;
  /** Mic is currently open + listening. */
  listening: boolean;
  /** Transcribed text so far, including interim (not-yet-final) chunks. */
  transcript: string;
  /** Most recent error code, if any. Cleared on next start(). */
  error: string | null;
  /** Open the mic and start listening. */
  start: () => void;
  /** Stop listening (commits any in-flight transcript). */
  stop: () => void;
  /** Cancel without committing. Used on explicit dismissal. */
  cancel: () => void;
  /** Wipe transcript (e.g., after message is sent). */
  reset: () => void;
}

interface Options {
  /**
   * Language for dictation. Defaults to the browser's language setting,
   * falling back to 'en-US'. Users can override by passing e.g. 'es-US'.
   */
  lang?: string;
}

export function useSpeechInput(opts: Options = {}): SpeechInputState {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTextRef = useRef<string>('');

  const isSupported = getSpeechRecognitionConstructor() !== null;

  // Lazily create the recognition instance. We don't need it until
  // start() is called for the first time.
  const getRecognition = useCallback((): SpeechRecognitionLike | null => {
    if (recognitionRef.current) return recognitionRef.current;
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang =
      opts.lang ??
      (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

    rec.onresult = (event) => {
      // The API streams results cumulatively. Anything marked isFinal
      // gets locked into finalTextRef; the rest is interim and gets
      // replaced each tick.
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalTextRef.current = (finalTextRef.current + ' ' + text).trim();
        } else {
          interim += text;
        }
      }
      const combined =
        finalTextRef.current && interim
          ? finalTextRef.current + ' ' + interim
          : finalTextRef.current || interim;
      setTranscript(combined);
    };

    rec.onerror = (event) => {
      // Common codes: 'no-speech', 'audio-capture', 'not-allowed',
      // 'network', 'aborted'. 'aborted' is not really an error — it's
      // what we see when the UI calls stop/cancel — so suppress it.
      if (event.error !== 'aborted') {
        setError(event.error);
      }
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.onstart = () => {
      setListening(true);
    };

    recognitionRef.current = rec;
    return rec;
  }, [opts.lang]);

  const start = useCallback(() => {
    const rec = getRecognition();
    if (!rec) return;
    setError(null);
    // If we were already listening, do nothing.
    if (listening) return;
    // Don't wipe any committed text — the user may be adding to it.
    try {
      rec.start();
    } catch (err) {
      // Starting while already started throws InvalidStateError.
      // That's fine; ignore.
      void err;
    }
  }, [getRecognition, listening]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.abort();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    finalTextRef.current = '';
    setTranscript('');
    setError(null);
  }, []);

  // On unmount, stop and free the recognition object so we don't leak
  // the mic stream.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return {
    isSupported,
    listening,
    transcript,
    error,
    start,
    stop,
    cancel,
    reset,
  };
}
