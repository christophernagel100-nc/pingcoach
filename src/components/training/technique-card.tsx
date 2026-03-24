import type { TechniqueGuide } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Play, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  categoryConfig,
  getYoutubeThumbnail,
  getYoutubeUrl,
  formatVideoTime,
} from '@/lib/training-utils'

interface TechniqueCardProps {
  technique: TechniqueGuide
}

export function TechniqueCard({ technique }: TechniqueCardProps) {
  const cat = categoryConfig[technique.category]
  const heroVideo = technique.videos[0]
  const additionalVideos = technique.videos.slice(1)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`${cat.color} border-current/20`}>
          {cat.label}
        </Badge>
      </div>

      <p className="text-sm text-text-secondary">{technique.description}</p>

      {/* Hero Video */}
      {heroVideo && (
        <a
          href={getYoutubeUrl(heroVideo.youtube_id)}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative rounded-xl overflow-hidden bg-white/5 hover:ring-2 hover:ring-emerald/30 transition-all group/hero"
        >
          <img
            src={getYoutubeThumbnail(heroVideo.youtube_id)}
            alt={heroVideo.title}
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/hero:bg-black/30 transition-colors">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/hero:scale-110 transition-transform">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-sm font-medium text-white">{heroVideo.title}</p>
            <p className="text-xs text-white/60">
              {heroVideo.channel} · {formatVideoTime(heroVideo.duration_seconds)}
              <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0 border-white/30 text-white/60">
                {heroVideo.language === 'de' ? 'DE' : 'EN'}
              </Badge>
            </p>
          </div>
        </a>
      )}

      {/* Key Points */}
      <div>
        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald" />
          Key Points
        </h4>
        <div className="space-y-2">
          {technique.key_points.map((kp, i) => (
            <div key={i} className="flex gap-3 p-2 rounded-lg bg-white/[0.02]">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald/10 text-emerald text-xs flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{kp.title}</p>
                <p className="text-xs text-text-secondary">{kp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Mistakes */}
      <div>
        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          Häufige Fehler
        </h4>
        <div className="space-y-2">
          {technique.common_mistakes.map((m, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-warning/5 border border-warning/10">
              <div className="flex items-start gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] flex-shrink-0 ${
                    m.severity === 'schwer'
                      ? 'text-destructive border-destructive/20'
                      : m.severity === 'mittel'
                        ? 'text-warning border-warning/20'
                        : 'text-text-muted border-white/10'
                  }`}
                >
                  {m.severity}
                </Badge>
                <div>
                  <p className="text-sm text-warning">{m.mistake}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{m.correction}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Videos */}
      {additionalVideos.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Weitere Videos
          </h4>
          <div className="space-y-2">
            {additionalVideos.map((video) => (
              <a
                key={video.youtube_id}
                href={getYoutubeUrl(video.youtube_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="relative flex-shrink-0 w-20 h-14 rounded-md overflow-hidden bg-white/5">
                  <img
                    src={getYoutubeThumbnail(video.youtube_id)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{video.title}</p>
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
      )}
    </div>
  )
}
