import { Gauge, ShieldAlert, Scale, LineChart, Workflow } from "lucide-react";
import {
  CpCpkCalculator,
  DPMOCalculator,
  FMEACalculator,
  TTestCalculator,
  CorrelationCalculator,
  DOECalculator,
  ControlLimitsCalculator,
  GageRRCalculator,
  TwoSampleTTestCalculator,
  ANOVACalculator,
  ChiSquareCalculator,
  NormalityTestCalculator,
  CapabilitySixpack,
  RolledThroughputYieldCalculator,
  OEECalculator,
  LeanTaktTimeCalculator,
} from "@/components/calculators";
import { Locale } from "@/i18n/translations";

export interface CalculatorDefinition {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<{ toolId?: string; toolName?: string; phase?: number }>;
}

export interface CalculatorCategory {
  id: string;
  name: string;
  icon: any;
  description: string;
  calculators: CalculatorDefinition[];
}

export function getLocalizedCategories(locale: Locale): CalculatorCategory[] {
  const isZh = locale === "zh";

  return [
    {
      id: "capability",
      name: isZh ? "过程能力与公差分析 (Capability)" : "Capability & Performance",
      icon: Gauge,
      description: isZh ? "衡量过程满足设计公差与规格限的能力" : "Assess process capability to meet specifications",
      calculators: [
        { 
          id: "cp-cpk", 
          name: isZh ? "Cp / Cpk 能力指数分析" : "Cp / Cpk Capability Analysis", 
          description: isZh ? "短期过程能力与中心偏移指标核算 (USL/LSL)" : "Standard short-term capability and centering indices", 
          component: CpCpkCalculator 
        },
        { 
          id: "sixpack", 
          name: isZh ? "过程能力六联图 (Capability Sixpack)" : "Capability Sixpack", 
          description: isZh ? "多维度整合检验受控状态、正态性与能力指标" : "Comprehensive 6-in-1 chart for control and normality check", 
          component: CapabilitySixpack 
        },
      ]
    },
    {
      id: "quality",
      name: isZh ? "质量度量与风险评估 (Quality & Risk)" : "Quality & Defect Analysis",
      icon: ShieldAlert,
      description: isZh ? "量化缺陷率、全流程良率与失效模式风险" : "Analyze process scrap, defect opportunities, and risk",
      calculators: [
        { 
          id: "dpmo", 
          name: isZh ? "DPMO 与西格玛水平换算器" : "DPMO & Sigma Level", 
          description: isZh ? "从百万机会缺陷数反推长期过程西格玛水平与良率" : "Defects Per Million Opportunities to long-term Sigma estimate", 
          component: DPMOCalculator 
        },
        { 
          id: "rty", 
          name: isZh ? "全流通合格率 (Rolled Throughput Yield)" : "Rolled Throughput Yield (RTY)", 
          description: isZh ? "揭示多工序累积良率损耗与'隐形工厂'返工代价" : "Cumulative yield and rework vulnerability across multi-step flow", 
          component: RolledThroughputYieldCalculator 
        },
        { 
          id: "fmea", 
          name: isZh ? "FMEA 风险顺序数评估 (RPN)" : "FMEA Risk Assessment", 
          description: isZh ? "潜在失效模式及后果分析，计算严重点度、频度与探测度" : "Failure Mode and Effects Analysis with Risk Priority Number (RPN)", 
          component: FMEACalculator 
        }
      ]
    },
    {
      id: "hypothesis",
      name: isZh ? "假设检验与推断统计 (Statistics)" : "Hypothesis Testing & Stats",
      icon: Scale,
      description: isZh ? "基于数据证据检验均值、方差及关联显著性" : "Statistical hypothesis tests and regression analysis",
      calculators: [
        { 
          id: "normality", 
          name: isZh ? "正态性检验 (Normality Test)" : "Normality Test", 
          description: isZh ? "检验样本数据是否符合正态分布规律 (Anderson-Darling)" : "Verify whether sample distribution follows normal distribution curve", 
          component: NormalityTestCalculator 
        },
        { 
          id: "t-test-1", 
          name: isZh ? "单样本 T 检验 (1-Sample t)" : "1-Sample t-Test", 
          description: isZh ? "检验样本均值与设计理论目标值是否存在统计差异" : "Compare sample mean against a target standard value", 
          component: TTestCalculator 
        },
        { 
          id: "t-test-2", 
          name: isZh ? "双样本 / 配对 T 检验 (2-Sample t)" : "2-Sample / Paired t-Test", 
          description: isZh ? "比较改善前后、两条产线或两种物料均值差异显著性" : "Compare mean values between two independent or paired groups", 
          component: TwoSampleTTestCalculator 
        },
        { 
          id: "anova", 
          name: isZh ? "方差分析 (ANOVA)" : "Analysis of Variance (ANOVA)", 
          description: isZh ? "检验 3 组及以上多组样本均值之间是否存在显著差异" : "Analyze differences between means across 3 or more groups", 
          component: ANOVACalculator 
        },
        { 
          id: "chi-square", 
          name: isZh ? "卡方独立性检验 (Chi-Square)" : "Chi-Square Analysis", 
          description: isZh ? "测试属性分类数据（良品/不良品、班次等）的关联依存性" : "Test independence and correlation for qualitative attribute counts", 
          component: ChiSquareCalculator 
        },
        { 
          id: "correlation", 
          name: isZh ? "相关与回归分析 (Regression)" : "Correlation & Regression", 
          description: isZh ? "分析工艺输入 X 与质量输出 Y 之间的线性关系与拟合方程" : "Model linear dependencies between inputs and outputs (Scatter)", 
          component: CorrelationCalculator 
        }
      ]
    },
    {
      id: "spc",
      name: isZh ? "过程监控与测量系统 (SPC & MSA)" : "SPC Charts & MSA",
      icon: LineChart,
      description: isZh ? "建立动态统计控制界限并确保量具测量可靠性" : "Ensure measurement reliability and dynamic control limits",
      calculators: [
        { 
          id: "grr", 
          name: isZh ? "量具重复性与再现性 (Gage R&R)" : "Gage R&R (MSA)", 
          description: isZh ? "分解测量系统设备变异 (EV) 与操作员变异 (AV)" : "Measurement precision, repeatability, and reproducibility study", 
          component: GageRRCalculator 
        },
        { 
          id: "control-limits", 
          name: isZh ? "SPC 控制限核算 (UCL / CL / LCL)" : "Control Limits (SPC)", 
          description: isZh ? "为 Xbar-R、Xbar-S、I-MR 及属性控制图计算 ±3σ 统计边界" : "Calculate 3-sigma statistical boundaries for Xbar, I-MR, and attribute charts", 
          component: ControlLimitsCalculator 
        }
      ]
    },
    {
      id: "lean",
      name: isZh ? "精益效率与试验设计 (Lean & DOE)" : "Lean & DOE",
      icon: Workflow,
      description: isZh ? "消除制造节拍浪费并规划多因子试验优化窗口" : "Optimize flow cadence and systematically plan multi-factor experiments",
      calculators: [
        { 
          id: "oee", 
          name: isZh ? "OEE 综合设备效率计算器" : "OEE Calculator", 
          description: isZh ? "时间开动率 × 性能发挥率 × 合格品率全维度分解" : "Overall Equipment Effectiveness (Availability × Performance × Quality)", 
          component: OEECalculator 
        },
        { 
          id: "takt", 
          name: isZh ? "节拍时间与瓶颈平衡 (Takt Time)" : "Takt Time & Cycle Time", 
          description: isZh ? "根据客户需求速率同步产线各工序节奏，防范过量生产" : "Balance process cycle velocity against live customer demand tempo", 
          component: LeanTaktTimeCalculator 
        },
        { 
          id: "doe", 
          name: isZh ? "试验设计正交表 (DOE 2^k)" : "Design of Experiments (DOE)", 
          description: isZh ? "全因子 2 水平试验矩阵设计、主效应与交互效应量化" : "Generate 2-level factorial experiment matrix for parameter tuning", 
          component: DOECalculator 
        }
      ]
    }
  ];
}
