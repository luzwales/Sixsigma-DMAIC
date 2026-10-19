import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function ProblemStatementTool({ toolId = "problem-statement", toolName = "Problemformulering", phase = 1 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [data, setData] = useState({ what: "", where: "", when: "", extent: "", impact: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    setData({
      what: String(inputs.what || ""),
      where: String(inputs.where || ""),
      when: String(inputs.when || ""),
      extent: String(inputs.extent || ""),
      impact: String(inputs.impact || ""),
    });
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const update = (field: string, value: string) => setData(prev => ({ ...prev, [field]: value }));
  const hasResult = Object.values(data).some(v => v.trim());

  const loadExample = () => {
    if (isZh) {
      setData({
        what: "汽车门护板局部表面持续出现注塑缩水凹陷下沉缺陷。",
        where: "注塑二车间，2号注塑机及#M04号模具型腔B侧。",
        when: "自2026年Q1批量排产以来，环境温度波动大的夜班更为高发。",
        extent: "抽检不良率高达 8.7% (基线要求 ≤ 2.0%)，产生32批次返工，直接报废损失已达15.6万元。",
        impact: "导致主机厂总装线因外观断差拒收，触发供应商重大质量升级通报并影响季度评级。",
      });
    } else {
      setData({
        what: "Late delivery percentage exceeding acceptable threshold.",
        where: "B2B distribution channel, primarily outbound logistics hub in Gothenburg.",
        when: "Observed since January Q1, worsening trend especially on Friday dispatch shifts.",
        extent: "14% late delivery rate (vs 5% SLA target), 32 customer escalations, $18,000 credit adjustments.",
        impact: "NPS dropped 12 points, putting master supply contracts at risk across 3 tier-1 accounts.",
      });
    }
  };

  const fields = [
    { 
      key: "what", 
      label: isZh ? "【WHAT】发生了什么明确缺陷？" : "WHAT is the problem?", 
      placeholder: isZh ? "客观描述缺陷现象或实测偏差，绝不掺杂主观推测的原因或纠正对策..." : "Describe the defect or deviation objectively without guessing causes..." 
    },
    { 
      key: "where", 
      label: isZh ? "【WHERE】在何处或哪个工序被发现？" : "WHERE does it occur?", 
      placeholder: isZh ? "具体产线、工位机台、模具号、几何物理位置或业务流程环节..." : "Location, machine, mold, department, physical part coordinate..." 
    },
    { 
      key: "when", 
      label: isZh ? "【WHEN】何时发生及时间分布特征？" : "WHEN was it first observed?", 
      placeholder: isZh ? "首次发现时间、周期性（如白班/夜班、换料后、升温后）及历史趋势..." : "Timeline, frequency, shift, seasonality, or since when..." 
    },
    { 
      key: "extent", 
      label: isZh ? "【HOW MUCH】问题的严重程度与频次？" : "HOW BIG is the magnitude?", 
      placeholder: isZh ? "不良率百分比(%)、DPMO数、超差绝对值(mm)、涉及件数或直接返修报废损失..." : "Defect rate %, DPMO, mm deviation, monetary scrap cost..." 
    },
    { 
      key: "impact", 
      label: isZh ? "【IMPACT】对客户或业务产生的实质后果？" : "What is the BUSINESS IMPACT?", 
      placeholder: isZh ? "客户索赔停线、安全隐患、交付违约金、声誉及NPS评分下滑..." : "Customer dissatisfaction, line stoppages, financial losses..." 
    },
  ];

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      {fields.map(f => (
        <div key={f.key} className="space-y-1">
          <Label className="text-xs font-semibold text-foreground">{f.label}</Label>
          <Textarea 
            value={(data as any)[f.key]} 
            onChange={e => update(f.key, e.target.value)} 
            placeholder={f.placeholder} 
            className="text-sm h-14 resize-none" 
          />
        </div>
      ))}

      {hasResult && (
        <div className="p-3.5 bg-muted/50 rounded-lg text-xs space-y-1.5 border border-primary/10">
          <p className="font-bold text-primary flex items-center gap-1.5">
            <span>📝</span> {isZh ? "标准六西格玛问题陈述文案 (自动合成):" : "Problem Statement (Synthesized):"}
          </p>
          <p className="text-foreground leading-relaxed italic bg-background p-2.5 rounded border">
            {isZh ? (
              [
                data.what && `【现象】${data.what}`,
                data.where && `【地点】发生于 ${data.where}。`,
                data.when && `【时序】${data.when}。`,
                data.extent && `【规模】${data.extent}。`,
                data.impact && `【影响】${data.impact}。`
              ].filter(Boolean).join(" ")
            ) : (
              [
                data.what && data.what,
                data.where && `It occurs in ${data.where}.`,
                data.when && `Observed ${data.when}.`,
                data.extent && `Current magnitude is ${data.extent}.`,
                data.impact && `Business impact: ${data.impact}.`
              ].filter(Boolean).join(" ")
            )}
          </p>
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: data, results: { completedSections: Object.values(data).filter(v => v.trim()).length, statement: Object.values(data).filter(v => v.trim()).join(" ") } })} />
    </div>
  );
}
