import React, { useState } from 'react';
import { Language } from '../types';

interface ProfileScreenProps {
  language: Language;
  currentLocation: string;
  onLanguageChange: (lang: Language) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  language,
  currentLocation,
  onLanguageChange,
}) => {
  const [offlineDownloaded, setOfflineDownloaded] = useState(true);
  const [beaconSharing, setBeaconSharing] = useState(true);
  const [smsRelay, setSmsRelay] = useState(true);

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto px-4 space-y-4 pb-28 pt-2">
      {/* Citizen Card Header */}
      <div className="p-5 rounded-3xl bg-surface-container-lowest shadow-md border border-surface-container-high/60 flex items-center gap-4">
        <div className="relative">
          <img
            alt="Maya Rahman"
            className="w-16 h-16 rounded-full object-cover ring-4 ring-primary-fixed shadow-md"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1vzzoiIBPJvMfG8mCMUkdbMaXXy2QpipnSht_dwDbgeScM8dtznzQs6z_ghPqAqYscQHZ8Ma_a6SVNZZgM4yiyerszNHbohgNiV1R5UmSb4pqvvgcKDYKQnFr7YQ-6x-sQYQD_LV8lgic4U-IhC4JCBWS1cD7B6o4_q-l05WossHjGiXSe1T821skYXWFlcf8r9NFi4jj95etvhsriF_ucnoL7wJ8DoduGOUhw7OHP-pnWTRBN5bDhA"
          />
          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-primary ring-2 ring-surface flex items-center justify-center text-[9px] text-white font-bold">
            ✓
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-headline font-bold text-lg text-on-surface truncate">
              Maya Rahman
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-headline text-[10px] font-bold">
              {language === 'en' ? 'Verified Citizen' : 'যাচাইকৃত'}
            </span>
          </div>
          <p className="font-body text-xs text-secondary mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-primary">near_me</span>
            {currentLocation}
          </p>
          <p className="font-headline text-[11px] text-tertiary font-semibold mt-1">
            SafeNow ID: #SN-DK-892401
          </p>
        </div>
      </div>

      {/* Emergency Medical Identity */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-xs border border-surface-container-high space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[20px]">medical_information</span>
            <h3 className="font-headline font-bold text-sm text-on-surface">
              {language === 'en' ? 'Emergency Medical Card' : 'জরুরি মেডিকেল কার্ড'}
            </h3>
          </div>
          <span className="text-[10px] font-headline font-bold text-primary px-2 py-0.5 rounded bg-primary-fixed/40">
            {language === 'en' ? 'First Responder Visible' : 'উদ্ধারকারীদের জন্য দৃশ্যমান'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
            <span className="text-secondary block text-[11px]">
              {language === 'en' ? 'Blood Group' : 'রক্তের গ্রুপ'}
            </span>
            <span className="font-headline font-bold text-base text-error">O Positive (O+)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
            <span className="text-secondary block text-[11px]">
              {language === 'en' ? 'Allergies' : 'অ্যালার্জি'}
            </span>
            <span className="font-headline font-semibold text-on-surface">Penicillin</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs">
          <span className="text-secondary block text-[11px]">
            {language === 'en' ? 'Medical Notes' : 'চিকিৎসা সংক্রান্ত নোট'}
          </span>
          <span className="font-body text-on-surface">
            {language === 'en'
              ? 'Mild Asthma (emergency rescue inhaler carried in backpack pocket).'
              : 'হালকা অ্যাজমা (জরুরি ইনহেলার ব্যাকপ্যাকে রয়েছে)।'}
          </span>
        </div>
      </div>

      {/* Primary Emergency Contacts */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-xs border border-surface-container-high space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">contact_emergency</span>
            <h3 className="font-headline font-bold text-sm text-on-surface">
              {language === 'en' ? 'Trusted Emergency Contacts' : 'জরুরি যোগাযোগ ব্যক্তিগণ'}
            </h3>
          </div>
          <span className="font-headline text-xs text-primary font-bold hover:underline cursor-pointer">
            + {language === 'en' ? 'Add' : 'যুক্ত করুন'}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                F
              </div>
              <div>
                <p className="font-headline font-bold text-on-surface">Farhan Rahman</p>
                <p className="text-secondary text-[11px]">{language === 'en' ? 'Spouse' : 'স্বামী'} • +880-1711-000000</p>
              </div>
            </div>
            <a href="tel:+8801711000000" className="p-2 rounded-full bg-surface-container text-primary hover:bg-primary-fixed">
              <span className="material-symbols-outlined text-[18px]">call</span>
            </a>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold">
                K
              </div>
              <div>
                <p className="font-headline font-bold text-on-surface">Dr. Kabir Ahmed</p>
                <p className="text-secondary text-[11px]">{language === 'en' ? 'Family Physician' : 'পারিবারিক চিকিৎসক'} • +880-1811-111111</p>
              </div>
            </div>
            <a href="tel:+8801811111111" className="p-2 rounded-full bg-surface-container text-primary hover:bg-primary-fixed">
              <span className="material-symbols-outlined text-[18px]">call</span>
            </a>
          </div>
        </div>
      </div>

      {/* Offline Resilience & Resilience Node Status */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-xs border border-surface-container-high space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">cloud_sync</span>
            <h3 className="font-headline font-bold text-sm text-on-surface">
              {language === 'en' ? 'Offline Disaster Preparedness' : 'অফলাইন দুর্যোগ প্রস্তুতি'}
            </h3>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container">
            <div>
              <p className="font-headline font-bold text-on-surface">
                {language === 'en' ? 'Chattogram Coastal & City Offline Map Pack' : 'চট্টগ্রাম উপকূল ও নগর অফলাইন মানচিত্র'}
              </p>
              <p className="text-secondary text-[11px]">
                {offlineDownloaded ? '158 MB • Fully Cached for zero signal' : 'Not downloaded'}
              </p>
            </div>
            <button
              onClick={() => setOfflineDownloaded(!offlineDownloaded)}
              className={`px-3 py-1.5 rounded-full font-headline text-xs font-bold transition-all ${
                offlineDownloaded
                  ? 'bg-primary-fixed text-on-primary-fixed'
                  : 'bg-surface-container-highest text-secondary'
              }`}
            >
              {offlineDownloaded
                ? language === 'en'
                  ? 'Cached ✓'
                  : 'ডাউনলোডকৃত ✓'
                : language === 'en'
                ? 'Download'
                : 'ডাউনলোড'}
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container">
            <div>
              <p className="font-headline font-bold text-on-surface">
                {language === 'en' ? 'Emergency Mesh Relay' : 'জরুরি মেশ রিলে সংযোগ'}
              </p>
              <p className="text-secondary text-[11px]">
                {beaconSharing ? 'Active • Connected to 18 peer nodes' : 'Disabled'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={beaconSharing}
                onChange={(e) => setBeaconSharing(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container">
            <div>
              <p className="font-headline font-bold text-on-surface">
                {language === 'en' ? 'SMS Fallback Dispatch' : 'এসএমএস ফলব্যাক বার্তা'}
              </p>
              <p className="text-secondary text-[11px]">
                {smsRelay ? 'Sends SMS if internet connection drops' : 'Disabled'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smsRelay}
                onChange={(e) => setSmsRelay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
