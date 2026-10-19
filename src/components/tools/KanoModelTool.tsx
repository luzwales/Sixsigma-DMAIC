import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

type KanoCategory = "must-be" | "performance" | "delighter" | "indifferent" | "reverse";

interface KanoItem { id: string; feature: string; functional: string; dysfunctional: string; category: KanoCategory; }

const getCategoryLabel = (cat: KanoCategory, isZh: boolean): string => {
  if (isZh) {
    const zhMap: Record<KanoCategory, string> = {
      "must-be": "必备属性 (Must-be)",
      "performance": "期望属性 (Performance)",
      "delighter": "魅力属性 (Delighter)",
      "indifferent": "无差异属性 (Indifferent)",
      "reverse": "反向属性 (Reverse)"
    };
    return zhMap[cat];
  }
  const enMap: Record<KanoCategory, string> = {
    "must-be": "Must-be",
    "performance": "Performance",
    "delighter": "Delighter / Attractive",
    "indifferent": "Indifferent",
    "reverse": "Reverse"
  };
  return enMap[cat];
};

const categoryColors: Record<KanoCategory, "destructive" | "default" | "secondary" | "outline"> = { "must-be": "destructive", "performance": "default", "delighter": "secondary", "indifferent": "outline", "reverse": "outline" };

const classifyKano = (functional: string, dysfunctional: string): KanoCategory => {
  const f = parseInt(functional); const d = parseInt(dysfunctional);
  if (f >= 4 && d <= 2) return "delighter";
  if (f >= 4 && d >= 4) return "performance";
  if (f <= 2 && d >= 4) return "must-be";
  if (f <= 2 && d <= 2) return "indifferent";
  return "indifferent";
};

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function KanoModelTool({ toolId = "kano-model", toolName = "Kano-modell", phase = 1 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<KanoItem[]>([]);
  const [feature, setFeature] = useState("");
  const [functional, setFunctional] = useState("3");
  const [dysfunctional, setDysfunctional] = useState("3");

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const loaded = inputs.items as any[];
    if (Array.isArray(loaded)) {
      setItems(loaded.map(i => ({ id: crypto.randomUUID(), feature: String(i.feature || ""), functional: String(i.functional || "3"), dysfunctional: String(i.dysfunctional || "3"), category: (i.category || "indifferent") as KanoCategory })));
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const responses = isZh 
    ? ["1 – 不喜欢/厌恶", "2 – 勉强容忍", "3 – 无所谓/中立", "4 – 理应如此/理所当然", "5 – 非常喜欢/惊喜"]
    : ["1 – Dislike", "2 – Tolerate", "3 – Neutral", "4 – Expect it", "5 – Like it"];

  const addItem = () => {
    if (!feature.trim()) return;
    const category = classifyKano(functional, dysfunctional);
    setItems([...items, { id: crypto.randomUUID(), feature, functional, dysfunctional, category }]);
    setFeature("");
  };

  const loadExample = () => {
    const sample = isZh ? [
      { feature: "注塑门护板表面无缩水下陷", f: "4", d: "5" },
      { feature: "关键尺寸检验合格证随箱附带", f: "4", d: "5" },
      { feature: "注塑成型周期缩短 10%", f: "5", d: "3" },
      { feature: "全过程零件二维码溯源追踪", f: "5", d: "2" },
      { feature: "防静电环保可降解包装", f: "5", d: "3" },
      { feature: "外箱印制彩色品牌标识", f: "3", d: "3" },
    ] : [
      { feature: "Zero surface sink marks", f: "4", d: "5" },
      { feature: "Dimensional inspection report included", f: "4", d: "5" },
      { feature: "Cycle time reduced by 10%", f: "5", d: "3" },
      { feature: "QR-code trace on each part", f: "5", d: "2" },
      { feature: "Anti-static eco packaging", f: "5", d: "3" },
      { feature: "Color-printed brand logo on carton", f: "3", d: "3" },
    ];
    setItems(sample.map(x => ({
      id: crypto.randomUUID(),
      feature: x.feature,
      functional: x.f,
      dysfunctional: x.d,
      category: classifyKano(x.f, x.d),
    })));
  };

  const hasResult = items.length > 0;
  const currentCategory = classifyKano(functional, dysfunctional);

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="space-y-1">
        <Label className="text-xs">{isZh ? "产品功能/质量特性 (Feature / Spec)" : "Feature / Characteristic"}</Label>
        <Input 
          value={feature} 
          onChange={e => setFeature(e.target.value)} 
          placeholder={isZh ? "例如：注塑门护板表面无缩水、SMS发货通知..." : "e.g. Delivery notification via SMS"} 
          className="text-sm" 
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "正向具备 (如果具备该功能客户感觉)" : "Functional (If present)"}</Label>
          <Select value={functional} onValueChange={setFunctional}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{responses.map((r, i) => <SelectItem key={i} value={String(i+1)}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "反向缺失 (如果不具备该功能客户感觉)" : "Dysfunctional (If absent)"}</Label>
          <Select value={dysfunctional} onValueChange={setDysfunctional}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{responses.map((r, i) => <SelectItem key={i} value={String(i+1)}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="text-xs flex items-center gap-1.5">
        <span className="text-muted-foreground">{isZh ? "Kano 属性判定:" : "Classification:"}</span>
        <Badge variant={categoryColors[currentCategory]}>
          {getCategoryLabel(currentCategory, isZh)}
        </Badge>
      </div>
      <Button size="sm" onClick={addItem} disabled={!feature.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "添加 Kano 评估项" : "Add Feature"}
      </Button>

      {hasResult && (
        <div className="space-y-2 pt-2 border-t">
          {(["must-be", "performance", "delighter", "indifferent"] as KanoCategory[]).map(cat => {
            const catItems = items.filter(i => i.category === cat);
            if (!catItems.length) return null;
            return (
              <div key={cat} className="text-xs">
                <Badge variant={categoryColors[cat]} className="text-[10px] mb-1">
                  {getCategoryLabel(cat, isZh)} ({catItems.length})
                </Badge>
                {catItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-2 p-1.5 border rounded ml-2 mb-1 bg-muted/20">
                    <span className="min-w-0 truncate font-medium">{item.feature}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => setItems(items.filter(x => x.id !== item.id))}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { items }, results: { total: items.length, mustBe: items.filter(i => i.category === "must-be").length, performance: items.filter(i => i.category === "performance").length, delighters: items.filter(i => i.category === "delighter").length } })} />
    </div>
  );
}
