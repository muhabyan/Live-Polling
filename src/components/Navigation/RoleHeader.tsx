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
    { id: 'admin', label: 'Admin', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="neo-badge bg-[#34D399] text-[#1E1E1E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E1E1E] animate-ping" />
            LIVE
          </span>
        );
      case 'waiting':
        return (
          <span className="neo-badge bg-[#FACC15] text-[#1E1E1E]">
            LOBBY
          </span>
        );
      case 'ended':
        return (
          <span className="neo-badge bg-gray-200 text-[#1E1E1E]">
            ENDED
          </span>
        );
      default:
        return (
          <span className="neo-badge bg-gray-100 text-gray-600">
            DRAFT
          </span>
        );
    }
  };

  return (
    <>
      <header id="main-role-header" className="sticky top-0 z-30 bg-[#FFF8F0] border-b-2 border-[#1E1E1E] shrink-0">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-13 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-2">
          
          {/* Left: Brand Logo & Event Selector */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 min-w-0 shrink">
            <div 
              onClick={() => setActiveView(isHost ? 'admin' : 'participant')}
              className="cursor-pointer select-none group shrink-0"
              title="PulseLive"
            >
              <div className="sm:hidden">
                <BrandLogo size="sm" showText={false} />
              </div>
              <div className="hidden sm:block">
                <BrandLogo size="sm" showText={true} />
              </div>
            </div>

            {/* Event Switcher */}
            {isHost && (
              <div className="relative min-w-0 shrink">
                <button
                  id="event-selector-btn"
                  onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                  className="neo-btn bg-white px-2 py-1 text-xs max-w-[110px] xs:max-w-[140px] md:max-w-[180px] xl:max-w-[210px] truncate"
                >
                  <span className="truncate font-bold text-[#1E1E1E] text-[11px] sm:text-xs">
                    {currentEvent?.title || 'Select Event'}
                  </span>
                  {currentEvent && (
                    <span className="shrink-0 scale-90 sm:scale-100">{getStatusBadge(currentEvent.status)}</span>
                  )}
                  <ChevronDown className="w-3 h-3 text-[#1E1E1E] shrink-0" />
                </button>

                {isEventDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 neo-card py-1.5 z-50">
                    <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                      Switch Event Session
                    </div>
                    {events.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => {
                          setCurrentEventId(evt.id);
                          setIsEventDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FACC15]/30 transition-colors cursor-pointer ${
                          currentEvent?.id === evt.id ? 'bg-[#FACC15]/20 font-bold text-[#1E1E1E]' : 'text-gray-700'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="font-bold truncate">{evt.title}</div>
                          <div className="text-[10px] text-gray-500 font-mono">PIN: {evt.roomCode}</div>
                        </div>
                        {getStatusBadge(evt.status)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center Navigation */}
          {isHost ? (
            <div className="hidden md:flex items-center gap-1 shrink-0 mx-1">
              {adminViews.map((v) => {
                const isActive = activeView === v.id;
                return (
                  <button
                    key={v.id}
                    id={`nav-view-${v.id}`}
                    onClick={() => setActiveView(v.id)}
                    className={`neo-btn text-xs px-2.5 py-1 ${
                      isActive
                        ? 'bg-[#4F46E5] text-white shadow-none translate-x-[2px] translate-y-[2px]'
                        : 'bg-white text-[#1E1E1E]'
                    }`}
                  >
                    {v.icon}
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2 text-xs text-gray-600 font-bold truncate">
              <span>Audience Mode</span>
              {currentEvent && (
                <>
                  <span>•</span>
                  <span className="font-bold text-[#1E1E1E] max-w-xs truncate">{currentEvent.title}</span>
                </>
              )}
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Live Participant Count */}
            {currentEvent && (
              <div className="neo-badge bg-white text-[#1E1E1E] text-[11px] sm:text-xs">
                <Users className="w-3.5 h-3.5" />
                <span className="font-mono">{currentEvent.participants.length}</span>
              </div>
            )}

            {/* Quick Crowd Simulator */}
            {isHost && (
              <button
                id="simulate-crowd-header-btn"
                onClick={() => simulateAudienceVotes(10)}
                disabled={isSimulatingCrowd}
                className="hidden sm:flex neo-btn bg-[#FACC15] text-[#1E1E1E] px-2.5 py-1 text-xs"
                title="Simulate 10 audience members answering live"
              >
                {isSimulatingCrowd ? (
                  <>
                    <ButtonSpinner size="w-3 h-3" color="text-[#1E1E1E]" />
                    <span className="text-[10px] font-mono">VOTING</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    <span>+10</span>
                  </>
                )}
              </button>
            )}

            {/* QR Code Trigger */}
            {currentEvent && (
              <button
                id="header-qr-btn"
                onClick={() => setIsQRModalOpen(true)}
                className="neo-btn bg-white p-1.5 sm:p-2"
                title="View Room QR Code"
              >
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {/* Host Login / Logout */}
            {isHost ? (
              <button
                onClick={logout}
                className="neo-btn bg-[#FB7185] text-[#1E1E1E] px-2 sm:px-2.5 py-1 text-xs"
                title="Exit Host Session"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs">Exit</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveView('login')}
                className="neo-btn bg-[#1E1E1E] text-white px-2 sm:px-3 py-1 text-xs"
                title="Host Sign In"
              >
                <Shield className="w-3 h-3" />
                <span>Host</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile View Switcher */}
        {isHost && (
          <div className="lg:hidden flex items-center overflow-x-auto px-2.5 py-1.5 bg-[#FFF8F0] border-t-2 border-[#1E1E1E] space-x-1.5 scrollbar-none">
            {adminViews.map((v) => {
              const isActive = activeView === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={`neo-btn text-[11px] px-2.5 py-1 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-none translate-x-[2px] translate-y-[2px]'
                      : 'bg-white text-[#1E1E1E]'
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
          status={currentEvent.status}
        />
      )}
    </>
  );
};
