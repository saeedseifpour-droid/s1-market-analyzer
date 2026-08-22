import React, { useState } from 'react';
import {
  PortfolioSummary,
  PortfolioAssetItem,
  PortfolioHistoryPoint,
  PortfolioTradeItem,
  SystemS1Signal,
} from '../types';
import { getLiveJalaliVerboseDate } from '../utils/dateHelper';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  ShieldAlert,
  Award,
  DollarSign,
  PlusCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  Coins,
  Building2,
  Banknote,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface PortfolioViewProps {
  summary: PortfolioSummary;
  assets: PortfolioAssetItem[];
  history: PortfolioHistoryPoint[];
  trades: PortfolioTradeItem[];
  signal: SystemS1Signal;
  onUpdateAsset?: (assetId: string, newAllocatedToman: number) => void;
  onRebalanceToS1?: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  summary,
  assets,
  history,
  trades,
  signal,
  onRebalanceToS1,
}) => {
  const [chartMode, setChartMode] = useState<'both' | 'value' | 'drawdown'>('both');
  const [timeFilter, setTimeFilter] = useState<'all' | '30d' | '15d'>('all');
  const [selectedAsset, setSelectedAsset] = useState<PortfolioAssetItem | null>(null);
  const [showRebalanceAlert, setShowRebalanceAlert] = useState<boolean>(false);
  const [rebalanceSuccess, setRebalanceSuccess] = useState<boolean>(false);

  // Filter history points based on time range
  const filteredHistory = React.useMemo(() => {
    if (timeFilter === '15d') {
      return history.slice(-6);
    }
    if (timeFilter === '30d') {
      return history.slice(-10);
    }
    return history;
  }, [history, timeFilter]);

  const formatToman = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(val)) + ' تومان';
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val);
  };

  const handleTriggerRebalance = () => {
    setShowRebalanceAlert(true);
    setTimeout(() => {
      setShowRebalanceAlert(false);
      setRebalanceSuccess(true);
      if (onRebalanceToS1) onRebalanceToS1();
      setTimeout(() => setRebalanceSuccess(false), 4000);
    }, 1200);
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as PortfolioHistoryPoint;
      return (
        <div className="bg-[#231a13] border border-[#554336] p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[200px] text-right" dir="rtl">
          <div className="font-bold text-[#ffb77d] border-b border-[#554336]/60 pb-1.5 flex items-center justify-between">
            <span>تاریخ: {dataPoint.dateJalali}</span>
            <span className="text-[10px] text-[#dbc2b0]">{dataPoint.dateKey}</span>
          </div>

          <div className="flex items-center justify-between text-[#f2dfd3] pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffb77d]"></span>
              ارزش کل سبد:
            </span>
            <span className="font-mono-num font-bold text-[#ffb77d]">
              {formatToman(dataPoint.portfolioValue)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[#dbc2b0]">
            <span>افت از اوج (Drawdown):</span>
            <span className={`font-mono-num font-bold ${dataPoint.drawdownPct < 0 ? 'text-[#f87171]' : 'text-[#10b981]'}`}>
              {formatNumber(dataPoint.drawdownPct)}٪
            </span>
          </div>

          <div className="flex items-center justify-between text-[#dbc2b0]">
            <span>تغییر نسبت به روز قبل:</span>
            <span className={`font-mono-num font-bold ${dataPoint.dailyReturnPct >= 0 ? 'text-[#10b981]' : 'text-[#f87171]'}`}>
              {dataPoint.dailyReturnPct >= 0 ? '+' : ''}{formatNumber(dataPoint.dailyReturnPct)}٪
            </span>
          </div>

          {dataPoint.notes && (
            <div className="text-[10px] text-[#96ccff] bg-[#1a120b] p-1.5 rounded mt-1 border border-[#554336]/40">
              💡 {dataPoint.notes}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-gradient-to-l from-[#2d1b10] via-[#231a13] to-[#1a120b] border border-[#554336] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#ffb77d]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d] border border-[#ffb77d]/30">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#f2dfd3] tracking-tight">
                  مدیریت پورتفوی کاغذی ۱ میلیارد تومانی
                </h2>
                <p className="text-xs text-[#dbc2b0]/80">
                  Paper Portfolio Management (S1 Model Allocation & Rebalancing)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handleTriggerRebalance}
              disabled={showRebalanceAlert}
              className="flex-1 md:flex-none px-4 py-2.5 bg-[#d97707] hover:bg-[#b45309] text-[#1a120b] font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${showRebalanceAlert ? 'animate-spin' : ''}`} />
              {showRebalanceAlert ? 'در حال بازتوازن...' : 'بازتوازن هوشمند بر مبنای S1'}
            </button>
          </div>
        </div>

        {rebalanceSuccess && (
          <div className="mt-4 p-3 bg-[#10b981]/15 border border-[#10b981]/40 rounded-xl text-xs text-[#10b981] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>پورتفوی با موفقیت طبق آخرین تارگت‌های وزنی موتور S1 بازتوازن شد!</span>
          </div>
        )}
      </div>

      {/* 2. Key Metrics Summary Cards (خلاصه شاخص‌ها) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Current Portfolio Value */}
        <div className="bg-[#231a13] border border-[#554336] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#ffb77d]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
            <span className="font-medium">ارزش روز کل پرتفو</span>
            <div className="p-1.5 bg-[#ffb77d]/10 text-[#ffb77d] rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[#ffb77d] tracking-tight">
              {formatToman(summary.currentValueToman)}
            </div>
            <div className="text-[11px] text-[#dbc2b0]/70 flex items-center gap-1 mt-0.5 font-mono-num">
              <span>سرمایه پایه:</span>
              <span>{formatToman(summary.initialCapitalToman)}</span>
            </div>
          </div>
          <div className="text-[10px] text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
            <ArrowUpRight className="w-3 h-3" />
            <span>+{formatToman(summary.totalPnlToman)} سود تحقق‌یافته</span>
          </div>
        </div>

        {/* Metric 2: Daily PnL */}
        <div className="bg-[#231a13] border border-[#554336] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#10b981]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
            <span className="font-medium">سود / زیان روزانه</span>
            <div className="p-1.5 bg-[#10b981]/10 text-[#10b981] rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[#10b981] tracking-tight flex items-center gap-1">
              <span>+{formatNumber(summary.dailyPnlPct)}٪</span>
            </div>
            <div className="text-[11px] text-[#dbc2b0]/70 flex items-center gap-1 mt-0.5 font-mono-num">
              <span>مبلغ تغییر روز:</span>
              <span className="text-[#10b981]">+{formatToman(summary.dailyPnlToman)}</span>
            </div>
          </div>
          <div className="text-[10px] text-[#dbc2b0] bg-[#322820] px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
            <span>تاریخ: امروز ({getLiveJalaliVerboseDate(0)})</span>
          </div>
        </div>

        {/* Metric 3: Total Profit % */}
        <div className="bg-[#231a13] border border-[#554336] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#ffb77d]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
            <span className="font-medium">سود کل پورتفو</span>
            <div className="p-1.5 bg-[#ffb77d]/10 text-[#ffb77d] rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[#ffb77d] tracking-tight">
              +{formatNumber(summary.totalPnlPct)}٪
            </div>
            <div className="text-[11px] text-[#dbc2b0]/70 flex items-center gap-1 mt-0.5 font-mono-num">
              <span>کل بازدهی ریالی:</span>
              <span className="text-[#10b981]">+{formatToman(summary.totalPnlToman)}</span>
            </div>
          </div>
          <div className="text-[10px] text-[#96ccff] bg-[#96ccff]/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
            <span>نسبت شارپ: {formatNumber(summary.sharpeRatio)}</span>
          </div>
        </div>

        {/* Metric 4: Max Drawdown % */}
        <div className="bg-[#231a13] border border-[#554336] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#f87171]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
            <span className="font-medium">بیشترین افت سرمایه (Max DD)</span>
            <div className="p-1.5 bg-[#f87171]/10 text-[#f87171] rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[#f87171] tracking-tight">
              {formatNumber(summary.maxDrawdownPct)}٪
            </div>
            <div className="text-[11px] text-[#dbc2b0]/70 flex items-center gap-1 mt-0.5">
              <span>کنترل ریسک:</span>
              <span className="text-[#10b981] font-semibold">بسیار عالی (ایمن)</span>
            </div>
          </div>
          <div className="text-[10px] text-[#dbc2b0] bg-[#322820] px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
            <span>سقف مجاز سیستم: -۱۰٪</span>
          </div>
        </div>

        {/* Metric 5: Win Rate % */}
        <div className="bg-[#231a13] border border-[#554336] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#96ccff]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
            <span className="font-medium">نرخ برد معاملات (Win Rate)</span>
            <div className="p-1.5 bg-[#96ccff]/10 text-[#96ccff] rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[#96ccff] tracking-tight">
              {formatNumber(summary.winRatePct)}٪
            </div>
            <div className="text-[11px] text-[#dbc2b0]/70 flex items-center gap-1 mt-0.5">
              <span>تعداد موقعیت‌های فعال:</span>
              <span className="font-mono-num font-bold text-[#f2dfd3]">{summary.activePositionsCount} دارایی</span>
            </div>
          </div>
          <div className="text-[10px] text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
            <span>نقدینگی آزاد: {formatToman(summary.cashBalanceToman)}</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Line Chart (روند تغییرات ارزش روز و Drawdown) */}
      <div className="bg-[#231a13] border border-[#554336] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#554336]/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ffb77d]/10 text-[#ffb77d]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                نمودار تعاملی رشد ارزش پورتفو و میزان افت سرمایه (Drawdown)
              </h3>
              <p className="text-xs text-[#dbc2b0]/70">
                بررسی عملکرد پورتفوی ۱ میلیارد تومانی و مقایسه با مبنای اولیه سرمایه
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#1a120b] p-1 rounded-xl border border-[#554336]">
              <button
                onClick={() => setChartMode('both')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartMode === 'both'
                    ? 'bg-[#ffb77d] text-[#1a120b]'
                    : 'text-[#dbc2b0] hover:text-[#f2dfd3]'
                }`}
              >
                نمای همزمان
              </button>
              <button
                onClick={() => setChartMode('value')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartMode === 'value'
                    ? 'bg-[#ffb77d] text-[#1a120b]'
                    : 'text-[#dbc2b0] hover:text-[#f2dfd3]'
                }`}
              >
                فقط ارزش سبد
              </button>
              <button
                onClick={() => setChartMode('drawdown')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartMode === 'drawdown'
                    ? 'bg-[#ffb77d] text-[#1a120b]'
                    : 'text-[#dbc2b0] hover:text-[#f2dfd3]'
                }`}
              >
                فقط Drawdown
              </button>
            </div>

            {/* Time Filter */}
            <div className="flex items-center bg-[#1a120b] p-1 rounded-xl border border-[#554336]">
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                  timeFilter === 'all' ? 'bg-[#3e332b] text-[#ffb77d]' : 'text-[#dbc2b0]'
                }`}
              >
                کل دوره
              </button>
              <button
                onClick={() => setTimeFilter('30d')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                  timeFilter === '30d' ? 'bg-[#3e332b] text-[#ffb77d]' : 'text-[#dbc2b0]'
                }`}
              >
                ۳۰ روز اخیر
              </button>
              <button
                onClick={() => setTimeFilter('15d')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                  timeFilter === '15d' ? 'bg-[#3e332b] text-[#ffb77d]' : 'text-[#dbc2b0]'
                }`}
              >
                ۱۵ روز اخیر
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'drawdown' ? (
              <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ddColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#554336" opacity={0.3} />
                <XAxis dataKey="dateJalali" stroke="#dbc2b0" fontSize={11} tickMargin={8} />
                <YAxis stroke="#dbc2b0" fontSize={11} unit="٪" domain={[-6, 1]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'بدون افت', fill: '#10b981', fontSize: 10 }} />
                <Area type="monotone" dataKey="drawdownPct" stroke="#f87171" strokeWidth={2.5} fillOpacity={1} fill="url(#ddColor)" name="افت سرمایه (Drawdown %)" />
              </AreaChart>
            ) : (
              <LineChart data={filteredHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffb77d" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ffb77d" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#554336" opacity={0.3} />
                <XAxis dataKey="dateJalali" stroke="#dbc2b0" fontSize={11} tickMargin={8} />
                <YAxis
                  yAxisId="left"
                  stroke="#ffb77d"
                  fontSize={11}
                  unit=" م.ت"
                  domain={['dataMin - 15', 'dataMax + 20']}
                  tickFormatter={(val) => `${val}`}
                />
                {chartMode === 'both' && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#f87171"
                    fontSize={11}
                    unit="٪"
                    domain={[-6, 2]}
                  />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  formatter={(value) => <span className="text-[#dbc2b0]">{value}</span>}
                />
                <ReferenceLine
                  yAxisId="left"
                  y={1000}
                  stroke="#9ca3af"
                  strokeDasharray="4 4"
                  label={{ value: 'سرمایه پایه (۱ میلیارد)', fill: '#9ca3af', fontSize: 10, position: 'insideBottomRight' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="portfolioValueMillion"
                  name="ارزش روز پورتفو (میلیون تومان)"
                  stroke="#ffb77d"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#ffb77d', stroke: '#1a120b', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#ffb77d' }}
                />
                {chartMode === 'both' && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="drawdownPct"
                    name="افت سرمایه (Drawdown %)"
                    stroke="#f87171"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Bottom Legend Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-[#dbc2b0]">
          <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336]/60 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ffb77d]"></span>
              سرمایه اولیه پورتفو:
            </span>
            <span className="font-mono-num font-bold text-[#f2dfd3]">۱,۰۰۰,۰۰۰,۰۰۰ تومان</span>
          </div>

          <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336]/60 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              سود ناخالص خلق‌شده:
            </span>
            <span className="font-mono-num font-bold text-[#10b981]">+۱۴۸,۶۵۰,۰۰۰ تومان</span>
          </div>

          <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336]/60 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#96ccff]"></span>
              آخرین تاریخ بازتوازن:
            </span>
            <span className="font-mono-num font-bold text-[#96ccff]">{summary.lastRebalanceDateJalali}</span>
          </div>
        </div>
      </div>

      {/* 4. Asset Allocation & Positions Table (جدول نمایش وزن و دارایی‌های موجود در سبد) */}
      <div className="bg-[#231a13] border border-[#554336] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#554336]/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ffb77d]/10 text-[#ffb77d]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                جدول ترکیب دارایی‌ها و وزن‌های سبد (Asset Allocations & Holdings)
              </h3>
              <p className="text-xs text-[#dbc2b0]/70">
                شامل صندوق عیار، صندوق افران، صندوق توان/اهرم، طلای فیزیکی و نقدینگی ریالی
              </p>
            </div>
          </div>

          <div className="text-xs text-[#dbc2b0] bg-[#1a120b] px-3 py-1.5 rounded-xl border border-[#554336] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#ffb77d]" />
            <span>تارگت سیستم S1: ۳۵٪ طلا | ۳۰٪ افران | ۲۰٪ سهامی | ۱۰٪ فیزیکی | ۵٪ نقد</span>
          </div>
        </div>

        {/* Visual Allocation Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[#dbc2b0]">
            <span>توزیع بصری وزن دارایی‌ها در سبد:</span>
            <span className="font-mono-num text-[#ffb77d]">مجموع: ۱۰۰٪</span>
          </div>
          <div className="h-4 bg-[#1a120b] rounded-xl overflow-hidden flex border border-[#554336]">
            {assets.map((asset) => (
              <div
                key={asset.id}
                style={{ width: `${asset.weightPct}%`, backgroundColor: asset.color }}
                className="h-full relative group transition-all"
                title={`${asset.name}: ${asset.weightPct}٪`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-[#dbc2b0]">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: asset.color }} />
                <span>{asset.ticker}:</span>
                <span className="font-mono-num font-bold text-[#f2dfd3]">{formatNumber(asset.weightPct)}٪</span>
              </div>
            ))}
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-[#554336]">
          <table className="w-full text-right text-xs text-[#f2dfd3]">
            <thead className="bg-[#271e16] text-[#dbc2b0] border-b border-[#554336]">
              <tr>
                <th className="p-3.5 font-bold">نام دارایی / نماد</th>
                <th className="p-3.5 font-bold">دسته‌بندی</th>
                <th className="p-3.5 font-bold">ارزش روز تخصیص (تومان)</th>
                <th className="p-3.5 font-bold">وزن فعلی</th>
                <th className="p-3.5 font-bold">تارگت S1</th>
                <th className="p-3.5 font-bold">سود / زیان کل</th>
                <th className="p-3.5 font-bold">بازده روزانه</th>
                <th className="p-3.5 font-bold text-center">وضعیت انحراف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#554336]/40">
              {assets.map((asset) => {
                const diff = asset.weightPct - asset.targetWeightPct;
                const isOverweight = diff > 1;
                const isUnderweight = diff < -1;

                return (
                  <tr
                    key={asset.id}
                    className="hover:bg-[#322820]/50 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: asset.color }}
                        />
                        <div>
                          <div className="font-bold text-[#f2dfd3]">{asset.name}</div>
                          <div className="text-[11px] font-mono-num text-[#ffb77d]">{asset.ticker}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-[#dbc2b0]">
                      <span className="bg-[#1a120b] px-2 py-1 rounded-md border border-[#554336]/50">
                        {asset.categoryLabel}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono-num font-bold text-[#f2dfd3]">
                      <div>{formatToman(asset.allocatedValueToman)}</div>
                      <div className="text-[10px] text-[#dbc2b0]/70 font-normal">
                        خرید اولیه: {formatToman(asset.initialCostToman)}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono-num font-bold text-[#ffb77d]">
                      {formatNumber(asset.weightPct)}٪
                    </td>

                    <td className="p-3.5 font-mono-num text-[#96ccff]">
                      {formatNumber(asset.targetWeightPct)}٪
                    </td>

                    <td className="p-3.5 font-mono-num">
                      <div className={`font-bold ${asset.pnlToman >= 0 ? 'text-[#10b981]' : 'text-[#f87171]'}`}>
                        {asset.pnlToman >= 0 ? '+' : ''}{formatToman(asset.pnlToman)}
                      </div>
                      <div className={`text-[10px] ${asset.pnlPct >= 0 ? 'text-[#10b981]' : 'text-[#f87171]'}`}>
                        ({asset.pnlPct >= 0 ? '+' : ''}{formatNumber(asset.pnlPct)}٪)
                      </div>
                    </td>

                    <td className="p-3.5 font-mono-num">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded ${
                          asset.dailyChangePct >= 0
                            ? 'bg-[#10b981]/15 text-[#10b981]'
                            : 'bg-[#f87171]/15 text-[#f87171]'
                        }`}
                      >
                        {asset.dailyChangePct >= 0 ? '+' : ''}
                        {formatNumber(asset.dailyChangePct)}٪
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      {isOverweight ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
                          اضافه وزن (+{formatNumber(Math.abs(diff))}٪)
                        </span>
                      ) : isUnderweight ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#96ccff]/15 text-[#96ccff] border border-[#96ccff]/30">
                          کم‌وزن ({formatNumber(diff)}٪)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                          کاملاً منطبق
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Recent Paper Trades Log */}
      <div className="bg-[#231a13] border border-[#554336] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#554336]/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ffb77d]/10 text-[#ffb77d]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                تاریخچه سفارشات و بازتوازن‌های پورتفوی کاغذی
              </h3>
              <p className="text-xs text-[#dbc2b0]/70">
                سوابق اجرای سیگنال‌های هوشمند S1 بر روی پورتفوی ۱ میلیارد تومانی
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="bg-[#1a120b] border border-[#554336]/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 rounded-md font-bold text-[10px] ${
                    trade.type === 'buy'
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                      : trade.type === 'sell'
                      ? 'bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30'
                      : 'bg-[#ffb77d]/20 text-[#ffb77d] border border-[#ffb77d]/30'
                  }`}
                >
                  {trade.type === 'buy' ? 'خرید' : trade.type === 'sell' ? 'فروش' : 'بازتوازن'}
                </span>
                <div>
                  <div className="font-bold text-[#f2dfd3] flex items-center gap-2">
                    <span>{trade.assetName} ({trade.assetTicker})</span>
                    <span className="text-[#dbc2b0]/60 font-mono-num text-[11px]">{trade.dateJalali}</span>
                  </div>
                  <div className="text-[#dbc2b0]/80 text-[11px] mt-0.5">{trade.rationale}</div>
                </div>
              </div>

              <div className="text-left font-mono-num sm:shrink-0">
                <div className="font-bold text-[#ffb77d]">{formatToman(trade.amountToman)}</div>
                <div className="text-[10px] text-[#dbc2b0]/70">
                  {formatNumber(trade.units)} واحد @ {formatToman(trade.unitPriceToman)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
