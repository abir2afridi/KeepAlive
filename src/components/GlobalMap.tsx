import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { DnsProvider, TestResult, getSpeedCategory } from '@/types/dns';
import 'leaflet/dist/leaflet.css';
import { Loader2, Crosshair, Navigation } from 'lucide-react';

import { useTheme } from '../contexts/ThemeContext';

const speedColors = {
  fast: '#00e676',
  medium: '#ffab00',
  slow: '#ff1744',
  unknown: '#546e7a',
};

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 2);
  }, [center, map]);
  return null;
}

function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (isNaN(lat) || isNaN(lng) || lat === null || lng === null) return;
    map.flyTo([lat, lng], zoom, { duration: 1.5 });
  }, [lat, lng, zoom, map]);
  return null;
}

interface GlobalMapProps {
  providers: DnsProvider[];
  results: Map<string, TestResult>;
  onSelectProvider: (provider: DnsProvider) => void;
}

export function GlobalMap({ providers, results, onSelectProvider }: GlobalMapProps) {
  const mapRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported');
      return;
    }

    setGpsDetecting(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        };
        setGpsLocation(loc);
        setFlyTarget({ lat: loc.lat, lng: loc.lng, zoom: 6 });
        setGpsDetecting(false);
      },
      (err) => {
        setGpsDetecting(false);
        setGpsError('Failed to detect location');
        setTimeout(() => setGpsError(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        ref={mapRef}
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', background: isDark ? '#050609' : '#e5e7eb' }}
        minZoom={2}
        maxZoom={12}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <MapUpdater center={[20, 0]} />
        {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} zoom={flyTarget.zoom} />}
        
        <TileLayer
          url={isDark
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          }
          attribution={isDark
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        />

        {gpsLocation && (
          <CircleMarker
            center={[gpsLocation.lat, gpsLocation.lng]}
            radius={8}
            pathOptions={{
              color: '#5551FF',
              fillColor: '#5551FF',
              fillOpacity: 0.4,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs font-bold">
                <p>GPS LOCATION</p>
                <p className="text-ink/40 font-mono">±{gpsLocation.accuracy}m accuracy</p>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {providers.map((provider) => {
          // Skip providers with invalid coordinates to prevent "Invalid LatLng" errors
          if (isNaN(provider.lat) || isNaN(provider.lng) || provider.lat === null || provider.lng === null) return null;

          const result = results.get(provider.id);
          const speed = result?.status === 'complete'
            ? getSpeedCategory(result.avgLatency)
            : 'unknown';
          const color = speedColors[speed];
          const radius = result?.status === 'complete' ? 7 : 5;

          return (
            <CircleMarker
              key={provider.id}
              center={[provider.lat, provider.lng]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: 2,
                opacity: 0.9,
              }}
              eventHandlers={{
                click: () => onSelectProvider(provider),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{provider.name}</p>
                  <p className="text-xs">{provider.organization}</p>
                  <p className="text-xs">{provider.ipv4Primary}</p>
                  {result?.status === 'complete' && (
                    <p className="font-mono font-bold" style={{ color }}>
                      {result.avgLatency.toFixed(1)} ms
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* ─── Detect Location Button ─── */}
      <button
        onClick={handleDetectLocation}
        disabled={gpsDetecting}
        className="absolute top-6 right-6 z-[1001] flex items-center gap-2 px-5 py-3 rounded-2xl
            bg-primary text-white border border-primary/20
            hover:bg-primary/90 shadow-[0_8px_30px_rgba(85,81,255,0.3)]
            text-[11px] font-black uppercase tracking-[0.15em]
            transition-all duration-300 disabled:opacity-50
            group"
      >
        {gpsDetecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4 group-hover:rotate-12 transition-transform" />
        )}
        <span>{gpsDetecting ? 'Locating...' : 'Detect My Location'}</span>
      </button>

      {/* Error feedback */}
      {gpsError && (
        <div className="absolute bottom-20 right-6 z-[1001] px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-md">
          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{gpsError}</span>
        </div>
      )}
    </div>
  );
}
