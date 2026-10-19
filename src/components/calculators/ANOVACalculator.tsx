import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "./CalculatorSaveButton";
import { CalculatorLoadButton } from "./CalculatorLoadButton";
import { ExampleDataButton } from "./ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";

// F critical values (α=0.05) approximate
const getFCritical = (df1: number, df2: number): number => {
  if (df1 === 1) return df2 < 10 ? 5.12 : df2 < 20 ? 4.35 : df2 < 40 ? 4.08 : 3.84;
  if (df1 === 2) return df2 < 10 ? 4.26 : df2 < 20 ? 3.49 : df2 < 40 ? 3.23 : 3.00;
  if (df1 === 3) return df2 < 10 ? 3.86 : df2 < 20 ? 3.10 : df2 < 40 ? 2.84 : 2.60;
  if (df1 === 4) return df2 < 10 ? 3.63 : df2 < 20 ? 2.87 : df2 < 40 ? 2.61 : 2.37;
  return df2 < 10 ? 3.48 : df2 < 20 ? 2.71 : df2 < 40 ? 2.45 : 2.21;
};

export function ANOVACalculator({ toolId = "anova", toolName = "ANOVA", phase = 3 }: { toolId?: string; toolName?: string; phase?: number }) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [groupData, setGroupData] = useState("");
  const [result, setResult] = useState<{
    groups: number; totalN: number; grandMean: number;
    SSB: number; SSW: number; SST: number;
    dfB: number; dfW: number; MSB: number; MSW: number;
    F: number; FCrit: number; significant: boolean;
    groupMeans: number[];
  } | null>(null);

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (inputs.groupData) setGroupData(String(inputs.groupData));
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const loadExample = () => {
    setGroupData("23 25 27 24 26\n30 32 28 31 29\n20 22 21 23 19");
    setResult(null);
  };

  const calculate = () => {
    const rows = groupData.trim().split("\n").filter(r => r.trim());
    if (rows.length < 2) return;

    const groups = rows.map(r => r.split(/[,;\s\t]+/).map(Number).filter(v => !isNaN(v)));
    if (groups.some(g => g.length < 2)) return;

    const k = groups.length;
    const allValues = groups.flat();
    const N = allValues.length;
    const grandMean = allValues.reduce((a, b) => a + b, 0) / N;
    const groupMeans = groups.map(g => g.reduce((a, b) => a + b, 0) / g.length);

    // SSB (between groups)
    let SSB = 0;
    groups.forEach((g, i) => { SSB += g.length * Math.pow(groupMeans[i] - grandMean, 2); });

    // SSW (within groups)
    let SSW = 0;
    groups.forEach((g, i) => { g.forEach(v => { SSW += Math.pow(v - groupMeans[i], 2); }); });

    const SST = SSB + SSW;
    const dfB = k - 1;
    const dfW = N - k;
    const MSB = SSB / dfB;
    const MSW = SSW / dfW;
    const F = MSB / MSW;
    const FCrit = getFCritical(dfB, dfW);
    const significant = F > FCrit;

    setResult({ groups: k, totalN: N, grandMean, SSB, SSW, SST, dfB, dfW, MSB, MSW, F, FCrit, significant, groupMeans });
  };

  const handleSave = () => {
    if (!result) return;
    saveCalculation({
      toolId, toolName, phase,
      inputs: { groupData },
      results: { F: result.F, FCrit: result.FCrit, significant: result.significant, groups: result.groups, dfB: result.dfB, dfW: result.dfW },
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-end">
        <ExampleDataButton onLoad={loadExample} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">
          {isZh ? "各组测量数据 (每行代表一个独立样本组，数值间用空格或逗号分隔)" : "Group Data (one group per line, values separated by space or comma)"}
        </Label>
        <textarea
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-24"
          placeholder={isZh ? "组 1: 23 25 27 24 26\n组 2: 30 32 28 31 29\n组 3: 20 22 21 23 19" : "Group 1: 23 25 27 24 26\nGroup 2: 30 32 28 31 29\nGroup 3: 20 22 21 23 19"}
          value={groupData}
          onChange={(e) => setGroupData(e.target.value)}
        />
      </div>

      <Button onClick={calculate} size="sm" className="w-full">
        {isZh ? "执行单因素方差分析 (Run One-Way ANOVA)" : "Calculate One-Way ANOVA"}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded-lg text-center border">
            <div className="text-xs text-muted-foreground mb-1">
              {isZh ? "F 统计量检验值" : "F-Statistic"}
            </div>
            <div className="text-3xl font-bold font-mono">{result.F.toFixed(3)}</div>
            <Badge variant={result.significant ? "destructive" : "default"} className="mt-2 text-xs">
              {result.significant 
                ? (isZh ? "✗ 组间均值存在显著差异 (F > F-crit, 拒绝 H₀)" : "✗ Statistically Significant Difference (Reject H₀)") 
                : (isZh ? "✓ 各组间均值无显著差异 (F ≤ F-crit, 接受 H₀)" : "✓ No Significant Difference (Fail to Reject H₀)")}
            </Badge>
          </div>

          {/* ANOVA Table */}
          <div className="overflow-x-auto border rounded-lg p-2 bg-muted/20">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="p-1.5 text-left">{isZh ? "变异来源 (Source)" : "Source"}</th>
                  <th className="p-1.5 text-right">{isZh ? "平方和 (SS)" : "SS"}</th>
                  <th className="p-1.5 text-right">{isZh ? "自由度 (df)" : "df"}</th>
                  <th className="p-1.5 text-right">{isZh ? "均方 (MS)" : "MS"}</th>
                  <th className="p-1.5 text-right font-bold">F</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-b">
                  <td className="p-1.5 font-sans">{isZh ? "组间因子 (Between)" : "Between Groups"}</td>
                  <td className="p-1.5 text-right">{result.SSB.toFixed(2)}</td>
                  <td className="p-1.5 text-right">{result.dfB}</td>
                  <td className="p-1.5 text-right">{result.MSB.toFixed(3)}</td>
                  <td className="p-1.5 text-right font-bold text-primary">{result.F.toFixed(3)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1.5 font-sans">{isZh ? "组内误差 (Within)" : "Within Groups (Error)"}</td>
                  <td className="p-1.5 text-right">{result.SSW.toFixed(2)}</td>
                  <td className="p-1.5 text-right">{result.dfW}</td>
                  <td className="p-1.5 text-right">{result.MSW.toFixed(3)}</td>
                  <td className="p-1.5"></td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold font-sans">{isZh ? "总和 (Total)" : "Total"}</td>
                  <td className="p-1.5 text-right font-bold">{result.SST.toFixed(2)}</td>
                  <td className="p-1.5 text-right font-bold">{result.dfB + result.dfW}</td>
                  <td className="p-1.5"></td>
                  <td className="p-1.5"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-center">
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "F 临界值 (α=0.05)" : "F-Critical (α=0.05)"}</div>
              <div className="font-mono">{result.FCrit.toFixed(3)}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "比较组数 (k)" : "Number of Groups (k)"}</div>
              <div className="font-mono">{result.groups}</div>
            </div>
          </div>

          <div className="p-2.5 bg-muted/30 rounded-lg text-xs border">
            <p className="font-semibold mb-1 text-foreground">{isZh ? "各样本组均值明细 (Group Means):" : "Group Means:"}</p>
            <div className="flex flex-wrap gap-2">
              {result.groupMeans.map((m, i) => (
                <span key={i} className="inline-block px-2 py-0.5 rounded bg-background border font-mono">
                  {isZh ? `第 ${i + 1} 组` : `Group ${i + 1}`}: {m.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={!!result} notes={notes} onNotesChange={setNotes} onSave={handleSave} />
    </div>
  );
}
