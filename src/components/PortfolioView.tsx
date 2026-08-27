import React, { useState } from 'react';
import {
  PortfolioSummary,
  PortfolioAssetItem,
  PortfolioHistoryPoint,
  PortfolioTradeItem,
  PortfolioPendingOrder,
  SystemS1Signal,
} from '../types';
import { getLiveJalaliVerboseDate, getLiveJalaliDateString, getTehranTimeString } from '../utils/dateHelper';
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
  AlertCircle,
  Play,
  XCircle,
  Check,
  Zap,
  ArrowRightLeft,
  Calendar,
  RotateCcw,
  Plus,
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
  pendingOrders?: PortfolioPendingOrder[];
  signal: SystemS1Signal;
  onUpdateAsset?: (assetId: string, newAllocatedToman: number) => void;
  onRebalanceToS1?: () => void;
  onExecutePendingOrder?: (orderId: string, finalPriceToman?: number) => void;
  onCancelPendingOrder?: (orderId: string) => void;
  onCreatePendingOrder?: (newOrder: Omit<PortfolioPendingOrder, 'id' | 'createdAtJalali' | 'status'>) => void;
  onResetPortfolio?: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  summary,
  assets,
  history,
  trades,
  pendingOrders = [],
  signal,
  onRebalanceToS1,
  onExecutePendingOrder,
  onCancelPendingOrder,
  onCreatePendingOrder,
  onResetPortfolio,
}) => {
  const [chartMode, setChartMode] = useState<'both' | 'value' | 'drawdown'>('both');
  const [timeFilter, setTimeFilter] = useState<'all' | '30d' | '15d'>('all');
  const [showRebalanceAlert, setShowRebalanceAlert] = useState<boolean>(false);
  const [rebalanceSuccess, setRebalanceSuccess] = useState<boolean>(false);
  
  // Pending Order Execution Modal State
  const [executingOrder, setExecutingOrder] = useState<PortfolioPendingOrder | null>(null);
  const [customFinalPrice, setCustomFinalPrice] = useState<string>('');
  
  // Create New Pending Order Modal State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [newOrderAssetId, setNewOrderAssetId] = useState<string>('asset-ayar');
  const [newOrderPct, setNewOrderPct] = useState<number>(20);
  const [newOrderReason, setNewOrderReason] = useState<string>('صدور سیگنال خرید پله‌ای طبق سیستم S1');

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
    }, 1000);
  };

  const openExecuteModal = (order: PortfolioPendingOrder) => {
    setExecutingOrder(order);
    setCustomFinalPrice(String(order.estimatedPriceToman));
  };

  const handleConfirmExecution = () => {
    if (!executingOrder) return;
    const finalPrice = parseFloat(customFinalPrice) || executingOrder.estimatedPriceToman;
    if (onExecutePendingOrder) {
      onExecutePendingOrder(executingOrder.id, finalPrice);
    }
    setExecutingOrder(null);
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find((a) => a.id === newOrderAssetId) || assets[1];
    const totalCap = summary.currentValueToman || 1_000_000_000;
    const amountToman = (totalCap * newOrderPct) / 100;
    const estPrice = targetAsset.currentPriceToman || (targetAsset.id === 'asset-ayar' ? 17200 : targetAsset.id === 'asset-khabargan' ? 2450 : 77250);
    const estUnits = estPrice > 0 ? Math.round(amountToman / estPrice) : 1;
    const isCrypto = targetAsset.category === 'crypto';

    if (onCreatePendingOrder) {
      onCreatePendingOrder({
        assetId: targetAsset.id,
        assetName: targetAsset.name,
        assetTicker: targetAsset.ticker,
        orderType: 'staged_buy',
        sourceAssetTicker: 'افران (پارک نقدینگی)',
        targetAllocationPct: newOrderPct,
        amountToman,
        estimatedPriceToman: estPrice,
        estimatedUnits: estUnits,
        executionRule: isCrypto ? 'instant' : 'next_day_close',
        executionTimingLabel: isCrypto ? 'اجرای فوری و لحظه‌ای (۲۴/۷)' : 'قیمت پایانی روز کاری بعد (فردا)',
        scheduledExecutionDateJalali: isCrypto ? 'لحظه‌ای (امروز)' : 'فردا (اولین روز معاملاتی بعد)',
        signalTriggerReason: newOrderReason,
      });
    }

    setIsNewOrderModalOpen(false);
  };

  // Efran Asset info for cash reserve display
  const efranAsset = assets.find((a) => a.id === 'asset-afran') || assets[0];

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
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

  const activePendingOrders = pendingOrders.filter((o) => o.status === 'pending' || o.status === 'ready_to_execute');

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
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#f2dfd3] tracking-tight">
                    پورتفوی آزمایشی و کاغذی سیستم S1 (۱ میلیارد تومان)
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded-md">
                    قوانین مصوب ۴ دارایی
                  </span>
                </div>
                <p className="text-xs text-[#dbc2b0]/80 mt-0.5">
                  پارک اتوماتیک وجوه آزاد در افران | خرید بورسی بر اساس قیمت پایانی روز بعد | خرید کریپتو آنی ۲۴/۷
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {onResetPortfolio && (
              <button
                onClick={onResetPortfolio}
                title="بازنشانی پورتفو به نقطه شروع (۱ میلیارد تومان تماماً در افران)"
                className="px-3 py-2.5 bg-[#1a120b] hover:bg-[#322820] text-[#dbc2b0] hover:text-[#f2dfd3] border border-[#554336] font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#f87171]" />
                <span>صفر کردن و ریست</span>
              </button>
            )}

            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              className="px-3.5 py-2.5 bg-[#ffb77d]/15 hover:bg-[#ffb77d]/25 text-[#ffb77d] border border-[#ffb77d]/40 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت سفارش در انتظار جدید</span>
            </button>

            <button
              onClick={handleTriggerRebalance}
              disabled={showRebalanceAlert}
              className="px-4 py-2.5 bg-[#d97707] hover:bg-[#b45309] text-[#1a120b] font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${showRebalanceAlert ? 'animate-spin' : ''}`} />
              {showRebalanceAlert ? 'در حال اجرای پله...' : 'اجرای پله اول سیگنال طلا (۲۰٪)'}
            </button>
          </div>
        </div>

        {/* System S1 Asset Rules Notice Banner */}
        <div className="mt-4 p-3.5 bg-[#1a120b]/80 border border-[#554336]/80 rounded-xl text-xs text-[#dbc2b0] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span><strong>۱. صندوق افران:</strong> پارک ۱۰۰٪ نقدینگی آزاد با سود روزشمار ۳۰٪ و نقدشوندگی آنی.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffb77d]" />
            <span><strong>۲. عیار و خبرگان:</strong> خرید پله‌ای صرفاً بر مبنای <strong>قیمت پایانی روز معاملاتی بعد</strong>.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span><strong>۳. بیت‌کوین (BTC):</strong> در صورت صدور تاییدیه ورود، معامله به صورت <strong>آنی و ۲۴/۷</strong>.</span>
          </div>
        </div>

        {rebalanceSuccess && (
          <div className="mt-4 p-3 bg-[#10b981]/15 border border-[#10b981]/40 rounded-xl text-xs text-[#10b981] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>پله اول خرید صندوق طلای عیار (۲۰٪) با موفقیت اجرا شد و از صندوق افران کسر گردید!</span>
          </div>
        )}
      </div>

      {/* 2. Key Metrics Summary Cards (خلاصه شاخص‌ها) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Current Portfolio Value */}
        <div className="bg-[#231a13] border border-[#554336] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#ffb77d]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
            <span className="font-medium">ارزش کل پورتفو</span>
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
          <div className="text-[10px] text-[#dbc2b0] bg-[#1a120b] px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit border border-[#554336]/40">
            <span>سرمایه اولیه: ۱ میلیارد تومان</span>
          </div>
        </div>

        {/* Metric 2: Cash Park in Efran */}
        <div className="bg-[#231a13] border border-[#554336] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#10b981]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
            <span className="font-medium">پارک نقدینگی در افران</span>
            <div className="p-1.5 bg-[#10b981]/10 text-[#10b981] rounded-lg">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[#10b981] tracking-tight">
              {formatToman(efranAsset.allocatedValueToman)}
            </div>
            <div className="text-[11px] text-[#dbc2b0]/70 flex items-center gap-1 mt-0.5 font-mono-num">
              <span>وزن در سبد:</span>
              <span className="text-[#10b981] font-bold">{formatNumber(efranAsset.weightPct)}٪</span>
            </div>
          </div>
          <div className="text-[10px] text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
            <span>سود روزشمار ۳۰٪ موثر</span>
          </div>
        </div>

        {/* Metric 3: Total Profit % */}
        <div className="bg-[#231a13] border border-[#554336] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#ffb77d]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
            <span className="font-medium">سود / زیان کل</span>
            <div className="p-1.5 bg-[#ffb77d]/10 text-[#ffb77d] rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className={`text-xl sm:text-2xl font-bold font-mono-num tracking-tight ${summary.totalPnlToman >= 0 ? 'text-[#10b981]' : 'text-[#f87171]'}`}>
              {summary.totalPnlToman >= 0 ? '+' : ''}{formatNumber(summary.totalPnlPct)}٪
            </div>
            <div className="text-[11px] text-[#dbc2b0]/70 flex items-center gap-1 mt-0.5 font-mono-num">
              <span>تغییر ریالی:</span>
              <span className={summary.totalPnlToman >= 0 ? 'text-[#10b981]' : 'text-[#f87171]'}>
                {summary.totalPnlToman >= 0 ? '+' : ''}{formatToman(summary.totalPnlToman)}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-[#dbc2b0] bg-[#1a120b] px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
            <span>مدیریت ریسک S1 فعال</span>
          </div>
        </div>

        {/* Metric 4: Max Drawdown % */}
        <div className="bg-[#231a13] border border-[#554336] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#f87171]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
            <span className="font-medium">افت از سقف (Drawdown)</span>
            <div className="p-1.5 bg-[#f87171]/10 text-[#f87171] rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[#10b981] tracking-tight">
              {formatNumber(summary.maxDrawdownPct)}٪
            </div>
            <div className="text-[11px] text-[#dbc2b0]/70 flex items-center gap-1 mt-0.5">
              <span>وضعیت کنترل افت:</span>
              <span className="text-[#10b981] font-semibold">بسیار ایمن (۰٪)</span>
            </div>
          </div>
          <div className="text-[10px] text-[#dbc2b0] bg-[#322820] px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
            <span>سقف مجاز: ۱۵٪</span>
          </div>
        </div>

        {/* Metric 5: Pending Orders Count */}
        <div className="bg-[#231a13] border border-[#554336] p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#96ccff]/50 transition-all">
          <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
            <span className="font-medium">سفارشات در انتظار فردا</span>
            <div className="p-1.5 bg-[#96ccff]/10 text-[#96ccff] rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[#96ccff] tracking-tight">
              {activePendingOrders.length} سفارش
            </div>
            <div className="text-[11px] text-[#dbc2b0]/70 flex items-center gap-1 mt-0.5">
              <span>منتظر قیمت پایانی:</span>
              <span className="font-mono-num font-bold text-[#ffb77d]">
                {activePendingOrders.filter((o) => o.executionRule === 'next_day_close').length} مورد
              </span>
            </div>
          </div>
          <div className="text-[10px] text-[#ffb77d] bg-[#ffb77d]/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit">
            <span>پله‌های مدیریت سرمایه</span>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED SECTION: سفارشات در انتظار (Pending Orders Queue) */}
      <div className="bg-[#231a13] border-2 border-[#d97707]/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#554336]/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d97707]/20 text-[#ffb77d] border border-[#d97707]/40">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#f2dfd3]">
                  سفارشات در انتظار اجرا (Pending Orders Queue)
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-[#ffb77d]/20 text-[#ffb77d] rounded-full">
                  {activePendingOrders.length} سفارش فعال
                </span>
              </div>
              <p className="text-xs text-[#dbc2b0]/70">
                بر اساس سیگنال‌های سیستم S1؛ خرید صندوق‌های بورسی با قیمت پایانی روز کاری بعد و کریپتو به صورت آنی
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-3 py-2 bg-[#ffb77d] hover:bg-[#ffa351] text-[#1a120b] font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت سفارش در انتظار جدید</span>
          </button>
        </div>

        {activePendingOrders.length === 0 ? (
          <div className="bg-[#1a120b] border border-[#554336]/60 rounded-xl p-6 text-center text-xs text-[#dbc2b0] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#10b981] mx-auto" />
            <div className="font-bold text-sm text-[#f2dfd3]">هیچ سفارش در انتظاری در صف وجود ندارد</div>
            <p className="text-[#dbc2b0]/70">
              تمام سرمایه آزاد پورتفو در صندوق درآمد ثابت افران پارک شده است و به محض صدور سیگنال خرید جدید، سفارش در این بخش درج خواهد شد.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activePendingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-[#1a120b] border border-[#554336] hover:border-[#ffb77d]/60 rounded-xl p-4 flex flex-col justify-between gap-3 text-xs transition-all shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[#554336]/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#ffb77d]" />
                      <span className="font-bold text-[#f2dfd3] text-sm">{order.assetName}</span>
                      <span className="font-mono-num text-[#ffb77d] font-bold text-xs bg-[#231a13] px-2 py-0.5 rounded border border-[#554336]">
                        {order.assetTicker}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md font-bold text-[10px] flex items-center gap-1 ${
                        order.executionRule === 'next_day_close'
                          ? 'bg-[#d97707]/20 text-[#ffb77d] border border-[#d97707]/30'
                          : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                      }`}
                    >
                      {order.executionRule === 'next_day_close' ? (
                        <>
                          <Calendar className="w-3 h-3" />
                          <span>قیمت پایانی روز بعد</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3" />
                          <span>اجرای آنی لحظه‌ای</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 my-3 text-[11px]">
                    <div className="bg-[#231a13] p-2.5 rounded-lg border border-[#554336]/40 space-y-1">
                      <div className="text-[#dbc2b0]/70">مبلغ پله مدیریت سرمایه:</div>
                      <div className="font-bold font-mono-num text-[#ffb77d] text-sm">
                        {formatToman(order.amountToman)}
                      </div>
                      <div className="text-[10px] text-[#dbc2b0]">
                        (معادل {formatNumber(order.targetAllocationPct)}٪ از کل پورتفو)
                      </div>
                    </div>

                    <div className="bg-[#231a13] p-2.5 rounded-lg border border-[#554336]/40 space-y-1">
                      <div className="text-[#dbc2b0]/70">منبع تأمین وجه:</div>
                      <div className="font-bold text-[#10b981] flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>{order.sourceAssetTicker}</span>
                      </div>
                      <div className="text-[10px] text-[#dbc2b0]">
                        تخمین حجم: {formatNumber(order.estimatedUnits)} واحد
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#2a1d13] p-2.5 rounded-lg border border-[#d97707]/30 text-[11px] text-[#f2dfd3]/90">
                    <span className="font-bold text-[#ffb77d]">علت صدور سیگنال S1: </span>
                    <span>{order.signalTriggerReason}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#554336]/50">
                  <div className="text-[11px] text-[#dbc2b0]/70 flex items-center gap-1 font-mono-num">
                    <Clock className="w-3.5 h-3.5 text-[#ffb77d]" />
                    <span>زمان‌بندی: {order.scheduledExecutionDateJalali}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onCancelPendingOrder && (
                      <button
                        onClick={() => onCancelPendingOrder(order.id)}
                        className="px-2.5 py-1.5 bg-[#1a120b] hover:bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/40 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                      >
                        لغو سفارش
                      </button>
                    )}
                    <button
                      onClick={() => openExecuteModal(order)}
                      className="px-3.5 py-1.5 bg-[#10b981] hover:bg-[#059669] text-[#1a120b] font-bold rounded-lg text-[11px] shadow transition flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ثبت و اجرای معامله</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Asset Allocation & Positions Table (جدول ۴ دارایی مجاز سبد) */}
      <div className="bg-[#231a13] border border-[#554336] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#554336]/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ffb77d]/10 text-[#ffb77d]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                جدول ترکیب دارایی‌های مصوب سیستم S1 (Asset Allocation Table)
              </h3>
              <p className="text-xs text-[#dbc2b0]/70">
                منحصر به ۴ دارایی: ۱. صندوق افران | ۲. صندوق عیار | ۳. صندوق خبرگان | ۴. بیت‌کوین (BTC)
              </p>
            </div>
          </div>

          <div className="text-xs text-[#dbc2b0] bg-[#1a120b] px-3 py-1.5 rounded-xl border border-[#554336] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#ffb77d]" />
            <span>نقدینگی آزاد: ۱۰۰٪ در صندوق درآمد ثابت افران پارک می‌شود</span>
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
                style={{ width: `${Math.max(asset.weightPct, 0)}%`, backgroundColor: asset.color }}
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
                <th className="p-3.5 font-bold">نام دارایی و نماد</th>
                <th className="p-3.5 font-bold">نقش در سیستم S1</th>
                <th className="p-3.5 font-bold">قانون معامله</th>
                <th className="p-3.5 font-bold">ارزش تخصیص (تومان)</th>
                <th className="p-3.5 font-bold">وزن فعلی</th>
                <th className="p-3.5 font-bold">وضعیت تخصیص پویا در سیستم S1</th>
                <th className="p-3.5 font-bold">حجم / واحدها</th>
                <th className="p-3.5 font-bold">سود / زیان</th>
                <th className="p-3.5 font-bold text-center">وضعیت موقعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#554336]/40">
              {assets.map((asset) => {
                const isActive = asset.weightPct > 0;
                const isEfran = asset.id === 'asset-afran';

                return (
                  <tr
                    key={asset.id}
                    className="hover:bg-[#322820]/50 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: asset.color }}
                        />
                        <div>
                          <div className="font-bold text-[#f2dfd3]">{asset.name}</div>
                          <div className="text-[11px] font-mono-num text-[#ffb77d]">{asset.ticker}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-[#dbc2b0]">
                      <span className="bg-[#1a120b] px-2 py-1 rounded-md border border-[#554336]/50 text-[11px]">
                        {asset.categoryLabel}
                      </span>
                    </td>

                    <td className="p-3.5 text-[#dbc2b0]">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        asset.executionRule === 'next_day_close'
                          ? 'bg-[#d97707]/15 text-[#ffb77d] border border-[#d97707]/30'
                          : 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                      }`}>
                        {asset.executionRule === 'next_day_close' ? 'قیمت پایانی فردا' : 'اجرای آنی ۲۴/۷'}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono-num font-bold text-[#f2dfd3]">
                      <div>{formatToman(asset.allocatedValueToman)}</div>
                      <div className="text-[10px] text-[#dbc2b0]/70 font-normal">
                        قیمت واحد: {formatToman(asset.currentPriceToman)}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono-num font-bold text-[#ffb77d]">
                      {formatNumber(asset.weightPct)}٪
                    </td>

                    <td className="p-3.5 text-[#dbc2b0]">
                      <span className="text-[11px] font-medium text-[#f2dfd3] bg-[#1a120b] px-2.5 py-1 rounded-lg border border-[#554336]/60">
                        {asset.allocationStatusLabel || (isActive ? 'موقعیت فعال پله‌ای' : 'آماده ورود با تایید سیگنال')}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono-num text-[#dbc2b0]">
                      {formatNumber(asset.unitsCount)} واحد
                    </td>

                    <td className="p-3.5 font-mono-num">
                      <div className={`font-bold ${asset.pnlToman > 0 ? 'text-[#10b981]' : asset.pnlToman < 0 ? 'text-[#f87171]' : 'text-[#dbc2b0]'}`}>
                        {asset.pnlToman > 0 ? '+' : ''}{formatToman(asset.pnlToman)}
                      </div>
                      <div className={`text-[10px] ${asset.pnlPct > 0 ? 'text-[#10b981]' : asset.pnlPct < 0 ? 'text-[#f87171]' : 'text-[#dbc2b0]'}`}>
                        ({asset.pnlPct > 0 ? '+' : ''}{formatNumber(asset.pnlPct)}٪)
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      {isEfran ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-medium">
                          لنگرگاه نقدینگی (سود روزشمار)
                        </span>
                      ) : isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#ffb77d]/15 text-[#ffb77d] border border-[#ffb77d]/30 font-medium">
                          موقعیت پله‌ای فعال
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#322820] text-[#dbc2b0] border border-[#554336]">
                          آماده ورود با سیگنال
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

      {/* 5. Interactive Line Chart (روند رشد پورتفوی ۱ میلیاردی) */}
      <div className="bg-[#231a13] border border-[#554336] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#554336]/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ffb77d]/10 text-[#ffb77d]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                نمودار تعاملی رشد ارزش پورتفوی ۱ میلیارد تومانی
              </h3>
              <p className="text-xs text-[#dbc2b0]/70">
                پایش لحظه‌ای سودآوری و میزان افت سرمایه (Drawdown)
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
                  dot={{ r: 4, fill: '#ffb77d', stroke: '#1a120b', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#ffb77d' }}
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
      </div>

      {/* 6. Recent Paper Trades Log */}
      <div className="bg-[#231a13] border border-[#554336] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#554336]/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ffb77d]/10 text-[#ffb77d]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                ژورنال و تاریخچه معاملات پورتفوی کاغذی
              </h3>
              <p className="text-xs text-[#dbc2b0]/70">
                سوابق اجرای سیگنال‌های هوشمند S1 بر روی پورتفوی ۱ میلیارد تومانی با کسر کارمزد
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
                    trade.type === 'buy' || trade.type === 'staged_buy'
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                      : trade.type === 'sell'
                      ? 'bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30'
                      : 'bg-[#ffb77d]/20 text-[#ffb77d] border border-[#ffb77d]/30'
                  }`}
                >
                  {trade.type === 'buy' || trade.type === 'staged_buy' ? 'خرید پله‌ای' : trade.type === 'sell' ? 'فروش' : 'پارک / بازتوازن'}
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

      {/* MODAL: Execute Pending Order */}
      {executingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#231a13] border border-[#ffb77d]/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-[#554336] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                <h3 className="text-base font-bold text-[#f2dfd3]">ثبت و اجرای معامله با قیمت روز</h3>
              </div>
              <button
                onClick={() => setExecutingOrder(null)}
                className="text-[#dbc2b0] hover:text-[#f2dfd3] p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#dbc2b0] space-y-3">
              <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336] space-y-2">
                <div className="flex justify-between">
                  <span>نام دارایی:</span>
                  <span className="font-bold text-[#f2dfd3]">{executingOrder.assetName} ({executingOrder.assetTicker})</span>
                </div>
                <div className="flex justify-between">
                  <span>مبلغ انتقال از افران:</span>
                  <span className="font-bold font-mono-num text-[#ffb77d]">{formatToman(executingOrder.amountToman)}</span>
                </div>
                <div className="flex justify-between">
                  <span>قانون معامله:</span>
                  <span className="text-[#10b981] font-semibold">{executingOrder.executionTimingLabel}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#f2dfd3] mb-1">
                  قیمت پایانی واقعی روز معامله (تومان برای هر واحد):
                </label>
                <input
                  type="number"
                  value={customFinalPrice}
                  onChange={(e) => setCustomFinalPrice(e.target.value)}
                  className="w-full bg-[#1a120b] border border-[#554336] focus:border-[#ffb77d] rounded-xl px-3 py-2 text-sm font-mono-num text-[#f2dfd3] outline-none"
                  placeholder="قیمت پایانی تابلوی بورس یا صرافی..."
                />
                <p className="text-[10px] text-[#dbc2b0]/70 mt-1">
                  طبق آیین‌نامه S1، خرید بر اساس قیمت پایانی رسمی محاسبه و کارمزد قانونی کسر می‌گردد.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#554336]">
              <button
                type="button"
                onClick={() => setExecutingOrder(null)}
                className="px-4 py-2 bg-[#1a120b] hover:bg-[#322820] text-[#dbc2b0] rounded-xl text-xs font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmExecution}
                className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-[#1a120b] font-bold rounded-xl text-xs shadow-lg cursor-pointer"
              >
                تایید نهایی و انتقال وجه از افران
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New Pending Order */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreateOrderSubmit} className="bg-[#231a13] border border-[#554336] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-[#554336] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#ffb77d]" />
                <h3 className="text-base font-bold text-[#f2dfd3]">ثبت سفارش در انتظار جدید (Pending Order)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-[#dbc2b0] hover:text-[#f2dfd3] p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#dbc2b0] space-y-3.5">
              <div>
                <label className="block font-semibold text-[#f2dfd3] mb-1">انتخاب دارایی مقصد:</label>
                <select
                  value={newOrderAssetId}
                  onChange={(e) => setNewOrderAssetId(e.target.value)}
                  className="w-full bg-[#1a120b] border border-[#554336] focus:border-[#ffb77d] rounded-xl px-3 py-2 text-xs text-[#f2dfd3] outline-none"
                >
                  <option value="asset-ayar">صندوق طلای عیار (عیار - قیمت پایانی فردا)</option>
                  <option value="asset-tavan">صندوق اهرمی توان (توان - قیمت پایانی فردا)</option>
                  <option value="asset-khabargan">صندوق سهامی خبرگان (خبرگان - قیمت پایانی فردا)</option>
                  <option value="asset-btc">بیت‌کوین (BTC - خرید آنی ۲۴/۷)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#f2dfd3] mb-1">
                  درصد پله مدیریت سرمایه (تخصیص از صندوق افران):
                </label>
                <div className="flex items-center gap-2">
                  {[10, 15, 20, 25, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setNewOrderPct(pct)}
                      className={`flex-1 py-1.5 rounded-lg font-mono-num font-bold text-xs transition ${
                        newOrderPct === pct
                          ? 'bg-[#ffb77d] text-[#1a120b]'
                          : 'bg-[#1a120b] text-[#dbc2b0] border border-[#554336]'
                      }`}
                    >
                      {pct}٪
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-[#10b981] font-mono-num mt-1">
                  مبلغ معادل: {formatToman(((summary.currentValueToman || 1_000_000_000) * newOrderPct) / 100)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#f2dfd3] mb-1">علت و منطق سیگنال:</label>
                <input
                  type="text"
                  value={newOrderReason}
                  onChange={(e) => setNewOrderReason(e.target.value)}
                  className="w-full bg-[#1a120b] border border-[#554336] focus:border-[#ffb77d] rounded-xl px-3 py-2 text-xs text-[#f2dfd3] outline-none"
                  placeholder="مثلاً: صدور چراغ سبز طلا با امتیاز ۹۰..."
                />
              </div>

              <div className="p-3 bg-[#1a120b] rounded-xl border border-[#554336]/60 text-[11px] text-[#dbc2b0]/80">
                💡 مبلغ این سفارش فردا یا در زمان اجرای معامله، به صورت خودکار از موجودی <strong>صندوق افران</strong> کسر و به دارایی منتخب اضافه خواهد شد.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#554336]">
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="px-4 py-2 bg-[#1a120b] hover:bg-[#322820] text-[#dbc2b0] rounded-xl text-xs font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#ffb77d] hover:bg-[#ffa351] text-[#1a120b] font-bold rounded-xl text-xs shadow-lg cursor-pointer"
              >
                ثبت سفارش در صف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
