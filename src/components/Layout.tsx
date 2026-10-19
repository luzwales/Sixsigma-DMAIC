import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { phases } from "@/data/dmaic-tools";
import { cn } from "@/lib/utils";
import { Activity, Calculator, Home, BarChart3, FolderOpen, LogIn, LogOut, User, LayoutDashboard, Workflow } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t, locale } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg">{t("nav.brand", "Six Sigma")}</span>
                <span className="text-muted-foreground text-sm block -mt-1">{t("nav.subBrand", "DMAIC Guide")}</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === "/"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Home className="h-4 w-4 inline-block mr-1.5" />
                {t("nav.home", "首页")}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer",
                      location.pathname.startsWith("/phase/")
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <span>{t("nav.phases", "DMAIC 阶段")}</span>
                    <span className="text-[9px] opacity-75">▼</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg font-sans">
                  {phases.map((phase) => (
                    <DropdownMenuItem key={phase.id} asChild className="focus:bg-slate-50 dark:focus:bg-slate-800/60 rounded-lg cursor-pointer">
                      <Link
                        to={`/phase/${phase.id}`}
                        className={cn(
                          "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 transition-colors",
                          location.pathname === `/phase/${phase.id}` ? "bg-primary/20 text-primary dark:text-blue-400 font-bold" : ""
                        )}
                      >
                        <span className="text-base shrink-0">{phase.icon}</span>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                            {locale === "zh" ? phase.nameZh || phase.name : phase.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {t("nav.phaseIndex", `第 ${phase.id} 阶段 / 共 5 阶段`).replace("{{id}}", String(phase.id))}
                          </span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link
                to="/calculators"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === "/calculators"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Calculator className="h-4 w-4 inline-block mr-1.5" />
                {t("nav.calculators", "统计计算器")}
              </Link>
              <Link
                to="/control-charts"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === "/control-charts"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <BarChart3 className="h-4 w-4 inline-block mr-1.5" />
                {t("nav.controlCharts", "控制图")}
              </Link>
              <Link
                to="/vsm"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === "/vsm"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Workflow className="h-4 w-4 inline-block mr-1.5" />
                {t("nav.vsm", "价值流图")}
              </Link>
              {user && (
                <Link
                  to="/dashboard"
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === "/dashboard"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <LayoutDashboard className="h-4 w-4 inline-block mr-1.5" />
                  {t("nav.dashboard", "仪表盘")}
                </Link>
              )}
              <Link
                to="/projects"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.startsWith("/project")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <FolderOpen className="h-4 w-4 inline-block mr-1.5" />
                {t("nav.projects", "项目")}
              </Link>

              <div className="flex items-center gap-1 ml-1 border-l pl-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              
              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-1">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/projects">
                        <FolderOpen className="h-4 w-4 mr-2" />
                        {t("nav.myProjects", "我的项目")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("nav.logout", "退出登录")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="ml-2 gap-2">
                    <LogIn className="h-4 w-4" />
                    {t("nav.login", "登录")}
                  </Button>
                </Link>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-1.5">
              <LanguageToggle />
              <ThemeToggle />
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/projects">{t("nav.myProjects", "我的项目")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>{t("nav.logout", "退出登录")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="icon">
                    <LogIn className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Phase Navigation */}
      <div className="md:hidden sticky top-16 z-40 glass border-b overflow-x-auto">
        <div className="flex items-center gap-1.5 px-4 py-2">
          {user && (
            <Link
              to="/dashboard"
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                location.pathname === "/dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              📊 {t("nav.dashboard", "仪表盘")}
            </Link>
          )}
          <Link
            to="/projects"
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              location.pathname.startsWith("/project") && location.pathname !== "/projects"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            📁 {t("nav.projects", "项目")}
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer",
                  location.pathname.startsWith("/phase/")
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                )}
              >
                <span>🌀 {t("nav.phases", "DMAIC 阶段")}</span>
                <span className="text-[8px] opacity-75">▼</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg font-sans">
              {phases.map((phase) => (
                <DropdownMenuItem key={phase.id} asChild className="focus:bg-slate-50 dark:focus:bg-slate-800/60 rounded-lg cursor-pointer">
                  <Link
                    to={`/phase/${phase.id}`}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 transition-colors",
                      location.pathname === `/phase/${phase.id}` ? "bg-primary/20 text-primary dark:text-blue-400 font-bold" : ""
                    )}
                  >
                    <span className="text-base shrink-0">{phase.icon}</span>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                        {locale === "zh" ? phase.nameZh || phase.name : phase.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t("nav.phaseIndex", `第 ${phase.id} 阶段 / 共 5 阶段`).replace("{{id}}", String(phase.id))}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            to="/calculators"
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              location.pathname === "/calculators"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            🧮 {t("nav.calculators", "计算器")}
          </Link>

          <Link
            to="/control-charts"
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              location.pathname === "/control-charts"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            📈 {t("nav.controlCharts", "控制图")}
          </Link>

          <Link
            to="/vsm"
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              location.pathname === "/vsm"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            🌀 {t("nav.vsm", "价值流图")}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Six Sigma Black Belt DMAIC Guide</p>
          <p className="mt-1">{locale === "zh" ? "统计过程控制 (SPC) 与精益六西格玛体系" : "Statistical Process Control & Lean Six Sigma Methodology"}</p>
        </div>
      </footer>
    </div>
  );
}
