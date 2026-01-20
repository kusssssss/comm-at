import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  MapPin,
} from "lucide-react";
import { Link } from "wouter";

type RequestStatus = "pending" | "approved" | "denied" | "waitlisted";

export default function AdminAccessRequests() {
  const { user, loading: authLoading } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("pending");
  const [eventFilter, setEventFilter] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [bulkDenyOpen, setBulkDenyOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const pageSize = 20;

  // Fetch events for filter dropdown
  const { data: eventsData } = trpc.event.listAll.useQuery();

  // Fetch access requests with filters
  const { data: requestsData, isLoading, refetch } = trpc.event.getAllAccessRequests.useQuery({
    eventId: eventFilter === "all" ? undefined : eventFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
    limit: pageSize,
    offset: page * pageSize,
  });

  // Fetch stats
  const { data: stats } = trpc.event.getAccessRequestStats.useQuery({
    eventId: eventFilter === "all" ? undefined : eventFilter,
  });

  // Bulk mutations
  const bulkApproveMutation = trpc.event.bulkApproveRequests.useMutation({
    onSuccess: (result) => {
      toast.success(`Approved ${result.approved} requests${result.failed > 0 ? `, ${result.failed} failed` : ""}`);
      setSelectedIds(new Set());
      setBulkApproveOpen(false);
      setBulkMessage("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const bulkDenyMutation = trpc.event.bulkDenyRequests.useMutation({
    onSuccess: (result) => {
      toast.success(`Denied ${result.denied} requests${result.failed > 0 ? `, ${result.failed} failed` : ""}`);
      setSelectedIds(new Set());
      setBulkDenyOpen(false);
      setBulkMessage("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Individual action mutations
  const approveMutation = trpc.event.approveRequest.useMutation({
    onSuccess: () => {
      toast.success("Request approved");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const denyMutation = trpc.event.denyRequest.useMutation({
    onSuccess: () => {
      toast.success("Request denied");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const waitlistMutation = trpc.event.waitlistRequest.useMutation({
    onSuccess: () => {
      toast.success("Request waitlisted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const requests = requestsData?.requests || [];
  const totalRequests = requestsData?.total || 0;
  const totalPages = Math.ceil(totalRequests / pageSize);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)));
    }
  };

  const pendingSelectedIds = useMemo(() => {
    return Array.from(selectedIds).filter((id) => {
      const req = requests.find((r) => r.id === id);
      return req?.status === "pending";
    });
  }, [selectedIds, requests]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1 border-amber-500 text-amber-400">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-400">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Denied
          </Badge>
        );
      case "waitlisted":
        return (
          <Badge variant="outline" className="gap-1 border-blue-500 text-blue-400">
            <AlertCircle className="h-3 w-3" />
            Waitlisted
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return (
      <div className="container py-16 text-center">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Access Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage gathering access requests
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {stats?.pending || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {stats?.approved || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {stats?.denied || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Waitlisted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {stats?.waitlisted || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as RequestStatus | "all");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={eventFilter === "all" ? "all" : String(eventFilter)}
              onValueChange={(v) => {
                setEventFilter(v === "all" ? "all" : Number(v));
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {eventsData?.map((event) => (
                  <SelectItem key={event.id} value={String(event.id)}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or call sign..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {selectedIds.size} selected
                  {pendingSelectedIds.length !== selectedIds.size && (
                    <span className="text-muted-foreground text-sm ml-2">
                      ({pendingSelectedIds.length} pending)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setBulkApproveOpen(true)}
                  disabled={pendingSelectedIds.length === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve ({pendingSelectedIds.length})
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setBulkDenyOpen(true)}
                  disabled={pendingSelectedIds.length === 0}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Deny ({pendingSelectedIds.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <Skeleton className="h-64" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Requests Found</h3>
              <p className="text-muted-foreground">
                {statusFilter === "pending"
                  ? "No pending access requests at this time."
                  : "No requests match your current filters."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === requests.length && requests.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(request.id)}
                        onCheckedChange={() => toggleSelect(request.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {request.userCallSign || request.userName || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.userRole} • {request.userChapter || "No chapter"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.eventTitle}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(request.eventDate)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm">
                        {request.requestMessage || (
                          <span className="text-muted-foreground italic">No message</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            onClick={() => approveMutation.mutate({ requestId: request.id })}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            onClick={() => waitlistMutation.mutate({ requestId: request.id })}
                            disabled={waitlistMutation.isPending}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => denyMutation.mutate({ requestId: request.id })}
                            disabled={denyMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalRequests)} of{" "}
            {totalRequests} requests
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Approve Dialog */}
      <Dialog open={bulkApproveOpen} onOpenChange={setBulkApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {pendingSelectedIds.length} Requests</DialogTitle>
            <DialogDescription>
              This will approve all selected pending requests and create passes for each user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Optional message to include with approval:
            </label>
            <Textarea
              placeholder="e.g., Welcome! See you at the event."
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                bulkApproveMutation.mutate({
                  requestIds: pendingSelectedIds,
                  response: bulkMessage || undefined,
                });
              }}
              disabled={bulkApproveMutation.isPending}
            >
              {bulkApproveMutation.isPending ? "Approving..." : "Approve All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Deny Dialog */}
      <Dialog open={bulkDenyOpen} onOpenChange={setBulkDenyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny {pendingSelectedIds.length} Requests</DialogTitle>
            <DialogDescription>
              This will deny all selected pending requests. Users will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Reason for denial (optional):
            </label>
            <Textarea
              placeholder="e.g., Event is at capacity."
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDenyOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                bulkDenyMutation.mutate({
                  requestIds: pendingSelectedIds,
                  reason: bulkMessage || undefined,
                });
              }}
              disabled={bulkDenyMutation.isPending}
            >
              {bulkDenyMutation.isPending ? "Denying..." : "Deny All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
