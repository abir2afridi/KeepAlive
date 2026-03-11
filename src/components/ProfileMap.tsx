import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@/components/theme-provider';
import { Crosshair, Loader2 } from 'lucide-react';

// Custom marker icon — pulsing blue dot
const createUserIcon = () => {
    return L.divIcon({
        className: 'user-location-marker',
        html: `
      <div style="position:relative;width:24px;height:24px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:hsl(217 91% 60%);opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:absolute;inset:4px;border-radius:50%;background:hsl(217 91% 60%);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
      </div>
      <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>
    `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
    });
};

// GPS-detected red marker
const createGpsIcon = () => {
    return L.divIcon({
        className: 'gps-location-marker',
        html: `
      <div style="position:relative;width:22px;height:22px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:hsl(0 84% 60%);opacity:0.25;animation:gps-ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:absolute;inset:3px;border-radius:50%;background:hsl(0 84% 60%);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
      </div>
      <style>@keyframes gps-ping{75%,100%{transform:scale(2.2);opacity:0}}</style>
    `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -13],
    });
};

function MapController({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 10, { animate: true });
    }, [lat, lng, map]);
    return null;
}

// Fly-to helper for GPS detection
function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], zoom, { duration: 1.5 });
    }, [lat, lng, zoom, map]);
    return null;
}

interface ProfileMapProps {
    lat: number;
    lng: number;
    city: string;
    country: string;
}

export default function ProfileMap({ lat, lng, city, country }: ProfileMapProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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
                setFlyTarget({ lat: loc.lat, lng: loc.lng, zoom: 14 });
                setGpsDetecting(false);
            },
            (err) => {
                setGpsDetecting(false);
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setGpsError('Permission denied');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setGpsError('Position unavailable');
                        break;
                    case err.TIMEOUT:
                        setGpsError('Request timed out');
                        break;
                    default:
                        setGpsError('Unknown error');
                }
                // Auto-clear error after 4 seconds
                setTimeout(() => setGpsError(null), 4000);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    return (
        <div className="w-full h-full relative z-0" style={{ minHeight: '280px' }}>
            <MapContainer
                center={[lat, lng]}
                zoom={10}
                style={{ height: '100%', width: '100%', background: isDark ? '#0a0a0a' : '#f0f0f0' }}
                minZoom={3}
                maxZoom={18}
                scrollWheelZoom={true}
                zoomControl={false}
            >
                <MapController lat={lat} lng={lng} />
                {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} zoom={flyTarget.zoom} />}
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

                {/* IP-based location marker (blue) */}
                <Marker position={[lat, lng]} icon={createUserIcon()}>
                    <Popup>
                        <div className="text-sm font-bold">
                            <p className="font-black">{city || 'IP Location'}</p>
                            {country && <p className="text-xs text-gray-500">{country}</p>}
                            <p className="text-[10px] text-blue-500 mt-0.5">IP-based (approximate)</p>
                        </div>
                    </Popup>
                </Marker>

                {/* GPS-detected location marker (red) */}
                {gpsLocation && (
                    <Marker position={[gpsLocation.lat, gpsLocation.lng]} icon={createGpsIcon()}>
                        <Popup>
                            <div className="text-sm font-bold">
                                <p className="font-black">GPS Location</p>
                                <p className="text-[10px] text-gray-500">
                                    {gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}
                                </p>
                                <p className="text-[10px] text-red-500 mt-0.5">
                                    Accuracy: ~{gpsLocation.accuracy}m
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            {/* ─── Detect Location Button ─── */}
            <button
                onClick={handleDetectLocation}
                disabled={gpsDetecting}
                className="absolute bottom-4 right-4 z-[1001] flex items-center gap-2 px-3 py-2 rounded-xl
                    bg-base/85 backdrop-blur-md border border-line/50
                    hover:border-primary/40 hover:bg-base/95
                    text-[10px] font-black uppercase tracking-widest text-ink
                    transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                    group"
                title="Detect precise GPS location"
            >
                {gpsDetecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                    <Crosshair className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                )}
                {gpsDetecting ? 'Detecting...' : gpsLocation ? 'Re-detect' : 'Detect Location'}
            </button>

            {/* GPS accuracy info */}
            {gpsLocation && !gpsDetecting && (
                <div className="absolute bottom-4 left-4 z-[1001] px-2.5 py-1.5 rounded-lg bg-base/85 backdrop-blur-md border border-line/50 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">GPS</span>
                    </div>
                    <p className="text-[10px] font-mono font-bold text-ink">
                        ±{gpsLocation.accuracy}m accuracy
                    </p>
                </div>
            )}

            {/* Error feedback */}
            {gpsError && (
                <div className="absolute bottom-16 right-4 z-[1001] px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-md">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{gpsError}</span>
                </div>
            )}
        </div>
    );
}
