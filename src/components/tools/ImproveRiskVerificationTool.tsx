import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { CheckCircle2, ShieldCheck, Plus, Trash2, AlertTriangle, PlayCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface VerificationItem {
  id: string;
  originalRisk: string;
  mitigationAction: string;
  evidence: string;
  status: "not_started" | "in_progress" | "verified_mitigated" | "action_required";
  verifiedBy: string;
  date: string;
}

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function ImproveRiskVerificationTool({ toolId = "improve-risk-verification", toolName = "Risk Verification & Action Tracking", phase = 4 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<VerificationItem[]>([
    {
      id: "v1",
      originalRisk: isZh ? "关键调机技师产线倒班忙，项目抽调时间受限" : "Key resources have limited project allocation due to shift support",
      mitigationAction: isZh ? "建立替补AB角机制并签署书面工时保障承诺" : "Establish backup technicians and secure formal time commitment",
      evidence: isZh ? "车间主任已签字批准每周固定2天脱产；Measure阶段培训的2名替补调机员已能独立顶岗" : "Department head approved time allocation; two backup resources trained during Measure phase",
      status: "verified_mitigated",
      verifiedBy: isZh ? "张总 (项目发起人)" : "Lars G (Project Sponsor)",
      date: new Date().toISOString().slice(0, 10)
    },
    {
      id: "v2",
      originalRisk: isZh ? "车间现场 MES 系统数据采集接口时有丢包网络中断" : "Intermittent network packet loss on shopfloor MES terminal",
      mitigationAction: isZh ? "增设临时离线工单记录夹并每日与系统对账校验" : "Implement offline dual-logging sheets with daily reconciliation",
      evidence: isZh ? "制定并下发了纸质与扫码双记录 SOP，并通过 Gage R&R 验证了数据录入可靠性 (一致性 > 95%)" : "Dual-logging templates deployed; data entry reliability verified via Gage R&R (>95%)",
      status: "verified_mitigated",
      verifiedBy: isZh ? "王工 (六西格玛黑带)" : "Anna L (Black Belt)",
      date: new Date().toISOString().slice(0, 10)
    }
  ]);

  const [overarchingResolution, setOverarchingResolution] = useState(
    isZh 
      ? "立项阶段识别的 5 项重大风险中，4 项已通过现场工程控制或 SOP 彻底规避，仅余 1 项 IT 自动化接口开发依赖正在升级推动，整体受控达标。" 
      : "Overall project risks successfully verified and mitigated; IT interface dependencies escalated for leadership support."
  );

  const normalizeStatus = (s: string): VerificationItem["status"] => {
    if (s === "Verifierad & Mitigerad" || s === "verified_mitigated") return "verified_mitigated";
    if (s === "Kräver åtgärd" || s === "action_required") return "action_required";
    if (s === "Ej påbörjad" || s === "not_started") return "not_started";
    return "in_progress";
  };

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (inputs.items && Array.isArray(inputs.items)) {
      setItems(inputs.items.map((i: any, idx: number) => ({
        id: i.id || String(idx),
        originalRisk: i.originalRisk || "",
        mitigationAction: i.mitigationAction || "",
        evidence: i.evidence || "",
        status: normalizeStatus(i.status),
        verifiedBy: i.verifiedBy || "",
        date: i.date || ""
      })));
    }
    setOverarchingResolution(String(inputs.overarchingResolution || ""));
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addItem = () => {
    const newItem: VerificationItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      originalRisk: "",
      mitigationAction: "",
      evidence: "",
      status: "in_progress",
      verifiedBy: "",
      date: new Date().toISOString().slice(0, 10)
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof VerificationItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const getStatusColor = (status: VerificationItem["status"]) => {
    switch (status) {
      case "verified_mitigated":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/50";
      case "action_required":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/50";
      case "in_progress":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800";
    }
  };

  const getStatusBadge = (status: VerificationItem["status"]) => {
    switch (status) {
      case "verified_mitigated":
        return <span className="flex items-center gap-1 text-[10px] bg-green-500 text-white font-bold px-1.5 py-0.5 rounded"><CheckCircle2 className="h-3 w-3" /> {isZh ? "已验证消除" : "Verified"}</span>;
      case "action_required":
        return <span className="flex items-center gap-1 text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded"><AlertTriangle className="h-3 w-3" /> {isZh ? "需升级处理" : "Action Req."}</span>;
      case "in_progress":
        return <span className="flex items-center gap-1 text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded"><PlayCircle className="h-3 w-3" /> {isZh ? "跟踪推进中" : "In Progress"}</span>;
      default:
        return <span className="text-[10px] bg-slate-400 text-white font-bold px-1.5 py-0.5 rounded">{isZh ? "未开始" : "Pending"}</span>;
    }
  };

  const loadExample = () => {
    if (isZh) {
      setItems([
        {
          id: "ex-v1",
          originalRisk: "装配2号线一线员工对新工艺节拍存在抵触心理",
          mitigationAction: "在 Kaizen 改善周前期让班组骨干全过程参与工装设计",
          evidence: "第 16 周联合召开了 3 场跨部门工装研讨会，骨干操作工深度参与并联合签批了首版操作手顺图表",
          status: "verified_mitigated",
          verifiedBy: "王工 (黑带项目经理)",
          date: new Date().toISOString().slice(0, 10)
        },
        {
          id: "ex-v2",
          originalRisk: "ERP 接口自动化权限审批周期过长阻碍系统联调",
          mitigationAction: "在 Define 立项第 1 周前置提交工单并抄送信息化部门总监",
          evidence: "已提前 2 周提交申请单，但由于底层数据库版本升级暂缓，仍有 2 项次要报表读取权限待开放",
          status: "action_required",
          verifiedBy: "IT 项目协调员",
          date: new Date().toISOString().slice(0, 10)
        }
      ]);
      setOverarchingResolution("除了 IT 辅助报表接口需进一步在推进委例会升级协调外，其余现场工艺风险均已在试点期间被彻底消除，具备量产移交条件。");
    } else {
      setItems([
        {
          id: "ex-v1",
          originalRisk: "Resistance to standard work changes among Line #2 operators",
          mitigationAction: "Engage shopfloor operators early in the Kaizen improvement event",
          evidence: "Cross-functional design workshop completed in Week 16; operators actively co-authored the new SOP guidelines",
          status: "verified_mitigated",
          verifiedBy: "Anna L (Black Belt)",
          date: new Date().toISOString().slice(0, 10)
        },
        {
          id: "ex-v2",
          originalRisk: "Extended lead time for enterprise IT system permissions",
          mitigationAction: "Submit formal access tickets during Week 1 of Define phase",
          evidence: "Tickets submitted early, but ERP version upgrade backlog delayed approvals; 2 team members still waiting",
          status: "action_required",
          verifiedBy: "Project Coordinator",
          date: new Date().toISOString().slice(0, 10)
        }
      ]);
      setOverarchingResolution("Risk mitigations have proven highly effective overall. IT access delays have been escalated to steering committee.");
    }
  };

  const hasResult = items.length > 0 || overarchingResolution.trim().length > 0;

  return (
    <div className="space-y-4">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            {isZh ? "项目风险对策闭环与落地有效性验证" : "Risk Mitigation Verification & Action Control"}
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs flex items-center gap-1">
            <Plus className="h-3 w-3" />
            {isZh ? "添加风险验证项" : "Add Verification"}
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-muted rounded-lg p-6 text-center text-muted-foreground text-sm">
            {isZh ? "暂无风险验证记录。点击“添加风险验证项”或加载示例数据开始。" : "No risk verification records found. Click 'Add Verification' or load example data to start."}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className={`border rounded-lg p-3 space-y-2 transition-colors ${getStatusColor(item.status)}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-medium text-slate-500">
                    {isZh ? `风险追踪项 #${index + 1}` : `Risk Item #${index + 1}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">
                      {isZh ? "识别的潜在原始风险 (Risk)" : "Original Risk"}
                    </Label>
                    <Input
                      value={item.originalRisk}
                      onChange={e => updateItem(item.id, "originalRisk", e.target.value)}
                      placeholder={isZh ? "当初在项目立项或测量阶段识别的具体风险..." : "What risk was identified?"}
                      className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">
                      {isZh ? "已部署的规避措施 (Mitigation Action)" : "Planned Mitigation Action"}
                    </Label>
                    <Input
                      value={item.mitigationAction}
                      onChange={e => updateItem(item.id, "mitigationAction", e.target.value)}
                      placeholder={isZh ? "采取了哪些工程或管理规避手段？" : "How was the risk mitigated?"}
                      className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">
                    {isZh ? "实施证据与实测有效性证明 (Evidence & Results)" : "Validation Evidence & Actual Outcome"}
                  </Label>
                  <Input
                    value={item.evidence}
                    onChange={e => updateItem(item.id, "evidence", e.target.value)}
                    placeholder={isZh ? "列举签批文件、实测数据、现场照片或验收结论..." : "Describe tangible evidence, test records..."}
                    className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">
                      {isZh ? "当前状态 (Status)" : "Status"}
                    </Label>
                    <select
                      value={item.status}
                      onChange={e => updateItem(item.id, "status", e.target.value as VerificationItem["status"])}
                      className="w-full h-8 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2 focus:ring-1 focus:ring-slate-400 focus:outline-none text-slate-900 dark:text-slate-100"
                    >
                      <option value="in_progress">{isZh ? "跟踪推进中" : "In Progress"}</option>
                      <option value="verified_mitigated">{isZh ? "已验证消除" : "Verified & Mitigated"}</option>
                      <option value="action_required">{isZh ? "需升级对策" : "Action Required / Escalation"}</option>
                      <option value="not_started">{isZh ? "未开始" : "Not Started"}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">
                      {isZh ? "验证人 (Verified By)" : "Verified By"}
                    </Label>
                    <Input
                      value={item.verifiedBy}
                      onChange={e => updateItem(item.id, "verifiedBy", e.target.value)}
                      placeholder={isZh ? "姓名 / 角色" : "Name / Title"}
                      className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">
                      {isZh ? "验证日期 (Date)" : "Date"}
                    </Label>
                    <Input
                      type="date"
                      value={item.date}
                      onChange={e => updateItem(item.id, "date", e.target.value)}
                      className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          {isZh ? "成果移交控制期总体风险评估意见 (Overarching Resolution)" : "Overarching Risk Resolution before Handover"}
        </Label>
        <Textarea
          value={overarchingResolution}
          onChange={e => setOverarchingResolution(e.target.value)}
          placeholder={isZh ? "总结项目整体风险规避状态及是否存在遗留残留风险..." : "Summarize total risk mitigation readiness before operational handover..."}
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
            items,
            overarchingResolution
          },
          results: {
            totalActionItems: items.length,
            verifiedItemsCount: items.filter(v => v.status === "verified_mitigated").length,
            pendingItemsCount: items.filter(v => v.status === "in_progress" || v.status === "not_started").length,
            warningItemsCount: items.filter(v => v.status === "action_required").length
          }
        })}
      />
    </div>
  );
}
