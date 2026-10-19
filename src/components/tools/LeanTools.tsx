import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props { toolId?: string; toolName?: string; phase?: number; }

// 5S Audit Tool
export function FiveSAuditTool({ toolId = "5s", toolName = "5S Audit Checklist", phase = 4 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const categories = isZh ? [
    { key: "sortera", label: "整理 (Seiri / 区分必需与非必需品)", items: ["清理作业现场所有无用非必需物品", "红牌作战定期排查闲置工装夹具", "建立明确的留存与报废判定准则"] },
    { key: "strukturera", label: "整顿 (Seiton / 定置定位定容定量)", items: ["所有物料/工具均有明确划线定置位", "实施目视化标签与颜色标识看板", "符合人机工程学，取放方便快捷"] },
    { key: "stada", label: "清扫 (Seiso / 扫除脏污点检设备)", items: ["作业台面及设备无粉尘油污", "建立设备清扫与日常保养点检规范", "查找并治理跑冒滴漏等污染发生源"] },
    { key: "standardisera", label: "清洁 (Seiketsu / 维持固化前3S标准)", items: ["健全目视化管理规范与点检看板", "制定每日/每周 5S 责任矩阵清单", "责任划分到人，形成考核闭环"] },
    { key: "sjalvdisciplin", label: "素养 (Shitsuke / 养成按规作业习惯)", items: ["班组定期开展 5S 交叉审核与公示", "全员严格执行新版 SOP 规范作业", "营造持续改进与全员提案氛围"] },
  ] : [
    { key: "sortera", label: "Sort (Seiri)", items: ["Unnecessary items removed from workspace", "Red tag system executed systematically", "Clear disposition criteria established"] },
    { key: "strukturera", label: "Set in Order (Seiton)", items: ["A place for everything, everything in its place", "Clear visual labels, outlining and shadow boards", "Ergonomic placement based on frequency of use"] },
    { key: "stada", label: "Shine (Seiso)", items: ["Workspace and machines thoroughly cleaned", "Equipment maintenance and routine inspection", "Root causes of contamination identified and sealed"] },
    { key: "standardisera", label: "Standardize (Seiketsu)", items: ["Visual workplace management standards published", "Maintenance check sheets posted and active", "Roles and cleaning responsibilities assigned"] },
    { key: "sjalvdisciplin", label: "Sustain (Shitsuke)", items: ["Regular formal 5S audits scheduled", "Training completed for all shopfloor personnel", "Active continuous improvement culture"] },
  ];

  const [scores, setScores] = useState<Record<string, number[]>>(
    Object.fromEntries(categories.map(c => [c.key, c.items.map(() => 3)]))
  );

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (inputs.scores && typeof inputs.scores === "object") {
      setScores(inputs.scores as Record<string, number[]>);
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const setScore = (catKey: string, idx: number, val: number[]) => {
    setScores(prev => ({ ...prev, [catKey]: prev[catKey].map((s, i) => i === idx ? val[0] : s) }));
  };

  const catAvg = (key: string) => { const s = scores[key]; return s.reduce((a, b) => a + b, 0) / s.length; };
  const totalAvg = categories.reduce((sum, c) => sum + catAvg(c.key), 0) / categories.length;

  const loadExample = () => {
    setScores({
      sortera: [4, 5, 3],
      strukturera: [4, 3, 4],
      stada: [5, 4, 4],
      standardisera: [3, 3, 4],
      sjalvdisciplin: [2, 3, 3],
    });
  };

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      {categories.map(cat => (
        <div key={cat.key} className="space-y-1.5 p-2 rounded-lg bg-muted/20 border border-border/40">
          <Label className="text-xs font-semibold text-primary">{cat.label} — {isZh ? "均分" : "Avg"}: {catAvg(cat.key).toFixed(1)}/5</Label>
          {cat.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="flex-1 min-w-0 text-muted-foreground">{item}</span>
              <span className="w-5 text-center shrink-0 font-mono font-bold text-foreground">{scores[cat.key][idx]}</span>
              <Slider value={[scores[cat.key][idx]]} onValueChange={v => setScore(cat.key, idx, v)} min={1} max={5} step={1} className="w-20 sm:w-28 shrink-0" />
            </div>
          ))}
        </div>
      ))}
      <div className="p-3 bg-muted/50 rounded-lg text-xs text-center border">
        <span className="font-bold text-xl text-primary">{totalAvg.toFixed(1)}</span> / 5.0 {isZh ? "5S 综合现场评级" : "Overall 5S Score"}
        <div className="font-medium mt-1">
          {totalAvg >= 4 ? (isZh ? "✅ 卓越现场 (4.0-5.0)" : "✅ Excellent") : totalAvg >= 3 ? (isZh ? "⚠️ 达标合格 (3.0-3.9)" : "⚠️ Acceptable") : (isZh ? "❌ 需重点整改 (<3.0)" : "❌ Needs Improvement")}
        </div>
      </div>
      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={true} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { scores }, results: { totalAvg, categoryScores: Object.fromEntries(categories.map(c => [c.key, catAvg(c.key)])) } })} />
    </div>
  );
}

