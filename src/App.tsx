/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EventProvider, useEvent } from './context/EventContext';
import { RoleHeader } from './components/Navigation/RoleHeader';
import { ParticipantView } from './components/Participant/ParticipantView';
import { ProjectorDisplay } from './components/Projector/ProjectorDisplay';
import { PresenterControl } from './components/Presenter/PresenterControl';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { EventSummaryExport } from './components/Analytics/EventSummaryExport';
import { LoginScreen } from './components/Auth/LoginScreen';
import { FloatingReactions } from './components/Shared/FloatingReactions';
import { GlobalAppSkeleton } from './components/Shared/Loaders';

const AppContent: React.FC = () => {
  const { activeView, isLoading, isAuthLoading, isHost } = useEvent();

  if (isLoading || isAuthLoading) {
    return <GlobalAppSkeleton />;
  }

  // Auth Guard: If not host and activeView is a host-only view, fallback to participant view
  const isHostOnlyView = ['presenter', 'admin', 'analytics'].includes(activeView);
  const effectiveView = (!isHost && isHostOnlyView) ? 'participant' : activeView;

  return (
    <div className="min-h-screen-dvh bg-[#FFF8F0] text-[#1E1E1E] flex flex-col font-sans selection:bg-[#C1FF33] selection:text-black antialiased overflow-x-hidden">
      
      {/* Top Universal Role Switcher & Status Navigation Header (hidden on Login & Projector Stage) */}
      {effectiveView !== 'projector' && effectiveView !== 'login' && <RoleHeader />}

      {/* Main Content Area */}
      <main className="flex-1 w-full relative flex flex-col min-h-0">
        {effectiveView === 'login' && <LoginScreen />}
        {effectiveView === 'participant' && <ParticipantView />}
        {effectiveView === 'projector' && <ProjectorDisplay />}
        {effectiveView === 'presenter' && <PresenterControl />}
        {effectiveView === 'admin' && <AdminDashboard />}
        {effectiveView === 'analytics' && <EventSummaryExport />}
      </main>

      {/* Floating Audience Cheer Reactions Overlay */}
      {effectiveView !== 'login' && <FloatingReactions />}

    </div>
  );
};

export default function App() {
  return (
    <EventProvider>
      <AppContent />
    </EventProvider>
  );
}
