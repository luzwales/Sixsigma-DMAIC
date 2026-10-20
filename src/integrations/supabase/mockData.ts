export interface Project {
  id: string;
  name: string;
  description: string | null;
  current_phase: number;
  status: string;
  user_id: string;
  estimated_savings: number | null;
  actual_savings: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  user_id: string;
  phase: number;
  title: string;
  content: string | null;
  created_at: string;
}

export interface RaciRow {
  id: string;
  project_id: string;
  activity: string;
  responsible: string | null;
  accountable: string | null;
  consulted: string | null;
  informed: string | null;
  sort_order: number;
}

export interface ControlPlanRow {
  id: string;
  project_id: string;
  process_step: string;
  characteristic: string;
  specification: string | null;
  measurement_method: string | null;
  sample_size: string | null;
  frequency: string | null;
  responsible: string | null;
  reaction_plan: string | null;
  sort_order: number;
}

export interface SigmaEntry {
  id: string;
  project_id: string;
  phase: number;
  sigma_level: number;
  dpmo: number | null;
  measurement_date: string;
}

export interface ProjectCalculation {
  id: string;
  project_id: string;
  user_id: string;
  phase: number;
  tool_id: string;
  tool_name: string;
  inputs: any;
  results: any;
  notes: string | null;
  created_at: string;
}

function resolveIsZh(forcedLocale?: string): boolean {
  if (forcedLocale) return forcedLocale === "zh";
  if (typeof window !== "undefined") {
    const loc = localStorage.getItem("dmaic-locale");
    if (loc) return loc === "zh";
  }
  return true;
}

export function getDemoProjects(locale?: string): Project[] {
  const isZh = resolveIsZh(locale);
  return [
    {
      id: "demo-project-1",
      name: isZh ? "装配 3 线工时与过程变异优化" : "Assembly Line 3 Cycle Time & Variation Optimization",
      description: isZh
        ? "精益六西格玛黑带改善项目：大幅降低装配 3 线周期时间波动与返修浪费，建立防错装配标准工法。"
        : "Six Sigma DMAIC project to reduce cycle time variability and defect rates across Assembly Line 3.",
      current_phase: 3,
      status: "active",
      user_id: "local-sandbox-user",
      estimated_savings: 450000,
      actual_savings: 120000,
      created_at: "2026-05-15T08:00:00Z",
      updated_at: "2026-06-11T12:00:00Z"
    }
  ];
}

export function getDemoNotes(locale?: string): ProjectNote[] {
  const isZh = resolveIsZh(locale);
  return [
    {
      id: "note-1",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 1,
      title: isZh ? "问题陈述与改善目标" : "Problem Statement & Objective",
      content: isZh
        ? "攻坚方向：将装配工位周期时间波动由目前的 45 分钟收窄至 30 分钟以内。\n项目目标：消除加班浪费与偶发缺陷，年化达成预期财务收益 450,000 元。"
        : "Purpose: Reduce assembly cycle time variability from 45 minutes to under 30 minutes per unit.\nGoal: Realize annual financial savings of $450,000 by cutting overtime and scrap defects.",
      created_at: "2026-05-16T10:00:00Z"
    },
    {
      id: "note-2",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 2,
      title: isZh ? "数据收集计划与 MSA 评审纪要" : "Data Collection Plan & MSA Review",
      content: isZh
        ? "已连续采集两周基线测量数据 (N=50)。测量系统分析 Gage R&R 实测值为 8.4%，低于 10% 黄金判据，量具精度完全合格。"
        : "Collected 2 weeks of baseline data (N=50). Measurement System Analysis (MSA) confirmed Gage R&R at 8.4%, fully acceptable (<10%).",
      created_at: "2026-05-25T14:30:00Z"
    },
    {
      id: "note-3",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 3,
      title: isZh ? "石川因果鱼骨图分析结论" : "Ishikawa Fishbone Root Cause Findings",
      content: isZh
        ? "核心变异根因梳理：\n1. 换模换型与工具夹具缺少标准化定位。\n2. 固化炉温场存在局部温度波动。\n3. 各班次操作工走线装配手法未彻底对齐。\n\n改善期重点攻坚固化炉温场控制与走线工装防错改造。"
        : "Primary sources of variance:\n1. Lack of standardized changeover tool locating.\n2. Curing oven temperature gradients.\n3. Technique variance between shifts.\n\nNext step: verify oven thermal stability during the Improve phase.",
      created_at: "2026-06-05T09:15:00Z"
    }
  ];
}