// Kaizen Event Tool
export function KaizenEventTool({ toolId = "kaizen", toolName = "Kaizen Event Charter", phase = 4 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [data, setData] = useState({ theme: "", scope: "", team: "", currentState: "", targetState: "", actions: "", results: "", standardization: "" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    setData({
      theme: String(inputs.theme || ""),
      scope: String(inputs.scope || ""),
      team: String(inputs.team || ""),
      currentState: String(inputs.currentState || ""),
      targetState: String(inputs.targetState || ""),
      actions: String(inputs.actions || ""),
      results: String(inputs.results || ""),
      standardization: String(inputs.standardization || ""),
    });
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);
  const update = (f: string, v: string) => setData(prev => ({ ...prev, [f]: v }));
  const hasResult = Object.values(data).some(v => v.trim());

  const loadExample = () => {
    if (isZh) {
      setData({
        theme: "装配2号产线换型时间 (SMED) 快速压缩改善周",
        scope: "从A产品最后一批合格品下线，至B产品首件合格检验产出",
        team: "王工 (黑带/组长)、李师傅 (注塑调机)、张工 (设备保全)、刘工 (工艺)、陈主管 (车间主任)",
        currentState: "当前换型耗时 48 分钟。主要浪费点：搜寻工具板手 (8 min)、等待模温机升温 (14 min)、调试参数试模废品 (15 min)。",
        targetState: "应用 SMED 快速换模，将换型时间压缩至 15 分钟以内。模具预热外部化、工装定置、气动快速锁紧。",
        actions: "1. 制作换型专用影子工具车；2. 换型前 20 分钟启动离线模温预热；3. 螺栓紧固全部升级为气动快插卡扣；4. 两人并行同步拆装。",
        results: "换型耗时从 48 分钟降至 11.5 分钟 (-76%)，每天额外释放有效产能 2.5 小时，换型废品减少 80%。",
        standardization: "制定《SMED 换型标准作业指导书》、录制换模教学短视频、每日早会点检换模小车齐套性。",
      });
    } else {
      setData({
        theme: "Assembly Line #2 SMED Changeover Reduction Kaizen",
        scope: "From last good part of Batch A to first good verified part of Batch B",
        team: "Anna (Black Belt), Erik (Operator), Sara (Maintenance), Magnus (Process), Lisa (QA)",
        currentState: "Baseline changeover: 48 mins. Main wastes: searching for tools (8 min), waiting for heating (14 min), trial scrap adjustments (15 min).",
        targetState: "Target changeover < 15 mins via SMED principles. Offline pre-heating, tool shadowing, pneumatic quick clamps.",
        actions: "Shadow cart for tool set, pre-heat tool 20m before shift end, pneumatic quick releases, parallel 2-person work split.",
        results: "Changeover reduced to 11.5 mins (-76%). Freed capacity allows 2 additional daily batches.",
        standardization: "Published updated SMED standard work, video training for all shifts, daily shadow board audit checklist.",
      });
    }
  };

  const fields = isZh ? [
    { key: "theme", label: "Kaizen 改善主题 (Theme / Focus)", placeholder: "本次改善周要攻克的关键问题是什么？" },
    { key: "scope", label: "流程边界范围 (Scope)", placeholder: "明确本次改善的起点工序与终点工序" },
    { key: "team", label: "跨职能团队成员 (Team)", placeholder: "团队名单及职责角色 (建议 3-7 人)" },
    { key: "currentState", label: "现状调研与浪费点 (Current State - Day 1~2)", placeholder: "现场写实、时间测定、七大浪费观测..." },
    { key: "targetState", label: "改善目标蓝图 (Target State)", placeholder: "改善后期望达到的理想工艺状态与指标" },
    { key: "actions", label: "实施攻坚对策 (Actions - Day 3~4)", placeholder: "现场实施的硬件改造、流程重排与方案落地..." },
    { key: "results", label: "最终收益与成果 (Results - Day 5)", placeholder: "量化指标对比、效率提升百分比、节约工时..." },
    { key: "standardization", label: "成果固化与标准化 (Standardization)", placeholder: "新版 SOP、看板目视化、周例会跟踪机制..." },
  ] : [
    { key: "theme", label: "Kaizen Theme / Focus Area", placeholder: "What process challenge is being improved?" },
    { key: "scope", label: "Event Scope & Boundaries", placeholder: "Process start point and end point" },
    { key: "team", label: "Cross-Functional Team (3-7 members)", placeholder: "Team members and functional roles" },
    { key: "currentState", label: "Current State (Day 1-2)", placeholder: "Observations, time studies, 7 wastes identified..." },
    { key: "targetState", label: "Target State Vision", placeholder: "How should the future process look?" },
    { key: "actions", label: "Improvement Actions (Day 3-4)", placeholder: "Executed countermeasures, fixture changes..." },
    { key: "results", label: "Verified Results (Day 5)", placeholder: "Measurable performance gains, time/cost saved..." },
    { key: "standardization", label: "Standardization & Sustainment", placeholder: "Updated SOP, video training, control checklists..." },
  ];

  return (
    <div className="space-y-2">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      {fields.map(f => (
        <div key={f.key} className="space-y-1">
          <Label className="text-xs font-medium">{f.label}</Label>
          <Textarea value={(data as any)[f.key]} onChange={e => update(f.key, e.target.value)} placeholder={f.placeholder} className="text-sm h-14 resize-none" />
        </div>
      ))}
      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: data, results: { completedSections: Object.values(data).filter(v => v.trim()).length } })} />
    </div>
  );
}

