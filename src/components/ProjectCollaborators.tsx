import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Trash2, Loader2, Crown } from "lucide-react";

interface Collaborator {
  id: string;
  user_id: string;
  user_email: string | null;
  role: string;
  created_at: string;
}

interface ProjectCollaboratorsProps {
  projectId: string;
  isOwner: boolean;
  currentUserId: string;
}

export function ProjectCollaborators({
  projectId,
  isOwner,
  currentUserId,
}: ProjectCollaboratorsProps) {
  const { locale } = useLanguage();
  const isZh = locale === "zh";

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("editor");
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCollaborators();
  }, [projectId]);

  const fetchCollaborators = async () => {
    setIsLoading(true);
    // Use the secure view that hides emails from non-owners
    // The view returns user_email as NULL for non-owners
    const { data, error } = await supabase
      .rpc("get_project_collaborators_safe" as any, { _project_id: projectId });

    if (!error && data) {
      setCollaborators(data as Collaborator[]);
    } else {
      console.error("Failed to fetch collaborators:", error);
      setCollaborators([]);
    }
    setIsLoading(false);
  };

  const inviteCollaborator = async () => {
    if (!email.trim()) {
      toast({ title: isZh ? "请输入电子邮箱" : "Please enter an email address", variant: "destructive" });
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({ title: isZh ? "邮箱格式不正确" : "Invalid email address", variant: "destructive" });
      return;
    }

    setIsInviting(true);

    // Check if already invited locally (for immediate feedback)
    const existingCollaborator = collaborators.find(
      (c) => c.user_email && c.user_email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existingCollaborator) {
      toast({ title: isZh ? "该用户已在团队协作成员列表中" : "User is already invited", variant: "destructive" });
      setIsInviting(false);
      return;
    }

    try {
      // Use Edge Function to properly look up user and create collaborator record
      const { data, error } = await supabase.functions.invoke("invite-collaborator", {
        body: {
          email: email.trim().toLowerCase(),
          project_id: projectId,
          role: role,
        },
      });

      setIsInviting(false);

      if (error) {
        console.error("Edge function error:", error);
        toast({ title: isZh ? "邀请成员失败" : "Failed to invite user", variant: "destructive" });
        return;
      }

      if (data?.error) {
        // Handle specific error messages from the edge function
        if (data.error.includes("not found")) {
          toast({ 
            title: isZh ? "未找到该用户账户" : "User not found", 
            description: isZh ? "被邀请人须先在本系统注册账号方可加入团队。" : "The user must register an account first before being invited.",
            variant: "destructive" 
          });
        } else if (data.error.includes("already a collaborator")) {
          toast({ title: isZh ? "该用户已是项目协作者" : "User is already a collaborator", variant: "destructive" });
        } else if (data.error.includes("yourself")) {
          toast({ title: isZh ? "不能邀请自己为协作者" : "You cannot invite yourself", variant: "destructive" });
        } else {
          toast({ title: data.error, variant: "destructive" });
        }
        return;
      }

      if (data?.success && data?.collaborator) {
        toast({ title: isZh ? `已成功邀请 ${email}（权限：${role === "editor" ? "编辑者" : "仅查看"}）` : `${email} invited as ${role === "editor" ? "Editor" : "Viewer"}` });
        setCollaborators([...collaborators, data.collaborator]);
        setEmail("");
        setRole("editor");
        setIsDialogOpen(false);
      }
    } catch (err) {
      console.error("Invitation error:", err);
      setIsInviting(false);
      toast({ title: isZh ? "发生意外网络错误" : "An unexpected error occurred", variant: "destructive" });
    }
  };

  const removeCollaborator = async (collaboratorId: string, collaboratorEmail: string | null) => {
    if (!confirm(isZh ? `确认从本项目中移除协作者 ${collaboratorEmail || '该成员'} 吗？` : `Remove ${collaboratorEmail || 'this collaborator'} from the project?`)) return;

    const { error } = await supabase
      .from("project_collaborators")
      .delete()
      .eq("id", collaboratorId);

    if (!error) {
      setCollaborators(collaborators.filter((c) => c.id !== collaboratorId));
      toast({ title: isZh ? "成员已成功移除" : "Collaborator removed" });
    } else {
      toast({ title: isZh ? "移除成员失败" : "Failed to remove collaborator", variant: "destructive" });
    }
  };

  const updateRole = async (collaboratorId: string, newRole: string) => {
    const { error } = await supabase
      .from("project_collaborators")
      .update({ role: newRole })
      .eq("id", collaboratorId);

    if (!error) {
      setCollaborators(
        collaborators.map((c) =>
          c.id === collaboratorId ? { ...c, role: newRole } : c
        )
      );
      toast({ title: isZh ? "成员权限已更新" : "Role updated" });
    } else {
      toast({ title: isZh ? "更新权限失败" : "Failed to update role", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{isZh ? "加载中..." : "Loading..."}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Collaborator avatars/count */}
      {collaborators.length > 0 && (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-white/80" />
          <span className="text-sm text-white/80">
            {collaborators.length} {isZh ? "位协作者" : (collaborators.length !== 1 ? "collaborators" : "collaborator")}
          </span>
        </div>
      )}

      {/* Manage collaborators dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/20 border-white/40 text-white hover:bg-white/30"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isOwner ? (isZh ? "共享协作" : "Share") : (isZh ? "查看团队" : "View Team")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isZh ? "项目跨职能团队" : "Project Team"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Invite form - only for owners */}
            {isOwner && (
              <div className="space-y-3 pb-4 border-b">
                <Label>{isZh ? "邀请新团队成员" : "Invite Collaborator"}</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={isZh ? "输入成员电子邮箱" : "Email address"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={role} onValueChange={(v) => setRole(v as "viewer" | "editor")}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">{isZh ? "编辑者" : "Editor"}</SelectItem>
                      <SelectItem value="viewer">{isZh ? "仅查看" : "Viewer"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={inviteCollaborator}
                  disabled={isInviting || !email.trim()}
                  className="w-full"
                >
                  {isInviting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {isZh ? "发送邀请" : "Invite"}
                </Button>
              </div>
            )}

            {/* Team list */}
            <div className="space-y-2">
              <Label>{isZh ? "团队现有成员" : "Team Members"}</Label>

              {/* Owner indicator */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{isZh ? "您 (项目负责人/Owner)" : "You (Owner)"}</span>
                </div>
                <Badge>{isZh ? "负责人" : "Owner"}</Badge>
              </div>

              {/* Collaborators */}
              {collaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isZh ? "暂无其他协作者" : "No other collaborators yet"}
                </p>
              ) : (
                collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {collab.user_email || (isZh ? "协作者" : "Collaborator")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isZh ? "加入时间:" : "Added"} {new Date(collab.created_at).toLocaleDateString(isZh ? "zh-CN" : "sv-SE")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <>
                          <Select
                            value={collab.role}
                            onValueChange={(v) => updateRole(collab.id, v)}
                          >
                            <SelectTrigger className="w-[110px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">{isZh ? "编辑者" : "Editor"}</SelectItem>
                              <SelectItem value="viewer">{isZh ? "仅查看" : "Viewer"}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeCollaborator(collab.id, collab.user_email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary">
                          {collab.role === "editor" ? (isZh ? "编辑者" : "Editor") : (isZh ? "仅查看" : "Viewer")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
