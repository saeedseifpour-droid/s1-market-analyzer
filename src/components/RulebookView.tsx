import React, { useState } from 'react';
import {
  BookOpen,
  Shield,
  Sliders,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Layers,
  ArrowRightLeft,
  Flame,
  Info,
  DollarSign
} from 'lucide-react';
import { s1RulebookSections } from '../data';

export const RulebookView: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>('s1-sec-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const getSectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield':
        return <Shield className="w-5 h-5 text-[#ffb77d]" />;
      case 'sliders':
        return <Sliders className="w-5 h-5 text-[#10b981]" />;
      case 'wallet':
        return <Wallet className="w-5 h-5 text-[#96ccff]" />;
      case 'alert-triangle':
        return <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />;
      case 'check-circle-2':
        return <CheckCircle2 className="w-5 h-5 text-[#10b981]" />;
      default:
        return <FileText className="w-5 h-5 text-[#ffb77d]" />;
    }
  };

  const filteredSections = s1RulebookSections.filter((section) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.subtitle.toLowerCase().includes(query) ||
      section.paragraphs.some(
        (p) =>
          p.heading?.toLowerCase().includes(query) ||
          p.text.toLowerCase().includes(query) ||
          p.bulletPoints?.some((bp) => bp.toLowerCase().includes(query))
      )
    );
  });

  const handleCopySection = (title: string, text: string) => {
    navigator.clipboard.writeText(`${title}\n\n${text}`);
    setCopiedSection(title);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div id="rulebook-view" className="flex flex-col gap-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 lg:p-8 rounded-2xl bg-gradient-to-r from-[#2a1d13] via-[#231a13] to-[#1a120b] border border-[#554336] shadow-xl relative overflow-hidden">
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-[#ffb77d]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold bg-[#ffb77d]/15 text-[#ffb77d] border border-[#ffb77d]/30 rounded-lg flex items-center gap-1.5 font-mono-num">
                <BookOpen className="w-3.5 h-3.5" />
                S1 VERSION 1.3
              </span>
              <span className="text-xs text-[#dbc2b0]/70 font-mono-num">دستورالعمل رسمی هوش مصنوعی</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#f2dfd3] tracking-tight">
              کتابچه قانون و استراتژی سیستم S1
            </h1>
            <p className="text-sm text-[#dbc2b0]/90 leading-relaxed">
              سیستم S1 یک سیستم معامله‌گری نیست؛ بلکه یک سیستم جامع «مدیریت سرمایه و ریسک» با اولویت بقای اصل سرمایه، حذف احساسات و انضباط ریاضی است.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#dbc2b0]/60 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجو در قوانین و فرمول‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#1a120b] border border-[#554336] text-xs text-[#f2dfd3] placeholder-[#dbc2b0]/40 focus:outline-none focus:border-[#ffb77d]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar (Chapters list) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-[#231a13] border border-[#554336]">
            <h2 className="text-sm font-bold text-[#ffb77d] mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              فهرست فصول دستورالعمل S1
            </h2>

            <div className="flex flex-col gap-2">
              {s1RulebookSections.map((sec) => {
                const isSelected = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    id={`chapter-btn-${sec.id}`}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`w-full text-right p-3 rounded-xl transition-all flex items-start gap-3 border ${
                      isSelected
                        ? 'bg-[#3e332b] border-[#ffb77d] text-[#f2dfd3] shadow-md'
                        : 'bg-[#1a120b]/60 border-[#554336]/60 text-[#dbc2b0] hover:bg-[#2e231a] hover:border-[#ffb77d]/40'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[#1a120b] border border-[#554336]/80 shrink-0 mt-0.5">
                      {getSectionIcon(sec.iconName)}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#ffb77d] font-mono-num">{sec.sectionNumber}</span>
                        <span className="text-xs font-semibold truncate text-[#f2dfd3]">{sec.title}</span>
                      </div>
                      <p className="text-[11px] text-[#dbc2b0]/70 truncate">{sec.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Rules Card */}
          <div className="p-4 rounded-2xl bg-[#1a120b] border border-[#554336] flex flex-col gap-3">
            <span className="text-xs font-bold text-[#f2dfd3] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#96ccff]" />
              خلاصه ۵ خروجی مجاز سیستم
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-[#231a13] border border-[#10b981]/30 text-[#10b981] font-semibold">
                🟢 خرید (Buy)
              </div>
              <div className="p-2 rounded-lg bg-[#231a13] border border-[#10b981]/30 text-[#10b981] font-semibold">
                🟢 خرید پله‌ای (۲۰٪)
              </div>
              <div className="p-2 rounded-lg bg-[#231a13] border border-[#f59e0b]/30 text-[#f59e0b] font-semibold">
                🟡 نگهداری (Hold)
              </div>
              <div className="p-2 rounded-lg bg-[#231a13] border border-[#fb923c]/30 text-[#fb923c] font-semibold">
                🟠 سیو سود (TP)
              </div>
              <div className="p-2 rounded-lg bg-[#231a13] border border-[#ef4444]/30 text-[#ef4444] font-semibold">
                🔴 فروش (Sell)
              </div>
              <div className="p-2 rounded-lg bg-[#231a13] border border-[#9ca3af]/30 text-[#9ca3af] font-semibold">
                ⚪ عدم اقدام (No Action)
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Chapter Reading Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {filteredSections.map((section) => {
            if (section.id !== activeSectionId && searchQuery.trim() === '') return null;

            return (
              <div
                key={section.id}
                id={`rulebook-section-card-${section.id}`}
                className="p-6 lg:p-8 rounded-2xl bg-[#231a13] border border-[#554336] shadow-md flex flex-col gap-6"
              >
                {/* Chapter Header */}
                <div className="flex items-start justify-between border-b border-[#554336] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#1a120b] border border-[#554336]">
                      {getSectionIcon(section.iconName)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#ffb77d] font-mono-num">{section.sectionNumber}</span>
                      <h2 className="text-xl font-bold text-[#f2dfd3]">{section.title}</h2>
                      <span className="text-xs text-[#dbc2b0]/80">{section.subtitle}</span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleCopySection(
                        `${section.sectionNumber}: ${section.title}`,
                        section.paragraphs.map((p) => `${p.heading || ''}\n${p.text}\n${p.bulletPoints?.join('\n') || ''}`).join('\n\n')
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a120b] border border-[#554336] text-xs text-[#dbc2b0] hover:text-[#ffb77d] hover:border-[#ffb77d]/50 transition-colors"
                  >
                    {copiedSection === `${section.sectionNumber}: ${section.title}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#10b981]" />
                        <span>کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی متن</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Paragraphs and clauses */}
                <div className="flex flex-col gap-6 text-sm text-[#f2dfd3]/95 leading-relaxed">
                  {section.paragraphs.map((para, idx) => (
                    <div key={idx} className="flex flex-col gap-2.5 bg-[#1a120b]/50 p-4 lg:p-5 rounded-xl border border-[#554336]/50">
                      {para.heading && (
                        <h3 className="text-base font-bold text-[#ffb77d] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#ffb77d]" />
                          {para.heading}
                        </h3>
                      )}
                      
                      <p className="text-[#dbc2b0] leading-relaxed text-justify">{para.text}</p>

                      {para.formula && (
                        <div className="p-3 my-2 rounded-lg bg-[#1a120b] border border-[#ffb77d]/40 text-center font-mono text-[#ffb77d] text-sm md:text-base font-bold shadow-inner">
                          {para.formula}
                        </div>
                      )}

                      {para.warning && (
                        <div className="p-3 my-1 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/40 text-[#ef4444] text-xs flex items-center gap-2 font-medium">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{para.warning}</span>
                        </div>
                      )}

                      {para.bulletPoints && para.bulletPoints.length > 0 && (
                        <ul className="flex flex-col gap-2 mt-2 pt-2 border-t border-[#554336]/40">
                          {para.bulletPoints.map((bp, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2 text-xs text-[#f2dfd3]/90 leading-relaxed">
                              <span className="text-[#ffb77d] font-bold mt-0.5">•</span>
                              <span>{bp}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
