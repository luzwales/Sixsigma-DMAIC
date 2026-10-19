import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

const DEFAULT_CATEGORIES = [
  { key: "manniska", label: "Människa", emoji: "👤" },
  { key: "maskin", label: "Maskin", emoji: "⚙️" },
  { key: "material", label: "Material", emoji: "📦" },
  { key: "metod", label: "Metod", emoji: "📋" },
  { key: "miljo", label: "Miljö", emoji: "🌍" },
  { key: "matning", label: "Mätning", emoji: "📏" },
];

type CausesMap = Record<string, string[]>;

interface FishboneDiagramProps { toolId?: string; toolName?: string; phase?: number; }

export function FishboneDiagram({ toolId = "fishbone", toolName = "Fiskbensdiagram", phase = 2 }: FishboneDiagramProps) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const categories = isZh ? [
    { key: "manniska", label: "人员 (Man)", emoji: "👤" },
    { key: "maskin", label: "设备 (Machine)", emoji: "⚙️" },
    { key: "material", label: "物料 (Material)", emoji: "📦" },
    { key: "metod", label: "方法 (Method)", emoji: "📋" },
    { key: "miljo", label: "环境 (Milieu / Mother Nature)", emoji: "🌡️" },
    { key: "matning", label: "测量 (Measurement)", emoji: "📏" },
  ] : DEFAULT_CATEGORIES;

  const [effect, setEffect] = useState("");
  const [causes, setCauses] = useState<CausesMap>(
    Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.key, [""]]))
  );

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    setEffect(String(inputs.effect || ""));
    const c = inputs.causes as any;
    if (c) {
      const newCauses: CausesMap = {};
      for (const cat of DEFAULT_CATEGORIES) {
        // Try both key and label (saves used label as key)
        const vals = c[cat.key] || c[cat.label];
        newCauses[cat.key] = Array.isArray(vals) ? vals.map(String) : [""];
      }
      setCauses(newCauses);
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const updateCause = (category: string, index: number, value: string) => {
    setCauses((prev) => ({ ...prev, [category]: prev[category].map((c, i) => (i === index ? value : c)) }));
  };
  const addCause = (category: string) => setCauses((prev) => ({ ...prev, [category]: [...prev[category], ""] }));
  const removeCause = (category: string, index: number) => {
    if (causes[category].length > 1) setCauses((prev) => ({ ...prev, [category]: prev[category].filter((_, i) => i !== index) }));
  };
  const reset = () => { setEffect(""); setCauses(Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.key, [""]]))); };
  const loadExample = () => {
    if (isZh) {
      setEffect("汽车门护板装配表面持续出现注塑缩水凹陷下沉");
      setCauses({
        manniska: ["夜班调机师傅缺乏工艺参数锁定规范培训", "操作工保压时间观察巡检频次不足"],
        maskin: ["2号注塑机比例压力阀伺服磨损内泄", "料筒3区加热圈老化导致实际温度偏低"],
        material: ["改性ABS/PC原料粒子干燥水分含量超标", "不同批次原料熔融指数 (MFI) 波动大"],
        metod: ["关键保压压力设定偏低 (85 bar < 110 bar)", "注塑冷却保压时间缩短了 3.5 秒"],
        miljo: ["夜班车间冷却循环水进水温度仅 14℃", "环境温湿度日夜温差超过 15℃"],
        matning: ["壁厚与下陷测量卡尺读数存在视差", "三坐标扫描程序取点位置与数模存在偏差"],
      });
    } else {
      setEffect("High defect rate in final inspection");
      setCauses({
        manniska: ["Lack of onboarding training", "Fatigue during weekend overtime shifts"],
        maskin: ["Servo valve pressure drift", "Worn mold gating bushings"],
        material: ["Resin moisture content out of spec", "MFI variance between raw material lots"],
        metod: ["Low holding pressure setting (85 vs 110 bar)", "Cooling cycle reduced by 3.5s"],
        miljo: ["Cooling water temperature fluctuated overnight", "Workshop temperature drop in winter"],
        matning: ["Dial caliper parallax reading error", "CMM inspection program coordinate drift"],
      });
    }
  };


  const totalCauses = Object.values(causes).flat().filter((c) => c.trim()).length;
  const hasResult = totalCauses > 0 && !!effect.trim();

  const handleSave = () => {
    const filledCauses: Record<string, string[]> = {};
    for (const cat of DEFAULT_CATEGORIES) {
      const filled = causes[cat.key].filter(c => c.trim());
      if (filled.length > 0) filledCauses[cat.label] = filled;
    }
    saveCalculation({ toolId, toolName, phase, inputs: { effect, causes: filledCauses }, results: { totalCauses, categoriesUsed: Object.keys(filledCauses).length } });
  };

  return (
    <div className="space-y-4">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div>
        <Label className="text-sm font-medium text-foreground">
          {isZh ? "主要质量问题/效应 (Effect)" : "Problem/Effekt"}
        </Label>
        <Input 
          placeholder={isZh ? "例如：汽车门护板装配表面持续出现注塑缩水凹陷..." : "T.ex. Hög andel defekta produkter i slutkontroll"} 
          value={effect} 
          onChange={(e) => setEffect(e.target.value)} 
          className="mt-1" 
        />
      </div>

      {effect && (
        <div className="border rounded-lg p-4 bg-background overflow-x-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-destructive/10 border-2 border-destructive rounded-lg px-4 py-2 text-center">
              <p className="text-sm font-bold text-destructive">{effect}</p>
            </div>
          </div>
          <div className="h-0.5 bg-foreground/30 mx-8 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEFAULT_CATEGORIES.map((cat) => {
              const filled = causes[cat.key].filter((c) => c.trim()).length;
              return (
                <div key={cat.key} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="gap-1">{cat.emoji} {cat.label}</Badge>
                    {filled > 0 && <span className="text-xs text-muted-foreground">{filled} orsak{filled !== 1 ? "er" : ""}</span>}
                  </div>
                  {causes[cat.key].map((cause, i) => (
                    <div key={i} className="flex gap-1">
                      <Input 
                        value={cause} 
                        onChange={(e) => updateCause(cat.key, i, e.target.value)} 
                        placeholder={isZh ? `填写${cat.label}维度的潜在诱因...` : `Orsak inom ${cat.label.toLowerCase()}...`} 
                        className="text-sm" 
                      />
                      {causes[cat.key].length > 1 && <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => removeCause(cat.key, i)}><Trash2 className="h-3 w-3" /></Button>}
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => addCause(cat.key)}>
                    <Plus className="h-3 w-3 mr-1" /> {isZh ? "添加原因" : "Lägg till"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!effect && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div key={cat.key} className="border rounded-lg p-3 space-y-2">
              <Badge variant="outline" className="gap-1">{cat.emoji} {cat.label}</Badge>
              {causes[cat.key].map((cause, i) => (
                <div key={i} className="flex gap-1">
                  <Input 
                    value={cause} 
                    onChange={(e) => updateCause(cat.key, i, e.target.value)} 
                    placeholder={isZh ? "潜在原因..." : "Orsak..."} 
                    className="text-sm" 
                  />
                  {causes[cat.key].length > 1 && <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => removeCause(cat.key, i)}><Trash2 className="h-3 w-3" /></Button>}
                </div>
              ))}
              <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => addCause(cat.key)}>
                <Plus className="h-3 w-3 mr-1" /> {isZh ? "添加原因" : "Lägg till"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {totalCauses > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <p className="font-medium">{isZh ? "鱼骨图头脑风暴汇总" : "Sammanfattning"}</p>
          <p className="text-muted-foreground">
            {isZh 
              ? `共发散识别出 ${totalCauses} 个潜在因子，分布于 ${categories.filter((c) => causes[c.key].some((v) => v.trim())).length} / 6 个维度` 
              : `${totalCauses} identifierade orsaker fördelade på ${categories.filter((c) => causes[c.key].some((v) => v.trim())).length} av 6 kategorier`}
          </p>
          {categories.filter((c) => causes[c.key].some((v) => v.trim())).map((cat) => (
            <p key={cat.key} className="text-muted-foreground">{cat.emoji} {cat.label}: {causes[cat.key].filter((v) => v.trim()).join(", ")}</p>
          ))}
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={handleSave} />

      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="h-3 w-3 mr-1" /> {isZh ? "清空重置" : "Återställ"}
        </Button>
      </div>
    </div>
  );
}
