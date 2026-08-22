export type ActiveTab = 'dashboard' | 'portfolio' | 'news_risks' | 'inputs' | 'funds' | 'rulebook' | 'settings';

export type SentimentType = 'Strong Bull' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bear';

export type S1StandardAction = 'buy' | 'staged_buy' | 'hold' | 'take_profit' | 'sell' | 'no_action';

export interface MarketScoreItem {
  id: string;
  name: string;
  nameEn: string;
  symbol: string;
  icon: string;
  score: number; // 0 - 100
  sentiment: SentimentType;
  trafficLight: 'red' | 'yellow' | 'green';
  trafficLightLabel: string;
  primaryColor: string;
  metrics: {
    label: string;
    value: string;
    status?: 'positive' | 'negative' | 'neutral' | 'high' | 'warning';
  }[];
  description?: string;
  threeConfirmations?: {
    criterion1: { name: string; passed: boolean; note: string };
    criterion2: { name: string; passed: boolean; note: string };
    criterion3: { name: string; passed: boolean; note: string };
    isConfirmed: boolean;
  };
  weightBreakdown?: {
    variable: string;
    weight: number;
    scoreAchieved: number;
    source: string;
    evaluation: string;
  }[];
  details?: {
    technicalScore: number;
    fundamentalScore: number;
    flowScore: number;
    sentimentScore: number;
    analysisSummary: string;
  };
}

export interface InputMetric {
  id: string;
  category: 'bourse' | 'gold' | 'crypto' | 'forex' | 'macro';
  categoryLabel: string;
  title: string;
  code: string;
  value: number | string;
  unit: string;
  scoreContribution: number; // 0 to 10
  status: 'bullish' | 'bearish' | 'neutral';
  weight: number;
  lastUpdated: string;
  description: string;
  source: string;
  sourceReference?: string;
  extractedFrom?: string;
  timeWindow?: string;
}

export interface FundItem {
  id: string;
  name: string;
  type: 'fixed_income' | 'gold' | 'equity' | 'leveraged';
  typeLabel: string;
  ticker: string;
  currentAllocationPct: number;
  recommendedAllocationPct: number;
  navPerUnit: number;
  monthlyReturn: number;
  quarterlyReturn: number;
  aumBillionToman: number;
  riskRating: 'low' | 'medium' | 'high' | 'very_high';
}

export interface SystemS1Signal {
  actionTitle: string;
  subtitle: string;
  confidenceScore: number; // e.g. 9 out of 10
  dataQualityScore: number; // e.g. 39 out of 41
  totalMetricsCount: number;
  activeMetricsCount: number;
  summaryText: string;
  allocationSummary: string;
  recommendedAllocations: {
    fixedIncomePct: number;
    goldPct: number;
    equityPct: number;
    cashPct: number;
  };
  lastUpdatedJalali: string;
  isLive: boolean;
  overallScore: number; // composite index
}

export interface TelegramConfig {
  botToken: string;
  channelId: string;
  channelName: string;
  autoSendEnabled: boolean;
  autoSendTime: string;
  includeGauges: boolean;
  includeAllocations: boolean;
  lastSentTimestamp?: string;
}

export interface SystemHistoryLog {
  id: string;
  timestamp: string;
  jalaliDate: string;
  action: string;
  compositeScore: number;
  bourseScore: number;
  goldScore: number;
  btcScore: number;
  usdtScore: number;
  confidence: string;
  notes: string;
}

// ----------------------------------------------------
// Paper Portfolio Types (پورتفوی کاغذی ۱ میلیارد تومانی)
// ----------------------------------------------------
export interface PortfolioSummary {
  initialCapitalToman: number; // 1,000,000,000
  currentValueToman: number; // e.g. 1,148,650,000
  dailyPnlToman: number; // e.g. +14,250,000
  dailyPnlPct: number; // e.g. +1.25%
  totalPnlToman: number; // e.g. +148,650,000
  totalPnlPct: number; // e.g. +14.86%
  maxDrawdownPct: number; // e.g. -4.18%
  winRatePct: number; // e.g. 76.5%
  sharpeRatio: number; // e.g. 2.45
  cashBalanceToman: number; // e.g. 50,000,000 (5%)
  investedValueToman: number; // e.g. 1,098,650,000
  lastRebalanceDateJalali: string;
  activePositionsCount: number;
}

