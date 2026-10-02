import React, { useState, useEffect, useRef } from 'react';

/**
 * Voice Input Component (Milestone 4.3 Voice Optimization)
 * Uses Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 *
 * Implements strict states:
 * - IDLE
 * - LISTENING
 * - TRANSCRIBING
 * - PROCESSING
 * - ERROR
 *
 * Controls:
 * - Start recording
 * - Stop recording
 * - Restart recording
 *
 * Behavior:
 * - Shows "🎤 Listening..." while recording
 * - Live previews speech into the input field
 * - Validates transcript before handing off
 * - NEVER passes empty or null text to submission
 * - Specific user-friendly feedback on empty speech, recognition failures, or browser incompatibility
 */
export default function VoiceInput({
  onTranscript,
  onSpeechStart,
  onSpeechEnd,
  isInputDisabled = false
}) {
  // States: 'idle' | 'listening' | 'transcribing' | 'processing' | 'error'
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);
  const currentTranscriptRef = useRef('');

  // Keep latest callback references
  const onTranscriptRef = useRef(onTranscript);
  const onSpeechStartRef = useRef(onSpeechStart);
  const onSpeechEndRef = useRef(onSpeechEnd);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onSpeechStartRef.current = onSpeechStart;
    onSpeechEndRef.current = onSpeechEnd;
  });

  // Check browser support and initialize recognition instance
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isStartingRef.current = false;
        isListeningRef.current = true;
        currentTranscriptRef.current = '';
        setStatus('listening');
        setErrorMessage('');
        onSpeechStartRef.current?.();
      };

      recognition.onresult = (event) => {
        setStatus('transcribing');
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item && item[0]) {
            const text = item[0].transcript || '';
            if (item.isFinal) {
              finalTranscript += text;
            } else {
              interimTranscript += text;
            }
          }
        }

        const activeText = (finalTranscript || interimTranscript).trim();
        if (activeText) {
          currentTranscriptRef.current = activeText;
          if (onTranscriptRef.current) {
            onTranscriptRef.current(activeText);
          }
        }
      };

      recognition.onerror = (event) => {
        const error = event.error;
        console.warn('Speech recognition error event:', error);
        isStartingRef.current = false;
        isListeningRef.current = false;

        if (error === 'aborted') {
          setStatus('idle');
          setErrorMessage('');
          return;
        }

        if (error === 'no-speech') {
          setStatus('idle');
          setErrorMessage('Could not detect speech. Please try again.');
          return;
        }

        setStatus('error');
        if (error === 'not-allowed' || error === 'permission-denied') {
          setErrorMessage('Microphone permission is required.');
        } else if (error === 'network') {
          setErrorMessage('Network error during speech recognition.');
        } else {
          setErrorMessage('Speech recognition failed. Please try again.');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        isStartingRef.current = false;
        setStatus('idle');

        const finalRecorded = currentTranscriptRef.current.trim();
        if (!finalRecorded) {
          if (!errorMessage) {
            setErrorMessage('Could not detect speech. Please try again.');
          }
        } else {
          // Valid transcript captured
          setErrorMessage('');
          if (onTranscriptRef.current) {
            onTranscriptRef.current(finalRecorded);
          }
          if (onSpeechEndRef.current) {
            onSpeechEndRef.current(finalRecorded);
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition init failed:', err);
      setIsSupported(false);
    }

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

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) {
      setErrorMessage('Voice input is not supported in this browser.');
      setStatus('error');
      return;
    }
    if (isListeningRef.current || isStartingRef.current) return;

    setErrorMessage('');
    currentTranscriptRef.current = '';
    isStartingRef.current = true;
    setStatus('processing');

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
      isStartingRef.current = false;
      isListeningRef.current = false;
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      setStatus('error');
      setErrorMessage('Speech recognition failed. Please try again.');
    }
  };

  const stopListening = () => {
    if (isListeningRef.current && recognitionRef.current) {
      isListeningRef.current = false;
      isStartingRef.current = false;
      setStatus('processing');
      try {
        recognitionRef.current.stop();
      } catch (_) {
        setStatus('idle');
      }
    }
  };

  const restartListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }
    isListeningRef.current = false;
    isStartingRef.current = false;
    setTimeout(() => {
      startListening();
    }, 150);
  };

  const toggleListening = () => {
    if (status === 'listening' || status === 'transcribing') {
      stopListening();
    } else {
      startListening();
    }
  };

  const renderStatusButton = () => {
    switch (status) {
      case 'listening':
      case 'transcribing':
        return (
          <button
            type="button"
            id="voice-mic-listening-btn"
            className="voice-btn listening"
            onClick={stopListening}
            disabled={isInputDisabled}
            title="Click to stop recording"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              cursor: 'pointer',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#f87171',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444',
                animation: 'pulse 1.2s infinite'
              }}
            />
            <span>🎤 Listening...</span>
          </button>
        );

      case 'processing':
        return (
          <button
            type="button"
            className="voice-btn processing"
            disabled
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              background: 'rgba(100, 116, 139, 0.2)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap'
            }}
          >
            <span className="spinner" style={{ width: '12px', height: '12px' }} />
            <span>Transcribing...</span>
          </button>
        );

      case 'error':
        return (
          <button
            type="button"
            id="voice-mic-error-btn"
            className="voice-btn error"
            onClick={restartListening}
            disabled={isInputDisabled}
            title="Click to restart voice input"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              cursor: 'pointer',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              whiteSpace: 'nowrap'
            }}
          >
            <span>⚠️</span>
            <span>Retry Voice</span>
          </button>
        );

      case 'idle':
      default:
        return (
          <button
            type="button"
            id="voice-mic-btn"
            className="voice-btn idle"
            onClick={startListening}
            disabled={isInputDisabled}
            title={
              !isSupported
                ? 'Voice input is not supported in this browser'
                : 'Speak query via microphone'
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              cursor: isInputDisabled ? 'not-allowed' : 'pointer',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🎤</span>
            <span>Voice</span>
          </button>
        );
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
      {renderStatusButton()}

      {/* When listening, show an explicit Stop & Restart control pill */}
      {(status === 'listening' || status === 'transcribing') && (
        <button
          type="button"
          onClick={restartListening}
          title="Restart speech recognition"
          style={{
            marginLeft: '6px',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🔄
        </button>
      )}

      {/* Floating alert for voice state messages */}
      {errorMessage && (
        <div
          className="voice-error-toast"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            fontSize: '11.5px',
            color: '#fecaca',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            padding: '6px 12px',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>ℹ️</span>
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 0,
              fontSize: '12px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