// Poka-Yoke Tool
export function PokaYokeTool({ toolId = "mistake-proofing", toolName = "Poka-Yoke", phase = 4 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [items, setItems] = useState<{ id: string; error: string; cause: string; type: string; solution: string; level: string }[]>([]);
  const [form, setForm] = useState({ error: "", cause: "", type: "kontakt", solution: "", level: "prevention" });

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    if (Array.isArray(inputs.items)) setItems(inputs.items as any[]);
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const typeLabels = isZh ? {
    kontakt: "接触感应法 (物理尺寸/几何限位)",
    fastAntal: "固定数值法 (计数/定数发料)",
    sekvens: "动作步骤法 (传感器顺序联锁)"
  } : { 
    kontakt: "Contact Method", 
    fastAntal: "Fixed-Value Method", 
    sekvens: "Motion-Step Method" 
  };

  const levelLabels = isZh ? {
    prevention: "源头预防 (最好 - 物理上无法犯错)",
    detection: "即时拦截报警 (自动停机/声光警报)",
    mitigation: "影响减缓 (降低失效破坏程度)"
  } : { 
    prevention: "Prevention (Best)", 
    detection: "Detection (Interlock)", 
    mitigation: "Mitigation" 
  };

  const addItem = () => {
    if (!form.error.trim()) return;
    setItems([...items, { id: crypto.randomUUID(), ...form }]);
    setForm({ ...form, error: "", cause: "", solution: "" });
  };

  const hasResult = items.length > 0;

  const loadExample = () => {
    if (isZh) {
      setItems([
        { id: crypto.randomUUID(), error: "电子连接器反向防呆插反", cause: "两端外壳几何对称", type: "kontakt", solution: "增加非对称卡槽倒角，反方向无法插合到位", level: "prevention" },
        { id: crypto.randomUUID(), error: "外壳总成装配漏打 1 颗紧固螺丝", cause: "操作工人眼疲劳或分心漏打", type: "fastAntal", solution: "采用智能数显螺丝刀计数，未打满4颗锁止下道工序", level: "prevention" },
        { id: crypto.randomUUID(), error: "漏贴产品追溯二维码即包装封箱", cause: "人工包装步骤随意，工序顺序紊乱", type: "sekvens", solution: "封箱机光电联锁，扫描枪未校验合格条码前封箱机禁止启动", level: "detection" },
        { id: crypto.randomUUID(), error: "烘烤炉温控参数被非授权篡改", cause: "手工旋钮无密码锁", type: "kontakt", solution: "配方数字化绑定，扫工单自动调用工艺参数并锁定屏幕", level: "prevention" },
      ]);
    } else {
      setItems([
        { id: crypto.randomUUID(), error: "Connector reversed insertion defect", cause: "Symmetric housing design", type: "kontakt", solution: "Asymmetric guide pin & keyed notch preventing reverse mating", level: "prevention" },
        { id: crypto.randomUUID(), error: "Missing screw in housing assembly", cause: "Operator distraction", type: "fastAntal", solution: "Smart torque screwdriver with batch screw counter interlock", level: "prevention" },
        { id: crypto.randomUUID(), error: "Skip barcode scanning before boxing", cause: "Manual workflow sequence violation", type: "sekvens", solution: "Carton sealer interlock requires successful scan trigger", level: "detection" },
        { id: crypto.randomUUID(), error: "Incorrect temperature recipe setting", cause: "Manual dial adjustment", type: "kontakt", solution: "Automated recipe loading locked behind scanner", level: "prevention" },
      ]);
    }
  };

  return (
    <div className="space-y-3">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "潜在操作人为失误 (Error)" : "Potential Human Error"}</Label>
          <Input 
            value={form.error} 
            onChange={e => setForm({ ...form, error: e.target.value })} 
            placeholder={isZh ? "例如：零部件装配插反..." : "e.g. Reversed assembly"} 
            className="text-sm" 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "诱发原因分析 (Cause)" : "Root Cause"}</Label>
          <Input 
            value={form.cause} 
            onChange={e => setForm({ ...form, cause: e.target.value })} 
            placeholder={isZh ? "例如：外观对称、易混淆..." : "e.g. Symmetrical design"} 
            className="text-sm" 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "防错技术措施 (Poka-Yoke Solution)" : "Mistake-Proofing Solution"}</Label>
          <Input 
            value={form.solution} 
            onChange={e => setForm({ ...form, solution: e.target.value })} 
            placeholder={isZh ? "例如：非对称定位销、光电感应..." : "e.g. Keyed connector fixture"} 
            className="text-sm" 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{isZh ? "防错等级分类 (Level)" : "Poka-Yoke Level"}</Label>
          <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
            {Object.entries(levelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <Button size="sm" onClick={addItem} disabled={!form.error.trim()} className="gap-1">
        <Plus className="h-3 w-3" /> {isZh ? "添加防错设计项" : "Add Poka-Yoke"}
      </Button>

      {hasResult && (
        <div className="space-y-1.5 pt-1">
          {items.map(item => (
            <div key={item.id} className="p-2.5 border rounded-lg text-xs space-y-1 bg-background">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold break-words min-w-0 text-foreground">❌ {item.error}</span>
                <div className="flex gap-1 shrink-0">
                  <Badge variant={item.level === "prevention" ? "default" : "secondary"} className="text-[10px]">
                    {levelLabels[item.level as keyof typeof levelLabels] || item.level}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setItems(items.filter(x => x.id !== item.id))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
              {item.cause && <div className="text-muted-foreground">{isZh ? "诱发根因" : "Cause"}: {item.cause}</div>}
              {item.solution && <div className="text-primary font-medium">✅ {isZh ? "防错对策" : "Solution"}: {item.solution}</div>}
            </div>
          ))}
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={() => saveCalculation({ toolId, toolName, phase, inputs: { items }, results: { total: items.length, preventive: items.filter(i => i.level === "prevention").length } })} />
    </div>
  );
}
