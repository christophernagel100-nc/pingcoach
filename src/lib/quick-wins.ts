import type { Drill, Profile, QuickWin, DrillCategory, PlayerType } from './types'
import { getAllowedDifficulties, getTtrLevel, ttrLevelConfig } from './training-utils'

const playerTypeCategories: Record<PlayerType, DrillCategory[]> = {
  angreifer: ['vorhand', 'aufschlag', 'taktik'],
  allrounder: ['vorhand', 'rueckhand', 'beinarbeit'],
  abwehr: ['rueckhand', 'beinarbeit', 'rueckschlag'],
  unbekannt: ['allgemein', 'beinarbeit'],
}

export function getQuickWins(profile: Profile, drills: Drill[]): QuickWin[] {
  const allowedDifficulties = getAllowedDifficulties(profile.ttr_rating)
  const preferredCategories = playerTypeCategories[profile.player_type] || []
  const weaknesses = profile.weaknesses ?? []
  const strengths = profile.strengths ?? []

  const scored = drills
    .filter((drill) => allowedDifficulties.includes(drill.difficulty))
    .map((drill) => {
      let score = 0
      let reason = ''

      // +3 if drill targets a player weakness
      const matchedWeakness = drill.target_weakness.find((tw) =>
        weaknesses.includes(tw)
      )
      if (matchedWeakness) {
        score += 3
        reason = `Trainiert deine Schwäche: ${formatWeakness(matchedWeakness)}`
      }

      // +2 if category matches player type
      if (preferredCategories.includes(drill.category)) {
        score += 2
        if (!reason) reason = `Passt zu deinem Spielstil (${formatPlayerType(profile.player_type)})`
      }

      // +1 if category is NOT in strengths
      if (!strengths.includes(drill.category)) {
        score += 1
      }

      // -1 if category is in strengths (already strong)
      if (strengths.includes(drill.category)) {
        score -= 1
      }

      if (!reason) reason = `Empfohlen für dein Level`

      return { drill, score, reason }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  return scored.map((item) => ({
    drill: item.drill,
    reason: item.reason,
    impact: item.score >= 3 ? 'hoch' : 'mittel',
    ttr_relevance: getTtrRelevanceText(profile.ttr_rating, item.drill.category),
  }))
}

function getTtrRelevanceText(ttr: number | null, category: DrillCategory): string {
  if (!ttr) return 'Trage deinen TTR-Wert ein für genauere Empfehlungen'

  const level = getTtrLevel(ttr)
  const levelInfo = ttrLevelConfig[level]

  const categoryImpact: Record<string, string> = {
    vorhand: 'Vorhand-Training bringt die meisten direkten Punkte',
    rueckhand: 'Rückhand-Stabilität verhindert einfache Fehler',
    aufschlag: 'Aufschlag-Varianten sind der schnellste Weg zu freien Punkten',
    rueckschlag: 'Sicherer Rückschlag reduziert Druckaufbau des Gegners',
    beinarbeit: 'Beinarbeit verbessert alle anderen Schläge gleichzeitig',
    taktik: 'Taktik-Verständnis hebt dich vom Niveau-Durchschnitt ab',
    kondition: 'Kondition entscheidet enge Sätze',
    allgemein: 'Vielseitigkeit macht dich unberechenbar',
  }

  return `${levelInfo.label} (TTR ${ttr}): ${categoryImpact[category] || ''}`
}

function formatWeakness(weakness: string): string {
  const labels: Record<string, string> = {
    vorhand_topspin: 'Vorhand Topspin',
    rueckhand_topspin: 'Rückhand Topspin',
    vorhand_push: 'Vorhand Push',
    rueckhand_push: 'Rückhand Push',
    vorhand_block: 'Vorhand Block',
    rueckhand_block: 'Rückhand Block',
    vorhand_flip: 'Vorhand Flip',
    rueckhand_flip: 'Rückhand Flip',
    aufschlag: 'Aufschlag',
    sonstiges: 'Sonstiges',
  }
  return labels[weakness] || weakness
}

function formatPlayerType(type: PlayerType): string {
  const labels: Record<PlayerType, string> = {
    angreifer: 'Angreifer',
    allrounder: 'Allrounder',
    abwehr: 'Abwehrspieler',
    unbekannt: 'Spielertyp',
  }
  return labels[type]
}
