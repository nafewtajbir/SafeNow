import React, { useState, useEffect } from 'react';
import { Language, UserCoordinates } from '../types';
import { NEIGHBORHOODS } from '../data';
import {
  requestCurrentGPSLocation,
  requestIPLocation,
  searchGeoapifyLocations,
  checkGeoapifyStatus,
  DetectedLocationResult,
  LocationSearchResult,
} from '../services/locationService';

interface LocationSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onSelectLocation: (loc: string, safe: boolean, coords?: UserCoordinates) => void;
  language: Language;
  userCoordinates?: UserCoordinates | null;
  isGPSActive?: boolean;
}

export const LocationSelectModal: React.FC<LocationSelectModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  language,
  userCoordinates,
  isGPSActive,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [isLocatingIP, setIsLocatingIP] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [lastDetected, setLastDetected] = useState<DetectedLocationResult | null>(null);
  const [geoapifyConfigured, setGeoapifyConfigured] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);

  useEffect(() => {
    if (isOpen) {
      checkGeoapifyStatus().then((status) => {
        setGeoapifyConfigured(status.hasKey);
      });
    }
  }, [isOpen]);

  // Debounced search via Geoapify
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchGeoapifyLocations(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleUseCurrentGPSLocation = async () => {
    setIsLocating(true);
    setFeedbackMsg(null);
    try {
      const result = await requestCurrentGPSLocation();
      setLastDetected(result);
      onSelectLocation(result.name, result.isSafe, result.coordinates);
      setFeedbackMsg({
        type: 'success',
        text: language === 'en' ? `Location verified via ${result.provider || 'Geoapify'}` : `${result.name} সফলভাবে সংযুক্ত`,
      });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || (language === 'en' ? 'Unable to retrieve GPS coordinates' : 'জিপিএস সংযোগ পাওয়া যায়নি'),
      });
    } finally {
      setIsLocating(false);
    }
  };

  const handleUseIPLocation = async () => {
    setIsLocatingIP(true);
    setFeedbackMsg(null);
    try {
      const result = await requestIPLocation();
      setLastDetected(result);
      onSelectLocation(result.name, result.isSafe, result.coordinates);
      setFeedbackMsg({
        type: 'success',
        text: language === 'en' ? `IP Location acquired: ${result.name}` : `আইপি অবস্থান: ${result.name}`,
      });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || (language === 'en' ? 'Unable to acquire IP location' : 'আইপি অবস্থান পাওয়া যায়নি'),
      });
    } finally {
      setIsLocatingIP(false);
    }
  };

  const handleSelectSearchResult = (result: LocationSearchResult) => {
    const isSafe = !result.name.toLowerCase().includes('halishahar') && !result.name.toLowerCase().includes('patenga');
    onSelectLocation(result.name, isSafe, {
      latitude: result.latitude,
      longitude: result.longitude,
      accuracy: 25,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-surface-container-high flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-bold text-lg text-on-surface">
                {language === 'en' ? 'Real-Time Location' : 'রিয়েল-টাইম অবস্থান'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-headline font-bold bg-primary-fixed text-on-primary-fixed uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Geoapify
              </span>
            </div>
            <p className="font-headline text-xs text-secondary">
              {language === 'en'
                ? 'High-precision GPS, Geoapify API & civic zones'
                : 'উচ্চ নির্ভুল জিপিএস, জিওঅ্যাপিফাই ও নাগরিক নিরাপত্তা জোন'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 1. REAL-TIME LOCATION ACTION BUTTONS */}
        <div className="flex flex-col gap-2">
          {/* Real-time GPS with Geoapify Reverse Geocode */}
          <button
            onClick={handleUseCurrentGPSLocation}
            disabled={isLocating || isLocatingIP}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
              isGPSActive
                ? 'border-primary bg-primary-fixed/20 shadow-xs ring-2 ring-primary/20'
                : 'border-primary/40 bg-surface-container-low hover:bg-surface-container active:scale-[0.99]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-xs">
                {isLocating ? (
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">my_location</span>
                )}
              </div>
              <div className="text-left min-w-0">
                <p className="font-headline text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span>{language === 'en' ? 'Live GPS Location' : 'লাইভ জিপিএস অবস্থান'}</span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </p>
                <p className="font-headline text-[11px] text-secondary truncate">
                  {isLocating
                    ? language === 'en'
                      ? 'Resolving Geoapify coordinates...'
                      : 'জিওঅ্যাপিফাই সমন্বয় নির্ণয় হচ্ছে...'
                    : isGPSActive && userCoordinates
                    ? `${userCoordinates.latitude.toFixed(4)}° N, ${userCoordinates.longitude.toFixed(4)}° E`
                    : language === 'en'
                    ? 'Device sensor + Geoapify reverse geocoding'
                    : 'ডিভাইস সেন্সর ও জিওঅ্যাপিফাই রিভার্স জিওকোডিং'}
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-headline font-bold bg-primary text-on-primary flex-shrink-0">
              {isLocating
                ? language === 'en'
                  ? 'Locating...'
                  : 'সন্ধান...'
                : isGPSActive
                ? 'ACTIVE'
                : language === 'en'
                ? 'LOCATE'
                : 'শনাক্ত'}
            </span>
          </button>

          {/* Quick IP Geolocation option via Geoapify */}
          <button
            onClick={handleUseIPLocation}
            disabled={isLocating || isLocatingIP}
            className="flex items-center justify-between p-2.5 px-3 rounded-xl border border-surface-container-high bg-surface-container-lowest hover:bg-surface-container transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0">
                {isLocatingIP ? 'sync' : 'language'}
              </span>
              <div className="min-w-0">
                <p className="font-headline text-xs font-semibold text-on-surface">
                  {language === 'en' ? 'Geoapify Real-Time IP Geolocation' : 'জিওঅ্যাপিফাই আইপি জিওলোকেশন'}
                </p>
                <p className="font-headline text-[10px] text-secondary truncate">
                  {language === 'en' ? 'Instant location without GPS permission prompt' : 'জিপিএস অনুমতি ছাড়াই তাৎক্ষণিক অবস্থান'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-headline font-bold text-primary flex-shrink-0">
              {isLocatingIP ? '...' : language === 'en' ? 'FAST IP' : 'আইপি'}
            </span>
          </button>

          {/* Status Feedback Toast */}
          {feedbackMsg && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                feedbackMsg.type === 'error'
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-primary-fixed text-on-primary-fixed'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] mt-0.5 flex-shrink-0">
                {feedbackMsg.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span className="leading-tight">{feedbackMsg.text}</span>
            </div>
          )}
        </div>

        {/* 2. REAL-TIME SEARCH (Geoapify Autocomplete) */}
        <div className="flex flex-col gap-1.5">
          <label className="font-headline text-xs font-semibold text-on-surface flex items-center justify-between">
            <span>{language === 'en' ? 'Search Any Address or Landmark' : 'যেকোনো ঠিকানা বা এলাকা খুঁজুন'}</span>
            {isSearching && (
              <span className="text-[10px] text-primary flex items-center gap-1 font-normal">
                <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                Searching Geoapify...
              </span>
            )}
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 material-symbols-outlined text-[18px] text-secondary">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Search Agrabad, GEC, Halishahar...'
                  : 'আগ্রাবাদ, জিইসি বা হালিশহর অনুসন্ধান...'
              }
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-container text-sm font-headline text-on-surface border border-surface-container-high focus:outline-none focus:border-primary placeholder:text-secondary/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
              </button>
            )}
          </div>

          {/* Live Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-1 flex flex-col gap-1 max-h-44 overflow-y-auto p-1 rounded-xl bg-surface-container border border-surface-container-high shadow-lg">
              <span className="px-2 py-1 text-[9px] font-headline font-bold text-secondary uppercase tracking-wider">
                {language === 'en' ? 'Geoapify Search Results' : 'অনুসন্ধানের ফলাফল'}
              </span>
              {searchResults.map((item, idx) => (
                <button
                  key={`${item.name}-${idx}`}
                  onClick={() => handleSelectSearchResult(item)}
                  className="flex items-start gap-2 p-2 rounded-lg text-left hover:bg-surface-container-lowest transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 flex-shrink-0">
                    location_on
                  </span>
                  <div className="min-w-0">
                    <p className="font-headline text-xs font-semibold text-on-surface truncate">
                      {item.name}
                    </p>
                    <p className="font-headline text-[10px] text-secondary truncate">
                      {item.formatted}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-headline">
          <div className="flex-1 h-[1px] bg-surface-container-high" />
          <span>{language === 'en' ? 'Or choose a civic hazard zone' : 'অথবা দুর্যোগ এলাকা নির্বাচন করুন'}</span>
          <div className="flex-1 h-[1px] bg-surface-container-high" />
        </div>

        {/* 3. CIVIC SAFETY NEIGHBORHOODS LIST */}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {NEIGHBORHOODS.map((nh) => {
            const isSelected = currentLocation.includes(nh.name.split(',')[0]);
            return (
              <button
                key={nh.name}
                onClick={() => {
                  onSelectLocation(nh.name, nh.safe);
                  onClose();
                }}
                className={`flex items-center justify-between p-2.5 px-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected && !isGPSActive
                    ? 'border-primary bg-primary-fixed/20 shadow-xs ring-1 ring-primary'
                    : 'border-surface-container-high bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      nh.safe ? 'text-primary' : 'text-error'
                    }`}
                  >
                    {nh.safe ? 'check_circle' : 'warning'}
                  </span>
                  <div>
                    <p className="font-headline text-xs font-semibold text-on-surface">
                      {nh.name}
                    </p>
                    <p className="font-headline text-[10px] text-secondary">
                      {language === 'en' ? 'Elevation' : 'উচ্চতা'}: {nh.elevation}
                      {nh.statusText ? ` • ${nh.statusText}` : ''}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-headline font-bold ${
                    nh.safe
                      ? 'bg-primary-fixed text-on-primary-fixed'
                      : 'bg-error-container text-on-error-container'
                  }`}
                >
                  {nh.safe
                    ? language === 'en'
                      ? 'SAFE'
                      : 'নিরাপদ'
                    : language === 'en'
                    ? 'CAUTION'
                    : 'সতর্ক'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer info showing Geoapify engine status */}
        <div className="flex items-center justify-between pt-1 border-t border-surface-container-high/60 text-[10px] text-secondary font-headline">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-primary">public</span>
            <span>Geoapify Realtime Location API</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {geoapifyConfigured ? 'ONLINE' : 'ACTIVE'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-surface-container text-on-surface font-headline text-sm font-semibold hover:bg-surface-container-high cursor-pointer transition-colors"
        >
          {language === 'en' ? 'Done' : 'সম্পন্ন'}
        </button>
      </div>
    </div>
  );
};
