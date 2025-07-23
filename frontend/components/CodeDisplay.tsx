"use client"

import { useState } from "react"
import CodeBlock from "@/components/CodeBlock"
import type { CodeDifference } from "@/types"

interface CodeDisplayProps {
  originalCode: string | null
  demotedCode: string | null
}

export default function CodeDisplay({ originalCode, demotedCode }: CodeDisplayProps) {
  const [activeTab, setActiveTab] = useState("comparison")

  // Return early if no data is provided
  if (!originalCode || !demotedCode) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Code Comparison</h2>
        <p className="text-gray-600">Upload and analyze a file to see the comparison</p>
      </div>
    )
  }

  const getDifferences = (): CodeDifference[] => {
    const originalLines = originalCode.split("\n")
    const demotedLines = demotedCode.split("\n")
    const differences: CodeDifference[] = []

    const maxLines = Math.max(originalLines.length, demotedLines.length)

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || ""
      const demotedLine = demotedLines[i] || ""

      if (originalLine !== demotedLine) {
        differences.push({
          lineNumber: i + 1,
          original: originalLine,
          demoted: demotedLine,
          type: originalLine.includes("float") && demotedLine.includes("__fp16") ? "demotion" : "other",
        })
      }
    }

    return differences
  }

  const differences = getDifferences()

  const tabs = [
    { id: "comparison", label: "Side-by-Side Comparison", icon: "⚖️" },
    { id: "original", label: "Original Code", icon: "📄" },
    { id: "demoted", label: "Optimized Code", icon: "⚡" },
    { id: "changes", label: `Changes Summary (${differences.length})`, icon: "🔄" },
  ]

  return (
    <div className="p-8">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-2 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200
              ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === "comparison" && (
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="border-r border-gray-200">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                  Original Code
                </h3>
              </div>
              <div className="max-h-96 overflow-auto">
                <CodeBlock code={originalCode} />
              </div>
            </div>
            <div>
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <div className="w-3 h-3 bg-gray-600 rounded-full mr-3"></div>
                  Optimized Code (FP16 Demoted)
                </h3>
              </div>
              <div className="max-h-96 overflow-auto">
                <CodeBlock code={demotedCode} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "original" && (
          <div>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Original Code</h3>
            </div>
            <div className="max-h-96 overflow-auto">
              <CodeBlock code={originalCode} />
            </div>
          </div>
        )}

        {activeTab === "demoted" && (
          <div>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Optimized Code (FP16 Demoted)</h3>
              <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-700 flex items-center">
                  <span className="mr-2">🎯</span>
                  Variables highlighted in the code below have been optimized from 'float' to '__fp16'
                </p>
              </div>
            </div>
            <div className="max-h-96 overflow-auto">
              <CodeBlock code={demotedCode} />
            </div>
          </div>
        )}

        {activeTab === "changes" && (
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Changes Summary</h3>
            {differences.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700">
                    Found {differences.length} line(s) with changes. Changes marked with 🔄 indicate float → __fp16
                    demotions.
                  </p>
                </div>
                <div className="space-y-4 max-h-96 overflow-auto">
                  {differences.map((diff, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">Line {diff.lineNumber}</span>
                        {diff.type === "demotion" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            🔄 FP16 Demotion
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="bg-gray-50 border-l-4 border-gray-300 p-3 rounded">
                          <div className="flex items-center">
                            <span className="text-gray-600 font-medium mr-2">- Original:</span>
                            <code className="text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded">
                              {diff.original || "(empty)"}
                            </code>
                          </div>
                        </div>
                        <div className="bg-gray-50 border-l-4 border-gray-600 p-3 rounded">
                          <div className="flex items-center">
                            <span className="text-gray-600 font-medium mr-2">+ Optimized:</span>
                            <code className="text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded">
                              {diff.demoted || "(empty)"}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-4">No changes were made to the code. This could mean:</p>
                <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>No float variables were found that could be safely demoted</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>All float variables are already using optimal precision</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>The variables require 32-bit precision for accuracy</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {differences.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Legend:</h4>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-600 rounded mr-2"></div>
              <span className="text-sm text-gray-700">FP16 Demoted Variables (__fp16)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
              <span className="text-sm text-gray-700">Original Float Variables (float)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
