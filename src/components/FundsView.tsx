import React, { useState } from 'react';
import { FundItem, SystemS1Signal } from '../types';
import {
  Wallet,
  TrendingUp,
  Coins,
  ShieldCheck,
  Calculator,
  CheckCircle2,
  Zap,
  Globe,
  Layers,
  ArrowDownLeft,
} from 'lucide-react';

interface FundsViewProps {
  funds: FundItem[];
  signal: SystemS1Signal;
}

export const FundsView: React.FC<FundsViewProps> = ({ funds, signal }) => {
  const [totalCapitalToman, setTotalCapitalToman] = useState<number>(1000000000); // 1 billion tomans default
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeStageStepPct, setActiveStageStepPct] = useState<number>(20); // 20% default stage
  const [selectedTargetAsset, setSelectedTargetAsset] = useState<string>('fund-ayar'); // default target

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  // Filter only the 5 core S1 instruments if any extraneous items exist
  const coreAllowedTickers = ['افران', 'عیار', 'توان', 'BTC', 'خبرگان'];
  const coreFunds = funds.filter(
    (f) =>
      coreAllowedTickers.includes(f.ticker) ||
      ['fund-afran', 'fund-ayar', 'fund-tavan', 'asset-btc', 'fund-khabargan'].includes(f.id)
  );

  const filteredFunds =
    activeCategoryFilter === 'all'
      ? coreFunds
      : coreFunds.filter((f) => f.type === activeCategoryFilter);

  // Dynamic staged calculation based on S1 Rulebook
  const stagedEntryAmount = (totalCapitalToman * activeStageStepPct) / 100;
  const remainingParkAmount = totalCapitalToman - stagedEntryAmount;
  const remainingParkPct = 100 - activeStageStepPct;

  const targetAssetObj = coreFunds.find((f) => f.id === selectedTargetAsset) || coreFunds[1] || coreFunds[0];

  return (
    <div className="flex flex-col w-full gap-5">
      {/* 1. Header Banner */}
      <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-5 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f2dfd3] flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#ffb77d]" />
            پایش و بازتوزیع ۵ دارایی کلیدی سیستم S1
          </h2>
          <p className="text-xs text-[#dbc2b0] mt-1">
            تمرکز دقیق بر ۵ ابزار استراتژیک رول‌بوک S1 جهت رصد نبض بازار و تصمیم‌گیری‌های ورود پله‌ای و خروج پویا.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#1a120b] border border-[#554336] px-3.5 py-2 rounded-xl text-xs font-mono-num text-[#10b981]">
          <span>وضعیت سیگنال طلا:</span>
          <span className="font-bold text-[#f2dfd3]">آماده پله ۲۰٪ عیار (نمره ۹۰)</span>
        </div>
      </div>

      {/* 2. Five Core Instrument Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Fixed Income: AFRAN */}
        <div className="bg-[#271e16] border border-[#10b981]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-[#10b981] transition-all">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-bold text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded-lg">
                ۱. درآمد ثابت
              </span>
              <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            </div>
            <div className="text-base font-extrabold text-[#f2dfd3] mt-1">
              صندوق افران
            </div>
            <div className="text-[11px] text-[#dbc2b0] mt-0.5">
              لنگرگاه ۱۰۰٪ نقدینگی آزاد
            </div>
          </div>
          <div className="text-[11px] text-[#dbc2b0] border-t border-[#554336]/40 pt-2.5 mt-3 space-y-1">
            <div className="flex justify-between">
              <span>سود موثر سالانه:</span>
              <span className="text-[#10b981] font-bold font-mono-num">۳۱.۵٪ روزشمار</span>
            </div>
            <div className="flex justify-between">
              <span>کارکرد:</span>
              <span className="text-[#96ccff]">حفظ اصل سرمایه</span>
            </div>
          </div>
        </div>

        {/* 2. Gold ETF: AYAR */}
        <div className="bg-[#271e16] border border-[#ffb77d]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-[#ffb77d] transition-all">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-bold text-[#ffb77d] bg-[#ffb77d]/15 px-2 py-0.5 rounded-lg">
                ۲. طلای بورسی
              </span>
              <Coins className="w-4 h-4 text-[#ffb77d]" />
            </div>
            <div className="text-base font-extrabold text-[#f2dfd3] mt-1">
              صندوق طلای عیار
            </div>
            <div className="text-[11px] text-[#dbc2b0] mt-0.5">
              پوشش تورم و جهش ارز
            </div>
          </div>
          <div className="text-[11px] text-[#dbc2b0] border-t border-[#554336]/40 pt-2.5 mt-3 space-y-1">
            <div className="flex justify-between">
              <span>روش ورود:</span>
              <span className="text-[#ffb77d] font-bold font-mono-num">پله‌های ۲۰ درصدی</span>
            </div>
            <div className="flex justify-between">
              <span>کارکرد:</span>
              <span className="text-[#ffb77d]">حفظ قدرت خرید</span>
            </div>
          </div>
        </div>

        {/* 3. Leveraged Fund: TAVAN */}
        <div className="bg-[#271e16] border border-[#f59e0b]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-[#f59e0b] transition-all">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-bold text-[#f59e0b] bg-[#f59e0b]/15 px-2 py-0.5 rounded-lg">
                ۳. اهرمی بورس
              </span>
              <Zap className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <div className="text-base font-extrabold text-[#f2dfd3] mt-1">
              صندوق اهرمی توان
            </div>
            <div className="text-[11px] text-[#dbc2b0] mt-0.5">
              شتاب‌دهنده روندهای صعودی
            </div>
          </div>
          <div className="text-[11px] text-[#dbc2b0] border-t border-[#554336]/40 pt-2.5 mt-3 space-y-1">
            <div className="flex justify-between">
              <span>شرط ورود:</span>
              <span className="text-[#f59e0b] font-bold font-mono-num">تایید نمره بورس</span>
            </div>
            <div className="flex justify-between">
              <span>کارکرد:</span>
              <span className="text-[#f59e0b]">مازاد بازدهی (آلفا)</span>
            </div>
          </div>
        </div>

        {/* 4. Crypto: BITCOIN */}
        <div className="bg-[#271e16] border border-[#96ccff]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-[#96ccff] transition-all">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-bold text-[#96ccff] bg-[#96ccff]/15 px-2 py-0.5 rounded-lg">
                ۴. بازار جهانی
              </span>
              <Globe className="w-4 h-4 text-[#96ccff]" />
            </div>
            <div className="text-base font-extrabold text-[#f2dfd3] mt-1">
              بیت‌کوین (BTC)
            </div>
            <div className="text-[11px] text-[#dbc2b0] mt-0.5">
              شاخص ریسک‌پذیری جهانی
            </div>
          </div>
          <div className="text-[11px] text-[#dbc2b0] border-t border-[#554336]/40 pt-2.5 mt-3 space-y-1">
            <div className="flex justify-between">
              <span>نقش در مدل:</span>
              <span className="text-[#96ccff] font-bold font-mono-num">رصد ریسک کریپتو</span>
            </div>
            <div className="flex justify-between">
              <span>کارکرد:</span>
              <span className="text-[#96ccff]">سنسور نقدینگی جهان</span>
            </div>
          </div>
        </div>

        {/* 5. Equity Fund: KHABARGAN */}
        <div className="bg-[#271e16] border border-[#ec4899]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-[#ec4899] transition-all">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-bold text-[#ec4899] bg-[#ec4899]/15 px-2 py-0.5 rounded-lg">
                ۵. سهامی بورس
              </span>
              <TrendingUp className="w-4 h-4 text-[#ec4899]" />
            </div>
            <div className="text-base font-extrabold text-[#f2dfd3] mt-1">
              صندوق سهامی خبرگان
            </div>
            <div className="text-[11px] text-[#dbc2b0] mt-0.5">
              سهامی شاخص‌ساز نفت و پترو
            </div>
          </div>
          <div className="text-[11px] text-[#dbc2b0] border-t border-[#554336]/40 pt-2.5 mt-3 space-y-1">
            <div className="flex justify-between">
              <span>شرط ورود:</span>
              <span className="text-[#ec4899] font-bold font-mono-num">تایید ۳ روز پول حقیقی</span>
            </div>
            <div className="flex justify-between">
              <span>کارکرد:</span>
              <span className="text-[#ec4899]">رشد سرمایه در رونق</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Staged Dynamic Calculator for Target Assets */}
      <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-[#554336]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                محاسبه‌گر ورود پله‌ای پویا و کسر از صندوق افران
              </h3>
              <p className="text-xs text-[#dbc2b0]/70">
                انتخاب دارایی هدف از بین ۴ ابزار اصلی جهت ورود پله‌ای و محاسبه خودکار سهم کسرشونده از صندوق درآمد ثابت افران.
              </p>
            </div>
          </div>

          {/* Quick preset capital */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setTotalCapitalToman(100000000)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                totalCapitalToman === 100000000 ? 'bg-[#ffb77d] text-[#1a120b] font-bold' : 'bg-[#322820] text-[#dbc2b0]'
              }`}
            >
              ۱۰۰ میلیون
            </button>
            <button
              onClick={() => setTotalCapitalToman(500000000)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                totalCapitalToman === 500000000 ? 'bg-[#ffb77d] text-[#1a120b] font-bold' : 'bg-[#322820] text-[#dbc2b0]'
              }`}
            >
              ۵۰۰ میلیون
            </button>
            <button
              onClick={() => setTotalCapitalToman(1000000000)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                totalCapitalToman === 1000000000 ? 'bg-[#ffb77d] text-[#1a120b] font-bold' : 'bg-[#322820] text-[#dbc2b0]'
              }`}
            >
              ۱ میلیارد (پایه)
            </button>
          </div>
        </div>

        {/* Input box, Target Asset Selector & Stage Select */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-6">
          <div className="md:col-span-4">
            <label className="block text-xs text-[#dbc2b0] mb-1.5 font-medium">
              کل سرمایه تحت مدیریت (تومان):
            </label>
            <div className="relative">
              <input
                type="number"
                value={totalCapitalToman}
                onChange={(e) => setTotalCapitalToman(Number(e.target.value) || 0)}
                className="w-full bg-[#1a120b] border border-[#554336] rounded-xl px-3 py-2.5 text-sm text-[#ffb77d] font-mono-num font-bold outline-none focus:border-[#ffb77d]"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#dbc2b0]/60">
                تومان
              </span>
            </div>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs text-[#dbc2b0] mb-1.5 font-medium">
              انتخاب دارایی مقصد برای ورود پله‌ای:
            </label>
            <select
              value={selectedTargetAsset}
              onChange={(e) => setSelectedTargetAsset(e.target.value)}
              className="w-full bg-[#1a120b] border border-[#554336] rounded-xl px-3 py-2.5 text-xs text-[#f2dfd3] font-bold outline-none focus:border-[#ffb77d]"
            >
              <option value="fund-ayar">صندوق طلای عیار (پوشش تورم)</option>
              <option value="fund-tavan">صندوق اهرمی توان (شتاب‌دهنده بورس)</option>
              <option value="fund-khabargan">صندوق سهامی خبرگان (آلفا ساز)</option>
              <option value="asset-btc">بیت‌کوین BTC (کریپتو بین‌المللی)</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs text-[#dbc2b0] mb-1.5 font-medium">
              درصد پله ورود سیستمی:
            </label>
            <div className="grid grid-cols-5 gap-1">
              {[10, 15, 20, 25, 30].map((step) => (
                <button
                  key={step}
                  onClick={() => setActiveStageStepPct(step)}
                  className={`py-2 text-xs font-mono-num font-bold rounded-xl border transition-all ${
                    activeStageStepPct === step
                      ? 'bg-[#ffb77d] text-[#1a120b] border-[#ffb77d] shadow'
                      : 'bg-[#1a120b] text-[#dbc2b0] border-[#554336] hover:bg-[#322820]'
                  }`}
                >
                  {step}٪
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Calculation Output Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#1a120b] border border-[#ffb77d]/40 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs text-[#dbc2b0]">
              <span>مبلغ پله خرید هدف ({activeStageStepPct}٪ از سرمایه)</span>
              <span className="text-[#ffb77d] font-bold">{targetAssetObj?.name || 'دارایی مقصد'}</span>
            </div>
            <div className="text-xl font-bold text-[#ffb77d] font-mono-num mt-2">
              {formatNumber(stagedEntryAmount)} تومان
            </div>
            <div className="text-[11px] text-[#dbc2b0]/70 mt-1 flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#ffb77d]" />
              اجرا بر مبنای قیمت پایانی پس از کسر از صندوق افران
            </div>
          </div>

          <div className="bg-[#1a120b] border border-[#10b981]/40 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs text-[#dbc2b0]">
              <span>سرمایه باقی‌مانده در صندوق افران ({remainingParkPct}٪ از سرمایه)</span>
              <span className="text-[#10b981] font-bold">پارک امن در درآمد ثابت</span>
            </div>
            <div className="text-xl font-bold text-[#10b981] font-mono-num mt-2">
              {formatNumber(remainingParkAmount)} تومان
            </div>
            <div className="text-[11px] text-[#dbc2b0]/70 mt-1">
              حفظ ارزش اصل سرمایه با سود روزشمار سالانه ۳۱.۵٪ موثر
            </div>
          </div>
        </div>

        {/* Visual Allocation Bar */}
        <div className="flex flex-col gap-1.5 mt-5">
          <div className="flex justify-between text-xs text-[#dbc2b0] font-mono-num">
            <span className="text-[#10b981]">صندوق درآمد ثابت افران ({remainingParkPct}٪)</span>
            <span className="text-[#ffb77d]">پله خرید {targetAssetObj?.ticker || 'هدف'} ({activeStageStepPct}٪)</span>
          </div>
          <div className="h-3 w-full bg-[#1a120b] rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-[#10b981] transition-all duration-500"
              style={{ width: `${remainingParkPct}%` }}
              title="پارک در افران"
            />
            <div
              className="h-full bg-[#ffb77d] transition-all duration-500"
              style={{ width: `${activeStageStepPct}%` }}
              title="پله خرید هدف"
            />
          </div>
        </div>
      </div>

      {/* 4. Table of the 5 Core Assets */}
      <div className="bg-[#271e16] border border-[#554336] rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-[#554336] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#ffb77d]" />
            <h3 className="text-sm font-bold text-[#f2dfd3]">
              جدول ۵ دارایی استراتژیک سامانه S1
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#ffb77d] text-[#1a120b] font-bold'
                  : 'bg-[#1a120b] text-[#dbc2b0]'
              }`}
            >
              همه (۵ دارایی)
            </button>
            <button
              onClick={() => setActiveCategoryFilter('fixed_income')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeCategoryFilter === 'fixed_income'
                  ? 'bg-[#10b981] text-[#1a120b] font-bold'
                  : 'bg-[#1a120b] text-[#dbc2b0]'
              }`}
            >
              افران
            </button>
            <button
              onClick={() => setActiveCategoryFilter('gold')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeCategoryFilter === 'gold'
                  ? 'bg-[#ffb77d] text-[#1a120b] font-bold'
                  : 'bg-[#1a120b] text-[#dbc2b0]'
              }`}
            >
              عیار
            </button>
            <button
              onClick={() => setActiveCategoryFilter('leveraged')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeCategoryFilter === 'leveraged'
                  ? 'bg-[#f59e0b] text-[#1a120b] font-bold'
                  : 'bg-[#1a120b] text-[#dbc2b0]'
              }`}
            >
              توان
            </button>
            <button
              onClick={() => setActiveCategoryFilter('crypto')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeCategoryFilter === 'crypto'
                  ? 'bg-[#96ccff] text-[#1a120b] font-bold'
                  : 'bg-[#1a120b] text-[#dbc2b0]'
              }`}
            >
              بیت‌کوین
            </button>
            <button
              onClick={() => setActiveCategoryFilter('equity')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeCategoryFilter === 'equity'
                  ? 'bg-[#ec4899] text-[#1a120b] font-bold'
                  : 'bg-[#1a120b] text-[#dbc2b0]'
              }`}
            >
              خبرگان
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#1a120b] text-[#dbc2b0] border-b border-[#554336] font-medium">
              <tr>
                <th className="p-3.5 pr-5">نام ابزار و نماد</th>
                <th className="p-3.5">دسته‌بندی در مدل S1</th>
                <th className="p-3.5">NAV / قیمت روز</th>
                <th className="p-3.5">بازده ۱ ماهه</th>
                <th className="p-3.5">بازده ۳ ماهه</th>
                <th className="p-3.5">حجم بازار (AUM)</th>
                <th className="p-3.5">وضعیت اقدام در مدل</th>
                <th className="p-3.5 pl-5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#554336]/30 text-[#f2dfd3]">
              {filteredFunds.map((fund) => {
                const isAfran = fund.ticker === 'افران' || fund.id === 'fund-afran';
                const isAyar = fund.ticker === 'عیار' || fund.id === 'fund-ayar';

                return (
                  <tr key={fund.id} className="hover:bg-[#322820]/70 transition-colors">
                    <td className="p-3.5 pr-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#ffb77d] bg-[#3e332b] px-2 py-0.5 rounded font-mono">
                          {fund.ticker}
                        </span>
                        <span className="text-xs text-[#f2dfd3] font-medium">{fund.name}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="text-xs text-[#dbc2b0]">{fund.typeLabel}</span>
                    </td>

                    <td className="p-3.5 font-mono-num text-[#dbc2b0]">
                      {fund.type === 'crypto' ? `$${formatNumber(fund.navPerUnit)}` : `${formatNumber(fund.navPerUnit)} ریال`}
                    </td>

                    <td className="p-3.5 font-mono-num text-[#10b981] font-bold">
                      +{fund.monthlyReturn}٪
                    </td>

                    <td className="p-3.5 font-mono-num text-[#10b981] font-bold">
                      +{fund.quarterlyReturn}٪
                    </td>

                    <td className="p-3.5 font-mono-num text-[#dbc2b0]">
                      {fund.type === 'crypto' ? '۱,۲۰۰ میلیارد دلار' : `${formatNumber(fund.aumBillionToman)} همت`}
                    </td>

                    <td className="p-3.5">
                      {isAfran ? (
                        <span className="inline-flex items-center gap-1 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          لنگرگاه نقدینگی (سود روزشمار)
                        </span>
                      ) : isAyar ? (
                        <span className="inline-flex items-center gap-1 bg-[#ffb77d]/15 text-[#ffb77d] border border-[#ffb77d]/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          پله اول فعال (نمره ۹۰)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-[#322820] text-[#dbc2b0] border border-[#554336] px-2.5 py-0.5 rounded-full text-[11px]">
                          آماده ورود با تایید سیگنال
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 pl-5 text-center">
                      <button
                        onClick={() => {
                          if (!isAfran) {
                            setSelectedTargetAsset(fund.id);
                          }
                        }}
                        className={`px-2.5 py-1 text-[11px] rounded-lg transition-all ${
                          isAfran
                            ? 'bg-[#1a120b] text-[#dbc2b0]/50 cursor-not-allowed'
                            : 'bg-[#322820] hover:bg-[#ffb77d] text-[#ffb77d] hover:text-[#1a120b] font-bold cursor-pointer'
                        }`}
                        disabled={isAfran}
                      >
                        {isAfran ? 'مبنای پارک' : 'انتخاب در محاسبه‌گر'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

