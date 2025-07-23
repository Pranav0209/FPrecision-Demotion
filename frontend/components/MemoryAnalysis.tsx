"use client"

import { useState } from "react"
import type { FloatMapItem, MemoryAnalysisData } from "@/types"

interface MemoryAnalysisProps {
  analysis: string | null
  floatMap: FloatMapItem[] | null
}

export default function MemoryAnalysis({ analysis, floatMap }: MemoryAnalysisProps) {
  const [activeSection, setActiveSection] = useState("summary")

  // Return early if no data is provided
  if (!analysis) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Memory Analysis</h2>
        <p className="text-gray-600">Upload and analyze a file to see memory optimization results</p>
      </div>
    )
  }

  const parseMemoryAnalysis = (analysisText: string): MemoryAnalysisData => {
    const lines = analysisText.split("\n")
    const parsed: MemoryAnalysisData = {
      variables: {},
      literals: {},
      memory: {},
      breakdown: {},
    }

    let currentSection = ""

    lines.forEach((line) => {
      if (line.includes("VARIABLES:")) {
        currentSection = "variables"
      } else if (line.includes("LITERALS:")) {
        currentSection = "literals"
      } else if (line.includes("MEMORY USAGE:")) {
        currentSection = "memory"
      } else if (line.includes("BREAKDOWN:")) {
        currentSection = "breakdown"
      } else if (line.trim() && currentSection) {
        const match = line.match(/(.+?):\s*(.+)/)
        if (match) {
          const key = match[1].trim().toLowerCase().replace(/\s+/g, "_")
          const value = match[2].trim()
          ;(parsed as any)[currentSection][key] = value
        }
      }
    })

    return parsed
  }

  const analysisData = parseMemoryAnalysis(analysis)

  const getSafeFloats = () => {
    return floatMap ? floatMap.filter((item) => item.safe) : []
  }

  const getUnsafeFloats = () => {
    return floatMap ? floatMap.filter((item) => !item.safe) : []
  }

  const renderMemorySavingsChart = () => {
    const originalBytes = Number.parseInt(analysisData.memory.original_memory_usage || "0") || 0
    const afterBytes = Number.parseInt(analysisData.memory.after_demotion || "0") || 0
    const savedBytes = originalBytes - afterBytes
    const percentage = originalBytes > 0 ? (savedBytes / originalBytes) * 100 : 0

    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Memory Optimization Results</h3>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>0 bytes</span>
            <span>{originalBytes} bytes (original)</span>
          </div>

          <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gray-400 flex items-center justify-end pr-2"
              style={{ width: `${Math.max(10, (afterBytes / originalBytes) * 100)}%` }}
            >
              <span className="text-white text-xs font-medium">Used: {afterBytes}B</span>
            </div>
            <div
              className="absolute top-0 h-full bg-gray-600 flex items-center justify-end pr-2"
              style={{
                left: `${Math.max(10, (afterBytes / originalBytes) * 100)}%`,
                width: `${(savedBytes / originalBytes) * 100}%`,
              }}
            >
              <span className="text-white text-xs font-medium">Saved: {savedBytes}B</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{savedBytes}</div>
            <div className="text-sm text-gray-600">Bytes Saved</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{percentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Reduction</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{afterBytes}</div>
            <div className="text-sm text-gray-600">Final Size</div>
          </div>
        </div>
      </div>
    )
  }

  const renderDetailedBreakdown = () => {
    const safeFloats = getSafeFloats()
    const unsafeFloats = getUnsafeFloats()

    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">✅</span>
            Successfully Optimized ({safeFloats.length} items)
          </h4>
          {safeFloats.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-auto">
              {safeFloats.slice(0, 10).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <div className="font-mono text-sm font-medium text-gray-900">{item.value}</div>
                    <div className="text-xs text-gray-600">{item.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-700">float → __fp16</div>
                    <div className="text-xs text-gray-600">-2 bytes</div>
                  </div>
                </div>
              ))}
              {safeFloats.length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  ... and {safeFloats.length - 10} more optimized items
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 italic">No float values could be safely optimized.</p>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⚠️</span>
            Could Not Optimize ({unsafeFloats.length} items)
          </h4>
          {unsafeFloats.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-auto">
              {unsafeFloats.slice(0, 10).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <div className="font-mono text-sm font-medium text-gray-900">{item.value}</div>
                    <div className="text-xs text-gray-600">{item.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-700">{item.reason || "Safety concern"}</div>
                  </div>
                </div>
              ))}
              {unsafeFloats.length > 10 && (
                <p className="text-sm text-gray-500 text-center">... and {unsafeFloats.length - 10} more items</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 italic">All float values were successfully optimized!</p>
          )}
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "summary", label: "Summary", icon: "📊" },
    { id: "details", label: "Detailed Breakdown", icon: "🔍" },
    { id: "explanation", label: "How It Works", icon: "💡" },
  ]

  return (
    <div className="p-8 border-t border-gray-200">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Memory Analysis Results</h2>
        <p className="text-gray-600">Detailed breakdown of FP16 optimization impact on your code</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all duration-200
                ${activeSection === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}
              `}
              onClick={() => setActiveSection(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeSection === "summary" && (
        <div className="space-y-8">
          {renderMemorySavingsChart()}

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
              <div className="text-3xl mb-2">🔢</div>
              <h3 className="font-semibold text-gray-900 mb-2">Variables</h3>
              <div className="text-2xl font-bold text-gray-900">
                {analysisData.variables.successfully_demoted || "0"} /{" "}
                {analysisData.variables.total_float_variables_found || "0"}
              </div>
              <div className="text-sm text-gray-600 mt-1">Optimized</div>
              <div className="text-xs text-gray-500 mt-2">
                {analysisData.variables.demotion_success_rate || "0%"} success rate
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold text-gray-900 mb-2">Literals</h3>
              <div className="text-2xl font-bold text-gray-900">
                {analysisData.literals.successfully_demoted || "0"} /{" "}
                {analysisData.literals.total_float_literals_found || "0"}
              </div>
              <div className="text-sm text-gray-600 mt-1">Optimized</div>
              <div className="text-xs text-gray-500 mt-2">
                {analysisData.literals.demotion_success_rate || "0%"} success rate
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
              <div className="text-3xl mb-2">💾</div>
              <h3 className="font-semibold text-gray-900 mb-2">Memory Impact</h3>
              <div className="text-2xl font-bold text-gray-900">{analysisData.memory.memory_saved || "0 bytes"}</div>
              <div className="text-sm text-gray-600 mt-1">Total Savings</div>
              <div className="text-xs text-gray-500 mt-2">{analysisData.memory.memory_reduction || "0%"} reduction</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Full Analysis Report</h3>
            <pre className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap border border-gray-200">
              {analysis}
            </pre>
          </div>
        </div>
      )}

      {activeSection === "details" && <div>{renderDetailedBreakdown()}</div>}

      {activeSection === "explanation" && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">🎯</span>
              Understanding FP16 Optimization
            </h3>

            <div className="space-y-6">
              <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">What is FP16?</h4>
                <p className="text-gray-700 leading-relaxed">
                  FP16 (half-precision floating-point) uses 16 bits instead of the standard 32 bits for float variables.
                  This reduces memory usage by 50% while maintaining acceptable precision for many applications.
                </p>
              </div>

              <div className="bg-gray-50 border-l-4 border-gray-600 p-6 rounded-r-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">How the Analysis Works</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>
                    <strong>Detection:</strong> Scan code for float variables and literals
                  </li>
                  <li>
                    <strong>Safety Check:</strong> Verify values fit within FP16 range (±65,504)
                  </li>
                  <li>
                    <strong>Precision Analysis:</strong> Ensure no significant precision loss
                  </li>
                  <li>
                    <strong>Optimization:</strong> Convert safe floats to __fp16
                  </li>
                </ol>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">✅</span>
                    Safe for FP16
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Values between -65,504 and +65,504</li>
                    <li>• Simple arithmetic operations</li>
                    <li>• Storage and basic calculations</li>
                    <li>• Graphics and game development data</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Not Safe for FP16
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Very large numbers (&gt; 65,504)</li>
                    <li>• Very small numbers (&lt; 6.1e-5)</li>
                    <li>• High-precision scientific calculations</li>
                    <li>• Function call parameters (conservative)</li>
                    <li>• Division by very small numbers</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 border-l-4 border-gray-500 p-6 rounded-r-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Memory Benefits</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-lg font-bold text-gray-900">float</div>
                    <div className="text-sm text-gray-600">4 bytes per variable</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-lg font-bold text-gray-900">__fp16</div>
                    <div className="text-sm text-gray-600">2 bytes per variable</div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                    <div className="text-lg font-bold text-gray-900">Savings</div>
                    <div className="text-sm text-gray-600">50% reduction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
