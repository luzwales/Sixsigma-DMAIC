import { Tool } from "@/data/dmaic-tools";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Maximize2, Sparkles, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { getLocalizedTool } from "@/i18n/toolTranslations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CpCpkCalculator,
  DPMOCalculator,
  FMEACalculator,
  TTestCalculator,
  CorrelationCalculator,
  DOECalculator,
  ControlLimitsCalculator,
  GageRRCalculator,
  TwoSampleTTestCalculator,
  ANOVACalculator,
  ChiSquareCalculator,
  NormalityTestCalculator,
  CapabilitySixpack,
} from "@/components/calculators";
import {
  FiveWhysAnalysis,
  SIPOCDiagram,
  DefineRiskAssessmentTool,
  ImproveRiskVerificationTool,
  ParetoAnalysis,
  FishboneDiagram,
  ProjectCharterTool,
  VOCTool,
  CTQTreeTool,
  StakeholderAnalysisTool,
  KanoModelTool,
  ProblemStatementTool,
  ProcessMappingTool,
  DataCollectionPlanTool,
  MultiVariAnalysis,
  PughMatrixTool,
  PilotStudyTool,
  ImplementationPlanTool,
  FiveSAuditTool,
  KaizenEventTool,
  PokaYokeTool,
  ResponseSurfaceTool,
  CUSUMChart,
  EWMAChart,
  SOPTool,
  TrainingPlanTool,
  ResponsePlanTool,
  HandoverChecklistTool,
  LessonsLearnedTool,
  BenefitValidationTool,
  FiveW2HTool,
} from "@/components/tools";

interface ToolCardProps {
  tool: Tool;
  phaseColor: string;
  phaseId?: number;
  initiallyExpanded?: boolean;
}

// Map tool IDs to their calculator components
const calculatorMap: Record<string, React.ComponentType<{ toolId?: string; toolName?: string; phase?: number }>> = {
  // Calculators
  "capability-cp": CpCpkCalculator,
  "capability-cpk": CpCpkCalculator,
  "capability-sixpack": CapabilitySixpack,
  "dpmo": DPMOCalculator,
  "sigma-level": DPMOCalculator,
  "fmea": FMEACalculator,
  "t-test-1sample": TTestCalculator,
  "t-test-2sample": TwoSampleTTestCalculator,
  "anova": ANOVACalculator,
  "chi-square": ChiSquareCalculator,
  "normality-test": NormalityTestCalculator,
  "correlation": CorrelationCalculator,
  "regression": CorrelationCalculator,
  "doe-basics": DOECalculator,
  "full-factorial": DOECalculator,
  "fractional-factorial": DOECalculator,
  "control-chart-basics": ControlLimitsCalculator,
  "spc-imr": ControlLimitsCalculator,
  "spc-xbar-r": ControlLimitsCalculator,
  "spc-xbar-s": ControlLimitsCalculator,
  "spc-p-chart": ControlLimitsCalculator,
  "spc-np-chart": ControlLimitsCalculator,
  "spc-c-chart": ControlLimitsCalculator,
  "spc-u-chart": ControlLimitsCalculator,
  "gage-rr": GageRRCalculator,
  "msa": GageRRCalculator,
  // Process tools
  "5-whys": FiveWhysAnalysis,
  "sipoc": SIPOCDiagram,
  "pareto": ParetoAnalysis,
  "fishbone": FishboneDiagram,
  // Define phase
  "project-charter": ProjectCharterTool,
  "define-risk-assessment": DefineRiskAssessmentTool,
  "voc": VOCTool,
  "ctq": CTQTreeTool,
  "stakeholder-analysis": StakeholderAnalysisTool,
  "kano-model": KanoModelTool,
  "problem-statement": ProblemStatementTool,
  "5w2h-is-isnot": FiveW2HTool,
  // Measure phase
  "process-mapping": ProcessMappingTool,
  "data-collection-plan": DataCollectionPlanTool,
  // Analyze phase
  "multi-vari": MultiVariAnalysis,
  // Improve phase
  "pugh-matrix": PughMatrixTool,
  "solution-selection": PughMatrixTool,
  "pilot-study": PilotStudyTool,
  "implementation-plan": ImplementationPlanTool,
  "5s": FiveSAuditTool,
  "kaizen": KaizenEventTool,
  "mistake-proofing": PokaYokeTool,
  "improve-risk-verification": ImproveRiskVerificationTool,
  "response-surface": ResponseSurfaceTool,
  // Control phase
  "cusum": CUSUMChart,
  "ewma": EWMAChart,
  "sop": SOPTool,
  "training-plan": TrainingPlanTool,
  "response-plan": ResponsePlanTool,
  "handover-checklist": HandoverChecklistTool,
  "lessons-learned": LessonsLearnedTool,
  "benefit-validation": BenefitValidationTool,
  "control-plan": SOPTool, // Control plan has dedicated editor in project tabs
  "hypothesis-testing": TTestCalculator,
  "audit-plan": HandoverChecklistTool,
};

