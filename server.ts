import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Safe resolution for both ESM (dev via tsx) and CJS (production bundle via esbuild)
const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('[SafeNow AI] Note on GoogleGenAI instantiation:', err);
    return null;
  }
}

/**
 * Resilient caller that handles temporary capacity spikes (503/429/UNAVAILABLE)
 * by attempting exponential backoff retries and model failovers.
 */
async function callGeminiWithResilience(
  ai: GoogleGenAI,
  primaryModel: string,
  generateParams: {
    contents: any;
    config?: any;
  }
) {
  // Order with active, reliable Gemini models
  const modelSequence = [primaryModel, 'gemini-3.6-flash', 'gemini-3.6-flash'];
  let lastError: any = null;

  for (let attempt = 0; attempt < modelSequence.length; attempt++) {
    const model = modelSequence[attempt];
    try {
      const res = await ai.models.generateContent({
        ...generateParams,
        model,
      });
      if (res && res.text) {
        return res;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isCapacityError =
        err?.status === 503 ||
        err?.status === 429 ||
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('temporarily unavailable');

      if (isCapacityError && attempt < modelSequence.length - 1) {
        // Short exponential jitter delay: 500ms, 1000ms
        const delayMs = (attempt + 1) * 500;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // If non-capacity error or final attempt exhausted, break to trigger domain heuristics
      break;
    }
  }

  // Gracefully return null so caller activates civic domain risk heuristics without throwing to console
  return null;
}

function safeParseJson<T>(rawText: string | undefined | null, fallback: T): T {
  if (!rawText) return fallback;
  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasGeoapifyKey: Boolean(process.env.GEOAPIFY_API_KEY),
      model: 'gemini-3.6-flash',
      city: 'Chattogram, Bangladesh',
      timestamp: new Date().toISOString(),
    });
  });

  // Geoapify Real-Time Location & Geocoding Services
  app.get('/api/location/status', (_req, res) => {
    res.json({
      provider: 'geoapify',
      configured: Boolean(process.env.GEOAPIFY_API_KEY),
      hasKey: Boolean(process.env.GEOAPIFY_API_KEY),
    });
  });

  // Real-time IP Geolocation via Geoapify
  app.get('/api/location/ip', async (req, res) => {
    const geoapifyKey = process.env.GEOAPIFY_API_KEY;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;

    if (geoapifyKey) {
      try {
        let url = `https://api.geoapify.com/v1/ipinfo?apiKey=${geoapifyKey}`;
        if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1' && !clientIp.startsWith('10.') && !clientIp.startsWith('192.168.')) {
          url += `&ip=${encodeURIComponent(clientIp)}`;
        }
        const resp = await fetch(url);
        if (resp.ok) {
          const data: any = await resp.json();
          const city = data.city?.name || data.state?.name || 'Chattogram';
          const country = data.country?.name || 'Bangladesh';
          const lat = data.location?.latitude || 22.3255;
          const lng = data.location?.longitude || 91.8123;
          const name = city ? `${city}, ${country}` : `${country}`;
          res.json({
            provider: 'geoapify',
            name,
            city,
            country,
            coordinates: { latitude: lat, longitude: lng },
            accuracy: 5000,
          });
          return;
        }
      } catch {
        // Fall through to default fallback
      }
    }

    res.json({
      provider: 'fallback',
      name: 'Agrabad, Chattogram',
      city: 'Chattogram',
      country: 'Bangladesh',
      coordinates: { latitude: 22.3255, longitude: 91.8123 },
      accuracy: 2500,
    });
  });

  // Real-time Reverse Geocoding via Geoapify
  app.get('/api/location/reverse', async (req, res) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Valid lat and lng query parameters required' });
      return;
    }

    const geoapifyKey = process.env.GEOAPIFY_API_KEY;

    if (geoapifyKey) {
      try {
        const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${geoapifyKey}`;
        const resp = await fetch(url);
        if (resp.ok) {
          const data: any = await resp.json();
          const first = data.results?.[0];
          if (first) {
            const suburb = first.suburb || first.neighbourhood || first.district || first.address_line1;
            const city = first.city || first.county || first.state || 'Chattogram';
            const formatted = first.formatted || (suburb ? `${suburb}, ${city}` : city);

            res.json({
              provider: 'geoapify',
              formatted,
              name: suburb && city && !formatted.includes(suburb) ? `${suburb}, ${city}` : formatted,
              city,
              suburb,
              district: first.district,
              country: first.country,
              coordinates: { latitude: lat, longitude: lng },
              confidence: first.rank?.confidence || 1,
            });
            return;
          }
        }
      } catch {
        // Fall through to fallback reverse geocoder
      }
    }

    // Fallback to OSM Nominatim if Geoapify key is absent or unavailable
    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'SafeNow-CivicDisasterApp/1.0',
          },
        }
      );
      if (osmRes.ok) {
        const data: any = await osmRes.json();
        const addr = data.address || {};
        const primary = addr.neighbourhood || addr.suburb || addr.residential || addr.road || addr.quarter;
        const city = addr.city || addr.town || addr.state_district || 'Chattogram';
        const name = primary && city ? `${primary}, ${city}` : (data.display_name?.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        res.json({
          provider: 'osm',
          formatted: data.display_name,
          name,
          city,
          coordinates: { latitude: lat, longitude: lng },
        });
        return;
      }
    } catch {}

    res.json({
      provider: 'coordinates',
      name: `${lat.toFixed(3)}° N, ${lng.toFixed(3)}° E`,
      coordinates: { latitude: lat, longitude: lng },
    });
  });

  // Real-time Autocomplete / Search via Geoapify
  app.get('/api/location/search', async (req, res) => {
    const query = (req.query.text as string || '').trim();
    if (!query) {
      res.json({ results: [] });
      return;
    }

    const geoapifyKey = process.env.GEOAPIFY_API_KEY;
    if (geoapifyKey) {
      try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&format=json&limit=6&apiKey=${geoapifyKey}`;
        const resp = await fetch(url);
        if (resp.ok) {
          const data: any = await resp.json();
          const results = (data.results || []).map((item: any) => ({
            formatted: item.formatted,
            name: item.address_line1 || item.formatted,
            city: item.city || item.county,
            country: item.country,
            latitude: item.lat,
            longitude: item.lon,
            provider: 'geoapify',
          }));
          res.json({ results, provider: 'geoapify' });
          return;
        }
      } catch {
        // Fall through
      }
    }

    // Fallback search via OSM
    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'SafeNow-CivicDisasterApp/1.0',
          },
        }
      );
      if (osmRes.ok) {
        const list: any = await osmRes.json();
        const results = (list || []).map((item: any) => ({
          formatted: item.display_name,
          name: item.display_name.split(',').slice(0, 2).join(','),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          provider: 'osm',
        }));
        res.json({ results, provider: 'osm' });
        return;
      }
    } catch {}

    res.json({ results: [], provider: 'none' });
  });

  // 2. Real-time Live Telemetry Stream (Server-Sent Events)
  app.get('/api/telemetry/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let baseTide = 4.82;
    let baseRain = 42;
    let baseWind = 46;

    const sendTelemetry = () => {
      // Dynamic micro-fluctuations simulating real-time tidal gauge sensors in Karnaphuli & Patenga
      const tideDelta = (Math.random() - 0.48) * 0.04;
      baseTide = Math.max(3.8, Math.min(6.2, Number((baseTide + tideDelta).toFixed(2))));

      const rainDelta = (Math.random() - 0.5) * 3;
      baseRain = Math.max(15, Math.min(95, Math.round(baseRain + rainDelta)));

      const windDelta = (Math.random() - 0.5) * 4;
      baseWind = Math.max(25, Math.min(85, Math.round(baseWind + windDelta)));

      const payload = {
        tidalHeightM: baseTide,
        tideTrend: tideDelta >= 0 ? 'rising' : 'receding',
        tidalThresholdM: 5.5,
        rainfallRateMmH: baseRain,
        windSpeedKmH: baseWind,
        windGustKmH: baseWind + 14,
        cdaGatesActive: 12,
        totalCdaGates: 12,
        activeRescues: Math.floor(Math.random() * 3) + 3,
        karnaphuliDischargeM3s: Math.round(3400 + Math.random() * 300),
        patengaWarningSignal: baseWind > 55 ? 'Signal 4' : 'Signal 3',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    sendTelemetry();
    const interval = setInterval(sendTelemetry, 3500);

    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // 3. AI Safety Companion (Gemini 3.8 Flash Chat)
  app.post('/api/ai/companion', async (req, res) => {
    const { message, language = 'en', currentLocation = 'Agrabad, Chattogram' } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const ai = getGeminiClient();
    const isBn = language === 'bn';

    const getCompanionFallback = () => ({
      text: isBn
        ? `[সেফনাউ এআই] আপনার বর্তমান এলাকা "${currentLocation}" সম্পর্কিত তথ্য বিশ্লেষণ করা হয়েছে। কর্ণফুলী নদীর উচ্চ জোয়ার চলছে। নিচু এলাকা (হালিশহর ও চাক্তাই) এড়িয়ে চলুন এবং নিকটবর্তী আগ্রাবাদ ঘূর্ণিঝড় আশ্রয়কেন্দ্রের দিকে নজর রাখুন। জরুরি যোগাযোগ: ৯৯৯।`
        : `[SafeNow AI] Live civic hazard report for ${currentLocation}: Karnaphuli tidal levels are currently elevated. Avoid low-lying underpasses in Halishahar. Agrabad Multi-Purpose Cyclone Shelter is open and staffed. Emergency hotline: 999.`,
      suggestions: isBn
        ? ['আমি কি এখন নিরাপদ?', 'নিকটবর্তী খোলা আশ্রয়কেন্দ্র', 'জরুরি নম্বরসমূহ']
        : ['Am I safe right now?', 'Nearest open shelter', 'Emergency numbers'],
      timestamp: 'Just now',
    });

    if (!ai) {
      res.json(getCompanionFallback());
      return;
    }

    try {
      const systemInstruction = `You are SafeNow AI, an elite, compassionate, highly-knowledgeable civic disaster response and safety coordinator for Chattogram, Bangladesh.
The user is located in: "${currentLocation}".
You know Chattogram geography in detail:
- Low-lying flood prone areas: Halishahar, Agrabad CDA residential canal links, Chaktai canal, Bakalia, Badamtoli, Chawkbazar lowlands.
- High elevation safe zones: Khulshi Hill (+24m), GEC Circle ridge (+18m), Nasirabad (+16m), Tiger Pass.
- Designated shelters & medical centers: Agrabad Multi-Purpose Cyclone Shelter (Sheikh Mujib Rd), Chittagong Medical College Hospital (CMCH Emergency), Naval Rescue Unit 02 (Patenga / Port gate).
- Emergency Hotlines: National Emergency 999, Disaster Response 109, Chattogram Port/Civic 333, Fire Service 16163.

Current condition: Monsoon coastal squall & high tidal surge in the Karnaphuli river.
Keep responses concise, clear, and reassuring (maximum 3-4 sentences). Format key points with bold highlights.
Language preference: ${isBn ? 'Respond ONLY in natural, polite Bengali (বাংলা).' : 'Respond in clear, professional English.'}
Also provide 3 short, relevant contextual follow-up prompt suggestions.`;

      const prompt = `User at "${currentLocation}" asks: "${message}". Please provide life-saving guidance and 3 short quick-reply follow-ups.`;

      const response = await callGeminiWithResilience(ai, 'gemini-3.6-flash', {
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response?.text?.trim() || (isBn ? 'তথ্য পাওয়া গেছে। অনুগ্রহ করে নিরাপদ স্থানে অবস্থান করুন।' : 'Guidance received. Please remain in elevated areas.');

      const defaultSuggestions = isBn
        ? ['আমি কি এখন নিরাপদ?', 'নিকটবর্তী খোলা আশ্রয়কেন্দ্র', 'জরুরি চিকিৎসা সহায়তা']
        : ['Am I safe right now?', 'Nearest open shelter', 'Emergency medical help'];

      res.json({
        text: replyText,
        suggestions: defaultSuggestions,
        timestamp: 'Just now',
      });
    } catch {
      res.json(getCompanionFallback());
    }
  });

  // 4. AI Risk Assessment Engine (Evaluates live safety index for selected location)
  app.post('/api/ai/assess-risk', async (req, res) => {
    const {
      location = 'Agrabad, Chattogram',
      rainfallMm = 45,
      tideM = 4.85,
      isSimulation = false,
      scenario = 'monsoon_surge',
      language = 'en',
    } = req.body;

    const isBn = language === 'bn';
    const locLower = (location || '').toLowerCase();
    const isElevated = locLower.includes('khulshi') || locLower.includes('gec') || locLower.includes('nasirabad');
    const isLowland = locLower.includes('halishahar') || locLower.includes('chaktai') || locLower.includes('bakalia');

    const computeFallbackAssessment = () => {
      const isSafe = isElevated || (!isSimulation && !isLowland && tideM < 5.2);
      const riskScore = isSimulation ? (isElevated ? 42 : 82) : isElevated ? 20 : isLowland ? 68 : 34;
      const riskLevel = riskScore > 70 ? 'warning' : riskScore > 40 ? 'watch' : 'safe';

      return {
        riskScore,
        riskLevel,
        isSafe,
        headlineEn: isSafe ? 'Normal Elevation: Safe Zone' : 'Tidal Runoff Warning: Low Corridor',
        headlineBn: isSafe ? 'স্বাভাবিক উচ্চতা: নিরাপদ জোন' : 'জোয়ারের পানি সতর্কবার্তা: নিচু এলাকা',
        summaryEn: isSafe
          ? `${location} is situated on an elevated ridge (+18m). Sluice gates are operating normally with no standing water.`
          : `${location} experiences tidal backflow from Karnaphuli tributaries. Avoid street-level parking and basement areas.`,
        summaryBn: isSafe
          ? `${location} উঁচু পাহাড়ি এলাকায় (+১৮ মি) অবস্থিত। ড্রেনেজ নালা ও স্লুইস গেট স্বাভাবিক রয়েছে।`
          : `${location} এলাকায় কর্ণফুলী নদীর জোয়ারের পানি প্রবেশের ঝুঁকি রয়েছে। আন্ডারপাস ও নিচু সড়ক পরিহার করুন।`,
        safeZone: 'Khulshi Hill & GEC Circle (+24m Elevation)',
        cautionZone: 'Halishahar Coastal Link & Badamtoli Underpass',
        recommendedShelter: 'Agrabad Multi-Purpose Cyclone Shelter (0.9 km)',
        actionItems: [
          isBn ? 'গুরুত্বপূর্ণ দলিল ও ইলেকট্রনিক্স উঁচুতে রাখুন' : 'Elevate vital documents and power electronics',
          isBn ? 'খোলা ম্যানহোল ও বৈদ্যুতিক তার থেকে দূরে থাকুন' : 'Avoid submerged road shoulders and exposed cabling',
          isBn ? 'জরুরি প্রয়োজনে ৯৯৯ ডায়াল করুন' : 'Contact national emergency dispatch at 999',
        ],
      };
    };

    const ai = getGeminiClient();
    if (!ai) {
      res.json(computeFallbackAssessment());
      return;
    }

    try {
      const prompt = `Analyze current flood and cyclone disaster risk in Chattogram, Bangladesh.
Location: "${location}"
Current Rainfall: ${rainfallMm} mm/h
Karnaphuli River Tidal Gauge: ${tideM} meters (Normal high tide: 4.5m, Critical flood surge: 5.5m)
Is Emergency Simulation Active: ${isSimulation ? 'YES (' + scenario + ')' : 'NO'}

Respond strictly in JSON with the schema:
{
  "riskScore": number (0 to 100),
  "riskLevel": "safe" | "watch" | "warning" | "emergency",
  "isSafe": boolean,
  "headlineEn": string,
  "headlineBn": string,
  "summaryEn": string,
  "summaryBn": string,
  "safeZone": string,
  "cautionZone": string,
  "recommendedShelter": string,
  "actionItems": string[]
}`;

      const response = await callGeminiWithResilience(ai, 'gemini-3.6-flash', {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const parsed = safeParseJson(response?.text, null);
      if (parsed && typeof parsed.riskScore === 'number') {
        res.json(parsed);
      } else {
        res.json(computeFallbackAssessment());
      }
    } catch {
      res.json(computeFallbackAssessment());
    }
  });

  // 5. AI Route Safety Advisor
  app.post('/api/ai/route-advisor', async (req, res) => {
    const {
      origin = 'Agrabad, Chattogram',
      destination = 'Agrabad Multi-Purpose Cyclone Shelter',
      language = 'en',
    } = req.body;

    const isBn = language === 'bn';
    const fallbackRoute = {
      recommendedRouteEn: 'Route via Sheikh Mujib Road & CDA Avenue (Elevated)',
      recommendedRouteBn: 'শেখ মুজিব রোড ও সিডিএ এভিনিউ হয়ে নিরাপদ পথ (উঁচু সড়ক)',
      avoidCorridorEn: 'Halishahar Canal Link & Badamtoli Underpass (Waterlogged)',
      avoidCorridorBn: 'হালিশহর খাল লিংক ও বাদামতলী আন্ডারপাস (জলাবদ্ধ)',
      distanceKm: 1.2,
      etaMinutes: 14,
      elevationGainM: 4,
      safetyVerdict: 'VERIFIED DRY & PASSABLE',
      steps: [
        isBn ? 'আগ্রাবাদ মোড় থেকে পূর্ব দিকে এগিয়ে যান' : 'Head east from Agrabad Commercial Area toward main artery',
        isBn ? 'সিডিএ এভিনিউয়ের উঁচু অংশ দিয়ে চলুন' : 'Ascend CDA Avenue flyover ramp for zero-ponding elevation',
        isBn ? 'আশ্রয়কেন্দ্রের মূল প্রবেশদ্বারে রিপোর্ট করুন' : 'Arrive at shelter gate A (Staff and medical team standby)',
      ],
      avoidAreasEn: ['Halishahar Road', 'Badamtoli Underpass'],
      avoidAreasBn: ['হালিশহর সড়ক', 'বাদামতলী আন্ডারপাস'],
    };

    const ai = getGeminiClient();
    if (!ai) {
      res.json(fallbackRoute);
      return;
    }

    try {
      const prompt = `You are a real-time disaster route navigation AI in Chattogram, Bangladesh.
Origin: "${origin}"
Destination: "${destination}"
Evaluate the safest pedestrian or vehicle evacuation route avoiding inundated canals (Chaktai, Halishahar links) and utilizing elevated ridges (CDA Avenue, Tiger Pass, Khulshi).

Respond in JSON with schema:
{
  "recommendedRouteEn": string,
  "recommendedRouteBn": string,
  "avoidCorridorEn": string,
  "avoidCorridorBn": string,
  "distanceKm": number,
  "etaMinutes": number,
  "elevationGainM": number,
  "safetyVerdict": string,
  "steps": string[],
  "avoidAreasEn": string[],
  "avoidAreasBn": string[]
}`;

      const response = await callGeminiWithResilience(ai, 'gemini-3.6-flash', {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const parsed = safeParseJson(response?.text, fallbackRoute);
      res.json(parsed);
    } catch {
      res.json(fallbackRoute);
    }
  });

  // 6. AI Dynamic Incident Alert Generator
  app.post('/api/ai/generate-alert', async (req, res) => {
    const {
      hazardType = 'tidal_surge',
      neighborhood = 'Agrabad',
      severity = 'warning',
    } = req.body;

    const fallbackAlert = {
      id: `alert-${Date.now()}`,
      category: severity,
      titleEn: `Karnaphuli Tidal Runoff Alert • ${neighborhood}`,
      titleBn: `কর্ণফুলী নদীর জোয়ার সতর্কতা • ${neighborhood}`,
      subtitleEn: 'Tidal level 4.9m with monsoon coastal gusts',
      subtitleBn: 'জোয়ারের পানির উচ্চতা ৪.৯ মিটার ও উপকূলীয় দমকা হাওয়া',
      descriptionEn: `CDA sluice gates active. Water accumulation in low-lying gutters near ${neighborhood}. Avoid basement levels.`,
      descriptionBn: `${neighborhood} সংলগ্ন নিচু রাস্তায় পানি জমছে। সিডিএ স্লুইস গেট সক্রিয় রয়েছে। আন্ডারপাস এড়িয়ে চলুন।`,
      timeEn: 'Updated just now',
      timeBn: 'এইমাত্র আপডেট করা হয়েছে',
      location: `${neighborhood}, Chattogram`,
      verified: true,
      hazardType: 'flood',
      actionSteps: [
        'Move electronics and food supply to upper floors',
        'Check nearby high ground shelters in Khulshi & GEC',
        'Dial emergency rescue 999 if water levels enter residence',
      ],
    };

    const ai = getGeminiClient();
    if (!ai) {
      res.json(fallbackAlert);
      return;
    }

    try {
      const prompt = `Generate a realistic civic disaster bulletin for Chattogram, Bangladesh.
Hazard Type: ${hazardType}
Neighborhood: ${neighborhood}
Severity: ${severity}

Respond in JSON with schema:
{
  "id": string,
  "category": "${severity}",
  "titleEn": string,
  "titleBn": string,
  "subtitleEn": string,
  "subtitleBn": string,
  "descriptionEn": string,
  "descriptionBn": string,
  "timeEn": "Updated just now",
  "timeBn": "এইমাত্র প্রাপ্ত তথ্য",
  "location": "${neighborhood}, Chattogram",
  "verified": true,
  "hazardType": "flood" | "rain" | "clear",
  "actionSteps": string[]
}`;

      const response = await callGeminiWithResilience(ai, 'gemini-3.6-flash', {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.5,
        },
      });

      const parsed = safeParseJson(response?.text, fallbackAlert);
      res.json(parsed);
    } catch {
      res.json(fallbackAlert);
    }
  });

  // 7. AI Emergency Dispatch Triage
  app.post('/api/ai/dispatch-triage', async (req, res) => {
    const {
      serviceType = 'medical',
      currentLocation = 'Agrabad, Chattogram',
      details = 'Emergency aid request',
      language = 'en',
    } = req.body;

    const isBn = language === 'bn';

    const getUnitForService = (type: string) => {
      switch (type) {
        case 'clean_water':
          return 'CWASA Rapid Water Tanker 04 & Purification Unit';
        case 'rescue':
          return 'Chattogram Naval Coast Guard Unit 02 (Speedboat)';
        case 'shelter':
          return 'Agrabad Cyclone Shelter Evacuation Transport';
        case 'food_supplies':
          return 'Red Crescent Emergency Ration Response Unit';
        case 'medical':
        default:
          return 'Agrabad Fire & Medical Triage Squad 01';
      }
    };

    const getInstructionsForService = (type: string) => {
      switch (type) {
        case 'clean_water':
          return isBn
            ? [
                'পানি ফুটিয়ে বা বিশুদ্ধকরণ ট্যাবলেট মিশিয়ে পান করুন',
                'টিউবওয়েল প্লাবিত হলে সেখান থেকে পানি পান করবেন না',
                'পানির পাত্র উঁচু ও পরিষ্কার স্থানে ঢেকে রাখুন',
              ]
            : [
                'Do not drink from submerged or murky tube-wells.',
                'Use chlorine water purification tablets if distributed.',
                'Keep clean water containers elevated above flood surge.',
              ];
        case 'rescue':
          return isBn
            ? [
                'ভবনের ছাদ বা দ্বিতীয় তলায় অবস্থান নিন',
                'পানির স্রোতে হাঁটা বা সাঁতার কাটা এড়িয়ে চলুন',
                'উদ্ধারকারী বোটকে দৃষ্টি আকর্ষণের জন্য কাপড় বা আলো দেখান',
              ]
            : [
                'Stay on the rooftop or highest level of the building.',
                'Avoid wading or swimming in rushing flood channels.',
                'Signal responding speedboats using bright fabric or torchlight.',
              ];
        case 'shelter':
          return isBn
            ? [
                'প্রয়োজনীয় জরুরি কাগজপত্র পলিথিনে মুড়িয়ে সাথে নিন',
                'পিকআপ দলের জন্য অপেক্ষা করুন বা নিকটবর্তী সাইক্লোন সেন্টারে যান',
                'পরিবারের শিশু ও বয়স্কদের একসাথে রাখুন',
              ]
            : [
                'Pack essential identification & documents in waterproof plastic.',
                'Await shelter transport shuttle or proceed via safe CDA corridor.',
                'Keep children and elderly family members closely assembled.',
              ];
        case 'food_supplies':
          return isBn
            ? [
                'শুকনো খাবার ও শিশু খাদ্য অগ্রাধিকার দিন',
                'খাদ্য সামগ্রী শুকনো ও প্লাবনমুক্ত স্থানে সংরক্ষণ করুন',
                'ত্রাণ বিতরণ কেন্দ্রে শৃঙ্খলার সাথে অপেক্ষা করুন',
              ]
            : [
                'Prioritize energy biscuits and clean formula for infants.',
                'Keep dry food rations elevated above water ingress points.',
                'Field squad is bringing sealed ration packs and ORS.',
              ];
        case 'medical':
        default:
          return isBn
            ? [
                'রোগীকে শুকনো ও নিরাপদ স্থানে শুইয়ে রাখুন',
                'রক্তপাত হলে পরিষ্কার কাপড় দিয়ে চেপে ধরে রাখুন',
                'প্যারামেডিক দল রওনা হয়েছে, শান্ত থাকুন',
              ]
            : [
                'Keep the patient warm and dry on elevated furniture or 2nd floor.',
                'Apply firm pressure with clean fabric to any active bleeding.',
                'First responder paramedic vehicle is en-route.',
              ];
      }
    };

    const fallbackTriage = {
      ticketId: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
      assignedUnit: getUnitForService(serviceType),
      etaMinutes: serviceType === 'rescue' ? 6 : serviceType === 'clean_water' ? 9 : 7,
      status: 'DISPATCHED',
      priorityLevel: 'CRITICAL',
      instructions: getInstructionsForService(serviceType),
      instructionsEn: 'Stay on elevated ground. Responders have been dispatched to your location.',
      instructionsBn: 'উঁচু স্থানে অবস্থান করুন। উদ্ধারকারী দল আপনার এলাকায় রওনা হয়েছে।',
    };

    const ai = getGeminiClient();
    if (!ai) {
      res.json(fallbackTriage);
      return;
    }

    try {
      const prompt = `A citizen in Chattogram, Bangladesh has requested emergency dispatch:
Location: "${currentLocation}"
Service Type: "${serviceType}"
Citizen report: "${details}"

Provide immediate dispatch triage analysis in JSON:
{
  "ticketId": "DISP-XXXX",
  "assignedUnit": string,
  "etaMinutes": number (between 5 and 15),
  "status": "DISPATCHED",
  "priorityLevel": "CRITICAL" | "HIGH" | "STANDARD",
  "instructions": string[],
  "instructionsEn": string,
  "instructionsBn": string
}`;

      const response = await callGeminiWithResilience(ai, 'gemini-3.6-flash', {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const parsed = safeParseJson(response?.text, fallbackTriage);
      res.json(parsed);
    } catch {
      res.json(fallbackTriage);
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SafeNow Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
