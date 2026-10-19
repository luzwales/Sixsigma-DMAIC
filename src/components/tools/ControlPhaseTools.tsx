import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props { toolId?: string; toolName?: string; phase?: number; }

// SOP Template
export function SOPTool({ toolId = "sop", toolName = "Standard Operating Procedure (SOP)", phase = 5 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [steps, setSteps] = useState<{ id: string; step: string; detail: string; caution: string }[]>([]);
  const [meta, setMeta] = useState({ title: "", purpose: "", scope: "", responsible: "" });
  const [form, setForm] = useState({ step: "", detail: "", caution: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (inputs.meta && typeof inputs.meta === "object") {
      const m = inputs.meta as any;
      setMeta({ title: String(m.title || ""), purpose: String(m.purpose || ""), scope: String(m.scope || ""), responsible: String(m.responsible || "") });
    }
    if (Array.isArray(inputs.steps)) setSteps(inputs.steps as any[]);
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addStep = () => {
    if (!form.step.trim()) return;
    setSteps([...steps, { id: crypto.randomUUID(), ...form }]);
    setForm({ step: "", detail: "", caution: "" });
  };

  const loadExample = () => {
    if (isZh) {
      setMeta({
        title: "汽车门护板总成注塑成型标准作业指导书 (SOP-IM-024)",
        purpose: "明确注塑工装预热、四点锁模保压及首件检验手顺，杜绝缩水与尺寸超差缺陷。",
        scope: "适用于注塑车间 2 号/3 号机台，覆盖 A/B 两班调机技术员及质检员。",
        responsible: "工艺部技术总监 / 注塑车间主任",
      });
      setSteps([
        { id: crypto.randomUUID(), step: "开班准备与点检", detail: "点检模温机进出水压差与循环水温 (90±2℃)，确认干燥筒料位及含水率合格", caution: "作业必须佩戴耐高温手套与防护面罩" },
        { id: crypto.randomUUID(), step: "模具锁紧与参数载入", detail: "调用工艺配方 P-204 并锁定，核验锁模力设定为 1800 kN", caution: "严禁擅自修改一二级保压压力值" },
        { id: crypto.randomUUID(), step: "连续生产首件自检", detail: "前 3 件成型件报废，取第 4-6 件测量 8 处关键装配卡扣间距", caution: "卡尺必须定期校正并在有效检定周期内" },
        { id: crypto.randomUUID(), step: "过程巡检与数据录入", detail: "每两小时抽检 5 件填写 SPC I-MR 控制图看板", caution: "发现单点超出 UCL 必须立即停机触发 OCAP" },
        { id: crypto.randomUUID(), step: "定置装箱与扫码转序", detail: "将合格件放入专用吸塑吸塑托盘，扫码过站生成防错条码", caution: "堆叠层数严禁超过 6 层" },
      ]);
    } else {
      setMeta({
        title: "Standard Operating Procedure for Door Trim Assembly (SOP-IM-024)",
        purpose: "Ensure zero-defect assembly and standardized clamp/holding pressure parameters.",
        scope: "Applies to Injection Machines #2 and #3, Shift A & B technicians.",
        responsible: "Manufacturing Process Owner",
      });
      setSteps([
        { id: crypto.randomUUID(), step: "Workstation Preparation", detail: "Check chilled water temperature (90±2°C) and resin moisture content", caution: "Wear protective heat-resistant gloves" },
        { id: crypto.randomUUID(), step: "Load Process Recipe", detail: "Load recipe P-204 and freeze parameters; verify 1800 kN clamp force", caution: "No unauthorized holding pressure adjustments" },
        { id: crypto.randomUUID(), step: "First Article Inspection", detail: "Scrap first 3 parts; measure 8 critical datum dimensions on parts 4-6", caution: "Digital caliper must be calibrated" },
        { id: crypto.randomUUID(), step: "Periodic SPC Logging", detail: "Sample 5 parts every 2 hours and plot on I-MR control chart", caution: "Stop production immediately if point exceeds UCL" },
        { id: crypto.randomUUID(), step: "Packaging & Barcode Scan", detail: "Place good parts into blister trays and scan serial barcode", caution: "Do not exceed 6 layers of stacking" },
      ]);
    }
  };

  const hasResult = !!(meta.title.trim() || steps.length > 0);

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "SOP 规程名称/编号" : "SOP Title / Document ID"}</Label>
          <Input value={meta.title} onChange={e => setMeta({ ...meta, title: e.target.value })} placeholder={isZh ? "例如：注塑标准作业指导书" : "e.g. Standard Work Instruction"} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "责任岗位/批准人" : "Responsible Role / Approver"}</Label>
          <Input value={meta.responsible} onChange={e => setMeta({ ...meta, responsible: e.target.value })} className="text-sm" placeholder={isZh ? "工艺工程师 / 车间主管" : "Process Owner"} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "作业目的 (Purpose)" : "Purpose"}</Label>
          <Textarea value={meta.purpose} onChange={e => setMeta({ ...meta, purpose: e.target.value })} className="text-sm h-12 resize-none" placeholder={isZh ? "为何制定此 SOP？解决何种品质风险？" : "Why does this SOP exist?"} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "适用范围 (Scope)" : "Scope & Boundaries"}</Label>
          <Textarea value={meta.scope} onChange={e => setMeta({ ...meta, scope: e.target.value })} className="text-sm h-12 resize-none" placeholder={isZh ? "覆盖哪些机台、班次、产品型号？" : "Which processes, shifts or roles?"} />
        </div>
      </div>
      <div className="border-t pt-2 space-y-2">
        <Label className="text-xs font-semibold text-primary">{isZh ? "添加作业工序手顺" : "Add Process Step"}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input value={form.step} onChange={e => setForm({ ...form, step: e.target.value })} placeholder={isZh ? "工序简述" : "Step Name"} className="text-sm" />
          <Input value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} placeholder={isZh ? "操作动作要领" : "Operational Details"} className="text-sm" />
          <Input value={form.caution} onChange={e => setForm({ ...form, caution: e.target.value })} placeholder={isZh ? "安全与质量防错警告" : "Quality / Safety Warning"} className="text-sm" />
        </div>
        <Button size="sm" onClick={addStep} disabled={!form.step.trim()} className="gap-1">
          <Plus className="h-3 w-3" /> {isZh ? "追加工序步骤" : "Add Step"}
        </Button>
      </div>
      {steps.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-start gap-2 text-xs p-2.5 border rounded-lg bg-background">
              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[10px] font-bold">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{s.step}</div>
                {s.detail && <div className="text-muted-foreground mt-0.5">{s.detail}</div>}
                {s.caution && <div className="text-destructive font-medium mt-0.5">⚠️ {s.caution}</div>}
              </div>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => setSteps(steps.filter(x => x.id !== s.id))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      )}
      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { meta, steps }, results: { totalSteps: steps.length } })} />
    </div>
  );
}

