import Link from "next/link";
import type { Drill } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";
import { categoryConfig, difficultyConfig, formatDuration } from "@/lib/training-utils";

interface RelatedDrillsProps {
  drills: Drill[];
}

export function RelatedDrills({ drills }: RelatedDrillsProps) {
  if (drills.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-white/[0.06]">
      <h2 className="text-lg font-semibold text-text-primary mb-4">
        Passende Übungen aus der Drill-Bibliothek
      </h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {drills.map((drill) => {
          const cat = categoryConfig[drill.category];
          const diff = difficultyConfig[drill.difficulty];
          return (
            <div
              key={drill.id}
              className="card-glass p-4 rounded-xl border border-white/[0.06]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`${cat.color} border-current/20 text-xs`}>
                  {cat.label}
                </Badge>
                <Badge variant="outline" className={`${diff.color} border-current/20 text-xs`}>
                  {diff.label}
                </Badge>
              </div>
              <h3 className="font-medium text-sm text-text-primary mb-1">{drill.name}</h3>
              <p className="text-xs text-text-secondary line-clamp-2 mb-2">{drill.description}</p>
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Clock className="w-3 h-3" />
                {formatDuration(drill.duration_minutes)}
              </span>
            </div>
          );
        })}
      </div>
      <Link
        href="/register"
        className="inline-flex items-center gap-1.5 text-sm text-emerald hover:text-emerald-light transition-colors"
      >
        Diese Übungen mit Video-Analyse trainieren
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
