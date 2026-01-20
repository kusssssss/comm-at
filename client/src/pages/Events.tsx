import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Loader2, Calendar, MapPin, Users, Lock, Clock, Eye, EyeOff, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { RevealCountdown, RevealStateBadge } from "@/components/RevealCountdown";

type RevealState = 'tease' | 'window' | 'locked' | 'revealed';

// Countdown display for event cards
function MiniCountdown({ countdown, label }: { countdown: number; label: string }) {
  const [timeLeft, setTimeLeft] = useState(countdown);
  
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setTimeLeft(Math.max(0, countdown - elapsed));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);
  
  const seconds = Math.floor((timeLeft / 1000) % 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const hours = Math.floor((timeLeft / 1000 / 60 / 60) % 24);
  const days = Math.floor(timeLeft / 1000 / 60 / 60 / 24);
  
  return (
    <div className="text-xs text-gray-400">
      <span className="text-[#0ABAB5]">{label}:</span>{' '}
      {days > 0 && `${days}d `}
      {hours}h {minutes}m {seconds}s
    </div>
  );
}

// Get reveal state icon
function getRevealStateIcon(state: RevealState) {
  switch (state) {
    case 'tease': return EyeOff;
    case 'window': return Clock;
    case 'locked': return Lock;
    case 'revealed': return Unlock;
  }
}

// Get reveal state color
function getRevealStateColor(state: RevealState) {
  switch (state) {
    case 'tease': return '#888888';
    case 'window': return '#0ABAB5';
    case 'locked': return '#FF6B6B';
    case 'revealed': return '#00FF00';
  }
}

