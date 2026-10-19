import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface DataItem { id: string; measure: string; dataType: string; opDef: string; source: string; sampleSize: string; frequency: string; who: string; }

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function DataCollectionPlanTool({ toolId = "data-collection-plan", toolName = "Datainsamlingsplan", phase = 2 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<DataItem[]>([]);
  const [form, setForm] = useState({ measure: "", dataType: "continuous", opDef: "", source: "", sampleSize: "", frequency: "", who: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const loaded = inputs.items as any[];
    if (Array.isArray(loaded)) {
      setItems(loaded.map(i => ({ 
        id: crypto.randomUUID(), 
        measure: String(i.measure || ""), 
        dataType: String(i.dataType || "continuous"), 
        opDef: String(i.opDef || ""), 
        source: String(i.source || ""), 
        sampleSize: String(i.sampleSize || ""), 
        frequency: String(i.frequency || ""), 
        who: String(i.who || "") 
      })));
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addItem = () => {
    if (!form.measure.trim()) return;
    setItems([...items, { id: crypto.randomUUID(), ...form }]);
    setForm({ ...form, measure: "", opDef: "", source: "", sampleSize: "", frequency: "", who: "" });
  };

  const loadExample = () => {
    const sample = isZh ? [
      { measure: "门护板表面缩水深度 (mm)", dataType: "continuous", opDef: "三坐标激光测头垂直扫描厚筋对侧，最大凹陷差值", source: "CMM 检测站", sampleSize: "5件/批", frequency: "每2小时", who: "专职质检员" },
      { measure: "注塑保压压力 (bar)", dataType: "continuous", opDef: "成型机传感器采集的保压阶段实际油压曲线均值", source: "MES 自动采集", sampleSize: "全数 (100%)", frequency: "实时/每模", who: "SCADA系统" },
      { measure: "装配卡扣折断不良率", dataType: "attribute", opDef: "装配过程中发生脆断、发白的卡扣件数占总件数比例", source: "总装线看板", sampleSize: "全检", frequency: "每班汇总", who: "生产领班" },
      { measure: "烘料颗粒含水率 (PPM)", dataType: "continuous", opDef: "快速水分测定仪高温烘烤失重测试值", source: "化验室测试单", sampleSize: "1次/桶", frequency: "每次换料", who: "配料操作工" },
    ] : [
      { measure: "Delivery Lead Time", dataType: "continuous", opDef: "Duration from PO confirmation to customer receipt (hours)", source: "ERP System", sampleSize: "30 / day", frequency: "Daily", who: "Logistics Coordinator" },
      { measure: "Late Shipment Ratio", dataType: "attribute", opDef: "Shipments delivered past SLA target date", source: "TMS Freight Log", sampleSize: "All orders", frequency: "Weekly", who: "Supply Chain Analyst" },
      { measure: "Picking Errors", dataType: "discrete", opDef: "Count of mispicked items per warehouse wave", source: "WMS Barcode Audit", sampleSize: "50 / shift", frequency: "Each Shift", who: "Warehouse Lead" },
    ];
    setItems(sample.map(x => ({
      id: crypto.randomUUID(),
      ...x
    })));
  };

  const hasResult = items.length > 0;

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "测量什么指标？(What is measured?)" : "What is measured?"}</Label>
          <Input 
            value={form.measure} 
            onChange={e => setForm({ ...form, measure: e.target.value })} 
            placeholder={isZh ? "例如：表面缩水深度 (mm)、保压压力..." : "e.g. Cycle time (s), Pressure"} 
            className="text-sm" 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "数据类型 (Data Type)" : "Data Type"}</Label>
          <Select value={form.dataType} onValueChange={v => setForm({ ...form, dataType: v })}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="continuous">{isZh ? "连续型变量 (计量型 / Continuous)" : "Continuous"}</SelectItem>
              <SelectItem value="discrete">{isZh ? "离散型计数 (计件/计数 / Discrete)" : "Discrete"}</SelectItem>
              <SelectItem value="attribute">{isZh ? "属性型分类 (合格/不合格 / Attribute)" : "Attribute"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "操作定义 (Operational Definition / 具体怎么测)" : "Operational Definition"}</Label>
          <Input 
            value={form.opDef} 
            onChange={e => setForm({ ...form, opDef: e.target.value })} 
            placeholder={isZh ? "清晰量化：工具、单位、取样规范..." : "Exact measurement rule and equipment..."} 
            className="text-sm" 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "数据源 (Data Source)" : "Data Source"}</Label>
          <Input 
            value={form.source} 
            onChange={e => setForm({ ...form, source: e.target.value })} 
            placeholder={isZh ? "MES系统、三坐标机、巡检记录表..." : "ERP, sensor, manual sheet..."} 
            className="text-sm" 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "抽样样本量 (Sample Size)" : "Sample Size (n)"}</Label>
          <Input 
            value={form.sampleSize} 
            onChange={e => setForm({ ...form, sampleSize: e.target.value })} 
            placeholder={isZh ? "如：30件/批" : "e.g. 30"} 
            className="text-sm" 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "采集频次 (Frequency)" : "Frequency"}</Label>
          <Input 
            value={form.frequency} 
            onChange={e => setForm({ ...form, frequency: e.target.value })} 
            placeholder={isZh ? "每2小时、每批次、每日..." : "e.g. Daily, Hourly"} 
            className="text-sm" 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "责任人 (Responsible)" : "Owner / Collector"}</Label>
          <Input 
            value={form.who} 
            onChange={e => setForm({ ...form, who: e.target.value })} 
            placeholder={isZh ? "质检员、巡检领班..." : "e.g. Quality Inspector"} 
            className="text-sm" 
          />
        </div>
      </div>
      <Button size="sm" onClick={addItem} disabled={!form.measure.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "添加到数据计划" : "Add Measurement Plan"}
      </Button>

      {hasResult && (
        <div className="space-y-1.5 pt-1">
          {items.map(item => (
            <div key={item.id} className="p-2.5 border rounded-lg text-xs space-y-1 bg-muted/20">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-foreground text-sm">{item.measure}</span>
                <div className="flex gap-1.5 shrink-0 items-center">
                  <Badge variant="secondary" className="text-[10px]">
                    {item.dataType === "continuous" 
                      ? (isZh ? "连续型" : "Continuous") 
                      : item.dataType === "discrete" 
                      ? (isZh ? "离散型" : "Discrete") 
                      : (isZh ? "属性型" : "Attribute")}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setItems(items.filter(x => x.id !== item.id))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
              {item.opDef && <div className="text-muted-foreground"><strong className="text-foreground">{isZh ? "操作定义:" : "Def:"}</strong> {item.opDef}</div>}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground pt-0.5">
                {item.source && <span><strong>{isZh ? "数据源:" : "Source:"}</strong> {item.source}</span>}
                {item.sampleSize && <span><strong>{isZh ? "样本:" : "n="}</strong> {item.sampleSize}</span>}
                {item.frequency && <span><strong>{isZh ? "频次:" : "Freq:"}</strong> {item.frequency}</span>}
                {item.who && <span><strong>{isZh ? "负责人:" : "Owner:"}</strong> {item.who}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { items }, results: { totalMeasures: items.length, continuous: items.filter(i => i.dataType === "kontinuerlig").length, discrete: items.filter(i => i.dataType === "diskret").length } })} />
    </div>
  );
}
