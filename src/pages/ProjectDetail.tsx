import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Loader2, FileText, Calculator, BarChart3, Save, Download, CheckCircle2, Shield, Users, TrendingUp, Brain, DollarSign, Presentation, Table, Eye, ChevronRight, Pencil } from "lucide-react";
import { exportProjectToPDF, exportA3Report } from "@/lib/pdf-export";
import { exportProjectToPPTX } from "@/lib/pptx-export";
import { exportProjectToXLSX, exportProjectToCSV } from "@/lib/xlsx-export";
import { phases, DEFAULT_CHECKLIST } from "@/data/dmaic-tools";
import { useLanguage } from "@/i18n/LanguageContext";
import { ToolCard } from "@/components/ToolCard";
import { ProjectCollaborators } from "@/components/ProjectCollaborators";
import { TollgateChecklist } from "@/components/project/TollgateChecklist";
import { ControlPlanEditor } from "@/components/project/ControlPlanEditor";
import { RACIMatrix } from "@/components/project/RACIMatrix";
import { SigmaTracker } from "@/components/project/SigmaTracker";
import { AIRootCauseAnalysis } from "@/components/tools/AIRootCauseAnalysis";
import { AIDMAICCoach } from "@/components/AIDMAICCoach";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  current_phase: number;
  status: string;
  user_id: string;
  estimated_savings: number | null;
  actual_savings: number | null;
}

interface ProjectNote {
  id: string;
  phase: number;
  title: string;
  content: string | null;
  created_at: string;
}

interface ProjectCalculation {
  id: string;
  phase: number;
  tool_id: string;
  tool_name: string;
  inputs: unknown;
  results: unknown;
  notes: string | null;
  created_at: string;
}

const KEY_LABELS_ZH: Record<string, string> = {
  centerLine: "中心线 (CL)",
  tStatistic: "t 统计量", fStatistic: "F 统计量", chiSquare: "卡方检验值 (χ²)",
  significant: "显著性差异", conclusion: "判定结论",
  objective: "试验目标", duration: "周期时限",
  successCriteria: "达标判据", pilotResults: "实测表现",
  risks: "风险分析", decision: "评审决策",
  actions: "改善对策", owner: "责任人", deadline: "截止日期",
  status: "状态", priority: "优先级",
  stakeholder: "利益相关方", influence: "权力大小", interest: "利益诉求",
  strategy: "沟通策略",
  controlMethod: "控制方法", reactionPlan: "应急响应升级预案 (OCAP)",
  severity: "严重度 (S)", occurrence: "频度 (O)", detection: "探测度 (D)",
  rpn: "风险顺序数 (RPN)", action: "改善行动", wasteType: "浪费类型",
  name: "名称", value: "数值", notes: "备注说明", title: "标题",
  result: "分析结果", summary: "汇总提炼",
  mean: "均值 (μ)", stdDev: "标准差 (σ)", cp: "过程能力指数 Cp", cpk: "过程能力指数 Cpk",
  sigma: "西格玛水平 (Sigma)", dpmo: "百万分之缺陷率 (DPMO)", pValue: "显著性 P 值",
  correlation: "相关系数 (r)", rSquared: "决定系数 (R²)", optimal: "最优配置",
  failureMode: "潜在失效模式", chartType: "控制图类型", values: "测量样本值",
  cl: "中心线 (CL)", clR: "极差中心线", lclR: "极差下控制限 (LCL)", uclR: "极差上控制限 (UCL)",
  n: "样本容量 (n)", cpl: "下限能力指数 (Cpl)", cpu: "上限能力指数 (Cpu)",
  dpu: "单件缺陷数 (DPU)", yield: "一次合格率 (%)",
  units: "检验总件数", opportunities: "单件缺陷机会数",
  risk: "风险等级", failureEffect: "失效后果", currentControl: "现有控制方法",
  recommendedAction: "建议纠正预防措施", processStep: "工序步骤",
  characteristic: "质量控制特性", measurementMethod: "测量检测方法",
  reactionPlanDetail: "失控升级细则", sampleFrequency: "抽检频次与规范",
  confidenceLevel: "置信水平 (1-α)", degreesOfFreedom: "统计自由度 (df)",
  testType: "检验方法类型", hypothesisResult: "假设检验推断结果",
  totalDefects: "缺陷总数 (D)", totalOpportunities: "缺陷机会总数",
  data: "测量数据集", groups: "分组数", effect2: "效应影响",
  totalRisksCount: "识别风险总数",
  highRisksCount: "高危风险项数 (RPN ≥ 15)",
  mediumRisksCount: "中度风险项数 (RPN 8-14)",
  averageRiskScore: "平均风险顺序数 (RPN)",
  studyVarPercent: "量具测量变异占比 (%SV)",
  percentRR: "重复性与再现性 (%R&R)",
  percentPart: "部件间固有变异 (%PV)",
  withinPct: "件内变异贡献率 (%)",
  betweenPct: "件间变异贡献率 (%)",
  temporalPct: "时间时刻变异贡献率 (%)",
};

