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
  ChevronDown,
  LogOut,
  UserCheck,
  Shield
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
    session,
    logout
  } = useEvent();

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);

  const adminViews: { id: ActiveAppView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'presenter', label: 'Presenter', icon: <Sliders className="w-4 h-4" /> },
    { id: 'projector', label: 'Projector', icon: <Tv className="w-4 h-4" />, badge: '16:9' },
    { id: 'admin', label: 'Admin Studio', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'participant', label: 'Audience View', icon: <Smartphone className="w-4 h-4" /> },
  ];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE</span>
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            WAITING
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
            ENDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
            DRAFT
          </span>
        );
    }
  };

  return (
    <>
      <header id="main-role-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Brand Logo & Event Selector */}
          <div className="flex items-center space-x-3">
            <div 
              onClick={() => setActiveView('participant')}
              className="flex items-center space-x-2.5 cursor-pointer select-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                  Pulse<span className="text-blue-600">Live</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                  Interactive Polling
                </p>
              </div>
            </div>

            {/* Event Switcher (Only visible to Admin) */}
            {session && (
              <div className="relative ml-2">
                <button
                  id="event-selector-btn"
                  onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors max-w-[180px] sm:max-w-xs truncate"
                >
                  <span className="truncate">{currentEvent?.title || 'Select Event'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {isEventDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Event
                    </div>
                    {events.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => {
                          setCurrentEventId(evt.id);
                          setIsEventDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          currentEvent?.id === evt.id ? 'bg-blue-50/70 font-bold text-blue-900' : 'text-slate-700'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="font-semibold truncate">{evt.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Code: {evt.roomCode}</div>
                        </div>
                        {getStatusBadge(evt.status)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentEvent && getStatusBadge(currentEvent.status)}
          </div>

          {/* Center Navigation: Only shown when Admin/Presenter is logged in */}
          {session ? (
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {adminViews.map((v) => {
                const isActive = activeView === v.id;
                return (
                  <button
                    key={v.id}
                    id={`nav-view-${v.id}`}
                    onClick={() => setActiveView(v.id)}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80 ring-1 ring-blue-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {v.icon}
                    <span>{v.label}</span>
                    {v.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-md font-bold">
                        {v.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500 font-medium">
              <span>Audience Session</span>
              {currentEvent && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">{currentEvent.title}</span>
                </>
              )}
            </div>
          )}

          {/* Right: Room info & Actions */}
          <div className="flex items-center space-x-2">
            
            {/* Live Participant Count */}
            {currentEvent && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-slate-700 text-xs font-bold">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono">{currentEvent.participants.length}</span>
                <span className="hidden sm:inline font-normal text-slate-500">live</span>
              </div>
            )}

            {/* Quick Crowd Simulator (Only for logged in Admin) */}
            {session && (
              <button
                id="simulate-crowd-header-btn"
                onClick={() => simulateAudienceVotes(10)}
                disabled={isSimulatingCrowd}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                title="Simulate 10 audience members answering live"
              >
                {isSimulatingCrowd ? (
                  <>
                    <ButtonSpinner size="w-3.5 h-3.5" color="text-amber-600" />
                    <span className="animate-pulse text-[10px]">SIMULATING</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>+10 Votes</span>
                  </>
                )}
              </button>
            )}

            {/* QR Code Modal Trigger */}
            {currentEvent && (
              <button
                id="header-qr-btn"
                onClick={() => setIsQRModalOpen(true)}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl shadow-xs transition-colors"
                title="View Room QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}

            {/* Admin Login / Logout button */}
            {session ? (
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                title="Sign out of Host Mode"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveView('login')}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                title="Presenter / Admin Sign In"
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Host Login</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile View Switcher (Only when logged in) */}
        {session && (
          <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-200 space-x-1.5 scrollbar-none">
            {adminViews.map((v) => {
              const isActive = activeView === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {v.icon}
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
        )}
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
