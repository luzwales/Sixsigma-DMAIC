import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageContext";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-2 gap-1.5 text-xs font-semibold">
          <Globe className="h-4 w-4" />
          <span>{locale === "zh" ? "中文" : "EN"}</span>
          <span className="sr-only">{t("nav.switchLang", "切换语言")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale("zh")}
          className={locale === "zh" ? "bg-accent font-bold" : ""}
        >
          🇨🇳 简体中文 (Chinese)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("en")}
          className={locale === "en" ? "bg-accent font-bold" : ""}
        >
          🇺🇸 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
