import type { DrillCategory, DrillDifficulty } from './types'

export const categoryConfig: Record<DrillCategory, { label: string; color: string; bgColor: string }> = {
  vorhand: { label: 'Vorhand', color: 'text-emerald', bgColor: 'bg-emerald/10' },
  rueckhand: { label: 'Rückhand', color: 'text-cyan', bgColor: 'bg-cyan/10' },
  aufschlag: { label: 'Aufschlag', color: 'text-warning', bgColor: 'bg-warning/10' },
  rueckschlag: { label: 'Rückschlag', color: 'text-violet-400', bgColor: 'bg-violet-400/10' },
  beinarbeit: { label: 'Beinarbeit', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  taktik: { label: 'Taktik', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  kondition: { label: 'Kondition', color: 'text-destructive', bgColor: 'bg-destructive/10' },
  allgemein: { label: 'Allgemein', color: 'text-text-secondary', bgColor: 'bg-white/5' },
}

export const difficultyConfig: Record<DrillDifficulty, { label: string; color: string; bgColor: string }> = {
  anfaenger: { label: 'Anfänger', color: 'text-emerald', bgColor: 'bg-emerald/10' },
  mittel: { label: 'Mittel', color: 'text-warning', bgColor: 'bg-warning/10' },
  fortgeschritten: { label: 'Fortgeschritten', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  profi: { label: 'Profi', color: 'text-destructive', bgColor: 'bg-destructive/10' },
}

export type TtrLevel = 'beginner' | 'intermediate' | 'club' | 'advanced' | 'elite'

export function getTtrLevel(ttr: number): TtrLevel {
  if (ttr < 1000) return 'beginner'
  if (ttr < 1300) return 'intermediate'
  if (ttr < 1600) return 'club'
  if (ttr < 1900) return 'advanced'
  return 'elite'
}

export const ttrLevelConfig: Record<TtrLevel, { label: string; range: string }> = {
  beginner: { label: 'Anfänger', range: '700–1000' },
  intermediate: { label: 'Fortgeschritten', range: '1000–1300' },
  club: { label: 'Vereinsspieler', range: '1300–1600' },
  advanced: { label: 'Starker Vereinsspieler', range: '1600–1900' },
  elite: { label: 'Leistungsspieler', range: '1900+' },
}

export function getAllowedDifficulties(ttr: number | null): DrillDifficulty[] {
  if (!ttr || ttr < 1000) return ['anfaenger', 'mittel']
  if (ttr < 1300) return ['anfaenger', 'mittel', 'fortgeschritten']
  return ['mittel', 'fortgeschritten', 'profi']
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} Min.`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`
}

export function getYoutubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
}

export function getYoutubeUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`
}

export function formatVideoTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
