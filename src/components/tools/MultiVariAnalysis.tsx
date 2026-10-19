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
import { toast } from "sonner";

interface DataPoint { id: string; withinUnit: string; betweenUnit: string; temporal: string; value: number; }

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function MultiVariAnalysis({ toolId = "multi-vari", toolName = "Multi-Vari Analysis", phase = 3 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [points, setPoints] = useState<DataPoint[]>([]);
  const [form, setForm] = useState({ withinUnit: "", betweenUnit: "", temporal: "", value: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const loaded = inputs.points as any[];
    if (Array.isArray(loaded)) {
      setPoints(loaded.map(p => ({ id: crypto.randomUUID(), withinUnit: String(p.withinUnit || ""), betweenUnit: String(p.betweenUnit || ""), temporal: String(p.temporal || ""), value: Number(p.value) || 0 })));
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addPoint = () => {
    const val = parseFloat(form.value);
    if (isNaN(val)) return;
    setPoints([...points, { id: crypto.randomUUID(), ...form, value: val }]);
    setForm({ ...form, value: "" });
  };

  const loadExample = () => {
    const sample = isZh ? [
      { withinUnit: "顶部", betweenUnit: "产品 1", temporal: "早班", value: 10.2 },
      { withinUnit: "中部", betweenUnit: "产品 1", temporal: "早班", value: 10.4 },
      { withinUnit: "底部", betweenUnit: "产品 1", temporal: "早班", value: 10.1 },
      { withinUnit: "顶部", betweenUnit: "产品 2", temporal: "早班", value: 10.8 },
      { withinUnit: "中部", betweenUnit: "产品 2", temporal: "早班", value: 10.9 },
      { withinUnit: "底部", betweenUnit: "产品 2", temporal: "早班", value: 10.7 },
      { withinUnit: "顶部", betweenUnit: "产品 1", temporal: "中班", value: 10.5 },
      { withinUnit: "中部", betweenUnit: "产品 1", temporal: "中班", value: 10.6 },
      { withinUnit: "顶部", betweenUnit: "产品 2", temporal: "中班", value: 11.1 },
      { withinUnit: "中部", betweenUnit: "产品 2", temporal: "中班", value: 11.0 },
    ] : [
      { withinUnit: "Top", betweenUnit: "Part 1", temporal: "Morning", value: 10.2 },
      { withinUnit: "Middle", betweenUnit: "Part 1", temporal: "Morning", value: 10.4 },
      { withinUnit: "Bottom", betweenUnit: "Part 1", temporal: "Morning", value: 10.1 },
      { withinUnit: "Top", betweenUnit: "Part 2", temporal: "Morning", value: 10.8 },
      { withinUnit: "Middle", betweenUnit: "Part 2", temporal: "Morning", value: 10.9 },
      { withinUnit: "Bottom", betweenUnit: "Part 2", temporal: "Morning", value: 10.7 },
      { withinUnit: "Top", betweenUnit: "Part 1", temporal: "Afternoon", value: 10.5 },
      { withinUnit: "Middle", betweenUnit: "Part 1", temporal: "Afternoon", value: 10.6 },
      { piece: "Top", betweenUnit: "Part 2", temporal: "Afternoon", value: 11.1 },
      { withinUnit: "Middle", betweenUnit: "Part 2", temporal: "Afternoon", value: 11.0 },
    ];
    setPoints(sample.map(p => ({ id: crypto.randomUUID(), ...p, withinUnit: (p as any).withinUnit || "Top" })));
  };

  const hasResult = points.length >= 3;
  const values = points.map(p => p.value);
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const stdDev = values.length > 1 ? Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)) : 0;

  const withinGroups = [...new Set(points.map(p => p.withinUnit))];
  const betweenGroups = [...new Set(points.map(p => p.betweenUnit))];
  const temporalGroups = [...new Set(points.map(p => p.temporal))];

  const groupVariance = (groups: string[], getGroup: (p: DataPoint) => string) => {
    if (groups.length <= 1) return 0;
    const groupMeans = groups.map(g => { const gv = points.filter(p => getGroup(p) === g).map(p => p.value); return gv.length ? gv.reduce((a, b) => a + b, 0) / gv.length : 0; });
    return groupMeans.reduce((s, m) => s + (m - mean) ** 2, 0) / groups.length;
  };

  const withinVar = groupVariance(withinGroups, p => p.withinUnit);
  const betweenVar = groupVariance(betweenGroups, p => p.betweenUnit);
  const temporalVar = groupVariance(temporalGroups, p => p.temporal);
  const totalVar = withinVar + betweenVar + temporalVar || 1;

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">
            {isZh ? "件内变异 (位置/测量点)" : "Within-Piece (Position/Point)"}
          </Label>
          <Input 
            value={form.withinUnit} 
            onChange={e => setForm({ ...form, withinUnit: e.target.value })} 
            placeholder={isZh ? "例如：顶部、中部、底部" : "e.g. Top, Middle, Bottom"} 
            className="text-sm" 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            {isZh ? "件间变异 (部件/批次)" : "Piece-to-Piece (Part/Batch)"}
          </Label>
          <Input 
            value={form.betweenUnit} 
            onChange={e => setForm({ ...form, betweenUnit: e.target.value })} 
            placeholder={isZh ? "例如：产品1, 产品2" : "e.g. Part 1, Part 2"} 
            className="text-sm" 
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">
            {isZh ? "时间变异 (班次/时刻)" : "Time-to-Time (Shift/Time)"}
          </Label>
          <Input 
            value={form.temporal} 
            onChange={e => setForm({ ...form, temporal: e.target.value })} 
            placeholder={isZh ? "例如：早班、中班、晚班" : "e.g. Morning, Evening"} 
            className="text-sm" 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            {isZh ? "实际测量数值" : "Measured Value"}
          </Label>
          <Input 
            type="number" 
            value={form.value} 
            onChange={e => setForm({ ...form, value: e.target.value })} 
            placeholder="10.5" 
            className="text-sm" 
          />
        </div>
      </div>
      <Button size="sm" onClick={addPoint} disabled={!form.value} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "添加多变量测量点" : "Add Data Point"}
      </Button>

      {points.length > 0 && (
        <div className="border rounded-lg overflow-x-auto max-h-40 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="p-1.5 text-left">{isZh ? "件内位置" : "Within"}</th>
                <th className="p-1.5 text-left">{isZh ? "件间工件" : "Between"}</th>
                <th className="p-1.5 text-left">{isZh ? "时间时刻" : "Temporal"}</th>
                <th className="p-1.5 text-right">{isZh ? "测量值" : "Value"}</th>
                <th className="p-1.5 w-6"></th>
              </tr>
            </thead>
            <tbody>
              {points.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-1.5">{p.withinUnit || "–"}</td>
                  <td className="p-1.5">{p.betweenUnit || "–"}</td>
                  <td className="p-1.5">{p.temporal || "–"}</td>
                  <td className="p-1.5 text-right font-mono">{p.value}</td>
                  <td className="p-1.5">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setPoints(points.filter(x => x.id !== p.id))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasResult && (
        <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2 border">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-1.5 bg-background rounded border">
              <div className="font-semibold font-mono text-sm">{mean.toFixed(3)}</div>
              <div className="text-muted-foreground">{isZh ? "总体均值" : "Mean"}</div>
            </div>
            <div className="p-1.5 bg-background rounded border">
              <div className="font-semibold font-mono text-sm">{stdDev.toFixed(3)}</div>
              <div className="text-muted-foreground">{isZh ? "样本标准差" : "Std Dev"}</div>
            </div>
            <div className="p-1.5 bg-background rounded border">
              <div className="font-semibold font-mono text-sm">{points.length}</div>
              <div className="text-muted-foreground">{isZh ? "有效样本量" : "Data Points"}</div>
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            <p className="font-semibold text-foreground">
              {isZh ? "变异源贡献率分解 (Variation Breakdown):" : "Variation Breakdown:"}
            </p>
            {[
              { label: isZh ? "件内变异 (Within-Piece)" : "Within-Piece", val: withinVar },
              { label: isZh ? "件间变异 (Piece-to-Piece)" : "Piece-to-Piece", val: betweenVar },
              { label: isZh ? "时间变异 (Time-to-Time)" : "Time-to-Time", val: temporalVar },
            ].map(v => (
              <div key={v.label} className="flex items-center gap-2">
                <span className="w-36 text-muted-foreground truncate">{v.label}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(v.val / totalVar * 100).toFixed(0)}%` }} />
                </div>
                <span className="w-12 text-right font-mono font-medium">{(v.val / totalVar * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { points }, results: { mean, stdDev, n: points.length, withinPct: (withinVar / totalVar * 100), betweenPct: (betweenVar / totalVar * 100), temporalPct: (temporalVar / totalVar * 100) } })} />
    </div>
  );
}
