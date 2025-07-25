"use client"

import React, { createContext, useContext, useState } from "react"

type Source = {
  name: string
  url: string
  fileType: "audio" | "pdf"
}

type SourceContextType = {
  selectedSource: Source | null
  setSelectedSource: (source: Source | null) => void
}

const SourceContext = createContext<SourceContextType | undefined>(undefined)

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)

  return (
    <SourceContext.Provider value={{ selectedSource, setSelectedSource }}>
      {children}
    </SourceContext.Provider>
  )
}

export function useSource() {
  const context = useContext(SourceContext)
  if (!context) throw new Error("useSource must be used within SourceProvider")
  return context
}
