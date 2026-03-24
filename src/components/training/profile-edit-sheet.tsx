'use client'

import { useState, useTransition } from 'react'
import type { Profile, PlayerType, StrokeType, DrillCategory } from '@/lib/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { categoryConfig } from '@/lib/training-utils'

interface ProfileEditSheetProps {
  profile: Profile
  open: boolean
  onOpenChange: (open: boolean) => void
}

const playerTypes: { value: PlayerType; label: string }[] = [
  { value: 'angreifer', label: 'Angreifer' },
  { value: 'allrounder', label: 'Allrounder' },
  { value: 'abwehr', label: 'Abwehrspieler' },
  { value: 'unbekannt', label: 'Noch unklar' },
]

const weaknessOptions: { value: StrokeType; label: string }[] = [
  { value: 'vorhand_topspin', label: 'Vorhand Topspin' },
  { value: 'rueckhand_topspin', label: 'Rückhand Topspin' },
  { value: 'vorhand_push', label: 'Vorhand Push' },
  { value: 'rueckhand_push', label: 'Rückhand Push' },
  { value: 'vorhand_block', label: 'Vorhand Block' },
  { value: 'rueckhand_block', label: 'Rückhand Block' },
  { value: 'vorhand_flip', label: 'Vorhand Flip' },
  { value: 'rueckhand_flip', label: 'Rückhand Flip' },
  { value: 'aufschlag', label: 'Aufschlag' },
]

const strengthOptions: { value: DrillCategory; label: string }[] = [
  { value: 'vorhand', label: 'Vorhand' },
  { value: 'rueckhand', label: 'Rückhand' },
  { value: 'aufschlag', label: 'Aufschlag' },
  { value: 'rueckschlag', label: 'Rückschlag' },
  { value: 'beinarbeit', label: 'Beinarbeit' },
  { value: 'taktik', label: 'Taktik' },
]

export function ProfileEditSheet({ profile, open, onOpenChange }: ProfileEditSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [ttr, setTtr] = useState(profile.ttr_rating?.toString() || '')
  const [playerType, setPlayerType] = useState<PlayerType>(profile.player_type)
  const [weaknesses, setWeaknesses] = useState<string[]>(profile.weaknesses)
  const [strengths, setStrengths] = useState<string[]>(profile.strengths || [])

  function toggleItem(list: string[], item: string, setter: (v: string[]) => void) {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item))
    } else {
      setter([...list, item])
    }
  }

  async function handleSave() {
    const supabase = createClient()

    const updates: Record<string, unknown> = {
      player_type: playerType,
      weaknesses,
      strengths,
    }

    const ttrNum = parseInt(ttr)
    if (!isNaN(ttrNum) && ttrNum >= 0 && ttrNum <= 3000) {
      updates.ttr_rating = ttrNum
    } else if (ttr === '') {
      updates.ttr_rating = null
    }

    const { error } = await supabase
      .from('pc_profiles')
      .update(updates)
      .eq('id', profile.id)

    if (!error) {
      startTransition(() => {
        router.refresh()
      })
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-surface-1 border-white/[0.06] overflow-y-auto w-full sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg text-left">Spielerprofil bearbeiten</SheetTitle>
          <p className="text-sm text-text-secondary text-left">
            Dein Profil bestimmt die personalisierten Quick Wins.
          </p>
        </SheetHeader>

        <div className="space-y-5 pb-8">
          {/* TTR */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              TTR-Wert
            </Label>
            <Input
              type="number"
              placeholder="z.B. 1200"
              value={ttr}
              onChange={(e) => setTtr(e.target.value)}
              min={0}
              max={3000}
              className="bg-white/[0.04] border-white/[0.08]"
            />
            <p className="text-[10px] text-text-muted">
              Findest du auf myTischtennis.de oder click-TT
            </p>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Player Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Spielertyp
            </Label>
            <Select value={playerType} onValueChange={(v) => setPlayerType((v ?? playerType) as PlayerType)}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-2 border-white/[0.08]">
                {playerTypes.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Weaknesses */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Schwächen (worauf Quick Wins zielen)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {weaknessOptions.map((opt) => (
                <Badge
                  key={opt.value}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
                    weaknesses.includes(opt.value)
                      ? 'bg-warning/10 text-warning border-warning/30'
                      : 'text-text-muted border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => toggleItem(weaknesses, opt.value, setWeaknesses)}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Strengths */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Stärken
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {strengthOptions.map((opt) => {
                const cat = categoryConfig[opt.value]
                return (
                  <Badge
                    key={opt.value}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      strengths.includes(opt.value)
                        ? `${cat.bgColor} ${cat.color} border-current/30`
                        : 'text-text-muted border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => toggleItem(strengths, opt.value, setStrengths)}
                  >
                    {opt.label}
                  </Badge>
                )
              })}
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="w-full bg-emerald hover:bg-emerald/90 text-white cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Profil speichern
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
