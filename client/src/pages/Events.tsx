import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Loader2, Calendar, MapPin, Users, Lock } from "lucide-react";
import { useEffect } from "react";

export default function Events() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const { data: events, isLoading: eventsLoading } = trpc.event.list.useQuery(undefined, {
    enabled: isAuthenticated,
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
              Events for the marked. Location revealed when the time comes.
            </p>
          </div>

          {/* Upcoming Events */}
          <section className="animate-slide-up">
            <h2 className="text-sm text-muted-foreground tracking-wider uppercase mb-4">Upcoming</h2>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div className="card-noir p-6 hover:border-[#3B82F6]/30 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg text-foreground font-medium mb-1">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">{event.city}</p>
                        </div>
                        {event.hasPass && (
                          <span className="text-xs text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-1 rounded">
                            Pass Claimed
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {event.eventDate && new Date(event.eventDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {event.passCount}/{event.capacity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.locationRevealed ? (
                            <MapPin className="w-4 h-4 text-[#3B82F6]" />
                          ) : (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={event.locationRevealed ? "text-[#3B82F6]" : "text-muted-foreground"}>
                            {event.locationRevealed ? "Location Revealed" : "Hidden"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Show minimum tier required if user can't claim pass */}
                      {(event as any).minimumTierRequired && !(event as any).canClaimPass && (
                        <div className="mt-3 pt-3 border-t border-border/30">
                          <span className="text-xs text-[#3B82F6] uppercase tracking-wider">
                            Requires {(event as any).minimumTierRequired} tier to claim pass
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="card-noir p-8 text-center">
                <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No upcoming gatherings.</p>
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
