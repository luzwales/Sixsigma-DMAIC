import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "./CalculatorSaveButton";
import { CalculatorLoadButton } from "./CalculatorLoadButton";
import { useLanguage } from "@/i18n/LanguageContext";

// T-distribution critical values (two-tailed, α=0.05)
const T_CRITICAL: Record<number, number> = {
  2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
  15: 2.131, 20: 2.086, 25: 2.060, 30: 2.042, 40: 2.021, 50: 2.009, 60: 2.000, 100: 1.984, 
};

const getTCritical = (df: number): number => {
  if (df >= 100) return 1.96;
  const keys = Object.keys(T_CRITICAL).map(Number).sort((a, b) => a - b);
  for (const key of keys) {
    if (df <= key) return T_CRITICAL[key];
  }
  return 1.96;
};

const getExamples = (isZh: boolean) => ({
  quality: { 
    mean: "10.2", 
    target: "10.0", 
    std: "0.5", 
    n: "30", 
    label: isZh ? "质量控制检验" : "Quality Control" 
  },
  process: { 
    mean: "25.3", 
    target: "25.0", 
    std: "1.2", 
    n: "15", 
    label: isZh ? "工艺参数抽检" : "Process Sampling" 
  },
});

export function TTestCalculator({ toolId = "t-test-1sample", toolName = "1-Sample t-Test", phase = 3 }: { toolId?: string; toolName?: string; phase?: number }) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";
  const EXAMPLES = getExamples(isZh);
  const [sampleMean, setSampleMean] = useState("");
  const [targetMean, setTargetMean] = useState("");
  const [stdDev, setStdDev] = useState("");
  const [sampleSize, setSampleSize] = useState("");
  const [result, setResult] = useState<{ 
    t: number; 
    significant: boolean; 
    df: number;
    tCritical: number;
    pApprox: string;
    ci: { lower: number; upper: number };
  } | null>(null);

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (inputs.sampleMean !== undefined) setSampleMean(String(inputs.sampleMean));
    if (inputs.targetMean !== undefined) setTargetMean(String(inputs.targetMean));
    if (inputs.stdDev !== undefined) setStdDev(String(inputs.stdDev));
    if (inputs.sampleSize !== undefined) setSampleSize(String(inputs.sampleSize));
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const loadExample = (example: keyof typeof EXAMPLES) => {
    const data = EXAMPLES[example];
    setSampleMean(data.mean);
    setTargetMean(data.target);
    setStdDev(data.std);
    setSampleSize(data.n);
    setResult(null);
  };

  const calculate = () => {
    const xbar = parseFloat(sampleMean);
    const mu0 = parseFloat(targetMean);
    const s = parseFloat(stdDev);
    const n = parseInt(sampleSize);

    if (isNaN(xbar) || isNaN(mu0) || isNaN(s) || isNaN(n) || n < 2 || s === 0) return;

    const df = n - 1;
    const se = s / Math.sqrt(n);
    const t = (xbar - mu0) / se;
    const tCritical = getTCritical(df);
    const significant = Math.abs(t) > tCritical;

    // Approximate p-value description
    let pApprox = "p > 0.10";
    const absT = Math.abs(t);
    if (absT > 3.5) pApprox = "p < 0.001";
    else if (absT > 2.8) pApprox = "p < 0.01";
    else if (absT > tCritical) pApprox = "p < 0.05";
    else if (absT > 1.7) pApprox = "p < 0.10";

    // 95% confidence interval
    const margin = tCritical * se;
    const ci = { lower: xbar - margin, upper: xbar + margin };

    setResult({ t, significant, df, tCritical, pApprox, ci });
  };

  const handleSave = () => {
    if (!result) return;
    saveCalculation({
      toolId,
      toolName,
      phase,
      inputs: { 
        sampleMean: parseFloat(sampleMean),
        targetMean: parseFloat(targetMean),
        stdDev: parseFloat(stdDev),
        sampleSize: parseInt(sampleSize),
      },
      results: { ...result },
    });
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

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="ttest-xbar" className="text-xs flex items-center gap-1">
            {isZh ? "样本均值 (X̄)" : "Sample Mean (X̄)"}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {isZh ? "实际测得的样本平均值" : "Average value of your measurements"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="ttest-xbar"
            type="number"
            step="0.01"
            placeholder="10.2"
            value={sampleMean}
            onChange={(e) => setSampleMean(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ttest-mu" className="text-xs">
            {isZh ? "检验目标值 (μ₀)" : "Target / Baseline (μ₀)"}
          </Label>
          <Input
            id="ttest-mu"
            type="number"
            step="0.01"
            placeholder="10.0"
            value={targetMean}
            onChange={(e) => setTargetMean(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ttest-s" className="text-xs">
            {isZh ? "样本标准差 (s)" : "Sample Std Dev (s)"}
          </Label>
          <Input
            id="ttest-s"
            type="number"
            step="0.01"
            placeholder="0.5"
            value={stdDev}
            onChange={(e) => setStdDev(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ttest-n" className="text-xs">
            {isZh ? "样本量 (n ≥ 2)" : "Sample Size (n ≥ 2)"}
          </Label>
          <Input
            id="ttest-n"
            type="number"
            min="2"
            placeholder="30"
            value={sampleSize}
            onChange={(e) => setSampleSize(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <Button onClick={calculate} size="sm" className="w-full">
        {isZh ? "计算单样本 t 检验 (Calculate t-test)" : "Calculate 1-Sample t-Test"}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded-lg text-center border">
            <div className="text-xs text-muted-foreground mb-1">
              {isZh ? "t 统计量 (t-statistic)" : "t-Statistic"}
            </div>
            <div className="text-3xl font-bold font-mono">{result.t.toFixed(3)}</div>
            <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              result.significant 
                ? "bg-destructive/20 text-destructive" 
                : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            }`}>
              {result.significant 
                ? (isZh ? "✗ 存在统计学显著差异 (拒绝 H₀, p < 0.05)" : "✗ Statistically Significant (Reject H₀, p < 0.05)") 
                : (isZh ? "✓ 无显著差异 (接受 H₀, p > 0.05)" : "✓ No Significant Difference (Fail to Reject H₀, p > 0.05)")}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "临界值 (t-crit)" : "t-Critical"}</div>
              <div className="font-mono">±{result.tCritical.toFixed(3)}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "自由度 (df)" : "df (n-1)"}</div>
              <div className="font-mono">{result.df}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "P 值估计" : "p-Value"}</div>
              <div className="font-mono">{result.pApprox}</div>
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1">
              {isZh ? "总体均值 μ 的 95% 双侧置信区间 (CI)" : "95% Confidence Interval for μ"}
            </div>
            <div className="font-mono text-sm font-semibold">
              [{result.ci.lower.toFixed(3)}, {result.ci.upper.toFixed(3)}]
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {result.ci.lower <= parseFloat(targetMean) && result.ci.upper >= parseFloat(targetMean)
                ? (isZh ? "✓ 目标均值落于置信区间内，符合工程要求" : "✓ Target mean falls inside confidence interval")
                : (isZh ? "✗ 目标均值落在置信区间之外，过程均值发生显著漂移" : "✗ Target mean falls outside confidence interval")}
            </div>
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
