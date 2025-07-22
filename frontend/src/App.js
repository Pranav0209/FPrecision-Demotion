import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import CodeDisplay from './components/CodeDisplay';
import MemoryAnalysis from './components/MemoryAnalysis';
import './App.css';

function App() {
  const [originalCode, setOriginalCode] = useState(null);
  const [demotedCode, setDemotedCode] = useState(null);
  const [memoryAnalysis, setMemoryAnalysis] = useState(null);
  const [floatMap, setFloatMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalysisComplete = (results) => {
    console.log('Analysis results received:', results);
    setOriginalCode(results.originalCode);
    setDemotedCode(results.analysis?.demotedCode);
    setMemoryAnalysis(results.analysis?.memoryAnalysis);
    setFloatMap(results.analysis?.jsonAnalysis);
    setError('');
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setOriginalCode(null);
    setDemotedCode(null);
    setMemoryAnalysis(null);
    setFloatMap(null);
  };

  const handleReset = () => {
    setOriginalCode(null);
    setDemotedCode(null);
    setMemoryAnalysis(null);
    setFloatMap(null);
    setError('');
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>FP16 Demotion Analyzer</h1>
        <p>Upload your C/C++ file to analyze memory optimization opportunities through FP16 demotion</p>
      </header>

      <main className="App-main">
        <FileUpload 
          onAnalysisComplete={handleAnalysisComplete}
          onError={handleError}
          onLoadingChange={setLoading}
          onReset={handleReset}
          loading={loading}
        />

        {error && (
          <div className="error-container">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {(originalCode || demotedCode || memoryAnalysis) && !loading && !error && (
          <div className="results-container">
            <div className="explanation-section">
              <h2>Analysis Complete!</h2>
              <div className="explanation-content">
                <h3>What is FP16 Demotion?</h3>
                <p>
                  FP16 (16-bit floating point) demotion is a memory optimization technique where 
                  32-bit float variables are converted to 16-bit half-precision floats (__fp16) 
                  when safe to do so. This can reduce memory usage by up to 50% for floating-point data.
                </p>
                <h3>How it works:</h3>
                <ul>
                  <li><strong>Analysis:</strong> The plugin analyzes your code to identify float variables</li>
                  <li><strong>Safety Check:</strong> It determines which variables can be safely demoted without precision loss</li>
                  <li><strong>Optimization:</strong> Safe variables are converted from 'float' to '__fp16'</li>
                  <li><strong>Memory Savings:</strong> Each demoted variable saves 2 bytes per instance</li>
                </ul>
              </div>
            </div>

            <CodeDisplay 
              originalCode={originalCode}
              demotedCode={demotedCode}
            />

            {memoryAnalysis && (
              <MemoryAnalysis 
                analysis={memoryAnalysis}
                floatMap={floatMap}
              />
            )}
          </div>
        )}

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Analyzing your code and performing FP16 demotion...</p>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>FP16 Demotion Plugin - Optimize your C/C++ code memory usage</p>
      </footer>
    </div>
  );
}

export default App;
