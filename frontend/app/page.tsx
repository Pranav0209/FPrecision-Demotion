"use client"

import { useState } from "react"
import FileUpload from "@/components/FileUpload"
import CodeDisplay from "@/components/CodeDisplay"
import MemoryAnalysis from "@/components/MemoryAnalysis"
import type { AnalysisResult, FloatMapItem } from "@/types"

export default function Dashboard() {
  const [originalCode, setOriginalCode] = useState<string | null>(null)
  const [demotedCode, setDemotedCode] = useState<string | null>(null)
  const [memoryAnalysis, setMemoryAnalysis] = useState<string | null>(null)
  const [floatMap, setFloatMap] = useState<FloatMapItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAnalysisComplete = (results: AnalysisResult) => {
    console.log("Analysis results received:", results)
    setOriginalCode(results.originalCode)
    setDemotedCode(results.analysis?.demotedCode || null)
    setMemoryAnalysis(results.analysis?.memoryAnalysis || null)
    setFloatMap(results.analysis?.jsonAnalysis || null)
    setError("")
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setOriginalCode(null)
    setDemotedCode(null)
    setMemoryAnalysis(null)
    setFloatMap(null)
  }

  const handleReset = () => {
    setOriginalCode(null)
    setDemotedCode(null)
    setMemoryAnalysis(null)
    setFloatMap(null)
    setError("")
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">FP16 Demotion Analyzer</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Upload your C/C++ file to analyze memory optimization opportunities through FP16 demotion
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileUpload
          onAnalysisComplete={handleAnalysisComplete}
          onError={handleError}
          onLoadingChange={setLoading}
          onReset={handleReset}
          loading={loading}
        />

        {error && (
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Error</h3>
                <p className="mt-1 text-sm text-gray-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {(originalCode || demotedCode || memoryAnalysis) && !loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            {/* Explanation Section */}
            <div className="bg-gray-50 border-b border-gray-200 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Analysis Complete</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">What is FP16 Demotion?</h3>
                  <p className="text-gray-700 leading-relaxed">
                    FP16 (16-bit floating point) demotion is a memory optimization technique where 32-bit float
                    variables are converted to 16-bit half-precision floats (__fp16) when safe to do so. This can reduce
                    memory usage by up to 50% for floating-point data.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">How it works:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Analysis:</span>
                      <span>The plugin analyzes your code to identify float variables</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Safety Check:</span>
                      <span>It determines which variables can be safely demoted without precision loss</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Optimization:</span>
                      <span>Safe variables are converted from 'float' to '__fp16'</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Memory Savings:</span>
                      <span>Each demoted variable saves 2 bytes per instance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <CodeDisplay originalCode={originalCode} demotedCode={demotedCode} />

            {memoryAnalysis && <MemoryAnalysis analysis={memoryAnalysis} floatMap={floatMap} />}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xl text-gray-700">Analyzing your code and performing FP16 demotion...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600">FP16 Demotion Plugin - Optimize your C/C++ code memory usage</p>
        </div>
      </footer>
    </div>
  )
}
