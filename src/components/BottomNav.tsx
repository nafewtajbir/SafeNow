import React from 'react';
import { Language, TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  language: Language;
  unreadAlertsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  language,
  unreadAlertsCount = 1,
}) => {
  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl border-t border-surface-container/60 shadow-[0_-4px_20px_rgba(11,28,48,0.06)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {/* Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] transition-all cursor-pointer ${
            currentTab === 'home'
              ? 'text-primary scale-105 font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[24px]">home</span>
          <span className="font-headline text-[10px] font-semibold mt-0.5">
            {language === 'en' ? 'Home' : 'হোম'}
          </span>
        </button>

        {/* Safety Map */}
        <button
          onClick={() => onTabChange('safety-map')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] transition-all cursor-pointer ${
            currentTab === 'safety-map'
              ? 'text-primary scale-105 font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[24px]">explore</span>
          <span className="font-headline text-[10px] font-semibold mt-0.5">
            {language === 'en' ? 'Safety Map' : 'ম্যাপ'}
          </span>
        </button>

        {/* Alerts */}
        <button
          onClick={() => onTabChange('alerts')}
          className={`relative flex flex-col items-center justify-center min-w-[54px] min-h-[44px] transition-all cursor-pointer ${
            currentTab === 'alerts'
              ? 'text-primary scale-105 font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <div className="relative">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-error ring-2 ring-surface animate-pulse" />
            )}
          </div>
          <span className="font-headline text-[10px] font-semibold mt-0.5">
            {language === 'en' ? 'Alerts' : 'সতর্কতা'}
          </span>
        </button>

        {/* Get Help */}
        <button
          onClick={() => onTabChange('get-help')}
          className={`flex flex-col items-center justify-center min-w-[58px] min-h-[44px] transition-all cursor-pointer ${
            currentTab === 'get-help'
              ? 'text-error scale-105 font-bold'
              : 'text-error hover:opacity-90'
          }`}
          type="button"
        >
          <div className="w-10 h-7 rounded-full bg-error-container text-on-error-container flex items-center justify-center shadow-[0_0_12px_-2px_rgba(186,26,26,0.3)]">
            <span className="material-symbols-outlined text-[20px]">e911_emergency</span>
          </div>
          <span className="font-headline text-[10px] font-bold text-error mt-0.5">
            {language === 'en' ? 'Get Help' : 'জরুরি'}
          </span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] transition-all cursor-pointer ${
            currentTab === 'profile'
              ? 'text-primary scale-105 font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[24px]">person</span>
          <span className="font-headline text-[10px] font-semibold mt-0.5">
            {language === 'en' ? 'Profile' : 'প্রোফাইল'}
          </span>
        </button>
      </div>
    </nav>
  );
};
