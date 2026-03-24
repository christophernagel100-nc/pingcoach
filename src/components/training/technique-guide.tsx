'use client'

import type { TechniqueGuide as TechniqueGuideType } from '@/lib/types'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { TechniqueCard } from './technique-card'
import { categoryConfig } from '@/lib/training-utils'
import { Dumbbell } from 'lucide-react'

interface TechniqueGuideProps {
  techniques: TechniqueGuideType[]
}

export function TechniqueGuide({ techniques }: TechniqueGuideProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted">
        {techniques.length} Technik-Guides mit Video-Tutorials und Coaching-Tipps.
      </p>
      <Accordion className="space-y-2">
        {techniques.map((technique) => {
          const cat = categoryConfig[technique.category]
          return (
            <AccordionItem
              key={technique.id}
              className="bg-surface-2 border border-white/[0.06] rounded-xl overflow-hidden px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${cat.bgColor} flex items-center justify-center`}>
                    <Dumbbell className={`w-4 h-4 ${cat.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-left">{technique.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <TechniqueCard technique={technique} />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
