import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import OrganizerDashboard from './OrganizerDashboard';
import PlayerDashboard from './PlayerDashboard';
import ViewerDashboard from './ViewerDashboard';

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <div>Please log in.</div>;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'organizer':
      return <OrganizerDashboard />;
    case 'player':
      return <PlayerDashboard />;
    default:
      return <ViewerDashboard />;
  }
};

export default DashboardRouter;
