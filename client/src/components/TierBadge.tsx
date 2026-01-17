import { motion } from "framer-motion";

type TierName = 'OUTSIDE' | 'INITIATE' | 'MEMBER' | 'INNER_CIRCLE';

interface TierBadgeProps {
  tier: TierName;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animated?: boolean;
}

const tierConfig = {
  OUTSIDE: {
    label: 'Outside',
    color: '#444444',
    bgColor: '#1a1a1a',
    glowColor: 'rgba(68, 68, 68, 0.3)',
  },
  INITIATE: {
    label: 'Initiate',
    color: '#666666',
    bgColor: '#1a1a1a',
    glowColor: 'rgba(102, 102, 102, 0.3)',
  },
  MEMBER: {
    label: 'Member',
    color: '#888888',
    bgColor: '#1a1a1a',
    glowColor: 'rgba(136, 136, 136, 0.3)',
  },
  INNER_CIRCLE: {
    label: 'Inner Circle',
    color: '#3B82F6',
    bgColor: '#1a0a2e',
    glowColor: 'rgba(147, 51, 234, 0.4)',
  },
};

const sizeConfig = {
  sm: { badge: 32, icon: 16, fontSize: 8 },
  md: { badge: 48, icon: 24, fontSize: 10 },
  lg: { badge: 64, icon: 32, fontSize: 12 },
  xl: { badge: 96, icon: 48, fontSize: 14 },
};

// SVG Badge Icons for each tier
function OutsideBadgeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
      <circle cx="24" cy="24" r="8" fill={color} opacity="0.3" />
      <line x1="16" y1="16" x2="32" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="16" x2="16" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function InitiateBadgeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2" />
      <circle cx="24" cy="24" r="12" fill={color} opacity="0.2" />
      <circle cx="24" cy="24" r="6" fill={color} />
      {/* Eye shape */}
      <ellipse cx="24" cy="24" rx="10" ry="6" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function MemberBadgeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2" />
      <circle cx="24" cy="24" r="16" stroke={color} strokeWidth="1" opacity="0.5" />
      {/* Three connected circles representing community */}
      <circle cx="24" cy="18" r="5" fill={color} />
      <circle cx="18" cy="28" r="5" fill={color} opacity="0.7" />
      <circle cx="30" cy="28" r="5" fill={color} opacity="0.7" />
      {/* Connection lines */}
      <line x1="24" y1="23" x2="18" y2="23" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <line x1="24" y1="23" x2="30" y2="23" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <line x1="18" y1="28" x2="30" y2="28" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

function InnerCircleBadgeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Outer glow ring */}
      <circle cx="24" cy="24" r="22" stroke={color} strokeWidth="1" opacity="0.3" />
      <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2" />
      <circle cx="24" cy="24" r="16" stroke={color} strokeWidth="1" opacity="0.5" />
      
      {/* Shield shape */}
      <path 
        d="M24 8 L36 14 L36 26 C36 32 30 38 24 40 C18 38 12 32 12 26 L12 14 L24 8Z" 
        fill={color} 
        opacity="0.3"
        stroke={color}
        strokeWidth="1.5"
      />
      
      {/* Inner star/crown */}
      <path 
        d="M24 16 L26 22 L32 22 L27 26 L29 32 L24 28 L19 32 L21 26 L16 22 L22 22 Z" 
        fill={color}
      />
    </svg>
  );
}

export function TierBadge({ tier, size = 'md', showLabel = false, animated = true }: TierBadgeProps) {
  const config = tierConfig[tier];
  const sizes = sizeConfig[size];
  
  const BadgeIcon = {
    OUTSIDE: OutsideBadgeIcon,
    INITIATE: InitiateBadgeIcon,
    MEMBER: MemberBadgeIcon,
    INNER_CIRCLE: InnerCircleBadgeIcon,
  }[tier];
  
  const badge = (
    <div 
      className="relative flex flex-col items-center"
      style={{ width: sizes.badge }}
    >
      {/* Glow effect for Inner Circle */}
      {tier === 'INNER_CIRCLE' && animated && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ 
            background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      {/* Badge container */}
      <div 
        className="relative rounded-full flex items-center justify-center"
        style={{ 
          width: sizes.badge, 
          height: sizes.badge,
          backgroundColor: config.bgColor,
          boxShadow: `0 0 20px ${config.glowColor}`,
        }}
      >
        <BadgeIcon size={sizes.icon} color={config.color} />
      </div>
      
      {/* Label */}
      {showLabel && (
        <span 
          className="mt-2 font-mono uppercase tracking-wider"
          style={{ 
            fontSize: sizes.fontSize,
            color: config.color,
          }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
  
  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        {badge}
      </motion.div>
    );
  }
  
  return badge;
}

// Badge with tooltip showing tier info
export function TierBadgeWithTooltip({ tier, size = 'md' }: { tier: TierName; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const config = tierConfig[tier];
  
  return (
    <div className="group relative">
      <TierBadge tier={tier} size={size} />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div 
          className="px-3 py-2 rounded-lg text-xs whitespace-nowrap"
          style={{ 
            backgroundColor: config.bgColor,
            border: `1px solid ${config.color}40`,
          }}
        >
          <span style={{ color: config.color }} className="font-medium">
            {config.label}
          </span>
        </div>
        {/* Arrow */}
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${config.color}40`,
          }}
        />
      </div>
    </div>
  );
}

// All badges in a row (for display/comparison)
export function TierBadgeRow({ currentTier, size = 'sm' }: { currentTier?: TierName; size?: 'sm' | 'md' | 'lg' }) {
  const tiers: TierName[] = ['OUTSIDE', 'INITIATE', 'MEMBER', 'INNER_CIRCLE'];
  
  return (
    <div className="flex items-center gap-4">
      {tiers.map((tier) => (
        <div 
          key={tier}
          className={`transition-opacity ${currentTier && tier !== currentTier ? 'opacity-30' : 'opacity-100'}`}
        >
          <TierBadge tier={tier} size={size} showLabel animated={tier === currentTier} />
        </div>
      ))}
    </div>
  );
}
