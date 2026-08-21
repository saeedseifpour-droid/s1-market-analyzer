import React from 'react';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  PieChart,
  Globe,
  Sliders,
  Wallet,
  BookOpen,
  Settings,
  Activity,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'داشبورد S1',
      icon: LayoutDashboard,
      badge: 'زنده',
    },
    {
      id: 'portfolio' as ActiveTab,
      label: 'پورتفوی ۱ میلیاردی',
      icon: PieChart,
      badge: '+۱۴.۸٪',
    },
    {
      id: 'news_risks' as ActiveTab,
      label: 'اخبار و ریسک‌های SRI',
      icon: Globe,
      badge: 'SRI ۴.۴',
    },
    {
      id: 'inputs' as ActiveTab,
      label: 'ورودی‌ها و چک‌لیست',
      icon: Sliders,
      badge: '۱۱ گام',
    },
    {
      id: 'funds' as ActiveTab,
      label: 'صندوق‌ها و بازتوازن',
      icon: Wallet,
      badge: 'تخصیص',
    },
    {
      id: 'rulebook' as ActiveTab,
      label: 'کتاب قانون S1',
      icon: BookOpen,
      badge: 'نسخه ۱.۳',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'تنظیمات و سوابق',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          id="mobile-sidebar-backdrop"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 right-0 h-full w-72 bg-[#231a13] border-l border-[#554336] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo and Brand Header */}
        <div className="p-6 flex items-center justify-between border-b border-[#554336] mb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center p-1 bg-[#1a120b] border border-[#554336] rounded-xl overflow-hidden shadow-inner">
              <img
                src="https://lh3.googleusercontent.com/aida/AEtjO1XMxRoWTLLoNOxZGcukmCCkGW7VnAa3LTYlxR-nHOmodF1CYwifLxWduLBcVguHGOmXSQij7e7d4LOnAd-4ooU9fdm7oAYgkw9CHclEzG9MIsWzURUXfMqqpRpfcd9VxrZ0stsHbVhtlyqKLgQ2DAckLPHgIwNt0EprGVWOyu-0qatBPh50MMAxMJNokbLJxFuFqlX6P-NjY9S3DREHYxs_N8usLZnsMcClD_k0yji4Ja3gVc92mooXNg"
                alt="System S1 Logo"
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#ffb77d] tracking-tight font-mono-num">
                System S1
              </span>
              <span className="text-[11px] text-[#dbc2b0]/70">سامانه تحلیل و امتیازدهی</span>
            </div>
          </div>

          <span className="hidden lg:flex px-2 py-0.5 text-[10px] font-bold bg-[#3e332b] text-[#ffb77d] border border-[#ffb77d]/30 rounded font-mono-num">
            v1.3
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-right ${
                  isActive
                    ? 'bg-[#d97707] text-[#1a120b] font-bold shadow-md'
                    : 'text-[#dbc2b0] hover:bg-[#322820] hover:text-[#f2dfd3]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#1a120b]' : 'text-[#ffb77d]'}`} />
                  <span className="text-base">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-[#1a120b]/25 text-[#1a120b]'
                        : 'bg-[#3e332b] text-[#dbc2b0]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Status & Engine Health */}
        <div className="p-4 m-4 rounded-xl bg-[#1a120b] border border-[#554336]/60 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
              </span>
              <span className="text-xs text-[#f2dfd3] font-medium">موتور تحلیلگر فعال</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-[#ffb77d]" />
          </div>

          <div className="text-[11px] text-[#dbc2b0]/80 flex justify-between border-t border-[#554336]/40 pt-2 font-mono-num">
            <span>داده‌های دریافتی:</span>
            <span className="text-[#96ccff]">۳۹ از ۴۱ پارامتر</span>
          </div>

          <div className="text-[11px] text-[#dbc2b0]/80 flex justify-between font-mono-num">
            <span>فرکانس بروزرسانی:</span>
            <span className="text-[#ffb77d]">هر ۱۵ دقیقه</span>
          </div>
        </div>

        {/* User Info footer */}
        <div className="p-4 border-t border-[#554336] flex items-center justify-between text-xs text-[#dbc2b0]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#10b981]" />
            <span>پایگاه داده متصل</span>
          </div>
          <span className="font-mono-num text-[11px] text-[#dbc2b0]/60">S1-PRO-NODE</span>
        </div>
      </aside>
    </>
  );
};
