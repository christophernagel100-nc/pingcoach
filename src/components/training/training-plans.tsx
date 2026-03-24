import type { TrainingPlan, Drill } from '@/lib/types'
import { PlanCard } from './plan-card'

interface TrainingPlansProps {
  plans: TrainingPlan[]
  drills: Drill[]
}

export function TrainingPlans({ plans, drills }: TrainingPlansProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted">
        {plans.length} Trainingspläne für verschiedene Level. Klicke auf einen Plan um den Wochenplan zu sehen.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} drills={drills} />
        ))}
      </div>
    </div>
  )
}
