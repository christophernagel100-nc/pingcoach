import { createClient } from '@/lib/supabase/server'
import { TrainingTabs } from '@/components/training/training-tabs'
import { getQuickWins } from '@/lib/quick-wins'
import type { Drill, TrainingPlan, TechniqueGuide, Profile } from '@/lib/types'
import type { Metadata } from 'next'

import drillsData from '@/../data/drills.json'
import plansData from '@/../data/training-plans.json'
import techniquesData from '@/../data/techniques.json'

export const metadata: Metadata = {
  title: 'Trainingsguide',
}

export default async function TrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('pc_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data as Profile | null
  }

  const drills = drillsData as Drill[]
  const plans = plansData as TrainingPlan[]
  const techniques = techniquesData as TechniqueGuide[]

  const quickWins = profile ? getQuickWins(profile, drills) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trainingsguide</h1>
        <p className="text-text-secondary">
          Übungen, Pläne und Technik-Tutorials für dein Training.
        </p>
      </div>

      <TrainingTabs
        drills={drills}
        quickWins={quickWins}
        profile={profile}
        plans={plans}
        techniques={techniques}
      />
    </div>
  )
}