export function getDemoRaciMatrix(locale?: string): RaciRow[] {
  const isZh = resolveIsZh(locale);
  return [
    {
      id: "raci-1",
      project_id: "demo-project-1",
      activity: isZh ? "制定项目章程 (Project Charter)" : "Develop Project Charter",
      responsible: isZh ? "张伟 (绿带/项目骨干)" : "Lead Engineer (Green Belt)",
      accountable: isZh ? "李总 (项目发起人/Sponsor)" : "Operations Director (Sponsor)",
      consulted: isZh ? "黑带大师 (MBB)" : "Master Black Belt",
      informed: isZh ? "工厂指导委员会" : "Steering Committee",
      sort_order: 0
    },
    {
      id: "raci-2",
      project_id: "demo-project-1",
      activity: isZh ? "测量并收集基线工时数据" : "Measure Baseline Cycle Times",
      responsible: isZh ? "一班/二班装配操作工" : "Line Operators (Shifts A & B)",
      accountable: isZh ? "张伟 (绿带/项目骨干)" : "Lead Engineer (Green Belt)",
      consulted: isZh ? "质量主管" : "Quality Manager",
      informed: isZh ? "生产部经理" : "Plant Operations Manager",
      sort_order: 1
    }
  ];
}

export function getDemoControlPlans(locale?: string): ControlPlanRow[] {
  const isZh = resolveIsZh(locale);
  return [
    {
      id: "cp-1",
      project_id: "demo-project-1",
      process_step: isZh ? "固化炉温场精密监测" : "Curing Oven Thermal Monitoring",
      characteristic: isZh ? "固化温度曲线 (180°C ± 5°C)" : "Curing Temperature (180°C ± 5°C)",
      specification: "175°C - 185°C",
      measurement_method: isZh ? "高精度自动炉温热电偶" : "Automated In-chamber Thermocouple",
      sample_size: isZh ? "连续全程监测" : "Continuous Sensor Stream",
      frequency: isZh ? "每批固化循环" : "Every Curing Cycle",
      responsible: isZh ? "固化技术员" : "Thermal Process Engineer",
      reaction_plan: isZh
        ? "炉温报警立即停机，微调加热元件；若温度低于下限，对该批在制品执行隔离与复测 (OCAP)。"
        : "Halt oven, adjust heating coils, isolate affected lot for re-test if below limits (OCAP).",
      sort_order: 0
    }
  ];
}

export function getDemoSigmaTracking(): SigmaEntry[] {
  return [
    {
      id: "sigma-1",
      project_id: "demo-project-1",
      phase: 1,
      sigma_level: 2.8,
      dpmo: 115000,
      measurement_date: "2026-05-15"
    },
    {
      id: "sigma-2",
      project_id: "demo-project-1",
      phase: 2,
      sigma_level: 3.1,
      dpmo: 66800,
      measurement_date: "2026-05-28"
    }
  ];
}