// Training Plan
export function TrainingPlanTool({ toolId = "training-plan", toolName = "Training & Skill Matrix Plan", phase = 5 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<{ id: string; topic: string; audience: string; method: string; date: string; completed: boolean }[]>([]);
  const [form, setForm] = useState({ topic: "", audience: "", method: "", date: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (Array.isArray(inputs.items)) setItems(inputs.items as any[]);
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addItem = () => {
    if (!form.topic.trim()) return;
    setItems([...items, { id: crypto.randomUUID(), ...form, completed: false }]);
    setForm({ topic: "", audience: "", method: "", date: "" });
  };

  const loadExample = () => {
    const today = new Date();
    const future = (d: number) => new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10);
    if (isZh) {
      setItems([
        { id: crypto.randomUUID(), topic: "注塑2号机新版 SOP-IM-024 实操考核", audience: "早班操作工全员 (8人)", method: "现场实操演练 + 视频考核", date: future(7), completed: true },
        { id: crypto.randomUUID(), topic: "注塑2号机新版 SOP-IM-024 实操考核", audience: "晚班操作工全员 (8人)", method: "现场实操演练 + 视频考核", date: future(8), completed: false },
        { id: crypto.randomUUID(), topic: "休哈特控制图打点与 8 准则异动识别", audience: "班组长与质检员", method: "线上多媒体课件 + 笔试", date: future(14), completed: false },
        { id: crypto.randomUUID(), topic: "失控应急响应升级预案 (OCAP) 演练", audience: "车间全体一线员工", method: "车间现场桌面推演", date: future(21), completed: false },
      ]);
    } else {
      setItems([
        { id: crypto.randomUUID(), topic: "New SOP-IM-024 hands-on qualification", audience: "Shift A operators (8 persons)", method: "Floor workshop + video exam", date: future(7), completed: true },
        { id: crypto.randomUUID(), topic: "New SOP-IM-024 hands-on qualification", audience: "Shift B operators (8 persons)", method: "Floor workshop + video exam", date: future(8), completed: false },
        { id: crypto.randomUUID(), topic: "SPC control chart interpretation & WE rules", audience: "Team leaders & QC inspectors", method: "E-learning course + test", date: future(14), completed: false },
        { id: crypto.randomUUID(), topic: "Out-of-Control Action Plan (OCAP) drill", audience: "All production staff", method: "Shopfloor desktop simulation", date: future(21), completed: false },
      ]);
    }
  };

  const toggleComplete = (id: string) => setItems(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
  const hasResult = items.length > 0;

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "培训课程/技能主题" : "Training Topic / Skill"}</Label>
          <Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder={isZh ? "例如：新版SOP实操培训" : "e.g. New SOP Training"} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "目标培训受众群体" : "Target Audience"}</Label>
          <Input value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} placeholder={isZh ? "例如：A班操作工全员" : "e.g. Shift A Operators"} className="text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "培训与考核方式" : "Delivery Method"}</Label>
          <Input value={form.method} onChange={e => setForm({ ...form, method: e.target.value })} placeholder={isZh ? "例如：车间带教、E-learning..." : "Workshop, e-learning..."} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "计划完成日期" : "Target Date"}</Label>
          <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="text-sm" />
        </div>
      </div>
      <Button size="sm" onClick={addItem} disabled={!form.topic.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "添加培训计划" : "Add Training Item"}
      </Button>

      {hasResult && (
        <>
          <div className="space-y-1.5 pt-1">
            {items.map(i => (
              <div key={i.id} className="flex flex-wrap items-center gap-1.5 text-xs p-2.5 border rounded-lg bg-background">
                <button onClick={() => toggleComplete(i.id)} className="shrink-0">
                  {i.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                </button>
                <span className={`flex-1 min-w-0 font-medium ${i.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{i.topic}</span>
                <div className="flex items-center gap-2 w-full sm:w-auto pl-6 sm:pl-0 font-mono text-muted-foreground">
                  {i.audience && <span className="truncate">{i.audience}</span>}
                  {i.date && <span className="shrink-0">{i.date}</span>}
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 ml-auto" onClick={() => setItems(items.filter(x => x.id !== i.id))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-center text-muted-foreground p-2 rounded bg-muted/30 border font-medium">
            {isZh 
              ? `培训完成度：${items.filter(i => i.completed).length} / ${items.length} 项已考核达标` 
              : `Training Progress: ${items.filter(i => i.completed).length} of ${items.length} sessions completed`}
          </div>
        </>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { items }, results: { total: items.length, completed: items.filter(i => i.completed).length } })} />
    </div>
  );
}

// Response Plan (OCAP)
export function ResponsePlanTool({ toolId = "response-plan", toolName = "Out of Control Action Plan (OCAP)", phase = 5 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<{ id: string; trigger: string; action: string; responsible: string; escalation: string }[]>([]);
  const [form, setForm] = useState({ trigger: "", action: "", responsible: "", escalation: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (Array.isArray(inputs.items)) setItems(inputs.items as any[]);
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addItem = () => {
    if (!form.trigger.trim()) return;
    setItems([...items, { id: crypto.randomUUID(), ...form }]);
    setForm({ trigger: "", action: "", responsible: "", escalation: "" });
  };

  const loadExample = () => {
    if (isZh) {
      setItems([
        { id: crypto.randomUUID(), trigger: "连续出现单点超出 SPC 上下控制界限 (±3σ UCL/LCL)", action: "立即暂停机台注射，锁定隔离该批次在制品，校验压力传感器零点", responsible: "当班操作工 + 班组长", escalation: "停机超过 15 分钟上报生产车间主任与质量黑带" },
        { id: crypto.randomUUID(), trigger: "连续 9 点落在中心线 (CL) 同一侧 (过程均值漂移)", action: "排查当前批次改性树脂原料批号，测量模温循环水进水实际温度", responsible: "班组技术员", escalation: "若 1 小时内未查明原因升级给工艺工程师处理" },
        { id: crypto.randomUUID(), trigger: "单日抽检综合过程能力指数 Cpk 跌破 1.33 预警线", action: "启动质量专项溯源分析，启动全检模式并召开紧急质量分析会", responsible: "质检工程师", escalation: "2 小时内汇报质量总监并开具 CAPA 纠正预防单" },
        { id: crypto.randomUUID(), trigger: "成品出货终检发现缩水凹陷下沉缺陷", action: "立即启动前向物料批次溯源，冻结成品仓库同批次库存并全检", responsible: "终检主管", escalation: "立即通报制造副总与客户质量工程师 (CQE)" },
      ]);
    } else {
      setItems([
        { id: crypto.randomUUID(), trigger: "Single point falls outside control limits (±3σ UCL/LCL)", action: "Halt line immediately, quarantine current WIP, calibrate pressure sensor", responsible: "Operator & Team Leader", escalation: "Escalate to Production Mgr if line stopped > 15 mins" },
        { id: crypto.randomUUID(), trigger: "9 consecutive points on one side of center line (CL)", action: "Inspect raw resin lot batch variance, verify water chiller temperature", responsible: "Shift Technician", escalation: "Escalate to Process Engineer if unresolved in 1 hour" },
        { id: crypto.randomUUID(), trigger: "Process capability Cpk falls below 1.33 threshold", action: "Trigger root cause investigation, mandate 100% sorting gate", responsible: "Quality Engineer", escalation: "Notify QA Director within 2 hours and open formal CAPA" },
        { id: crypto.randomUUID(), trigger: "Sink mark defect detected in final outgoing audit", action: "Quarantine finished goods lot; initiate trace-back of mold cavity", responsible: "Outgoing QA Lead", escalation: "Notify Operations VP and Customer Quality Engineer (CQE)" },
      ]);
    }
  };

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "触发失控条件 (Trigger / 出现何种异动)" : "Trigger Condition"}</Label>
          <Input value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} placeholder={isZh ? "例如：单点超出控制限..." : "e.g. Point beyond control limits"} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "即时纠正处置措施 (Immediate Action)" : "Immediate Action"}</Label>
          <Input value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} placeholder={isZh ? "例如：停机隔离、校准工装..." : "e.g. Stop line, quarantine WIP"} className="text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "现场责任人 (Responsible)" : "Responsible Owner"}</Label>
          <Input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} placeholder={isZh ? "操作工 / 班组长" : "Operator / Team Lead"} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "超时升级处置路径 (Escalation Path)" : "Escalation Path"}</Label>
          <Input value={form.escalation} onChange={e => setForm({ ...form, escalation: e.target.value })} placeholder={isZh ? "30分钟未解决升级生产总监" : "Contact Production Mgr"} className="text-sm" />
        </div>
      </div>
      <Button size="sm" onClick={addItem} disabled={!form.trigger.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "添加响应升级条款" : "Add OCAP Rule"}
      </Button>

      {items.length > 0 && items.map(i => (
        <div key={i.id} className="p-2.5 border rounded-lg text-xs space-y-1 bg-background">
          <div className="flex justify-between items-start gap-2">
            <span className="font-semibold text-destructive break-words min-w-0">🚨 {i.trigger}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => setItems(items.filter(x => x.id !== i.id))}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <div className="text-foreground font-medium">→ {i.action}</div>
          {i.responsible && <div className="text-muted-foreground">{isZh ? "执行责任人" : "Responsible"}: {i.responsible}</div>}
          {i.escalation && <div className="text-amber-600 dark:text-amber-400 font-medium">{isZh ? "升级机制" : "Escalation"}: {i.escalation}</div>}
        </div>
      ))}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={items.length > 0} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { items }, results: { total: items.length } })} />
    </div>
  );
}

// Handover Checklist
export function HandoverChecklistTool({ toolId = "handover-checklist", toolName = "Project Handover Checklist", phase = 5 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const defaultItems = isZh ? [
    "控制计划 (Control Plan) 已编制并通过工艺与质量部门联合评审",
    "全套作业指导书 (SOP) 与检验规范已归档并下发到工位目视看板",
    "两班操作工与班组长已全员完成实操考核并具备上岗资质",
    "失控应急响应升级预案 (OCAP) 已部署并在看板张贴",
    "关键测量系统分析 (MSA / Gage R&R) 再次验证达标 (贡献率 < 10%)",
    "持续生产长效过程能力指数确认 (Cpk ≥ 1.33, Ppk ≥ 1.33)",
    "车间现场 SPC 控制图看板已建立并由班组按节拍正常打点",
    "量产流程归属业务负责人 (Process Owner) 已正式签字接收",
    "项目全套成果文件、数模与代码已进入企业资产库归档",
    "开展项目复盘总结，提炼 Lessons Learned 经验教训沉淀入知识库",
  ] : [
    "Control plan finalized and approved by engineering and QA",
    "All updated SOPs documented, signed off and displayed on line",
    "Operator training completed with formal competency sign-off",
    "Out-of-Control Action Plan (OCAP) established and visible",
    "Measurement system re-validated via Gage R&R (variance < 10%)",
    "Process capability sustained and verified (Cpk >= 1.33)",
    "SPC control charts active with daily shift logging",
    "Process Owner identified and formal handover sign-off obtained",
    "Project documentation archived in QMS document registry",
    "Lessons learned session held with core project team",
  ];

  const [items, setItems] = useState(defaultItems.map((text, i) => ({ id: String(i), text, checked: false, comment: "" })));

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (Array.isArray(inputs.items)) setItems(inputs.items as any[]);
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const toggle = (id: string) => setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const completed = items.filter(i => i.checked).length;

  const loadExample = () => {
    setItems(items.map((item, i) => ({ ...item, checked: i < 8 })));
  };

  return (
    <div className="space-y-2">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      <div className="space-y-1.5 pt-1">
        {items.map(item => (
          <div key={item.id} className="flex items-start gap-2.5 text-xs p-2.5 border rounded-lg bg-background hover:bg-muted/10 transition-colors">
            <button onClick={() => toggle(item.id)} className="mt-0.5 shrink-0">
              {item.checked ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
            </button>
            <span className={`flex-1 min-w-0 font-medium ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.text}</span>
          </div>
        ))}
      </div>
      <div className="p-2.5 bg-muted/40 rounded-lg text-xs text-center border font-semibold">
        {isZh 
          ? `移交验收通过率：${completed} / ${items.length} 条已核验通过 (${(completed / items.length * 100).toFixed(0)}%)` 
          : `Handover Readiness: ${completed} of ${items.length} items verified (${(completed / items.length * 100).toFixed(0)}%)`}
        {completed === items.length && (isZh ? " ✅ 满足全部条件，准予结项量产移交！" : " ✅ All gates passed, ready for operational handover!")}
      </div>
      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={true} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { items }, results: { completed, total: items.length, readyForHandover: completed === items.length } })} />
    </div>
  );
}

