"use client"

import { useSource } from "@/lib/contexts/source-context"
import { Card, CardContent } from "@/components/ui/card"

export default function SummaryView() {
  const { summary, loadingSummary } = useSource()

  const renderSummary = () => {
    if (!summary) return null

    const lines = summary.split("\n").filter((line) => line.trim() !== "")
    const bullets = lines.filter((line) => line.trim().startsWith("* "))
    const rest = lines.filter((line) => !line.trim().startsWith("* "))

    return (
      <>
        {rest.map((para, i) => (
          <p key={`p-${i}`} className="mb-2 leading-relaxed">
            {para}
          </p>
        ))}
        {bullets.length > 0 && (
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            {bullets.map((bullet, i) => (
              <li key={`b-${i}`}>{bullet.replace(/^\*\s*/, "")}</li>
            ))}
          </ul>
        )}
      </>
    )
  }

  return (
    <Card className="m-4">
      <CardContent>
        <h4 className="text-lg font-semibold mb-4">Summary</h4>
        {loadingSummary ? (
          <p>Summarizing...</p>
        ) : summary ? (
          renderSummary()
        ) : (
          <p>Summary will be displayed here.</p>
        )}
      </CardContent>
    </Card>
  )
}