export function getDemoCalculations(locale?: string): ProjectCalculation[] {
  const isZh = resolveIsZh(locale);
  return [
    {
      id: "calc-1",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 1,
      tool_id: "project-charter",
      tool_name: isZh ? "项目章程 (Project Charter)" : "Project Charter",
      inputs: {
        problem: isZh
          ? "装配 3 线周期时间波动显著 (在 22 到 58 分钟之间浮动)，导致固化瓶颈工序严重在制品积压，且产生 22% 额外加班损耗。"
          : "Assembly Line 3 cycle times exhibit large variability (22 to 58 min), producing bottleneck WIP and 22% overtime.",
        goal: isZh
          ? "在 2026 年 9 月前，将平均单件装配工时压缩至 30 分钟以内，并将周期时间标准差降低 50%。"
          : "Reduce average assembly time to <30 minutes and lower standard deviation by 50% by September 2026."
      },
      results: {
        estimatedSaving: 450000,
        status: isZh ? "项目发起人已签字审批通过" : "Approved by Sponsor"
      },
      notes: isZh ? "核心精益攻坚项目，旨在保障下半年交付准时率。" : "Critical project to secure delivery on-time rate for peak season.",
      created_at: "2026-05-16T11:00:00Z"
    },
    {
      id: "calc-2",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 1,
      tool_id: "voc",
      tool_name: isZh ? "客户之声 (Voice of Customer)" : "Voice of Customer (VOC)",
      inputs: {
        items: [
          {
            source: isZh ? "核心客户深度访谈" : "Customer Interviews",
            need: isZh ? "压缩交付周期" : "Shorter Delivery Lead Time",
            priority: isZh ? "高" : "High",
            requirement: isZh ? "单件装配时间 ≤ 30 分钟" : "Cycle time <= 30 min"
          },
          {
            source: isZh ? "生产部内部诉求" : "Production Leadership",
            need: isZh ? "平准化均衡节拍" : "Balanced Flow",
            priority: isZh ? "中" : "Medium",
            requirement: isZh ? "每班停机率 < 5%" : "Downtime < 5% per shift"
          }
        ]
      },
      results: {
        totalNeeds: 2,
        highPriority: 1,
        withRequirements: 2
      },
      notes: isZh ? "将 ≤30 分钟作为装配节拍基准源自客户 VOC 明确需求。" : "30-minute target directly driven by VOC interviews.",
      created_at: "2026-05-17T09:30:00Z"
    },
    {
      id: "calc-3",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 1,
      tool_id: "sipoc",
      tool_name: isZh ? "高阶流程图 (SIPOC)" : "SIPOC High-level Map",
      inputs: {
        supplier: isZh ? "原料库与外购部件仓" : "Component Warehouse & Suppliers",
        input: isZh ? "焊接成型机架、主板控制器、预配标准紧固件" : "Welded frame, control board, assembly kits",
        process: isZh ? "拣料齐套 (1) -> 机架预装 (2) -> 电气接线 (3) -> 终检出库 (4)" : "Kitting (1) -> Frame Mount (2) -> Wiring (3) -> Final QC (4)",
        output: isZh ? "合格成品控制器、工序流转合格单" : "Finished controller, inspection sheet",
        customer: isZh ? "下游固化车间 (内部客户)" : "Curing Department (Internal Customer)"
      },
      results: {
        stepsCount: 4,
        inputsCount: 3,
        outputsCount: 2
      },
      notes: isZh ? "明确界定装配工序边界：从拣料齐套至终检合格交接。" : "Process scope defined strictly from picking to final QC.",
      created_at: "2026-05-18T14:15:00Z"
    },
    {
      id: "calc-4",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 2,
      tool_id: "data-collection-plan",
      tool_name: isZh ? "数据收集计划 (Data Collection Plan)" : "Data Collection Plan",
      inputs: {
        metrics: isZh ? "单件装配时间 (秒), 车间环境温湿度, 操作工工号, 班次" : "Cycle time (sec), Room temp, Operator ID, Shift",
        sampleSize: isZh ? "绿带工程师现场抽样观测 N=50" : "N=50 continuous cycles sampled by Green Belt",
        frequency: isZh ? "连续 10 个工作日抽检" : "Every unit over 10 working days"
      },
      results: {
        status: isZh ? "数据收集已圆满完成" : "Collection Complete",
        recordsRegistered: 50
      },
      notes: isZh ? "采集的基础样本数据直接用于建立基线与 MSA 量具分析。" : "Baseline data used directly for MSA and capability analysis.",
      created_at: "2026-05-20T10:00:00Z"
    },
    {
      id: "calc-5",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 2,
      tool_id: "gage-rr",
      tool_name: isZh ? "测量系统分析 (Gage R&R)" : "Measurement System Analysis (Gage R&R)",
      inputs: {
        operators: 3,
        parts: 10,
        trials: 3
      },
      results: {
        studyVarPercent: 8.4,
        status: isZh ? "测量系统优秀合格 (%R&R < 10%)" : "Measurement System Acceptable (%R&R < 10%)"
      },
      notes: isZh ? "Gage R&R 实测为 8.41%，量具再现性与重复性良好。" : "Gage R&R measured at 8.41%. Excellent measurement precision.",
      created_at: "2026-05-23T16:20:00Z"
    },
    {
      id: "calc-5-1",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 2,
      tool_id: "capability-cp",
      tool_name: isZh ? "过程能力分析 (Cp)" : "Process Capability (Cp)",
      inputs: {
        usl: 10.5,
        lsl: 9.5,
        mean: 10.02,
        stdDev: 0.12
      },
      results: {
        cp: 1.389,
        cpu: 1.333,
        cpl: 1.444,
        cpk: 1.333
      },
      notes: isZh ? "Cp 达到 1.389，显示该工序固有散布潜力充分满足质量要求。" : "Cp measured at 1.389, demonstrating adequate intrinsic capability.",
      created_at: "2026-05-24T14:45:00Z"
    },
    {
      id: "calc-5-2",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 2,
      tool_id: "capability-cpk",
      tool_name: isZh ? "过程能力指数 (Cpk)" : "Process Capability (Cpk)",
      inputs: {
        usl: 10.5,
        lsl: 9.5,
        mean: 10.08,
        stdDev: 0.14
      },
      results: {
        cp: 1.190,
        cpu: 1.000,
        cpl: 1.381,
        cpk: 1.000
      },
      notes: isZh ? "Cpk 为 1.000，表明过程中心向规格上限偏移，需改善对中性。" : "Cpk is 1.000, indicating off-center mean toward upper specification limit.",
      created_at: "2026-05-25T10:15:00Z"
    },
    {
      id: "calc-6",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 3,
      tool_id: "fishbone",
      tool_name: isZh ? "因果鱼骨图 (Fishbone / Ishikawa)" : "Cause & Effect Fishbone Diagram",
      inputs: {
        manpower: isZh ? "不同班次熟练度差异明显，交接班欠缺标准规范" : "Shift skill variation, unclear shift handover procedure",
        machine: isZh ? "固定夹具轻微松脱磨损，固化烘箱温差波动" : "Wear on locating fixtures, curing oven temperature swings",
        method: isZh ? "线束走向缺少防错限位卡槽，工具定置摆放混乱" : "Missing wiring guide slots, disorganized tool placement",
        material: isZh ? "来料外壳机架公差浮动，偶尔存在批次毛刺" : "Chassis tolerance variance, sporadic sheet metal burrs"
      },
      results: {
        mainRootCauses: isZh ? "线束布线缺乏防错导向卡槽，换班交接操作标准未对齐" : "Lack of poka-yoke wiring fixtures, shift handover discrepancy"
      },
      notes: isZh ? "分析期确立改善主攻靶点：开发物理防错工装与标准作业法 (SOP)。" : "Analyze phase confirmed focus: build physical poka-yoke fixture and standardize SOP.",
      created_at: "2026-06-01T09:00:00Z"
    },
    {
      id: "calc-7",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 3,
      tool_id: "fmea",
      tool_name: isZh ? "失效模式与影响分析 (FMEA)" : "Failure Mode and Effects Analysis (FMEA)",
      inputs: {
        failureMode: isZh ? "线束在机架最终合拢时被压伤挤破" : "Wiring harness pinched during final frame closure",
        severity: 8,
        occurrence: 6,
        detection: 4
      },
      results: {
        rpn: 192,
        risk: isZh ? "高危风险 (需强制纠正)" : "High Risk (Action Required)",
        action: isZh ? "在夹具中加设防呆限位卡扣槽，彻底消除走线干涉" : "Introduce poka-yoke guide slots on locating fixture"
      },
      notes: isZh ? "RPN 高达 192 分，必须在改善阶段实施硬件级防错。" : "RPN score of 192 strongly mandates fixture-level poka-yoke countermeasure.",
      created_at: "2026-06-04T11:45:00Z"
    },
    {
      id: "calc-8",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 4,
      tool_id: "pugh-matrix",
      tool_name: isZh ? "普格方案决策矩阵 (Pugh Matrix)" : "Pugh Matrix Decision Tool",
      inputs: {
        alternatives: isZh ? ["Poka-Yoke 防错定位工装", "增加人工出厂检验", "在线缆外表套防护管"] : ["Poka-Yoke Fixture", "Additional Manual Inspection", "Protective Sleeve"],
        criteria: isZh ? ["变异削减能力", "工装改造成本", "维护保养复杂度"] : ["Variance Reduction", "Build Simplicity", "Low Maintenance"]
      },
      results: {
        winner: isZh ? "Poka-Yoke 防错定位工装" : "Poka-Yoke Fixture"
      },
      notes: isZh ? "Poka-Yoke 方案以最高综合得分胜出，具备源头防错优势。" : "Poka-yoke design selected for proven defect prevention ability.",
      created_at: "2026-06-08T10:10:00Z"
    },
    {
      id: "calc-9",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 4,
      tool_id: "pilot-study",
      tool_name: isZh ? "试点运行验证 (Pilot Study)" : "Pilot Study Plan & Verification",
      inputs: {
        duration: isZh ? "在新工装夹具上线后试运行 5 个工作日" : "5 working days trial with new fixture",
        sampleSize: isZh ? "试运行期间组装 N=12 台设备" : "N=12 pilot units assembled",
        successCriteria: isZh ? "周期时间变异降低 >50%，平均装配时间 < 30 分钟" : "Cycle time variance reduced >50%, mean < 30 min"
      },
      results: {
        status: isZh ? "试点运行全面达标" : "Pilot Study Successful",
        averageCycleTime: 28.5,
        varianceReducedPercent: 58
      },
      notes: isZh ? "试点实测均值降至 28.5 分钟，工时分布呈健康正态钟形曲线。" : "Average time dropped to 28.5 min with stable normal distribution.",
      created_at: "2026-06-10T14:00:00Z"
    },
    {
      id: "calc-10",
      project_id: "demo-project-1",
      user_id: "local-sandbox-user",
      phase: 5,
      tool_id: "sop",
      tool_name: isZh ? "标准作业程序 (SOP)" : "Standard Operating Procedure (SOP)",
      inputs: {
        sopName: isZh ? "SOP-ASSY-LI3-04: 装配 3 线防错工装标准操作规范" : "SOP-ASSY-LI3-04: Assembly Line 3 Poka-Yoke Standard Procedure",
        audience: isZh ? "装配 3 线全体技术员与操作工 (A/B/C 三班)" : "All Line 3 Assemblers & Technicians",
        version: "v1.0"
      },
      results: {
        status: isZh ? "生产部与质量部联合批准下发" : "Approved by Operations & Quality",
        publishedInDocumentSystem: true
      },
      notes: isZh ? "新版标准作业看板已张贴至工位现场，全员培训考核签字闭环。" : "SOP deployed at workstation and signed off by all operators.",
      created_at: "2026-06-11T16:00:00Z"
    }
  ];
}
