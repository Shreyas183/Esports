import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Trophy, Users, Calendar, Zap, Shield, Target } from "lucide-react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  // Remove demo data - tournaments will be loaded dynamically
  const sponsors = [
    { name: "Gaming Gear", logo: "/api/placeholder/120/60" },
    { name: "Esports Pro", logo: "/api/placeholder/120/60" },
    { name: "Tech Partner", logo: "/api/placeholder/120/60" }
  ];

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
          <Link to="/auth">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-primary hover:opacity-90 glow-effect">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
            🎮 The Future of Esports Tournaments
          </Badge>
          
          <h1 className="text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent animate-float">
            Elite Esports Tournament Platform
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the ultimate competitive gaming experience. Organize tournaments, 
            compete with teams, and win amazing prizes in BGMI and Free Fire.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 glow-effect animate-glow"
              >
                Join Tournament <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/tournament/1">
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary/20 hover:bg-primary/10"
              >
                Watch Live <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-card/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card-gradient border-border/20 hover:shadow-elevation transition-all">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Register & Team Up</CardTitle>
                <CardDescription>
                  Create your profile, form teams, and register for tournaments
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="card-gradient border-border/20 hover:shadow-elevation transition-all">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Compete & Win</CardTitle>
                <CardDescription>
                  Battle it out in organized brackets and climb to victory
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="card-gradient border-border/20 hover:shadow-elevation transition-all">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Claim Rewards</CardTitle>
                <CardDescription>
                  Earn prizes, build your reputation, and become a champion
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-bold">Featured Tournaments</h2>
            <Link to="/dashboard">
              <Button variant="outline" className="border-primary/20 hover:bg-primary/10">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Dynamic content for featured tournaments will be loaded here */}
            {/* For now, we'll show a placeholder or a message */}
            <Card className="card-gradient border-border/20 overflow-hidden hover:shadow-card transition-all">
              <div className="h-48 bg-gradient-secondary" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Loading Tournaments...</Badge>
                </div>
                <CardTitle className="text-xl">No tournaments available yet.</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    No prize pool
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    No participants
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  View Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section className="px-6 py-16 bg-card/5">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-8 text-muted-foreground">Trusted by Industry Leaders</h2>
          <div className="flex items-center justify-center gap-12 opacity-60">
            {sponsors.map((sponsor, index) => (
              <div key={index} className="w-24 h-12 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-sm font-medium">{sponsor.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-card/10 border-t border-border/20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EsportsPro</span>
          </div>
          <p className="text-muted-foreground mb-4">
            The ultimate platform for competitive gaming tournaments
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure • Fair • Competitive</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;