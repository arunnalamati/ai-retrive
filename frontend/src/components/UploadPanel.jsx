import React, { useState, useRef } from 'react';
import { uploadDocument } from '../services/api';

export default function UploadPanel({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | extracting | indexing | completed | error
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
      setErrorMessage('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadResult(null);
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus('uploading');
      // Transitioning UI state indicator
      setTimeout(() => setUploadStatus('extracting'), 500);
      setTimeout(() => setUploadStatus('indexing'), 1000);

      const result = await uploadDocument(selectedFile);

      setUploadStatus('completed');
      setUploadResult(result);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setUploadStatus('error');
      setErrorMessage(err.message || 'Upload failed');
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading': return 'Uploading file...';
      case 'extracting': return 'Extracting & cleaning text...';
      case 'indexing': return 'Generating embeddings & indexing in ChromaDB...';
      case 'completed': return '✓ Document indexed successfully';
      case 'error': return `❌ ${errorMessage}`;
      default: return '';
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            Upload Documents
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Supported formats: PDF • DOCX • TXT • CSV
          </p>
        </div>
        <div className="format-badges">
          <span className="badge-chip">.PDF</span>
          <span className="badge-chip">.DOCX</span>
          <span className="badge-chip">.TXT</span>
          <span className="badge-chip">.CSV</span>
        </div>
      </div>

      <div
        className={`dropzone ${isDragOver ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-icon">📁</div>
        <p style={{ fontWeight: 600, fontSize: '15px' }}>
          {selectedFile ? selectedFile.name : 'Drag & Drop your document here, or click to browse'}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Files are automatically parsed, cleaned, chunked, and embedded into ChromaDB
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt,.csv"
          style={{ display: 'none' }}
        />
      </div>

      <div className="upload-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadStatus === 'uploading' || uploadStatus === 'extracting' || uploadStatus === 'indexing'}
        >
          Choose Document
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={handleUpload}
          disabled={!selectedFile || uploadStatus === 'uploading' || uploadStatus === 'extracting' || uploadStatus === 'indexing'}
        >
          Upload & Index
        </button>

        {uploadStatus !== 'idle' && (
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 600,
            color: uploadStatus === 'completed' ? 'var(--success)' : uploadStatus === 'error' ? 'var(--danger)' : 'var(--accent-primary)'
          }}>
            {getStatusText()}
          </span>
        )}
      </div>

      {uploadResult && (
        <div style={{ 
          marginTop: '18px', 
          padding: '14px', 
          borderRadius: 'var(--radius-md)', 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          fontSize: '13px'
        }}>
          <div><strong>Document:</strong> {uploadResult.document_name}</div>
          <div><strong>Chunks Created:</strong> {uploadResult.chunks_created}</div>
          <div><strong>Status:</strong> <span style={{ color: 'var(--success)', fontWeight: 700 }}>Indexed</span></div>
          <div><strong>ID:</strong> <code style={{ fontSize: '11px' }}>{uploadResult.document_id}</code></div>
        </div>
      )}
    </div>
  );
}
