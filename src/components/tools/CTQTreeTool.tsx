import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface CTQItem { id: string; customerNeed: string; driver: string; ctq: string; spec: string; }

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function CTQTreeTool({ toolId = "ctq", toolName = "CTQ Tree", phase = 1 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<CTQItem[]>([]);
  const [form, setForm] = useState({ customerNeed: "", driver: "", ctq: "", spec: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const loaded = inputs.items as any[];
    if (Array.isArray(loaded)) {
      setItems(loaded.map(i => ({ id: crypto.randomUUID(), customerNeed: String(i.customerNeed || ""), driver: String(i.driver || ""), ctq: String(i.ctq || ""), spec: String(i.spec || "") })));
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addItem = () => {
    if (!form.customerNeed.trim() || !form.ctq.trim()) return;
    setItems([...items, { id: crypto.randomUUID(), ...form }]);
    setForm({ customerNeed: "", driver: "", ctq: "", spec: "" });
  };

  const loadExample = () => {
    if (isZh) {
      setItems([
        { id: crypto.randomUUID(), customerNeed: "门护板外观品质优异", driver: "注塑成型模具与工艺参数", ctq: "表面缩水下陷深度", spec: "≤ 0.08 mm (三坐标激光扫描)" },
        { id: crypto.randomUUID(), customerNeed: "装配卡扣稳固且易装", driver: "卡扣注塑韧度与公差尺寸", ctq: "卡接插入力 / 保持脱出力", spec: "插入力 30~40 N, 脱出力 ≥ 120 N" },
        { id: crypto.randomUUID(), customerNeed: "整车装配平整间隙小", driver: "门板边缘轮廓成型尺寸稳定", ctq: "轮廓轮边轮廓度公差", spec: "± 0.5 mm, Cpk ≥ 1.33" },
        { id: crypto.randomUUID(), customerNeed: "高低温环境无异响", driver: "塑料骨架热胀冷缩系数与刚度", ctq: "高低温循环测试异响振幅", spec: "-40℃ ~ 85℃ 连续测试零异常杂音" },
      ]);
    } else {
      setItems([
        { id: crypto.randomUUID(), customerNeed: "Rapid fulfillment", driver: "Order picking + transport", ctq: "Delivery Lead Time", spec: "<= 2 working days" },
        { id: crypto.randomUUID(), customerNeed: "Zero defect product", driver: "Machining precision", ctq: "Defect rate", spec: "< 0.5%" },
        { id: crypto.randomUUID(), customerNeed: "Clear order status", driver: "Dispatch confirmation", ctq: "Confirmation email latency", spec: "<= 5 mins" },
        { id: crypto.randomUUID(), customerNeed: "Effortless return", driver: "RMA workflow", ctq: "Refund processing speed", spec: "<= 24 hours" },
      ]);
    }
  };

  const hasResult = items.length > 0;

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "客户需求 (Need / VOC)" : "Customer Need"}</Label>
          <Input value={form.customerNeed} onChange={e => setForm({ ...form, customerNeed: e.target.value })} placeholder={isZh ? "外观品质优良..." : "e.g. Fast shipping"} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "驱动因素 (Driver)" : "Driver"}</Label>
          <Input value={form.driver} onChange={e => setForm({ ...form, driver: e.target.value })} placeholder={isZh ? "注塑工艺稳定性..." : "e.g. Picking speed"} className="text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "关键质量特性 (CTQ)" : "CTQ (Critical to Quality)"}</Label>
          <Input value={form.ctq} onChange={e => setForm({ ...form, ctq: e.target.value })} placeholder={isZh ? "表面缩水深度..." : "e.g. Lead time"} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "技术公差规范 (Spec Limits)" : "Specification Limits"}</Label>
          <Input value={form.spec} onChange={e => setForm({ ...form, spec: e.target.value })} placeholder={isZh ? "≤ 0.08 mm, Cpk≥1.33" : "e.g. <= 2 days, Cpk >= 1.33"} className="text-sm" />
        </div>
      </div>
      <Button size="sm" onClick={addItem} disabled={!form.customerNeed.trim() || !form.ctq.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "添加 CTQ 分解节点" : "Add CTQ Branch"}
      </Button>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-1.5 p-2 border rounded-lg text-xs bg-muted/30">
              <span className="font-semibold text-primary">{item.customerNeed}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-foreground">{item.driver || "–"}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-bold text-foreground">{item.ctq}</span>
              {item.spec && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono bg-background px-1.5 py-0.5 rounded border text-primary font-medium">{item.spec}</span>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto shrink-0" onClick={() => setItems(items.filter(i => i.id !== item.id))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { items }, results: { totalCTQs: items.length, withSpecs: items.filter(i => i.spec).length } })} />
    </div>
  );
}
