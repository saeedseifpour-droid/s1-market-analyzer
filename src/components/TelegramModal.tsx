import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Settings,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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
  const [sendError, setSendError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  const [botToken, setBotToken] = useState<string>(() => {
    return localStorage.getItem('S1_TELEGRAM_BOT_TOKEN') || telegramConfig.botToken || '';
  });
  const [chatId, setChatId] = useState<string>(() => {
    return localStorage.getItem('S1_TELEGRAM_CHAT_ID') || telegramConfig.channelId || '';
  });

  useEffect(() => {
    if (isOpen) {
      setSendSuccess(false);
      setSendError(null);
      const savedToken = localStorage.getItem('S1_TELEGRAM_BOT_TOKEN');
      const savedChat = localStorage.getItem('S1_TELEGRAM_CHAT_ID');
      if (savedToken) setBotToken(savedToken);
      if (savedChat) setChatId(savedChat);
    }
  }, [isOpen]);

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

🌐 کانال رسمی: ${chatId || telegramConfig.channelId}`;

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
کانال رسمی: ${chatId || telegramConfig.channelId}`;

  const currentReportText = reportType === 'quick' ? quickReport : full13Report;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveCredentials = () => {
    localStorage.setItem('S1_TELEGRAM_BOT_TOKEN', botToken.trim());
    localStorage.setItem('S1_TELEGRAM_CHAT_ID', chatId.trim());
    setShowConfig(false);
  };

  const handleSendToTelegram = async () => {
    const activeToken = botToken.trim();
    const activeChatId = chatId.trim();

    if (!activeToken || !activeChatId) {
      setSendError('لطفاً توکن ربات و شناسه چت/کانال را در بخش تنظیمات وارد کنید.');
      setShowConfig(true);
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      // Normalize token if user entered with "bot" prefix
      const cleanToken = activeToken.startsWith('bot') ? activeToken.slice(3) : activeToken;
      const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: activeChatId,
          text: currentReportText,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setSendSuccess(true);
        localStorage.setItem('S1_TELEGRAM_BOT_TOKEN', activeToken);
        localStorage.setItem('S1_TELEGRAM_CHAT_ID', activeChatId);
      } else {
        const errorDesc = data.description || 'خطا در برقراری ارتباط با سرور تلگرام';
        setSendError(`پاسخ تلگرام: ${errorDesc}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطای ناشناخته در اتصال به اینترنت';
      setSendError(`خطا در ارسال شبکه: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
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
                ارسال گزارش زنده به تلگرام
              </h3>
              <p className="text-xs text-[#dbc2b0]/70 font-mono-num">
                مقصد: {chatId || telegramConfig.channelId}
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
                پیام با موفقیت به تلگرام ارسال شد!
              </h4>
              <p className="text-xs text-[#dbc2b0]">
                گزارش سیستم S1 در مقصد {chatId || telegramConfig.channelId} منتشر شد.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => setSendSuccess(false)}
                  className="px-4 py-2 bg-[#3e332b] text-[#f2dfd3] rounded-xl text-xs font-semibold hover:bg-[#322820]"
                >
                  ارسال مجدد یا تغییر متن
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#10b981] text-white rounded-xl text-xs font-bold hover:bg-[#059669]"
                >
                  بستن پنجره
                </button>
              </div>
            </div>
          ) : (
            <>
              {sendError && (
                <div className="bg-[#ef4444]/15 border border-[#ef4444]/40 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#fca5a5]">
                  <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">{sendError}</p>
                    <p className="text-[11px] text-[#dbc2b0]">
                      راهنما: اطمینان حاصل کنید ربات عضو کانال بوده و دسترسی ارسال پیام (Admin) دارد، یا در چت خصوصی دکمه /start را زده‌اید.
                    </p>
                  </div>
                </div>
              )}

              {/* Bot Config Accordion */}
              <div className="border border-[#554336] rounded-xl overflow-hidden bg-[#1f1711]">
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="w-full p-3 flex items-center justify-between text-xs text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#2a1f17] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#ffb77d]" />
                    <span className="font-semibold">تنظیمات توکن و کانال تلگرام (API Key)</span>
                  </div>
                  {showConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showConfig && (
                  <div className="p-3.5 border-t border-[#554336] space-y-3 bg-[#18110a] text-xs">
                    <div>
                      <label className="block text-[11px] text-[#dbc2b0] mb-1 font-medium">
                        Telegram Bot Token (از BotFather):
                      </label>
                      <input
                        type="text"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        placeholder="7492819482:AAH-..."
                        className="w-full bg-[#271e16] border border-[#554336] rounded-lg px-3 py-2 text-xs text-[#f2dfd3] font-mono focus:outline-none focus:border-[#ffb77d]"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#dbc2b0] mb-1 font-medium">
                        Chat ID یا شناسه کانال (مثلاً @MyChannel یا عددی):
                      </label>
                      <input
                        type="text"
                        value={chatId}
                        onChange={(e) => setChatId(e.target.value)}
                        placeholder="@SystemS1_Signals یا -100123456789"
                        className="w-full bg-[#271e16] border border-[#554336] rounded-lg px-3 py-2 text-xs text-[#f2dfd3] font-mono focus:outline-none focus:border-[#ffb77d]"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveCredentials}
                        className="px-3 py-1.5 bg-[#ffb77d] text-[#1a120b] rounded-lg font-bold text-xs hover:bg-[#d97707]"
                      >
                        ذخیره تنظیمات
                      </button>
                    </div>
                  </div>
                )}
              </div>

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

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSendToTelegram}
                  disabled={isSending}
                  className="flex-1 bg-[#0297e8] hover:bg-[#0284c7] text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'در حال ارسال به تلگرام...' : 'ارسال زنده به تلگرام (Live Send)'}
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
