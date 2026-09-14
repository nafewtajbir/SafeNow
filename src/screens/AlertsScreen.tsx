import React, { useState } from 'react';
import { IncidentAlert, Language, TabType } from '../types';
import { generateAIAlert } from '../services/aiService';

interface AlertsScreenProps {
  alerts: IncidentAlert[];
  language: Language;
  onNavigateTab: (tab: TabType) => void;
  onRequestAid: () => void;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  alerts,
  language,
  onNavigateTab,
  onRequestAid,
}) => {
  const [filter, setFilter] = useState<'all' | 'nearby' | 'important' | 'resolved'>('all');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [customAIAlert, setCustomAIAlert] = useState<IncidentAlert | null>(null);
  const [protocolSteps, setProtocolSteps] = useState([
    { id: 's1', textEn: 'Move to higher ground (Khulshi/GEC ridge) or upper floors', textBn: 'উঁচু স্থানে (খুলশী/জিইসি) বা ওপরের তলায় অবস্থান নিন', icon: 'arrow_upward', checked: true },
    { id: 's2', textEn: 'Stay away from Karnaphuli tidal runoff & exposed CDA drains', textBn: 'কর্ণফুলীর জোয়ারের পানি ও উন্মুক্ত সিডিএ ড্রেন থেকে নিরাপদ দূরত্বে থাকুন', icon: 'warning', checked: true },
    { id: 's3', textEn: 'Keep phone charged & backup power bank accessible', textBn: 'ফোন চার্জ রাখুন এবং ব্যাকআপ পাওয়ার ব্যাংক কাছে রাখুন', icon: 'battery_charging_full', checked: false },
    { id: 's4', textEn: 'Listen to designated Port Authority & Fire Service guidelines', textBn: 'বন্দর কর্তৃপক্ষ ও ফায়ার সার্ভিসের দিকনির্দেশনা মেনে চলুন', icon: 'record_voice_over', checked: false },
  ]);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);

  const toggleStep = (id: string) => {
    setProtocolSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s))
    );
  };

  const handleGenerateAIAlert = async () => {
    setIsGeneratingAI(true);
    try {
      const newAlert = await generateAIAlert('Agrabad & Halishahar, Chattogram', 'Tidal Surge & Monsoonal Cloudburst', language);
      setCustomAIAlert(newAlert);
      if (newAlert.steps && newAlert.steps.length > 0) {
        setProtocolSteps(
          newAlert.steps.map((st, i) => ({
            id: `ai-step-${i}`,
            textEn: st,
            textBn: st,
            icon: 'check_circle',
            checked: false,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to generate AI alert:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const currentAlertList = customAIAlert ? [customAIAlert, ...alerts] : alerts;

  const filteredAlerts = currentAlertList.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'nearby') return a.location.includes('Agrabad') || a.location.includes('Halishahar') || a.location.includes('Patenga');
    if (filter === 'important') return a.category === 'emergency';
    if (filter === 'resolved') return a.category === 'safe';
    return true;
  });

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto px-4 pb-28 pt-2 gap-4">
      {/* Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar -mx-4 px-4">
        <button
          onClick={() => setFilter('all')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-full font-headline text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
          type="button"
        >
          <span>{language === 'en' ? 'All' : 'সকল'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-on-primary/20 text-[10px] font-bold">4</span>
        </button>

        <button
          onClick={() => setFilter('nearby')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-full font-headline text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            filter === 'nearby'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
          type="button"
        >
          <span>{language === 'en' ? 'Nearby' : 'নিকটবর্তী'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface text-[10px] font-bold">2</span>
        </button>

        <button
          onClick={() => setFilter('important')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-full font-headline text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            filter === 'important'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
          type="button"
        >
          <span>{language === 'en' ? 'Important' : 'জরুরি'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold">1</span>
        </button>

        <button
          onClick={() => setFilter('resolved')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-full font-headline text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            filter === 'resolved'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
          type="button"
        >
          <span>{language === 'en' ? 'Resolved' : 'সমাধানকৃত'}</span>
        </button>
      </div>

      {/* AI Live Bulletin Generation Banner */}
      <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center flex-shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          </div>
          <div className="min-w-0">
            <p className="font-headline font-bold text-xs text-on-surface truncate">
              {language === 'en' ? 'AI Incident Bulletin Generator' : 'এআই জরুরি বুলেটিন জেনারেটর'}
            </p>
            <p className="font-body text-[11px] text-on-surface-variant truncate">
              {language === 'en' ? 'Powered by Gemini 3.8 Flash real-time reasoning' : 'জেমিনাই ৩.৮ ফ্ল্যাশ রিয়েল-টাইম এআই মডেল'}
            </p>
          </div>
        </div>
        <button
          onClick={handleGenerateAIAlert}
          disabled={isGeneratingAI}
          className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-headline text-xs font-bold shadow-xs hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer disabled:opacity-50"
          type="button"
        >
          <span className={`material-symbols-outlined text-[16px] ${isGeneratingAI ? 'animate-spin' : ''}`}>
            {isGeneratingAI ? 'sync' : 'bolt'}
          </span>
          <span>{isGeneratingAI ? (language === 'en' ? 'Drafting...' : 'তৈরি হচ্ছে...') : (language === 'en' ? 'Draft AI Bulletin' : 'বুলেটিন তৈরি')}</span>
        </button>
      </div>

      {/* Active Critical Emergency Incident Card */}
      {(filter === 'all' || filter === 'important' || filter === 'nearby') && (
        <article className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl flex flex-col transition-all border border-error-container">
          {/* Crimson Alert Header Accent */}
          <div className="p-4 bg-error-container/40 flex flex-col gap-1 border-b border-error-container/60">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error text-on-error shadow-[0_0_16px_rgba(186,26,26,0.35)]">
                <span className="w-2 h-2 rounded-full bg-surface animate-ping" />
                <span className="font-headline text-[10px] font-bold tracking-wider uppercase">
                  EMERGENCY
                </span>
                <span className="font-headline text-[10px] font-semibold opacity-90">
                  (জরুরি অবস্থা)
                </span>
              </div>
              <span className="font-headline text-xs text-error flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {language === 'en' ? 'Live Alert' : 'সরাসরি সতর্কতা'}
              </span>
            </div>

            <div className="mt-1">
              <h2 className="font-headline font-bold text-lg text-on-error-container leading-tight">
                {customAIAlert
                  ? language === 'en'
                    ? customAIAlert.titleEn
                    : customAIAlert.titleBn
                  : 'FLOOD ALERT • Agrabad & Halishahar Lowlands'}
              </h2>
              <p className="font-headline text-xs text-error/90 mt-0.5 font-medium">
                {customAIAlert
                  ? language === 'en'
                    ? customAIAlert.titleBn
                    : customAIAlert.titleEn
                  : 'বন্যার সতর্কতা • নিচু এলাকা এড়িয়ে চলুন'}
              </p>
            </div>
          </div>

          {/* Incident Body */}
          <div className="p-4 flex flex-col gap-4">
            {/* Description & Telemetry Spark */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">tsunami</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-on-surface leading-relaxed">
                  {customAIAlert
                    ? language === 'en'
                      ? customAIAlert.descEn
                      : customAIAlert.descBn
                    : (
                      <>
                        Water levels in <strong className="font-bold">Karnaphuli River estuary</strong> are rising with tidal surge (<span className="text-error font-semibold">+0.85m</span>). Avoid submerged road channels in Agrabad Commercial Area.
                      </>
                    )}
                </p>
                <p className="font-body text-xs text-on-surface-variant mt-1">
                  {customAIAlert
                    ? language === 'en'
                      ? customAIAlert.descBn
                      : customAIAlert.descEn
                    : 'কর্ণফুলী নদীর মোহনায় জোয়ারের কারণে পানির স্তর দ্রুত বৃদ্ধি পাচ্ছে (+০.৮৫ মি)। আগ্রাবাদ বাণিজ্যিক এলাকার নিচু রাস্তা পরিহার করুন।'}
                </p>
              </div>
            </div>

            {/* Quick Interactive Accordion: Context */}
            <div className="bg-surface-container-low rounded-xl transition-all overflow-hidden border border-surface-container">
              <button
                type="button"
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                className="w-full flex items-center justify-between p-3 cursor-pointer select-none text-left"
              >
                <span className="flex items-center gap-1.5 font-headline text-xs font-semibold text-tertiary">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <span>{language === 'en' ? 'What this means for you' : 'আপনার করণীয় কী?'}</span>
                </span>
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform duration-200 text-secondary ${
                    isAccordionOpen ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
              {isAccordionOpen && (
                <div className="px-3 pb-3 pt-1 text-on-surface-variant font-body text-xs bg-surface-container-low leading-relaxed animate-in fade-in">
                  {language === 'en'
                    ? 'Some arterial roads and ground floor parking zones may become impassable within the next 45 minutes. Commuters are advised to defer non-essential travel.'
                    : 'পরবর্তী ৪৫ মিনিটের মধ্যে কিছু প্রধান রাস্তা ও নিচতলার পার্কিং এলাকায় পানি জমে যেতে পারে। অপ্রয়োজনীয় যাতায়াত স্থগিত রাখার পরামর্শ দেওয়া হচ্ছে।'}
                </div>
              )}
            </div>

            {/* Action Checklist HUD */}
            <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3 border border-surface-container">
              <div className="flex items-center justify-between mb-1">
                <span className="font-headline text-xs text-on-surface font-bold uppercase tracking-wider">
                  {language === 'en' ? 'Immediate Safety Protocol' : 'জরুরি নিরাপত্তা প্রোটোকল'}
                </span>
                <span className="font-headline text-[10px] text-primary font-bold">
                  {protocolSteps.filter((s) => s.checked).length}/4 {language === 'en' ? 'Steps Completed' : 'ধাপ সম্পন্ন'}
                </span>
              </div>

              {protocolSteps.map((step) => (
                <label
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-lowest shadow-xs cursor-pointer select-none hover:bg-primary-fixed/10 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={step.checked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-primary focus:ring-0 accent-primary cursor-pointer"
                  />
                  <span
                    className={`font-body text-xs flex-1 transition-all ${
                      step.checked
                        ? 'text-on-surface line-through opacity-70'
                        : 'text-on-surface font-medium'
                    }`}
                  >
                    {language === 'en' ? step.textEn : step.textBn}
                  </span>
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    {step.icon}
                  </span>
                </label>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => onNavigateTab('safety-map')}
                className="w-full min-h-[52px] rounded-full bg-error text-on-error font-headline text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-error/25 active:scale-[0.98] transition-transform cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[22px]">night_shelter</span>
                <span>
                  {language === 'en'
                    ? 'FIND SAFE PLACE (আশ্রয়কেন্দ্র খুঁজুন)'
                    : 'আশ্রয়কেন্দ্র খুঁজুন (FIND SAFE PLACE)'}
                </span>
              </button>

              <button
                onClick={() => onNavigateTab('safety-map')}
                className="w-full min-h-[48px] rounded-full bg-surface-container-high text-on-surface font-headline text-xs font-bold flex items-center justify-center gap-2 hover:bg-surface-variant active:scale-[0.98] transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px] text-tertiary">map</span>
                <span>
                  {language === 'en'
                    ? 'VIEW HAZARD BOUNDARIES ON MAP'
                    : 'ম্যাপে ঝুঁকিপূর্ণ সীমানা দেখুন'}
                </span>
              </button>
            </div>

            {/* Verified Engine Meta Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-surface-container-high/40">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                <span className="font-headline text-[11px] text-on-surface-variant font-medium">
                  Verified SafeNow AI Core
                </span>
              </div>
              <span className="font-headline text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
                Simulation Data
              </span>
            </div>
          </div>
        </article>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h3 className="font-headline font-semibold text-lg text-on-surface">
            {language === 'en' ? 'Timeline Logs' : 'টাইমলাইন লগ'}
          </h3>
          <p className="font-headline text-xs text-on-surface-variant">
            পূর্ববর্তী হালনাগাদ ও পূর্বসতর্কতা
          </p>
        </div>
        <span className="font-headline text-xs text-secondary bg-surface-container px-2.5 py-1 rounded-full font-medium">
          Zone: Chattogram Metropolitan
        </span>
      </div>

      {/* Incident Timeline List */}
      <div className="flex flex-col gap-3 relative">
        {/* Connecting Vertical Bar */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-surface-container-highest z-0" />

        {/* Timeline Item 1: Heavy Rain Warning */}
        <div className="relative z-10 p-4 rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container flex flex-col gap-2 transition-transform active:scale-[0.99]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest text-tertiary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">rainy</span>
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest text-tertiary font-headline text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  WATCH ALERT
                </div>
                <h4 className="font-headline text-sm text-on-surface font-bold mt-0.5">
                  MONSOON SQUALL WARNING
                </h4>
              </div>
            </div>
            <span className="font-headline text-xs text-secondary shrink-0">20 min ago</span>
          </div>
          <p className="font-body text-xs text-on-surface-variant pl-11 leading-relaxed">
            Squally winds and coastal showers in Patenga & Port Belt. Expected <strong>50mm</strong> cloudburst volume over the next 2 hours.
          </p>
          <div className="flex items-center justify-between pl-11 pt-1">
            <span className="font-headline text-[11px] text-secondary font-medium">
              প্রবল বর্ষণ ও দমকা হাওয়ার সতর্কতা • বঙ্গোপসাগর ও পতেঙ্গা
            </span>
            <button
              onClick={() =>
                setExpandedTimelineId(expandedTimelineId === 't1' ? null : 't1')
              }
              className="font-headline text-xs text-primary font-bold inline-flex items-center gap-0.5 hover:underline cursor-pointer"
              type="button"
            >
              <span>{expandedTimelineId === 't1' ? 'Hide' : 'View Details'}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          {expandedTimelineId === 't1' && (
            <div className="pl-11 pt-2 text-xs text-secondary bg-surface-container-low p-2 rounded-lg mt-1 animate-in fade-in">
              Chattogram Port warning signal #3 hoisted. Coastal speedboats on standby at Patenga Naval base.
            </div>
          )}
        </div>

        {/* Timeline Item 2: All Clear Safe Status */}
        <div className="relative z-10 p-4 rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container flex flex-col gap-2 transition-transform active:scale-[0.99]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-headline text-[10px] font-bold">
                  SAFE
                </div>
                <h4 className="font-headline text-sm text-on-surface font-bold mt-0.5">
                  ALL CLEAR • Khulshi & Nasirabad
                </h4>
              </div>
            </div>
            <span className="font-headline text-xs text-secondary shrink-0">2 hrs ago</span>
          </div>
          <p className="font-body text-xs text-on-surface-variant pl-11 leading-relaxed">
            Elevated hillside zones remain safe from tidal surge. Normal transit corridors and CDA flyover routes are operational.
          </p>
          <div className="flex items-center justify-between pl-11 pt-1">
            <span className="font-headline text-[11px] text-primary font-medium">
              বিপদমুক্ত • খুলশী ও নাসিরাবাদ স্বাভাবিক অবস্থায় রয়েছে
            </span>
            <button
              onClick={() =>
                setExpandedTimelineId(expandedTimelineId === 't2' ? null : 't2')
              }
              className="font-headline text-xs text-primary font-bold inline-flex items-center gap-0.5 hover:underline cursor-pointer"
              type="button"
            >
              <span>{expandedTimelineId === 't2' ? 'Hide' : 'Details'}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          {expandedTimelineId === 't2' && (
            <div className="pl-11 pt-2 text-xs text-secondary bg-surface-container-low p-2 rounded-lg mt-1 animate-in fade-in">
              CDA maintenance crew confirmed storm water drainage is rapid in Nasirabad and GEC circle.
            </div>
          )}
        </div>
      </div>

      {/* Community Emergency Desk */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex items-start gap-3 mt-1 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="font-headline text-sm text-on-surface font-bold">
            {language === 'en'
              ? 'Community Emergency Desk (সহায়তা কেন্দ্র)'
              : 'কমিউনিটি সহায়তা কেন্দ্র (Emergency Desk)'}
          </h5>
          <p className="font-body text-xs text-on-surface-variant mt-0.5 leading-relaxed">
            {language === 'en'
              ? 'Need rescue boats, clean water rations, or emergency shelter dispatch? SafeNow civic teams are on standby across Agrabad, Halishahar & Port Gate.'
              : 'উদ্ধারকারী বোট, বিশুদ্ধ পানি বা আশ্রয়কেন্দ্রের সহায়তা প্রয়োজন? সেফনাউ টিম আগ্রাবাদ, হালিশহর ও বন্দর গেট এলাকায় প্রস্তুত রয়েছে।'}
          </p>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <a
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest text-error font-headline text-xs font-bold shadow-xs active:scale-95 transition-transform"
              href="tel:999"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span>{language === 'en' ? 'Call 999 Hotline' : '৯৯৯ হেল্পলাইনে কল'}</span>
            </a>
            <button
              onClick={onRequestAid}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary font-headline text-xs font-bold shadow-xs active:scale-95 transition-transform cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">volunteer_activism</span>
              <span>{language === 'en' ? 'Request Aid' : 'সাহায্যের আবেদন'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
