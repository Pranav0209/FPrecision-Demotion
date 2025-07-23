/**
 * Clean, minimal code block with line numbers.
 * No syntax highlighting - just clean monospace text.
 */
"use client"

interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock({ code }: CodeBlockProps) {
  const lines = code.split("\n")

  return (
    <pre className="text-sm leading-[1.6] bg-gray-50 text-gray-800 p-4 font-mono border border-gray-200">
      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre">
          <span className="select-none text-gray-400 mr-4 inline-block w-8 text-right">{i + 1}</span>
          <span>{line}</span>
        </div>
      ))}
    </pre>
  )
}
