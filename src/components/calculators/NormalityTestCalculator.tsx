import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "./CalculatorSaveButton";
import { ExampleDataButton } from "./ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { CalculatorLoadButton } from "./CalculatorLoadButton";

// Anderson-Darling critical values (α=0.05) approximation
const getADCritical = (n: number): number => {
  // Adjusted critical value for AD test at α=0.05
  return 0.752; // Standard critical value
};

export function NormalityTestCalculator({ toolId = "normality-test", toolName = "Normalfördelningstest", phase = 2 }: { toolId?: string; toolName?: string; phase?: number }) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [data, setData] = useState("");
  const [result, setResult] = useState<{
    n: number; mean: number; stdDev: number; skewness: number; kurtosis: number;
    adStatistic: number; adCritical: number; isNormal: boolean;
    min: number; max: number; median: number;
  } | null>(null);

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (inputs.data) setData(Array.isArray(inputs.data) ? (inputs.data as number[]).join(", ") : String(inputs.data));
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const loadExample = () => {
    setData("10.2 10.5 9.8 10.1 10.3 9.9 10.0 10.4 10.2 10.1 9.7 10.3 10.0 10.2 10.1 9.8 10.5 10.3 10.0 10.4");
    setResult(null);
  };

  const calculate = () => {
    const values = data.split(/[,;\s\n\t]+/).map(Number).filter(v => !isNaN(v));
    if (values.length < 8) return;

    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);

    // Skewness
    const m3 = values.reduce((sum, v) => sum + Math.pow(v - mean, 3), 0) / n;
    const skewness = m3 / Math.pow(stdDev, 3);

    // Kurtosis (excess)
    const m4 = values.reduce((sum, v) => sum + Math.pow(v - mean, 4), 0) / n;
    const kurtosis = m4 / Math.pow(variance, 2) - 3;

    // Anderson-Darling test
    const standardized = sorted.map(v => (v - mean) / stdDev);

    // Normal CDF approximation
    const normalCDF = (z: number): number => {
      const t = 1 / (1 + 0.2316419 * Math.abs(z));
      const d = 0.3989422804014327;
      const p = d * Math.exp(-z * z / 2) * (t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))));
      return z > 0 ? 1 - p : p;
    };

    let S = 0;
    for (let i = 0; i < n; i++) {
      const Fi = normalCDF(standardized[i]);
      const FiClamped = Math.max(0.0001, Math.min(0.9999, Fi));
      const FnminusiClamped = Math.max(0.0001, Math.min(0.9999, normalCDF(standardized[n - 1 - i])));
      S += (2 * (i + 1) - 1) * (Math.log(FiClamped) + Math.log(1 - FnminusiClamped));
    }

    let AD = -n - S / n;
    // Adjusted AD*
    AD = AD * (1 + 0.75 / n + 2.25 / (n * n));

    const adCritical = getADCritical(n);
    const isNormal = AD < adCritical;

    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

    setResult({
      n, mean, stdDev, skewness, kurtosis,
      adStatistic: AD, adCritical, isNormal,
      min: sorted[0], max: sorted[n - 1], median,
    });
  };

  const handleSave = () => {
    if (!result) return;
    saveCalculation({
      toolId, toolName, phase,
      inputs: { n: result.n },
      results: { AD: result.adStatistic, isNormal: result.isNormal, skewness: result.skewness, kurtosis: result.kurtosis },
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-end">
        <ExampleDataButton onLoad={loadExample} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">
          {isZh ? "样本测量数据 (至少 8 个数值，空格、逗号或换行分隔)" : "Data (min. 8 values, separated by space, comma or newline)"}
        </Label>
        <textarea
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-20"
          placeholder="10.2 10.5 9.8 10.1 10.3 10.0 9.9 10.4..."
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
      </div>

      <Button onClick={calculate} size="sm" className="w-full">
        {isZh ? "执行 Anderson-Darling 正态性检验" : "Run Normality Test"}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded-lg text-center border">
            <div className="text-xs text-muted-foreground mb-1">
              Anderson-Darling 统计量 (A²*)
            </div>
            <div className="text-3xl font-extrabold font-mono text-primary">{result.adStatistic.toFixed(4)}</div>
            <Badge variant={result.isNormal ? "default" : "destructive"} className="mt-2 text-xs">
              {result.isNormal 
                ? (isZh ? "✓ 服从正态分布 (p > 0.05)" : "✓ Normally Distributed (p > 0.05)") 
                : (isZh ? "✗ 偏离正态分布 (p < 0.05)" : "✗ Non-Normal (p < 0.05)")}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-2 bg-muted/30 rounded border"><div className="text-xs text-muted-foreground">{isZh ? "样本量 (n)" : "Sample (n)"}</div><div className="font-mono">{result.n}</div></div>
            <div className="p-2 bg-muted/30 rounded border"><div className="text-xs text-muted-foreground">{isZh ? "均值 (μ)" : "Mean (μ)"}</div><div className="font-mono">{result.mean.toFixed(3)}</div></div>
            <div className="p-2 bg-muted/30 rounded border"><div className="text-xs text-muted-foreground">{isZh ? "标准差 (σ)" : "Std Dev (σ)"}</div><div className="font-mono">{result.stdDev.toFixed(3)}</div></div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "偏度 (Skewness)" : "Skewness"}</div>
              <div className="font-mono">{result.skewness.toFixed(3)}</div>
              <div className="text-[10px] text-muted-foreground">
                {Math.abs(result.skewness) < 0.5 
                  ? (isZh ? "对称分布" : "Symmetric") 
                  : result.skewness > 0 
                  ? (isZh ? "右偏 (正偏态)" : "Right-skewed") 
                  : (isZh ? "左偏 (负偏态)" : "Left-skewed")}
              </div>
            </div>
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "峰度 (Kurtosis)" : "Kurtosis"}</div>
              <div className="font-mono">{result.kurtosis.toFixed(3)}</div>
              <div className="text-[10px] text-muted-foreground">
                {Math.abs(result.kurtosis) < 1 
                  ? (isZh ? "正态常峰" : "Normal Peak") 
                  : result.kurtosis > 0 
                  ? (isZh ? "尖锐厚尾峰" : "Leptokurtic") 
                  : (isZh ? "平缓低峰" : "Platykurtic")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-2 bg-muted/30 rounded border"><div className="text-xs text-muted-foreground">{isZh ? "极小值" : "Min"}</div><div className="font-mono">{result.min.toFixed(3)}</div></div>
            <div className="p-2 bg-muted/30 rounded border"><div className="text-xs text-muted-foreground">{isZh ? "中位数" : "Median"}</div><div className="font-mono">{result.median.toFixed(3)}</div></div>
            <div className="p-2 bg-muted/30 rounded border"><div className="text-xs text-muted-foreground">{isZh ? "极大值" : "Max"}</div><div className="font-mono">{result.max.toFixed(3)}</div></div>
          </div>

          <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border leading-relaxed">
            💡 {result.isNormal
              ? (isZh ? "数据满足正态性假设前提。可安全使用经典参数检验（如单样本/双样本 t 检验、ANOVA 方差分析及标准 Cp/Cpk 公式）。" : "Data is normally distributed. Parametric tests (t-test, ANOVA) and standard Cpk formulas are valid.")
              : (isZh ? "数据显著偏离正态分布！直接套用经典 Cpk 会导致严重误判，建议先实施 Box-Cox / Johnson 数据变换，或采用非参数检验方法。" : "Data departs from normality. Consider Box-Cox / Johnson transformation or non-parametric tests.")}
          </p>
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={!!result} notes={notes} onNotesChange={setNotes} onSave={handleSave} />
    </div>
  );
}
