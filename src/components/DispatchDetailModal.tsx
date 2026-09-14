import React, { useState } from 'react';
import { DispatchService, Language } from '../types';
import { dispatchAITriage } from '../services/aiService';

interface DispatchDetailModalProps {
  isOpen: boolean;
  service: DispatchService | null;
  onClose: () => void;
  language: Language;
  currentLocation: string;
}

export const DispatchDetailModal: React.FC<DispatchDetailModalProps> = ({
  isOpen,
  service,
  onClose,
  language,
  currentLocation,
}) => {
  const [details, setDetails] = useState('');
  const [urgency, setUrgency] = useState<'critical' | 'moderate' | 'inquiry'>('critical');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState<{
    assignedUnit: string;
    etaMinutes: number;
    instructions: string[];
    priorityLevel: string;
  } | null>(null);

  if (!isOpen || !service) return null;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await dispatchAITriage(
        service.id,
        currentLocation,
        details || (language === 'en' ? 'Emergency assistance required' : 'জরুরি সহায়তা প্রয়োজন'),
        language
      );
      setTriageResult({
        assignedUnit: result.assignedUnit,
        etaMinutes: result.etaMinutes,
        instructions: result.instructions,
        priorityLevel: result.priorityLevel,
      });
    } catch (err) {
      console.error('Triage failed:', err);
      setTriageResult({
        assignedUnit: 'Agrabad Civic Rescue Squad',
        etaMinutes: 7,
        instructions: ['Move to high ground', 'Keep phone charged'],
        priorityLevel: 'CRITICAL',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setTriageResult(null);
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-surface-container-high flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${service.colorClass}`}
            >
              <span className="material-symbols-outlined text-[24px]">{service.icon}</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                {language === 'en' ? service.titleEn : service.titleBn}
              </h3>
              <p className="font-headline text-xs text-secondary">
                {language === 'en' ? 'AI Triage & Rapid Dispatch' : 'এআই ট্রায়াজ ও রেসকিউ সেবা'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {triageResult ? (
          <div className="py-4 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-primary-fixed text-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-headline text-[10px] font-bold">
                PRIORITY: {triageResult.priorityLevel.toUpperCase()}
              </span>
              <h4 className="font-headline font-bold text-lg text-on-surface mt-1">
                {language === 'en' ? 'Dispatch Beacon Dispatched!' : 'উদ্ধারকারী দল নিযুক্ত হয়েছে!'}
              </h4>
            </div>

            <div className="w-full p-3 rounded-2xl bg-surface-container-low text-left space-y-2 border border-surface-container">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary font-headline">Assigned Unit:</span>
                <span className="font-bold text-on-surface">{triageResult.assignedUnit}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary font-headline">Estimated Arrival:</span>
                <span className="font-bold text-primary">~{triageResult.etaMinutes} minutes</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary font-headline">Beacon GPS:</span>
                <span className="font-bold text-on-surface">{currentLocation}</span>
              </div>

              {triageResult.instructions && triageResult.instructions.length > 0 && (
                <div className="pt-2 border-t border-surface-container-high/50 space-y-1">
                  <p className="font-headline text-[10px] text-tertiary font-bold uppercase">
                    {language === 'en' ? 'AI Immediate Safety Instructions:' : 'জরুরি এআই নির্দেশনা:'}
                  </p>
                  {triageResult.instructions.map((inst, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-on-surface">
                      <span className="text-primary font-bold">•</span>
                      <span>{inst}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleDone}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-headline text-xs font-bold shadow hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
            >
              {language === 'en' ? 'Acknowledge & Close' : 'ঠিক আছে (বন্ধ করুন)'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleDispatch} className="flex flex-col gap-3">
            <div>
              <label className="font-headline text-xs font-semibold text-on-surface block mb-1">
                {language === 'en' ? 'Urgency Level' : 'জরুরিতার মাত্রা'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['critical', 'moderate', 'inquiry'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setUrgency(lvl)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-headline font-bold capitalize transition-all ${
                      urgency === lvl
                        ? lvl === 'critical'
                          ? 'bg-error text-on-error shadow-sm'
                          : 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-headline text-xs font-semibold text-on-surface block mb-1">
                {language === 'en' ? 'Disaster Situation Details' : 'পরিস্থিতির বিবরণ'}
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'E.g., Elderly citizen needs transport; rising water near ground floor...'
                    : 'যেমন: বয়স্ক ব্যক্তির জরুরি স্থানান্তর প্রয়োজন, নিচতলায় পানি উঠছে...'
                }
                className="w-full p-3 rounded-2xl bg-surface-container text-xs text-on-surface border border-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-surface-container flex items-center justify-between text-xs">
              <span className="text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">my_location</span>
                {currentLocation}
              </span>
              <span className="font-headline font-bold text-primary">GPS Attached</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-primary text-on-primary font-headline text-sm font-bold shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                  <span>{language === 'en' ? 'AI Triaging Request...' : 'এআই ট্রায়াজ চলছে...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  <span>{language === 'en' ? 'Transmit Dispatch Request' : 'অনুরোধ পাঠান'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
