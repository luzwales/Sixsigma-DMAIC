import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Sparkles, 
  AlertTriangle, 
  XCircle, 
  History,
  Calendar,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { phases, DEFAULT_CHECKLIST } from "@/data/dmaic-tools";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";

const CHECKLIST_TITLE_MAP: Record<string, { zh: string; en: string }> = {
  "Project Charter godkänd": { zh: "项目章程获得批准 (Project Charter Approved)", en: "Project Charter formally approved" },
  "Problem- och målformulering definierad": { zh: "问题陈述与改善目标明确界定 (Problem & Goal Statement)", en: "Problem statement and goals clearly defined" },
  "SIPOC-diagram komplett": { zh: "高阶流程图 SIPOC 梳理完整", en: "High-level SIPOC diagram completed" },
  "VOC/CTQ identifierade": { zh: "客户之声与关键质量特性 (VOC/CTQ) 识别明确", en: "Voice of Customer (VOC) & CTQs identified" },
  "Projektomfattning avgränsad": { zh: "项目实施范围与边界清晰受控", en: "Project boundaries and scope agreed" },
  "Intressentanalys genomförd": { zh: "利益相关方分析完成", en: "Stakeholder analysis completed" },
  "Teammedlemmar tilldelade": { zh: "跨职能项目团队组建完毕", en: "Cross-functional team assigned" },
  "Datainsamlingsplan upprättad": { zh: "数据收集计划制定完成", en: "Data collection plan established" },
  "MSA/Gage R&R godkänd (<10% R&R)": { zh: "测量系统分析 (MSA/Gage R&R) 合格 (<10% R&R)", en: "MSA / Gage R&R approved (<10% R&R)" },
  "Baseline-data insamlad": { zh: "基线数据采集与录入完成", en: "Baseline measurement data collected" },
  "Processkapabilitet (Cp/Cpk) beräknad": { zh: "过程能力指数 (Cp/Cpk) 计算确认", en: "Process capability (Cp/Cpk) calculated" },
  "Sigma-nivå fastställd": { zh: "初始西格玛水平基准确立", en: "Baseline Sigma level determined" },
  "Processkarta detaljerad": { zh: "微观工序流程图细化完成", en: "Detailed process map constructed" },
  "Mätetal validerade": { zh: "关键质量指标 (KPOV) 测量有效性验证", en: "Measurement metrics validated" },
  "Rotorsaker identifierade (Fiskben/5 Varför)": { zh: "根本原因识别明确 (鱼骨图 / 5Why 分析)", en: "Root causes identified (Fishbone / 5 Whys)" },
  "Statistiska tester genomförda": { zh: "推断统计假设检验执行完毕", en: "Statistical hypothesis tests conducted" },
  "Kritiska X-faktorer verifierade": { zh: "关键输入变量 (KPIV / X 因子) 统计学验证通过", en: "Critical X-factors verified with data" },
  "Paretoanalys av defekttyper": { zh: "缺陷类型柏拉图 (Pareto) 聚焦完成", en: "Pareto analysis on defect types completed" },
  "Korrelation/regression analyserad": { zh: "相关性与回归方程分析建立", en: "Correlation and regression models evaluated" },
  "FMEA uppdaterad": { zh: "潜在失效模式与影响分析 (FMEA) 评级更新", en: "FMEA updated with revised RPN rankings" },
  "Datadrivna slutsatser dokumenterade": { zh: "数据驱动分析结论签署确认", en: "Data-driven findings documented" },
  "Lösningar genererade och utvärderade": { zh: "改善候选方案矩阵制定与评估筛选", en: "Countermeasure solutions developed and screened" },
  "DOE genomförd och analyserad": { zh: "试验设计 (DOE) 执行与响应曲面优化", en: "Design of Experiments (DOE) conducted" },
  "Pilottest genomfört": { zh: "小批试制与试点验证执行完成", en: "Pilot run completed and monitored" },
  "Förbättring verifierad med data": { zh: "改善后效果数据对比验证显著 (P < 0.05)", en: "Process improvement verified with statistical data" },
  "Implementeringsplan klar": { zh: "量产导入全面实施计划制定完成", en: "Full-scale rollout implementation plan finalized" },
  "Riskanalys för implementation": { zh: "导入期变更风险评估与应对措施就绪", en: "Implementation risk analysis completed" },
  "Intressenter informerade": { zh: "全员与利益相关方培训宣贯完成", en: "Stakeholders informed and trained" },
  "Kontrollplan upprättad": { zh: "控制计划 (Control Plan) 编制并签批下发", en: "Process Control Plan signed and published" },
  "Styrdiagram implementerade": { zh: "统计过程控制 (SPC) 控制图实时上线", en: "Statistical Process Control (SPC) charts deployed" },
  "SOP:ar uppdaterade": { zh: "标准作业程序 (SOP) 修订并定稿发布", en: "SOPs and work instructions updated" },
  "Utbildning genomförd": { zh: "现场操作人员技能培训考核闭环", en: "Standardized training completed" },
  "Reaktionsplan dokumenterad": { zh: "失控应急响应预案 (OCAP) 建立并演练", en: "Out-of-Control Action Plan (OCAP) documented" },
  "Processägare utsedd": { zh: "工序管理责任正式移交车间工艺所有者", en: "Formal handover to Process Owner completed" },
  "Projektrapport/A3 färdigställd": { zh: "项目最终结案报告 / A3 报告审批归档", en: "Final project sign-off / A3 report closed" },
};

