import { Link } from "react-router-dom";
import { Phase } from "@/data/dmaic-tools";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface PhaseCardProps {
  phase: Phase;
  index: number;
}

export function PhaseCard({ phase, index }: PhaseCardProps) {
  const { locale, t } = useLanguage();
  const name = locale === "zh" ? phase.nameZh || phase.name : phase.name;
  const description = locale === "zh" ? phase.descriptionZh || phase.description : phase.description;

  return (
    <Link
      to={`/phase/${phase.id}`}
      className="phase-card group block"
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-6 h-full",
        "bg-gradient-to-br",
        phase.color,
        "text-white shadow-lg"
      )}>
        {/* Phase Number Badge */}
        <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-lg font-bold">
          {phase.id}
        </div>

        {/* Icon */}
        <div className="text-4xl mb-4">{phase.icon}</div>

        {/* Content */}
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <p className="text-white/90 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        {/* Tool count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">
            {t("common.toolsCount", `${phase.tools.length} 个工具`).replace("{{count}}", String(phase.tools.length))}
          </span>
          <span className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">
            {t("common.explore", "探索")} <ArrowRight className="h-4 w-4" />
          </span>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -right-16 h-24 w-24 rounded-full bg-white/5" />
      </div>
    </Link>
  );
}
