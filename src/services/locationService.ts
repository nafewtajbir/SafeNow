import { UserCoordinates } from '../types';

export interface DetectedLocationResult {
  name: string;
  coordinates: UserCoordinates;
  isSafe: boolean;
  elevation?: string;
  accuracyMeters?: number;
  statusText?: string;
  fromGPS: boolean;
  provider?: 'geoapify' | 'osm' | 'coordinates' | 'fallback';
}

export interface LocationSearchResult {
  formatted: string;
  name: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  provider: string;
}

export interface LocationServiceStatus {
  provider: string;
  configured: boolean;
  hasKey: boolean;
}

// Known civic coordinate anchors in Chattogram / coastal Bangladesh for hazard risk correlation
const CIVIC_ANCHORS = [
  { name: 'Agrabad, Chattogram', lat: 22.3255, lng: 91.8123, safe: true, elevation: '+12m' },
  { name: 'GEC Circle, Chattogram', lat: 22.3587, lng: 91.8214, safe: true, elevation: '+18m', statusText: 'Elevated High Ground' },
  { name: 'Halishahar, Chattogram', lat: 22.3142, lng: 91.7774, safe: false, elevation: '+4m', statusText: 'Tidal Inundation Alert' },
  { name: 'Patenga Coastal, Chattogram', lat: 22.2356, lng: 91.7915, safe: false, elevation: '+3m', statusText: 'Bay Surge Advisory' },
  { name: 'Khulshi Hills, Chattogram', lat: 22.3664, lng: 91.8038, safe: true, elevation: '+28m', statusText: 'Surge Free Ridge' },
  { name: 'Nasirabad, Chattogram', lat: 22.3705, lng: 91.8239, safe: true, elevation: '+16m' },
  { name: 'Bakalia Lowlands, Chattogram', lat: 22.3421, lng: 91.8488, safe: false, elevation: '+5m', statusText: 'Chaktai Canal Overflow' },
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check whether Geoapify API is configured on the backend
 */
export async function checkGeoapifyStatus(): Promise<LocationServiceStatus> {
  try {
    const res = await fetch('/api/location/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return { provider: 'geoapify', configured: false, hasKey: false };
}

/**
 * Reverse geocode coordinates via Geoapify API (proxied securely through /api/location/reverse)
 */
export async function reverseGeocodeGeoapify(lat: number, lng: number): Promise<{ name: string; provider: string; city?: string }> {
  try {
    const res = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      return {
        name: data.name || data.formatted || `${lat.toFixed(3)}° N, ${lng.toFixed(3)}° E`,
        provider: data.provider || 'geoapify',
        city: data.city,
      };
    }
  } catch {}
  return {
    name: `${lat.toFixed(3)}° N, ${lng.toFixed(3)}° E`,
    provider: 'coordinates',
  };
}

/**
 * Real-time IP Geolocation via Geoapify (proxied through /api/location/ip)
 * Useful when device GPS is slow, denied, or for instant automatic location detection
 */
export async function requestIPLocation(): Promise<DetectedLocationResult> {
  try {
    const res = await fetch('/api/location/ip');
    if (res.ok) {
      const data = await res.json();
      const coords = data.coordinates || { latitude: 22.3255, longitude: 91.8123 };

      // Match closest civic anchor for hazard assessment
      let closestAnchor = CIVIC_ANCHORS[0];
      let minDistance = calculateDistanceKm(coords.latitude, coords.longitude, closestAnchor.lat, closestAnchor.lng);
      for (const anchor of CIVIC_ANCHORS) {
        const dist = calculateDistanceKm(coords.latitude, coords.longitude, anchor.lat, anchor.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestAnchor = anchor;
        }
      }

      return {
        name: data.name || 'Agrabad, Chattogram',
        coordinates: coords,
        isSafe: minDistance < 15 ? closestAnchor.safe : true,
        elevation: minDistance < 15 ? closestAnchor.elevation : '+12m',
        accuracyMeters: data.accuracy || 3000,
        statusText: minDistance < 15 ? closestAnchor.statusText : 'Geoapify IP Location',
        fromGPS: false,
        provider: data.provider || 'geoapify',
      };
    }
  } catch {}

  return {
    name: 'Agrabad, Chattogram',
    coordinates: { latitude: 22.3255, longitude: 91.8123 },
    isSafe: true,
    elevation: '+12m',
    accuracyMeters: 5000,
    fromGPS: false,
    provider: 'fallback',
  };
}

/**
 * Autocomplete / place search powered by Geoapify
 */
export async function searchGeoapifyLocations(text: string): Promise<LocationSearchResult[]> {
  if (!text || text.trim().length < 2) return [];
  try {
    const res = await fetch(`/api/location/search?text=${encodeURIComponent(text.trim())}`);
    if (res.ok) {
      const data = await res.json();
      return data.results || [];
    }
  } catch {}
  return [];
}

/**
 * Request real-time device GPS coordinates from browser Geolocation API
 * and enrich with Geoapify reverse geocoding
 */
export function requestCurrentGPSLocation(): Promise<DetectedLocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // If browser doesn't support geolocation, fallback to Geoapify IP location
      requestIPLocation()
        .then(resolve)
        .catch(() => reject(new Error('Geolocation is not supported by your browser')));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 15000,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy, altitude } = position.coords;

        // 1. Proximity check with known civic hazard anchors
        let closestAnchor = CIVIC_ANCHORS[0];
        let minDistance = calculateDistanceKm(latitude, longitude, closestAnchor.lat, closestAnchor.lng);

        for (const anchor of CIVIC_ANCHORS) {
          const dist = calculateDistanceKm(latitude, longitude, anchor.lat, anchor.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestAnchor = anchor;
          }
        }

        // 2. Reverse geocode with Geoapify endpoint
        let resolvedName = '';
        let provider: 'geoapify' | 'osm' | 'coordinates' | 'fallback' = 'geoapify';
        try {
          const geoRes = await reverseGeocodeGeoapify(latitude, longitude);
          resolvedName = geoRes.name;
          provider = geoRes.provider as any;
        } catch {
          // Fallback to coordinates
        }

        let isSafe = closestAnchor.safe;
        let elevation = closestAnchor.elevation;
        let statusText = closestAnchor.statusText;

        if (resolvedName) {
          if (minDistance < 15) {
            isSafe = closestAnchor.safe;
            elevation = closestAnchor.elevation;
            statusText = closestAnchor.statusText;
          } else {
            isSafe = true;
            elevation = altitude ? `+${Math.round(altitude)}m` : '+15m';
            statusText = 'GPS Verified Location';
          }
        } else if (minDistance < 25) {
          resolvedName = closestAnchor.name;
        } else {
          const latDir = latitude >= 0 ? 'N' : 'S';
          const lngDir = longitude >= 0 ? 'E' : 'W';
          resolvedName = `${Math.abs(latitude).toFixed(3)}° ${latDir}, ${Math.abs(longitude).toFixed(3)}° ${lngDir}`;
          isSafe = true;
          elevation = altitude ? `+${Math.round(altitude)}m` : '+14m';
        }

        resolve({
          name: resolvedName,
          coordinates: {
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            altitude,
          },
          isSafe,
          elevation,
          accuracyMeters: Math.round(accuracy),
          statusText,
          fromGPS: true,
          provider,
        });
      },
      async (error) => {
        // If GPS permission is denied or timed out, attempt Geoapify IP location as a real-time fallback
        try {
          const ipLoc = await requestIPLocation();
          resolve(ipLoc);
          return;
        } catch {}

        let errorMsg = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission was denied. Enable permissions in your browser or use IP search.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'GPS position is currently unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out.';
            break;
        }
        reject(new Error(errorMsg));
      },
      options
    );
  });
}
