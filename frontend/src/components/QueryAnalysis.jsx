import React from 'react';

export default function QueryAnalysis({ analysis }) {
  if (!analysis) return null;

  const { query_type, classification_confidence, route, reasoning } = analysis;
  const confidencePct = Math.round((classification_confidence || 0) * 100);

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>🧠 Query Understanding Analysis</h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>System Analysis</span>
      </div>

      <div className="analysis-grid">
        <div className="analysis-item">
          <div className="analysis-label">Query Type</div>
          <div className="analysis-val">
            <span className={`type-badge ${query_type}`}>{query_type}</span>
          </div>
        </div>

        <div className="analysis-item">
          <div className="analysis-label">Classification Confidence</div>
          <div className="analysis-val">{confidencePct}%</div>
        </div>

        <div className="analysis-item">
          <div className="analysis-label">Execution Route</div>
          <div className="analysis-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            {route === 'clarification_required' ? '⚠️ Clarification' : '⚡ Retrieval Pipeline'}
          </div>
        </div>
      </div>

      {reasoning && (
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <strong>Linguistic Intent:</strong> {reasoning}
        </p>
      )}
    </div>
  );
}
