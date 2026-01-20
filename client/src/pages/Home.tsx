import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import Nav from "@/components/Nav";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Lock, Eye, EyeOff, Users, Calendar, Shield, ChevronRight, ChevronDown,
  Zap, Sparkles, MapPin, Clock, ArrowRight, Star, Gift, Trophy,
  Search, Filter, X, Check, ChevronUp, Play, Pause
} from "lucide-react";
import { 
  RevealOnScroll,
  GlowPulse,
  SystemBoot,
} from "@/components/Effects2200";
import { SponsorShowcase } from "@/components/SponsorShowcase";
import { ImageFallback, getDropImage } from "@/components/ImageFallback";

// ============================================================================
// NOCTA-STYLE HOME PAGE - EVENTS HERO + MERCH + COMMUNITY
// ============================================================================

// Time filter options
const TIME_FILTERS = [
  { id: "now", label: "Now" },
  { id: "upcoming", label: "Upcoming" },
  { id: "this_week", label: "This Week" },
];

// Location filter options (editable)
const LOCATION_FILTERS = [
  { id: "all", label: "All Locations" },
  { id: "south_jakarta", label: "South Jakarta" },
  { id: "central_jakarta", label: "Central Jakarta" },
  { id: "north_jakarta", label: "North Jakarta" },
  { id: "bandung", label: "Bandung" },
  { id: "bali", label: "Bali" },
];

