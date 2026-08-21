import React from 'react';
import { MarketScoreItem } from '../types';
import { X, TrendingUp, Coins, DollarSign, Activity, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MarketDetailsModalProps {
  market: MarketScoreItem | null;
  onClose: () => void;
}

export const MarketDetailsModal: React.FC<MarketDetailsModalProps> = ({
  market,
  onClose,
}) => {
  if (!market) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#231a13] border border-[#554336] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-[#554336] flex items-center justify-between bg-[#271e16]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#ffb77d]/15 text-[#ffb77d]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#f2dfd3]">{market.name}</h3>
                <span className="text-xs font-mono-num text-[#dbc2b0] bg-[#3e332b] px-2 py-0.5 rounded">
                  {market.symbol}
                </span>
              </div>
              <p className="text-xs text-[#dbc2b0]/70">{market.nameEn}</p>
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
        <div className="p-6 space-y-5">
          {/* Main Score Box */}
          <div className="bg-[#1a120b] border border-[#554336] rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#3e332b]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#ffb77d"
                    strokeDasharray={`${market.score}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-mono-num text-lg font-bold text-[#f2dfd3] absolute">
                  {market.score}
                </span>
              </div>

              <div>
                <div className="text-xs text-[#dbc2b0]">سنتیمنت و امتیاز کلی</div>
                <div className="text-xl font-bold text-[#ffb77d] mt-0.5">
                  {market.sentiment}
                </div>
              </div>
            </div>

            <div className="text-left text-xs font-mono-num text-[#96ccff]">
              توصیه S1: {market.score >= 80 ? 'انباشت و خرید پله‌ای' : market.score >= 60 ? 'نگهداری و احتیاط' : 'کاهش وزن دارایی'}
            </div>
          </div>

          {/* Sub-scores 4 pill meters */}
          {market.details && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#271e16] border border-[#554336] p-3 rounded-xl">
                <div className="flex justify-between text-[#dbc2b0] mb-1">
                  <span>امتیاز تکنیکال:</span>
                  <span className="font-mono-num text-[#ffb77d] font-bold">
                    {market.details.technicalScore}٪
                  </span>
                </div>
                <div className="h-1.5 bg-[#3e332b] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ffb77d] rounded-full"
                    style={{ width: `${market.details.technicalScore}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#271e16] border border-[#554336] p-3 rounded-xl">
                <div className="flex justify-between text-[#dbc2b0] mb-1">
                  <span>امتیاز فاندامنتال:</span>
                  <span className="font-mono-num text-[#ffb77d] font-bold">
                    {market.details.fundamentalScore}٪
                  </span>
                </div>
                <div className="h-1.5 bg-[#3e332b] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ffb77d] rounded-full"
                    style={{ width: `${market.details.fundamentalScore}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#271e16] border border-[#554336] p-3 rounded-xl">
                <div className="flex justify-between text-[#dbc2b0] mb-1">
                  <span>جریان نقدینگی و پول هوشمند:</span>
                  <span className="font-mono-num text-[#96ccff] font-bold">
                    {market.details.flowScore}٪
                  </span>
                </div>
                <div className="h-1.5 bg-[#3e332b] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#96ccff] rounded-full"
                    style={{ width: `${market.details.flowScore}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#271e16] border border-[#554336] p-3 rounded-xl">
                <div className="flex justify-between text-[#dbc2b0] mb-1">
                  <span>سنتیمنت و رفتار معامله‌گران:</span>
                  <span className="font-mono-num text-[#10b981] font-bold">
                    {market.details.sentimentScore}٪
                  </span>
                </div>
                <div className="h-1.5 bg-[#3e332b] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10b981] rounded-full"
                    style={{ width: `${market.details.sentimentScore}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Descriptive text */}
          <div className="bg-[#271e16] border border-[#554336]/60 p-4 rounded-xl text-xs space-y-2">
            <div className="font-semibold text-[#f2dfd3]">تحلیل جامع موتور S1:</div>
            <p className="text-[#dbc2b0] leading-relaxed">
              {market.description || market.details?.analysisSummary}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#3e332b] hover:bg-[#322820] text-[#f2dfd3] py-2.5 rounded-xl text-xs font-semibold"
          >
            بستن پنجره تحلیل
          </button>
        </div>
      </div>
    </div>
  );
};
