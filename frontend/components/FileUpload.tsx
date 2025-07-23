"use client"

import type React from "react"

import { useState, useRef } from "react"
import type { AnalysisResult } from "@/types"

interface FileUploadProps {
  onAnalysisComplete: (results: AnalysisResult) => void
  onError: (error: string) => void
  onLoadingChange: (loading: boolean) => void
  onReset: () => void
  loading: boolean
}

export default function FileUpload({
  onAnalysisComplete,
  onError,
  onLoadingChange,
  onReset,
  loading,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedExtensions = [".c", ".cpp", ".cc", ".cxx", ".h", ".hpp"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!allowedExtensions.includes(fileExtension)) {
      onError("Please select a valid C/C++ file (.c, .cpp, .cc, .cxx, .h, .hpp)")
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      onError("File size must be less than 5MB")
      return
    }

    setSelectedFile(file)
    onError("") // Clear any previous errors
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      onError("Please select a file first")
      return
    }

    onLoadingChange(true)

    const formData = new FormData()
    formData.append("codeFile", selectedFile)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        onAnalysisComplete(data)
      } else {
        onError(data.error || "Analysis failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      onError("Cannot connect to server. Make sure the backend is running.")
    } finally {
      onLoadingChange(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onReset()
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 mb-8">
      {/* Upload Section */}
      <div className="space-y-6">
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            min-h-[200px] flex items-center justify-center
            ${
              dragOver
                ? "border-gray-400 bg-gray-50"
                : selectedFile
                  ? "border-gray-400 bg-gray-50"
                  : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
            }
          `}
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
            className="hidden"
            disabled={loading}
          />

          {selectedFile ? (
            <div className="flex items-center space-x-4 bg-white rounded-lg p-4 shadow-sm max-w-sm mx-auto border border-gray-200">
              <div className="text-4xl">📄</div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                }}
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">⬆️</div>
              <div>
                <p className="text-xl font-medium text-gray-700 mb-2">
                  {dragOver ? "Drop your file here" : "Drag & drop your C/C++ file here"}
                </p>
                <p className="text-gray-500">
                  or <span className="text-gray-700 font-medium">browse files</span>
                </p>
                <p className="text-sm text-gray-400 mt-2">Supported: .c, .cpp, .cc, .cxx, .h, .hpp (max 5MB)</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-4 justify-center">
          <button
            className={`
              px-8 py-3 rounded-lg font-semibold transition-all duration-200 border
              ${
                !selectedFile || loading
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-gray-900 text-white border-gray-900 hover:bg-gray-800 hover:border-gray-800"
              }
            `}
            onClick={handleUpload}
            disabled={!selectedFile || loading}
          >
            {loading ? "Analyzing..." : "Analyze Code"}
          </button>

          {(selectedFile || loading) && (
            <button
              className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">How to use:</h3>
        <ol className="space-y-3 text-gray-700 mb-8">
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              1
            </span>
            <span>Upload a C or C++ source file (.c, .cpp, .h, .hpp)</span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              2
            </span>
            <span>Click "Analyze Code" to run the FP16 demotion analysis</span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              3
            </span>
            <span>View the optimized code and memory analysis results</span>
          </li>
        </ol>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Tips for best results:</h4>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>Files with float variables will show the most optimization potential</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>Arrays and structures with float members are good candidates</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>Mathematical computations may benefit from FP16 optimization</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
