import React, { useState, useEffect, useRef } from 'react';
import ConfidenceBadge from './ConfidenceBadge';
import TextToSpeech from './TextToSpeech';
import TransparencyPanel from './TransparencyPanel';
import ClarificationCard from './ClarificationCard';
import VoiceInput from './VoiceInput';

/**
 * Modern Chat Interface (Milestone 4 Chat UI)
 *
 * Architecture:
 * TOP: Compact Active Topic banner & session reset
 * MIDDLE: Scrollable conversation area with distinct User & Assistant message bubbles
 * BOTTOM: Fixed/sticky chat input area with Voice & Send controls
 */
export default function ChatInterface({
  conversationHistory = [],
  activeTopic = null,
  onSendMessage,
  onSubmitClarification,
  isLoading = false,
  topK = 3,
  setTopK,
  onResetSession,
  pipelineState,
  errorMessage = ''
}) {
  const [inputText, setInputText] = useState('');
  const [expandedEvidenceTurn, setExpandedEvidenceTurn] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom whenever new messages arrive or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, isLoading]);

  // Adjust textarea height dynamically
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  const handleFormSubmit = (e) => {
    e?.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isLoading) return;

    onSendMessage(cleanText, 'text');
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleVoiceTranscript = (transcriptText) => {
    if (transcriptText && transcriptText.trim()) {
      setInputText(transcriptText.trim());
    }
  };

  const sampleSuggestions = [
    { label: '📚 Library Policy', query: 'How many books can a student borrow?' },
    { label: '🏢 Hostel Fee & Refund', query: 'What is the hostel fee and refund policy?' },
    { label: '📝 Exam Attendance', query: 'What is the minimum attendance requirement for exams?' },
    { label: '🔄 Book Renewal', query: 'What is the renewal period for library books?' }
  ];

  return (
    <div className="chat-interface-wrapper">
      {/* ============================================================ */}
      {/* TOP: Compact Active Topic / Knowledge Domain Banner          */}
      {/* ============================================================ */}
      <div className="chat-top-bar glass-card">
        <div className="active-topic-badge-container">
          <span className="topic-icon">💬</span>
          <span className="topic-title">Active Topic:</span>
          <span className="topic-name">
            {activeTopic || 'All Knowledge Domains'}
          </span>
        </div>

        <div className="chat-top-actions">
          {conversationHistory.length > 0 && onResetSession && (
            <button
              type="button"
              className="btn-reset-thread"
              onClick={onResetSession}
              title="Start a new conversation thread"
            >
              <span style={{ fontSize: '13px' }}>🔄</span> New Thread
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MIDDLE: Scrollable Conversation Area                         */}
      {/* ============================================================ */}
      <div className="chat-messages-scroll-area">
        {/* Welcome Empty State */}
        {conversationHistory.length === 0 && (
          <div className="chat-empty-state">
            <div className="empty-state-icon">🤖</div>
            <h3 className="empty-state-title">AI Knowledge Retrieval & Multi-Agent RAG</h3>
            <p className="empty-state-subtitle">
              Ask questions across institutional policies: <strong>College Library Policy</strong>, <strong>Hostel & Accommodation Policy</strong>, and <strong>Academic & Examination Policy</strong>.
            </p>

            <div className="suggestions-grid">
              {sampleSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="suggestion-pill"
                  onClick={() => {
                    setInputText(s.query);
                    onSendMessage(s.query, 'text');
                  }}
                >
                  <span className="suggestion-label">{s.label}</span>
                  <span className="suggestion-query">"{s.query}"</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Render Conversation Turns */}
        {conversationHistory.map((item, index) => {
          const isLatest = index === conversationHistory.length - 1;
          const isEvidenceOpen = expandedEvidenceTurn === index || (isLatest && item.confidence === 'Low');

          return (
            <div key={item.turn_id || index} className="chat-turn-group">
              {/* User Message (Right Aligned) */}
              <div className="user-message-container">
                <div className="user-message-bubble">
                  <div className="message-header user-header">
                    <span className="sender-badge">👤 You</span>
                    {item.query_type && (
                      <span className="query-type-tag">
                        {item.query_type.charAt(0).toUpperCase() + item.query_type.slice(1).replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="user-message-text">{item.query}</div>
                  {item.refined_query && item.refined_query !== item.query && (
                    <div className="context-resolution-pill">
                      <span>🧠 Context Resolved:</span>
                      <em>"{item.refined_query}"</em>
                    </div>
                  )}
                </div>
              </div>

              {/* Clarification Follow-up Card (if applicable and awaiting clarification) */}
              {item.clarification_required && (
                <div className="clarification-turn-container">
                  <ClarificationCard
                    clarificationData={
                      item.clarification || {
                        clarification_question: item.response,
                        original_query: item.query
                      }
                    }
                    onSubmitClarification={onSubmitClarification}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Assistant Message (Left Aligned) */}
              {(!item.clarification_required || !isLatest) && (
                <div className="assistant-message-container">
                  <div className="assistant-message-bubble">
                    <div className="message-header assistant-header">
                      <div className="assistant-identity">
                        <span className="assistant-avatar">🤖</span>
                        <span className="assistant-title">AI Assistant</span>
                        {item.active_topic && (
                          <span className="topic-context-pill">
                            {item.active_topic}
                          </span>
                        )}
                      </div>

                      <div className="assistant-meta-controls">
                        <ConfidenceBadge confidence={item.confidence} />
                        {item.response && <TextToSpeech text={item.response} />}
                      </div>
                    </div>

                    {/* Main Assistant Answer */}
                    <div className="assistant-text-content">
                      {item.response}
                    </div>

                    {/* Evidence & Confidence Transparency Bar */}
                    {item.transparency && (
                      <div className="transparency-section">
                        <button
                          type="button"
                          className="btn-toggle-evidence"
                          onClick={() => setExpandedEvidenceTurn(isEvidenceOpen ? null : index)}
                        >
                          <span>{isEvidenceOpen ? '▼ Hide Evidence' : '▶ View Supporting Evidence'}</span>
                          <span className="evidence-chunk-count">
                            ({item.transparency.supporting_chunks?.length || item.sources?.length || 0} Chunks)
                          </span>
                        </button>

                        {isEvidenceOpen && (
                          <div className="evidence-panel-expanded">
                            <TransparencyPanel responseData={item} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading / Typing State */}
        {isLoading && (
          <div className="assistant-message-container loading-container">
            <div className="assistant-message-bubble loading-bubble">
              <div className="message-header assistant-header">
                <div className="assistant-identity">
                  <span className="assistant-avatar">🤖</span>
                  <span className="assistant-title">AI Assistant is thinking...</span>
                </div>
              </div>
              <div className="typing-indicator-row">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="typing-text">
                  Retrieving knowledge chunks and formulating grounded answer...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="chat-error-banner">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Invisible anchor for automatic scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* ============================================================ */}
      {/* BOTTOM: Fixed/Sticky Chat Input Bar                         */}
      {/* ============================================================ */}
      <div className="chat-input-sticky-footer">
        <form onSubmit={handleFormSubmit} className="chat-input-form glass-card">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              id="main-chat-input"
              rows={1}
              className="chat-textarea"
              placeholder="Ask anything about the indexed documents..."
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />

            <div className="input-action-buttons">
              {/* Voice Input with states */}
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                onSpeechEnd={(transcript) => {
                  if (transcript && transcript.trim()) {
                    setInputText(transcript.trim());
                  }
                }}
                isInputDisabled={isLoading}
              />

              {/* Top-K Chunks Selector */}
              {setTopK && (
                <div className="topk-dropdown-wrapper" title="Select number of vector chunks to retrieve">
                  <span className="topk-label">Top:</span>
                  <select
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    disabled={isLoading}
                    className="topk-select"
                  >
                    <option value={1}>1</option>
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={8}>8</option>
                  </select>
                </div>
              )}

              {/* Send Button */}
              <button
                type="submit"
                id="send-query-btn"
                className="btn-send-message"
                disabled={!inputText.trim() || isLoading}
                title={isLoading ? 'Processing query...' : 'Send message (Enter)'}
              >
                {isLoading ? (
                  <span className="spinner" style={{ width: '14px', height: '14px' }} />
                ) : (
                  <span>➤</span>
                )}
              </button>
            </div>
          </div>

          <div className="input-subtext">
            <span>Press <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for newline</span>
          </div>
        </form>
      </div>
    </div>
  );
}
