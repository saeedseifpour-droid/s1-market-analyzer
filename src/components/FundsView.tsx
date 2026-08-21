import React, { useState } from 'react';
import { FundItem, SystemS1Signal } from '../types';
import {
  Wallet,
  TrendingUp,
  Coins,
  ShieldCheck,
  Calculator,
  ArrowRightLeft,
  CheckCircle2,
  PieChart as PieIcon,
  HelpCircle,
} from 'lucide-react';

interface FundsViewProps {
  funds: FundItem[];
  signal: SystemS1Signal;
}

export const FundsView: React.FC<FundsViewProps> = ({ funds, signal }) => {
  const [totalCapitalToman, setTotalCapitalToman] = useState<number>(500000000); // 500 million tomans
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const fixedIncomeFunds = funds.filter((f) => f.type === 'fixed_income');
  const goldFunds = funds.filter((f) => f.type === 'gold');
  const equityFunds = funds.filter((f) => f.type === 'equity' || f.type === 'leveraged');

  const filteredFunds =
    activeCategoryFilter === 'all'
      ? funds
      : funds.filter((f) => f.type === activeCategoryFilter || (activeCategoryFilter === 'equity' && f.type === 'leveraged'));

  // Allocation targets
  const fixedTarget = signal.recommendedAllocations.fixedIncomePct; // 40%
  const goldTarget = signal.recommendedAllocations.goldPct; // 35%
  const equityTarget = signal.recommendedAllocations.equityPct; // 25%

  const fixedAmount = (totalCapitalToman * fixedTarget) / 100;
  const goldAmount = (totalCapitalToman * goldTarget) / 100;
  const equityAmount = (totalCapitalToman * equityTarget) / 100;

  return (
    <div className="flex flex-col w-full gap-5">
      {/* 1. Header Banner */}
      <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-5 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f2dfd3] flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#ffb77d]" />
            مدیریت و بازتوازن صندوق‌های سرمایه‌گذاری (System S1 Allocation)
          </h2>
          <p className="text-xs text-[#dbc2b0] mt-1">
            استراتژی تخصیص دارایی بهینه بر اساس سیگنال جاری «{signal.actionTitle}» و امتیازات روزانه ۴ بازار.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#1a120b] border border-[#554336] px-3.5 py-2 rounded-xl text-xs font-mono-num text-[#ffb77d]">
          <span>هدف بازتوازن بعدی:</span>
          <span className="font-bold text-[#f2dfd3]">انتهای هفته جاری</span>
        </div>
      </div>

      {/* 2. Allocation Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fixed Income */}
        <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs text-[#dbc2b0]">صندوق‌های درآمد ثابت</div>
              <div className="text-xl font-extrabold text-[#96ccff] mt-0.5 font-mono-num">
                {fixedTarget}٪ تخصیص
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#96ccff]/15 text-[#96ccff]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-[#dbc2b0] border-t border-[#554336]/40 pt-3">
            <div className="flex justify-between py-1">
              <span>نمادهای برتر:</span>
              <span className="text-[#f2dfd3] font-bold">کاریس، اعتماد، افرا</span>
            </div>
            <div className="flex justify-between py-1">
              <span>بازده ماهانه موثر:</span>
              <span className="text-[#10b981] font-mono-num">۲.۴٪ (۳۲٪ سالانه)</span>
            </div>
            <div className="flex justify-between py-1">
              <span>سطح ریسک:</span>
              <span className="text-[#96ccff]">بسیار کم (سپرده و اوراق)</span>
            </div>
          </div>
        </div>

        {/* Gold Funds */}
        <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs text-[#dbc2b0]">صندوق‌های پشتوانه طلا</div>
              <div className="text-xl font-extrabold text-[#ffb77d] mt-0.5 font-mono-num">
                {goldTarget}٪ تخصیص
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d]">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-[#dbc2b0] border-t border-[#554336]/40 pt-3">
            <div className="flex justify-between py-1">
              <span>نمادهای برتر:</span>
              <span className="text-[#f2dfd3] font-bold">عیار، طلا، کهربا، زر</span>
            </div>
            <div className="flex justify-between py-1">
              <span>بازده فصلی:</span>
              <span className="text-[#10b981] font-mono-num">+۲۴.۸٪</span>
            </div>
            <div className="flex justify-between py-1">
              <span>سطح ریسک:</span>
              <span className="text-[#ffb77d]">متوسط (پوشش تورمی)</span>
            </div>
          </div>
        </div>

        {/* Equity & Leveraged */}
        <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs text-[#dbc2b0]">صندوق‌های سهامی و اهرمی</div>
              <div className="text-xl font-extrabold text-[#f43f5e] mt-0.5 font-mono-num">
                {equityTarget}٪ تخصیص
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#f43f5e]/15 text-[#f43f5e]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs text-[#dbc2b0] border-t border-[#554336]/40 pt-3">
            <div className="flex justify-between py-1">
              <span>نمادهای برتر:</span>
              <span className="text-[#f2dfd3] font-bold">اهرم، فیروزه، شتاب</span>
            </div>
            <div className="flex justify-between py-1">
              <span>استراتژی ورود:</span>
              <span className="text-[#ffb77d]">پله‌ای در منفی‌های شاخص</span>
            </div>
            <div className="flex justify-between py-1">
              <span>سطح ریسک:</span>
              <span className="text-[#f43f5e]">بالا / آلفا ساز</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Rebalancing Calculator */}
      <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-[#554336]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                ماشین حساب تخصیص و بازتوازن سرمایه پله‌ای
              </h3>
              <p className="text-xs text-[#dbc2b0]/70">
                مبلغ کل سبد دارایی خود را وارد کنید تا مقادیر خرید دقیق هر صندوق محاسبه شود.
              </p>
            </div>
          </div>

          {/* Quick preset amounts */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setTotalCapitalToman(100000000)}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#322820] hover:bg-[#3e332b] text-[#dbc2b0]"
            >
              ۱۰۰ میلیون
            </button>
            <button
              onClick={() => setTotalCapitalToman(500000000)}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#ffb77d] text-[#1a120b] font-bold"
            >
              ۵۰۰ میلیون
            </button>
            <button
              onClick={() => setTotalCapitalToman(1000000000)}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#322820] hover:bg-[#3e332b] text-[#dbc2b0]"
            >
              ۱ میلیارد
            </button>
          </div>
        </div>

        {/* Input box */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-6">
          <div className="md:col-span-1">
            <label className="block text-xs text-[#dbc2b0] mb-1.5 font-medium">
              کل سرمایه ریالی (تومان):
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

          {/* Calculated Output Breakdown */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#1a120b] border border-[#554336]/60 rounded-xl p-3">
              <div className="text-[11px] text-[#dbc2b0]">سهم درآمد ثابت (۴۰٪)</div>
              <div className="text-base font-bold text-[#96ccff] font-mono-num mt-1">
                {formatNumber(fixedAmount)} تومان
              </div>
              <div className="text-[10px] text-[#dbc2b0]/60 mt-1">سپرده‌گذاری کم‌ریسک</div>
            </div>

            <div className="bg-[#1a120b] border border-[#554336]/60 rounded-xl p-3">
              <div className="text-[11px] text-[#dbc2b0]">سهم صندوق طلا (۳۵٪)</div>
              <div className="text-base font-bold text-[#ffb77d] font-mono-num mt-1">
                {formatNumber(goldAmount)} تومان
              </div>
              <div className="text-[10px] text-[#dbc2b0]/60 mt-1">خرید پله‌ای نماد عیار/طلا</div>
            </div>

            <div className="bg-[#1a120b] border border-[#554336]/60 rounded-xl p-3">
              <div className="text-[11px] text-[#dbc2b0]">سهم سهام و اهرمی (۲۵٪)</div>
              <div className="text-base font-bold text-[#f43f5e] font-mono-num mt-1">
                {formatNumber(equityAmount)} تومان
              </div>
              <div className="text-[10px] text-[#dbc2b0]/60 mt-1">خرید پله‌ای نماد اهرم/فیروزه</div>
            </div>
          </div>
        </div>

        {/* Visual Allocation Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-[#dbc2b0] font-mono-num">
            <span>درآمد ثابت ({fixedTarget}٪)</span>
            <span>صندوق طلا ({goldTarget}٪)</span>
            <span>سهام و اهرمی ({equityTarget}٪)</span>
          </div>
          <div className="h-3 w-full bg-[#1a120b] rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-[#96ccff] transition-all duration-500"
              style={{ width: `${fixedTarget}%` }}
              title="درآمد ثابت"
            />
            <div
              className="h-full bg-[#ffb77d] transition-all duration-500"
              style={{ width: `${goldTarget}%` }}
              title="صندوق طلا"
            />
            <div
              className="h-full bg-[#f43f5e] transition-all duration-500"
              style={{ width: `${equityTarget}%` }}
              title="سهامی و اهرمی"
            />
          </div>
        </div>
      </div>

      {/* 4. Funds Table */}
      <div className="bg-[#271e16] border border-[#554336] rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-[#554336] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-bold text-[#f2dfd3] flex items-center gap-2">
            لیست صندوق‌های تحت رصد سامانه S1
          </h3>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#ffb77d] text-[#1a120b] font-bold'
                  : 'bg-[#1a120b] text-[#dbc2b0]'
              }`}
            >
              همه
            </button>
            <button
              onClick={() => setActiveCategoryFilter('fixed_income')}
              className={`px-3 py-1 rounded-lg ${
                activeCategoryFilter === 'fixed_income'
                  ? 'bg-[#96ccff] text-[#1a120b] font-bold'
                  : 'bg-[#1a120b] text-[#dbc2b0]'
              }`}
            >
              درآمد ثابت
            </button>
            <button
              onClick={() => setActiveCategoryFilter('gold')}
              className={`px-3 py-1 rounded-lg ${
                activeCategoryFilter === 'gold'
                  ? 'bg-[#ffb77d] text-[#1a120b] font-bold'
                  : 'bg-[#1a120b] text-[#dbc2b0]'
              }`}
            >
              طلا
            </button>
            <button
              onClick={() => setActiveCategoryFilter('equity')}
              className={`px-3 py-1 rounded-lg ${
                activeCategoryFilter === 'equity'
                  ? 'bg-[#f43f5e] text-[#1a120b] font-bold'
                  : 'bg-[#1a120b] text-[#dbc2b0]'
              }`}
            >
              سهامی و اهرمی
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#1a120b] text-[#dbc2b0] border-b border-[#554336] font-medium">
              <tr>
                <th className="p-3.5 pr-5">نام صندوق و نماد</th>
                <th className="p-3.5">نوع دارایی</th>
                <th className="p-3.5">NAV ابطال (ریال)</th>
                <th className="p-3.5">بازده ۱ ماهه</th>
                <th className="p-3.5">بازده ۳ ماهه</th>
                <th className="p-3.5">حجم دارایی‌ها (AUM)</th>
                <th className="p-3.5">وزن پیشنهادی</th>
                <th className="p-3.5 pl-5">وضعیت اقدام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#554336]/30 text-[#f2dfd3]">
              {filteredFunds.map((fund) => {
                return (
                  <tr key={fund.id} className="hover:bg-[#322820]/70 transition-colors">
                    <td className="p-3.5 pr-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#ffb77d] bg-[#3e332b] px-2 py-0.5 rounded">
                          {fund.ticker}
                        </span>
                        <span className="text-xs text-[#f2dfd3]">{fund.name}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="text-xs text-[#dbc2b0]">{fund.typeLabel}</span>
                    </td>

                    <td className="p-3.5 font-mono-num text-[#dbc2b0]">
                      {formatNumber(fund.navPerUnit)}
                    </td>

                    <td className="p-3.5 font-mono-num text-[#10b981] font-bold">
                      +{fund.monthlyReturn}٪
                    </td>

                    <td className="p-3.5 font-mono-num text-[#10b981] font-bold">
                      +{fund.quarterlyReturn}٪
                    </td>

                    <td className="p-3.5 font-mono-num text-[#dbc2b0]">
                      {formatNumber(fund.aumBillionToman)} همت
                    </td>

                    <td className="p-3.5 font-mono-num font-bold text-[#ffb77d]">
                      {fund.recommendedAllocationPct}٪
                    </td>

                    <td className="p-3.5 pl-5">
                      <span className="inline-flex items-center gap-1 bg-[#ffb77d]/15 text-[#ffb77d] px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        خرید پله‌ای
                      </span>
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
