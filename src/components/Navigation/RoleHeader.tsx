import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { ActiveAppView } from '../../types';
import { ButtonSpinner } from '../Shared/Loaders';
import { 
  Smartphone, 
  Tv, 
  Sliders, 
  LayoutDashboard, 
  BarChart3, 
  QrCode, 
  Users, 
  Zap, 
  Radio,
  ChevronDown
} from 'lucide-react';
import { QRCodeModal } from '../Shared/QRCodeModal';

export const RoleHeader: React.FC = () => {
  const { 
    events, 
    currentEvent, 
    activeView, 
    setActiveView, 
    setCurrentEventId, 
    simulateAudienceVotes, 
    isSimulatingCrowd,
  } = useEvent();

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);

  const views: { id: ActiveAppView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'participant', label: 'Participant Mobile', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'presenter', label: 'Presenter Control', icon: <Sliders className="w-4 h-4" /> },
    { id: 'projector', label: 'Projector Screen', icon: <Tv className="w-4 h-4" />, badge: '16:9' },
    { id: 'admin', label: 'Admin Studio', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics & Export', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE</span>
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span>WAITING</span>
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
            <span>ENDED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            <span>DRAFT</span>
          </span>
        );
    }
  };

  return (
    <>
      <header id="main-role-header" className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          
          {/* Logo & Event Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm font-black text-lg">
                <span className="material-symbols-outlined text-[20px]">widgets</span>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-lg tracking-tight text-slate-900">Workspace</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Audience Interaction</p>
              </div>
            </div>

            {/* Event Switcher Dropdown */}
            <div className="relative">
              <button
                id="event-selector-btn"
                onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors max-w-[200px] sm:max-w-xs truncate"
              >
                <Radio className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <span className="truncate">{currentEvent?.title || 'Select Event'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {isEventDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Active Event
                  </div>
                  {events.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => {
                        setCurrentEventId(evt.id);
                        setIsEventDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 transition-colors ${
                        currentEvent?.id === evt.id ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold truncate">{evt.title}</div>
                        <div className="text-[10px] text-slate-400">Code: {evt.roomCode}</div>
                      </div>
                      {getStatusBadge(evt.status)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {currentEvent && getStatusBadge(currentEvent.status)}
          </div>

          {/* Center Navigation: View Modes */}
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {views.map((v) => {
              const isActive = activeView === v.id;
              return (
                <button
                  key={v.id}
                  id={`nav-view-${v.id}`}
                  onClick={() => setActiveView(v.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-indigo-900 shadow-sm border border-slate-200 ring-1 ring-indigo-600/20'
                      : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60'
                  }`}
                >
                  {v.icon}
                  <span>{v.label}</span>
                  {v.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-md font-bold">
                      {v.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Action Tools: Code, QR, Crowd Simulation */}
          <div className="flex items-center space-x-2">
            
            {/* Room Code Badge */}
            {currentEvent && (
              <div 
                onClick={() => setIsQRModalOpen(true)}
                className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer transition-colors border border-slate-200 shadow-sm"
                title="Click to view QR code"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Code:</div>
                <div className="text-sm font-semibold tracking-widest font-mono text-slate-900">{currentEvent.roomCode}</div>
                <QrCode className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}

            {/* Live Participant Count */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-100 rounded-xl text-slate-700 text-xs font-semibold">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="font-mono-numbers">{currentEvent?.participants.length || 0}</span>
              <span className="hidden md:inline text-slate-500">joined</span>
            </div>

            {/* Quick Crowd Simulator Button */}
            <button
              id="simulate-crowd-header-btn"
              onClick={() => simulateAudienceVotes(12)}
              disabled={isSimulatingCrowd}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all shadow-sm disabled:opacity-50 min-w-[90px] justify-center"
              title="Simulate 12 audience members answering in real time"
            >
              {isSimulatingCrowd ? (
                <>
                  <ButtonSpinner size="w-3.5 h-3.5" color="text-amber-500" />
                  <span className="animate-pulse tracking-wider text-[10px] uppercase text-amber-600 hidden sm:inline">SIMULATING</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">+12 Votes</span>
                  <span className="sm:hidden">+12</span>
                </>
              )}
            </button>

            {/* QR Code Modal Trigger */}
            <button
              id="header-qr-btn"
              onClick={() => setIsQRModalOpen(true)}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg shadow-sm transition-colors"
              title="Open QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile View Selector Bar */}
        <div className="lg:hidden flex items-center overflow-x-auto px-3 py-2 bg-slate-50 border-t border-slate-200 space-x-1.5 scrollbar-none">
          {views.map((v) => {
            const isActive = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {v.icon}
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* QR Code Modal */}
      {currentEvent && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          roomCode={currentEvent.roomCode}
          eventTitle={currentEvent.title}
        />
      )}
    </>
  );
};
