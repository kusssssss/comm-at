import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  QrCode,
  Download,
  Trash2,
} from "lucide-react";

type PassWithEvent = {
  id: number;
  eventId: number;
  userId: number;
  passStatus: string;
  scannableCode: string;
  qrPayload: string;
  isWaitlisted: boolean;
  waitlistPosition: number | null;
  checkedInAt: Date | null;
  revokedReason: string | null;
  event: {
    id: number;
    title: string;
    eventDate: Date;
    startDatetime: Date | null;
    venueName: string | null;
    city: string | null;
  } | null;
};

export default function MyPasses() {
  const { user, loading: authLoading } = useAuth();
  const [selectedPass, setSelectedPass] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [passToCancel, setPassToCancel] = useState<number | null>(null);

  const { data: passes, isLoading, refetch } = trpc.event.getMyPasses.useQuery(
    undefined,
    { enabled: !!user }
  );

  const cancelMutation = trpc.event.cancelPass.useMutation({
    onSuccess: () => {
      toast.success("Pass cancelled successfully");
      refetch();
      setCancelDialogOpen(false);
      setPassToCancel(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Generate QR code when a pass is selected
  useEffect(() => {
    if (selectedPass && passes) {
      const pass = passes.find((p) => p.id === selectedPass);
      if (pass?.qrPayload) {
        QRCode.toDataURL(pass.qrPayload, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        }).then(setQrDataUrl);
      }
    } else {
      setQrDataUrl(null);
    }
  }, [selectedPass, passes]);

  if (authLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
        <p className="text-muted-foreground mb-6">
          Please sign in to view your event passes.
        </p>
        <Button asChild>
          <a href={getLoginUrl()}>Sign In</a>
        </Button>
      </div>
    );
  }

  const getStatusBadge = (pass: NonNullable<typeof passes>[0]) => {
    if (pass.passStatus === "revoked") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Revoked
        </Badge>
      );
    }
    if (pass.passStatus === "used") {
      return (
        <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-400">
          <CheckCircle className="h-3 w-3" />
          Used
        </Badge>
      );
    }
    if (pass.isWaitlisted) {
      return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-400">
          <AlertCircle className="h-3 w-3" />
          Waitlist #{pass.waitlistPosition}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 bg-emerald-500/20 text-emerald-400">
        <CheckCircle className="h-3 w-3" />
        Confirmed
      </Badge>
    );
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "TBA";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const selectedPassData = passes?.find((p) => p.id === selectedPass);

  const handleDownloadQR = () => {
    if (qrDataUrl && selectedPassData) {
      const link = document.createElement("a");
      link.download = `pass-${selectedPassData.scannableCode}.png`;
      link.href = qrDataUrl;
      link.click();
    }
  };

  const upcomingPasses = passes?.filter(
    (p) =>
      p.passStatus !== "revoked" &&
      p.event &&
      p.event.eventDate &&
      new Date(p.event.eventDate) >= new Date()
  ) || [];

  const pastPasses = passes?.filter(
    (p) =>
      p.passStatus !== "revoked" &&
      p.event &&
      p.event.eventDate &&
      new Date(p.event.eventDate) < new Date()
  ) || [];

  const revokedPasses = passes?.filter((p) => p.passStatus === "revoked") || [];

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Passes</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your event passes
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/gatherings">Browse Gatherings</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : passes?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Passes Yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't claimed any event passes yet. Browse upcoming
              gatherings to get started.
            </p>
            <Button asChild>
              <Link href="/gatherings">Browse Gatherings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Passes */}
          {upcomingPasses.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming ({upcomingPasses.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingPasses.map((pass) => (
                  <Card
                    key={pass.id}
                    className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPass(pass.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-1">
                          {pass.event?.title || "Unknown Event"}
                        </CardTitle>
                        {getStatusBadge(pass)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(pass.event?.eventDate)}</span>
                      </div>
                      {pass.event?.startDatetime && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(pass.event.startDatetime)}</span>
                        </div>
                      )}
                      {pass.event?.venueName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">
                            {pass.event.venueName}
                          </span>
                        </div>
                      )}
                      <div className="pt-2 flex items-center justify-between">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {pass.scannableCode}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPass(pass.id);
                          }}
                        >
                          <QrCode className="h-4 w-4" />
                          QR
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Past Passes */}
          {pastPasses.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                Past Events ({pastPasses.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastPasses.map((pass) => (
                  <Card
                    key={pass.id}
                    className="overflow-hidden opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-1">
                          {pass.event?.title || "Unknown Event"}
                        </CardTitle>
                        {getStatusBadge(pass)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(pass.event?.eventDate)}</span>
                      </div>
                      {pass.checkedInAt && (
                        <p className="text-xs text-green-400">
                          Checked in at{" "}
                          {new Date(pass.checkedInAt).toLocaleTimeString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Revoked Passes */}
          {revokedPasses.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Revoked ({revokedPasses.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {revokedPasses.map((pass) => (
                  <Card
                    key={pass.id}
                    className="overflow-hidden opacity-50 border-destructive/30"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-1">
                          {pass.event?.title || "Unknown Event"}
                        </CardTitle>
                        {getStatusBadge(pass)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {pass.revokedReason || "Pass was revoked"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog
        open={selectedPass !== null}
        onOpenChange={(open) => !open && setSelectedPass(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPassData?.event?.title}</DialogTitle>
            <DialogDescription>
              Show this QR code at the door for check-in
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Pass QR Code"
                className="rounded-lg border"
              />
            ) : (
              <Skeleton className="w-[300px] h-[300px]" />
            )}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Pass Code</p>
              <code className="text-lg font-mono bg-muted px-3 py-1 rounded">
                {selectedPassData?.scannableCode}
              </code>
            </div>
            {selectedPassData?.isWaitlisted && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                <p className="text-amber-400 text-sm">
                  You are on the waitlist (position #
                  {selectedPassData.waitlistPosition}). This pass will be
                  activated if a spot opens up.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleDownloadQR}
            >
              <Download className="h-4 w-4" />
              Download QR
            </Button>
            {selectedPassData &&
              !selectedPassData.isWaitlisted &&
              selectedPassData.passStatus === "claimed" && (
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => {
                    setPassToCancel(selectedPassData.event?.id || null);
                    setCancelDialogOpen(true);
                    setSelectedPass(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Cancel Pass
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Pass?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this pass? This action cannot be
              undone. If there's a waitlist, the next person will be promoted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Pass
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (passToCancel) {
                  cancelMutation.mutate({ eventId: passToCancel });
                }
              }}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
