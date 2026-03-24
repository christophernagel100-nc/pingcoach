'use client'

import { useState } from 'react'
import type { Drill, DrillCategory, DrillDifficulty } from '@/lib/types'
import { DrillCard } from './drill-card'
import { DrillDetailSheet } from './drill-detail-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { categoryConfig, difficultyConfig } from '@/lib/training-utils'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface DrillLibraryProps {
  drills: Drill[]
}

export function DrillLibrary({ drills }: DrillLibraryProps) {
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = drills.filter((drill) => {
    if (categoryFilter !== 'all' && drill.category !== categoryFilter) return false
    if (difficultyFilter !== 'all' && drill.difficulty !== difficultyFilter) return false
    if (search && !drill.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleDrillClick(drill: Drill) {
    setSelectedDrill(drill)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Übung suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/[0.08]"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
          <SelectTrigger className="w-full sm:w-40 bg-white/[0.04] border-white/[0.08]">
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent className="bg-surface-2 border-white/[0.08]">
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {(Object.keys(categoryConfig) as DrillCategory[]).map((key) => (
              <SelectItem key={key} value={key}>
                {categoryConfig[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v ?? 'all')}>
          <SelectTrigger className="w-full sm:w-36 bg-white/[0.04] border-white/[0.08]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent className="bg-surface-2 border-white/[0.08]">
            <SelectItem value="all">Alle Level</SelectItem>
            {(Object.keys(difficultyConfig) as DrillDifficulty[]).map((key) => (
              <SelectItem key={key} value={key}>
                {difficultyConfig[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <p className="text-xs text-text-muted">
        {filtered.length} von {drills.length} Übungen
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((drill) => (
          <DrillCard
            key={drill.id}
            drill={drill}
            onClick={() => handleDrillClick(drill)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted text-sm">Keine Übungen gefunden.</p>
        </div>
      )}

      {/* Detail Sheet */}
      <DrillDetailSheet
        drill={selectedDrill}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
