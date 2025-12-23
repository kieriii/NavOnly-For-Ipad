import React, { useEffect, useRef, useState } from 'react';
import { Compass, Loader2 } from 'lucide-react';
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

  // 1. Initialize API
  useEffect(() => {
    const google = (window as any).google;
    if (google && google.maps && google.maps.marker) {
      setIsLoaded(true);
      return;
    }

    (window as any).initMap = () => setIsLoaded(true);
    const scriptId = 'google-maps-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places,marker&v=beta&loading=async&callback=initMap`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, [apiKey]);

  // 2. Initialize Map Instance
  useEffect(() => {
    const google = (window as any).google;
    if (isLoaded && mapRef.current && !mapInstance.current && google) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: location.latitude, lng: location.longitude },
        zoom: 16,
        disableDefaultUI: true,
        clickableIcons: false,
        mapId: 'IPAD_NAV_SYSTEM_v3',
        colorScheme: activeTheme === 'dark' ? 'DARK' : 'LIGHT',
        renderingType: 'VECTOR'
      });

      // FIX: Set preserveViewport: true to prevent "popping out" to full route view
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        map: mapInstance.current, 
        suppressMarkers: true,
        preserveViewport: true, // IMPORTANT: Keeps our custom zoom level
        polylineOptions: { 
          strokeColor: '#3B82F6', 
          strokeWeight: 8, 
          strokeOpacity: 0.9 
        }
      });

      trafficLayer.current = new google.maps.TrafficLayer();

      // Create Location Marker (AdvancedMarkerElement)
      if (google.maps.marker?.AdvancedMarkerElement) {
        const container = document.createElement('div');
        container.style.transition = 'transform 0.1s linear';
        
        // Render the arrow SVG into the container
        container.innerHTML = `
          <div class="location-arrow" style="width: 28px; height: 36px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3))">
            <svg viewBox="0 0 100 133" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
              <path d="M50 0L95 133L50 106L5 133L50 0Z" fill="#3B82F6" />
              <path d="M50 0V106L5 133L50 0Z" fill="#1D4ED8" />
            </svg>
          </div>
        `;

        locationMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map: mapInstance.current,
          position: { lat: location.latitude, lng: location.longitude },
          content: container,
          title: "Your Location"
        });
        locationArrowElRef.current = container;
      }
    }
  }, [isLoaded]);

  // 3. Update Location Marker Position & Heading
  useEffect(() => {
    if (locationMarkerRef.current) {
      locationMarkerRef.current.position = { lat: location.latitude, lng: location.longitude };
      
      if (locationArrowElRef.current) {
        const isNav = mode === AppMode.NAV_MODE || mode === AppMode.FULL_NAV;
        // In Nav Mode, map rotates, so arrow stays pointing UP relative to screen
        // In Normal Mode, map is north-up, so arrow rotates to show heading
        const rotation = isNav ? 0 : location.heading;
        locationArrowElRef.current.style.transform = `rotate(${rotation}deg)`;
        
        // Toggle look based on mode
        const arrow = locationArrowElRef.current.querySelector('.location-arrow') as HTMLElement;
        if (arrow) {
          if (mode === AppMode.NORMAL) {
            arrow.innerHTML = `<div style="width: 16px; height: 16px; background: #3B82F6; border: 2px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"></div>`;
          } else {
            arrow.innerHTML = `
              <svg viewBox="0 0 100 133" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                <path d="M50 0L95 133L50 106L5 133L50 0Z" fill="#3B82F6" />
                <path d="M50 0V106L5 133L50 0Z" fill="#1D4ED8" />
              </svg>
            `;
          }
        }
      }
    }

    // Camera follow logic
    if (mapInstance.current) {
      const isNav = mode === AppMode.NAV_MODE || mode === AppMode.FULL_NAV;
      if (isNav) {
        const targetZoom = 19;
        const targetTilt = 45;
        const targetHeading = location.heading;

        // Offset to keep position in lower-center for better forward visibility
        const offsetDist = 0.00015; 
        const rad = (location.heading * Math.PI) / 180;
        const targetCenter = { 
          lat: location.latitude + (offsetDist * Math.cos(rad)), 
          lng: location.longitude + (offsetDist * Math.sin(rad)) 
        };

        mapInstance.current.setOptions({
          center: targetCenter,
          zoom: targetZoom,
          heading: targetHeading,
          tilt: targetTilt,
        });
      }
    }
  }, [location.latitude, location.longitude, location.heading, mode]);

  // 4. Handle Theme Changes
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setOptions({
        colorScheme: activeTheme === 'dark' ? 'DARK' : 'LIGHT'
      });
    }
  }, [activeTheme]);

  // 5. Manage Destination Markers
  useEffect(() => {
    const google = (window as any).google;
    if (!google || !mapInstance.current || !directionsRenderer.current) return;

    const isValidRoute = routeData && routeData.routes && routeData.routes.length > 0;
    
    try {
      if (isValidRoute) {
        directionsRenderer.current.setDirections(routeData);
      } else {
        directionsRenderer.current.setDirections({ routes: [] });
      }
    } catch (e) {
      console.warn("Renderer Update Failed:", e);
    }

    destinationMarkers.current.forEach(m => m.map = null);
    destinationMarkers.current = [];

    if (isValidRoute && google.maps.marker?.AdvancedMarkerElement) {
      const leg = routeData.routes[0].legs[0];
      const pinElement = new google.maps.marker.PinElement({
        background: "#EF4444",
        borderColor: "#FFFFFF",
        glyphColor: "#FFFFFF",
        scale: 1.1,
      });

      const destMarker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance.current,
        position: leg.end_location,
        content: pinElement.element,
        title: "Destination"
      });
      
      destinationMarkers.current.push(destMarker);
    }
  }, [routeData]);

  // 6. Traffic Layer
  useEffect(() => {
    if (mapInstance.current && trafficLayer.current) {
      trafficLayer.current.setMap(navState.isTrafficEnabled ? mapInstance.current : null);
    }
  }, [navState.isTrafficEnabled, isLoaded]);

  return (
    <div className={`w-full h-full relative ${activeTheme === 'dark' ? 'bg-[#18181b]' : 'bg-zinc-200'}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black">
          <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
          <p className="text-zinc-500 font-black tracking-widest uppercase text-[10px]">Initializing High-Fidelity HUD...</p>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />

      {/* Map UI Overlay Elements */}
      <div className="absolute top-6 right-6 flex flex-col gap-3 z-20">
        <div className={`p-2.5 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl ${activeTheme === 'dark' ? 'bg-zinc-900/60 text-white' : 'bg-white/80 text-zinc-900'}`}>
          <Compass size={18} style={{ transform: `rotate(${-location.heading}deg)` }} className="transition-transform duration-150" />
        </div>
      </div>

      {/* Speedometer HUD */}
      {mode === AppMode.FULL_NAV && (
        <div className="absolute bottom-6 left-6 flex items-end gap-2.5 z-20">
          <div className={`p-3.5 ${activeTheme === 'dark' ? 'bg-zinc-900/80' : 'bg-white/95'} backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl flex flex-col items-center min-w-[64px]`}>
            <div className="flex items-baseline gap-0.5">
              <span className={`text-2xl font-black ${activeTheme === 'dark' ? 'text-white' : 'text-zinc-900'} tracking-tighter`}>
                {Math.round(location.speed)}
              </span>
              <span className="text-blue-500 font-black text-[8px]">MPH</span>
            </div>
            <div className="w-full h-[1px] bg-black/5 dark:bg-white/5 my-1.5" />
            <span className="text-[6px] font-black text-zinc-500 uppercase tracking-widest">Current</span>
          </div>
          
          <div className="w-8 h-10 bg-white border-[1.5px] border-black rounded-sm flex flex-col items-center justify-center shadow-lg">
             <div className="text-[4px] font-black text-black leading-none mb-0.5">SPEED</div>
             <div className="text-[4px] font-black text-black leading-none mb-0.5">LIMIT</div>
             <div className="text-sm font-black text-black leading-none tracking-tighter">65</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;