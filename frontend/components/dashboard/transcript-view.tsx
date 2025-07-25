"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function TranscriptView() {
  return (
    <div className="h-full overflow-y-auto p-4">
      <Card>
        <CardContent>
          <h4 className="text-lg font-semibold mb-4">Summary</h4>
          <p>
            Jokester began sneaking into the castle in the middle of the night
            and leaving jokes all over the place: under the king's pillow, in
            his soup, even in the royal toilet. The king was furious, but he
            couldn't seem to stop Jokester. And then, one day, the people of the
            kingdom discovered that the jokes left by Jokester were so funny
            that they couldn't help but laugh. And once they started laughing,
            they couldn't stop. Jokester began sneaking into the castle in the
            middle of the night and leaving jokes all over the place: under the
            king's pillow, in his soup, even in the royal toilet. The king was
            furious, but he couldn't seem to stop Jokester. And then, one day,
            the people of the kingdom discovered that the jokes left by Jokester
            were so funny that they couldn't help but laugh. And once they
            started laughing, they couldn't stop.
          </p>
        </CardContent>
      </Card>
      <Separator className="mb-4 mt-4" />
      <h4 className="text-lg font-semibold mb-4">Transcript</h4>
      <ScrollArea className="pr-2">
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Hello everyone, welcome to today's discussion on how machine
            learning is transforming education.
          </p>
          <p>
            In recent years, we've seen adaptive learning platforms personalize
            content for each student.
          </p>
          <p>
            Let's explore how these systems work and what challenges they face
            in terms of bias and fairness.
          </p>
          <p>
            Thank you for joining us — now let’s open the floor for questions.
          </p>
          <p>
            Jokester began sneaking into the castle in the middle of the night
            and leaving jokes all over the place: under the king's pillow, in
            his soup, even in the royal toilet. The king was furious, but he
            couldn't seem to stop Jokester. And then, one day, the people of the
            kingdom discovered that the jokes left by Jokester were so funny
            that they couldn't help but laugh. And once they started laughing,
            they couldn't stop.
          </p>
          <p>
            The king, seeing how much happier his subjects were, realized the
            error of his ways and repealed the joke tax. Jokester was declared a
            hero, and the kingdom lived happily ever after. The moral of the
            story is: never underestimate the power of a good laugh and always
            be careful of bad ideas.
          </p>
          <p>
            Jokester began sneaking into the castle in the middle of the night
            and leaving jokes all over the place: under the king's pillow, in
            his soup, even in the royal toilet. The king was furious, but he
            couldn't seem to stop Jokester. And then, one day, the people of the
            kingdom discovered that the jokes left by Jokester were so funny
            that they couldn't help but laugh. And once they started laughing,
            they couldn't stop.
          </p>
          <p>
            Jokester began sneaking into the castle in the middle of the night
            and leaving jokes all over the place: under the king's pillow, in
            his soup, even in the royal toilet. The king was furious, but he
            couldn't seem to stop Jokester. And then, one day, the people of the
            kingdom discovered that the jokes left by Jokester were so funny
            that they couldn't help but laugh. And once they started laughing,
            they couldn't stop.
          </p>
        </div>
      </ScrollArea>
    </div>
  )
}
