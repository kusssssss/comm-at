import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Loader2, LogOut, Shield, Calendar, MapPin } from "lucide-react";
import { TierBadge } from "@/components/TierBadge";
import { TierProgressCard } from "@/components/TierProgressCard";
import { useEffect } from "react";

const ROLE_LABELS: Record<string, string> = {
  marked_initiate: "Initiate",
  marked_member: "Member",
  marked_inner_circle: "Inner Circle",
  staff: "Staff",
  admin: "Admin",
};

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  
  const { data: profile, isLoading: profileLoading } = trpc.inside.getProfile.useQuery(undefined, {
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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (authLoading || profileLoading) {
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
            You must be marked to view your profile.
          </p>
          <a href={getLoginUrl()} className="btn-noir-primary inline-block">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b border-border/30">
        <nav className="flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/inside" className="text-mono text-xs md:text-sm tracking-[0.3em] text-foreground/80 hover:text-foreground transition-colors">
            COMM@
          </Link>
          <span className="text-[10px] md:text-xs text-muted-foreground tracking-wider">PROFILE</span>
        </nav>
      </header>

      <main className="px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-lg mx-auto space-y-8">
          {/* Identity Card */}
          <div className="card-noir p-8 animate-fade-in">
            <div className="text-center mb-8">
              {/* Tier Badge */}
              <div className="mb-4">
                <TierBadge 
                  tier={profile?.role === 'marked_inner_circle' ? 'INNER_CIRCLE' : 
                        profile?.role === 'marked_member' ? 'MEMBER' : 
                        profile?.role === 'marked_initiate' ? 'INITIATE' : 'OUTSIDE'} 
                  size="lg" 
                  showLabel={false}
                />
              </div>
              <h1 className="text-display text-[#3B82F6] mb-2">{profile?.callSign}</h1>
              <p className="text-sm text-muted-foreground tracking-wider uppercase">
                {ROLE_LABELS[profile?.role || ""] || profile?.role}
              </p>
            </div>

            <div className="space-y-4 pt-6 border-t border-border/30">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Chapter</p>
                  <p className="text-foreground">{profile?.chapter}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Marked Since</p>
                  <p className="text-foreground">
                    {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className={`${profile?.status === "active" ? "text-[#3B82F6]" : "text-destructive"}`}>
                    {profile?.status === "active" ? "Active" : "Revoked"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Marks */}
          {profile?.artifacts && profile.artifacts.length > 0 && (
            <div className="card-noir p-6 animate-slide-up">
              <h2 className="text-sm text-muted-foreground tracking-wider uppercase mb-4">Your Marks</h2>
              <div className="space-y-3">
                {profile.artifacts.map((artifact, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-mono text-sm">{artifact.serialNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {artifact.markedAt && new Date(artifact.markedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tier Progress */}
          <TierProgressCard />

          {/* Actions */}
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <Link href="/inside">
              <Button variant="outline" className="w-full btn-noir">
                ← Back to Inside
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
