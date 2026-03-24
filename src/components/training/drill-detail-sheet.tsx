'use client'

import type { Drill } from '@/lib/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Dumbbell, Lightbulb, Play, ExternalLink } from 'lucide-react'
import {
  categoryConfig,
  difficultyConfig,
  formatDuration,
  getYoutubeThumbnail,
  getYoutubeUrl,
  formatVideoTime,
} from '@/lib/training-utils'

interface DrillDetailSheetProps {
  drill: Drill | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DrillDetailSheet({ drill, open, onOpenChange }: DrillDetailSheetProps) {
  if (!drill) return null

  const cat = categoryConfig[drill.category]
  const diff = difficultyConfig[drill.difficulty]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-surface-1 border-white/[0.06] overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`${cat.color} border-current/20`}>
              {cat.label}
            </Badge>
            <Badge variant="outline" className={`${diff.color} border-current/20`}>
              {diff.label}
            </Badge>
          </div>
          <SheetTitle className="text-lg text-left">{drill.name}</SheetTitle>
          <p className="text-sm text-text-secondary text-left">{drill.description}</p>
        </SheetHeader>

        <div className="space-y-5 pb-8">
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatDuration(drill.duration_minutes)}
            </span>
            {drill.instructions.sets && (
              <span>{drill.instructions.sets} Sets</span>
            )}
            {drill.instructions.reps && (
              <span>{drill.instructions.reps} Wdh.</span>
            )}
          </div>

          {/* Equipment */}
          {drill.equipment_needed.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Equipment
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {drill.equipment_needed.map((item) => (
                  <Badge key={item} variant="secondary" className="bg-white/5 text-text-secondary text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="bg-white/[0.06]" />

          {/* Instructions */}
          <div>
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" />
              Anleitung
            </h4>
            <ol className="space-y-2.5">
              {drill.instructions.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald/10 text-emerald text-xs flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <span className="text-text-secondary">{step}</span>
                </li>
              ))}
            </ol>
            {drill.instructions.rest_seconds && (
              <p className="text-xs text-text-muted mt-2">
                Pause: {drill.instructions.rest_seconds} Sek. zwischen Sets
              </p>
            )}
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Tips */}
          {drill.tips.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Tipps
              </h4>
              <ul className="space-y-2">
                {drill.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-text-secondary">
                    <span className="text-warning flex-shrink-0">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Videos */}
          {drill.videos && drill.videos.length > 0 && (
            <>
              <Separator className="bg-white/[0.06]" />
              <div>
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  Videos
                </h4>
                <div className="space-y-3">
                  {drill.videos.map((video) => (
                    <a
                      key={video.youtube_id}
                      href={getYoutubeUrl(video.youtube_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors group/video"
                    >
                      <div className="relative flex-shrink-0 w-24 h-16 rounded-md overflow-hidden bg-white/5">
                        <img
                          src={getYoutubeThumbnail(video.youtube_id)}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover/video:text-emerald transition-colors">
                          {video.title}
                        </p>
                        <p className="text-xs text-text-muted">
                          {video.channel} · {formatVideoTime(video.duration_seconds)}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-white/10">
                            {video.language === 'de' ? 'DE' : 'EN'}
                          </Badge>
                          <ExternalLink className="w-3 h-3 text-text-muted" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
