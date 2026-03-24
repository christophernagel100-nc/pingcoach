'use client'

import { useState } from 'react'
import type { TrainingPlan, Drill } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { difficultyConfig, formatDuration } from '@/lib/training-utils'

interface PlanCardProps {
  plan: TrainingPlan
  drills: Drill[]
}

export function PlanCard({ plan, drills }: PlanCardProps) {
  const [expanded, setExpanded] = useState(false)

  const levelColors: Record<string, string> = {
    anfaenger: 'text-emerald border-emerald/20',
    fortgeschritten: 'text-warning border-warning/20',
    vereinsspieler: 'text-orange-400 border-orange-400/20',
    leistungsspieler: 'text-destructive border-destructive/20',
  }

  const getDrillName = (drillId: string) => {
    return drills.find((d) => d.id === drillId)?.name || drillId
  }

  return (
    <Card className="bg-surface-2 border-white/[0.06]">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-semibold text-sm mb-1">{plan.name}</h3>
            <p className="text-xs text-text-secondary">{plan.description}</p>
          </div>
          <Badge variant="outline" className={levelColors[plan.level] || 'text-text-secondary'}>
            {difficultyConfig[plan.level === 'vereinsspieler' ? 'fortgeschritten' : plan.level === 'leistungsspieler' ? 'profi' : plan.level]?.label || plan.level}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {plan.duration_weeks} Wochen
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {plan.sessions_per_week}x pro Woche
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-emerald hover:text-emerald/80 transition-colors cursor-pointer"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Wochenplan ausblenden' : 'Wochenplan anzeigen'}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {plan.weekly_schedule.map((day, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-white/[0.02]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{day.day}</span>
                  <span className="text-xs text-text-muted">{formatDuration(day.duration_minutes)}</span>
                </div>
                <p className="text-xs text-emerald mb-1">{day.focus}</p>
                <div className="flex flex-wrap gap-1">
                  {day.drill_ids.map((id) => (
                    <Badge key={id} variant="secondary" className="bg-white/5 text-text-secondary text-[10px]">
                      {getDrillName(id)}
                    </Badge>
                  ))}
                </div>
                {day.notes && (
                  <p className="text-[10px] text-text-muted mt-1">{day.notes}</p>
                )}
              </div>
            ))}
            <p className="text-xs text-text-muted italic mt-2">
              {plan.progression_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
