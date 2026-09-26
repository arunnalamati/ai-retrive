import React, { useState, useEffect, useRef } from 'react';

/**
 * Text-to-Speech Component (Milestone 3.3)
 * Uses browser Web Speech API SpeechSynthesis to read generated AI responses.
 * Provides Play, Pause, Resume, Stop controls and voice selection.
 */
export default function TextToSpeech({ text }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
        const voiceList = englishVoices.length > 0 ? englishVoices : availableVoices;
        setVoices(voiceList);
        if (voiceList.length > 0 && !selectedVoice) {
          // Prefer natural or default voice
          const defaultV = voiceList.find(v => v.default) || voiceList[0];
          setSelectedVoice(defaultV);
        }
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop playback when the input text changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [text]);

  // Clean raw markdown, citations, and special symbols before speaking
  const cleanTextForSpeech = (raw) => {
    if (!raw) return '';
    return raw
      .replace(/\[\^?\d+\]/g, '') // remove citation marks [1]
      .replace(/https?:\/\/\S+/g, '') // remove urls
      .replace(/[`#*_~>]/g, '') // remove markdown markers
      .replace(/chunk_\d+/gi, '') // remove raw chunk IDs
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handlePlay = () => {
    if (!isSupported) {
      setErrorMsg('Speech synthesis is not supported in this browser.');
      return;
    }
    const clean = cleanTextForSpeech(text);
    if (!clean) {
      setErrorMsg('No response text available to read.');
      return;
    }

    window.speechSynthesis.cancel();
    setErrorMsg('');

    const utterance = new SpeechSynthesisUtterance(clean);
    utteranceRef.current = utterance;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
      setErrorMsg('Speech playback error occurred.');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (window.speechSynthesis && isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  if (!isSupported) {
    return (
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        🔊 Text-to-Speech not supported in this browser.
      </div>
    );
  }

  return (
    <div className="tts-controls" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {!isPlaying && !isPaused ? (
        <button
          onClick={handlePlay}
          className="btn-secondary"
          style={{
            fontSize: '12px',
            padding: '5px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '20px'
          }}
          title="Read AI response aloud"
        >
          <span>🔊</span> Read Response
        </button>
      ) : (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px 8px', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: isPaused ? 'none' : 'pulse 1.2s infinite' }} />
            {isPaused ? 'Paused' : 'Playing'}
          </span>

          {isPaused ? (
            <button
              onClick={handleResume}
              style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}
              title="Resume speech"
            >
              ▶
            </button>
          ) : (
            <button
              onClick={handlePause}
              style={{ background: 'transparent', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}
              title="Pause speech"
            >
              ⏸
            </button>
          )}

          <button
            onClick={handleStop}
            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}
            title="Stop speech"
          >
            ⏹
          </button>
        </div>
      )}

      {voices.length > 1 && (
        <select
          value={selectedVoice?.name || ''}
          onChange={(e) => {
            const v = voices.find(voice => voice.name === e.target.value);
            if (v) setSelectedVoice(v);
          }}
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            fontSize: '11px',
            padding: '3px 8px',
            cursor: 'pointer'
          }}
          title="Select voice"
        >
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name.slice(0, 24)} ({v.lang})
            </option>
          ))}
        </select>
      )}

      {errorMsg && (
        <span style={{ fontSize: '11px', color: '#f87171' }}>
          {errorMsg}
        </span>
      )}
    </div>
  );
}
