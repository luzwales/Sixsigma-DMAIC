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
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function PughMatrixTool({ toolId = "pugh-matrix", toolName = "Pugh Matrix", phase = 4 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [criteria, setCriteria] = useState<{ id: string; name: string; weight: number }[]>([]);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [criterionName, setCriterionName] = useState("");
  const [criterionWeight, setCriterionWeight] = useState("1");
  const [altName, setAltName] = useState("");

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const c = inputs.criteria as any[];
    const a = inputs.alternatives as any[];
    const s = inputs.scores as any;
    if (Array.isArray(c)) {
      const newCriteria = c.map(cr => ({ id: crypto.randomUUID(), name: String(cr.name || ""), weight: Number(cr.weight) || 1 }));
      setCriteria(newCriteria);
      if (Array.isArray(a)) setAlternatives(a.map(String));
      if (s && Array.isArray(c)) {
        const oldIds = c.map(cr => cr.id);
        const newScores: Record<string, Record<string, number>> = {};
        oldIds.forEach((oldId, idx) => {
          if (s[oldId]) newScores[newCriteria[idx].id] = s[oldId];
        });
        setScores(newScores);
      }
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addCriterion = () => {
    if (!criterionName.trim()) return;
    setCriteria([...criteria, { id: crypto.randomUUID(), name: criterionName, weight: parseFloat(criterionWeight) || 1 }]);
    setCriterionName("");
  };

  const addAlternative = () => {
    if (!altName.trim() || alternatives.includes(altName)) return;
    setAlternatives([...alternatives, altName]);
    setAltName("");
  };

  const setScore = (criterionId: string, alt: string, score: number) => {
    setScores(prev => ({ ...prev, [criterionId]: { ...prev[criterionId], [alt]: score } }));
  };

  const loadExample = () => {
    const crits = isZh ? [
      { name: "实施与改造成本", weight: 3 },
      { name: "工程可行性与落地难度", weight: 2 },
      { name: "对生产节拍/周转时间的削减", weight: 3 },
      { name: "产品质量合格率提升", weight: 2 },
      { name: "上线交付周期", weight: 1 },
    ].map(c => ({ id: crypto.randomUUID(), ...c })) : [
      { name: "Implementation Cost", weight: 3 },
      { name: "Technical Feasibility", weight: 2 },
      { name: "Cycle Time Reduction", weight: 3 },
      { name: "Quality Yield Improvement", weight: 2 },
      { name: "Time to Deployment", weight: 1 },
    ].map(c => ({ id: crypto.randomUUID(), ...c }));

    const alts = isZh 
      ? ["方案 A: 改造自动视觉检测伺服", "方案 B: 增派人工复检站位", "方案 C: 委外精加工工序"] 
      : ["Option A: Automated Vision Inspection", "Option B: Additional QC Station", "Option C: Outsource Machining"];

    const sc: Record<string, Record<string, number>> = {};
    sc[crits[0].id] = { [alts[0]]: 1, [alts[1]]: -1, [alts[2]]: 0 };
    sc[crits[1].id] = { [alts[0]]: 1, [alts[1]]: 1, [alts[2]]: 0 };
    sc[crits[2].id] = { [alts[0]]: 1, [alts[1]]: 0, [alts[2]]: 1 };
    sc[crits[3].id] = { [alts[0]]: 0, [alts[1]]: -1, [alts[2]]: 0 };
    sc[crits[4].id] = { [alts[0]]: 0, [alts[1]]: 1, [alts[2]]: -1 };
    setCriteria(crits);
    setAlternatives(alts);
    setScores(sc);
  };

  const getTotal = (alt: string) => criteria.reduce((sum, c) => sum + (scores[c.id]?.[alt] || 0) * c.weight, 0);
  const hasResult = criteria.length > 0 && alternatives.length > 0;
  const winner = alternatives.length > 0 ? alternatives.reduce((best, alt) => getTotal(alt) > getTotal(best) ? alt : best, alternatives[0]) : "";

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {isZh ? "评估评价准则 (Criteria & Weight)" : "Evaluation Criteria"}
          </Label>
          <div className="flex gap-1">
            <Input 
              value={criterionName} 
              onChange={e => setCriterionName(e.target.value)} 
              placeholder={isZh ? "例如：成本、质量、周期..." : "Criteria name..."} 
              className="text-sm flex-1 min-w-0" 
            />
            <Input 
              type="number" 
              value={criterionWeight} 
              onChange={e => setCriterionWeight(e.target.value)} 
              placeholder={isZh ? "权重" : "Weight"} 
              className="text-sm w-16" 
            />
            <Button size="sm" onClick={addCriterion} disabled={!criterionName.trim()} className="shrink-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {isZh ? "备选改善方案 (Candidate Alternatives)" : "Candidate Solutions"}
          </Label>
          <div className="flex gap-1">
            <Input 
              value={altName} 
              onChange={e => setAltName(e.target.value)} 
              placeholder={isZh ? "例如：方案 A、自动化工装..." : "Alternative name..."} 
              className="text-sm flex-1 min-w-0" 
            />
            <Button size="sm" onClick={addAlternative} disabled={!altName.trim()} className="shrink-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {hasResult && (
        <>
          <div className="border rounded-lg overflow-x-auto -mx-1 px-1">
            <table className="w-full text-xs min-w-[360px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-1.5 text-left">{isZh ? "评估准则" : "Criterion"}</th>
                  <th className="p-1.5 text-center w-12">{isZh ? "权重" : "Weight"}</th>
                  {alternatives.map(alt => (
                    <th key={alt} className="p-1.5 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="truncate max-w-[80px] font-medium">{alt}</span>
                        <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0" onClick={() => setAlternatives(alternatives.filter(a => a !== alt))}><Trash2 className="h-2.5 w-2.5" /></Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="p-1.5">
                      <div className="flex items-center gap-0.5">
                        <span className="truncate">{c.name}</span>
                        <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0" onClick={() => setCriteria(criteria.filter(x => x.id !== c.id))}><Trash2 className="h-2.5 w-2.5" /></Button>
                      </div>
                    </td>
                    <td className="p-1.5 text-center text-muted-foreground font-mono">{c.weight}</td>
                    {alternatives.map(alt => (
                      <td key={alt} className="p-1.5 text-center">
                        <div className="flex justify-center gap-0.5">
                          {[-1, 0, 1].map(s => (
                            <button key={s} onClick={() => setScore(c.id, alt, s)} className={`w-6 h-6 rounded text-[10px] border transition-colors ${(scores[c.id]?.[alt] ?? 0) === s ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"}`}>
                              {s > 0 ? "+" : s < 0 ? "−" : "S"}
                            </button>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t bg-muted/40 font-semibold">
                  <td className="p-2">{isZh ? "综合加权总分 (Total Score)" : "Weighted Total Score"}</td>
                  <td className="p-2"></td>
                  {alternatives.map(alt => (
                    <td key={alt} className={`p-2 text-center text-sm font-mono ${alt === winner ? "text-primary font-bold bg-primary/10" : ""}`}>
                      {getTotal(alt).toFixed(1)}{alt === winner && " 🏆"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-xs text-muted-foreground p-1">
            💡 {isZh ? "+ = 优于基准 (+1分), S = 与基准持平 (0分), − = 差于基准 (-1分)。总分 = 评分 × 权重加总。" : "+ = Better than baseline (+1), S = Same (0), − = Worse (-1). Total = Sum of (Score × Weight)."}
          </div>
        </>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { criteria, alternatives, scores }, results: { winner, scores: Object.fromEntries(alternatives.map(a => [a, getTotal(a)])) } })} />
    </div>
  );
}
