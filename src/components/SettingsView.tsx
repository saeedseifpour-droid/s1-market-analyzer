import React, { useState } from 'react';
import { TelegramConfig, SystemHistoryLog } from '../types';
import {
  Settings,
  Send,
  Sliders,
  Shield,
  History,
  Download,
  Upload,
  CheckCircle2,
  RefreshCw,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface SettingsViewProps {
  telegramConfig: TelegramConfig;
  onUpdateTelegramConfig: (config: TelegramConfig) => void;
  historyLogs: SystemHistoryLog[];
  onOpenTelegramModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  telegramConfig,
  onUpdateTelegramConfig,
  historyLogs,
  onOpenTelegramModal,
}) => {
  const [config, setConfig] = useState<TelegramConfig>(telegramConfig);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Engine Weights
  const [bourseWeight, setBourseWeight] = useState<number>(30);
  const [goldWeight, setGoldWeight] = useState<number>(30);
  const [cryptoWeight, setCryptoWeight] = useState<number>(15);
  const [forexWeight, setForexWeight] = useState<number>(25);

  // Confidence & Thresholds
  const [minConfidence, setMinConfidence] = useState<number>(8);
  const [bullishThreshold, setBullishThreshold] = useState<number>(75);

  const handleSaveSettings = () => {
    onUpdateTelegramConfig(config);
    setToastMessage('تنظیمات سامانه S1 و ربات تلگرام با موفقیت ذخیره گردید.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportJSON = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      telegramConfig: config,
      weights: { bourseWeight, goldWeight, cryptoWeight, forexWeight },
      thresholds: { minConfidence, bullishThreshold },
      historyLogs,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `S1-System-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('فایل پشتیبان پیکربندی با موفقیت دانلود شد.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col w-full gap-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-[#10b981]/20 border border-[#10b981] text-[#10b981] px-4 py-3 rounded-xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-5 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f2dfd3] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#ffb77d]" />
            تنظیمات الگوریتم، وزن‌دهی و کانال تلگرام
          </h2>
          <p className="text-xs text-[#dbc2b0] mt-1">
            پیکربندی ضرایب اثرگذاری هر بازار در مدل S1، اتصال ربات تلگرام و مدیریت پایگاه داده.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="bg-[#ffb77d] text-[#4d2600] px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#d97707] transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          ذخیره تغییرات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 2. Algorithm Weights Card */}
        <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#554336]">
              <h3 className="text-base font-bold text-[#f2dfd3] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#ffb77d]" />
                ضرایب وزن‌دهی بازارهای چهارگانه
              </h3>
              <span className="text-xs font-mono-num text-[#ffb77d] bg-[#3e332b] px-2 py-0.5 rounded">
                مجموع: {bourseWeight + goldWeight + cryptoWeight + forexWeight}٪
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[#f2dfd3] font-medium">وزن بورس ایران (TSE):</span>
                  <span className="font-mono-num text-[#ffb77d] font-bold">{bourseWeight}٪</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={bourseWeight}
                  onChange={(e) => setBourseWeight(Number(e.target.value))}
                  className="w-full accent-[#ffb77d] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[#f2dfd3] font-medium">وزن طلا و مسکوکات:</span>
                  <span className="font-mono-num text-[#ffb77d] font-bold">{goldWeight}٪</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={goldWeight}
                  onChange={(e) => setGoldWeight(Number(e.target.value))}
                  className="w-full accent-[#ffb77d] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[#f2dfd3] font-medium">وزن ارز و تتر (USDT / FX):</span>
                  <span className="font-mono-num text-[#ffb77d] font-bold">{forexWeight}٪</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={forexWeight}
                  onChange={(e) => setForexWeight(Number(e.target.value))}
                  className="w-full accent-[#ffb77d] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[#f2dfd3] font-medium">وزن رمزارزها (BTC & Crypto):</span>
                  <span className="font-mono-num text-[#c2c7d0] font-bold">{cryptoWeight}٪</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={cryptoWeight}
                  onChange={(e) => setCryptoWeight(Number(e.target.value))}
                  className="w-full accent-[#ffb77d] cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#554336] text-[11px] text-[#dbc2b0]/70 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#10b981]" />
            <span>مدل وزنی متناسب با نقدشوندگی و ریسک بازار ایران کالیبره شده است.</span>
          </div>
        </div>

        {/* 3. Telegram Integration Card */}
        <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#554336]">
              <h3 className="text-base font-bold text-[#f2dfd3] flex items-center gap-2">
                <Send className="w-5 h-5 text-[#ffb77d]" />
                اتصال و ارسال خودکار به تلگرام
              </h3>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                  config.botToken
                    ? 'text-[#10b981] bg-[#10b981]/15 border-[#10b981]/30'
                    : 'text-[#ffb77d] bg-[#f59e0b]/15 border-[#f59e0b]/30'
                }`}
              >
                {config.botToken ? 'ربات متصل' : 'نیاز به توکن @BotFather'}
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#dbc2b0] mb-1">شناسه کانال / گروه تلگرام:</label>
                <input
                  type="text"
                  value={config.channelId}
                  onChange={(e) => setConfig({ ...config, channelId: e.target.value })}
                  placeholder="@SystemS1_Signals یا 123456789-"
                  className="w-full bg-[#1a120b] border border-[#554336] rounded-xl px-3 py-2 text-[#f2dfd3] font-mono-num outline-none focus:border-[#ffb77d]"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[#dbc2b0] mb-1">توکن ربات تلگرام (Bot Token):</label>
                <input
                  type="password"
                  value={config.botToken}
                  onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                  placeholder="7123456789:AAH..."
                  className="w-full bg-[#1a120b] border border-[#554336] rounded-xl px-3 py-2 text-[#f2dfd3] font-mono-num outline-none focus:border-[#ffb77d]"
                  dir="ltr"
                />
                <p className="text-[10px] text-[#dbc2b0]/70 mt-1">
                  توکن دریافتی از ربات <span className="text-[#96ccff] font-mono">@BotFather</span> در تلگرام
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto-send-check"
                    checked={config.autoSendEnabled}
                    onChange={(e) =>
                      setConfig({ ...config, autoSendEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#ffb77d] cursor-pointer"
                  />
                  <label htmlFor="auto-send-check" className="text-[#f2dfd3] cursor-pointer">
                    ارسال خودکار روزانه در ساعت مقرر
                  </label>
                </div>
                <input
                  type="time"
                  value={config.autoSendTime}
                  onChange={(e) => setConfig({ ...config, autoSendTime: e.target.value })}
                  className="bg-[#1a120b] border border-[#554336] rounded-lg px-2 py-1 text-xs text-[#ffb77d] font-mono-num"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#554336] flex items-center justify-between">
            <span className="text-[11px] text-[#dbc2b0]/70 font-mono-num">
              آخرین ارسال: {config.lastSentTimestamp || 'امروز ۱۰:۳۰'}
            </span>
            <button
              onClick={onOpenTelegramModal}
              className="bg-[#3e332b] text-[#ffb77d] hover:bg-[#322820] border border-[#ffb77d]/30 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              پیش‌نمایش و ارسال تست
            </button>
          </div>
        </div>
      </div>

      {/* 4. History Logs of Signals */}
      <div className="bg-[#271e16] border border-[#554336] rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-[#554336] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-bold text-[#f2dfd3] flex items-center gap-2">
            <History className="w-4 h-4 text-[#ffb77d]" />
            تاریخچه تصمیمات و سیگنال‌های ثبت‌شده S1
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="bg-[#1a120b] hover:bg-[#322820] border border-[#554336] text-[#dbc2b0] hover:text-[#ffb77d] px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              خروجی JSON
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#1a120b] text-[#dbc2b0] border-b border-[#554336] font-medium">
              <tr>
                <th className="p-3.5 pr-5">تاریخ و زمان</th>
                <th className="p-3.5">سیگنال صادر شده</th>
                <th className="p-3.5">امتیاز کل</th>
                <th className="p-3.5">بورس</th>
                <th className="p-3.5">طلا</th>
                <th className="p-3.5">بیت‌کوین</th>
                <th className="p-3.5">تتر</th>
                <th className="p-3.5">شاخص اطمینان</th>
                <th className="p-3.5 pl-5">توضیحات تحلیلی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#554336]/30 text-[#f2dfd3]">
              {historyLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#322820]/70 transition-colors">
                  <td className="p-3.5 pr-5 font-mono-num text-[#dbc2b0]">
                    {log.jalaliDate}
                  </td>
                  <td className="p-3.5 font-bold text-[#ffb77d]">
                    {log.action}
                  </td>
                  <td className="p-3.5 font-mono-num font-bold text-[#10b981]">
                    {log.compositeScore}
                  </td>
                  <td className="p-3.5 font-mono-num text-[#dbc2b0]">{log.bourseScore}</td>
                  <td className="p-3.5 font-mono-num text-[#ffb77d]">{log.goldScore}</td>
                  <td className="p-3.5 font-mono-num text-[#c2c7d0]">{log.btcScore}</td>
                  <td className="p-3.5 font-mono-num text-[#dbc2b0]">{log.usdtScore}</td>
                  <td className="p-3.5 text-[#96ccff]">{log.confidence}</td>
                  <td className="p-3.5 pl-5 text-[#dbc2b0]/80 text-[11px] max-w-xs truncate">
                    {log.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
