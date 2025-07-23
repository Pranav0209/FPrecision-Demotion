import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("codeFile") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedExtensions = [".c", ".cpp", ".cc", ".cxx", ".h", ".hpp"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select a valid C/C++ file (.c, .cpp, .cc, .cxx, .h, .hpp)",
        },
        { status: 400 },
      )
    }

    // Read file content
    const fileContent = await file.text()

    // Forward to your backend API (replace with your actual backend URL)
    const backendFormData = new FormData()
    backendFormData.append("codeFile", new Blob([fileContent], { type: "text/plain" }), file.name)

    const response = await fetch("http://localhost:3001/analyze", {
      method: "POST",
      body: backendFormData,
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze file. Please make sure the backend server is running.",
      },
      { status: 500 },
    )
  }
}
