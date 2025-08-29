

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';

const ViewerDashboard: React.FC = () => {
  const [organizerIds, setOrganizerIds] = useState<string[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get all organizerIds
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'tournaments'), (snap) => {
      const ids = snap.docs.map(doc => doc.id);
      setOrganizerIds(ids);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Get all tournaments for all organizers
  useEffect(() => {
    if (organizerIds.length === 0) return;
    setLoading(true);
    let allTournaments: any[] = [];
    let unsubList: any[] = [];
    organizerIds.forEach(orgId => {
      const q = collection(db, 'tournaments', orgId, 'list');
      const unsub = onSnapshot(q, (snap) => {
        allTournaments = [
          ...allTournaments.filter(t => t.createdBy !== orgId),
          ...snap.docs.map(doc => ({ ...doc.data(), organizerId: orgId }))
        ];
        setTournaments([...allTournaments]);
        setLoading(false);
      });
      unsubList.push(unsub);
    });
    return () => unsubList.forEach(u => u());
  }, [organizerIds]);

  if (loading) return <div>Loading tournaments...</div>;
  if (error) return <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>;

  const upcoming = tournaments.filter(t => t.status === 'upcoming');
  const ongoing = tournaments.filter(t => t.status === 'live');

  return (
    <div>
      <h1>Viewer Dashboard</h1>
      <h2>Upcoming Tournaments</h2>
      <ul>
        {upcoming.map(t => (
          <li key={t.id}>{t.name} ({t.game})</li>
        ))}
      </ul>
      <h2>Ongoing Tournaments</h2>
      <ul>
        {ongoing.map(t => (
          <li key={t.id}>
            {t.name} ({t.game})
            <button onClick={() => window.open(t.streamURL || '#', '_blank')}>Watch Live</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewerDashboard;
