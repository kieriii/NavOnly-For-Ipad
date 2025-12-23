
import React, { useEffect, useRef, useState } from 'react';
import { Compass, Loader2, AlertCircle, Box } from 'lucide-react';
import { AppMode, LocationData, NavigationState } from '../types';

interface MapViewProps {
  location: LocationData;
  navState: NavigationState;
  mode: AppMode;
  apiKey: string;
  activeTheme: 'light' | 'dark';
  routeData?: any;
}

declare global {
  interface Window {
    google: any;
    gm_authFailure: () => void;
  }
}

const MapView: React.FC<MapViewProps> = ({ location, navState, mode, apiKey, activeTheme, routeData }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);
  const trafficLayer = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(false);

  useEffect(() => {
    window.gm_authFailure = () => {
      setError("ApiNotActivatedMapError: Ensure 'Maps JavaScript API' is enabled.");
    };
    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError("Failed to load Google Maps script.");
    document.head.appendChild(script);
  }, [apiKey]);

  const getMapStyles = (theme: 'light' | 'dark') => {
    if (theme === 'light') return []; 
    return [
      { elementType: 'geometry', stylers: [{ color: '#18181b' }] },
      { elementType: 'labels.text.stroke', stylers: [{ visibility: 'off' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#71717a' }] },
      { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#a1a1aa' }] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#71717a' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#27272a' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#3f3f46' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3f3f46' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#09090b' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] }
    ];
  };

  // Initialize Map
  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstance.current && !error) {
      try {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: location.latitude, lng: location.longitude },
          zoom: 16,
          disableDefaultUI: true,
          backgroundColor: activeTheme === 'dark' ? '#09090b' : '#f4f4f5',
          clickableIcons: false,
          styles: getMapStyles(activeTheme)
        });

        directionsRenderer.current = new window.google.maps.DirectionsRenderer({
          map: mapInstance.current,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 8,
            strokeOpacity: 0.8
          }
        });

        trafficLayer.current = new window.google.maps.TrafficLayer();
      } catch (e) {
        console.error("Map init failed:", e);
      }
    }
  }, [isLoaded, error]);

  // Update Route on Map
  useEffect(() => {
    if (directionsRenderer.current) {
      // FIX: Explicit structural check to avoid InvalidValueError: setDirections: not an Object
      const isValidRoute = routeData && 
                          typeof routeData === 'object' && 
                          Array.isArray(routeData.routes) && 
                          routeData.routes.length > 0;

      if (isValidRoute) {
        directionsRenderer.current.setDirections(routeData);
      } else {
        directionsRenderer.current.setDirections(null);
      }
      
      // Clear old markers
      markers.current.forEach(m => m.setMap(null));
      markers.current = [];

      if (isValidRoute) {
        const leg = routeData.routes[0].legs[0];
        
        // End Marker
        const endMarker = new window.google.maps.Marker({
          position: leg.end_location,
          map: mapInstance.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: '#FFFFFF',
            scale: 8
          },
          title: "Destination"
        });
        markers.current.push(endMarker);
      }
    }
  }, [routeData]);

  // Theme update
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setOptions({
        styles: getMapStyles(activeTheme),
        backgroundColor: activeTheme === 'dark' ? '#09090b' : '#f4f4f5'
      });
    }
  }, [activeTheme]);

  useEffect(() => {
    if (mapInstance.current && trafficLayer.current) {
      trafficLayer.current.setMap(navState.isTrafficEnabled ? mapInstance.current : null);
    }
  }, [navState.isTrafficEnabled, isLoaded]);

  // Camera update
  useEffect(() => {
    if (mapInstance.current) {
      const isNavView = mode === AppMode.NAV_MODE || mode === AppMode.FULL_NAV;
      
      const mapOptions: any = {
        center: { lat: location.latitude, lng: location.longitude },
        zoom: isNavView ? 18 : 16,
        heading: isNavView ? location.heading : 0,
        tilt: isNavView || is3D ? 45 : 0,
      };

      if (isNavView) {
        const offsetDist = 0.0008; 
        const angleInRad = (location.heading * Math.PI) / 180;
        mapOptions.center = {
          lat: location.latitude + (offsetDist * Math.cos(angleInRad)),
          lng: location.longitude + (offsetDist * Math.sin(angleInRad)),
        };
      }

      mapInstance.current.setOptions(mapOptions);
    }
  }, [location, mode, isLoaded, is3D]);

  if (error) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center ${activeTheme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-100'} p-12 text-center`}>
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h2 className={`text-2xl font-black ${activeTheme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{error}</h2>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative ${activeTheme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-200'}`}>
      {!isLoaded && !error && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center z-50 ${activeTheme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
          <Loader2 className="animate-spin text-blue-500 mb-6" size={48} />
          <p className="text-zinc-500 font-black tracking-widest uppercase text-xs">Synchronizing Maps...</p>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />

      {/* Navigation Puck */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div 
          className="transition-transform duration-150 ease-linear"
          style={{ transform: `rotate(${mode === AppMode.NORMAL ? location.heading : 0}deg)` }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-pulse opacity-20 scale-[4]"></div>
            <div className="relative z-10 flex items-center justify-center">
              {mode !== AppMode.NORMAL ? (
                 <div className="w-14 h-20 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    <svg viewBox="0 0 100 133" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path d="M50 0L95 133L50 106L5 133L50 0Z" fill="#3B82F6" />
                      <path d="M50 0V106L5 133L50 0Z" fill="#2563EB" />
                    </svg>
                 </div>
              ) : (
                <div className={`w-10 h-10 bg-blue-500 rounded-full border-[4px] ${activeTheme === 'dark' ? 'border-zinc-950' : 'border-white'} shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center`}>
                   <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-10 right-10 flex flex-col gap-4 z-20">
        <button 
          onClick={() => setIs3D(!is3D)}
          className={`p-5 backdrop-blur-3xl rounded-[22px] border border-white/10 shadow-2xl transition-all active:scale-95 ${is3D ? 'bg-blue-600 text-white' : activeTheme === 'dark' ? 'bg-zinc-900/60 text-zinc-400' : 'bg-white/80 text-zinc-600'}`}
        >
          <Box size={24} />
        </button>
        <button className={`p-5 backdrop-blur-3xl rounded-[22px] border border-white/10 shadow-2xl transition-all active:scale-95 ${activeTheme === 'dark' ? 'bg-zinc-900/60 text-white' : 'bg-white/80 text-zinc-900'}`}>
          <Compass size={24} style={{ transform: `rotate(${-location.heading}deg)` }} />
        </button>
      </div>

      {mode === AppMode.FULL_NAV && (
        <div className={`absolute bottom-10 left-10 p-8 ${activeTheme === 'dark' ? 'bg-zinc-900/60' : 'bg-white/80'} backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-2xl flex flex-col items-center min-w-[160px] z-20`}>
          <div className="flex items-baseline gap-1">
            <span className={`text-6xl font-black ${activeTheme === 'dark' ? 'text-white' : 'text-zinc-900'} tracking-tighter`}>{Math.round(location.speed)}</span>
            <span className="text-blue-500 font-black text-lg">MPH</span>
          </div>
          <div className="w-full h-[2px] bg-black/5 dark:bg-white/5 my-4" />
          <div className="flex flex-col items-center">
             <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Signal strength</span>
             <div className="flex gap-0.5 mt-1">
               {[1,2,3,4].map(i => <div key={i} className={`w-1 h-2 rounded-full ${i <= 3 ? 'bg-green-500' : 'bg-zinc-700'}`} />)}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
