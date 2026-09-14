export type TabType = 'home' | 'safety-map' | 'alerts' | 'get-help' | 'profile';
export type Language = 'en' | 'bn';

export interface AlertStep {
  id: string;
  textEn: string;
  textBn: string;
  icon: string;
  checked: boolean;
}

export interface IncidentAlert {
  id: string;
  category: 'emergency' | 'watch' | 'safe';
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  timeEn: string;
  timeBn: string;
  location: string;
  verified: boolean;
  isSimulation?: boolean;
  steps?: AlertStep[];
  hazardType?: 'flood' | 'rain' | 'clear';
}

export interface ShelterItem {
  id: string;
  name: string;
  nameBn: string;
  type: 'shelter' | 'hospital' | 'rescue';
  spotsAvailable: number;
  totalSpots: number;
  distanceKm: number;
  walkTimeMinutes: number;
  verifiedTime: string;
  status: 'open' | 'limited' | 'full';
  address: string;
  phone: string;
  coordinates: { x: number; y: number };
}

export interface DispatchService {
  id: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  icon: string;
  colorClass: string;
  badge?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export interface RealtimeTelemetryData {
  tidalHeightM: number;
  tideTrend: 'rising' | 'receding';
  tidalThresholdM: number;
  rainfallRateMmH: number;
  windSpeedKmH: number;
  windGustKmH: number;
  cdaGatesActive: number;
  totalCdaGates: number;
  activeRescues: number;
  karnaphuliDischargeM3s: number;
  patengaWarningSignal: string;
  timestamp: string;
}

export interface AIRiskAssessment {
  riskScore: number;
  riskLevel: 'safe' | 'watch' | 'warning' | 'emergency';
  isSafe: boolean;
  headlineEn: string;
  headlineBn: string;
  summaryEn: string;
  summaryBn: string;
  safeZone?: string;
  cautionZone?: string;
  recommendedShelter?: string;
  actionItems?: string[];
}

export interface AIRouteAdvice {
  recommendedRouteEn: string;
  recommendedRouteBn: string;
  avoidCorridorEn?: string;
  avoidCorridorBn?: string;
  distanceKm: number;
  etaMinutes: number;
  elevationGainM: number;
  safetyVerdict: string;
  steps: string[];
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
}
