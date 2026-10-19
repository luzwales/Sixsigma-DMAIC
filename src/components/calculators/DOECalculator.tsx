import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Info, Plus, Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "./CalculatorSaveButton";
import { CalculatorLoadButton } from "./CalculatorLoadButton";
import { ExampleDataButton } from "./ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Factor {
  name: string;
  lowLevel: string;
  highLevel: string;
}

const getFactors = (isZh: boolean): Factor[] => isZh ? [
  { name: "模具温度", lowLevel: "180°C", highLevel: "220°C" },
  { name: "注射压力", lowLevel: "80 bar", highLevel: "120 bar" },
  { name: "保压时间", lowLevel: "4 s", highLevel: "8 s" },
] : [
  { name: "Temperature", lowLevel: "20°C", highLevel: "30°C" },
  { name: "Pressure", lowLevel: "1 bar", highLevel: "2 bar" },
  { name: "Cycle Time", lowLevel: "5 min", highLevel: "10 min" },
];

export function DOECalculator({ toolId = "doe-basics", toolName = "DOE Experiment Design", phase = 4 }: { toolId?: string; toolName?: string; phase?: number }) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [factors, setFactors] = useState<Factor[]>([
    { name: "", lowLevel: "", highLevel: "" },
    { name: "", lowLevel: "", highLevel: "" },
  ]);
  const [levels, setLevels] = useState("2");
  const [result, setResult] = useState<{ 
    fullRuns: number; 
    halfRuns: number; 
    quarterRuns: number;
    resolution: string;
  } | null>(null);

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (Array.isArray(inputs.factors)) setFactors(inputs.factors as Factor[]);
    if (inputs.levels) setLevels(String(inputs.levels));
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const loadExample = () => {
    setFactors(getFactors(isZh));
    setResult(null);
  };

  const addFactor = () => {
    if (factors.length < 8) {
      setFactors([...factors, { name: "", lowLevel: "", highLevel: "" }]);
    }
  };

  const removeFactor = (index: number) => {
    if (factors.length > 2) {
      setFactors(factors.filter((_, i) => i !== index));
    }
  };

  const updateFactor = (index: number, field: keyof Factor, value: string) => {
    const updated = [...factors];
    updated[index][field] = value;
    setFactors(updated);
  };

  const k = factors.filter(f => f.name.trim()).length || factors.length;

  const calculate = () => {
    const l = parseInt(levels);

    if (isNaN(k) || isNaN(l) || k < 2 || l < 2) return;

    const fullRuns = Math.pow(l, k);
    const halfRuns = Math.pow(l, k - 1);
    const quarterRuns = k > 2 ? Math.pow(l, k - 2) : 0;

    // Determine resolution for fractional designs
    let resolution = "";
    if (k <= 3) resolution = isZh ? "全因子设计 (可独立评估全部主效应及高阶交互作用)" : "Full (All interactions can be estimated)";
    else if (k <= 5) resolution = isZh ? "分辨度 IV (主效应与双因子交互混杂独立，双因子间相互混杂)" : "Resolution IV (Main effects clear of 2-factor interactions)";
    else resolution = isZh ? "分辨度 III (主效应与双因子交互作用混杂，需谨慎筛选)" : "Resolution III (Main effects confounded with 2-factor interactions)";

    setResult({ fullRuns, halfRuns, quarterRuns, resolution });
  };

  const handleSave = () => {
    if (!result) return;
    saveCalculation({
      toolId,
      toolName,
      phase,
      inputs: { 
        factors: factors.filter(f => f.name.trim()),
        levels: parseInt(levels),
      },
      results: { ...result },
    });
  };

  // Generate design matrix preview
  const designMatrix = useMemo(() => {
    if (!result || k > 5) return null;
    const runs: string[][] = [];
    const numRuns = Math.min(result.fullRuns, 16); // Limit preview to 16 rows
    
    for (let i = 0; i < numRuns; i++) {
      const row: string[] = [];
      for (let j = 0; j < k; j++) {
        const bit = (i >> (k - 1 - j)) & 1;
        row.push(bit === 0 ? "-" : "+");
      }
      runs.push(row);
    }
    return runs;
  }, [result, k]);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-between items-center">
        <ExampleDataButton onLoad={loadExample} />
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 text-xs gap-1" 
          onClick={addFactor}
          disabled={factors.length >= 8}
        >
          <Plus className="h-3 w-3" />
          {isZh ? "添加因子" : "Add Factor"}
        </Button>
      </div>

      <div className="space-y-2">
        {factors.map((factor, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">{isZh ? `试验因子 ${index + 1}` : `Factor ${index + 1}`}</Label>
              <Input
                placeholder={isZh ? `因子 ${index + 1} 名称` : `Factor ${index + 1} Name`}
                value={factor.name}
                onChange={(e) => updateFactor(index, "name", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="w-24 space-y-1">
              <Label className="text-xs">{isZh ? "低水平 (-)" : "Low (-)"}</Label>
              <Input
                placeholder="-"
                value={factor.lowLevel}
                onChange={(e) => updateFactor(index, "lowLevel", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="w-24 space-y-1">
              <Label className="text-xs">{isZh ? "高水平 (+)" : "High (+)"}</Label>
              <Input
                placeholder="+"
                value={factor.highLevel}
                onChange={(e) => updateFactor(index, "highLevel", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            {factors.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => removeFactor(index)}
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="doe-levels" className="text-xs flex items-center gap-1">
            {isZh ? "每个因子的水平数 (Levels)" : "Levels per Factor"}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {isZh ? "2水平：筛选关键因子；3水平：响应曲面优化非线性曲率" : "2 levels: screening; 3 levels: surface optimization"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <select
            id="doe-levels"
            value={levels}
            onChange={(e) => setLevels(e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="2">{isZh ? "2 水平 (经典全/部分析因筛选)" : "2 Levels (Screening)"}</option>
            <option value="3">{isZh ? "3 水平 (含中心点曲率与响应面优化)" : "3 Levels (Optimization)"}</option>
          </select>
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          {k} {isZh ? "个因子" : "factors"}
        </div>
      </div>

      <Button onClick={calculate} size="sm" className="w-full">
        {isZh ? "核算试验运行方案与正交阵 (Calculate DOE Design)" : "Calculate Design Options"}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded-lg space-y-3 border">
            <div className="flex justify-between items-center p-2.5 bg-background rounded-lg border-2 border-primary/30">
              <div>
                <span className="text-sm font-semibold">{isZh ? "全析因设计 (Full Factorial)" : "Full Factorial"}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground ml-1 inline" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {isZh ? "遍历所有水平组合，信息量最完整且无混杂" : "All combinations tested - maximum precision without confounding"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="font-bold text-lg text-primary">{result.fullRuns} {isZh ? "次试验" : "runs"}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-muted/30 rounded border">
              <div>
                <span className="text-sm font-medium">{isZh ? `半析因部分试验 (1/2 Fraction 2^${k-1})` : `1/2 Fractional (2^${k-1})`}</span>
              </div>
              <span className="font-bold">{result.halfRuns} {isZh ? "次试验" : "runs"}</span>
            </div>
            
            {result.quarterRuns > 0 && (
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded border">
                <div>
                  <span className="text-sm font-medium">{isZh ? `1/4 部分析因试验 (1/4 Fraction 2^${k-2})` : `1/4 Fractional (2^${k-2})`}</span>
                </div>
                <span className="font-bold">{result.quarterRuns} {isZh ? "次试验" : "runs"}</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-muted/30 rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1">{isZh ? "设计分辨度评估 (Resolution)" : "Resolution (Fractional)"}</div>
            <div className="text-sm font-medium text-foreground">{result.resolution}</div>
          </div>

          {designMatrix && designMatrix.length <= 16 && (
            <div className="overflow-x-auto border rounded-lg p-2.5 bg-muted/10">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                {isZh ? "标准正交试验设计矩阵预览 (Design Matrix Preview)" : "Design Matrix (Preview)"}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-xs">{isZh ? "试验序号" : "Run"}</TableHead>
                    {factors.slice(0, k).map((f, i) => (
                      <TableHead key={i} className="text-xs text-center">
                        {f.name || `F${i + 1}`}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designMatrix.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono font-medium">{i + 1}</TableCell>
                      {row.map((cell, j) => (
                        <TableCell key={j} className={`text-center font-mono font-bold ${
                          cell === "+" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
