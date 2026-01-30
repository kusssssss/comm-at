import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useParams, useLocation } from "wouter";
import { Loader2, Calendar, MapPin, Users, Lock, Clock, CheckCircle2, QrCode, Eye, EyeOff, Unlock, AlertTriangle, Mic2, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

type RevealState = 'tease' | 'window' | 'locked' | 'revealed';

// Full countdown timer component
function CountdownTimer({ targetTime, label, onComplete }: { targetTime: number; label: string; onComplete?: () => void }) {
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = targetTime - Date.now();
      setTimeLeft(remaining);
      if (remaining <= 0 && onComplete) {
        onComplete();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTime, onComplete]);
  
  if (timeLeft <= 0) return null;
  
  const seconds = Math.floor((timeLeft / 1000) % 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const hours = Math.floor((timeLeft / 1000 / 60 / 60) % 24);
  const days = Math.floor(timeLeft / 1000 / 60 / 60 / 24);
  
  return (
    <div className="bg-black/50 border border-[#0ABAB5]/30 rounded-lg p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex gap-3 justify-center">
        {days > 0 && (
          <div className="text-center">
            <div className="text-2xl font-mono text-[#0ABAB5]">{days}</div>
            <div className="text-xs text-gray-500">DAYS</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-2xl font-mono text-[#0ABAB5]">{hours.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">HRS</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono text-[#0ABAB5]">{minutes.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">MIN</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono text-[#0ABAB5]">{seconds.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">SEC</div>
        </div>
      </div>
    </div>
  );
}

// Reveal state badge with icon
function RevealStateBadge({ state, label }: { state: RevealState; label: string }) {
  const config = {
    tease: { icon: EyeOff, color: '#888888', bg: '#88888820' },
    window: { icon: Clock, color: '#0ABAB5', bg: '#0ABAB520' },
    locked: { icon: Lock, color: '#FF6B6B', bg: '#FF6B6B20' },
    revealed: { icon: Unlock, color: '#00FF00', bg: '#00FF0020' },
  };
  
  const { icon: Icon, color, bg } = config[state];
  
  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
      style={{ color, backgroundColor: bg }}
    >
      <Icon size={14} />
      {label}
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [showQR, setShowQR] = useState(false);
  
  const { data: events, isLoading: eventsLoading, refetch } = trpc.event.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds for countdown updates
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
          <Link href="/gatherings" className="text-sm text-[#0ABAB5] hover:text-[#0ABAB5]/80">
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
  
  // Reveal state info
  const revealState = (event.revealState || 'tease') as RevealState;
  const revealStateLabel = event.revealStateLabel || 'TEASE';
  const timeRevealed = event.timeRevealed;
  const locationRevealed = event.locationRevealed;
  const userLayerSufficient = event.userLayerSufficient;
  const requiredLayerLabel = event.requiredLayerLabel;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b border-border/30">
        <nav className="flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/gatherings" className="text-mono text-xs md:text-sm tracking-[0.3em] text-foreground/80 hover:text-foreground transition-colors">
            COMM@
          </Link>
          <span className="text-[10px] md:text-xs text-muted-foreground tracking-wider">GATHERING</span>
        </nav>
      </header>

      <main className="px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-lg mx-auto space-y-8">
          {/* Event Header with Reveal State */}
          <div className="text-center animate-fade-in">
            <RevealStateBadge state={revealState} label={revealStateLabel} />
            
            <h1 className="text-headline mt-4 mb-2">{event.title}</h1>
            {event.tagline && (
              <p className="text-muted-foreground italic mb-2">{event.tagline}</p>
            )}
            <p className="text-gray-500">{event.city}</p>
          </div>

          {/* Countdown Timers Section */}
          <div className="space-y-4 animate-slide-up">
            {/* Time reveal countdown */}
            {!timeRevealed && event.countdownToTimeReveal && event.countdownToTimeReveal > 0 && (
              <CountdownTimer 
                targetTime={Date.now() + event.countdownToTimeReveal} 
                label="Time Reveals In"
                onComplete={() => refetch()}
              />
            )}
            
            {/* Location reveal countdown */}
            {timeRevealed && !locationRevealed && event.countdownToLocationReveal && event.countdownToLocationReveal > 0 && (
              <div>
                <CountdownTimer 
                  targetTime={Date.now() + event.countdownToLocationReveal} 
                  label={userLayerSufficient ? "Location Reveals In" : `Location Reveals In (${requiredLayerLabel} only)`}
                  onComplete={() => refetch()}
                />
                {!userLayerSufficient && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-[#FF6B6B] text-xs">
                    <AlertTriangle size={12} />
                    <span>Your layer ({event.userLayerLabel || 'STREETLIGHT'}) does not have access</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Event countdown */}
            {revealState === 'revealed' && event.countdownToEvent && event.countdownToEvent > 0 && (
              <CountdownTimer 
                targetTime={Date.now() + event.countdownToEvent} 
                label="Event Starts In"
              />
            )}
          </div>

          {/* Event Details Card */}
          <div className="card-noir p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Date/Time Section */}
            <div className="py-4 border-y border-border/30">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-0.5" style={{ color: timeRevealed ? '#0ABAB5' : '#666' }} />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                  {timeRevealed ? (
                    <div>
                      <p className="text-foreground">
                        {event.eventDate && new Date(event.eventDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                      {event.revealedStartTime && (
                        <p className="text-[#0ABAB5] font-mono mt-1">
                          {event.revealedStartTime}
                          {event.revealedEndTime && ` — ${event.revealedEndTime}`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <EyeOff size={14} />
                      <span>Time not yet revealed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="py-4 border-b border-border/30">
              <div className="flex items-start gap-3">
                {locationRevealed ? (
                  <MapPin className="w-5 h-5 text-[#00FF00] mt-0.5" />
                ) : revealState === 'locked' ? (
                  <Lock className="w-5 h-5 text-[#FF6B6B] mt-0.5" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  {locationRevealed ? (
                    <div>
                      {event.venueName && (
                        <p className="text-foreground font-medium">{event.venueName}</p>
                      )}
                      {event.locationText && (
                        <p className="text-foreground">{event.locationText}</p>
                      )}
                      {event.area && (
                        <p className="text-gray-400 text-sm">{event.area}, {event.city}</p>
                      )}
                    </div>
                  ) : revealState === 'locked' ? (
                    <div>
                      <p className="text-[#FF6B6B]">Location locked</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Requires <span className="text-[#0ABAB5]">{requiredLayerLabel}</span> layer or higher
                      </p>
                      {!userLayerSufficient && (
                        <p className="text-xs text-gray-600 mt-2">
                          Your current layer: <span className="text-gray-400">{event.userLayerLabel || 'STREETLIGHT'}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <EyeOff size={14} />
                      <span>Location not yet revealed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lineup Section */}
            {(event as any).lineup && (
              <div className="py-4 border-b border-border/30">
                <div className="flex items-start gap-3">
                  <Mic2 className="w-5 h-5 text-[var(--mint)] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Line Up</p>
                    <div className="space-y-1">
                      {(() => {
                        try {
                          const lineup = JSON.parse((event as any).lineup);
                          return lineup.map((artist: string, i: number) => (
                            <p key={i} className="text-foreground">{artist}</p>
                          ));
                        } catch {
                          return <p className="text-foreground">{(event as any).lineup}</p>;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Registration / FDC Info */}
            {(event as any).registrationInfo && (
              <div className="py-4 border-b border-border/30">
                <div className="flex items-start gap-3">
                  <Ticket className="w-5 h-5 text-[var(--mint)] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">How to Register / Entry</p>
                    <p className="text-foreground whitespace-pre-wrap">{(event as any).registrationInfo}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Capacity */}
            <div className="py-4 border-b border-border/30">
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
                  <div className="flex items-center gap-3 text-[#00FF00]">
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
                  <div className="flex items-center justify-center gap-2 text-[#FF6B6B]">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Layer Restricted</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Requires <span className="text-[#0ABAB5] font-medium">{minimumTierRequired}</span> layer or higher to claim pass
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
