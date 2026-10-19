import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";

interface Props { toolId?: string; toolName?: string; phase?: number; }

interface Dimension { is: string; isNot: string }
type Matrix = Record<DimKey, Dimension>;

const DIMENSIONS = [
  { key: "what",    label: "VAD",        hint: "Symptom/defekt som observeras",         hintNot: "Liknande symptom som INTE observeras" },
  { key: "where",   label: "VAR",        hint: "Plats, linje, geografi där det sker",   hintNot: "Liknande ställen där det INTE sker" },
  { key: "when",    label: "NÄR",        hint: "Tidpunkt, skift, frekvens, sedan när",  hintNot: "Tider då det INTE sker" },
  { key: "who",     label: "VEM",        hint: "Utrustning, produkt, leverantör, grupp", hintNot: "Varianter/leverantörer som är felfria" },
  { key: "why",     label: "VARFÖR",     hint: "Känd trigger eller mekanism",            hintNot: "Hypoteser som uteslutits" },
  { key: "how",     label: "HUR",        hint: "Hur felet manifesteras / mönster",       hintNot: "Andra mönster som inte ses" },
  { key: "howMuch", label: "HUR MYCKET", hint: "Kvantifierat omfång (kr, %, antal)",     hintNot: "Omfång som anses normalt/tolerabelt" },
] as const;
type DimKey = typeof DIMENSIONS[number]["key"];

const empty = (): Matrix => DIMENSIONS.reduce((acc, d) => {
  acc[d.key] = { is: "", isNot: "" };
  return acc;
}, {} as Matrix);

