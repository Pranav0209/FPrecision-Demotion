export interface AnalysisResult {
  success: boolean
  originalCode: string
  analysis?: {
    demotedCode: string
    memoryAnalysis: string
    jsonAnalysis: FloatMapItem[]
  }
  error?: string
}

export interface FloatMapItem {
  value: string
  location: string
  safe: boolean
  reason?: string
}

export interface MemoryAnalysisData {
  variables: {
    total_float_variables_found?: string
    successfully_demoted?: string
    demotion_success_rate?: string
  }
  literals: {
    total_float_literals_found?: string
    successfully_demoted?: string
    demotion_success_rate?: string
  }
  memory: {
    original_memory_usage?: string
    after_demotion?: string
    memory_saved?: string
    memory_reduction?: string
  }
  breakdown: Record<string, string>
}

export interface CodeDifference {
  lineNumber: number
  original: string
  demoted: string
  type: "demotion" | "other"
}