const KEY_LABELS_EN: Record<string, string> = {
  centerLine: "Center Line (CL)",
  tStatistic: "t-Statistic", fStatistic: "F-Statistic", chiSquare: "Chi-Square (χ²)",
  significant: "Statistically Significant", conclusion: "Conclusion",
  objective: "Objective", duration: "Duration",
  successCriteria: "Success Criteria", pilotResults: "Pilot Results",
  risks: "Risks", decision: "Decision",
  actions: "Action Items", owner: "Owner", deadline: "Deadline",
  status: "Status", priority: "Priority",
  stakeholder: "Stakeholder", influence: "Power / Influence", interest: "Interest",
  strategy: "Engagement Strategy",
  controlMethod: "Control Method", reactionPlan: "OCAP Response Plan",
  severity: "Severity (S)", occurrence: "Occurrence (O)", detection: "Detection (D)",
  rpn: "Risk Priority Number (RPN)", action: "Action", wasteType: "Waste Type",
  name: "Name", value: "Value", notes: "Notes", title: "Title",
  result: "Result", summary: "Summary",
  mean: "Mean (μ)", stdDev: "Std Dev (σ)", cp: "Cp Index", cpk: "Cpk Index",
  sigma: "Sigma Level", dpmo: "DPMO", pValue: "p-Value",
  correlation: "Correlation (r)", rSquared: "R-Squared (R²)", optimal: "Optimal Setting",
  failureMode: "Failure Mode", chartType: "Chart Type", values: "Values",
  cl: "Center Line (CL)", clR: "Range Center Line", lclR: "Range LCL", uclR: "Range UCL",
  n: "Sample Size (n)", cpl: "Cpl Index", cpu: "Cpu Index",
  dpu: "Defects Per Unit (DPU)", yield: "First Pass Yield (%)",
  units: "Total Audited Units", opportunities: "Opportunities per Unit",
  risk: "Risk Level", failureEffect: "Failure Effect", currentControl: "Current Control",
  recommendedAction: "Recommended Action", processStep: "Process Step",
  characteristic: "Quality Characteristic", measurementMethod: "Measurement Method",
  reactionPlanDetail: "Reaction Protocol", sampleFrequency: "Sampling Frequency",
  confidenceLevel: "Confidence Level", degreesOfFreedom: "Degrees of Freedom (df)",
  testType: "Test Type", hypothesisResult: "Hypothesis Test Result",
  totalDefects: "Total Defects (D)", totalOpportunities: "Total Opportunities",
  data: "Data", groups: "Groups", effect2: "Effect",
  totalRisksCount: "Total Risks Count",
  highRisksCount: "Critical Risks (RPN >= 15)",
  mediumRisksCount: "Moderate Risks (RPN 8-14)",
  averageRiskScore: "Average RPN",
  studyVarPercent: "Measurement Variation (%SV)",
  percentRR: "Gage Repeatability & Reproducibility (%R&R)",
  percentPart: "Part-to-Part Variation (%PV)",
  withinPct: "Within-Piece Variation (%)",
  betweenPct: "Piece-to-Piece Variation (%)",
  temporalPct: "Time-to-Time Variation (%)",
};

