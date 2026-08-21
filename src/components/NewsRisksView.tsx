import React, { useState } from 'react';
import { NewsItem, SystemicRiskItem, AiDailySummary, SystemS1Signal, SRIModel } from '../types';
import {
  Globe,
  TrendingUp,
  ShieldAlert,
  Landmark,
  Sparkles,
  Bot,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Layers,
  FileText,
  Activity,
  Flame,
  Zap,
  Filter,
  Sliders,
  Radio,
  Lock,
  Coins,
  DollarSign
} from 'lucide-react';
import { initialSRI } from '../data';

interface NewsRisksViewProps {
  news: NewsItem[];
  systemicRisks: SystemicRiskItem[];
  aiSummary: AiDailySummary;
  signal: SystemS1Signal;
  onRefreshAiAnalysis?: () => void;
}

export const NewsRisksView: React.FC<NewsRisksViewProps> = ({
  news,
  systemicRisks,
  aiSummary,
  signal,
  onRefreshAiAnalysis,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [currentAiSummary, setCurrentAiSummary] = useState<AiDailySummary>(aiSummary);
  
  // Interactive SRI Model State
  const [sri, setSri] = useState<SRIModel>(initialSRI);

  // Filtered news items
  const iranGlobalNews = news.filter((n) => n.category === 'iran_global');
  const cryptoBourseNews = news.filter((n) => n.category === 'crypto_bourse');
  const cbiSeoNews = news.filter((n) => n.category === 'cbi_seo');
  const geopoliticalNews = news.filter((n) => n.category === 'geopolitical');

  const handleUpdateSubRisk = (key: keyof SRIModel['subIndices'], value: number) => {
    const updatedSub = { ...sri.subIndices, [key]: value };
    const newOverall = Number(
      ((updatedSub.marketRisk +
        updatedSub.economicRisk +
        updatedSub.politicalRisk +
        updatedSub.systematicRisk +
        updatedSub.operationalRisk) /
        5).toFixed(1)
    );

    let level: 'low' | 'moderate' | 'high' | 'emergency' = 'moderate';
    let levelPersian = 'متوسط';
    let tacticalAdjust = 'پله‌های ورود استاندارد ۲۰٪ مجاز است';
    const isEmergency = newOverall >= 8.0;

    if (newOverall < 3.0) {
      level = 'low';
      levelPersian = 'پایین';
      tacticalAdjust = 'ورود تهاجمی‌تر با پله‌های استاندارد ۲۰٪';
    } else if (newOverall < 6.0) {
      level = 'moderate';
      levelPersian = 'متوسط';
      tacticalAdjust = 'حفظ پله‌های ۲۰٪ و مدیریت ریسک متعادل';
    } else if (newOverall < 8.0) {
      level = 'high';
      levelPersian = 'بالا';
      tacticalAdjust = 'کاهش پله‌های ورود از ۲۰٪ به ۱۰٪ و افزایش فاصله زمانی میان خریدها';
    } else {
      level = 'emergency';
      levelPersian = 'بحرانی / اضطراری (Emergency)';
      tacticalAdjust = 'توقف کامل خریدهای جدید؛ نقد کردن دارایی‌های آسیب‌پذیر طبق توالی جنگی';
    }

    setSri({
      ...sri,
      overallScore: newOverall,
      riskLevel: level,
      riskLevelPersian: levelPersian,
      isEmergencyMode: isEmergency,
      tacticalAdjustment: tacticalAdjust,
      subIndices: updatedSub,
    });
  };

  const handleRegenerateAi = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      setIsGeneratingAi(false);
      setCurrentAiSummary({
        ...currentAiSummary,
        generatedTimestamp: '1403/08/15 ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
      if (onRefreshAiAnalysis) onRefreshAiAnalysis();
    }, 1500);
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical':
      case 'emergency':
        return 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40';
      case 'high':
        return 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/40';
      case 'moderate':
        return 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40';
      case 'low':
        return 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40';
      default:
        return 'bg-[#9ca3af]/20 text-[#9ca3af] border-[#9ca3af]/40';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'critical':
        return 'بحرانی';
      case 'high':
        return 'بالا';
      case 'moderate':
        return 'متوسط';
      case 'low':
        return 'پایین و کنترل‌شده';
      default:
        return level;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-l from-[#2d1b10] via-[#231a13] to-[#1a120b] border border-[#554336] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#ffb77d]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d] border border-[#ffb77d]/30">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#f2dfd3] tracking-tight">
                    اخبار، ریسک‌های سیستماتیک و شاخص ریسک سیستم (SRI)
                  </h2>
                  <span className="px-2 py-0.5 text-[11px] bg-[#ffb77d]/20 text-[#ffb77d] font-bold rounded border border-[#ffb77d]/40">
                    S1 v1.3
                  </span>
                </div>
                <p className="text-xs text-[#dbc2b0]/80">
                  System Risk Index Formula, Emergency Protocol & AI Newsfeed
                </p>
              </div>
            </div>
          </div>

          {/* S1 Macro Status Indicator */}
          <div className="flex items-center gap-3 bg-[#1a120b] border border-[#554336] px-4 py-2.5 rounded-xl">
            <ShieldAlert className={`w-5 h-5 ${sri.isEmergencyMode ? 'text-[#ef4444] animate-pulse' : 'text-[#f59e0b]'}`} />
            <div className="text-xs text-right">
              <div className="text-[#dbc2b0]/70 text-[10px]">شاخص محاسبه‌شده SRI</div>
              <div className="font-bold text-[#ffb77d] font-mono-num text-sm">
                {sri.overallScore} از ۱۰ ({sri.riskLevelPersian})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive System Risk Index (SRI) Engine Box */}
      <div
        id="sri-engine-card"
        className={`p-6 rounded-2xl border transition-all ${
          sri.isEmergencyMode
            ? 'bg-[#2a1313] border-[#ef4444] shadow-2xl shadow-[#ef4444]/20'
            : 'bg-[#231a13] border-[#554336] shadow-lg'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#554336] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${sri.isEmergencyMode ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#ffb77d]/15 text-[#ffb77d]'}`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#f2dfd3]">
                  محاسبه‌گر شاخص ریسک سیستم (SRI Model)
                </h3>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#1a120b] text-[#ffb77d] border border-[#ffb77d]/30">
                  SRI = (A + B + C + D + E) / 5
                </span>
              </div>
              <p className="text-xs text-[#dbc2b0]/80 mt-0.5">
                ماتریس ۵ زیرشاخص: بازار، اقتصاد، سیاست، سیستماتیک و عملیاتی (۰ تا ۱۰)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${getRiskBadgeColor(sri.riskLevel)}`}>
              سطح ریسک: {sri.riskLevelPersian}
            </span>
          </div>
        </div>

        {/* Emergency Mode Banner if SRI >= 8 */}
        {sri.isEmergencyMode && (
          <div className="mb-6 p-4 rounded-xl bg-[#ef4444]/15 border-2 border-[#ef4444] text-[#f2dfd3] flex flex-col gap-2 animate-pulse">
            <div className="flex items-center gap-2 font-bold text-sm text-[#ef4444]">
              <AlertTriangle className="w-5 h-5" />
              <span>هشدار بحرانی: وضعیت اضطراری سیستم S1 فعال شد (SRI ≥ ۸)</span>
            </div>
            <p className="text-xs text-[#dbc2b0] leading-relaxed">
              طبق بند ۷-۲ کتابچه قانون S1: هرگونه خرید جدید ممنوع است. اولویت توالی نقدشوندگی در زمان بحران/جنگ به ترتیب زیر فعال است:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="p-2 rounded bg-[#1a120b] border border-[#ef4444]/40 font-bold text-[#10b981]">
                ۱. نقدینگی ریالی و افران
              </div>
              <div className="p-2 rounded bg-[#1a120b] border border-[#ef4444]/40 font-bold text-[#ffb77d]">
                ۲. طلای فیزیکی (سکه/شمش)
              </div>
              <div className="p-2 rounded bg-[#1a120b] border border-[#ef4444]/40 font-bold text-[#96ccff]">
                ۳. تتر در کیف پول سرد
              </div>
              <div className="p-2 rounded bg-[#1a120b] border border-[#ef4444]/40 font-bold text-[#ef4444]">
                ۴. خروج از سهام بورسی
              </div>
            </div>
          </div>
        )}

        {/* 5 Sub-indices Interactive Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
          {/* A: Market Risk */}
          <div className="p-3.5 rounded-xl bg-[#1a120b] border border-[#554336] flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#f2dfd3]">A: ریسک بازار</span>
              <span className="font-mono-num font-bold text-[#ffb77d]">{sri.subIndices.marketRisk}/۱۰</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={sri.subIndices.marketRisk}
              onChange={(e) => handleUpdateSubRisk('marketRisk', parseFloat(e.target.value))}
              className="w-full accent-[#ffb77d] cursor-pointer"
            />
            <span className="text-[10px] text-[#dbc2b0]/70">تراکنش‌ها و نوسان بورس</span>
          </div>

          {/* B: Economic Risk */}
          <div className="p-3.5 rounded-xl bg-[#1a120b] border border-[#554336] flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#f2dfd3]">B: ریسک اقتصادی</span>
              <span className="font-mono-num font-bold text-[#ffb77d]">{sri.subIndices.economicRisk}/۱۰</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={sri.subIndices.economicRisk}
              onChange={(e) => handleUpdateSubRisk('economicRisk', parseFloat(e.target.value))}
              className="w-full accent-[#ffb77d] cursor-pointer"
            />
            <span className="text-[10px] text-[#dbc2b0]/70">تورم، نرخ بهره و ارز</span>
          </div>

          {/* C: Political Risk */}
          <div className="p-3.5 rounded-xl bg-[#1a120b] border border-[#554336] flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#f2dfd3]">C: ریسک سیاسی</span>
              <span className="font-mono-num font-bold text-[#ffb77d]">{sri.subIndices.politicalRisk}/۱۰</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={sri.subIndices.politicalRisk}
              onChange={(e) => handleUpdateSubRisk('politicalRisk', parseFloat(e.target.value))}
              className="w-full accent-[#ffb77d] cursor-pointer"
            />
            <span className="text-[10px] text-[#dbc2b0]/70">تنش‌های منطقه‌ای و مذاکرات</span>
          </div>

          {/* D: Systematic Risk */}
          <div className="p-3.5 rounded-xl bg-[#1a120b] border border-[#554336] flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#f2dfd3]">D: ریسک سیستماتیک</span>
              <span className="font-mono-num font-bold text-[#ffb77d]">{sri.subIndices.systematicRisk}/۱۰</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={sri.subIndices.systematicRisk}
              onChange={(e) => handleUpdateSubRisk('systematicRisk', parseFloat(e.target.value))}
              className="w-full accent-[#ffb77d] cursor-pointer"
            />
            <span className="text-[10px] text-[#dbc2b0]/70">بحران‌های مالی فراگیر</span>
          </div>

          {/* E: Operational Risk */}
          <div className="p-3.5 rounded-xl bg-[#1a120b] border border-[#554336] flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#f2dfd3]">E: ریسک عملیاتی</span>
              <span className="font-mono-num font-bold text-[#ffb77d]">{sri.subIndices.operationalRisk}/۱۰</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={sri.subIndices.operationalRisk}
              onChange={(e) => handleUpdateSubRisk('operationalRisk', parseFloat(e.target.value))}
              className="w-full accent-[#ffb77d] cursor-pointer"
            />
            <span className="text-[10px] text-[#dbc2b0]/70">تراکنش، شبکه، پلتفرم‌ها</span>
          </div>
        </div>

        {/* Tactical Adjustment Directive */}
        <div className="p-3.5 rounded-xl bg-[#1a120b]/80 border border-[#554336]/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#ffb77d]" />
            <span className="text-[#dbc2b0]">دستور تاکتیکی پورتفو بر اساس SRI:</span>
            <span className="font-bold text-[#f2dfd3]">{sri.tacticalAdjustment}</span>
          </div>
          <span className="text-[11px] text-[#dbc2b0]/60 font-mono-num">
            SRI: {sri.overallScore} | آستانه پله ۱۰٪: SRI &ge; ۶
          </span>
        </div>
      </div>

      {/* 3. Four Dedicated News & Risk Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: مهمترین اخبار اقتصاد ایران و جهان */}
        <div className="bg-[#231a13] border border-[#554336] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#554336]/60 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#f2dfd3]">
                    مهم‌ترین اخبار اقتصاد ایران و جهان
                  </h3>
                  <span className="text-[11px] text-[#dbc2b0]/70">Macroeconomic & Global Highlights</span>
                </div>
              </div>
              <span className="text-[11px] bg-[#3e332b] text-[#ffb77d] px-2 py-0.5 rounded font-mono-num">
                {iranGlobalNews.length} رویداد
              </span>
            </div>

            <div className="space-y-3">
              {iranGlobalNews.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#1a120b] border border-[#554336]/50 rounded-xl p-3.5 space-y-2 hover:border-[#ffb77d]/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#f2dfd3] leading-snug">
                      {item.title}
                    </h4>
                    <span className="shrink-0 text-[10px] text-[#ffb77d] bg-[#ffb77d]/10 px-2 py-0.5 rounded font-mono-num">
                      {item.timeJalali}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#dbc2b0] leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="bg-[#271e16] p-2 rounded-lg text-[10px] text-[#96ccff] border border-[#554336]/30 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-[#ffb77d] shrink-0" />
                    <span><strong>تحلیل اثرگذاری S1:</strong> {item.impactAnalysis}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#dbc2b0]/70 pt-1">
                    <span>منبع: {item.source}</span>
                    <div className="flex gap-1">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="bg-[#3e332b] px-1.5 py-0.5 rounded text-[#dbc2b0]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: اخبار بازار کریپتو و بورس تهران */}
        <div className="bg-[#231a13] border border-[#554336] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#554336]/60 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#96ccff]/15 text-[#96ccff]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#f2dfd3]">
                    اخبار بازار کریپتو و بورس تهران
                  </h3>
                  <span className="text-[11px] text-[#dbc2b0]/70">Equities, Funds & Crypto Ecosystem</span>
                </div>
              </div>
              <span className="text-[11px] bg-[#3e332b] text-[#96ccff] px-2 py-0.5 rounded font-mono-num">
                {cryptoBourseNews.length} رویداد
              </span>
            </div>

            <div className="space-y-3">
              {cryptoBourseNews.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#1a120b] border border-[#554336]/50 rounded-xl p-3.5 space-y-2 hover:border-[#96ccff]/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#f2dfd3] leading-snug">
                      {item.title}
                    </h4>
                    <span className="shrink-0 text-[10px] text-[#96ccff] bg-[#96ccff]/10 px-2 py-0.5 rounded font-mono-num">
                      {item.timeJalali}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#dbc2b0] leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="bg-[#271e16] p-2 rounded-lg text-[10px] text-[#10b981] border border-[#554336]/30 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-[#10b981] shrink-0" />
                    <span><strong>تحلیل اثرگذاری S1:</strong> {item.impactAnalysis}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#dbc2b0]/70 pt-1">
                    <span>منبع: {item.source}</span>
                    <div className="flex gap-1">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="bg-[#3e332b] px-1.5 py-0.5 rounded text-[#dbc2b0]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: تصمیمات بانک مرکزی و سازمان بورس */}
        <div className="bg-[#231a13] border border-[#554336] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#554336]/60 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#10b981]/15 text-[#10b981]">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#f2dfd3]">
                    تصمیمات بانک مرکزی و سازمان بورس
                  </h3>
                  <span className="text-[11px] text-[#dbc2b0]/70">Central Bank & Regulatory Policies</span>
                </div>
              </div>
              <span className="text-[11px] bg-[#3e332b] text-[#10b981] px-2 py-0.5 rounded font-mono-num">
                {cbiSeoNews.length} مصوبه
              </span>
            </div>

            <div className="space-y-3">
              {cbiSeoNews.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#1a120b] border border-[#554336]/50 rounded-xl p-3.5 space-y-2 hover:border-[#10b981]/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#f2dfd3] leading-snug">
                      {item.title}
                    </h4>
                    <span className="shrink-0 text-[10px] text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded font-mono-num">
                      {item.timeJalali}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#dbc2b0] leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="bg-[#271e16] p-2 rounded-lg text-[10px] text-[#ffb77d] border border-[#554336]/30 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-[#ffb77d] shrink-0" />
                    <span><strong>تحلیل اثرگذاری S1:</strong> {item.impactAnalysis}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#dbc2b0]/70 pt-1">
                    <span>منبع: {item.source}</span>
                    <div className="flex gap-1">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="bg-[#3e332b] px-1.5 py-0.5 rounded text-[#dbc2b0]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: وضعیت ریسک‌های سیاسی و نظامی */}
        <div className="bg-[#231a13] border border-[#554336] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#554336]/60 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#f87171]/15 text-[#f87171]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#f2dfd3]">
                    وضعیت ریسک‌های سیاسی و نظامی
                  </h3>
                  <span className="text-[11px] text-[#dbc2b0]/70">Geopolitical & Systematic Risk Matrix</span>
                </div>
              </div>
              <span className="text-[11px] bg-[#3e332b] text-[#f87171] px-2 py-0.5 rounded font-mono-num">
                {systemicRisks.length} شاخص پایش
              </span>
            </div>

            <div className="space-y-3">
              {systemicRisks.map((risk) => (
                <div
                  key={risk.id}
                  className="bg-[#1a120b] border border-[#554336]/50 rounded-xl p-3.5 space-y-2 hover:border-[#f87171]/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getRiskBadgeColor(
                          risk.riskLevel
                        )}`}
                      >
                        سطح: {getRiskLabel(risk.riskLevel)}
                      </span>
                      <h4 className="text-xs font-bold text-[#f2dfd3]">{risk.title}</h4>
                    </div>
                    <span className="text-xs font-mono-num font-bold text-[#f87171]">
                      نمره: {risk.riskScore}٪
                    </span>
                  </div>

                  <p className="text-[11px] text-[#dbc2b0] leading-relaxed">
                    {risk.summary}
                  </p>

                  <div className="bg-[#271e16] p-2 rounded-lg text-[10px] text-[#ffb77d] border border-[#554336]/30 space-y-1">
                    <div className="font-semibold text-[#f2dfd3] flex items-center gap-1">
                      <Shield className="w-3 h-3 text-[#10b981]" />
                      <span>راهکار پدافندی و پوشش ریسک در پورتفو:</span>
                    </div>
                    <p className="text-[#dbc2b0]">{risk.mitigationStrategy}</p>
                  </div>

                  <div className="text-[10px] text-[#96ccff] pt-0.5">
                    دارایی‌های متأثر: {risk.affectedAssets}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Large AI Synthesis & Daily Executive Summary Box */}
      <div className="bg-gradient-to-br from-[#271e16] via-[#231a13] to-[#1a120b] border-2 border-[#ffb77d]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffb77d]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header of the AI Box */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#554336] pb-5 relative">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#ffb77d] text-[#1a120b] shadow-lg shadow-[#ffb77d]/20">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-[#f2dfd3]">
                  خلاصه تحلیل و جمع‌بندی هوش مصنوعی S1
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 bg-[#ffb77d]/20 text-[#ffb77d] border border-[#ffb77d]/40 rounded-full font-bold">
                  تحلیل جامع روز
                </span>
              </div>
              <p className="text-xs text-[#dbc2b0]/80 mt-0.5">
                تلفیق الگوریتمی داده‌های زنده بازار، مدل‌های رگرسیون ریسک SRI و مدل زبانی اختصاصی S1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleRegenerateAi}
              disabled={isGeneratingAi}
              className="px-4 py-2.5 bg-[#3e332b] hover:bg-[#322820] text-[#ffb77d] border border-[#ffb77d]/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              {isGeneratingAi ? 'در حال بازتحلیل داده‌ها...' : 'بروزرسانی تحلیل هوش مصنوعی'}
            </button>
          </div>
        </div>

        {/* Market Regime & Sentiment Meter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#1a120b] border border-[#554336] p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#10b981]/15 text-[#10b981]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#dbc2b0]">رژیم فعلی بازار:</div>
              <div className="text-sm font-bold text-[#ffb77d]">{currentAiSummary.regimePersian}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#dbc2b0]">شاخص سنتیمنت ترکیبی S1:</div>
              <div className="text-sm font-bold text-[#10b981] font-mono-num">
                {currentAiSummary.overallSentimentScore} از ۱۰۰ (صعودی پایدار)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#96ccff]/15 text-[#96ccff]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#dbc2b0]">زمان آخرین ارزیابی:</div>
              <div className="text-xs font-mono-num font-bold text-[#f2dfd3]">
                {currentAiSummary.generatedTimestamp}
              </div>
            </div>
          </div>
        </div>

        {/* Core Analysis Sections */}
        <div className="space-y-4 text-xs text-[#f2dfd3]">
          {/* Executive Summary */}
          <div className="bg-[#1a120b]/80 border border-[#554336] p-4 rounded-2xl space-y-2">
            <div className="font-bold text-[#ffb77d] flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              <span>خلاصه اجرایی و پیام اصلی مدل:</span>
            </div>
            <p className="text-[#dbc2b0] leading-relaxed text-xs sm:text-[13px]">
              {currentAiSummary.executiveSummary}
            </p>
          </div>

          {/* 3 Split Cards for Sector Outlooks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1a120b] border border-[#554336]/70 p-4 rounded-2xl space-y-2">
              <div className="font-bold text-[#ffb77d] flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>اقتصاد کلان و سیاست ارزی</span>
              </div>
              <p className="text-[#dbc2b0] leading-relaxed text-[11px]">
                {currentAiSummary.macroEconomicView}
              </p>
            </div>

            <div className="bg-[#1a120b] border border-[#554336]/70 p-4 rounded-2xl space-y-2">
              <div className="font-bold text-[#96ccff] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>بورس تهران و بازار کریپتو</span>
              </div>
              <p className="text-[#dbc2b0] leading-relaxed text-[11px]">
                {currentAiSummary.bourseAndCryptoOutlook}
              </p>
            </div>

            <div className="bg-[#1a120b] border border-[#554336]/70 p-4 rounded-2xl space-y-2">
              <div className="font-bold text-[#fbbf24] flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                <span>طلا، مسکوکات و بازار ارز</span>
              </div>
              <p className="text-[#dbc2b0] leading-relaxed text-[11px]">
                {currentAiSummary.goldAndForexOutlook}
              </p>
            </div>
          </div>

          {/* Tactical Action Plan */}
          <div className="bg-[#1a120b] border border-[#554336] p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#554336]/60 pb-2">
              <div className="font-bold text-[#f2dfd3] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#ffb77d]" />
                <span>برنامه اقدام عملیاتی و چینش سبد پورتفوی کاغذی (Tactical Steps):</span>
              </div>
              <span className="text-[10px] text-[#dbc2b0]/70">توصیه‌های اقدام‌محور</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentAiSummary.tacticalPlan.map((plan) => (
                <div
                  key={plan.priority}
                  className="bg-[#271e16] border border-[#554336]/60 p-3 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffb77d]/20 text-[#ffb77d] font-bold">
                      اولویت {plan.priority}: {plan.targetAsset}
                    </span>
                    <span className="text-[10px] text-[#dbc2b0]/70 font-mono-num">{plan.timeframe}</span>
                  </div>
                  <div className="font-semibold text-[#f2dfd3] text-xs">{plan.step}</div>
                  <div className="text-[11px] text-[#dbc2b0] leading-relaxed">{plan.rationale}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Rules & Discipline Box */}
          <div className="bg-[#271e16] border border-[#554336]/60 p-4 rounded-2xl space-y-2">
            <div className="font-bold text-[#10b981] flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>قوانین انضباطی موتور S1 جهت جلوگیری از افت سرمایه (Drawdown):</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#dbc2b0] list-disc list-inside">
              {currentAiSummary.keyRules.map((rule, idx) => (
                <li key={idx} className="leading-relaxed">
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="pt-2 border-t border-[#554336] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#dbc2b0]/60 gap-2">
          <span>امضای موتور تحلیل: {currentAiSummary.aiModelSignature}</span>
          <span className="font-mono-num">شناسه رهگیری داده: S1-AI-SYNTH-84920</span>
        </div>
      </div>
    </div>
  );
};