export interface PortfolioAssetItem {
  id: string;
  name: string; // e.g. صندوق عیار، صندوق افران، صندوق توان / خبرگان، طلای فیزیکی، نقدینگی
  ticker: string; // e.g. عیار، افران، توان، طلا ۱۸، ریال
  category: 'gold_etf' | 'fixed_income' | 'equity_etf' | 'physical_gold' | 'cash';
  categoryLabel: string;
  allocatedValueToman: number;
  initialCostToman: number;
  weightPct: number; // Current %
  targetWeightPct: number; // System S1 target %
  unitsCount: number; // Quantity
  avgBuyPriceToman: number;
  currentPriceToman: number;
  pnlToman: number;
  pnlPct: number;
  dailyChangePct: number;
  status: 'profit' | 'loss' | 'neutral';
  color: string;
}

export interface PortfolioHistoryPoint {
  dateJalali: string;
  dateKey: string;
  portfolioValue: number; // in Toman
  portfolioValueMillion: number; // in Million Toman for charts
  drawdownPct: number; // negative % e.g. -2.1
  dailyReturnPct: number;
  benchmarkValueMillion?: number;
  signalAction?: string;
  notes?: string;
}

export interface PortfolioTradeItem {
  id: string;
  dateJalali: string;
  assetTicker: string;
  assetName: string;
  type: 'buy' | 'sell' | 'rebalance';
  amountToman: number;
  units: number;
  unitPriceToman: number;
  pnlToman?: number;
  rationale: string;
}

// ----------------------------------------------------
// Systemic Risks & News Types (اخبار و ریسک‌های سیستماتیک)
// ----------------------------------------------------
export interface NewsItem {
  id: string;
  category: 'iran_global' | 'crypto_bourse' | 'cbi_seo' | 'geopolitical';
  categoryLabel: string;
  title: string;
  source: string;
  sourceLogo?: string;
  timeJalali: string;
  importance: 'critical' | 'high' | 'medium';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  summary: string;
  impactAnalysis: string;
  affectedMarkets: string[];
  tags: string[];
}

export interface SystemicRiskItem {
  id: string;
  title: string;
  category: 'political_military' | 'monetary_cbi' | 'exchange_rate' | 'global_macro';
  categoryLabel: string;
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  riskScore: number; // 0 - 100
  trend: 'rising' | 'stable' | 'falling';
  summary: string;
  keyTriggers: string[];
  mitigationStrategy: string;
  affectedAssets: string;
  lastAssessedJalali: string;
}

export interface SRIModel {
  overallScore: number; // (A + B + C + D + E) / 5 (0 - 10)
  sriScore?: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'emergency'; // 0-3, 3-6, 6-8, 8-10
  riskLevelPersian: string;
  isEmergencyMode: boolean; // SRI >= 8
  tacticalAdjustment: string;
  subIndices: {
    marketRisk: number; // 0 - 10 (A)
    economicRisk: number; // 0 - 10 (B)
    politicalRisk: number; // 0 - 10 (C)
    systematicRisk: number; // 0 - 10 (D)
    operationalRisk: number; // 0 - 10 (E)
  };
  warLiquidityPriority?: string[];
}

export interface DailyChecklistItem {
  id: string;
  stepNumber: number;
  order?: number;
  title: string;
  description: string;
  source: string;
  sourceReference?: string;
  timeWindow: string; // 17:00 - 18:00
  isCompleted: boolean;
  status?: 'passed' | 'pending' | 'failed';
}

export interface AiDailySummary {
  regime: 'bullish_expansion' | 'stagflation' | 'risk_off' | 'neutral_consolidation';
  regimePersian: string;
  overallSentimentScore: number; // 0 - 100
  generatedTimestamp: string;
  executiveSummary: string;
  macroEconomicView: string;
  bourseAndCryptoOutlook: string;
  goldAndForexOutlook: string;
  systemicRisksVerdict?: string;
  tacticalPlan: {
    priority: number;
    targetAsset: string;
    step: string;
    rationale: string;
    timeframe: string;
  }[];
  keyRules: string[];
  aiModelSignature: string;
}

export interface S1V13RulebookSection {
  id: string;
  sectionNumber: string;
  title: string;
  subtitle: string;
  iconName: string;
  paragraphs: {
    heading?: string;
    text: string;
    bulletPoints?: string[];
    formula?: string;
    warning?: string;
  }[];
}

// ----------------------------------------------------
// S1 Validation Core & 13-Section Daily Input Types
// ----------------------------------------------------
export type ValidationStatus = 'VALIDATED' | 'CROSS_CHECKED' | 'BOUNDED_CORRECTED' | 'WARNING';

export interface ValidationAuditCheck {
  id: string;
  title: string;
  category: string;
  formulaDescription: string;
  status: 'passed' | 'warning' | 'corrected';
  theoreticalValue?: string | number;
  actualMarketValue?: string | number;
  toleranceApplied?: string;
  note: string;
}

