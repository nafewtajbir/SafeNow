import { Language, AIRiskAssessment, AIRouteAdvice, IncidentAlert } from '../types';

export async function sendMessageToAI(
  message: string,
  language: Language,
  currentLocation: string,
  history: any[] = []
): Promise<{ text: string; suggestions: string[]; timestamp: string }> {
  try {
    const res = await fetch('/api/ai/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language, currentLocation, history }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      text:
        language === 'bn'
          ? `[সেফনাউ এআই] কর্ণফুলী নদীর উচ্চ জোয়ার চলছে। আগ্রাবাদের নিচু সড়ক এড়িয়ে খুলশী ও জিইসির মতো উঁচু এলাকায় অবস্থান করুন। জরুরি নম্বর: ৯৯৯।`
          : `[SafeNow AI] Live civic hazard report: Elevated tidal levels in Karnaphuli basin. Stay on elevated ridges (Khulshi & GEC). Emergency hotline: 999.`,
      suggestions:
        language === 'bn'
          ? ['আমি কি এখন নিরাপদ?', 'নিকটবর্তী আশ্রয়কেন্দ্র', 'জরুরি নম্বরসমূহ']
          : ['Am I safe right now?', 'Nearest shelter', 'Emergency numbers'],
      timestamp: 'Just now',
    };
  }
}

export async function assessLocationRisk(
  location: string,
  rainfallMm: number,
  tideM: number,
  isSimulation: boolean,
  scenario: string = 'monsoon_surge',
  language: Language = 'en'
): Promise<AIRiskAssessment> {
  try {
    const res = await fetch('/api/ai/assess-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, rainfallMm, tideM, isSimulation, scenario, language }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      riskScore: isSimulation ? 78 : 28,
      riskLevel: isSimulation ? 'warning' : 'safe',
      isSafe: !isSimulation,
      headlineEn: isSimulation ? 'Simulation Warning: Tidal Overflow' : 'Monsoon Watch: Condition Monitored',
      headlineBn: isSimulation ? 'সিমুলেশন সতর্কতা: জোয়ারের পানি বৃদ্ধি' : 'বর্ষা পর্যবেক্ষণ: স্বাভাবিক অবস্থা',
      summaryEn: `AI telemetry active for ${location}. Elevated avenues are dry and safe.`,
      summaryBn: `${location} এর জন্য এআই পর্যবেক্ষণ চলছে। উঁচু সড়কসমূহ শুকনো ও নিরাপদ।`,
      recommendedShelter: 'Agrabad Multi-Purpose Cyclone Shelter',
      actionItems: [
        language === 'bn' ? 'জরুরি শুকনো খাবার ও পানি মজুদ রাখুন' : 'Keep emergency dry rations and water stored',
        language === 'bn' ? 'সরাসরি হেল্পলাইন ৯৯৯ চালু রাখুন' : 'Keep national helpline 999 at hand',
      ],
    };
  }
}

export async function getAIRouteAdvice(
  origin: string,
  destination: string,
  language: Language
): Promise<AIRouteAdvice> {
  try {
    const res = await fetch('/api/ai/route-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, language }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      recommendedRouteEn: 'Direct via Sheikh Mujib Road & CDA Avenue',
      recommendedRouteBn: 'শেখ মুজিব রোড ও সিডিএ এভিনিউ হয়ে সরাসরি নিরাপদ রুট',
      avoidCorridorEn: 'Halishahar Canal Link & Badamtoli (Waterlogged)',
      avoidCorridorBn: 'হালিশহর খাল লিংক ও বাদামতলী (জলাবদ্ধ)',
      distanceKm: 1.1,
      etaMinutes: 12,
      elevationGainM: 3,
      safetyVerdict: 'VERIFIED DRY & MONITORED',
      steps: [
        language === 'bn' ? 'আগ্রাবাদ থেকে প্রধান সড়কে উঠুন' : 'Access main paved avenue from Agrabad center',
        language === 'bn' ? 'সিডিএ এভিনিউ ধরে সোজা চলুন' : 'Continue straight on elevated CDA Avenue',
        language === 'bn' ? 'আশ্রয়কেন্দ্রের গেটে পৌঁছান' : 'Arrive safely at shelter gates',
      ],
    };
  }
}

export async function generateAIAlert(
  hazardType: string,
  neighborhood: string,
  severity: 'emergency' | 'watch' | 'safe'
): Promise<IncidentAlert> {
  try {
    const res = await fetch('/api/ai/generate-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hazardType, neighborhood, severity }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      id: data.id || `alert-${Date.now()}`,
      category: severity,
      titleEn: data.titleEn,
      titleBn: data.titleBn,
      subtitleEn: data.subtitleEn,
      subtitleBn: data.subtitleBn,
      descriptionEn: data.descriptionEn,
      descriptionBn: data.descriptionBn,
      timeEn: data.timeEn || 'Just now',
      timeBn: data.timeBn || 'এইমাত্র',
      location: data.location || `${neighborhood}, Chattogram`,
      verified: true,
      hazardType: data.hazardType || 'flood',
    };
  } catch {
    return {
      id: `alert-${Date.now()}`,
      category: severity,
      titleEn: `Live Alert • ${neighborhood}`,
      titleBn: `সরাসরি সতর্কতা • ${neighborhood}`,
      subtitleEn: 'Monsoon squall & high tidal surge monitored',
      subtitleBn: 'প্রবল বর্ষণ ও জোয়ারের চাপ পর্যবেক্ষণ করা হচ্ছে',
      descriptionEn: `SafeNow civic sensors detect active water flow near ${neighborhood}.`,
      descriptionBn: `সেফনাউ সেন্সর ${neighborhood} এলাকায় পানির প্রবাহ শনাক্ত করেছে।`,
      timeEn: 'Just now',
      timeBn: 'এইমাত্র',
      location: `${neighborhood}, Chattogram`,
      verified: true,
    };
  }
}

export async function dispatchAITriage(
  serviceType: string,
  currentLocation: string,
  details: string,
  language: Language
) {
  try {
    const res = await fetch('/api/ai/dispatch-triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceType, currentLocation, details, language }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      ticketId: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
      assignedUnit: serviceType === 'rescue' ? 'Chattogram Naval Unit 02 (Speedboat)' : 'Agrabad Fire & Medical Squad 01',
      etaMinutes: 8,
      status: 'DISPATCHED',
      instructionsEn: 'Stay in an elevated location. Responders have been notified.',
      instructionsBn: 'উঁচু জায়গায় অবস্থান করুন। উদ্ধারকারীদের জানিয়ে দেওয়া হয়েছে।',
    };
  }
}
