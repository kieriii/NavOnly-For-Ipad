import React, { useEffect, useRef, useState } from 'react';
import { Compass, Loader2, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { AppMode, LocationData, NavigationState } from '../types';

interface MapViewProps {
  location: LocationData;
  navState: NavigationState;
  mode: AppMode;
  apiKey: string;
  activeTheme: 'light' | 'dark';
  routeData?: any;
}

const MapView: React.FC<MapViewProps> = ({ location, navState, mode, apiKey, activeTheme, routeData }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);
  const trafficLayer = useRef<any>(null);
  const destinationMarkers = useRef<any[]>([]);
  const locationMarkerRef = useRef<any>(null);
  const locationArrowElRef = useRef<HTMLDivElement>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [authError, setAuthError] = useState<{title: string, message: string} | null>(null);

  // 1. Initialize API with precise error reporting
  useEffect(() => {
    // Define global callback immediately to ensure it exists before script loads
    (window as any).initMap = () => {
      console.log("Google Maps API callback triggered successfully.");
      setIsLoaded(true);
      setAuthError(null);
    };

    // Catch specific authentication failures reported by Google
    (window as any).gm_authFailure = () => {
      setAuthError({
        title: "InvalidKeyMapError",
        message: "Your API Key was rejected by Google. Please check if the 'Maps JavaScript API' is enabled in your Google Cloud Console and that billing is active."
      });
    };

    const google = (window as any).google;
    // Check if library is already available
    if (google && google.maps && google.maps.marker) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      // crossorigin="anonymous" is critical for capturing detailed "Script error" messages
      script.crossOrigin = "anonymous";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places,marker&v=beta&callback=initMap`;
      script.async = true;
      script.onerror = (event) => {
        console.error("Maps script failed to load:", event);
        setAuthError({
          title: "Network Failure",
          message: "The Google Maps script could not be loaded. This may be due to an ad-blocker, firewall, or an invalid API key configuration."
        });
      };
      document.head.appendChild(script);
    } else if ((window as any).google && (window as any).google.maps) {
      // If script exists and maps are available, ensure we trigger loaded state
      setIsLoaded(true);
    }
  }, [apiKey]);

  // 2. Initialize Map Instance with safety checks
  useEffect(() => {
    const google = (window as any).google;
    // Only proceed if library is fully loaded and mapRef is ready
    if (isLoaded && mapRef.current && !mapInstance.current && google?.maps) {
      try {
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: location.latitude, lng: location.longitude },
          zoom: 16,
          disableDefaultUI: true,
          clickableIcons: false,
          mapId: 'IPAD_NAV_SIM_VECTOR_V1', // Required for advanced markers and vector rendering
          colorScheme: activeTheme === 'dark' ? 'DARK' : 'LIGHT',
          renderingType: 'VECTOR'
        });

        directionsRenderer.current = new google.maps.DirectionsRenderer({
          map: mapInstance.current, 
          suppressMarkers: true,
          preserveViewport: true, 
          polylineOptions: { 
            strokeColor: '#3B82F6', 
            strokeWeight: 8, 
            strokeOpacity: 0.9 
          }
        });

        trafficLayer.current = new google.maps.TrafficLayer();

        // Check if marker library loaded successfully before instantiating
        if (google.maps.marker?.AdvancedMarkerElement) {
          const container = document.createElement('div');
          container.style.transition = 'transform 0.1s linear';
          container.innerHTML = `<div class="location-arrow"></div>`;

          locationMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
            map: mapInstance.current,
            position: { lat: location.latitude, lng: location.longitude },
            content: container,
            title: "GPS Lock"
          });
          locationArrowElRef.current = container;
        }
      } catch (err) {
        console.error("Map initialization failed:", err);
        setAuthError({
          title: "Engine Error",
          message: "The rendering engine failed to initialize. Ensure your API key supports Advanced Markers and Vector maps."
        });
      }
    }
  }, [isLoaded]);

  // 3. Coordinate Sync & Perspective updates
  useEffect(() => {
    if (locationMarkerRef.current) {
      locationMarkerRef.current.position = { lat: location.latitude, lng: location.longitude };
      
      if (locationArrowElRef.current) {
        const isNav = mode === AppMode.NAV_MODE || mode === AppMode.FULL_NAV;
        const rotation = isNav ? 0 : location.heading;
        locationArrowElRef.current.style.transform = `rotate(${rotation}deg)`;
        
        const arrow = locationArrowElRef.current.querySelector('.location-arrow') as HTMLElement;
        if (arrow) {
          if (mode === AppMode.NORMAL) {
            arrow.innerHTML = `<div style="width: 20px; height: 20px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.5);"></div>`;
          } else {
            arrow.innerHTML = `
              <div style="width: 32px; height: 42px; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.4))">
                <svg viewBox="0 0 100 133" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                  <path d="M50 0L95 133L50 106L5 133L50 0Z" fill="#3B82F6" />
                  <path d="M50 0V106L5 133L50 0Z" fill="#1D4ED8" />
                </svg>
              </div>
            `;
          }
        }
      }
    }

    if (mapInstance.current) {
      const isNav = mode === AppMode.NAV_MODE || mode === AppMode.FULL_NAV;
      if (isNav) {
        const offsetDist = 0.00015; 
        const rad = (location.heading * Math.PI) / 180;
        const targetCenter = { 
          lat: location.latitude + (offsetDist * Math.cos(rad)), 
          lng: location.longitude + (offsetDist * Math.sin(rad)) 
        };

        mapInstance.current.setOptions({
          center: targetCenter,
          zoom: 19,
          heading: location.heading,
          tilt: 45,
        });
      }
    }
  }, [location.latitude, location.longitude, location.heading, mode]);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setOptions({ colorScheme: activeTheme === 'dark' ? 'DARK' : 'LIGHT' });
    }
  }, [activeTheme]);

  useEffect(() => {
    const google = (window as any).google;
    if (!google?.maps || !mapInstance.current || !directionsRenderer.current) return;

    const isValidRoute = routeData && routeData.routes && routeData.routes.length > 0;
    
    try {
      if (isValidRoute) {
        directionsRenderer.current.setDirections(routeData);
      } else {
        directionsRenderer.current.setDirections({ routes: [] });
      }
    } catch (e) {
      console.warn("Directions renderer failure:", e);
    }

    destinationMarkers.current.forEach(m => m.map = null);
    destinationMarkers.current = [];

    if (isValidRoute && google.maps.marker?.AdvancedMarkerElement) {
      const leg = routeData.routes[0].legs[0];
      const pinElement = new google.maps.marker.PinElement({
        background: "#EF4444",
        borderColor: "#FFFFFF",
        glyphColor: "#FFFFFF",
        scale: 1.2,
      });

      const destMarker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance.current,
        position: leg.end_location,
        content: pinElement.element,
        title: "Arrival Point"
      });
      
      destinationMarkers.current.push(destMarker);
    }
  }, [routeData]);

  useEffect(() => {
    if (mapInstance.current && trafficLayer.current) {
      trafficLayer.current.setMap(navState.isTrafficEnabled ? mapInstance.current : null);
    }
  }, [navState.isTrafficEnabled, isLoaded]);

  return (
    <div className={`w-full h-full relative ${activeTheme === 'dark' ? 'bg-[#18181b]' : 'bg-zinc-200'}`}>
      {authError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[200] bg-black/98 p-10 text-center animate-in fade-in duration-700">
          <div className="w-20 h-20 bg-red-600/20 border border-red-500/50 rounded-full flex items-center justify-center mb-8 shadow-2xl">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h2 className="text-white text-3xl font-black mb-4 uppercase tracking-tighter italic">{authError.title}</h2>
          <div className="max-w-md bg-zinc-900 border border-white/10 p-6 rounded-2xl mb-8">
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">{authError.message}</p>
            <div className="flex flex-col gap-2 text-left">
              <div className="flex items-start gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                <span className="text-blue-500">1.</span> Enable "Maps JavaScript API" in GCP Library
              </div>
              <div className="flex items-start gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                <span className="text-blue-500">2.</span> Check "Directions API" for Routing
              </div>
              <div className="flex items-start gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                <span className="text-blue-500">3.</span> Ensure Billing is linked to Project
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
            >
              <RefreshCw size={14} /> Retry
            </button>
            <a 
              href="https://console.cloud.google.com/google/maps-apis/library" 
              target="_blank" 
              className="flex items-center gap-2 px-8 py-3 bg-zinc-800 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all active:scale-95"
            >
              Open Console <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {(!isLoaded && !authError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black">
          <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
          <p className="text-zinc-500 font-black tracking-[0.3em] uppercase text-[9px]">Establishing Satellite Uplink...</p>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />

      <div className="absolute top-6 right-6 z-20">
        <div className={`p-3 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl ${activeTheme === 'dark' ? 'bg-zinc-900/60 text-white' : 'bg-white/80 text-zinc-900'}`}>
          <Compass size={20} style={{ transform: `rotate(${-location.heading}deg)` }} className="transition-transform duration-200" />
        </div>
      </div>
    </div>
  );
};

export default MapView;