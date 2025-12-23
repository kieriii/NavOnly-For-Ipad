import React, { useState } from 'react';
import { Navigation, Layers, X, Settings, ShieldCheck, MapPin, LocateFixed, ArrowDownUp, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppMode, NavigationState } from '../types';

interface SidebarProps {
  navState: NavigationState;
  toggleNavMode: () => void;
  toggleTraffic: () => void;
  onSearch: (dest: string, origin: string) => void;
  onCancel: () => void;
  onOpenSettings: () => void;
  mode: AppMode;
  activeTheme: 'light' | 'dark';
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  navState, toggleNavMode, toggleTraffic, onSearch, onCancel, 
  onOpenSettings, mode, activeTheme, isCollapsed, setIsCollapsed 
}) => {
  const [origin, setOrigin] = useState('Your Location');
  const [destination, setDestination] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleInputChange = async (value: string, field: 'origin' | 'destination') => {
    if (field === 'origin') setOrigin(value); else setDestination(value);
    if (value.length <= 2) { setPredictions([]); return; }

    const google = (window as any).google;
    if (google?.maps?.places?.AutocompleteSuggestion) {
      try {
        const { suggestions } = await (google.maps.places as any).AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: value });
        setPredictions((suggestions || []).map((s: any) => ({
          place_id: s.placePrediction.placeId,
          description: s.placePrediction.text.text,
          structured_formatting: { main_text: s.placePrediction.mainText.text, secondary_text: s.placePrediction.secondaryText?.text || '' }
        })));
      } catch (e) {}
    }
  };

  const selectPrediction = (p: any) => {
    if (activeField === 'origin') setOrigin(p.description); else setDestination(p.description);
    setPredictions([]);
    setActiveField(null);
  };

  const handleRouteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      setIsLoading(true);
      onSearch(destination, origin);
      setTimeout(() => setIsLoading(false), 3000);
    }
  };

  const sidebarBg = activeTheme === 'dark' ? 'bg-zinc-950/95' : 'bg-white/95';
  const textCol = activeTheme === 'dark' ? 'text-white' : 'text-zinc-900';

  return (
    <>
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-[320px] ${sidebarBg} backdrop-blur-3xl border-r border-white/10 flex flex-col z-[60] shadow-2xl transition-transform duration-500 ease-in-out ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg"><Navigation className="text-white fill-white" size={18} /></div>
              <h1 className={`text-xl font-black tracking-tight ${textCol}`}>Pro-Nav</h1>
            </div>
            <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-1">
              <ShieldCheck size={10} className="text-blue-500" />
              <span className="text-[8px] font-black text-blue-500 uppercase">Premium</span>
            </div>
          </div>

          <form onSubmit={handleRouteRequest} className="space-y-4">
            <div className="relative space-y-2">
              <div className="relative">
                <LocateFixed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500" size={14} />
                <input 
                  type="text" value={origin} onChange={(e) => handleInputChange(e.target.value, 'origin')} onFocus={() => setActiveField('origin')}
                  className={`w-full ${activeTheme === 'dark' ? 'bg-white/5' : 'bg-zinc-100'} rounded-xl py-3 pl-10 pr-4 outline-none text-xs font-bold ${textCol}`}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500" size={14} />
                <input 
                  type="text" placeholder="Where to?" value={destination} onChange={(e) => handleInputChange(e.target.value, 'destination')} onFocus={() => setActiveField('destination')}
                  className={`w-full ${activeTheme === 'dark' ? 'bg-white/5' : 'bg-zinc-100'} rounded-xl py-3 pl-10 pr-4 outline-none text-xs font-bold ${textCol}`}
                />
              </div>
            </div>

            <button type="submit" disabled={!destination.trim() || isLoading} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-transform active:scale-95">
              {isLoading ? 'Calculating...' : 'Start Navigation'}
            </button>
          </form>

          {predictions.length > 0 && activeField && (
            <div className={`absolute top-[220px] left-4 right-4 rounded-xl ${activeTheme === 'dark' ? 'bg-zinc-900' : 'bg-white'} border border-white/10 shadow-2xl z-50 overflow-hidden`}>
              {predictions.map(p => (
                <button key={p.place_id} onClick={() => selectPrediction(p)} className={`w-full text-left p-3 hover:bg-blue-500/10 border-b border-white/5 text-[10px] flex items-start gap-2 ${textCol}`}>
                  <MapPin size={12} className="text-blue-500 mt-0.5" />
                  <div><p className="font-bold">{p.structured_formatting.main_text}</p><p className="text-zinc-500">{p.structured_formatting.secondary_text}</p></div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-2">Map Controls</h2>
          <div className="space-y-3">
             <button onClick={toggleTraffic} className={`w-full flex items-center justify-between p-4 rounded-xl border border-white/5 ${navState.isTrafficEnabled ? 'bg-green-600/10' : 'bg-white/5'}`}>
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${navState.isTrafficEnabled ? 'bg-green-600' : 'bg-zinc-700'}`}><Layers size={14} className="text-white" /></div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${textCol}`}>Traffic View</span>
               </div>
               <div className={`w-8 h-4 rounded-full relative ${navState.isTrafficEnabled ? 'bg-green-500' : 'bg-zinc-700'}`}>
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${navState.isTrafficEnabled ? 'left-4.5' : 'left-0.5'}`} />
               </div>
             </button>

             <button onClick={toggleNavMode} className={`w-full flex items-center gap-3 p-4 rounded-xl border border-white/5 ${navState.isNavModeEnabled ? 'bg-blue-600' : 'bg-white/5'}`}>
               <div className={`p-2 rounded-lg ${navState.isNavModeEnabled ? 'bg-white' : 'bg-zinc-700'}`}><Navigation size={14} className={navState.isNavModeEnabled ? 'text-blue-600' : 'text-white'} /></div>
               <span className={`text-[10px] font-black uppercase tracking-widest ${navState.isNavModeEnabled ? 'text-white' : textCol}`}>Nav Perspective</span>
             </button>
          </div>

          {mode === AppMode.FULL_NAV && (
            <button onClick={onCancel} className="w-full py-4 bg-red-600/10 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest border border-red-500/20">Cancel Trip</button>
          )}
        </div>

        <div className="p-6 border-t border-white/5">
          <button onClick={onOpenSettings} className={`w-full py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest ${textCol}`}><Settings size={14} />Settings</button>
        </div>
      </aside>

      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`fixed top-1/2 -translate-y-1/2 z-[70] p-3 bg-blue-600 text-white rounded-r-xl shadow-2xl transition-all duration-500 ${isCollapsed ? 'left-0' : 'left-[320px]'} active:scale-90`}
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </>
  );
};

export default Sidebar;