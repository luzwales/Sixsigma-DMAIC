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

// Chi-square critical values (α=0.05)
const CHI2_CRITICAL: Record<number, number> = {
  1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 5: 11.070,
  6: 12.592, 7: 14.067, 8: 15.507, 9: 16.919, 10: 18.307,
  15: 24.996, 20: 31.410, 25: 37.652, 30: 43.773,
};

const getChi2Critical = (df: number): number => {
  if (CHI2_CRITICAL[df]) return CHI2_CRITICAL[df];
  const keys = Object.keys(CHI2_CRITICAL).map(Number).sort((a, b) => a - b);
  for (const key of keys) { if (df <= key) return CHI2_CRITICAL[key]; }
  return df + Math.sqrt(2 * df); // rough approximation
};

export function ChiSquareCalculator({ toolId = "chi-square", toolName = "Chi-Square Test", phase = 3 }: { toolId?: string; toolName?: string; phase?: number }) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [tableData, setTableData] = useState("");
  const [result, setResult] = useState<{
    chi2: number; df: number; chi2Crit: number; significant: boolean;
    observed: number[][]; expected: number[][];
    rows: number; cols: number;
  } | null>(null);

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (inputs.tableData) setTableData(String(inputs.tableData));
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const loadExample = () => {
    setTableData("50 30 20\n35 45 20\n15 25 60");
    setResult(null);
  };

  const calculate = () => {
    const rows = tableData.trim().split("\n").filter(r => r.trim());
    if (rows.length < 2) return;

    const observed = rows.map(r => r.split(/[,;\s\t]+/).map(Number).filter(v => !isNaN(v)));
    const nCols = observed[0].length;
    if (observed.some(r => r.length !== nCols) || nCols < 2) return;

    const nRows = observed.length;
    const rowTotals = observed.map(r => r.reduce((a, b) => a + b, 0));
    const colTotals: number[] = [];
    for (let j = 0; j < nCols; j++) {
      colTotals[j] = observed.reduce((sum, row) => sum + row[j], 0);
    }
    const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

    // Expected frequencies
    const expected = observed.map((row, i) =>
      row.map((_, j) => (rowTotals[i] * colTotals[j]) / grandTotal)
    );

    // Chi-square statistic
    let chi2 = 0;
    observed.forEach((row, i) => {
      row.forEach((o, j) => {
        const e = expected[i][j];
        chi2 += Math.pow(o - e, 2) / e;
      });
    });

    const df = (nRows - 1) * (nCols - 1);
    const chi2Crit = getChi2Critical(df);
    const significant = chi2 > chi2Crit;

    setResult({ chi2, df, chi2Crit, significant, observed, expected, rows: nRows, cols: nCols });
  };

  const handleSave = () => {
    if (!result) return;
    saveCalculation({
      toolId,
      toolName,
      phase,
      inputs: { tableData },
      results: { chi2: result.chi2, df: result.df, significant: result.significant },
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-end">
        <ExampleDataButton onLoad={loadExample} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">
          {isZh ? "观测频数列联表 (每行一个分类属性，列数值以空格或逗号分隔)" : "Observed Frequencies (one row per category, space or comma separated)"}
        </Label>
        <textarea
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-20"
          placeholder={isZh ? "50 30 20\n35 45 20\n15 25 60" : "50 30 20\n35 45 20\n15 25 60"}
          value={tableData}
          onChange={(e) => setTableData(e.target.value)}
        />
      </div>

      <Button onClick={calculate} size="sm" className="w-full">
        {isZh ? "执行卡方独立性检验 (Run Chi-Square Test)" : "Calculate Chi-Square (χ²)"}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded-lg text-center border">
            <div className="text-xs text-muted-foreground mb-1">
              {isZh ? "卡方统计量检验值 (χ²)" : "Chi-Square Statistic (χ²)"}
            </div>
            <div className="text-3xl font-bold font-mono">{result.chi2.toFixed(3)}</div>
            <Badge variant={result.significant ? "destructive" : "default"} className="mt-2 text-xs">
              {result.significant 
                ? (isZh ? "✗ 属性变量间存在显著关联性 (拒绝独立性 H₀, p < 0.05)" : "✗ Significant Association (Reject Independence H₀)") 
                : (isZh ? "✓ 变量之间相互独立 (无显著关联, 接受 H₀)" : "✓ Variables are Independent (Fail to Reject H₀)")}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "自由度 (df)" : "df (r-1)(c-1)"}</div>
              <div className="font-mono">{result.df}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "临界值 (χ²-crit)" : "χ²-Critical"}</div>
              <div className="font-mono">{result.chi2Crit.toFixed(3)}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded border">
              <div className="text-xs text-muted-foreground">{isZh ? "列联表维度" : "Contingency Table"}</div>
              <div className="font-mono">{result.rows} × {result.cols}</div>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg p-2.5 bg-muted/20">
            <p className="text-xs font-semibold mb-1.5 text-foreground">
              {isZh ? "理论期望频数表 (Expected Frequencies):" : "Expected Frequencies:"}
            </p>
            <table className="w-full text-xs font-mono">
              <tbody>
                {result.expected.map((row, i) => (
                  <tr key={i} className="border-b last:border-none">
                    {row.map((e, j) => (
                      <td key={j} className="p-1 text-center bg-background/50">{e.toFixed(1)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={!!result} notes={notes} onNotesChange={setNotes} onSave={handleSave} />
    </div>
  );
}
