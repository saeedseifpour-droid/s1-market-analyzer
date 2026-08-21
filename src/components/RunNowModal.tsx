import React, { useState, useEffect } from 'react';
import { SystemS1Signal, MarketScoreItem } from '../types';
import { Play, CheckCircle2, Loader2, RefreshCw, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { getLiveJalaliDateString, getTehranTimeString } from '../utils/dateHelper';

interface RunNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResults: (newSignal: SystemS1Signal) => void;
  currentSignal: SystemS1Signal;
  marketScores: MarketScoreItem[];
}

export const RunNowModal: React.FC<RunNowModalProps> = ({
  isOpen,
  onClose,
  onApplyResults,
  currentSignal,
  marketScores,
}) => {
  const [stage, setStage] = useState<'idle' | 'running' | 'completed'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const steps = [
    { title: 'دریافت و پایش ۴۱ پارامتر بازار و داده‌های Real-time', duration: 700 },
    { title: 'محاسبه امتیازات تفکیکی بازارهای چهارگانه (بورس، طلا، ارز، کریپتو)', duration: 800 },
    { title: 'ارزیابی ریسک کلان، نرخ بهره بین‌بانکی و محاسبه شاخص اطمینان', duration: 700 },
    { title: 'تولید استراتژی تصمیم نهایی S1 و جدول بازتوازن صندوق‌ها', duration: 600 },
  ];

  const handleStartRun = () => {
    setStage('running');
    setCurrentStepIndex(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < steps.length) {
        setCurrentStepIndex(step);
      } else {
        clearInterval(interval);
        setStage('completed');
      }
    }, 750);
  };

  useEffect(() => {
    if (isOpen) {
      setStage('idle');
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nowJalali = `${getLiveJalaliDateString(0, true)} ${getTehranTimeString(true)}:${new Date().getSeconds().toString().padStart(2, '0')}`;

  const freshSignal: SystemS1Signal = {
    ...currentSignal,
    lastUpdatedJalali: nowJalali,
    confidenceScore: 9,
    dataQualityScore: 40,
    actionTitle: 'خرید پله‌ای مجاز است',
    summaryText: 'با توجه به ثبات در بازار ارز و ورود جریان نقدینگی خرد به صندوق‌های طلا و درآمد ثابت، شرایط برای انباشت تدریجی دارایی‌های کم‌ریسک فراهم است.',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#231a13] border border-[#554336] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-[#554336] flex items-center justify-between bg-[#271e16]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d]">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                اجرای دستی و محاسبه زنده موتور System S1
              </h3>
              <p className="text-xs text-[#dbc2b0]/70">
                بروزرسانی داده‌های تحلیلی، امتیازات ۴ بازار و فرمول تصمیم‌گیری
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {stage === 'idle' && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#ffb77d]/10 border border-[#ffb77d]/30 flex items-center justify-center text-[#ffb77d]">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#f2dfd3]">
                  آماده اجرای ارزیابی بلادرنگ بازارها
                </h4>
                <p className="text-xs text-[#dbc2b0] max-w-md mt-1.5 leading-relaxed">
                  موتور S1 تمام ۴۱ ورودی معاملاتی، پارامترهای نقدینگی، حباب‌ها و نرخ‌های بهره را بررسی کرده و سیگنال تصمیم‌گیری روز را مجدداً محاسبه می‌نماید.
                </p>
              </div>

              <button
                onClick={handleStartRun}
                className="bg-[#ffb77d] text-[#4d2600] px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#d97707] transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                شروع پردازش و محاسبه
              </button>
            </div>
          )}

          {stage === 'running' && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
                <span>در حال اجرای الگوریتم S1...</span>
                <span className="font-mono-num font-bold text-[#ffb77d]">
                  گام {currentStepIndex + 1} از ۴
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[#1a120b] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ffb77d] transition-all duration-500 rounded-full"
                  style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>

              {/* Steps list */}
              <div className="space-y-3 pt-2">
                {steps.map((s, idx) => {
                  const isDone = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs flex items-center justify-between border transition-all ${
                        isCurrent
                          ? 'bg-[#322820] border-[#ffb77d]/50 text-[#f2dfd3]'
                          : isDone
                          ? 'bg-[#1a120b] border-[#10b981]/30 text-[#10b981]'
                          : 'bg-[#1a120b]/50 border-transparent text-[#dbc2b0]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-[#ffb77d] animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-current opacity-40" />
                        )}
                        <span>{s.title}</span>
                      </div>
                      {isDone && <span className="font-mono-num text-[10px]">تکمیل شد</span>}
                      {isCurrent && <span className="font-mono-num text-[10px] text-[#ffb77d]">در حال پردازش</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stage === 'completed' && (
            <div className="space-y-4">
              <div className="bg-[#10b981]/15 border border-[#10b981]/40 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#10b981] shrink-0" />
                <div>
                  <div className="text-sm font-bold text-[#f2dfd3]">
                    محاسبه با موفقیت به پایان رسید
                  </div>
                  <div className="text-xs text-[#dbc2b0]">
                    سیگنال جدید با اطمینان ۹/۱۰ و کیفیت داده ۴۰/۴۱ تولید گردید.
                  </div>
                </div>
              </div>

              {/* Summary card preview */}
              <div className="bg-[#1a120b] border border-[#554336] rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between border-b border-[#554336]/60 pb-2">
                  <span className="text-[#dbc2b0]">خروجی تصمیم سیستم S1:</span>
                  <span className="font-bold text-[#ffb77d] text-sm">
                    {freshSignal.actionTitle}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#dbc2b0]">تخصیص پیشنهادی:</span>
                  <span className="font-mono-num text-[#96ccff]">
                    ۴۰٪ درآمد ثابت | ۳۵٪ طلا | ۲۵٪ سهام
                  </span>
                </div>
                <div className="flex justify-between py-1 font-mono-num text-[#dbc2b0]">
                  <span>زمان ثبت:</span>
                  <span>{freshSignal.lastUpdatedJalali}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    onApplyResults(freshSignal);
                    onClose();
                  }}
                  className="flex-1 bg-[#ffb77d] text-[#4d2600] py-2.5 rounded-xl font-bold text-xs hover:bg-[#d97707] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  اعمال و ذخیره در داشبورد
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-[#322820] text-[#dbc2b0] hover:text-[#f2dfd3] rounded-xl text-xs"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
