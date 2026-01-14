import { Lock, Eye, EyeOff, Sparkles, Crown, Shield, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

type AccessTier = 'outside' | 'initiate' | 'member' | 'inner_circle';

interface AccessLockProps {
  requiredTier: AccessTier;
  currentTier?: AccessTier;
  children: React.ReactNode;
  showTeaser?: boolean;
  teaserContent?: React.ReactNode;
  className?: string;
  variant?: 'blur' | 'solid' | 'gradient';
  message?: string;
}

const TIER_ORDER: AccessTier[] = ['outside', 'initiate', 'member', 'inner_circle'];

const TIER_CONFIG = {
  outside: {
    label: 'OUTSIDE',
    icon: Eye,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
  },
  initiate: {
    label: 'INITIATE',
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  member: {
    label: 'MEMBER',
    icon: Star,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  inner_circle: {
    label: 'INNER CIRCLE',
    icon: Crown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
};

function hasAccess(currentTier: AccessTier | undefined, requiredTier: AccessTier): boolean {
  if (!currentTier) return false;
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  const requiredIndex = TIER_ORDER.indexOf(requiredTier);
  return currentIndex >= requiredIndex;
}

export function AccessLock({
  requiredTier,
  currentTier,
  children,
  showTeaser = true,
  teaserContent,
  className,
  variant = 'blur',
  message,
}: AccessLockProps) {
  const canAccess = hasAccess(currentTier, requiredTier);
  const config = TIER_CONFIG[requiredTier];
  const TierIcon = config.icon;

  if (canAccess) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      {/* Teaser content with blur */}
      {showTeaser && (
        <div
          className={cn(
            'relative',
            variant === 'blur' && 'blur-md brightness-50 saturate-50',
            variant === 'gradient' && 'opacity-30'
          )}
          aria-hidden="true"
        >
          {teaserContent || children}
        </div>
      )}

      {/* Lock overlay */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center',
          variant === 'solid' && 'bg-background/95',
          variant === 'blur' && 'bg-background/60 backdrop-blur-sm',
          variant === 'gradient' && 'bg-gradient-to-t from-background via-background/80 to-transparent'
        )}
      >
        {/* Animated lock icon */}
        <div className="relative mb-4">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            config.bgColor,
            'border',
            config.borderColor,
            'animate-pulse'
          )}>
            <Lock className={cn('w-8 h-8', config.color)} />
          </div>
          
          {/* Sparkle effects */}
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-purple-400 animate-pulse" />
          <Sparkles className="absolute -bottom-1 -left-1 w-3 h-3 text-purple-300 animate-pulse delay-150" />
        </div>

        {/* Access level badge */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest mb-3',
          config.bgColor,
          'border',
          config.borderColor
        )}>
          <TierIcon className={cn('w-3 h-3', config.color)} />
          <span className={config.color}>{config.label} ONLY</span>
        </div>

        {/* Message */}
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-4 px-4">
          {message || `This content is restricted to ${config.label.toLowerCase()} tier and above.`}
        </p>

        {/* CTA */}
        {!currentTier || currentTier === 'outside' ? (
          <Link href="/marks">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10',
                'transition-all duration-300 hover:scale-105'
              )}
            >
              <Lock className="w-4 h-4" />
              Get a Mark to Unlock
            </Button>
          </Link>
        ) : (
          <div className="text-xs text-muted-foreground">
            Advance to {config.label} to unlock
          </div>
        )}
      </div>
    </div>
  );
}

// Compact badge for showing access level
export function AccessBadge({ 
  tier, 
  size = 'sm',
  showIcon = true,
  className 
}: { 
  tier: AccessTier; 
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}) {
  const config = TIER_CONFIG[tier];
  const TierIcon = config.icon;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <div className={cn(
      'inline-flex items-center rounded-full font-mono uppercase tracking-wider',
      config.bgColor,
      'border',
      config.borderColor,
      sizeClasses[size],
      className
    )}>
      {showIcon && <TierIcon className={cn(iconSizes[size], config.color)} />}
      <span className={config.color}>{config.label}</span>
    </div>
  );
}

// "Members Only" lock badge for cards
export function MembersOnlyBadge({ 
  className,
  pulse = true 
}: { 
  className?: string;
  pulse?: boolean;
}) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full',
      'bg-purple-500/20 border border-purple-500/30',
      'text-xs font-mono uppercase tracking-wider text-purple-400',
      pulse && 'animate-pulse',
      className
    )}>
      <Lock className="w-3 h-3" />
      <span>Members Only</span>
    </div>
  );
}

// Visibility indicator showing what user can see
export function VisibilityIndicator({
  currentTier,
  className,
}: {
  currentTier?: AccessTier;
  className?: string;
}) {
  const tier = currentTier || 'outside';
  const config = TIER_CONFIG[tier];
  const TierIcon = config.icon;

  const visibilityText = {
    outside: 'Limited visibility. Get a mark to see more.',
    initiate: 'Basic access. Attend events to level up.',
    member: 'Full access. Welcome to the collective.',
    inner_circle: 'Maximum clearance. You see everything.',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg',
      config.bgColor,
      'border',
      config.borderColor,
      className
    )}>
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center',
        'bg-background/50'
      )}>
        {tier === 'outside' ? (
          <EyeOff className={cn('w-5 h-5', config.color)} />
        ) : (
          <TierIcon className={cn('w-5 h-5', config.color)} />
        )}
      </div>
      <div className="flex-1">
        <div className={cn('text-sm font-medium', config.color)}>
          {config.label}
        </div>
        <div className="text-xs text-muted-foreground">
          {visibilityText[tier]}
        </div>
      </div>
    </div>
  );
}