export function ToolCard({ tool: rawTool, phaseColor, phaseId, initiallyExpanded }: ToolCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t, locale } = useLanguage();
  const isZh = locale === "zh";
  const tool = getLocalizedTool(rawTool, locale);

  useEffect(() => {
    if (initiallyExpanded) {
      setIsOpen(true);
    }
  }, [initiallyExpanded]);
  
  const CalculatorComponent = calculatorMap[tool.id];
  const hasCalculator = !!CalculatorComponent;

  return (
    <>
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/40 border bg-card/60 backdrop-blur-xs relative overflow-hidden flex flex-col justify-between"
        )}
        onClick={() => setIsOpen(true)}
      >
        <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-70 group-hover:opacity-100 transition-opacity", phaseColor)} />
        <CardHeader className="pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold leading-tight group-hover:text-primary transition-colors">
                  {tool.name}
                </CardTitle>
                {hasCalculator && (
                  <Calculator className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
              <CardDescription className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                {tool.description}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge variant="secondary" className="text-[11px] font-normal">
                {tool.category}
              </Badge>
              <span className="text-[11px] text-primary/80 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                <Maximize2 className="h-3 w-3" />
                {isZh ? "打开" : "Open"}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="border-b pb-4 text-left">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {tool.category}
              </Badge>
              {hasCalculator && (
                <Badge variant="default" className="text-xs gap-1">
                  <Calculator className="h-3 w-3" />
                  {isZh ? "交互式统计工具" : "Interactive Tool"}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
              {tool.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {tool.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Interactive Calculator / Tool */}
            {CalculatorComponent && (
              <div className="border border-primary/20 rounded-xl p-5 bg-primary/5">
                <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  {t("phases.interactiveTool", "交互式分析工具")}
                </h4>
                <CalculatorComponent toolId={tool.id} toolName={tool.name} phase={phaseId} />
              </div>
            )}

            {/* Usage */}
            {tool.usage && (
              <div className="p-4 rounded-xl border bg-muted/20">
                <h4 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {t("phases.usage", "应用场景与方法")}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {tool.usage}
                </p>
              </div>
            )}

            {/* Formula */}
            {tool.formula && (
              <div className="p-4 rounded-xl border bg-muted/20">
                <h4 className="text-sm font-semibold text-foreground mb-1.5">
                  {t("phases.formula", "核心计算公式")}
                </h4>
                <div className="formula font-mono text-xs sm:text-sm p-3 rounded-lg bg-background border">
                  {tool.formula}
                </div>
              </div>
            )}

            {/* Example */}
            {tool.example && (
              <div className="p-4 rounded-xl border bg-muted/20">
                <h4 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  {t("phases.example", "工业实战案例")}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground bg-background p-3.5 rounded-lg border leading-relaxed">
                  {tool.example}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
