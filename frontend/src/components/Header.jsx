import React from 'react';

export default function Header({ isConnected }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z"/>
          </svg>
        </div>
        <div className="header-title-box">
          <h1>AI Knowledge Retrieval</h1>
          <p>Multi-Agent RAG System</p>
        </div>
      </div>

      <div className="header-status">
        <div className={`status-dot ${isConnected ? 'connected' : 'offline'}`} />
        <span>{isConnected ? 'Backend Connected' : 'Backend Offline'}</span>
      </div>
    </header>
  );
}
