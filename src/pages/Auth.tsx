import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import firebaseConfig from "../../firebase-applet-config.json";
import { useLanguage } from "@/i18n/LanguageContext";

const GoogleIcon = () => (
  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Auth() {
  const { locale, t } = useLanguage();
  const isZh = locale === "zh";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/projects");
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: isZh ? "请填写所有必填字段" : "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      console.error("Sign in failed:", error);
      let message = isZh ? "登录失败" : "Sign in failed";
      let description = error.message || (isZh ? "发生未知错误。" : "An unknown error occurred.");
      
      const errMsg = error.message || "";
      const errCode = (error as any).code || "";
      
      if (errCode === "auth/invalid-credential" || errCode === "auth/user-not-found" || errCode === "auth/wrong-password" || errMsg.includes("invalid-credential")) {
        message = isZh ? "邮箱或密码错误" : "Invalid email or password";
        description = isZh ? "请确认输入信息无误，或切换至注册标签创建新账号。" : "Please check your credentials or create a new account.";
      } else if (errCode === "auth/operation-not-allowed" || errMsg.includes("operation-not-allowed")) {
        message = isZh ? "未启用登录方式" : "Method not enabled";
        description = isZh ? "请在 Firebase Console 的 Authentication -> Sign-in method 中启用 Email/Password。" : "Email/Password sign-in is disabled in your Firebase console.";
        setShowHelp(true);
      } else if (errCode === "auth/unauthorized-domain" || errMsg.includes("unauthorized-domain")) {
        message = isZh ? "未授权域名" : "Unauthorized domain";
        description = isZh ? `当前域名 (${window.location.hostname}) 尚未添加到 Firebase 授权域名列表中。` : `Domain (${window.location.hostname}) is not authorized in Firebase Console.`;
        setShowHelp(true);
      }
      
      toast({ 
        title: message, 
        description: description, 
        variant: "destructive" 
      });
    } else {
      toast({ title: isZh ? "登录成功！" : "Signed in successfully!" });
      navigate("/projects");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: isZh ? "请填写所有必填字段" : "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: isZh ? "密码长度至少需要 6 位字符" : "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, displayName);
    setIsLoading(false);

    if (error) {
      console.error("Sign up failed:", error);
      let message = isZh ? "注册失败" : "Sign up failed";
      let description = error.message || (isZh ? "发生未知错误。" : "An unknown error occurred.");
      
      const errMsg = error.message || "";
      const errCode = (error as any).code || "";
      
      if (errCode === "auth/email-already-in-use" || errMsg.includes("already-in-use") || errMsg.includes("already registered")) {
        message = isZh ? "该邮箱已被注册" : "Email already registered";
        description = isZh ? "该电子邮箱已被占用，请直接登录。" : "An account already exists with this email address. Please sign in.";
      } else if (errCode === "auth/operation-not-allowed" || errMsg.includes("operation-not-allowed")) {
        message = isZh ? "注册功能受限" : "Registration restricted";
        description = isZh ? "请在 Firebase 控制台中开启 Email/Password 认证方式。" : "Email/Password is not enabled in Firebase Console.";
        setShowHelp(true);
      } else if (errCode === "auth/weak-password" || errMsg.includes("weak-password")) {
        message = isZh ? "密码强度不足" : "Weak password";
        description = isZh ? "请设置至少 6 位长度的密码。" : "Please choose a password with at least 6 characters.";
      }
      
      toast({ 
        title: message, 
        description: description, 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: isZh ? "账号创建成功！" : "Account created!", 
        description: isZh ? "您已成功注册并登录。" : "Your account has been created." 
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/projects",
      },
    });
    setIsLoading(false);
    if (error) {
      console.error("Google Auth error:", error);
      let errorDesc = error.message || (isZh ? "发生未知错误。" : "An unknown error occurred.");
      if (error.code === "auth/unauthorized-domain" || error.message?.includes("auth/unauthorized-domain") || error.message?.includes("unauthorized-domain")) {
        errorDesc = isZh ? `域名 "${window.location.hostname}" 尚未添加到 Firebase 授权域名列表中。` : `Domain "${window.location.hostname}" is not authorized in Firebase.`;
        setShowHelp(true);
      } else if (error.code === "auth/popup-closed-by-user" || error.message?.includes("popup-closed-by-user") || error.message?.includes("closed by user")) {
        errorDesc = isZh ? "登录弹窗在认证完成前被关闭。" : "The sign-in popup was closed before completion.";
      } else if (error.code === "auth/operation-not-allowed" || error.message?.includes("operation-not-allowed")) {
        errorDesc = isZh ? "Firebase 项目尚未开启 Google 登录提供商。" : "Google sign-in is not enabled in your Firebase project.";
        setShowHelp(true);
      } else if (error.message?.includes("third-party cookies") || error.message?.includes("cookie")) {
        errorDesc = isZh ? "浏览器阻止了第三方 Cookie，建议在新标签页中打开。" : "Browser blocked 3rd-party cookies. Try opening in a new tab.";
        setShowHelp(true);
      }
      
      toast({ 
        title: isZh ? "Google 登录未成功" : "Google sign-in failed", 
        description: errorDesc, 
        variant: "destructive" 
      });
    }
  };

  const handleLocalSandboxMode = () => {
    setIsLoading(true);
    localStorage.setItem("dmaic_local_mode", "true");
    
    const user = {
      id: "local-sandbox-user",
      email: "engineer@sixsigma.local",
      user_metadata: { display_name: isZh ? "黑带工程师 (演示账号)" : "Demo Engineer" }
    };
    const session = {
      access_token: "mock-token-local",
      user
    };
    localStorage.setItem("dmaic_mock_session", JSON.stringify(session));
    
    toast({ 
      title: isZh ? "欢迎进入离线沙箱演示模式！" : "Welcome!", 
      description: isZh ? "所有项目数据将安全保存在您的本地浏览器中，无需配置远程云端。" : "Running in local demo mode. Data is stored directly in your browser." 
    });
    
    setTimeout(() => {
      // Force reload to completely refresh the hook state
      window.location.reload();
    }, 500);
  };

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                  {isZh ? "欢迎使用六西格玛工具箱" : "Welcome to DMAIC Suite"}
                </CardTitle>
                <CardDescription>
                  {isZh ? "登录以同步并保存您的 DMAIC 改善项目、分析日志与计算器数据" : "Sign in to sync your DMAIC projects, logs, and calculator data"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin">{isZh ? "账号登录" : "Sign In"}</TabsTrigger>
                    <TabsTrigger value="signup">{isZh ? "免费注册" : "Register"}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">{isZh ? "工作电子邮箱 (Email)" : "Email"}</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder={isZh ? "your-name@company.com" : "engineer@company.com"}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">{isZh ? "登录密码" : "Password"}</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isZh ? "登录系统" : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">{isZh ? "姓名 / 称谓 (可选)" : "Full Name (Optional)"}</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder={isZh ? "例如：张工程师" : "e.g. John Doe"}
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">{isZh ? "工作电子邮箱 (Email)" : "Email"}</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder={isZh ? "your-name@company.com" : "engineer@company.com"}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">{isZh ? "设置登录密码 (至少6位)" : "Password (Min 6 chars)"}</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder={isZh ? "不少于6位字符" : "At least 6 characters"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isZh ? "创建并激活账号" : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{isZh ? "或者" : "or"}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-3"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <GoogleIcon />
                  {isZh ? "使用 Google 账号一键登录" : "Continue with Google"}
                </Button>

                <Button
                  type="button"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all hover:shadow-md"
                  onClick={handleLocalSandboxMode}
                  disabled={isLoading}
                >
                  {isZh ? "进入本地演示/沙箱模式 (无需登录)" : "Start in Local Demo Mode (No Login Required)"}
                </Button>

                <div className="mt-6 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="flex items-center justify-between w-full text-left text-xs font-semibold text-muted-foreground hover:text-foreground transition-all py-1 animate-pulse"
                  >
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      {isZh ? "遇到认证疑问？查看配置指引" : "Trouble signing in? Click for help"}
                    </span>
                    {showHelp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {showHelp && (
                    <div className="mt-3 space-y-3.5 text-xs text-muted-foreground bg-muted/60 p-4 rounded-lg border border-border/80">
                      <p className="leading-relaxed">
                        {isZh 
                          ? "应用在沙箱或容器环境中运行时，部分浏览器可能会拦截第三方 Cookie 或认证弹窗。" 
                          : "When running inside sandbox frames, certain browsers may block third-party cookies or popups."}
                      </p>

                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</div>
                          <div>
                            <strong className="text-foreground block mb-0.5">{isZh ? "本地演示模式 (推荐直接体验)" : "Local Demo Mode (Recommended)"}</strong>
                            {isZh 
                              ? "点击上方的「进入本地演示/沙箱模式」，即可立即体验项目管理、六西格玛计算器和数据分析等全部核心功能。" 
                              : "Click 'Start in Local Demo Mode' above to explore all features instantly without cloud setup."}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</div>
                          <div>
                            <strong className="text-foreground block mb-0.5">{isZh ? "在独立新标签页中打开" : "Open in New Tab"}</strong>
                            {isZh 
                              ? "点击右上角「在新标签页打开」，避免 iframe 框架带来的 Cookie 策略限制。" 
                              : "Open the app in an independent tab to bypass iframe security sandbox policies."}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</div>
                          <div>
                            <strong className="text-foreground block mb-0.5">{isZh ? "添加授权域名至 Firebase" : "Add Authorized Domain in Firebase"}</strong>
                            {isZh ? "如需启用真实远程云端认证，请在 Firebase 控制台添加此域名：" : "Add this domain to Firebase Console -> Authentication -> Settings -> Authorized Domains:"}
                            <code className="block bg-background/80 p-2 rounded border font-mono select-all text-amber-600 font-semibold mt-2 break-all">{window.location.hostname}</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
