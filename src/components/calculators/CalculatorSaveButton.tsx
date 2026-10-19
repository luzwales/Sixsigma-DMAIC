import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface CalculatorSaveButtonProps {
  canSave: boolean;
  isSaving: boolean;
  hasResult: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  className?: string;
}

export function CalculatorSaveButton({
  canSave,
  isSaving,
  hasResult,
  notes,
  onNotesChange,
  onSave,
  className,
}: CalculatorSaveButtonProps) {
  const { locale } = useLanguage();
  if (!canSave) return null;

  return (
    <div className={cn("space-y-2 border-t pt-3 mt-3", className)}>
      <Textarea
        placeholder={locale === "zh" ? "添加分析备注 (可选)..." : "Add notes (optional)..."}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        className="h-16 text-sm resize-none"
      />
      <Button
        onClick={onSave}
        disabled={!hasResult || isSaving}
        size="sm"
        variant="outline"
        className="w-full gap-2"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {locale === "zh" ? "正在保存..." : "Saving..."}
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {locale === "zh" ? "保存至项目归档" : "Save to Project"}
          </>
        )}
      </Button>
    </div>
  );
}
