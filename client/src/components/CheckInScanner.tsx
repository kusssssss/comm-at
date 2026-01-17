import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ScanLine,
  User,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CheckInScannerProps {
  eventId?: number;
  onSuccess?: (data: { callSign?: string; chapter?: string; plusOneName?: string }) => void;
}

export function CheckInScanner({ eventId, onSuccess }: CheckInScannerProps) {
  const [manualCode, setManualCode] = useState('');
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    data?: { callSign?: string | null; chapter?: string | null; plusOneName?: string | null };
  } | null>(null);

  const checkInMutation = trpc.rsvp.checkIn.useMutation({
    onSuccess: (data) => {
      setLastResult({
        success: true,
        message: `Checked in: ${data.user?.callSign || 'Guest'}`,
        data: data.user,
      });
      toast.success(`Checked in: ${data.user?.callSign || 'Guest'}`);
      onSuccess?.({
        callSign: data.user?.callSign || undefined,
        chapter: data.user?.chapter || undefined,
        plusOneName: data.plusOneName || undefined,
      });
      setManualCode('');
      
      // Clear result after 3 seconds
      setTimeout(() => setLastResult(null), 3000);
    },
    onError: (error) => {
      setLastResult({
        success: false,
        message: error.message || 'Check-in failed',
      });
      toast.error(error.message || 'Check-in failed');
      
      // Clear result after 3 seconds
      setTimeout(() => setLastResult(null), 3000);
    },
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    
    await checkInMutation.mutateAsync({ qrCode: manualCode.trim() });
  };

  return (
    <div className="p-6 border border-blue-500/20 rounded-lg">
      <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
        <ScanLine className="w-5 h-5" />
        Check-In Scanner
      </h3>

      {/* Manual Entry */}
      <form onSubmit={handleManualSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter QR code manually (RSVP-...)"
            className="flex-1 px-3 py-2 bg-black/30 border border-blue-500/20 rounded text-white placeholder:text-gray-600 text-sm"
          />
          <Button
            type="submit"
            disabled={checkInMutation.isPending || !manualCode.trim()}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {checkInMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Check In'
            )}
          </Button>
        </div>
      </form>

      {/* Result Display */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg ${
              lastResult.success 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {lastResult.success ? (
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400" />
              )}
              <div>
                <p className={`font-medium ${lastResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {lastResult.message}
                </p>
                {lastResult.data && (
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    {lastResult.data.chapter && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lastResult.data.chapter}
                      </span>
                    )}
                    {lastResult.data.plusOneName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        +1: {lastResult.data.plusOneName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <p className="text-xs text-gray-500 mt-4">
        Enter the RSVP code from the attendee's QR code to check them in.
      </p>
    </div>
  );
}

export default CheckInScanner;
