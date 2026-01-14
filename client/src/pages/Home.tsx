import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "@/components/Nav";
import { trpc } from "@/lib/trpc";
import { Countdown, InlineCountdown } from "@/components/Countdown";
import { AccessLock, MembersOnlyBadge, VisibilityIndicator, AccessBadge } from "@/components/AccessLock";
import { useAuth } from "@/_core/hooks/useAuth";
import { Lock, Eye, EyeOff, Users, Calendar, Shield, ChevronRight, Zap, Sparkles, MapPin, Clock, ArrowRight, Star, Gift, Trophy } from "lucide-react";
import { 
  ChromaticText, 
  DecryptText, 
  CycleNumber,
  GlitchHover,
  SystemBoot,
  GlowPulse,
  FlickerText,
  RevealOnScroll,
  Hologram,
} from "@/components/Effects2200";
import { SponsorShowcase } from "@/components/SponsorShowcase";
import { ClearanceTest } from "@/components/ClearanceTest";
import { CardHoverAnimation, ButtonHoverAnimation } from "@/components/CardHoverAnimation";
import { ImageFallback, getDropImage } from "@/components/ImageFallback";

// ============================================================================
// YEAR 2200 HOME PAGE - SECRET SOCIETY / AFFILIATION THEME
// ============================================================================

const MANIFESTO = [
  { text: "The mark is the key.", emphasis: "mark" },
  { text: "The Mark is the lock.", emphasis: "Mark" },
  { text: "The collective is the room.", emphasis: "collective" },
  { text: "Dilution leads to being unmarked.", emphasis: "unmarked" },
];

const MEMBER_TIERS = [
  { 
    name: "OUTSIDE", 
    description: "Unverified. No access.", 
    color: "#444444",
    icon: EyeOff,
    howToAdvance: "Get a mark from a drop or existing member",
    access: ["Public drops viewing", "Mark verification"]
  },
  { 
    name: "INITIATE", 
    description: "First mark. Proving ground.", 
    color: "#666666",
    icon: Eye,
    howToAdvance: "Attend 2 events + own 3 marks",
    access: ["Inside feed access", "Event eligibility", "Member directory"]
  },
  { 
    name: "MEMBER", 
    description: "Trusted. Inner access.", 
    color: "#888888",
    icon: Users,
    howToAdvance: "Refer 5 members + attend 5 events",
    access: ["Priority event access", "Exclusive drops", "Full archive"]
  },
  { 
    name: "INNER CIRCLE", 
    description: "The core. Full clearance.", 
    color: "#9333EA",
    icon: Shield,
    howToAdvance: null,
    access: ["All events", "Early drops", "Governance rights", "Secret channels"]
  },
];

const CRYPTIC_TESTIMONIALS = [
  { quote: "The first event changed everything. I finally understood.", author: "Member #0047" },
  { quote: "What happens inside stays inside. That's the code.", author: "Member #0012" },
  { quote: "I thought it was just merch. I was wrong.", author: "Initiate #0234" },
  { quote: "Three marks deep. No turning back now.", author: "Inner Circle" },
];

// Format time ago
const timeAgo = (date: Date | string | null) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Blurred/Classified content component
function ClassifiedContent({ children, label = "CLASSIFIED" }: { children: React.ReactNode, label?: string }) {
  return (
    <div className="relative group">
      <div className="blur-sm group-hover:blur-md transition-all duration-300">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="px-4 py-2 bg-black/80 border border-[#9333EA]/50">
          <span className="text-[#9333EA] text-xs font-mono tracking-widest flex items-center gap-2">
            <Lock className="w-3 h-3" />
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

// Live pulse indicator
function LivePulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9333EA] opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9333EA]"></span>
    </span>
  );
}

