import React, { useState } from 'react';
import { InputMetric, DailyChecklistItem } from '../types';
import {
  Search,
  Filter,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Clock,
  Layers,
  Edit3,
  CheckSquare,
  Square,
  ShieldCheck,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { initialDailyChecklist } from '../data';

interface InputsViewProps {
  inputs: InputMetric[];
  onUpdateInputs: (updatedInputs: InputMetric[]) => void;
  onRecalculateEngine: (inputs: InputMetric[]) => void;
}

export const InputsView: React.FC<InputsViewProps> = ({
  inputs,
  onUpdateInputs,
  onRecalculateEngine,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [localInputs, setLocalInputs] = useState<InputMetric[]>(inputs);
  const [checklist, setChecklist] = useState<DailyChecklistItem[]>(initialDailyChecklist);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'همه ورودی‌ها (۴۱ پارامتر)' },
    { id: 'bourse', label: 'بورس و سهام' },
    { id: 'gold', label: 'طلا و مسکوکات' },
    { id: 'crypto', label: 'رمزارزها' },
    { id: 'forex', label: 'ارز و تتر' },
    { id: 'macro', label: 'کلان و نرخ بهره' },
  ];

  const handleValueChange = (id: string, newValue: string) => {
    setLocalInputs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value: newValue } : item))
    );
  };

  const handleScoreChange = (id: string, newScore: number) => {
    setLocalInputs((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              scoreContribution: newScore,
              status: newScore >= 7 ? 'bullish' : newScore <= 4 ? 'bearish' : 'neutral',
            }
          : item
      )
    );
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const handleSaveAndCompute = () => {
    onUpdateInputs(localInputs);
    onRecalculateEngine(localInputs);
    setToastMessage('داده‌های ورودی با موفقیت ذخیره و موتور S1 مجدداً محاسبه شد.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const applyPreset = (presetType: 'bullish' | 'base' | 'bearish') => {
    let modified = [...localInputs];
    if (presetType === 'bullish') {
      modified = modified.map((m) => {
        if (m.category === 'bourse' || m.category === 'gold') {
          return { ...m, scoreContribution: Math.min(10, m.scoreContribution + 2), status: 'bullish' };
        }
        return m;
      });
    } else if (presetType === 'bearish') {
      modified = modified.map((m) => {
        if (m.category === 'bourse' || m.category === 'crypto') {
          return { ...m, scoreContribution: Math.max(2, m.scoreContribution - 3), status: 'bearish' };
        }
        return m;
      });
    } else {
      // base
      modified = inputs;
    }
    setLocalInputs(modified);
    setToastMessage(`سناریوی "${presetType === 'bullish' ? 'صعودی پرقدرت' : presetType === 'bearish' ? 'احتیاطی و اصلاحی' : 'پایه و تعادلی'}" اعمال گردید.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredInputs = localInputs.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completedChecklistCount = checklist.filter((c) => c.isCompleted).length;
  const isChecklistFullyDone = completedChecklistCount === checklist.length;

  return (
    <div className="flex flex-col w-full gap-6 animate-fade-in">
      {/* Toast alert */}
      {toastMessage && (
        <div className="bg-[#10b981]/20 border border-[#10b981] text-[#10b981] px-4 py-3 rounded-xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Daily 11-Step S1 Checklist Section (ساعت ۱۷:۰۰ الی ۱۸:۰۰ طبق ماده ۱۱) */}
      <div className="bg-[#231a13] border border-[#554336] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#554336] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#f2dfd3]">
                  چک‌لیست روزانه ۱۱ مرحله‌ای سیستم S1 (ماده ۱۱)
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-[#10b981]/20 text-[#10b981] text-xs font-mono font-bold">
                  ساعت ۱۷:۰۰ الی ۱۸:۰۰
                </span>
              </div>
              <p className="text-xs text-[#dbc2b0]/80 mt-0.5">
                تکمیل گام‌های این چک‌لیست قبل از تصمیم‌گیری نهایی خرید/فروش الزامی است.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-right">
              <span className="text-xs text-[#dbc2b0]/70">پیشرفت چک‌لیست:</span>
              <div className="text-sm font-bold text-[#ffb77d] font-mono-num">
                {completedChecklistCount} از ۱۱ مرحله
              </div>
            </div>
            <div className="w-24 h-2 bg-[#1a120b] rounded-full overflow-hidden border border-[#554336]">
              <div
                className="h-full bg-[#10b981] transition-all duration-500"
                style={{ width: `${(completedChecklistCount / checklist.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 11 Steps Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleChecklist(item.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                item.isCompleted
                  ? 'bg-[#1a120b]/90 border-[#10b981]/40 text-[#f2dfd3]'
                  : 'bg-[#1a120b]/40 border-[#554336]/60 text-[#dbc2b0] hover:border-[#ffb77d]/40'
              }`}
            >
              <button className="mt-0.5 shrink-0 text-[#10b981]">
                {item.isCompleted ? (
                  <CheckSquare className="w-4 h-4 text-[#10b981]" />
                ) : (
                  <Square className="w-4 h-4 text-[#dbc2b0]/50" />
                )}
              </button>

              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#ffb77d] font-mono-num">
                    گام {item.stepNumber}:
                  </span>
                  <span className={`text-xs font-semibold ${item.isCompleted ? 'text-[#f2dfd3]' : 'text-[#dbc2b0]'}`}>
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-[#dbc2b0]/70 leading-relaxed">{item.description}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[#dbc2b0]/50">
                  <span>منبع: {item.source}</span>
                  <span>•</span>
                  <span>زمان: {item.timeWindow}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top Banner & Control Bar for 41 Inputs */}
      <div className="bg-[#271e16] border border-[#554336] rounded-2xl p-5 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#f2dfd3] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#ffb77d]" />
            جدول ورودی‌های ۴۱ گانه موتور S1 (Daily Inputs)
          </h2>
          <p className="text-xs text-[#dbc2b0] mt-1">
            پارامترهای بازار به صورت خودکار از سامانه‌های معاملاتی جمع‌آوری شده یا توسط مدیر سیستم قابل ویرایش هستند.
          </p>
        </div>

        {/* Action buttons & Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-[#1a120b] p-1 rounded-xl border border-[#554336] text-xs">
            <button
              onClick={() => applyPreset('bullish')}
              className="px-2.5 py-1.5 rounded-lg text-[#10b981] hover:bg-[#322820] transition-colors font-medium"
              title="اعمال سناریوی رونق و صعود پرقدرت"
            >
              سناریو صعودی
            </button>
            <button
              onClick={() => applyPreset('base')}
              className="px-2.5 py-1.5 rounded-lg text-[#ffb77d] hover:bg-[#322820] transition-colors font-medium"
              title="بازنشانی به مقادیر پایه امروز"
            >
              سناریو تعادلی
            </button>
            <button
              onClick={() => applyPreset('bearish')}
              className="px-2.5 py-1.5 rounded-lg text-[#ffb4ab] hover:bg-[#322820] transition-colors font-medium"
              title="اعمال سناریوی احتیاط و نزولی"
            >
              سناریو نزولی
            </button>
          </div>

          <button
            onClick={handleSaveAndCompute}
            className="bg-[#ffb77d] text-[#4d2600] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#d97707] transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            ذخیره و محاسبه S1
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#ffb77d] text-[#1a120b] font-bold shadow-md'
                  : 'bg-[#271e16] text-[#dbc2b0] hover:bg-[#322820] border border-[#554336]/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#dbc2b0]/60 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی پارامتر..."
            className="w-full bg-[#271e16] border border-[#554336] rounded-xl pr-9 pl-4 py-2 text-xs text-[#f2dfd3] placeholder-[#dbc2b0]/50 outline-none focus:border-[#ffb77d]"
          />
        </div>
      </div>

      {/* Inputs Table */}
      <div className="bg-[#271e16] border border-[#554336] rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#1a120b] text-[#dbc2b0] border-b border-[#554336] font-medium">
              <tr>
                <th className="p-3.5 pr-5">عنوان پارامتر</th>
                <th className="p-3.5">کد شاخص</th>
                <th className="p-3.5">دسته‌بندی</th>
                <th className="p-3.5">مقدار زنده</th>
                <th className="p-3.5">ضریب امتیاز (۱ تا ۱۰)</th>
                <th className="p-3.5">وضعیت روند</th>
                <th className="p-3.5">وزن الگوریتم</th>
                <th className="p-3.5 pl-5">زمان آخرین استخراج</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#554336]/30 text-[#f2dfd3]">
              {filteredInputs.map((item) => {
                const isBull = item.status === 'bullish';
                const isBear = item.status === 'bearish';
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#322820]/70 transition-colors group"
                  >
                    <td className="p-3.5 pr-5 font-semibold">
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        <span className="text-[10px] text-[#dbc2b0]/60 font-normal">
                          {item.description}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono-num text-[#96ccff] text-[11px]">
                      {item.code}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#3e332b] text-[#dbc2b0] text-[10px]">
                        {item.categoryLabel}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => handleValueChange(item.id, e.target.value)}
                          className="w-28 bg-[#1a120b] border border-[#554336] rounded-lg px-2 py-1 text-xs text-[#ffb77d] font-mono-num outline-none focus:border-[#ffb77d]"
                        />
                        <span className="text-[10px] text-[#dbc2b0]/70">{item.unit}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={item.scoreContribution}
                          onChange={(e) =>
                            handleScoreChange(item.id, parseInt(e.target.value))
                          }
                          className="w-20 accent-[#ffb77d] cursor-pointer"
                        />
                        <span className="font-mono-num font-bold text-xs w-5 text-center text-[#ffb77d]">
                          {item.scoreContribution}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isBull
                            ? 'bg-[#10b981]/15 text-[#10b981]'
                            : isBear
                            ? 'bg-[#ffb4ab]/15 text-[#ffb4ab]'
                            : 'bg-[#c2c7d0]/15 text-[#c2c7d0]'
                        }`}
                      >
                        {isBull ? 'صعودی (Bull)' : isBear ? 'نزولی (Bear)' : 'خنثی (Neutral)'}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono-num text-[11px] text-[#dbc2b0]">
                      {Math.round(item.weight * 100)}٪
                    </td>

                    <td className="p-3.5 pl-5 font-mono-num text-[11px] text-[#dbc2b0]/70">
                      {item.lastUpdated}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
