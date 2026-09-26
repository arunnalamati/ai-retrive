import React, { useState, useEffect, useRef } from 'react';

/**
 * Voice Input Component (Milestone 3.3)
 * Uses Web Speech API SpeechRecognition / webkitSpeechRecognition to capture voice inquiries.
 * States: Idle, Listening, Processing, Error
 * Transcribes spoken inquiry directly into the query input for user review.
 */
export default function VoiceInput({ onTranscript, onFinalResult, isInputDisabled = false }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  // Store SpeechRecognition instance and session flags in refs
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);
  const hasDispatchedFinalRef = useRef(false);

  // Keep latest callback references without triggering recognition re-creation
  const onTranscriptRef = useRef(onTranscript);
  const onFinalResultRef = useRef(onFinalResult);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onFinalResultRef.current = onFinalResult;
  });

  // Initialize SpeechRecognition only ONCE on mount
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isStartingRef.current = false;
      isListeningRef.current = true;
      setStatus('listening');
      setErrorMessage('');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      // Interim speech preview directly in the query input
      if (interimTranscript && onTranscriptRef.current) {
        onTranscriptRef.current(interimTranscript);
      }

      // Final recognized text sent only after recognition produces a final result
      if (finalTranscript && !hasDispatchedFinalRef.current) {
        hasDispatchedFinalRef.current = true;
        const trimmed = finalTranscript.trim();
        setStatus('processing');

        if (onTranscriptRef.current) {
          onTranscriptRef.current(trimmed);
        }
        if (onFinalResultRef.current) {
          onFinalResultRef.current(trimmed);
        }
      }
    };

    recognition.onerror = (event) => {
      const error = event.error;
      console.warn('Speech recognition error event:', error);
      isStartingRef.current = false;

      // 9 & 10: Treat "aborted" as a recoverable interruption, NOT a fatal error
      if (error === 'aborted') {
        isListeningRef.current = false;
        setStatus('idle');
        setErrorMessage('');
        return;
      }

      // No speech detected
      if (error === 'no-speech') {
        isListeningRef.current = false;
        setStatus('idle');
        setErrorMessage('No speech detected. Please try speaking again.');
        return;
      }

      // Explicit permission or network errors
      isListeningRef.current = false;
      setStatus('error');
      if (error === 'not-allowed' || error === 'permission-denied') {
        setErrorMessage('Microphone permission is required.');
      } else if (error === 'network') {
        setErrorMessage('Network error during speech recognition.');
      } else {
        setErrorMessage(`Voice error: ${error}`);
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      isStartingRef.current = false;
      // Revert status to idle if it was listening or processing
      setStatus((prev) => (prev === 'listening' || prev === 'processing' ? 'idle' : prev));
    };

    recognitionRef.current = recognition;

    // Component unmount cleanup: remove handlers before aborting to avoid state updates on unmounted component
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (_) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) {
      setErrorMessage('Speech recognition is not supported in this browser.');
      setStatus('error');
      return;
    }

    // 1. Guard & Toggle: if already actively listening, user explicitly clicked Stop
    if (isListeningRef.current) {
      isListeningRef.current = false;
      isStartingRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setStatus('idle');
      return;
    }

    // 11 & 12. Guard against multiple start calls while already starting
    if (isStartingRef.current) {
      return;
    }

    setErrorMessage('');
    hasDispatchedFinalRef.current = false;
    isStartingRef.current = true;

    // 13. Safely start new recognition session
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
      isStartingRef.current = false;
      isListeningRef.current = false;
      // Safely reset existing session without crash or infinite restart loop
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      setStatus('idle');
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'listening':
        return (
          <>
            <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Listening...</span>
          </>
        );
      case 'processing':
        return (
          <>
            <span>⏳</span>
            <span>Transcribing...</span>
          </>
        );
      case 'error':
        return (
          <>
            <span>⚠️</span>
            <span>Voice Error</span>
          </>
        );
      case 'idle':
      default:
        return (
          <>
            <span>🎤</span>
            <span>Voice</span>
          </>
        );
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
      <button
        type="button"
        id="voice-input-btn"
        className={`btn-secondary ${status === 'listening' ? 'voice-listening' : ''}`}
        onClick={toggleListening}
        disabled={isInputDisabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          cursor: isInputDisabled ? 'not-allowed' : 'pointer',
          background: status === 'listening' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.6)',
          borderColor: status === 'listening' ? '#ef4444' : 'var(--border-subtle)',
          transition: 'all 0.2s ease'
        }}
        title={!isSupported ? 'Speech recognition unsupported' : status === 'listening' ? 'Click to stop listening' : 'Click to speak your inquiry'}
      >
        {getButtonContent()}
      </button>

      {errorMessage && (
        <div style={{ fontSize: '11px', color: '#f87171', maxWidth: '280px', lineHeight: 1.3 }}>
          {errorMessage}
        </div>
      )}
    </div>
  );
}
