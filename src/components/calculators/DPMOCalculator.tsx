import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { sigmaTable } from "@/data/dmaic-tools";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "./CalculatorSaveButton";
import { CalculatorLoadButton } from "./CalculatorLoadButton";
import { useLanguage } from "@/i18n/LanguageContext";

const getExamples = (isZh: boolean) => ({
  manufacturing: { defects: "42", units: "1000", opportunities: "5", label: isZh ? "车间制造" : "Manufacturing" },
  service: { defects: "15", units: "500", opportunities: "8", label: isZh ? "事务流程" : "Service Flow" },
  assembly: { defects: "8", units: "2000", opportunities: "3", label: isZh ? "总装产线" : "Assembly Line" },
});

export function DPMOCalculator({ toolId = "dpmo", toolName = "DPMO & Sigma-nivå", phase = 2 }: { toolId?: string; toolName?: string; phase?: number }) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";
  const EXAMPLES = getExamples(isZh);

  const [defects, setDefects] = useState("");
  const [units, setUnits] = useState("");
  const [opportunities, setOpportunities] = useState("");
  const [result, setResult] = useState<{ dpmo: number; sigma: number; yield: number; dpu: number } | null>(null);

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const nextDefects = inputs.defects !== undefined ? String(inputs.defects) : "";
    const nextUnits = inputs.units !== undefined ? String(inputs.units) : "";
    const nextOpportunities = inputs.opportunities !== undefined ? String(inputs.opportunities) : "";

    setDefects(nextDefects);
    setUnits(nextUnits);
    setOpportunities(nextOpportunities);

    const d = parseFloat(nextDefects);
    const u = parseFloat(nextUnits);
    const o = parseFloat(nextOpportunities);

    if (!isNaN(d) && !isNaN(u) && !isNaN(o) && u !== 0 && o !== 0) {
      const dpmo = (d / (u * o)) * 1000000;
      const dpu = d / u;
      
      let sigma = 0;
      for (let i = sigmaTable.length - 1; i >= 0; i--) {
        if (dpmo <= sigmaTable[i].dpmo) {
          sigma = sigmaTable[i].sigma;
          break;
        }
      }

      const actualYield = (1 - d / (u * o)) * 100;
      setResult({ dpmo: Math.round(dpmo), sigma, yield: actualYield, dpu });
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const loadExample = (example: keyof typeof EXAMPLES) => {
    const data = EXAMPLES[example];
    setDefects(data.defects);
    setUnits(data.units);
    setOpportunities(data.opportunities);
    setResult(null);
  };

  const calculate = () => {
    const d = parseFloat(defects);
    const u = parseFloat(units);
    const o = parseFloat(opportunities);

    if (isNaN(d) || isNaN(u) || isNaN(o) || u === 0 || o === 0) return;

    const dpmo = (d / (u * o)) * 1000000;
    const dpu = d / u;
    
    let sigma = 0;
    for (let i = sigmaTable.length - 1; i >= 0; i--) {
      if (dpmo <= sigmaTable[i].dpmo) {
        sigma = sigmaTable[i].sigma;
        break;
      }
    }

    const actualYield = (1 - d / (u * o)) * 100;

    setResult({ dpmo: Math.round(dpmo), sigma, yield: actualYield, dpu });
  };

  const handleSave = () => {
    if (!result) return;
    saveCalculation({
      toolId,
      toolName,
      phase,
      inputs: { defects: parseFloat(defects), units: parseFloat(units), opportunities: parseFloat(opportunities) },
      results: result,
    });
  };

  const getSigmaColor = (sigma: number) => {
    if (sigma >= 5) return "text-green-600 dark:text-green-400";
    if (sigma >= 4) return "text-emerald-600 dark:text-emerald-400";
    if (sigma >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getSigmaDescription = (sigma: number) => {
    if (isZh) {
      if (sigma >= 6) return "世界级六西格玛标杆 (World Class)";
      if (sigma >= 5) return "卓越制程质量水平 (Excellent)";
      if (sigma >= 4) return "优良工业级制造质量 (Good)";
      if (sigma >= 3) return "行业基础合格水准 (3σ 常规底线)";
      if (sigma >= 2) return "缺陷频发，急需黑带立项攻坚";
      return "严重不可接受的极高失控率";
    }
    if (sigma >= 6) return "World Class quality (6σ)";
    if (sigma >= 5) return "Excellent quality (5σ)";
    if (sigma >= 4) return "Good industrial quality (4σ)";
    if (sigma >= 3) return "Acceptable baseline (3σ)";
    if (sigma >= 2) return "Needs immediate DMAIC intervention";
    return "Critical defect level";
  };

  return (
    <div className="space-y-4 pt-2">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <div className="flex justify-end gap-1">
        {Object.entries(EXAMPLES).map(([key, data]) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => loadExample(key as keyof typeof EXAMPLES)}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {data.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="dpmo-defects" className="text-xs">
            {isZh ? "检出缺陷数 (D)" : "Total Defects (D)"}
          </Label>
          <Input
            id="dpmo-defects"
            type="number"
            placeholder="15"
            value={defects}
            onChange={(e) => setDefects(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dpmo-units" className="text-xs">
            {isZh ? "检验抽样数 (N)" : "Audited Units (N)"}
          </Label>
          <Input
            id="dpmo-units"
            type="number"
            placeholder="1000"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dpmo-opp" className="text-xs">
            {isZh ? "单件缺陷机会数 (O)" : "Opportunities / Unit (O)"}
          </Label>
          <Input
            id="dpmo-opp"
            type="number"
            placeholder="5"
            value={opportunities}
            onChange={(e) => setOpportunities(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <Button onClick={calculate} size="sm" className="w-full">
        {isZh ? "核算 DPMO 与西格玛等级" : "Calculate DPMO & Sigma"}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded-lg text-center border">
            <div className="text-xs text-muted-foreground mb-1">
              {isZh ? "过程西格玛水平 (含 1.5σ 长期漂移)" : "Sigma Level (with 1.5σ shift)"}
            </div>
            <div className={`text-4xl font-extrabold ${getSigmaColor(result.sigma)}`}>
              {result.sigma}σ
            </div>
            <div className="text-sm font-medium text-foreground mt-1">
              {getSigmaDescription(result.sigma)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "百万机会缺陷数 (DPMO)" : "DPMO"}</div>
              <div className="text-lg font-bold font-mono text-primary">{result.dpmo.toLocaleString()}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "过程良率 (Yield)" : "Process Yield"}</div>
              <div className="text-lg font-bold font-mono">{result.yield.toFixed(2)}%</div>
            </div>
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "单位缺陷数 (DPU)" : "Defects / Unit (DPU)"}</div>
              <div className="text-lg font-bold font-mono">{result.dpu.toFixed(4)}</div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border leading-relaxed">
            <strong>{isZh ? "统计结论解读：" : "Interpretation: "}</strong>
            {isZh 
              ? `在每 1,000,000 次缺陷机会中预计发生 ${result.dpmo.toLocaleString()} 个缺陷。当前过程产出 ${result.yield.toFixed(2)}% 的完全无缺陷合格机会。`
              : `At ${result.dpmo.toLocaleString()} defects per million opportunities, the process achieves ${result.yield.toFixed(2)}% defect-free output.`}
          </div>
        </div>
      )}

      <CalculatorSaveButton
        canSave={canSave}
        isSaving={isSaving}
        hasResult={!!result}
        notes={notes}
        onNotesChange={setNotes}
        onSave={handleSave}
      />
    </div>
  );
}
