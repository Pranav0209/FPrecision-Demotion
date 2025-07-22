import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './CodeDisplay.css';

const CodeDisplay = ({ originalCode, demotedCode }) => {
  const [activeTab, setActiveTab] = useState('comparison');

  // Return early if no data is provided
  if (!originalCode || !demotedCode) {
    return (
      <div className="code-display-container">
        <div className="code-display-header">
          <h2 className="code-display-title">Code Comparison</h2>
          <p className="code-display-subtitle">Upload and analyze a file to see the comparison</p>
        </div>
      </div>
    );
  }

  const getDifferences = () => {
    const originalLines = originalCode.split('\n');
    const demotedLines = demotedCode.split('\n');
    const differences = [];

    const maxLines = Math.max(originalLines.length, demotedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const demotedLine = demotedLines[i] || '';
      
      if (originalLine !== demotedLine) {
        differences.push({
          lineNumber: i + 1,
          original: originalLine,
          demoted: demotedLine,
          type: originalLine.includes('float') && demotedLine.includes('__fp16') ? 'demotion' : 'other'
        });
      }
    }
    
    return differences;
  };

  const differences = getDifferences();

  return (
    <div className="code-display-container">
      <div className="code-tabs">
        <button 
          className={`tab ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          Side-by-Side Comparison
        </button>
        <button 
          className={`tab ${activeTab === 'original' ? 'active' : ''}`}
          onClick={() => setActiveTab('original')}
        >
          Original Code
        </button>
        <button 
          className={`tab ${activeTab === 'demoted' ? 'active' : ''}`}
          onClick={() => setActiveTab('demoted')}
        >
          Optimized Code
        </button>
        <button 
          className={`tab ${activeTab === 'changes' ? 'active' : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          Changes Summary ({differences.length})
        </button>
      </div>

      <div className="code-content">
        {activeTab === 'comparison' && (
          <div className="comparison-view">
            <div className="code-panel">
              <h3>Original Code</h3>
              <div className="code-wrapper">
                <SyntaxHighlighter
                  language="c"
                  style={vscDarkPlus}
                  showLineNumbers={true}
                  wrapLines={true}
                  lineNumberStyle={{ minWidth: '3em' }}
                >
                  {originalCode}
                </SyntaxHighlighter>
              </div>
            </div>
            <div className="code-panel">
              <h3>Optimized Code (FP16 Demoted)</h3>
              <div className="code-wrapper">
                <SyntaxHighlighter
                  language="c"
                  style={vscDarkPlus}
                  showLineNumbers={true}
                  wrapLines={true}
                  lineNumberStyle={{ minWidth: '3em' }}
                >
                  {demotedCode}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'original' && (
          <div className="single-code-view">
            <h3>Original Code</h3>
            <SyntaxHighlighter
              language="c"
              style={vscDarkPlus}
              showLineNumbers={true}
              wrapLines={true}
              lineNumberStyle={{ minWidth: '3em' }}
            >
              {originalCode}
            </SyntaxHighlighter>
          </div>
        )}

        {activeTab === 'demoted' && (
          <div className="single-code-view">
            <h3>Optimized Code (FP16 Demoted)</h3>
            <div className="optimization-note">
              <p>🎯 Variables highlighted in the code below have been optimized from 'float' to '__fp16'</p>
            </div>
            <SyntaxHighlighter
              language="c"
              style={vscDarkPlus}
              showLineNumbers={true}
              wrapLines={true}
              lineNumberStyle={{ minWidth: '3em' }}
            >
              {demotedCode}
            </SyntaxHighlighter>
          </div>
        )}

        {activeTab === 'changes' && (
          <div className="changes-view">
            <h3>Changes Summary</h3>
            {differences.length > 0 ? (
              <div className="changes-list">
                <p className="changes-info">
                  Found {differences.length} line(s) with changes. 
                  Changes marked with 🔄 indicate float → __fp16 demotions.
                </p>
                {differences.map((diff, index) => (
                  <div key={index} className="change-item">
                    <div className="change-header">
                      <span className="line-number">Line {diff.lineNumber}</span>
                      {diff.type === 'demotion' && <span className="demotion-badge">🔄 FP16 Demotion</span>}
                    </div>
                    <div className="change-content">
                      <div className="change-line original">
                        <span className="change-label">- Original:</span>
                        <code>{diff.original || '(empty)'}</code>
                      </div>
                      <div className="change-line demoted">
                        <span className="change-label">+ Optimized:</span>
                        <code>{diff.demoted || '(empty)'}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-changes">
                <p>No changes were made to the code. This could mean:</p>
                <ul>
                  <li>No float variables were found that could be safely demoted</li>
                  <li>All float variables are already using optimal precision</li>
                  <li>The variables require 32-bit precision for accuracy</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {differences.length > 0 && (
        <div className="code-legend">
          <h4>Legend:</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color fp16"></span>
              <span>FP16 Demoted Variables (__fp16)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color original"></span>
              <span>Original Float Variables (float)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeDisplay;
