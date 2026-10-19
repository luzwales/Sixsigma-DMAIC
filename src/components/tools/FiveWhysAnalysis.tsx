import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RotateCcw, ArrowDown } from "lucide-react";
import { useCalculatorSave } from "@/hooks/useCalculatorSave";
import { CalculatorSaveButton } from "@/components/calculators/CalculatorSaveButton";
import { CalculatorLoadButton } from "@/components/calculators/CalculatorLoadButton";
import { ExampleDataButton } from "@/components/calculators/ExampleDataButton";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface WhyChain {
  id: string;
  problem: string;
  whys: string[];
  rootCause: string;
  countermeasure: string;
}

interface FiveWhysAnalysisProps {
  toolId?: string;
  toolName?: string;
  phase?: number;
}

export function FiveWhysAnalysis({ toolId = "5-whys", toolName = "5 Varför", phase = 2 }: FiveWhysAnalysisProps) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [chains, setChains] = useState<WhyChain[]>([
    { id: crypto.randomUUID(), problem: "", whys: [""], rootCause: "", countermeasure: "" },
  ]);
  const [activeChain, setActiveChain] = useState(0);

  const handleLoad = useCallback((inputs: Record<string, unknown>) => {
    const loaded = inputs.chains as any[];
    if (Array.isArray(loaded)) {
      setChains(loaded.map(c => ({
        id: crypto.randomUUID(),
        problem: String(c.problem || ""),
        whys: Array.isArray(c.whys) ? c.whys.map(String) : [""],
        rootCause: String(c.rootCause || ""),
        countermeasure: String(c.countermeasure || ""),
      })));
      setActiveChain(0);
    }
  }, []);

  const { canSave, isSaving, notes, setNotes, saveCalculation, savedCalculation, isLoadingSaved } = useCalculatorSave(toolId, handleLoad);

  const chain = chains[activeChain];

  const updateChain = (updates: Partial<WhyChain>) => {
    setChains((prev) =>
      prev.map((c, i) => (i === activeChain ? { ...c, ...updates } : c))
    );
  };

  const addWhy = () => {
    if (chain.whys.length < 7) {
      updateChain({ whys: [...chain.whys, ""] });
    }
  };

  const updateWhy = (index: number, value: string) => {
    const newWhys = [...chain.whys];
    newWhys[index] = value;
    updateChain({ whys: newWhys });
  };

  const removeWhy = (index: number) => {
    if (chain.whys.length > 1) {
      updateChain({ whys: chain.whys.filter((_, i) => i !== index) });
    }
  };

  const addChain = () => {
    setChains((prev) => [
      ...prev,
      { id: crypto.randomUUID(), problem: "", whys: [""], rootCause: "", countermeasure: "" },
    ]);
    setActiveChain(chains.length);
  };

  const resetChain = () => {
    updateChain({ problem: "", whys: [""], rootCause: "", countermeasure: "" });
  };

  const loadExample = () => {
    if (isZh) {
      setChains([{
        id: crypto.randomUUID(),
        problem: "2号注塑机生产的门护板表面持续出现凹陷缩水",
        whys: [
          "模具型腔局部胶料冷却补缩不足，导致塑件固化时体积收缩下陷",
          "注塑机保压阶段进入型腔的熔胶量不足以补偿收缩量",
          "注塑机实际保压压力与保压时间均低于工艺卡基准设定值 (85 bar vs 110 bar)",
          "夜班调机师傅在换料后为缩短成型周期，私自调低了保压设定参数",
          "车间工艺参数变更缺乏系统密码权限锁定机制与开班工艺点检核准制度",
        ],
        rootCause: "注塑参数防呆授权与工艺纪律闭环点检体系缺失，导致现场私自下调关键保压参数",
        countermeasure: "1. 为所有注塑机控制器设置工艺参数权限密码锁；2. 建立开班工艺参数扫码对比核准放行看板；3. 实施工艺防错机制 (Poka-Yoke)。",
      }]);
    } else {
      setChains([{
        id: crypto.randomUUID(),
        problem: "Customer shipments are regularly delayed",
        whys: [
          "The pick list is generated too late in the afternoon",
          "Warehouse staff receive orders only after lunch",
          "Orders are held in credit checks throughout the morning",
          "Manual credit reviews are bottlenecked by a single staff member",
          "No automated approval rule exists for established low-risk accounts",
        ],
        rootCause: "Lack of automated credit approval logic for repeat, low-risk customers",
        countermeasure: "Implement automated ERP credit release for tier-A accounts with >12 months flawless history",
      }]);
    }
    setActiveChain(0);
  };



  const filledWhys = chain.whys.filter((w) => w.trim()).length;
  const hasResult = !!chain.rootCause.trim();

  const handleSave = () => {
    saveCalculation({
      toolId,
      toolName,
      phase,
      inputs: { chains: chains.map(c => ({ problem: c.problem, whys: c.whys, rootCause: c.rootCause, countermeasure: c.countermeasure })) },
      results: { chains: chains.map(c => ({ rootCause: c.rootCause, countermeasure: c.countermeasure, whyCount: c.whys.filter(w => w.trim()).length })) },
    });
  };

  return (
    <div className="space-y-4">
      <CalculatorLoadButton savedCalculation={savedCalculation} isLoading={isLoadingSaved} onLoad={handleLoad} />
      <ExampleDataButton onLoad={loadExample} />

      {chains.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {chains.map((c, i) => (
            <Button key={c.id} size="sm" variant={i === activeChain ? "default" : "outline"} onClick={() => setActiveChain(i)}>
              {isZh ? `因果链 ${i + 1}` : `Chain ${i + 1}`}
            </Button>
          ))}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-foreground">
          {isZh ? "待分析的明确缺陷问题 (Problem Statement)" : "Problem Statement"}
        </label>
        <Input 
          placeholder={isZh ? "清晰量化描述现场观测到的异常事实..." : "Describe the observed problem..."} 
          value={chain.problem} 
          onChange={(e) => updateChain({ problem: e.target.value })} 
          className="mt-1" 
        />
      </div>

      <div className="space-y-2">
        {chain.whys.map((why, index) => (
          <div key={index}>
            {index > 0 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex gap-2 items-start">
              <Badge variant="secondary" className="mt-2 shrink-0 min-w-[80px] justify-center">
                {isZh ? `第 ${index + 1} 个为什么` : `Why ${index + 1}`}
              </Badge>
              <Input
                placeholder={
                  index === 0 
                    ? (isZh ? "为什么会发生这个直接问题？" : "Why did this immediate problem occur?") 
                    : (isZh 
                        ? `为什么上述原因会导致异常？` 
                        : `Why did the preceding cause happen?`)
                }
                value={why}
                onChange={(e) => updateWhy(index, e.target.value)}
                className="flex-1"
              />
              {chain.whys.length > 1 && (
                <Button size="icon" variant="ghost" onClick={() => removeWhy(index)} className="shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={addWhy} disabled={chain.whys.length >= 7}>
          <Plus className="h-3 w-3 mr-1" /> {isZh ? "增加一层'为什么' (Why)" : "Add Why"}
        </Button>
      </div>

      {filledWhys >= 2 && (
        <div className="border-t pt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">
              {isZh ? "系统性根本原因 (Root Cause)" : "Root Cause (Conclusion)"}
            </label>
            <Textarea 
              placeholder={isZh ? "归纳经过 5 次深挖锁定的管理机制或工程物理本质机理..." : "Summarize identified fundamental root cause..."} 
              value={chain.rootCause} 
              onChange={(e) => updateChain({ rootCause: e.target.value })} 
              className="mt-1" 
              rows={2} 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">
              {isZh ? "不可逆防错纠正对策 (Countermeasure / Poka-Yoke)" : "Proposed Countermeasure"}
            </label>
            <Textarea 
              placeholder={isZh ? "针对根本原因制定的防呆防错对策，彻底消除再次发生的诱因..." : "Action plan to eliminate root cause permanently..."} 
              value={chain.countermeasure} 
              onChange={(e) => updateChain({ countermeasure: e.target.value })} 
              className="mt-1" 
              rows={2} 
            />
          </div>
        </div>
      )}

      {chain.rootCause && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
          <p className="font-semibold text-foreground">
            {isZh ? "🎯 5-Whys 根因分析总结" : "🎯 5-Whys Summary"}
          </p>
          <p><span className="text-muted-foreground">{isZh ? "表面问题:" : "Problem:"}</span> {chain.problem}</p>
          <p><span className="text-muted-foreground">{isZh ? "深挖层数:" : "Analysis Depth:"}</span> {filledWhys}</p>
          <p><span className="text-muted-foreground">{isZh ? "系统根因:" : "Root Cause:"}</span> {chain.rootCause}</p>
          <p><span className="text-muted-foreground">{isZh ? "固化对策:" : "Countermeasure:"}</span> {chain.countermeasure}</p>
        </div>
      )}

      <CalculatorSaveButton canSave={canSave} isSaving={isSaving} hasResult={hasResult} notes={notes} onNotesChange={setNotes} onSave={handleSave} />

      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={resetChain}>
          <RotateCcw className="h-3 w-3 mr-1" /> {isZh ? "重置本链" : "Reset"}
        </Button>
        <Button size="sm" variant="outline" onClick={addChain}>
          <Plus className="h-3 w-3 mr-1" /> {isZh ? "开启新因果链" : "New Chain"}
        </Button>
      </div>
    </div>
  );
}
