import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function ProjectCharterTool({ toolId = "project-charter", toolName = "Project Charter", phase = 1 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [data, setData] = useState({
    problemStatement: "",
    businessCase: "",
    goal: "",
    scope: "",
    team: "",
    timeline: "",
    metrics: "",
  });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    setData({
      problemStatement: String(inputs.problemStatement || ""),
      businessCase: String(inputs.businessCase || ""),
      goal: String(inputs.goal || ""),
      scope: String(inputs.scope || ""),
      team: String(inputs.team || ""),
      timeline: String(inputs.timeline || ""),
      metrics: String(inputs.metrics || ""),
    });
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const update = (field: string, value: string) => setData(prev => ({ ...prev, [field]: value }));
  const hasResult = Object.values(data).some(v => v.trim());

  const loadExample = () => {
    if (isZh) {
      setData({
        problemStatement: "2026年Q1注塑车间门护板缩水缺陷率由基准 3.2% 攀升至 8.7%，导致月均返工成本增加 15.6 万元，并引发主机厂 4 起 0km 质量投诉。",
        businessCase: "直接材料报废与人工返修年化损失预计 180 万元；影响主机厂月度供应商质量绩效评级。预期项目收益为降损 120 万元/年。",
        goal: "在 4 个月内将门护板注塑缩水不良率从 8.7% 压降至 ≤ 2.0%，制程能力指数 Cpk 提升至 ≥ 1.33。",
        scope: "包含：2号注塑机、模具#M04、ABS+PC改性粒子烘干及注塑成型工序。\n不包含：后道超声波焊接与总装卡扣装配线。",
        team: "项目倡导者 (Champion): 生产总监 王建\n黑带组长 (Black Belt): 李敏\n核心绿带/工程师: 张工(注塑工艺), 刘工(模具维修), 陈主管(质量控制)",
        timeline: "Define(第2周) • Measure(第5周) • Analyze(第8周) • Improve(第12周) • Control(第16周)",
        metrics: "主指标: 门护板缩水缺陷率 (%)；过程指标: 保压压力(bar)、熔胶温度(℃)、模温极差",
      });
    } else {
      setData({
        problemStatement: "Late delivery rate increased from 5% to 14% during Q1, leading to 32 customer escalations and $18,000 in credit adjustments.",
        businessCase: "Risk of churn with 12-point NPS drop. Estimated annual savings of $60,000 upon restoring delivery punctuality to <5%.",
        goal: "Reduce late delivery rate from 14% to <5% within 6 months, measured as % orders delivered post promised dock date.",
        scope: "In-Scope: Order processing, picking, packing, transport for B2B accounts.\nOut-of-Scope: RMA returns, internal transfers.",
        team: "Champion: VP Supply Chain\nBlack Belt: David Miller\nGreen Belts: Warehouse Lead, Logistics Mgr",
        timeline: "Define W10 • Measure W13 • Analyze W17 • Improve W22 • Control W28",
        metrics: "% Late deliveries (Primary KPI), Order lead time, Picking DPMO",
      });
    }
  };

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="space-y-2">
        <Label className="text-xs font-medium">
          {isZh ? "问题陈述 (Problem Statement)" : "Problem Statement"}
        </Label>
        <Textarea 
          value={data.problemStatement} 
          onChange={e => update("problemStatement", e.target.value)} 
          placeholder={isZh ? "清晰量化问题：何时、何地、何种程度发生，基准与趋势..." : "Describe the problem clearly: what, where, when, magnitude..."} 
          className="text-sm h-20 resize-none" 
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">
          {isZh ? "商业论证与业务背景 (Business Case)" : "Business Case"}
        </Label>
        <Textarea 
          value={data.businessCase} 
          onChange={e => update("businessCase", e.target.value)} 
          placeholder={isZh ? "为何该项目至关重要？对成本(COPQ)、交期、客户满意度的具体影响..." : "Why is this important? Financial impact, customer risk..."} 
          className="text-sm h-16 resize-none" 
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {isZh ? "项目目标 (SMART Goal)" : "Project Goal (SMART)"}
          </Label>
          <Textarea 
            value={data.goal} 
            onChange={e => update("goal", e.target.value)} 
            placeholder={isZh ? "具体、可量化、可实现的目标与达成截止期限..." : "Specific, measurable improvement target and deadline..."} 
            className="text-sm h-16 resize-none" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {isZh ? "项目范围 (Scope - In / Out)" : "Project Scope"}
          </Label>
          <Textarea 
            value={data.scope} 
            onChange={e => update("scope", e.target.value)} 
            placeholder={isZh ? "范围内工序 vs 明确排除的工序边界..." : "In-scope processes vs out-of-scope boundaries..."} 
            className="text-sm h-16 resize-none" 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {isZh ? "跨职能项目团队 (Team & Roles)" : "Project Team"}
          </Label>
          <Textarea 
            value={data.team} 
            onChange={e => update("team", e.target.value)} 
            placeholder={isZh ? "倡导者 (Champion)、黑带 (BB)、绿带 (GB)、流程责任人..." : "Champion, Black Belt, Green Belts, Process Owner..."} 
            className="text-sm h-16 resize-none" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {isZh ? "推进里程碑与节点 (Timeline)" : "Timeline & Milestones"}
          </Label>
          <Textarea 
            value={data.timeline} 
            onChange={e => update("timeline", e.target.value)} 
            placeholder={isZh ? "DMAIC 各阶段评审时间点..." : "Target dates for D-M-A-I-C tollgates..."} 
            className="text-sm h-16 resize-none" 
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">
          {isZh ? "核心衡量指标 (Primary & Secondary Metrics)" : "Key Performance Indicators (KPIs)"}
        </Label>
        <Input 
          value={data.metrics} 
          onChange={e => update("metrics", e.target.value)} 
          placeholder={isZh ? "例如：缺陷率(%)、Cpk、周期节拍(s)、DPMO..." : "e.g. Defect rate (%), Cpk, Cycle time (s), DPMO..."} 
          className="text-sm" 
        />
      </div>

      {hasResult && (
        <div className="p-3 bg-muted/50 rounded-lg text-sm">
          <p className="font-medium mb-1">
            {isZh ? "📋 章程编制完整度检查" : "📋 Charter Summary"}
          </p>
          <p className="text-muted-foreground text-xs">
            {isZh ? (
              [data.problemStatement && "问题已明确", data.goal && "SMART目标已定", data.scope && "边界范围已锁定", data.team && "团队架构就绪", data.timeline && "里程碑节点已排期", data.metrics && "度量指标已对齐"].filter(Boolean).join(" • ")
            ) : (
              [data.problemStatement && "Problem defined", data.goal && "Goal set", data.scope && "Scope established", data.team && "Team appointed", data.timeline && "Milestones mapped", data.metrics && "KPIs identified"].filter(Boolean).join(" • ")
            )}
          </p>
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: data, results: { completedFields: Object.entries(data).filter(([,v]) => v.trim()).length, totalFields: 7 } })} />
    </div>
  );
}