// Event card component for previews
function EventPreviewCard({ event, isBlurred = false }: { event: any, isBlurred?: boolean }) {
  const eventDate = event.eventDate ? new Date(event.eventDate) : null;
  const isUpcoming = eventDate && eventDate > new Date();
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative p-6 border border-[#222222] bg-[#0a0a0a] rounded-lg overflow-hidden group ${
        isBlurred ? 'cursor-pointer' : ''
      }`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#9333EA]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isUpcoming ? (
            <>
              <LivePulse />
              <span className="text-[10px] text-[#9333EA] font-mono tracking-widest">UPCOMING</span>
            </>
          ) : (
            <span className="text-[10px] text-[#666666] font-mono tracking-widest">PAST</span>
          )}
        </div>
        {event.chapter && (
          <span className="text-[10px] text-[#444444] font-mono">{event.chapter}</span>
        )}
      </div>
      
      {/* Event title */}
      <h3 className={`text-lg font-bold text-white mb-2 ${isBlurred ? 'blur-[3px]' : ''}`}>
        {isBlurred ? '████████ NIGHT' : event.title}
      </h3>
      
      {/* Event details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-[#666666]">
          <Calendar className="w-3.5 h-3.5" />
          <span className={isBlurred ? 'blur-[2px]' : ''}>
            {eventDate ? eventDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            }) : 'TBA'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#666666]">
          <MapPin className="w-3.5 h-3.5" />
          <span className={isBlurred ? 'blur-[2px]' : ''}>
            {isBlurred ? 'Location Hidden' : (event.location || 'South Jakarta')}
          </span>
        </div>
        {event.capacity && (
          <div className="flex items-center gap-2 text-sm text-[#666666]">
            <Users className="w-3.5 h-3.5" />
            <span>{event.passesUsed || 0} / {event.capacity} spots</span>
          </div>
        )}
      </div>
      
      {/* CTA */}
      {isBlurred ? (
        <div className="flex items-center gap-2 text-[#9333EA] text-xs font-mono">
          <Lock className="w-3 h-3" />
          <span>MEMBERS ONLY</span>
        </div>
      ) : (
        <Link href={`/events`}>
          <span className="flex items-center gap-2 text-[#9333EA] text-xs font-mono group-hover:gap-3 transition-all">
            VIEW DETAILS
            <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      )}
    </motion.div>
  );
}

// Helper to map drops to specific images based on ID or title
function getProductImage(dropId: number, title?: string): string {
  // Map by ID first
  const idMap: Record<number, string> = {
    30043: '/images/product-sukajan.jpg',
    30044: '/images/product-longsleeve.jpg',
    30045: '/images/product-bomber.jpg',
    30046: '/images/product-hoodie.jpg',
    30047: '/images/product-varsity.jpg',
    30048: '/images/product-chain.jpg',
  };
  
  if (idMap[dropId]) return idMap[dropId];
  
  // Fallback to title matching
  if (title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('noodle bowl') || titleLower.includes('chain')) return '/images/product-chain.jpg';
    if (titleLower.includes('bombae') || titleLower.includes('varsity')) return '/images/product-varsity.jpg';
    if (titleLower.includes('good girl') || titleLower.includes('hoodie')) return '/images/product-hoodie.jpg';
    if (titleLower.includes('tomodachi') || titleLower.includes('bomber')) return '/images/product-bomber.jpg';
  }
  
  return '/images/product-sukajan.jpg';
}

// Drop preview card
function DropPreviewCard({ drop, isBlurred = false }: { drop: any, isBlurred?: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative border border-[#222222] bg-[#0a0a0a] rounded-lg overflow-hidden group"
    >
      {/* Image */}
      <div className="aspect-square bg-[#111111] relative overflow-hidden">
        <img
          src={getProductImage(drop.id, drop.title)}
          alt={drop.title}
          className={`w-full h-full object-cover ${isBlurred ? 'blur-md' : ''}`}
          loading="lazy"
          onError={(e: any) => {
            e.target.src = '/images/product-sukajan.jpg';
          }}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-[10px] font-mono tracking-wider ${
            drop.status === 'active' 
              ? 'bg-[#9333EA] text-white' 
              : 'bg-[#222222] text-[#666666]'
          }`}>
            {drop.status === 'active' ? 'AVAILABLE' : drop.status?.toUpperCase()}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className={`text-sm font-bold text-white mb-1 ${isBlurred ? 'blur-[2px]' : ''}`}>
          {isBlurred ? '██████████' : drop.title}
        </h3>
        <p className="text-xs text-[#666666] mb-3 line-clamp-2">
          {isBlurred ? 'Details hidden' : (drop.tagline || drop.description?.slice(0, 60))}
        </p>
        
        {/* Price and edition */}
        <div className="flex items-center justify-between">
          <span className={`text-sm font-mono ${isBlurred ? 'blur-[2px] text-[#666666]' : 'text-[#9333EA]'}`}>
            {isBlurred ? '███' : (drop.priceIdr ? `IDR ${drop.priceIdr.toLocaleString()}` : 'FREE')}
          </span>
          <span className="text-[10px] text-[#444444] font-mono">
            {drop.totalArtifacts || '??'} editions
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Inside feed preview
function InsideFeedPreview({ activity }: { activity: any[] }) {
  return (
    <div className="space-y-3">
      {activity.slice(0, 4).map((item: any, i: number) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center">
            <span className="text-[10px] text-[#9333EA] font-mono">
              {item.callSign?.[0] || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-white text-sm font-medium">{item.callSign || 'Anonymous'}</span>
            <span className="text-[#666666] text-sm mx-2">
              {item.type === 'marking' ? 'joined' : 
               item.type === 'event' ? 'attended event' : 'was active'}
            </span>
          </div>
          <span className="text-[#444444] text-[10px] font-mono flex-shrink-0">
            {timeAgo(item.timestamp)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [showContent, setShowContent] = useState(false);
  const [serialInput, setSerialInput] = useState('');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { user } = useAuth();
  
  // Determine user's access tier
  const userTier = user?.markState || 'outside';
  
  // Fetch data
  const { data: stats } = trpc.community.getStats.useQuery();
  const { data: activity } = trpc.community.getActivityFeed.useQuery();
  const { data: drops } = trpc.drop.list.useQuery();
  const { data: events } = trpc.event.list.useQuery();
  
  // Find next upcoming event and drop
  const upcomingEvents = events?.filter((e: any) => e.eventDate && new Date(e.eventDate) > new Date()).sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()) || [];
  const nextEvent = upcomingEvents[0];
  const activeDrops = drops?.filter((d: any) => d.status === 'active' && d.saleWindowEnd && new Date(d.saleWindowEnd) > new Date()) || [];
  const nextDropEnd = activeDrops[0];
  
  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % CRYPTIC_TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Get recent drops (limit to 4)
  const recentDrops = drops?.slice(0, 4) || [];
  
  return (
    <SystemBoot onComplete={() => setShowContent(true)}>
      <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
        {/* Navigation */}
        <Nav variant="transparent" />
        
        {/* ================================================================ */}
        {/* HERO SECTION - Full viewport dramatic intro */}
        {/* ================================================================ */}
        <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-16">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#1a1a1a]" />
          
          {/* Animated grid lines */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(147, 51, 234, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(147, 51, 234, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(147,51,234,0.1)_0%,_transparent_70%)]" />
          
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            {/* Live indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={showContent ? { opacity: 1 } : {}}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <LivePulse />
              <span className="text-[#666666] text-xs font-mono tracking-widest">
                {stats?.totalMarked || 0} MEMBERS ACTIVE
              </span>
            </motion.div>
            
            {/* Chapter announcement */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-8"
            >
              <GlowPulse color="#9333EA">
                <span className="inline-block px-4 py-2 border border-[#9333EA]/50 text-[#9333EA] text-xs font-mono tracking-[0.3em] uppercase">
                  <FlickerText intensity="light">INVITATION ONLY</FlickerText>
                </span>
              </GlowPulse>
            </motion.div>
            
            {/* Chapter label */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={showContent ? { opacity: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-[#666666] text-sm font-mono tracking-[0.5em] uppercase mb-4"
            >
              <DecryptText text="CHAPTER ONE" delay={500} speed={40} />
            </motion.p>
            
            {/* Main title - SEO H1 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={showContent ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-4"
            >
              <h1 className="text-[15vw] md:text-[12vw] lg:text-[10rem] font-black leading-[0.85] tracking-tighter">
                <ChromaticText intensity={3}>
                  <DecryptText text="JXL" delay={700} speed={50} />
                </ChromaticText>
                <span className="sr-only">COMM@ - Exclusive Streetwear Collective Jakarta</span>
              </h1>
            </motion.div>
            
            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={showContent ? { opacity: 1 } : {}}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mb-8"
            >
              <span className="text-[8vw] md:text-[6vw] lg:text-[5rem] font-black text-[#9333EA] tracking-tight block">
                <DecryptText text="TAKEOVER" delay={900} speed={40} />
              </span>
            </motion.div>
            
            {/* Location */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={showContent ? { opacity: 1 } : {}}
              transition={{ delay: 1, duration: 0.6 }}
              className="text-[#666666] text-sm font-mono tracking-widest uppercase mb-12"
            >
              South Jakarta, Indonesia
            </motion.p>
            
            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="flex justify-center gap-8 md:gap-16 mb-12"
            >
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">
                  <CycleNumber value={stats?.totalMarked || 0} delay={1300} duration={1000} />
                </div>
                <div className="text-xs text-[#666666] font-mono tracking-widest uppercase mt-1">Marked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">
                  <CycleNumber value={stats?.totalArtifacts || 0} delay={1400} duration={1000} />
                </div>
                <div className="text-xs text-[#666666] font-mono tracking-widest uppercase mt-1">Marks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">
                  <CycleNumber value={stats?.totalEvents || 0} delay={1500} duration={1000} />
                </div>
                <div className="text-xs text-[#666666] font-mono tracking-widest uppercase mt-1">Events</div>
              </div>
            </motion.div>
            
            {/* COUNTDOWN SECTION - Next Event or Drop */}
            {(nextEvent || nextDropEnd) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={showContent ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.3, duration: 0.6 }}
                className="mb-12"
              >
                <div className="inline-block p-6 border border-[#9333EA]/30 bg-[#9333EA]/5 rounded-lg backdrop-blur-sm">
                  {nextEvent?.eventDate ? (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-[#9333EA]" />
                        <span className="text-[#9333EA] text-xs font-mono tracking-widest uppercase">NEXT SECRET EVENT</span>
                      </div>
                      <Countdown 
                        targetDate={new Date(nextEvent.eventDate)} 
                        size="md"
                        variant="default"
                      />
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <MembersOnlyBadge pulse={false} />
                      </div>
                    </>
                  ) : nextDropEnd?.saleWindowEnd ? (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-[#9333EA]" />
                        <span className="text-[#9333EA] text-xs font-mono tracking-widest uppercase">DROP ENDS IN</span>
                      </div>
                      <Countdown 
                        targetDate={new Date(nextDropEnd.saleWindowEnd)} 
                        size="md"
                        variant="urgent"
                      />
                      <div className="mt-3 text-center">
                        <span className="text-white text-sm font-medium">{nextDropEnd.title}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              </motion.div>
            )}
            
            {/* Access Level Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={showContent ? { opacity: 1 } : {}}
              transition={{ delay: 1.35, duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-[#444444] text-xs font-mono">YOUR ACCESS:</span>
                <AccessBadge tier={userTier as any} size="sm" />
              </div>
            </motion.div>
            
            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center px-4 sm:px-0"
            >
              <GlitchHover>
                <Link href="/drops">
                  <GlowPulse color="#9333EA">
                    <button className="w-full sm:w-auto px-8 py-4 bg-[#9333EA] text-white font-bold text-sm tracking-widest uppercase btn-gradient-hover min-h-[48px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]">
                      <span>BROWSE DROPS</span>
                    </button>
                  </GlowPulse>
                </Link>
              </GlitchHover>
              
              <GlitchHover>
                <Link href="/events">
                  <button className="w-full sm:w-auto px-8 py-4 border border-[#333333] text-white font-bold text-sm tracking-widest uppercase min-h-[48px] transition-all duration-300 hover:border-[#9333EA] hover:text-[#9333EA] hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] shimmer-hover">
                    VIEW EVENTS
                  </button>
                </Link>
              </GlitchHover>
            </motion.div>
            
            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={showContent ? { opacity: 1 } : {}}
              transition={{ delay: 2, duration: 0.6 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[#333333] text-xs font-mono tracking-widest"
              >
                SCROLL
              </motion.div>
            </motion.div>
          </div>
        </section>
        
        {/* ================================================================ */}
        {/* RECENT DROPS PREVIEW */}
        {/* ================================================================ */}
        <section className="relative py-20 md:py-28 px-4 bg-[#050505]">
          <div className="max-w-6xl mx-auto">
            <RevealOnScroll>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#9333EA]" />
                  <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase">
                    LATEST DROPS
                  </p>
                </div>
                <Link href="/drops">
                  <span className="text-[#9333EA] text-xs font-mono tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                    VIEW ALL <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={100}>
              <h2 className="text-2xl md:text-4xl font-bold mb-8">
                Exclusive marks for the collective
              </h2>
            </RevealOnScroll>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {recentDrops.length > 0 ? (
                recentDrops.map((drop: any, i: number) => (
                  <RevealOnScroll key={drop.id} delay={200 + i * 100}>
                    <Link href={`/drops/${drop.id}`}>
                      <DropPreviewCard drop={drop} />
                    </Link>
                  </RevealOnScroll>
                ))
              ) : (
                // Placeholder cards when no drops
                [1, 2, 3, 4].map((i) => (
                  <RevealOnScroll key={i} delay={200 + i * 100}>
                    <DropPreviewCard drop={{ title: 'Coming Soon', status: 'upcoming' }} isBlurred />
                  </RevealOnScroll>
                ))
              )}
            </div>
          </div>
        </section>
        
        {/* ================================================================ */}
        {/* UPCOMING EVENTS PREVIEW */}
        {/* ================================================================ */}
        <section className="relative py-20 md:py-28 px-4">
          <div className="max-w-6xl mx-auto">
            <RevealOnScroll>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#9333EA]" />
                  <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase">
                    SECRET EVENTS
                  </p>
                </div>
                <Link href="/events">
                  <span className="text-[#9333EA] text-xs font-mono tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                    VIEW ALL <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={100}>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                What happens inside
              </h2>
            </RevealOnScroll>
            
            <RevealOnScroll delay={200}>
              <p className="text-[#666666] mb-8 max-w-2xl">
                Members-only gatherings. Locations revealed 24 hours before. No phones. No photos.
                Get a mark to unlock access.
              </p>
            </RevealOnScroll>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Blurred event previews to create mystery */}
              <RevealOnScroll delay={300}>
                <EventPreviewCard 
                  event={{ 
                    title: 'MARKED NIGHT', 
                    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    chapter: 'JXL',
                    capacity: 100,
                    passesUsed: 47
                  }} 
                  isBlurred 
                />
              </RevealOnScroll>
              
              <RevealOnScroll delay={400}>
                <EventPreviewCard 
                  event={{ 
                    title: 'THE GATHERING', 
                    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    chapter: 'JXL',
                    capacity: 50,
                    passesUsed: 23
                  }} 
                  isBlurred 
                />
              </RevealOnScroll>
              
              <RevealOnScroll delay={500}>
                <EventPreviewCard 
                  event={{ 
                    title: 'CHAPTER LAUNCH', 
                    eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    chapter: 'NEW',
                    capacity: 200,
                    passesUsed: 0
                  }} 
                  isBlurred 
                />
              </RevealOnScroll>
            </div>
            
            {/* CTA to get access */}
            <RevealOnScroll delay={600}>
              <div className="mt-8 text-center">
                <Link href="/drops">
                  <GlowPulse color="#9333EA">
                    <button className="px-8 py-4 bg-[#9333EA] text-white font-bold text-sm tracking-widest uppercase hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all">
                      GET A MARK TO UNLOCK
                    </button>
                  </GlowPulse>
                </Link>
              </div>
            </RevealOnScroll>
          </div>
        </section>
        
        {/* ================================================================ */}
        {/* INSIDE THE COLLECTIVE - Sneak Peek */}
        {/* ================================================================ */}
        <section className="relative py-20 md:py-28 px-4 bg-[#050505]">
          <div className="max-w-6xl mx-auto">
            <RevealOnScroll>
              <div className="flex items-center gap-3 mb-8">
                <Zap className="w-4 h-4 text-[#9333EA]" />
                <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase">
                  INSIDE THE COLLECTIVE
                </p>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={100}>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                A glimpse of what awaits
              </h2>
            </RevealOnScroll>
            
            <RevealOnScroll delay={200}>
              <p className="text-[#666666] mb-12 max-w-2xl">
                Members get access to exclusive content, real-time updates, and a community 
                that protects what matters.
              </p>
            </RevealOnScroll>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Live Feed Preview */}
              <RevealOnScroll delay={300}>
                <div className="p-6 border border-[#222222] bg-[#0a0a0a] rounded-lg h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <LivePulse />
                    <h3 className="text-white font-bold">Live Feed</h3>
                  </div>
                  <p className="text-[#666666] text-sm mb-4">
                    Real-time updates from the collective
                  </p>
                  
                  {activity && activity.length > 0 ? (
                    <InsideFeedPreview activity={activity} />
                  ) : (
                    <ClassifiedContent label="MEMBERS ONLY">
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-[#111111] rounded">
                            <div className="w-8 h-8 rounded-full bg-[#222222]" />
                            <div className="flex-1 h-4 bg-[#222222] rounded" />
                          </div>
                        ))}
                      </div>
                    </ClassifiedContent>
                  )}
                </div>
              </RevealOnScroll>
              
              {/* Leaderboard Preview */}
              <RevealOnScroll delay={400}>
                <div className="p-6 border border-[#222222] bg-[#0a0a0a] rounded-lg h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-[#9333EA]" />
                    <h3 className="text-white font-bold">Leaderboard</h3>
                  </div>
                  <p className="text-[#666666] text-sm mb-4">
                    Top collectors and event attendees
                  </p>
                  
                  <ClassifiedContent label="MEMBERS ONLY">
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                          <span className="text-[#9333EA] font-mono text-sm w-6">#{i}</span>
                          <div className="w-6 h-6 rounded-full bg-[#222222]" />
                          <div className="flex-1 h-3 bg-[#222222] rounded" />
                          <span className="text-[#666666] text-xs">??? pts</span>
                        </div>
                      ))}
                    </div>
                  </ClassifiedContent>
                </div>
              </RevealOnScroll>
              
              {/* Referral Preview */}
              <RevealOnScroll delay={500}>
                <div className="p-6 border border-[#222222] bg-[#0a0a0a] rounded-lg h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-4 h-4 text-[#9333EA]" />
                    <h3 className="text-white font-bold">Referrals</h3>
                  </div>
                  <p className="text-[#666666] text-sm mb-4">
                    Invite friends, earn rewards
                  </p>
                  
                  <ClassifiedContent label="MEMBERS ONLY">
                    <div className="text-center py-6">
                      <div className="text-4xl font-bold text-white mb-2">???</div>
                      <div className="text-xs text-[#666666]">Your referral code</div>
                      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold text-white">?</div>
                          <div className="text-[10px] text-[#666666]">Invited</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white">?</div>
                          <div className="text-[10px] text-[#666666]">Joined</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-[#9333EA]">?</div>
                          <div className="text-[10px] text-[#666666]">Points</div>
                        </div>
                      </div>
                    </div>
                  </ClassifiedContent>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>
        
        {/* ================================================================ */}
        {/* CRYPTIC TESTIMONIAL BANNER */}
        {/* ================================================================ */}
        <section className="relative py-12 px-4 border-y border-[#1a1a1a] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto text-center"
            >
              <p className="text-[#888888] text-lg md:text-xl italic mb-2">
                "{CRYPTIC_TESTIMONIALS[activeTestimonial].quote}"
              </p>
              <p className="text-[#9333EA] text-xs font-mono tracking-widest">
                — {CRYPTIC_TESTIMONIALS[activeTestimonial].author}
              </p>
            </motion.div>
          </AnimatePresence>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-4">
            {CRYPTIC_TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === activeTestimonial ? 'bg-[#9333EA]' : 'bg-[#333333]'
                }`}
              />
            ))}
          </div>
        </section>
        
        {/* ================================================================ */}
        {/* MEMBERSHIP TIERS SECTION */}
        {/* ================================================================ */}
        <section className="relative py-20 md:py-28 px-4">
          <div className="max-w-5xl mx-auto">
            <RevealOnScroll>
              <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase mb-6 text-center">
                THE HIERARCHY
              </p>
            </RevealOnScroll>
            
            <RevealOnScroll delay={100}>
              <h2 className="text-2xl md:text-4xl font-bold text-center mb-4">
                Earn your place
              </h2>
            </RevealOnScroll>
            
            <RevealOnScroll delay={200}>
              <p className="text-[#666666] text-center mb-6 max-w-2xl mx-auto">
                Access is earned, not given. Each mark brings you deeper into the collective.
              </p>
            </RevealOnScroll>
            
            {/* Journey explanation */}
            <RevealOnScroll delay={250}>
              <div className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-6 mb-12 max-w-3xl mx-auto">
                <p className="text-[#9333EA] text-xs font-mono tracking-widest mb-4 text-center">HOW TO RISE</p>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[#444444] text-xs font-mono">OUTSIDE</span>
                    <span className="text-[#666666] text-[10px] mt-1">Get a mark</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#333333] rotate-90 md:rotate-0" />
                  <div className="flex flex-col items-center">
                    <span className="text-[#666666] text-xs font-mono">INITIATE</span>
                    <span className="text-[#666666] text-[10px] mt-1">2 events + 3 marks</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#333333] rotate-90 md:rotate-0" />
                  <div className="flex flex-col items-center">
                    <span className="text-[#888888] text-xs font-mono">MEMBER</span>
                    <span className="text-[#666666] text-[10px] mt-1">5 referrals + 5 events</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#333333] rotate-90 md:rotate-0" />
                  <div className="flex flex-col items-center">
                    <span className="text-[#9333EA] text-xs font-mono">INNER CIRCLE</span>
                    <span className="text-[#666666] text-[10px] mt-1">By invitation</span>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
            
            <div className="grid md:grid-cols-4 gap-4">
              {MEMBER_TIERS.map((tier, i) => (
                <RevealOnScroll key={tier.name} delay={300 + i * 100}>
                  <div 
                    className={`relative p-6 border bg-[#0a0a0a] h-full transition-all duration-300 hover:scale-[1.02] rounded-lg card-gradient-hover ${
                      tier.name === 'INNER CIRCLE' 
                        ? 'border-[#9333EA]/50 hover:border-[#9333EA]' 
                        : 'border-[#222222] hover:border-[#333333]'
                    }`}
                  >
                    {/* Tier indicator */}
                    <div className="flex items-center gap-3 mb-4">
                      <tier.icon className="w-5 h-5" style={{ color: tier.color }} />
                      <span 
                        className="text-xs font-mono tracking-widest"
                        style={{ color: tier.color }}
                      >
                        {tier.name}
                      </span>
                    </div>
                    
                    <p className="text-white text-sm font-medium mb-3">{tier.description}</p>
                    
                    {/* Access list */}
                    <ul className="space-y-1 mb-4">
                      {tier.access.map((item, j) => (
                        <li key={j} className="text-[#666666] text-xs flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    
                    {/* How to advance */}
                    {tier.howToAdvance && (
                      <div className="pt-3 border-t border-[#222222]">
                        <p className="text-[10px] text-[#444444] uppercase tracking-wider mb-1">Next level:</p>
                        <p className="text-xs text-[#9333EA]">{tier.howToAdvance}</p>
                      </div>
                    )}
                    
                    {/* Glow effect for Inner Circle */}
                    {tier.name === 'INNER CIRCLE' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-[#9333EA]/5 to-transparent pointer-events-none rounded-lg" />
                    )}
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
        
        {/* ================================================================ */}
        {/* THE CODE SECTION */}
        {/* ================================================================ */}
        <section className="relative py-20 md:py-28 px-4 bg-[#050505]">
          {/* Diagonal lines background */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(147, 51, 234, 0.5) 10px,
                rgba(147, 51, 234, 0.5) 11px
              )`,
            }}
          />
          
          <div className="relative max-w-4xl mx-auto text-center">
            <RevealOnScroll>
              <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase mb-12">
                THE CODE
              </p>
            </RevealOnScroll>
            
            <div className="space-y-6 md:space-y-8">
              {MANIFESTO.map((line, i) => (
                <RevealOnScroll key={i} delay={i * 150}>
                  <p className="text-xl md:text-2xl lg:text-3xl font-light text-[#888888]">
                    {line.text.split(line.emphasis).map((part, j) => (
                      <span key={j}>
                        {part}
                        {j === 0 && <span className="text-[#9333EA] font-medium">{line.emphasis}</span>}
                      </span>
                    ))}
                  </p>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
        
        {/* ================================================================ */}
        {/* VERIFY CTA SECTION */}
        {/* ================================================================ */}
        <section className="relative py-20 md:py-28 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <RevealOnScroll>
              <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase mb-6">
                GET STARTED
              </p>
            </RevealOnScroll>
            
            <RevealOnScroll delay={100}>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Have a mark?
              </h2>
            </RevealOnScroll>
            
            <RevealOnScroll delay={200}>
              <p className="text-[#888888] mb-8">
                Enter your serial number to verify authenticity and begin the marking process.
              </p>
            </RevealOnScroll>
            
            <RevealOnScroll delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                  placeholder="GN001-001"
                  className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-[#333333] text-white font-mono text-center tracking-widest placeholder:text-[#444444] focus:border-[#9333EA] focus:outline-none transition-colors rounded-lg"
                />
                <GlitchHover>
                  <GlowPulse color="#9333EA">
                    <button 
                      onClick={() => serialInput && setLocation(`/verify/${serialInput}`)}
                      className="px-6 py-3 bg-[#9333EA] text-white font-bold text-sm tracking-widest uppercase hover:bg-[#A855F7] transition-colors rounded-lg"
                    >
                      VERIFY
                    </button>
                  </GlowPulse>
                </GlitchHover>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={400}>
              <p className="text-[#444444] text-xs font-mono mt-4">
                Look for a tag or label on your mark. Format: GN001-001
              </p>
            </RevealOnScroll>
            
            {/* Don't have a mark? */}
            <RevealOnScroll delay={500}>
              <div className="mt-12 pt-8 border-t border-[#1a1a1a]">
                <p className="text-[#666666] text-sm mb-4">Don't have a mark yet?</p>
                <Link href="/drops">
                  <button className="text-[#9333EA] text-sm font-mono tracking-widest hover:underline">
                    BROWSE AVAILABLE DROPS →
                  </button>
                </Link>
              </div>
            </RevealOnScroll>
          </div>
        </section>
        
        {/* ================================================================ */}
        {/* SPONSORS */}
        {/* ================================================================ */}
        <ClearanceTest />
        
        {/* Featured Partner Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-black via-yellow-950/10 to-black border-y border-yellow-500/20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-xs text-yellow-400 tracking-[0.3em] uppercase mb-4 font-bold">Platinum Partner</p>
              <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 mb-4">FEELBERT GROUP</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">BUAT YANG TAU TAU AJA</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-yellow-500/20 to-amber-600/15 border-2 border-yellow-400/50 rounded-2xl p-12 hover:border-yellow-400/80 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/20"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="text-6xl font-black text-yellow-300 mb-4">FEEL?</div>
                  <h3 className="text-2xl font-bold text-yellow-300 mb-3">TRULY GABUT</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Sponsored by Feelbert Group — supporting intimate culture events, spontaneous missions, and nights worth remembering.
                  </p>
                  <a 
                    href="#"
                    className="inline-block px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold rounded-lg hover:from-yellow-300 hover:to-amber-400 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/50"
                  >
                    Explore Partnership
                  </a>
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-block bg-gradient-to-br from-yellow-400/30 to-amber-600/20 border border-yellow-400/50 rounded-xl p-4 overflow-hidden">
                    <img src="/monkey-nft.png" alt="FEELBERT Group Monkey NFT" className="w-48 h-48 object-contain" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        
        <SponsorShowcase />
        
        {/* ================================================================ */}
        {/* FOOTER */}
        {/* ================================================================ */}
        <footer className="py-12 px-4 border-t border-[#1a1a1a] bg-[#050505]">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div>
                <div className="text-[#9333EA] text-3xl font-black mb-2">@</div>
                <div className="text-[#444444] text-xs font-mono tracking-widest mb-4">
                  CHAPTER ONE — JXL TAKEOVER
                </div>
                <p className="text-[#666666] text-sm">
                  An invitation-only collective protecting underground culture.
                </p>
              </div>
              
              {/* Explore */}
              <div>
                <h4 className="text-white text-sm font-bold mb-4">EXPLORE</h4>
                <div className="space-y-2">
                  <Link href="/drops" className="block text-[#666666] hover:text-[#9333EA] text-sm transition-colors">
                    Drops
                  </Link>
                  <Link href="/events" className="block text-[#666666] hover:text-[#9333EA] text-sm transition-colors">
                    Events
                  </Link>
                  <Link href="/verify" className="block text-[#666666] hover:text-[#9333EA] text-sm transition-colors">
                    Verify Mark
                  </Link>
                </div>
              </div>
              
              {/* Members */}
              <div>
                <h4 className="text-white text-sm font-bold mb-4">MEMBERS</h4>
                <div className="space-y-2">
                  <Link href="/inside" className="block text-[#666666] hover:text-[#9333EA] text-sm transition-colors">
                    Inside Feed
                  </Link>
                  <Link href="/leaderboard" className="block text-[#666666] hover:text-[#9333EA] text-sm transition-colors">
                    Leaderboard
                  </Link>
                  <Link href="/referral" className="block text-[#666666] hover:text-[#9333EA] text-sm transition-colors">
                    Referrals
                  </Link>
                </div>
              </div>
              
              {/* Partners */}
              <div>
                <h4 className="text-white text-sm font-bold mb-4">PARTNERS</h4>
                <div className="space-y-2">
                  <Link href="/sponsors" className="block text-[#666666] hover:text-[#9333EA] text-sm transition-colors">
                    Become a Partner
                  </Link>
                  <Link href="/apply" className="block text-[#666666] hover:text-[#9333EA] text-sm transition-colors">
                    Apply for Clearance
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-[#1a1a1a] text-center">
              <p className="text-[#333333] text-xs font-mono">
                The mark is the key. The Mark is the lock. The collective is the room.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </SystemBoot>
  );
}
