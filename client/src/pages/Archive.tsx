import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Loader2, Calendar, MapPin, Award, Users, Clock, Shield, Star } from "lucide-react";

const memoryIcons: Record<string, React.ReactNode> = {
  activation: <Award className="w-5 h-5" />,
  event_attended: <MapPin className="w-5 h-5" />,
  chapter_change: <Users className="w-5 h-5" />,
  mark_upgraded: <Star className="w-5 h-5" />,
  unmarking: <Shield className="w-5 h-5 text-destructive" />,
};

const memoryLabels: Record<string, string> = {
  activation: "Marked",
  event_attended: "Present at",
  chapter_change: "Chapter changed",
  mark_upgraded: "Elevated to",
  unmarking: "Unmarked",
};

export default function Archive() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const { data: memories, isLoading: memoriesLoading } = trpc.memory.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading || memoriesLoading) {
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
          <h2 className="text-headline mb-4">Access Required</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to view your permanent record.
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
      <header className="px-6 py-4 border-b border-border/30">
        <nav className="flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/" className="text-mono text-sm tracking-[0.3em] text-foreground/80 hover:text-foreground transition-colors">
            COMM@
          </Link>
          <span className="text-xs text-muted-foreground tracking-wider">ARCHIVE</span>
        </nav>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-headline mb-2">Your Permanent Record</h1>
            <p className="text-muted-foreground">
              Every moment in the collective is remembered.
            </p>
          </div>

          {/* User Info */}
          {user && (
            <div className="card-noir p-6 mb-8 animate-slide-up">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#9333EA]/20 flex items-center justify-center">
                  <span className="text-[#9333EA] font-bold text-lg">
                    {(user.callSign || user.name || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-foreground font-medium">{user.callSign || user.name}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {user.markState || "Outside"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Memory Timeline */}
          <div className="space-y-1 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-sm text-muted-foreground tracking-wider uppercase mb-6">
              You were present for:
            </h2>
            
            {memories && memories.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border/50" />
                
                {/* Memory entries */}
                <div className="space-y-6">
                  {memories.map((memory, index) => (
                    <div 
                      key={memory.id} 
                      className="relative flex gap-4 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Icon */}
                      <div className="relative z-10 w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground">
                        {memoryIcons[memory.memoryType] || <Clock className="w-5 h-5" />}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-2">
                        <p className="text-foreground">
                          <span className="text-muted-foreground">
                            {memoryLabels[memory.memoryType] || memory.memoryType}:
                          </span>{" "}
                          {memory.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(memory.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card-noir p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Your story begins when you are marked.
                </p>
              </div>
            )}
          </div>

          {/* Back link */}
          <div className="text-center mt-12">
            <Link href="/inside" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Inside
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
