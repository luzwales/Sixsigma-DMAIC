import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";

interface Stakeholder { id: string; name: string; power: number; interest: number; strategy: string; }

interface Props { toolId?: string; toolName?: string; phase?: number; }

const getStrategy = (power: number, interest: number, isZh: boolean) => {
  if (power >= 5 && interest >= 5) return isZh ? "重点管理 (Hantera nära)" : "Manage Closely";
  if (power >= 5 && interest < 5) return isZh ? "令其满意 (Håll nöjda)" : "Keep Satisfied";
  if (power < 5 && interest >= 5) return isZh ? "及时告知 (Håll informerade)" : "Keep Informed";
  return isZh ? "常规监督 (Övervaka)" : "Monitor";
};

const strategyColor = (s: string) => {
  if (s.includes("Hantera") || s.includes("Manage")) return "destructive";
  if (s.includes("nöjda") || s.includes("Satisfied")) return "default";
  if (s.includes("informerade") || s.includes("Informed")) return "secondary";
  return "outline";
};

export function StakeholderAnalysisTool({ toolId = "stakeholder-analysis", toolName = "Intressentanalys", phase = 1 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [name, setName] = useState("");
  const [power, setPower] = useState([5]);
  const [interest, setInterest] = useState([5]);

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const loaded = inputs.stakeholders as Stakeholder[] | undefined;
    if (Array.isArray(loaded)) setStakeholders(loaded);
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addStakeholder = () => {
    if (!name.trim()) return;
    const strategy = getStrategy(power[0], interest[0], isZh);
    setStakeholders([...stakeholders, { id: crypto.randomUUID(), name, power: power[0], interest: interest[0], strategy }]);
    setName("");
  };

  const loadExample = () => {
    const sample = isZh ? [
      { name: "公司总经理 (CEO)", p: 9, i: 7 },
      { name: "生产制造总监", p: 8, i: 9 },
      { name: "现场操作班长", p: 4, i: 8 },
      { name: "质量控制科长", p: 7, i: 9 },
      { name: "设备维修主管", p: 6, i: 7 },
      { name: "物流仓储主管", p: 4, i: 4 },
    ] : [
      { name: "General Manager", p: 9, i: 7 },
      { name: "Production Director", p: 8, i: 9 },
      { name: "Shift Supervisors", p: 4, i: 8 },
      { name: "Quality Manager", p: 7, i: 9 },
      { name: "Maintenance Lead", p: 6, i: 7 },
      { name: "Supply Chain", p: 4, i: 4 },
    ];
    setStakeholders(sample.map(s => ({
      id: crypto.randomUUID(),
      name: s.name,
      power: s.p,
      interest: s.i,
      strategy: getStrategy(s.p, s.i, isZh),
    })));
  };

  const hasResult = stakeholders.length > 0;

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      <div className="space-y-2">
        <Label className="text-xs">{isZh ? "利益相关方姓名/岗位角色" : "Stakeholder Name / Role"}</Label>
        <Input 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder={isZh ? "例如：生产制造总监、质量科长..." : "e.g. Production Director"} 
          className="text-sm" 
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? `决策权力 (Power): ${power[0]}/10` : `Power / Influence: ${power[0]}/10`}</Label>
          <Slider value={power} onValueChange={setPower} min={1} max={10} step={1} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? `关注利益 (Interest): ${interest[0]}/10` : `Interest / Impact: ${interest[0]}/10`}</Label>
          <Slider value={interest} onValueChange={setInterest} min={1} max={10} step={1} />
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {isZh ? "推荐沟通与参与策略: " : "Recommended Strategy: "}
        <Badge variant={strategyColor(getStrategy(power[0], interest[0], isZh))} className="text-[10px]">
          {getStrategy(power[0], interest[0], isZh)}
        </Badge>
      </div>
      <Button size="sm" onClick={addStakeholder} disabled={!name.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "添加相关方到矩阵" : "Add Stakeholder"}
      </Button>

      {hasResult && (
        <>
          <div className="relative border rounded-lg p-4 h-48 bg-muted/20">
            <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-muted-foreground/30" />
            <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-muted-foreground/30" />
            <div className="absolute top-1 left-2 text-[10px] font-medium text-muted-foreground">
              {isZh ? "令其满意 (高权/低利)" : "Keep Satisfied (High P / Low I)"}
            </div>
            <div className="absolute top-1 right-2 text-[10px] font-medium text-primary">
              {isZh ? "重点管理 (高权/高利)" : "Manage Closely (High P / High I)"}
            </div>
            <div className="absolute bottom-1 left-2 text-[10px] font-medium text-muted-foreground">
              {isZh ? "常规监督 (低权/低利)" : "Monitor (Low P / Low I)"}
            </div>
            <div className="absolute bottom-1 right-2 text-[10px] font-medium text-muted-foreground">
              {isZh ? "及时告知 (低权/高利)" : "Keep Informed (Low P / High I)"}
            </div>
            {stakeholders.map(s => (
              <div key={s.id} className="absolute w-2.5 h-2.5 rounded-full bg-primary" style={{ left: `${(s.interest / 10) * 88 + 6}%`, bottom: `${(s.power / 10) * 82 + 6}%` }} title={s.name}>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap font-medium">{s.name}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {stakeholders.map(s => (
              <div key={s.id} className="flex flex-wrap items-center gap-1.5 text-xs p-1.5 border rounded">
                <span className="font-medium flex-1 min-w-0 truncate">{s.name}</span>
                <span className="text-muted-foreground shrink-0">{isZh ? "权" : "P"}:{s.power} {isZh ? "利" : "I"}:{s.interest}</span>
                <Badge variant={strategyColor(s.strategy)} className="text-[10px] shrink-0">{s.strategy}</Badge>
                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => setStakeholders(stakeholders.filter(x => x.id !== s.id))}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { stakeholders }, results: { total: stakeholders.length, manageClosely: stakeholders.filter(s => s.strategy === "Hantera nära").length } })} />
    </div>
  );
}
