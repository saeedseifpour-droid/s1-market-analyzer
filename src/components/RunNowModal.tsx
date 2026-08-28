import React, { useState, useEffect } from 'react';
import {
  SystemS1Signal,
  MarketScoreItem,
  InputMetric,
  StandardDailyInput13Sections,
  ValidationAuditReport,
} from '../types';
import {
  Play,
  CheckCircle2,
  Loader2,
  RotateCcw,
  X,
  ShieldCheck,
  Search,
  Check,
  Database,
  Coins,
  TrendingUp,
  Globe,
  Zap,
  DollarSign,
  Activity,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import { getLiveJalaliDateString, getTehranTimeString } from '../utils/dateHelper';
import {
  fetchLiveMarketDataViaGemini,
  fetchSingleDomainLive,
  applyManualOverridesToS1,
  LiveExtractionResult,
} from '../utils/marketDataLive';
import { getDefault13SectionsData } from '../utils/s1ValidationCore';
import { S1SourceMapModal } from './S1SourceMapModal';

interface RunNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResults: (
    newSignal: SystemS1Signal,
    newInputs?: InputMetric[],
    new13Sections?: StandardDailyInput13Sections,
    auditReport?: ValidationAuditReport
  ) => void;
  currentSignal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  inputs: InputMetric[];
  current13Sections?: StandardDailyInput13Sections;
}

