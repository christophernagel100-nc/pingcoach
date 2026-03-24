import type { QuickWin } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, TrendingUp, Dumbbell } from 'lucide-react'
import { categoryConfig, formatDuration } from '@/lib/training-utils'

interface QuickWinCardProps {
  quickWin: QuickWin
  index: number
  onClick?: () => void
  compact?: boolean
}

export function QuickWinCard({ quickWin, index, onClick, compact }: QuickWinCardProps) {
  const cat = categoryConfig[quickWin.drill.category]

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
        onClick={onClick}
      >
        <div className={`w-8 h-8 rounded-lg ${cat.bgColor} flex items-center justify-center flex-shrink-0`}>
          <Dumbbell className={`w-4 h-4 ${cat.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{quickWin.drill.name}</p>
          <p className="text-xs text-text-muted truncate">{quickWin.reason}</p>
        </div>
        <Badge
          variant="outline"
          className={quickWin.impact === 'hoch' ? 'text-emerald border-emerald/20' : 'text-warning border-warning/20'}
        >
          {quickWin.impact === 'hoch' ? <Zap className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
          {quickWin.impact}
        </Badge>
      </div>
    )
  }

  return (
    <Card
      className="bg-surface-2 border-white/[0.06] hover:border-emerald/20 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald/10 text-emerald text-xs flex items-center justify-center font-bold">
              {index + 1}
            </span>
            <Badge variant="outline" className={`${cat.color} border-current/20 text-xs`}>
              {cat.label}
            </Badge>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${quickWin.impact === 'hoch' ? 'text-emerald border-emerald/20' : 'text-warning border-warning/20'}`}
          >
            <Zap className="w-3 h-3 mr-0.5" />
            Impact: {quickWin.impact}
          </Badge>
        </div>

        <h3 className="font-semibold text-sm mb-1 group-hover:text-emerald transition-colors">
          {quickWin.drill.name}
        </h3>
        <p className="text-xs text-emerald/80 mb-1">
          {quickWin.reason}
        </p>
        <p className="text-xs text-text-muted mb-2">
          {quickWin.ttr_relevance}
        </p>

        <div className="text-xs text-text-muted">
          {formatDuration(quickWin.drill.duration_minutes)} · {quickWin.drill.equipment_needed.slice(0, 2).join(', ')}
        </div>
      </CardContent>
    </Card>
  )
}