function labelFor(key: string, isZh = false): string {
  const dict = isZh ? KEY_LABELS_ZH : KEY_LABELS_EN;
  return dict[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function formatCalcValue(val: unknown, key?: string, isZh = false): string {
  if (val === null || val === undefined) return "–";
  if (typeof val === "boolean") return val ? (isZh ? "是" : "Yes") : (isZh ? "否" : "No");
  if (typeof val === "number") {
    const formattedNum = Number.isInteger(val) ? String(val) : val.toFixed(2).replace(/\.?0+$/, "");
    if (key && (key.toLowerCase().includes("percent") || key.toLowerCase().includes("pct") || key.toLowerCase() === "yield")) {
      return `${formattedNum}%`;
    }
    return formattedNum;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return isZh ? "空列表" : "Empty list";
    if (val.every(item => typeof item === "number" || typeof item === "string")) {
      return val.map(item => typeof item === "number" ? item.toFixed(1) : String(item)).join(", ");
    }
    return `${val.length} ${isZh ? "行记录" : "rows"}`;
  }
  if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return "–";
    if (entries.every(([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null)) {
      return entries.map(([k, v]) => `${labelFor(k, isZh)}: ${v === null ? "–" : typeof v === "boolean" ? (v ? (isZh ? "是" : "Yes") : (isZh ? "否" : "No")) : formatCalcValue(v, k, isZh)}`).join(", ");
    }
    return `${entries.length} ${isZh ? "项参数" : "parameters"}`;
  }
  return String(val);
}

function getCalculationPhase(calc: { phase: number | null | undefined; tool_id: string }): number {
  if (calc.phase && calc.phase >= 1 && calc.phase <= 5) {
    return Number(calc.phase);
  }
  // Fallback: search which phase contains the tool with this tool_id
  const foundPhase = phases.find((p) => p.tools.some((t) => t.id === calc.tool_id));
  return foundPhase ? foundPhase.id : 1; // Default to phase 1 (Define) if not found
}

function parseSafeDate(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val === "string") return new Date(val);
  if (typeof val === "number") return new Date(val);
  if (typeof val === "object") {
    if (typeof val.toDate === "function") {
      return val.toDate();
    }
    if (val.seconds !== undefined) {
      return new Date(val.seconds * 1000);
    }
  }
  return new Date(val);
}

export default function ProjectDetail() {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [calculations, setCalculations] = useState<ProjectCalculation[]>([]);
  const [tollgateItems, setTollgateItems] = useState<{ phase: number; title: string; is_completed: boolean }[]>([]);
  const [sigmaEntries, setSigmaEntries] = useState<{ phase: number; sigma_level: number; dpmo: number | null; measurement_date: string }[]>([]);
  const [controlPlanRows, setControlPlanRows] = useState<any[]>([]);
  const [raciRows, setRaciRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(1);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const { user, loading } = useAuth();

  // Project edit state hooks
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEstimatedSavings, setEditEstimatedSavings] = useState("");
  const [editActualSavings, setEditActualSavings] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  const handleOpenEditDialog = () => {
    if (!project) return;
    setEditName(project.name || "");
    setEditDescription(project.description || "");
    setEditEstimatedSavings(project.estimated_savings != null ? String(project.estimated_savings) : "");
    setEditActualSavings(project.actual_savings != null ? String(project.actual_savings) : "");
    setEditStatus(project.status || "active");
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editName.trim()) {
      toast({ title: isZh ? "请输入项目名称" : "Please enter a project name", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("projects")
      .update({
        name: editName.trim(),
        description: editDescription.trim() || null,
        estimated_savings: editEstimatedSavings ? Number(editEstimatedSavings) : null,
        actual_savings: editActualSavings ? Number(editActualSavings) : null,
        status: editStatus,
      })
      .eq("id", projectId!);

    setIsSaving(false);

    if (error) {
      toast({ title: isZh ? "保存项目信息失败" : "Failed to save project settings", variant: "destructive" });
    } else {
      toast({ title: isZh ? "项目信息已成功更新！" : "Project updated successfully!" });
      setIsEditDialogOpen(false);
      fetchProjectData();
    }
  };

  useEffect(() => {
    setExpandedToolId(null);
  }, [activePhase]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const fetchNotes = useCallback(async () => {
    if (!projectId) return;
    const { data: notesData } = await supabase
      .from("project_notes")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setNotes(notesData || []);
  }, [projectId]);

  const fetchCalculations = useCallback(async () => {
    if (!projectId) return;
    const { data: calcsData } = await supabase
      .from("project_calculations")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setCalculations(calcsData || []);
  }, [projectId]);

  const fetchTollgateItems = useCallback(async () => {
    if (!projectId) return;
    const { data: tollgateData, error } = await supabase
      .from("tollgate_items")
      .select("phase, title, is_completed")
      .eq("project_id", projectId)
      .order("sort_order");

    if (!error && tollgateData && tollgateData.length === 0) {
      // Pre-initialize all 5 DMAIC checklist phases in database to ensure
      // progress metrics are always computed honestly and correctly.
      const inserts: any[] = [];
      Object.entries(DEFAULT_CHECKLIST).forEach(([phaseNum, items]) => {
        const phase = parseInt(phaseNum, 10);
        items.forEach((title, i) => {
          inserts.push({
            project_id: projectId,
            phase,
            title,
            sort_order: i,
            is_completed: false
          });
        });
      });

      const { data: insertedData, error: insertError } = await supabase
        .from("tollgate_items")
        .insert(inserts)
        .select("phase, title, is_completed");

      if (!insertError && insertedData) {
        setTollgateItems(insertedData);
      } else {
        setTollgateItems([]);
      }
    } else {
      setTollgateItems(tollgateData || []);
    }
  }, [projectId]);

  useEffect(() => {
    if (user && projectId) {
      fetchProjectData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, projectId]);

  useEffect(() => {
    const handleCalculationSaved = () => {
      fetchCalculations();
    };

    window.addEventListener("project-calculation-saved", handleCalculationSaved);
    return () => {
      window.removeEventListener("project-calculation-saved", handleCalculationSaved);
    };
  }, [fetchCalculations]);

  useEffect(() => {
    const handleTollgateItemsUpdated = () => {
      fetchTollgateItems();
    };

    window.addEventListener("tollgate-items-updated", handleTollgateItemsUpdated);
    return () => {
      window.removeEventListener("tollgate-items-updated", handleTollgateItemsUpdated);
    };
  }, [fetchTollgateItems]);

  const fetchProjectData = async () => {
    setIsLoading(true);

    // Fetch project
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !projectData) {
      toast({ title: "Projekt hittades inte", variant: "destructive" });
      navigate("/projects");
      return;
    }

    setProject(projectData);
    setActivePhase(projectData.current_phase);

    // Fetch notes and calculations
    await Promise.all([
      fetchNotes(),
      fetchCalculations(),
      fetchTollgateItems()
    ]);

    // Fetch sigma entries for export
    const { data: sigmaData } = await supabase
      .from("sigma_tracking")
      .select("phase, sigma_level, dpmo, measurement_date")
      .eq("project_id", projectId!)
      .order("measurement_date");

    setSigmaEntries(sigmaData || []);

    // Fetch control plans for export
    const { data: cpData } = await supabase
      .from("control_plans")
      .select("*")
      .eq("project_id", projectId!);

    if (cpData) {
      const sorted = [...cpData].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setControlPlanRows(sorted);
    } else {
      setControlPlanRows([]);
    }

    // Fetch RACI Matrix
    const { data: raciData } = await supabase
      .from("raci_matrix")
      .select("*")
      .eq("project_id", projectId!);
    
    setRaciRows(raciData || []);

    setIsLoading(false);
  };

  const updatePhase = async (newPhase: number) => {
    if (!project) return;

    const { error } = await supabase
      .from("projects")
      .update({ current_phase: newPhase })
      .eq("id", project.id);

    if (!error) {
      setProject({ ...project, current_phase: newPhase });
    }
  };

  const createNote = async () => {
    if (!noteTitle.trim()) {
      toast({ title: isZh ? "请输入笔记标题" : "Please enter a note title", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase
      .from("project_notes")
      .insert({
        project_id: projectId,
        user_id: user!.id,
        phase: activePhase,
        title: noteTitle.trim(),
        content: noteContent.trim() || null
      })
      .select()
      .single();

    setIsSaving(false);

    if (error) {
      toast({ title: isZh ? "保存笔记失败" : "Failed to save note", variant: "destructive" });
    } else {
      toast({ title: isZh ? "笔记已成功保存！" : "Note saved!" });
      setNotes([data, ...notes]);
      setNoteTitle("");
      setNoteContent("");
      setIsNoteDialogOpen(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm(isZh ? "确认删除该条项目阶段笔记吗？" : "Are you sure you want to delete this note?")) return;

    const { error } = await supabase
      .from("project_notes")
      .delete()
      .eq("id", noteId);

    if (!error) {
      setNotes(notes.filter((n) => n.id !== noteId));
      toast({ title: isZh ? "笔记已成功删除" : "Note deleted" });
    }
  };

  const deleteCalculation = async (calcId: string) => {
    if (!confirm(isZh ? "确认删除该条工具计算记录吗？" : "Are you sure you want to delete this calculation?")) return;

    const { error } = await supabase
      .from("project_calculations")
      .delete()
      .eq("id", calcId);

    if (!error) {
      setCalculations(calculations.filter((c) => c.id !== calcId));
      toast({ title: isZh ? "计算模型记录已删除" : "Calculation deleted" });
    }
  };

  const handleSubTabChange = (val: string) => {
    if (val === "calculations") {
      fetchCalculations();
    } else if (val === "notes") {
      fetchNotes();
    }
  };

  const currentPhaseData = phases.find((p) => p.id === activePhase) || phases[0];
  const phaseNotes = notes.filter((n) => n.phase === activePhase);
  const phaseCalculations = calculations.filter((c) => getCalculationPhase(c) === activePhase);

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!project) return null;

  // Compute metrics for DMAIC timeline visualization
  const getPhaseProgress = (phaseId: number) => {
    const phaseItems = tollgateItems.filter((item) => item.phase === phaseId);
    if (phaseItems.length === 0) {
      return phaseId < project.current_phase ? 100 : 0;
    }
    const completed = phaseItems.filter((item) => item.is_completed).length;
    return Math.round((completed / phaseItems.length) * 100);
  };

  const totalPhases = 5;
  const overallProgress = Math.round(
    [1, 2, 3, 4, 5].reduce((sum, pId) => sum + getPhaseProgress(pId), 0) / totalPhases
  );

  return (
    <Layout>
      {/* Project Header */}
      <section className={cn("bg-gradient-to-br text-white", currentPhaseData.color)}>
        <div className="container mx-auto px-4 py-8">
          <Link to="/projects" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" />
            {isZh ? "返回项目列表" : "Back to Projects"}
          </Link>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold break-words leading-tight">{project.name}</h1>
                {project.user_id === user?.id && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-white hover:text-white bg-white/10 hover:bg-white/20 border-white/20 rounded-full shrink-0"
                    onClick={handleOpenEditDialog}
                    title={isZh ? "编辑项目基本信息" : "Edit project settings"}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {project.description && (
                <p className="text-white/80 text-sm sm:text-base line-clamp-3 md:line-clamp-none max-w-2xl">{project.description}</p>
              )}
              {/* Savings indicators */}
              <div className="flex items-center gap-4 mt-2">
                {project.estimated_savings != null && (
                  <span className="text-white/80 text-xs sm:text-sm flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {isZh ? "预计目标收益:" : "Estimated Goal:"} {new Intl.NumberFormat(isZh ? "zh-CN" : "sv-SE", { style: "currency", currency: isZh ? "CNY" : "SEK", maximumFractionDigits: 0 }).format(project.estimated_savings)}
                  </span>
                )}
                {project.actual_savings != null && (
                  <span className="text-white text-xs sm:text-sm font-medium flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {isZh ? "实际产生财务收益:" : "Actual Savings:"} {new Intl.NumberFormat(isZh ? "zh-CN" : "sv-SE", { style: "currency", currency: isZh ? "CNY" : "SEK", maximumFractionDigits: 0 }).format(project.actual_savings)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">
              <ProjectCollaborators
                projectId={project.id}
                isOwner={project.user_id === user?.id}
                currentUserId={user?.id || ""}
              />
              
              <Badge variant="outline" className="bg-white/20 text-white border-white/40 text-xs py-0.5 px-2">
                {project.status === "active" 
                  ? (isZh ? "推进中" : "Active") 
                  : project.status === "completed" 
                  ? (isZh ? "已结案" : "Completed") 
                  : (isZh ? "已归档" : "Archived")}
              </Badge>

              {/* Mobile/Tablet Compact Export Options - Visible below md */}
              <div className="block md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/20 border-white/40 text-white hover:bg-white/30 text-xs"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      {isZh ? "导出" : "Export"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200 text-slate-800 shadow-md">
                    <DropdownMenuLabel className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      {isZh ? "项目成果导出" : "Export Project"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="hover:bg-slate-100 focus:bg-slate-100 gap-2 cursor-pointer text-xs"
                      onClick={() => exportProjectToPDF(project, notes, calculations, tollgateItems, sigmaEntries, controlPlanRows)}
                    >
                      <Download className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      {isZh ? "完整 PDF 报告" : "PDF Report"}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="hover:bg-slate-100 focus:bg-slate-100 gap-2 cursor-pointer text-xs"
                      onClick={() => exportA3Report(project, notes, calculations, tollgateItems, sigmaEntries, controlPlanRows, raciRows)}
                    >
                      <Download className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      {isZh ? "A3 一页纸改善总结" : "A3 Report"}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="hover:bg-slate-100 focus:bg-slate-100 gap-2 cursor-pointer text-xs"
                      onClick={() => exportProjectToPPTX(project, notes, calculations, tollgateItems, sigmaEntries)}
                    >
                      <Presentation className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      PowerPoint (.pptx)
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="hover:bg-slate-100 focus:bg-slate-100 gap-2 cursor-pointer text-xs"
                      onClick={() => exportProjectToXLSX(project, notes, calculations, tollgateItems, sigmaEntries, controlPlanRows, raciRows)}
                    >
                      <Table className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="hover:bg-slate-100 focus:bg-slate-100 gap-2 cursor-pointer text-xs"
                      onClick={() => exportProjectToCSV(project, notes, calculations, tollgateItems, sigmaEntries, controlPlanRows, raciRows)}
                      title={isZh ? "CSV 通用数据文件导出" : "CSV Data Export"}
                    >
                      <Table className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop Export Buttons - Visible only on md and up */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/40 text-white hover:bg-white/30"
                  onClick={() => exportProjectToPDF(project, notes, calculations, tollgateItems, sigmaEntries, controlPlanRows)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/40 text-white hover:bg-white/30"
                  onClick={() => exportA3Report(project, notes, calculations, tollgateItems, sigmaEntries, controlPlanRows, raciRows)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isZh ? "A3 报告" : "A3 Report"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/40 text-white hover:bg-white/30"
                  onClick={() => exportProjectToPPTX(project, notes, calculations, tollgateItems, sigmaEntries)}
                >
                  <Presentation className="h-4 w-4 mr-2" />
                  PPTX
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/40 text-white hover:bg-white/30"
                  onClick={() => exportProjectToXLSX(project, notes, calculations, tollgateItems, sigmaEntries, controlPlanRows, raciRows)}
                >
                  <Table className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/40 text-white hover:bg-white/30"
                  onClick={() => exportProjectToCSV(project, notes, calculations, tollgateItems, sigmaEntries, controlPlanRows, raciRows)}
                  title={isZh ? "CSV 数据表格导出" : "CSV Data Export"}
                >
                  <Table className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Phase Progress Timeline & Navigation */}
          <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            {/* Overall progress indicator with progress bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {isZh ? "DMAIC 阶段门禁里程碑" : "DMAIC Phase Milestones"}
                </h3>
                <p className="text-white/70 text-xs">
                  {isZh ? "跟进项目执行进度，逐项核验各阶段 Tollgate 评审清单" : "Track progress and complete tollgate review checklists"}
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/15 px-4 py-2 rounded-xl border border-white/10">
                <span className="text-sm font-medium text-white/90">
                  {isZh ? "项目综合达成进度:" : "Overall Progress:"}
                </span>
                <span className="text-base font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-lg">
                  {overallProgress}%
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Headline progress bar for overall completion */}
              <Progress value={overallProgress} className="h-2.5 bg-white/20 [&>div]:bg-white" />

              {/* Overall and Phase-by-phase Timeline track without overlapping lines */}
              <div className="relative pt-2">
                {/* Grid of Phases representing timeline checkpoints */}
                <div className="grid grid-cols-5 gap-1 sm:gap-4 relative z-10">
                  {phases.map((phase, index) => {
                    const pct = getPhaseProgress(phase.id);
                    const isActive = phase.id === activePhase;
                    const isCurrentPhase = phase.id === project.current_phase;
                    const isPast = phase.id < project.current_phase;
                    const isUnlocked = phase.id <= project.current_phase;

                    return (
                      <div 
                        key={phase.id} 
                        className={cn(
                          "flex flex-col items-center p-1 sm:p-3 rounded-xl transition-all duration-200 cursor-pointer relative",
                          isActive 
                            ? "bg-white/15 border border-white/25 shadow-lg" 
                            : "border border-transparent hover:bg-white/5"
                        )}
                        onClick={() => {
                          setActivePhase(phase.id);
                        }}
                      >
                        {/* Desktop Directional Arrow between phases */}
                        {index < phases.length - 1 && (
                          <div className="absolute right-0 translate-x-[50%] top-[28px] sm:top-[36px] translate-y-[-50%] hidden md:flex items-center justify-center text-white/45 z-30 pointer-events-none">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                        {/* Circle indicator node with icon */}
                        <div className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all border-2 relative z-20",
                          isActive
                            ? "bg-white text-slate-900 border-white scale-105 sm:scale-110 shadow-lg ring-4 ring-white/20 font-bold"
                            : isPast
                            ? "bg-emerald-500/90 text-white border-emerald-400 font-bold"
                            : isCurrentPhase
                            ? "bg-white/25 text-white border-white scale-102 sm:scale-105 animate-pulse"
                            : "bg-black/20 text-white/40 border-transparent"
                        )}>
                          {pct === 100 ? (
                            <span className="text-xs sm:text-base font-bold">✓</span>
                          ) : (
                            <span className="text-sm sm:text-base">{phase.icon}</span>
                          )}
                          
                          {/* Status Checkmark or Badge for completion inside or on top of node */}
                          <div className={cn(
                            "absolute -bottom-2 sm:-bottom-2.5 right-1/2 translate-x-1/2 text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded-full font-bold shadow-sm border whitespace-nowrap",
                            pct === 100
                              ? "bg-emerald-500 text-white border-emerald-400"
                              : "bg-white/95 text-slate-950 border-white/30"
                          )}>
                            {pct}%
                          </div>
                        </div>

                        {/* Phase Labels */}
                        <span className={cn(
                          "text-[10px] sm:text-xs mt-3 sm:mt-4 font-bold tracking-wide text-center truncate w-full px-0.5",
                          isActive ? "text-white" : "text-white/80"
                        )}>
                          {isZh ? (phase.nameZh || phase.name) : phase.name}
                        </span>
                        
                        {/* Smaller visual indicator under name to show completion status */}
                        <div className="w-full max-w-[40px] sm:max-w-[80px] mt-1.5 sm:mt-2">
                          <Progress 
                            value={pct} 
                            className="h-0.5 sm:h-1 bg-white/20 [&>div]:bg-emerald-400" 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phase Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">{currentPhaseData.icon}</span>
                {isZh ? (currentPhaseData.nameZh || currentPhaseData.name) : currentPhaseData.name}: {isZh ? (currentPhaseData.titleZh || currentPhaseData.title) : currentPhaseData.title}
              </h2>
              <p className="text-muted-foreground mt-1">
                {isZh ? (currentPhaseData.descriptionZh || currentPhaseData.description) : currentPhaseData.description}
              </p>
            </div>

            <Tabs defaultValue="notes" onValueChange={handleSubTabChange} className="space-y-6">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="notes" className="gap-2">
                  <FileText className="h-4 w-4" />
                  {isZh ? `阶段笔记 (${phaseNotes.length})` : `Notes (${phaseNotes.length})`}
                </TabsTrigger>
                <TabsTrigger value="tollgate" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {isZh ? "阶段门禁评审 (Tollgate)" : "Tollgate"}
                </TabsTrigger>
                <TabsTrigger value="calculations" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  {isZh ? `模型计算 (${phaseCalculations.length})` : `Calculations (${phaseCalculations.length})`}
                </TabsTrigger>
                <TabsTrigger value="tools" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {isZh ? "分析工具库" : "Tools"}
                </TabsTrigger>
                {activePhase === 5 && (
                  <TabsTrigger value="control-plan" className="gap-2">
                    <Shield className="h-4 w-4" />
                    {isZh ? "控制计划 (Control Plan)" : "Control Plan"}
                  </TabsTrigger>
                )}
                <TabsTrigger value="raci" className="gap-2">
                  <Users className="h-4 w-4" />
                  RACI
                </TabsTrigger>
                <TabsTrigger value="sigma" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {isZh ? "西格玛追踪 (Sigma)" : "Sigma Tracker"}
                </TabsTrigger>
                {activePhase === 3 && (
                  <TabsTrigger value="ai-analysis" className="gap-2">
                    <Brain className="h-4 w-4" />
                    {isZh ? "AI 根因分析" : "AI Root Cause"}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="notes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-foreground">
                    {isZh ? `${currentPhaseData.nameZh || currentPhaseData.name} 阶段工程笔记` : `Notes for ${currentPhaseData.name}`}
                  </h3>
                  <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        {isZh ? "新建阶段笔记" : "New Note"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {isZh ? `新建笔记 - ${currentPhaseData.nameZh || currentPhaseData.name}` : `New Note - ${currentPhaseData.name}`}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                           <Label>{isZh ? "笔记标题 (Title)" : "Title"}</Label>
                          <Input
                            placeholder={isZh ? "例如：问题描述与头脑风暴记录..." : "e.g. Problem statement discussion"}
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{isZh ? "笔记详细内容 (Content)" : "Content"}</Label>
                          <Textarea
                            placeholder={isZh ? "记录研讨纪要、试验观察、异常排查手记..." : "Write your note here..."}
                            rows={6}
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                          />
                        </div>
                        <Button onClick={createNote} className="w-full" disabled={isSaving}>
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          {isZh ? "保存笔记" : "Save Note"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {phaseNotes.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        {isZh ? "该阶段暂未记录任何笔记，点击右上角「新建阶段笔记」开始记录。" : "No notes recorded for this phase yet."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {phaseNotes.map((note) => (
                      <Card key={note.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{note.title}</CardTitle>
                              <CardDescription>
                                {parseSafeDate(note.created_at).toLocaleDateString(isZh ? "zh-CN" : "sv-SE")}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => deleteNote(note.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        {note.content && (
                          <CardContent>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="calculations" className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">
                    {isZh ? `${currentPhaseData.nameZh || currentPhaseData.name} 阶段已保存的计算模型与分析结果` : `Saved Calculations for ${currentPhaseData.name}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isZh 
                      ? "集中查看并调取在当前阶段保存的所有六西格玛统计分析模型历史。" 
                      : `View and inspect statistical analysis models saved under ${currentPhaseData.title}.`}
                  </p>
                </div>

                {phaseCalculations.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Calculator className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {isZh ? `当前在 ${currentPhaseData.nameZh || currentPhaseData.name} 阶段尚未保存任何计算模型` : `No saved calculations in ${currentPhaseData.name} yet`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        {isZh 
                          ? "切换至「分析工具库」标签，运行统计工具（如 Cp/Cpk、FMEA、假设检验等）并点击“保存”即可在此归档。" 
                          : "Switch to the 'Tools' tab to run analysis and click 'Save' to archive results here."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {phaseCalculations.map((calc) => (
                      <Card
                        key={calc.id}
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-[0_1px_3.5px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                      >
                        <CardHeader className="pb-2 pt-3 px-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">{calc.tool_name}</CardTitle>
                              <CardDescription className="text-[9px] font-mono mt-0.5 text-slate-500 dark:text-slate-400">
                                {parseSafeDate(calc.created_at).toLocaleDateString(isZh ? "zh-CN" : "sv-SE")}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive h-6 w-6"
                              onClick={() => deleteCalculation(calc.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="text-xs space-y-3">
                            {/* Indata (Inputs) if there are simple/short key-values */}
                            {calc.inputs && typeof calc.inputs === "object" && Object.keys(calc.inputs).length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                                  {isZh ? "输入参数 (Inputs)" : "Inputs"}
                                </span>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 bg-slate-50/50 dark:bg-slate-950/40 p-2 rounded-md font-mono text-[9px] border border-slate-100 dark:border-slate-800/60">
                                  {Object.entries(calc.inputs as Record<string, unknown>)
                                    .filter(([key, val]) => {
                                      if (Array.isArray(val) && val.length > 10) return false;
                                      if (typeof val === "string" && val.length > 50) return false;
                                      return true;
                                    })
                                    .map(([key, value]) => (
                                      <div key={key} className="flex justify-between border-b border-slate-100/50 dark:border-slate-800/20 py-0.5 last:border-0 truncate">
                                        <span className="text-muted-foreground truncate font-sans pr-1 text-[10px]" title={labelFor(key, isZh)}>{labelFor(key, isZh)}:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-right truncate text-[10px]">
                                          {formatCalcValue(value, key, isZh)}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Resultat (Results) */}
                            {calc.results && typeof calc.results === "object" && Object.keys(calc.results).length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                  {isZh ? "分析结论 (Results)" : "Results"}
                                </span>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-md font-mono text-[9px] border border-slate-100 dark:border-slate-800/80">
                                  {Object.entries(calc.results as Record<string, unknown>).map(([key, value]) => (
                                    <div key={key} className="flex justify-between border-b border-slate-100/70 dark:border-slate-800/50 py-0.5 last:border-0 truncate">
                                      <span className="text-muted-foreground truncate font-sans pr-1 text-[10px]" title={labelFor(key, isZh)}>{labelFor(key, isZh)}:</span>
                                      <span className="font-bold text-slate-800 dark:text-slate-100 text-right truncate text-[10px]">
                                        {formatCalcValue(value, key, isZh)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {calc.notes && (
                              <p className="text-muted-foreground text-[10px] leading-relaxed pt-1.5 border-t italic border-dashed border-slate-200 dark:border-slate-800">
                                {isZh ? "工程师备注" : "Note"}: {calc.notes}
                              </p>
                            )}

                            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] h-7 px-2.5 gap-1.5 font-medium hover:bg-slate-50 dark:hover:bg-slate-900"
                                onClick={() => {
                                  setExpandedToolId(calc.tool_id);
                                  const trigger = document.querySelector('[role="tablist"] button[value="tools"]') as HTMLButtonElement | null;
                                  if (trigger) {
                                    trigger.click();
                                  }
                                }}
                              >
                                <Eye className="h-3 w-3 text-primary" />
                                {isZh ? "在对应工具中打开查看" : "Open in Tool"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tools" className="space-y-4">
                <h3 className="font-semibold text-foreground">
                  {isZh ? `${currentPhaseData.nameZh || currentPhaseData.name} 核心工具集` : `Tools for ${currentPhaseData.name}`}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {currentPhaseData.tools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      phaseColor={currentPhaseData.color}
                      phaseId={activePhase}
                      initiallyExpanded={expandedToolId === tool.id}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* Tollgate */}
              <TabsContent value="tollgate" className="space-y-4">
                <TollgateChecklist
                  projectId={project.id}
                  phase={activePhase}
                  isEditor={project.user_id === user?.id}
                  onPhaseApproved={(newPhase) => {
                    setActivePhase(newPhase);
                    fetchProjectData();
                  }}
                />
              </TabsContent>

              {/* Control Plan */}
              {activePhase === 5 && (
                <TabsContent value="control-plan" className="space-y-4">
                  <ControlPlanEditor projectId={project.id} />
                </TabsContent>
              )}

              {/* RACI */}
              <TabsContent value="raci" className="space-y-4">
                <RACIMatrix projectId={project.id} />
              </TabsContent>

              {/* Sigma Tracker */}
              <TabsContent value="sigma" className="space-y-4">
                <SigmaTracker projectId={project.id} />
              </TabsContent>

              {/* AI Analysis */}
              {activePhase === 3 && (
                <TabsContent value="ai-analysis" className="space-y-4">
                  <AIRootCauseAnalysis />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </section>

      <AIDMAICCoach projectId={project.id} projectName={project.name} />

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isZh ? "编辑项目基本信息" : "Edit Project Details"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4 text-slate-900 dark:text-slate-100">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-sm font-semibold">
                {isZh ? "项目名称 (Project Name)" : "Project Name"}
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={isZh ? "请输入项目名称" : "Project Name"}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc" className="text-sm font-semibold">
                {isZh ? "项目背景与目标说明" : "Description"}
              </Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={isZh ? "简述项目目标、攻坚瓶颈与业务影响..." : "Describe project scope and goal..."}
                rows={3}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-estimated" className="text-sm font-semibold">
                  {isZh ? "预计目标收益 (元)" : "Estimated Savings (SEK/USD)"}
                </Label>
                <Input
                  id="edit-estimated"
                  type="number"
                  value={editEstimatedSavings}
                  onChange={(e) => setEditEstimatedSavings(e.target.value)}
                  placeholder={isZh ? "如：500000" : "500000"}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-actual" className="text-sm font-semibold">
                  {isZh ? "实际产生财务收益 (元)" : "Actual Savings (SEK/USD)"}
                </Label>
                <Input
                  id="edit-actual"
                  type="number"
                  value={editActualSavings}
                  onChange={(e) => setEditActualSavings(e.target.value)}
                  placeholder={isZh ? "如：450000" : "450000"}
                  className="w-full"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status" className="text-sm font-semibold">
                {isZh ? "项目推进状态" : "Project Status"}
              </Label>
              <select
                id="edit-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="active">{isZh ? "推进中 (Active)" : "Active"}</option>
                <option value="completed">{isZh ? "已验收结案 (Completed)" : "Completed"}</option>
                <option value="archived">{isZh ? "已归档 (Archived)" : "Archived"}</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} type="button">
                {isZh ? "取消" : "Cancel"}
              </Button>
              <Button onClick={handleUpdateProject} disabled={isSaving} className="gap-2">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isZh ? "保存修改" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
