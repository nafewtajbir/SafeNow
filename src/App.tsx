/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language, TabType, DispatchService, UserCoordinates } from './types';
import { INITIAL_ALERTS, DISPATCH_SERVICES } from './data';
import { requestCurrentGPSLocation, requestIPLocation } from './services/locationService';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { AlertsScreen } from './screens/AlertsScreen';
import { SafetyMapScreen } from './screens/SafetyMapScreen';
import { GetHelpScreen } from './screens/GetHelpScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AICompanionModal } from './components/AICompanionModal';
import { LocationSelectModal } from './components/LocationSelectModal';
import { WeatherDetailModal } from './components/WeatherDetailModal';
import { DispatchDetailModal } from './components/DispatchDetailModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [currentLocation, setCurrentLocation] = useState('Agrabad, Chattogram');
  const [isLocationSafe, setIsLocationSafe] = useState(true);
  const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>({
    latitude: 22.3255,
    longitude: 91.8123,
    accuracy: 15,
  });
  const [isGPSActive, setIsGPSActive] = useState(true);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const [isDemoSimulationRunning, setIsDemoSimulationRunning] = useState(false);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  // Modals
  const [isAICompanionOpen, setIsAICompanionOpen] = useState(false);
  const [aiCompanionPrompt, setAiCompanionPrompt] = useState<string | undefined>(undefined);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isWeatherDetailOpen, setIsWeatherDetailOpen] = useState(false);
  const [selectedDispatchService, setSelectedDispatchService] = useState<DispatchService | null>(null);

  // Automatically attempt real-time location resolution on first load
  useEffect(() => {
    let isMounted = true;
    const initLocation = async () => {
      try {
        // First try device GPS, falls back seamlessly to Geoapify IP location
        const result = await requestCurrentGPSLocation();
        if (isMounted && result) {
          setCurrentLocation(result.name);
          setIsLocationSafe(result.isSafe);
          setUserCoordinates(result.coordinates);
          setIsGPSActive(true);
        }
      } catch {
        // If GPS fails/denied, try instant Geoapify IP location
        try {
          const ipLoc = await requestIPLocation();
          if (isMounted && ipLoc) {
            setCurrentLocation(ipLoc.name);
            setIsLocationSafe(ipLoc.isSafe);
            setUserCoordinates(ipLoc.coordinates);
            setIsGPSActive(true);
          }
        } catch {}
      }
    };
    initLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDetectCurrentLocation = async () => {
    setIsLocatingGPS(true);
    try {
      const result = await requestCurrentGPSLocation();
      setCurrentLocation(result.name);
      setIsLocationSafe(result.isSafe);
      setUserCoordinates(result.coordinates);
      setIsGPSActive(true);
      setLocationToast(
        language === 'en'
          ? `📍 Live Location Acquired: ${result.name}`
          : `📍 লাইভ অবস্থান শনাক্ত: ${result.name}`
      );
      setTimeout(() => setLocationToast(null), 3500);
    } catch (err: any) {
      setLocationToast(
        err?.message ||
          (language === 'en' ? 'Unable to acquire GPS fix' : 'জিপিএস সংযোগ পাওয়া যায়নি')
      );
      setTimeout(() => setLocationToast(null), 3500);
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const handleOpenAICompanion = (prompt?: string) => {
    setAiCompanionPrompt(prompt);
    setIsAICompanionOpen(true);
  };

  const handleToggleDemoSimulation = () => {
    setIsDemoSimulationRunning((prev) => !prev);
  };

  const handleSelectLocation = (loc: string, safe: boolean, coords?: UserCoordinates) => {
    setCurrentLocation(loc);
    setIsLocationSafe(safe);
    if (coords) {
      setUserCoordinates(coords);
      setIsGPSActive(true);
    } else {
      setIsGPSActive(false);
    }
  };

  const handleRequestAid = () => {
    // Open the first dispatch service (Medical Help)
    setSelectedDispatchService(DISPATCH_SERVICES[0]);
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Location Toast Notification */}
      {locationToast && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-inverse-surface text-inverse-on-surface text-xs font-headline font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-surface-container-highest max-w-[90%] text-center">
          <span className="material-symbols-outlined text-[16px] text-primary">my_location</span>
          <span>{locationToast}</span>
        </div>
      )}

      {/* Fixed Sticky Header with persistent User Location display */}
      <Header
        currentTab={currentTab}
        language={language}
        onLanguageChange={setLanguage}
        onProfileClick={() => setCurrentTab('profile')}
        onHomeClick={() => setCurrentTab('home')}
        currentLocation={currentLocation}
        userCoordinates={userCoordinates}
        isGPSActive={isGPSActive}
        onLocationClick={() => setIsLocationModalOpen(true)}
      />

      {/* Main Screen Content Area with Top Header Clearance */}
      <main className="flex-1 flex flex-col relative w-full pt-16">
        {currentTab === 'home' && (
          <HomeScreen
            language={language}
            currentLocation={currentLocation}
            isLocationSafe={isLocationSafe}
            onNavigateTab={setCurrentTab}
            onChangeLocationClick={() => setIsLocationModalOpen(true)}
            onOpenAICompanion={handleOpenAICompanion}
            onOpenWeatherDetail={() => setIsWeatherDetailOpen(true)}
            isDemoSimulationRunning={isDemoSimulationRunning}
            onToggleDemoSimulation={handleToggleDemoSimulation}
            userCoordinates={userCoordinates}
            isGPSActive={isGPSActive}
            onDetectCurrentLocation={handleDetectCurrentLocation}
            isLocatingGPS={isLocatingGPS}
          />
        )}

        {currentTab === 'safety-map' && (
          <SafetyMapScreen
            language={language}
            currentLocation={currentLocation}
            userCoordinates={userCoordinates}
            isGPSActive={isGPSActive}
            onDetectCurrentLocation={handleDetectCurrentLocation}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsScreen
            alerts={alerts}
            language={language}
            onNavigateTab={setCurrentTab}
            onRequestAid={handleRequestAid}
          />
        )}

        {currentTab === 'get-help' && (
          <GetHelpScreen
            language={language}
            currentLocation={currentLocation}
            onSelectService={setSelectedDispatchService}
            onOpenAIChat={() => handleOpenAICompanion()}
            userCoordinates={userCoordinates}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileScreen
            language={language}
            currentLocation={currentLocation}
            userCoordinates={userCoordinates}
            isGPSActive={isGPSActive}
            onChangeLocation={() => setIsLocationModalOpen(true)}
            onDetectLocation={handleDetectCurrentLocation}
            isLocatingGPS={isLocatingGPS}
          />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        language={language}
        onOpenAICompanion={() => handleOpenAICompanion()}
      />

      {/* AI Companion Floating Overlay / Modal */}
      <AICompanionModal
        isOpen={isAICompanionOpen}
        onClose={() => {
          setIsAICompanionOpen(false);
          setAiCompanionPrompt(undefined);
        }}
        language={language}
        currentLocation={currentLocation}
        initialPrompt={aiCompanionPrompt}
      />

      {/* Location Selector Modal */}
      <LocationSelectModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocation}
        onSelectLocation={handleSelectLocation}
        language={language}
        userCoordinates={userCoordinates}
        isGPSActive={isGPSActive}
      />

      {/* Weather Detail Modal */}
      <WeatherDetailModal
        isOpen={isWeatherDetailOpen}
        onClose={() => setIsWeatherDetailOpen(false)}
        language={language}
        currentLocation={currentLocation}
      />

      {/* Emergency Dispatch Service Detail Modal */}
      {selectedDispatchService && (
        <DispatchDetailModal
          service={selectedDispatchService}
          isOpen={Boolean(selectedDispatchService)}
          onClose={() => setSelectedDispatchService(null)}
          language={language}
          currentLocation={currentLocation}
        />
      )}
    </div>
  );
}
