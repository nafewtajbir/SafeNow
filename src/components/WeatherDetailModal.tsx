import React from 'react';
import { Language } from '../types';

interface WeatherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const WeatherDetailModal: React.FC<WeatherDetailModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-surface-container-high flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[22px]">radar</span>
            <h3 className="font-headline font-bold text-lg text-on-surface">
              {language === 'en' ? 'Civic Weather Telemetry' : 'আবহাওয়া ও পানি নিষ্কাশন পরিস্থিতি'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-surface-container flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">water_drop</span>
              <span className="font-headline text-xs font-semibold text-on-surface">
                {language === 'en' ? 'Rainfall Rate' : 'বৃষ্টির পরিমাণ'}
              </span>
            </div>
            <span className="font-headline text-xs font-bold text-primary">12 mm/hr (Moderate)</span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-container flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">waves</span>
              <span className="font-headline text-xs font-semibold text-on-surface">
                {language === 'en' ? 'Hatirjheel Canal Water Gauge' : 'হাতিরঝিল পানির স্তর'}
              </span>
            </div>
            <span className="font-headline text-xs font-bold text-error">+0.8m (Warning)</span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-container flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">cyclone</span>
              <span className="font-headline text-xs font-semibold text-on-surface">
                {language === 'en' ? 'Gulshan Drainage Pumps' : 'গুলশান নিষ্কাশন পাম্প'}
              </span>
            </div>
            <span className="font-headline text-xs font-bold text-primary">100% Operational</span>
          </div>

          <div className="p-3 rounded-2xl bg-tertiary-fixed/30 border border-tertiary-fixed">
            <p className="font-headline text-xs font-bold text-tertiary uppercase tracking-wider">
              {language === 'en' ? 'Meteorological Outlook' : 'আবহাওয়ার পূর্বাভাস'}
            </p>
            <p className="font-body text-xs text-on-surface mt-1 leading-relaxed">
              {language === 'en'
                ? 'Monsoon clouds moving southeast over Turag. Elevated sections of Gulshan and Banani remain safe; underpasses below 7m elevation are at risk of minor water ponding.'
                : 'দক্ষিণ-পূর্বে মেঘমালা প্রবাহিত হচ্ছে। গুলশান ও বনানীর উঁচু এলাকা নিরাপদ থাকলেও ৭ মিটারের নিচের আন্ডারপাসে সাময়িক পানি জমতে পারে।'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-primary text-on-primary font-headline text-sm font-semibold hover:bg-primary-container"
        >
          {language === 'en' ? 'Close' : 'বন্ধ করুন'}
        </button>
      </div>
    </div>
  );
};
