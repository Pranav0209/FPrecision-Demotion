import React, { useState } from 'react';
import './MemoryAnalysis.css';

const MemoryAnalysis = ({ analysis, floatMap }) => {
  const [activeSection, setActiveSection] = useState('summary');

  // Return early if no data is provided
  if (!analysis) {
    return (
      <div className="memory-analysis">
        <div className="analysis-header">
          <h2 className="analysis-title">Memory Analysis</h2>
          <p className="analysis-subtitle">Upload and analyze a file to see memory optimization results</p>
        </div>
      </div>
    );
  }

  const parseMemoryAnalysis = (analysisText) => {
    const lines = analysisText.split('\n');
    const parsed = {
      variables: {},
      literals: {},
      memory: {},
      breakdown: {}
    };

    let currentSection = '';
    
    lines.forEach(line => {
      if (line.includes('VARIABLES:')) {
        currentSection = 'variables';
      } else if (line.includes('LITERALS:')) {
        currentSection = 'literals';
      } else if (line.includes('MEMORY USAGE:')) {
        currentSection = 'memory';
      } else if (line.includes('BREAKDOWN:')) {
        currentSection = 'breakdown';
      } else if (line.trim() && currentSection) {
        const match = line.match(/(.+?):\s*(.+)/);
        if (match) {
          const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
          const value = match[2].trim();
          parsed[currentSection][key] = value;
        }
      }
    });

    return parsed;
  };

  const analysisData = parseMemoryAnalysis(analysis);

  const getSafeFloats = () => {
    return floatMap ? floatMap.filter(item => item.safe) : [];
  };

  const getUnsafeFloats = () => {
    return floatMap ? floatMap.filter(item => !item.safe) : [];
  };

  const renderMemorySavingsChart = () => {
    const originalBytes = parseInt(analysisData.memory.original_memory_usage) || 0;
    const afterBytes = parseInt(analysisData.memory.after_demotion) || 0;
    const savedBytes = originalBytes - afterBytes;
    const percentage = originalBytes > 0 ? (savedBytes / originalBytes) * 100 : 0;

    return (
      <div className="memory-chart">
        <div className="chart-container">
          <div className="memory-bar">
            <div 
              className="memory-used" 
              style={{ width: `${Math.max(10, (afterBytes / originalBytes) * 100)}%` }}
            >
              <span>Used: {afterBytes} bytes</span>
            </div>
            <div 
              className="memory-saved" 
              style={{ width: `${(savedBytes / originalBytes) * 100}%` }}
            >
              <span>Saved: {savedBytes} bytes</span>
            </div>
          </div>
          <div className="chart-labels">
            <span>0 bytes</span>
            <span>{originalBytes} bytes (original)</span>
          </div>
        </div>
        <div className="savings-summary">
          <h4>Memory Optimization Results</h4>
          <div className="savings-stats">
            <div className="stat-item">
              <span className="stat-value">{savedBytes}</span>
              <span className="stat-label">Bytes Saved</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{percentage.toFixed(1)}%</span>
              <span className="stat-label">Reduction</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{afterBytes}</span>
              <span className="stat-label">Final Size</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailedBreakdown = () => {
    const safeFloats = getSafeFloats();
    const unsafeFloats = getUnsafeFloats();

    return (
      <div className="detailed-breakdown">
        <div className="breakdown-section">
          <h4>✅ Successfully Optimized ({safeFloats.length} items)</h4>
          {safeFloats.length > 0 ? (
            <div className="float-list">
              {safeFloats.slice(0, 10).map((item, index) => (
                <div key={index} className="float-item safe">
                  <div className="float-info">
                    <span className="float-value">{item.value}</span>
                    <span className="float-location">{item.location}</span>
                  </div>
                  <div className="optimization-badge">
                    <span>float → __fp16</span>
                    <span className="savings">-2 bytes</span>
                  </div>
                </div>
              ))}
              {safeFloats.length > 10 && (
                <p className="show-more">... and {safeFloats.length - 10} more optimized items</p>
              )}
            </div>
          ) : (
            <p className="no-items">No float values could be safely optimized.</p>
          )}
        </div>

        <div className="breakdown-section">
          <h4>⚠️ Could Not Optimize ({unsafeFloats.length} items)</h4>
          {unsafeFloats.length > 0 ? (
            <div className="float-list">
              {unsafeFloats.slice(0, 10).map((item, index) => (
                <div key={index} className="float-item unsafe">
                  <div className="float-info">
                    <span className="float-value">{item.value}</span>
                    <span className="float-location">{item.location}</span>
                  </div>
                  <div className="reason-badge">
                    <span className="reason">{item.reason || 'Safety concern'}</span>
                  </div>
                </div>
              ))}
              {unsafeFloats.length > 10 && (
                <p className="show-more">... and {unsafeFloats.length - 10} more items</p>
              )}
            </div>
          ) : (
            <p className="no-items">All float values were successfully optimized!</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="memory-analysis-container">
      <div className="analysis-header">
        <h2>Memory Analysis Results</h2>
        <p>Detailed breakdown of FP16 optimization impact on your code</p>
      </div>

      <div className="analysis-tabs">
        <button 
          className={`tab ${activeSection === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveSection('summary')}
        >
          Summary
        </button>
        <button 
          className={`tab ${activeSection === 'details' ? 'active' : ''}`}
          onClick={() => setActiveSection('details')}
        >
          Detailed Breakdown
        </button>
        <button 
          className={`tab ${activeSection === 'explanation' ? 'active' : ''}`}
          onClick={() => setActiveSection('explanation')}
        >
          How It Works
        </button>
      </div>

      <div className="analysis-content">
        {activeSection === 'summary' && (
          <div className="summary-section">
            {renderMemorySavingsChart()}
            
            <div className="key-metrics">
              <div className="metric-grid">
                <div className="metric-card">
                  <h3>Variables</h3>
                  <div className="metric-value">
                    {analysisData.variables.successfully_demoted || '0'} / {analysisData.variables.total_float_variables_found || '0'}
                  </div>
                  <div className="metric-label">Optimized</div>
                  <div className="success-rate">
                    {analysisData.variables.demotion_success_rate || '0%'} success rate
                  </div>
                </div>
                
                <div className="metric-card">
                  <h3>Literals</h3>
                  <div className="metric-value">
                    {analysisData.literals.successfully_demoted || '0'} / {analysisData.literals.total_float_literals_found || '0'}
                  </div>
                  <div className="metric-label">Optimized</div>
                  <div className="success-rate">
                    {analysisData.literals.demotion_success_rate || '0%'} success rate
                  </div>
                </div>
                
                <div className="metric-card">
                  <h3>Memory Impact</h3>
                  <div className="metric-value">
                    {analysisData.memory.memory_saved || '0 bytes'}
                  </div>
                  <div className="metric-label">Total Savings</div>
                  <div className="success-rate">
                    {analysisData.memory.memory_reduction || '0%'} reduction
                  </div>
                </div>
              </div>
            </div>

            <div className="raw-analysis">
              <h3>Full Analysis Report</h3>
              <pre className="analysis-text">{analysis}</pre>
            </div>
          </div>
        )}

        {activeSection === 'details' && (
          <div className="details-section">
            {renderDetailedBreakdown()}
          </div>
        )}

        {activeSection === 'explanation' && (
          <div className="explanation-section">
            <h3>Understanding FP16 Optimization</h3>
            
            <div className="explanation-content">
              <div className="concept-block">
                <h4>🎯 What is FP16?</h4>
                <p>
                  FP16 (half-precision floating-point) uses 16 bits instead of the standard 32 bits for float variables. 
                  This reduces memory usage by 50% while maintaining acceptable precision for many applications.
                </p>
              </div>

              <div className="concept-block">
                <h4>🔍 How the Analysis Works</h4>
                <ol>
                  <li><strong>Detection:</strong> Scan code for float variables and literals</li>
                  <li><strong>Safety Check:</strong> Verify values fit within FP16 range (±65,504)</li>
                  <li><strong>Precision Analysis:</strong> Ensure no significant precision loss</li>
                  <li><strong>Optimization:</strong> Convert safe floats to __fp16</li>
                </ol>
              </div>

              <div className="concept-block">
                <h4>✅ Safe for FP16</h4>
                <ul>
                  <li>Values between -65,504 and +65,504</li>
                  <li>Simple arithmetic operations</li>
                  <li>Storage and basic calculations</li>
                  <li>Graphics and game development data</li>
                </ul>
              </div>

              <div className="concept-block">
                <h4>⚠️ Not Safe for FP16</h4>
                <ul>
                  <li>Very large numbers (&gt; 65,504)</li>
                  <li>Very small numbers (&lt; 6.1e-5)</li>
                  <li>High-precision scientific calculations</li>
                  <li>Function call parameters (conservative)</li>
                  <li>Division by very small numbers</li>
                </ul>
              </div>

              <div className="concept-block">
                <h4>💾 Memory Benefits</h4>
                <div className="benefit-comparison">
                  <div className="comparison-item">
                    <strong>float:</strong> 4 bytes per variable
                  </div>
                  <div className="comparison-item">
                    <strong>__fp16:</strong> 2 bytes per variable
                  </div>
                  <div className="comparison-result">
                    <strong>Savings:</strong> 50% reduction per optimized variable
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryAnalysis;
