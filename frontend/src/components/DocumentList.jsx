import React from 'react';
import { deleteDocument } from '../services/api';

export default function DocumentList({ documents, onRefresh }) {
  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf': return '📕';
      case 'docx': return '📘';
      case 'csv': return '📊';
      case 'txt': return '📄';
      default: return '📁';
    }
  };

  const handleDelete = async (docId, docName) => {
    if (confirm(`Are you sure you want to remove "${docName}" from the vector store?`)) {
      try {
        await deleteDocument(docId);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert('Failed to delete document: ' + err.message);
      }
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>📚 Indexed Documents in Knowledge Base</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
        </span>
      </div>

      {documents.length === 0 ? (
        <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
          No documents indexed yet. Upload PDF, DOCX, TXT, or CSV above to populate the vector store.
        </p>
      ) : (
        <div className="document-grid">
          {documents.map((doc) => (
            <div key={doc.document_id} className="doc-card">
              <div className="doc-header">
                <span style={{ fontSize: '24px' }}>{getFileIcon(doc.file_type)}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="doc-title" title={doc.document_name}>
                    {doc.document_name}
                  </div>
                  <div className="doc-sub">
                    {doc.chunks} chunks • <span style={{ color: 'var(--success)' }}>✓ Indexed</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="doc-badge">{doc.file_type}</span>
                <button
                  className="btn-delete"
                  title="Remove document and vector chunks"
                  onClick={() => handleDelete(doc.document_id, doc.document_name)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
