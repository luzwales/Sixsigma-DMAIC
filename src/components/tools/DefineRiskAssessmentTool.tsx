import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { ShieldAlert, Plus, Trash2, HelpCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface RiskItem {
  id: string;
  description: string;
  category: string;
  severity: number;
  probability: number;
  mitigation: string;
  responsible: string;
}

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function DefineRiskAssessmentTool({ toolId = "define-risk-assessment", toolName = "Initial Riskbedömning", phase = 1 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [risks, setRisks] = useState<RiskItem[]>([
    {
      id: "1",
      description: isZh ? "关键工艺工程师与模具专家因产线日常救火，难以全勤投入 DMAIC 项目" : "Nyckelresurser har begränsad tid pga andra samtidiga linjeaktiviteter.",
      category: isZh ? "资源与团队" : "Resurser",
      severity: 4,
      probability: 3,
      mitigation: isZh ? "由厂长与倡导者 (Champion) 签署书面工时释放授权书，每周固定锁定 2 个半天专项攻坚" : "Säkra skriftligt godkännande och resursallokering från linjechefer; regelbundna avstämningar i styrgruppen.",
      responsible: isZh ? "黑带组长 / 生产总监" : "Projektledare"
    },
    {
      id: "2",
      description: isZh ? "车间现有 MES/SCADA 采集的注塑压力与模温数据存在断点与视差" : "Bristfällig datakvalitet i nuvarande ERP-system försvårar mätskede.",
      category: isZh ? "技术与数据" : "Teknik/Data",
      severity: 3,
      probability: 4,
      mitigation: isZh ? "在 Measure 阶段前先执行 MSA 检验，并在试点机台加装高精度外挂温度记录仪" : "Sätt upp manuella loggningsrutiner som komplement under pilotmätning.",
      responsible: isZh ? "质量工程师 / 数据分析员" : "Black Belt / Dataanalytiker"
    }
  ]);

  const [overarchingSummary, setOverarchingSummary] = useState("");

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (inputs.risks && Array.isArray(inputs.risks)) {
      setRisks(inputs.risks.map((r: any, idx: number) => ({
        id: r.id || String(idx),
        description: r.description || "",
        category: r.category || "Allmänt",
        severity: Number(r.severity) || 1,
        probability: Number(r.probability) || 1,
        mitigation: r.mitigation || "",
        responsible: r.responsible || ""
      })));
    }
    setOverarchingSummary(String(inputs.overarchingSummary || ""));
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addRisk = () => {
    const newItem: RiskItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      description: "",
      category: "Process",
      severity: 3,
      probability: 3,
      mitigation: "",
      responsible: ""
    };
    setRisks(prev => [...prev, newItem]);
  };

  const removeRisk = (id: string) => {
    setRisks(prev => prev.filter(r => r.id !== id));
  };

  const updateRisk = (id: string, field: keyof RiskItem, value: any) => {
    setRisks(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const getRiskColor = (score: number) => {
    if (score >= 15) return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/50";
    if (score >= 8) return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/50";
    return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/50";
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 15) return "bg-red-500 text-white dark:bg-red-600";
    if (score >= 8) return "bg-amber-500 text-white dark:bg-amber-600";
    return "bg-green-500 text-white dark:bg-green-600";
  };

  const loadExample = () => {
    setRisks([
      {
        id: "ex-1",
        description: "Motstånd mot förändring hos operatörer på linje 2 vid införandet av nya standarder.",
        category: "Organisation",
        severity: 4,
        probability: 4,
        mitigation: "Involvera linjeledare och nyckeloperatörer tidigt i analys- och designmötet (Kaizen). Skapa tydliga visualiseringar.",
        responsible: "Sponsor / Projektledare"
      },
      {
        id: "ex-2",
        description: "Långa ledtider för att få IT-behörigheter till mätverktygen fördröjer mätfasen.",
        category: "Teknik/Process",
        severity: 3,
        probability: 3,
        mitigation: "Skicka in kontobeställningar samtliga behörigheter redan under vecka 1 i Define.",
        responsible: "Projektledare"
      },
      {
        id: "ex-3",
        description: "Säsongsrelaterad variation maskerar den faktiska rot-effekten i maskinhastighet.",
        category: "Analys",
        severity: 4,
        probability: 2,
        mitigation: "Använd multivariabel analys och ANOVA för att filtrera bort säsongsfaktorn i historiska data.",
        responsible: "Black Belt"
      }
    ]);
    setOverarchingSummary("Projektet har identifierat tre signifikanta risker relaterade till organisation och ledtidsfördröjningar. Motåtgärder har planerats och integrerats i tidsramen.");
  };

  const hasResult = risks.length > 0 || overarchingSummary.trim().length > 0;

  return (
    <div className="space-y-4">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-primary" />
            {isZh ? "已识别的项目与工序潜在风险清单" : "Identifierade Projekt- och Processrisker"}
          </Label>
          <Button type="button" variant="outline" size="xs" onClick={addRisk} className="h-7 text-xs flex items-center gap-1">
            <Plus className="h-3 w-3" />
            {isZh ? "新增风险项" : "Lägg till risk"}
          </Button>
        </div>

        {risks.length === 0 ? (
          <div className="border border-dashed border-muted rounded-lg p-6 text-center text-muted-foreground text-sm">
            {isZh 
              ? "暂未登记立项风险。点击“新增风险项”或加载示例数据开始评估。" 
              : "Inga risker registrerade ännu. Klicka på 'Lägg till risk' eller ladda exempeldata för att starta."}
          </div>
        ) : (
          <div className="space-y-3">
            {risks.map((risk, index) => {
              const rpn = risk.severity * risk.probability;
              return (
                <div key={risk.id} className={`border rounded-lg p-3 space-y-2 transition-colors ${getRiskColor(rpn)}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-medium text-slate-500">
                      {isZh ? `风险项 #${index + 1}` : `Risk #${index + 1}`}
                    </span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeRisk(risk.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4 space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-500">
                        {isZh ? "风险描述 (潜在失效与阻碍)" : "Beskrivning"}
                      </Label>
                      <Input
                        value={risk.description}
                        onChange={e => updateRisk(risk.id, "description", e.target.value)}
                        placeholder={isZh ? "可能发生什么异常或阻碍？" : "Vad kan gå fel?"}
                        className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-500">
                        {isZh ? "风险类别" : "Kategori"}
                      </Label>
                      <Input
                        value={risk.category}
                        onChange={e => updateRisk(risk.id, "category", e.target.value)}
                        placeholder={isZh ? "如：工艺、资源、技术..." : "t.ex. Resurser"}
                        className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div className="md:col-span-1.5 space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-0.5" title="严重度 (1-5)">
                        {isZh ? "严重度 (1-5)" : "Allv. (1-5)"}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={risk.severity}
                        onChange={e => updateRisk(risk.id, "severity", Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                        className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div className="md:col-span-1.5 space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-0.5" title="发生概率 (1-5)">
                        {isZh ? "概率 (1-5)" : "Sann. (1-5)"}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={risk.probability}
                        onChange={e => updateRisk(risk.id, "probability", Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                        className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div className="md:col-span-1 flex flex-col justify-end items-center pb-2">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">
                        {isZh ? "风险指数" : "Index"}
                      </span>
                      <div className={`px-2 py-0.5 rounded text-xs font-bold leading-none ${getRiskBadgeColor(rpn)}`}>
                        {rpn}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                    <div className="md:col-span-8 space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-500">
                        {isZh ? "前置预防消减对策与应急预案" : "Planerad Motåtgärd / Mitigerande insats"}
                      </Label>
                      <Input
                        value={risk.mitigation}
                        onChange={e => updateRisk(risk.id, "mitigation", e.target.value)}
                        placeholder={isZh ? "如何提前消除或降低该风险？" : "Hur reducerar vi den här risken?"}
                        className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-500">
                        {isZh ? "责任人" : "Ansvarig"}
                      </Label>
                      <Input
                        value={risk.responsible}
                        onChange={e => updateRisk(risk.id, "responsible", e.target.value)}
                        placeholder={isZh ? "谁负责跟踪落实？" : "Vem bär ansvaret?"}
                        className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          {isZh ? "综合风险画像与管理层支持诉求" : "Övergripande Riskprofil & Sammanfattning"}
        </Label>
        <Textarea
          value={overarchingSummary}
          onChange={e => setOverarchingSummary(e.target.value)}
          placeholder={isZh ? "归纳项目整体风险水平，以及需要倡导者 (Champion) 和管理层前置协调的关键资源支持..." : "Sammanfatta projektets riskprofil och eventuella kritiska åtgärder som kräver ledningsstöd..."}
          className="text-xs h-16 resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
        />
      </div>

      <CalculatorSaveButton
        canSave={canSave}
        isSaving={isSaving}
        hasResult={hasResult}
        notes={notes}
        onNotesChange={setNotes}
        onSave={() => saveCalculation({
          toolId,
          toolName,
          phase,
          inputs: {
            risks,
            overarchingSummary
          },
          results: {
            totalRisksCount: risks.length,
            highRisksCount: risks.filter(r => (r.severity * r.probability) >= 15).length,
            mediumRisksCount: risks.filter(r => {
              const rpn = r.severity * r.probability;
              return rpn >= 8 && rpn < 15;
            }).length,
            averageRiskScore: risks.length > 0
              ? parseFloat((risks.reduce((acc, r) => acc + (r.severity * r.probability), 0) / risks.length).toFixed(1))
              : 0
          }
        })}
      />
    </div>
  );
}
