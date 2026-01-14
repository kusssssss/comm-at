import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Loader2, QrCode, CheckCircle2, XCircle, Camera, Keyboard } from "lucide-react";
import { toast } from "sonner";

export default function Staff() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual");
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<{
    valid: boolean;
    passId?: number;
    userCallSign?: string | null;
    userRole?: string;
    reason?: string;
  } | null>(null);
  
  const { data: events, isLoading: eventsLoading } = trpc.staff.getEvents.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: checkInLogs, refetch: refetchLogs } = trpc.staff.getCheckInLogs.useQuery(
    { eventId: parseInt(selectedEventId) },
    { enabled: !!selectedEventId }
  );
  
  const scanMutation = trpc.staff.scanPass.useMutation();
  const markUsedMutation = trpc.staff.markUsed.useMutation();

  const isStaff = user && ["staff", "admin"].includes(user.role);

  // Redirect if not staff
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isStaff) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, isStaff, navigate]);

  const handleScan = async (qrPayload: string) => {
    if (!selectedEventId) {
      toast.error("Select an event first");
      return;
    }
    
    try {
      const result = await scanMutation.mutateAsync({
        qrPayload,
        eventId: parseInt(selectedEventId),
      });
      
      setScanResult(result);
      
      if (!result.valid) {
        toast.error(result.reason || "Invalid pass");
      }
    } catch (error: any) {
      toast.error(error.message || "Scan failed");
    }
  };

  const handleMarkUsed = async () => {
    if (!scanResult?.passId || !selectedEventId) return;
    
    try {
      await markUsedMutation.mutateAsync({
        passId: scanResult.passId,
        eventId: parseInt(selectedEventId),
      });
      
      toast.success("Pass marked as used");
      setScanResult(null);
      setManualCode("");
      refetchLogs();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark pass");
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleScan(manualCode.trim());
  };

  if (authLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !isStaff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="card-noir p-8 text-center max-w-md">
          <h2 className="text-headline mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            Staff access required.
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
      <header className="px-6 py-4 border-b border-border/30 sticky top-0 bg-background/95 backdrop-blur-sm z-40">
        <nav className="flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/" className="text-mono text-sm tracking-[0.3em] text-foreground/80 hover:text-foreground transition-colors">
            COMM@
          </Link>
          <span className="text-xs text-muted-foreground tracking-wider">STAFF PORTAL</span>
        </nav>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-lg mx-auto space-y-8">
          {/* Event Selection */}
          <div className="card-noir p-6 animate-fade-in">
            <h2 className="text-sm text-muted-foreground tracking-wider uppercase mb-4">Select Event</h2>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Choose an event..." />
              </SelectTrigger>
              <SelectContent>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.title} - {event.eventDate && new Date(event.eventDate).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scanner */}
          {selectedEventId && (
            <div className="card-noir p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm text-muted-foreground tracking-wider uppercase">Pass Scanner</h2>
                <div className="flex gap-2">
                  <Button
                    variant={scanMode === "manual" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setScanMode("manual")}
                  >
                    <Keyboard className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={scanMode === "camera" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setScanMode("camera");
                      toast.info("Camera scanning coming soon. Use manual entry for now.");
                    }}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter pass code (PASS-XXXX...)"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="bg-input border-border font-mono"
                    onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  />
                  <Button 
                    onClick={handleManualSubmit}
                    disabled={scanMutation.isPending || !manualCode.trim()}
                  >
                    {scanMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <QrCode className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Scan Result */}
                {scanResult && (
                  <div className={`p-4 rounded border ${
                    scanResult.valid 
                      ? "border-[#9333EA]/30 bg-[#9333EA]/5" 
                      : "border-destructive/30 bg-destructive/5"
                  }`}>
                    <div className="flex items-start gap-3">
                      {scanResult.valid ? (
                        <CheckCircle2 className="w-6 h-6 text-[#9333EA] flex-shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        {scanResult.valid ? (
                          <>
                            <p className="text-[#9333EA] font-medium">Valid Pass</p>
                            <p className="text-sm text-foreground mt-1">
                              {scanResult.userCallSign}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {scanResult.userRole}
                            </p>
                            <Button
                              onClick={handleMarkUsed}
                              disabled={markUsedMutation.isPending}
                              className="mt-3 btn-noir-primary"
                              size="sm"
                            >
                              {markUsedMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Mark as Used"
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-destructive font-medium">Invalid</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {scanResult.reason}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Check-ins */}
          {selectedEventId && checkInLogs && checkInLogs.length > 0 && (
            <div className="card-noir p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <h2 className="text-sm text-muted-foreground tracking-wider uppercase mb-4">
                Recent Check-ins
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {checkInLogs.slice(0, 20).map((log) => (
                  <div 
                    key={log.id} 
                    className={`flex items-center justify-between py-2 border-b border-border/30 last:border-0 ${
                      log.result === "rejected" ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {log.result === "accepted" ? (
                        <CheckCircle2 className="w-4 h-4 text-[#9333EA]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="text-sm">
                        {log.result === "accepted" ? "Accepted" : log.reason || "Rejected"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
