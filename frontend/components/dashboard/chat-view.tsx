"use client"

import * as React from "react"
import { useEffect } from "react"
import { ArrowUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSource } from "@/lib/contexts/source-context"
import { sendHighlightPrompt, getHighlightHistory } from "@/lib/api/highlights"

export function ChatView() {
  const { selectedSource } = useSource()
  const [messages, setMessages] = React.useState<
    { role: "user" | "agent"; content: string }[]
  >([
    {
      role: "agent",
      content: "Hi, how can I help you today?",
    },
  ])
  const [input, setInput] = React.useState("")
  const inputLength = input.trim().length
  const [loading, setLoading] = React.useState(false)

  // ✅ Load chat history when selectedSource changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!selectedSource) return

      try {
        const history = await getHighlightHistory(selectedSource.sourceId)

        const formatted = history.flatMap((entry) => [
          { role: "user" as const, content: entry.prompt },
          { role: "agent" as const, content: entry.answer },
        ])

        setMessages([
          { role: "agent", content: "Hi, how can I help you today?" },
          ...formatted,
        ])
      } catch (err) {
        console.error("Failed to load chat history", err)
      }
    }

    loadChatHistory()
  }, [selectedSource])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputLength || !selectedSource || loading) return

    const prompt = input.trim()
    setMessages((prev) => [...prev, { role: "user", content: prompt }])
    setInput("")
    setLoading(true)

    try {
      const result = await sendHighlightPrompt(selectedSource.sourceId, prompt)

      setMessages((prev) => [
        ...prev,
        { role: "agent", content: result.answer },
      ])

      window.dispatchEvent(
        new CustomEvent("highlight-sentence", {
          detail: result.highlightedSentence,
        })
      )
    } catch (err) {
      console.error("Highlight failed", err)
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: "Sorry, I couldn't process that request.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted"
                )}
              >
                {message.content}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="relative w-full">
            <Input
              id="message"
              placeholder="Ask a question about the transcript..."
              className="flex-1 pr-10"
              autoComplete="off"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2 rounded-full"
              disabled={inputLength === 0 || loading}
            >
              <ArrowUpIcon className="size-3.5" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