export function FiveW2HTool({ toolId = "5w2h-is-isnot", toolName = "5W2H Is/Is-Not", phase = 1 }: Props) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const DIMENSIONS = [
    { key: "what",    label: isZh ? "【WHAT 何事】" : "WHAT",        hint: isZh ? "现场观察到的明确缺陷症状与实测变异" : "Observed symptom/defect",         hintNot: isZh ? "明确确认【没有发生】的类似缺陷症状" : "Similar defect NOT observed" },
    { key: "where",   label: isZh ? "【WHERE 何地】" : "WHERE",       hint: isZh ? "发生异常的具体产线、工位机台、模具号或位置" : "Location, line, machine, area",   hintNot: isZh ? "同处于运行中但【完全正常】的机台或工位" : "Similar location NOT experiencing it" },
    { key: "when",    label: isZh ? "【WHEN 何时】" : "WHEN",        hint: isZh ? "首次发生时间、班次、频次或工艺阶段" : "Time, shift, frequency, since when",  hintNot: isZh ? "稳定运行且【绝不发生】的特定时间段" : "Times when it does NOT occur" },
    { key: "who",     label: isZh ? "【WHO 涉及对象】" : "WHO",       hint: isZh ? "特定的批次物料、模具腔号、操作群体或供应商" : "Part, supplier, batch, equipment", hintNot: isZh ? "同一批次或工艺中【完全无缺陷】的对象" : "Variants/lots that are flawless" },
    { key: "why",     label: isZh ? "【WHY 诱发诱因】" : "WHY",        hint: isZh ? "已知的直接诱发工况（如升温、换料、加速）" : "Known trigger or physical mechanism",            hintNot: isZh ? "已被试验【明确排除】的推测原因" : "Theories ruled out" },
    { key: "how",     label: isZh ? "【HOW 表现形态】" : "HOW",        hint: isZh ? "缺陷的几何分布形态（如局部凹陷、点状）" : "Pattern, manifestation of defect",       hintNot: isZh ? "未曾出现的其他分布规律" : "Other patterns NOT seen" },
    { key: "howMuch", label: isZh ? "【HOW MUCH 程度】" : "HOW MUCH",   hint: isZh ? "缺陷率 %、DPMO、超差绝对值或报废损失金额" : "Quantified impact (cost, %, count)",     hintNot: isZh ? "被判定为正常可容忍的波动范围" : "Normal tolerable baseline" },
  ] as const;

  const [matrix, setMatrix] = useState<Matrix>(empty());
  const [aiOut, setAiOut] = useState<{ problemStatement?: string; scope?: string; warning?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const m = (inputs?.matrix as Matrix) || empty();
    setMatrix({ ...empty(), ...m });
    setAiOut((inputs?.ai as typeof aiOut) || null);
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } =
    useCalculatorSave(toolId, handleLoad);

  const update = (key: DimKey, side: keyof Dimension, value: string) =>
    setMatrix(prev => ({ ...prev, [key]: { ...prev[key], [side]: value } }));

  const filledCount = DIMENSIONS.filter(d => matrix[d.key].is.trim() || matrix[d.key].isNot.trim()).length;
  const hasResult = filledCount > 0;
  const canAI = filledCount >= 4;

  const loadExample = () => {
    if (isZh) {
      setMatrix({
        what:    { is: "门护板B面局部表面下陷与缩水缺陷",            isNot: "无裂纹、无飞边、无顶针发白" },
        where:   { is: "注塑2号机，模具#M04号型腔",                 isNot: "同车间1号机与3号机完全正常" },
        when:    { is: "夜班（凌晨2点~6点），自2026年5月开始",      isNot: "白班（10点~18点）完全合格" },
        who:     { is: "改性颗粒供应商A提供的批次料",               isNot: "供应商B与C批次料无此异常" },
        why:     { is: "夜班车间水温低，模具冷却水道温差偏大",      isNot: "排除了工人装配手法因素" },
        how:     { is: "集中在厚壁加强筋对侧，单件下陷深度>0.1mm",  isNot: "非全表面均匀弥散收缩" },
        howMuch: { is: "不良率达 8.7%，导致周返修成本 3.2 万元",    isNot: "常规可接受报废率 (<1.0%)" },
      });
    } else {
      setMatrix({
        what:    { is: "Scratches on door panels",                  isNot: "No cracks, dents, or flashes" },
        where:   { is: "Assembly Line 2, Mold #M04",                isNot: "Assembly Lines 1 and 3 are flawless" },
        when:    { is: "Night shift, observed since 2026-05-10",    isNot: "Day shifts and weekend runs" },
        who:     { is: "Raw resin lot from Supplier X",             isNot: "Supplier Y and Z materials (good)" },
        why:     { is: "Friction at robotic pickup gripper",        isNot: "Manual handling was ruled out" },
        how:     { is: "Localized scratch clusters on ~2% of area", isNot: "Not uniform wear across part" },
        howMuch: { is: "$1,500/week scrap, 120 mins line downtime", isNot: "Micro-stops < 5s are negligible" },
      });
    }
    setAiOut(null);
  };

  const buildDraft = (): { statement: string; scope: string } => {
    const m = matrix;
    let statement = "";
    let scope = "";

    if (isZh) {
      statement = [
        m.what.is && `【现象】${m.what.is}`,
        m.where.is && `【发生地点】${m.where.is}`,
        m.when.is && `【时间规律】${m.when.is}`,
        m.who.is && `【涉及批次/对象】${m.who.is}`,
        m.how.is && `【表现形态】${m.how.is}`,
        m.howMuch.is && `【规模影响】${m.howMuch.is}`,
      ].filter(Boolean).join("；") + "。";

      const inParts = DIMENSIONS.map(d => m[d.key].is && `${d.label}: ${m[d.key].is}`).filter(Boolean).join(" | ");
      const outParts = DIMENSIONS.map(d => m[d.key].isNot && `${d.label}: ${m[d.key].isNot}`).filter(Boolean).join(" | ");
      scope = `项目范围内 (In-Scope):\n${inParts || "—"}\n\n项目范围外/已排除 (Out-of-Scope):\n${outParts || "—"}`;
    } else {
      statement = [
        m.what.is && m.what.is,
        m.where.is && `Occurs in ${m.where.is}`,
        m.when.is && `during ${m.when.is}`,
        m.who.is && `affecting ${m.who.is}`,
        m.how.is && `manifested as ${m.how.is}`,
        m.howMuch.is && `with magnitude of ${m.howMuch.is}`,
      ].filter(Boolean).join(". ") + ".";

      const inParts = DIMENSIONS.map(d => m[d.key].is && `${d.label}: ${m[d.key].is}`).filter(Boolean).join(" | ");
      const outParts = DIMENSIONS.map(d => m[d.key].isNot && `${d.label}: ${m[d.key].isNot}`).filter(Boolean).join(" | ");
      scope = `In-Scope: ${inParts || "—"}\nOut-of-Scope: ${outParts || "—"}`;
    }

    return { statement, scope };
  };

  const runAI = async () => {
    if (!canAI) {
      toast.error("Fyll i minst 4 dimensioner innan AI-syntes");
      return;
    }
    setLoading(true);
    setAiOut(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-5w2h-synth", { body: { matrix } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiOut(data);
      toast.success("AI-förslag genererat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI-syntes misslyckades");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Kopierat");
    setTimeout(() => setCopied(null), 1500);
  };

  const draft = hasResult ? buildDraft() : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
        <ExampleDataButton onLoad={loadExample} />
        <Badge variant="outline" className="ml-auto">{filledCount}/7 dimensioner ifyllda</Badge>
      </div>

      {/* Matrix header (desktop only) */}
      <div className="hidden md:grid grid-cols-[110px_1fr_1fr] gap-2 text-xs font-semibold text-muted-foreground">
        <div />
        <div className="text-emerald-600 dark:text-emerald-400">
          {isZh ? "【是】确认为真 (IS)" : "ÄR (Is)"}
        </div>
        <div className="text-rose-600 dark:text-rose-400">
          {isZh ? "【不是】明确排除 (IS NOT)" : "ÄR INTE (Is Not)"}
        </div>
      </div>

      {DIMENSIONS.map(d => (
        <div key={d.key} className="grid grid-cols-1 md:grid-cols-[110px_1fr_1fr] gap-2 items-start">
          <div className="md:pt-2">
            <Badge variant="secondary" className="font-semibold">{d.label}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="md:hidden text-xs text-emerald-600 dark:text-emerald-400">
              {isZh ? "【是】— " : "ÄR — "}{d.hint}
            </Label>
            <Textarea
              value={matrix[d.key].is}
              onChange={e => update(d.key, "is", e.target.value)}
              placeholder={d.hint}
              className="text-sm h-16 resize-none border-emerald-200 dark:border-emerald-900/40 focus-visible:ring-emerald-500/30"
            />
          </div>
          <div className="space-y-1">
            <Label className="md:hidden text-xs text-rose-600 dark:text-rose-400">
              {isZh ? "【不是】— " : "ÄR INTE — "}{d.hintNot}
            </Label>
            <Textarea
              value={matrix[d.key].isNot}
              onChange={e => update(d.key, "isNot", e.target.value)}
              placeholder={d.hintNot}
              className="text-sm h-16 resize-none border-rose-200 dark:border-rose-900/40 focus-visible:ring-rose-500/30"
            />
          </div>
        </div>
      ))}

      {draft && (
        <Card className="p-3 space-y-3 bg-muted/40">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold">
                📝 {isZh ? "问题陈述规范草稿 (5W2H 合成)" : "Problem Statement (Draft)"}
              </p>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy("ps", draft.statement)}>
                {copied === "ps" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-xs text-foreground bg-background p-2.5 rounded border leading-relaxed italic">{draft.statement}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold">
                🎯 {isZh ? "项目边界范围界定 (In-Scope / Out-of-Scope)" : "Project Scope (Draft)"}
              </p>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy("sc", draft.scope)}>
                {copied === "sc" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground whitespace-pre-line bg-background p-2.5 rounded border">{draft.scope}</p>
          </div>
        </Card>
      )}

      <div>
        <Button onClick={runAI} disabled={loading || !canAI} size="sm" className="w-full" variant="default">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {isZh ? "调用 AI 智能润色与结构化提炼 (Gemini)" : "Optimize with AI (Gemini)"}
        </Button>
        {!canAI && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {isZh ? "请至少填写 4 个以上维度以激活 AI 智能提炼功能。" : "Fill in at least 4 dimensions to activate AI synthesis."}
          </p>
        )}
      </div>

      {aiOut && (
        <Card className="p-3 space-y-3 border-primary/40 bg-primary/5">
          {aiOut.warning && (
            <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ {aiOut.warning}</p>
          )}
          {aiOut.problemStatement && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-primary">
                  ✨ {isZh ? "AI 优化精炼的问题陈述" : "AI-Enhanced Problem Statement"}
                </p>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy("aips", aiOut.problemStatement!)}>
                  {copied === "aips" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <p className="text-xs whitespace-pre-line leading-relaxed">{aiOut.problemStatement}</p>
            </div>
          )}
          {aiOut.scope && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-primary">
                  ✨ {isZh ? "AI 结构化项目边界界定" : "AI-Enhanced Scope Definition"}
                </p>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy("aisc", aiOut.scope!)}>
                  {copied === "aisc" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <p className="text-xs whitespace-pre-line leading-relaxed">{aiOut.scope}</p>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground italic border-t pt-1.5">
            {isZh 
              ? "💡 提示：在将此草稿复制到项目章程 (Project Charter) 之前，请结合工艺常识复核确认。" 
              : "Review carefully before transferring into your Project Charter."}
          </p>
        </Card>
      )}

      <CalculatorSaveButton
        canSave={canSave}
        isSaving={isSaving}
        hasResult={hasResult}
        notes={notes}
        onNotesChange={setNotes}
        onSave={() => saveCalculation({
          toolId, toolName, phase,
          inputs: { matrix, ai: aiOut },
          results: {
            filledDimensions: filledCount,
            problemStatement: aiOut?.problemStatement || (draft?.statement ?? ""),
            scope: aiOut?.scope || (draft?.scope ?? ""),
          },
        })}
      />
    </div>
  );
}
