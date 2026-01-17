import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CountdownProps {
  targetDate: Date;
  label?: string;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'urgent' | 'minimal';
  showLabels?: boolean;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}

function AnimatedDigit({ value, prevValue }: { value: number; prevValue: number }) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <span
      className={cn(
        'inline-block transition-all duration-300',
        isAnimating && 'animate-pulse scale-110'
      )}
    >
      {String(value).padStart(2, '0')}
    </span>
  );
}

export function Countdown({
  targetDate,
  label,
  onComplete,
  size = 'md',
  variant = 'default',
  showLabels = true,
  className,
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));
  const [prevTimeLeft, setPrevTimeLeft] = useState<TimeLeft>(timeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrevTimeLeft(timeLeft);
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, timeLeft, onComplete]);

  const isUrgent = timeLeft.total > 0 && timeLeft.total < 24 * 60 * 60 * 1000; // Less than 24 hours
  const isExpired = timeLeft.total <= 0;

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl md:text-3xl',
    lg: 'text-4xl md:text-5xl',
  };

  const labelSizeClasses = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  const boxSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14 md:w-16 md:h-16',
    lg: 'w-20 h-20 md:w-24 md:h-24',
  };

  if (isExpired) {
    return (
      <div className={cn('text-center', className)}>
        {label && (
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {label}
          </div>
        )}
        <div className={cn(
          'font-mono font-bold text-green-500',
          sizeClasses[size]
        )}>
          LIVE NOW
        </div>
      </div>
    );
  }

  return (
    <div className={cn('text-center', className)}>
      {label && (
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          {label}
        </div>
      )}
      
      <div className="flex items-center justify-center gap-2 md:gap-3">
        {/* Days */}
        {timeLeft.days > 0 && (
          <>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center rounded-lg font-mono font-bold',
                  boxSizeClasses[size],
                  sizeClasses[size],
                  variant === 'default' && 'bg-blue-500/20 border border-blue-500/30 text-blue-300',
                  variant === 'urgent' && 'bg-red-500/20 border border-red-500/30 text-red-300 animate-pulse',
                  variant === 'minimal' && 'text-foreground'
                )}
              >
                <AnimatedDigit value={timeLeft.days} prevValue={prevTimeLeft.days} />
              </div>
              {showLabels && (
                <span className={cn('uppercase tracking-widest text-muted-foreground mt-1', labelSizeClasses[size])}>
                  Days
                </span>
              )}
            </div>
            <span className={cn('font-mono text-muted-foreground', sizeClasses[size])}>:</span>
          </>
        )}

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'flex items-center justify-center rounded-lg font-mono font-bold',
              boxSizeClasses[size],
              sizeClasses[size],
              variant === 'default' && 'bg-blue-500/20 border border-blue-500/30 text-blue-300',
              variant === 'urgent' && 'bg-red-500/20 border border-red-500/30 text-red-300 animate-pulse',
              variant === 'minimal' && 'text-foreground',
              isUrgent && variant === 'default' && 'bg-orange-500/20 border-orange-500/30 text-orange-300'
            )}
          >
            <AnimatedDigit value={timeLeft.hours} prevValue={prevTimeLeft.hours} />
          </div>
          {showLabels && (
            <span className={cn('uppercase tracking-widest text-muted-foreground mt-1', labelSizeClasses[size])}>
              Hours
            </span>
          )}
        </div>
        <span className={cn('font-mono text-muted-foreground', sizeClasses[size])}>:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'flex items-center justify-center rounded-lg font-mono font-bold',
              boxSizeClasses[size],
              sizeClasses[size],
              variant === 'default' && 'bg-blue-500/20 border border-blue-500/30 text-blue-300',
              variant === 'urgent' && 'bg-red-500/20 border border-red-500/30 text-red-300 animate-pulse',
              variant === 'minimal' && 'text-foreground',
              isUrgent && variant === 'default' && 'bg-orange-500/20 border-orange-500/30 text-orange-300'
            )}
          >
            <AnimatedDigit value={timeLeft.minutes} prevValue={prevTimeLeft.minutes} />
          </div>
          {showLabels && (
            <span className={cn('uppercase tracking-widest text-muted-foreground mt-1', labelSizeClasses[size])}>
              Mins
            </span>
          )}
        </div>
        <span className={cn('font-mono text-muted-foreground', sizeClasses[size])}>:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'flex items-center justify-center rounded-lg font-mono font-bold',
              boxSizeClasses[size],
              sizeClasses[size],
              variant === 'default' && 'bg-blue-500/20 border border-blue-500/30 text-blue-300',
              variant === 'urgent' && 'bg-red-500/20 border border-red-500/30 text-red-300 animate-pulse',
              variant === 'minimal' && 'text-foreground',
              isUrgent && variant === 'default' && 'bg-orange-500/20 border-orange-500/30 text-orange-300'
            )}
          >
            <AnimatedDigit value={timeLeft.seconds} prevValue={prevTimeLeft.seconds} />
          </div>
          {showLabels && (
            <span className={cn('uppercase tracking-widest text-muted-foreground mt-1', labelSizeClasses[size])}>
              Secs
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact inline countdown for cards
export function InlineCountdown({ 
  targetDate, 
  prefix = '',
  className 
}: { 
  targetDate: Date; 
  prefix?: string;
  className?: string;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.total <= 0) {
    return <span className={cn('text-green-500 font-mono', className)}>LIVE</span>;
  }

  const parts = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  parts.push(`${String(timeLeft.hours).padStart(2, '0')}h`);
  parts.push(`${String(timeLeft.minutes).padStart(2, '0')}m`);
  parts.push(`${String(timeLeft.seconds).padStart(2, '0')}s`);

  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {prefix}{parts.join(' ')}
    </span>
  );
}
