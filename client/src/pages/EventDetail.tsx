import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useParams, useLocation } from "wouter";
import { 
  Loader2, Calendar, MapPin, Users, Lock, Clock, CheckCircle2, QrCode, 
  Eye, EyeOff, Unlock, AlertTriangle, Mic2, Ticket, ArrowLeft, Share2,
  Music, Utensils, Palette, Film, ShoppingBag, PartyPopper
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

type RevealState = 'tease' | 'window' | 'locked' | 'revealed';

// Category icon mapping
const categoryIcons: Record<string, any> = {
  music: Music,
  food: Utensils,
  art: Palette,
  film: Film,
  merch: ShoppingBag,
  community: PartyPopper,
};

// Full countdown timer component
function CountdownTimer({ targetTime, label, onComplete, size = 'default' }: { 
  targetTime: number; 
  label: string; 
  onComplete?: () => void;
  size?: 'default' | 'large';
}) {
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
  
  const textSize = size === 'large' ? 'text-4xl md:text-5xl' : 'text-2xl';
  const labelSize = size === 'large' ? 'text-sm' : 'text-xs';
  
  return (
    <div className="text-center">
      <p className={`${labelSize} text-gray-400 uppercase tracking-wider mb-3`}>{label}</p>
      <div className="flex gap-4 md:gap-6 justify-center">
        {days > 0 && (
          <div className="text-center">
            <div className={`${textSize} font-mono text-[var(--mint)] font-bold`}>{days}</div>
            <div className="text-xs text-gray-500 mt-1">DAYS</div>
          </div>
        )}
        <div className="text-center">
          <div className={`${textSize} font-mono text-[var(--mint)] font-bold`}>{hours.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500 mt-1">HRS</div>
        </div>
        <div className="text-center">
          <div className={`${textSize} font-mono text-[var(--mint)] font-bold`}>{minutes.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500 mt-1">MIN</div>
        </div>
        <div className="text-center">
          <div className={`${textSize} font-mono text-[var(--mint)] font-bold`}>{seconds.toString().padStart(2, '0')}</div>
          <div className="text-xs text-gray-500 mt-1">SEC</div>
        </div>
      </div>
    </div>
  );
}

// Reveal state badge with icon
function RevealStateBadge({ state, label }: { state: RevealState; label: string }) {
  const config = {
    tease: { icon: EyeOff, color: 'var(--chrome)', bg: 'rgba(128,128,128,0.15)' },
    window: { icon: Clock, color: 'var(--mint)', bg: 'rgba(111,207,151,0.15)' },
    locked: { icon: Lock, color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)' },
    revealed: { icon: Unlock, color: '#00FF00', bg: 'rgba(0,255,0,0.15)' },
  };
  
  const { icon: Icon, color, bg } = config[state];
  
  return (
    <div 
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
      style={{ color, backgroundColor: bg, border: `1px solid ${color}30` }}
    >
      <Icon size={14} />
      {label}
    </div>
  );
}

// Info card component
function InfoCard({ icon: Icon, label, children, iconColor = 'var(--chrome)' }: {
  icon: any;
  label: string;
  children: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div className="bg-[var(--soft-black)] border border-[var(--charcoal)] rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-[var(--charcoal)]">
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--chrome)] uppercase tracking-wider mb-2">{label}</p>
          <div className="text-[var(--ivory)]">{children}</div>
        </div>
      </div>
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
    refetchInterval: 30000,
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

  const handleShare = async () => {
    const shareData = {
      title: event?.title || 'COMM@ Event',
      text: `Check out ${event?.title} on COMM@`,
      url: window.location.href,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  if (authLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-[var(--charcoal)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--chrome)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--charcoal)] flex items-center justify-center px-6">
        <div className="bg-[var(--soft-black)] border border-[var(--charcoal)] rounded-2xl p-8 text-center max-w-md">
          <Lock className="w-12 h-12 text-[var(--chrome)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--ivory)] mb-2">Members Only</h2>
          <p className="text-[var(--chrome)] mb-6">
            Sign in to view this gathering.
          </p>
          <a 
            href={getLoginUrl()} 
            className="inline-block px-8 py-3 bg-[var(--mint)] text-[var(--charcoal)] font-bold rounded-lg hover:bg-[var(--mint-dark)] transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[var(--charcoal)] flex items-center justify-center px-6">
        <div className="bg-[var(--soft-black)] border border-[var(--charcoal)] rounded-2xl p-8 text-center max-w-md">
          <EyeOff className="w-12 h-12 text-[var(--chrome)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--ivory)] mb-2">Not Found</h2>
          <p className="text-[var(--chrome)] mb-6">
            This gathering does not exist or you don't have access.
          </p>
          <Link 
            href="/gatherings" 
            className="inline-flex items-center gap-2 text-[var(--mint)] hover:text-[var(--mint-dark)] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Gatherings
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
  
  const revealState = (event.revealState || 'tease') as RevealState;
  const revealStateLabel = event.revealStateLabel || 'TEASE';
  const timeRevealed = event.timeRevealed;
  const locationRevealed = event.locationRevealed;
  const userLayerSufficient = event.userLayerSufficient;
  const requiredLayerLabel = event.requiredLayerLabel;

  // Parse lineup
  let lineupArray: string[] = [];
  try {
    if ((event as any).lineup) {
      lineupArray = JSON.parse((event as any).lineup);
    }
  } catch {
    if ((event as any).lineup) {
      lineupArray = [(event as any).lineup];
    }
  }

  const CategoryIcon = categoryIcons[event.category || 'community'] || PartyPopper;

  return (
    <div className="min-h-screen bg-[var(--charcoal)]">
      {/* Hero Section with Cover Image */}
      <div className="relative">
        {/* Cover Image */}
        <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          {event.coverImageUrl ? (
            <img 
              src={event.coverImageUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--soft-black)] to-[var(--charcoal)] flex items-center justify-center">
              <CategoryIcon className="w-24 h-24 text-[var(--chrome)]/30" />
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--charcoal)] via-[var(--charcoal)]/60 to-transparent" />
        </div>

        {/* Navigation */}
        <header className="absolute top-0 left-0 right-0 z-10 px-4 md:px-8 py-4">
          <nav className="flex items-center justify-between max-w-6xl mx-auto">
            <Link 
              href="/gatherings" 
              className="flex items-center gap-2 text-[var(--ivory)]/80 hover:text-[var(--ivory)] transition-colors bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 text-[var(--ivory)]/80 hover:text-[var(--ivory)] transition-colors bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg"
            >
              <Share2 size={18} />
              <span className="text-sm font-medium hidden md:inline">Share</span>
            </button>
          </nav>
        </header>

        {/* Event Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <RevealStateBadge state={revealState} label={revealStateLabel} />
              {event.category && (
                <span className="px-3 py-1 bg-[var(--charcoal)]/80 backdrop-blur-sm text-[var(--chrome)] text-xs uppercase tracking-wider rounded-full border border-[var(--chrome)]/30">
                  {event.category}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[var(--ivory)] tracking-tight mb-2">
              {event.title}
            </h1>
            {event.tagline && (
              <p className="text-lg md:text-xl text-[var(--ivory)]/70 max-w-2xl">
                {event.tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Countdown Section */}
              {((!timeRevealed && event.countdownToTimeReveal && event.countdownToTimeReveal > 0) ||
                (timeRevealed && !locationRevealed && event.countdownToLocationReveal && event.countdownToLocationReveal > 0) ||
                (revealState === 'revealed' && event.countdownToEvent && event.countdownToEvent > 0)) && (
                <div className="bg-[var(--soft-black)] border border-[var(--charcoal)] rounded-2xl p-6 md:p-8">
                  {!timeRevealed && event.countdownToTimeReveal && event.countdownToTimeReveal > 0 && (
                    <CountdownTimer 
                      targetTime={Date.now() + event.countdownToTimeReveal} 
                      label="Time Reveals In"
                      size="large"
                      onComplete={() => refetch()}
                    />
                  )}
                  
                  {timeRevealed && !locationRevealed && event.countdownToLocationReveal && event.countdownToLocationReveal > 0 && (
                    <div>
                      <CountdownTimer 
                        targetTime={Date.now() + event.countdownToLocationReveal} 
                        label={userLayerSufficient ? "Location Reveals In" : `Location Reveals In (${requiredLayerLabel} only)`}
                        size="large"
                        onComplete={() => refetch()}
                      />
                      {!userLayerSufficient && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-[#FF6B6B] text-sm">
                          <AlertTriangle size={14} />
                          <span>Your layer ({event.userLayerLabel || 'STREETLIGHT'}) does not have access</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {revealState === 'revealed' && event.countdownToEvent && event.countdownToEvent > 0 && (
                    <CountdownTimer 
                      targetTime={Date.now() + event.countdownToEvent} 
                      label="Event Starts In"
                      size="large"
                    />
                  )}
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="bg-[var(--soft-black)] border border-[var(--charcoal)] rounded-2xl p-6 md:p-8">
                  <h2 className="text-lg font-bold text-[var(--ivory)] mb-4">About This Gathering</h2>
                  <p className="text-[var(--chrome)] leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Line Up */}
              {lineupArray.length > 0 && (
                <div className="bg-[var(--soft-black)] border border-[var(--charcoal)] rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-[var(--mint)]/10">
                      <Mic2 className="w-5 h-5 text-[var(--mint)]" />
                    </div>
                    <h2 className="text-lg font-bold text-[var(--ivory)]">Line Up</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lineupArray.map((artist, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-3 p-3 bg-[var(--charcoal)] rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-[var(--mint)]/10 flex items-center justify-center">
                          <span className="text-[var(--mint)] font-bold text-sm">{i + 1}</span>
                        </div>
                        <span className="text-[var(--ivory)] font-medium">{artist}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registration / Entry Info */}
              {(event as any).registrationInfo && (
                <div className="bg-[var(--soft-black)] border border-[var(--charcoal)] rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-[var(--mint)]/10">
                      <Ticket className="w-5 h-5 text-[var(--mint)]" />
                    </div>
                    <h2 className="text-lg font-bold text-[var(--ivory)]">How to Register / Entry</h2>
                  </div>
                  <div className="bg-[var(--charcoal)] rounded-xl p-5">
                    <p className="text-[var(--ivory)] whitespace-pre-wrap leading-relaxed">
                      {(event as any).registrationInfo}
                    </p>
                  </div>
                </div>
              )}

              {/* Rules */}
              {event.rules && (
                <div className="bg-[var(--soft-black)] border border-[var(--charcoal)] rounded-2xl p-6 md:p-8">
                  <h2 className="text-lg font-bold text-[var(--ivory)] mb-4">Rules & Guidelines</h2>
                  <p className="text-[var(--chrome)] whitespace-pre-wrap leading-relaxed">
                    {event.rules}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              
              {/* Date & Time Card */}
              <InfoCard 
                icon={Calendar} 
                label="Date & Time"
                iconColor={timeRevealed ? 'var(--mint)' : 'var(--chrome)'}
              >
                {timeRevealed ? (
                  <div>
                    <p className="font-medium text-lg">
                      {event.eventDate && new Date(event.eventDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                    {event.revealedStartTime && (
                      <p className="text-[var(--mint)] font-mono text-lg mt-1">
                        {event.revealedStartTime}
                        {event.revealedEndTime && ` — ${event.revealedEndTime}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[var(--chrome)]">
                    <EyeOff size={16} />
                    <span>Time not yet revealed</span>
                  </div>
                )}
              </InfoCard>

              {/* Location Card */}
              <InfoCard 
                icon={locationRevealed ? MapPin : Lock} 
                label="Location"
                iconColor={locationRevealed ? '#00FF00' : revealState === 'locked' ? '#FF6B6B' : 'var(--chrome)'}
              >
                {locationRevealed ? (
                  <div>
                    {event.venueName && (
                      <p className="font-medium text-lg">{event.venueName}</p>
                    )}
                    {event.locationText && (
                      <p className="text-[var(--chrome)] mt-1">{event.locationText}</p>
                    )}
                    {(event.area || event.city) && (
                      <p className="text-[var(--chrome)] text-sm mt-2">
                        {[event.area, event.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                ) : revealState === 'locked' ? (
                  <div>
                    <p className="text-[#FF6B6B] font-medium">Location Locked</p>
                    <p className="text-sm text-[var(--chrome)] mt-2">
                      Requires <span className="text-[var(--mint)]">{requiredLayerLabel}</span> layer or higher
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[var(--chrome)]">
                    <EyeOff size={16} />
                    <span>Location not yet revealed</span>
                  </div>
                )}
              </InfoCard>

              {/* Capacity Card */}
              <InfoCard icon={Users} label="Capacity">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">
                    {event.passCount} / {event.capacity}
                  </span>
                  {isFull ? (
                    <span className="px-2 py-1 bg-[#FF6B6B]/20 text-[#FF6B6B] text-xs font-bold rounded">FULL</span>
                  ) : (
                    <span className="px-2 py-1 bg-[var(--mint)]/20 text-[var(--mint)] text-xs font-bold rounded">
                      {event.capacity - event.passCount} LEFT
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-2 bg-[var(--charcoal)] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (event.passCount / event.capacity) * 100)}%`,
                      backgroundColor: isFull ? '#FF6B6B' : 'var(--mint)'
                    }}
                  />
                </div>
              </InfoCard>

              {/* Action Card - Claim Pass / Status */}
              <div className="bg-[var(--soft-black)] border border-[var(--mint)]/30 rounded-2xl p-6">
                {event.hasPass ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[#00FF00]">
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="font-bold text-lg">Pass Claimed</span>
                    </div>
                    
                    {event.passStatus === "used" ? (
                      <p className="text-[var(--chrome)]">This pass has been used.</p>
                    ) : event.passStatus === "revoked" ? (
                      <p className="text-[#FF6B6B]">This pass has been revoked.</p>
                    ) : (
                      <Button 
                        onClick={() => setShowQR(!showQR)}
                        variant="outline"
                        className="w-full border-[var(--mint)] text-[var(--mint)] hover:bg-[var(--mint)]/10"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        {showQR ? "Hide Pass" : "Show Pass"}
                      </Button>
                    )}
                    
                    {showQR && event.qrPayload && (
                      <div className="bg-white p-6 rounded-xl">
                        <QRCode 
                          value={event.qrPayload} 
                          size={180}
                          className="mx-auto"
                        />
                        <p className="text-center text-xs text-black mt-4 font-mono break-all">
                          {event.qrPayload}
                        </p>
                      </div>
                    )}
                  </div>
                ) : isPast ? (
                  <div className="text-center py-4">
                    <Clock className="w-10 h-10 text-[var(--chrome)] mx-auto mb-3" />
                    <p className="text-[var(--chrome)]">This gathering has ended.</p>
                  </div>
                ) : isFull ? (
                  <div className="text-center py-4">
                    <Users className="w-10 h-10 text-[var(--chrome)] mx-auto mb-3" />
                    <p className="text-[var(--chrome)]">This gathering is at capacity.</p>
                  </div>
                ) : !canClaimPass && minimumTierRequired ? (
                  <div className="text-center py-4 space-y-3">
                    <Lock className="w-10 h-10 text-[#FF6B6B] mx-auto" />
                    <p className="font-bold text-[var(--ivory)]">Layer Restricted</p>
                    <p className="text-sm text-[var(--chrome)]">
                      Requires <span className="text-[var(--mint)] font-medium">{minimumTierRequired}</span> layer or higher
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-[var(--chrome)] text-center">Secure your spot at this gathering</p>
                    
                    {/* Plus-one option */}
                    <div className="flex items-center gap-3 p-3 bg-[var(--charcoal)] rounded-lg">
                      <input
                        type="checkbox"
                        id="plusOne"
                        checked={showPlusOne}
                        onChange={(e) => setShowPlusOne(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--chrome)] accent-[var(--mint)]"
                      />
                      <label htmlFor="plusOne" className="text-sm text-[var(--ivory)]">
                        Bringing a +1
                      </label>
                    </div>
                    
                    {showPlusOne && (
                      <input
                        type="text"
                        placeholder="Guest name"
                        value={plusOneName}
                        onChange={(e) => setPlusOneName(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--charcoal)] border border-[var(--chrome)]/30 rounded-lg text-[var(--ivory)] placeholder:text-[var(--chrome)] focus:border-[var(--mint)] focus:outline-none transition-colors"
                      />
                    )}
                    
                    <Button 
                      onClick={handleClaimPass}
                      disabled={claimMutation.isPending}
                      className="w-full py-6 bg-[var(--mint)] text-[var(--charcoal)] font-bold text-lg hover:bg-[var(--mint-dark)] transition-colors"
                    >
                      {claimMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        showPlusOne ? "Claim Pass (+1)" : "Claim Pass"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
