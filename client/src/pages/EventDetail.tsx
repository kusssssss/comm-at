import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useParams, useLocation } from "wouter";
import { Loader2, Calendar, MapPin, Users, Lock, Clock, CheckCircle2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [showQR, setShowQR] = useState(false);
  
  const { data: events, isLoading: eventsLoading, refetch } = trpc.event.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const claimMutation = trpc.event.claimPass.useMutation({
    onSuccess: () => {
      toast.success("Pass claimed successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to claim pass");
    },
  });

  const event = events?.find(e => e.id === parseInt(id || "0"));

  const isMarked = user && ["marked_initiate", "marked_member", "marked_inner_circle"].includes(user.role);
  const isStaff = user && ["staff", "admin"].includes(user.role);

  // Redirect if not marked
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isMarked && !isStaff) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, isMarked, isStaff, navigate]);

  const [plusOneName, setPlusOneName] = useState("");
  const [showPlusOne, setShowPlusOne] = useState(false);

  const handleClaimPass = async () => {
    if (!event) return;
    await claimMutation.mutateAsync({ 
      eventId: event.id,
      plusOneName: plusOneName.trim() || undefined,
    });
  };

  if (authLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="card-noir p-8 text-center max-w-md">
          <h2 className="text-headline mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You must be marked to view this gathering.
          </p>
          <a href={getLoginUrl()} className="btn-noir-primary inline-block">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="card-noir p-8 text-center max-w-md">
          <h2 className="text-headline mb-4">Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This gathering does not exist or you don't have access.
          </p>
          <Link href="/gatherings" className="text-sm text-[#3B82F6] hover:text-[#3B82F6]/80">
            ← Back to Gatherings
          </Link>
        </div>
      </div>
    );
  }

  const isPast = event.eventDate && new Date(event.eventDate) <= new Date();
  const isFull = event.passCount >= event.capacity;
  const canClaimPass = (event as any).canClaimPass ?? true;
  const minimumTierRequired = (event as any).minimumTierRequired ?? null;
  const canClaim = !event.hasPass && !isPast && !isFull && canClaimPass;

  // Calculate countdown to location reveal
  let countdown = null;
  if (event.locationRevealAt && !event.locationRevealed) {
    const revealTime = new Date(event.locationRevealAt);
    const now = new Date();
    const diff = revealTime.getTime() - now.getTime();
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      countdown = `${hours}h ${minutes}m`;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border/30">
        <nav className="flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/gatherings" className="text-mono text-sm tracking-[0.3em] text-foreground/80 hover:text-foreground transition-colors">
            COMM@
          </Link>
          <span className="text-xs text-muted-foreground tracking-wider">GATHERING</span>
        </nav>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-lg mx-auto space-y-8">
          {/* Event Header */}
          <div className="text-center animate-fade-in">
            <p className="text-xs text-muted-foreground tracking-wider mb-2">
              {event.eventDate && new Date(event.eventDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
            <h1 className="text-headline mb-2">{event.title}</h1>
            <p className="text-muted-foreground">{event.city}</p>
          </div>

          {/* Event Details Card */}
          <div className="card-noir p-6 animate-slide-up">
            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/30">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Capacity</p>
                  <p className="text-foreground">
                    {event.passCount} / {event.capacity}
                    {isFull && <span className="text-destructive ml-2">(Full)</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-foreground">
                    {event.eventDate && new Date(event.eventDate).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="py-4 border-b border-border/30">
              <div className="flex items-start gap-3">
                {event.locationRevealed ? (
                  <MapPin className="w-5 h-5 text-[#3B82F6] mt-0.5" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  {event.locationRevealed ? (
                    <p className="text-foreground">{event.locationText}</p>
                  ) : (
                    <div>
                      <p className="text-muted-foreground">Hidden until reveal time</p>
                      {countdown && (
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-4 h-4 text-[#3B82F6]" />
                          <span className="text-[#3B82F6] text-sm">Reveals in {countdown}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rules */}
            {event.rules && (
              <div className="py-4 border-b border-border/30">
                <p className="text-xs text-muted-foreground mb-2">Rules</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.rules}</p>
              </div>
            )}

            {/* Pass Status / Claim */}
            <div className="pt-4">
              {event.hasPass ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-[#3B82F6]">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Pass Claimed</span>
                  </div>
                  
                  {event.passStatus === "used" ? (
                    <p className="text-sm text-muted-foreground">This pass has been used.</p>
                  ) : event.passStatus === "revoked" ? (
                    <p className="text-sm text-destructive">This pass has been revoked.</p>
                  ) : (
                    <Button 
                      onClick={() => setShowQR(!showQR)}
                      variant="outline"
                      className="w-full btn-noir"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      {showQR ? "Hide Pass" : "Show Pass"}
                    </Button>
                  )}
                  
                  {showQR && event.qrPayload && (
                    <div className="bg-white p-6 rounded-lg">
                      <QRCode 
                        value={event.qrPayload} 
                        size={200}
                        className="mx-auto"
                      />
                      <p className="text-center text-xs text-black mt-4 font-mono">
                        {event.qrPayload}
                      </p>
                    </div>
                  )}
                </div>
              ) : isPast ? (
                <p className="text-sm text-muted-foreground text-center">This gathering has ended.</p>
              ) : isFull ? (
                <p className="text-sm text-muted-foreground text-center">This gathering is at capacity.</p>
              ) : !canClaimPass && minimumTierRequired ? (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[#3B82F6]">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Tier Restricted</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Requires <span className="text-[#3B82F6] font-medium">{minimumTierRequired}</span> tier or higher to claim pass
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Earn your place in the hierarchy to unlock this gathering.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Plus-one option */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="plusOne"
                      checked={showPlusOne}
                      onChange={(e) => setShowPlusOne(e.target.checked)}
                      className="rounded border-border"
                    />
                    <label htmlFor="plusOne" className="text-sm text-muted-foreground">
                      Bringing a +1
                    </label>
                  </div>
                  
                  {showPlusOne && (
                    <input
                      type="text"
                      placeholder="Guest name"
                      value={plusOneName}
                      onChange={(e) => setPlusOneName(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded text-foreground placeholder:text-muted-foreground"
                    />
                  )}
                  
                  <Button 
                    onClick={handleClaimPass}
                    disabled={claimMutation.isPending}
                    className="w-full btn-noir-primary"
                  >
                    {claimMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      showPlusOne ? "Claim Pass (+1)" : "Claim Pass"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Back link */}
          <div className="text-center">
            <Link href="/gatherings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Gatherings
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
