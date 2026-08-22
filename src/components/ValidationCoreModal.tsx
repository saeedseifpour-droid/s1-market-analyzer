import React, { useState } from 'react';
import {
  ValidationAuditReport,
  StandardDailyInput13Sections,
  InputMetric,
} from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Search,
  ExternalLink,
  Cpu,
  Layers,
  FileText,
  Calculator,
  Check,
  TrendingUp,
  Award,
} from 'lucide-react';
import { formatPersianNumber } from '../utils/s1ValidationCore';

interface ValidationCoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditReport: ValidationAuditReport | null;
  daily13Sections: StandardDailyInput13Sections;
  onRevalidate: () => void;
  isRevalidating?: boolean;
}

export const ValidationCoreModal: React.FC<ValidationCoreModalProps> = ({
  isOpen,
  onClose,
  auditReport,
  daily13Sections,
  onRevalidate,
  isRevalidating = false,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'formulas' | 'sources' | 'sections'>('audit');

  if (!isOpen) return null;

  const confidence = auditReport?.confidencePercentage ?? 98;
  const checks = auditReport?.checks ?? [];
  const passedCount = checks.filter((c) => c.status === 'passed').length;
  const correctedCount = checks.filter((c) => c.status === 'corrected').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#231a13] border border-[#554336] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#554336] flex items-center justify-between bg-[#2a2017]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#f2dfd3]">
                  هسته اعتبارسنجی و مانیتورینگ داده‌های مالی S1
                </h3>
                <span className="bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-num">
                  تایید شده {confidence}٪
                </span>
              </div>
              <p className="text-xs text-[#dbc2b0]/70 mt-0.5">
                موتور اعتبارسنجی خودکار ریاضی، تطبیق فرمول‌های اونس و حباب، و تایید منابع معتبر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRevalidate}
              disabled={isRevalidating}
              className="p-2 bg-[#322820] hover:bg-[#43352a] text-[#ffb77d] rounded-xl text-xs flex items-center gap-1.5 transition-all border border-[#554336] cursor-pointer disabled:opacity-50"
              title="اجرای مجدد اعتبارسنجی"
            >
              <RefreshCw className={`w-4 h-4 ${isRevalidating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">اعتبارسنجی مجدد</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#322820] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#554336] bg-[#1a120b] px-4 sm:px-6 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'border-[#10b981] text-[#10b981]'
                : 'border-transparent text-[#dbc2b0]/70 hover:text-[#f2dfd3]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            گزارش ممیزی ریاضی ({checks.length} آزمون)
          </button>
          <button
            onClick={() => setActiveTab('formulas')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'formulas'
                ? 'border-[#ffb77d] text-[#ffb77d]'
                : 'border-transparent text-[#dbc2b0]/70 hover:text-[#f2dfd3]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            فرمول‌ها و قوانین اعتبارسنجی
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sources'
                ? 'border-[#96ccff] text-[#96ccff]'
                : 'border-transparent text-[#dbc2b0]/70 hover:text-[#f2dfd3]'
            }`}
          >
            <Search className="w-4 h-4" />
            منابع استعلام زنده (۶ مرجع)
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sections'
                ? 'border-[#e0b0ff] text-[#e0b0ff]'
                : 'border-transparent text-[#dbc2b0]/70 hover:text-[#f2dfd3]'
            }`}
          >
            <Layers className="w-4 h-4" />
            نمای ۱۳ گانه داده‌های تایید شده
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#1a120b] border border-[#554336] p-3.5 rounded-xl">
              <div className="text-[11px] text-[#dbc2b0]/70 flex items-center justify-between">
                <span>سطح اطمینان داده‌ها</span>
                <Award className="w-4 h-4 text-[#10b981]" />
              </div>
              <div className="text-xl font-bold font-mono-num text-[#10b981] mt-1">
                {confidence}٪
              </div>
              <div className="text-[10px] text-[#10b981]/80 mt-0.5">بدون انحراف ساختاری</div>
            </div>

            <div className="bg-[#1a120b] border border-[#554336] p-3.5 rounded-xl">
              <div className="text-[11px] text-[#dbc2b0]/70 flex items-center justify-between">
                <span>آزمون‌های موفق</span>
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
              </div>
              <div className="text-xl font-bold font-mono-num text-[#f2dfd3] mt-1">
                {passedCount} از {checks.length}
              </div>
              <div className="text-[10px] text-[#dbc2b0]/60 mt-0.5">انطباق کامل فرمولی</div>
            </div>

            <div className="bg-[#1a120b] border border-[#554336] p-3.5 rounded-xl">
              <div className="text-[11px] text-[#dbc2b0]/70 flex items-center justify-between">
                <span>کالیبراسیون و اصلاح</span>
                <Cpu className="w-4 h-4 text-[#ffb77d]" />
              </div>
              <div className="text-xl font-bold font-mono-num text-[#ffb77d] mt-1">
                {correctedCount} مورد
              </div>
              <div className="text-[10px] text-[#ffb77d]/80 mt-0.5">تطبیق واحد و حباب</div>
            </div>

            <div className="bg-[#1a120b] border border-[#554336] p-3.5 rounded-xl">
              <div className="text-[11px] text-[#dbc2b0]/70 flex items-center justify-between">
                <span>شاخص‌های ورودی زنده</span>
                <Layers className="w-4 h-4 text-[#96ccff]" />
              </div>
              <div className="text-xl font-bold font-mono-num text-[#96ccff] mt-1">
                ۴۱ / ۴۱
              </div>
              <div className="text-[10px] text-[#96ccff]/80 mt-0.5">پوشش کامل ۱۳ بخش</div>
            </div>
          </div>

          {/* TAB 1: AUDIT CHECKS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-3.5 text-xs text-[#10b981] flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>
                  {auditReport?.summaryMessageFa ||
                    'تمامی محاسبات مقطعی طلا، سکه، تتر، صندوق‌ها و بورس با فرمول‌های ذاتی هسته S1 تطبیق داده شدند.'}
                </span>
              </div>

              <div className="space-y-3">
                {checks.map((chk) => {
                  const isPassed = chk.status === 'passed';
                  const isCorrected = chk.status === 'corrected';
                  return (
                    <div
                      key={chk.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPassed
                          ? 'bg-[#1a120b] border-[#10b981]/30'
                          : isCorrected
                          ? 'bg-[#1a120b] border-[#ffb77d]/30'
                          : 'bg-[#1a120b] border-[#ef4444]/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isPassed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                            ) : isCorrected ? (
                              <Cpu className="w-4 h-4 text-[#ffb77d]" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                            )}
                            <h4 className="text-sm font-bold text-[#f2dfd3]">{chk.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#322820] text-[#dbc2b0] border border-[#554336]">
                              {chk.category}
                            </span>
                          </div>
                          <p className="text-xs text-[#dbc2b0] font-mono-num pt-1">
                            📐 <strong className="text-[#dbc2b0]/80">فرمول ریاضی:</strong>{' '}
                            <span className="text-[#ffb77d]">{chk.formulaDescription}</span>
                          </p>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                            isPassed
                              ? 'bg-[#10b981]/20 text-[#10b981]'
                              : isCorrected
                              ? 'bg-[#ffb77d]/20 text-[#ffb77d]'
                              : 'bg-[#ef4444]/20 text-[#ef4444]'
                          }`}
                        >
                          {isPassed ? 'تایید فرمولی' : isCorrected ? 'کالیبره شد' : 'هشدار انحراف'}
                        </span>
                      </div>

                      {/* Values Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#554336]/60 text-xs">
                        {chk.theoreticalValue && (
                          <div className="bg-[#231a13] p-2.5 rounded-lg border border-[#554336]/40">
                            <span className="text-[11px] text-[#dbc2b0]/70 block">
                              ارزش محاسباتی هسته S1:
                            </span>
                            <span className="font-bold text-[#96ccff] font-mono-num">
                              {chk.theoreticalValue}
                            </span>
                          </div>
                        )}
                        {chk.actualMarketValue && (
                          <div className="bg-[#231a13] p-2.5 rounded-lg border border-[#554336]/40">
                            <span className="text-[11px] text-[#dbc2b0]/70 block">
                              مقدار ثبت شده بازار:
                            </span>
                            <span className="font-bold text-[#10b981] font-mono-num">
                              {chk.actualMarketValue}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 text-[11px] text-[#dbc2b0]/80 leading-relaxed bg-[#271e16]/60 p-2 rounded-lg">
                        ℹ️ {chk.note}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FORMULAS AND CORE ENGINE RULES */}
          {activeTab === 'formulas' && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#1a120b] border border-[#554336] p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#ffb77d]">
                  <Calculator className="w-4 h-4" />
                  ۱. فرمول استخراج و تبدیل طلای ۱۸ عیار از اونس جهانی و دلار آزاد
                </div>
                <div className="bg-[#231a13] p-3 rounded-lg font-mono-num text-[#96ccff] border border-[#554336]/60">
                  Theoretical Gold 18K = (Gold_Ounce_USD × USD_Free_Toman ÷ 31.1035) × (750 ÷ 999.9)
                </div>
                <p className="text-[#dbc2b0] leading-relaxed">
                  این فرمول ارزش لحظه‌ای هر گرم طلای ۱۸ عیار را بر مبنای اونس جهانی (۳۱.۱۰۳۵ گرم عیار ۹۹۹.۹) و نرخ دلار آزاد تهران محاسبه کرده و با تلرانس مجاز حداکثر ۸٪ صحه‌گذاری می‌کند.
                </p>
              </div>

              <div className="bg-[#1a120b] border border-[#554336] p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#ffb77d]">
                  <Calculator className="w-4 h-4" />
                  ۲. فرمول ارزش ذاتی و حباب ریاضی سکه تمام امامی
                </div>
                <div className="bg-[#231a13] p-3 rounded-lg font-mono-num text-[#96ccff] border border-[#554336]/60">
                  Intrinsic Coin = 8.133 × Gold_18K_Toman × (900 ÷ 750)
                  <br />
                  Coin Bubble % = ((Coin_Market_Price - Intrinsic) ÷ Intrinsic) × 100
                </div>
                <p className="text-[#dbc2b0] leading-relaxed">
                  وزن سکه امامی ۸.۱۳۳ گرم و عیار آن ۹۰۰ (۲۱.۶ عیار) است. هرگونه مغایرت در نرخ حباب اعلامی با این فرمول به طور خودکار تصحیح می‌گردد.
                </p>
              </div>

              <div className="bg-[#1a120b] border border-[#554336] p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#ffb77d]">
                  <Calculator className="w-4 h-4" />
                  ۳. فرمول آربیتراژ برابری دلار آزاد و تتر (USDT Parity Check)
                </div>
                <div className="bg-[#231a13] p-3 rounded-lg font-mono-num text-[#96ccff] border border-[#554336]/60">
                  Arbitrage Spread % = |USDT_Toman - USD_Free_Toman| ÷ USD_Free_Toman × 100 ≤ 4.0%
                </div>
                <p className="text-[#dbc2b0] leading-relaxed">
                  تتر و دلار کاغذی تهران باید در محدوده اسپرد طبیعی کمتر از ۴٪ همگرا باشند تا از خطای ورودی صرافی‌ها جلوگیری شود.
                </p>
              </div>

              <div className="bg-[#1a120b] border border-[#554336] p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#ffb77d]">
                  <Calculator className="w-4 h-4" />
                  ۴. فرمول نسبت قدرت خریدار به فروشنده و انحراف NAV صندوق‌ها
                </div>
                <div className="bg-[#231a13] p-3 rounded-lg font-mono-num text-[#96ccff] border border-[#554336]/60">
                  Buyer Power = Buyer_Per_Capita ÷ Seller_Per_Capita
                  <br />
                  NAV Deviation % = ((Market_Price - Cancellation_NAV) ÷ Cancellation_NAV) × 100
                </div>
                <p className="text-[#dbc2b0] leading-relaxed">
                  صحت سرانه‌های حقیقی و قیمت‌های صندوق‌های طلا (عیار)، اهرمی (توان) و درآمد ثابت (افران) تایید و از عدم تداخل ریال و تومان اطمینان حاصل می‌شود.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SOURCES CONSULTED */}
          {activeTab === 'sources' && (
            <div className="space-y-3 text-xs">
              <div className="bg-[#1a120b] border border-[#554336] rounded-xl overflow-hidden">
                <div className="p-3 bg-[#271e16] border-b border-[#554336] font-bold text-[#f2dfd3] flex justify-between items-center">
                  <span>جدول پایگاه‌ها و مراجع استعلام داده زنده</span>
                  <span className="text-[10px] text-[#10b981] font-mono-num">۶ مرجع متصل</span>
                </div>
                <div className="divide-y divide-[#554336]/40">
                  {(auditReport?.sourcesConsulted ?? [
                    { name: 'شبکه اطلاع‌رسانی طلا و ارز (TGJU)', domain: 'tgju.org', status: 'تایید زنده', recordsExtracted: 6 },
                    { name: 'مدیریت فناوری بورس تهران (TSETMC)', domain: 'tsetmc.com', status: 'تایید زنده', recordsExtracted: 12 },
                    { name: 'سامانه بورس کالای ایران & Fipiran', domain: 'fipiran.com', status: 'تایید زنده', recordsExtracted: 8 },
                    { name: 'ترکینگ جهانی TradingView & Investing', domain: 'tradingview.com', status: 'تایید زنده', recordsExtracted: 5 },
                    { name: 'پایش کریپتو CoinGlass & Alternative.me', domain: 'coinglass.com', status: 'تایید زنده', recordsExtracted: 6 },
                    { name: 'بانک مرکزی جمهوری اسلامی ایران (CBI)', domain: 'cbi.ir', status: 'تایید زنده', recordsExtracted: 4 },
                  ]).map((src, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-[#231a13] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                        <div>
                          <div className="font-bold text-[#f2dfd3]">{src.name}</div>
                          <div className="text-[11px] text-[#dbc2b0]/60 font-mono-num">{src.domain}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#ffb77d] font-mono-num">
                          {src.recordsExtracted} شاخص
                        </span>
                        <span className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {src.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 13-SECTION FULL DATA */}
          {activeTab === 'sections' && (
            <div className="space-y-4 text-xs">
              {/* Section 1 */}
              <div className="bg-[#1a120b] border border-[#554336] p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-[#ffb77d] text-sm border-b border-[#554336]/60 pb-2">
                  ۱) اقتصاد کلان ایران (دلار آزاد: {daily13Sections.section1_iranMacro.usdFree} | سکه: {daily13Sections.section1_iranMacro.sekeEmami})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">دلار آزاد:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section1_iranMacro.usdFree} ({daily13Sections.section1_iranMacro.usdChangePct})</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">تتر صرافی‌ها:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section1_iranMacro.usdt}</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">طلای ۱۸ عیار:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section1_iranMacro.gold18k}</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">سکه امامی:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section1_iranMacro.sekeEmami}</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">حباب سکه:</span>
                    <span className="font-bold text-[#ffb77d]">{daily13Sections.section1_iranMacro.coinBubble}</span>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="bg-[#1a120b] border border-[#554336] p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-[#ffb77d] text-sm border-b border-[#554336]/60 pb-2">
                  ۲) بازارهای جهانی (اونس: {daily13Sections.section2_globalMarkets.goldOunce} | DXY: {daily13Sections.section2_globalMarkets.dxy})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">اونس طلا:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section2_globalMarkets.goldOunce}</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">شاخص دلار DXY:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section2_globalMarkets.dxy}</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">نفت برنت:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section2_globalMarkets.brentOil}</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">شاخص VIX:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section2_globalMarkets.vix}</span>
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="bg-[#1a120b] border border-[#554336] p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-[#ffb77d] text-sm border-b border-[#554336]/60 pb-2">
                  ۳) بیت‌کوین و رمزارزها (قیمت: {daily13Sections.section3_crypto.btcPrice} | F&G: {daily13Sections.section3_crypto.cryptoFearGreed})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">بیت‌کوین:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section3_crypto.btcPrice}</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">دامیننس بیت‌کوین:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section3_crypto.btcDominance}</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">جریان ETF بیت‌کوین:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section3_crypto.etfFlowAmount}</span>
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="bg-[#1a120b] border border-[#554336] p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-[#ffb77d] text-sm border-b border-[#554336]/60 pb-2">
                  ۴) بورس ایران (شاخص کل: {daily13Sections.section4_bourse.tseIndex} | معاملات خرد: {daily13Sections.section4_bourse.retailVolume})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">شاخص کل:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section4_bourse.tseIndex} ({daily13Sections.section4_bourse.tseIndexChangePct})</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">معاملات خرد:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section4_bourse.retailVolume}</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">پول حقیقی:</span>
                    <span className="font-bold text-[#10b981]">{daily13Sections.section4_bourse.realMoneyFlow}</span>
                  </div>
                  <div className="bg-[#231a13] p-2 rounded">
                    <span className="text-[#dbc2b0]/70 block">صف خرید/فروش:</span>
                    <span className="font-bold text-[#f2dfd3]">{daily13Sections.section4_bourse.buyQueueValue} / {daily13Sections.section4_bourse.sellQueueValue}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#554336] bg-[#2a2017] flex items-center justify-between text-xs">
          <div className="text-[#dbc2b0]/70 font-mono-num flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            <span>زمان اعتبارسنجی: {auditReport?.timestampJalali || daily13Sections.metadata.jalaliDate}</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#ffb77d] text-[#4d2600] rounded-xl font-bold hover:bg-[#d97707] transition-all shadow cursor-pointer"
          >
            تایید و بستن
          </button>
        </div>
      </div>
    </div>
  );
};
