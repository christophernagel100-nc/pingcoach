import type { Drill } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Dumbbell } from 'lucide-react'
import { categoryConfig, difficultyConfig, formatDuration } from '@/lib/training-utils'

interface DrillCardProps {
  drill: Drill
  onClick: () => void
}

export function DrillCard({ drill, onClick }: DrillCardProps) {
  const cat = categoryConfig[drill.category]
  const diff = difficultyConfig[drill.difficulty]

  return (
    <Card
      className="bg-surface-2 border-white/[0.06] hover:border-emerald/20 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${cat.bgColor} flex items-center justify-center`}>
              <Dumbbell className={`w-4 h-4 ${cat.color}`} />
            </div>
            <Badge variant="outline" className={`${cat.color} border-current/20 text-xs`}>
              {cat.label}
            </Badge>
          </div>
          <Badge variant="outline" className={`${diff.color} border-current/20 text-xs`}>
            {diff.label}
          </Badge>
        </div>

        <h3 className="font-semibold text-sm mb-1 group-hover:text-emerald transition-colors">
          {drill.name}
        </h3>
        <p className="text-xs text-text-secondary line-clamp-2 mb-3">
          {drill.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(drill.duration_minutes)}
          </span>
          {drill.equipment_needed.length > 0 && (
            <span className="truncate">
              {drill.equipment_needed.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
