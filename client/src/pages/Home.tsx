import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Nav from "@/components/Nav";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Lock, Eye, EyeOff, Users, Calendar, Shield, ChevronRight, ChevronDown,
  Zap, Sparkles, MapPin, Clock, ArrowRight, Star, Gift, Trophy,
  Search, Filter, X, Check, ChevronUp
} from "lucide-react";
import { 
  RevealOnScroll,
  GlowPulse,
  SystemBoot,
} from "@/components/Effects2200";
import { SponsorShowcase } from "@/components/SponsorShowcase";
import { ImageFallback, getDropImage } from "@/components/ImageFallback";

// ============================================================================
// NOCTA-STYLE HOME PAGE - STICKY SCROLL SECTIONS
// ============================================================================

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

// Event tag component
function EventTag({ tag }: { tag: string }) {
  return (
    <span className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider bg-black/50 text-white/80 border border-white/20 backdrop-blur-sm">
      {tag}
    </span>
  );
}

// ============================================================================
// SINGLE EVENT SLIDE - Nocta-style sticky section
// ============================================================================
function EventSlide({ 
  event, 
  isVerified, 
  index, 
  total 
}: { 
  event: any; 
  isVerified: boolean; 
  index: number;
  total: number;
}) {
  const cta = getEventCTA(event, isVerified);
  const tags = event.tags ? JSON.parse(event.tags || "[]").slice(0, 3) : [];
  
  return (
    <section 
      className="sticky top-0 h-screen w-full overflow-hidden"
      style={{ zIndex: total - index }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />
        )}
        {/* Gradient overlays - Nocta style */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
          <div className="max-w-xl">
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag: string) => (
                  <EventTag key={tag} tag={tag} />
                ))}
              </div>
            )}
            
            {/* Collection label - Nocta style */}
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60 mb-4">
              {event.accessType === "invite_only" ? "Invite Only" : 
               event.accessType === "members_only" ? "Members Only" : "Open Event"}
            </p>
            
            {/* Title - Large Nocta style */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[0.95] tracking-tight">
              {event.title}
            </h1>
            
            {/* Tagline / Description */}
            {event.tagline && (
              <p className="text-base md:text-lg text-white/70 mb-8 leading-relaxed max-w-md">
                {event.tagline}
              </p>
            )}
            
            {/* Event details - minimal */}
            <div className="space-y-2 mb-8 text-sm text-white/60">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4" />
                <span>{formatEventDate(event.startDatetime || event.eventDate)}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>
                  {event.accessType === "invite_only" && !isVerified ? (
                    "Location revealed upon approval"
                  ) : (
                    `${event.city || "Jakarta"}${event.area ? `, ${event.area}` : ""}`
                  )}
                </span>
              </div>
              {event.capacity && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>{event.passesUsed || 0} of {event.capacity} spots</span>
                </div>
              )}
            </div>
            
            {/* CTA Button - Nocta outlined style */}
            <Link href={`/gatherings/${event.id}`}>
              <button
                disabled={cta.disabled}
                className={`group relative px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] transition-all duration-300 ${
                  cta.disabled
                    ? "border border-white/20 text-white/30 cursor-not-allowed"
                    : "border border-white text-white hover:bg-white hover:text-black"
                }`}
              >
                {cta.variant === "locked" && <Lock className="w-4 h-4 inline mr-2" />}
                {cta.text}
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Slide indicator - right side */}
      <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-center gap-3">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-1 transition-all duration-300 ${
              i === index 
                ? "h-8 bg-white" 
                : "h-2 bg-white/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// COLLECTION SLIDE - For merch collections (Nocta style)
