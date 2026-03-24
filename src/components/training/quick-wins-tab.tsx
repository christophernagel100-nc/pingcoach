'use client'

import { useState } from 'react'
import type { Drill, Profile, QuickWin } from '@/lib/types'
import { QuickWinCard } from './quick-win-card'
import { DrillDetailSheet } from './drill-detail-sheet'
import { ProfileEditSheet } from './profile-edit-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Target, AlertCircle, Pencil } from 'lucide-react'
import { getTtrLevel, ttrLevelConfig } from '@/lib/training-utils'

interface QuickWinsTabProps {
  quickWins: QuickWin[]
  profile: Profile | null
}

export function QuickWinsTab({ quickWins, profile }: QuickWinsTabProps) {
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)

  if (!profile) return null

  if (!profile.ttr_rating && profile.weaknesses.length === 0) {
    return (
      <>
        <Card className="bg-surface-2 border-white/[0.06]">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-10 h-10 text-text-muted mx-auto mb-4" />
            <h3 className="font-semibold mb-1">Profil ausfüllen für Quick Wins</h3>
            <p className="text-sm text-text-secondary mb-4">
              Trage deinen TTR-Wert, Spielertyp und Schwächen ein — dann bekommst du die 3 Übungen mit dem grössten Effekt.
            </p>
            <Button
              onClick={() => setProfileSheetOpen(true)}
              className="bg-emerald hover:bg-emerald/90 text-white cursor-pointer"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Profil ausfüllen
            </Button>
          </CardContent>
        </Card>
        <ProfileEditSheet
          profile={profile}
          open={profileSheetOpen}
          onOpenChange={setProfileSheetOpen}
        />
      </>
    )
  }

  const ttrLevel = profile.ttr_rating ? getTtrLevel(profile.ttr_rating) : null
  const ttrInfo = ttrLevel ? ttrLevelConfig[ttrLevel] : null

  return (
    <div className="space-y-4">
      {/* Profile Summary */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white/[0.02]">
        <Target className="w-4 h-4 text-emerald flex-shrink-0" />
        {profile.ttr_rating && ttrInfo && (
          <Badge variant="outline" className="text-emerald border-emerald/20">
            TTR {profile.ttr_rating} · {ttrInfo.label}
          </Badge>
        )}
        {profile.player_type !== 'unbekannt' && (
          <Badge variant="outline" className="text-cyan border-cyan/20">
            {profile.player_type === 'angreifer' ? 'Angreifer' : profile.player_type === 'allrounder' ? 'Allrounder' : 'Abwehr'}
          </Badge>
        )}
        {profile.weaknesses.slice(0, 3).map((w) => (
          <Badge key={w} variant="outline" className="text-warning border-warning/20 text-xs">
            Schwäche: {w.replace('_', ' ')}
          </Badge>
        ))}
        <button
          onClick={() => setProfileSheetOpen(true)}
          className="ml-auto text-xs text-text-muted hover:text-emerald transition-colors cursor-pointer flex items-center gap-1"
        >
          <Pencil className="w-3 h-3" />
          Bearbeiten
        </button>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">
            Deine Top {quickWins.length} Quick Wins
          </h3>
          {quickWins.map((qw, i) => (
            <QuickWinCard
              key={qw.drill.id}
              quickWin={qw}
              index={i}
              onClick={() => {
                setSelectedDrill(qw.drill)
                setSheetOpen(true)
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-surface-2 border-white/[0.06]">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-text-muted">
              Keine Quick Wins gefunden. Erweitere dein Profil für bessere Empfehlungen.
            </p>
          </CardContent>
        </Card>
      )}

      <DrillDetailSheet
        drill={selectedDrill}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <ProfileEditSheet
        profile={profile}
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
      />
    </div>
  )
}