// Lessons Learned
export function LessonsLearnedTool({ toolId = "lessons-learned", toolName = "Lessons Learned Repository", phase = 5 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<{ id: string; category: string; lesson: string; recommendation: string }[]>([]);
  const [form, setForm] = useState({ category: "process", lesson: "", recommendation: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (Array.isArray(inputs.items)) setItems(inputs.items as any[]);
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const categories: Record<string, string> = isZh ? {
    process: "工艺流程与技术规范",
    team: "团队协作与跨职能沟通",
    data: "数据质量与统计分析",
    tools: "六西格玛工具选型",
    management: "项目领导力与资源保障"
  } : { 
    process: "Process & Tech", 
    team: "Team Collaboration", 
    data: "Data & Analytics", 
    tools: "Tool Selection", 
    management: "Leadership & Sponsor" 
  };

  const addItem = () => {
    if (!form.lesson.trim()) return;
    setItems([...items, { id: crypto.randomUUID(), ...form }]);
    setForm({ ...form, lesson: "", recommendation: "" });
  };

  const loadExample = () => {
    if (isZh) {
      setItems([
        { id: crypto.randomUUID(), category: "data", lesson: "项目初期过度信任 ERP 导出的报表数字，未在现场实测，后来发现有约 15% 人工补录偏差", recommendation: "在 Measure 阶段必须严格执行 Gage R&R 与现场写实核验，确保数据源真实可靠" },
        { id: crypto.randomUUID(), category: "team", lesson: "方案设计阶段未让调机老师傅深度参与，导致首版 SOP 落地时遭遇一线抵触", recommendation: "在 Define/Improve 阶段就需吸纳一线骨干操作工参与 Kaizen 工作坊共同制定标准" },
        { id: crypto.randomUUID(), category: "tools", lesson: "DOE 试验方案初期设计因子过多且忽略了中心点，导致二次返工补做曲率验证", recommendation: "复杂非线性过程建议先做 2 水平部分析因筛选，再用响应曲面 (RSM) 进行精细寻优" },
        { id: crypto.randomUUID(), category: "management", lesson: "两场关键阶段评审会由于发起人出差临时取消，导致试点工装采购延误两周", recommendation: "在项目启动会 (Kickoff) 即提前在 Champion 日历中锁定全部阶段 Tollgate 评审时间" },
      ]);
    } else {
      setItems([
        { id: crypto.randomUUID(), category: "data", lesson: "Initial data tracking from ERP was incomplete, requiring weeks of manual cleaning", recommendation: "Mandate data quality verification during Measure before entering Analyze" },
        { id: crypto.randomUUID(), category: "team", lesson: "Operators were engaged too late in solution design causing adoption friction", recommendation: "Involve shift technicians in Define and Kaizen workshops early on" },
        { id: crypto.randomUUID(), category: "tools", lesson: "Initial screening skipped center points, missing non-linear curvature", recommendation: "Use 2-level screening followed by RSM for optimal non-linear parameter tuning" },
        { id: crypto.randomUUID(), category: "management", lesson: "Sponsor absence at tollgate reviews caused pilot tooling purchase delays", recommendation: "Lock milestone review dates in Champion calendar during project kickoff" },
      ]);
    }
  };

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      <div className="space-y-1">
        <Label className="text-xs">{isZh ? "经验维度分类 (Category)" : "Category"}</Label>
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
          {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{isZh ? "经验教训复盘 (Lesson Learned / 遇到什么教训)" : "Lesson Learned"}</Label>
        <Textarea value={form.lesson} onChange={e => setForm({ ...form, lesson: e.target.value })} placeholder={isZh ? "客观总结在此次项目中踩过的坑或成功经验..." : "What went well or caused issues?"} className="text-sm h-14 resize-none" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{isZh ? "后续改善建议 (Recommendation / 后续项目应如何做)" : "Recommendation"}</Label>
        <Textarea value={form.recommendation} onChange={e => setForm({ ...form, recommendation: e.target.value })} placeholder={isZh ? "对未来黑带项目及组织资产的改进建议..." : "What should be done differently next time?"} className="text-sm h-14 resize-none" />
      </div>
      <Button size="sm" onClick={addItem} disabled={!form.lesson.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "沉淀入复盘库" : "Add Lesson"}
      </Button>

      {items.length > 0 && items.map(i => (
        <div key={i.id} className="p-2.5 border rounded-lg text-xs space-y-1 bg-background">
          <div className="flex justify-between items-start gap-2">
            <Badge variant="secondary" className="text-[10px] shrink-0 font-normal">{categories[i.category] || i.category}</Badge>
            <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => setItems(items.filter(x => x.id !== i.id))}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <div className="font-semibold text-foreground break-words">{i.lesson}</div>
          {i.recommendation && <div className="text-primary font-medium break-words">💡 {i.recommendation}</div>}
        </div>
      ))}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={items.length > 0} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { items }, results: { total: items.length } })} />
    </div>
  );
}

