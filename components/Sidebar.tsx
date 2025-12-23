
import React, { useState, useEffect, useRef } from 'react';
import { Search, Map as MapIcon, Navigation, Layers, X, Settings, ShieldCheck, MapPin, LocateFixed, ArrowDownUp, Info, RefreshCw } from 'lucide-react';
import { AppMode, NavigationState } from '../types';

interface SidebarProps {
  navState: NavigationState;
  toggleNavMode: () => void;
  toggleTraffic: () => void;
  onSearch: (dest: string, origin: string) => void;
  onCancel: () => void;
  onOpenSettings: () => void;
  mode: AppMode;
  apiKey?: string;
  activeTheme: 'light' | 'dark';
}

const Sidebar: React.FC<SidebarProps> = ({ navState, toggleNavMode, toggleTraffic, onSearch, onCancel, onOpenSettings, mode, apiKey, activeTheme }) => {
  const [origin, setOrigin] = useState('Your Location');
  const [destination, setDestination] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const autocompleteService = useRef<any>(null);

  // Initialize service when window.google and maps.places become available
  useEffect(() => {
    const initAutocomplete = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        return true;
      }
      return false;
    };

    if (!initAutocomplete()) {
      const checkGoogle = setInterval(() => {
        if (initAutocomplete()) {
          clearInterval(checkGoogle);
        }
      }, 1000);
      return () => clearInterval(checkGoogle);
    }
  }, []);

  const handleInputChange = (value: string, field: 'origin' | 'destination') => {
    if (field === 'origin') setOrigin(value);
    else setDestination(value);

    if (value.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        { input: value }, 
        (results: any, status: any) => {
          if (status === 'OK' && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    } else {
      setPredictions([]);
    }
  };

  const selectPrediction = (p: any) => {
    if (activeField === 'origin') setOrigin(p.description);
    else setDestination(p.description);
    setPredictions([]);
    setActiveField(null);
  };

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination || 'Your Location');
    setDestination(temp === 'Your Location' ? '' : temp);
  };

  const handleRouteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      setIsLoading(true);
      onSearch(destination, origin);
      // Timeout fallback for loading state
      setTimeout(() => setIsLoading(false), 3000);
    }
  };

  const sidebarBg = activeTheme === 'dark' ? 'bg-zinc-950/80' : 'bg-white/80';
  const borderCol = activeTheme === 'dark' ? 'border-white/5' : 'border-black/5';
  const textCol = activeTheme === 'dark' ? 'text-white' : 'text-zinc-900';
  const inputBg = activeTheme === 'dark' ? 'bg-white/5' : 'bg-zinc-200/50';

  return (
    <aside className={`w-[400px] ${sidebarBg} backdrop-blur-3xl border-r ${borderCol} flex flex-col z-30 shadow-2xl transition-colors duration-500`}>
      <div className={`p-8 border-b ${borderCol}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
              <Navigation className="text-white fill-white" size={24} />
            </div>
            <h1 className={`text-2xl font-black tracking-tight ${textCol}`}>Pro-Nav</h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <ShieldCheck size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Premium</span>
          </div>
        </div>

        <form onSubmit={handleRouteRequest} className="relative space-y-4">
          <div className="space-y-2 relative">
            <div className="relative group">
              <LocateFixed className={`absolute left-4 top-1/2 -translate-y-1/2 ${origin === 'Your Location' ? 'text-blue-500' : 'text-zinc-500'}`} size={18} />
              <input 
                type="text"
                placeholder="Starting Point"
                value={origin}
                onChange={(e) => handleInputChange(e.target.value, 'origin')}
                onFocus={() => setActiveField('origin')}
                className={`w-full ${inputBg} border ${borderCol} rounded-2xl py-4 pl-12 pr-12 outline-none transition-all placeholder:text-zinc-500 text-base font-bold ${textCol}`}
              />
              {origin !== 'Your Location' && (
                <button 
                  type="button"
                  onClick={() => setOrigin('Your Location')} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-blue-500 transition-colors"
                  title="Use Current Location"
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
               <button 
                 type="button"
                 onClick={swapLocations}
                 className={`p-2 rounded-full border ${borderCol} ${activeTheme === 'dark' ? 'bg-zinc-900' : 'bg-white'} shadow-lg hover:scale-110 transition-transform`}
               >
                 <ArrowDownUp size={14} className="text-zinc-500" />
               </button>
            </div>

            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={18} />
              <input 
                type="text"
                placeholder="Search Destination"
                value={destination}
                onChange={(e) => handleInputChange(e.target.value, 'destination')}
                onFocus={() => setActiveField('destination')}
                className={`w-full ${inputBg} border ${borderCol} rounded-2xl py-4 pl-12 pr-12 outline-none transition-all placeholder:text-zinc-500 text-base font-bold ${textCol}`}
              />
              {destination && (
                <button 
                  type="button"
                  onClick={() => setDestination('')} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <button 
            type="submit"
            disabled={!destination.trim() || isLoading}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:grayscale text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Navigation size={20} className="fill-white" />}
            {isLoading ? 'CALCULATING...' : 'GET DIRECTIONS'}
          </button>

          {/* Autocomplete Dropdown */}
          {predictions.length > 0 && activeField && (
            <div className={`absolute top-[130px] left-0 right-0 mt-4 ${activeTheme === 'dark' ? 'bg-zinc-900' : 'bg-white'} border ${borderCol} rounded-[28px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden z-[60] animate-in slide-in-from-top-2`}>
              {predictions.map((p) => (
                <button
                  key={p.place_id}
                  type="button"
                  onClick={() => selectPrediction(p)}
                  className={`w-full flex items-center gap-4 p-5 text-left border-b ${borderCol} last:border-0 ${activeTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-zinc-100'} transition-colors`}
                >
                  <MapPin size={20} className="text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${textCol}`}>{p.structured_formatting.main_text}</p>
                    <p className="text-xs text-zinc-500 truncate">{p.structured_formatting.secondary_text}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        {mode === AppMode.FULL_NAV && navState.routeSteps.length > 0 ? (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="p-7 bg-blue-600/10 border border-blue-500/20 rounded-[32px] shadow-inner">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-1">Route Info</p>
                  <p className={`text-xl font-bold ${textCol}`}>{navState.destination?.split(',')[0]}</p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Info size={18} className="text-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                 <div>
                   <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Distance</p>
                   <p className={`text-3xl font-black tracking-tight ${textCol}`}>{navState.totalDistance}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">ETA</p>
                   <p className={`text-3xl font-black tracking-tight ${textCol}`}>{navState.totalDuration}</p>
                 </div>
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Turn List</h3>
               <div className="space-y-3">
                  {navState.routeSteps.slice(navState.currentStepIndex, navState.currentStepIndex + 3).map((step, i) => (
                    <div key={i} className={`flex gap-4 items-center p-5 rounded-3xl border ${i === 0 ? 'bg-white/5 border-white/10 shadow-xl' : 'opacity-30 border-transparent'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${i === 0 ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                          <Navigation size={22} className={i === 0 ? 'fill-white' : ''} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm leading-tight ${textCol}`}>{step.instruction}</p>
                          <p className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-wider">{step.distance}</p>
                        </div>
                    </div>
                  ))}
               </div>
            </div>

            <button 
              onClick={onCancel}
              className="w-full py-5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-2xl font-black transition-all border border-red-500/20 shadow-lg shadow-red-500/5"
            >
              STOP NAVIGATION
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Engine Controls</h2>
              <div className="grid grid-cols-2 gap-4">
                 <button 
                    onClick={toggleNavMode}
                    className={`p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all active:scale-95 ${
                      navState.isNavModeEnabled 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-2xl shadow-blue-600/30' 
                      : `${activeTheme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-500'} hover:border-blue-400/30`
                    }`}
                 >
                   <Navigation size={28} className={navState.isNavModeEnabled ? 'fill-white' : ''} />
                   <span className="text-sm font-black uppercase tracking-tighter">Nav Mode</span>
                 </button>
                 <button 
                    className={`p-6 rounded-[28px] border-2 flex flex-col items-center gap-3 transition-all ${activeTheme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-500'} hover:border-blue-400/30`}
                 >
                   <MapIcon size={28} />
                   <span className="text-sm font-black uppercase tracking-tighter">Standard</span>
                 </button>
              </div>
            </div>

            <div>
              <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Map Layers</h2>
              <button 
                onClick={toggleTraffic}
                className={`w-full flex items-center justify-between p-6 ${activeTheme === 'dark' ? 'bg-white/5 border-white/5 shadow-xl shadow-black/20' : 'bg-zinc-100 border-zinc-200'} rounded-[28px] border transition-all active:scale-[0.98]`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${navState.isTrafficEnabled ? 'bg-green-500/20' : 'bg-zinc-800'}`}>
                    <Layers size={22} className={navState.isTrafficEnabled ? 'text-green-400' : 'text-zinc-500'} />
                  </div>
                  <span className={`font-black text-lg ${textCol}`}>Traffic Data</span>
                </div>
                <div className={`w-14 h-7 rounded-full relative transition-all duration-500 ${navState.isTrafficEnabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${navState.isTrafficEnabled ? 'left-8' : 'left-1'}`} />
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      <div className={`p-8 border-t ${borderCol} ${activeTheme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
        <button 
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-4 p-5 ${activeTheme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'} rounded-2xl transition-all font-black uppercase tracking-widest text-xs`}
        >
          <Settings size={20} />
          <span>iPad Preferences</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