function localizeChecklistTitle(title: string, isZh: boolean): string {
  if (!title) return title;
  const mapped = CHECKLIST_TITLE_MAP[title.trim()];
  if (mapped) return isZh ? mapped.zh : mapped.en;
  return title;
}

interface TollgateItem {
  id: string;
  phase: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  sort_order: number;
}

interface TollgateChecklistProps {
  projectId: string;
  phase: number;
  isEditor?: boolean;
  onPhaseApproved?: (newPhase: number, isCompleted: boolean) => void;
}

interface CriterionReview {
  title: string;
  status: "pass" | "warning" | "fail";
  comment: string;
}

interface AISolutionReview {
  status: string;
  score: number;
  missingArtifacts: string[];
  recommendations: string;
  criterionAssessments: CriterionReview[];
}

export function TollgateChecklist({ projectId, phase, isEditor = true, onPhaseApproved }: TollgateChecklistProps) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<TollgateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const { user } = useAuth();

  // AI Tollgate Review States
  const [isReviewing, setIsReviewing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewResult, setReviewResult] = useState<AISolutionReview | null>(null);
  const [historyReviews, setHistoryReviews] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showManualApproveConfirm, setShowManualApproveConfirm] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchHistoryReviews();
  }, [projectId, phase]);

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("tollgate_items")
      .select("*")
      .eq("project_id", projectId)
      .eq("phase", phase);

    if (error) {
      console.error("Error fetching tollgate items:", error);
    } else if (data && data.length === 0) {
      // Initialize with defaults
      await initializeDefaults();
    } else if (data) {
      const sorted = [...data].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setItems(sorted);
    }
    setIsLoading(false);
  };

  const fetchHistoryReviews = async () => {
    const { data, error } = await supabase
      .from("tollgate_reviews")
      .select("*")
      .eq("project_id", projectId)
      .eq("phase", phase);

    if (!error && data) {
      const sorted = [...data].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Descending
      });
      setHistoryReviews(sorted);
    }
  };

  const initializeDefaults = async () => {
    const defaults = DEFAULT_CHECKLIST[phase] || [];
    const inserts = defaults.map((title, i) => ({
      project_id: projectId,
      phase,
      title,
      sort_order: i,
    }));

    if (inserts.length === 0) return;

    const { data, error } = await supabase
      .from("tollgate_items")
      .insert(inserts)
      .select();

    if (!error && data) {
      setItems(data);
      window.dispatchEvent(new CustomEvent("tollgate-items-updated"));
    }
  };

  const toggleItem = async (item: TollgateItem) => {
    if (!isEditor) return;
    const newCompleted = !item.is_completed;
    const { error } = await supabase
      .from("tollgate_items")
      .update({
        is_completed: newCompleted,
        completed_by: newCompleted ? user?.id : null,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq("id", item.id);

    if (!error) {
      setItems(items.map(i => i.id === item.id ? {
        ...i,
        is_completed: newCompleted,
        completed_by: newCompleted ? user?.id || null : null,
        completed_at: newCompleted ? new Date().toISOString() : null,
      } : i));
      window.dispatchEvent(new CustomEvent("tollgate-items-updated"));
    }
  };

  const addItem = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await supabase
      .from("tollgate_items")
      .insert({
        project_id: projectId,
        phase,
        title: newTitle.trim(),
        sort_order: items.length,
      })
      .select()
      .single();

    if (!error && data) {
      setItems([...items, data]);
      setNewTitle("");
      window.dispatchEvent(new CustomEvent("tollgate-items-updated"));
    } else {
      toast.error(isZh ? "添加检查项失败" : "Failed to add checklist item");
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("tollgate_items").delete().eq("id", id);
    if (!error) {
      setItems(items.filter(i => i.id !== id));
      window.dispatchEvent(new CustomEvent("tollgate-items-updated"));
    }
  };

  // AI Review Service Handler
  const handleRunReview = async () => {
    setIsReviewing(true);
    try {
      // 1. Gather all local calculations, notes, and sigma metrics for current phase
      const { data: calcs } = await supabase
        .from("project_calculations")
        .select("*")
        .eq("project_id", projectId)
        .eq("phase", phase);

      const { data: notes } = await supabase
        .from("project_notes")
        .select("*")
        .eq("project_id", projectId)
        .eq("phase", phase);

      const { data: sigmas } = await supabase
        .from("sigma_tracking")
        .select("*")
        .eq("project_id", projectId)
        .eq("phase", phase);

      const { data: proj } = await supabase
        .from("projects")
        .select("name, description")
        .eq("id", projectId)
        .maybeSingle();

      // 2. Call our auto-tollgate-review endpoint
      const response = await fetch("/api/ai-tollgate-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectName: proj?.name || (isZh ? "未命名项目" : "Untitled Project"),
          projectDescription: proj?.description || "",
          phase,
          phaseName: isZh ? (phaseData?.nameZh || phaseData?.name) : (phaseData?.name || `Phase ${phase}`),
          tollgateItems: items,
          calculations: calcs || [],
          sigmaEntries: sigmas || [],
          notes: notes || []
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (isZh ? "AI 审核接口响应异常" : "Failed to retrieve AI review response"));
      }

      const reviewData: AISolutionReview = await response.json();
      setReviewResult(reviewData);

      // 3. Save review record to tollgate_reviews table
      const newReview = {
        project_id: projectId,
        phase,
        reviewer_id: user?.id || "anonymous-reviewer",
        score: reviewData.score,
        status: reviewData.status,
        missing_artifacts: reviewData.missingArtifacts || [],
        recommendations: reviewData.recommendations || "",
        criterion_assessments: reviewData.criterionAssessments || [],
        created_at: new Date().toISOString()
      };

      await supabase.from("tollgate_reviews").insert(newReview);

      // 4. Handle auto-checking of pass items ("auto-bocka av godkända")
      if (reviewData.criterionAssessments && reviewData.criterionAssessments.length > 0) {
        const passTitlesSet = new Set(
          reviewData.criterionAssessments
            .filter(c => c.status === "pass")
            .map(c => c.title.toLowerCase().trim())
        );

        const itemsToUpdate = items.filter(
          item => !item.is_completed && passTitlesSet.has(item.title.toLowerCase().trim())
        );

        if (itemsToUpdate.length > 0) {
          toast.success(isZh 
            ? `AI 审核达标，已自动为您勾选通过 ${itemsToUpdate.length} 个门禁评审项！` 
            : `${itemsToUpdate.length} items auto-approved based on AI review criteria!`);
          
          await Promise.all(
            itemsToUpdate.map(async (item) => {
              await supabase
                .from("tollgate_items")
                .update({
                  is_completed: true,
                  completed_by: user?.id,
                  completed_at: new Date().toISOString()
                })
                .eq("id", item.id);
            })
          );
          // Reload checklists
          await fetchItems();
        } else {
          toast.success(isZh ? "AI 阶段门禁评审完成！" : "AI Tollgate Review complete!");
        }
      }

      // Reload histories
      fetchHistoryReviews();
      setIsDialogOpen(true);
    } catch (err: any) {
      console.error("Failed to run Tollgate review:", err);
      toast.error(err.message || (isZh ? "AI 评审运行发生错误" : "An error occurred during AI review."));
    } finally {
      setIsReviewing(false);
    }
  };

  // Phase Advancement Handler
  const handleApprovePhase = async () => {
    if (!isEditor) return;
    const nextPhase = phase + 1;
    const isFinalPhase = nextPhase > 5;

    const updatePayload: any = {
      current_phase: isFinalPhase ? 5 : nextPhase
    };
    if (isFinalPhase) {
      updatePayload.status = "completed";
    }

    const { error } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("id", projectId);

    if (!error) {
      toast.success(
        isFinalPhase
          ? (isZh ? "恭喜！您已正式验收并完成了最终阶段 (Control 控制阶段)。全项目顺利结案达标！" : "Congratulations! The final Control phase has been approved. Project successfully completed!")
          : (isZh ? `阶段门禁正式通过！项目已推进至第 ${nextPhase} 阶段 (${phases.find(p => p.id === nextPhase)?.nameZh || phases.find(p => p.id === nextPhase)?.name || ""})` : `Phase approved! Project advanced to Phase ${nextPhase} (${phases.find(p => p.id === nextPhase)?.name || ""})`)
      );
      setIsDialogOpen(false);
      
      if (onPhaseApproved) {
        onPhaseApproved(isFinalPhase ? 5 : nextPhase, isFinalPhase);
      } else {
        // Reload page context to update calculations as a backup reload fallback
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } else {
      toast.error("Kunde inte uppdatera projektets fas.");
    }
  };

  const completed = items.filter(i => i.is_completed).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const phaseData = phases.find(p => p.id === phase);

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const getStatusIcon = (status: "pass" | "warning" | "fail") => {
    if (status === "pass") return <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />;
    if (status === "warning") return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
    return <XCircle className="h-5 w-5 text-red-500 shrink-0" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {progress === 100 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              Tollgate: {phaseData?.name}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={progress === 100 ? "default" : "secondary"}>
                {completed}/{total} ({progress}%)
              </Badge>

              {/* Run Review Trigger */}
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1 border-primary/20 hover:bg-primary/5 hover:text-primary"
                onClick={handleRunReview}
                disabled={isReviewing}
              >
                {isReviewing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {isZh ? "AI 审核中..." : "Reviewing..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {isZh ? "AI 智能门禁评审" : "Run Tollgate Review"}
                  </>
                )}
              </Button>

              {/* Manual Approve Trigger */}
              {isEditor && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1.5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 hover:text-emerald-700"
                  onClick={() => setShowManualApproveConfirm(true)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isZh ? "人工签批通过门禁" : "Approve Phase Manually"}
                </Button>
              )}

              {/* Toggle History Trigger */}
              {historyReviews.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHistory(!showHistory)}
                  title={isZh ? "评审历史记录" : "Review History"}
                  className="font-normal"
                >
                  <History className="h-4 w-4 mr-1 text-muted-foreground" />
                  {isZh ? `审核历史 (${historyReviews.length})` : `History (${historyReviews.length})`}
                </Button>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showManualApproveConfirm && (
            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50/20 dark:bg-emerald-950/10 text-sm space-y-3 animate-in fade-in-50 duration-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                    {isZh ? "确认人工签署并推进阶段门禁" : "Confirm Manual Tollgate Approval"}
                  </div>
                  <p className="text-emerald-700/80 dark:text-emerald-400/80 text-xs leading-relaxed">
                    {isZh 
                      ? "通过人工确认通过当前阶段，项目将直接推进至下一个 DMAIC 阶段，无需等待 AI 自动打分达标。已勾选的清单项将永久保留。"
                      : "By manually approving this phase, the project moves to the next DMAIC phase immediately without requiring an automated pass from AI review. Checked items will be saved."}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setShowManualApproveConfirm(false)}
                >
                  {isZh ? "取消" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  onClick={async () => {
                    await handleApprovePhase();
                    setShowManualApproveConfirm(false);
                  }}
                >
                  {isZh ? "确认签批并推进阶段" : "Approve & Advance"}
                </Button>
              </div>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
            >
              <Checkbox
                checked={item.is_completed}
                onCheckedChange={() => toggleItem(item)}
                disabled={!isEditor}
              />
              <span className={`flex-1 text-sm ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                {localizeChecklistTitle(item.title, isZh)}
              </span>
              {item.completed_at && (
                <span className="text-xs text-muted-foreground">
                  {new Date(item.completed_at).toLocaleDateString(isZh ? "zh-CN" : "sv-SE")}
                </span>
              )}
              {isEditor && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteItem(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          {isEditor && (
            <div className="flex gap-2 pt-2">
              <Input
                placeholder={isZh ? "添加自定义评审项..." : "Add custom checklist item..."}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={addItem} className="h-8">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expandable History Logs */}
      {showHistory && historyReviews.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
              <History className="h-4 w-4" />
              {isZh ? `${phaseData?.nameZh || phaseData?.name} 阶段过往评审记录` : `Previous Reviews for ${phaseData?.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyReviews.map((rev) => (
              <div key={rev.id} className="p-3 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors text-sm">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {isZh ? "综合评分:" : "Score:"} {rev.score}/100
                    </span>
                    <Badge variant={rev.status.includes("✅") ? "default" : rev.status.includes("⚠️") ? "secondary" : "destructive"}>
                      {rev.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(rev.created_at).toLocaleString(isZh ? "zh-CN" : "sv-SE")}
                  </div>
                </div>
                {rev.missing_artifacts && rev.missing_artifacts.length > 0 && (
                  <div className="mb-2 text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-semibold">{isZh ? "缺失交付物:" : "Missing Artifacts:"}</span> {rev.missing_artifacts.join(", ")}
                  </div>
                )}
                {rev.recommendations && (
                  <div className="text-xs text-muted-foreground line-clamp-2 max-w-none prose dark:prose-invert">
                    <ReactMarkdown>{rev.recommendations}</ReactMarkdown>
                  </div>
                )}
                <Button 
                  size="sm" 
                  variant="link" 
                  className="h-5 p-0 text-xs mt-1" 
                  onClick={() => {
                    setReviewResult({
                      status: rev.status,
                      score: rev.score,
                      missingArtifacts: rev.missing_artifacts || [],
                      recommendations: rev.recommendations || "",
                      criterionAssessments: rev.criterion_assessments ? (
                        Array.isArray(rev.criterion_assessments)
                          ? rev.criterion_assessments
                          : Object.entries(rev.criterion_assessments).map(([title, detail]: [string, any]) => ({
                              title,
                              status: detail.status || "warning",
                              comment: detail.comment || ""
                            }))
                      ) : []
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  {isZh ? "查看完整历史审计报告" : "View Full Historic Report"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Interactive AI Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              {isZh ? `AI 门禁评审报告: ${phaseData?.nameZh || phaseData?.name}` : `AI Tollgate Review: ${phaseData?.name}`}
            </DialogTitle>
            <DialogDescription>
              {isZh 
                ? "基于六西格玛黑带方法学，对当前阶段提交的统计度量、工程笔记及交付物进行自动化审计。" 
                : "Six Sigma methodological audit of your submitted DMAIC metrics, notes, and artifacts."}
            </DialogDescription>
          </DialogHeader>

          {reviewResult && (
            <div className="space-y-6 pt-4">
              {/* Overall Banner Status */}
              <div className="p-4 rounded-xl border flex flex-col md:flex-row items-center gap-4 justify-between bg-card">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                    {isZh ? "阶段门禁评审结论" : "Phase Status"}
                  </div>
                  <div className="text-2xl font-bold flex items-center gap-2 mt-1">
                    {reviewResult.status}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-1">
                    {isZh ? "综合达成度" : "Completion Score"}
                  </div>
                  <div className="relative flex items-center justify-center">
                    {/* Ring gauge SVG */}
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" className="stroke-muted fill-transparent" strokeWidth="6" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        className="stroke-primary fill-transparent transition-all duration-1000 ease-out" 
                        strokeWidth="6" 
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - reviewResult.score / 100)}
                      />
                    </svg>
                    <span className="absolute font-bold text-base">{reviewResult.score}</span>
                  </div>
                </div>
              </div>

              {/* Missing Artifacts Section */}
              {reviewResult.missingArtifacts && reviewResult.missingArtifacts.length > 0 && (
                <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/20 dark:bg-rose-950/5 text-sm space-y-2">
                  <div className="font-semibold text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {isZh ? "需补充完善的关键项:" : "Missing Artifacts to Complete:"}
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-rose-700/90 dark:text-rose-300">
                    {reviewResult.missingArtifacts.map((art, idx) => (
                      <li key={idx}>{art}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground uppercase tracking-widest text-muted-foreground">
                  {isZh ? "审计分析与改善建议" : "Analysis & Recommendations"}
                </h4>
                <div className="p-4 rounded-xl bg-muted/30 border text-sm leading-relaxed max-w-none prose prose-slate dark:prose-invert prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 font-sans">
                  <ReactMarkdown>{reviewResult.recommendations}</ReactMarkdown>
                </div>
              </div>

              {/* Per-item audit checklist */}
              {reviewResult.criterionAssessments && reviewResult.criterionAssessments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-foreground uppercase tracking-widest text-muted-foreground">
                    {isZh ? "逐项评审细则 (AI 判定)" : "Detailed Assessments"}
                  </h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto border rounded-xl divide-y p-1">
                    {reviewResult.criterionAssessments.map((crit, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-2.5 bg-card/60">
                        {getStatusIcon(crit.status)}
                        <div>
                          <div className="font-semibold text-sm">{localizeChecklistTitle(crit.title, isZh)}</div>
                          <div className="text-xs text-muted-foreground font-light mt-0.5">{crit.comment}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approve & lock phase button */}
              {isEditor && (
                <div className="pt-4 border-t flex gap-3 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                    {isZh ? "关闭报告" : "Close Report"}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleApprovePhase}
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white font-medium"
                    disabled={reviewResult.score < 50}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    {isZh ? "正式签署并锁定进入下一阶段" : "Approve & Lock Phase"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