// Benefit Validation
export function BenefitValidationTool({ toolId = "benefit-validation", toolName = "Project Benefit Validation", phase = 5 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<{ id: string; metric: string; baseline: string; target: string; actual: string; unit: string }[]>([]);
  const [form, setForm] = useState({ metric: "", baseline: "", target: "", actual: "", unit: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (Array.isArray(inputs.items)) setItems(inputs.items as any[]);
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addItem = () => {
    if (!form.metric.trim()) return;
    setItems([...items, { id: crypto.randomUUID(), ...form }]);
    setForm({ metric: "", baseline: "", target: "", actual: "", unit: "" });
  };

  const loadExample = () => {
    if (isZh) {
      setItems([
        { id: crypto.randomUUID(), metric: "汽车门护板注塑缩水不良率", baseline: "3.5", target: "1.0", actual: "0.62", unit: "%" },
        { id: crypto.randomUUID(), metric: "注塑成型单件周转节拍时间", baseline: "6.2", target: "5.0", actual: "4.65", unit: "分钟/件" },
        { id: crypto.randomUUID(), metric: "过程能力指数 (Cpk)", baseline: "0.92", target: "1.33", actual: "1.48", unit: "" },
        { id: crypto.randomUUID(), metric: "返修与报废质量不良成本 (COPQ)", baseline: "180000", target: "50000", actual: "38500", unit: "元/季度" },
        { id: crypto.randomUUID(), metric: "车间客户抱怨与索赔次数", baseline: "4", target: "0", actual: "0", unit: "次/月" },
      ]);
    } else {
      setItems([
        { id: crypto.randomUUID(), metric: "Door trim panel sink defect rate", baseline: "3.5", target: "1.0", actual: "0.62", unit: "%" },
        { id: crypto.randomUUID(), metric: "Injection moulding cycle time", baseline: "6.2", target: "5.0", actual: "4.65", unit: "min/pc" },
        { id: crypto.randomUUID(), metric: "Process Capability Index (Cpk)", baseline: "0.92", target: "1.33", actual: "1.48", unit: "" },
        { id: crypto.randomUUID(), metric: "Cost of Poor Quality (COPQ)", baseline: "180000", target: "50000", actual: "38500", unit: "SEK/Qtr" },
        { id: crypto.randomUUID(), metric: "Customer warranty claims", baseline: "4", target: "0", actual: "0", unit: "claims/mo" },
      ]);
    }
  };

  const hasResult = items.length > 0;

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "收益评估指标项 (KPI)" : "KPI / Metric"}</Label>
          <Input value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })} placeholder={isZh ? "例如：次品率、节拍、财务收益..." : "e.g. Defect rate, COPQ"} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "计量单位 (Unit)" : "Measurement Unit"}</Label>
          <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder={isZh ? "例如：%、件/分、元/年" : "e.g. %, hours, USD"} className="text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "改善前基线 (Baseline)" : "Baseline"}</Label>
          <Input value={form.baseline} onChange={e => setForm({ ...form, baseline: e.target.value })} placeholder="3.5" className="text-sm" type="number" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "立项考核目标 (Target)" : "Target"}</Label>
          <Input value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder="1.0" className="text-sm" type="number" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "实测达标值 (Actual)" : "Actual"}</Label>
          <Input value={form.actual} onChange={e => setForm({ ...form, actual: e.target.value })} placeholder="0.65" className="text-sm" type="number" />
        </div>
      </div>
      <Button size="sm" onClick={addItem} disabled={!form.metric.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "追加指标验证行" : "Add KPI Row"}
      </Button>

      {hasResult && (
        <div className="border rounded-lg overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs min-w-[420px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">{isZh ? "关键指标 (KPI)" : "KPI Metric"}</th>
                <th className="p-2 text-right">{isZh ? "基线水平" : "Baseline"}</th>
                <th className="p-2 text-right">{isZh ? "目标要求" : "Target"}</th>
                <th className="p-2 text-right">{isZh ? "实测达成" : "Actual"}</th>
                <th className="p-2 text-center">{isZh ? "达标判定" : "Status"}</th>
                <th className="p-2 w-6"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => {
                const b = parseFloat(i.baseline); const t = parseFloat(i.target); const a = parseFloat(i.actual);
                const achieved = !isNaN(a) && !isNaN(t) && !isNaN(b) && ((t < b && a <= t) || (t > b && a >= t));
                return (
                  <tr key={i.id} className="border-t">
                    <td className="p-2 font-medium">{i.metric} {i.unit && `(${i.unit})`}</td>
                    <td className="p-2 text-right font-mono text-muted-foreground">{i.baseline || "–"}</td>
                    <td className="p-2 text-right font-mono">{i.target || "–"}</td>
                    <td className="p-2 text-right font-mono font-bold text-foreground">{i.actual || "–"}</td>
                    <td className="p-2 text-center">
                      {!isNaN(a) ? (
                        achieved ? (
                          <Badge variant="default" className="text-[10px] bg-emerald-600 dark:bg-emerald-700">✓ {isZh ? "达标" : "Achieved"}</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">✗ {isZh ? "未达标" : "Missed"}</Badge>
                        )
                      ) : "–"}
                    </td>
                    <td className="p-2">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setItems(items.filter(x => x.id !== i.id))}><Trash2 className="h-3 w-3" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { items }, results: { total: items.length, achieved: items.filter(i => { const b = parseFloat(i.baseline); const t = parseFloat(i.target); const a = parseFloat(i.actual); return !isNaN(a) && !isNaN(t) && !isNaN(b) && ((t < b && a <= t) || (t > b && a >= t)); }).length } })} />
    </div>
  );
}
