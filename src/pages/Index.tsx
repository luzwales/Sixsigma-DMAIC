import { Layout } from "@/components/Layout";
import { PhaseCard } from "@/components/PhaseCard";
import { phases, sigmaTable } from "@/data/dmaic-tools";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, CheckCircle2, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Index() {
  const { t, locale } = useLanguage();

  const features = [
    {
      icon: Target,
      title: t("home.features.goalOriented.title", "目标驱动"),
      description: t("home.features.goalOriented.desc", "量化业务痛点与问题边界，锁定高收益关键指标。"),
    },
    {
      icon: BarChart3,
      title: t("home.features.structured.title", "结构严谨"),
      description: t("home.features.structured.desc", "遵循标准 DMAIC 逻辑架构，闭环驱动端到端流程突破。"),
    },
    {
      icon: Users,
      title: t("home.features.customerFocused.title", "客户之声"),
      description: t("home.features.customerFocused.desc", "紧贴 VOC 与 CTQ，确保技术改进落地于实际客户价值。"),
    },
    {
      icon: CheckCircle2,
      title: t("home.features.resultsDriven.title", "结果固化"),
      description: t("home.features.resultsDriven.desc", "运用统计过程控制(SPC)与防错，确保改进收益持久有效。"),
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              {t("home.tag", "六西格玛黑带实战工具集")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {t("home.title", "Mastering")}{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t("home.titleHighlight", "DMAIC")}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("home.subtitle", "您的六西格玛黑带进阶权威指南。以精准统计学为核心，系统化引领从定义到控制的每一步改进流程。")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/phase/1">
                  {t("home.startGuide", "开始指南")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/calculators">
                  {t("home.exploreCalculators", "统计计算器")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow"
              >
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DMAIC Phases */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("home.phasesSectionTitle", "DMAIC 五大阶段")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("home.phasesSectionDesc", "Define, Measure, Analyze, Improve, Control — 制造业与卓越运营的成熟改进方法论体系。")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {phases.map((phase, index) => (
              <PhaseCard key={phase.id} phase={phase} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Sigma Level Table */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">{t("home.sigmaTableTitle", "六西格玛质量水平参照表 (带 1.5σ 漂移)")}</h2>
              <p className="text-muted-foreground">
                {t("home.sigmaTableDesc", "百万分之缺陷数 (DPMO) 与制程良率参照标准")}
              </p>
            </div>
            <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{t("home.tableLevel", "西格玛水平")}</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">{t("home.tableDPMO", "DPMO (每百万缺陷数)")}</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">{t("home.tableYield", "过程良率 (%)")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sigmaTable.map((row, i) => (
                    <tr key={row.sigma} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-6 py-4 font-medium">{row.sigma}σ</td>
                      <td className="px-6 py-4 text-right font-mono text-sm">
                        {row.dpmo.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm">
                        {row.yield}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-primary to-accent rounded-3xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {locale === "zh" ? "准备好开启过程能力突破了吗？" : "Ready to Optimize Your Processes?"}
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              {locale === "zh" 
                ? "全面获取 50+ 精准统计工具、工业实战案例与端到端黑带落地指南。" 
                : "Access 50+ industrial statistical tools with step-by-step guidance and real manufacturing examples."}
            </p>
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link to="/phase/1">
                {locale === "zh" ? "进入 Define (定义) 阶段" : "Start with Define Phase"} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
