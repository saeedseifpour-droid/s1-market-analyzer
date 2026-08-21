import React, { useState, useEffect } from 'react';
import {
  SystemS1Signal,
  MarketScoreItem,
  InputMetric,
  PortfolioAssetItem,
  PortfolioTradeItem,
  TelegramConfig
} from '../types';
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
  Table,
  Zap,
} from 'lucide-react';
import {
  formatFull13Report,
  formatDailyInputsSheetReport,
  formatQuickSignalReport,
  sendTelegramMessage,
  generateGeminiExecutiveAnalysis,
} from '../telegram_reporter';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  inputs: InputMetric[];
  assets: PortfolioAssetItem[];
  trades: PortfolioTradeItem[];
  telegramConfig: TelegramConfig;
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
}) => {
  const [reportType, setReportType] = useState<'full13' | 'inputsSheet' | 'quick'>('full13');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
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
      const savedToken = localStorage.getItem('S1_TELEGRAM_BOT_TOKEN');
      const savedChat = localStorage.getItem('S1_TELEGRAM_CHAT_ID');
      if (savedToken) setBotToken(savedToken);
      if (savedChat) setChatId(savedChat);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const payload = {
    signal,
    marketScores,
    inputs,
    assets,
    trades,
  };

  const getActiveReportText = () => {
    switch (reportType) {
      case 'full13':
        return formatFull13Report(payload, aiAnalysisText);
      case 'inputsSheet':
        return formatDailyInputsSheetReport(payload);
      case 'quick':
        return formatQuickSignalReport(payload);
      default:
        return formatFull13Report(payload, aiAnalysisText);
    }
  };

  const currentReportText = getActiveReportText();

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
      // Normalize token if user entered with "bot" prefix
      const cleanToken = activeToken.startsWith('bot') ? activeToken.slice(3) : activeToken;
      const res = await sendTelegramMessage(currentReportText, cleanToken, activeChatId);

      if (res.success) {
        setSendSuccess(true);
        localStorage.setItem('S1_TELEGRAM_BOT_TOKEN', activeToken);
        localStorage.setItem('S1_TELEGRAM_CHAT_ID', activeChatId);
      } else {
        setSendError(`پاسخ تلگرام: ${res.error || 'خطا در برقراری ارتباط'}`);
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
                ارسال گزارش و ورودی‌های زنده به تلگرام
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
                پیام با موفقیت به تلگرام ارسال شد!
              </h4>
              <p className="text-xs text-[#dbc2b0]">
                گزارش سیستم S1 شامل داده‌های ورودی روزانه و منابع استخراج در مقصد {chatId || telegramConfig.channelId} منتشر شد.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => setSendSuccess(false)}
                  className="px-4 py-2 bg-[#3e332b] text-[#f2dfd3] rounded-xl text-xs font-semibold hover:bg-[#322820] cursor-pointer"
                >
                  ارسال بخش دیگر
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
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#18110a] rounded-xl border border-[#554336]">
                <button
                  onClick={() => setReportType('full13')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reportType === 'full13'
                      ? 'bg-[#ffb77d] text-[#1a120b] shadow-md'
                      : 'text-[#dbc2b0] hover:text-[#f2dfd3]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  گزارش رسمی ۱۳ گانه
                </button>

                <button
                  onClick={() => setReportType('inputsSheet')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reportType === 'inputsSheet'
                      ? 'bg-[#ffb77d] text-[#1a120b] shadow-md'
                      : 'text-[#dbc2b0] hover:text-[#f2dfd3]'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  برگه ورودی‌ها و منابع ({inputs.length})
                </button>

                <button
                  onClick={() => setReportType('quick')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reportType === 'quick'
                      ? 'bg-[#ffb77d] text-[#1a120b] shadow-md'
                      : 'text-[#dbc2b0] hover:text-[#f2dfd3]'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  سیگنال فوری S1
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
                        type="password"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        placeholder="7123456789:AAH..."
                        className="w-full bg-[#271e16] border border-[#554336] rounded-lg px-3 py-2 text-xs text-[#f2dfd3] font-mono outline-none focus:border-[#ffb77d]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#dbc2b0] mb-1 font-medium">
                        Telegram Chat ID / Channel Username:
                      </label>
                      <input
                        type="text"
                        value={chatId}
                        onChange={(e) => setChatId(e.target.value)}
                        placeholder="@MyChannel یا -100123456789"
                        className="w-full bg-[#271e16] border border-[#554336] rounded-lg px-3 py-2 text-xs text-[#f2dfd3] font-mono outline-none focus:border-[#ffb77d]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={handleSaveCredentials}
                        className="px-3 py-1.5 bg-[#ffb77d] text-[#1a120b] font-bold rounded-lg text-xs hover:bg-[#ffaa64] cursor-pointer"
                      >
                        ذخیره تنظیمات در مرورگر
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Preview Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
                  <span className="font-semibold">پیش‌نمایش متن گزارش ارسالی:</span>
                  <div className="flex items-center gap-2">
                    {reportType === 'full13' && (
                      <button
                        onClick={handleGenerateAiAnalysis}
                        disabled={isGeneratingAi}
                        className="text-[11px] text-[#96ccff] hover:text-[#bfdbfe] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                        {isGeneratingAi ? 'تحلیل با هوش مصنوعی...' : 'تولید تحلیل مدیریتی با AI'}
                      </button>
                    )}
                    <span className="font-mono-num text-[11px] text-[#dbc2b0]/70">
                      {currentReportText.length} کاراکتر
                    </span>
                  </div>
                </div>

                <div className="bg-[#18110a] border border-[#554336] rounded-xl p-3.5 max-h-72 overflow-y-auto text-xs text-[#f2dfd3] font-mono whitespace-pre-wrap leading-relaxed select-text">
                  {currentReportText}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!sendSuccess && (
          <div className="p-4 sm:p-5 border-t border-[#554336] bg-[#271e16] flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-[#3e332b] text-[#f2dfd3] rounded-xl text-xs font-semibold hover:bg-[#322820] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
              {copied ? 'کپی شد' : 'کپی متن گزارش'}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-[#dbc2b0] hover:text-[#f2dfd3] text-xs font-medium cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleSendToTelegram}
                disabled={isSending}
                className="px-5 py-2.5 bg-[#0297e8] hover:bg-[#0284c7] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
                {isSending ? 'در حال ارسال به تلگرام...' : 'ارسال زنده به تلگرام'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
