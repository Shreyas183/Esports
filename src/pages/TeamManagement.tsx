import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Trophy, 
  Plus, 
  Users, 
  Crown, 
  UserPlus, 
  Trash2,
  Upload,
  Mail
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

const createTeamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters"),
  gameType: z.enum(["BGMI", "FREE_FIRE"])
});

const invitePlayerSchema = z.object({
  email: z.string().email("Invalid email address"),
  gameId: z.string().min(3, "Game ID is required")
});

type CreateTeamForm = z.infer<typeof createTeamSchema>;
type InvitePlayerForm = z.infer<typeof invitePlayerSchema>;

const TeamManagement = () => {
  const { user } = useAuth();
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInvitePlayer, setShowInvitePlayer] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamLogo, setTeamLogo] = useState<File | null>(null);

  const createTeamForm = useForm<CreateTeamForm>({
    resolver: zodResolver(createTeamSchema)
  });

  const invitePlayerForm = useForm<InvitePlayerForm>({
    resolver: zodResolver(invitePlayerSchema)
  });

  // Mock teams data - replace with actual Firebase query
  const teams = [
    {
      id: "team1",
      name: "Alpha Legends",
      logoURL: "/api/placeholder/60/60",
      captainId: user?.uid,
      gameType: "BGMI",
      members: [
        {
          userId: user?.uid || "",
          displayName: user?.displayName || "",
          gameId: "ALPHA_CAPTAIN",
          role: "captain",
          joinedAt: new Date()
        },
        {
          userId: "user2",
          displayName: "Player Two",
          gameId: "ALPHA_PLAYER2",
          role: "member",
          joinedAt: new Date()
        },
        {
          userId: "user3",
          displayName: "Player Three",
          gameId: "ALPHA_PLAYER3",
          role: "member",
          joinedAt: new Date()
        }
      ],
      stats: {
        tournamentsJoined: 12,
        tournamentsWon: 3,
        totalEarnings: 15000
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "team2",
      name: "Beta Warriors",
      logoURL: "/api/placeholder/60/60",
      captainId: "otheruser",
      gameType: "FREE_FIRE",
      members: [
        {
          userId: user?.uid || "",
          displayName: user?.displayName || "",
          gameId: "BETA_MEMBER",
          role: "member",
          joinedAt: new Date()
        }
      ],
      stats: {
        tournamentsJoined: 8,
        tournamentsWon: 1,
        totalEarnings: 5000
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const handleCreateTeam = async (data: CreateTeamForm) => {
    try {
      // Here you would implement the actual team creation with Firebase
      console.log('Creating team:', { ...data, logoFile: teamLogo });
      
      toast({
        title: "Success",
        description: "Team created successfully!"
      });
      
      setShowCreateTeam(false);
      createTeamForm.reset();
      setTeamLogo(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive"
      });
    }
  };

  const handleInvitePlayer = async (data: InvitePlayerForm) => {
    try {
      // Here you would implement the actual player invitation with Firebase
      console.log('Inviting player:', { ...data, teamId: selectedTeamId });
      
      toast({
        title: "Success",
        description: "Invitation sent successfully!"
      });
      
      setShowInvitePlayer(false);
      invitePlayerForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    }
  };

  const handleRemovePlayer = async (teamId: string, playerId: string) => {
    try {
      // Here you would implement the actual player removal
      console.log('Removing player:', { teamId, playerId });
      
      toast({
        title: "Success",
        description: "Player removed from team"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove player",
        variant: "destructive"
      });
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    try {
      // Here you would implement the actual team leaving logic
      console.log('Leaving team:', teamId);
      
      toast({
        title: "Success",
        description: "Left team successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave team",
        variant: "destructive"
      });
    }
  };

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

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Team Management</h1>
            <p className="text-muted-foreground">Manage your teams and invitations</p>
          </div>
          
          <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="card-gradient border-border/20">
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>Set up a new team for tournaments</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={createTeamForm.handleSubmit(handleCreateTeam)} className="space-y-4">
                <div>
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="Enter team name"
                    {...createTeamForm.register("name")}
                  />
                  {createTeamForm.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {createTeamForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gameType">Game Type</Label>
                  <Select onValueChange={(value) => createTeamForm.setValue("gameType", value as "BGMI" | "FREE_FIRE")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select game" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BGMI">BGMI</SelectItem>
                      <SelectItem value="FREE_FIRE">Free Fire</SelectItem>
                    </SelectContent>
                  </Select>
                  {createTeamForm.formState.errors.gameType && (
                    <p className="text-sm text-destructive mt-1">
                      {createTeamForm.formState.errors.gameType.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="teamLogo">Team Logo</Label>
                  <Input
                    id="teamLogo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setTeamLogo(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">Optional: Upload team logo</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateTeam(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-primary hover:opacity-90"
                  >
                    Create Team
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="card-gradient border-border/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{team.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{team.gameType}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {team.members.length}/4 members
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {team.captainId === user?.uid && (
                    <Dialog 
                      open={showInvitePlayer && selectedTeamId === team.id} 
                      onOpenChange={(open) => {
                        setShowInvitePlayer(open);
                        if (open) setSelectedTeamId(team.id);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <UserPlus className="h-4 w-4 mr-1" />
                          Invite
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="card-gradient border-border/20">
                        <DialogHeader>
                          <DialogTitle>Invite Player</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join {team.name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={invitePlayerForm.handleSubmit(handleInvitePlayer)} className="space-y-4">
                          <div>
                            <Label htmlFor="playerEmail">Player Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="playerEmail"
                                type="email"
                                placeholder="player@example.com"
                                className="pl-10"
                                {...invitePlayerForm.register("email")}
                              />
                            </div>
                            {invitePlayerForm.formState.errors.email && (
                              <p className="text-sm text-destructive mt-1">
                                {invitePlayerForm.formState.errors.email.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="playerGameId">Game ID</Label>
                            <Input
                              id="playerGameId"
                              placeholder="Enter player's game ID"
                              {...invitePlayerForm.register("gameId")}
                            />
                            {invitePlayerForm.formState.errors.gameId && (
                              <p className="text-sm text-destructive mt-1">
                                {invitePlayerForm.formState.errors.gameId.message}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowInvitePlayer(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1 bg-gradient-primary hover:opacity-90"
                            >
                              Send Invitation
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Team Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/10 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{team.stats.tournamentsJoined}</p>
                    <p className="text-xs text-muted-foreground">Tournaments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{team.stats.tournamentsWon}</p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">₹{team.stats.totalEarnings.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Earnings</p>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <h4 className="font-semibold mb-3">Team Members</h4>
                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div key={member.userId} className="flex items-center justify-between p-2 border border-border/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            {member.role === 'captain' ? (
                              <Crown className="h-4 w-4 text-warning" />
                            ) : (
                              <Users className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{member.displayName}</p>
                            <p className="text-xs text-muted-foreground">{member.gameId}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={member.role === 'captain' ? 'default' : 'secondary'} className="text-xs">
                            {member.role}
                          </Badge>
                          
                          {team.captainId === user?.uid && member.userId !== user?.uid && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemovePlayer(team.id, member.userId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Actions */}
                <div className="flex gap-2 pt-4">
                  {team.captainId === user?.uid ? (
                    <Button variant="outline" className="flex-1">
                      <Upload className="mr-2 h-4 w-4" />
                      Edit Team
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleLeaveTeam(team.id)}
                    >
                      Leave Team
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {teams.length === 0 && (
          <Card className="card-gradient border-border/20">
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Teams Yet</h3>
              <p className="text-muted-foreground mb-6">Create or join a team to start competing in tournaments</p>
              <Button 
                className="bg-gradient-primary hover:opacity-90"
                onClick={() => setShowCreateTeam(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Team
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;