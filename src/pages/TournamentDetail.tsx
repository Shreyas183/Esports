import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, 
  Users, 
  Calendar, 
  DollarSign, 
  // Upload, 
  ArrowLeft,
  // Clock,
  MapPin,
  Play,
  Copy
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
// import { GameType, TournamentStatus } from "@/types";
import { db } from "@/services/firebase";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";

const TournamentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinFormData, setJoinFormData] = useState({
    teamId: '',
    teamName: '',
    playerGameId: '',
    paymentProof: null as File | null,
    utr: ''
  });
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [isApprovedForUser, setIsApprovedForUser] = useState(false);
  const [showStream, setShowStream] = useState(false);
  const [tournament, setTournament] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(db, 'tournaments', id);
    const unsub = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) {
        setTournament(null);
      } else {
        const data = snap.data();
        setTournament({ id: snap.id, ...data });
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [id]);

  // Detect if current player already registered for this tournament
  useEffect(() => {
    if (!user?.uid || !tournament?.id) { setAlreadyRegistered(false); return; }
    const q = collection(db, 'registrations');
    const unsub = onSnapshot(q, (snap) => {
      const has = snap.docs.some(d => {
        const r = d.data() as any;
        return r.tournamentId === tournament.id && r.userId === user.uid;
      });
      setAlreadyRegistered(has);
      const approved = snap.docs.some(d => {
        const r = d.data() as any;
        return r.tournamentId === tournament.id && r.userId === user.uid && r.paymentStatus === 'approved';
      });
      setIsApprovedForUser(approved);
    });
    return () => unsub();
  }, [user?.uid, tournament?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live': return <Badge className="status-live">Live</Badge>;
      case 'registration': return <Badge className="status-upcoming">Registration Open</Badge>;
      case 'completed': return <Badge className="status-completed">Completed</Badge>;
      default: return <Badge className="status-draft">Draft</Badge>;
    }
  };

  const handleJoinTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "Please sign in to register", variant: "destructive" });
      return;
    }
    if (!tournament) {
      toast({ title: "Error", description: "Tournament not found", variant: "destructive" });
      return;
    }
    if (!joinFormData.playerGameId || !joinFormData.utr) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    try {
      if (alreadyRegistered) {
        toast({ title: "Already registered", description: "You have already registered for this tournament.", variant: "destructive" });
        return;
      }
      // Create registration with pending payment
      await addDoc(collection(db, 'registrations'), {
        tournamentId: tournament.id,
        userId: user.uid,
        userDisplayName: user.displayName,
        teamId: joinFormData.teamId || null,
        teamName: joinFormData.teamName || null,
        paymentStatus: 'pending',
        paymentProof: '',
        paymentMethod: 'upi',
        amount: tournament.entryFee || 0,
        transactionId: joinFormData.utr,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Skipping proof upload to avoid CORS issues; organizer verifies via UTR

      toast({ title: "Success", description: "Registration submitted. Await organizer verification." });
      setShowJoinForm(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    }
  };

  // File uploads disabled due to CORS issues

  const copyRoomDetails = () => {
    if (!tournament?.room) return;
    navigator.clipboard.writeText(`Room ID: ${tournament.room.id}\nPassword: ${tournament.room.password}`);
    toast({
      title: "Copied!",
      description: "Room details copied to clipboard"
    });
  };

  const isRoomVisible = tournament?.room?.visibleFrom ? new Date() >= new Date(tournament.room.visibleFrom.seconds ? tournament.room.visibleFrom.toDate?.() || tournament.room.visibleFrom : tournament.room.visibleFrom) : false;
  const registrationClosed = (() => {
    const end = tournament?.schedule?.registrationEnd;
    const endDate = end?.seconds ? end.toDate() : end ? new Date(end) : null;
    return !!endDate && new Date() > endDate;
  })();

  const toEmbedUrl = (url?: string) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      // YouTube watch
      if (u.hostname.includes('youtube.com') && u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      // youtu.be short
      if (u.hostname.includes('youtu.be')) {
        const id = u.pathname.replace('/', '');
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      // shorts
      if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      return url;
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"><span>Loading...</span></div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center"><span>Not found</span></div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-card/10 backdrop-blur-sm border-b border-border/20">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="border-border/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              EsportsPro
            </span>
          </div>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome, {user.displayName}</span>
            <Badge variant="outline">{user.role}</Badge>
          </div>
        )}
      </nav>

      {/* Tournament Header */}
      <div className="relative">
        <div className="h-64 bg-gradient-secondary" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute bottom-6 left-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{tournament.gameType}</Badge>
            {getStatusBadge(tournament.status)}
          </div>
          <h1 className="text-4xl font-bold mb-2">{tournament.title}</h1>
          <p className="text-xl opacity-90">by {tournament.organizerName}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="brackets">Brackets</TabsTrigger>
                <TabsTrigger value="participants">Teams</TabsTrigger>
                <TabsTrigger value="stream">Stream</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <Card className="card-gradient border-border/20">
                  <CardHeader>
                    <CardTitle>About Tournament</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{tournament.description}</p>
                  </CardContent>
                </Card>

                {tournament.status === 'live' && tournament.streamURL && (
                  <Card className="card-gradient border-border/20">
                    <CardHeader>
                      <CardTitle>Live Stream</CardTitle>
                      <CardDescription>Choose to watch or view stats</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!showStream ? (
                        <div className="flex gap-3">
                          <Button onClick={() => setShowStream(true)}>Watch Live</Button>
                          <Button variant="outline" onClick={() => setShowStream(false)}>View Stats</Button>
                        </div>
                      ) : (
                        <div className="aspect-video">
                          <iframe
                            src={toEmbedUrl(tournament.streamURL)}
                            title="Live Stream"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                <Card className="card-gradient border-border/20">
                  <CardHeader>
                    <CardTitle>Tournament Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(tournament.rules || []).map((rule: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span className="text-muted-foreground">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {isRoomVisible && isApprovedForUser && (
                  <Card className="card-gradient border-border/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Room Details
                      </CardTitle>
                      <CardDescription>Tournament room credentials</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                          <div>
                            <p className="font-medium">Room ID: {tournament.room.id}</p>
                            <p className="text-muted-foreground">Password: {tournament.room.password}</p>
                          </div>
                          <Button size="sm" onClick={copyRoomDetails}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                        <p className="text-sm text-warning">⚠️ Do not share room credentials with unauthorized persons</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {isRoomVisible && !isApprovedForUser && user?.role === 'player' && (
                  <Card className="card-gradient border-border/20">
                    <CardHeader>
                      <CardTitle>Room Details</CardTitle>
                      <CardDescription>Available after your registration is approved</CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="brackets">
                <Card className="card-gradient border-border/20">
                  <CardHeader>
                    <CardTitle>Tournament Brackets</CardTitle>
                    <CardDescription>Competition bracket will be available after registration closes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Brackets will be generated after registration period ends</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="participants">
                <Card className="card-gradient border-border/20">
                  <CardHeader>
                    <CardTitle>Registered Teams</CardTitle>
                    <CardDescription>{tournament.currentTeams} of {tournament.maxTeams} teams registered</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.from({ length: Math.min(10, tournament.currentTeams) }, (_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border border-border/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">Team Alpha {i + 1}</span>
                          </div>
                          <Badge variant="outline">Verified</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="stream">
                <Card className="card-gradient border-border/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5 text-destructive" />
                      Live Stream
                    </CardTitle>
                    <CardDescription>Watch the tournament live</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Stream will be available during tournament</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tournament Info */}
            <Card className="card-gradient border-border/20">
              <CardHeader>
                <CardTitle>Tournament Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Prize Pool</p>
                    <p className="text-2xl font-bold text-primary">₹{(tournament.prizePool || 0).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Teams</p>
                    <p className="text-lg">{tournament.currentTeams || 0}/{tournament.maxTeams || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Entry Fee</p>
                    <p className="text-lg">₹{tournament.entryFee || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Tournament Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tournament.schedule?.tournamentStart?.seconds ? tournament.schedule.tournamentStart.toDate() : tournament.schedule?.tournamentStart || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prize Distribution */}
            <Card className="card-gradient border-border/20">
              <CardHeader>
                <CardTitle>Prize Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(tournament.prizeDistribution || []).map((prize: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">#{prize.position}</span>
                      <span className="text-primary font-bold">₹{(prize.amount || Math.floor((tournament.prizePool || 0) * (prize.percentage || 0) / 100)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Join Tournament */}
            {user && user.role === 'player' && tournament.status === 'registration' && !registrationClosed && (
              <Card className="card-gradient border-border/20">
                <CardHeader>
                  <CardTitle>Join Tournament</CardTitle>
                  <CardDescription>Register for this tournament</CardDescription>
                </CardHeader>
                <CardContent>
                  {!showJoinForm ? (
                    <Button 
                      className="w-full bg-gradient-primary hover:opacity-90"
                      onClick={() => setShowJoinForm(true)}
                    >
                      Register Now
                    </Button>
                  ) : (
                    <form onSubmit={handleJoinTournament} className="space-y-4">
                      <div>
                        <Label htmlFor="gameId">Game ID</Label>
                        <Input
                          id="gameId"
                          placeholder="Enter your BGMI ID"
                          value={joinFormData.playerGameId}
                          onChange={(e) => setJoinFormData(prev => ({ ...prev, playerGameId: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="teamName">Team Name (Optional)</Label>
                        <Input
                          id="teamName"
                          placeholder="Enter team name"
                          value={joinFormData.teamName}
                          onChange={(e) => setJoinFormData(prev => ({ ...prev, teamName: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Payment Details</Label>
                        <div className="w-full p-4 bg-muted/20 rounded-lg mb-4 text-sm text-muted-foreground">
                          UPI ID: {tournament.paymentInfo?.upiId || '—'}
                          <br />
                          Amount: ₹{tournament.entryFee || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Note: Uploads are disabled temporarily; organizer will verify using your UTR.</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="utr">UTR Number</Label>
                        <Input
                          id="utr"
                          placeholder="Enter 12-digit UTR number"
                          value={joinFormData.utr}
                          onChange={(e) => setJoinFormData(prev => ({ ...prev, utr: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowJoinForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1 bg-gradient-primary hover:opacity-90">
                          Submit Registration
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
            {registrationClosed && (
              <Card className="card-gradient border-border/20">
                <CardHeader>
                  <CardTitle>Registration Closed</CardTitle>
                  <CardDescription>Registration period has ended</CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Sponsors */}
            {tournament.sponsors.length > 0 && (
              <Card className="card-gradient border-border/20">
                <CardHeader>
                  <CardTitle>Sponsors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(tournament.sponsors || []).map((sponsor: any, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-muted/20 rounded flex items-center justify-center">
                          <span className="text-xs">{sponsor.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetail;