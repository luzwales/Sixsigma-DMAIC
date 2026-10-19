import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "./CalculatorSaveButton";
import { CalculatorLoadButton } from "./CalculatorLoadButton";
import { ExampleDataButton } from "./ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";

const EXAMPLE = {
  operators: "3",
  parts: "10",
  trials: "3",
  data: `5.12 5.13 5.14
5.10 5.11 5.10
5.15 5.16 5.14
5.08 5.09 5.08
5.20 5.19 5.21
5.11 5.12 5.11
5.14 5.13 5.15
5.09 5.10 5.09
5.17 5.18 5.17
5.13 5.14 5.13
5.13 5.14 5.15
5.11 5.10 5.11
5.14 5.15 5.14
5.09 5.08 5.09
5.21 5.20 5.22
5.12 5.11 5.12
5.15 5.14 5.16
5.10 5.09 5.10
5.18 5.17 5.18
5.14 5.13 5.14
5.14 5.15 5.13
5.12 5.11 5.12
5.16 5.15 5.16
5.10 5.09 5.10
5.22 5.21 5.23
5.13 5.12 5.13
5.16 5.15 5.17
5.11 5.10 5.11
5.19 5.18 5.19
5.15 5.14 5.15`,
};

interface GageRRResult {
  repeatability: number;
  reproducibility: number;
  gageRR: number;
  partVariation: number;
  totalVariation: number;
  percentRR: number;
  percentPart: number;
  ndc: number;
  verdict: string;
}

export function GageRRCalculator({ toolId = "gage-rr", toolName = "Gage R&R (MSA)", phase = 2 }: { toolId?: string; toolName?: string; phase?: number }) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [operators, setOperators] = useState("3");
  const [parts, setParts] = useState("");
  const [trials, setTrials] = useState("");
  const [data, setData] = useState("");
  const [result, setResult] = useState<GageRRResult | null>(null);

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const nextOperators = inputs.operators !== undefined ? String(inputs.operators) : "";
    const nextParts = inputs.parts !== undefined ? String(inputs.parts) : "";
    const nextTrials = inputs.trials !== undefined ? String(inputs.trials) : "";
    const nextData = inputs.data !== undefined ? String(inputs.data) : "";

    setOperators(nextOperators);
    setParts(nextParts);
    setTrials(nextTrials);
    setData(nextData);

    const nOps = parseInt(nextOperators);
    const nParts = parseInt(nextParts);
    const nTrials = parseInt(nextTrials);

    if (isNaN(nOps) || isNaN(nParts) || isNaN(nTrials) || nOps < 2 || nParts < 2 || nTrials < 2) return;

    const rows = nextData.trim().split("\n").filter(r => r.trim());
    const values = rows.map(r => r.split(/[,;\s\t]+/).map(Number).filter(v => !isNaN(v)));

    const expectedRows = nOps * nParts;
    if (values.length < expectedRows) return;

    // A simple trigger to run calculations with loaded values
    setTimeout(() => {
      const btn = document.querySelector('button[onClick*="calculate"]') as HTMLButtonElement | null;
      if (btn) btn.click();
    }, 50);
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const loadExample = () => {
    setOperators(EXAMPLE.operators);
    setParts(EXAMPLE.parts);
    setTrials(EXAMPLE.trials);
    setData(EXAMPLE.data);
    setResult(null);
  };

  const calculate = () => {
    const nOps = parseInt(operators);
    const nParts = parseInt(parts);
    const nTrials = parseInt(trials);

    if (isNaN(nOps) || isNaN(nParts) || isNaN(nTrials) || nOps < 2 || nParts < 2 || nTrials < 2) return;

    const rows = data.trim().split("\n").filter(r => r.trim());
    const values = rows.map(r => r.split(/[,;\s\t]+/).map(Number).filter(v => !isNaN(v)));

    const expectedRows = nOps * nParts;
    if (values.length < expectedRows) return;

    // Organize data: measurements[operator][part][trial]
    const measurements: number[][][] = [];
    for (let op = 0; op < nOps; op++) {
      measurements[op] = [];
      for (let p = 0; p < nParts; p++) {
        const rowIdx = op * nParts + p;
        measurements[op][p] = values[rowIdx] || [];
      }
    }

    // Calculate averages
    const grandMean = values.flat().reduce((a, b) => a + b, 0) / values.flat().length;

    // Part averages
    const partMeans: number[] = [];
    for (let p = 0; p < nParts; p++) {
      const partValues: number[] = [];
      for (let op = 0; op < nOps; op++) {
        partValues.push(...measurements[op][p]);
      }
      partMeans[p] = partValues.reduce((a, b) => a + b, 0) / partValues.length;
    }

    // Operator averages
    const opMeans: number[] = [];
    for (let op = 0; op < nOps; op++) {
      const opValues = measurements[op].flat();
      opMeans[op] = opValues.reduce((a, b) => a + b, 0) / opValues.length;
    }

    // Within-part ranges per operator (repeatability)
    const ranges: number[] = [];
    for (let op = 0; op < nOps; op++) {
      for (let p = 0; p < nParts; p++) {
        const vals = measurements[op][p];
        if (vals.length > 1) {
          ranges.push(Math.max(...vals) - Math.min(...vals));
        }
      }
    }
    const rBar = ranges.reduce((a, b) => a + b, 0) / ranges.length;

    // d2 constant (approximation for trials)
    const d2Map: Record<number, number> = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326 };
    const d2 = d2Map[nTrials] || 1.693;

    // Repeatability (Equipment Variation)
    const EV = rBar / d2;

    // Reproducibility (Appraiser Variation)
    const xDiff = Math.max(...opMeans) - Math.min(...opMeans);
    const d2Ops: Record<number, number> = { 2: 1.128, 3: 1.693, 4: 2.059 };
    const d2op = d2Ops[nOps] || 1.693;
    const AVraw = (xDiff / d2op);
    const AVsq = Math.max(0, AVraw * AVraw - (EV * EV) / (nParts * nTrials));
    const AV = Math.sqrt(AVsq);

    // Gage R&R
    const GRR = Math.sqrt(EV * EV + AV * AV);

    // Part variation
    const Rp = Math.max(...partMeans) - Math.min(...partMeans);
    const d2Parts: Record<number, number> = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078 };
    const d2p = d2Parts[nParts] || 3.078;
    const PV = Rp / d2p;

    // Total variation
    const TV = Math.sqrt(GRR * GRR + PV * PV);

    const percentRR = (GRR / TV) * 100;
    const percentPart = (PV / TV) * 100;
    const ndc = Math.floor(1.41 * (PV / GRR));

    let verdict = "Oacceptabelt (>30%)";
    if (percentRR <= 10) verdict = "Acceptabelt (<10%)";
    else if (percentRR <= 30) verdict = "Marginellt (10-30%)";

    setResult({
      repeatability: EV,
      reproducibility: AV,
      gageRR: GRR,
      partVariation: PV,
      totalVariation: TV,
      percentRR,
      percentPart,
      ndc,
      verdict,
    });
  };

  const handleSave = () => {
    if (!result) return;
    saveCalculation({
      toolId,
      toolName,
      phase,
      inputs: { operators: parseInt(operators), parts: parseInt(parts), trials: parseInt(trials), data },
      results: { ...result } as Record<string, unknown>,
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{isZh ? "测量人员数 (Operators)" : "Operators"}</Label>
          <Input type="number" min="2" value={operators} onChange={(e) => setOperators(e.target.value)} className="h-8 text-sm" placeholder="3" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isZh ? "测试部件数 (Parts)" : "Parts"}</Label>
          <Input type="number" min="2" value={parts} onChange={(e) => setParts(e.target.value)} className="h-8 text-sm" placeholder="10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isZh ? "重复测量次数 (Trials)" : "Trials"}</Label>
          <Input type="number" min="2" value={trials} onChange={(e) => setTrials(e.target.value)} className="h-8 text-sm" placeholder="3" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">
          {isZh ? "测量原始数据 (每行格式：操作员+部件代号，空格或制表符分隔测量值)" : "Measurement Data (one row per operator+part, separated by space)"}
        </Label>
        <textarea
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-32"
          placeholder={isZh ? "Op1/零件1: 5.12 5.13 5.14&#10;Op1/零件2: 5.10 5.11 5.10&#10;..." : "Op1/Part1: 5.12 5.13 5.14&#10;Op1/Part2: 5.10 5.11 5.10&#10;..."}
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
      </div>

      <Button onClick={calculate} size="sm" className="w-full">
        {isZh ? "执行 Gage R&R 方差分解计算" : "Calculate Gage R&R"}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded-lg text-center border">
            <div className="text-xs text-muted-foreground mb-1">
              %R&R ({isZh ? "测量变异占总变异百分比" : "Gage R&R / Total Variation"})
            </div>
            <div className="text-3xl font-extrabold font-mono text-primary">{result.percentRR.toFixed(1)}%</div>
            <Badge variant={result.percentRR <= 10 ? "default" : result.percentRR <= 30 ? "secondary" : "destructive"} className="mt-2 text-xs">
              {result.percentRR <= 10 
                ? (isZh ? "✓ 测量系统优秀 (<10%)" : "✓ Acceptable (<10%)")
                : result.percentRR <= 30 
                ? (isZh ? "⚠ 勉强接受需监控 (10-30%)" : "⚠ Marginal (10-30%)")
                : (isZh ? "✗ 测量系统不可接受 (>30%)" : "✗ Unacceptable (>30%)")}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-muted/30 rounded text-center border">
              <div className="text-xs text-muted-foreground">{isZh ? "重复性 (设备变异 EV)" : "Repeatability (EV)"}</div>
              <div className="font-mono font-medium">{result.repeatability.toFixed(4)}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center border">
              <div className="text-xs text-muted-foreground">{isZh ? "再现性 (人员变异 AV)" : "Reproducibility (AV)"}</div>
              <div className="font-mono font-medium">{result.reproducibility.toFixed(4)}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center border">
              <div className="text-xs text-muted-foreground">Gage R&R (综合)</div>
              <div className="font-mono font-medium">{result.gageRR.toFixed(4)}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center border">
              <div className="text-xs text-muted-foreground">{isZh ? "部件间变异 (PV)" : "Part Variation (PV)"}</div>
              <div className="font-mono font-medium">{result.partVariation.toFixed(4)}</div>
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded text-center border">
            <div className="text-xs text-muted-foreground">{isZh ? "可区分类别数 (ndc 分辨力)" : "Number of Distinct Categories (ndc)"}</div>
            <div className="font-mono text-xl font-extrabold text-foreground">{result.ndc}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">
              {result.ndc >= 5 
                ? (isZh ? "✓ 分辨力充足 (ndc ≥ 5)" : "✓ Acceptable (ndc >= 5)") 
                : (isZh ? "✗ 分辨力严重不足 (ndc < 5)" : "✗ Insufficient (ndc < 5)")}
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border leading-relaxed">
            💡 {result.percentRR <= 10 
              ? (isZh ? "该测量系统具有极高精度，能完全胜任工序控制与产品交付判定。" : "Measurement system has excellent precision and can be trusted.") 
              : result.percentRR <= 30 
              ? (isZh ? "测量误差偏大，存在误判风险，建议进行量具维护校准或规范操作员手法培训。" : "Measurement system is marginal. Consider calibration or operator training.")
              : (isZh ? "测量系统变异过大，不能用于生产数据分析！必须先整改测量系统后方可推进 DMAIC。" : "Measurement system is unacceptable and must be fixed before analyzing data.")}
          </p>
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
