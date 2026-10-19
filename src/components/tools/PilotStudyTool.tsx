import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function PilotStudyTool({ toolId = "pilot-study", toolName = "Pilot Study Plan", phase = 4 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [data, setData] = useState({ objective: "", scope: "", duration: "", sampleSize: "", successCriteria: "", baseline: "", pilotResults: "", risks: "", decision: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    setData({
      objective: String(inputs.objective || ""),
      scope: String(inputs.scope || ""),
      duration: String(inputs.duration || ""),
      sampleSize: String(inputs.sampleSize || ""),
      successCriteria: String(inputs.successCriteria || ""),
      baseline: String(inputs.baseline || ""),
      pilotResults: String(inputs.pilotResults || ""),
      risks: String(inputs.risks || ""),
      decision: String(inputs.decision || ""),
    });
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);
  const update = (f: string, v: string) => setData(prev => ({ ...prev, [f]: v }));
  const hasResult = Object.values(data).some(v => v.trim());

  const loadExample = () => {
    if (isZh) {
      setData({
        objective: "在全产线推广前，验证新型注塑保压工装及冷却回路参数方案的稳定性",
        scope: "A班次、2号注塑机产线、汽车门护板总成",
        duration: "连续试跑 2 周 (10个生产工作日)",
        sampleSize: "累计抽检 200 件关键装配成品",
        successCriteria: "注塑节拍 ≤ 4.8 分钟，次品率 ≤ 0.8%，过程能力指数 Cpk > 1.33",
        baseline: "当前基线水平：节拍 6.2 分钟，缺陷率 3.5%，Cpk 仅为 0.92",
        pilotResults: "实测表现：平均节拍 4.65 分钟，缺陷率降低至 0.65%，Cpk 达到 1.48",
        risks: "风险 1: 夜班新工装操作生疏 → 提前 3 天实施全员 SOP 强化培训；风险 2: 模具早期磨损 → 每日开班测量关键间隙尺寸",
        decision: "Go – 判定验证达标，准予向全车间同型号产线全面量产推广",
      });
    } else {
      setData({
        objective: "Validate optimized injection parameters and cooling cycle before full scale rollout",
        scope: "Shift A, Injection Line #2, Door Trim Product Variant X",
        duration: "2 weeks continuous pilot run",
        sampleSize: "200 audited sample units",
        successCriteria: "Cycle time <= 4.8 min, defect rate <= 0.8%, Cpk > 1.33",
        baseline: "Baseline: Cycle time 6.2 min, defect rate 3.5%, Cpk 0.92",
        pilotResults: "Pilot results: Cycle time 4.65 min, defect rate 0.65%, Cpk 1.48",
        risks: "Operator learning curve -> pre-shift training; Tool wear -> daily dimensional verification.",
        decision: "Go - Pilot criteria met, approve full line deployment",
      });
    }
  };

  const fields = isZh ? [
    { key: "objective", label: "试点验证目标 (Objective)", placeholder: "本次试点具体需要验证什么假设或工艺方案？" },
    { key: "scope", label: "试验范围边界 (Scope)", placeholder: "限定在哪个班次、产线机台、产品型号？" },
    { key: "duration", label: "试点持续周期 (Duration)", placeholder: "例如：试跑 2 周 / 连续 5 个生产批次" },
    { key: "sampleSize", label: "抽检样本量 (Sample Size)", placeholder: "例如：累计检验 200 件测试样本" },
    { key: "successCriteria", label: "达标成功准则 (Success Criteria)", placeholder: "例如：Cpk > 1.33, 节拍耗时 < 5分钟, 废品率 < 1%" },
    { key: "baseline", label: "改善前基线数据 (Baseline Before)", placeholder: "改善前的现状指标水平" },
    { key: "pilotResults", label: "试点实测数据 (Pilot Results After)", placeholder: "试点阶段实际采集的统计与指标数据" },
    { key: "risks", label: "潜在风险与应急预案 (Risks & Mitigation)", placeholder: "试点期间可能突发的质量或交付风险及对策" },
    { key: "decision", label: "评审决策结论 (Decision)", placeholder: "Go (全面量产推广) / No-Go (终止放弃) / Modify (调优重试)" },
  ] : [
    { key: "objective", label: "Pilot Objective", placeholder: "What hypothesis or parameters are to be validated?" },
    { key: "scope", label: "Pilot Scope", placeholder: "Which line, shift, machine, or part variant?" },
    { key: "duration", label: "Pilot Duration", placeholder: "e.g. 2 weeks / 10 production shifts" },
    { key: "sampleSize", label: "Sample Size", placeholder: "Number of audited units/trials" },
    { key: "successCriteria", label: "Success Criteria", placeholder: "e.g. Cpk > 1.33, cycle time < 5 min" },
    { key: "baseline", label: "Baseline (Before)", placeholder: "Historical performance before changes" },
    { key: "pilotResults", label: "Pilot Results (After)", placeholder: "Measured outcome during pilot run" },
    { key: "risks", label: "Risks & Mitigation", placeholder: "Identified operational risks and counteractions" },
    { key: "decision", label: "Pilot Decision", placeholder: "Go / No-Go / Modify & Retest" },
  ];

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      {fields.map(f => (
        <div key={f.key} className="space-y-1">
          <Label className="text-xs font-medium">{f.label}</Label>
          {f.key === "duration" || f.key === "sampleSize" || f.key === "decision" ? (
            <Input value={(data as any)[f.key]} onChange={e => update(f.key, e.target.value)} placeholder={f.placeholder} className="text-sm" />
          ) : (
            <Textarea value={(data as any)[f.key]} onChange={e => update(f.key, e.target.value)} placeholder={f.placeholder} className="text-sm h-14 resize-none" />
          )}
        </div>
      ))}
      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: data, results: { completedSections: Object.values(data).filter(v => v.trim()).length, decision: data.decision } })} />
    </div>
  );
}
