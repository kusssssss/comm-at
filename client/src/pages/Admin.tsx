import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useParams, useLocation } from "wouter";
import { 
  Loader2, Plus, Download, Eye, Ban, UserX, Shield, 
  Calendar, Package, Users, FileText, AlertTriangle, CheckCircle2,
  Image, Video, Upload, Trash2, ExternalLink, ClipboardCheck, Clock,
  Building2, TrendingUp, Key, Lock, Unlock, RefreshCw, Phone
} from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const { section } = useParams<{ section?: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const activeTab = section || "drops";

  const isAdmin = user?.role === "admin";

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isAdmin) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="card-noir p-8 text-center max-w-md">
          <h2 className="text-headline mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Admin access required.</p>
          <a href={getLoginUrl()} className="btn-noir-primary inline-block">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border/30 sticky top-0 bg-background/95 backdrop-blur-sm z-40">
        <nav className="flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="text-mono text-sm tracking-[0.3em] text-foreground/80 hover:text-foreground transition-colors">
            COMM@
          </Link>
          <span className="text-xs text-[#3B82F6] tracking-wider">ADMIN</span>
        </nav>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => navigate(`/admin/${v}`)}>
            <TabsList className="bg-card border border-border/30 mb-8 flex-wrap">
              <TabsTrigger value="clearance" className="data-[state=active]:bg-[#3B82F6]/10">
                <ClipboardCheck className="w-4 h-4 mr-2" />Clearance
              </TabsTrigger>
              <TabsTrigger value="drops" className="data-[state=active]:bg-[#3B82F6]/10">
                <Package className="w-4 h-4 mr-2" />Drops
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-[#3B82F6]/10">
                <Calendar className="w-4 h-4 mr-2" />Events
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-[#3B82F6]/10">
                <Users className="w-4 h-4 mr-2" />Users
              </TabsTrigger>
              <TabsTrigger value="doctrine" className="data-[state=active]:bg-[#3B82F6]/10">
                <FileText className="w-4 h-4 mr-2" />Doctrine
              </TabsTrigger>
              <TabsTrigger value="ugc" className="data-[state=active]:bg-[#3B82F6]/10">
                <Image className="w-4 h-4 mr-2" />UGC
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-[#3B82F6]/10">
                <Shield className="w-4 h-4 mr-2" />Logs
              </TabsTrigger>
              <TabsTrigger value="sponsors" className="data-[state=active]:bg-[#3B82F6]/10">
                <Building2 className="w-4 h-4 mr-2" />Sponsors
              </TabsTrigger>
              <TabsTrigger value="credentials" className="data-[state=active]:bg-[#3B82F6]/10">
                <Key className="w-4 h-4 mr-2" />Credentials
              </TabsTrigger>
              <TabsTrigger value="invites" className="data-[state=active]:bg-[#3B82F6]/10">
                <Lock className="w-4 h-4 mr-2" />Invites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clearance"><ClearancePanel /></TabsContent>
            <TabsContent value="drops"><DropsPanel /></TabsContent>
            <TabsContent value="events"><EventsPanel /></TabsContent>
            <TabsContent value="users"><UsersPanel /></TabsContent>
            <TabsContent value="doctrine"><DoctrinePanel /></TabsContent>
            <TabsContent value="ugc"><UgcPanel /></TabsContent>
            <TabsContent value="logs"><LogsPanel /></TabsContent>
            <TabsContent value="sponsors"><SponsorsPanel /></TabsContent>
            <TabsContent value="credentials"><CredentialsPanel /></TabsContent>
            <TabsContent value="invites"><InvitesPanel /></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// CLEARANCE PANEL
// ============================================================================
function ClearancePanel() {
  const { data: requests, refetch } = trpc.clearance.listPending.useQuery();
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  
  const approveMutation = trpc.clearance.approve.useMutation({
    onSuccess: (data) => {
      toast.success(`Approved! Clearance code: ${data.clearanceCode}`);
      refetch();
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: (err) => toast.error(err.message),
  });
  
  const denyMutation = trpc.clearance.deny.useMutation({
    onSuccess: () => {
      toast.success("Request denied");
      refetch();
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: (err) => toast.error(err.message),
  });

  const pendingRequests = requests?.filter((r: any) => r.status === 'pending') || [];
  const processedRequests = requests?.filter((r: any) => r.status !== 'pending') || [];

  return (
    <div className="space-y-8">
      {/* Pending Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline">Pending Clearance Requests</h2>
          <span className="text-xs text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-1 rounded">
            {pendingRequests.length} pending
          </span>
        </div>
        
        {pendingRequests.length === 0 ? (
          <div className="card-noir p-8 text-center">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="card-noir p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-foreground font-medium">
                        {request.user?.name || `User #${request.userId}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Why do you protect the culture?
                      </p>
                      <p className="text-sm text-foreground/90 bg-background/50 p-3 rounded">
                        {request.reason}
                      </p>
                    </div>
                    
                    {request.vouchCallSign && (
                      <p className="text-xs text-muted-foreground">
                        Vouched by: <span className="text-[#3B82F6]">{request.vouchCallSign}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                {selectedRequest === request.id ? (
                  <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
                    <Textarea 
                      placeholder="Admin notes (optional)"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="bg-background/50"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => approveMutation.mutate({ requestId: request.id })}
                        disabled={approveMutation.isPending}
                        className="btn-noir-primary flex-1"
                      >
                        {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
                      </Button>
                      <Button 
                        onClick={() => denyMutation.mutate({ requestId: request.id, reason: adminNotes || undefined })}
                        disabled={denyMutation.isPending}
                        variant="destructive"
                        className="flex-1"
                      >
                        {denyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deny"}
                      </Button>
                      <Button 
                        onClick={() => { setSelectedRequest(null); setAdminNotes(""); }}
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <Button 
                      onClick={() => setSelectedRequest(request.id)}
                      variant="outline"
                      className="w-full"
                    >
                      Review Request
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Processed Requests */}
      <div>
        <h2 className="text-headline mb-4">Processed Requests</h2>
        <div className="card-noir p-4 max-h-96 overflow-y-auto">
          {processedRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No processed requests yet</p>
          ) : (
            processedRequests.map((request: any) => (
              <div key={request.id} className="flex items-start justify-between py-3 border-b border-border/30 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      request.status === 'approved' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' : 'bg-destructive/20 text-destructive'
                    }`}>
                      {request.status}
                    </span>
                    <span className="text-sm text-foreground">
                      {request.user?.name || `User #${request.userId}`}
                    </span>
                  </div>
                  {request.adminNotes && (
                    <p className="text-xs text-muted-foreground mt-1">Notes: {request.adminNotes}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(request.processedAt || request.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DROPS PANEL
// ============================================================================
function DropsPanel() {
  const [showCreate, setShowCreate] = useState(false);
  const [newDrop, setNewDrop] = useState({ artistName: "", title: "", editionSize: 10 });
  const [selectedDrop, setSelectedDrop] = useState<number | null>(null);
  const [generateCount, setGenerateCount] = useState(10);
  
  const { data: drops, refetch } = trpc.drop.list.useQuery();
  const { data: artifacts } = trpc.artifact.getByDrop.useQuery(
    { dropId: selectedDrop! },
    { enabled: !!selectedDrop }
  );
  
  const createMutation = trpc.drop.create.useMutation({
    onSuccess: () => { toast.success("Drop created"); refetch(); setShowCreate(false); }
  });
  const generateMutation = trpc.drop.generateArtifacts.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.serials.length} artifacts`);
      // Download CSV
      const csv = data.serials.map((s, i) => `${s},${data.codes[i]}`).join("\n");
      const blob = new Blob([`Serial,Activation Code\n${csv}`], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `artifacts-${selectedDrop}.csv`;
      a.click();
    }
  });
  const publishMutation = trpc.drop.publish.useMutation({
    onSuccess: () => { toast.success("Drop published"); refetch(); }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-headline">Drops</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="btn-noir-primary"><Plus className="w-4 h-4 mr-2" />New Drop</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Create Drop</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Artist Name" value={newDrop.artistName} 
                onChange={(e) => setNewDrop({...newDrop, artistName: e.target.value})} />
              <Input placeholder="Title" value={newDrop.title}
                onChange={(e) => setNewDrop({...newDrop, title: e.target.value})} />
              <Input type="number" placeholder="Edition Size" value={newDrop.editionSize}
                onChange={(e) => setNewDrop({...newDrop, editionSize: parseInt(e.target.value) || 10})} />
              <Button onClick={() => createMutation.mutate(newDrop)} disabled={createMutation.isPending}
                className="w-full btn-noir-primary">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {drops?.map((drop) => (
          <div key={drop.id} className="card-noir p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-foreground font-medium">{drop.artistName} - {drop.title}</h3>
                <p className="text-sm text-muted-foreground">Edition: {drop.editionSize}</p>
                <span className={`text-xs ${drop.status === "published" ? "text-[#3B82F6]" : "text-muted-foreground"}`}>
                  {drop.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedDrop(drop.id)}>
                  <Eye className="w-4 h-4" />
                </Button>
                {drop.status === "draft" && (
                  <Button variant="ghost" size="sm" onClick={() => publishMutation.mutate({ id: drop.id })}>
                    Publish
                  </Button>
                )}
              </div>
            </div>
            
            {selectedDrop === drop.id && (
              <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
                <div className="flex gap-2">
                  <Input type="number" value={generateCount} 
                    onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                    className="w-24" />
                  <Button onClick={() => generateMutation.mutate({ dropId: drop.id, count: generateCount })}
                    disabled={generateMutation.isPending}>
                    {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                      <><Download className="w-4 h-4 mr-2" />Generate & Export</>}
                  </Button>
                </div>
                {artifacts && artifacts.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {artifacts.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-sm py-1">
                        <span className="font-mono">{a.serialNumber}</span>
                        <span className={a.status === "marked" ? "text-[#3B82F6]" : "text-muted-foreground"}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EVENTS PANEL
// ============================================================================
function EventsPanel() {
  const [showCreate, setShowCreate] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "", city: "South Jakarta", description: "", rules: "",
    capacity: 50, requiredRole: "marked_initiate" as const,
    locationText: "", eventDate: ""
  });
  
  const { data: events, refetch } = trpc.event.listAll.useQuery();
  const createMutation = trpc.event.create.useMutation({
    onSuccess: () => { toast.success("Event created"); refetch(); setShowCreate(false); }
  });
  const publishMutation = trpc.event.publish.useMutation({
    onSuccess: () => { toast.success("Event published"); refetch(); }
  });
  const cancelMutation = trpc.event.cancel.useMutation({
    onSuccess: () => { toast.success("Event cancelled"); refetch(); }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-headline">Events</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="btn-noir-primary"><Plus className="w-4 h-4 mr-2" />New Event</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <Input placeholder="Title" value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} />
              <Input placeholder="City" value={newEvent.city}
                onChange={(e) => setNewEvent({...newEvent, city: e.target.value})} />
              <Textarea placeholder="Description" value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} />
              <Textarea placeholder="Rules" value={newEvent.rules}
                onChange={(e) => setNewEvent({...newEvent, rules: e.target.value})} />
              <Input type="number" placeholder="Capacity" value={newEvent.capacity}
                onChange={(e) => setNewEvent({...newEvent, capacity: parseInt(e.target.value) || 50})} />
              <Select value={newEvent.requiredRole} 
                onValueChange={(v: any) => setNewEvent({...newEvent, requiredRole: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="marked_initiate">Initiate+</SelectItem>
                  <SelectItem value="marked_member">Member+</SelectItem>
                  <SelectItem value="marked_inner_circle">Inner Circle</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Location (hidden until reveal)" value={newEvent.locationText}
                onChange={(e) => setNewEvent({...newEvent, locationText: e.target.value})} />
              <Input type="datetime-local" value={newEvent.eventDate}
                onChange={(e) => setNewEvent({...newEvent, eventDate: e.target.value})} />
              <Button onClick={() => createMutation.mutate({
                ...newEvent,
                eventDate: newEvent.eventDate ? new Date(newEvent.eventDate) : undefined
              })} disabled={createMutation.isPending} className="w-full btn-noir-primary">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {events?.map((event) => (
          <div key={event.id} className="card-noir p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-foreground font-medium">{event.title}</h3>
                <p className="text-sm text-muted-foreground">{event.city}</p>
                <p className="text-xs text-muted-foreground">
                  {event.eventDate && new Date(event.eventDate).toLocaleString()}
                </p>
                <span className={`text-xs ${
                  event.status === "published" ? "text-[#3B82F6]" : 
                  event.status === "cancelled" ? "text-destructive" : "text-muted-foreground"
                }`}>{event.status}</span>
              </div>
              <div className="flex gap-2">
                {event.status === "draft" && (
                  <Button variant="ghost" size="sm" onClick={() => publishMutation.mutate({ id: event.id })}>
                    Publish
                  </Button>
                )}
                {event.status === "published" && (
                  <Button variant="ghost" size="sm" onClick={() => cancelMutation.mutate({ id: event.id })}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// USERS PANEL
// ============================================================================
function UsersPanel() {
  const { data: users, refetch } = trpc.user.list.useQuery();
  const revokeMutation = trpc.user.revoke.useMutation({
    onSuccess: () => { toast.success("User revoked"); refetch(); }
  });
  const banMutation = trpc.user.ban.useMutation({
    onSuccess: () => { toast.success("User banned"); refetch(); }
  });
  const changeRoleMutation = trpc.user.changeRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); refetch(); }
  });

  return (
    <div className="space-y-6">
      <h2 className="text-headline">Users</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left py-2 text-muted-foreground font-normal">Call Sign</th>
              <th className="text-left py-2 text-muted-foreground font-normal">Role</th>
              <th className="text-left py-2 text-muted-foreground font-normal">Status</th>
              <th className="text-left py-2 text-muted-foreground font-normal">Chapter</th>
              <th className="text-right py-2 text-muted-foreground font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-border/30">
                <td className="py-2">{u.callSign || u.name || u.openId?.slice(0, 8) || 'Unknown'}</td>
                <td className="py-2">
                  <Select value={u.role} onValueChange={(v: any) => changeRoleMutation.mutate({ userId: u.id, role: v })}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="marked_initiate">Initiate</SelectItem>
                      <SelectItem value="marked_member">Member</SelectItem>
                      <SelectItem value="marked_inner_circle">Inner Circle</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-2">
                  <span className={u.status === "active" ? "text-[#3B82F6]" : "text-destructive"}>
                    {u.status}
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">{u.chapter}</td>
                <td className="py-2 text-right">
                  {u.status === "active" && (
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" 
                        onClick={() => revokeMutation.mutate({ userId: u.id, reason: "Admin action" })}>
                        <UserX className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm"
                        onClick={() => banMutation.mutate({ userId: u.id })}>
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// DOCTRINE PANEL
// ============================================================================
function DoctrinePanel() {
  const [showCreate, setShowCreate] = useState(false);
  const [newCard, setNewCard] = useState({ title: "", content: "", isPinned: false });
  
  const { data: cards, refetch } = trpc.doctrine.list.useQuery();
  const createMutation = trpc.doctrine.create.useMutation({
    onSuccess: () => { toast.success("Card created"); refetch(); setShowCreate(false); }
  });
  const deleteMutation = trpc.doctrine.delete.useMutation({
    onSuccess: () => { toast.success("Card deleted"); refetch(); }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-headline">Doctrine Cards</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="btn-noir-primary"><Plus className="w-4 h-4 mr-2" />New Card</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Create Doctrine Card</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title" value={newCard.title}
                onChange={(e) => setNewCard({...newCard, title: e.target.value})} />
              <Textarea placeholder="Content" value={newCard.content} rows={5}
                onChange={(e) => setNewCard({...newCard, content: e.target.value})} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={newCard.isPinned}
                  onChange={(e) => setNewCard({...newCard, isPinned: e.target.checked})} />
                <span className="text-sm">Pin to top</span>
              </label>
              <Button onClick={() => createMutation.mutate(newCard)} disabled={createMutation.isPending}
                className="w-full btn-noir-primary">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {cards?.map((card) => (
          <div key={card.id} className={`card-noir p-4 ${card.isPinned ? "border-[#3B82F6]/20" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                {card.isPinned && <span className="text-xs text-[#3B82F6]">PINNED</span>}
                <h3 className="text-foreground font-medium">{card.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{card.content}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: card.id })}>
                <AlertTriangle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// UGC PANEL
// ============================================================================
function UgcPanel() {
  const [showUpload, setShowUpload] = useState(false);
  const [newUgc, setNewUgc] = useState({
    type: 'image' as 'image' | 'video',
    storageUrl: '',
    thumbnailUrl: '',
    dropId: undefined as number | undefined,
    artifactId: undefined as number | undefined,
    caption: '',
    visibility: 'public' as 'public' | 'inside_only',
    sortOrder: 0,
    consentNote: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const { data: ugcList, refetch } = trpc.ugc.list.useQuery();
  const { data: drops } = trpc.drop.list.useQuery();
  
  const createMutation = trpc.ugc.create.useMutation({
    onSuccess: () => { 
      toast.success('UGC uploaded'); 
      refetch(); 
      setShowUpload(false);
      setNewUgc({
        type: 'image', storageUrl: '', thumbnailUrl: '', dropId: undefined,
        artifactId: undefined, caption: '', visibility: 'public', sortOrder: 0, consentNote: ''
      });
    },
    onError: (err) => toast.error(err.message)
  });
  
  const deleteMutation = trpc.ugc.delete.useMutation({
    onSuccess: () => { toast.success('UGC deleted'); refetch(); }
  });
  
  const updateMutation = trpc.ugc.update.useMutation({
    onSuccess: () => { toast.success('UGC updated'); refetch(); }
  });

  // Handle file upload via server endpoint
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const { url } = await response.json();
      setNewUgc({ ...newUgc, storageUrl: url });
      
      // Auto-detect type
      if (file.type.startsWith('video/')) {
        setNewUgc(prev => ({ ...prev, type: 'video', storageUrl: url }));
      } else {
        setNewUgc(prev => ({ ...prev, type: 'image', storageUrl: url }));
      }
      
      toast.success('File uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-headline">Curated UGC</h2>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button className="btn-noir-primary"><Upload className="w-4 h-4 mr-2" />Upload UGC</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>Upload UGC Media</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Media File</label>
                <Input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploadingFile} />
                {uploadingFile && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                {newUgc.storageUrl && (
                  <p className="text-xs text-[#3B82F6] mt-1 truncate">Uploaded: {newUgc.storageUrl}</p>
                )}
              </div>
              
              {/* Or paste URL */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Or paste URL</label>
                <Input placeholder="https://..." value={newUgc.storageUrl}
                  onChange={(e) => setNewUgc({...newUgc, storageUrl: e.target.value})} />
              </div>
              
              {/* Type */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Type</label>
                <Select value={newUgc.type} onValueChange={(v) => setNewUgc({...newUgc, type: v as 'image' | 'video'})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Thumbnail (for video) */}
              {newUgc.type === 'video' && (
                <Input placeholder="Thumbnail URL (optional)" value={newUgc.thumbnailUrl}
                  onChange={(e) => setNewUgc({...newUgc, thumbnailUrl: e.target.value})} />
              )}
              
              {/* Assign to Drop */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Assign to Drop (required)</label>
                <Select value={newUgc.dropId?.toString() || ''} 
                  onValueChange={(v) => setNewUgc({...newUgc, dropId: v ? parseInt(v) : undefined})}>
                  <SelectTrigger><SelectValue placeholder="Select Drop" /></SelectTrigger>
                  <SelectContent>
                    {drops?.map((drop) => (
                      <SelectItem key={drop.id} value={drop.id.toString()}>
                        {drop.artistName} - {drop.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Caption */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Caption (max 40 chars)</label>
                <Input placeholder="Marked. South Jakarta. Night One." value={newUgc.caption}
                  maxLength={40}
                  onChange={(e) => setNewUgc({...newUgc, caption: e.target.value})} />
                <p className="text-xs text-muted-foreground mt-1">{newUgc.caption.length}/40</p>
              </div>
              
              {/* Visibility */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Visibility</label>
                <Select value={newUgc.visibility} 
                  onValueChange={(v) => setNewUgc({...newUgc, visibility: v as 'public' | 'inside_only'})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="inside_only">Inside Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Sort Order */}
              <Input type="number" placeholder="Sort Order" value={newUgc.sortOrder}
                onChange={(e) => setNewUgc({...newUgc, sortOrder: parseInt(e.target.value) || 0})} />
              
              {/* Consent Note */}
              <Textarea placeholder="Consent note (optional)" value={newUgc.consentNote}
                onChange={(e) => setNewUgc({...newUgc, consentNote: e.target.value})} />
              
              <Button onClick={() => {
                if (!newUgc.storageUrl) { toast.error('Media URL required'); return; }
                if (!newUgc.dropId) { toast.error('Drop assignment required'); return; }
                createMutation.mutate({
                  ...newUgc,
                  thumbnailUrl: newUgc.thumbnailUrl || undefined,
                  artifactId: newUgc.artifactId || undefined,
                  caption: newUgc.caption || undefined,
                  consentNote: newUgc.consentNote || undefined,
                });
              }} disabled={createMutation.isPending} className="w-full btn-noir-primary">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* UGC Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ugcList?.map((ugc) => (
          <div key={ugc.id} className="card-noir overflow-hidden group relative">
            {ugc.type === 'image' ? (
              <img src={ugc.storageUrl} alt={ugc.caption || 'UGC'} 
                className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square bg-muted flex items-center justify-center">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent 
              opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              {ugc.caption && (
                <p className="text-xs text-foreground/90 mb-2">{ugc.caption}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {ugc.visibility === 'inside_only' ? 'Inside' : 'Public'}
                </span>
                <div className="flex gap-1">
                  <a href={ugc.storageUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1 hover:bg-white/10 rounded">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button onClick={() => deleteMutation.mutate({ id: ugc.id })}
                    className="p-1 hover:bg-destructive/20 rounded text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Drop badge */}
            {ugc.dropId && (
              <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs">
                Drop #{ugc.dropId}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {(!ugcList || ugcList.length === 0) && (
        <div className="card-noir p-12 text-center">
          <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No UGC uploaded yet</p>
          <p className="text-xs text-muted-foreground mt-2">Upload photos and videos to display on drop pages</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LOGS PANEL
// ============================================================================
function LogsPanel() {
  const { data: auditLogs } = trpc.audit.getLogs.useQuery();
  const { data: markingLogs } = trpc.audit.getMarkingLogs.useQuery();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-headline mb-4">Audit Logs</h2>
        <div className="card-noir p-4 max-h-96 overflow-y-auto">
          {auditLogs?.map((log) => (
            <div key={log.id} className="flex items-start justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <span className="text-xs text-[#3B82F6]">{log.action}</span>
                <p className="text-sm text-foreground">{log.description || log.targetIdentifier}</p>
                <p className="text-xs text-muted-foreground">by {log.userName}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-headline mb-4">Marking Logs</h2>
        <div className="card-noir p-4 max-h-96 overflow-y-auto">
          {markingLogs?.map((log) => (
            <div key={log.id} className="flex items-start justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2">
                {log.result === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#3B82F6]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                )}
                <div>
                  <p className="text-sm text-foreground">Artifact #{log.artifactId}</p>
                  {log.failureReason && (
                    <p className="text-xs text-destructive">{log.failureReason}</p>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// SPONSORS PANEL
// ============================================================================
function SponsorsPanel() {
  const { data: sponsors, refetch: refetchSponsors } = trpc.sponsor.adminList.useQuery();
  const { data: inquiries, refetch: refetchInquiries } = trpc.sponsor.inquiries.useQuery({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<any>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logoUrl: "",
    websiteUrl: "",
    tier: "bronze" as "platinum" | "gold" | "silver" | "bronze",
    status: "pending" as "active" | "pending" | "expired" | "paused",
    contactName: "",
    contactEmail: "",
    showOnHomepage: true,
    displayOrder: 0,
  });
  
  const createMutation = trpc.sponsor.create.useMutation({
    onSuccess: () => {
      toast.success("Sponsor created");
      refetchSponsors();
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });
  
  const updateMutation = trpc.sponsor.update.useMutation({
    onSuccess: () => {
      toast.success("Sponsor updated");
      refetchSponsors();
      setEditingSponsor(null);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });
  
  const deleteMutation = trpc.sponsor.delete.useMutation({
    onSuccess: () => {
      toast.success("Sponsor deleted");
      refetchSponsors();
    },
    onError: (err) => toast.error(err.message),
  });
  
  const updateInquiryMutation = trpc.sponsor.updateInquiry.useMutation({
    onSuccess: () => {
      toast.success("Inquiry updated");
      refetchInquiries();
      setSelectedInquiry(null);
    },
    onError: (err) => toast.error(err.message),
  });
  
  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      logoUrl: "",
      websiteUrl: "",
      tier: "bronze",
      status: "pending",
      contactName: "",
      contactEmail: "",
      showOnHomepage: true,
      displayOrder: 0,
    });
  };
  
  const handleEdit = (sponsor: any) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      slug: sponsor.slug,
      description: sponsor.description || "",
      logoUrl: sponsor.logoUrl || "",
      websiteUrl: sponsor.websiteUrl || "",
      tier: sponsor.tier,
      status: sponsor.status,
      contactName: sponsor.contactName || "",
      contactEmail: sponsor.contactEmail || "",
      showOnHomepage: sponsor.showOnHomepage,
      displayOrder: sponsor.displayOrder,
    });
  };
  
  const handleSubmit = () => {
    if (editingSponsor) {
      updateMutation.mutate({ id: editingSponsor.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };
  
  const tierColors: Record<string, string> = {
    platinum: "bg-zinc-300/20 text-zinc-200 border-zinc-300/30",
    gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    silver: "bg-gray-400/20 text-gray-300 border-gray-400/30",
    bronze: "bg-orange-700/20 text-orange-400 border-orange-700/30",
  };
  
  const statusColors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    expired: "bg-red-500/20 text-red-400",
    paused: "bg-gray-500/20 text-gray-400",
  };
  
  const pendingInquiries = inquiries?.filter((i: any) => i.status === 'new') || [];
  
  return (
    <div className="space-y-8">
      {/* Pending Inquiries */}
      {pendingInquiries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-headline">New Inquiries</h2>
            <span className="text-xs text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-1 rounded">
              {pendingInquiries.length} new
            </span>
          </div>
          
          <div className="space-y-3">
            {pendingInquiries.map((inquiry: any) => (
              <div key={inquiry.id} className="card-noir p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white">{inquiry.companyName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {inquiry.contactName} • {inquiry.contactEmail}
                    </p>
                    {inquiry.interestedTier && (
                      <span className={`text-xs px-2 py-0.5 rounded border mt-2 inline-block ${tierColors[inquiry.interestedTier]}`}>
                        {inquiry.interestedTier}
                      </span>
                    )}
                    {inquiry.message && (
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2">{inquiry.message}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedInquiry(inquiry)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Sponsors List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline">Sponsors</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#3B82F6] hover:bg-[#1D4ED8]">
                <Plus className="w-4 h-4 mr-2" />Add Sponsor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Sponsor</DialogTitle>
              </DialogHeader>
              <SponsorForm 
                formData={formData} 
                setFormData={setFormData} 
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {!sponsors || sponsors.length === 0 ? (
          <div className="card-noir p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No sponsors yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sponsors.map((sponsor: any) => (
              <div key={sponsor.id} className="card-noir p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {sponsor.logoUrl ? (
                      <img 
                        src={sponsor.logoUrl} 
                        alt={sponsor.name}
                        className="w-12 h-12 object-contain bg-zinc-900 rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-zinc-900 rounded flex items-center justify-center text-xl font-bold text-gray-500">
                        {sponsor.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-white">{sponsor.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded border ${tierColors[sponsor.tier]}`}>
                          {sponsor.tier}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[sponsor.status]}`}>
                          {sponsor.status}
                        </span>
                        {sponsor.showOnHomepage && (
                          <span className="text-xs text-blue-400">Homepage</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        <span className="text-white">{sponsor.totalImpressions.toLocaleString()}</span> impressions
                      </p>
                      <p className="text-muted-foreground">
                        <span className="text-white">{sponsor.totalClicks.toLocaleString()}</span> clicks
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/sponsor/${sponsor.id}/analytics`}>
                        <Button size="sm" variant="outline">
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(sponsor)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => {
                          if (confirm("Delete this sponsor?")) {
                            deleteMutation.mutate({ id: sponsor.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Edit Sponsor Dialog */}
      <Dialog open={!!editingSponsor} onOpenChange={(open) => !open && setEditingSponsor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sponsor</DialogTitle>
          </DialogHeader>
          <SponsorForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* Review Inquiry Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Inquiry</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{selectedInquiry.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p>{selectedInquiry.contactName}</p>
                <p className="text-sm text-muted-foreground">{selectedInquiry.contactEmail}</p>
                {selectedInquiry.contactPhone && (
                  <p className="text-sm text-muted-foreground">{selectedInquiry.contactPhone}</p>
                )}
              </div>
              {selectedInquiry.interestedTier && (
                <div>
                  <p className="text-sm text-muted-foreground">Interested Tier</p>
                  <span className={`text-xs px-2 py-0.5 rounded border ${tierColors[selectedInquiry.interestedTier]}`}>
                    {selectedInquiry.interestedTier}
                  </span>
                </div>
              )}
              {selectedInquiry.message && (
                <div>
                  <p className="text-sm text-muted-foreground">Message</p>
                  <p className="text-sm">{selectedInquiry.message}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => updateInquiryMutation.mutate({ id: selectedInquiry.id, status: 'contacted' })}
                  disabled={updateInquiryMutation.isPending}
                >
                  Mark as Contacted
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateInquiryMutation.mutate({ id: selectedInquiry.id, status: 'converted' })}
                  disabled={updateInquiryMutation.isPending}
                >
                  Convert to Sponsor
                </Button>
                <Button
                  variant="outline"
                  className="text-red-400"
                  onClick={() => updateInquiryMutation.mutate({ id: selectedInquiry.id, status: 'rejected' })}
                  disabled={updateInquiryMutation.isPending}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SponsorForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  isLoading 
}: { 
  formData: any; 
  setFormData: (data: any) => void; 
  onSubmit: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Sponsor Name"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Slug *</label>
          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="sponsor-slug"
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm text-muted-foreground">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the sponsor"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Logo URL</label>
          <Input
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Website URL</label>
          <Input
            value={formData.websiteUrl}
            onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Tier *</label>
          <Select
            value={formData.tier}
            onValueChange={(value) => setFormData({ ...formData, tier: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="platinum">Platinum</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Status</label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Contact Name</label>
          <Input
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Contact Email</label>
          <Input
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            placeholder="john@company.com"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Display Order</label>
          <Input
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="showOnHomepage"
            checked={formData.showOnHomepage}
            onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
            className="rounded border-gray-600"
          />
          <label htmlFor="showOnHomepage" className="text-sm">Show on Homepage</label>
        </div>
      </div>
      
      <Button 
        onClick={onSubmit} 
        disabled={isLoading || !formData.name || !formData.slug}
        className="w-full bg-[#3B82F6] hover:bg-[#1D4ED8]"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save Sponsor
      </Button>
    </div>
  );
}


// ============================================================================
// CREDENTIALS PANEL - Custom Authentication Management
// ============================================================================
function CredentialsPanel() {
  const { data: users, refetch, isLoading } = trpc.credentials.listUsers.useQuery();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  
  // Create credentials form
  const [createForm, setCreateForm] = useState({
    userId: 0,
    username: "",
    password: "",
    phoneNumber: "",
  });
  
  const createMutation = trpc.credentials.create.useMutation({
    onSuccess: () => {
      toast.success("Credentials created successfully");
      setShowCreateDialog(false);
      setCreateForm({ userId: 0, username: "", password: "", phoneNumber: "" });
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  
  const resetPasswordMutation = trpc.credentials.resetPassword.useMutation({
    onSuccess: (data) => {
      setTempPassword(data.tempPassword);
      setShowResetDialog(true);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  
  const unlockMutation = trpc.credentials.unlock.useMutation({
    onSuccess: () => {
      toast.success("Account unlocked");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  
  const deleteMutation = trpc.credentials.delete.useMutation({
    onSuccess: () => {
      toast.success("Credentials deleted");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  
  const usersWithoutCredentials = users?.filter(u => !u.hasCredentials) || [];
  const usersWithCredentials = users?.filter(u => u.hasCredentials) || [];
  
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm({ ...createForm, password });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">User Credentials</h2>
          <p className="text-sm text-muted-foreground">Manage custom login credentials for members</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#3B82F6] hover:bg-[#1D4ED8]">
              <Plus className="w-4 h-4 mr-2" />
              Create Credentials
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create User Credentials</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-muted-foreground">Select User *</label>
                <Select
                  value={createForm.userId.toString()}
                  onValueChange={(v) => setCreateForm({ ...createForm, userId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {usersWithoutCredentials.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name || u.email || `User #${u.id}`} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground">Username *</label>
                <Input
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="e.g., john_doe"
                />
                <p className="text-xs text-muted-foreground mt-1">Letters, numbers, and underscores only</p>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground">Password *</label>
                <div className="flex gap-2">
                  <Input
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                  />
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Generate
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground">Phone Number (optional)</label>
                <Input
                  value={createForm.phoneNumber}
                  onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                  placeholder="+62 812 1234 5678"
                />
              </div>
              
              <Button
                onClick={() => createMutation.mutate(createForm)}
                disabled={createMutation.isPending || !createForm.userId || !createForm.username || createForm.password.length < 8}
                className="w-full bg-[#3B82F6] hover:bg-[#1D4ED8]"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Credentials
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              A temporary password has been generated. Share this with the user securely.
            </p>
            <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333333]">
              <p className="text-xs text-muted-foreground mb-1">Temporary Password</p>
              <p className="text-lg font-mono text-white">{tempPassword}</p>
            </div>
            <p className="text-xs text-amber-500">
              The user will be required to change this password on first login.
            </p>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(tempPassword || "");
                toast.success("Password copied to clipboard");
              }}
              variant="outline"
              className="w-full"
            >
              Copy to Clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Users with Credentials */}
      <div className="card-noir p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-[#3B82F6]" />
          Users with Login Credentials ({usersWithCredentials.length})
        </h3>
        
        {usersWithCredentials.length === 0 ? (
          <p className="text-muted-foreground text-sm">No users have custom credentials yet.</p>
        ) : (
          <div className="space-y-3">
            {usersWithCredentials.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg border border-[#222222]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-400">
                      {(user.name || user.username || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.name || user.username}</p>
                    <p className="text-xs text-muted-foreground">
                      @{user.username} • {user.role}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Status badges */}
                  {user.isLocked && (
                    <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                      <Lock className="w-3 h-3 inline mr-1" />
                      Locked
                    </span>
                  )}
                  {user.mustChangePassword && (
                    <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded">
                      Must Change Password
                    </span>
                  )}
                  {user.phoneVerified && (
                    <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                      <Phone className="w-3 h-3 inline mr-1" />
                      Verified
                    </span>
                  )}
                  
                  {/* Actions */}
                  {user.isLocked && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unlockMutation.mutate({ userId: user.id })}
                      disabled={unlockMutation.isPending}
                    >
                      <Unlock className="w-4 h-4 mr-1" />
                      Unlock
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(user.id);
                      resetPasswordMutation.mutate({ userId: user.id });
                    }}
                    disabled={resetPasswordMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => {
                      if (confirm("Delete credentials for this user? They will need to use OAuth to login.")) {
                        deleteMutation.mutate({ userId: user.id });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Users without Credentials */}
      <div className="card-noir p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          Users without Credentials ({usersWithoutCredentials.length})
        </h3>
        
        {usersWithoutCredentials.length === 0 ? (
          <p className="text-muted-foreground text-sm">All users have custom credentials.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {usersWithoutCredentials.slice(0, 12).map((user) => (
              <div key={user.id} className="p-3 bg-[#0a0a0a] rounded-lg border border-[#222222]">
                <p className="font-medium text-sm truncate">{user.name || user.email || `User #${user.id}`}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            ))}
            {usersWithoutCredentials.length > 12 && (
              <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#222222] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">+{usersWithoutCredentials.length - 12} more</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Info box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="font-semibold text-blue-400 mb-2">Custom Authentication System</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Admin-created accounts with username/password</li>
          <li>• Optional phone number binding for verification</li>
          <li>• Account lockout after 5 failed attempts (30 min)</li>
          <li>• Users must change password on first login</li>
          <li>• Login page: <code className="bg-[#0a0a0a] px-1 rounded">/login</code></li>
        </ul>
      </div>
    </div>
  );
}


// ============================================================================
// INVITES PANEL - Personal Cipher Invite Code Management
// ============================================================================
function InvitesPanel() {
  const [newInviteLayer, setNewInviteLayer] = useState<string>("initiate");
  const [newInviteExpiry, setNewInviteExpiry] = useState<string>("");
  const [newInviteNote, setNewInviteNote] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  
  const { data: invites, refetch } = trpc.cipher.listInvites.useQuery();
  
  const createInviteMutation = trpc.cipher.createInvite.useMutation({
    onSuccess: (data: { code: string }) => {
      setGeneratedCode(data.code);
      toast.success("Invite code created!");
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });
  
  const revokeInviteMutation = trpc.cipher.revokeInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite code revoked");
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });
  
  const activeInvites = invites?.filter((i: any) => i.status === 'active') || [];
  const usedInvites = invites?.filter((i: any) => i.status === 'used') || [];
  const revokedInvites = invites?.filter((i: any) => i.status === 'revoked') || [];
  
  const handleCreateInvite = () => {
    // Calculate days until expiry if set
    let expiresInDays: number | undefined;
    if (newInviteExpiry) {
      const expiryDate = new Date(newInviteExpiry);
      const now = new Date();
      expiresInDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    createInviteMutation.mutate({
      defaultLayer: newInviteLayer as any,
      expiresInDays,
      notes: newInviteNote || undefined,
    });
  };
  
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };
  
  return (
    <div className="space-y-8">
      {/* Create New Invite */}
      <div className="card-noir p-6">
        <h2 className="text-headline mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#0ABAB5]" />
          Create Invite Code
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Default Layer
            </label>
            <Select value={newInviteLayer} onValueChange={setNewInviteLayer}>
              <SelectTrigger className="bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outside">Outside (Layer 0)</SelectItem>
                <SelectItem value="initiate">Initiate (Layer 1)</SelectItem>
                <SelectItem value="member">Member (Layer 2)</SelectItem>
                <SelectItem value="inner_circle">Inner Circle (Layer 3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Expires (Optional)
            </label>
            <Input
              type="datetime-local"
              value={newInviteExpiry}
              onChange={(e) => setNewInviteExpiry(e.target.value)}
              className="bg-background border-border/50"
            />
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Note (Optional)
            </label>
            <Input
              placeholder="e.g., For VIP guest"
              value={newInviteNote}
              onChange={(e) => setNewInviteNote(e.target.value)}
              className="bg-background border-border/50"
            />
          </div>
        </div>
        
        <Button
          onClick={handleCreateInvite}
          disabled={createInviteMutation.isPending}
          className="bg-[#0ABAB5] hover:bg-[#0ABAB5]/80 text-black"
        >
          {createInviteMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Generate Invite Code
        </Button>
        
        {/* Generated Code Display */}
        {generatedCode && (
          <div className="mt-4 p-4 bg-[#0ABAB5]/10 border border-[#0ABAB5]/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Generated Code:</p>
            <div className="flex items-center gap-3">
              <code className="text-2xl font-mono text-[#0ABAB5] tracking-wider">
                {generatedCode}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(generatedCode)}
                className="border-[#0ABAB5]/30 text-[#0ABAB5]"
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Share this code with the invitee. It can only be used once.
            </p>
          </div>
        )}
      </div>
      
      {/* Active Invites */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline">Active Invites</h2>
          <span className="text-xs text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-1 rounded">
            {activeInvites.length} active
          </span>
        </div>
        
        {activeInvites.length === 0 ? (
          <div className="card-noir p-8 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No active invite codes</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {activeInvites.map((invite: any) => (
              <div key={invite.id} className="card-noir p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <code className="text-lg font-mono text-[#0ABAB5] bg-[#0ABAB5]/10 px-3 py-1 rounded">
                    {invite.code}
                  </code>
                  <div>
                    <span className={`
                      px-2 py-0.5 text-xs rounded uppercase tracking-wider
                      ${invite.defaultLayer === 'outside' ? 'bg-zinc-800 text-zinc-400' : ''}
                      ${invite.defaultLayer === 'initiate' ? 'bg-zinc-700 text-zinc-300' : ''}
                      ${invite.defaultLayer === 'member' ? 'bg-blue-900/50 text-blue-400' : ''}
                      ${invite.defaultLayer === 'inner_circle' ? 'bg-amber-900/50 text-amber-400' : ''}
                    `}>
                      {invite.defaultLayer?.replace('_', ' ')}
                    </span>
                    {invite.note && (
                      <p className="text-xs text-muted-foreground mt-1">{invite.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {invite.expiresAt && (
                    <span className="text-xs text-muted-foreground">
                      Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(invite.code)}
                  >
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => revokeInviteMutation.mutate({ id: invite.id })}
                    disabled={revokeInviteMutation.isPending}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Used Invites */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline">Used Invites</h2>
          <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
            {usedInvites.length} used
          </span>
        </div>
        
        {usedInvites.length === 0 ? (
          <div className="card-noir p-6 text-center">
            <p className="text-muted-foreground text-sm">No invites have been used yet</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {usedInvites.slice(0, 10).map((invite: any) => (
              <div key={invite.id} className="card-noir p-3 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <code className="text-sm font-mono text-muted-foreground">
                    {invite.code}
                  </code>
                  <span className="text-xs text-green-400">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    Used
                  </span>
                  {invite.note && (
                    <span className="text-xs text-muted-foreground">{invite.note}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {invite.usedAt && new Date(invite.usedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Info Box */}
      <div className="bg-[#0ABAB5]/10 border border-[#0ABAB5]/30 rounded-lg p-4">
        <h4 className="font-semibold text-[#0ABAB5] mb-2">Personal Cipher Invite System</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Each invite code can only be used once</li>
          <li>• Default layer determines the invitee's starting access level</li>
          <li>• Expired codes are automatically invalidated</li>
          <li>• Invitees must complete cipher enrollment at <code className="bg-[#0a0a0a] px-1 rounded">/enroll</code></li>
        </ul>
      </div>
    </div>
  );
}
