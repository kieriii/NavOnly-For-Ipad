
import React, { useState } from 'react';
import { Search, Navigation, Layers, ArrowRight } from 'lucide-react';
import { AppMode, NavigationState } from '../types';

interface BottomPanelProps {
  navState: NavigationState;
  toggleNavMode: () => void;
  toggleTraffic: () => void;
  onSearch: (dest: string, lat?: number, lng?: number) => void;
  onCancel: () => void;
  mode: AppMode;
  activeTheme: 'light' | 'dark';
}

const BottomPanel: React.FC<BottomPanelProps> = ({ navState, toggleNavMode, toggleTraffic, onSearch, onCancel, mode, activeTheme }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue);
    }
  };

  const panelBg = activeTheme === 'dark' ? 'bg-zinc-900' : 'bg-white';
  const borderCol = activeTheme === 'dark' ? 'border-white/10' : 'border-black/5';
  const textCol = activeTheme === 'dark' ? 'text-white' : 'text-zinc-900';

  return (
    <div className={`absolute bottom-0 left-0 right-0 ${panelBg} border-t ${borderCol} z-30 rounded-t-[32px] shadow-2xl-up p-6 pb-12 transition-all`}>
      <div className={`w-12 h-1.5 ${activeTheme === 'dark' ? 'bg-white/20' : 'bg-black/10'} rounded-full mx-auto mb-6`} />
      
      <form onSubmit={handleSearchSubmit} className="relative mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${activeTheme === 'dark' ? 'text-white/40' : 'text-zinc-400'}`} size={20} />
            <input 
              type="text"
              placeholder="Where to?"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={`w-full ${activeTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'} border rounded-2xl py-4 pl-12 pr-4 font-semibold outline-none ${textCol}`}
            />
          </div>
          <button 
            type="submit"
            className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 text-white transition-transform active:scale-95"
          >
            {searchValue.trim() ? <ArrowRight size={24} /> : <Navigation size={24} />}
          </button>
        </div>
      </form>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={toggleNavMode}
          className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 rounded-2xl border font-bold transition-all ${
            navState.isNavModeEnabled ? 'bg-blue-600 border-blue-400 text-white' : `${activeTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/60' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`
          }`}
        >
          <Navigation size={20} />
          Nav Mode
        </button>
        <button 
          onClick={toggleTraffic}
          className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 rounded-2xl border font-bold transition-all ${
            navState.isTrafficEnabled ? 'bg-green-600/20 border-green-500/50 text-green-400' : `${activeTheme === 'dark' ? 'bg-white/5 border-white/10 text-white/60' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`
          }`}
        >
          <Layers size={20} />
          Traffic
        </button>
      </div>

      {mode === AppMode.FULL_NAV && (
        <div className="mt-6 p-4 bg-red-600/20 border border-red-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Navigating</span>
            <span className={`font-semibold truncate max-w-[200px] ${textCol}`}>{navState.destination}</span>
          </div>
          <button onClick={onCancel} className="px-6 py-2 bg-red-600 rounded-xl font-bold text-white shadow-lg shadow-red-600/20">Stop</button>
        </div>
      )}
    </div>
  );
};

export default BottomPanel;
