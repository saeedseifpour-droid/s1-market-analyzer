import React, { useState } from 'react';
import {
  S1_FULL_SOURCE_MAP,
  S1CategoryGroup,
  S1SourceItem,
  buildS1GroundingSearchPrompt,
} from '../utils/s1SourceMap';
import {
  X,
  Database,
  ExternalLink,
  ShieldCheck,
  Search,
  Copy,
  Check,
  Globe,
  Radio,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { getLiveJalaliDetails } from '../utils/dateHelper';

interface S1SourceMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const S1SourceMapModal: React.FC<S1SourceMapModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  const todayDetails = getLiveJalaliDetails(0);

  const filteredCategories: S1CategoryGroup[] = S1_FULL_SOURCE_MAP.map((cat) => {
    if (activeCategory !== 'all' && cat.number !== activeCategory) {
      return { ...cat, items: [] };
    }
    const filteredItems = cat.items.filter((item) => {
      const q = searchTerm.toLowerCase();
      return (
        item.nameFa.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.groundingDomain.toLowerCase().includes(q) ||
        item.apiEndpoint.toLowerCase().includes(q) ||
        (item.notesFa && item.notesFa.toLowerCase().includes(q))
      );
    });
    return { ...cat, items: filteredItems };
  }).filter((cat) => cat.items.length > 0);

  const totalItemsCount = S1_FULL_SOURCE_MAP.reduce((acc, cat) => acc + cat.items.length, 0);

  const handleCopyPrompt = () => {
    const prompt = buildS1GroundingSearchPrompt(todayDetails.verbose, todayDetails.miladiDate);
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#1a120b] border border-[#ffb77d]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#231a13] via-[#322820] to-[#231a13] px-5 py-4 border-b border-[#ffb77d]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffb77d]/15 border border-[#ffb77d]/30 flex items-center justify-center text-[#ffb77d]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#f2dfd3]">
                  نقشه جامع مراجع و APIهای سیستم S1
                </h2>
                <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 px-2 py-0.5 rounded-full font-mono-num font-bold">
                  Google Studio / Grounding Edition
                </span>
              </div>
              <p className="text-xs text-[#dbc2b0]/80">
                نگاشت ۱۰ دسته‌بندی مراجع معتبر، دامنه‌های استعلام سرچ و نقاط پایانی API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#dbc2b0] hover:text-[#f2dfd3] hover:bg-[#ffb77d]/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 bg-[#231a13]/70 border-b border-[#ffb77d]/15 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#dbc2b0]/60 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در نمادها، دامنه‌ها (TSETMC, CoinGlass, AFRAN, XAUUSD)..."
              className="w-full bg-[#1a120b] border border-[#ffb77d]/20 text-xs text-[#f2dfd3] pr-9 pl-3 py-2 rounded-xl outline-none focus:border-[#ffb77d]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 text-xs bg-[#ffb77d]/15 hover:bg-[#ffb77d]/25 border border-[#ffb77d]/40 text-[#ffb77d] px-3 py-2 rounded-xl transition-all font-bold"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'پرامپت کپی شد' : 'کپی پرامپت Grounding روز'}</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-4 py-2.5 bg-[#1a120b] border-b border-[#ffb77d]/10 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-[#ffb77d] text-[#1a120b]'
                : 'bg-[#231a13] text-[#dbc2b0] hover:text-[#f2dfd3]'
            }`}
          >
            همه مراجع ({totalItemsCount})
          </button>
          {S1_FULL_SOURCE_MAP.map((cat) => (
            <button
              key={cat.number}
              onClick={() => setActiveCategory(cat.number)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.number
                  ? 'bg-[#ffb77d] text-[#1a120b] font-bold'
                  : 'bg-[#231a13] text-[#dbc2b0] hover:text-[#f2dfd3]'
              }`}
            >
              بخش {cat.number}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#dbc2b0]/60">
              هیچ مرجعی با عبارت جستجوی شما یافت نشد.
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div
                key={category.number}
                className="bg-[#231a13]/80 border border-[#ffb77d]/20 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Category Header */}
                <div className="bg-gradient-to-r from-[#322820] to-[#231a13] px-4 py-3 border-b border-[#ffb77d]/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#ffb77d]/20 text-[#ffb77d] text-xs font-bold flex items-center justify-center font-mono-num">
                      {category.number}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#f2dfd3]">{category.titleFa}</h3>
                  </div>
                  <span className="text-[10px] text-[#dbc2b0]/70 font-mono hidden sm:inline">
                    {category.titleEn}
                  </span>
                </div>

                {/* Items Grid */}
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#1a120b] border border-[#ffb77d]/10 hover:border-[#ffb77d]/30 rounded-xl p-3 flex flex-col justify-between space-y-2.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-[#f2dfd3] flex items-center gap-1.5">
                            <span>{item.nameFa}</span>
                            <span className="text-[10px] font-mono text-[#dbc2b0]/60">({item.nameEn})</span>
                          </div>
                          {item.notesFa && (
                            <div className="text-[10px] text-[#dbc2b0]/70 mt-1 leading-relaxed">
                              {item.notesFa}
                            </div>
                          )}
                        </div>
                        {item.requiresIranProxy ? (
                          <span className="shrink-0 text-[9px] bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono-num">
                            <Lock className="w-2.5 h-2.5" />
                            پروکسی ایران
                          </span>
                        ) : (
                          <span className="shrink-0 text-[9px] bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono-num">
                            <Globe className="w-2.5 h-2.5" />
                            دسترسی مستقیم
                          </span>
                        )}
                      </div>

                      {/* Endpoints & Grounding */}
                      <div className="space-y-1.5 pt-1 text-[10px] border-t border-[#ffb77d]/10">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#dbc2b0]/60 flex items-center gap-1">
                            <Radio className="w-3 h-3 text-[#ffb77d]" />
                            API مستقیم:
                          </span>
                          <span className="font-mono text-[9px] text-[#ffb77d] truncate max-w-[220px]" title={item.apiEndpoint}>
                            {item.apiEndpoint}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#dbc2b0]/60 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#38bdf8]" />
                            منبع Grounding:
                          </span>
                          <a
                            href={item.groundingSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[9px] text-[#38bdf8] hover:underline flex items-center gap-1 truncate max-w-[220px]"
                          >
                            <span>{item.groundingDomain}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#231a13] px-5 py-3 border-t border-[#ffb77d]/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#dbc2b0]/80 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            <span>پوشش کامل ۱۰ حوزه بر اساس چارچوب رسمی صحه‌گذاری S1</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#ffb77d] hover:bg-[#ffaa66] text-[#1a120b] font-bold rounded-xl text-xs transition-all"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
