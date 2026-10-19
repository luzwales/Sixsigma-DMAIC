import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";

interface Run { id: string; factors: number[]; response: number; }

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function ResponseSurfaceTool({ toolId = "response-surface", toolName = "Response Surface Methodology", phase = 4 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [factorNames, setFactorNames] = useState(isZh ? ["因子 A (温度)", "因子 B (时间)"] : ["Factor A", "Factor B"]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [currentFactors, setCurrentFactors] = useState<string[]>(["", ""]);
  const [currentResponse, setCurrentResponse] = useState("");

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (Array.isArray(inputs.factorNames)) {
      setFactorNames(inputs.factorNames as string[]);
      setCurrentFactors((inputs.factorNames as string[]).map(() => ""));
    }
    if (Array.isArray(inputs.runs)) setRuns(inputs.runs as Run[]);
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addFactor = () => {
    const letter = String.fromCharCode(65 + factorNames.length);
    setFactorNames([...factorNames, isZh ? `因子 ${letter}` : `Factor ${letter}`]);
    setCurrentFactors([...currentFactors, ""]);
  };

  const addRun = () => {
    const factors = currentFactors.map(f => parseFloat(f));
    const response = parseFloat(currentResponse);
    if (factors.some(isNaN) || isNaN(response)) return;
    setRuns([...runs, { id: crypto.randomUUID(), factors, response }]);
    setCurrentFactors(currentFactors.map(() => ""));
    setCurrentResponse("");
  };

  const loadExample = () => {
    setFactorNames(isZh ? ["加热温度 (°C)", "保压时长 (s)"] : ["Temperature (°C)", "Hold Time (s)"]);
    setCurrentFactors(["", ""]);
    setRuns([
      { id: crypto.randomUUID(), factors: [150, 30], response: 72 },
      { id: crypto.randomUUID(), factors: [170, 30], response: 81 },
      { id: crypto.randomUUID(), factors: [150, 50], response: 78 },
      { id: crypto.randomUUID(), factors: [170, 50], response: 92 },
      { id: crypto.randomUUID(), factors: [160, 40], response: 85 },
      { id: crypto.randomUUID(), factors: [180, 40], response: 88 },
      { id: crypto.randomUUID(), factors: [160, 60], response: 90 },
    ]);
  };

  const hasResult = runs.length >= 3;
  const responses = runs.map(r => r.response);
  const bestRun = runs.length ? runs.reduce((best, r) => r.response > best.response ? r : best, runs[0]) : null;

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      <div className="flex items-end gap-2 flex-wrap">
        {factorNames.map((name, i) => (
          <div key={i} className="space-y-1 flex-1 min-w-28">
            <Label className="text-xs">{name}</Label>
            <Input 
              value={currentFactors[i]} 
              onChange={e => { const f = [...currentFactors]; f[i] = e.target.value; setCurrentFactors(f); }} 
              placeholder={isZh ? "水平取值" : "Level"} 
              className="text-sm" 
              type="number" 
            />
          </div>
        ))}
        <div className="space-y-1 flex-1 min-w-28">
          <Label className="text-xs font-semibold">{isZh ? "响应变量 (Y)" : "Response (Y)"}</Label>
          <Input 
            value={currentResponse} 
            onChange={e => setCurrentResponse(e.target.value)} 
            placeholder={isZh ? "测量结果" : "Result"} 
            className="text-sm" 
            type="number" 
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={addRun} className="gap-1">
          <Plus className="h-3 w-3" /> {isZh ? "添加试验运行组合" : "Add Trial Run"}
        </Button>
        {factorNames.length < 5 && (
          <Button size="sm" variant="outline" onClick={addFactor}>
            + {isZh ? "添加自变量因子" : "Factor"}
          </Button>
        )}
      </div>

      {runs.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-1.5 text-center">#</th>
                {factorNames.map((n, i) => <th key={i} className="p-1.5 text-center font-medium">{n}</th>)}
                <th className="p-1.5 text-center font-bold text-primary">{isZh ? "响应 Y" : "Response (Y)"}</th>
                <th className="p-1.5 w-6"></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, idx) => (
                <tr key={run.id} className={`border-t ${run === bestRun ? "bg-primary/10 font-medium" : ""}`}>
                  <td className="p-1.5 text-center text-muted-foreground font-mono">{idx + 1}</td>
                  {run.factors.map((f, i) => <td key={i} className="p-1.5 text-center font-mono">{f}</td>)}
                  <td className="p-1.5 text-center font-mono font-bold text-primary">{run.response}{run === bestRun && " ⭐ (最优)"}</td>
                  <td className="p-1.5">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setRuns(runs.filter(r => r.id !== run.id))}><Trash2 className="h-3 w-3" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasResult && bestRun && (
        <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1.5 border">
          <div className="font-semibold text-foreground">
            {isZh ? `最佳工艺参数组合建议 (最大化响应 Y = ${bestRun.response}):` : `Optimal Setting Recommendation (Maximizes Y = ${bestRun.response}):`}
          </div>
          <div className="text-muted-foreground font-mono">
            {factorNames.map((n, i) => `${n} = ${bestRun.factors[i]}`).join(" | ")}
          </div>
          <div className="text-muted-foreground">
            {isZh 
              ? `实测波动范围：${Math.min(...responses).toFixed(2)} → ${Math.max(...responses).toFixed(2)} (最大落差 Δ = ${((Math.max(...responses) - Math.min(...responses))).toFixed(2)})` 
              : `Range: ${Math.min(...responses).toFixed(2)} -> ${Math.max(...responses).toFixed(2)} (Delta = ${((Math.max(...responses) - Math.min(...responses))).toFixed(2)})`}
          </div>
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { factorNames, runs }, results: { bestSettings: bestRun ? Object.fromEntries(factorNames.map((n, i) => [n, bestRun.factors[i]])) : {}, bestResponse: bestRun?.response, totalRuns: runs.length } })} />
    </div>
  );
}
