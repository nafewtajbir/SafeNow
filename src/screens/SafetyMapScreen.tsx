import React, { useState } from 'react';
import { Language, ShelterItem, AIRouteAdvice, UserCoordinates, DispatchService } from '../types';
import { SHELTERS, DISPATCH_SERVICES } from '../data';
import { getAIRouteAdvice } from '../services/aiService';

interface SafetyMapScreenProps {
  language: Language;
  onOpenShelterDetails?: (shelter: ShelterItem) => void;
  onRequestAid?: (service?: DispatchService) => void;
  currentLocation?: string;
  userCoordinates?: UserCoordinates | null;
  isGPSActive?: boolean;
  onDetectCurrentLocation?: () => void;
}

export const SafetyMapScreen: React.FC<SafetyMapScreenProps> = ({
  language,
  onOpenShelterDetails,
  onRequestAid,
  currentLocation = 'Agrabad, Chattogram',
  userCoordinates,
  isGPSActive,
  onDetectCurrentLocation,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'safe' | 'watch' | 'warning' | 'emergency'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSafeRouteVisible, setIsSafeRouteVisible] = useState(true);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    shelters: true,
    hazards: true,
    floodZones: true,
    reliefTeams: true,
  });
  const [selectedShelter, setSelectedShelter] = useState<ShelterItem>(SHELTERS[0]);
  const [navigationState, setNavigationState] = useState<'idle' | 'starting' | 'active'>('idle');
  const [recenterAnim, setRecenterAnim] = useState(false);
  const [shelterModalOpen, setShelterModalOpen] = useState(false);
  const [aiRouteAdvice, setAiRouteAdvice] = useState<AIRouteAdvice | null>(null);
  const [isLoadingAIRoute, setIsLoadingAIRoute] = useState(false);

  const handleStartNavigation = async () => {
    setNavigationState('starting');
    setIsLoadingAIRoute(true);
    try {
      const advice = await getAIRouteAdvice(currentLocation, selectedShelter.name, language);
      setAiRouteAdvice(advice);
    } catch (err) {
      console.error('AI route calculation error:', err);
    } finally {
      setIsLoadingAIRoute(false);
      setNavigationState('active');
    }
  };

  const handleRecenter = () => {
    setRecenterAnim(true);
    if (onDetectCurrentLocation) {
      onDetectCurrentLocation();
    }
    setTimeout(() => setRecenterAnim(false), 500);
  };

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto pb-28 pt-2">
      {/* Top Search & Ambient Header */}
      <div className="px-4 pb-3 z-20 flex flex-col gap-2.5">
        {/* Header Micro-Pitch & Tagline */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-xl text-on-surface">
              {language === 'en' ? 'Interactive Safety Map' : 'ইন্টারেক্টিভ নিরাপত্তা ম্যাপ'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="material-symbols-outlined text-[14px] text-primary">
                {isGPSActive ? 'my_location' : 'near_me'}
              </span>
              <span className="font-headline text-xs font-semibold text-on-surface truncate">
                {currentLocation}
              </span>
              {userCoordinates && (
                <span className="font-mono text-[10px] text-secondary">
                  ({userCoordinates.latitude.toFixed(3)}°, {userCoordinates.longitude.toFixed(3)}°)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="font-headline text-[10px] text-primary font-bold">
              {isGPSActive ? 'GPS ACTIVE' : 'LIVE'}
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center w-full shadow-xs rounded-full bg-surface-container-lowest border border-surface-container-high/60">
          <span className="material-symbols-outlined absolute left-3.5 text-secondary text-[22px]">
            search
          </span>
          <input
            className="w-full h-11 pl-11 pr-10 rounded-full bg-transparent text-on-surface font-body text-xs placeholder:text-secondary/70 focus:outline-none focus:bg-surface-container-low transition-colors"
            placeholder={
              language === 'en'
                ? 'Search neighborhood, shelter, hospital...'
                : 'এলাকা, আশ্রয়কেন্দ্র, হাসপাতাল খুঁজুন...'
            }
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            aria-label="Voice Search"
            className="absolute right-3 text-primary flex items-center justify-center p-1 rounded-full hover:bg-surface-container"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">mic</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar -mx-4 px-4">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-headline text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-lowest text-on-surface shadow-xs border border-surface-container'
            }`}
            type="button"
          >
            <span>{language === 'en' ? 'All Live Data' : 'সকল লাইভ ডেটা'}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('safe')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-headline text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
              selectedFilter === 'safe'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-lowest text-on-surface shadow-xs border border-surface-container'
            }`}
            type="button"
          >
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>{language === 'en' ? 'Safe (32)' : 'নিরাপদ (৩২)'}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('watch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-headline text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
              selectedFilter === 'watch'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-lowest text-on-surface shadow-xs border border-surface-container'
            }`}
            type="button"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{language === 'en' ? 'Watch (5)' : 'নজরদারি (৫)'}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('warning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-headline text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
              selectedFilter === 'warning'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-lowest text-on-surface shadow-xs border border-surface-container'
            }`}
            type="button"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>{language === 'en' ? 'Warning (2)' : 'সতর্কতা (২)'}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('emergency')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-headline text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
              selectedFilter === 'emergency'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-lowest text-on-surface shadow-xs border border-surface-container'
            }`}
            type="button"
          >
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            <span>{language === 'en' ? 'Emergency (1)' : 'জরুরি (১)'}</span>
          </button>
        </div>
      </div>

      {/* Map Visual Area (Vector Canvas) */}
      <div className="relative w-full h-[390px] bg-surface-container overflow-hidden border-y border-surface-container-high/60 shadow-inner">
        {/* SVG Vector Map Canvas */}
        <svg
          className="absolute inset-0 w-full h-full object-cover"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 400 480"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ground Grid Lines */}
          <path
            d="M-20 60 H420 M-20 140 H420 M-20 220 H420 M-20 310 H420 M-20 400 H420"
            stroke="#d3e4fe"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <path
            d="M70 -20 V500 M180 -20 V500 M290 -20 V500 M370 -20 V500"
            stroke="#d3e4fe"
            strokeLinecap="round"
            strokeWidth="6"
          />
          {/* Minor Cross Streets */}
          <path
            d="M-10 180 L420 270 M-10 350 L420 130"
            stroke="#dce9ff"
            strokeDasharray="4 6"
            strokeWidth="3"
          />

          {/* Natural Water Canal (Hatirjheel Canal Branch) */}
          <path
            d="M-30 260 C 90 280, 160 210, 240 250 C 320 290, 360 380, 430 400"
            fill="none"
            opacity="0.6"
            stroke="#93ccff"
            strokeLinecap="round"
            strokeWidth="26"
          />
          <path
            d="M-30 260 C 90 280, 160 210, 240 250 C 320 290, 360 380, 430 400"
            fill="none"
            opacity="0.8"
            stroke="#cce5ff"
            strokeLinecap="round"
            strokeWidth="12"
          />

          {/* Caution Zone (Around canal lowlands) */}
          {activeLayers.floodZones && (
            <path
              d="M 80 220 Q 150 180 230 210 Q 300 240 330 320 Q 240 360 140 320 Z"
              fill="#ffdad6"
              fillOpacity="0.38"
              stroke="#ba1a1a"
              strokeDasharray="6 4"
              strokeWidth="2"
            />
          )}

          {/* Safe Zone Polygon (Elevated Gulshan High Ground) */}
          {activeLayers.floodZones && (
            <polygon
              fill="#89f5e7"
              fillOpacity="0.32"
              points="50,40 260,30 240,170 30,150"
              stroke="#00685f"
              strokeWidth="2"
            />
          )}

          {/* Safe Route Glowing Path Line */}
          {isSafeRouteVisible && (
            <>
              <path
                d="M 85 390 L 85 310 L 180 310 L 180 140 L 115 140 L 115 90"
                opacity="0.95"
                stroke="#00685f"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="6"
              />
              <path
                d="M 85 390 L 85 310 L 180 310 L 180 140 L 115 140 L 115 90"
                stroke="#89f5e7"
                strokeDasharray="5 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  dur="1s"
                  from="24"
                  repeatCount="indefinite"
                  to="0"
                />
              </path>
            </>
          )}
        </svg>

        {/* Zone Labels in Canvas */}
        <div className="absolute top-6 left-10 px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-headline text-[10px] font-bold shadow-xs opacity-95 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">verified</span>
          <span>{language === 'en' ? 'Khulshi & GEC Safe Ridge (+18m)' : 'খুলশী ও জিইসি নিরাপদ এলাকা (+১৮ মি)'}</span>
        </div>

        <div className="absolute top-[230px] right-6 px-2 py-0.5 rounded bg-error-container text-on-error-container font-headline text-[10px] font-bold shadow-xs opacity-95 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">warning</span>
          <span>{language === 'en' ? 'Karnaphuli Tidal Runoff Caution' : 'কর্ণফুলী জোয়ার সতর্ক অঞ্চল'}</span>
        </div>

        {/* MARKER 1: User Location */}
        <div className="absolute top-[380px] left-[75px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <div className="relative flex items-center justify-center w-8 h-8">
            <span className={`absolute w-7 h-7 rounded-full opacity-40 animate-ping ${isGPSActive ? 'bg-primary' : 'bg-tertiary'}`} />
            <div className={`w-5 h-5 rounded-full ring-4 ring-surface shadow-md flex items-center justify-center ${
              isGPSActive ? 'bg-primary text-on-primary' : 'bg-tertiary text-on-tertiary'
            }`}>
              <span className="w-2 h-2 rounded-full bg-surface" />
            </div>
          </div>
          <span className="mt-0.5 px-2 py-0.5 rounded-full bg-inverse-surface text-inverse-on-surface font-headline text-[9px] font-bold shadow whitespace-nowrap flex items-center gap-1">
            <span className="material-symbols-outlined text-[10px] text-primary">
              {isGPSActive ? 'my_location' : 'near_me'}
            </span>
            <span>{currentLocation}</span>
          </span>
        </div>

        {/* MARKER 2: Destination Shelter (Agrabad Cyclone Shelter) */}
        {activeLayers.shelters && (
          <div
            onClick={() => setSelectedShelter(SHELTERS[0])}
            className="absolute top-[85px] left-[115px] -translate-x-1/2 -translate-y-full z-10 flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
          >
            <div className="px-2.5 py-1 rounded-xl bg-surface-container-lowest text-on-surface shadow-lg flex items-center gap-1.5 border border-primary/30">
              <div className="w-6 h-6 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">holiday_village</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-headline text-[11px] font-bold leading-tight text-on-surface">
                  Agrabad Cyclone Shelter
                </span>
                <span className="font-headline text-[10px] text-primary font-bold">
                  🟢 {language === 'en' ? 'Open • 680 Spots' : 'খোলা • ৬৮০ স্থান'}
                </span>
              </div>
            </div>
            <div className="w-2 h-2 bg-surface-container-lowest rotate-45 -mt-1 shadow-xs" />
          </div>
        )}

        {/* MARKER 3: Chittagong Medical College Hospital (CMCH) */}
        <div
          onClick={() => setSelectedShelter(SHELTERS[1])}
          className="absolute top-[130px] left-[295px] -translate-x-1/2 -translate-y-full z-10 flex flex-col items-center cursor-pointer opacity-95 hover:scale-105 active:scale-95 transition-transform"
        >
          <div className="px-2 py-1 rounded-xl bg-surface-container-lowest text-on-surface shadow-md flex items-center gap-1.5 border border-surface-container-high">
            <div className="w-5 h-5 rounded-lg bg-surface-container-highest text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px]">local_hospital</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-headline text-[11px] font-bold text-on-surface">CMCH Emergency</span>
              <span className="font-headline text-[9px] text-primary font-bold">🟢 Open • 2.6 km</span>
            </div>
          </div>
          <div className="w-1.5 h-1.5 bg-surface-container-lowest rotate-45 -mt-1" />
        </div>

        {/* MARKER 4: Naval Rescue Unit 02 */}
        {activeLayers.reliefTeams && (
          <div
            onClick={() => setSelectedShelter(SHELTERS[2])}
            className="absolute top-[280px] left-[310px] -translate-x-1/2 -translate-y-full z-10 flex flex-col items-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <div className="px-2 py-1 rounded-xl bg-surface-container-lowest text-on-surface shadow-md flex items-center gap-1.5 border border-surface-container-high">
              <div className="w-5 h-5 rounded-lg bg-surface-container text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">fire_truck</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-headline text-[11px] font-bold text-on-surface">Naval Unit 02</span>
                <span className="font-headline text-[9px] text-primary font-bold">🟢 Available</span>
              </div>
            </div>
            <div className="w-1.5 h-1.5 bg-surface-container-lowest rotate-45 -mt-1" />
          </div>
        )}

        {/* MARKER 5: Blocked Road Hazard */}
        {activeLayers.hazards && (
          <div className="absolute top-[215px] left-[180px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
            <div className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container shadow-md flex items-center gap-1 animate-pulse border border-error/30">
              <span className="material-symbols-outlined text-[14px]">block</span>
              <span className="font-headline text-[10px] font-bold">Halishahar Link Flooded</span>
            </div>
          </div>
        )}

        {/* Floating HUD Map Controls */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            aria-label="My Location"
            className={`w-10 h-10 rounded-full bg-surface-container-lowest text-on-surface shadow-md flex items-center justify-center active:scale-90 transition-transform ${
              recenterAnim ? 'rotate-90' : ''
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">my_location</span>
          </button>

          {/* Toggle Layers Button */}
          <button
            onClick={() => setShowLayersMenu(!showLayersMenu)}
            aria-label="Map Layers"
            className={`w-10 h-10 rounded-full bg-surface-container-lowest text-on-surface shadow-md flex items-center justify-center active:scale-90 transition-transform ${
              showLayersMenu ? 'ring-2 ring-primary' : ''
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary">layers</span>
          </button>

          {/* Safe Route Toggle */}
          <button
            onClick={() => setIsSafeRouteVisible(!isSafeRouteVisible)}
            className={`h-10 px-3 rounded-full shadow-md flex items-center gap-1.5 active:scale-95 transition-all ${
              isSafeRouteVisible
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-lowest text-secondary'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">route</span>
            <span className="font-headline text-[11px] font-bold">
              {language === 'en' ? 'Safe Route' : 'রুট'}
            </span>
          </button>
        </div>

        {/* Realtime Geoapify attribution badge */}
        <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full bg-surface-container-lowest/85 backdrop-blur-xs text-[9px] font-headline text-secondary flex items-center gap-1 border border-surface-container-high/50 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>Geoapify Realtime Location</span>
        </div>

        {/* Layers Dropdown Menu */}
        {showLayersMenu && (
          <div className="absolute top-16 right-3 z-30 p-3 rounded-2xl bg-surface-container-lowest shadow-xl border border-surface-container-high w-48 space-y-2 animate-in fade-in">
            <p className="font-headline text-[11px] font-bold text-on-surface uppercase tracking-wider">
              {language === 'en' ? 'Map Overlays' : 'মানচিত্রের স্তরসমূহ'}
            </p>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>{language === 'en' ? 'Shelters' : 'আশ্রয়কেন্দ্র'}</span>
              <input
                type="checkbox"
                checked={activeLayers.shelters}
                onChange={(e) =>
                  setActiveLayers((p) => ({ ...p, shelters: e.target.checked }))
                }
                className="accent-primary"
              />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>{language === 'en' ? 'Flood & Water Zones' : 'প্লাবিত অঞ্চল'}</span>
              <input
                type="checkbox"
                checked={activeLayers.floodZones}
                onChange={(e) =>
                  setActiveLayers((p) => ({ ...p, floodZones: e.target.checked }))
                }
                className="accent-primary"
              />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>{language === 'en' ? 'Hazard Blocks' : 'রাস্তা অবরোধ'}</span>
              <input
                type="checkbox"
                checked={activeLayers.hazards}
                onChange={(e) =>
                  setActiveLayers((p) => ({ ...p, hazards: e.target.checked }))
                }
                className="accent-primary"
              />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span>{language === 'en' ? 'Relief Units' : 'উদ্ধারকারী দল'}</span>
              <input
                type="checkbox"
                checked={activeLayers.reliefTeams}
                onChange={(e) =>
                  setActiveLayers((p) => ({ ...p, reliefTeams: e.target.checked }))
                }
                className="accent-primary"
              />
            </label>
          </div>
        )}

        {/* Compass & Altitude HUD Telemetry */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur shadow-xs border border-surface-container">
          <span className="material-symbols-outlined text-[14px] text-primary">explore</span>
          <span className="font-headline text-[10px] text-secondary font-medium">
            {language === 'en'
              ? 'Elevation: +16m (Safe from tidal surge)'
              : 'উচ্চতা: +১৬ মি (জোয়ারের প্রভাবমুক্ত)'}
          </span>
        </div>
      </div>

      {/* Bottom Sheet Preview Card */}
      <div className="w-full px-4 pt-3 pb-4 flex flex-col gap-3 bg-surface">
        {/* Sheet Drag Indicator */}
        <div className="w-10 h-1 rounded-full bg-surface-container-highest mx-auto mb-1" />

        {/* Nearest Open Shelter Featured Card */}
        <div className="w-full p-4 rounded-2xl bg-surface-container-lowest shadow-md flex flex-col gap-3 border border-surface-container-high/40">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center flex-shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[26px]">holiday_village</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline text-[10px] text-primary uppercase font-bold tracking-wider">
                  {language === 'en' ? 'Nearest Open Shelter' : 'নিকটবর্তী খোলা আশ্রয়কেন্দ্র'}
                </span>
                <h3 className="font-headline font-bold text-base text-on-surface truncate">
                  {language === 'en' ? selectedShelter.name : selectedShelter.nameBn}
                </h3>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-headline text-[10px] font-bold flex-shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {language === 'en' ? 'OPEN' : 'খোলা'}
            </span>
          </div>

          {/* Capacity Progress HUD */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-primary">groups</span>
                <span className="font-headline text-xs font-semibold">
                  {selectedShelter.spotsAvailable}{' '}
                  {language === 'en' ? 'spots available' : 'টি স্থান খালি'}
                </span>
              </div>
              <span className="font-headline text-[10px] text-secondary font-medium">
                Capacity: {Math.round((selectedShelter.spotsAvailable / selectedShelter.totalSpots) * 100)}% Free
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${100 - Math.round((selectedShelter.spotsAvailable / selectedShelter.totalSpots) * 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-secondary pt-0.5">
              <span>
                {selectedShelter.distanceKm} km away • ~{selectedShelter.walkTimeMinutes} min walk
              </span>
              <span>Verified {selectedShelter.verifiedTime}</span>
            </div>
          </div>

          {/* AI Live Routing Recommendation (Gemini 3.8 Flash Powered) */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-tertiary-fixed/30 border border-tertiary-fixed/40">
            <span className="material-symbols-outlined text-tertiary text-[18px] flex-shrink-0 mt-0.5">
              auto_awesome
            </span>
            <div className="flex flex-col w-full min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-headline text-[10px] text-tertiary font-bold uppercase tracking-wider">
                  {language === 'en' ? 'SafeNow AI Route Intelligence' : 'সেফনাউ এআই রুট বিশ্লেষণ'}
                </span>
                {aiRouteAdvice && (
                  <span className="text-[10px] font-bold text-primary font-mono">
                    +{aiRouteAdvice.elevationGainM}m elevation gain
                  </span>
                )}
              </div>
              <p className="font-body text-xs text-on-surface mt-0.5 leading-relaxed">
                {aiRouteAdvice ? (
                  language === 'en' ? aiRouteAdvice.recommendedRouteEn : aiRouteAdvice.recommendedRouteBn
                ) : (
                  language === 'en' ? (
                    <>
                      Route via <strong>CDA Avenue / Sheikh Mujib Road</strong> avoids the waterlogged Halishahar corridor. Ground conditions verified dry.
                    </>
                  ) : (
                    <>
                      <strong>সিডিএ এভিনিউ / শেখ মুজিব রোড</strong> দিয়ে যাতায়াত করলে হালিশহরের প্লাবিত পথ এড়িয়ে চলা যাবে। সড়কটি শুকনো ও নিরাপদ।
                    </>
                  )
                )}
              </p>
              {aiRouteAdvice?.avoidAreasEn && aiRouteAdvice.avoidAreasEn.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-error font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">block</span>
                    {language === 'en' ? 'Avoid:' : 'পরিহারযোগ্য:'}
                  </span>
                  {(language === 'en' ? aiRouteAdvice.avoidAreasEn : aiRouteAdvice.avoidAreasBn).map((area, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-error-container/60 text-on-error-container font-mono text-[9px] font-semibold">
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Button Group */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              onClick={handleStartNavigation}
              className="w-full sm:flex-1 h-13 rounded-full bg-primary text-on-primary font-headline text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform cursor-pointer"
              type="button"
            >
              {navigationState === 'starting' ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                  <span>{language === 'en' ? 'CALCULATING SAFE ROUTE...' : 'রুট হিসাব করা হচ্ছে...'}</span>
                </>
              ) : navigationState === 'active' ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>{language === 'en' ? 'GUIDANCE ACTIVE (14 MIN)' : 'দিকনির্দেশনা চালু (১৪ মিনিট)'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[22px]">navigation</span>
                  <span>{language === 'en' ? 'GET SAFE ROUTE' : 'নিরাপদ রুট পান'}</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShelterModalOpen(true)}
              className="w-full sm:w-auto h-12 px-4 rounded-full bg-surface-container text-on-surface font-headline text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">info</span>
              <span>{language === 'en' ? 'Details' : 'বিস্তারিত'}</span>
            </button>

            {onRequestAid && (
              <button
                onClick={() => {
                  const shelterService = DISPATCH_SERVICES.find((s) => s.id === 'shelter') || DISPATCH_SERVICES[0];
                  onRequestAid(shelterService);
                }}
                className="w-full sm:w-auto h-12 px-4 rounded-full bg-error-container text-on-error-container font-headline text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer shadow-xs"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-error">volunteer_activism</span>
                <span>{language === 'en' ? 'Request Aid' : 'সাহায্য চান'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Context Strip */}
        <div className="flex items-center justify-between px-1 pt-1 text-secondary">
          <span className="font-headline text-xs font-semibold">
            {language === 'en' ? 'Nearby Safe Havens' : 'নিকটস্থ আশ্রয়স্থল'}
          </span>
          <button
            onClick={() => setShelterModalOpen(true)}
            className="font-headline text-[11px] text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            type="button"
          >
            <span>{language === 'en' ? 'View list (12)' : 'তালিকা দেখুন (১২)'}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Mini Cards Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Hospital Card */}
          <div
            onClick={() => setSelectedShelter(SHELTERS[1])}
            className={`p-3 rounded-xl bg-surface-container-lowest shadow-xs flex flex-col gap-1 cursor-pointer transition-all border ${
              selectedShelter.id === 'shelter-2'
                ? 'border-primary ring-1 ring-primary/40'
                : 'border-surface-container'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-[18px] text-primary">local_hospital</span>
              <span className="font-headline text-[9px] px-1.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">
                2.6 km
              </span>
            </div>
            <span className="font-headline text-xs font-bold text-on-surface truncate">
              CMCH Hospital ER
            </span>
            <span className="font-body text-[11px] text-secondary truncate">
              {language === 'en' ? 'Trauma & ICU ready' : 'ট্রমা ও আইসিইউ প্রস্তুত'}
            </span>
          </div>

          {/* Rescue Unit Card */}
          <div
            onClick={() => setSelectedShelter(SHELTERS[2])}
            className={`p-3 rounded-xl bg-surface-container-lowest shadow-xs flex flex-col gap-1 cursor-pointer transition-all border ${
              selectedShelter.id === 'shelter-3'
                ? 'border-primary ring-1 ring-primary/40'
                : 'border-surface-container'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-[18px] text-tertiary">emergency</span>
              <span className="font-headline text-[9px] px-1.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                1.9 km
              </span>
            </div>
            <span className="font-headline text-xs font-bold text-on-surface truncate">
              Naval Unit 02
            </span>
            <span className="font-body text-[11px] text-secondary truncate">
              {language === 'en' ? 'Speedboats & Divers' : 'স্পিডবোট ও ডুবুরি দল'}
            </span>
          </div>
        </div>
      </div>

      {/* Shelter Details Modal */}
      {shelterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">holiday_village</span>
                <div>
                  <h3 className="font-headline font-bold text-base text-on-surface">
                    {selectedShelter.name}
                  </h3>
                  <p className="font-headline text-xs text-secondary">{selectedShelter.address}</p>
                </div>
              </div>
              <button
                onClick={() => setShelterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-container">
                <span className="text-secondary">{language === 'en' ? 'Available Spots' : 'খালি স্থান'}</span>
                <span className="font-bold text-primary">{selectedShelter.spotsAvailable} / {selectedShelter.totalSpots}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-container">
                <span className="text-secondary">{language === 'en' ? 'Emergency Helpline' : 'জরুরি যোগাযোগ'}</span>
                <a href={`tel:${selectedShelter.phone}`} className="font-bold text-primary underline">
                  {selectedShelter.phone}
                </a>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-container">
                <span className="text-secondary">{language === 'en' ? 'Facilities' : 'সুবিধাসমূহ'}</span>
                <span className="font-medium text-on-surface">Drinking Water, Backup Gen, Meds</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShelterModalOpen(false);
                handleStartNavigation();
              }}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-headline text-sm font-bold shadow-md hover:bg-primary-container"
            >
              {language === 'en' ? 'Navigate to this Shelter' : 'এই আশ্রয়কেন্দ্রে পথনির্দেশ নিন'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
