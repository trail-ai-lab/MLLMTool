"use client"

import { useSource } from "@/lib/contexts/source-context"
import { Card, CardContent } from "@/components/ui/card"

export default function SummaryView() {
  const { summary, loadingSummary } = useSource()

  return (
    <Card className="m-4">
      <CardContent>
        <h4 className="text-lg font-semibold mb-4">Summary</h4>
        {loadingSummary ? (
          <p>Summarizing...</p>
        ) : summary ? (
          <p>{summary}</p>
        ) : (
          <p>Summary will be displayed here.</p>
        )}
      </CardContent>
    </Card>
  )
}
