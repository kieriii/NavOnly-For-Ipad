import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Navigation, MessageSquare, AlertTriangle, X } from 'lucide-react';
import { AppMode, LocationData, NavigationState, ThemeMode } from './types';
import Sidebar from './components/Sidebar';
import BottomPanel from './components/BottomPanel';
import MapView from './components/MapView';
import TutorPanel from './components/TutorPanel';
import SettingsModal from './components/SettingsModal';

// Integrated User API Key
const GMS_API_KEY = "AIzaSyCCM0hA0-wQ6xGzAKl7tnvLzLQueqhQi0I";

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.NORMAL);
  const [isTutorOpen, setIsTutorOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  );

  const [navState, setNavState] = useState<NavigationState>({
    isTrafficEnabled: true,
    isNavModeEnabled: false,
    origin: 'Your Location',
    destination: null,
    currentStepIndex: 0,
    routeSteps: [],
    theme: ThemeMode.DARK
  });

  const [location, setLocation] = useState<LocationData>({
    latitude: 37.7749,
    longitude: -122.4194,
    heading: 0,
    speed: 0,
    accuracy: 5,
    timestamp: Date.now()
  });

  // Improved Geolocation Tracker
  useEffect(() => {
    if (!navigator.geolocation) return;

    let watchId: number;

    const startTracking = () => {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation(prev => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading || prev.heading,
            speed: (pos.coords.speed || 0) * 2.237, // Convert m/s to mph
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          }));
        },
        (err) => {
          console.warn(`Geolocation error (${err.code}): ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };

    // Request current position first to trigger permission prompt immediately
    navigator.geolocation.getCurrentPosition(
      () => startTracking(),
      (err) => {
        console.warn("Initial geolocation request failed. Retrying in background...");
        startTracking();
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const activeTheme = useMemo(() => {
    if (navState.theme === ThemeMode.SYSTEM) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return navState.theme === ThemeMode.DARK ? 'dark' : 'light';
  }, [navState.theme]);

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [activeTheme]);

  // Simulation fallback for movement during Full Nav
  useEffect(() => {
    if (mode === AppMode.FULL_NAV && navState.routeSteps.length > 0) {
      const interval = setInterval(() => {
        setLocation(prev => ({
          ...prev,
          heading: (prev.heading + 0.1) % 360,
          timestamp: Date.now(),
          latitude: prev.latitude + (0.000004 * Math.cos((prev.heading * Math.PI) / 180)),
          longitude: prev.longitude + (0.000004 * Math.sin((prev.heading * Math.PI) / 180)),
        }));
      }, 100); 
      return () => clearInterval(interval);
    }
  }, [mode, navState.routeSteps]);

  const toggleNavMode = useCallback(() => {
    setNavState(prev => {
      const newState = !prev.isNavModeEnabled;
      setMode(newState ? AppMode.NAV_MODE : AppMode.NORMAL);
      return { ...prev, isNavModeEnabled: newState };
    });
  }, []);

  const toggleTraffic = useCallback(() => {
    setNavState(prev => ({ ...prev, isTrafficEnabled: !prev.isTrafficEnabled }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setNavState(prev => ({ ...prev, theme }));
  }, []);

  const startNavigation = async (destination: string, origin: string = 'Your Location') => {
    if (!window.google || !window.google.maps) {
      setApiError("Google Maps library not ready. Please wait a moment.");
      return;
    }
    setApiError(null);

    const directionsService = new window.google.maps.DirectionsService();
    
    let requestOrigin: any = origin;
    if (origin === 'Your Location') {
      requestOrigin = new window.google.maps.LatLng(location.latitude, location.longitude);
    }

    try {
      const result = await new Promise<any>((resolve, reject) => {
        directionsService.route({
          origin: requestOrigin,
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: false,
        }, (response, status) => {
          if (status === 'OK' && response) resolve(response);
          else reject(status);
        });
      });

      if (result && result.routes && result.routes.length > 0) {
        const leg = result.routes[0].legs[0];
        const steps = leg.steps.map((s: any) => ({
          instruction: s.instructions.replace(/<[^>]*>?/gm, ''),
          distance: s.distance.text,
          type: 'straight'
        }));

        setRouteData(result);
        setNavState(prev => ({ 
          ...prev, 
          origin,
          destination: leg.end_address, 
          isNavModeEnabled: true,
          currentStepIndex: 0,
          routeSteps: steps,
          totalDistance: leg.distance.text,
          totalDuration: leg.duration.text
        }));
        
        setMode(AppMode.FULL_NAV);
      } else {
        throw new Error("Invalid route result structure");
      }
    } catch (error) {
      console.error("Directions request failed:", error);
      setRouteData(null);
      if (error === 'REQUEST_DENIED') {
        setApiError("Directions API Denied. Check if 'Directions API' is enabled in Google Cloud Console.");
      } else if (error === 'ZERO_RESULTS') {
        setApiError("No route found between these locations. Try being more specific.");
      } else {
        setApiError(`Routing failed: ${error}`);
      }
    }
  };

  const cancelNavigation = () => {
    setRouteData(null);
    setApiError(null);
    setNavState(prev => ({ 
      ...prev, 
      destination: null, 
      isNavModeEnabled: false,
      routeSteps: []
    }));
    setMode(AppMode.NORMAL);
  };

  const bgColor = activeTheme === 'dark' ? 'bg-black' : 'bg-zinc-100';
  const textColor = activeTheme === 'dark' ? 'text-white' : 'text-zinc-900';

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${bgColor} ${textColor} relative font-sans selection:bg-blue-500/30 transition-colors duration-500`}>
      {orientation === 'landscape' && (
        <Sidebar 
          navState={navState} 
          toggleNavMode={toggleNavMode} 
          toggleTraffic={toggleTraffic}
          onSearch={startNavigation}
          onCancel={cancelNavigation}
          onOpenSettings={() => setIsSettingsOpen(true)}
          mode={mode}
          apiKey={GMS_API_KEY}
          activeTheme={activeTheme}
        />
      )}

      <main className="flex-1 relative bg-zinc-950 overflow-hidden">
        <MapView 
          location={location} 
          navState={navState} 
          mode={mode}
          apiKey={GMS_API_KEY}
          activeTheme={activeTheme}
          routeData={routeData}
        />
        
        {apiError && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg animate-in slide-in-from-top duration-300">
            <div className="bg-red-600/90 backdrop-blur-3xl border border-red-500 p-6 rounded-[32px] shadow-2xl flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-2xl">
                <AlertTriangle size={32} className="text-white" />
              </div>
              <div className="flex-1">
                 <p className="text-sm font-black text-white uppercase tracking-widest mb-1">System Error</p>
                 <p className="text-lg font-bold text-white leading-tight">{apiError}</p>
                 <button 
                  onClick={() => setIsTutorOpen(true)}
                  className="mt-2 text-xs font-black text-red-100 underline decoration-red-100/30 hover:text-white transition-colors uppercase tracking-widest"
                 >
                   Troubleshooting Steps
                 </button>
              </div>
              <button onClick={() => setApiError(null)} className="p-2 hover:bg-white/10 rounded-full text-white">
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        <button 
          onClick={() => setIsTutorOpen(!isTutorOpen)}
          className="absolute top-10 right-10 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-[22px] shadow-2xl transition-all active:scale-95 flex items-center gap-3 px-6 group"
        >
          <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
          <span className="font-black text-sm uppercase tracking-widest">{isTutorOpen ? 'Close Guide' : 'Open Expert Guide'}</span>
        </button>

        <div className={`absolute top-32 right-10 z-40 ${activeTheme === 'dark' ? 'bg-zinc-900/60' : 'bg-white/80'} backdrop-blur-3xl p-6 rounded-[32px] text-xs font-mono space-y-2 border border-white/5 w-60 shadow-2xl transition-colors duration-500`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <p className="text-blue-400 font-black uppercase tracking-widest text-[10px]">Telemetry Live</p>
          </div>
          <div className={`space-y-1.5 ${activeTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
             <div className="flex justify-between"><span>Lat:</span> <span className={activeTheme === 'dark' ? 'text-white' : 'text-zinc-900'}>{location.latitude.toFixed(6)}</span></div>
             <div className="flex justify-between"><span>Lng:</span> <span className={activeTheme === 'dark' ? 'text-white' : 'text-zinc-900'}>{location.longitude.toFixed(6)}</span></div>
             <div className="flex justify-between"><span>MPH:</span> <span className={activeTheme === 'dark' ? 'text-white' : 'text-zinc-900'}>{Math.round(location.speed)}</span></div>
             <div className="flex justify-between"><span>Accuracy:</span> <span className="text-green-500 font-bold tracking-tight">{Math.round(location.accuracy)}m</span></div>
          </div>
        </div>

        {mode === AppMode.FULL_NAV && navState.routeSteps.length > 0 && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-8">
            <div className={`${activeTheme === 'dark' ? 'bg-zinc-900/80' : 'bg-white/90'} backdrop-blur-3xl rounded-[40px] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex items-center gap-10 border border-white/10 group hover:border-white/20 transition-all duration-500`}>
              <div className="p-7 bg-green-600 rounded-[32px] shadow-2xl shadow-green-600/20 group-hover:scale-105 transition-transform duration-500">
                <Navigation size={64} className="text-white fill-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                   <p className={`text-6xl font-black ${activeTheme === 'dark' ? 'text-white' : 'text-zinc-900'} tracking-tighter leading-none`}>{navState.routeSteps[navState.currentStepIndex].distance}</p>
                   <p className="text-green-500 font-black text-xl uppercase tracking-widest">Until Turn</p>
                </div>
                <p className={`text-3xl ${activeTheme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'} font-medium leading-tight mt-2`}>{navState.routeSteps[navState.currentStepIndex].instruction}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {orientation === 'portrait' && (
        <BottomPanel 
          navState={navState} 
          toggleNavMode={toggleNavMode} 
          toggleTraffic={toggleTraffic}
          onSearch={startNavigation}
          onCancel={cancelNavigation}
          mode={mode}
          activeTheme={activeTheme}
        />
      )}

      {isTutorOpen && (
        <TutorPanel onClose={() => setIsTutorOpen(false)} apiKey={GMS_API_KEY} />
      )}

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          theme={navState.theme} 
          onThemeChange={setTheme}
          activeTheme={activeTheme}
        />
      )}
    </div>
  );
};

export default App;