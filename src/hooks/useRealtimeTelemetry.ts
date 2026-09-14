import { useState, useEffect } from 'react';
import { RealtimeTelemetryData } from '../types';

const INITIAL_TELEMETRY: RealtimeTelemetryData = {
  tidalHeightM: 4.82,
  tideTrend: 'rising',
  tidalThresholdM: 5.5,
  rainfallRateMmH: 42,
  windSpeedKmH: 46,
  windGustKmH: 60,
  cdaGatesActive: 12,
  totalCdaGates: 12,
  activeRescues: 4,
  karnaphuliDischargeM3s: 3450,
  patengaWarningSignal: 'Signal 3',
  timestamp: 'Live',
};

export function useRealtimeTelemetry() {
  const [telemetry, setTelemetry] = useState<RealtimeTelemetryData>(INITIAL_TELEMETRY);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: any = null;

    try {
      eventSource = new EventSource('/api/telemetry/stream');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setTelemetry((prev) => ({
            ...prev,
            ...data,
          }));
          setIsConnected(true);
        } catch (err) {
          console.error('Error parsing SSE telemetry payload:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        // Fallback simulation in case SSE drops
        if (!fallbackInterval) {
          fallbackInterval = setInterval(() => {
            setTelemetry((prev) => {
              const delta = (Math.random() - 0.48) * 0.03;
              const nextTide = Number((prev.tidalHeightM + delta).toFixed(2));
              return {
                ...prev,
                tidalHeightM: Math.max(3.8, Math.min(6.2, nextTide)),
                tideTrend: delta >= 0 ? 'rising' : 'receding',
                rainfallRateMmH: Math.max(15, Math.min(95, Math.round(prev.rainfallRateMmH + (Math.random() - 0.5) * 3))),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              };
            });
          }, 3500);
        }
      };
    } catch (err) {
      console.warn('EventSource not supported or failed to connect:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, []);

  return { telemetry, isConnected };
}
