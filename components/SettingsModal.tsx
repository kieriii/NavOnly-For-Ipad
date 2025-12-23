
import React from 'react';
// Added Settings to the import list to fix 'Cannot find name Settings' error
import { X, Moon, Sun, Monitor, Shield, Info, Check, Settings } from 'lucide-react';
import { ThemeMode } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  activeTheme: 'light' | 'dark';
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, theme, onThemeChange, activeTheme }) => {
  const modalBg = activeTheme === 'dark' ? 'bg-zinc-950/90' : 'bg-zinc-100/90';
  const itemBg = activeTheme === 'dark' ? 'bg-zinc-900/50' : 'bg-white';
  const borderCol = activeTheme === 'dark' ? 'border-white/5' : 'border-black/5';
  const textCol = activeTheme === 'dark' ? 'text-white' : 'text-zinc-900';

  const themeOptions = [
    { id: ThemeMode.LIGHT, label: 'Light', icon: Sun },
    { id: ThemeMode.DARK, label: 'Dark', icon: Moon },
    { id: ThemeMode.SYSTEM, label: 'System', icon: Monitor },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-xl ${modalBg} backdrop-blur-3xl rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border ${borderCol} overflow-hidden animate-in zoom-in-95 duration-300`}>
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-zinc-500/10 rounded-xl">
              <Settings className="text-zinc-500" size={24} />
            </div>
            <h2 className={`text-2xl font-black ${textCol}`}>System Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-2.5 ${activeTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'} rounded-full transition-colors`}
          >
            <X size={24} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-8 space-y-10">
          <section>
            <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Appearance</h3>
            <div className="grid grid-cols-3 gap-4">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onThemeChange(opt.id)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-[24px] border-2 transition-all active:scale-95 ${
                      isSelected 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/20' 
                      : `${itemBg} border-transparent ${activeTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} hover:border-blue-500/30`
                    }`}
                  >
                    <Icon size={28} />
                    <span className="text-sm font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Application Info</h3>
            <div className={`${itemBg} rounded-[28px] border ${borderCol} overflow-hidden`}>
              <div className={`flex items-center justify-between p-5 border-b ${borderCol}`}>
                <div className="flex items-center gap-4">
                  <Shield size={20} className="text-blue-500" />
                  <span className={`font-bold ${textCol}`}>Privacy Report</span>
                </div>
                <Check size={20} className="text-green-500" />
              </div>
              <div className={`flex items-center justify-between p-5`}>
                <div className="flex items-center gap-4">
                  <Info size={20} className="text-zinc-500" />
                  <span className={`font-bold ${textCol}`}>Software Version</span>
                </div>
                <span className="text-zinc-500 font-mono text-xs">v1.2.0-beta.8</span>
              </div>
            </div>
          </section>

          <p className="text-center text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
            iPad Pro Navigation Simulator &bull; Built with Google Maps Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
