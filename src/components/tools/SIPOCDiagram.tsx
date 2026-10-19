import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RotateCcw, ArrowRight } from "lucide-react";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface SIPOCData {
  suppliers: string[];
  inputs: string[];
  process: string[];
  outputs: string[];
  customers: string[];
}

const columns: { key: keyof SIPOCData; label: string; placeholder: string; color: string }[] = [
  { key: "suppliers", label: "Suppliers", placeholder: "Leverantör...", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { key: "inputs", label: "Inputs", placeholder: "Insats/material...", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { key: "process", label: "Process", placeholder: "Processteg...", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { key: "outputs", label: "Outputs", placeholder: "Resultat/leverans...", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { key: "customers", label: "Customers", placeholder: "Kund/mottagare...", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
];

interface SIPOCDiagramProps {
  toolId?: string;
  toolName?: string;
  phase?: number;
}

export function SIPOCDiagram({ toolId = "sipoc", toolName = "SIPOC", phase = 1 }: SIPOCDiagramProps) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const columns: { key: keyof SIPOCData; label: string; placeholder: string; color: string }[] = [
    { key: "suppliers", label: isZh ? "供应商 (Suppliers)" : "Suppliers", placeholder: isZh ? "原材料/信息提供方..." : "Supplier...", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    { key: "inputs", label: isZh ? "输入 (Inputs)" : "Inputs", placeholder: isZh ? "物料、工单、图纸..." : "Input/Material...", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    { key: "process", label: isZh ? "核心过程 (Process)" : "Process", placeholder: isZh ? "4-7步核心工序流..." : "Process step...", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
    { key: "outputs", label: isZh ? "输出 (Outputs)" : "Outputs", placeholder: isZh ? "半成品、成品、数据..." : "Product/Output...", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
    { key: "customers", label: isZh ? "客户 (Customers)" : "Customers", placeholder: isZh ? "下道工序/终端用户..." : "Customer...", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  ];

  const [data, setData] = useState<SIPOCData>({ suppliers: [""], inputs: [""], process: [""], outputs: [""], customers: [""] });
  const [processName, setProcessName] = useState("");

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    setProcessName(String(inputs.processName || ""));
    const d = inputs.data as any;
    if (d) {
      setData({
        suppliers: Array.isArray(d.suppliers) ? d.suppliers.map(String) : [""],
        inputs: Array.isArray(d.inputs) ? d.inputs.map(String) : [""],
        process: Array.isArray(d.process) ? d.process.map(String) : [""],
        outputs: Array.isArray(d.outputs) ? d.outputs.map(String) : [""],
        customers: Array.isArray(d.customers) ? d.customers.map(String) : [""],
      });
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const updateItem = (key: keyof SIPOCData, index: number, value: string) => {
    setData((prev) => ({ ...prev, [key]: prev[key].map((item, i) => (i === index ? value : item)) }));
  };

  const addItem = (key: keyof SIPOCData) => {
    setData((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
  };

  const removeItem = (key: keyof SIPOCData, index: number) => {
    if (data[key].length > 1) {
      setData((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
    }
  };

  const reset = () => {
    setData({ suppliers: [""], inputs: [""], process: [""], outputs: [""], customers: [""] });
    setProcessName("");
  };

  const loadExample = () => {
    if (isZh) {
      setProcessName("汽车门护板总成制造流程");
      setData({
        suppliers: ["注塑粒子供应商 (LG化学)", "卡扣冲压件厂", "生产计划科 (MES)"],
        inputs: ["ABS/PC 改性塑料颗粒", "金属加强骨架", "生产派工单与数模"],
        process: ["注塑成型工序", "机械手剪水口与打磨", "超声波骨架焊接", "总装卡扣压装", "下线全功能外观检"],
        outputs: ["门护板总成合格品", "注塑流道废料 (粉碎回收)", "全检质检记录单"],
        customers: ["主机厂总装二车间", "下道中控台装配线"],
      });
    } else {
      setProcessName("Order Processing & Fulfillment Flow");
      setData({
        suppliers: ["Customer", "Sales Ops", "Warehouse"],
        inputs: ["Purchase Order", "BOM Spec", "Inventory Levels"],
        process: ["Receive PO", "Credit Approval", "Batch Pick", "Pack & Label", "Dispatch Carrier"],
        outputs: ["Shipped Goods", "Commercial Invoice", "Tracking ID"],
        customers: ["End Client", "Finance & Accounting"],
      });
    }
  };


  const filledCounts = columns.map((col) => data[col.key].filter((v) => v.trim()).length);
  const totalFilled = filledCounts.reduce((a, b) => a + b, 0);
  const hasResult = totalFilled >= 3;

  const handleSave = () => {
    const filledData: Record<string, string[]> = {};
    for (const col of columns) {
      filledData[col.key] = data[col.key].filter(v => v.trim());
    }
    saveCalculation({
      toolId, toolName, phase,
      inputs: { processName, data: filledData },
      results: { totalItems: totalFilled, filledColumns: columns.filter(c => data[c.key].some(v => v.trim())).length },
    });
  };

  return (
    <div className="space-y-4">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div>
        <label className="text-sm font-medium text-foreground">
          {isZh ? "流程名称 (Process Name)" : "Process Name"}
        </label>
        <Input 
          placeholder={isZh ? "例如：汽车门护板总成制造流程..." : "e.g. Order Processing Flow..."} 
          value={processName} 
          onChange={(e) => setProcessName(e.target.value)} 
          className="mt-1" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {columns.map((col, colIdx) => (
          <div key={col.key} className="space-y-2">
            <div className="flex items-center gap-1">
              <Badge className={col.color}>{col.label}</Badge>
              {colIdx < columns.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground hidden md:block" />}
            </div>
            {data[col.key].map((item, i) => (
              <div key={i} className="flex gap-1">
                <Input value={item} onChange={(e) => updateItem(col.key, i, e.target.value)} placeholder={col.placeholder} className="text-sm" />
                {data[col.key].length > 1 && (
                  <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => removeItem(col.key, i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => addItem(col.key)}>
              <Plus className="h-3 w-3 mr-1" /> {isZh ? "添加项" : "Lägg till"}
            </Button>
          </div>
        ))}
      </div>

      {totalFilled >= 3 && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <p className="font-medium mb-1">{processName || "SIPOC"} — {isZh ? "要素统计汇总" : "Sammanfattning"}</p>
          <div className="flex flex-wrap gap-3">
            {columns.map((col, i) => (
              <span key={col.key} className="text-muted-foreground">{col.label}: {filledCounts[i]}</span>
            ))}
          </div>
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={handleSave} />

      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="h-3 w-3 mr-1" /> {isZh ? "清空重置" : "Återställ"}
        </Button>
      </div>
    </div>
  );
}
