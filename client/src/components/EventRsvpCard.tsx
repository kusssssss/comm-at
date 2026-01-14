import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { 
  Check, 
  X, 
  QrCode, 
  UserPlus, 
  Loader2, 
  Calendar,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventRsvpCardProps {
  eventId: number;
  eventTitle: string;
  eventDate: Date | string | null;
  capacity: number | null;
  className?: string;
}

export function EventRsvpCard({ 
  eventId, 
  eventTitle, 
  eventDate, 
  capacity,
  className = '' 
}: EventRsvpCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [showPlusOne, setShowPlusOne] = useState(false);

  const isMarked = user && ['marked_initiate', 'marked_member', 'marked_inner_circle'].includes(user.role);

  const { data: rsvp, isLoading: rsvpLoading, refetch } = trpc.rsvp.get.useQuery(
    { eventId },
    { enabled: !!(isAuthenticated && isMarked) }
  );

  const { data: rsvpCount = 0 } = trpc.rsvp.count.useQuery({ eventId });

  const createRsvpMutation = trpc.rsvp.create.useMutation({
    onSuccess: (data) => {
      toast.success('RSVP confirmed! Your QR code is ready.');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to RSVP');
    },
  });

  const cancelRsvpMutation = trpc.rsvp.cancel.useMutation({
    onSuccess: () => {
      toast.success('RSVP cancelled');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel RSVP');
    },
  });

  const handleRsvp = async () => {
    await createRsvpMutation.mutateAsync({
      eventId,
      plusOneName: showPlusOne && plusOneName.trim() ? plusOneName.trim() : undefined,
    });
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel your RSVP?')) {
      await cancelRsvpMutation.mutateAsync({ eventId });
    }
  };

  const isPast = eventDate && new Date(eventDate) <= new Date();
  const isFull = capacity && rsvpCount >= capacity;

  if (!isAuthenticated || !isMarked) {
    return (
      <div className={`p-4 border border-purple-500/20 rounded-lg ${className}`}>
        <p className="text-sm text-gray-500 text-center">
          Sign in as a marked member to RSVP
        </p>
      </div>
    );
  }

  if (rsvpLoading) {
    return (
      <div className={`p-6 border border-purple-500/20 rounded-lg ${className}`}>
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  // Already RSVPed
  if (rsvp && rsvp.status !== 'cancelled') {
    return (
      <div className={`p-6 border border-purple-500/30 bg-purple-500/5 rounded-lg ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          {rsvp.status === 'attended' ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-medium text-green-400">Checked In</p>
                <p className="text-xs text-gray-500">
                  {rsvp.checkedInAt && new Date(rsvp.checkedInAt).toLocaleString()}
                </p>
              </div>
            </>
          ) : (
            <>
              <Check className="w-6 h-6 text-purple-400" />
              <div>
                <p className="font-medium text-purple-400">RSVP Confirmed</p>
                <p className="text-xs text-gray-500">
                  {rsvp.plusOneName && `+1: ${rsvp.plusOneName}`}
                </p>
              </div>
            </>
          )}
        </div>

        {rsvp.status !== 'attended' && (
          <>
            <Button
              onClick={() => setShowQR(!showQR)}
              variant="outline"
              className="w-full mb-3 border-purple-500/30 hover:bg-purple-500/10"
            >
              <QrCode className="w-4 h-4 mr-2" />
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </Button>

            <AnimatePresence>
              {showQR && rsvp.qrCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white p-6 rounded-lg mb-3">
                    <QRCode
                      value={rsvp.qrCode}
                      size={180}
                      className="mx-auto"
                    />
                    <p className="text-center text-xs text-black mt-3 font-mono">
                      {rsvp.qrCode}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Show this QR code at check-in
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!isPast && (
              <button
                onClick={handleCancel}
                disabled={cancelRsvpMutation.isPending}
                className="w-full text-sm text-gray-500 hover:text-red-400 transition-colors mt-2"
              >
                {cancelRsvpMutation.isPending ? 'Cancelling...' : 'Cancel RSVP'}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Not RSVPed yet
  return (
    <div className={`p-6 border border-purple-500/20 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-gray-400">
            {rsvpCount}{capacity ? ` / ${capacity}` : ''} attending
          </span>
        </div>
        {isFull && (
          <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
            FULL
          </span>
        )}
      </div>

      {isPast ? (
        <p className="text-sm text-gray-500 text-center">This event has ended</p>
      ) : isFull ? (
        <p className="text-sm text-gray-500 text-center">This event is at capacity</p>
      ) : (
        <>
          {/* Plus-one option */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPlusOne}
                onChange={(e) => setShowPlusOne(e.target.checked)}
                className="rounded border-purple-500/30 bg-transparent"
              />
              <span className="text-sm text-gray-400">Bringing a +1</span>
            </label>
            
            <AnimatePresence>
              {showPlusOne && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <input
                    type="text"
                    placeholder="Guest name"
                    value={plusOneName}
                    onChange={(e) => setPlusOneName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-purple-500/20 rounded text-white placeholder:text-gray-600 text-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            onClick={handleRsvp}
            disabled={createRsvpMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white"
          >
            {createRsvpMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                {showPlusOne ? 'RSVP (+1)' : 'RSVP Now'}
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}

export default EventRsvpCard;
