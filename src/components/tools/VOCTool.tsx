import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface VOCItem { id: string; source: string; need: string; priority: "high" | "med" | "low"; requirement: string; }

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function VOCTool({ toolId = "voc", toolName = "Voice of Customer", phase = 1 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<VOCItem[]>([]);
  const [source, setSource] = useState("");
  const [need, setNeed] = useState("");
  const [priority, setPriority] = useState<"high" | "med" | "low">("med");
  const [requirement, setRequirement] = useState("");

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const loaded = inputs.items as any[];
    if (Array.isArray(loaded)) {
      setItems(loaded.map(i => ({ 
        id: crypto.randomUUID(), 
        source: String(i.source || ""), 
        need: String(i.need || ""), 
        priority: (i.priority === "hög" || i.priority === "high" ? "high" : i.priority === "låg" || i.priority === "low" ? "low" : "med"), 
        requirement: String(i.requirement || "") 
      })));
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addItem = () => {
    if (!need.trim()) return;
    setItems([...items, { id: crypto.randomUUID(), source, need, priority, requirement }]);
    setSource(""); setNeed(""); setRequirement("");
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const hasResult = items.length > 0;
  const priorityColor = (p: string) => p === "high" ? "destructive" : p === "med" ? "default" : "secondary";

  const loadExample = () => {
    if (isZh) {
      setItems([
        { id: crypto.randomUUID(), source: "主机厂月度质量例会", need: "注塑外饰件装配零卡顿、无外观缩水", priority: "high", requirement: "表面缩水缺陷率 ≤ 1.5%，断差平整度 ≤ 0.5mm" },
        { id: crypto.randomUUID(), source: "主机厂装配车间一线反馈", need: "卡扣压装手感清脆顺畅，杜绝折断", priority: "high", requirement: "装配插入力 35±5N，拔出力 ≥ 120N" },
        { id: crypto.randomUUID(), source: "售后 0km 索赔报告", need: "严禁因振动产生异响", priority: "med", requirement: "整车 NVH 振动耐久测试 10万公里无异响" },
        { id: crypto.randomUUID(), source: "主机厂商务采购", need: "紧急订货响应与准时交付", priority: "high", requirement: "订单排产响应 ≤ 24小时，准时交货率 100%" },
      ]);
    } else {
      setItems([
        { id: crypto.randomUUID(), source: "Customer Interview", need: "Rapid delivery", priority: "high", requirement: "Lead time <= 2 working days" },
        { id: crypto.randomUUID(), source: "NPS Survey", need: "Clear automated dispatch updates", priority: "med", requirement: "Email & SMS within 5 mins" },
        { id: crypto.randomUUID(), source: "Quality Claim", need: "Zero defect shipment", priority: "high", requirement: "Defect rate < 0.5%" },
        { id: crypto.randomUUID(), source: "Sales Team", need: "Extended return window", priority: "low", requirement: "Standard 30-day RMA policy" },
      ]);
    }
  };

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "需求输入源 (Source)" : "Source"}</Label>
          <Input value={source} onChange={e => setSource(e.target.value)} placeholder={isZh ? "客户访谈、NPS、质保索赔..." : "Interview, survey, claim..."} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "客户真实诉求 (Customer Need)" : "Customer Need"}</Label>
          <Input value={need} onChange={e => setNeed(e.target.value)} placeholder={isZh ? "客户在抱怨什么或期望什么？" : "What does customer actually value?"} className="text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "关键量化技术指标 (CTQ / Requirement)" : "Measurable Requirement"}</Label>
          <Input value={requirement} onChange={e => setRequirement(e.target.value)} placeholder={isZh ? "如：装配力 35±5N、缺陷率<1%" : "e.g. Lead time <= 2 days, Cpk >= 1.33"} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "影响优先级 (Priority)" : "Priority"}</Label>
          <Select value={priority} onValueChange={v => setPriority(v as any)}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">{isZh ? "高 (Critical)" : "High"}</SelectItem>
              <SelectItem value="med">{isZh ? "中 (Medium)" : "Medium"}</SelectItem>
              <SelectItem value="low">{isZh ? "低 (Low)" : "Low"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button size="sm" onClick={addItem} disabled={!need.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "添加到 VOC 需求矩阵" : "Add VOC Item"}
      </Button>

      {items.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">{isZh ? "信息源" : "Source"}</th>
                <th className="text-left p-2">{isZh ? "客户期望/痛点" : "Customer Need"}</th>
                <th className="text-left p-2">{isZh ? "量化技术指标 (CTQ)" : "Specification"}</th>
                <th className="p-2">{isZh ? "优先级" : "Priority"}</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="p-2 text-muted-foreground">{item.source || "–"}</td>
                  <td className="p-2 font-medium">{item.need}</td>
                  <td className="p-2 font-mono">{item.requirement || "–"}</td>
                  <td className="p-2 text-center">
                    <Badge variant={priorityColor(item.priority)} className="text-[10px]">
                      {item.priority === "high" ? (isZh ? "高" : "High") : item.priority === "med" ? (isZh ? "中" : "Med") : (isZh ? "低" : "Low")}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasResult && (
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          {isZh ? (
            <>共识别 <span className="font-semibold text-foreground">{items.length}</span> 项客户需求 • 其中高优先级 <span className="font-semibold text-destructive">{items.filter(i => i.priority === "high").length}</span> 项 • 已定义量化要求 <span className="font-semibold text-primary">{items.filter(i => i.requirement).length}</span> 项</>
          ) : (
            <><span className="font-semibold text-foreground">{items.length} needs</span> identified • <span className="font-semibold text-destructive">{items.filter(i => i.priority === "high").length} high priority</span> • <span className="font-semibold text-primary">{items.filter(i => i.requirement).length} with measurable specs</span></>
          )}
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { items }, results: { totalNeeds: items.length, highPriority: items.filter(i => i.priority === "high").length, withRequirements: items.filter(i => i.requirement).length } })} />
    </div>
  );
}
