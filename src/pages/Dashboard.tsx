import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/services/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Plus, Settings, Bell, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [myTournaments, setMyTournaments] = useState<any[]>([]);
  const [allTournaments, setAllTournaments] = useState<any[]>([]);
  const [joinedCount, setJoinedCount] = useState(0);

  useEffect(() => {
    if (!user?.uid || user.role !== 'organizer') return;
    const q = query(
      collection(db, 'tournaments'),
      where('organizerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMyTournaments(list);
    });
    return () => unsub();
  }, [user?.uid, user?.role]);

  useEffect(() => {
    // Load all tournaments for non-organizer views (player/viewer)
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllTournaments(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.uid || user.role !== 'player') { setJoinedCount(0); return; }
    const q = query(collection(db, 'registrations'), where('userId', '==', user.uid), where('paymentStatus', '==', 'approved'));
    const unsub = onSnapshot(q, (snap) => setJoinedCount(snap.size));
    return () => unsub();
  }, [user?.uid, user?.role]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'organizer': return 'secondary';
      case 'player': return 'default';
      default: return 'outline';
    }
  };

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="card-gradient border-border/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">+20% from last month</p>
                </CardContent>
              </Card>
              
              <Card className="card-gradient border-border/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">+5 this week</p>
                </CardContent>
              </Card>
              
              <Card className="card-gradient border-border/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹45,231</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>
              
              <Card className="card-gradient border-border/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7</div>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-gradient border-border/20">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Administrative functions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Trophy className="mr-2 h-4 w-4" />
                    Review Tournaments
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    System Settings
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="card-gradient border-border/20">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest platform activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>• Tournament "BGMI Championship" was created</p>
                    <p>• 15 new registrations approved</p>
                    <p>• Payment verification completed for Team Alpha</p>
                    <p>• User role updated: organizer approved</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
        
      case 'organizer':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Organizer Dashboard</h2>
              <Link to="/tournament/create">
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tournament
                </Button>
              </Link>
            </div>

            <Card className="card-gradient border-border/20">
              <CardHeader>
                <CardTitle>My Tournaments</CardTitle>
                <CardDescription>Events you created</CardDescription>
              </CardHeader>
              <CardContent>
                {myTournaments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No tournaments yet. Create your first one.</div>
                ) : (
                  <div className="space-y-4">
                    {myTournaments.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-4 border border-border/20 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{t.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {t.gameType} • ₹{t.prizePool || 0} prize pool
                          </p>
                        </div>
                        <Badge className={t.status === 'live' ? 'status-live' : t.status === 'registration' ? 'status-upcoming' : 'status-draft'}>
                          {t.status || 'draft'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-gradient border-border/20">
              <CardHeader>
                <CardTitle>Payments & Registrations</CardTitle>
                <CardDescription>Verify player payments and manage registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/organizer">
                  <Button className="w-full">Open Organizer Tools</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'player':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Player Dashboard</h2>
              <div className="flex gap-2">
                <Link to="/teams">
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Teams
                  </Button>
                </Link>
                <Link to="/my-registrations">
                  <Button variant="outline">My Registrations</Button>
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-gradient border-border/20">
                <CardHeader>
                  <CardTitle className="text-lg">Tournaments Joined</CardTitle>
                  <CardDescription>Your participation history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{joinedCount}</div>
                  <p className="text-sm text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              
              <Card className="card-gradient border-border/20">
                <CardHeader>
                  <CardTitle className="text-lg">Tournaments Won</CardTitle>
                  <CardDescription>Victory count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">{user?.stats?.tournamentsWon || 0}</div>
                  <p className="text-sm text-muted-foreground">Win rate: {user?.stats?.tournamentsJoined ? Math.round((user.stats.tournamentsWon / user.stats.tournamentsJoined) * 100) : 0}%</p>
                </CardContent>
              </Card>
              
              <Card className="card-gradient border-border/20">
                <CardHeader>
                  <CardTitle className="text-lg">Total Earnings</CardTitle>
                  <CardDescription>Prize money won</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">₹{user?.stats?.totalEarnings || 0}</div>
                  <p className="text-sm text-muted-foreground">From tournaments</p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="card-gradient border-border/20">
              <CardHeader>
                <CardTitle>Available Tournaments</CardTitle>
                <CardDescription>Join upcoming competitions</CardDescription>
              </CardHeader>
              <CardContent>
                {(allTournaments.length === 0) ? (
                  <div className="text-sm text-muted-foreground">No tournaments available yet.</div>
                ) : (
                  <div className="space-y-4">
                    {allTournaments.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-4 border border-border/20 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{t.title}</h4>
                          <p className="text-sm text-muted-foreground">Entry Fee: ₹{t.entryFee || 0} • Prize Pool: ₹{t.prizePool || 0}</p>
                        </div>
                        <Link to={`/tournament/${t.id}`}>
                          <Button size="sm">Join Now</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
        
      default:
        return (
          <div className="space-y-6">
            <Card className="card-gradient border-border/20">
              <CardHeader>
                <CardTitle>Viewer Dashboard</CardTitle>
                <CardDescription>Watch live tournaments and highlights</CardDescription>
              </CardHeader>
              <CardContent>
                {(allTournaments.length === 0) ? (
                  <div className="text-sm text-muted-foreground">No tournaments available yet.</div>
                ) : (
                  <div className="space-y-4">
                    {allTournaments.map((t) => (
                      <div key={t.id} className="p-4 border border-border/20 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{t.title}</h4>
                            <p className="text-xs text-muted-foreground">Game: {t.gameType} • Prize: ₹{t.prizePool || 0}</p>
                          </div>
                          <Badge className={t.status === 'live' ? 'status-live' : t.status === 'registration' ? 'status-upcoming' : 'status-draft'}>
                            {t.status || 'draft'}
                          </Badge>
                        </div>

                        {t.status === 'live' && t.streamURL && (
                          <div className="flex gap-3">
                            <Link to={`/tournament/${t.id}`}>
                              <Button>Watch Live</Button>
                            </Link>
                            <Link to={`/tournament/${t.id}`}>
                              <Button variant="outline">View Stats</Button>
                            </Link>
                          </div>
                        )}

                        {t.status === 'completed' && t.results && (
                          <div className="text-sm">
                            <div className="font-medium mb-1">Highlights</div>
                            <div className="flex items-center justify-between">
                              <span>Winner</span>
                              <span className="font-semibold">{t.results.winnerName || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>Kills</span>
                              <span>{t.results.winnerKills ?? '—'}</span>
                            </div>
                            {t.results.note && (
                              <p className="mt-2 text-xs text-muted-foreground">{t.results.note}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-card/10 backdrop-blur-sm border-b border-border/20">
        <div className="flex items-center space-x-2">
          <Trophy className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            EsportsPro
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Welcome, {user?.displayName}</span>
            <Badge variant={getRoleBadgeVariant(user?.role || '')}>
              {user?.role}
            </Badge>
          </div>
          <Button variant="outline" onClick={logout} className="border-border/20">
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {getDashboardContent()}
      </div>
    </div>
  );
};

export default Dashboard;