// Format date with full words (no abbreviations)
const formatEventDate = (date: Date | string | null) => {
  if (!date) return "To Be Announced";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatEventTime = (date: Date | string | null) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Get CTA button based on access type and status
const getEventCTA = (event: any, isVerified: boolean) => {
  if (event.status === "cancelled") {
    return { text: "Cancelled", disabled: true, variant: "cancelled" };
  }
  if (event.soldOut || (event.capacity && event.passesUsed >= event.capacity)) {
    return { text: "Sold Out", disabled: true, variant: "soldout" };
  }
  
  switch (event.accessType) {
    case "invite_only":
      return { text: "Request Access", disabled: false, variant: "invite" };
    case "members_only":
      if (!isVerified) {
        return { text: "Members Only", disabled: true, variant: "locked" };
      }
      return { text: "Reserve", disabled: false, variant: "reserve" };
    case "open":
    default:
      return { text: "Reserve", disabled: false, variant: "reserve" };
  }
};

// Secret level indicator
function SecretLevelIndicator({ level }: { level: string | null }) {
  if (!level) return null;
  
  const levels = {
    low: { bars: 1, color: "bg-green-500" },
    medium: { bars: 2, color: "bg-yellow-500" },
    high: { bars: 3, color: "bg-red-500" },
  };
  
  const config = levels[level as keyof typeof levels] || levels.medium;
  
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-[#666666] font-mono uppercase mr-1">Secret</span>
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1 h-3 rounded-sm ${
              i <= config.bars ? config.color : "bg-[#333333]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Event tag badge
function EventTag({ tag }: { tag: string }) {
  return (
    <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[#1a1a1a] text-[#888888] border border-[#333333]">
      {tag}
    </span>
  );
}

// ============================================================================
// EVENTS HERO SECTION - Nocta-style pinned scroll
// ============================================================================
function EventsHeroSection({ events, isVerified }: { events: any[], isVerified: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeFilter, setTimeFilter] = useState("upcoming");
  const [locationFilter, setLocationFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter events
  const filteredEvents = events.filter((event) => {
    // Time filter
    const now = new Date();
    const eventDate = event.startDatetime ? new Date(event.startDatetime) : 
                      event.eventDate ? new Date(event.eventDate) : null;
    
    if (timeFilter === "now" && eventDate) {
      const endDate = event.endDatetime ? new Date(event.endDatetime) : 
                      new Date(eventDate.getTime() + 4 * 60 * 60 * 1000);
      if (!(now >= eventDate && now <= endDate)) return false;
    }
    if (timeFilter === "upcoming" && eventDate && eventDate < now) return false;
    if (timeFilter === "this_week" && eventDate) {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (eventDate > weekFromNow) return false;
    }
    
    // Location filter
    if (locationFilter !== "all") {
      const cityMatch = event.city?.toLowerCase().replace(/\s+/g, "_") === locationFilter;
      const areaMatch = event.area?.toLowerCase().replace(/\s+/g, "_") === locationFilter;
      if (!cityMatch && !areaMatch) return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = event.title?.toLowerCase().includes(query);
      const venueMatch = event.venueName?.toLowerCase().includes(query);
      const tagsMatch = event.tags?.toLowerCase().includes(query);
      if (!titleMatch && !venueMatch && !tagsMatch) return false;
    }
    
    return true;
  });
  
  // Auto-play through events
  useEffect(() => {
    if (isAutoPlaying && filteredEvents.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredEvents.length);
      }, 5000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, filteredEvents.length]);
  
  // Handle scroll/swipe
  const handleScroll = useCallback((direction: "up" | "down") => {
    setIsAutoPlaying(false);
    if (direction === "down") {
      setCurrentIndex((prev) => Math.min(prev + 1, filteredEvents.length - 1));
    } else {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  }, [filteredEvents.length]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        handleScroll("down");
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        handleScroll("up");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleScroll]);
  
  const currentEvent = filteredEvents[currentIndex];
  
  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen bg-black overflow-hidden"
    >
      {/* Background image with parallax */}
      <AnimatePresence mode="wait">
        {currentEvent && (
          <motion.div
            key={currentEvent.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            {currentEvent.coverImageUrl ? (
              <img
                src={currentEvent.coverImageUrl}
                alt={currentEvent.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />
            )}
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Filters bar */}
      <div className="absolute top-20 left-0 right-0 z-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            {/* Time filters */}
            <div className="flex bg-[#111111]/80 backdrop-blur-sm border border-[#333333] rounded-lg p-1">
              {TIME_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => { setTimeFilter(filter.id); setCurrentIndex(0); }}
                  className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                    timeFilter === filter.id
                      ? "bg-[#3B82F6] text-white"
                      : "text-[#888888] hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* Location filter */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-[#111111]/80 backdrop-blur-sm border border-[#333333] text-[#888888] text-xs font-mono uppercase tracking-wider hover:text-white transition-all"
              >
                <MapPin className="w-3 h-3" />
                {LOCATION_FILTERS.find(l => l.id === locationFilter)?.label}
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showFilters && (
                <div className="absolute top-full mt-2 left-0 bg-[#111111] border border-[#333333] rounded-lg overflow-hidden z-30">
                  {LOCATION_FILTERS.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => { setLocationFilter(loc.id); setShowFilters(false); setCurrentIndex(0); }}
                      className={`block w-full px-4 py-2 text-left text-xs font-mono uppercase tracking-wider transition-all ${
                        locationFilter === loc.id
                          ? "bg-[#3B82F6] text-white"
                          : "text-[#888888] hover:bg-[#1a1a1a] hover:text-white"
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#666666]" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentIndex(0); }}
                className="w-full pl-8 pr-4 py-2 bg-[#111111]/80 backdrop-blur-sm border border-[#333333] text-white text-xs font-mono placeholder-[#666666] focus:outline-none focus:border-[#3B82F6]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Event content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-32 w-full">
          <AnimatePresence mode="wait">
            {currentEvent ? (
              <motion.div
                key={currentEvent.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl"
              >
                {/* Tags */}
                {currentEvent.tags && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {JSON.parse(currentEvent.tags || "[]").slice(0, 4).map((tag: string) => (
                      <EventTag key={tag} tag={tag} />
                    ))}
                  </div>
                )}
                
                {/* Secret level */}
                <div className="mb-4">
                  <SecretLevelIndicator level={currentEvent.secretLevel} />
                </div>
                
                {/* Title */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight">
                  {currentEvent.title}
                </h1>
                
                {/* Tagline */}
                {currentEvent.tagline && (
                  <p className="text-lg md:text-xl text-[#cccccc] mb-6 font-light">
                    {currentEvent.tagline}
                  </p>
                )}
                
                {/* Event details */}
                <div className="space-y-3 mb-8">
                  {/* Date & Time */}
                  <div className="flex items-center gap-3 text-[#888888]">
                    <Calendar className="w-4 h-4 text-[#3B82F6]" />
                    <span className="text-sm">
                      {formatEventDate(currentEvent.startDatetime || currentEvent.eventDate)}
                      {currentEvent.startDatetime && (
                        <span className="text-[#666666]"> at {formatEventTime(currentEvent.startDatetime)}</span>
                      )}
                    </span>
                  </div>
                  
                  {/* Location */}
                  <div className="flex items-center gap-3 text-[#888888]">
                    <MapPin className="w-4 h-4 text-[#3B82F6]" />
                    <span className="text-sm">
                      {currentEvent.accessType === "invite_only" && !isVerified ? (
                        <span className="text-[#666666]">Location revealed upon approval</span>
                      ) : currentEvent.accessType === "members_only" && !isVerified ? (
                        <span>
                          {currentEvent.city || "Jakarta"}
                          {currentEvent.area && `, ${currentEvent.area}`}
                          <span className="text-[#666666]"> • Venue revealed to members</span>
                        </span>
                      ) : (
                        <span>
                          {currentEvent.venueName && `${currentEvent.venueName}, `}
                          {currentEvent.city || "Jakarta"}
                          {currentEvent.area && `, ${currentEvent.area}`}
                        </span>
                      )}
                    </span>
                  </div>
                  
                  {/* Capacity */}
                  {currentEvent.capacity && (
                    <div className="flex items-center gap-3 text-[#888888]">
                      <Users className="w-4 h-4 text-[#3B82F6]" />
                      <span className="text-sm">
                        {currentEvent.passesUsed || 0} of {currentEvent.capacity} spots claimed
                      </span>
                    </div>
                  )}
                </div>
                
                {/* CTA Button */}
                {(() => {
                  const cta = getEventCTA(currentEvent, isVerified);
                  return (
                    <Link href={`/gatherings/${currentEvent.id}`}>
                      <button
                        disabled={cta.disabled}
                        className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all ${
                          cta.variant === "reserve"
                            ? "bg-[#3B82F6] text-white hover:bg-[#2563EB] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                            : cta.variant === "invite"
                            ? "bg-transparent border-2 border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white"
                            : cta.variant === "locked"
                            ? "bg-[#222222] text-[#666666] cursor-not-allowed"
                            : cta.variant === "soldout"
                            ? "bg-[#1a1a1a] text-[#666666] cursor-not-allowed line-through"
                            : "bg-[#333333] text-[#666666] cursor-not-allowed"
                        }`}
                      >
                        {cta.variant === "locked" && <Lock className="w-4 h-4 inline mr-2" />}
                        {cta.text}
                      </button>
                    </Link>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-[#666666] text-lg">No events match your filters</p>
                <button
                  onClick={() => { setTimeFilter("upcoming"); setLocationFilter("all"); setSearchQuery(""); }}
                  className="mt-4 text-[#3B82F6] text-sm font-mono uppercase tracking-wider hover:underline"
                >
                  Clear filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Progress indicator */}
      {filteredEvents.length > 1 && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-center gap-4">
          {/* Current / Total */}
          <div className="text-[#666666] text-xs font-mono">
            <span className="text-white">{currentIndex + 1}</span>
            <span className="mx-1">/</span>
            <span>{filteredEvents.length}</span>
          </div>
          
          {/* Progress dots */}
          <div className="flex flex-col gap-2">
            {filteredEvents.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIndex(i); setIsAutoPlaying(false); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? "bg-[#3B82F6] scale-125"
                    : "bg-[#333333] hover:bg-[#666666]"
                }`}
              />
            ))}
          </div>
          
          {/* Auto-play toggle */}
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="p-2 text-[#666666] hover:text-white transition-colors"
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      )}
      
      {/* Navigation arrows */}
      {filteredEvents.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
          <button
            onClick={() => handleScroll("up")}
            disabled={currentIndex === 0}
            className={`p-3 border border-[#333333] transition-all ${
              currentIndex === 0
                ? "text-[#333333] cursor-not-allowed"
                : "text-white hover:border-[#3B82F6] hover:text-[#3B82F6]"
            }`}
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleScroll("down")}
            disabled={currentIndex === filteredEvents.length - 1}
            className={`p-3 border border-[#333333] transition-all ${
              currentIndex === filteredEvents.length - 1
                ? "text-[#333333] cursor-not-allowed"
                : "text-white hover:border-[#3B82F6] hover:text-[#3B82F6]"
            }`}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 right-8 z-20 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[#333333] text-xs font-mono tracking-widest flex items-center gap-2"
        >
          <span>SCROLL</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================================
// MERCH SECTION - Drop-style grid
// ============================================================================
function MerchSection({ drops }: { drops: any[] }) {
  // Separate featured and regular drops
  const featuredDrops = drops.filter(d => d.featuredOrder && d.featuredOrder > 0).slice(0, 3);
  const regularDrops = drops.filter(d => !d.featuredOrder || d.featuredOrder === 0);
  
  // Get availability status
  const getAvailability = (drop: any) => {
    if (drop.status === "sold_out" || (drop.totalEditions && drop.soldCount >= drop.totalEditions)) {
      return { text: "Sold Out", variant: "soldout" };
    }
    if (drop.totalEditions && drop.soldCount >= drop.totalEditions * 0.8) {
      return { text: "Limited", variant: "limited" };
    }
    return { text: "In Stock", variant: "instock" };
  };
  
  // Format price
  const formatPrice = (price: number | string | null) => {
    if (!price) return "Inquire";
    const num = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };
  
  return (
    <section className="relative py-20 md:py-32 px-4 bg-[#050505]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <RevealOnScroll>
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase">
                  EXCLUSIVE MARKS
                </p>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white">
                The Drop
              </h2>
            </div>
            <Link href="/marks">
              <span className="text-[#3B82F6] text-sm font-mono uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all">
                View All <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </RevealOnScroll>
        
        {/* Why this matters */}
        <RevealOnScroll delay={100}>
          <p className="text-[#888888] text-lg mb-12 max-w-2xl">
            Each mark is more than merchandise. It is your key to the collective, 
            your proof of belonging, your entry to what happens inside.
          </p>
        </RevealOnScroll>
        
        {/* Featured row */}
        {featuredDrops.length > 0 && (
          <div className="mb-12">
            <RevealOnScroll delay={150}>
              <p className="text-[#666666] text-xs font-mono tracking-widest uppercase mb-6">Featured</p>
            </RevealOnScroll>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredDrops.map((drop, i) => (
                <RevealOnScroll key={drop.id} delay={200 + i * 100}>
                  <Link href={`/marks/${drop.id}`}>
                    <div className="group relative bg-[#0a0a0a] border border-[#222222] overflow-hidden hover:border-[#3B82F6] transition-all">
                      {/* Image */}
                      <div className="aspect-square bg-[#111111] relative overflow-hidden">
                        <img
                          src={drop.heroImageUrl || getDropImage(drop.id, drop.heroImageUrl, drop.title)}
                          alt={drop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider bg-[#3B82F6] text-white">
                            Featured
                          </span>
                          {drop.status === "active" && (
                            <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider bg-green-500 text-white">
                              New
                            </span>
                          )}
                        </div>
                        {/* Availability badge */}
                        {(() => {
                          const avail = getAvailability(drop);
                          return (
                            <div className={`absolute top-3 right-3 px-2 py-1 text-[10px] font-mono uppercase tracking-wider ${
                              avail.variant === "soldout" ? "bg-red-500/80 text-white" :
                              avail.variant === "limited" ? "bg-yellow-500/80 text-black" :
                              "bg-green-500/80 text-white"
                            }`}>
                              {avail.text}
                            </div>
                          );
                        })()}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-6 py-3 bg-[#3B82F6] text-white text-sm font-bold uppercase tracking-wider">
                            Enter Drop
                          </span>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="p-4">
                        <h3 className="text-white font-bold mb-1">{drop.title}</h3>
                        <p className="text-[#3B82F6] font-mono text-sm">{formatPrice(drop.price)}</p>
                      </div>
                    </div>
                  </Link>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        )}
        
        {/* Regular grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {(regularDrops.length > 0 ? regularDrops : drops).slice(0, 8).map((drop, i) => (
            <RevealOnScroll key={drop.id} delay={300 + i * 50}>
              <Link href={`/marks/${drop.id}`}>
                <div className="group relative bg-[#0a0a0a] border border-[#222222] overflow-hidden hover:border-[#3B82F6] transition-all">
                  {/* Image */}
                  <div className="aspect-square bg-[#111111] relative overflow-hidden">
                    <img
                      src={drop.heroImageUrl || getDropImage(drop.id, drop.heroImageUrl, drop.title)}
                      alt={drop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Availability badge */}
                    {(() => {
                      const avail = getAvailability(drop);
                      return avail.variant !== "instock" && (
                        <div className={`absolute top-2 right-2 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                          avail.variant === "soldout" ? "bg-red-500/80 text-white" :
                          "bg-yellow-500/80 text-black"
                        }`}>
                          {avail.text}
                        </div>
                      );
                    })()}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-4 py-2 bg-[#3B82F6] text-white text-xs font-bold uppercase tracking-wider">
                        {getAvailability(drop).variant === "soldout" ? "View" : "Buy"}
                      </span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-3">
                    <h3 className="text-white text-sm font-medium mb-1 truncate">{drop.title}</h3>
                    <p className="text-[#3B82F6] font-mono text-xs">{formatPrice(drop.price)}</p>
                  </div>
                </div>
              </Link>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// COMMUNITY SECTION - Manifesto, How it works, Code, FAQ
// ============================================================================
function CommunitySection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const faqs = [
    {
      q: "How do I join the collective?",
      a: "Membership is by invitation only. You must be referred by an existing member or apply through our clearance process. Once approved, you will receive your first mark."
    },
    {
      q: "What is a mark?",
      a: "A mark is your proof of membership. It can be a physical item from our drops or a digital credential. Each mark grants you access to events, content, and the community."
    },
    {
      q: "What happens at gatherings?",
      a: "Gatherings are members-only events. What happens inside stays inside. Locations are revealed 24 hours before. No phones. No photos. Just presence."
    },
    {
      q: "How do I advance in rank?",
      a: "Ranks are earned through participation. Attend events, collect marks, refer new members, and contribute to the collective. Each tier unlocks new access."
    },
    {
      q: "Can I lose my membership?",
      a: "Yes. Violating the code of conduct, sharing restricted content, or extended inactivity can result in being unmarked. The collective protects itself."
    },
  ];
  
  const codeOfConduct = [
    "What happens inside stays inside",
    "Respect the space and those in it",
    "No recording without explicit consent",
    "Support the collective over the individual",
    "Protect the identity of members",
    "Show up when you commit",
  ];
  
  const howItWorks = [
    { step: "01", title: "Get Invited", desc: "Receive an invitation from an existing member or apply for clearance" },
    { step: "02", title: "Verify", desc: "Complete verification and receive your first mark" },
    { step: "03", title: "Access", desc: "Unlock events, drops, and the inside feed" },
    { step: "04", title: "Advance", desc: "Earn rank through participation and contribution" },
  ];
  
  return (
    <section className="relative py-20 md:py-32 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Manifesto */}
        <RevealOnScroll>
          <div className="mb-24 text-center">
            <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase mb-8">
              THE MANIFESTO
            </p>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-tight">
              What is <span className="text-[#3B82F6]">COMM@</span>?
            </h2>
            <div className="max-w-3xl mx-auto space-y-6 text-lg md:text-xl text-[#888888]">
              <p>
                An invitation-only collective protecting underground culture.
              </p>
              <p>
                We are not a brand. We are not a club. We are a network of individuals 
                who value authenticity over exposure, presence over content, 
                and community over clout.
              </p>
              <p className="text-white font-medium">
                The mark is the key. The Mark is the lock. The collective is the room.
              </p>
            </div>
          </div>
        </RevealOnScroll>
        
        {/* How it works */}
        <RevealOnScroll delay={100}>
          <div className="mb-24">
            <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase mb-8 text-center">
              HOW IT WORKS
            </p>
            <div className="grid md:grid-cols-4 gap-8">
              {howItWorks.map((item, i) => (
                <RevealOnScroll key={i} delay={150 + i * 100}>
                  <div className="text-center md:text-left">
                    <div className="text-[#3B82F6] text-4xl font-black mb-4 font-mono">{item.step}</div>
                    <h3 className="text-white text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-[#666666] text-sm">{item.desc}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </RevealOnScroll>
        
        {/* Code of conduct */}
        <RevealOnScroll delay={200}>
          <div className="mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase mb-4">
                  THE CODE
                </p>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-6">
                  Code of Conduct
                </h3>
                <p className="text-[#888888] mb-8">
                  These are not suggestions. They are the foundation of trust 
                  that makes the collective possible.
                </p>
              </div>
              <div className="space-y-4">
                {codeOfConduct.map((rule, i) => (
                  <RevealOnScroll key={i} delay={250 + i * 50}>
                    <div className="flex items-center gap-4 p-4 border border-[#222222] bg-[#0a0a0a]">
                      <div className="w-8 h-8 flex items-center justify-center bg-[#3B82F6]/10 text-[#3B82F6]">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-white text-sm">{rule}</span>
                    </div>
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </div>
        </RevealOnScroll>
        
        {/* Chapters and ranks teaser */}
        <RevealOnScroll delay={300}>
          <div className="mb-24 p-8 md:p-12 border border-[#222222] bg-[#0a0a0a]">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase mb-4">
                  CHAPTERS & RANKS
                </p>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
                  Earn Your Place
                </h3>
                <p className="text-[#888888] mb-6">
                  The collective operates in chapters. Each chapter has its own identity, 
                  events, and culture. Your rank determines your access and influence.
                </p>
                <Link href="/ranks">
                  <button className="px-6 py-3 border border-[#3B82F6] text-[#3B82F6] text-sm font-bold uppercase tracking-wider hover:bg-[#3B82F6] hover:text-white transition-all">
                    Learn More
                  </button>
                </Link>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  {/* Rank visualization */}
                  <div className="w-48 h-48 rounded-full border-4 border-[#222222] flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full border-4 border-[#333333] flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-4 border-[#444444] flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Labels */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-[#666666]">OUTSIDE</div>
                  <div className="absolute top-8 -right-8 text-[10px] font-mono text-[#666666]">INITIATE</div>
                  <div className="absolute top-20 -right-8 text-[10px] font-mono text-[#888888]">MEMBER</div>
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[10px] font-mono text-[#3B82F6]">INNER CIRCLE</div>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
        
        {/* FAQ */}
        <RevealOnScroll delay={400}>
          <div>
            <p className="text-[#666666] text-xs font-mono tracking-[0.5em] uppercase mb-8 text-center">
              FREQUENTLY ASKED
            </p>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-8 text-center">
              Questions
            </h3>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, i) => (
                <RevealOnScroll key={i} delay={450 + i * 50}>
                  <div className="border border-[#222222] bg-[#0a0a0a]">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="text-white font-medium">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-[#666666] transition-transform ${
                        openFaq === i ? "rotate-180" : ""
                      }`} />
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="px-4 pb-4 text-[#888888] text-sm">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-[#3B82F6] text-3xl font-black mb-2">@</div>
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
              <Link href="/marks" className="block text-[#666666] hover:text-[#3B82F6] text-sm transition-colors">
                Marks
              </Link>
              <Link href="/gatherings" className="block text-[#666666] hover:text-[#3B82F6] text-sm transition-colors">
                Gatherings
              </Link>
              <Link href="/verify" className="block text-[#666666] hover:text-[#3B82F6] text-sm transition-colors">
                Verify Mark
              </Link>
            </div>
          </div>
          
          {/* Members */}
          <div>
            <h4 className="text-white text-sm font-bold mb-4">MEMBERS</h4>
            <div className="space-y-2">
              <Link href="/inside" className="block text-[#666666] hover:text-[#3B82F6] text-sm transition-colors">
                Inside Feed
              </Link>
              <Link href="/ranks" className="block text-[#666666] hover:text-[#3B82F6] text-sm transition-colors">
                Leaderboard
              </Link>
              <Link href="/refer" className="block text-[#666666] hover:text-[#3B82F6] text-sm transition-colors">
                Referrals
              </Link>
            </div>
          </div>
          
          {/* Partners */}
          <div>
            <h4 className="text-white text-sm font-bold mb-4">PARTNERS</h4>
            <div className="space-y-2">
              <Link href="/partners" className="block text-[#666666] hover:text-[#3B82F6] text-sm transition-colors">
                Become a Partner
              </Link>
              <Link href="/apply" className="block text-[#666666] hover:text-[#3B82F6] text-sm transition-colors">
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
  );
}

// ============================================================================
// MAIN HOME PAGE COMPONENT
// ============================================================================
export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Fetch events
  const { data: eventsData } = trpc.event.list.useQuery();
  const events = eventsData || [];
  
  // Fetch drops
  const { data: dropsData } = trpc.drop.list.useQuery();
  const drops = dropsData || [];
  
  // Check if user is verified member
  const isVerified = user && ["marked_initiate", "marked_member", "marked_inner_circle", "staff", "admin"].includes(user.role || "");
  
  return (
    <SystemBoot>
      <div className="min-h-screen bg-black text-white">
        <Nav />
        
        {/* Events Hero Section */}
        <EventsHeroSection events={events} isVerified={!!isVerified} />
        
        {/* Merch Section */}
        <MerchSection drops={drops} />
        
        {/* Community Section */}
        <CommunitySection />
        
        {/* Sponsor Showcase */}
        <SponsorShowcase />
        
        {/* Footer */}
        <Footer />
      </div>
    </SystemBoot>
  );
}