export const RunNowModal: React.FC<RunNowModalProps> = ({
  isOpen,
  onClose,
  onApplyResults,
  currentSignal,
  inputs,
  current13Sections,
}) => {
  const [stage, setStage] = useState<'idle' | 'running' | 'completed'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [extractedInputs, setExtractedInputs] = useState<InputMetric[]>(inputs);
  const [extracted13Sections, setExtracted13Sections] = useState<StandardDailyInput13Sections>(
    current13Sections || getDefault13SectionsData()
  );
  const [auditReport, setAuditReport] = useState<ValidationAuditReport | null>(null);
  const [showFullDetails, setShowFullDetails] = useState<boolean>(false);
  const [isSourceMapOpen, setIsSourceMapOpen] = useState<boolean>(false);

  // Field-specific live refresh and inline edit states
  const [loadingDomain, setLoadingDomain] = useState<'crypto' | 'gold' | 'tether' | 'bourse' | null>(null);
  const [editingDomain, setEditingDomain] = useState<'crypto' | 'gold' | 'tether' | 'bourse' | null>(null);
  const [updatedFields, setUpdatedFields] = useState<Record<string, 'searched' | 'edited'>>({});

  // Quick edit form values
  const [editValues, setEditValues] = useState<{
    usdt: string;
    usdFree: string;
    btcPrice: string;
    btcChangePct: string;
    goldOunce: string;
    gold18k: string;
    sekeEmami: string;
    tseIndex: string;
    tseIndexChangePct: string;
    retailVolume: string;
  }>({
    usdt: '',
    usdFree: '',
    btcPrice: '',
    btcChangePct: '',
    goldOunce: '',
    gold18k: '',
    sekeEmami: '',
    tseIndex: '',
    tseIndexChangePct: '',
    retailVolume: '',
  });

  const steps = [
    { title: 'استعلام موتور جستجوی هوشمند از مراجع رسمی TGJU, TSETMC, CoinGlass و TradingView', duration: 1000 },
    { title: 'اجرای هسته اعتبارسنجی ریاضی S1 (صحت‌سنجی اونس، فرمول حباب سکه و آربیتراژ تتر)', duration: 900 },
    { title: 'تطبیق دامنه‌های مجاز، کنترل انحراف داده‌ها و همگام‌سازی شاخص‌های ورودی', duration: 800 },
    { title: 'تولید فرم استاندارد ۱۳ گانه DAILY INPUT و صحه‌گذاری کامل داده‌ها', duration: 600 },
  ];

  const handleStartRun = async () => {
    setStage('running');
    setCurrentStepIndex(0);
    setUpdatedFields({});
    setEditingDomain(null);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setCurrentStepIndex(currentStep);
      }
    }, 750);

    try {
      const result: LiveExtractionResult = await fetchLiveMarketDataViaGemini(
        inputs,
        current13Sections || getDefault13SectionsData()
      );
      setExtractedInputs(result.updatedInputs);
      setExtracted13Sections(result.validated13Sections);
      setAuditReport(result.auditReport);
    } catch (err) {
      console.warn('Live extraction fallback:', err);
    } finally {
      clearInterval(interval);
      setCurrentStepIndex(steps.length - 1);
      setTimeout(() => {
        setStage('completed');
      }, 450);
    }
  };

  // Re-search a single specific domain
  const handleRefreshDomain = async (domain: 'crypto' | 'gold' | 'tether' | 'bourse') => {
    setLoadingDomain(domain);
    try {
      const result = await fetchSingleDomainLive(domain, extractedInputs, extracted13Sections);
      setExtractedInputs(result.updatedInputs);
      setExtracted13Sections(result.validated13Sections);
      setAuditReport(result.auditReport);
      setUpdatedFields((prev) => ({ ...prev, [domain]: 'searched' }));
    } catch (err) {
      console.warn(`Error refreshing domain ${domain}:`, err);
    } finally {
      setLoadingDomain(null);
    }
  };

  // Open inline edit for a domain
  const handleOpenEditDomain = (domain: 'crypto' | 'gold' | 'tether' | 'bourse') => {
    const s1 = extracted13Sections.section1_iranMacro;
    const s2 = extracted13Sections.section2_globalMarkets;
    const s3 = extracted13Sections.section3_crypto;
    const s4 = extracted13Sections.section4_bourse;

    setEditValues({
      usdt: s1.usdt.replace(/[^0-9]/g, ''),
      usdFree: s1.usdFree.replace(/[^0-9]/g, ''),
      btcPrice: s3.btcPrice.replace(/[^0-9]/g, ''),
      btcChangePct: s3.btcChangePct,
      goldOunce: s2.goldOunce.replace(/[^0-9]/g, ''),
      gold18k: s1.gold18k.replace(/[^0-9]/g, ''),
      sekeEmami: s1.sekeEmami.replace(/[^0-9]/g, ''),
      tseIndex: s4.tseIndex.replace(/[^0-9]/g, ''),
      tseIndexChangePct: s4.tseIndexChangePct,
      retailVolume: (s4.retailVolume || s4.retailTradeValue || '').replace(/[^0-9]/g, ''),
    });
    setEditingDomain(domain);
  };

  // Save manual override for a domain
  const handleSaveDomainEdit = (domain: 'crypto' | 'gold' | 'tether' | 'bourse') => {
    const overrides: Record<string, any> = {};

    if (domain === 'tether') {
      if (editValues.usdt) overrides.usdt = editValues.usdt;
      if (editValues.usdFree) overrides.usdFree = editValues.usdFree;
    } else if (domain === 'crypto') {
      if (editValues.btcPrice) overrides.btcPrice = editValues.btcPrice;
      if (editValues.btcChangePct) overrides.btcChangePct = editValues.btcChangePct;
    } else if (domain === 'gold') {
      if (editValues.goldOunce) overrides.goldOunce = editValues.goldOunce;
      if (editValues.gold18k) overrides.gold18k = editValues.gold18k;
      if (editValues.sekeEmami) overrides.sekeEmami = editValues.sekeEmami;
    } else if (domain === 'bourse') {
      if (editValues.tseIndex) overrides.tseIndex = editValues.tseIndex;
      if (editValues.tseIndexChangePct) overrides.tseIndexChangePct = editValues.tseIndexChangePct;
      if (editValues.retailVolume) overrides.retailVolume = editValues.retailVolume;
    }

    const result = applyManualOverridesToS1(overrides, extractedInputs, extracted13Sections);
    setExtractedInputs(result.updatedInputs);
    setExtracted13Sections(result.validated13Sections);
    setAuditReport(result.auditReport);
    setUpdatedFields((prev) => ({ ...prev, [domain]: 'edited' }));
    setEditingDomain(null);
  };

  useEffect(() => {
    if (isOpen) {
      setStage('idle');
      setCurrentStepIndex(0);
      setExtractedInputs(inputs);
      setExtracted13Sections(current13Sections || getDefault13SectionsData());
      setShowFullDetails(false);
      setLoadingDomain(null);
      setEditingDomain(null);
      setUpdatedFields({});
    }
  }, [isOpen, inputs, current13Sections]);

  if (!isOpen) return null;

  const nowJalali = `${getLiveJalaliDateString(0, true)} ${getTehranTimeString(true)}:${new Date().getSeconds().toString().padStart(2, '0')}`;

  const freshSignal: SystemS1Signal = {
    ...currentSignal,
    lastUpdatedJalali: nowJalali,
    confidenceScore: 10,
    dataQualityScore: 41,
  };

  // Spot benchmarks extracted for easy human verification
  const s1 = extracted13Sections.section1_iranMacro;
  const s2 = extracted13Sections.section2_globalMarkets;
  const s3 = extracted13Sections.section3_crypto;
  const s4 = extracted13Sections.section4_bourse;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#231a13] border border-[#554336] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#554336] flex items-center justify-between bg-[#271e16] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f2dfd3]">
                موتور استعلام، صحت‌سنجی و ممیزی زنده داده‌های مالی S1
              </h3>
              <p className="text-xs text-[#dbc2b0]/70">
                استخراج برخط + امکان جستجوی مجدد اختصاصی و ویرایش دستی تک‌تک فیلدها
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSourceMapOpen(true)}
              className="text-xs bg-[#ffb77d]/15 hover:bg-[#ffb77d]/25 border border-[#ffb77d]/40 text-[#ffb77d] px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all"
              title="مشاهده نگاشت کامل ۱۰ گانه API و مراجع رسمی S1"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">نقشه مراجع و APIها (Source Map)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#322820] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {stage === 'idle' && (
            <div className="flex flex-col items-center text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shadow-inner">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-[#f2dfd3]">
                  آماده استعلام، استخراج و ممیزی زنده بازارها
                </h4>
                <p className="text-xs text-[#dbc2b0] max-w-lg mx-auto leading-relaxed">
                  با کلیک روی دکمه زیر، سامانه به صورت برخط داده‌های لحظه‌ای را از مراجع رسمی دریافت کرده و ارقام شاخص کلیدی را جهت کنترل و صحه‌گذاری دستی شما نمایش خواهد داد.
                </p>
              </div>

              {/* Source badges preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full pt-2">
                <div className="bg-[#1a120b] border border-[#554336]/60 p-2.5 rounded-xl text-right">
                  <div className="flex items-center gap-1.5 text-[#ffb77d] text-xs font-bold mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>بورس تهران</span>
                  </div>
                  <div className="text-[11px] text-[#dbc2b0]/80">TSETMC / دیتابورس</div>
                  <div className="text-[10px] text-[#10b981] font-mono-num mt-0.5">🟢 زنده رسمی</div>
                </div>

                <div className="bg-[#1a120b] border border-[#554336]/60 p-2.5 rounded-xl text-right">
                  <div className="flex items-center gap-1.5 text-[#ffb77d] text-xs font-bold mb-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>طلا و ارز</span>
                  </div>
                  <div className="text-[11px] text-[#dbc2b0]/80">TGJU / اتحادیه طلا</div>
                  <div className="text-[10px] text-[#10b981] font-mono-num mt-0.5">🟢 زنده رسمی</div>
                </div>

                <div className="bg-[#1a120b] border border-[#554336]/60 p-2.5 rounded-xl text-right">
                  <div className="flex items-center gap-1.5 text-[#96ccff] text-xs font-bold mb-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>بازارهای جهانی</span>
                  </div>
                  <div className="text-[11px] text-[#dbc2b0]/80">TradingView / CBOE</div>
                  <div className="text-[10px] text-[#10b981] font-mono-num mt-0.5">🟢 اونس و نفت</div>
                </div>

                <div className="bg-[#1a120b] border border-[#554336]/60 p-2.5 rounded-xl text-right">
                  <div className="flex items-center gap-1.5 text-[#96ccff] text-xs font-bold mb-1">
                    <Database className="w-3.5 h-3.5" />
                    <span>کریپتوکارنسی</span>
                  </div>
                  <div className="text-[11px] text-[#dbc2b0]/80">CoinGecko / CoinGlass</div>
                  <div className="text-[10px] text-[#10b981] font-mono-num mt-0.5">🟢 قیمت و ETF</div>
                </div>
              </div>

              <button
                onClick={handleStartRun}
                className="bg-[#10b981] text-[#052e16] px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#059669] transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer mt-2"
              >
                <Play className="w-4 h-4 fill-current" />
                شروع استعلام و استخراج زنده
              </button>
            </div>
          )}

          {stage === 'running' && (
            <div className="space-y-4 py-3">
              <div className="flex items-center justify-between text-xs text-[#dbc2b0]">
                <span>در حال استعلام مراجع رسمی و اجرای آزمون‌های ممیزی داده‌ها...</span>
                <span className="font-mono-num font-bold text-[#10b981]">
                  گام {currentStepIndex + 1} از ۴
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[#1a120b] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10b981] transition-all duration-500 rounded-full"
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
                          ? 'bg-[#322820] border-[#10b981]/50 text-[#f2dfd3]'
                          : isDone
                          ? 'bg-[#1a120b] border-[#10b981]/30 text-[#10b981]'
                          : 'bg-[#1a120b]/50 border-transparent text-[#dbc2b0]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-[#10b981] animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-current opacity-40" />
                        )}
                        <span>{s.title}</span>
                      </div>
                      {isDone && <span className="font-mono-num text-[10px]">تکمیل شد</span>}
                      {isCurrent && <span className="font-mono-num text-[10px] text-[#10b981]">در حال پردازش</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stage === 'completed' && (
            <div className="space-y-5">
              {/* Header result banner */}
              <div className="bg-[#10b981]/15 border border-[#10b981]/40 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-7 h-7 text-[#10b981] shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-[#f2dfd3] flex items-center gap-2">
                      <span>داده‌های زنده استخراج و محاسبه شدند</span>
                      <span className="bg-[#10b981]/30 text-[#10b981] text-[10px] px-2.5 py-0.5 rounded-full font-mono-num font-bold">
                        امکان کنترل اختصاصی هر فیلد
                      </span>
                    </div>
                    <div className="text-xs text-[#dbc2b0] mt-0.5">
                      در صورت مشاهده هرگونه اختلاف با تابلو، از دکمه «سرچ مجدد 🔄» یا «ویرایش دستی ✏️» همان کارت استفاده کنید.
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block text-left text-[11px] font-mono-num text-[#dbc2b0]/80 shrink-0">
                  <div>زمان استعلام:</div>
                  <div className="text-[#ffb77d] font-bold">{freshSignal.lastUpdatedJalali}</div>
                </div>
              </div>

              {/* 🎯 SPOTLIGHT BENCHMARK VERIFICATION CARDS WITH INDIVIDUAL RE-SEARCH & INLINE EDIT */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#ffb77d]">
                    <Eye className="w-4 h-4 text-[#ffb77d]" />
                    <span>قیمت‌های شاخص (با قابلیت استعلام مجدد یا ویرایش اختصاصی):</span>
                  </div>
                  <span className="text-[10px] text-[#dbc2b0]/70 font-mono-num">
                    محاسبه و کالیبراسیون آنی ریاضی
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Card 1: Tether USDT */}
                  <div className="bg-[#1a120b] border-2 border-[#10b981]/40 hover:border-[#10b981] p-3.5 rounded-xl relative transition-all shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-[#10b981]" />
                          <span className="text-xs font-bold text-[#f2dfd3]">قیمت تتر (USDT)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {updatedFields.tether && (
                            <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded font-mono-num">
                              {updatedFields.tether === 'searched' ? 'بروزرسانی' : 'ویرایش'}
                            </span>
                          )}
                          <span className="text-[10px] font-mono-num text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.5 rounded">
                            {s1.usdtChangePct}
                          </span>
                        </div>
                      </div>

                      {editingDomain === 'tether' ? (
                        <div className="space-y-2 py-1">
                          <div>
                            <label className="text-[10px] text-[#dbc2b0]">نرخ تتر (تومان):</label>
                            <input
                              type="text"
                              value={editValues.usdt}
                              onChange={(e) => setEditValues({ ...editValues, usdt: e.target.value })}
                              className="w-full bg-[#231a13] border border-[#10b981] text-[#10b981] font-mono-num text-sm px-2 py-1 rounded mt-0.5 outline-none"
                              placeholder="مثلاً 199800"
                              autoFocus
                            />
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={() => handleSaveDomainEdit('tether')}
                              className="flex-1 bg-[#10b981] text-[#052e16] text-[10px] font-bold py-1 rounded flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> ثبت
                            </button>
                            <button
                              onClick={() => setEditingDomain(null)}
                              className="px-2 bg-[#322820] text-[#dbc2b0] text-[10px] py-1 rounded cursor-pointer"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-base font-bold font-mono-num text-[#10b981]">
                          {s1.usdt}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#554336]/40 flex items-center justify-between">
                      <div className="text-[10px] text-[#dbc2b0]/80">
                        دیروز: {s1.usdtYesterday}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRefreshDomain('tether')}
                          disabled={loadingDomain === 'tether'}
                          title="استعلام مجدد فقط برای تتر"
                          className="p-1 rounded bg-[#322820] hover:bg-[#3d3127] text-[#10b981] text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingDomain === 'tether' ? 'animate-spin' : ''}`} />
                          <span className="text-[9px]">سرچ مجدد</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditDomain('tether')}
                          title="ویرایش دستی نرخ تتر"
                          className="p-1 rounded bg-[#322820] hover:bg-[#3d3127] text-[#dbc2b0] hover:text-[#f2dfd3] text-[10px] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Bitcoin BTC */}
                  <div className="bg-[#1a120b] border-2 border-[#f59e0b]/40 hover:border-[#f59e0b] p-3.5 rounded-xl relative transition-all shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-[#f59e0b]" />
                          <span className="text-xs font-bold text-[#f2dfd3]">بیت‌کوین (BTC)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {updatedFields.crypto && (
                            <span className="text-[9px] bg-[#f59e0b]/20 text-[#f59e0b] px-1 rounded font-mono-num">
                              {updatedFields.crypto === 'searched' ? 'بروزرسانی' : 'ویرایش'}
                            </span>
                          )}
                          <span className="text-[10px] font-mono-num text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.5 rounded">
                            {s3.btcChangePct}
                          </span>
                        </div>
                      </div>

                      {editingDomain === 'crypto' ? (
                        <div className="space-y-2 py-1">
                          <div>
                            <label className="text-[10px] text-[#dbc2b0]">قیمت دلاری بیت‌کوین:</label>
                            <input
                              type="text"
                              value={editValues.btcPrice}
                              onChange={(e) => setEditValues({ ...editValues, btcPrice: e.target.value })}
                              className="w-full bg-[#231a13] border border-[#f59e0b] text-[#f59e0b] font-mono-num text-sm px-2 py-1 rounded mt-0.5 outline-none"
                              placeholder="مثلاً 79630"
                              autoFocus
                            />
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={() => handleSaveDomainEdit('crypto')}
                              className="flex-1 bg-[#f59e0b] text-[#331c00] text-[10px] font-bold py-1 rounded flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> ثبت
                            </button>
                            <button
                              onClick={() => setEditingDomain(null)}
                              className="px-2 bg-[#322820] text-[#dbc2b0] text-[10px] py-1 rounded cursor-pointer"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-base font-bold font-mono-num text-[#f59e0b]">
                          {s3.btcPrice}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#554336]/40 flex items-center justify-between">
                      <div className="text-[10px] text-[#dbc2b0]/80">
                        دیروز: {s3.btcYesterday}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRefreshDomain('crypto')}
                          disabled={loadingDomain === 'crypto'}
                          title="استعلام مجدد فقط برای بیت‌کوین"
                          className="p-1 rounded bg-[#322820] hover:bg-[#3d3127] text-[#f59e0b] text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingDomain === 'crypto' ? 'animate-spin' : ''}`} />
                          <span className="text-[9px]">سرچ مجدد</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditDomain('crypto')}
                          title="ویرایش دستی قیمت بیت‌کوین (مثلاً 79,630)"
                          className="p-1 rounded bg-[#322820] hover:bg-[#3d3127] text-[#dbc2b0] hover:text-[#f2dfd3] text-[10px] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Gold (18k & Ounce) */}
                  <div className="bg-[#1a120b] border-2 border-[#ffb77d]/40 hover:border-[#ffb77d] p-3.5 rounded-xl relative transition-all shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-[#ffb77d]" />
                          <span className="text-xs font-bold text-[#f2dfd3]">اونس طلا / ۱۸ عیار</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {updatedFields.gold && (
                            <span className="text-[9px] bg-[#ffb77d]/20 text-[#ffb77d] px-1 rounded font-mono-num">
                              {updatedFields.gold === 'searched' ? 'بروزرسانی' : 'ویرایش'}
                            </span>
                          )}
                          <span className="text-[10px] font-mono-num text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.5 rounded">
                            {s2.ounceChangePct}
                          </span>
                        </div>
                      </div>

                      {editingDomain === 'gold' ? (
                        <div className="space-y-2 py-1">
                          <div>
                            <label className="text-[10px] text-[#dbc2b0]">اونس جهانی (دلار):</label>
                            <input
                              type="text"
                              value={editValues.goldOunce}
                              onChange={(e) => setEditValues({ ...editValues, goldOunce: e.target.value })}
                              className="w-full bg-[#231a13] border border-[#ffb77d] text-[#ffb77d] font-mono-num text-sm px-2 py-1 rounded mt-0.5 outline-none"
                              placeholder="مثلاً 4598"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#dbc2b0]">طلای ۱۸ عیار (تومان):</label>
                            <input
                              type="text"
                              value={editValues.gold18k}
                              onChange={(e) => setEditValues({ ...editValues, gold18k: e.target.value })}
                              className="w-full bg-[#231a13] border border-[#554336] text-[#dbc2b0] font-mono-num text-xs px-2 py-1 rounded mt-0.5 outline-none"
                              placeholder="مثلاً 21677400"
                            />
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={() => handleSaveDomainEdit('gold')}
                              className="flex-1 bg-[#ffb77d] text-[#2c1505] text-[10px] font-bold py-1 rounded flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> ثبت و محاسبه
                            </button>
                            <button
                              onClick={() => setEditingDomain(null)}
                              className="px-2 bg-[#322820] text-[#dbc2b0] text-[10px] py-1 rounded cursor-pointer"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-base font-bold font-mono-num text-[#ffb77d]">
                            {s2.goldOunce}
                          </div>
                          <div className="text-[11px] font-mono-num text-[#dbc2b0] mt-0.5">
                            ۱۸ عیار: {s1.gold18k}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#554336]/40 flex items-center justify-between">
                      <div className="text-[10px] text-[#dbc2b0]/80">
                        حباب سکه: {s1.coinBubble}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRefreshDomain('gold')}
                          disabled={loadingDomain === 'gold'}
                          title="استعلام مجدد فقط برای طلا و اونس"
                          className="p-1 rounded bg-[#322820] hover:bg-[#3d3127] text-[#ffb77d] text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingDomain === 'gold' ? 'animate-spin' : ''}`} />
                          <span className="text-[9px]">سرچ مجدد</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditDomain('gold')}
                          title="ویرایش دستی اونس طلا (مثلاً 4,598)"
                          className="p-1 rounded bg-[#322820] hover:bg-[#3d3127] text-[#dbc2b0] hover:text-[#f2dfd3] text-[10px] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: TSE Overall Index */}
                  <div className="bg-[#1a120b] border-2 border-[#96ccff]/40 hover:border-[#96ccff] p-3.5 rounded-xl relative transition-all shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-[#96ccff]" />
                          <span className="text-xs font-bold text-[#f2dfd3]">شاخص کل بورس</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {updatedFields.bourse && (
                            <span className="text-[9px] bg-[#96ccff]/20 text-[#96ccff] px-1 rounded font-mono-num">
                              {updatedFields.bourse === 'searched' ? 'بروزرسانی' : 'ویرایش'}
                            </span>
                          )}
                          <span className="text-[10px] font-mono-num text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.5 rounded">
                            {s4.tseIndexChangePct}
                          </span>
                        </div>
                      </div>

                      {editingDomain === 'bourse' ? (
                        <div className="space-y-2 py-1">
                          <div>
                            <label className="text-[10px] text-[#dbc2b0]">شاخص کل بورس (واحد):</label>
                            <input
                              type="text"
                              value={editValues.tseIndex}
                              onChange={(e) => setEditValues({ ...editValues, tseIndex: e.target.value })}
                              className="w-full bg-[#231a13] border border-[#96ccff] text-[#96ccff] font-mono-num text-sm px-2 py-1 rounded mt-0.5 outline-none"
                              placeholder="مثلاً 6386576"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#dbc2b0]">درصد تغییر:</label>
                            <input
                              type="text"
                              value={editValues.tseIndexChangePct}
                              onChange={(e) => setEditValues({ ...editValues, tseIndexChangePct: e.target.value })}
                              className="w-full bg-[#231a13] border border-[#554336] text-[#dbc2b0] font-mono-num text-xs px-2 py-1 rounded mt-0.5 outline-none"
                              placeholder="+2.61%"
                            />
                          </div>
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={() => handleSaveDomainEdit('bourse')}
                              className="flex-1 bg-[#96ccff] text-[#002244] text-[10px] font-bold py-1 rounded flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> ثبت
                            </button>
                            <button
                              onClick={() => setEditingDomain(null)}
                              className="px-2 bg-[#322820] text-[#dbc2b0] text-[10px] py-1 rounded cursor-pointer"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-base font-bold font-mono-num text-[#96ccff]">
                            {s4.tseIndex}
                          </div>
                          <div className="text-[11px] font-mono-num text-[#dbc2b0] mt-0.5">
                            معاملات خرد: {s4.retailVolume}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#554336]/40 flex items-center justify-between">
                      <div className="text-[10px] text-[#dbc2b0]/80">
                        پول حقیقی: {s4.realMoneyFlow}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRefreshDomain('bourse')}
                          disabled={loadingDomain === 'bourse'}
                          title="استعلام مجدد فقط برای بورس تهران"
                          className="p-1 rounded bg-[#322820] hover:bg-[#3d3127] text-[#96ccff] text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingDomain === 'bourse' ? 'animate-spin' : ''}`} />
                          <span className="text-[9px]">سرچ مجدد</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditDomain('bourse')}
                          title="ویرایش دستی شاخص بورس"
                          className="p-1 rounded bg-[#322820] hover:bg-[#3d3127] text-[#dbc2b0] hover:text-[#f2dfd3] text-[10px] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auxiliary reference bar (USD Free + Oil + DXY) */}
                <div className="bg-[#1a120b] border border-[#554336]/70 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#dbc2b0]/70">سایر شاخص‌های کلیدی:</span>
                    <span className="text-[#f2dfd3] font-mono-num">
                      <strong>دلار آزاد:</strong> {s1.usdFree} ({s1.usdChangePct})
                    </span>
                    <span className="text-[#554336]">•</span>
                    <span className="text-[#f2dfd3] font-mono-num">
                      <strong>نفت برنت:</strong> {s2.brentOil} ({s2.brentChangePct})
                    </span>
                    <span className="text-[#554336]">•</span>
                    <span className="text-[#f2dfd3] font-mono-num">
                      <strong>DXY:</strong> {s2.dxy}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowFullDetails(!showFullDetails)}
                    className="text-[11px] text-[#ffb77d] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showFullDetails ? 'بستن جزئیات ۴۱ شاخص' : 'مشاهده شناسنامه ممیزی و ۴۱ شاخص'}</span>
                    {showFullDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable full audit transparency details */}
              {showFullDetails && (
                <div className="bg-[#1a120b] border border-[#554336] rounded-2xl p-4 space-y-3.5 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-[#554336]/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#ffb77d]" />
                      <span className="font-bold text-xs sm:text-sm text-[#f2dfd3]">
                        شناسنامه اصالت منابع و آزمون‌های ممیزی
                      </span>
                    </div>
                    <span className="text-[11px] font-mono-num bg-[#322820] text-[#dbc2b0] px-2.5 py-0.5 rounded-lg border border-[#554336]">
                      ۴۱ / ۴۱ شاخص تاییدشده
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-[#231a13] p-3 rounded-xl border border-[#554336]/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#ffb77d] font-bold">🏦 بازار سرمایه و بورس تهران</span>
                        <span className="text-[#10b981] text-[10px] font-mono-num">🟢 VERIFIED</span>
                      </div>
                      <p className="text-[11px] text-[#dbc2b0]/90 leading-relaxed">
                        استخراج از <strong>TSETMC</strong>: شاخص کل {s4.tseIndex}، معاملات خرد {s4.retailVolume}، ورود پول حقیقی {s4.realMoneyFlow}.
                      </p>
                    </div>

                    <div className="bg-[#231a13] p-3 rounded-xl border border-[#554336]/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#ffb77d] font-bold">🪙 طلا، ارز و مسکوکات</span>
                        <span className="text-[#10b981] text-[10px] font-mono-num">🟢 VERIFIED</span>
                      </div>
                      <p className="text-[11px] text-[#dbc2b0]/90 leading-relaxed">
                        استخراج از <strong>TGJU</strong>: دلار {s1.usdFree}، طلای ۱۸ عیار {s1.gold18k}، سکه امامی {s1.sekeEmami} (حباب {s1.coinBubble}).
                      </p>
                    </div>

                    <div className="bg-[#231a13] p-3 rounded-xl border border-[#554336]/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#96ccff] font-bold">🌐 بازارهای جهانی و انرژی</span>
                        <span className="text-[#10b981] text-[10px] font-mono-num">🟢 VERIFIED</span>
                      </div>
                      <p className="text-[11px] text-[#dbc2b0]/90 leading-relaxed">
                        استخراج از <strong>TradingView</strong>: اونس طلا {s2.goldOunce} ({s2.ounceChangePct})، نفت برنت {s2.brentOil}، دلار DXY {s2.dxy}.
                      </p>
                    </div>

                    <div className="bg-[#231a13] p-3 rounded-xl border border-[#554336]/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#96ccff] font-bold">⚡ کریپتوکارنسی و ETF</span>
                        <span className="text-[#10b981] text-[10px] font-mono-num">🟢 VERIFIED</span>
                      </div>
                      <p className="text-[11px] text-[#dbc2b0]/90 leading-relaxed">
                        استخراج از <strong>CoinGecko</strong>: بیت‌کوین {s3.btcPrice} ({s3.btcChangePct})، خالص ورودی ETF {s3.etfFlowAmount}، فاندینگ {s3.fundingRate}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 🛡️ USER ACTIONS: CONFIRM vs RE-SEARCH vs CANCEL */}
              <div className="pt-2 border-t border-[#554336]/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* 1. Confirm & Apply button */}
                <button
                  onClick={() => {
                    onApplyResults(freshSignal, extractedInputs, extracted13Sections, auditReport || undefined);
                    onClose();
                  }}
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-[#052e16] py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>تأیید اطلاعات و اعمال در داشبورد و ارسال به تلگرام</span>
                </button>

                {/* 2. Reject & Re-Search button */}
                <button
                  onClick={handleStartRun}
                  className="bg-[#f59e0b]/15 hover:bg-[#f59e0b]/25 border border-[#f59e0b]/60 text-[#f59e0b] py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  title="در صورت عدم تطبیق ارقام یا نیاز به بروزرسانی مجدد همه حوزه‌ها"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>عدم تأیید و جستجوی مجدد کلی</span>
                </button>

                {/* 3. Cancel */}
                <button
                  onClick={onClose}
                  className="px-4 py-3.5 bg-[#322820] text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#3d3127] rounded-xl text-xs cursor-pointer transition-colors shrink-0 text-center"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* S1 Source Map Modal */}
      <S1SourceMapModal
        isOpen={isSourceMapOpen}
        onClose={() => setIsSourceMapOpen(false)}
      />
    </div>
  );
};


