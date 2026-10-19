import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface ExampleDataButtonProps {
  onLoad: () => void;
  label?: string;
}

export function ExampleDataButton({ onLoad, label }: ExampleDataButtonProps) {
  const { locale } = useLanguage();
  const defaultLabel = locale === "zh" ? "加载示例数据" : "Example Data";
  const displayLabel = label || defaultLabel;

  return (
    <div className="flex justify-end">
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onLoad}>
        <Sparkles className="h-3 w-3" /> {displayLabel}
      </Button>
    </div>
  );
}
