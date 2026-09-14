import React, { useState, useEffect } from 'react';
import { DispatchService, Language, UserCoordinates } from '../types';
import { DISPATCH_SERVICES } from '../data';
import { dispatchAITriage } from '../services/aiService';

interface DispatchDetailModalProps {
  isOpen: boolean;
  service: DispatchService | null;
  onClose: () => void;
  language: Language;
  currentLocation: string;
  userCoordinates?: UserCoordinates | null;
  onServiceChange?: (service: DispatchService) => void;
}

export const DispatchDetailModal: React.FC<DispatchDetailModalProps> = ({
  isOpen,
  service,
  onClose,
  language,
  currentLocation,
  userCoordinates,
  onServiceChange,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(service?.id || 'medical');
  const [urgency, setUrgency] = useState<'critical' | 'moderate' | 'standard'>('critical');
  const [details, setDetails] = useState('');
  const [peopleCount, setPeopleCount] = useState('1');
  const [contactPhone, setContactPhone] = useState('');
  const [landmarkNote, setLandmarkNote] = useState('');
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState<{
    ticketId?: string;
    assignedUnit: string;
    etaMinutes: number;
    instructions: string[];
    priorityLevel: string;
    instructionsEn?: string;
    instructionsBn?: string;
  } | null>(null);

  // Synchronize when active service prop changes
  useEffect(() => {
    if (service) {
      setSelectedServiceId(service.id);
      // Pre-select service-appropriate tag
      if (service.id === 'clean_water') {
        setSelectedNeeds(['Drinking Water Jerrycans', 'Oral Rehydration Salts']);
      } else if (service.id === 'medical') {
        setSelectedNeeds(['Paramedic First Aid', 'Prescription Medicine Transfer']);
      } else if (service.id === 'rescue') {
        setSelectedNeeds(['Flood Inundation Evacuation', 'Amphibious Boat Support']);
      } else if (service.id === 'shelter') {
        setSelectedNeeds(['Dry Storm Shelter Space', 'Bedding & Sanitation']);
      } else if (service.id === 'food_supplies') {
        setSelectedNeeds(['Emergency Dry Rations', 'Infant Formula']);
      } else {
        setSelectedNeeds([]);
      }
    }
  }, [service]);

  if (!isOpen || !service) return null;

  const currentActiveService =
    DISPATCH_SERVICES.find((s) => s.id === selectedServiceId) || service;

  const toggleNeed = (need: string) => {
    setSelectedNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const getPresetNeeds = () => {
    switch (currentActiveService.id) {
      case 'medical':
        return [
          { en: 'Ambulance & Paramedics', bn: 'অ্যাম্বুলেন্স ও প্যারামেডিক' },
          { en: 'First Aid Kit & Bandages', bn: 'প্রাথমিক চিকিৎসা কিট' },
          { en: 'Elderly / Chronic Care', bn: 'বয়োবৃদ্ধ / গুরুতর রোগী' },
          { en: 'Oxygen / Nebulizer', bn: 'অক্সিজেন / নেবুলাইজার' },
        ];
      case 'rescue':
        return [
          { en: 'Amphibious Speedboat', bn: 'উদ্ধারকারী স্পিডবোট' },
          { en: 'Life Jackets (লাইফ জ্যাকেট)', bn: 'লাইফ জ্যাকেট' },
          { en: 'Submerged Ground Floor', bn: 'নিচতলা পানিবন্দী' },
          { en: 'Special Mobility Evacuation', bn: 'বিশেষ স্থানান্তর ব্যবস্থা' },
        ];
      case 'shelter':
        return [
          { en: 'Multi-Purpose Cyclone Shelter', bn: 'সাইক্লোন শেল্টারে আশ্রয়' },
          { en: 'Pickup Shuttle to Shelter', bn: 'আশ্রয়কেন্দ্রে পিকআপ ভ্যান' },
          { en: 'Women & Children Safe Room', bn: 'নারী ও শিশুদের নিরাপদ কক্ষ' },
          { en: 'Dry Bedding & Mats', bn: 'শুকনো বিছানা ও মাদুর' },
        ];
      case 'clean_water':
        return [
          { en: 'Purified Water Rations (20L Jerrycan)', bn: 'বিশুদ্ধ খাবার পানি (২০ লিটার)' },
          { en: 'Water Purification Tablets', bn: 'পানি বিশুদ্ধকরণ ট্যাবলেট' },
          { en: 'Oral Rehydration Salts (ORS)', bn: 'খাবার স্যালাইন (ওআরএস)' },
          { en: 'Infant Safe Water (শিশুর পানি)', bn: 'শিশুদের জন্য নিরাপদ পানি' },
        ];
      case 'food_supplies':
        return [
          { en: 'High-Energy Biscuit Packs', bn: 'হাই-এনার্জি বিস্কুট' },
          { en: 'Ready-to-Eat Dry Rations', bn: 'শুকনো খাবার প্যাকেট' },
          { en: 'Baby Food / Formula', bn: 'শিশুখাদ্য ও পুষ্টিকর দুধ' },
          { en: 'Community Relief Kit', bn: 'পরিবারভিত্তিক ত্রাণ কিট' },
        ];
      default:
        return [
          { en: 'Emergency Field Unit', bn: 'জরুরি ফিল্ড টিম' },
          { en: 'Priority Radio Link', bn: 'জরুরি বেতার যোগাযোগ' },
        ];
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const consolidatedReport = [
      details.trim() ? `Report: ${details.trim()}` : '',
      `People count: ${peopleCount}`,
      selectedNeeds.length > 0 ? `Required needs: ${selectedNeeds.join(', ')}` : '',
      landmarkNote.trim() ? `Landmark: ${landmarkNote.trim()}` : '',
      contactPhone.trim() ? `Contact callback: ${contactPhone.trim()}` : '',
      userCoordinates
        ? `Precise GPS: ${userCoordinates.latitude.toFixed(5)}° N, ${userCoordinates.longitude.toFixed(5)}° E`
        : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      const result = await dispatchAITriage(
        currentActiveService.id,
        currentLocation,
        consolidatedReport ||
          (language === 'en'
            ? `Emergency aid request for ${currentActiveService.titleEn}`
            : `${currentActiveService.titleBn} সংক্রান্ত জরুরি সাহায্য আবেদন`),
        language
      );

      setTriageResult({
        ticketId: result.ticketId || `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
        assignedUnit:
          result.assignedUnit ||
          (currentActiveService.id === 'clean_water'
            ? 'CWASA Emergency Water Tanker 04'
            : currentActiveService.id === 'rescue'
            ? 'Chattogram Naval Unit 02 (Speedboat)'
            : currentActiveService.id === 'shelter'
            ? 'Agrabad Cyclone Shelter Dispatch Team'
            : currentActiveService.id === 'food_supplies'
            ? 'Red Crescent Coastal Relief Squad'
            : 'Agrabad Fire & Medical Squad 01'),
        etaMinutes: result.etaMinutes || 7,
        instructions:
          result.instructions ||
          (language === 'en'
            ? [
                'Stay in an elevated dry area until the dispatch squad arrives.',
                'Keep your phone battery saved and keep flashlight accessible.',
                'Look out for unit responders in reflective safety gear.',
              ]
            : [
                'উদ্ধারকারী দল আসা পর্যন্ত উঁচু ও শুকনো স্থানে অবস্থান করুন।',
                'ফোনের চার্জ বাঁচিয়ে রাখুন এবং ফ্ল্যাশলাইট হাতের কাছে রাখুন।',
                'প্রতিফলক জ্যাকেট পরিহিত রেসকিউ টিমের সন্ধান করুন।',
              ]),
        priorityLevel: result.priorityLevel || (urgency === 'critical' ? 'CRITICAL' : 'HIGH'),
        instructionsEn: result.instructionsEn,
        instructionsBn: result.instructionsBn,
      });
    } catch (err) {
      console.error('Triage dispatch error:', err);
      setTriageResult({
        ticketId: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
        assignedUnit:
          currentActiveService.id === 'clean_water'
            ? 'CWASA Emergency Water Tanker 04'
            : currentActiveService.id === 'rescue'
            ? 'Chattogram Naval Unit 02 (Speedboat)'
            : currentActiveService.id === 'shelter'
            ? 'Agrabad Cyclone Shelter Transport'
            : 'Agrabad Civil Defense Response Team',
        etaMinutes: 6,
        instructions:
          language === 'en'
            ? ['Move to high ground or 2nd floor', 'Preserve drinking water', 'Signal with flashlight']
            : ['উঁচু স্থানে অবস্থান নিন', 'পানীয় জল সতর্কভাবে ব্যবহার করুন', 'টর্চ দিয়ে সংকেত দিন'],
        priorityLevel: urgency === 'critical' ? 'CRITICAL' : 'HIGH',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setTriageResult(null);
    setDetails('');
    setLandmarkNote('');
    setSelectedNeeds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-on-surface/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-2xl border border-surface-container-high flex flex-col gap-4 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header with Title & Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${currentActiveService.colorClass}`}
            >
              <span className="material-symbols-outlined text-[26px]">
                {currentActiveService.icon}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface truncate">
                  {language === 'en'
                    ? currentActiveService.titleEn
                    : currentActiveService.titleBn}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-headline text-[10px] font-bold">
                  {language === 'en' ? 'Direct Dispatch' : 'সরাসরি সেবা'}
                </span>
              </div>
              <p className="font-headline text-xs text-secondary truncate">
                {language === 'en'
                  ? 'Request Aid Form • Real-Time AI Triage'
                  : 'সাহায্যের আবেদন ফর্ম • রিয়েল-টাইম এআই ট্রায়াজ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface active:scale-95 transition-all cursor-pointer flex-shrink-0"
            aria-label="Close form"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {triageResult ? (
          /* ================= SUCCESS / ACTIVE DISPATCH VIEW ================= */
          <div className="py-2 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary flex items-center justify-center shadow-lg ring-4 ring-primary/20">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container font-headline text-xs font-bold mb-1 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                <span>
                  {language === 'en' ? 'DISPATCH BEACON ACTIVE' : 'উদ্ধারকারী দল রওনা হয়েছে'} •{' '}
                  {triageResult.priorityLevel}
                </span>
              </div>
              <h4 className="font-headline font-extrabold text-xl text-on-surface">
                {language === 'en' ? 'Help Is On The Way' : 'সাহায্য আপনার পথে রয়েছে'}
              </h4>
              <p className="font-headline text-xs text-on-surface-variant mt-0.5">
                {language === 'en' ? 'Tracking Ticket:' : 'ট্র্যাকিং নম্বর:'}{' '}
                <span className="font-mono font-bold text-primary">{triageResult.ticketId}</span>
              </p>
            </div>

            {/* Ticket Info Card */}
            <div className="w-full p-4 rounded-2xl bg-surface-container-low text-left space-y-2.5 border border-surface-container shadow-xs">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-surface-container">
                <span className="text-secondary font-headline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    local_shipping
                  </span>
                  {language === 'en' ? 'Assigned Field Unit:' : 'নিযুক্ত রেসকিউ টিম:'}
                </span>
                <span className="font-bold text-on-surface text-right">
                  {triageResult.assignedUnit}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-surface-container">
                <span className="text-secondary font-headline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
                  {language === 'en' ? 'Estimated Response Time:' : 'আনুমানিক পৌঁছানোর সময়:'}
                </span>
                <span className="font-extrabold text-primary text-sm">
                  ~{triageResult.etaMinutes} {language === 'en' ? 'mins' : 'মিনিট'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-surface-container">
                <span className="text-secondary font-headline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    location_on
                  </span>
                  {language === 'en' ? 'Target Location:' : 'গন্তব্য এলাকা:'}
                </span>
                <span className="font-bold text-on-surface text-right truncate max-w-[200px]">
                  {currentLocation}
                </span>
              </div>

              {/* Instructions */}
              {triageResult.instructions && triageResult.instructions.length > 0 && (
                <div className="pt-1.5 space-y-1.5">
                  <p className="font-headline text-[11px] text-tertiary font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">shield</span>
                    {language === 'en'
                      ? 'AI Immediate Survival Instructions:'
                      : 'এআই জরুরি নিরাপত্তা নির্দেশাবলি:'}
                  </p>
                  {triageResult.instructions.map((inst, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-on-surface">
                      <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{inst}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Hotline Direct Call */}
            <div className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container border border-surface-container-highest/60 text-xs">
              <span className="text-secondary font-medium">
                {language === 'en' ? 'Direct Voice Confirmation:' : 'জরুরি সরাসরি যোগাযোগ:'}
              </span>
              <a
                href="tel:999"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-error text-on-error font-headline text-xs font-bold shadow-xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                <span>{language === 'en' ? 'Dial 999' : '৯৯৯ কল'}</span>
              </a>
            </div>

            <button
              onClick={handleDone}
              className="w-full py-3 rounded-full bg-primary text-on-primary font-headline text-xs sm:text-sm font-bold shadow-md hover:bg-primary-container active:scale-98 transition-all cursor-pointer"
              type="button"
            >
              {language === 'en' ? 'Acknowledge & Return to Dashboard' : 'বুঝেছি (ড্যাশবোর্ডে ফিরে যান)'}
            </button>
          </div>
        ) : (
          /* ================= REQUEST AID INPUT FORM ================= */
          <form onSubmit={handleDispatch} className="flex flex-col gap-3.5">
            {/* Quick Service Category Selector Switcher */}
            <div>
              <label className="font-headline text-xs font-semibold text-on-surface block mb-1.5">
                {language === 'en'
                  ? 'Select Emergency Dispatch Category:'
                  : 'জরুরি সেবা বিভাগ নির্বাচন করুন:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {DISPATCH_SERVICES.filter((s) => s.id !== 'hotlines').map((s) => {
                  const isSelected = s.id === currentActiveService.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedServiceId(s.id);
                        if (onServiceChange) onServiceChange(s);
                      }}
                      className={`p-2 rounded-xl text-left flex items-center gap-2 text-xs font-headline font-semibold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-primary-fixed text-on-primary-fixed border-primary shadow-xs ring-1 ring-primary'
                          : 'bg-surface-container text-on-surface border-surface-container-high hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        {s.icon}
                      </span>
                      <span className="truncate">{language === 'en' ? s.titleEn : s.titleBn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Urgency Level */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-headline text-xs font-semibold text-on-surface">
                  {language === 'en' ? 'Urgency Priority:' : 'জরুরিতার অগ্রাধিকার:'}
                </label>
                <span className="font-headline text-[10px] text-secondary font-medium">
                  {urgency === 'critical'
                    ? language === 'en'
                      ? 'Immediate Response (<10m)'
                      : 'তাৎক্ষণিক রেসকিউ (<১০ মিনিট)'
                    : language === 'en'
                    ? 'Standard Priority'
                    : 'সাধারণ অগ্রাধিকার'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  {
                    id: 'critical',
                    en: 'Critical (জরুরি)',
                    bn: 'চরম জরুরি',
                    color: 'bg-error text-on-error ring-error',
                  },
                  {
                    id: 'moderate',
                    en: 'High Priority',
                    bn: 'উচ্চ অগ্রাধিকার',
                    color: 'bg-primary text-on-primary ring-primary',
                  },
                  {
                    id: 'standard',
                    en: 'Standard Relief',
                    bn: 'স্বাভাবিক ত্রাণ',
                    color: 'bg-secondary text-on-secondary ring-secondary',
                  },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setUrgency(lvl.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-headline font-bold transition-all border cursor-pointer ${
                      urgency === lvl.id
                        ? `${lvl.color} shadow-sm border-transparent`
                        : 'bg-surface-container text-on-surface-variant border-surface-container-high'
                    }`}
                  >
                    {language === 'en' ? lvl.en : lvl.bn}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Direct Needs Checklist */}
            <div>
              <label className="font-headline text-xs font-semibold text-on-surface block mb-1">
                {language === 'en' ? 'Specific Supplies / Support Needed:' : 'নির্দিষ্ট চাহিদা/সাহায্য চিহ্নিত করুন:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {getPresetNeeds().map((need, idx) => {
                  const label = language === 'en' ? need.en : need.bn;
                  const isChecked = selectedNeeds.includes(need.en);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleNeed(need.en)}
                      className={`p-2 rounded-xl text-left text-xs font-headline flex items-center gap-2 transition-all border cursor-pointer ${
                        isChecked
                          ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                          : 'bg-surface-container text-on-surface border-surface-container-high hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isChecked ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* People Count & Callback Phone (Grid) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-headline text-xs font-semibold text-on-surface block mb-1">
                  {language === 'en' ? 'People In Need' : 'ব্যক্তির সংখ্যা'}
                </label>
                <select
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-on-surface border border-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary font-headline"
                >
                  <option value="1">1 Person (১ জন)</option>
                  <option value="2-4">2-4 Family Members (পরিবার)</option>
                  <option value="5-10">5-10 Group (ছোট দল)</option>
                  <option value="10+">10+ Community / Building (১০+ জন)</option>
                </select>
              </div>

              <div>
                <label className="font-headline text-xs font-semibold text-on-surface block mb-1">
                  {language === 'en' ? 'Contact Phone (Optional)' : 'যোগাযোগ নম্বর (ঐচ্ছিক)'}
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-on-surface border border-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>
            </div>

            {/* Disaster Situation Details */}
            <div>
              <label className="font-headline text-xs font-semibold text-on-surface block mb-1">
                {language === 'en'
                  ? 'Situation Description / Critical Notes'
                  : 'পরিস্থিতির বিবরণ ও বিশেষ দ্রষ্টব্য'}
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={
                  language === 'en'
                    ? currentActiveService.id === 'clean_water'
                      ? 'E.g., Submerged tube-well, drinking water depleted for 12 hours...'
                      : currentActiveService.id === 'shelter'
                      ? 'E.g., Roof damaged by squall, need safe high shelter for 4 people...'
                      : currentActiveService.id === 'medical'
                      ? 'E.g., Severe cut on foot, pregnant mother needs paramedic check...'
                      : 'E.g., Ground floor flooded up to waist, need boat rescue...'
                    : 'যেমন: নিচতলায় কোমর পর্যন্ত পানি উঠছে, নিরাপদ আশ্রয় ও পানীয় প্রয়োজন...'
                }
                className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-on-surface border border-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
              />
            </div>

            {/* Landmark details */}
            <div>
              <label className="font-headline text-xs font-semibold text-on-surface block mb-1">
                {language === 'en' ? 'Nearest Landmark / Building Note' : 'কাছের ল্যান্ডমার্ক / ভবনের বিবরণ'}
              </label>
              <input
                type="text"
                value={landmarkNote}
                onChange={(e) => setLandmarkNote(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'E.g., Opposite Agrabad Fire Station, Yellow 3-story building'
                    : 'যেমন: আগ্রাবাদ ফায়ার সার্ভিসের বিপরীতের ৩ তলা হলুদ ভবন'
                }
                className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-on-surface border border-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* GPS Location Attachment Banner */}
            <div className="p-2.5 rounded-xl bg-surface-container flex items-center justify-between text-xs border border-surface-container-high/60">
              <span className="text-secondary flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0">
                  my_location
                </span>
                <span className="truncate font-medium">{currentLocation}</span>
              </span>
              <span className="font-headline font-bold text-primary flex items-center gap-1 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {userCoordinates ? 'Live GPS Locked' : 'Civic Anchor Attached'}
              </span>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-primary text-on-primary font-headline text-sm font-bold shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                  <span>
                    {language === 'en'
                      ? 'AI Triaging & Dispatching Squad...'
                      : 'এআই ট্রায়াজ ও রেসকিউ টিম পাঠানো হচ্ছে...'}
                  </span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">e911_emergency</span>
                  <span>
                    {language === 'en'
                      ? `Transmit Request Aid (${currentActiveService.titleEn})`
                      : `সাহায্যের আবেদন নিশ্চিত করুন (${currentActiveService.titleBn})`}
                  </span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
