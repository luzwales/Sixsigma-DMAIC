import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderOpen, Trash2, Loader2, Users } from "lucide-react";
import { phases } from "@/data/dmaic-tools";
import { useLanguage } from "@/i18n/LanguageContext";

interface Project {
  id: string;
  name: string;
  description: string | null;
  current_phase: number;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
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

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectSavings, setNewProjectSavings] = useState("");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { locale, t } = useLanguage();
  const isZh = locale === "zh";

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("fetchProjects error:", error);
        toast({ 
          title: isZh ? "获取项目列表失败" : "Failed to load projects", 
          description: error.message || (isZh ? "请检查权限或网络连接。" : "Check your permissions or network connection."),
          variant: "destructive" 
        });
      } else {
        setProjects(data || []);
      }
    } catch (err: any) {
      console.error("fetchProjects exception:", err);
      toast({ 
        title: isZh ? "获取项目列表异常" : "Failed to load projects", 
        description: err.message || (isZh ? "发生意外网络错误。" : "An unexpected error occurred."),
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast({ 
        title: isZh ? "请输入项目名称" : "Please enter a project name", 
        variant: "destructive" 
      });
      return;
    }

    setIsCreating(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || null,
        user_id: user!.id,
        current_phase: 1,
        status: "active",
        estimated_savings: newProjectSavings ? Number(newProjectSavings) : null
      })
      .select()
      .single();

    setIsCreating(false);

    if (error) {
      toast({ 
        title: isZh ? "立项创建失败" : "Failed to create project", 
        variant: "destructive" 
      });
    } else {
      toast({ title: isZh ? "新项目已成功创建！" : "Project created successfully!" });
      setProjects([data, ...projects]);
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectSavings("");
      setIsDialogOpen(false);
      navigate(`/project/${data.id}`);
    }
  };

  const deleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(isZh ? "确认彻底删除该改善项目吗？删除后所有阶段记录均不可恢复。" : "Are you sure you want to delete this project? All phase data will be permanently removed.")) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      toast({ 
        title: isZh ? "删除项目失败" : "Failed to delete project", 
        variant: "destructive" 
      });
    } else {
      toast({ title: isZh ? "项目已成功删除" : "Project deleted" });
      setProjects(projects.filter((p) => p.id !== projectId));
    }
  };

  const getPhaseInfo = (phaseNumber: number) => {
    return phases.find((p) => p.id === phaseNumber) || phases[0];
  };

  const localizeProjectName = (name: string) => {
    if (!name) return name;
    if (name.includes("Optimering av monteringstid") || name.includes("装配 3 线工时与过程变异优化") || name.includes("Assembly Line 3 Cycle Time")) {
      return isZh ? "装配 3 线工时与过程变异优化" : "Assembly Line 3 Cycle Time & Variation Optimization";
    }
    return name;
  };

  const localizeProjectDesc = (desc: string | null) => {
    if (!desc) return desc;
    if (desc.includes("Sex Sigma-projekt för att reducera cykeltid") || desc.includes("精益六西格玛黑带改善项目") || desc.includes("Six Sigma DMAIC project to reduce cycle time")) {
      return isZh
        ? "精益六西格玛黑带改善项目：大幅降低装配 3 线周期时间波动与返修浪费，建立防错装配标准工法。"
        : "Six Sigma DMAIC project to reduce cycle time variability and defect rates across Assembly Line 3.";
    }
    return desc;
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold">{isZh ? "我的改善项目" : "My Projects"}</h1>
                <p className="text-muted-foreground mt-1">
                  {isZh ? "管理与跟踪您的六西格玛 DMAIC 黑带与绿带项目" : "Manage and track your DMAIC projects"}
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {isZh ? "创建新项目" : "New Project"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isZh ? "立项：创建 DMAIC 项目" : "Create New Project"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-name">{isZh ? "项目名称 (Project Name)" : "Project Name"}</Label>
                      <Input
                        id="project-name"
                        placeholder={isZh ? "如：2号线注塑门护板缩水缺陷率降低项目" : "e.g. Q1 Defect Reduction"}
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-desc">{isZh ? "项目背景与目标说明 (可选)" : "Description (Optional)"}</Label>
                      <Textarea
                        id="project-desc"
                        placeholder={isZh ? "简要描述业务痛点、基准现状及预期目标..." : "Describe project scope and goal..."}
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-savings">{isZh ? "预期年化财务硬节省 (元/SEK，可选)" : "Estimated Savings (Optional)"}</Label>
                      <Input
                        id="project-savings"
                        type="number"
                        placeholder={isZh ? "如：500000" : "e.g. 500000"}
                        value={newProjectSavings}
                        onChange={(e) => setNewProjectSavings(e.target.value)}
                      />
                    </div>
                    <Button onClick={createProject} className="w-full" disabled={isCreating}>
                      {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {isZh ? "确认立项并初始化" : "Create Project"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {projects.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{isZh ? "暂无改善项目" : "No projects yet"}</h3>
                  <p className="text-muted-foreground mb-4">
                    {isZh ? "创建您的第一个 DMAIC 黑带攻坚项目，开启系统化持续改善之旅" : "Create your first DMAIC project to get started"}
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isZh ? "立即创建项目" : "Create Project"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => {
                  const phaseVal = Number(project.current_phase) || 1;
                  const phase = getPhaseInfo(phaseVal);
                  return (
                    <Link to={`/project/${project.id}`} key={project.id}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <CardTitle className="text-xl">{localizeProjectName(project.name)}</CardTitle>
                                {project.user_id !== user?.id && (
                                  <Badge variant="outline" className="gap-1">
                                    <Users className="h-3 w-3" />
                                    {isZh ? "团队共享" : "Shared"}
                                  </Badge>
                                )}
                                <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                                  {project.status === "active" 
                                    ? (isZh ? "进行中" : "Active") 
                                    : project.status === "completed" 
                                    ? (isZh ? "已结案" : "Completed") 
                                    : (isZh ? "已归档" : "Archived")}
                                </Badge>
                              </div>
                              {project.description && (
                                <CardDescription>{localizeProjectDesc(project.description)}</CardDescription>
                              )}
                            </div>
                            {project.user_id === user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={(e) => deleteProject(project.id, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{phase.icon}</span>
                              <div>
                                <div className="text-sm font-medium">
                                  {isZh 
                                    ? `第 ${phase.id} 阶段: ${phase.nameZh || phase.name}` 
                                    : `Phase ${phase.id}: ${phase.name}`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {isZh ? "最近更新于 " : "Updated "}
                                  {parseSafeDate(project.updated_at).toLocaleDateString(isZh ? "zh-CN" : "sv-SE")}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {phases.map((p) => (
                                <div
                                  key={p.id}
                                  className={`h-2 w-6 rounded-full ${
                                    p.id <= phaseVal
                                      ? "bg-primary"
                                      : "bg-muted"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
