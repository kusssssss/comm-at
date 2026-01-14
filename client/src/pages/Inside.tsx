import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Loader2, Calendar, User, Shield, Users, Activity, Trophy, Gift } from "lucide-react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { DecryptText, CycleNumber, GlitchHover } from "@/components/Effects2200";

export default function Inside() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const { data: feed, isLoading: feedLoading } = trpc.inside.getFeed.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: events } = trpc.event.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: stats } = trpc.community.getStats.useQuery();
  const { data: recentMarkings } = trpc.community.getRecentMarkings.useQuery();
  const { data: recentCheckIns } = trpc.community.getRecentCheckIns.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isMarked = user && ["marked_initiate", "marked_member", "marked_inner_circle"].includes(user.role);
  const isStaff = user && ["staff", "admin"].includes(user.role);

  // Redirect if not marked
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isMarked && !isStaff) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, isMarked, isStaff, navigate]);

  // Redirect if revoked
  useEffect(() => {
    if (user && user.status !== "active") {
      navigate("/");
    }
  }, [user, navigate]);

  // Format time ago
  const timeAgo = (date: Date | string | null) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (authLoading || feedLoading) {
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
            You must be marked to enter.
          </p>
          <a href={getLoginUrl()} className="btn-noir-primary inline-block">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const upcomingEvents = events?.filter(e => e.eventDate && new Date(e.eventDate) > new Date()).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border/30 sticky top-0 bg-background/95 backdrop-blur-sm z-40">
        <nav className="flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/" className="text-mono text-sm tracking-[0.3em] text-foreground/80 hover:text-foreground transition-colors">
            COMM@
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Events
            </Link>
            <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Leaderboard
            </Link>
            <Link href="/referral" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Refer
            </Link>
            <Link href="/profile" className="text-sm text-[#9333EA] hover:text-[#9333EA]/80 transition-colors">
              {user?.callSign}
            </Link>
          </div>
        </nav>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-12">
          {/* Welcome */}
          <div className="text-center animate-fade-in">
            <div className="w-12 h-12 mx-auto border border-[#9333EA]/30 rounded-full flex items-center justify-center mark-glow mb-4">
              <span className="text-[#9333EA] text-lg">@</span>
            </div>
            <h1 className="text-headline mb-2">Inside</h1>
            <p className="text-muted-foreground">
              Welcome back, <span className="text-[#9333EA]">{user?.callSign}</span>
            </p>
          </div>

          {/* Community Stats */}
          <section className="animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm text-muted-foreground tracking-wider uppercase">The Collective</h2>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="card-noir p-4 text-center">
                <p className="text-2xl text-[#9333EA] font-light">{stats?.totalMarked || 0}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div className="card-noir p-4 text-center">
                <p className="text-2xl text-foreground font-light">{stats?.totalArtifacts || 0}</p>
                <p className="text-xs text-muted-foreground">Marks</p>
              </div>
              <div className="card-noir p-4 text-center">
                <p className="text-2xl text-foreground font-light">{stats?.totalDrops || 0}</p>
                <p className="text-xs text-muted-foreground">Drops</p>
              </div>
              <div className="card-noir p-4 text-center">
                <p className="text-2xl text-foreground font-light">{stats?.totalEvents || 0}</p>
                <p className="text-xs text-muted-foreground">Events</p>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm text-muted-foreground tracking-wider uppercase">Recent Activity</h2>
            </div>
            <div className="card-noir p-4">
              <div className="space-y-3">
                {/* Recent Markings */}
                {recentMarkings && recentMarkings.length > 0 ? (
                  recentMarkings.slice(0, 5).map((marking, i) => (
                    <div key={`marking-${i}`} className="flex items-center justify-between text-sm py-2 border-b border-border/20 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#9333EA]"></span>
                        <span className="text-[#9333EA]">@{marking.callSign}</span>
                        <span className="text-muted-foreground">marked</span>
                        <span className="text-foreground">{marking.dropTitle}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{timeAgo(marking.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                )}
                
                {/* Recent Check-ins */}
                {recentCheckIns && recentCheckIns.length > 0 && (
                  <>
                    <div className="border-t border-border/30 pt-3 mt-3">
                      <p className="text-xs text-muted-foreground tracking-wider uppercase mb-3">Recent Check-ins</p>
                      {recentCheckIns.slice(0, 3).map((checkIn, i) => (
                        <div key={`checkin-${i}`} className="flex items-center justify-between text-sm py-2 border-b border-border/20 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-[#9333EA]">@{checkIn.callSign}</span>
                            <span className="text-muted-foreground">attended</span>
                            <span className="text-foreground">{checkIn.eventTitle}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{timeAgo(checkIn.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm text-muted-foreground tracking-wider uppercase">Upcoming Gatherings</h2>
                <Link href="/events" className="text-xs text-[#9333EA] hover:text-[#9333EA]/80">
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div className="card-noir p-4 hover:border-[#9333EA]/30 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-foreground font-medium">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">{event.city}</p>
                        </div>
                        <div className="text-right">
                          {event.eventDate && (
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.eventDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric"
                              })}
                            </p>
                          )}
                          {event.hasPass ? (
                            <span className="text-xs text-[#9333EA]">Pass Claimed</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {event.passCount}/{event.capacity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Doctrine Cards */}
          <section className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-sm text-muted-foreground tracking-wider uppercase mb-4">The Doctrine</h2>
            <div className="space-y-4">
              {feed?.doctrines && feed.doctrines.length > 0 ? (
                feed.doctrines.map((card) => (
                  <div key={card.id} className={`card-noir p-6 ${card.isPinned ? "border-[#9333EA]/20" : ""}`}>
                    {card.isPinned && (
                      <span className="text-xs text-[#9333EA] tracking-wider mb-2 block">PINNED</span>
                    )}
                    <h3 className="text-foreground font-medium mb-2">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {card.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="card-noir p-6 text-center">
                  <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    The doctrine will be revealed in time.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Quick Links */}
          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/events">
                <div className="card-noir p-4 text-center hover:border-[#9333EA]/30 transition-colors cursor-pointer">
                  <Calendar className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-foreground">Events</p>
                </div>
              </Link>
              <Link href="/profile">
                <div className="card-noir p-4 text-center hover:border-[#9333EA]/30 transition-colors cursor-pointer">
                  <User className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-foreground">Profile</p>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
