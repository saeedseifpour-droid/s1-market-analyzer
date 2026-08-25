import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  X,
  Send,
  Printer,
  Table,
  Search,
  Layers,
  Sparkles,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import {
  SystemS1Signal,
  MarketScoreItem,
  InputMetric,
  PortfolioAssetItem,
  PortfolioTradeItem,
  SRIModel,
  AiDailySummary,
  StandardDailyInput13Sections,
  ValidationAuditReport,
} from '../types';
import {
  formatFull13Report,
  formatDailyInputsSheetReport,
  formatStandardDailyInputTemplate
} from '../telegram_reporter';
import { checkDataFreshness } from '../utils/s1DataEngine';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  inputs: InputMetric[];
  assets: PortfolioAssetItem[];
  trades: PortfolioTradeItem[];
  sri?: SRIModel;
  aiSummary?: AiDailySummary;
  onOpenTelegram: () => void;
  daily13Sections?: StandardDailyInput13Sections;
  auditReport?: ValidationAuditReport | null;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  signal,
  marketScores,
  inputs,
  assets,
  trades,
  sri,
  aiSummary,
  onOpenTelegram,
  daily13Sections,
  auditReport,
}) => {
  const [activeTab, setActiveTab] = useState<'dailyInput' | 'report13' | 'inputsSheet'>('dailyInput');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const payload = {
    signal,
    marketScores,
    inputs,
    assets,
    trades,
    daily13Sections,
    auditReport,
  };

  const dailyInputMarkdown = formatStandardDailyInputTemplate(payload);
  const full13Markdown = formatFull13Report(payload);
  const inputsSheetMarkdown = formatDailyInputsSheetReport(payload);

  const getCurrentMarkdown = () => {
    switch (activeTab) {
      case 'dailyInput':
        return dailyInputMarkdown;
      case 'report13':
        return full13Markdown;
      case 'inputsSheet':
        return inputsSheetMarkdown;
      default:
        return dailyInputMarkdown;
    }
  };

  const currentMarkdown = getCurrentMarkdown();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInputs = inputs.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.source && item.source.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#231a13] border border-[#554336] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#554336] flex items-center justify-between bg-[#271e16] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#f2dfd3]">
                  فرم دیلی اینپوت و گزارش رسمی پایش S1
                </h3>
                <span className="px-2.5 py-0.5 rounded-md bg-[#10b981]/20 text-[#10b981] text-xs font-mono font-bold">
                  S1 VERSION 1.3
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
              className="p-2 rounded-xl text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#322820] border border-[#554336]/60 hidden sm:flex items-center gap-1.5 text-xs cursor-pointer"
              title="چاپ یا ذخیره PDF"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ</span>
            </button>
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl text-[#ffb77d] hover:bg-[#322820] border border-[#ffb77d]/30 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="کپی متن کامل"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#10b981]" />
                  <span className="text-[#10b981]">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی متن</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#322820] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-5 py-3 bg-[#1e150f] border-b border-[#554336] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('dailyInput')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'dailyInput'
                  ? 'bg-[#ffb77d] text-[#1a120b] shadow-md'
                  : 'bg-[#271e16] text-[#dbc2b0] hover:bg-[#322820]'
              }`}
            >
              <Layers className="w-4 h-4" />
              ۱. فرم دیلی اینپوت استاندارد (۱۳ بخش کامل)
            </button>

            <button
              onClick={() => setActiveTab('report13')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'report13'
                  ? 'bg-[#ffb77d] text-[#1a120b] shadow-md'
                  : 'bg-[#271e16] text-[#dbc2b0] hover:bg-[#322820]'
              }`}
            >
              <FileText className="w-4 h-4" />
              ۲. گزارش تصمیم، امتیازدهی و تخصیص پورتفوی
            </button>

            <button
              onClick={() => setActiveTab('inputsSheet')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'inputsSheet'
                  ? 'bg-[#ffb77d] text-[#1a120b] shadow-md'
                  : 'bg-[#271e16] text-[#dbc2b0] hover:bg-[#322820]'
              }`}
            >
              <Table className="w-4 h-4" />
              جدول مرجع شاخص‌ها ({inputs.length})
            </button>
          </div>

          <button
            onClick={onOpenTelegram}
            className="px-4 py-2 bg-[#0297e8] hover:bg-[#0284c7] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Send className="w-4 h-4" />
            ارسال ۲ مرحله‌ای به تلگرام
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {(() => {
            const freshness = checkDataFreshness(daily13Sections?.metadata?.jalaliDate || signal.lastUpdatedJalali);
            if (freshness.isStale) {
              return (
                <div className="bg-[#ef4444]/15 border border-[#ef4444]/50 rounded-xl p-3.5 flex items-start gap-3 text-xs">
                  <AlertOctagon className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#ffb4ab]">
                      ⚠️ هشدار انقضای داده‌های گزارش: اطلاعات این پیش‌نمایش متعلق به {freshness.dataDateJalali} است.
                    </span>
                    <p className="text-[#dbc2b0]/90 text-[11px] leading-relaxed">
                      طبق منشور S1، تصمیم‌گیری و اتکا به داده‌های قدیمی فاقد اعتبار است. پیش از اقدام یا ارسال، لطفاً ورودی‌های امروز ({freshness.todayVerbose}) را به‌روزرسانی نمایید.
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-[#10b981]">
                <span className="font-semibold">
                  ✅ داده‌های گزارش مربوط به پایش امروز ({freshness.todayVerbose}) و کاملاً معتبر است.
                </span>
                <span className="font-mono-num text-[11px] text-[#dbc2b0]/70">
                  تاریخ: {freshness.todayJalali}
                </span>
              </div>
            );
          })()}
          {activeTab === 'dailyInput' ? (
            <div className="bg-[#18110a] border border-[#554336] rounded-xl p-5 font-mono text-xs sm:text-sm text-[#f2dfd3] whitespace-pre-wrap leading-relaxed select-text shadow-inner">
              {dailyInputMarkdown}
            </div>
          ) : activeTab === 'report13' ? (
            <div className="bg-[#18110a] border border-[#554336] rounded-xl p-5 font-mono text-xs sm:text-sm text-[#f2dfd3] whitespace-pre-wrap leading-relaxed select-text shadow-inner">
              {full13Markdown}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search bar inside sheet */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-[#dbc2b0]/60 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در شاخص‌ها، کدها یا منابع..."
                    className="w-full bg-[#18110a] border border-[#554336] rounded-xl pr-9 pl-4 py-2 text-xs text-[#f2dfd3] outline-none focus:border-[#ffb77d]"
                  />
                </div>
                <span className="text-xs text-[#dbc2b0] font-mono-num">
                  نمایش {filteredInputs.length} از {inputs.length} ورودی
                </span>
              </div>

              {/* Formatted Inputs Table */}
              <div className="bg-[#18110a] border border-[#554336] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#271e16] text-[#dbc2b0] border-b border-[#554336] font-semibold">
                      <tr>
                        <th className="p-3 pr-4">کد</th>
                        <th className="p-3">عنوان پارامتر</th>
                        <th className="p-3">دسته‌بندی</th>
                        <th className="p-3">مقدار ثبت‌شده</th>
                        <th className="p-3">واحد</th>
                        <th className="p-3">منبع رسمی استخراج</th>
                        <th className="p-3">مرجع / پنجره زمانی</th>
                        <th className="p-3">وضعیت</th>
                        <th className="p-3 pl-4">امتیاز</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#554336]/30 text-[#f2dfd3]">
                      {filteredInputs.map((item) => (
                        <tr key={item.id} className="hover:bg-[#271e16]/60 transition-colors">
                          <td className="p-3 pr-4 font-mono-num text-[#96ccff] font-bold">
                            {item.code}
                          </td>
                          <td className="p-3 font-semibold">{item.title}</td>
                          <td className="p-3 text-[#dbc2b0]">{item.categoryLabel}</td>
                          <td className="p-3 font-mono-num font-bold text-[#ffb77d]">
                            {item.value}
                          </td>
                          <td className="p-3 text-[#dbc2b0]/70">{item.unit}</td>
                          <td className="p-3 font-medium text-[#f2dfd3]">
                            {item.source || 'TSETMC / TGJU'}
                          </td>
                          <td className="p-3 text-[11px] text-[#dbc2b0]/80 font-mono-num">
                            {item.sourceReference || item.timeWindow || '-'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'bullish'
                                  ? 'bg-[#10b981]/20 text-[#10b981]'
                                  : item.status === 'bearish'
                                  ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                                  : 'bg-[#c2c7d0]/20 text-[#c2c7d0]'
                              }`}
                            >
                              {item.status === 'bullish' ? 'صعودی' : item.status === 'bearish' ? 'نزولی' : 'خنثی'}
                            </span>
                          </td>
                          <td className="p-3 pl-4 font-mono-num font-bold text-[#ffb77d]">
                            {item.scoreContribution} / ۱۰
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#271e16] border-t border-[#554336] flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#dbc2b0]/80">
            موتور تصمیم‌گیری هوشمند مدیریت سرمایه S1 • تمامی داده‌ها مستقیماً بر اساس ورودی‌های فعال و مراجع رسمی محاسبه شده‌اند.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#3e332b] text-[#f2dfd3] rounded-xl text-xs font-semibold hover:bg-[#322820] cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
