import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Trophy, Plus, Trash2, CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { db, storage } from '@/services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

const createTournamentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  gameType: z.enum(["BGMI", "FREE_FIRE"]),
  maxTeams: z.number().min(4).max(128),
  entryFee: z.number().min(0),
  prizePool: z.number().min(0),
  registrationStart: z.date(),
  registrationEnd: z.date(),
  tournamentStart: z.date(),
  tournamentEnd: z.date(),
  upiId: z.string().min(3, "UPI ID is required"),
  paymentInstructions: z.string().min(10, "Payment instructions are required")
});

type CreateTournamentForm = z.infer<typeof createTournamentSchema>;

const CreateTournament = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [rules, setRules] = useState<string[]>(['']);
  const [prizeDistribution, setPrizeDistribution] = useState([
    { position: 1, percentage: 50 },
    { position: 2, percentage: 30 },
    { position: 3, percentage: 15 },
    { position: 4, percentage: 5 }
  ]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateTournamentForm>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      gameType: "BGMI",
      maxTeams: 64,
      entryFee: 500,
      prizePool: 50000,
      registrationStart: new Date(),
      registrationEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tournamentStart: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      tournamentEnd: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      paymentInstructions: "Please send exact entry fee amount and submit UTR number for verification."
    }
  });

  const addRule = () => {
    setRules([...rules, '']);
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updatePrizePercentage = (index: number, percentage: number) => {
    const newDistribution = [...prizeDistribution];
    if (!newDistribution[index]) return;
    newDistribution[index].percentage = percentage;
    
    // Ensure total doesn't exceed 100%
    const total = newDistribution.reduce((sum, item) => sum + item.percentage, 0);
    if (total <= 100) {
      setPrizeDistribution(newDistribution);
    }
  };

  const handleSubmit = async (data: CreateTournamentForm) => {
    try {
      if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
        toast({
          title: "Error",
          description: "Only organizers or admins can create tournaments.",
          variant: "destructive"
        });
        return;
      }

      // Prepare rules (allow empty)
      const validRules = rules.filter(rule => rule.trim() !== '');

      // Validate prize distribution
      const totalPercentage = prizeDistribution.reduce((sum, item) => sum + item.percentage, 0);
      if (totalPercentage !== 100) {
        toast({
          title: "Error",
          description: "Prize distribution must total 100%",
          variant: "destructive"
        });
        return;
      }

      setSubmitting(true);
      console.log('🚀 Submitting tournament creation payload:', { data, prizeDistribution, rules: validRules, hasBanner: !!bannerFile, hasQr: !!qrFile });

      let bannerURL = '';
      let qrCodeURL = '';

      // Pre-create tournament document and ID for rules + storage paths
      const tournamentDocRef = doc(collection(db, 'tournaments'));
      const tournamentId = tournamentDocRef.id;

      // Create minimal document so Storage rules can verify organizerId
      try {
        await setDoc(tournamentDocRef, {
          organizerId: user.uid,
          organizerName: user.displayName,
          status: 'draft',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }, { merge: true });
      } catch (err: any) {
        console.error('Failed to create minimal tournament doc:', err);
        toast({
          title: "Error",
          description: `Failed to initialize tournament: ${err?.message || err}`,
          variant: "destructive"
        });
        return;
      }

      // Upload banner file
      if (bannerFile) {
        try {
          const bannerRef = ref(storage, `tournaments/${tournamentId}/banner/${Date.now()}_${bannerFile.name}`);
          await uploadBytes(bannerRef, bannerFile, { contentType: bannerFile.type || 'image/jpeg' });
          bannerURL = await getDownloadURL(bannerRef);
        } catch (err) {
          console.error('Banner upload error (continuing without banner):', err);
          toast({
            title: "Warning",
            description: "Banner upload failed due to network/CORS. Continuing without banner.",
          });
          bannerURL = '';
        }
      }

      // Upload QR code file
      if (qrFile) {
        try {
          const qrRef = ref(storage, `tournaments/${tournamentId}/qr/${Date.now()}_${qrFile.name}`);
          await uploadBytes(qrRef, qrFile, { contentType: qrFile.type || 'image/jpeg' });
          qrCodeURL = await getDownloadURL(qrRef);
        } catch (err) {
          console.error('QR upload error (continuing without QR):', err);
          toast({
            title: "Warning",
            description: "QR upload failed due to network/CORS. Continuing without QR.",
          });
          qrCodeURL = '';
        }
      }

      // Save tournament to Firestore
      try {
        await setDoc(tournamentDocRef, {
          title: data.title,
          description: data.description,
          gameType: data.gameType,
          maxTeams: data.maxTeams,
          entryFee: data.entryFee,
          prizePool: data.prizePool,
          prizeDistribution,
          rules: validRules,
          schedule: {
            registrationStart: Timestamp.fromDate(data.registrationStart),
            registrationEnd: Timestamp.fromDate(data.registrationEnd),
            tournamentStart: Timestamp.fromDate(data.tournamentStart),
            tournamentEnd: Timestamp.fromDate(data.tournamentEnd)
          },
          paymentInfo: {
            qrCodeURL,
            upiId: data.upiId,
            instructions: data.paymentInstructions
          },
          bannerURL,
          status: 'registration',
          featured: false,
          sponsors: [],
          updatedAt: Timestamp.now()
        }, { merge: true });
      } catch (err: any) {
        console.error('Firestore error:', err);
        const message = err?.message || String(err);
        const code = err?.code;
        console.error('Firestore error details:', { code, message });
        toast({
          title: "Error",
          description: `Firestore error: ${message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Tournament created successfully!"
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('General error:', error);
      const message = error?.message || String(error);
      const code = error?.code;
      console.error('General error details:', { code, message });
      toast({
        title: "Error",
        description: `Failed to create tournament: ${message}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <Card className="card-gradient border-border/20">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Set up the basic details of your tournament</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Tournament Title</Label>
            <Input
              id="title"
              placeholder="Enter tournament title"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your tournament"
              rows={4}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gameType">Game</Label>
              <Select onValueChange={(value) => form.setValue("gameType", value as "BGMI" | "FREE_FIRE")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BGMI">BGMI</SelectItem>
                  <SelectItem value="FREE_FIRE">Free Fire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxTeams">Max Teams</Label>
              <Select onValueChange={(value) => form.setValue("maxTeams", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select max teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">16 Teams</SelectItem>
                  <SelectItem value="32">32 Teams</SelectItem>
                  <SelectItem value="64">64 Teams</SelectItem>
                  <SelectItem value="128">128 Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="banner">Tournament Banner</Label>
            <Input
              id="banner"
              type="file"
              accept="image/*"
              onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
            />
            <p className="text-sm text-muted-foreground mt-1">Recommended: 1920x1080px</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card className="card-gradient border-border/20">
        <CardHeader>
          <CardTitle>Prize & Entry Details</CardTitle>
          <CardDescription>Configure entry fees and prize distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entryFee">Entry Fee (₹)</Label>
              <Input
                id="entryFee"
                type="number"
                {...form.register("entryFee", { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label htmlFor="prizePool">Prize Pool (₹)</Label>
              <Input
                id="prizePool"
                type="number"
                {...form.register("prizePool", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div>
            <Label>Prize Distribution</Label>
            <div className="space-y-2">
              {prizeDistribution.map((prize, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Badge variant="outline">#{prize.position}</Badge>
                  <Input
                    type="number"
                    value={prize.percentage}
                    onChange={(e) => updatePrizePercentage(index, parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <span className="text-sm font-medium">
                    ₹{Math.floor((form.watch("prizePool") || 0) * prize.percentage / 100).toLocaleString()}
                  </span>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Total: {prizeDistribution.reduce((sum, item) => sum + item.percentage, 0)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-gradient border-border/20">
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>Set up payment collection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              placeholder="your-upi@bank"
              {...form.register("upiId")}
            />
            {form.formState.errors.upiId && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.upiId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="qrCode">Payment QR Code</Label>
            <Input
              id="qrCode"
              type="file"
              accept="image/*"
              onChange={(e) => setQrFile(e.target.files?.[0] || null)}
            />
            <p className="text-sm text-muted-foreground mt-1">Upload QR code for payments</p>
          </div>

          <div>
            <Label htmlFor="paymentInstructions">Payment Instructions</Label>
            <Textarea
              id="paymentInstructions"
              rows={3}
              {...form.register("paymentInstructions")}
            />
            {form.formState.errors.paymentInstructions && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.paymentInstructions.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card className="card-gradient border-border/20">
        <CardHeader>
          <CardTitle>Tournament Schedule</CardTitle>
          <CardDescription>Set important dates for your tournament</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Registration Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("registrationStart") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("registrationStart")?.toDateString() || "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("registrationStart")}
                    onSelect={(date) => date && form.setValue("registrationStart", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Registration End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("registrationEnd") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("registrationEnd")?.toDateString() || "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("registrationEnd")}
                    onSelect={(date) => date && form.setValue("registrationEnd", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Tournament Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("tournamentStart") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("tournamentStart")?.toDateString() || "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("tournamentStart")}
                    onSelect={(date) => date && form.setValue("tournamentStart", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Tournament End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("tournamentEnd") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("tournamentEnd")?.toDateString() || "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("tournamentEnd")}
                    onSelect={(date) => date && form.setValue("tournamentEnd", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-gradient border-border/20">
        <CardHeader>
          <CardTitle>Tournament Rules</CardTitle>
          <CardDescription>Define the rules for your tournament</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Rule ${index + 1}`}
                value={rule}
                onChange={(e) => updateRule(index, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeRule(index)}
                disabled={rules.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addRule}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </CardContent>
      </Card>
    </div>
  );

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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Create Tournament</h1>
            <p className="text-muted-foreground">Set up your esports competition</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2",
                      step >= stepNumber
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div
                      className={cn(
                        "w-12 h-0.5 mx-2",
                        step > stepNumber ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form 
            onSubmit={form.handleSubmit(handleSubmit)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && step < 3) {
                e.preventDefault();
              }
            }}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
              >
                Previous
              </Button>
              
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  className="bg-gradient-primary hover:opacity-90"
                  disabled={submitting}
                  onClick={() => form.handleSubmit(handleSubmit)()}
                >
                  {submitting ? 'Creating…' : 'Create Tournament'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTournament;