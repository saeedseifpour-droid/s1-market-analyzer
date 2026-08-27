import React, { useState, useEffect } from 'react';
import {
  SystemS1Signal,
  MarketScoreItem,
  InputMetric,
  PortfolioAssetItem,
  PortfolioTradeItem,
  TelegramConfig,
  StandardDailyInput13Sections,
  ValidationAuditReport,
} from '../types';
import {
  Send,
  Copy,
  Check,
  X,
  Sparkles,
  CheckCircle2,
  FileText,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  Table,
  Zap,
  Layers,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';
import {
  formatFull13Report,
  formatStandardDailyInputTemplate,
  formatQuickSignalReport,
  sendTelegramMessage,
  sendDualTelegramPipeline,
  generateGeminiExecutiveAnalysis,
} from '../telegram_reporter';
import { checkDataFreshness } from '../utils/s1DataEngine';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  inputs: InputMetric[];
  assets: PortfolioAssetItem[];
  trades: PortfolioTradeItem[];
  telegramConfig: TelegramConfig;
  daily13Sections?: StandardDailyInput13Sections;
  auditReport?: ValidationAuditReport | null;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({
  isOpen,
  onClose,
  signal,
  marketScores,
  inputs,
  assets,
  trades,
  telegramConfig,
  daily13Sections,
  auditReport,
}) => {
  const [reportType, setReportType] = useState<'dual' | 'dailyInput' | 'full13' | 'quick'>('dual');
  const [dualActivePreview, setDualActivePreview] = useState<'msg1' | 'msg2'>('msg1');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendingStep, setSendingStep] = useState<number>(0);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [aiAnalysisText, setAiAnalysisText] = useState<string | undefined>(undefined);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

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
      setSendingStep(0);
      const savedToken = localStorage.getItem('S1_TELEGRAM_BOT_TOKEN');
      const savedChat = localStorage.getItem('S1_TELEGRAM_CHAT_ID');
      if (savedToken) setBotToken(savedToken);
      if (savedChat) setChatId(savedChat);
      if (!savedToken && !telegramConfig.botToken) {
        setShowConfig(true);
      }
    }
  }, [isOpen, telegramConfig.botToken]);

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

  const dailyInputText = formatStandardDailyInputTemplate(payload);
  const decisionReportText = formatFull13Report(payload, aiAnalysisText);
  const quickSignalText = formatQuickSignalReport(payload);

  const getActiveReportText = () => {
    switch (reportType) {
      case 'dual':
        return dualActivePreview === 'msg1'
          ? dailyInputText
          : decisionReportText;
      case 'dailyInput':
        return dailyInputText;
      case 'full13':
        return decisionReportText;
      case 'quick':
        return quickSignalText;
      default:
        return dailyInputText;
    }
  };

  const currentReportText = getActiveReportText();

  const handleCopy = () => {
    if (reportType === 'dual') {
      const fullDualText = `--- پیام اول: فرم دیلی اینپوت ---\n${dailyInputText}\n\n--- پیام دوم: گزارش تصمیم و امتیازدهی S1 ---\n${decisionReportText}`;
      navigator.clipboard.writeText(fullDualText);
    } else {
      navigator.clipboard.writeText(currentReportText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveCredentials = () => {
    localStorage.setItem('S1_TELEGRAM_BOT_TOKEN', botToken.trim());
    localStorage.setItem('S1_TELEGRAM_CHAT_ID', chatId.trim());
    setShowConfig(false);
  };

  const handleGenerateAiAnalysis = async () => {
    setIsGeneratingAi(true);
    try {
      const text = await generateGeminiExecutiveAnalysis(payload);
      setAiAnalysisText(text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendToTelegram = async () => {
    const activeToken = botToken.trim();
    const activeChatId = chatId.trim();

    if (!activeToken || !activeChatId) {
      setSendError('لطفاً توکن ربات و شناسه کانال/چت را در بخش تنظیمات وارد کنید.');
      setShowConfig(true);
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      const cleanToken = activeToken.startsWith('bot') ? activeToken.slice(3) : activeToken;

      if (reportType === 'dual') {
        setSendingStep(1);
        const res = await sendDualTelegramPipeline(
          payload,
          cleanToken,
          activeChatId,
          aiAnalysisText,
          (step, status, err) => {
            if (status === 'sending') setSendingStep(step);
            if (status === 'failed') setSendError(err || 'خطا در ارسال');
          }
        );

        if (res.success) {
          setSendSuccess(true);
          localStorage.setItem('S1_TELEGRAM_BOT_TOKEN', activeToken);
          localStorage.setItem('S1_TELEGRAM_CHAT_ID', activeChatId);
        } else {
          setSendError(res.error || 'خطا در ارسال ۲ مرحله‌ای به تلگرام');
        }
      } else {
        setSendingStep(1);
        const res = await sendTelegramMessage(currentReportText, cleanToken, activeChatId);
        if (res.success) {
          setSendSuccess(true);
          localStorage.setItem('S1_TELEGRAM_BOT_TOKEN', activeToken);
          localStorage.setItem('S1_TELEGRAM_CHAT_ID', activeChatId);
        } else {
          setSendError(`پاسخ تلگرام: ${res.error || 'خطا در برقراری ارتباط'}`);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطای ناشناخته در ارسال';
      setSendError(`خطا در ارسال شبکه: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#231a13] border border-[#554336] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#554336] flex items-center justify-between bg-[#271e16] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0297e8]/15 text-[#96ccff]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                ارسال خودکار دیلی اینپوت و گزارش تصمیم‌گیری به تلگرام
              </h3>
              <p className="text-xs text-[#dbc2b0]/70 font-mono-num">
                کانال مقصد: {chatId || telegramConfig.channelId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#322820] cursor-pointer"
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
                گزارش با موفقیت به تلگرام ارسال شد!
              </h4>
              <p className="text-xs text-[#dbc2b0]">
                {reportType === 'dual'
                  ? `هر دو پیام (۱. برگه کامل دیلی اینپوت و ۲. گزارش رسمی تصمیم‌گیری و امتیازدهی S1) به ترتیب در مقصد ${chatId || telegramConfig.channelId} منتشر شدند.`
                  : `پیام در کانال مقصد ${chatId || telegramConfig.channelId} منتشر شد.`}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => setSendSuccess(false)}
                  className="px-4 py-2 bg-[#3e332b] text-[#f2dfd3] rounded-xl text-xs font-semibold hover:bg-[#322820] cursor-pointer"
                >
                  ارسال مجدد یا ویرایش
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#10b981] text-white rounded-xl text-xs font-bold hover:bg-[#059669] cursor-pointer"
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

              {/* Report Format Selection Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-[#18110a] rounded-xl border border-[#554336]">
                <button
                  onClick={() => setReportType('dual')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reportType === 'dual'
                      ? 'bg-[#ffb77d] text-[#1a120b] shadow-md font-extrabold'
                      : 'text-[#dbc2b0] hover:text-[#f2dfd3]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>ارسال ۲ مرحله‌ای</span>
                </button>

                <button
                  onClick={() => setReportType('dailyInput')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reportType === 'dailyInput'
                      ? 'bg-[#ffb77d] text-[#1a120b] shadow-md'
                      : 'text-[#dbc2b0] hover:text-[#f2dfd3]'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>۱. دیلی اینپوت</span>
                </button>

                <button
                  onClick={() => setReportType('full13')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reportType === 'full13'
                      ? 'bg-[#ffb77d] text-[#1a120b] shadow-md'
                      : 'text-[#dbc2b0] hover:text-[#f2dfd3]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>۲. گزارش تصمیم S1</span>
                </button>

                <button
                  onClick={() => setReportType('quick')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reportType === 'quick'
                      ? 'bg-[#ffb77d] text-[#1a120b] shadow-md'
                      : 'text-[#dbc2b0] hover:text-[#f2dfd3]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>سیگنال فوری</span>
                </button>
              </div>

              {/* Bot Config Accordion */}
              <div className="border border-[#554336] rounded-xl overflow-hidden bg-[#1f1711]">
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="w-full p-3 flex items-center justify-between text-xs text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#2a1f17] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#ffb77d]" />
                    <span className="font-semibold">تنظیمات توکن و کانال تلگرام (API Key)</span>
                    {!botToken && (
                      <span className="text-[10px] bg-[#f59e0b]/20 text-[#ffb77d] border border-[#f59e0b]/40 px-2 py-0.5 rounded-full font-medium">
                        نیاز به تنظیم
                      </span>
                    )}
                  </div>
                  {showConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showConfig && (
                  <div className="p-3.5 border-t border-[#554336] space-y-3 bg-[#18110a]">
                    <div className="p-2.5 rounded-lg bg-[#271e16] border border-[#554336]/60 text-[11px] text-[#dbc2b0] leading-relaxed">
                      💡 <strong className="text-[#f2dfd3]">راهنمای اتصال تلگرام:</strong>
                      <ol className="list-decimal list-inside space-y-1 mt-1 text-[#dbc2b0]/80">
                        <li>به ربات <span className="font-mono text-[#96ccff]">@BotFather</span> در تلگرام بروید و با دستور <code className="text-[#ffb77d]">/newbot</code> ربات جدید بسازید.</li>
                        <li>توکن API صادرشده (مانند <code className="font-mono text-[#ffb77d]">7123456789:AAH...</code>) را در کادر زیر وارد کنید.</li>
                        <li>ربات ساخته‌شده را به کانال یا گروه خود افزوده و دسترسی <strong>مدیر (Administrator)</strong> برای ارسال پیام بدهید.</li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#dbc2b0] mb-1">
                        توکن اختصاصی ربات تلگرام (Bot Token):
                      </label>
                      <input
                        type="password"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        placeholder="7123456789:AAH..."
                        className="w-full bg-[#271e16] border border-[#554336] rounded-lg px-3 py-2 text-xs text-[#f2dfd3] font-mono focus:outline-none focus:border-[#ffb77d]"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#dbc2b0] mb-1">
                        شناسه کانال یا چت تلگرام (Channel ID / Chat ID):
                      </label>
                      <input
                        type="text"
                        value={chatId}
                        onChange={(e) => setChatId(e.target.value)}
                        placeholder="-1001234567890 یا @mychannel"
                        className="w-full bg-[#271e16] border border-[#554336] rounded-lg px-3 py-2 text-xs text-[#f2dfd3] font-mono focus:outline-none focus:border-[#ffb77d]"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveCredentials}
                        className="px-3.5 py-1.5 bg-[#ffb77d] text-[#1a120b] rounded-lg text-xs font-bold hover:bg-[#ffa75e] cursor-pointer"
                      >
                        ذخیره تنظیمات
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dual Sending Step Banner */}
              {reportType === 'dual' && (
                <div className="bg-[#1f1711] border border-[#ffb77d]/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ffb77d] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      فرآیند ارسال دو مرحله‌ای خودکار:
                    </span>
                    <div className="flex gap-1 bg-[#18110a] p-0.5 rounded-lg border border-[#554336]">
                      <button
                        onClick={() => setDualActivePreview('msg1')}
                        className={`px-2 py-1 text-[11px] font-bold rounded cursor-pointer ${
                          dualActivePreview === 'msg1'
                            ? 'bg-[#ffb77d] text-[#1a120b]'
                            : 'text-[#dbc2b0]'
                        }`}
                      >
                        پیش‌نمایش ۱ (دیلی اینپوت)
                      </button>
                      <button
                        onClick={() => setDualActivePreview('msg2')}
                        className={`px-2 py-1 text-[11px] font-bold rounded cursor-pointer ${
                          dualActivePreview === 'msg2'
                            ? 'bg-[#ffb77d] text-[#1a120b]'
                            : 'text-[#dbc2b0]'
                        }`}
                      >
                        پیش‌نمایش ۲ (تصمیم S1)
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#dbc2b0]">
                    <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                      isSending && sendingStep === 1
                        ? 'bg-[#0297e8]/15 border-[#0297e8] text-[#96ccff] animate-pulse'
                        : 'bg-[#271e16] border-[#554336]'
                    }`}>
                      <span className="w-4 h-4 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center font-bold text-[10px]">۱</span>
                      <span>ارسال دیلی اینپوت (۱۳ بخش)</span>
                    </div>
                    <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                      isSending && sendingStep === 2
                        ? 'bg-[#0297e8]/15 border-[#0297e8] text-[#96ccff] animate-pulse'
                        : 'bg-[#271e16] border-[#554336]'
                    }`}>
                      <span className="w-4 h-4 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] flex items-center justify-center font-bold text-[10px]">۲</span>
                      <span>گزارش امتیازدهی و تصمیم S1</span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Executive Analysis Generator button (if in full13 or dual) */}
              {(reportType === 'full13' || reportType === 'dual') && (
                <div className="flex items-center justify-between bg-[#1f1711] border border-[#554336] rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#ffb77d]" />
                    <span className="text-xs text-[#dbc2b0]">
                      خلاصه مدیریتی ۵ بندی با هوش مصنوعی (Gemini 2.5)
                    </span>
                  </div>
                  <button
                    onClick={handleGenerateAiAnalysis}
                    disabled={isGeneratingAi}
                    className="px-3 py-1.5 bg-[#3e332b] hover:bg-[#4a3d34] text-[#ffb77d] border border-[#ffb77d]/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingAi ? (
                      <span>در حال تحلیل...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{aiAnalysisText ? 'تولید مجدد تحلیل' : 'تولید تحلیل ۵ بندی'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Data Freshness Check in Telegram Modal */}
              {(() => {
                const freshness = checkDataFreshness(daily13Sections?.metadata?.jalaliDate || signal.lastUpdatedJalali);
                if (freshness.isStale) {
                  return (
                    <div className="bg-[#ef4444]/15 border border-[#ef4444]/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#ffb4ab]">
                      <AlertOctagon className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">⚠️ هشدار ارسال داده‌های منقضی: </span>
                        <span>
                          داده‌های پایش متعلق به تاریخ {freshness.dataDateJalali} است. برای ارسال اطلاعات دقیق، ورودی‌های زنده امروز ({freshness.todayVerbose}) را دریافت و ثبت فرمایید.
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Report Preview Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
                  <span>
                    پیش‌نمایش پیام{' '}
                    {reportType === 'dual'
                      ? dualActivePreview === 'msg1'
                        ? '(پیام اول: دیلی اینپوت)'
                        : '(پیام دوم: گزارش تصمیم و امتیازدهی)'
                      : ''}
                    :
                  </span>
                  <button
                    onClick={handleCopy}
                    className="text-[#ffb77d] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'کپی شد!' : reportType === 'dual' ? 'کپی هر دو پیام' : 'کپی متن'}</span>
                  </button>
                </div>
                <div className="bg-[#18110a] border border-[#554336] rounded-xl p-3.5 max-h-56 overflow-y-auto text-xs text-[#f2dfd3]/90 font-mono whitespace-pre-wrap leading-relaxed">
                  {currentReportText}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!sendSuccess && (
          <div className="p-4 sm:p-5 border-t border-[#554336] bg-[#271e16] flex items-center justify-between shrink-0">
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl border border-[#554336] text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#322820] text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'کپی شد!' : reportType === 'dual' ? 'کپی کل گزارش‌ها' : 'کپی متن'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#322820] text-xs font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleSendToTelegram}
                disabled={isSending}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0297e8] to-[#0077b5] text-white text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSending
                    ? reportType === 'dual'
                      ? `در حال ارسال مرحله ${sendingStep} از ۲...`
                      : 'در حال ارسال به تلگرام...'
                    : reportType === 'dual'
                    ? 'ارسال ۲ مرحله‌ای به کانال تلگرام'
                    : 'ارسال پیام به تلگرام'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
