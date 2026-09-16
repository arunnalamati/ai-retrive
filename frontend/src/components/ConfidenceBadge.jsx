import React from 'react';

export default function ConfidenceBadge({ confidence }) {
  const level = confidence ? confidence.toLowerCase() : 'low';
  return (
    <div className={`confidence-pill ${level}`}>
      <span className="dot">●</span>
      <span>Retrieval Confidence: {confidence || 'Low'}</span>
    </div>
  );
}
