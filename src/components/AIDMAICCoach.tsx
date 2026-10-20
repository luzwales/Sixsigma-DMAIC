import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Brain, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface AIDMAICCoachProps {
  projectId: string;
  projectName: string;
}

export function AIDMAICCoach({ projectId, projectName }: AIDMAICCoachProps) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const runCoach = async (userQuestion?: string) => {
    setIsLoading(true);
    setResponse("");
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error(isZh ? "未登录账号" : "Not authenticated");

      // 1. Fetch relevant project metrics from our local client (Firestore synced)
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      const { data: notesData } = await supabase
        .from("project_notes")
        .select("*")
        .eq("project_id", projectId);

      const { data: calcsData } = await supabase
        .from("project_calculations")
        .select("*")
        .eq("project_id", projectId);

      const { data: tollgateData } = await supabase
        .from("tollgate_items")
        .select("*")
        .eq("project_id", projectId);

      const { data: sigmaData } = await supabase
        .from("sigma_tracking")
        .select("*")
        .eq("project_id", projectId);

      // 2. Call our local AI Coach backend
      const url = `/api/ai-dmaic-coach`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: projectData?.name || projectName,
          projectDescription: projectData?.description || "",
          currentPhase: projectData?.current_phase ?? 0,
          notes: notesData || [],
          tollgateItems: tollgateData || [],
          sigmaEntries: sigmaData || [],
          calculations: calcsData || [],
          question: userQuestion || ""
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: isZh ? "未知网络异常" : "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.text) {
        throw new Error(isZh ? "AI 导师未返回分析建议。" : "Empty response from AI Coach.");
      }
      setResponse(data.text);
    } catch (e) {
      toast({
        title: isZh ? "AI 导师助手异常" : "AI Coach Error",
        description: e instanceof Error ? e.message : (isZh ? "未知错误" : "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAsk = () => {
    const q = question.trim();
    if (!q) return;
    runCoach(q);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-50 shadow-2xl rounded-full h-14 w-14 p-0 bg-gradient-to-br from-primary to-primary/70 hover:scale-110 transition-transform"
          aria-label={isZh ? "打开 AI 六西格玛导师" : "Open AI DMAIC Coach"}
        >
          <Brain className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isZh ? "AI 六西格玛黑带导师" : "AI DMAIC Coach"}
          </SheetTitle>
          <SheetDescription>
            {isZh 
              ? <>针对当前项目 <span className="font-medium text-foreground">{projectName}</span> 的实测指标与交付物进行深度辅导诊断。</>
              : <>Methodological coaching for <span className="font-medium">{projectName}</span> based on your real project metrics.</>}
          </SheetDescription>
        </SheetHeader>

        <div className="flex gap-2">
          <Button
            onClick={() => runCoach()}
            disabled={isLoading}
            className="flex-1 gap-2"
            variant="default"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isZh ? "立即对本项目进行黑带诊断" : "Coach My Project Now"}
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={isZh ? "咨询任何六西格玛问题...（例如：当前数据准备好进入改善期了吗？）" : "Ask a question... (e.g. 'Are we ready for Improve phase?')"}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) handleAsk();
            }}
            disabled={isLoading}
          />
          <Button onClick={handleAsk} disabled={isLoading || !question.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-4">
          {!response && !isLoading && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>{isZh ? "点击上方「立即对本项目进行黑带诊断」获取个性化指导建议，" : "Click 'Coach My Project Now' for personalized feedback,"}</p>
              <p>{isZh ? "或在下方输入框中提出具体攻坚疑问。" : "or ask a specific methodology question below."}</p>
            </div>
          )}
          {isLoading && !response && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isZh ? "AI 黑带导师正在深度推演项目数据..." : "Analyzing project data..."}
            </div>
          )}
          {response && (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