// ============================================================================
function CollectionSlide({ 
  title, 
  subtitle, 
  cta, 
  href, 
  imageUrl,
  index,
  total
}: { 
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  imageUrl: string;
  index: number;
  total: number;
}) {
  return (
    <section 
      className="sticky top-0 h-screen w-full overflow-hidden"
      style={{ zIndex: total - index }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
          <div className="max-w-lg">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60 mb-4">
              {subtitle}
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-[0.95]">
              {title}
            </h2>
            <Link href={href}>
              <button className="px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] border border-white text-white hover:bg-white hover:text-black transition-all duration-300">
                {cta}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRODUCT GRID SECTION - Nocta style
// ============================================================================
function ProductGridSection({ drops }: { drops: any[] }) {
  const formatPrice = (price: number | string | null) => {
    if (!price) return "Inquire";
    const numPrice = typeof price === "string" ? parseInt(price) : price;
    if (isNaN(numPrice)) return "Inquire";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const getStatus = (drop: any) => {
    if (drop.status === "sold_out") return { text: "Sold out", class: "text-white/50" };
    if (drop.status === "active") return { text: "NEW", class: "text-[#00ff00]" };
    return null;
  };

  return (
    <section className="bg-[#0a0a0a] py-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/40 mb-2">
              Exclusive Marks
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              The Drop
            </h2>
          </div>
          <Link href="/marks">
            <button className="px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] border border-white/30 text-white/70 hover:border-white hover:text-white transition-all">
              View All
            </button>
          </Link>
        </div>
        
        {/* Product grid - Nocta style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {drops.slice(0, 8).map((drop) => {
            const status = getStatus(drop);
            return (
              <Link key={drop.id} href={`/marks/${drop.id}`}>
                <div className="group cursor-pointer">
                  {/* Image container */}
                  <div className="relative aspect-square bg-[#1a1a1a] overflow-hidden mb-3">
                    <img
                      src={drop.heroImageUrl || getDropImage(drop.id, drop.heroImageUrl, drop.title)}
                      alt={drop.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Status badge */}
                    {status && (
                      <div className={`absolute top-3 left-3 text-[10px] font-mono uppercase tracking-wider ${status.class}`}>
                        {status.text}
                      </div>
                    )}
                    
                    {/* Size buttons on hover - Nocta style */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex gap-1 justify-center">
                        {["S", "M", "L", "XL"].map((size) => (
                          <button
                            key={size}
                            className="w-10 h-8 bg-white/90 text-black text-xs font-medium hover:bg-white transition-colors"
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Product info */}
                  <h3 className="text-sm font-medium text-white mb-1 group-hover:underline">
                    {drop.title}
                  </h3>
                  <p className="text-sm text-white/60">
                    {formatPrice(drop.priceIdr)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// COMMUNITY SECTION - Manifesto, How It Works, Code, FAQ
// ============================================================================
function CommunitySection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const faqs = [
    {
      q: "How do I join the collective?",
      a: "Membership is by invitation only. You must be referred by an existing member or apply for clearance through our verification process."
    },
    {
      q: "What is a mark?",
      a: "A mark is your proof of belonging. It's more than merchandise—it's your key to access events, drops, and the inside feed."
    },
    {
      q: "What happens at gatherings?",
      a: "Gatherings are intimate events for members only. What happens inside stays inside. Each gathering is unique and curated for the collective."
    },
    {
      q: "How do I advance in rank?",
      a: "Rank is earned through participation, contribution, and time. Attend gatherings, collect marks, and support the collective."
    },
    {
      q: "Can I lose my membership?",
      a: "Membership can be revoked for violating the code of conduct. Trust is the foundation of the collective."
    }
  ];
  
  return (
    <section className="bg-black py-24">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        {/* Manifesto */}
        <div className="text-center mb-24">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/40 mb-6">
            The Manifesto
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-8">
            What is COMM@?
          </h2>
          <p className="text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
            An invitation-only collective protecting underground culture. We are not a brand. 
            We are not a club. We are a network of individuals who value authenticity over exposure, 
            presence over content, and community over clout.
          </p>
          <div className="mt-8 text-sm text-white/40 font-mono">
            The mark is the key. The Mark is the lock. The collective is the room.
          </div>
        </div>
        
        {/* How it works */}
        <div className="mb-24">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/40 mb-8 text-center">
            How It Works
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: "01", title: "Get Invited", desc: "Receive an invitation from an existing member" },
              { num: "02", title: "Verify", desc: "Complete verification and receive your first mark" },
              { num: "03", title: "Access", desc: "Unlock events, drops, and the inside feed" },
              { num: "04", title: "Advance", desc: "Earn rank through participation" }
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="text-3xl font-black text-white/20 mb-3">{step.num}</div>
                <h3 className="text-white font-medium mb-2">{step.title}</h3>
                <p className="text-sm text-white/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Code of Conduct */}
        <div className="mb-24">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/40 mb-8 text-center">
            The Code
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "What happens inside stays inside",
              "Respect the space and those in it",
              "No recording without explicit consent",
              "Support the collective over the individual",
              "Protect the identity of members"
            ].map((rule, i) => (
              <div key={i} className="flex items-center gap-3 p-4 border border-white/10">
                <div className="w-2 h-2 bg-[#3B82F6]" />
                <span className="text-sm text-white/70">{rule}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chapters & Ranks teaser */}
        <div className="mb-24 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/40 mb-6">
            Chapters & Ranks
          </p>
          <h3 className="text-2xl font-black text-white mb-6">Earn Your Place</h3>
          <div className="flex justify-center gap-4 flex-wrap">
            {["OUTSIDE", "INITIATE", "MEMBER", "INNER CIRCLE"].map((rank, i) => (
              <div 
                key={rank}
                className={`px-6 py-3 border text-sm font-mono uppercase tracking-wider ${
                  i === 0 ? "border-white/20 text-white/40" :
                  i === 1 ? "border-white/30 text-white/60" :
                  i === 2 ? "border-white/50 text-white/80" :
                  "border-[#3B82F6] text-[#3B82F6]"
                }`}
              >
                {rank}
              </div>
            ))}
          </div>
          <Link href="/ranks">
            <button className="mt-8 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] border border-white/30 text-white/70 hover:border-white hover:text-white transition-all">
              Learn More
            </button>
          </Link>
        </div>
        
        {/* FAQ */}
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/40 mb-8 text-center">
            Frequently Asked
          </p>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/10">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm text-white/80">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-white/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo */}
          <div className="text-2xl font-black text-white">@</div>
          
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs text-white/50 uppercase tracking-wider">
            <Link href="/marks" className="hover:text-white transition-colors">Marks</Link>
            <Link href="/gatherings" className="hover:text-white transition-colors">Gatherings</Link>
            <Link href="/verify" className="hover:text-white transition-colors">Verify</Link>
            <Link href="/inside" className="hover:text-white transition-colors">Inside</Link>
            <Link href="/ranks" className="hover:text-white transition-colors">Ranks</Link>
            <Link href="/refer" className="hover:text-white transition-colors">Refer</Link>
            <Link href="/partners" className="hover:text-white transition-colors">Partners</Link>
          </div>
          
          {/* Copyright */}
          <div className="text-xs text-white/30">
            © 2026 COMM@. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// MAIN HOME PAGE
// ============================================================================
export default function Home() {
  const { user } = useAuth();
  
  // Fetch events
  const { data: eventsData } = trpc.event.list.useQuery();
  const events = eventsData || [];
  
  // Fetch drops
  const { data: dropsData } = trpc.drop.list.useQuery();
  const drops = dropsData || [];
  
  // Check if user is verified member
  const isVerified = !!(user && ["marked_initiate", "marked_member", "marked_inner_circle", "staff", "admin"].includes(user.role || ""));
  
  // Sort events by featured order, then by date
  const sortedEvents = [...events].sort((a, b) => {
    if (a.featuredOrder && b.featuredOrder) return a.featuredOrder - b.featuredOrder;
    if (a.featuredOrder) return -1;
    if (b.featuredOrder) return 1;
    const dateA = a.startDatetime || a.eventDate;
    const dateB = b.startDatetime || b.eventDate;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  }).slice(0, 6); // Limit to 6 events for performance
  
  const totalSlides = sortedEvents.length + 1; // Events + 1 collection slide
  
  return (
    <div className="bg-black">
      <Nav />
      
      {/* Scroll container with snap */}
      <div className="scroll-snap-container">
        {/* Event slides - Nocta sticky scroll */}
        {sortedEvents.map((event, index) => (
          <EventSlide
            key={event.id}
            event={event}
            isVerified={isVerified}
            index={index}
            total={totalSlides}
          />
        ))}
        
        {/* Collection slide for Marks */}
        <CollectionSlide
          title="The Drop"
          subtitle="Exclusive Marks Collection"
          cta="Shop Collection"
          href="/marks"
          imageUrl="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920"
          index={sortedEvents.length}
          total={totalSlides}
        />
      </div>
      
      {/* Product grid */}
      <ProductGridSection drops={drops} />
      
      {/* Community section */}
      <CommunitySection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
