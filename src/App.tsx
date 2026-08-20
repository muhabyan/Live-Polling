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
  const { activeView, isLoading, isAuthLoading } = useEvent();

  if (isLoading || isAuthLoading) {
    return <GlobalAppSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Universal Role Switcher & Status Navigation Header */}
      {activeView !== 'projector' && <RoleHeader />}

      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        {activeView === 'login' && <LoginScreen />}
        {activeView === 'participant' && <ParticipantView />}
        {activeView === 'projector' && <ProjectorDisplay />}
        {activeView === 'presenter' && <PresenterControl />}
        {activeView === 'admin' && <AdminDashboard />}
        {activeView === 'analytics' && <EventSummaryExport />}
      </main>

      {/* Floating Audience Cheer Reactions Overlay */}
      {activeView !== 'login' && <FloatingReactions />}

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
