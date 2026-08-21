import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { Search, Bell, User, Menu, X, CheckCircle, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenMobileMenu: () => void;
  onRunNow: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onRunNow,
}) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'ورود پول چشمگیر به صندوق طلا',
      desc: 'بیش از ۱۸۵ میلیارد تومان ورود پول به صندوق‌های عیار و طلا ثبت شد.',
      time: '۱۰ دقیقه پیش',
      type: 'positive',
    },
    {
      id: 2,
      title: 'سیگنال روز S1 صادر شد',
      desc: 'سیگنال "خرید پله‌ای مجاز است" با شاخص اطمینان ۹/۱۰ تولید گردید.',
      time: '۲۵ دقیقه پیش',
      type: 'info',
    },
    {
      id: 3,
      title: 'هشدار حباب سکه امامی',
      desc: 'حباب سکه به ۲۰.۵٪ رسید؛ در خریدهای پرریسک جانب احتیاط رعایت شود.',
      time: '۱ ساعت پیش',
      type: 'warning',
    },
  ]);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'داشبورد امتیازدهی S1';
      case 'portfolio':
        return 'مدیریت پورتفوی کاغذی ۱ میلیارد تومانی';
      case 'news_risks':
        return 'اخبار، ریسک‌های سیستماتیک و خلاصه تحلیل هوش مصنوعی';
      case 'inputs':
        return 'ورودی‌های روزانه بازار (Daily Inputs)';
      case 'funds':
        return 'مدیریت و بازتوازن صندوق‌ها';
      case 'settings':
        return 'تنظیمات الگوریتم و ربات تلگرام';
      default:
        return 'داشبورد امتیازدهی S1';
    }
  };

  return (
    <>
      <header
        id="app-header"
        className="fixed top-0 right-0 lg:right-72 left-0 h-16 bg-[#271e16]/85 backdrop-blur-xl border-b border-[#554336] z-40 flex items-center justify-between px-4 sm:px-6"
      >
        {/* Left Side (in RTL, this is the right section) */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-menu-toggle-btn"
            onClick={onOpenMobileMenu}
            className="p-2 -mr-2 rounded-lg text-[#dbc2b0] hover:text-[#ffb77d] hover:bg-[#322820] lg:hidden"
            aria-label="باز کردن منو"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-lg sm:text-xl font-bold text-[#f2dfd3] tracking-normal">
            {getTabTitle()}
          </h1>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick Search Button */}
          <button
            id="header-search-btn"
            onClick={() => setShowSearchModal(true)}
            className="p-2 rounded-lg text-[#dbc2b0] hover:text-[#ffb77d] hover:bg-[#322820] transition-colors relative"
            title="جستجوی سریع بازارها و شاخص‌ها"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              id="header-notifications-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-[#dbc2b0] hover:text-[#ffb77d] hover:bg-[#322820] transition-colors relative"
              title="اعلان‌ها و رویدادهای بازار"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ffb77d] rounded-full ring-2 ring-[#271e16] animate-pulse" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div
                id="notifications-dropdown"
                className="absolute left-0 mt-3 w-80 sm:w-96 bg-[#231a13] border border-[#554336] rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-[#554336] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#ffb77d]" />
                    <span className="font-bold text-sm text-[#f2dfd3]">اعلان‌های سیستم S1</span>
                  </div>
                  <span className="text-xs text-[#dbc2b0] font-mono-num bg-[#3e332b] px-2 py-0.5 rounded">
                    {notifications.length} جدید
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#554336]/40">
                  {notifications.map((item) => (
                    <div key={item.id} className="p-3 hover:bg-[#322820] transition-colors">
                      <div className="flex items-start gap-2.5">
                        {item.type === 'positive' && <TrendingUp className="w-4 h-4 text-[#10b981] mt-1 shrink-0" />}
                        {item.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#f59e0b] mt-1 shrink-0" />}
                        {item.type === 'info' && <CheckCircle className="w-4 h-4 text-[#96ccff] mt-1 shrink-0" />}
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-[#f2dfd3] mb-0.5">{item.title}</div>
                          <div className="text-[11px] text-[#dbc2b0] leading-relaxed">{item.desc}</div>
                          <div className="text-[10px] text-[#dbc2b0]/50 mt-1.5 font-mono-num">{item.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2 border-t border-[#554336] bg-[#1a120b] flex justify-between">
                  <button
                    onClick={() => setNotifications([])}
                    className="text-xs text-[#dbc2b0] hover:text-[#ffb77d] px-3 py-1"
                  >
                    علامت‌گذاری همه به عنوان خوانده‌شده
                  </button>
                  <button
                    onClick={onRunNow}
                    className="text-xs text-[#ffb77d] hover:underline px-3 py-1 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    بروزرسانی داده‌ها
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-3 pr-3 sm:pr-4 border-r border-[#554336]">
            <div className="text-left hidden sm:flex flex-col">
              <div className="text-xs font-semibold text-[#f2dfd3]">کاربر سیستم</div>
              <div className="text-[11px] text-[#dbc2b0]/80">مدیر ارشد</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#ffb77d] flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-[#4d2600]" />
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-xl bg-[#231a13] border border-[#554336] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-[#554336] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#ffb77d]" />
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در نمادها، شاخص‌ها، صندوق‌ها و ورودی‌های S1..."
                className="flex-1 bg-transparent text-sm text-[#f2dfd3] placeholder-[#dbc2b0]/50 outline-none"
                autoFocus
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-[#dbc2b0] hover:text-[#f2dfd3] p-1 rounded-lg hover:bg-[#322820]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2 text-xs">
              <div className="text-[#dbc2b0]/60 text-[11px] mb-2">پیشنهادات پرکاربرد:</div>
              <div
                onClick={() => setShowSearchModal(false)}
                className="p-2.5 rounded-lg bg-[#271e16] hover:bg-[#322820] cursor-pointer flex items-center justify-between text-[#f2dfd3]"
              >
                <span>صندوق طلای عیار مفید (عیار)</span>
                <span className="font-mono-num text-[#ffb77d]">تخصیص ۱۸٪</span>
              </div>
              <div
                onClick={() => setShowSearchModal(false)}
                className="p-2.5 rounded-lg bg-[#271e16] hover:bg-[#322820] cursor-pointer flex items-center justify-between text-[#f2dfd3]"
              >
                <span>ارزش معاملات خرد بورس (TSE_RETAIL_VOL)</span>
                <span className="font-mono-num text-[#10b981]">۸,۴۵۰ همت</span>
              </div>
              <div
                onClick={() => setShowSearchModal(false)}
                className="p-2.5 rounded-lg bg-[#271e16] hover:bg-[#322820] cursor-pointer flex items-center justify-between text-[#f2dfd3]"
              >
                <span>نرخ بهره بین‌بانکی (INTERBANK_RATE)</span>
                <span className="font-mono-num text-[#96ccff]">۲۳.۸۵٪</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
