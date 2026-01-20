import { useState, useEffect } from 'react';
import { Lock, Unlock, Eye, EyeOff, Clock, MapPin, Calendar } from 'lucide-react';

type RevealState = 'tease' | 'window' | 'locked' | 'revealed';

interface RevealCountdownProps {
  revealState: RevealState;
  timeRevealed: boolean;
  locationRevealed: boolean;
  countdownToTimeReveal: number | null;
  countdownToLocationReveal: number | null;
  countdownToEvent: number | null;
  userLayerSufficient: boolean;
  requiredLayerLabel: string;
  revealMessage: string;
  revealedStartTime?: string | null;
  revealedEndTime?: string | null;
  venueName?: string | null;
  area?: string | null;
  city?: string | null;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function formatTimeLeft(ms: number): TimeLeft {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor((ms / 1000 / 60 / 60) % 24);
  const days = Math.floor(ms / 1000 / 60 / 60 / 24);
  return { days, hours, minutes, seconds };
}

function CountdownDisplay({ 
  label, 
  countdown, 
  icon: Icon,
  color = '#0ABAB5'
}: { 
  label: string; 
  countdown: number; 
  icon: React.ElementType;
  color?: string;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(formatTimeLeft(countdown));
  
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = Math.max(0, countdown - (Date.now() - performance.now()));
      setTimeLeft(formatTimeLeft(newTime > 0 ? countdown : 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);
  
  // Re-calculate on countdown change
  useEffect(() => {
    setTimeLeft(formatTimeLeft(countdown));
  }, [countdown]);
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
        <Icon size={14} style={{ color }} />
        <span>{label}</span>
      </div>
      <div className="flex gap-1 font-mono text-lg">
        {timeLeft.days > 0 && (
          <>
            <TimeUnit value={timeLeft.days} label="D" color={color} />
            <span className="text-gray-600">:</span>
          </>
        )}
        <TimeUnit value={timeLeft.hours} label="H" color={color} />
        <span className="text-gray-600">:</span>
        <TimeUnit value={timeLeft.minutes} label="M" color={color} />
        <span className="text-gray-600">:</span>
        <TimeUnit value={timeLeft.seconds} label="S" color={color} />
      </div>
    </div>
  );
}

function TimeUnit({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span 
        className="bg-black/50 px-2 py-1 rounded text-xl font-bold min-w-[40px] text-center"
        style={{ color }}
      >
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] text-gray-500 mt-1">{label}</span>
    </div>
  );
}

function RevealStateBadge({ state }: { state: RevealState }) {
  const config = {
    tease: { 
      label: 'TEASE', 
      color: '#888888', 
      bgColor: 'rgba(136, 136, 136, 0.2)',
      icon: EyeOff 
    },
    window: { 
      label: 'WINDOW', 
      color: '#0ABAB5', 
      bgColor: 'rgba(10, 186, 181, 0.2)',
      icon: Clock 
    },
    locked: { 
      label: 'LOCKED', 
      color: '#FF6B6B', 
      bgColor: 'rgba(255, 107, 107, 0.2)',
      icon: Lock 
    },
    revealed: { 
      label: 'REVEALED', 
      color: '#00FF00', 
      bgColor: 'rgba(0, 255, 0, 0.2)',
      icon: Unlock 
    },
  };
  
  const { label, color, bgColor, icon: Icon } = config[state];
  
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
      style={{ color, backgroundColor: bgColor }}
    >
      <Icon size={12} />
      {label}
    </div>
  );
}

export function RevealCountdown({
  revealState,
  timeRevealed,
  locationRevealed,
  countdownToTimeReveal,
  countdownToLocationReveal,
  countdownToEvent,
  userLayerSufficient,
  requiredLayerLabel,
  revealMessage,
  revealedStartTime,
  revealedEndTime,
  venueName,
  area,
  city,
  compact = false,
}: RevealCountdownProps) {
  const [currentCountdown, setCurrentCountdown] = useState({
    time: countdownToTimeReveal,
    location: countdownToLocationReveal,
    event: countdownToEvent,
  });
  
  // Update countdowns every second
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setCurrentCountdown({
        time: countdownToTimeReveal ? Math.max(0, countdownToTimeReveal - elapsed) : null,
        location: countdownToLocationReveal ? Math.max(0, countdownToLocationReveal - elapsed) : null,
        event: countdownToEvent ? Math.max(0, countdownToEvent - elapsed) : null,
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdownToTimeReveal, countdownToLocationReveal, countdownToEvent]);
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <RevealStateBadge state={revealState} />
        {revealState === 'locked' && !userLayerSufficient && (
          <span className="text-xs text-gray-400">
            Requires {requiredLayerLabel}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
      {/* Header with state badge */}
      <div className="flex items-center justify-between mb-4">
        <RevealStateBadge state={revealState} />
        {revealState === 'locked' && !userLayerSufficient && (
          <div className="flex items-center gap-1 text-xs text-red-400">
            <Lock size={12} />
            Requires {requiredLayerLabel}
          </div>
        )}
      </div>
      
      {/* Reveal message */}
      <p className="text-sm text-gray-300 mb-4">{revealMessage}</p>
      
      {/* Countdown timers */}
      <div className="space-y-4">
        {/* Time reveal countdown */}
        {!timeRevealed && currentCountdown.time && currentCountdown.time > 0 && (
          <CountdownDisplay
            label="Time Reveals In"
            countdown={currentCountdown.time}
            icon={Clock}
            color="#0ABAB5"
          />
        )}
        
        {/* Location reveal countdown */}
        {timeRevealed && !locationRevealed && currentCountdown.location && currentCountdown.location > 0 && (
          <CountdownDisplay
            label={userLayerSufficient ? "Location Reveals In" : `Location Reveals In (${requiredLayerLabel} only)`}
            countdown={currentCountdown.location}
            icon={MapPin}
            color={userLayerSufficient ? "#0ABAB5" : "#FF6B6B"}
          />
        )}
        
        {/* Event countdown */}
        {revealState === 'revealed' && currentCountdown.event && currentCountdown.event > 0 && (
          <CountdownDisplay
            label="Event Starts In"
            countdown={currentCountdown.event}
            icon={Calendar}
            color="#00FF00"
          />
        )}
      </div>
      
      {/* Revealed info */}
      {timeRevealed && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
          {revealedStartTime && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-[#0ABAB5]" />
              <span className="text-white">
                {revealedStartTime}
                {revealedEndTime && ` - ${revealedEndTime}`}
              </span>
            </div>
          )}
          
          {locationRevealed && venueName && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-[#00FF00]" />
              <span className="text-white">{venueName}</span>
              {area && <span className="text-gray-400">• {area}</span>}
            </div>
          )}
          
          {!locationRevealed && city && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-gray-500" />
              <span className="text-gray-400">{city}</span>
              <span className="text-xs text-gray-500">(exact location hidden)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { RevealStateBadge };
