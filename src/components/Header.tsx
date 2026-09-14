import React from 'react';
import { Language, TabType, UserCoordinates } from '../types';

interface HeaderProps {
  currentTab: TabType;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onProfileClick: () => void;
  onHomeClick: () => void;
  currentLocation?: string;
  userCoordinates?: UserCoordinates | null;
  isGPSActive?: boolean;
  onLocationClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  language,
  onLanguageChange,
  onProfileClick,
  onHomeClick,
  currentLocation,
  userCoordinates,
  isGPSActive,
  onLocationClick,
}) => {
  const tabTitles: Record<TabType, { en: string; bn: string }> = {
    home: { en: 'Home', bn: 'হোম' },
    'safety-map': { en: 'Safety Map', bn: 'নিরাপত্তা ম্যাপ' },
    alerts: { en: 'Alerts', bn: 'সতর্কতা' },
    'get-help': { en: 'Get Help', bn: 'জরুরি সাহায্য' },
    profile: { en: 'Profile', bn: 'প্রোফাইল' },
  };

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container/50">
      <div className="h-16 px-4 max-w-lg mx-auto flex items-center justify-between gap-2">
        {/* Left: Logo and Status */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-2 text-left min-w-0 active:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
        >
          <img
            alt="SafeNow Logo"
            className="h-8 w-auto object-contain flex-shrink-0"
            src="https://lh3.googleusercontent.com/aida/AEtjO1USIApxFg6t7atkNwUT361fm2wswIk5-bFZbt43Qi5E-uVwopoEjjgw0eGHCVC8sx2Pz1VOX7hV2NNxmUAYNuX6CfSSitKASs4_Yiual3szdvFoLngG3cugfbcV3doeVxTmzp0XOATudZZ1w9qk1-LlQHzZnBoCxO45pmJq8XM9myBt1LlpNxFJoZuZzECu8ez76ZdtYxy_7Wr8-18SzEdQpHlmoZurM60rdd-nbiEEz-euSKXzWakjsao"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-semibold text-lg text-on-surface truncate">
                SafeNow
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-headline text-[10px] font-bold flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {language === 'en' ? 'AI Active' : 'এআই সক্রিয়'}
              </span>
            </div>
            <span className="font-headline text-[11px] text-on-surface-variant font-medium truncate">
              {tabTitles[currentTab][language]}
            </span>
          </div>
        </button>

        {/* Center/Right: Always-visible Live Current Location Pill */}
        {currentLocation && (
          <button
            onClick={onLocationClick}
            title={language === 'en' ? 'Tap to view or change location' : 'অবস্থান দেখতে বা পরিবর্তন করতে ট্যাপ করুন'}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-surface-container-high/60 active:scale-95 transition-all text-left max-w-[170px] truncate cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0">
              {isGPSActive ? 'my_location' : 'location_on'}
            </span>
            <div className="min-w-0 flex flex-col">
              <span className="font-headline font-semibold text-[11px] text-on-surface truncate leading-tight">
                {currentLocation.split(',')[0]}
              </span>
              {isGPSActive && userCoordinates ? (
                <span className="font-mono text-[9px] text-secondary truncate leading-none">
                  {userCoordinates.latitude.toFixed(2)}°, {userCoordinates.longitude.toFixed(2)}°
                </span>
              ) : (
                <span className="text-[9px] text-secondary font-headline truncate leading-none">
                  {language === 'en' ? 'Live' : 'লাইভ'}
                </span>
              )}
            </div>
          </button>
        )}

        {/* Right: Language switch & Profile avatar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center p-0.5 rounded-full bg-surface-container border border-surface-container-highest/40">
            <button
              onClick={() => onLanguageChange('en')}
              className={`min-h-[36px] px-2.5 rounded-full font-headline text-xs font-semibold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-surface-container-lowest text-primary shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
                  : 'text-secondary hover:text-on-surface opacity-75'
              }`}
              type="button"
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('bn')}
              className={`min-h-[36px] px-2.5 rounded-full font-headline text-xs font-semibold transition-all cursor-pointer ${
                language === 'bn'
                  ? 'bg-surface-container-lowest text-primary shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
                  : 'text-secondary hover:text-on-surface opacity-75'
              }`}
              type="button"
            >
              বাংলা
            </button>
          </div>

          <button
            onClick={onProfileClick}
            aria-label="User Profile"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:ring-2 hover:ring-primary/40 active:scale-95 transition-all cursor-pointer"
          >
            <img
              alt="Maya Profile"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-highest shadow-sm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1vzzoiIBPJvMfG8mCMUkdbMaXXy2QpipnSht_dwDbgeScM8dtznzQs6z_ghPqAqYscQHZ8Ma_a6SVNZZgM4yiyerszNHbohgNiV1R5UmSb4pqvvgcKDYKQnFr7YQ-6x-sQYQD_LV8lgic4U-IhC4JCBWS1cD7B6o4_q-l05WossHjGiXSe1T821skYXWFlcf8r9NFi4jj95etvhsriF_ucnoL7wJ8DoduGOUhw7OHP-pnWTRBN5bDhA"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
