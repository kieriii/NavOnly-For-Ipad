import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigation, MessageSquare } from 'lucide-react';
import { AppMode, LocationData, NavigationState, ThemeMode } from './types';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import TutorPanel from './components/TutorPanel';
import SettingsModal from './components/SettingsModal';

const MAPS_API_KEY = "AIzaSyCCM0hA0-wQ6xGzAKl7tnvLzLQueqhQi0I";
const GEMINI_API_KEY = process.env.API_KEY || "";

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.NORMAL);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
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
    latitude: 38.5667,
    longitude: -121.4124,
    heading: 0,
    speed: 0,
    accuracy: 5,
    timestamp: Date.now()
  });

  useEffect(() => {
    if (mode === AppMode.FULL_NAV) {
      setIsSidebarCollapsed(true);
    }
  }, [mode]);

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
            speed: (pos.coords.speed || 0) * 2.237,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          }));
        },
        (err) => console.warn(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };
    navigator.geolocation.getCurrentPosition(() => startTracking(), () => startTracking(), { enableHighAccuracy: true });
    return () => { if (watchId !== undefined) navigator.geolocation.clearWatch(watchId); };
  }, []);

  const activeTheme = useMemo(() => {
    if (navState.theme === ThemeMode.SYSTEM) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return navState.theme === ThemeMode.DARK ? 'dark' : 'light';
  }, [navState.theme]);

  useEffect(() => {
    const handleResize = () => setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleNavMode = useCallback(() => {
    setNavState(prev => {
      const newState = !prev.isNavModeEnabled;
      setMode(newState ? AppMode.NAV_MODE : AppMode.NORMAL);
      return { ...prev, isNavModeEnabled: newState };
    });
  }, []);

  const startNavigation = async (destination: string, origin: string = 'Your Location') => {
    const google = (window as any).google;
    if (!google || !google.maps) return;
    const directionsService = new google.maps.DirectionsService();
    let requestOrigin = origin === 'Your Location' ? new google.maps.LatLng(location.latitude, location.longitude) : origin;

    try {
      const result = await new Promise<any>((resolve, reject) => {
        directionsService.route({
          origin: requestOrigin,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        }, (res, status) => { if (status === 'OK') resolve(res); else reject(status); });
      });

      const leg = result.routes[0].legs[0];
      setRouteData(result);
      setNavState(prev => ({ 
        ...prev, 
        origin,
        destination: leg.end_address, 
        isNavModeEnabled: true,
        currentStepIndex: 0,
        routeSteps: leg.steps.map((s: any) => ({
          instruction: s.instructions.replace(/<[^>]*>?/gm, ''),
          distance: s.distance.text,
          type: 'straight'
        })),
        totalDistance: leg.distance.text,
        totalDuration: leg.duration.text
      }));
      setMode(AppMode.FULL_NAV);
    } catch (e) { 
      console.error("Navigation routing error:", e);
      setApiError(`Route Error: ${e}`); 
    }
  };

  const cancelNavigation = () => {
    setRouteData(null);
    setNavState(prev => ({ ...prev, destination: null, isNavModeEnabled: false, routeSteps: [] }));
    setMode(AppMode.NORMAL);
    setIsSidebarCollapsed(false);
  };

  return (
    /* Changed: Removed solid background colors so map is visible behind the UI */
    <div className={`flex h-screen w-screen overflow-hidden bg-transparent relative transition-colors duration-500`}>
      {orientation === 'landscape' && (
        <Sidebar 
          navState={navState} 
          toggleNavMode={toggleNavMode} 
          toggleTraffic={() => setNavState(p => ({...p, isTrafficEnabled: !p.isTrafficEnabled}))}
          onSearch={startNavigation}
          onCancel={cancelNavigation}
          onOpenSettings={() => setIsSettingsOpen(true)}
          mode={mode}
          activeTheme={activeTheme}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      )}

      /* Changed: Removed bg-zinc-950 to allow transparency */
      <main className="flex-1 relative bg-transparent overflow-hidden">
        <MapView 
          location={location} 
          navState={navState} 
          mode={mode}
          apiKey={MAPS_API_KEY}
          activeTheme={activeTheme}
          routeData={routeData}
        />
        
        <button 
          onClick={() => setIsTutorOpen(!isTutorOpen)}
          className="absolute top-6 right-6 z-50 bg-blue-600/90 text-white p-2.5 rounded-xl shadow-xl flex items-center gap-2 px-4 transition-transform active:scale-95"
        >
          <MessageSquare size={16} />
          <span className="font-black text-[10px] uppercase tracking-widest">Guide</span>
        </button>

        {mode === AppMode.FULL_NAV && navState.routeSteps.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-xs pointer-events-none">
            <div className={`${activeTheme === 'dark' ? 'bg-zinc-900/95' : 'bg-white/95'} backdrop-blur-2xl rounded-[24px] p-4 shadow-2xl flex items-center gap-4 border border-white/10`}>
              <div className="p-2.5 bg-green-600 rounded-xl shadow-lg">
                <Navigation size={24} className="text-white fill-white" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-baseline gap-1">
                   <p className={`text-2xl font-black ${activeTheme === 'dark' ? 'text-white' : 'text-zinc-900'} tracking-tighter leading-none`}>
                     {navState.routeSteps[navState.currentStepIndex].distance}
                   </p>
                   <p className="text-green-500 font-black text-[8px] uppercase tracking-widest">UNTIL TURN</p>
                </div>
                <p className={`text-xs ${activeTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} font-bold leading-tight mt-0.5 truncate`}>
                  {navState.routeSteps[navState.currentStepIndex].instruction}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {isTutorOpen && <TutorPanel onClose={() => setIsTutorOpen(false)} apiKey={MAPS_API_KEY} />}
      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          theme={navState.theme} 
          onThemeChange={(t) => setNavState(p => ({...p, theme: t}))} 
          activeTheme={activeTheme} 
        />
      )}
    </div>
  );
};

export default App;