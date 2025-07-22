import React, { useState, useRef } from 'react';
import axios from 'axios';
import './FileUpload.css';

const FileUpload = ({ onAnalysisComplete, onError, onLoadingChange, onReset, loading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    // Validate file type
    const allowedExtensions = ['.c', '.cpp', '.cc', '.cxx', '.h', '.hpp'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      onError('Please select a valid C/C++ file (.c, .cpp, .cc, .cxx, .h, .hpp)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      onError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    onError(''); // Clear any previous errors
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      onError('Please select a file first');
      return;
    }

    onLoadingChange(true);
    
    const formData = new FormData();
    formData.append('codeFile', selectedFile);

    try {
      const response = await axios.post('http://localhost:3001/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.data.success) {
        onAnalysisComplete(response.data);
      } else {
        onError(response.data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error.code === 'ECONNABORTED') {
        onError('Request timeout. The file might be too large or complex to process.');
      } else if (error.response) {
        onError(error.response.data.error || 'Server error occurred');
      } else if (error.request) {
        onError('Cannot connect to server. Make sure the backend is running on port 3001.');
      } else {
        onError('An unexpected error occurred');
      }
    } finally {
      onLoadingChange(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReset();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-container">
      <div className="upload-section">
        <div 
          className={`drop-zone ${dragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".c,.cpp,.cc,.cxx,.h,.hpp"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={loading}
          />
          
          {selectedFile ? (
            <div className="file-info">
              <div className="file-icon">📄</div>
              <div className="file-details">
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button 
                className="remove-file" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={loading}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="drop-zone-content">
              <div className="upload-icon">⬆️</div>
              <p className="drop-text">
                {dragOver ? 'Drop your file here' : 'Drag & drop your C/C++ file here'}
              </p>
              <p className="browse-text">or <span className="browse-link">browse files</span></p>
              <p className="file-types">Supported: .c, .cpp, .cc, .cxx, .h, .hpp (max 5MB)</p>
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button 
            className="analyze-button"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Code'}
          </button>
          
          {(selectedFile || loading) && (
            <button 
              className="reset-button"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="upload-info">
        <h3>How to use:</h3>
        <ol>
          <li>Upload a C or C++ source file (.c, .cpp, .h, .hpp)</li>
          <li>Click "Analyze Code" to run the FP16 demotion analysis</li>
          <li>View the optimized code and memory analysis results</li>
        </ol>
        
        <div className="tips">
          <h4>Tips for best results:</h4>
          <ul>
            <li>Files with float variables will show the most optimization potential</li>
            <li>Arrays and structures with float members are good candidates</li>
            <li>Mathematical computations may benefit from FP16 optimization</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
