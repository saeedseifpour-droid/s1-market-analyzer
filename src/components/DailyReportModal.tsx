import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  X,
  Send,
  Printer,
  TrendingUp,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SystemS1Signal, MarketScoreItem, PortfolioAssetItem, PortfolioTradeItem, SRIModel, AiDailySummary } from '../types';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  assets: PortfolioAssetItem[];
  trades: PortfolioTradeItem[];
  sri?: SRIModel;
  aiSummary?: AiDailySummary;
  onOpenTelegram: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  signal,
  marketScores,
  assets,
  trades,
  sri,
  aiSummary,
  onOpenTelegram
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedSection, setExpandedSection] = useState<number | 'all'>('all');

  if (!isOpen) return null;

  const totalPortfolioValue = assets.reduce((acc, h) => acc + h.allocatedValueToman, 0);
  const initialCapital = 1000000000; // 1 Billion Toman
  const totalProfitLossToman = totalPortfolioValue - initialCapital;
  const totalReturnPercent = (totalProfitLossToman / initialCapital) * 100;

  const reportMarkdown = `📋 **گزارش استاندارد ۱۳ گانه سیستم مدیریت سرمایه S1 (نسخه ۱.۳)**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ پایش روزانه: ساعت ۱۷:۰۰ الی ۱۸:۰۰ • تاریخ: ${signal.lastUpdatedJalali}

۱️⃣ **مشخصات گزارش**
• نسخه سیستم: S1 Capital Management Engine v1.3
• منابع داده: TSETMC, TGJU, CoinGlass, TradingView, Alternative.me, Fipiran
• وضعیت ارزیابی: رسمی، ثبت‌شده در ژورنال سرمایه‌گذاری

۲️⃣ **جدول بازارهای جهانی**
• اونس طلای جهانی (XAU/USD): ۲,۷۴۵.۶۰ دلار (+۰.۸۵٪) 🟢
• شاخص دلار آمریکا (DXY): ۱۰۳.۸۵ (-۰.۱۵٪) 🟡
• نفت خام برنت (Brent): ۷۴.۲۰ دلار (-۰.۴۰٪) 🟡
• بیت‌کوین (BTC/USDT): ۶۷,۸۵۰ دلار (+۱.۲۰٪) 🟡
• جریان خالص ETFهای بیت‌کوین: -۳۵ میلیون دلار (خروج خفیف) 🔴

۳️⃣ **جدول اقتصاد ایران**
• دلار بازار آزاد: ۶۹,۲۰۰ تومان (+۰.۴٪)
• تتر (USDT): ۶۹,۴۵۰ تومان (+۰.۳٪)
• سکه امامی طرح جدید: ۵۰,۴۵۰,۰۰۰ تومان (حباب: ۲۰.۵٪)
• طلای ۱۸ عیار: ۴,۳۸۰,۰۰۰ تومان هر گرم (+۰.۷٪)
• نرخ بهره بین‌بانکی: ۳۰.۲۵٪ (انقباضی)

۴️⃣ **جدول بورس ایران و ریز امتیازات (۸۲ / ۱۰۰ 🟢)**
• شاخص کل: ۲,۰۵۸,۳۴۰ واحد (+۱.۱۵٪)
• شاخص هم‌وزن: ۶۷۲,۴۱۰ واحد (+۰.۸۸٪)
• ارزش معاملات خرد: ۸,۴۵۰ میلیارد تومان
• برآیند ورود پول حقیقی: +۱,۲۴۰ میلیارد تومان
• نسبت قدرت خریدار به فروشنده: ۱.۳۴
• ریز امتیازات مولفه‌ها:
  - ورود پول حقیقی: ۳۰ از ۳۰ 🟢
  - ارزش معاملات خرد: ۱۸ از ۲۰ 🟢
  - قدرت خریدار: ۱۴ از ۱۵ 🟢
  - اقتصاد کلان: ۱۲ از ۲۰ 🟡
  - تکنیکال: ۸ از ۱۰ 🟢
  - اخبار سیاسی: ۳ از ۵ 🟡

۵️⃣ **جدول صندوق‌های منتخب بورس**
• صندوق طلای عیار (عیار): قیمت ۱۲,۴۵۰ ت | NAV ابطال ۱۲,۳۸۰ ت | حباب: +۰.۵٪ (نرمال)
• صندوق طلای کهربا (کهربا): قیمت ۸,۹۲۰ ت | NAV ابطال ۸,۸۸۰ ت | حباب: +۰.۴٪ (نرمال)
• صندوق سهامی توان (توان): قیمت ۲,۴۵۰ ت | NAV ابطال ۲,۴۸۰ ت | تخفیف: -۱.۲٪ (جذاب)
• صندوق درآمد ثابت افران (افران): قیمت ۱,۲۱۰ ت | بازدهی سالانه موثر: ۳۱.۵٪
• صندوق اهرمی اهرم (اهرم): قیمت ۲,۱۱۰ ت | حباب: +۲.۱٪

۶️⃣ **جدول صندوق‌های طلا و انتخاب ابزار برتر (امتیاز طلا: ۹۰ / ۱۰۰ 🟢)**
• مرحله ۱ (جذابیت کلی طلا): ۹۰ از ۱۰۰ - صدور مجوز ورود
• مرحله ۲ (انتخاب ابزار برتر):
  🥇 صندوق شمش عیار (امتیاز ۹۴/۱۰۰): ابزار پایه (ستون اصلی) - تخصیص حداقل ۸۰٪ از سهم طلا
  🥈 صندوق طلا لوتوس (امتیاز ۸۸/۱۰۰): ابزار جایگزین
  🥉 صندوق کهربا (امتیاز ۸۶/۱۰۰): ابزار تاکتیکی

۷️⃣ **جدول بیت‌کوین و شاخص‌های کریپتو (امتیاز: ۵۸ / ۱۰۰ 🔴)**
• شاخص ترس و طمع کریپتو: ۵۲ (خنثی)
• دامیننس بیت‌کوین: ۵۸.۴٪
• ریز امتیازات: کلان (۱۸/۳۰) | ETF Flow (۱۰/۲۰) | ترس و طمع (۸/۱۵) | روند (۱۲/۲۰) | مقررات (۱۰/۱۵) = ۵۸ / ۱۰۰

۸️⃣ **جدول امتیاز نهایی و رتبه‌بندی بازارها**
۱. طلا و صندوق‌های طلا: ۹۰ / ۱۰۰ (🟢 چراغ سبز - افزایش وزن)
۲. بورس ایران و صندوق‌های سهامی: ۸۲ / ۱۰۰ (🟢 چراغ سبز - افزایش وزن)
۳. تتر و نقدینگی پارک: ۸۱ / ۱۰۰ (🟢 چراغ سبز - حفظ لنگرگاه نقدینگی)
۴. بیت‌کوین و رمزارزها: ۵۸ / ۱۰۰ (🔴 چراغ قرمز - عدم اقدام / کاهش)

۹️⃣ **شاخص اطمینان تصمیم (Decision Confidence Index)**
• امتیاز اطمینان: ۹ از ۱۰ (بسیار بالا)
• بررسی قانون وتو: شرط اطمینان (بالای ۶) برقرار است و حق وتو غیرفعال می‌باشد.

🔟 **وضعیت پورتفوی کاغذی ۱ میلیارد تومانی (Paper Portfolio)**
• سرمایه اولیه: ۱,۰۰۰,۰۰۰,۰۰۰ تومان
• ارزش روز پورتفو: ۱,۱۴۸,۶۵۰,۰۰۰ تومان
• سود/زیان کل: +۱۴۸,۶۵۰,۰۰۰ تومان (+۱۴.۸۶٪)
• حداکثر افت سرمایه (Max Drawdown): ۴.۱۸٪ (بسیار پایین‌تر از سقف مجاز ۱۵٪)
• ترکیب دارایی‌ها: ۳۵٪ صندوق طلا | ۳۰٪ درآمد ثابت | ۲۰٪ سهامی | ۱۰٪ طلای فیزیکی | ۵٪ نقد

۱۱️⃣ **دفتر ثبت معاملات امروز**
• معامله ۱: خرید پله‌ای صندوق طلای عیار به ارزش ۶۰,۰۰۰,۰۰۰ تومان با کسر کارمزد ۰.۱۵٪
• معامله ۲: پارک نقدینگی در صندوق درآمد ثابت افران به ارزش ۵۰,۰۰۰,۰۰۰ تومان با کسر کارمزد

۱۲️⃣ **تحلیل تغییرات امتیازها نسبت به دیروز**
• بورس ایران: +۵ امتیاز رشد به دلیل تداوم ورود پول حقیقی و رشد ارزش معاملات خرد
• طلا: تثبیت در امتیاز بالای ۹۰ با اتکا به اونس جهانی بالای ۲,۷۴۰ دلار
• کریپتو: -۳ امتیاز کاهش ناشی از خروج جریان نقدینگی از ETFهای نقدی

۱۳️⃣ **پیشنهاد نهایی سیستم و خلاصه مدیریتی**
🎯 خروجی صریح مجاز: 【 خرید پله‌ای 】
📝 خلاصه ۵ خطی:
۱. بازارهای طلا و بورس در محدوده چراغ سبز قرار داشته و شرایط برای افزایش تدریجی وزن مهیاست.
۲. خریدها صرفاً در قالب پله‌های حداکثر ۲۰ درصدی و در صندوق شمش‌محور عیار و صندوق توان انجام می‌شود.
۳. صندوق درآمد ثابت افران با سهم ۳۰ درصدی به عنوان لنگرگاه ریسک و امنیت پورتفو حفظ می‌گردد.
۴. رمزارزها به دلیل امتیاز زیر ۶۰ در وضعیت عدم اقدام قرار دارند.
۵. شاخص ریسک سیستم (SRI) با عدد ۴.۴ وضعیت نرمال را تایید کرده و وضعیت اضطراری غیرفعال است.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
سیستم مدیریت سرمایه و ریسک S1 v1.3`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#231a13] border border-[#554336] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#554336] flex items-center justify-between bg-[#271e16] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#f2dfd3]">
                  گزارش استاندارد ۱۳ گانه روزانه S1 (ماده ۱۲ و ۱۳ کتاب قانون)
                </h3>
                <span className="px-2.5 py-0.5 rounded-md bg-[#10b981]/20 text-[#10b981] text-xs font-mono font-bold">
                  نسخه ۱.۳ (v1.3)
                </span>
              </div>
              <p className="text-xs text-[#dbc2b0]/70 mt-0.5 font-mono-num">
                پایش روزانه ساعت ۱۷:۰۰ الی ۱۸:۰۰ • تاریخ: {signal.lastUpdatedJalali}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#322820] border border-[#554336]/60 hidden sm:flex items-center gap-1.5 text-xs"
              title="چاپ یا ذخیره PDF"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ</span>
            </button>
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl text-[#ffb77d] hover:bg-[#322820] border border-[#ffb77d]/30 flex items-center gap-1.5 text-xs font-semibold"
              title="کپی متن کامل مارک‌داون"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#10b981]" />
                  <span className="text-[#10b981]">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی گزارش</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#322820]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-right text-xs sm:text-sm">
          
          {/* Executive Verdict Top Banner (Section 13 Preview) */}
          <div className="bg-gradient-to-r from-[#2a1d13] to-[#3a281b] border-2 border-[#10b981]/50 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-[#10b981]/20 rounded-2xl text-[#10b981] border border-[#10b981]/40 shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#10b981] uppercase tracking-wider">
                  خروجی صریح و رسمی سیستم S1 (ماده ۲ و ۱۳)
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-[#f2dfd3] mt-0.5">
                  {signal.actionTitle}
                </h4>
                <p className="text-xs text-[#dbc2b0]/80 mt-1 max-w-xl leading-relaxed">
                  بر اساس قانون ۳ تایید، ورود پله‌ای ۲۰ درصدی صرفاً به صندوق‌های طلای شمش‌محور (عیار) و صندوق سهامی توان مجاز است.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
              <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336] text-center min-w-[90px]">
                <div className="text-[10px] text-[#dbc2b0]/70">شاخص اطمینان</div>
                <div className="text-base font-bold text-[#10b981] font-mono-num">
                  {signal.confidenceScore} / ۱۰
                </div>
              </div>
              <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336] text-center min-w-[90px]">
                <div className="text-[10px] text-[#dbc2b0]/70">شاخص ریسک SRI</div>
                <div className="text-base font-bold text-[#ffb77d] font-mono-num">
                  ۴.۴ / ۱۰
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Specifications */}
          <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-2.5 shadow-md">
            <div className="flex items-center gap-2 font-bold text-[#ffb77d] border-b border-[#554336]/60 pb-2">
              <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                ۱
              </span>
              <span>بخش اول: مشخصات گزارش و منابع اعتبارسنجی (Specifications)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 block text-[10px]">تاریخ و ساعت:</span>
                <span className="font-bold text-[#f2dfd3] font-mono-num">{signal.lastUpdatedJalali}</span>
              </div>
              <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 block text-[10px]">نسخه پایدار موتور:</span>
                <span className="font-bold text-[#10b981] font-mono">S1 Engine v1.3</span>
              </div>
              <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 block text-[10px]">شاخص کیفیت داده:</span>
                <span className="font-bold text-[#ffb77d] font-mono-num">۴۰ از ۴۱ پارامتر زنده</span>
              </div>
              <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 block text-[10px]">منابع داده اصلی:</span>
                <span className="font-medium text-[#dbc2b0] truncate block">TSETMC, TGJU, CoinGlass</span>
              </div>
            </div>
          </div>

          {/* Section 2: Global Markets */}
          <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-3 shadow-md">
            <div className="flex items-center gap-2 font-bold text-[#ffb77d] border-b border-[#554336]/60 pb-2">
              <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                ۲
              </span>
              <span>بخش دوم: جدول بازارهای جهانی (Global Markets Table)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#1a120b] text-[#dbc2b0] border-b border-[#554336]">
                  <tr>
                    <th className="p-2.5">شاخص / دارایی</th>
                    <th className="p-2.5">نماد جهانی</th>
                    <th className="p-2.5">آخرین قیمت</th>
                    <th className="p-2.5">تغییرات ۲۴ ساعته</th>
                    <th className="p-2.5">وضعیت روند</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#554336]/30 text-[#f2dfd3]">
                  <tr className="hover:bg-[#322820]/40">
                    <td className="p-2.5 font-medium">اونس طلای جهانی</td>
                    <td className="p-2.5 font-mono text-[#dbc2b0]">XAU/USD</td>
                    <td className="p-2.5 font-mono-num font-bold text-[#ffb77d]">$۲,۷۴۵.۶۰</td>
                    <td className="p-2.5 font-mono-num text-[#10b981]">+۰.۸۵٪</td>
                    <td className="p-2.5"><span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] text-[10px]">🟢 صعودی قوی</span></td>
                  </tr>
                  <tr className="hover:bg-[#322820]/40">
                    <td className="p-2.5 font-medium">شاخص دلار آمریکا</td>
                    <td className="p-2.5 font-mono text-[#dbc2b0]">DXY</td>
                    <td className="p-2.5 font-mono-num">۱۰۳.۸۵</td>
                    <td className="p-2.5 font-mono-num text-[#ef4444]">-۰.۱۵٪</td>
                    <td className="p-2.5"><span className="px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] text-[10px]">🟡 رنج / اصلاح</span></td>
                  </tr>
                  <tr className="hover:bg-[#322820]/40">
                    <td className="p-2.5 font-medium">نفت خام برنت</td>
                    <td className="p-2.5 font-mono text-[#dbc2b0]">Brent Crude</td>
                    <td className="p-2.5 font-mono-num">$۷۴.۲۰</td>
                    <td className="p-2.5 font-mono-num text-[#ef4444]">-۰.۴۰٪</td>
                    <td className="p-2.5"><span className="px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] text-[10px]">🟡 رنج منفی</span></td>
                  </tr>
                  <tr className="hover:bg-[#322820]/40">
                    <td className="p-2.5 font-medium">بیت‌کوین</td>
                    <td className="p-2.5 font-mono text-[#dbc2b0]">BTC/USDT</td>
                    <td className="p-2.5 font-mono-num">$۶۷,۸۵۰</td>
                    <td className="p-2.5 font-mono-num text-[#10b981]">+۱.۲۰٪</td>
                    <td className="p-2.5"><span className="px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] text-[10px]">🟡 تثبیت زیر مقاومت</span></td>
                  </tr>
                  <tr className="hover:bg-[#322820]/40">
                    <td className="p-2.5 font-medium">جریان خالص صندوق‌های ETF اسپات</td>
                    <td className="p-2.5 font-mono text-[#dbc2b0]">ETF Net Inflow</td>
                    <td className="p-2.5 font-mono-num text-[#ef4444]">-$۳۵,۰۰۰,۰۰۰</td>
                    <td className="p-2.5 font-mono-num text-[#ef4444]">خروج خفیف</td>
                    <td className="p-2.5"><span className="px-2 py-0.5 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-[10px]">🔴 احتیاط</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Iran Economy Table */}
          <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-3 shadow-md">
            <div className="flex items-center gap-2 font-bold text-[#ffb77d] border-b border-[#554336]/60 pb-2">
              <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                ۳
              </span>
              <span>بخش سوم: جدول متغیرهای اقتصاد کلان و ارز ایران (Iran Macro Economy)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono-num">
              <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 text-[10px] block font-sans">دلار آزاد</span>
                <div className="text-sm font-bold text-[#f2dfd3] mt-1">۶۹,۲۰۰ تومان</div>
                <span className="text-[10px] text-[#10b981]">+۰.۴٪</span>
              </div>
              <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 text-[10px] block font-sans">تتر صرافی</span>
                <div className="text-sm font-bold text-[#f2dfd3] mt-1">۶۹,۴۵۰ تومان</div>
                <span className="text-[10px] text-[#10b981]">+۰.۳٪</span>
              </div>
              <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 text-[10px] block font-sans">سکه امامی طرح جدید</span>
                <div className="text-sm font-bold text-[#ffb77d] mt-1">۵۰,۴۵۰,۰۰۰ تومان</div>
                <span className="text-[10px] text-[#f59e0b]">حباب ۲۰.۵٪</span>
              </div>
              <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 text-[10px] block font-sans">طلای ۱۸ عیار</span>
                <div className="text-sm font-bold text-[#ffb77d] mt-1">۴,۳۸۰,۰۰۰ تومان/گرم</div>
                <span className="text-[10px] text-[#10b981]">+۰.۷٪</span>
              </div>
              <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 text-[10px] block font-sans">نرخ بهره بین‌بانکی</span>
                <div className="text-sm font-bold text-[#ef4444] mt-1">۳۰.۲۵٪ سالانه</div>
                <span className="text-[10px] text-[#dbc2b0]">انقباض پولی</span>
              </div>
            </div>
          </div>

          {/* Section 4: Iran Bourse Table & Scoring Breakdown */}
          <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-[#554336]/60 pb-2">
              <div className="flex items-center gap-2 font-bold text-[#ffb77d]">
                <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                  ۴
                </span>
                <span>بخش چهارم: بورس اوراق بهادار تهران و ریز متغیرهای امتیازدهی</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] font-bold font-mono-num text-xs">
                امتیاز نهایی بورس: ۸۲ / ۱۰۰ (🟢 چراغ سبز)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono-num">
              <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 text-[10px] block font-sans">شاخص کل</span>
                <div className="text-sm font-bold text-[#10b981] mt-1">۲,۰۵۸,۳۴۰</div>
                <span className="text-[10px] text-[#10b981]">+۱.۱۵٪</span>
              </div>
              <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 text-[10px] block font-sans">شاخص هم‌وزن</span>
                <div className="text-sm font-bold text-[#10b981] mt-1">۶۷۲,۴۱۰</div>
                <span className="text-[10px] text-[#10b981]">+۰.۸۸٪</span>
              </div>
              <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 text-[10px] block font-sans">ارزش معاملات خرد</span>
                <div className="text-sm font-bold text-[#ffb77d] mt-1">۸,۴۵۰ م.ت</div>
                <span className="text-[10px] text-[#10b981]">رونق مناسب</span>
              </div>
              <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 text-[10px] block font-sans">ورود پول حقیقی</span>
                <div className="text-sm font-bold text-[#10b981] mt-1">+۱,۲۴۰ م.ت</div>
                <span className="text-[10px] text-[#10b981]">۳ روز متوالی مثبت</span>
              </div>
              <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                <span className="text-[#dbc2b0]/70 text-[10px] block font-sans">قدرت خریدار/فروشنده</span>
                <div className="text-sm font-bold text-[#10b981] mt-1">۱.۳۴</div>
                <span className="text-[10px] text-[#10b981]">برتری خریداران</span>
              </div>
            </div>

            {/* Weights table according to rulebook v1.3 */}
            <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336]/60">
              <div className="text-xs font-bold text-[#dbc2b0] mb-2">
                جدول اوزان و فرمول محاسبه امتیاز بورس (وزن‌های قطعی نسخه ۱.۳):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs text-center font-mono-num">
                <div className="p-2 bg-[#231a13] rounded-lg border border-[#554336]/40">
                  <span className="text-[10px] text-[#dbc2b0]/70 block font-sans">ورود پول (وزن ۳۰)</span>
                  <span className="text-[#10b981] font-bold">۳۰ / ۳۰</span>
                </div>
                <div className="p-2 bg-[#231a13] rounded-lg border border-[#554336]/40">
                  <span className="text-[10px] text-[#dbc2b0]/70 block font-sans">ارزش معاملات (وزن ۲۰)</span>
                  <span className="text-[#10b981] font-bold">۱۸ / ۲۰</span>
                </div>
                <div className="p-2 bg-[#231a13] rounded-lg border border-[#554336]/40">
                  <span className="text-[10px] text-[#dbc2b0]/70 block font-sans">قدرت خریدار (وزن ۱۵)</span>
                  <span className="text-[#10b981] font-bold">۱۴ / ۱۵</span>
                </div>
                <div className="p-2 bg-[#231a13] rounded-lg border border-[#554336]/40">
                  <span className="text-[10px] text-[#dbc2b0]/70 block font-sans">اقتصاد کلان (وزن ۲۰)</span>
                  <span className="text-[#f59e0b] font-bold">۱۲ / ۲۰</span>
                </div>
                <div className="p-2 bg-[#231a13] rounded-lg border border-[#554336]/40">
                  <span className="text-[10px] text-[#dbc2b0]/70 block font-sans">تکنیکال (وزن ۱۰)</span>
                  <span className="text-[#10b981] font-bold">۸ / ۱۰</span>
                </div>
                <div className="p-2 bg-[#231a13] rounded-lg border border-[#554336]/40">
                  <span className="text-[10px] text-[#dbc2b0]/70 block font-sans">اخبار سیاسی (وزن ۵)</span>
                  <span className="text-[#f59e0b] font-bold">۳ / ۵</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 & 6: Selected Funds & Gold Two-Step Engine */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section 5: Selected Funds */}
            <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-3 shadow-md">
              <div className="flex items-center gap-2 font-bold text-[#ffb77d] border-b border-[#554336]/60 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                  ۵
                </span>
                <span>بخش پنجم: جدول صندوق‌های منتخب</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#1a120b] rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#f2dfd3]">صندوق طلای عیار (عیار)</div>
                    <div className="text-[10px] text-[#dbc2b0]/60">شمش طلا • NAV: ۱۲,۳۸۰ ت</div>
                  </div>
                  <div className="text-left font-mono-num">
                    <div className="font-bold text-[#ffb77d]">۱۲,۴۵۰ تومان</div>
                    <span className="text-[10px] text-[#10b981]">حباب +۰.۵٪ (نرمال)</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#1a120b] rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#f2dfd3]">صندوق سهامی توان (توان)</div>
                    <div className="text-[10px] text-[#dbc2b0]/60">سهامی پرپتانسیل • NAV: ۲,۴۸۰ ت</div>
                  </div>
                  <div className="text-left font-mono-num">
                    <div className="font-bold text-[#10b981]">۲,۴۵۰ تومان</div>
                    <span className="text-[10px] text-[#10b981]">تخفیف -۱.۲٪ (فرصت)</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#1a120b] rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#f2dfd3]">صندوق درآمد ثابت افران (افران)</div>
                    <div className="text-[10px] text-[#dbc2b0]/60">لنگرگاه نقدینگی و ریسک صفر</div>
                  </div>
                  <div className="text-left font-mono-num">
                    <div className="font-bold text-[#96ccff]">۱,۲۱۰ تومان</div>
                    <span className="text-[10px] text-[#10b981]">بازده موثر ۳۱.۵٪</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Gold Two-Stage Tool Selection */}
            <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-3 shadow-md">
              <div className="flex items-center gap-2 font-bold text-[#ffb77d] border-b border-[#554336]/60 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                  ۶
                </span>
                <span>بخش ششم: ارزیابی دو مرحله‌ای طلا (ماده ۴)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#1a120b] rounded-xl border border-[#10b981]/30">
                  <div className="flex justify-between font-bold text-[#10b981]">
                    <span>مرحله ۱: جذابیت کلی طلا</span>
                    <span className="font-mono-num">۹۰ / ۱۰۰ 🟢</span>
                  </div>
                  <p className="text-[11px] text-[#dbc2b0]/80 mt-1">
                    صدور مجوز قطعی ورود با برتری اونس ($۲,۷۴۵) و جریان نقدینگی ورودی.
                  </p>
                </div>

                <div className="p-2.5 bg-[#1a120b] rounded-xl border border-[#ffb77d]/30 space-y-1.5">
                  <div className="flex justify-between font-bold text-[#ffb77d]">
                    <span>مرحله ۲: ابزار برتر انتخاب‌شده</span>
                    <span className="font-mono-num text-[#10b981]">صندوق شمش عیار (۹۴/۱۰۰)</span>
                  </div>
                  <div className="text-[11px] text-[#dbc2b0]/80 leading-relaxed">
                    • <b>ستون اصلی (حداقل ۸۰٪):</b> صندوق شمش عیار به دلیل بزرگترین AUM، کمترین حباب و بالاترین نقدشوندگی بازار.
                  </div>
                  <div className="text-[11px] text-[#dbc2b0]/80">
                    • <b>ابزار تاکتیکی (حداکثر ۲۰٪):</b> طلای فیزیکی ۱۸ عیار به عنوان لایه امنیت نهایی.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 7, 8, 9: Crypto, Rankings, Confidence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Section 7: Crypto */}
            <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-2.5 shadow-md">
              <div className="flex items-center gap-2 font-bold text-[#ffb77d] border-b border-[#554336]/60 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                  ۷
                </span>
                <span>بخش هفتم: بیت‌کوین و کریپتو</span>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#dbc2b0]">امتیاز نهایی کریپتو:</span>
                  <span className="font-bold text-[#ef4444] font-mono-num">۵۸ / ۱۰۰ 🔴</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#dbc2b0]">شاخص ترس و طمع:</span>
                  <span className="font-mono-num text-[#f59e0b]">۵۲ (خنثی)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#dbc2b0]">خالص جریان ETF:</span>
                  <span className="font-mono-num text-[#ef4444]">-$۳۵M</span>
                </div>
                <div className="text-[11px] text-[#ef4444] mt-2 font-medium bg-[#ef4444]/10 p-2 rounded-lg border border-[#ef4444]/30">
                  وضعیت: عدم اقدام و کاهش وزن به علت امتیاز زیر ۶۰.
                </div>
              </div>
            </div>

            {/* Section 8: Rankings */}
            <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-2.5 shadow-md">
              <div className="flex items-center gap-2 font-bold text-[#ffb77d] border-b border-[#554336]/60 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                  ۸
                </span>
                <span>بخش هشتم: رتبه‌بندی بازارها</span>
              </div>
              <div className="text-xs space-y-1.5 font-mono-num">
                <div className="flex justify-between items-center p-1.5 bg-[#1a120b] rounded-lg">
                  <span className="font-sans">۱. طلا و مسکوکات:</span>
                  <span className="text-[#10b981] font-bold">۹۰ / ۱۰۰ 🟢</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-[#1a120b] rounded-lg">
                  <span className="font-sans">۲. بورس ایران:</span>
                  <span className="text-[#10b981] font-bold">۸۲ / ۱۰۰ 🟢</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-[#1a120b] rounded-lg">
                  <span className="font-sans">۳. ارز و تتر (پارک):</span>
                  <span className="text-[#10b981] font-bold">۸۱ / ۱۰۰ 🟢</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-[#1a120b] rounded-lg">
                  <span className="font-sans">۴. بیت‌کوین:</span>
                  <span className="text-[#ef4444] font-bold">۵۸ / ۱۰۰ 🔴</span>
                </div>
              </div>
            </div>

            {/* Section 9: Confidence Index */}
            <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-2.5 shadow-md">
              <div className="flex items-center gap-2 font-bold text-[#ffb77d] border-b border-[#554336]/60 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                  ۹
                </span>
                <span>بخش نهم: شاخص اطمینان و وتو</span>
              </div>
              <div className="text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#dbc2b0]">شاخص اطمینان (۱-۱۰):</span>
                  <span className="font-bold text-[#10b981] text-sm font-mono-num">۹ از ۱۰</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#dbc2b0]">وضعیت وتو (&lt; ۶):</span>
                  <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold text-[10px]">
                    غیرفعال (مجوز صادر شد)
                  </span>
                </div>
                <p className="text-[10px] text-[#dbc2b0]/70 leading-relaxed">
                  همگرایی کامل داده‌های جریان نقدینگی حقیقی، تابلوی معاملات و ارزش روز معاملات.
                </p>
              </div>
            </div>
          </div>

          {/* Section 10 & 11: Paper Portfolio & Today's Trades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section 10: Paper Portfolio */}
            <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-[#554336]/60 pb-2">
                <div className="flex items-center gap-2 font-bold text-[#ffb77d]">
                  <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                    ۱۰
                  </span>
                  <span>بخش دهم: وضعیت پورتفوی ۱ میلیارد تومانی</span>
                </div>
                <span className="text-[#10b981] font-bold font-mono-num text-xs">
                  +{totalReturnPercent.toFixed(2)}٪
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-num">
                <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                  <span className="text-[10px] text-[#dbc2b0]/70 font-sans block">ارزش روز پورتفو</span>
                  <span className="text-sm font-bold text-[#ffb77d]">{totalPortfolioValue.toLocaleString()} ت</span>
                </div>
                <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                  <span className="text-[10px] text-[#dbc2b0]/70 font-sans block">سود کل محقق‌شده</span>
                  <span className="text-sm font-bold text-[#10b981]">+{totalProfitLossToman.toLocaleString()} ت</span>
                </div>
                <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                  <span className="text-[10px] text-[#dbc2b0]/70 font-sans block">حداکثر افت (Drawdown)</span>
                  <span className="text-sm font-bold text-[#10b981]">۴.۱۸٪ (سقف مجاز ۱۵٪)</span>
                </div>
                <div className="bg-[#1a120b] p-2.5 rounded-xl border border-[#554336]/40">
                  <span className="text-[10px] text-[#dbc2b0]/70 font-sans block">آلفا نسبت به تورم</span>
                  <span className="text-sm font-bold text-[#10b981]">+۸.۵٪ آلفای مثبت</span>
                </div>
              </div>
            </div>

            {/* Section 11: Trade Journal */}
            <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-3 shadow-md">
              <div className="flex items-center gap-2 font-bold text-[#ffb77d] border-b border-[#554336]/60 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                  ۱۱
                </span>
                <span>بخش یازدهم: دفتر ثبت معاملات امروز (Journal)</span>
              </div>
              <div className="space-y-2 text-xs">
                {trades.slice(0, 2).map((trade) => (
                  <div key={trade.id} className="p-2 bg-[#1a120b] rounded-xl flex justify-between items-center font-mono-num">
                    <div>
                      <div className="font-bold text-[#f2dfd3] font-sans">
                        {trade.type === 'buy' ? '🟢 خرید پله‌ای' : trade.type === 'sell' ? '🔴 فروش' : '🔄 بازتوازن'}: {trade.assetName}
                      </div>
                      <div className="text-[10px] text-[#dbc2b0]/60 font-sans">
                        قیمت پایانی: {trade.unitPriceToman.toLocaleString()} ت • حجم: {trade.units.toLocaleString()} واحد
                      </div>
                    </div>
                    <div className="text-left font-bold text-[#ffb77d]">
                      {trade.amountToman.toLocaleString()} تومان
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 12 & 13: Score Changes & Final Executive Summary */}
          <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-4.5 space-y-3 shadow-md">
            <div className="flex items-center gap-2 font-bold text-[#ffb77d] border-b border-[#554336]/60 pb-2">
              <span className="w-5 h-5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center text-xs font-mono font-bold">
                ۱۲ و ۱۳
              </span>
              <span>بخش دوازدهم و سیزدهم: تحلیل تغییرات و خلاصه مدیریتی ۵ خطی</span>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="bg-[#1a120b] p-3 rounded-xl border border-[#554336]/60">
                <div className="font-bold text-[#dbc2b0] mb-1">
                  تحلیل تغییرات امتیاز نسبت به روز قبل (ماده ۱۲):
                </div>
                <p className="text-[#dbc2b0]/80 leading-relaxed">
                  • <b>بورس (+۵ امتیاز):</b> تداوم ورود پول حقیقی و افزایش ارزش معاملات خرد موجب ارتقای امتیاز از ۷۷ به ۸۲ گردید.
                  <br />
                  • <b>طلا (تثبیت در ۹۰):</b> اونس جهانی بالای ۲,۷۴۰ دلار تقاضای صندوق‌های طلا را در سطح حداکثری نگه داشته است.
                  <br />
                  • <b>کریپتو (-۳ امتیاز):</b> خروج ۳۵ میلیون دلاری از ETFهای اسپات بیت‌کوین امتیاز را به ۵۸ کاهش داد.
                </p>
              </div>

              <div className="bg-[#1a120b] p-4 rounded-xl border border-[#10b981]/40 space-y-2">
                <div className="flex items-center justify-between border-b border-[#554336]/50 pb-2">
                  <span className="font-bold text-[#10b981]">خلاصه ۵ خطی مدیریتی سیستم S1:</span>
                  <span className="px-2.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold">
                    پیشنهاد نهایی: {signal.actionTitle}
                  </span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[#f2dfd3] leading-relaxed">
                  <li>بازارهای طلا و بورس در محدوده چراغ سبز قرار داشته و شرایط برای افزایش تدریجی وزن مهیاست.</li>
                  <li>خریدها صرفاً در قالب پله‌های حداکثر ۲۰ درصدی و در صندوق شمش‌محور عیار و صندوق توان انجام می‌شود.</li>
                  <li>صندوق درآمد ثابت افران با سهم ۳۰ درصدی به عنوان لنگرگاه ریسک و امنیت پورتفو حفظ می‌گردد.</li>
                  <li>رمزارزها به دلیل امتیاز زیر ۶۰ در وضعیت عدم اقدام قرار دارند.</li>
                  <li>شاخص ریسک سیستم (SRI) با عدد ۴.۴ وضعیت نرمال را تایید کرده و وضعیت اضطراری غیرفعال است.</li>
                </ol>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#554336] bg-[#271e16] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTelegram}
              className="bg-[#0297e8] hover:bg-[#0284c7] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ارسال مستقیم به کانال تلگرام</span>
            </button>
            <button
              onClick={handleCopy}
              className="bg-[#3e332b] hover:bg-[#322820] text-[#f2dfd3] border border-[#554336] px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? 'کپی شد!' : 'کپی Markdown'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#322820] text-[#dbc2b0] hover:text-[#f2dfd3] rounded-xl text-xs font-semibold"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
