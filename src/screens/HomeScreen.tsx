import React, { useState, useEffect } from 'react';
import { Language, TabType, AIRiskAssessment, UserCoordinates, DispatchService } from '../types';
import { useRealtimeTelemetry } from '../hooks/useRealtimeTelemetry';
import { assessLocationRisk } from '../services/aiService';
import { DISPATCH_SERVICES } from '../data';

interface HomeScreenProps {
  language: Language;
  currentLocation: string;
  isLocationSafe: boolean;
  onNavigateTab: (tab: TabType) => void;
  onChangeLocationClick: () => void;
  onOpenAICompanion: (prompt?: string) => void;
  onOpenWeatherDetail: () => void;
  isDemoSimulationRunning: boolean;
  onToggleDemoSimulation: () => void;
  userCoordinates?: UserCoordinates | null;
  isGPSActive?: boolean;
  onDetectCurrentLocation?: () => void;
  isLocatingGPS?: boolean;
  onOpenDispatchModal?: (service: DispatchService) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  currentLocation,
  isLocationSafe,
  onNavigateTab,
  onChangeLocationClick,
  onOpenAICompanion,
  onOpenWeatherDetail,
  isDemoSimulationRunning,
  onToggleDemoSimulation,
  userCoordinates,
  isGPSActive,
  onDetectCurrentLocation,
  isLocatingGPS,
  onOpenDispatchModal,
}) => {
  const { telemetry, isConnected } = useRealtimeTelemetry();
  const [isScanningAI, setIsScanningAI] = useState(false);
  const [aiAssessment, setAiAssessment] = useState<AIRiskAssessment | null>(null);

  // Trigger AI assessment on location change or demo simulation toggle
  useEffect(() => {
    let isCancelled = false;
    const runAssessment = async () => {
      setIsScanningAI(true);
      try {
        const assessment = await assessLocationRisk(
          currentLocation,
          telemetry.rainfallRateMmH,
          telemetry.tidalHeightM,
          isDemoSimulationRunning,
          isDemoSimulationRunning ? 'tidal_surge_monsoon' : 'standard_monsoon',
          language
        );
        if (!isCancelled) {
          setAiAssessment(assessment);
        }
      } catch {
        // Fallback already returned by assessLocationRisk
      } finally {
        if (!isCancelled) {
          setIsScanningAI(false);
        }
      }
    };

    runAssessment();
    return () => {
      isCancelled = true;
    };
  }, [currentLocation, isDemoSimulationRunning, language]);

  const effectiveSafe = aiAssessment ? aiAssessment.isSafe : (isLocationSafe && !isDemoSimulationRunning);

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto px-4 space-y-4 pb-28 pt-2">
      {/* Greeting & HUD Header Area */}
      <div className="flex flex-col pt-1">
        <div className="flex items-center justify-between">
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            {language === 'en' ? 'Good morning, Maya 👋' : 'শুভ সকাল, মায়া 👋'}
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-headline text-[10px] font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              {isConnected ? 'LIVE TELEMETRY' : 'REAL-TIME HUD'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant font-headline text-xs font-semibold flex-wrap">
          <span className="material-symbols-outlined text-[16px] text-primary">
            {isGPSActive ? 'my_location' : 'near_me'}
          </span>
          <span className="font-semibold text-on-surface">{currentLocation}</span>
          {isGPSActive && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[9px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              GPS LIVE
            </span>
          )}
          <span>•</span>
          <span className="text-secondary font-mono">{telemetry.timestamp}</span>
          <span>•</span>
          <span className="text-tertiary font-bold">
            {isDemoSimulationRunning
              ? language === 'en'
                ? 'Simulation Running'
                : 'সিমুলেশন চলছে'
              : language === 'en'
              ? 'AI Monitored'
              : 'এআই পর্যবেক্ষণাধীন'}
          </span>
        </div>
      </div>

      {/* REAL-TIME CHATTOGRAM COASTAL TELEMETRY TICKER */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-surface-container-low border border-surface-container shadow-xs">
        <div className="flex flex-col">
          <span className="font-headline text-[10px] text-on-surface-variant uppercase font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {language === 'en' ? 'Karnaphuli Tide' : 'কর্ণফুলী জোয়ার'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline font-bold text-base text-on-surface">
              {telemetry.tidalHeightM}m
            </span>
            <span className="text-[10px] text-tertiary font-bold">
              {telemetry.tideTrend === 'rising' ? '▲' : '▼'}
            </span>
          </div>
          <span className="text-[10px] text-on-surface-variant/80">
            {language === 'en' ? 'High Tide Level' : 'সর্বোচ্চ স্তর'}
          </span>
        </div>

        <div className="flex flex-col border-x border-surface-container px-2">
          <span className="font-headline text-[10px] text-on-surface-variant uppercase font-bold">
            {language === 'en' ? 'Rain Rate' : 'বৃষ্টির তীব্রতা'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline font-bold text-base text-on-surface">
              {telemetry.rainfallRateMmH}
            </span>
            <span className="text-[10px] text-on-surface-variant">mm/h</span>
          </div>
          <span className="text-[10px] text-on-surface-variant/80">
            {language === 'en' ? 'Coastal Squall' : 'উপকূলীয় বর্ষণ'}
          </span>
        </div>

        <div className="flex flex-col pl-1">
          <span className="font-headline text-[10px] text-on-surface-variant uppercase font-bold">
            {language === 'en' ? 'CDA Sluices' : 'সিডিএ স্লুইস'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline font-bold text-base text-primary">
              {telemetry.cdaGatesActive}/12
            </span>
          </div>
          <span className="text-[10px] text-primary font-semibold">
            {language === 'en' ? 'Active Drainage' : 'সক্রিয় নিষ্কাশন'}
          </span>
        </div>
      </div>

      {/* 1. YOUR SAFETY STATUS CARD (POWERED BY GEMINI AI) */}
      <div
        className={`relative overflow-hidden rounded-[2rem] bg-surface-container-lowest p-6 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.06)] border transition-all ${
          !effectiveSafe
            ? 'border-error/40 shadow-[0_0_24px_-2px_rgba(239,68,68,0.25)]'
            : 'border-primary/20 shadow-[0_0_24px_-2px_rgba(16,185,129,0.2)]'
        }`}
      >
        {/* Ambient subtle background flourish */}
        <div
          className={`absolute -right-10 -bottom-10 w-44 h-44 rounded-full opacity-20 blur-2xl pointer-events-none ${
            !effectiveSafe ? 'bg-error-container' : 'bg-primary-fixed-dim'
          }`}
        />

        <div className="relative z-10 flex flex-col space-y-4">
          {/* Status Badge Capsule */}
          <div className="flex items-center justify-between">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full shadow-xs ${
                !effectiveSafe
                  ? 'bg-error text-on-error'
                  : 'bg-primary-fixed text-on-primary-fixed'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  !effectiveSafe ? 'bg-surface' : 'bg-primary'
                }`}
              />
              <span className="font-headline text-xs font-bold tracking-wide uppercase">
                {!effectiveSafe
                  ? language === 'en'
                    ? 'CAUTION: FLOOD SURGE'
                    : 'সতর্কতা: জোয়ারের পানি বৃদ্ধি'
                  : language === 'en'
                  ? "YOU'RE SAFE"
                  : 'আপনি নিরাপদে আছেন'}
              </span>
              <span className="text-[14px]">
                {!effectiveSafe ? '⚠️' : '🛡️'}
              </span>
            </div>

            <button
              onClick={() => {
                setIsScanningAI(true);
                assessLocationRisk(
                  currentLocation,
                  telemetry.rainfallRateMmH,
                  telemetry.tidalHeightM,
                  isDemoSimulationRunning,
                  'manual_scan',
                  language
                ).then((res) => {
                  setAiAssessment(res);
                  setIsScanningAI(false);
                });
              }}
              disabled={isScanningAI}
              className="inline-flex items-center gap-1 text-xs font-headline font-bold text-primary hover:text-primary-container disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
              title="Re-run Gemini AI Threat Assessment"
            >
              <span className={`material-symbols-outlined text-[16px] ${isScanningAI ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isScanningAI ? (language === 'en' ? 'AI Scanning...' : 'এআই স্ক্যানিং...') : (language === 'en' ? 'AI Threat Scan' : 'এআই স্ক্যান')}</span>
            </button>
          </div>

          {/* Bilingual Subtitle & Message from AI Assessment */}
          <div>
            <p className="font-headline font-semibold text-lg text-on-surface">
              {aiAssessment
                ? language === 'en'
                  ? aiAssessment.headlineEn
                  : aiAssessment.headlineBn
                : !effectiveSafe
                ? 'সতর্ক থাকুন • নিম্নাঞ্চল প্লাবিত'
                : 'আপনি নিরাপদে আছেন'}
            </p>
            <p className="mt-1 font-body text-sm text-on-surface-variant leading-relaxed">
              {aiAssessment
                ? language === 'en'
                  ? aiAssessment.summaryEn
                  : aiAssessment.summaryBn
                : !effectiveSafe
                ? language === 'en'
                  ? 'Karnaphuli tidal overflow entering low-lying Halishahar and Chaktai corridors. Elevated ridges (Khulshi & GEC) remain dry.'
                  : 'কর্ণফুলী নদীর জোয়ারের পানি হালিশহর ও চাক্তাই এলাকার নিম্নাঞ্চলে প্রবেশ করছে। খুলশী ও জিইসির মতো উঁচু পাহাড়ি এলাকা নিরাপদ।'
                : language === 'en'
                ? 'Your area currently has no active critical alerts. Sluice gates operating normally with calm conditions.'
                : 'আপনার এলাকায় বর্তমানে কোনো সক্রিয় জরুরি সতর্কতা নেই। স্লুইস গেট স্বাভাবিক রয়েছে।'}
            </p>
          </div>

          {/* AI Insight Sub-Card */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low text-on-surface">
            <div className="p-1.5 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-headline text-[10px] text-tertiary font-bold uppercase tracking-wider">
                  {language === 'en' ? 'GEMINI 3.8 AI TELEMETRY MODEL' : 'জেমিনাই ৩.৮ এআই মডেল'}
                </p>
                <span className="font-headline text-[10px] font-bold text-primary">
                  {aiAssessment ? `Risk Score: ${aiAssessment.riskScore}/100` : 'Calibrated'}
                </span>
              </div>
              <p className="font-body text-xs text-on-surface-variant mt-0.5">
                {language === 'en' ? (
                  <>
                    Chattogram coastal AI models a{' '}
                    <strong className="text-on-surface font-semibold">
                      {aiAssessment ? `${100 - aiAssessment.riskScore}% safety index` : isDemoSimulationRunning ? '74% safe perimeter' : '98% safe perimeter'}
                    </strong>{' '}
                    for your coordinates in {currentLocation}.
                  </>
                ) : (
                  <>
                    চট্টগ্রাম উপকূলীয় এআই আপনার {currentLocation} অবস্থানের জন্য একটি{' '}
                    <strong className="text-on-surface font-semibold">
                      {aiAssessment ? `${100 - aiAssessment.riskScore}% নিরাপত্তা সূচক` : isDemoSimulationRunning ? '৭৪% নিরাপদ জোন' : '৯৮% নিরাপদ জোন'}
                    </strong>{' '}
                    নির্ধারণ করেছে।
                  </>
                )}
              </p>
              {aiAssessment?.actionItems && aiAssessment.actionItems.length > 0 && (
                <div className="mt-2 space-y-1">
                  {aiAssessment.actionItems.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-on-surface font-medium">
                      <span className="material-symbols-outlined text-[14px] text-primary">check_small</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Primary Action CTA */}
          <button
            onClick={() => onNavigateTab('safety-map')}
            className="flex items-center justify-center gap-2 w-full min-h-[52px] rounded-full bg-primary text-on-primary font-headline text-sm font-bold shadow-md hover:bg-primary-container active:scale-[0.98] transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">explore</span>
            <span>{language === 'en' ? 'View Safety Map & Shelters' : 'নিরাপত্তা ম্যাপ ও আশ্রয়কেন্দ্র'}</span>
          </button>
        </div>
      </div>

      {/* 2. LOCATION CARD WITH REAL-TIME GPS & CIVIC ZONE CONTROLS */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container shadow-xs border border-surface-container-high/40 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs flex-shrink-0 ${
            isGPSActive ? 'bg-primary-fixed text-on-primary-fixed ring-2 ring-primary/30' : 'bg-surface-container-lowest text-primary'
          }`}>
            <span className="material-symbols-outlined text-[24px]">
              {isGPSActive ? 'my_location' : 'location_on'}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-headline text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                {language === 'en' ? 'Your Location' : 'আপনার অবস্থান'}
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-headline text-[9px] font-bold ${
                  isLocationSafe
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'bg-error-container text-on-error-container'
                }`}
              >
                {isLocationSafe ? (language === 'en' ? 'SAFE' : 'নিরাপদ') : 'CAUTION'}
              </span>
              {isGPSActive && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[8px] font-bold tracking-wider">
                  <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                  GPS ACTIVE
                </span>
              )}
            </div>
            <span className="font-headline font-semibold text-base text-on-surface truncate">
              {currentLocation}
            </span>
            {isGPSActive && userCoordinates ? (
              <span className="font-mono text-[10px] text-secondary truncate flex items-center gap-1">
                <span>{userCoordinates.latitude.toFixed(4)}° N, {userCoordinates.longitude.toFixed(4)}° E</span>
                <span className="text-primary font-headline font-bold text-[9px]">• Geoapify</span>
              </span>
            ) : (
              <span className="font-headline text-[10px] text-secondary truncate">
                {language === 'en' ? 'Civic Zone • Real-Time Geoapify Sync' : 'নাগরিক এলাকা • জিওঅ্যাপিফাই সিঙ্ক'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onDetectCurrentLocation && (
            <button
              onClick={onDetectCurrentLocation}
              disabled={isLocatingGPS}
              title={language === 'en' ? 'Detect Current Location (GPS)' : 'বর্তমান জিপিএস অবস্থান শনাক্ত করুন'}
              className="min-h-[40px] px-2.5 sm:px-3 rounded-full bg-surface-container-lowest text-primary font-headline text-xs font-semibold shadow-xs hover:bg-primary-fixed active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              type="button"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLocatingGPS ? 'animate-spin' : ''}`}>
                my_location
              </span>
              <span className="text-[11px] font-bold">
                {isLocatingGPS
                  ? language === 'en'
                    ? 'Locating...'
                    : 'শনাক্ত...'
                  : language === 'en'
                  ? 'GPS'
                  : 'জিপিএস'}
              </span>
            </button>
          )}
          <button
            onClick={onChangeLocationClick}
            className="min-h-[40px] px-3.5 rounded-full bg-surface-container-lowest text-on-surface font-headline text-xs font-semibold shadow-xs hover:bg-surface-container-high active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            type="button"
          >
            {language === 'en' ? 'Change' : 'পরিবর্তন'}
          </button>
        </div>
      </div>

      {/* 3. "WHAT'S HAPPENING?" CARD (Atmospheric Context) */}
      <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] border border-surface-container-high/30">
        <div
          className="relative h-28 w-full bg-surface-container-high overflow-hidden"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDRzJZ4Amm_SqSFP_ynm6s45FvBsPaf0AvVwszZ32QalpIQhIqTbl_UhFpC7cgaK735mp2kU7nthKJUHDbky6Wi2pLwF72rZL4dmzTAOED1IZmMYTagzP7FqWqUsUkvRbLVgcK60gNG0U1KO56gHNsXiWv_olEGXrB0t0NVn7CxAUaTM40U6dwsmVR9Dichoo-P1KlhOYFRcH9iCAjutiF6CBuiFKjYdtCZ4lTzFKodRM7toC3tNW7wCQ')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Gradient scrim to safeguard text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/85 via-on-surface/35 to-transparent" />
          <div className="absolute top-2.5 left-3 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-headline text-[10px] font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-tertiary">cloudy</span>
            <span>{language === 'en' ? 'Local Weather Radar' : 'স্থানীয় আবহাওয়া রাডার'}</span>
          </div>
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-surface">
            <span className="font-headline font-semibold text-base text-white drop-shadow-sm">
              {language === 'en' ? 'Light Monsoonal Rainfall' : 'হালকা বর্ষাকালীন বৃষ্টিপাত'}
            </span>
            <span className="text-xl">🌧️</span>
          </div>
        </div>

        <div className="p-4 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between text-on-surface-variant font-headline text-xs font-semibold">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-tertiary">water_drop</span>
              <span>{language === 'en' ? 'Precipitation: 12mm/hr' : 'বৃষ্টির হার: ১২ মিমি/ঘণ্টা'}</span>
            </span>
            <span className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>{language === 'en' ? 'Drainage Normal' : 'পানি নিষ্কাশন স্বাভাবিক'}</span>
            </span>
          </div>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            {language === 'en'
              ? 'Low-lying Agrabad and Halishahar drainage channels are operating with CDA tidal sluice gates. No unexpected blockage on primary port corridors.'
              : 'আগ্রাবাদ ও হালিশহরের নিষ্কাশন নালাসমূহ সিডিএ জোয়ার-ভাটা স্লুইস গেটের মাধ্যমে পরিচালিত হচ্ছে। বন্দর সংযোগ সড়কে বড় কোনো বিঘ্ন নেই।'}
          </p>
          <button
            onClick={onOpenWeatherDetail}
            className="inline-flex items-center gap-1 font-headline text-xs text-primary font-bold hover:underline pt-1 cursor-pointer w-fit text-left"
            type="button"
          >
            <span>{language === 'en' ? 'Learn More' : 'বিস্তারিত দেখুন'}</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* 4. QUICK ACTIONS (2x2 Playful Bento Grid) */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-headline font-semibold text-lg text-on-surface">
            {language === 'en' ? 'Quick Actions' : 'দ্রুত পদক্ষেপ'}
          </span>
          <span className="font-headline text-xs text-on-surface-variant font-medium">
            {language === 'en' ? 'One-tap Response' : 'এক-ক্লিকে সেবা'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Action 1: Find Shelters */}
          <button
            onClick={() => onNavigateTab('safety-map')}
            className="flex flex-col justify-between p-3.5 rounded-2xl bg-secondary-container text-on-secondary-container hover:shadow-md transition-all active:scale-[0.98] min-h-[120px] text-left cursor-pointer"
            type="button"
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-secondary shadow-xs text-xl">
                🗺️
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary">
                north_east
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-headline font-bold text-base text-on-surface truncate">
                {language === 'en' ? 'Find Shelters' : 'আশ্রয়কেন্দ্র'}
              </p>
              <p className="font-body text-xs text-secondary truncate mt-0.5">
                {language === 'en' ? 'Medical & Relief Hubs' : 'মেডিকেল ও ত্রাণ কেন্দ্র'}
              </p>
            </div>
          </button>

          {/* Action 2: Risk Map */}
          <button
            onClick={() => onNavigateTab('safety-map')}
            className="flex flex-col justify-between p-3.5 rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed hover:shadow-md transition-all active:scale-[0.98] min-h-[120px] text-left cursor-pointer"
            type="button"
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-tertiary shadow-xs text-xl">
                📍
              </span>
              <span className="material-symbols-outlined text-[18px] text-tertiary">layers</span>
            </div>
            <div className="min-w-0">
              <p className="font-headline font-bold text-base text-on-surface truncate">
                {language === 'en' ? 'Risk Map' : 'ঝুঁকি মানচিত্র'}
              </p>
              <p className="font-body text-xs text-on-tertiary-fixed-variant truncate mt-0.5">
                {language === 'en' ? 'Live Safe Zones' : 'লাইভ নিরাপদ এলাকা'}
              </p>
            </div>
          </button>

          {/* Action 3: Alert Feed */}
          <button
            onClick={() => onNavigateTab('alerts')}
            className="flex flex-col justify-between p-3.5 rounded-2xl bg-surface-container-high text-on-surface hover:shadow-md transition-all active:scale-[0.98] min-h-[120px] text-left cursor-pointer"
            type="button"
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs text-xl">
                🚨
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-error" />
            </div>
            <div className="min-w-0">
              <p className="font-headline font-bold text-base text-on-surface truncate">
                {language === 'en' ? 'Alert Feed' : 'সতর্কতা ফিড'}
              </p>
              <p className="font-body text-xs text-on-surface-variant truncate mt-0.5">
                {language === 'en' ? '3 regional updates' : '৩টি আঞ্চলিক আপডেট'}
              </p>
            </div>
          </button>

          {/* Action 4: Get Help */}
          <button
            onClick={() => onNavigateTab('get-help')}
            className="flex flex-col justify-between p-3.5 rounded-2xl bg-error-container text-on-error-container hover:shadow-[0_0_16px_-2px_rgba(186,26,26,0.3)] transition-all active:scale-[0.98] min-h-[120px] text-left cursor-pointer"
            type="button"
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-error shadow-xs text-xl">
                🆘
              </span>
              <span className="material-symbols-outlined text-[18px] text-error font-bold animate-pulse">
                sos
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-headline font-bold text-base text-on-error-container truncate">
                {language === 'en' ? 'Get Help' : 'সাহায্য নিন'}
              </p>
              <p className="font-body text-xs text-on-error-container/80 truncate mt-0.5">
                {language === 'en' ? 'Instant SOS Dispatch' : 'জরুরি এসওএস বার্তা'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* DIRECT DISPATCH SERVICES: MEDICAL, RESCUE, SHELTER, CLEAN WATER, FOOD */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] border border-surface-container-high/40 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
            <h3 className="font-headline font-bold text-base text-on-surface">
              {language === 'en' ? 'Direct Dispatch Services' : 'সরাসরি রেসকিউ সেবা'}
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('get-help')}
            className="font-headline text-xs text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            type="button"
          >
            <span>{language === 'en' ? 'View All' : 'সবগুলো দেখুন'}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {DISPATCH_SERVICES.map((service) => (
            <button
              key={service.id}
              onClick={() => {
                if (onOpenDispatchModal) {
                  onOpenDispatchModal(service);
                } else {
                  onNavigateTab('get-help');
                }
              }}
              className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container active:scale-95 transition-all text-left flex flex-col justify-between min-h-[96px] border border-surface-container cursor-pointer group shadow-xs"
              type="button"
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${service.colorClass}`}
                >
                  <span className="material-symbols-outlined text-[20px]">{service.icon}</span>
                </span>
                <span className="material-symbols-outlined text-[16px] text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  north_east
                </span>
              </div>
              <div className="mt-2">
                <p className="font-headline font-bold text-xs text-on-surface leading-tight truncate">
                  {language === 'en' ? service.titleEn : service.titleBn}
                </p>
                <p className="font-body text-[10px] text-primary font-semibold mt-0.5 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">send</span>
                  <span>{language === 'en' ? 'Request Aid' : 'আবেদন'}</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. SAFENOW AI COMPANION TEASER */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] flex flex-col space-y-3 border border-surface-container-high/30">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <img
              className="w-11 h-11 rounded-2xl object-cover bg-surface-container"
              alt="SafeNow AI Avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxeH16MBen-XfsFgjPWeMkZ4it3a2k6BAGVYc6CssEVrcHxYEk4fqUpM-V1_-XIAL9tIzrD4B64xEjiNyMnSbSPxIG73KlRpqvYsFk6P1zpfOCs9_eVuV3PArqMmn305JUQRm1PEOuLMpTd4B589_0NIj8Fr_6gG7lBJuAqOfVYGQqaQJCzFcV-I5JaIeOb3yNKEX5T7-RhdPY-F-R3fQSEwupE-uNVaWyZ-LNR9A7-mlfmfe_-42slw"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center text-[8px] text-on-primary font-bold">
              ✨
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-bold text-base text-on-surface">SafeNow AI</span>
              <span className="px-1.5 py-0.5 rounded-md bg-primary-fixed text-on-primary-fixed font-headline text-[10px] font-bold">
                {language === 'en' ? 'Companion' : 'সহচর'}
              </span>
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              {language === 'en'
                ? '"Need quick advice or shelter directions? Ask me anything."'
                : '"দ্রুত পরামর্শ বা আশ্রয়কেন্দ্রের পথ জানতে আমাকে যেকোনো কিছু জিজ্ঞাসা করুন।"'}
            </p>
          </div>
        </div>

        {/* Suggested Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
          <button
            onClick={() =>
              onOpenAICompanion(
                language === 'en' ? 'Am I safe right now?' : 'আমি কি এখন নিরাপদ?'
              )
            }
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container text-on-surface font-headline text-xs font-semibold hover:bg-primary-fixed hover:text-on-primary-fixed active:scale-95 transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">security</span>
            <span>{language === 'en' ? 'Am I safe right now?' : 'আমি কি এখন নিরাপদ?'}</span>
          </button>
          <button
            onClick={() =>
              onOpenAICompanion(
                language === 'en' ? 'Nearest open shelter' : 'নিকটবর্তী খোলা আশ্রয়কেন্দ্র'
              )
            }
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container text-on-surface font-headline text-xs font-semibold hover:bg-primary-fixed hover:text-on-primary-fixed active:scale-95 transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">near_me</span>
            <span>{language === 'en' ? 'Nearest open shelter' : 'নিকটবর্তী খোলা আশ্রয়কেন্দ্র'}</span>
          </button>
        </div>
      </div>

      {/* 6. SCIENCE FAIR DEMO MODE SWITCH BANNER */}
      <div className="p-4 rounded-2xl bg-surface-container-highest flex flex-col items-center text-center space-y-2 border border-surface-container-high/50">
        <button
          onClick={onToggleDemoSimulation}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-headline text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer ${
            isDemoSimulationRunning
              ? 'bg-error text-on-error'
              : 'bg-inverse-surface text-inverse-on-surface'
          }`}
          id="demo-toggle-btn"
          type="button"
        >
          <span className="text-base">🧪</span>
          <span>
            {isDemoSimulationRunning
              ? language === 'en'
                ? 'Disaster Scenario Running...'
                : 'দুর্যোগ পরিস্থিতি সিমুলেশন চলছে...'
              : language === 'en'
              ? 'Science Fair Demo Mode Active'
              : 'সায়েন্স ফেয়ার ডেমো মোড সক্রিয়'}
          </span>
          <span className="material-symbols-outlined text-[16px] text-primary-fixed">
            {isDemoSimulationRunning ? 'pause_circle' : 'play_circle'}
          </span>
        </button>
        <p className="font-headline text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
          {language === 'en'
            ? 'Educational Simulation — Not a Real Emergency Alert'
            : 'শিক্ষামূলক সিমুলেশন — বাস্তব কোনো জরুরি সতর্কতা নয়'}
        </p>

        {isDemoSimulationRunning && (
          <div
            className="w-full p-2.5 rounded-xl bg-error-container text-on-error-container font-headline text-xs font-semibold animate-in fade-in"
            id="demo-notification"
          >
            {language === 'en'
              ? 'Simulating: Coastal Tidal Surge & Flash Flood Warning triggered for Karnaphuli Estuary & Halishahar.'
              : 'সিমুলেশন চলছে: কর্ণফুলী মোহনা ও হালিশহরে জোয়ারের স্ফীতি ও আকস্মিক বন্যার সতর্কবার্তা জারি।'}
          </div>
        )}
      </div>
    </div>
  );
};