export interface ValidationAuditReport {
  timestampJalali: string;
  overallQualityScore: number; // e.g. 41 / 41
  confidencePercentage: number; // e.g. 99.2%
  coreValidationStatus: 'VERIFIED_PERFECT' | 'VERIFIED_WITH_ADJUSTMENTS' | 'OFFLINE_FALLBACK';
  checks: ValidationAuditCheck[];
  sourcesConsulted: { name: string; domain: string; status: string; recordsExtracted: number }[];
  summaryMessageFa: string;
}

export interface StandardDailyInput13Sections {
  metadata: {
    jalaliDate: string;
    miladiDate: string;
    dayOfWeek: string;
    updateTime: string;
    s1EngineVersion: string;
  };
  section1_iranMacro: {
    usdFree: string;
    usdYesterday: string;
    usdChangePct: string;
    usdt: string;
    usdtYesterday: string;
    usdtChangePct: string;
    gold18k: string;
    gold18kYesterday: string;
    gold18kChangePct: string;
    sekeEmami: string;
    sekeYesterday: string;
    sekeChangePct: string;
    coinBubble: string;
    econNews: string;
  };
  section2_globalMarkets: {
    goldOunce: string;
    ounceYesterday: string;
    ounceChangePct: string;
    dxy: string;
    dxyChangePct: string;
    brentOil: string;
    brentChangePct: string;
    vix: string;
    vixChangePct: string;
    globalFearGreed: string;
    globalNews: string;
  };
  section3_crypto: {
    btcPrice: string;
    btcYesterday: string;
    btcChangePct: string;
    ethPrice: string;
    ethChangePct: string;
    btcDominance: string;
    marketCap: string;
    etfFlow: string;
    etfFlowAmount: string;
    fundingRate: string;
    openInterest: string;
    cryptoFearGreed: string;
    cryptoNews: string;
  };
  section4_bourse: {
    tseIndex: string;
    tseYesterday: string;
    tseIndexChangePct: string;
    tseEqualWeight: string;
    tseEqualWeightChangePct: string;
    retailVolume: string;
    realMoneyFlow: string;
    positiveSymbolsCount: string;
    negativeSymbolsCount: string;
    buyQueueCount: string;
    buyQueueValue: string;
    sellQueueCount: string;
    sellQueueValue: string;
    marketNews: string;
  };
  section5_afranFund: {
    closingPrice: string;
    navPerUnit: string;
    navDiffPct: string;
    volumeUnits: string;
    valueBillionToman: string;
    moneyFlow: string;
    perCapitaBuy: string;
    perCapitaSell: string;
    buyerPower: string;
    aum: string;
  };
  section6_ayarFund: {
    closingPrice: string;
    navPerUnit: string;
    navDiffPct: string;
    volumeUnits: string;
    valueBillionToman: string;
    moneyFlow: string;
    perCapitaBuy: string;
    perCapitaSell: string;
    buyerPower: string;
    aum: string;
  };
  section7_khebarganFund: {
    closingPrice: string;
    yesterdayPrice: string;
    changePct: string;
    navPerUnit: string;
    navDiffPct: string;
    volumeUnits: string;
    valueBillionToman: string;
    moneyFlow: string;
    perCapitaBuy: string;
    perCapitaSell: string;
    buyerPower: string;
  };
  section8_tavanFund: {
    closingPrice: string;
    navPerUnit: string;
    navDiffPct: string;
    volumeUnits: string;
    valueBillionToman: string;
    moneyFlow: string;
    perCapitaBuy: string;
    perCapitaSell: string;
    buyerPower: string;
  };
  section9_otherGoldFunds: {
    ayar: string;
    kahroba: string;
    zar: string;
    gohar: string;
    nafis: string;
    mesghal: string;
  };
  section10_leveragedFunds: {
    ahrom: string;
    tavan: string;
    moj: string;
    shetab: string;
    bidar: string;
    jahesh: string;
    doX: string;
  };
  section11_silverFunds: {
    silver: string;
    noghrein: string;
    noghrabi: string;
  };
  section12_systematicRisks: {
    riskPolitical: string;
    riskMilitary: string;
    riskEconomic: string;
    riskGlobal: string;
    riskCrypto: string;
    cbiDecisions: string;
    seoDecisions: string;
    domesticNews: string;
    internationalNews: string;
  };
  section13_liquidityFlow: {
    flowBourse: string;
    flowGoldFunds: string;
    flowFixedIncome: string;
    flowEquityFunds: string;
    flowLeveragedFunds: string;
    flowCrypto: string;
  };
}


