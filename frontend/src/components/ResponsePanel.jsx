import React from 'react';
import ConfidenceBadge from './ConfidenceBadge';
import TextToSpeech from './TextToSpeech';
import TransparencyPanel from './TransparencyPanel';
import ClarificationCard from './ClarificationCard';

/**
 * Response Panel & Conversation Flow (Milestone 3)
 * Displays:
 * 1. Conversation turns (User right-aligned, AI left-aligned)
 * 2. Query Analysis badge (e.g. Factual, Procedural)
 * 3. Clarification Card when clarification is required
 * 4. Text-to-Speech audio controls (Play, Pause, Resume, Stop)
 * 5. Response Transparency Panel (Supporting evidence, sources, relevance scores)
 */
export default function ResponsePanel({
  queryResponse,
  conversationHistory = [],
  onSubmitClarification,
  isLoading = false
}) {
  if (!queryResponse && conversationHistory.length === 0) return null;

  return (
    <div className="conversation-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Historical conversation turns if multiple turns exist */}
      {conversationHistory.length > 0 && (
        <div className="chat-thread" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '10px' }}>
          {conversationHistory.map((item, index) => {
            const isLast = index === conversationHistory.length - 1;
            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* User Message (Right Aligned) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    maxWidth: '80%',
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(59, 130, 246, 0.15))',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    padding: '12px 18px',
                    borderRadius: '16px 16px 4px 16px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#93c5fd' }}>You</span>
                      {item.query_type && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }}>
                          Query Analysis: {item.query_type.charAt(0).toUpperCase() + item.query_type.slice(1)}
                        </span>
                      )}
                    </div>
                    <div>{item.query}</div>
                    {item.refined_query && item.refined_query !== item.query && (
                      <div style={{ fontSize: '12px', color: '#6ee7b7', marginTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '4px' }}>
                        ↳ Refined: <em>{item.refined_query}</em>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clarification Prompt Card if turn required clarification */}
                {item.clarification_required && isLast && (
                  <ClarificationCard
                    clarificationData={item.clarification || {
                      clarification_question: item.response,
                      original_query: item.query
                    }}
                    onSubmitClarification={onSubmitClarification}
                    isLoading={isLoading}
                  />
                )}

                {/* AI Response (Left Aligned) - only if not an unresolved pending clarification card */}
                {(!item.clarification_required || !isLast) && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      maxWidth: '90%',
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      padding: '16px 20px',
                      borderRadius: '16px 16px 16px 4px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>🤖</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            AI Assistant
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ConfidenceBadge confidence={item.confidence} />
                          <TextToSpeech text={item.response} />
                        </div>
                      </div>

                      <div style={{ fontSize: '15px', lineHeight: '1.7', color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>
                        {item.response}
                      </div>

                      {/* Transparency Panel for the most recent or active turn */}
                      {isLast && item.transparency && (
                        <TransparencyPanel responseData={item} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
