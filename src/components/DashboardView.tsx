import React, { useState } from 'react';
import { MarketScoreItem, SystemS1Signal } from '../types';
import {
  Send,
  Play,
  FileText,
  Info,
  TrendingUp,
  Coins,
  DollarSign,
  PieChart,
  HelpCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  Sliders,
  Check,
  Scale
} from 'lucide-react';

interface DashboardViewProps {
  signal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  onOpenTelegramModal: () => void;
  onOpenRunNowModal: () => void;
  onOpenDailyReportModal?: () => void;
  onSelectMarket: (market: MarketScoreItem) => void;
  onNavigateToFunds: () => void;
  onNavigateToPortfolio?: () => void;
  onNavigateToNewsRisks?: () => void;
  onNavigateToRulebook?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  signal,
  marketScores,
  onOpenTelegramModal,
  onOpenRunNowModal,
  onOpenDailyReportModal,
  onSelectMarket,
  onNavigateToFunds,
  onNavigateToPortfolio,
  onNavigateToNewsRisks,
  onNavigateToRulebook,
}) => {
  const [selectedWeightMarket, setSelectedWeightMarket] = useState<MarketScoreItem | null>(null);

  const getMarketIcon = (id: string) => {
    switch (id) {
      case 'bourse':
        return <TrendingUp className="w-5 h-5 text-[#10b981]" />;
      case 'gold':
        return <Coins className="w-5 h-5 text-[#ffb77d]" />;
      case 'btc':
        return (
          <span className="w-5 h-5 flex items-center justify-center font-bold text-sm text-[#ef4444]">
            ₿
          </span>
        );
      case 'usdt':
        return <DollarSign className="w-5 h-5 text-[#ffb77d]" />;
      default:
        return <TrendingUp className="w-5 h-5 text-[#dbc2b0]" />;
    }
  };

  const getTrafficLightBadge = (score: number) => {
    if (score >= 80) {
      return {
        label: '🟢 چراغ سبز (خرید پله‌ای / ورود)',
        classes: 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40',
        dot: 'bg-[#10b981]'
      };
    }
    if (score >= 60) {
      return {
        label: '🟡 چراغ زرد (نگهداری Hold)',
        classes: 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40',
        dot: 'bg-[#f59e0b]'
      };
    }
    return {
      label: '🔴 چراغ قرمز (خروج / کاهش وزن)',
      classes: 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/40',
      dot: 'bg-[#ef4444]'
    };
  };

  const isVetoActive = signal.confidenceScore < 6;

  return (
    <div className="flex flex-col w-full gap-5 animate-fade-in">
      {/* 1. Header Engine & Action Bar */}
      <div
        id="engine-control-card"
        className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#271e16] border border-[#554336] rounded-2xl p-5 shadow-lg w-full gap-4 relative overflow-hidden"
      >
        <div className="flex flex-col gap-1.5 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl md:text-2xl font-bold text-[#f2dfd3] tracking-normal">
              سیستم جامع مدیریت سرمایه و ریسک S1
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#ffb77d]/20 text-[#ffb77d] border border-[#ffb77d]/40 rounded-md font-mono-num">
              نسخه ۱.۳ (v1.3)
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs text-[#dbc2b0]/80">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
              </span>
              <span className="font-bold text-[#10b981] uppercase tracking-wider font-mono-num">
                LIVE ENGINE
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 font-mono-num">
              <Clock className="w-3.5 h-3.5 text-[#dbc2b0]/70" />
              <span>پایش ساعت ۱۷:۰۰ تا ۱۸:۰۰ • {signal.lastUpdatedJalali}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto z-10 flex-wrap">
          {onOpenDailyReportModal && (
            <button
              id="open-daily-report-btn"
              onClick={onOpenDailyReportModal}
              className="flex-1 md:flex-none bg-[#ffb77d]/20 text-[#ffb77d] hover:bg-[#ffb77d]/30 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-[#ffb77d]/50 transition-all shadow-sm active:scale-95"
            >
              <FileText className="w-4 h-4 text-[#ffb77d]" />
              گزارش ۱۳ گانه روز
            </button>
          )}

          {onNavigateToRulebook && (
            <button
              id="open-rulebook-btn"
              onClick={onNavigateToRulebook}
              className="flex-1 md:flex-none bg-[#322820] text-[#dbc2b0] hover:text-[#f2dfd3] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#3e332b] border border-[#554336] transition-all"
            >
              <BookOpen className="w-4 h-4 text-[#ffb77d]" />
              کتاب قانون S1
            </button>
          )}

          <button
            id="send-telegram-btn"
            onClick={onOpenTelegramModal}
            className="flex-1 md:flex-none bg-[#3e332b] text-[#f2dfd3] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#322820] hover:text-[#ffb77d] border border-[#554336] transition-all shadow-sm active:scale-95"
          >
            <Send className="w-4 h-4 text-[#0297e8]" />
            ارسال تلگرام
          </button>

          <button
            id="run-now-engine-btn"
            onClick={onOpenRunNowModal}
            className="flex-1 md:flex-none bg-[#ffb77d] text-[#4d2600] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#d97707] hover:text-[#1a120b] transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            اجرای دستی (Run)
          </button>
        </div>
      </div>

      {/* 2. Middle Row: Latest Report (8 cols) & Confidence Meters (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Latest Report (Col 8) */}
        <div
          id="latest-report-card"
          className="lg:col-span-8 bg-[#271e16] border border-[#554336] rounded-2xl p-6 shadow-md flex flex-col gap-4 relative overflow-hidden"
        >
          <div className="flex justify-between items-start z-10">
            <h3 className="text-lg font-bold text-[#f2dfd3] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#ffb77d]" />
              خروجی رسمی سیستم S1 (ماده ۱۱)
            </h3>
            <div className="flex items-center gap-2">
              <span className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                قانون ۳ تایید: فعال
              </span>
            </div>
          </div>

          <div className="bg-[#322820] rounded-xl p-6 mt-1 flex flex-col gap-2 z-10 shadow-inner border border-[#554336]/40 relative">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-[#10b981] rounded-r-xl" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#dbc2b0] font-semibold uppercase tracking-wider font-mono-num">
                {signal.subtitle} • نسخه ۱.۳
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] font-bold border border-[#10b981]/30">
                پله‌های ۲۰ درصدی مجاز
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-[#10b981] mt-1 flex items-center gap-2">
              <span>{signal.actionTitle}</span>
            </div>

            <p className="text-sm sm:text-base text-[#dbc2b0] mt-2 max-w-3xl leading-relaxed">
              {signal.summaryText}
            </p>

            {/* Strategy Highlights */}
            <div className="mt-3 pt-3 border-t border-[#554336]/50 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-[#1a120b] text-[#ffb77d] border border-[#ffb77d]/20">
                ⭐ ستون اصلی طلا: ۸۰٪ عیار شمشمحور
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#1a120b] text-[#10b981] border border-[#10b981]/20">
                📈 ورود پله‌ای بورس: سقف ۶۰٪ سبد
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#1a120b] text-[#96ccff] border border-[#96ccff]/20">
                🛡️ لنگرگاه نقدینگی: افران روزشمار
              </span>
            </div>
          </div>
        </div>

        {/* Confidence & Data Quality (Col 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Decision Confidence Gauge */}
          <div
            id="confidence-score-card"
            className="bg-[#271e16] border border-[#554336] rounded-2xl p-5 shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#f2dfd3] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#ffb77d]" />
                  شاخص اطمینان تصمیم
                </span>
                <span className="font-mono-num text-lg font-bold text-[#ffb77d]">
                  {signal.confidenceScore}/۱۰
                </span>
              </div>
              
              <div className="w-full h-2.5 bg-[#3e332b] rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-l from-[#ffb77d] to-[#10b981] rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ width: `${(signal.confidenceScore / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Veto rule status */}
            <div className="mt-3 pt-2.5 border-t border-[#554336]/40 flex items-center justify-between text-xs">
              <span className="text-[#dbc2b0]/80">قانون وتوی اطمینان (&lt;۶):</span>
              {isVetoActive ? (
                <span className="px-2 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] font-bold flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  خرید وتو شد
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  اطمینان بالا (تایید خرید)
                </span>
              )}
            </div>
          </div>

          {/* Input Data Quality Gauge */}
          <div
            id="data-quality-card"
            className="bg-[#271e16] border border-[#554336] rounded-2xl p-5 shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#f2dfd3] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#96ccff]" />
                  دقت داده‌های ۴۱ شاخص S1
                </span>
                <span className="font-mono-num text-lg font-bold text-[#96ccff]">
                  {signal.dataQualityScore}/{signal.totalMetricsCount}
                </span>
              </div>

              <div className="w-full h-2.5 bg-[#3e332b] rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-l from-[#96ccff] to-[#0297e8] rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{
                    width: `${(signal.dataQualityScore / signal.totalMetricsCount) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#554336]/40 flex justify-between items-center text-xs text-[#dbc2b0]/70 font-mono-num">
              <span>داده ناقص: ۰ مورد</span>
              <span className="text-[#10b981] font-bold">اصل عدم اقدام: غیرفعال</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Navigation Widgets for Portfolio & Systematic Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Portfolio Quick Card */}
        <div
          onClick={onNavigateToPortfolio}
          className="bg-[#271e16] border border-[#ffb77d]/30 hover:border-[#ffb77d] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-md cursor-pointer transition-all hover:bg-[#322820] group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d] border border-[#ffb77d]/30">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#f2dfd3] group-hover:text-[#ffb77d] transition-colors">
                  پورتفوی کاغذی ۱ میلیارد تومانی
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] font-bold font-mono-num">
                  +۱۴.۸۶٪ سود
                </span>
              </div>
              <p className="text-xs text-[#dbc2b0] mt-0.5">
                سقف دراودان: -۴.۱۸٪ (امن، زیر سقف ۱۵٪) • عیار، افران، توان
              </p>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-[#1a120b] text-[#ffb77d] group-hover:translate-x-[-3px] transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* News & Systematic Risks Quick Card */}
        <div
          onClick={onNavigateToNewsRisks}
          className="bg-[#271e16] border border-[#96ccff]/30 hover:border-[#96ccff] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-md cursor-pointer transition-all hover:bg-[#322820] group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-[#96ccff]/15 text-[#96ccff] border border-[#96ccff]/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#f2dfd3] group-hover:text-[#96ccff] transition-colors">
                  شاخص ریسک سیستم (SRI) و اخبار
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#96ccff]/20 text-[#96ccff] font-bold font-mono-num">
                  SRI ۴.۴ (متوسط)
                </span>
              </div>
              <p className="text-xs text-[#dbc2b0] mt-0.5">
                ماتریس ۵ گانه A-E • وضعیت اضطراری غیرفعال • اولویت نقدشوندگی آماده
              </p>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-[#1a120b] text-[#96ccff] group-hover:translate-x-[-3px] transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Market Scoring Cards with S1 v1.3 Traffic Lights */}
      <div className="flex flex-col gap-3.5 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#f2dfd3] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#ffb77d]" />
              امتیازدهی و چراغ‌های سه‌گانه بازارها (۰ تا ۱۰۰)
            </h3>
            <span className="text-xs text-[#dbc2b0]/70">
              🔴 ۰-۵۹: خروج/کاهش | 🟡 ۶۰-۷۹: نگهداری | 🟢 ۸۰-۱۰۰: خرید پله‌ای
            </span>
          </div>
          <span className="text-xs text-[#ffb77d] bg-[#ffb77d]/10 px-3 py-1 rounded-lg border border-[#ffb77d]/30 self-start sm:self-auto font-mono-num">
            قانون اختلاف امتیاز: حداقل ۱۵+ امتیاز
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {marketScores.map((market) => {
            const traffic = getTrafficLightBadge(market.score);
            const isGreen = market.score >= 80;
            const isRed = market.score < 60;

            const strokeColor = isGreen ? '#10b981' : isRed ? '#ef4444' : '#f59e0b';

            return (
              <div
                key={market.id}
                id={`market-card-${market.id}`}
                className="bg-[#271e16] border border-[#554336] rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:border-[#ffb77d]/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Card Title & Icon */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-base font-bold text-[#f2dfd3]">
                      {market.name}
                    </span>
                    <div className="p-1.5 rounded-lg bg-[#322820] border border-[#554336]/60">
                      {getMarketIcon(market.id)}
                    </div>
                  </div>

                  {/* Traffic Light Pill */}
                  <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border mb-4 flex items-center justify-between ${traffic.classes}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${traffic.dot}`} />
                      <span>{traffic.label}</span>
                    </div>
                  </div>

                  {/* Circular SVG Gauge & Sentiment Label */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-[#3e332b]"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={strokeColor}
                          strokeDasharray={`${market.score}, 100`}
                          strokeWidth="3.2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute font-mono-num text-lg font-bold text-[#f2dfd3]">
                        {market.score}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#dbc2b0]/80">امتیاز نهایی S1</span>
                      <span className="text-sm font-bold text-[#f2dfd3]">
                        {market.sentiment}
                      </span>
                      {market.threeConfirmations && (
                        <span className={`text-[10px] font-semibold mt-0.5 ${market.threeConfirmations.isConfirmed ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                          {market.threeConfirmations.isConfirmed ? '✓ ۳ تایید پاس شد' : '✗ ۳ تایید ناقص'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bullet Metrics */}
                  <ul className="flex flex-col gap-1.5 text-xs text-[#dbc2b0] border-t border-[#554336]/40 pt-3">
                    {market.metrics.map((m, idx) => (
                      <li key={idx} className="flex justify-between items-center text-[11px]">
                        <span className="text-[#dbc2b0]/80">{m.label}</span>
                        <span
                          className={`font-semibold ${
                            m.status === 'positive'
                              ? 'text-[#10b981]'
                              : m.status === 'negative' || m.status === 'warning'
                              ? 'text-[#ffb4ab]'
                              : 'text-[#f2dfd3]'
                          }`}
                        >
                          {m.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions: View Details / Inspect Formula */}
                <div className="mt-4 pt-3 flex items-center justify-between gap-2 border-t border-[#554336]/30">
                  <button
                    onClick={() => setSelectedWeightMarket(market)}
                    className="text-[11px] text-[#ffb77d] hover:text-[#f2dfd3] flex items-center gap-1 font-semibold transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>اوزان فرمول S1</span>
                  </button>

                  <button
                    onClick={() => onSelectMarket(market)}
                    className="text-[11px] text-[#dbc2b0] hover:text-[#ffb77d] flex items-center gap-1 transition-colors"
                  >
                    <span>تحلیل جامع</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formula Weight Breakdown Modal */}
      {selectedWeightMarket && (
        <div
          id="formula-breakdown-modal"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedWeightMarket(null)}
        >
          <div
            className="bg-[#231a13] border border-[#554336] rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#554336] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#1a120b] border border-[#554336]">
                  {getMarketIcon(selectedWeightMarket.id)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#f2dfd3]">
                    فرمول ۱۰۰ امتیازی {selectedWeightMarket.name} (S1 v1.3)
                  </h3>
                  <span className="text-xs text-[#dbc2b0]/80">
                    امتیاز کسب‌شده: {selectedWeightMarket.score} از ۱۰۰
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedWeightMarket(null)}
                className="p-1.5 rounded-lg bg-[#1a120b] text-[#dbc2b0] hover:text-[#f2dfd3]"
              >
                ✕
              </button>
            </div>

            {/* Three Confirmations Status Box */}
            {selectedWeightMarket.threeConfirmations && (
              <div className="p-4 rounded-xl bg-[#1a120b] border border-[#554336] flex flex-col gap-2.5">
                <span className="text-xs font-bold text-[#ffb77d] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  وضعیت قانون ۳ تایید مستقل (Triple Confirmation Rule)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className={`p-2 rounded-lg border ${selectedWeightMarket.threeConfirmations.criterion1.passed ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
                    <div className="font-bold flex items-center gap-1">
                      {selectedWeightMarket.threeConfirmations.criterion1.passed ? '✓' : '✗'} تایید ۱
                    </div>
                    <div className="text-[10px] text-[#dbc2b0] mt-0.5">{selectedWeightMarket.threeConfirmations.criterion1.name}</div>
                  </div>

                  <div className={`p-2 rounded-lg border ${selectedWeightMarket.threeConfirmations.criterion2.passed ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
                    <div className="font-bold flex items-center gap-1">
                      {selectedWeightMarket.threeConfirmations.criterion2.passed ? '✓' : '✗'} تایید ۲
                    </div>
                    <div className="text-[10px] text-[#dbc2b0] mt-0.5">{selectedWeightMarket.threeConfirmations.criterion2.name}</div>
                  </div>

                  <div className={`p-2 rounded-lg border ${selectedWeightMarket.threeConfirmations.criterion3.passed ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
                    <div className="font-bold flex items-center gap-1">
                      {selectedWeightMarket.threeConfirmations.criterion3.passed ? '✓' : '✗'} تایید ۳
                    </div>
                    <div className="text-[10px] text-[#dbc2b0] mt-0.5">{selectedWeightMarket.threeConfirmations.criterion3.name}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Weight Table */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-[#f2dfd3]">تفکیک اوزان و متغیرهای فرمول S1:</span>
              <div className="flex flex-col gap-2">
                {selectedWeightMarket.weightBreakdown?.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#1a120b] border border-[#554336]/60 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#f2dfd3]">{item.variable}</span>
                      <span className="font-mono-num font-bold text-[#ffb77d]">
                        {item.scoreAchieved} / {item.weight} نمره
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#3e332b] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ffb77d] rounded-full"
                        style={{ width: `${(item.scoreAchieved / item.weight) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#dbc2b0]/70">
                      <span>منبع: {item.source}</span>
                      <span>{item.evaluation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#554336] flex justify-end">
              <button
                onClick={() => setSelectedWeightMarket(null)}
                className="px-5 py-2 rounded-xl bg-[#ffb77d] text-[#1a120b] text-xs font-bold hover:bg-[#d97707]"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
