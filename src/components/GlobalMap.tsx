import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { DnsProvider, TestResult, getSpeedCategory } from '@/types/dns';
import 'leaflet/dist/leaflet.css';

import { useTheme } from '@/components/theme-provider';

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

interface GlobalMapProps {
  providers: DnsProvider[];
  results: Map<string, TestResult>;
  onSelectProvider: (provider: DnsProvider) => void;
}

export function GlobalMap({ providers, results, onSelectProvider }: GlobalMapProps) {
  const mapRef = useRef(null);
  const { theme } = useTheme();

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        ref={mapRef}
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', background: isDark ? '#0a0a0a' : '#f0f0f0' }}
        minZoom={2}
        maxZoom={10}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <MapUpdater center={[20, 0]} />
        <TileLayer
          url={isDark
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution={isDark
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        />
        {providers.map((provider) => {
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
    </div>
  );
}
