import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceLine, Bar } from "recharts";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface ParetoItem { id: string; category: string; count: number; }

interface ParetoAnalysisProps { toolId?: string; toolName?: string; phase?: number; }

export function ParetoAnalysis({ toolId = "pareto", toolName = "Paretoanalys", phase = 2 }: ParetoAnalysisProps) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<ParetoItem[]>([
    { id: crypto.randomUUID(), category: "", count: 0 },
    { id: crypto.randomUUID(), category: "", count: 0 },
    { id: crypto.randomUUID(), category: "", count: 0 },
  ]);

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const loaded = inputs.items as any[];
    if (Array.isArray(loaded)) {
      setItems(loaded.map(i => ({ id: crypto.randomUUID(), category: String(i.category || ""), count: Number(i.count) || 0 })));
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addItem = () => setItems((prev) => [...prev, { id: crypto.randomUUID(), category: "", count: 0 }]);
  const removeItem = (id: string) => { if (items.length > 1) setItems((prev) => prev.filter((item) => item.id !== id)); };
  const updateItem = (id: string, field: "category" | "count", value: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: field === "count" ? Number(value) || 0 : value } : item));
  };

  const loadExample = () => {
    const sample = isZh ? [
      { category: "门护板表面注塑缩水", count: 142 },
      { category: "装配卡扣折断破损", count: 85 },
      { category: "轮廓边缘飞边毛刺", count: 34 },
      { category: "表面颗粒与划痕", count: 18 },
      { category: "色差与熔接痕", count: 12 },
      { category: "超声波焊接虚焊", count: 6 },
    ] : [
      { category: "Surface sink marks", count: 142 },
      { category: "Broken clip snaps", count: 85 },
      { category: "Edge burrs / flashes", count: 34 },
      { category: "Surface scratches", count: 18 },
      { category: "Weld line blemish", count: 12 },
      { category: "Ultrasonic weld defect", count: 6 },
    ];
    setItems(sample.map(s => ({
      id: crypto.randomUUID(),
      category: s.category,
      count: s.count,
    })));
  };

  const chartData = useMemo(() => {
    const valid = items.filter((i) => i.category.trim() && i.count > 0);
    if (valid.length === 0) return [];
    const sorted = [...valid].sort((a, b) => b.count - a.count);
    const total = sorted.reduce((sum, i) => sum + i.count, 0);
    let cumulative = 0;
    return sorted.map((item) => {
      cumulative += item.count;
      return { category: item.category, count: item.count, cumPct: Math.round((cumulative / total) * 100), pct: Math.round((item.count / total) * 100) };
    });
  }, [items]);

  const vitalFew = chartData.filter((d) => d.cumPct <= 80);
  const reset = () => setItems([{ id: crypto.randomUUID(), category: "", count: 0 }, { id: crypto.randomUUID(), category: "", count: 0 }, { id: crypto.randomUUID(), category: "", count: 0 }]);
  const hasResult = chartData.length > 0;

  return (
    <div className="space-y-4">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_100px_40px] gap-2 text-sm font-medium text-muted-foreground">
          <span>{isZh ? "缺陷类别 / 根因项目" : "Category / Defect Cause"}</span>
          <span>{isZh ? "发生频次" : "Count"}</span>
          <span />
        </div>
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_100px_40px] gap-2">
            <Input 
              value={item.category} 
              onChange={(e) => updateItem(item.id, "category", e.target.value)} 
              placeholder={isZh ? "例如：注塑缩水缺陷..." : "e.g. Transport damage"} 
            />
            <Input type="number" value={item.count || ""} onChange={(e) => updateItem(item.id, "count", e.target.value)} placeholder="0" min={0} />
            <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)} disabled={items.length <= 1}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={addItem}>
          <Plus className="h-3 w-3 mr-1" /> {isZh ? "添加缺陷行" : "Add Row"}
        </Button>
      </div>

      {chartData.length > 0 && (
        <div className="border rounded-lg p-4 bg-background">
          <h4 className="text-sm font-semibold mb-3">
            {isZh ? "帕累托累计贡献图 (80/20 柏拉图)" : "Pareto Analysis Chart"}
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" className="fill-foreground" />
              <YAxis yAxisId="left" className="fill-foreground" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" className="fill-foreground" tick={{ fontSize: 11 }} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover text-popover-foreground border rounded-lg p-2 text-sm shadow-md">
                    <p className="font-medium">{d.category}</p>
                    <p>{isZh ? "频次" : "Count"}: {d.count} ({d.pct}%)</p>
                    <p>{isZh ? "累计占比" : "Cumulative"}: {d.cumPct}%</p>
                  </div>
                );
              }} />
              <Bar yAxisId="left" dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
              <ReferenceLine yAxisId="right" y={80} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "80%", position: "right", fontSize: 11 }} />
            </ComposedChart>
          </ResponsiveContainer>
          {vitalFew.length > 0 && (
            <div className="mt-3 bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-semibold text-primary">
                {isZh ? "关键少数核心缺陷 (Vital Few - 80/20 法则):" : "Vital Few Causes (80/20 Rule):"}
              </p>
              <p className="text-muted-foreground mt-0.5">
                {vitalFew.map((v) => v.category).join(", ")} — 
                {isZh 
                  ? ` 贡献了累计 ${vitalFew[vitalFew.length - 1]?.cumPct}% 的全部质量损失 (占全部 ${chartData.length} 类缺陷中的前 ${vitalFew.length} 项)`
                  : ` accounts for ${vitalFew[vitalFew.length - 1]?.cumPct}% of total defects (${vitalFew.length} of ${chartData.length} categories)`}
              </p>
            </div>
          )}
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { items: items.filter(i => i.category.trim() && i.count > 0).map(i => ({ category: i.category, count: i.count })) }, results: { chartData, vitalFew: vitalFew.map(v => v.category), totalCategories: chartData.length } })} />

      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="h-3 w-3 mr-1" /> {isZh ? "清空重置" : "Reset"}
        </Button>
      </div>
    </div>
  );
}
