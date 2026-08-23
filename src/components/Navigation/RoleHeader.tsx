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
  ChevronDown,
  LogOut,
  Shield,
  Radio
} from 'lucide-react';
import { QRCodeModal } from '../Shared/QRCodeModal';
import { BrandLogo } from '../Shared/BrandLogo';

export const RoleHeader: React.FC = () => {
  const { 
    events, 
    currentEvent, 
    activeView, 
    setActiveView, 
    setCurrentEventId, 
    simulateAudienceVotes, 
    isSimulatingCrowd,
    isHost,
    logout
  } = useEvent();

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);

  const adminViews: { id: ActiveAppView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'presenter', label: 'Presenter', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'projector', label: 'Projector', icon: <Tv className="w-3.5 h-3.5" />, badge: 'Stage' },
    { id: 'admin', label: 'Admin Studio', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'participant', label: 'Audience View', icon: <Smartphone className="w-3.5 h-3.5" /> },
  ];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE</span>
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            LOBBY
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
            ENDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
            DRAFT
          </span>
        );
    }
  };

  return (
    <>
      <header id="main-role-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          {/* Left: Brand Logo & Event Selector */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 shrink-0">
            <div 
              onClick={() => setActiveView('participant')}
              className="cursor-pointer select-none group shrink-0"
            >
              <BrandLogo size="sm" />
            </div>

            {/* Event Switcher with Integrated Status Badge (Only visible to Admin) */}
            {isHost && (
              <div className="relative shrink-0">
                <button
                  id="event-selector-btn"
                  onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors max-w-[140px] md:max-w-[180px] xl:max-w-[210px] truncate cursor-pointer shadow-2xs"
                >
                  <span className="truncate font-bold text-slate-800 text-[11px] sm:text-xs">
                    {currentEvent?.title || 'Select Event'}
                  </span>
                  {currentEvent && (
                    <span className="shrink-0 scale-90 sm:scale-100">{getStatusBadge(currentEvent.status)}</span>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {isEventDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Event Session
                    </div>
                    {events.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => {
                          setCurrentEventId(evt.id);
                          setIsEventDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          currentEvent?.id === evt.id ? 'bg-indigo-50/70 font-bold text-indigo-900' : 'text-slate-700'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="font-semibold truncate">{evt.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">PIN: {evt.roomCode}</div>
                        </div>
                        {getStatusBadge(evt.status)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center Navigation: Compact, responsive, no overlap */}
          {isHost ? (
            <div className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shrink-0 mx-1">
              {adminViews.map((v) => {
                const isActive = activeView === v.id;
                return (
                  <button
                    key={v.id}
                    id={`nav-view-${v.id}`}
                    onClick={() => setActiveView(v.id)}
                    className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-indigo-600 shadow-2xs border border-slate-200/70'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {v.icon}
                    <span className="hidden xl:inline">{v.label}</span>
                    <span className="inline xl:hidden">
                      {v.id === 'presenter' ? 'Presenter' : v.id === 'projector' ? 'Stage' : v.id === 'admin' ? 'Admin' : v.id === 'analytics' ? 'Report' : 'Audience'}
                    </span>
                    {v.badge && (
                      <span className="text-[9px] px-1 py-0.2 bg-indigo-50 text-indigo-600 rounded font-bold hidden 2xl:inline">
                        {v.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500 font-medium truncate">
              <span>Audience Mode</span>
              {currentEvent && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-slate-700 max-w-xs truncate">{currentEvent.title}</span>
                </>
              )}
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Live Participant Count */}
            {currentEvent && (
              <div className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 text-xs font-bold">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono-numbers">{currentEvent.participants.length}</span>
              </div>
            )}

            {/* Quick Crowd Simulator (Only for Host) */}
            {isHost && (
              <button
                id="simulate-crowd-header-btn"
                onClick={() => simulateAudienceVotes(10)}
                disabled={isSimulatingCrowd}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                title="Simulate 10 audience members answering live"
              >
                {isSimulatingCrowd ? (
                  <>
                    <ButtonSpinner size="w-3 h-3" color="text-amber-600" />
                    <span className="text-[10px]">VOTING</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                    <span>+10</span>
                  </>
                )}
              </button>
            )}

            {/* QR Code Modal Trigger */}
            {currentEvent && (
              <button
                id="header-qr-btn"
                onClick={() => setIsQRModalOpen(true)}
                className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="View Room QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}

            {/* Host Login / Logout button */}
            {isHost ? (
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Host</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveView('login')}
                className="flex items-center space-x-1 px-2.5 sm:px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Host Sign In"
              >
                <Shield className="w-3 h-3 text-indigo-400" />
                <span>Host</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile View Switcher (Only when host is logged in) */}
        {isHost && (
          <div className="lg:hidden flex items-center overflow-x-auto px-3 py-1.5 bg-slate-50 border-t border-slate-200 space-x-1 scrollbar-none">
            {adminViews.map((v) => {
              const isActive = activeView === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-2xs'
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
