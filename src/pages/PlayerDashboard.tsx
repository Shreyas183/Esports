

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, doc, setDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [organizerIds, setOrganizerIds] = useState<string[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState({ transactionId: '', amount: '', method: '' });
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get all organizerIds (for demo, fetch all organizers with tournaments)
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

  // Real-time payment status for selected tournament
  useEffect(() => {
    if (!user || !selectedTournament) return;
    const q = doc(db, 'payments', selectedTournament.organizerId, selectedTournament.id, user.uid);
    const unsub = onSnapshot(q, (snap) => {
      if (snap.exists()) {
        setPaymentStatus(snap.data().status);
      } else {
        setPaymentStatus(null);
      }
    });
    return () => unsub();
  }, [user, selectedTournament]);

  // Join tournament
  const handleJoinTournament = (tournament: any) => {
    setSelectedTournament(tournament);
    setError(null);
    setSuccess(null);
    setPaymentForm({ transactionId: '', amount: '', method: '' });
  };

  // Submit payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!user || !selectedTournament) return;
    try {
      await setDoc(doc(db, 'payments', selectedTournament.organizerId, selectedTournament.id, user.uid), {
        playerId: user.uid,
        transactionId: paymentForm.transactionId,
        amount: paymentForm.amount,
        method: paymentForm.method,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      setSuccess('Payment submitted!');
    } catch (err: any) {
      setError('Failed to submit payment: ' + err.message);
    }
  };

  if (loading) return <div>Loading tournaments...</div>;

  return (
    <div>
      <h1>Player Dashboard</h1>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}

      <h2>Active Tournaments</h2>
      <ul>
        {tournaments.map(t => (
          <li key={t.id}>
            {t.name} ({t.status})
            <button onClick={() => handleJoinTournament(t)}>Join</button>
          </li>
        ))}
      </ul>

      {selectedTournament && (
        <div style={{ marginTop: 32 }}>
          <h3>Join {selectedTournament.name}</h3>
          <form onSubmit={handlePaymentSubmit}>
            <input type="text" placeholder="Transaction ID" value={paymentForm.transactionId} onChange={e => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} required />
            <input type="number" placeholder="Amount" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
            <input type="text" placeholder="Payment Method" value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })} required />
            <button type="submit">Submit Payment</button>
          </form>
          <div style={{ marginTop: 16 }}>
            Payment Status: {paymentStatus || 'Not submitted'}
          </div>
        </div>
      )}
    </div>
  );
};

const MyRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'registrations'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRegistrations(list);
    });
    return () => unsub();
  }, [user?.uid]);

  return (
    <Card className="card-gradient border-border/20">
      <CardHeader>
        <CardTitle>My Registrations</CardTitle>
        <CardDescription>Your registration statuses</CardDescription>
      </CardHeader>
      <CardContent>
        {registrations.length === 0 ? (
          <div className="text-sm text-muted-foreground">No registrations yet.</div>
        ) : (
          <div className="space-y-4">
            {registrations.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 border border-border/20 rounded-lg">
                <div>
                  <div className="font-semibold">Tournament: {r.tournamentId}</div>
                  <div className="text-xs text-muted-foreground">UTR: {r.transactionId}</div>
                </div>
                <Badge variant={r.paymentStatus === 'approved' ? 'default' : r.paymentStatus === 'rejected' ? 'destructive' : 'secondary'}>
                  {r.paymentStatus}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyRegistrations;
