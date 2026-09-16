import React from 'react';

export default function AgentPipeline({ pipelineState, pipelineTrace, isAmbiguous }) {
  // Define the core pipeline steps
  const steps = [
    {
      id: 'query',
      name: 'User Query',
      icon: '👤',
      status: pipelineState.query || 'idle'
    },
    {
      id: 'understanding',
      name: 'Query Understanding',
      icon: '🧠',
      status: pipelineState.understanding || 'idle'
    },
    {
      id: isAmbiguous ? 'clarification' : 'retrieval',
      name: isAmbiguous ? 'Clarification Agent' : 'Retrieval Agent',
      icon: isAmbiguous ? '❓' : '🔎',
      status: isAmbiguous 
        ? (pipelineState.clarification || 'idle') 
        : (pipelineState.retrieval || 'idle')
    },
    {
      id: 'generation',
      name: isAmbiguous ? 'Prompt Formatting' : 'Response Generation',
      icon: '💬',
      status: pipelineState.generation || 'idle'
    },
    {
      id: 'output',
      name: 'Final Response',
      icon: '✓',
      status: pipelineState.output || 'idle'
    }
  ];

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>⚙️ Multi-Agent Processing Pipeline</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Sequential Pipeline Workflow
        </span>
      </div>

      <div className="pipeline-container">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="pipeline-step">
              <div className={`step-node ${step.status}`}>
                {step.icon}
              </div>
              <div className="step-label">{step.name}</div>
              <div className={`step-status-tag ${step.status}`}>
                {step.status}
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className={`step-connector ${step.status === 'completed' ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Architectural Foundation Agents Display */}
      <div style={{ 
        marginTop: '18px', 
        paddingTop: '14px', 
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          <strong>Foundation Architecture Agents:</strong>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            🤝 Clarification Agent: <span style={{ color: 'var(--success)' }}>Active (M2 Routing)</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            💾 Conversation Memory Agent: <span style={{ color: 'var(--info)' }}>Active (Session Buffer)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
