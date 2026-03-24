'use client'

import type { Drill, Profile, QuickWin, TrainingPlan, TechniqueGuide as TechniqueGuideType } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuickWinsTab } from './quick-wins-tab'
import { DrillLibrary } from './drill-library'
import { TrainingPlans } from './training-plans'
import { TechniqueGuide } from './technique-guide'
import { Zap, Dumbbell, Calendar, BookOpen } from 'lucide-react'

interface TrainingTabsProps {
  drills: Drill[]
  quickWins: QuickWin[]
  profile: Profile | null
  plans: TrainingPlan[]
  techniques: TechniqueGuideType[]
}

export function TrainingTabs({ drills, quickWins, profile, plans, techniques }: TrainingTabsProps) {
  return (
    <Tabs defaultValue="quick-wins" className="w-full">
      <TabsList className="w-full bg-white/[0.04] border border-white/[0.06] p-1 rounded-xl grid grid-cols-4 mb-6">
        <TabsTrigger
          value="quick-wins"
          className="text-xs data-[state=active]:bg-emerald/10 data-[state=active]:text-emerald rounded-lg cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
          Quick Wins
        </TabsTrigger>
        <TabsTrigger
          value="uebungen"
          className="text-xs data-[state=active]:bg-emerald/10 data-[state=active]:text-emerald rounded-lg cursor-pointer"
        >
          <Dumbbell className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
          Übungen
        </TabsTrigger>
        <TabsTrigger
          value="plaene"
          className="text-xs data-[state=active]:bg-emerald/10 data-[state=active]:text-emerald rounded-lg cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
          Pläne
        </TabsTrigger>
        <TabsTrigger
          value="technik"
          className="text-xs data-[state=active]:bg-emerald/10 data-[state=active]:text-emerald rounded-lg cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
          Technik
        </TabsTrigger>
      </TabsList>

      <TabsContent value="quick-wins">
        <QuickWinsTab quickWins={quickWins} profile={profile} />
      </TabsContent>

      <TabsContent value="uebungen">
        <DrillLibrary drills={drills} />
      </TabsContent>

      <TabsContent value="plaene">
        <TrainingPlans plans={plans} drills={drills} />
      </TabsContent>

      <TabsContent value="technik">
        <TechniqueGuide techniques={techniques} />
      </TabsContent>
    </Tabs>
  )
}
