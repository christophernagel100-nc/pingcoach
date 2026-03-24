'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ProfileEditSheet } from '@/components/training/profile-edit-sheet'
import {
  getTtrLevel,
  ttrLevelConfig,
  categoryConfig,
} from '@/lib/training-utils'
import {
  Pencil,
  Target,
  User,
  Hand,
  Grip,
  Trophy,
  Clock,
  Building2,
  TrendingUp,
  ShieldAlert,
  Zap,
} from 'lucide-react'

interface ProfileViewProps {
  profile: Profile
}

const playerTypeLabels: Record<string, string> = {
  angreifer: 'Angreifer',
  allrounder: 'Allrounder',
  abwehr: 'Abwehrspieler',
  unbekannt: 'Noch nicht festgelegt',
}

const handLabels: Record<string, string> = {
  rechts: 'Rechtshänder',
  links: 'Linkshänder',
}

const gripLabels: Record<string, string> = {
  shakehand: 'Shakehand',
  penholder: 'Penholder',
}

const weaknessLabels: Record<string, string> = {
  vorhand_topspin: 'Vorhand Topspin',
  rueckhand_topspin: 'Rückhand Topspin',
  vorhand_push: 'Vorhand Push',
  rueckhand_push: 'Rückhand Push',
  vorhand_block: 'Vorhand Block',
  rueckhand_block: 'Rückhand Block',
  vorhand_flip: 'Vorhand Flip',
  rueckhand_flip: 'Rückhand Flip',
  aufschlag: 'Aufschlag',
}

export function ProfileView({ profile }: ProfileViewProps) {
  const [editOpen, setEditOpen] = useState(false)

  const ttrLevel = profile.ttr_rating ? getTtrLevel(profile.ttr_rating) : null
  const ttrInfo = ttrLevel ? ttrLevelConfig[ttrLevel] : null

  return (
    <div className="space-y-4">
      {/* TTR Card */}
      <Card className="bg-surface-2 border-white/[0.06]">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald" />
              </div>
              <div>
                <p className="text-xs text-text-muted">TTR-Wert</p>
                <p className="text-3xl font-bold">
                  {profile.ttr_rating ?? '—'}
                </p>
              </div>
            </div>
            {ttrInfo && (
              <Badge variant="outline" className="text-emerald border-emerald/20">
                {ttrInfo.label}
              </Badge>
            )}
          </div>
          {!profile.ttr_rating && (
            <p className="text-xs text-text-muted">
              Trage deinen TTR-Wert ein für personalisierte Empfehlungen.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Spieler-Info */}
      <Card className="bg-surface-2 border-white/[0.06]">
        <CardContent className="pt-5 pb-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Spieler-Info</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="text-xs text-text-muted hover:text-emerald cursor-pointer"
            >
              <Pencil className="w-3 h-3 mr-1" />
              Bearbeiten
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={User} label="Name" value={profile.display_name || profile.email.split('@')[0]} />
            <InfoRow icon={Trophy} label="Spielertyp" value={playerTypeLabels[profile.player_type]} />
            <InfoRow icon={Hand} label="Spielhand" value={handLabels[profile.playing_hand]} />
            <InfoRow icon={Grip} label="Griffstil" value={gripLabels[profile.grip_style]} />
            <InfoRow icon={Clock} label="Training/Woche" value={`${profile.weekly_training_hours} Std.`} />
            <InfoRow icon={Building2} label="Verein" value={profile.club_name || '—'} />
          </div>
        </CardContent>
      </Card>

      {/* Stärken & Schwächen */}
      <Card className="bg-surface-2 border-white/[0.06]">
        <CardContent className="pt-5 pb-5 space-y-4">
          <h3 className="text-sm font-semibold">Stärken & Schwächen</h3>

          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald" /> Stärken
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.strengths && profile.strengths.length > 0 ? (
                profile.strengths.map((s) => {
                  const cat = categoryConfig[s as keyof typeof categoryConfig]
                  return (
                    <Badge key={s} variant="outline" className={`${cat?.color || 'text-text-secondary'} border-current/20`}>
                      {cat?.label || s}
                    </Badge>
                  )
                })
              ) : (
                <p className="text-xs text-text-muted">Noch keine Stärken eingetragen.</p>
              )}
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-warning" /> Schwächen
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.weaknesses.length > 0 ? (
                profile.weaknesses.map((w) => (
                  <Badge key={w} variant="outline" className="text-warning border-warning/20">
                    {weaknessLabels[w] || w}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-text-muted">Noch keine Schwächen eingetragen.</p>
              )}
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-cyan" /> Ziele
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.goals.length > 0 ? (
                profile.goals.map((g) => (
                  <Badge key={g} variant="outline" className="text-cyan border-cyan/20">
                    {g}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-text-muted">Noch keine Ziele eingetragen.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileEditSheet
        profile={profile}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02]">
      <Icon className="w-4 h-4 text-text-muted flex-shrink-0" />
      <div>
        <p className="text-[10px] text-text-muted">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  )
}
