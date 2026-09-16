import React, { useState } from 'react';
import ConfidenceBadge from './ConfidenceBadge';
import Sources from './Sources';

export default function ResponsePanel({ responseData }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!responseData) return null;

  const { response, confidence, sources, retrieval } = responseData;
  const isNoInfo = 
    retrieval?.no_sufficient_information || 
    response?.toLowerCase().includes("couldn't find sufficient information");

  // Web Speech API Text-to-Speech
  const handleReadResponse = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(response);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="response-container">
      <div className="response-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            AI Response
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ConfidenceBadge confidence={confidence} />
          <span className="response-badge">
            {isNoInfo ? '⚠️ No Information' : '✓ Grounded Response'}
          </span>
        </div>
      </div>

      <div className="response-body">
        {response}
      </div>

      <div className="response-footer">
        <button
          className="btn-secondary"
          onClick={handleReadResponse}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          {isSpeaking ? '⏹️ Stop Reading' : '🔊 Read Response'}
        </button>

        <Sources sources={sources} />
      </div>
    </div>
  );
}