export default function Events() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const { data: events, isLoading: eventsLoading } = trpc.event.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds to update countdowns
  });

  const isMarked = user && ["marked_initiate", "marked_member", "marked_inner_circle"].includes(user.role);
  const isStaff = user && ["staff", "admin"].includes(user.role);
  const hasAccess = isMarked || isStaff;

  // Redirect if not marked (but allow admin/staff access)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasAccess) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, hasAccess, navigate]);

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
            You must be marked to view gatherings.
          </p>
          <a href={getLoginUrl()} className="btn-noir-primary inline-block">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const upcomingEvents = events?.filter(e => e.eventDate && new Date(e.eventDate) > new Date()) || [];
  const pastEvents = events?.filter(e => e.eventDate && new Date(e.eventDate) <= new Date()) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border/30 sticky top-0 bg-background/95 backdrop-blur-sm z-40">
        <nav className="flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/inside" className="text-mono text-sm tracking-[0.3em] text-foreground/80 hover:text-foreground transition-colors">
            COMM@
          </Link>
          <span className="text-xs text-muted-foreground tracking-wider">GATHERINGS</span>
        </nav>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center animate-fade-in">
            <h1 className="text-headline mb-2">Gatherings</h1>
            <p className="text-muted-foreground">
              Events are not posted — they are <span className="text-[#0ABAB5]">unlocked</span>.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Time and location reveal based on your layer clearance.
            </p>
          </div>

          {/* Reveal State Legend */}
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            {(['tease', 'window', 'locked', 'revealed'] as RevealState[]).map((state) => {
              const Icon = getRevealStateIcon(state);
              const color = getRevealStateColor(state);
              return (
                <div key={state} className="flex items-center gap-1.5" style={{ color }}>
                  <Icon size={12} />
                  <span className="uppercase tracking-wider">{state}</span>
                </div>
              );
            })}
          </div>

          {/* Upcoming Events */}
          <section className="animate-slide-up">
            <h2 className="text-sm text-muted-foreground tracking-wider uppercase mb-4">Upcoming</h2>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const revealState = (event.revealState || 'tease') as RevealState;
                  const StateIcon = getRevealStateIcon(revealState);
                  const stateColor = getRevealStateColor(revealState);
                  
                  return (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <div className="card-noir p-6 hover:border-[#0ABAB5]/30 transition-colors cursor-pointer">
                        {/* Header with title and reveal state */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg text-foreground font-medium">{event.title}</h3>
                              {event.hasPass && (
                                <span className="text-xs text-[#00FF00] bg-[#00FF00]/10 px-2 py-0.5 rounded">
                                  PASS
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{event.tagline || event.city}</p>
                          </div>
                          
                          {/* Reveal State Badge */}
                          <div 
                            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
                            style={{ 
                              color: stateColor, 
                              backgroundColor: `${stateColor}20` 
                            }}
                          >
                            <StateIcon size={12} />
                            {event.revealStateLabel || 'TEASE'}
                          </div>
                        </div>
                        
                        {/* Event Info Grid */}
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          {/* Date/Time */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" style={{ color: event.timeRevealed ? '#0ABAB5' : '#666' }} />
                            <span className={event.timeRevealed ? "text-foreground" : "text-muted-foreground"}>
                              {event.timeRevealed && event.eventDate 
                                ? new Date(event.eventDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric"
                                  })
                                : "TBA"
                              }
                              {event.timeRevealed && event.revealedStartTime && (
                                <span className="text-xs ml-1 text-[#0ABAB5]">
                                  {event.revealedStartTime}
                                </span>
                              )}
                            </span>
                          </div>
                          
                          {/* Capacity */}
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {event.passCount}/{event.capacity}
                            </span>
                          </div>
                          
                          {/* Location */}
                          <div className="flex items-center gap-2">
                            {event.locationRevealed ? (
                              <MapPin className="w-4 h-4 text-[#00FF00]" />
                            ) : (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className={event.locationRevealed ? "text-[#00FF00]" : "text-muted-foreground"}>
                              {event.locationRevealed 
                                ? (event.area || event.venueName || "Revealed")
                                : event.city || "Hidden"
                              }
                            </span>
                          </div>
                        </div>
                        
                        {/* Countdown Timers */}
                        <div className="space-y-1">
                          {/* Time reveal countdown */}
                          {!event.timeRevealed && event.countdownToTimeReveal && event.countdownToTimeReveal > 0 && (
                            <MiniCountdown 
                              countdown={event.countdownToTimeReveal} 
                              label="Time reveals in" 
                            />
                          )}
                          
                          {/* Location reveal countdown */}
                          {event.timeRevealed && !event.locationRevealed && event.countdownToLocationReveal && event.countdownToLocationReveal > 0 && (
                            <MiniCountdown 
                              countdown={event.countdownToLocationReveal} 
                              label={event.userLayerSufficient ? "Location reveals in" : `Location reveals in (${event.requiredLayerLabel} only)`}
                            />
                          )}
                          
                          {/* Event countdown */}
                          {revealState === 'revealed' && event.countdownToEvent && event.countdownToEvent > 0 && (
                            <MiniCountdown 
                              countdown={event.countdownToEvent} 
                              label="Event starts in" 
                            />
                          )}
                        </div>
                        
                        {/* Layer requirement warning */}
                        {revealState === 'locked' && !event.userLayerSufficient && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <span className="text-xs text-[#FF6B6B] uppercase tracking-wider flex items-center gap-1">
                              <Lock size={10} />
                              Requires {event.requiredLayerLabel} layer for location access
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="card-noir p-8 text-center">
                <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No upcoming gatherings.</p>
                <p className="text-xs text-gray-500 mt-2">Check back soon for new events.</p>
              </div>
            )}
          </section>

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <h2 className="text-sm text-muted-foreground tracking-wider uppercase mb-4">Past</h2>
              <div className="space-y-3 opacity-60">
                {pastEvents.map((event) => (
                  <div key={event.id} className="card-noir p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground">{event.city}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {event.eventDate && new Date(event.eventDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Back link */}
          <div className="text-center">
            <Link href="/inside" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Inside
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
