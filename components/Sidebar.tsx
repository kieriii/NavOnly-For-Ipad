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
  
  const handleInputChange = async (value: string, field: 'origin' | 'destination') => {
    if (field === 'origin') setOrigin(value);
    else setDestination(value);

    if (value.length <= 2) {
      setPredictions([]);
      return;
    }

    // New 2025 AutocompleteSuggestion API implementation
    if (window.google?.maps?.places?.AutocompleteSuggestion) {
      try {
        const { suggestions } = await (window.google.maps.places as any).AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
        });
        
        const normalized = (suggestions || []).map((s: any) => ({
          place_id: s.placePrediction.placeId,
          description: s.placePrediction.text.text,
          structured_formatting: {
            main_text: s.placePrediction.mainText.text,
            secondary_text: s.placePrediction.secondaryText?.text || ''
          }
        }));
        setPredictions(normalized);
      } catch (err) {
        console.warn("AutocompleteSuggestion API error, falling back...");
        // Hidden fallback for older SDK versions if needed
      }
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
            {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Navigation size={20} />}
            {isLoading ? 'CALCULATING...' : 'START NAVIGATION'}
          </button>

          {predictions.length > 0 && activeField && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border ${borderCol} ${activeTheme === 'dark' ? 'bg-zinc-900' : 'bg-white'} overflow-hidden shadow-2xl z-[60] animate-in slide-in-from-top-2`}>
              {predictions.map((p) => (
                <button
                  key={p.place_id}
                  type="button"
                  onClick={() => selectPrediction(p)}
                  className={`w-full text-left p-4 hover:bg-blue-500/10 border-b ${borderCol} last:border-0 transition-colors flex items-start gap-3`}
                >
                  <MapPin size={16} className="text-blue-500 mt-1" />
                  <div>
                    <p className={`font-bold text-sm ${textCol}`}>{p.structured_formatting.main_text}</p>
                    <p className="text-xs text-zinc-500">{p.structured_formatting.secondary_text}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        {mode === AppMode.FULL_NAV && navState.routeSteps.length > 0 ? (
          <div className="space-y-6">
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

            <button 
              onClick={onCancel}
              className="w-full py-5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-2xl font-black transition-all border border-red-500/20"
            >
              STOP NAVIGATION
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Engine Controls</h2>
              <div className="grid grid-cols-2 gap-4">
                 <button 
                    onClick={toggleNavMode}
                    className={`p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all ${
                      navState.isNavModeEnabled 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/20' 
                      : `${activeTheme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`
                    }`}
                 >
                   <Navigation size={28} className={navState.isNavModeEnabled ? 'fill-white' : ''} />
                   <span className="text-sm font-black uppercase">Nav Mode</span>
                 </button>
                 <button className={`p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 ${activeTheme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
                   <MapIcon size={28} />
                   <span className="text-sm font-black uppercase">Standard</span>
                 </button>
              </div>
            </div>

            <button 
              onClick={toggleTraffic}
              className={`w-full flex items-center justify-between p-6 ${activeTheme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-zinc-100 border-zinc-200'} rounded-[24px] border transition-all`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${navState.isTrafficEnabled ? 'bg-green-500 text-white' : 'bg-zinc-500/10 text-zinc-500'}`}>
                  <Layers size={20} />
                </div>
                <span className={`font-black text-lg ${textCol}`}>Traffic View</span>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-colors ${navState.isTrafficEnabled ? 'bg-green-500' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${navState.isTrafficEnabled ? 'left-7' : 'left-1'}`} />
              </div>
            </button>
          </div>
        )}
      </div>

      <div className={`p-8 border-t ${borderCol} bg-zinc-900/10`}>
        <button 
          onClick={onOpenSettings}
          className={`w-full py-4 rounded-2xl border ${borderCol} flex items-center justify-center gap-3 font-bold ${textCol} hover:bg-white/5 transition-colors`}
        >
          <Settings size={20} />
          Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;