import { useState, useCallback, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Workflow, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Play, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Box, 
  Users, 
  HelpCircle,
  FileSpreadsheet,
  Download
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

// Flow steps structure
interface VsmProcessStep {
  id: string;
  name: string;
  cycleTime: number;       // Value Added (VA) time in seconds/minutes
  changeoverTime: number;  // C/O in minutes
  uptime: number;          // % uptime (0-100)
  operators: number;       // Number of operators
  inventoryQuantity: number; // Inventory units waiting after this step
}

const TEMPLATES = {
  manufacturing: {
    customerDemand: 120, // units per day
    shiftHours: 8,       // hours per shift
    steps: [
      { id: "1", name: "Stansning", cycleTime: 45, changeoverTime: 15, uptime: 95, operators: 1, inventoryQuantity: 80 },
      { id: "2", name: "Svetsning", cycleTime: 120, changeoverTime: 5, uptime: 88, operators: 2, inventoryQuantity: 220 },
      { id: "3", name: "Montering", cycleTime: 180, changeoverTime: 0, uptime: 98, operators: 4, inventoryQuantity: 50 },
      { id: "4", name: "Kontroll & Paketering", cycleTime: 60, changeoverTime: 2, uptime: 99, operators: 1, inventoryQuantity: 10 }
    ]
  },
  administrative: {
    customerDemand: 40,   // applications processed per day
    shiftHours: 7.5,      // working hours per day
    steps: [
      { id: "1", name: "Registrering", cycleTime: 300, changeoverTime: 0, uptime: 100, operators: 1, inventoryQuantity: 15 },
      { id: "2", name: "Granskning", cycleTime: 900, changeoverTime: 0, uptime: 95, operators: 2, inventoryQuantity: 35 },
      { id: "3", name: "Beslutsfattande", cycleTime: 600, changeoverTime: 0, uptime: 100, operators: 1, inventoryQuantity: 10 },
      { id: "4", name: "Utskick", cycleTime: 120, changeoverTime: 0, uptime: 100, operators: 1, inventoryQuantity: 2 }
    ]
  }
};

export default function VSM() {
  const { locale, t } = useLanguage();
  const isZh = locale === "zh";

  const [customerDemand, setCustomerDemand] = useState<string>("120");
  const [shiftHours, setShiftHours] = useState<string>("8");
  const [steps, setSteps] = useState<VsmProcessStep[]>(TEMPLATES.manufacturing.steps);
  const [showHelp, setShowHelp] = useState(false);

  // New step creation state
  const [newStepName, setNewStepName] = useState("");
  const [newCycleTime, setNewCycleTime] = useState("");
  const [newCOTime, setNewCOTime] = useState("");
  const [newUptime, setNewUptime] = useState("95");
  const [newOperators, setNewOperators] = useState("1");
  const [newInventory, setNewInventory] = useState("");

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (inputs.customerDemand !== undefined) setCustomerDemand(String(inputs.customerDemand));
    if (inputs.shiftHours !== undefined) setShiftHours(String(inputs.shiftHours));
    if (inputs.steps && Array.isArray(inputs.steps)) {
      setSteps(inputs.steps as VsmProcessStep[]);
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave("vsm-mapping", handleLoad);

  const loadTemplate = (type: "manufacturing" | "administrative") => {
    const template = TEMPLATES[type];
    setCustomerDemand(String(template.customerDemand));
    setShiftHours(String(template.shiftHours));
    setSteps(template.steps);
    toast.success(
      isZh 
        ? `已成功加载${type === "manufacturing" ? "离散制造装配产线模版" : "行政事务审批流模版"}！` 
        : `Loaded ${type === "manufacturing" ? "Manufacturing Template" : "Administrative Process Template"}!`
    );
  };

  const addStep = () => {
    if (!newStepName.trim()) {
      toast.error(isZh ? "请输入工序步骤名称。" : "Please enter a process step name.");
      return;
    }
    const ct = parseFloat(newCycleTime) || 0;
    const co = parseFloat(newCOTime) || 0;
    const ut = parseFloat(newUptime) || 100;
    const op = parseFloat(newOperators) || 1;
    const inv = parseFloat(newInventory) || 0;

    const nextId = (Math.max(...steps.map(s => parseInt(s.id) || 0), 0) + 1).toString();
    const newStep: VsmProcessStep = {
      id: nextId,
      name: newStepName,
      cycleTime: ct,
      changeoverTime: co,
      uptime: ut,
      operators: op,
      inventoryQuantity: inv
    };

    setSteps([...steps, newStep]);
    setNewStepName("");
    setNewCycleTime("");
    setNewCOTime("");
    setNewInventory("");
    toast.success(isZh ? `已添加工序「${newStepName}」` : `Added step "${newStepName}"`);
  };

  const removeStep = (id: string) => {
    if (steps.length <= 1) {
      toast.error(isZh ? "价值流中至少需保留 1 个工序步骤。" : "The process stream must retain at least one step.");
      return;
    }
    setSteps(steps.filter(s => s.id !== id));
  };

  const updateStepField = (id: string, field: keyof VsmProcessStep, value: number | string) => {
    setSteps(steps.map(s => {
      if (s.id !== id) return s;
      return { ...s, [field]: value };
    }));
  };

  // Intermediate computations
  const demand = parseFloat(customerDemand) || 1;
  const hours = parseFloat(shiftHours) || 8;
  const availableSecondsPerDay = hours * 3600;
  
  // Takt Time = available time / demand (in seconds)
  const customerTaktSeconds = availableSecondsPerDay / demand;

  // Inventory Lead Time = inventory size / demand (in days)
  // To express in hours: (inv / demand) * shiftHours
  const getInventoryLeadTimeDays = (qty: number) => {
    if (qty <= 0 || demand <= 0) return 0;
    return qty / demand;
  };

  const getInventoryLeadTimeHours = (qty: number) => {
    return getInventoryLeadTimeDays(qty) * hours;
  };

  // Total Value-Add (VA) Time: sum of cycle times
  const totalVATimeSeconds = steps.reduce((sum, s) => sum + s.cycleTime, 0);

  // Total Non-Value-Add (NVA) Time: sum of inventory lead times converted to seconds
  // 1 inventory-day = availableSecondsPerDay (since we only work shiftHours per day)
  const totalNVATimeSeconds = steps.reduce((sum, s) => {
    const invDays = getInventoryLeadTimeDays(s.inventoryQuantity);
    return sum + (invDays * availableSecondsPerDay);
  }, 0);

  const totalLeadTimeSec = totalVATimeSeconds + totalNVATimeSeconds;
  
  // Lead Time in Days
  const totalLeadTimeDays = totalLeadTimeSec / availableSecondsPerDay;
  const processCycleEfficiency = totalLeadTimeSec > 0 ? (totalVATimeSeconds / totalLeadTimeSec) * 100 : 0;

  const handleSave = () => {
    saveCalculation({
      toolId: "vsm-mapping",
      toolName: "Värdeflödesanalys (VSM)",
      phase: 2,
      inputs: { customerDemand, shiftHours, steps },
      results: {
        customerTaktSeconds,
        totalVATimeSeconds,
        totalNVATimeSeconds,
        totalLeadTimeSec,
        totalLeadTimeDays,
        processCycleEfficiency
      }
    });
  };

  return (
    <Layout>
      <section className="py-8 bg-muted/20 min-h-screen">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-6">
            
            {/* VSM Header */}
            <div className="bg-background border border-primary/5 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-40 w-40 bg-primary/2.5 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-1.5 max-w-3xl">
                <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                  <Workflow className="h-3.5 w-3.5" /> {isZh ? "精益制造与流程优化" : "Lean Methodology"}
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {isZh ? "价值流图分析 (Value Stream Mapping - VSM)" : "Value Stream Mapping (VSM)"}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isZh 
                    ? "全景映射企业物料流与信息流。通过量化增值作业时间 (VA) 与非增值等待时间 (NVA)，精准锁定工序瓶颈、在制品 (WIP) 堆积与生产浪费。" 
                    : "Map information and material flows across your organization. VSM isolates bottlenecks, overproduction, and lead time waste by comparing Value-Added (VA) process time to Non-Value-Added (NVA) queue times."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                <Button
                  variant={showHelp ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex items-center gap-2 text-xs font-semibold cursor-pointer py-2 px-3 shrink-0"
                >
                  <HelpCircle className="h-4 w-4" />
                  {showHelp 
                    ? (isZh ? "收起指南" : "Hide Guide") 
                    : (isZh ? "VSM 指南与计算原理" : "Explain VSM & Formulas")}
                </Button>
                <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
              </div>
            </div>

            {/* VSM Help Guide Panel */}
            {showHelp && (
              <Card className="border border-primary/10 bg-primary/2 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
                <CardHeader className="border-b border-primary/5 bg-background/50 py-4 px-6 border-b border-primary/5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <HelpCircle className="h-4 w-4 text-primary animate-pulse" />
                    {isZh ? "方法指南：如何解读价值流图 (VSM 分析)" : "Method Guide: Interpreting Value Stream Mapping (VSM)"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary" /> {isZh ? "什么是 VSM？" : "What is VSM?"}
                      </h4>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {isZh 
                          ? "价值流图 (Value Stream Mapping) 是精益制造的基石工具。它绘制产品或服务从原材料输入到最终交付的全过程，量化对比增值工时与在制品等待停滞时间。" 
                          : "Value Stream Mapping is a core Lean tool. It maps the journey of a product or service, measuring value-added transformation time against inventory and waiting delays."}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary" /> {isZh ? "价值流关键术语" : "Key Flow Concepts"}
                      </h4>
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
                        <li><strong>C/T ({isZh ? "节拍周期时间" : "Cycle Time"}):</strong> {isZh ? "工序处理单个零件的净物理作业耗时。" : "Actual operating time to process a single unit."}</li>
                        <li><strong>C/O ({isZh ? "换型换模时间" : "Changeover Time"}):</strong> {isZh ? "机台从上一批次结束到下一批次合格首件产出的转换耗时。" : "Time required to transition production between products."}</li>
                        <li><strong>Uptime ({isZh ? "设备开动率" : "Equipment Uptime"}):</strong> {isZh ? "设备无故障连续运行的可靠性百分比。" : "Machine availability percentage without unplanned downtime."}</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500" /> {isZh ? "瓶颈工序与在制品 (NVA 浪费)" : "Bottlenecks & WIP Inventory (NVA)"}
                      </h4>
                      <p className="text-muted-foreground text-xs leading-relaxed mb-2">
                        {isZh 
                          ? "工序间三角标识 (∆) 代表堆积排队的在制品。属于典型的非增值时间 (NVA)，积压资金并拉长交付周期。" 
                          : "Inventory triangles (∆) represent queued work-in-progress. They are Non-Value Added (NVA) delays tying up working capital."}
                      </p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {isZh 
                          ? "任何周期时间超过「客户节拍 (Takt Time)」的工序将被系统自动高亮标记为「瓶颈」，这是限制整线产能的首要根因！" 
                          : "Process blocks with cycle time exceeding Customer Takt Time are automatically flagged as Bottlenecks."}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary" /> {isZh ? "计算公式与利特尔法则 (Little's Law)" : "Formulas & Little's Law"}
                      </h4>
                      <div className="font-mono text-[11px] bg-background border rounded px-3 py-2 text-muted-foreground leading-relaxed">
                        • {isZh ? "在制品停留周期 = 在制品库存 / 客户日均需求" : "Inventory Lead Time = Inventory / Daily Demand"}<br />
                        • {isZh ? "客户节拍 Takt = 每日净工作秒数 / 每日需求件数" : "Customer Takt Time = Operating Seconds / Demand"}<br />
                        • {isZh ? "流动效率 PCE = 纯增值时间 (VA) / 总交付周期 (PLT)" : "PCE (Cycle Efficiency) = VA Time / Total Lead Time"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-background/40 p-5 rounded-xl border border-primary/5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" /> {isZh ? "过程循环流动效率 (PCE 评价)" : "Process Cycle Efficiency (PCE)"}
                      </h4>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {isZh ? "量化显示产品全生命周期中真正处于创造价值状态的时间占比：" : "Quantifies percentage of overall lead time that is genuinely value-adding:"}
                      </p>
                      <ul className="space-y-1 text-[11px] text-muted-foreground pl-1.5">
                        <li className="flex items-center gap-1.5"><strong className="text-rose-500">&lt; 5%</strong> - {isZh ? "典型离散车间 (浪费严重，在制品积压)" : "High Waste (Dominated by queue delays)"}</li>
                        <li className="flex items-center gap-1.5"><strong className="text-amber-500">5-15%</strong> - {isZh ? "行业平均运转水准" : "Standard Industrial Performance"}</li>
                        <li className="flex items-center gap-1.5"><strong className="text-emerald-500">&gt; 15%</strong> - {isZh ? "世界级精益标杆 (连续单件流)" : "World-Class Lean (Continuous Flow)"}</li>
                      </ul>
                    </div>
                    <div className="text-[10px] text-muted-foreground italic leading-normal border-t pt-2.5 mt-2">
                      💡 {isZh ? "精益核心策略：削减交付周期的关键在于消除工序间的在制品停滞，而不是盲目催促操作工跑得更快！" : "Lean principle: Slash lead time by attacking queue inventory and handoffs, not by pushing machines beyond safe limits!"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Template Selector & Customer Core Params */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Customer and overall setup */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border border-primary/5 shadow-3xs">
                  <CardHeader className="pb-3 border-b border-primary/5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" /> 
                      {isZh ? "客户需求速率与节拍基线" : "Customer Demand & Takt"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="xs" onClick={() => loadTemplate("manufacturing")} className="flex-1 text-xs py-1.5">
                        ⚙️ {isZh ? "离散制造模板 (车间)" : "Manufacturing"}
                      </Button>
                      <Button variant="outline" size="xs" onClick={() => loadTemplate("administrative")} className="flex-1 text-xs py-1.5">
                        📂 {isZh ? "业务流程模板 (OA/服务)" : "Administrative"}
                      </Button>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <Label htmlFor="customerDemand" className="text-xs font-semibold">
                          {isZh ? "客户每日需求量 (Demand / Day)" : "Customer Demand / Day"}
                        </Label>
                        <div className="relative">
                          <Input 
                            id="customerDemand" 
                            type="number" 
                            value={customerDemand} 
                            onChange={e => setCustomerDemand(e.target.value)} 
                            className="text-sm font-medium"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                            {isZh ? "件 / 天" : "units / day"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="shiftHours" className="text-xs font-semibold">
                          {isZh ? "每日有效作业净工时 (Shift Hours)" : "Effective Shift Hours / Day"}
                        </Label>
                        <div className="relative">
                          <Input 
                            id="shiftHours" 
                            type="number" 
                            step="0.5"
                            value={shiftHours} 
                            onChange={e => setShiftHours(e.target.value)} 
                            className="text-sm font-medium"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                            {isZh ? "小时" : "hours"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/20 border rounded-lg space-y-1 text-center">
                      <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                        {isZh ? "客户节拍时间 (Takt Time)" : "Calculated Takt Time"}
                      </div>
                      <div className="text-2xl font-black font-sans text-primary">
                        {customerTaktSeconds.toFixed(1)}s
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        {isZh 
                          ? `客户每 ${customerTaktSeconds.toFixed(0)} 秒消耗 1 件产品。所有生产工序的单件周期时间 (C/T) 必须低于此上限！` 
                          : `Customer consumes 1 unit every ${customerTaktSeconds.toFixed(0)}s. All upstream process cycles must operate below this rhythm!`}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Adding step form */}
                <Card className="border border-primary/5 shadow-3xs">
                  <CardHeader className="pb-3 border-b border-primary/5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Plus className="h-4 w-4 text-emerald-500" /> {isZh ? "添加新工序步骤" : "Add Process Step"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="newStepName" className="text-xs">
                        {isZh ? "工序名称 (Step Name)" : "Step Name"}
                      </Label>
                      <Input 
                        id="newStepName" 
                        placeholder={isZh ? "如：激光切割、冲压、焊接、包装..." : "e.g. Machining, Assembly, Packing"} 
                        value={newStepName} 
                        onChange={e => setNewStepName(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="newCycleTime" className="text-xs">
                          {isZh ? "周期时间 C/T (秒)" : "Cycle Time C/T (sec)"}
                        </Label>
                        <Input 
                          id="newCycleTime" 
                          type="number" 
                          placeholder={isZh ? "如：180" : "180"} 
                          value={newCycleTime} 
                          onChange={e => setNewCycleTime(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="newCOTime" className="text-xs">
                          {isZh ? "换型时间 C/O (分)" : "Changeover C/O (min)"}
                        </Label>
                        <Input 
                          id="newCOTime" 
                          type="number" 
                          placeholder={isZh ? "如：15" : "15"} 
                          value={newCOTime} 
                          onChange={e => setNewCOTime(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="newUptime" className="text-xs">
                          {isZh ? "开动率 Uptime (%)" : "Uptime (%)"}
                        </Label>
                        <Input 
                          id="newUptime" 
                          type="number" 
                          placeholder="100" 
                          value={newUptime} 
                          onChange={e => setNewUptime(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="newOperators" className="text-xs">
                          {isZh ? "操作工人数" : "Operators"}
                        </Label>
                        <Input 
                          id="newOperators" 
                          type="number" 
                          placeholder="1" 
                          value={newOperators} 
                          onChange={e => setNewOperators(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <Label htmlFor="newInventory" className="text-xs flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-amber-500" /> 
                        {isZh ? "工序后在制品缓冲区库存 (件)" : "Buffer Inventory (units)"}
                      </Label>
                      <Input 
                        id="newInventory" 
                        type="number" 
                        placeholder={isZh ? "如：50" : "50"} 
                        value={newInventory} 
                        onChange={e => setNewInventory(e.target.value)}
                        className="text-xs"
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        {isZh ? "存储在工序间的在制品 (WIP) / 待处理堆积工单。" : "Queued WIP units waiting before next process step."}
                      </span>
                    </div>

                    <Button onClick={addStep} size="sm" className="w-full mt-2 font-medium">
                      {isZh ? "插入工序到价值流" : "Add Step to Stream"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Interactive map list and stair step timeline preview */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Visual Flow Representation Map */}
                <Card className="border border-primary/10 overflow-hidden shadow-sm">
                  <CardHeader className="bg-muted/10 border-b border-primary/5 py-4">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Workflow className="h-4.5 w-4.5 text-primary" /> 
                        {isZh ? "价值流可视化全景图 (物流与在制品链)" : "Value Stream Map Visualization (Material & Flow)"}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {isZh ? "点击下方各单元格可直接在流程链中修改数值" : "Click values to edit directly"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row flex-wrap items-center justify-start gap-4">
                      {steps.map((step, index) => {
                        const isTaktExceeded = step.cycleTime > customerTaktSeconds;
                        const leadTimeHrs = getInventoryLeadTimeHours(step.inventoryQuantity);
                        const leadTimeDays = getInventoryLeadTimeDays(step.inventoryQuantity);

                        return (
                          <div key={step.id} className="flex flex-col md:flex-row items-center gap-4">
                            {/* Process Block Card */}
                            <div className={`w-52 rounded-xl border p-4 bg-background shadow-3xs relative transition-all hover:ring-1 hover:ring-primary/20 ${isTaktExceeded ? "border-rose-400 dark:border-rose-800" : "border-primary/10"}`}>
                              {isTaktExceeded && (
                                <Badge variant="destructive" className="absolute -top-2.5 left-3 text-[9px] uppercase tracking-wider py-0.5 px-2">
                                  {isZh ? "瓶颈工序 (>节拍)" : "Bottleneck (>Takt)"}
                                </Badge>
                              )}
                              
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                  {isZh ? `工序 ${index + 1}` : `Step ${index + 1}`}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeStep(step.id)}
                                  className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              <input 
                                className="font-semibold text-sm w-full bg-transparent border-0 border-b border-transparent hover:border-muted-foreground/30 focus:border-primary focus:ring-0 p-0 mb-3 text-foreground"
                                value={step.name} 
                                onChange={e => updateStepField(step.id, "name", e.target.value)} 
                              />

                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">{isZh ? "周期时间 (C/T):" : "Cycle Time (C/T):"}</span>
                                  <div className="flex items-center gap-1 w-20 justify-end">
                                    <input 
                                      type="number" 
                                      className="font-bold text-right p-0 h-5 w-12 bg-muted/30 border-0 rounded text-xs" 
                                      value={step.cycleTime || ""} 
                                      onChange={e => updateStepField(step.id, "cycleTime", parseFloat(e.target.value) || 0)} 
                                    />
                                    <span className="text-muted-foreground text-[10px]">{isZh ? "秒" : "s"}</span>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">{isZh ? "换型时间 (C/O):" : "Changeover (C/O):"}</span>
                                  <div className="flex items-center gap-1 w-20 justify-end">
                                    <input 
                                      type="number" 
                                      className="p-0 text-right h-5 w-12 bg-muted/10 border-0 rounded text-xs" 
                                      value={step.changeoverTime || ""} 
                                      onChange={e => updateStepField(step.id, "changeoverTime", parseFloat(e.target.value) || 0)} 
                                    />
                                    <span className="text-muted-foreground text-[10px]">{isZh ? "分" : "min"}</span>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">{isZh ? "开动率 Uptime:" : "Uptime:"}</span>
                                  <div className="flex items-center gap-1 w-20 justify-end">
                                    <input 
                                      type="number" 
                                      className="p-0 text-right h-5 w-12 bg-muted/10 border-0 rounded text-xs" 
                                      value={step.uptime || ""} 
                                      onChange={e => updateStepField(step.id, "uptime", parseFloat(e.target.value) || 100)} 
                                    />
                                    <span className="text-muted-foreground text-[10px]">%</span>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">{isZh ? "操作工配置:" : "Operators:"}</span>
                                  <div className="flex items-center gap-1 w-20 justify-end">
                                    <input 
                                      type="number" 
                                      className="p-0 text-right h-5 w-12 bg-muted/10 border-0 rounded text-xs" 
                                      value={step.operators || ""} 
                                      onChange={e => updateStepField(step.id, "operators", parseFloat(e.target.value) || 1)} 
                                    />
                                    <span className="text-muted-foreground text-[10px]">{isZh ? "人" : "pers"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Arrow and Intercepting Inventory Triangle */}
                            <div className="flex md:flex-row items-center gap-2">
                              <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
                              
                              {/* Inventory Visual Triangle Block representation */}
                              <div className="flex flex-col items-center bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg text-center min-w-28 relative">
                                <div className="absolute -top-1 right-1">
                                  <Badge className="bg-amber-500 hover:bg-amber-600 font-bold p-0 px-1 text-[8px] h-3">∆</Badge>
                                </div>
                                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block mb-1">
                                  {isZh ? "在制品库存" : "WIP Buffer"}
                                </span>
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <input 
                                    type="number" 
                                    className="font-bold text-center p-0 h-6 w-14 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-0 rounded text-xs" 
                                    value={step.inventoryQuantity || ""} 
                                    placeholder="0"
                                    onChange={e => updateStepField(step.id, "inventoryQuantity", parseFloat(e.target.value) || 0)} 
                                  />
                                  <span className="text-[10px] text-muted-foreground">{isZh ? "件" : "pcs"}</span>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground leading-none">
                                  {leadTimeDays >= 1 
                                    ? `~${leadTimeDays.toFixed(1)} ${isZh ? "天" : "d"}` 
                                    : `${leadTimeHrs.toFixed(1)} ${isZh ? "小时" : "h"}`
                                  } {isZh ? "停滞" : "lead time"}
                                </span>
                              </div>

                              {index < steps.length - 1 && (
                                <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                </CardContent>
              </Card>

              {/* Classic Lead Time Stairway Chart (Visuella Trappan) */}
              <Card className="border border-primary/10 overflow-hidden shadow-sm">
                <CardHeader className="bg-muted/10 border-b border-primary/5 py-3">
                  <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" /> 
                    {isZh ? "价值流周转台阶线 (Value Stream Staircase)" : "Value Stream Timeline Staircase"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative border-b pb-4">
                    {/* Visual stairs */}
                    <div className="flex flex-col md:flex-row items-stretch w-full justify-start select-none">
                      {steps.map((step, idx) => {
                        const invDays = getInventoryLeadTimeDays(step.inventoryQuantity);
                        const isHighInventory = invDays > 1;

                        return (
                          <div key={step.id} className="flex-1 flex flex-col justify-between pt-8">
                            
                            {/* Inventory NVA (Upper line of stair) */}
                            <div className="border-t-2 border-r-2 border-dashed border-amber-500/50 h-10 px-2 relative text-right flex flex-col justify-end">
                              <span className="absolute -top-5 right-2 text-[10px] font-mono text-amber-600 font-semibold">
                                NVA: {invDays >= 1 ? `${invDays.toFixed(1)}d` : `${(invDays * hours).toFixed(1)}h`}
                              </span>
                              {isHighInventory && (
                                <span className="absolute -top-7 left-1 text-[9px] text-rose-500 font-bold flex items-center gap-0.5">
                                  <AlertTriangle className="h-2.5 w-2.5" /> {isZh ? "高等待停滞" : "High Queue"}
                                </span>
                              )}
                            </div>

                            {/* Process VA (Lower line of stair) */}
                            <div className="border-t-2 border-r-2 border-primary h-10 px-2 relative bg-primary/2.5">
                              <span className="absolute bottom-1 left-2 text-[10px] font-bold text-primary truncate max-w-[95%]">
                                {step.name}
                              </span>
                              <span className="absolute top-1 right-2 text-[10px] font-mono font-medium text-muted-foreground">
                                VA: {step.cycleTime}s
                              </span>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pt-4">
                    
                    <div className="bg-muted/10 border p-4 rounded-xl text-center">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        {isZh ? "流程制造周期 (PLT)" : "Process Lead Time (PLT)"}
                      </div>
                      <div className="text-3xl font-black font-sans leading-none mb-1 text-amber-600 dark:text-amber-400">
                        {totalLeadTimeDays.toFixed(1)}{isZh ? "天" : "d"}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {isZh ? `全流程周转合计约 ${(totalLeadTimeSec / 3600).toFixed(0)} 工时` : `Total ${(totalLeadTimeSec / 3600).toFixed(0)} working hours in flow`}
                      </p>
                    </div>

                    <div className="bg-muted/10 border p-4 rounded-xl text-center">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        {isZh ? "纯增值创造工时 (VA)" : "Value-Added Time (VA)"}
                      </div>
                      <div className="text-3xl font-black font-sans leading-none mb-1 text-primary">
                        {totalVATimeSeconds.toFixed(0)}{isZh ? "秒" : "s"}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {isZh ? "所有物理加工与增值工序耗时总和" : "Total sum of all processing operations"}
                      </p>
                    </div>

                    <div className="bg-muted/10 border p-4 rounded-xl text-center">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        {isZh ? "非增值停滞时间 (NVA)" : "Non-Value Added Time (NVA)"}
                      </div>
                      <div className="text-3xl font-black font-sans leading-none mb-1 text-rose-500">
                        {(totalNVATimeSeconds / 3600).toFixed(1)}{isZh ? "小时" : "h"}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {isZh ? "工序间搬运、在制品排队与等待停滞" : "WIP inventory, batch queuing and waiting"}
                      </p>
                    </div>

                    <div className="bg-muted/10 border p-4 rounded-xl text-center">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        {isZh ? "过程循环效率 (PCE)" : "Process Cycle Efficiency (PCE)"}
                      </div>
                      <div className="text-3xl font-black font-sans leading-none mb-1 text-emerald-600 dark:text-emerald-400">
                        {processCycleEfficiency.toFixed(2)}%
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {processCycleEfficiency < 5 
                          ? (isZh ? "🔴 周转极低 (浪费严重，需精益突破)" : "🔴 Very Low (High Waste)") 
                          : processCycleEfficiency < 15 
                          ? (isZh ? "🟡 行业平均水平" : "🟡 Average Efficiency") 
                          : (isZh ? "🟢 精益标杆水平 (>15%)" : "🟢 World Class (>15%)")}
                      </p>
                    </div>

                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row justify-between items-center border-t border-primary/5 pt-6 gap-4">
                    <p className="text-xs text-muted-foreground max-w-xl">
                      💡 <strong>{isZh ? "精益改善建议:" : "Lean Recommendation:"}</strong> {isZh ? "传统制造流程的循环效率 (PCE) 往往不足 5%。通过聚焦削减瓶颈工序前的在制品排队积压与等待，您可以在完全不增加机台设计产速的前提下拉低 50% 以上的交付周期！" : "Traditional operations often have PCE below 5%. Cutting queue inventory in front of bottlenecks slashes customer lead times without machine speed increases!"}
                    </p>
                    <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
                      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={true} notes={notes} onNotesChange={setNotes} onSave={handleSave} />
                    </div>
                  </div>

                </CardContent>
              </Card>

              </div>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}
