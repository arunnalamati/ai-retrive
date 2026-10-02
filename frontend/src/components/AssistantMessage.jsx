import React from 'react';
import ConfidenceBadge from './ConfidenceBadge';
import TextToSpeech from './TextToSpeech';
import TransparencyPanel from './TransparencyPanel';
import ClarificationCard from './ClarificationCard';

/**
 * AssistantMessage Component
 * Displays AI assistant conversational turn with TTS, Confidence, and Transparency Evidence.
 */
export default function AssistantMessage({
  message,
  isLatest = false,
  onSubmitClarification,
  isLoading = false
}) {
  const {
    response,
    confidence = 'Low',
    sources = [],
    transparency,
    clarification_required = false,
    clarification,
    active_topic,
    knowledge_gap = false
  } = message;

  return (
    <div className="chat-message assistant-message-wrapper" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
      <div
        className="assistant-message-bubble"
        style={{
          maxWidth: '92%',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '18px 18px 18px 4px',
          padding: '18px 22px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          color: '#f1f5f9'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🤖</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              AI Assistant
            </span>
            {active_topic && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.25)'
                }}
              >
                Topic: {active_topic}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ConfidenceBadge confidence={confidence} />
            {response && <TextToSpeech text={response} />}
          </div>
        </div>

        {/* If awaiting clarification */}
        {clarification_required ? (
          <ClarificationCard
            clarificationData={
              clarification || {
                clarification_question: response,
                original_query: message.query
              }
            }
            onSubmitClarification={onSubmitClarification}
            isLoading={isLoading}
          />
        ) : (
          <>
            {/* Generated Response */}
            <div
              style={{
                fontSize: '15px',
                lineHeight: '1.7',
                color: '#f8fafc',
                whiteSpace: 'pre-wrap',
                marginBottom: '14px'
              }}
            >
              {response}
            </div>

            {/* Response Grounding Transparency Panel */}
            {transparency && (
              <TransparencyPanel responseData={message} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
