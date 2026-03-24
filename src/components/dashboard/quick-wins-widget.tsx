'use client'

import { useState } from 'react'
import type { QuickWin, Drill } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuickWinCard } from '@/components/training/quick-win-card'
import { DrillDetailSheet } from '@/components/training/drill-detail-sheet'
import { Zap, ArrowRight, Pencil } from 'lucide-react'
import Link from 'next/link'

interface QuickWinsWidgetProps {
  quickWins: QuickWin[]
  hasProfile?: boolean
}

export function QuickWinsWidget({ quickWins }: QuickWinsWidgetProps) {
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  if (quickWins.length === 0) {
    return (
      <Card className="bg-surface-2 border-white/[0.06]">
        <CardContent className="py-6 text-center">
          <Zap className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-secondary mb-1">Personalisierte Trainingstipps</p>
          <p className="text-xs text-text-muted mb-3">
            Fülle dein Profil aus (TTR, Schwächen) für Quick Wins.
          </p>
          <Link
            href="/training"
            className="text-xs text-emerald hover:text-emerald/80 flex items-center gap-1 justify-center transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Profil ausfüllen
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-surface-2 border-white/[0.06]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald" />
            Quick Wins
          </CardTitle>
          <Link
            href="/training"
            className="text-xs text-emerald hover:text-emerald/80 flex items-center gap-1 transition-colors"
          >
            Alle ansehen
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {quickWins.map((qw, i) => (
            <QuickWinCard
              key={qw.drill.id}
              quickWin={qw}
              index={i}
              compact
              onClick={() => {
                setSelectedDrill(qw.drill)
                setSheetOpen(true)
              }}
            />
          ))}
        </div>
      </CardContent>

      <DrillDetailSheet
        drill={selectedDrill}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </Card>
  )
}
