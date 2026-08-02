import { Lightbulb } from "lucide-react";

interface QuickTipProps {
  tip: string;
}

export function QuickTip({ tip }: QuickTipProps) {
  return (
    <div className="glow-emerald flex items-start gap-3 rounded-xl border border-emerald/20 bg-emerald/[0.06] px-5 py-4 mb-8">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald/20 flex items-center justify-center">
        <Lightbulb className="w-4 h-4 text-emerald" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald mb-1">
          Schneller Trick
        </p>
        <p className="text-sm text-text-primary leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}
