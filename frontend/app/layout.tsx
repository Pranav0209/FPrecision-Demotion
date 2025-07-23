import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FP16 Demotion Analyzer",
  description: "Analyze and optimize C/C++ code memory usage through FP16 demotion",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">{children}</div>
      </body>
    </html>
  )
}
