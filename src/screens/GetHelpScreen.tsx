import React, { useState, useEffect } from 'react';
import { DispatchService, Language, TabType, UserCoordinates } from '../types';
import { DISPATCH_SERVICES } from '../data';

interface GetHelpScreenProps {
  language: Language;
  currentLocation: string;
  onNavigateTab?: (tab: TabType) => void;
  onOpenDispatchModal?: (service: DispatchService) => void;
  onSelectService?: (service: DispatchService) => void;
  onOpenAIChat?: () => void;
  userCoordinates?: UserCoordinates | null;
  isGPSActive?: boolean;
}

export const GetHelpScreen: React.FC<GetHelpScreenProps> = ({
  language,
  currentLocation,
  onNavigateTab,
  onOpenDispatchModal,
  onSelectService,
  onOpenAIChat,
  userCoordinates,
  isGPSActive,
}) => {
  const triggerDispatchModal = (service: DispatchService) => {
    if (onOpenDispatchModal) {
      onOpenDispatchModal(service);
    } else if (onSelectService) {
      onSelectService(service);
    }
  };
  const [criticalEmergencyMode, setCriticalEmergencyMode] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sosConfirmed, setSosConfirmed] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setSosConfirmed(true);
      setCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSosTrigger = () => {
    if (countdown === null && !sosConfirmed) {
      setCountdown(3);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch {
          // ignore
        }
      }
    }
  };

  const handleCancelSos = () => {
    setCountdown(null);
    setSosConfirmed(false);
  };

  return (
    <div
      className={`flex flex-col w-full max-w-lg mx-auto px-4 space-y-4 pb-28 pt-2 transition-colors duration-300 ${
        criticalEmergencyMode ? 'bg-[#0f172a] text-white rounded-3xl min-h-[90vh] py-4' : ''
      }`}
    >
      {/* Top Hero Notification Banner */}
      <section className="bg-error-container text-on-error-container rounded-2xl p-4 shadow-md flex items-start justify-between gap-3 border border-error/20">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-error text-on-error flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
            <span className="material-symbols-outlined text-[24px]">sos</span>
          </div>
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-headline font-bold text-base tracking-tight text-on-error-container">
                {language === 'en' ? 'Emergency Assistance Center' : 'জরুরি সহায়তা কেন্দ্র'}
              </h1>
              <span className="font-headline text-[10px] px-2 py-0.5 rounded-full bg-error text-on-error font-bold">
                {language === 'en' ? 'Citizen SOS' : 'সহায়তা কেন্দ্র'}
              </span>
            </div>
            <p className="font-body text-xs text-on-error-container/90 mt-0.5">
              {language === 'en'
                ? 'Quick 1-tap dispatch for critical citizen safety & rapid response.'
                : 'জরুরি নাগরিক নিরাপত্তা ও উদ্ধারকার্যের জন্য দ্রুত ১-ক্লিক সেবা।'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-surface/75 rounded-full flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-error animate-ping" />
          <span className="font-headline text-[10px] text-on-surface font-bold">LIVE GPS</span>
        </div>
      </section>

      {/* Giant Emergency Action SOS Button */}
      <section className="flex flex-col items-center justify-center py-2">
        <div className="relative w-full max-w-sm flex flex-col items-center">
          {/* Radiating Glow Accents */}
          <div className="absolute inset-0 rounded-full bg-error/20 blur-xl animate-pulse -z-10 scale-105" />

          {sosConfirmed ? (
            <div className="w-full p-5 rounded-3xl bg-error text-on-error text-center space-y-2 shadow-2xl animate-in zoom-in-95">
              <div className="w-14 h-14 mx-auto rounded-full bg-surface text-error flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-[36px]">radar</span>
              </div>
              <h3 className="font-headline font-extrabold text-xl">
                {language === 'en' ? 'SOS TRANSMITTED!' : 'জরুরি বার্তা প্রেরিত হয়েছে!'}
              </h3>
              <p className="font-body text-xs text-surface/90">
                {language === 'en'
                  ? `Rescue Units alerted. GPS beacon: ${currentLocation} ${
                      userCoordinates
                        ? `(Lat ${userCoordinates.latitude.toFixed(4)}° N, Long ${userCoordinates.longitude.toFixed(4)}° E)`
                        : '(Lat 22.3384° N, Long 91.8155° E)'
                    }`
                  : `রেসকিউ টিম সতর্ক। জিপিএস সংকেত: ${currentLocation} ${
                      userCoordinates
                        ? `(${userCoordinates.latitude.toFixed(4)}° উ, ${userCoordinates.longitude.toFixed(4)}° পূ)`
                        : '(২২.৩৩৮৪° উ, ৯১.৮১৫৫° পূ)'
                    }।`}
              </p>
              <button
                onClick={handleCancelSos}
                className="mt-2 py-2 px-5 rounded-full bg-surface text-error font-headline text-xs font-bold shadow hover:bg-surface-container active:scale-95 cursor-pointer"
              >
                {language === 'en' ? 'Cancel False Alarm' : 'সতর্কতা বাতিল করুন'}
              </button>
            </div>
          ) : countdown !== null ? (
            <div className="w-full p-5 rounded-3xl bg-error text-on-error text-center space-y-3 shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-full bg-surface text-error flex items-center justify-center font-headline text-3xl font-black animate-pulse">
                {countdown}
              </div>
              <h3 className="font-headline font-bold text-lg">
                {language === 'en' ? 'Transmitting Emergency SOS...' : 'জরুরি সংকেত পাঠানো হচ্ছে...'}
              </h3>
              <p className="font-body text-xs text-surface/90">
                {language === 'en' ? 'Transmitting in 3 seconds. Tap to cancel.' : '৩ সেকেন্ডে পাঠানো হচ্ছে। বাতিল করতে চাপুন।'}
              </p>
              <button
                onClick={handleCancelSos}
                className="py-2 px-6 rounded-full bg-surface-container-highest text-on-surface font-headline text-xs font-bold shadow active:scale-95 cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleSosTrigger}
              className="w-full min-h-[76px] py-4 px-6 rounded-full bg-error text-on-error shadow-[0_12px_32px_-4px_rgba(186,26,26,0.45)] active:scale-95 transition-transform flex flex-col items-center justify-center text-center group cursor-pointer border-2 border-surface/20"
              id="sosMainTrigger"
              type="button"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[30px] animate-bounce">
                  e911_emergency
                </span>
                <span className="font-headline font-bold text-lg tracking-tight uppercase text-on-error">
                  {language === 'en' ? 'I NEED IMMEDIATE HELP' : 'আমার অবিলম্বে সাহায্য প্রয়োজন'}
                </span>
              </div>
              <span className="font-headline text-xs text-on-error/90 font-medium mt-0.5">
                {language === 'en' ? 'আমার অবিলম্বে সাহায্য প্রয়োজন' : 'Transmits Real-Time Emergency Beacon'}
              </span>
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-center border border-surface-container-high/40">
            <span className="material-symbols-outlined text-[16px] text-primary">my_location</span>
            <p className="font-body text-[11px]">
              {language === 'en'
                ? 'Transmits GPS coordinates & safety status to nearest team'
                : 'নিকটবর্তী উদ্ধারকারী দলের কাছে জিপিএস স্থানাঙ্ক ও নিরাপত্তা স্ট্যাটাস পাঠায়'}
            </p>
          </div>
        </div>
      </section>

      {/* Assistance Categories Grid */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-semibold text-base text-on-surface">
            {language === 'en' ? 'Direct Dispatch Services' : 'সরাসরি রেসকিউ সেবা'}
          </h2>
          <span className="font-headline text-[10px] text-primary uppercase font-bold tracking-wider">
            {language === 'en' ? 'Fast Priority' : 'জরুরি প্রাধান্য'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {DISPATCH_SERVICES.map((service) => (
            <button
              key={service.id}
              onClick={() => triggerDispatchModal(service)}
              className="w-full min-h-[64px] p-3 rounded-2xl bg-surface-container-lowest shadow-xs hover:shadow-md active:bg-surface-container-high transition-all text-left flex items-center justify-between gap-3 group border border-surface-container-high/40 cursor-pointer"
              type="button"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${service.colorClass}`}
                >
                  <span className="material-symbols-outlined text-[28px]">{service.icon}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-sm text-on-surface font-bold">
                      {language === 'en' ? service.titleEn : service.titleBn}
                    </span>
                    <span className="font-headline text-xs text-secondary">
                      {language === 'en' ? service.titleBn : service.titleEn}
                    </span>
                  </div>
                  <p className="font-body text-xs text-on-surface-variant truncate">
                    {language === 'en' ? service.descEn : service.descBn}
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Critical Emergency Mode Switch Section */}
      <section className="p-4 rounded-2xl bg-surface-container-low shadow-xs space-y-2 border border-surface-container">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[24px]">
              crisis_alert
            </span>
            <span className="font-headline text-sm text-on-surface font-bold">
              {language === 'en' ? 'Critical Emergency Mode' : 'সংকটকালীন জরুরি মোড'}
            </span>
          </div>

          {/* Mode Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              className="sr-only peer"
              id="criticalModeToggle"
              type="checkbox"
              checked={criticalEmergencyMode}
              onChange={(e) => setCriticalEmergencyMode(e.target.checked)}
            />
            <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface peer-checked:bg-error after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-6 after:w-6 after:transition-all" />
          </label>
        </div>
        <p className="font-body text-xs text-on-surface-variant leading-relaxed">
          {language === 'en'
            ? 'Switch to ultra-high contrast UI with zero distractions for extreme crisis conditions.'
            : 'চরম দুর্যোগ পরিস্থিতিতে মনোযোগের বিঘ্নহীন ও উচ্চ কনট্রাস্টের স্ক্রিনে পরিবর্তন করুন।'}
        </p>
      </section>

      {/* Simplified High-Contrast Critical UI Panel */}
      <section
        className={`p-5 rounded-3xl bg-inverse-surface text-inverse-on-surface shadow-xl space-y-4 transition-all duration-300 border border-surface-container-highest/20 ${
          criticalEmergencyMode ? 'ring-2 ring-error scale-[1.01]' : ''
        }`}
        id="criticalPanel"
      >
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-error animate-ping" />
            <span className="font-headline text-sm uppercase tracking-wide text-inverse-on-surface font-extrabold">
              {language === 'en' ? 'IMMEDIATE ACTIONS' : 'তাত্ক্ষণিক পদক্ষেপসমূহ'}
            </span>
          </div>
          <span className="font-headline text-[10px] px-2.5 py-1 rounded-full bg-error text-on-error uppercase font-bold">
            {language === 'en' ? 'MODE ACTIVE' : 'মোড সক্রিয়'}
          </span>
        </div>

        {/* 3 Clear Rules */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 text-inverse-on-surface">
            <div className="w-9 h-9 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center flex-shrink-0 font-headline font-bold text-base">
              1
            </div>
            <div className="min-w-0">
              <p className="font-headline font-bold text-xs uppercase tracking-tight text-white">
                {language === 'en' ? 'MOVE TO HIGHER GROUND' : 'উঁচু স্থানে আশ্রয় নিন'}
              </p>
              <p className="font-body text-[11px] text-surface-dim">উঁচু স্থানে আশ্রয় গ্রহণ করুন</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 text-inverse-on-surface">
            <div className="w-9 h-9 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center flex-shrink-0 font-headline font-bold text-base">
              2
            </div>
            <div className="min-w-0">
              <p className="font-headline font-bold text-xs uppercase tracking-tight text-white">
                {language === 'en' ? 'AVOID FLOODED ROADS' : 'প্লাবিত রাস্তা এড়িয়ে চলুন'}
              </p>
              <p className="font-body text-[11px] text-surface-dim">প্লাবিত রাস্তা বা সেতু এড়িয়ে চলুন</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 text-inverse-on-surface">
            <div className="w-9 h-9 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center flex-shrink-0 font-headline font-bold text-base">
              3
            </div>
            <div className="min-w-0">
              <p className="font-headline font-bold text-xs uppercase tracking-tight text-white">
                {language === 'en' ? 'GO TO NEAREST SAFE SHELTER' : 'কাছের নিরাপদ আশ্রয়কেন্দ্রে যান'}
              </p>
              <p className="font-body text-[11px] text-surface-dim">নিকটবর্তী নিরাপদ আশ্রয়কেন্দ্রে পৌঁছান</p>
            </div>
          </div>
        </div>

        {/* Actions inside Critical Mode */}
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={() => onNavigateTab('safety-map')}
            className="w-full min-h-[56px] rounded-full bg-primary text-on-primary font-headline text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">navigation</span>
            <span>{language === 'en' ? 'FIND SAFE ROUTE' : 'নিরাপদ পথ খুঁজুন'}</span>
            <span className="font-headline text-xs opacity-80">(পথ খুঁজুন)</span>
          </button>

          <a
            className="w-full min-h-[56px] rounded-full bg-error text-on-error font-headline text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(186,26,26,0.35)] active:scale-98 transition-transform text-center"
            href="tel:999"
          >
            <span className="material-symbols-outlined text-[24px]">phone_in_talk</span>
            <span>{language === 'en' ? 'CALL EMERGENCY: 999' : 'জরুরি কল: ৯৯৯'}</span>
            <span className="font-headline text-xs opacity-85">(কল ৯৯৯)</span>
          </a>
        </div>
      </section>

      {/* Contextual Safety Telemetry Note */}
      <section className="rounded-2xl p-4 bg-surface-container text-on-surface space-y-1 border border-surface-container-high/40">
        <div className="flex items-center gap-2 text-primary font-bold">
          <span className="material-symbols-outlined text-[20px]">verified_user</span>
          <span className="font-headline text-xs uppercase tracking-wider">
            {language === 'en' ? 'Automated Offline Mesh Active' : 'স্বয়ংক্রিয় অফলাইন মেশ সক্রিয়'}
          </span>
        </div>
        <p className="font-body text-xs text-on-surface-variant leading-relaxed">
          {language === 'en'
            ? 'If cellular networks fail, SafeNow routes emergency beacons via peer-to-peer Bluetooth mesh relays to government search & rescue stations.'
            : 'মোবাইল নেটওয়ার্ক বন্ধ থাকলেও সেফনাউ পিয়ার-টু-পিয়ার ব্লুটুথ মেশ নেটওয়ার্কের মাধ্যমে উদ্ধারকারী স্টেশনে সিগন্যাল পৌঁছে দেয়।'}
        </p>
      </section>
    </div>
  );
};
