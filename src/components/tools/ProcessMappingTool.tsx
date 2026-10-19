import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

type StepType = "operation" | "transport" | "inspection" | "delay" | "storage";
interface ProcessStep { id: string; name: string; type: StepType; time: number; valueAdd: boolean; responsible: string; }

const getTypeLabels = (isZh: boolean): Record<StepType, string> => ({
  operation: isZh ? "⚙️ 加工/增值作业 (Operation)" : "⚙️ Operation",
  transport: isZh ? "🚚 物流搬运 (Transport)" : "🚚 Transport",
  inspection: isZh ? "🔍 质量检验 (Inspection)" : "🔍 Inspection",
  delay: isZh ? "⏳ 等待停滞 (Delay)" : "⏳ Delay / Queue",
  storage: isZh ? "📦 仓储在制品 (Storage)" : "📦 Storage / Inventory",
});

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function ProcessMappingTool({ toolId = "process-mapping", toolName = "Processkartläggning", phase = 2 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";
  const typeLabels = getTypeLabels(isZh);

  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [form, setForm] = useState({ name: "", type: "operation" as StepType, time: "", valueAdd: true, responsible: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const loaded = inputs.steps as any[];
    if (Array.isArray(loaded)) {
      setSteps(loaded.map(s => ({ id: crypto.randomUUID(), name: String(s.name || ""), type: (s.type || "operation") as StepType, time: Number(s.time) || 0, valueAdd: s.valueAdd !== false, responsible: String(s.responsible || "") })));
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addStep = () => {
    if (!form.name.trim()) return;
    setSteps([...steps, { id: crypto.randomUUID(), name: form.name, type: form.type, time: parseFloat(form.time) || 0, valueAdd: form.valueAdd, responsible: form.responsible }]);
    setForm({ ...form, name: "", time: "", responsible: "" });
  };

  const moveStep = (idx: number, dir: number) => { const n = [...steps]; const [item] = n.splice(idx, 1); n.splice(idx + dir, 0, item); setSteps(n); };

  const loadExample = () => {
    const sample: { name: string; type: StepType; time: number; valueAdd: boolean; responsible: string }[] = isZh ? [
      { name: "颗粒烘干与自动上料", type: "operation", time: 120, valueAdd: true, responsible: "配料员" },
      { name: "注塑成型及保压保型", type: "operation", time: 50, valueAdd: true, responsible: "注塑机" },
      { name: "冷却传送带等待降温", type: "delay", time: 15, valueAdd: false, responsible: "冷却线" },
      { name: "机械手剪切冷流道水口", type: "operation", time: 10, valueAdd: true, responsible: "机器人" },
      { name: "转运至超声波骨架焊接站", type: "transport", time: 8, valueAdd: false, responsible: "AGV小车" },
      { name: "卡扣装配与全尺寸检测", type: "inspection", time: 12, valueAdd: false, responsible: "专检员" },
      { name: "产线中间暂存区堆积", type: "storage", time: 180, valueAdd: false, responsible: "线边仓" },
      { name: "成品装箱与打托入库", type: "operation", time: 25, valueAdd: true, responsible: "打包工" },
    ] : [
      { name: "Receive & Log Order", type: "operation", time: 3, valueAdd: true, responsible: "Admin" },
      { name: "Credit Check", type: "inspection", time: 8, valueAdd: false, responsible: "Finance" },
      { name: "Wait for Approval Queue", type: "delay", time: 45, valueAdd: false, responsible: "–" },
      { name: "Wave Picking", type: "operation", time: 12, valueAdd: true, responsible: "Warehouse" },
      { name: "Transport to Packing", type: "transport", time: 5, valueAdd: false, responsible: "Logistics" },
      { name: "Carton Packing", type: "operation", time: 7, valueAdd: true, responsible: "Packers" },
      { name: "Staging Storage", type: "storage", time: 30, valueAdd: false, responsible: "Shipping Bay" },
      { name: "Dispatch Carrier Loading", type: "transport", time: 6, valueAdd: false, responsible: "Carrier" },
    ];
    setSteps(sample.map(s => ({ id: crypto.randomUUID(), ...s })));
  };

  const hasResult = steps.length > 0;
  const totalTime = steps.reduce((s, step) => s + step.time, 0);
  const vaTime = steps.filter(s => s.valueAdd).reduce((s, step) => s + step.time, 0);
  const pceRatio = totalTime > 0 ? (vaTime / totalTime * 100) : 0;

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "工序名称 (Step Name)" : "Step Name"}</Label>
          <Input 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            placeholder={isZh ? "例如：注塑成型、冲压、检测..." : "e.g. Assembly, Stamping"} 
            className="text-sm" 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "流程活动类别 (Type)" : "Activity Type"}</Label>
          <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as StepType })}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "工序耗时 (分钟)" : "Duration (mins)"}</Label>
          <Input type="number" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} placeholder="5" className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "操作责任人" : "Responsible"}</Label>
          <Input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} placeholder={isZh ? "操作工、质检员..." : "Operator"} className="text-sm" />
        </div>
        <div className="flex items-end col-span-2 sm:col-span-1">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer font-medium">
            <input type="checkbox" checked={form.valueAdd} onChange={e => setForm({ ...form, valueAdd: e.target.checked })} className="rounded" />
            {isZh ? "增值作业 (Value-Add)" : "Value Added"}
          </label>
        </div>
      </div>
      <Button size="sm" onClick={addStep} disabled={!form.name.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "添加流程工序" : "Add Step"}
      </Button>

      {hasResult && (
        <>
          <div className="space-y-1 pt-1">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex flex-wrap items-center gap-1.5 text-xs p-2 border rounded bg-muted/20">
                <span className="w-5 text-center font-bold text-muted-foreground shrink-0">#{idx + 1}</span>
                <Badge variant={step.valueAdd ? "default" : "secondary"} className="text-[10px] shrink-0">{typeLabels[step.type]}</Badge>
                <span className="font-semibold flex-1 min-w-0 truncate">{step.name}</span>
                {step.time > 0 && <span className="text-muted-foreground shrink-0 font-mono">{step.time} min</span>}
                {step.responsible && <span className="text-muted-foreground shrink-0 font-medium">[{step.responsible}]</span>}
                <div className="flex gap-0.5 shrink-0 ml-1">
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0} onClick={() => moveStep(idx, -1)}><MoveUp className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === steps.length - 1} onClick={() => moveStep(idx, 1)}><MoveDown className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSteps(steps.filter(s => s.id !== step.id))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-xs grid grid-cols-3 gap-2 text-center border">
            <div><div className="font-bold text-base text-foreground">{steps.length}</div><div className="text-muted-foreground">{isZh ? "总工序数" : "Total Steps"}</div></div>
            <div><div className="font-bold text-base text-foreground">{totalTime} min</div><div className="text-muted-foreground">{isZh ? "流程总耗时" : "Total Lead Time"}</div></div>
            <div><div className="font-bold text-base text-primary">{pceRatio.toFixed(1)}%</div><div className="text-muted-foreground">{isZh ? "流程周转效率 (PCE)" : "Process Cycle Efficiency"}</div></div>
          </div>
        </>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { steps }, results: { totalSteps: steps.length, totalTime, valueAddTime: vaTime, pce: pceRatio, nonValueAddSteps: steps.filter(s => !s.valueAdd).length } })} />
    </div>
  );
}
