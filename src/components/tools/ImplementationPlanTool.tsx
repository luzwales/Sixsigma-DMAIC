import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";

interface Task { 
  id: string; 
  task: string; 
  responsible: string; 
  deadline: string; 
  status: "not_started" | "in_progress" | "completed"; 
  priority: "high" | "medium" | "low"; 
}

interface Props { toolId?: string; toolName?: string; phase?: number; }

export function ImplementationPlanTool({ toolId = "implementation-plan", toolName = "Implementation Plan", phase = 4 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState({ 
    task: "", 
    responsible: "", 
    deadline: "", 
    priority: "medium" as Task["priority"] 
  });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const loaded = inputs.tasks as any[] | undefined;
    if (Array.isArray(loaded)) {
      setTasks(loaded.map(t => ({
        ...t,
        status: t.status === "klar" ? "completed" : t.status === "pågår" ? "in_progress" : t.status || "not_started",
        priority: t.priority === "hög" ? "high" : t.priority === "låg" ? "low" : t.priority || "medium",
      })));
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const addTask = () => {
    if (!form.task.trim()) return;
    setTasks([...tasks, { id: crypto.randomUUID(), ...form, status: "not_started" }]);
    setForm({ ...form, task: "", responsible: "", deadline: "" });
  };

  const toggleStatus = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { 
      ...t, 
      status: t.status === "completed" ? "not_started" : t.status === "not_started" ? "in_progress" : "completed" 
    } : t));
  };

  const loadExample = () => {
    const today = new Date();
    const future = (d: number) => new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10);
    if (isZh) {
      setTasks([
        { id: crypto.randomUUID(), task: "对全班次操作工展开新版标准化作业指导书 (SOP) 实操培训", responsible: "制造部-王工", deadline: future(7), status: "completed", priority: "high" },
        { id: crypto.randomUUID(), task: "调试安装 2 号机台的视觉自动防错 (Poka-Yoke) 伺服装置", responsible: "装备电气组", deadline: future(14), status: "in_progress", priority: "high" },
        { id: crypto.randomUUID(), task: "在 MES 系统中固化冻结关键注塑保压温度与压力公差参数", responsible: "IT系统组", deadline: future(21), status: "not_started", priority: "medium" },
        { id: crypto.randomUUID(), task: "更新质量管理体系 (QMS) 过程流程图与控制计划文档", responsible: "质量工程师", deadline: future(28), status: "not_started", priority: "medium" },
        { id: crypto.randomUUID(), task: "建立车间班组每日晨会 Cpk 与不良品统计看板并上线跟踪", responsible: "生产主管", deadline: future(35), status: "not_started", priority: "high" },
      ]);
    } else {
      setTasks([
        { id: crypto.randomUUID(), task: "Conduct operator training on updated SOP and standard work", responsible: "Training Lead", deadline: future(7), status: "completed", priority: "high" },
        { id: crypto.randomUUID(), task: "Install automated vision Poka-Yoke fixture on Line #2", responsible: "Automation Eng", deadline: future(14), status: "in_progress", priority: "high" },
        { id: crypto.randomUUID(), task: "Freeze process parameter tolerances inside MES system", responsible: "IT Systems", deadline: future(21), status: "not_started", priority: "medium" },
        { id: crypto.randomUUID(), task: "Update QMS Process Map and Control Plan documentation", responsible: "QA Lead", deadline: future(28), status: "not_started", priority: "medium" },
        { id: crypto.randomUUID(), task: "Establish daily tier-1 KPI review board for shift scrap tracking", responsible: "Production Mgr", deadline: future(35), status: "not_started", priority: "high" },
      ]);
    }
  };

  const hasResult = tasks.length > 0;
  const completed = tasks.filter(t => t.status === "completed").length;

  const priorityLabels = {
    high: isZh ? "高优先级" : "High",
    medium: isZh ? "中优先级" : "Medium",
    low: isZh ? "低优先级" : "Low",
  };

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "行动任务项 (Action Task)" : "Action Item"}</Label>
          <Input 
            value={form.task} 
            onChange={e => setForm({ ...form, task: e.target.value })} 
            placeholder={isZh ? "例如：安装新型防错治具、修订SOP..." : "e.g. Install tooling, update SOP..."} 
            className="text-sm" 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "责任人 (Owner)" : "Responsible Owner"}</Label>
          <Input 
            value={form.responsible} 
            onChange={e => setForm({ ...form, responsible: e.target.value })} 
            placeholder={isZh ? "姓名 / 部门岗位" : "Name / Department"} 
            className="text-sm" 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "截止日期 (Deadline)" : "Target Deadline"}</Label>
          <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "优先级 (Priority)" : "Priority"}</Label>
          <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v as Task["priority"] })}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">{priorityLabels.high}</SelectItem>
              <SelectItem value="medium">{priorityLabels.medium}</SelectItem>
              <SelectItem value="low">{priorityLabels.low}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button size="sm" onClick={addTask} disabled={!form.task.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "添加实施任务项" : "Add Task"}
      </Button>

      {hasResult && (
        <>
          <div className="space-y-1.5 pt-1">
            {tasks.map(t => (
              <div key={t.id} className="flex flex-wrap items-center gap-1.5 text-xs p-2.5 border rounded-lg bg-background hover:bg-muted/10 transition-colors">
                <button onClick={() => toggleStatus(t.id)} className="shrink-0">
                  {t.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className={`h-4 w-4 ${t.status === "in_progress" ? "text-amber-500" : "text-muted-foreground"}`} />
                  )}
                </button>
                <span className={`flex-1 min-w-0 font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {t.task}
                </span>
                <Badge variant={t.priority === "high" ? "destructive" : t.priority === "medium" ? "default" : "secondary"} className="text-[10px] shrink-0">
                  {priorityLabels[t.priority]}
                </Badge>
                <div className="flex items-center gap-2 w-full sm:w-auto pl-6 sm:pl-0 text-muted-foreground font-mono">
                  {t.responsible && <span className="truncate">{t.responsible}</span>}
                  {t.deadline && <span className="shrink-0">{t.deadline}</span>}
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 ml-auto" onClick={() => setTasks(tasks.filter(x => x.id !== t.id))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-2.5 bg-muted/40 rounded-lg text-xs text-center border font-medium">
            {isZh 
              ? `项目整体执行进度：${completed} / ${tasks.length} 项已交付达标 (${tasks.length > 0 ? (completed / tasks.length * 100).toFixed(0) : 0}%)` 
              : `Overall Execution Progress: ${completed} of ${tasks.length} tasks completed (${tasks.length > 0 ? (completed / tasks.length * 100).toFixed(0) : 0}%)`}
          </div>
        </>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { tasks }, results: { total: tasks.length, completed, inProgress: tasks.filter(t => t.status === "in_progress").length, completionRate: tasks.length > 0 ? (completed / tasks.length * 100) : 0 } })} />
    </div>
  );
}
