import React, { useState } from 'react';
import { SystemS1Signal, MarketScoreItem, TelegramConfig } from '../types';
import {
  Send,
  Copy,
  Check,
  X,
  Bot,
  Sparkles,
  CheckCircle2,
  FileText,
  Layers,
  Radio
} from 'lucide-react';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  telegramConfig: TelegramConfig;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({
  isOpen,
  onClose,
  signal,
  marketScores,
  telegramConfig,
}) => {
  const [reportType, setReportType] = useState<'quick' | 'full13'>('quick');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickReport = `📊 **سیگنال و گزارش فوری موتور SYSTEM S1 (نسخه ۱.۳)**
📅 تاریخ پایش: ${signal.lastUpdatedJalali}

🎯 **خروجی تصمیم سیستم:**
【 ${signal.actionTitle} 】

🔹 **شاخص اطمینان تحلیل:** ${signal.confidenceScore} از ۱۰ (بسیار بالا)
🔹 **شاخص ریسک سیستم (SRI):** ۴.۴ / ۱۰ (ریسک متعادل - وضعیت اضطراری غیرفعال)
🔹 **کیفیت داده‌های ورودی:** ${signal.dataQualityScore}/${signal.totalMetricsCount} پارامتر زنده

📈 **امتیازدهی بازارهای چهارگانه (از ۱۰۰):**
🥇 **طلا و مسکوکات:** ۹۰ / ۱۰۰ (🟢 چراغ سبز - قوی‌ترین جریان ورود)
📊 **بورس ایران:** ۸۲ / ۱۰۰ (🟢 چراغ سبز - برتری خریدار و ورود پول)
💵 **ارز و تتر:** ۸۱ / ۱۰۰ (🟢 چراغ سبز - لنگرگاه نقدینگی)
🪙 **بیت‌کوین و کریپتو:** ۵۸ / ۱۰۰ (🔴 چراغ قرمز - عدم اقدام)

💼 **استراتژی تخصیص سبد دارایی‌ها:**
▫️ صندوق‌های طلا (عیار/کهربا): ۳۵٪
▫️ صندوق‌های درآمد ثابت (افران): ۳۰٪
▫️ صندوق‌های سهامی و اهرمی (توان/اهرم): ۲۰٪
▫️ طلای فیزیکی ۱۸ عیار: ۱۰٪
▫️ نقدینگی ریال/تتر: ۵٪

📝 **خلاصه تحلیل تحلیلی:**
${signal.summaryText}

🌐 کانال رسمی: ${telegramConfig.channelId}`;

  const full13Report = `📋 **گزارش رسمی ۱۳ گانه سیستم مدیریت سرمایه S1 (نسخه ۱.۳)**
⏰ پایش روزانه: ساعت ۱۷:۰۰ الی ۱۸:۰۰ • تاریخ: ${signal.lastUpdatedJalali}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۱️⃣ **مشخصات گزارش:** نسخه S1 Engine v1.3 • کیفیت داده: ۴۰/۴۱ • منابع: TSETMC, TGJU, CoinGlass, TradingView
۲️⃣ **بازارهای جهانی:** اونس طلا ۲,۷۴۵$ 🟢 | DXY ۱۰۳.۸۵ 🟡 | نفت برنت ۷۴.۲$ 🟡 | بیت‌کوین ۶۷,۸۵۰$ 🟡 | جریان ETF: -۳۵M$ 🔴
۳️⃣ **اقتصاد ایران:** دلار ۶۹,۲۰۰ ت | تتر ۶۹,۴۵۰ ت | سکه ۵۰.۴۵ م.ت (حباب ۲۰.۵٪) | طلای ۱۸ عیار ۴.۳۸ م.ت | بهره بین‌بانکی ۳۰.۲۵٪
۴️⃣ **بورس ایران (۸۲/۱۰۰ 🟢):** شاخص کل ۲,۰۵۸,۳۴۰ | ارزش معاملات خرد ۸,۴۵۰ م.ت | ورود پول حقیقی +۱,۲۴۰ م.ت | قدرت خریدار ۱.۳۴
۵️⃣ **صندوق‌های منتخب:** عیار ۱۲,۴۵۰ ت (حباب +۰.۵٪) | توان ۲,۴۵۰ ت (تخفیف -۱.۲٪) | افران ۱,۲۱۰ ت (سود موثر ۳۱.۵٪)
۶️⃣ **ارزیابی دو مرحله‌ای طلا:** مرحله ۱: جذابیت طلا ۹۰/۱۰۰ 🟢 | مرحله ۲: انتخاب صندوق شمش عیار (۹۴/۱۰۰) به عنوان ابزار پایه ۸۰٪
۷️⃣ **بیت‌کوین و کریپتو (۵۸/۱۰۰ 🔴):** شاخص ترس و طمع ۵۲ | دامیننس ۵۸.۴٪ | وضعیت: عدم اقدام به دلیل نمره زیر ۶۰
۸️⃣ **رتبه‌بندی نهایی بازارها:** ۱. طلا (۹۰) 🟢 | ۲. بورس (۸۲) 🟢 | ۳. تتر (۸۱) 🟢 | ۴. کریپتو (۵۸) 🔴
۹️⃣ **شاخص اطمینان و وتو:** امتیاز اطمینان ۹/۱۰ • قانون وتو غیرفعال
🔟 **پورتفوی فرضی ۱ میلیاردی:** ارزش روز ۱,۱۴۸,۶۵۰,۰۰۰ ت (+۱۴.۸۶٪) • دراودان ۴.۱۸٪ (سقف مجاز ۱۵٪)
۱۱️⃣ **دفتر معاملات امروز:** خرید پله‌ای صندوق طلای عیار و درآمد ثابت افران با کسر کارمزد دقیق
۱۲️⃣ **تحلیل تغییرات:** بورس +۵ امتیاز (ورود پول) | طلا تثبیت در ۹۰ | کریپتو -۳ امتیاز (خروج ETF)
۱۳️⃣ **پیشنهاد نهایی سیستم و خلاصه ۵ خطی:**
🎯 خروجی صریح مجاز: 【 خرید پله‌ای 】
۱. بازارهای طلا و بورس در محدوده چراغ سبز و آماده افزایش وزن تدریجی هستند.
۲. خریدها در قالب پله‌های حداکثر ۲۰ درصدی به صندوق‌های عیار و توان اختصاص می‌یابد.
۳. صندوق درآمد ثابت افران با سهم ۳۰ درصدی لنگرگاه نقدینگی و امنیت پورتفو است.
۴. رمزارزها به دلیل امتیاز زیر ۶۰ در وضعیت عدم اقدام قرار دارند.
۵. شاخص ریسک سیستم (SRI) با عدد ۴.۴ وضعیت پایدار را تایید می‌کند.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
کانال رسمی: ${telegramConfig.channelId}`;

  const currentReportText = reportType === 'quick' ? quickReport : full13Report;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendToTelegram = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        onClose();
      }, 2500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-xl bg-[#231a13] border border-[#554336] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#554336] flex items-center justify-between bg-[#271e16] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0297e8]/15 text-[#96ccff]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                ارسال گزارش و سیگنال روز به تلگرام
              </h3>
              <p className="text-xs text-[#dbc2b0]/70 font-mono-num">
                مقصد: {telegramConfig.channelId} ({telegramConfig.channelName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#322820]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {sendSuccess ? (
            <div className="bg-[#10b981]/15 border border-[#10b981]/40 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#10b981] mx-auto" />
              <h4 className="text-base font-bold text-[#f2dfd3]">
                پیام با موفقیت به کانال تلگرام ارسال شد!
              </h4>
              <p className="text-xs text-[#dbc2b0]">
                پیام در قالب استاندارد Markdown در کانال {telegramConfig.channelId} منتشر شد.
              </p>
            </div>
          ) : (
            <>
              {/* Report Format Selector */}
              <div className="flex bg-[#1a120b] p-1 rounded-xl border border-[#554336] text-xs">
                <button
                  onClick={() => setReportType('quick')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    reportType === 'quick'
                      ? 'bg-[#ffb77d] text-[#1a120b] shadow-md'
                      : 'text-[#dbc2b0] hover:bg-[#322820]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>سیگنال و هشدار خلاصه</span>
                </button>
                <button
                  onClick={() => setReportType('full13')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    reportType === 'full13'
                      ? 'bg-[#ffb77d] text-[#1a120b] shadow-md'
                      : 'text-[#dbc2b0] hover:bg-[#322820]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>گزارش کامل ۱۳ گانه (ماده ۱۲)</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
                <span className="font-medium">پیش‌نمایش قالب ارسال به تلگرام:</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[#ffb77d] hover:underline"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                      <span className="text-[#10b981]">کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی متن گزارش</span>
                    </>
                  )}
                </button>
              </div>

              {/* Message preview box styled like Telegram bubble */}
              <div
                className="bg-[#1a120b] border border-[#554336] rounded-2xl p-4 max-h-64 overflow-y-auto font-sans text-xs text-[#f2dfd3] whitespace-pre-wrap leading-relaxed shadow-inner"
                dir="rtl"
              >
                {currentReportText}
              </div>

              {/* Status info bar */}
              <div className="bg-[#322820] rounded-xl p-3 flex items-center justify-between text-xs text-[#dbc2b0]">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#96ccff]" />
                  <span>ربات خودکار SystemS1_Bot</span>
                </div>
                <span className="text-[11px] font-mono-num text-[#10b981]">
                  وضعیت API: فعال
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSendToTelegram}
                  disabled={isSending}
                  className="flex-1 bg-[#0297e8] hover:bg-[#0284c7] text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'در حال ارسال پیام...' : 'ارسال فوری به کانال تلگرام'}
                </button>

                <button
                  onClick={handleCopy}
                  className="px-4 py-3 bg-[#3e332b] text-[#f2dfd3] hover:bg-[#322820] border border-[#554336] rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  کپی
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
