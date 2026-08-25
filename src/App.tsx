import React, { useState } from 'react';
import {
  ActiveTab,
  MarketScoreItem,
  InputMetric,
  FundItem,
  SystemS1Signal,
  TelegramConfig,
  SystemHistoryLog,
  PortfolioSummary,
  PortfolioAssetItem,
  PortfolioHistoryPoint,
  PortfolioTradeItem,
  NewsItem,
  SystemicRiskItem,
  AiDailySummary,
  StandardDailyInput13Sections,
  ValidationAuditReport,
} from './types';
import {
  initialMarketScores,
  initialSignal,
  initialDailyInputs,
  initialFunds,
  initialTelegramConfig,
  initialHistoryLogs,
  initialPortfolioSummary,
  initialPortfolioAssets,
  initialPortfolioHistory,
  initialPortfolioTrades,
  initialNews,
  initialSystemicRisks,
  initialSRI,
  initialAiDailySummary,
} from './data';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InputsView } from './components/InputsView';
import { FundsView } from './components/FundsView';
import { PortfolioView } from './components/PortfolioView';
import { NewsRisksView } from './components/NewsRisksView';
import { SettingsView } from './components/SettingsView';
import { RulebookView } from './components/RulebookView';
import { RunNowModal } from './components/RunNowModal';
import { TelegramModal } from './components/TelegramModal';
import { DailyReportModal } from './components/DailyReportModal';
import { MarketDetailsModal } from './components/MarketDetailsModal';
import { ValidationCoreModal } from './components/ValidationCoreModal';
import { getDefault13SectionsData, runS1ValidationCore } from './utils/s1ValidationCore';
import {
  getLiveJalaliDateString,
  getLiveJalaliVerboseDate,
  getTehranTimeString,
  getLiveDateTimeString,
} from './utils/dateHelper';
import {
  loadUnifiedState,
  persistUnifiedState,
  checkDataFreshness,
} from './utils/s1DataEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Unified S1 State initialized from persistent unified engine with dynamic freshness check
  const [unifiedState] = useState(() => loadUnifiedState());
  const [marketScores, setMarketScores] = useState<MarketScoreItem[]>(unifiedState.marketScores);
  const [signal, setSignal] = useState<SystemS1Signal>(unifiedState.signal);
  const [inputs, setInputs] = useState<InputMetric[]>(unifiedState.inputs);
  const [daily13Sections, setDaily13Sections] = useState<StandardDailyInput13Sections>(unifiedState.daily13Sections);
  const [auditReport, setAuditReport] = useState<ValidationAuditReport | null>(unifiedState.auditReport);
  const [funds, setFunds] = useState<FundItem[]>(initialFunds);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(initialTelegramConfig);
  const [historyLogs, setHistoryLogs] = useState<SystemHistoryLog[]>(initialHistoryLogs);

  // Dynamic Data Freshness Status
  const freshnessStatus = checkDataFreshness(daily13Sections?.metadata?.jalaliDate || signal.lastUpdatedJalali);

  // Paper Portfolio Management State
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>(initialPortfolioSummary);
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAssetItem[]>(initialPortfolioAssets);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>(initialPortfolioHistory);
  const [portfolioTrades, setPortfolioTrades] = useState<PortfolioTradeItem[]>(initialPortfolioTrades);

  // News, Systematic Risks & AI Summary State
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [systemicRisks, setSystemicRisks] = useState<SystemicRiskItem[]>(initialSystemicRisks);
  const [aiDailySummary, setAiDailySummary] = useState<AiDailySummary>(initialAiDailySummary);

  // Modals state
  const [isRunNowModalOpen, setIsRunNowModalOpen] = useState<boolean>(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState<boolean>(false);
  const [isDailyReportModalOpen, setIsDailyReportModalOpen] = useState<boolean>(false);
  const [isValidationCoreModalOpen, setIsValidationCoreModalOpen] = useState<boolean>(false);
  const [selectedMarketForModal, setSelectedMarketForModal] = useState<MarketScoreItem | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Rebalance 1 Billion Toman Portfolio to S1 Target Weights
  const handleRebalancePortfolioToS1 = () => {
    const totalVal = portfolioSummary.currentValueToman;
    const dateStr = `${getLiveJalaliDateString(0, true)} ${getTehranTimeString(true)}`;

    // Target allocations based on S1 signal
    const updatedAssets = portfolioAssets.map((asset) => {
      const targetVal = (totalVal * asset.targetWeightPct) / 100;
      const targetUnits = asset.unitPriceToman > 0 ? Math.round(targetVal / asset.unitPriceToman) : 1;
      const pnlToman = targetVal - asset.initialCostToman;
      const pnlPct = Number(((pnlToman / asset.initialCostToman) * 100).toFixed(2));

      return {
        ...asset,
        allocatedValueToman: targetVal,
        weightPct: asset.targetWeightPct,
        units: targetUnits,
        pnlToman,
        pnlPct,
      };
    });

    setPortfolioAssets(updatedAssets);

    // Update Summary
    setPortfolioSummary((prev) => ({
      ...prev,
      lastRebalanceDateJalali: `${getLiveJalaliVerboseDate(0)} - بازتوازن هوشمند S1`,
    }));

    // Add rebalance trade record
    const rebalanceTrade: PortfolioTradeItem = {
      id: `trade-${Date.now()}`,
      dateJalali: getLiveJalaliVerboseDate(0),
      assetName: 'بازتوازن جامع سبد S1',
      assetTicker: 'REBALANCE-ALL',
      type: 'rebalance',
      units: 0,
      unitPriceToman: 0,
      amountToman: totalVal,
      rationale: 'اجرای بازتوازن خودکار طبق مدل سیستم S1 (افزایش طلا به ۳۵٪ و افران به ۳۰٪)',
    };

    setPortfolioTrades([rebalanceTrade, ...portfolioTrades]);
  };

  // Re-calculate engine when inputs change
  const handleRecalculateEngine = (updatedInputs: InputMetric[]) => {
    // Compute average score contributions per category
    const bourseInputs = updatedInputs.filter((i) => i.category === 'bourse');
    const goldInputs = updatedInputs.filter((i) => i.category === 'gold');
    const cryptoInputs = updatedInputs.filter((i) => i.category === 'crypto');
    const forexInputs = updatedInputs.filter((i) => i.category === 'forex');

    const avgBourse = Math.round(
      (bourseInputs.reduce((acc, i) => acc + i.scoreContribution, 0) / (bourseInputs.length * 10)) * 100
    );
    const avgGold = Math.round(
      (goldInputs.reduce((acc, i) => acc + i.scoreContribution, 0) / (goldInputs.length * 10)) * 100
    );
    const avgCrypto = Math.round(
      (cryptoInputs.reduce((acc, i) => acc + i.scoreContribution, 0) / (cryptoInputs.length * 10)) * 100
    );
    const avgForex = Math.round(
      (forexInputs.reduce((acc, i) => acc + i.scoreContribution, 0) / (forexInputs.length * 10)) * 100
    );

    const updatedMarkets = marketScores.map((m) => {
      if (m.id === 'bourse') {
        const score = Math.max(10, Math.min(100, avgBourse));
        return {
          ...m,
          score,
          sentiment: (score >= 85 ? 'Strong Bull' : score >= 75 ? 'Bullish' : score >= 50 ? 'Neutral' : 'Bearish') as any,
        };
      }
      if (m.id === 'gold') {
        const score = Math.max(10, Math.min(100, avgGold));
        return {
          ...m,
          score,
          sentiment: (score >= 85 ? 'Strong Bull' : score >= 75 ? 'Bullish' : score >= 50 ? 'Neutral' : 'Bearish') as any,
        };
      }
      if (m.id === 'btc') {
        const score = Math.max(10, Math.min(100, avgCrypto));
        return {
          ...m,
          score,
          sentiment: (score >= 85 ? 'Strong Bull' : score >= 75 ? 'Bullish' : score >= 50 ? 'Neutral' : 'Bearish') as any,
        };
      }
      if (m.id === 'usdt') {
        const score = Math.max(10, Math.min(100, avgForex));
        return {
          ...m,
          score,
          sentiment: (score >= 85 ? 'Strong Bull' : score >= 75 ? 'Bullish' : score >= 50 ? 'Neutral' : 'Bearish') as any,
        };
      }
      return m;
    });

    setMarketScores(updatedMarkets);

    // Compute composite S1 index
    const compositeScore = Math.round(
      avgBourse * 0.3 + avgGold * 0.3 + avgForex * 0.25 + avgCrypto * 0.15
    );

    let action = 'خرید پله‌ای مجاز است';
    let summary = 'با توجه به ثبات در بازار ارز و ورود جریان نقدینگی خرد به صندوق‌های طلا و درآمد ثابت، شرایط برای انباشت تدریجی دارایی‌های کم‌ریسک فراهم است.';

    if (compositeScore >= 85) {
      action = 'ورود پرقدرت و تهاجمی';
      summary = 'جریان نقدینگی در تمام بازارها با قدرت فزاینده در حال صعود است. افزایش سهم صندوق‌های طلا و اهرمی توصیه می‌شود.';
    } else if (compositeScore < 60) {
      action = 'تثبیت سود و افزایش نقدینگی';
      summary = 'افزایش نااطمینانی‌های سیستماتیک و اصلاح شاخص‌ها. تخصیص حداکثری به صندوق‌های درآمد ثابت توصیه می‌گردد.';
    }

    const updatedSignal: SystemS1Signal = {
      ...signal,
      overallScore: compositeScore,
      actionTitle: action,
      summaryText: summary,
      lastUpdatedJalali: `${getLiveJalaliDateString(0, true)} ${getTehranTimeString(true)}:00`,
    };

    setSignal(updatedSignal);
    persistUnifiedState(updatedInputs, daily13Sections, updatedSignal);
  };

  const handleApplyFreshSignal = (
    freshSignal: SystemS1Signal,
    newInputs?: InputMetric[],
    new13Sections?: StandardDailyInput13Sections,
    newAudit?: ValidationAuditReport
  ) => {
    setSignal(freshSignal);
    const finalInputs = newInputs && newInputs.length > 0 ? newInputs : inputs;
    const finalSections = new13Sections || daily13Sections;

    if (newInputs && newInputs.length > 0) {
      setInputs(newInputs);
      handleRecalculateEngine(newInputs);
    }
    if (new13Sections) {
      setDaily13Sections(new13Sections);
    }
    if (newAudit) {
      setAuditReport(newAudit);
    }

    persistUnifiedState(finalInputs, finalSections, freshSignal);

    // Add to history log
    const newLog: SystemHistoryLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      jalaliDate: freshSignal.lastUpdatedJalali,
      action: freshSignal.actionTitle,
      compositeScore: freshSignal.overallScore,
      bourseScore: marketScores.find((m) => m.id === 'bourse')?.score || 82,
      goldScore: marketScores.find((m) => m.id === 'gold')?.score || 90,
      btcScore: marketScores.find((m) => m.id === 'btc')?.score || 58,
      usdtScore: marketScores.find((m) => m.id === 'usdt')?.score || 81,
      confidence: `${freshSignal.confidenceScore}/۱۰ (بسیار بالا)`,
      notes: freshSignal.summaryText,
    };
    setHistoryLogs([newLog, ...historyLogs]);
  };

  const handleRevalidateCore = () => {
    const validated = runS1ValidationCore(inputs, daily13Sections);
    setAuditReport(validated.auditReport);
    setDaily13Sections(validated.validated13Sections);
    persistUnifiedState(inputs, validated.validated13Sections, signal);
  };

  return (
    <div className="min-h-screen bg-[#1a120b] text-[#f2dfd3] flex font-sans">
      {/* 1. Sidebar Navigation (Right pinned for RTL) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 lg:pr-72 flex flex-col min-w-0 transition-all duration-300">
        {/* Sticky Header */}
        <Header
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onRunNow={() => setIsRunNowModalOpen(true)}
        />

        {/* Dynamic Main View */}
        <main className="relative pt-20 p-4 sm:p-6 max-w-7xl w-full mx-auto min-h-screen">
          {activeTab === 'dashboard' && (
            <DashboardView
              signal={signal}
              marketScores={marketScores}
              freshnessStatus={freshnessStatus}
              onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
              onOpenRunNowModal={() => setIsRunNowModalOpen(true)}
              onOpenDailyReportModal={() => setIsDailyReportModalOpen(true)}
              onSelectMarket={(market) => setSelectedMarketForModal(market)}
              onNavigateToFunds={() => setActiveTab('funds')}
              onNavigateToPortfolio={() => setActiveTab('portfolio')}
              onNavigateToNewsRisks={() => setActiveTab('news_risks')}
              onNavigateToRulebook={() => setActiveTab('rulebook')}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioView
              summary={portfolioSummary}
              assets={portfolioAssets}
              history={portfolioHistory}
              trades={portfolioTrades}
              signal={signal}
              onRebalanceToS1={handleRebalancePortfolioToS1}
            />
          )}

          {activeTab === 'news_risks' && (
            <NewsRisksView
              news={news}
              systemicRisks={systemicRisks}
              aiSummary={aiDailySummary}
              signal={signal}
              onRefreshAiAnalysis={() => {}}
            />
          )}

          {activeTab === 'inputs' && (
            <InputsView
              inputs={inputs}
              onUpdateInputs={(updated) => setInputs(updated)}
              onRecalculateEngine={handleRecalculateEngine}
              daily13Sections={daily13Sections}
              auditReport={auditReport}
              onOpenValidationCore={() => setIsValidationCoreModalOpen(true)}
              onApplyLiveResult={(result) => {
                setInputs(result.updatedInputs);
                if (result.validated13Sections) {
                  setDaily13Sections(result.validated13Sections);
                }
                if (result.auditReport) {
                  setAuditReport(result.auditReport);
                }
                handleRecalculateEngine(result.updatedInputs);
              }}
            />
          )}

          {activeTab === 'funds' && (
            <FundsView funds={funds} signal={signal} />
          )}

          {activeTab === 'rulebook' && (
            <RulebookView />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              telegramConfig={telegramConfig}
              onUpdateTelegramConfig={(cfg) => setTelegramConfig(cfg)}
              historyLogs={historyLogs}
              onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* 3. Modals */}
      <RunNowModal
        isOpen={isRunNowModalOpen}
        onClose={() => setIsRunNowModalOpen(false)}
        onApplyResults={handleApplyFreshSignal}
        currentSignal={signal}
        marketScores={marketScores}
        inputs={inputs}
        current13Sections={daily13Sections}
      />

      <TelegramModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        signal={signal}
        marketScores={marketScores}
        inputs={inputs}
        assets={portfolioAssets}
        trades={portfolioTrades}
        telegramConfig={telegramConfig}
        daily13Sections={daily13Sections}
        auditReport={auditReport}
      />

      <DailyReportModal
        isOpen={isDailyReportModalOpen}
        onClose={() => setIsDailyReportModalOpen(false)}
        signal={signal}
        marketScores={marketScores}
        inputs={inputs}
        assets={portfolioAssets}
        trades={portfolioTrades}
        sri={initialSRI}
        aiSummary={aiDailySummary}
        daily13Sections={daily13Sections}
        auditReport={auditReport}
        onOpenTelegram={() => {
          setIsDailyReportModalOpen(false);
          setIsTelegramModalOpen(true);
        }}
      />

      <ValidationCoreModal
        isOpen={isValidationCoreModalOpen}
        onClose={() => setIsValidationCoreModalOpen(false)}
        auditReport={auditReport}
        daily13Sections={daily13Sections}
        onRevalidate={handleRevalidateCore}
      />

      <MarketDetailsModal
        market={selectedMarketForModal}
        onClose={() => setSelectedMarketForModal(null)}
      />
    </div>
  );
}

