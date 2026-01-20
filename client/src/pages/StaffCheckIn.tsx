import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { Link } from 'wouter';
import { 
  ScanLine, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Users, 
  Calendar,
  ChevronDown,
  Camera,
  Keyboard,
  Award,
  User,
  Clock,
  ArrowLeft,
  RefreshCw,
  UserCheck,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRScanner } from '@/components/QRScanner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CheckInResult {
  success: boolean;
  message: string;
  userCallSign?: string;
  userName?: string;
  reputationAwarded?: number;
  plusOneName?: string | null;
}

export default function StaffCheckIn() {
  const { user, loading: authLoading } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [reputationPoints, setReputationPoints] = useState(10);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [inputMode, setInputMode] = useState<'manual' | 'camera'>('manual');
  const [showScanner, setShowScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Fetch events for dropdown
  const { data: events, isLoading: eventsLoading } = trpc.staff.getEvents.useQuery(undefined, {
    enabled: !!user && (user.role === 'staff' || user.role === 'admin'),
  });
  
  // Fetch attendance for selected event
  const { data: attendance, refetch: refetchAttendance } = trpc.staff.getAttendance.useQuery(
    { eventId: selectedEventId! },
    { enabled: !!selectedEventId }
  );
  
  // Fetch check-in stats
  const { data: stats, refetch: refetchStats } = trpc.staff.getCheckInStats.useQuery(
    { eventId: selectedEventId! },
    { enabled: !!selectedEventId }
  );
  
  // Check-in mutation
  const checkInMutation = trpc.staff.checkInByCode.useMutation({
    onSuccess: (data) => {
      if (data.success && 'userCallSign' in data) {
        setLastResult({
          success: true,
          message: `Checked in: ${data.userCallSign || data.userName || 'Guest'}`,
          userCallSign: data.userCallSign,
          userName: data.userName,
          reputationAwarded: data.reputationAwarded,
          plusOneName: data.plusOneName,
        });
        toast.success(`✓ ${data.userCallSign || data.userName} checked in (+${data.reputationAwarded} rep)`);
        setManualCode('');
        refetchAttendance();
        refetchStats();
        
        // Focus back on input for next scan
        setTimeout(() => inputRef.current?.focus(), 100);
      } else if (!data.success && 'error' in data) {
        setLastResult({
          success: false,
          message: data.error || 'Check-in failed',
        });
        toast.error(data.error || 'Check-in failed');
      }
      
      // Clear result after 4 seconds
      setTimeout(() => setLastResult(null), 4000);
    },
    onError: (error) => {
      setLastResult({
        success: false,
        message: error.message || 'Check-in failed',
      });
      toast.error(error.message || 'Check-in failed');
      setTimeout(() => setLastResult(null), 4000);
    },
  });
  
  // Auto-focus input when event is selected
  useEffect(() => {
    if (selectedEventId && inputMode === 'manual') {
      inputRef.current?.focus();
    }
  }, [selectedEventId, inputMode]);
  
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || !selectedEventId) return;
    
    await checkInMutation.mutateAsync({
      code: manualCode.trim(),
      eventId: selectedEventId,
      reputationPoints,
    });
  };
  
  // Check if user is staff/admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0ABAB5]" />
      </div>
    );
  }
  
  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-400 mb-6">Staff or admin access required</p>
        <Link href="/">
          <Button variant="outline" className="border-[#0ABAB5] text-[#0ABAB5]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }
  
  const selectedEvent = events?.find(e => e.id === selectedEventId);
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-[#0ABAB5]/20 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-700" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-[#0ABAB5]" />
              Check-In Portal
            </h1>
          </div>
          <div className="text-sm text-gray-400">
            Staff: <span className="text-[#0ABAB5]">{user.callSign || user.name}</span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Event Selection */}
        <div className="mb-8">
          <label className="block text-sm text-gray-400 mb-2">Select Gathering</label>
          <Select
            value={selectedEventId?.toString() || ''}
            onValueChange={(value) => setSelectedEventId(parseInt(value))}
          >
            <SelectTrigger className="w-full bg-black/50 border-[#0ABAB5]/30 text-white">
              <SelectValue placeholder="Choose a gathering to manage check-ins" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-[#0ABAB5]/30">
              {eventsLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : events?.length === 0 ? (
                <SelectItem value="none" disabled>No events available</SelectItem>
              ) : (
                events?.map((event) => (
                  <SelectItem 
                    key={event.id} 
                    value={event.id.toString()}
                    className="text-white hover:bg-[#0ABAB5]/20"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#0ABAB5]" />
                      {event.title}
                      {event.eventDate && (
                        <span className="text-gray-500 text-xs">
                          ({new Date(event.eventDate).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        {selectedEventId && (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-white">{stats?.total || 0}</div>
                <div className="text-sm text-gray-400 flex items-center justify-center gap-1">
                  <Users className="w-4 h-4" />
                  Total Passes
                </div>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{stats?.checkedIn || 0}</div>
                <div className="text-sm text-green-400/70 flex items-center justify-center gap-1">
                  <UserCheck className="w-4 h-4" />
                  Checked In
                </div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats?.pending || 0}</div>
                <div className="text-sm text-yellow-400/70 flex items-center justify-center gap-1">
                  <UserX className="w-4 h-4" />
                  Pending
                </div>
              </div>
            </div>
            
            {/* Check-in Form */}
            <div className="bg-gray-900/50 border border-[#0ABAB5]/30 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-[#0ABAB5]" />
                  {showScanner ? 'Camera Scan' : 'Enter Code'}
                </h2>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowScanner(!showScanner)}
                    className="text-[#0ABAB5] hover:text-[#0ABAB5]/80"
                  >
                    {showScanner ? (
                      <><Keyboard className="w-4 h-4 mr-2" />Manual Entry</>
                    ) : (
                      <><Camera className="w-4 h-4 mr-2" />Use Camera</>
                    )}
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Rep:</span>
                    <input
                      type="number"
                      value={reputationPoints}
                      onChange={(e) => setReputationPoints(parseInt(e.target.value) || 10)}
                      className="w-16 px-2 py-1 bg-black/50 border border-[#0ABAB5]/30 rounded text-white text-center text-sm"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              </div>
              
              {/* QR Scanner */}
              {showScanner && (
                <div className="mb-4">
                  <QRScanner
                    enabled={showScanner}
                    onScan={(code) => {
                      setManualCode(code);
                      // Auto-submit on scan
                      if (selectedEventId) {
                        checkInMutation.mutate({
                          code,
                          eventId: selectedEventId,
                          reputationPoints,
                        });
                      }
                    }}
                    onError={(error) => {
                      toast.error(`Camera error: ${error}`);
                    }}
                  />
                </div>
              )}
              
              {/* Manual Entry */}
              <form onSubmit={handleManualSubmit} className="mb-4">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Enter pass code (SC-... or PASS-...)"
                    className="flex-1 px-4 py-3 bg-black/50 border border-[#0ABAB5]/30 rounded-lg text-white placeholder:text-gray-600 text-lg font-mono tracking-wider"
                    autoComplete="off"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    disabled={checkInMutation.isPending || !manualCode.trim()}
                    className="bg-[#0ABAB5] hover:bg-[#0ABAB5]/80 text-black font-bold px-6"
                  >
                    {checkInMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Check In
                      </>
                    )}
                  </Button>
                </div>
              </form>
              
              {/* Result Display */}
              <AnimatePresence>
                {lastResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className={`p-4 rounded-lg ${
                      lastResult.success 
                        ? 'bg-green-500/10 border-2 border-green-500/50' 
                        : 'bg-red-500/10 border-2 border-red-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {lastResult.success ? (
                        <CheckCircle2 className="w-12 h-12 text-green-400" />
                      ) : (
                        <XCircle className="w-12 h-12 text-red-400" />
                      )}
                      <div className="flex-1">
                        <p className={`text-xl font-bold ${lastResult.success ? 'text-green-400' : 'text-red-400'}`}>
                          {lastResult.message}
                        </p>
                        {lastResult.success && (
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            {lastResult.reputationAwarded && (
                              <span className="flex items-center gap-1 text-[#0ABAB5]">
                                <Award className="w-4 h-4" />
                                +{lastResult.reputationAwarded} reputation
                              </span>
                            )}
                            {lastResult.plusOneName && (
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                +1: {lastResult.plusOneName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Attendance List */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0ABAB5]" />
                  Attendance List
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    refetchAttendance();
                    refetchStats();
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {!attendance || attendance.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No passes claimed yet
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-800/50 sticky top-0">
                      <tr className="text-left text-sm text-gray-400">
                        <th className="px-4 py-3">Call Sign</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">+1</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Checked In</th>
                        <th className="px-4 py-3">Rep</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {attendance.map((pass) => (
                        <tr 
                          key={pass.passId} 
                          className={`${
                            pass.checkedInAt 
                              ? 'bg-green-900/10' 
                              : 'hover:bg-gray-800/30'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono text-[#0ABAB5]">
                            {pass.callSign || '—'}
                          </td>
                          <td className="px-4 py-3 text-white">
                            {pass.userName || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {pass.plusOneName || '—'}
                          </td>
                          <td className="px-4 py-3">
                            {pass.checkedInAt ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                                <CheckCircle2 className="w-3 h-3" />
                                Checked In
                              </span>
                            ) : pass.passStatus === 'revoked' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                                <XCircle className="w-3 h-3" />
                                Revoked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">
                            {pass.checkedInAt 
                              ? new Date(pass.checkedInAt).toLocaleTimeString()
                              : '—'
                            }
                          </td>
                          <td className="px-4 py-3 text-[#0ABAB5] font-mono">
                            {pass.reputationAwarded ? `+${pass.reputationAwarded}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
        
        {!selectedEventId && (
          <div className="text-center py-16 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Select a gathering to start checking in attendees</p>
          </div>
        )}
      </main>
    </div>
  );
}
