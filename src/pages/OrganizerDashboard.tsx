

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Users, 
  Gamepad2, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Plus,
  Clock
} from 'lucide-react';

interface Tournament {
  id: string;
  title: string;
  description: string;
  gameType: 'BGMI' | 'FREE_FIRE';
  organizerId: string;
  organizerName: string;
  status: 'draft' | 'registration' | 'live' | 'completed';
  maxTeams: number;
  entryFee: number;
  prizePool: number;
  schedule: {
    registrationStart: Date;
    registrationEnd: Date;
    tournamentStart: Date;
    tournamentEnd: Date;
  };
  createdAt: any;
  updatedAt: any;
}

interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  userDisplayName: string;
  teamId?: string;
  teamName?: string;
  paymentStatus: 'pending' | 'approved' | 'rejected';
  paymentProof: string;
  paymentMethod: string;
  amount: number;
  transactionId: string;
  createdAt: any;
  updatedAt: any;
}

const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('tournaments');
  const [editing, setEditing] = useState<Record<string, any>>({});
  
  // Tournament creation form
  const [tournamentForm, setTournamentForm] = useState({
    title: '',
    description: '',
    gameType: 'BGMI' as 'BGMI' | 'FREE_FIRE',
    maxTeams: 32,
    entryFee: 100,
    prizePool: 5000,
    registrationStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    registrationEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    tournamentStart: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    tournamentEnd: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  // Real-time tournaments - show ALL tournaments for ALL organizers
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    console.log('🔍 Fetching ALL tournaments for organizers');
    
    const q = query(
      collection(db, 'tournaments'),
      // Remove the where clause to show all tournaments
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tournamentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tournament[];
      
      console.log('✅ All tournaments loaded:', tournamentData.length);
      setTournaments(tournamentData);
      setLoading(false);
    }, (error) => {
      console.error('❌ Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournaments: " + error.message,
        variant: "destructive"
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time registrations for tournaments created by current organizer
  useEffect(() => {
    if (!user || tournaments.length === 0) return;
    
    console.log('🔍 Fetching registrations for current organizer tournaments');
    
    // Only show registrations for tournaments created by current organizer
    const currentOrganizerTournamentIds = tournaments
      .filter(t => t.organizerId === user.uid)
      .map(t => t.id);
    
    if (currentOrganizerTournamentIds.length === 0) {
      setRegistrations([]);
      return;
    }
    
    const q = query(
      collection(db, 'registrations'),
      where('tournamentId', 'in', currentOrganizerTournamentIds)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const registrationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];
      
      console.log('✅ All registrations loaded:', registrationData.length);
      setRegistrations(registrationData);
    }, (error) => {
      console.error('❌ Error fetching registrations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registrations: " + error.message,
        variant: "destructive"
      });
    });

    return () => unsubscribe();
  }, [user, tournaments]);

  const formatDateTimeLocal = (value?: any) => {
    if (!value) return '';
    const d = value?.toDate ? value.toDate() : value instanceof Date ? value : new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const updateLocalTournament = (id: string, partial: any) => {
    setTournaments(prev => prev.map(t => t.id === id ? ({ ...t, ...partial }) as any : t));
    setEditing(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...partial } }));
  };

  const saveLiveSettings = async (id: string) => {
    const changes = editing[id];
    if (!changes) return;
    try {
      await updateDoc(doc(db, 'tournaments', id), {
        ...(changes.streamURL !== undefined ? { streamURL: changes.streamURL } : {}),
        ...(changes.room ? { room: {
          id: changes.room.id || '',
          password: changes.room.password || '',
          visibleFrom: changes.room.visibleFrom ? changes.room.visibleFrom : (new Date()),
        }} : {}),
        updatedAt: serverTimestamp()
      });
      toast({ title: 'Saved', description: 'Live settings updated' });
      setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  // Create tournament
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a tournament",
        variant: "destructive"
      });
      return;
    }
    
    // Basic validation
    if (!tournamentForm.title.trim()) {
      toast({
        title: "Error",
        description: "Tournament title is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!tournamentForm.description.trim()) {
      toast({
        title: "Error",
        description: "Tournament description is required",
        variant: "destructive"
      });
      return;
    }
    
    setCreating(true);
    console.log('🚀 Creating tournament:', tournamentForm);
    console.log('👤 Current user:', user.uid, user.displayName);
    
    try {
      const tournamentData = {
        title: tournamentForm.title,
        description: tournamentForm.description,
        gameType: tournamentForm.gameType,
        organizerId: user.uid,
        organizerName: user.displayName || 'Unknown Organizer',
        status: 'draft' as const,
        maxTeams: tournamentForm.maxTeams,
        entryFee: tournamentForm.entryFee,
        prizePool: tournamentForm.prizePool,
        schedule: {
          registrationStart: new Date(tournamentForm.registrationStart),
          registrationEnd: new Date(tournamentForm.registrationEnd),
          tournamentStart: new Date(tournamentForm.tournamentStart),
          tournamentEnd: new Date(tournamentForm.tournamentEnd)
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('📝 Tournament data to save:', tournamentData);
      const docRef = await addDoc(collection(db, 'tournaments'), tournamentData);
      console.log('✅ Tournament created with ID:', docRef.id);
      
      // Reset form
      setTournamentForm({
        title: '',
        description: '',
        gameType: 'BGMI',
        maxTeams: 32,
        entryFee: 100,
        prizePool: 5000,
        registrationStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        registrationEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        tournamentStart: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        tournamentEnd: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
      
      // Switch to tournaments tab to show the new tournament
      setActiveTab('tournaments');
      
      toast({
        title: "Success",
        description: "Tournament created successfully!",
      });
      
    } catch (error: any) {
      console.error('❌ Error creating tournament:', error);
      toast({
        title: "Error",
        description: "Failed to create tournament: " + error.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  // Verify payment
  const handleVerifyPayment = async (registrationId: string, approved: boolean) => {
    if (!user) return;
    
    try {
      console.log('🔍 Verifying payment:', registrationId, approved);
      
      await updateDoc(doc(db, 'registrations', registrationId), {
        paymentStatus: approved ? 'approved' : 'rejected',
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: `Payment ${approved ? 'approved' : 'rejected'} successfully!`,
      });
      
    } catch (error: any) {
      console.error('❌ Error verifying payment:', error);
      toast({
        title: "Error",
        description: "Failed to verify payment: " + error.message,
        variant: "destructive"
      });
    }
  };

  // Update tournament status
  const handleUpdateStatus = async (tournamentId: string, newStatus: Tournament['status']) => {
    if (!user) return;
    
    try {
      console.log('🔄 Updating tournament status:', tournamentId, newStatus);
      
      await updateDoc(doc(db, 'tournaments', tournamentId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: "Tournament status updated successfully!",
      });
      
    } catch (error: any) {
      console.error('❌ Error updating tournament status:', error);
      toast({
        title: "Error",
        description: "Failed to update tournament status: " + error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading organizer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            🚀 NEW Organizer Dashboard 🚀
          </h1>
          <p className="text-muted-foreground">🚀 BRAND NEW DASHBOARD - Manage your tournaments and verify payments 🚀</p>
        </div>
        <Button 
          onClick={() => setActiveTab('CreateTournament.tsx')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Tournament
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tournaments">Tournaments ({tournaments.length})</TabsTrigger>
          <TabsTrigger value="CreateTournament.tsx">Create Tournament</TabsTrigger>
          <TabsTrigger value="registrations">Registrations ({registrations.length})</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="CreateTournament.tsx" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Tournament
              </CardTitle>
              <CardDescription>
                Fill out the details below to create a new tournament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTournament} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Tournament Title</Label>
                    <Input
                      id="title"
                      value={tournamentForm.title}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, title: e.target.value })}
                      placeholder="Enter tournament title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gameType">Game Type</Label>
                    <Select
                      value={tournamentForm.gameType}
                      onValueChange={(value: 'BGMI' | 'FREE_FIRE') => 
                        setTournamentForm({ ...tournamentForm, gameType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BGMI">BGMI</SelectItem>
                        <SelectItem value="FREE_FIRE">Free Fire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={tournamentForm.description}
                    onChange={(e) => setTournamentForm({ ...tournamentForm, description: e.target.value })}
                    placeholder="Enter tournament description"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxTeams">Max Teams</Label>
                    <Input
                      id="maxTeams"
                      type="number"
                      value={tournamentForm.maxTeams}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, maxTeams: parseInt(e.target.value) })}
                      min="2"
                      max="128"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                    <Input
                      id="entryFee"
                      type="number"
                      value={tournamentForm.entryFee}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, entryFee: parseInt(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prizePool">Prize Pool (₹)</Label>
                    <Input
                      id="prizePool"
                      type="number"
                      value={tournamentForm.prizePool}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, prizePool: parseInt(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registrationStart">Registration Start</Label>
                    <Input
                      id="registrationStart"
                      type="datetime-local"
                      value={tournamentForm.registrationStart}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, registrationStart: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationEnd">Registration End</Label>
                    <Input
                      id="registrationEnd"
                      type="datetime-local"
                      value={tournamentForm.registrationEnd}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, registrationEnd: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tournamentStart">Tournament Start</Label>
                    <Input
                      id="tournamentStart"
                      type="datetime-local"
                      value={tournamentForm.tournamentStart}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, tournamentStart: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tournamentEnd">Tournament End</Label>
                    <Input
                      id="tournamentEnd"
                      type="datetime-local"
                      value={tournamentForm.tournamentEnd}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, tournamentEnd: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="submit" disabled={creating} className="w-full">
                    {creating ? 'Creating...' : 'Create Tournament'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-6">
          {tournaments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tournaments yet</h3>
                <p className="text-muted-foreground mb-4">Create your first tournament to get started</p>
                <Button onClick={() => setActiveTab('create')}>
                  Create Tournament
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((tournament) => (
                <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{tournament.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={tournament.status === 'live' ? 'default' : 'secondary'}>
                            {tournament.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tournament.organizerId === user?.uid ? 'Your Tournament' : 'Other Organizer'}
                          </Badge>
                        </div>
                      </div>
                      <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{tournament.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Game:</span>
                        <br />
                        <Badge variant="outline">{tournament.gameType}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Max Teams:</span>
                        <br />
                        <span>{tournament.maxTeams}</span>
                      </div>
                      <div>
                        <span className="font-medium">Entry Fee:</span>
                        <br />
                        <span className="text-green-600">₹{tournament.entryFee}</span>
                      </div>
                      <div>
                        <span className="font-medium">Prize Pool:</span>
                        <br />
                        <span className="text-primary">₹{tournament.prizePool}</span>
                      </div>
                    </div>

                    {(() => {
                      const approvedReg = registrations.filter(r => r.tournamentId === tournament.id && r.paymentStatus === 'approved').length;
                      const pendingReg = registrations.filter(r => r.tournamentId === tournament.id && r.paymentStatus === 'pending').length;
                      const remaining = Math.max((tournament.maxTeams || 0) - approvedReg, 0);
                      return (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Approved</span>
                            <br />
                            <span className="text-primary font-semibold">{approvedReg}/{tournament.maxTeams || 0}</span>
                          </div>
                          <div>
                            <span className="font-medium">Pending</span>
                            <br />
                            <span className="text-warning font-semibold">{pendingReg}</span>
                          </div>
                          <div>
                            <span className="font-medium">Remaining</span>
                            <br />
                            <span className="font-semibold">{remaining}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Organizer:</span> {tournament.organizerName || 'Unknown'}
                    </div>

                    {/* Only show status update for tournaments created by current user */}
                    {tournament.organizerId === user?.uid && (
                      <div className="flex gap-2">
                        <Select 
                          value={tournament.status} 
                          onValueChange={(value: Tournament['status']) => 
                            handleUpdateStatus(tournament.id, value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="registration">Registration Open</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {tournament.organizerId === user?.uid && (
                      <div className="space-y-3 border-t pt-4">
                        <div className="text-sm font-medium">Live Settings</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`roomId-${tournament.id}`}>Room ID</Label>
                            <Input id={`roomId-${tournament.id}`}
                              value={(tournament as any).room?.id || ''}
                              onChange={(e) => updateLocalTournament(tournament.id, { room: { ...((tournament as any).room || {}), id: e.target.value } })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`roomPwd-${tournament.id}`}>Password</Label>
                            <Input id={`roomPwd-${tournament.id}`}
                              value={(tournament as any).room?.password || ''}
                              onChange={(e) => updateLocalTournament(tournament.id, { room: { ...((tournament as any).room || {}), password: e.target.value } })}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor={`visibleFrom-${tournament.id}`}>Visible From</Label>
                            <Input id={`visibleFrom-${tournament.id}`} type="datetime-local"
                              value={formatDateTimeLocal((tournament as any).room?.visibleFrom)}
                              onChange={(e) => updateLocalTournament(tournament.id, { room: { ...((tournament as any).room || {}), visibleFrom: new Date(e.target.value) } })}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor={`stream-${tournament.id}`}>Stream URL</Label>
                            <Input id={`stream-${tournament.id}`}
                              value={(tournament as any).streamURL || ''}
                              onChange={(e) => updateLocalTournament(tournament.id, { streamURL: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => saveLiveSettings(tournament.id)}>
                            Save Live Settings
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="registrations" className="space-y-6">
          {registrations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No registrations yet</h3>
                <p className="text-muted-foreground">Player registrations will appear here once they join tournaments you created</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {registrations.map((registration) => {
                const tournament = tournaments.find(t => t.id === registration.tournamentId);
                return (
                  <Card key={registration.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold">{registration.userDisplayName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Tournament: {tournament?.title || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Organizer: {tournament?.organizerName || 'Unknown'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              registration.paymentStatus === 'approved' ? 'default' : 
                              registration.paymentStatus === 'rejected' ? 'destructive' : 'secondary'
                            }
                          >
                            {registration.paymentStatus}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {registration.paymentStatus === 'pending' ? 'Awaiting Verification' : 
                             registration.paymentStatus === 'approved' ? 'Payment Verified' : 'Payment Rejected'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium">Amount:</span>
                          <br />
                          <span className="text-green-600">₹{registration.amount}</span>
                        </div>
                        <div>
                          <span className="font-medium">Method:</span>
                          <br />
                          <span>{registration.paymentMethod}</span>
                        </div>
                        <div>
                          <span className="font-medium">Transaction ID:</span>
                          <br />
                          <span className="font-mono text-xs">{registration.transactionId}</span>
                        </div>
                        <div>
                          <span className="font-medium">Date:</span>
                          <br />
                          <span>{registration.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                        </div>
                      </div>

                      {registration.paymentStatus === 'pending' && (
                        <div className="border-t pt-4">
                          <div className="text-sm font-medium mb-2">Payment Verification Required</div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVerifyPayment(registration.id, true)}
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve Payment
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleVerifyPayment(registration.id, false)}
                              className="flex items-center gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject Payment
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {registration.paymentStatus === 'approved' && (
                        <div className="border-t pt-4">
                          <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Payment Verified Successfully
                          </div>
                        </div>
                      )}
                      
                      {registration.paymentStatus === 'rejected' && (
                        <div className="border-t pt-4">
                          <div className="text-sm text-red-600 font-medium flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Payment Rejected
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tournaments.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {registrations.filter(r => r.paymentStatus === 'pending').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{registrations.length}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Tournament form is now in a dedicated tab */}
    </div>
  );
};

export default OrganizerDashboard;
