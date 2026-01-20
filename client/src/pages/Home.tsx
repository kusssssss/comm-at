import { useState } from "react";
import { Link, useLocation } from "wouter";
import Nav from "@/components/Nav";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Lock, Users, Calendar, ChevronDown, MapPin
} from "lucide-react";
import { ImageFallback, getDropImage } from "@/components/ImageFallback";

// ============================================================================
// NOCTA-STYLE HOME PAGE - SIMPLE VERTICAL SCROLL (NO STICKY)
// ============================================================================

// Placeholder events with Nocta-style imagery
const PLACEHOLDER_EVENTS = [
  {
    id: "placeholder-1",
    title: "NOCTA X CODE",
    tagline: "Code began as a precision experiment inside Nike — Tony Spackman's future-tech approach to performance design.",
    coverImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80",
    accessType: "open",
    tags: '["COLLECTION", "TECH", "PERFORMANCE"]',
    city: "Jakarta",
    area: "South Jakarta",
    capacity: 100,
    passesUsed: 0,
    startDatetime: new Date("2026-02-15"),
  },
  {
    id: "placeholder-2", 
    title: "HOLIDAY '25",
    tagline: "Cardinal Stock — the essential pieces that define the season.",
    coverImageUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1920&q=80",
    accessType: "open",
    tags: '["CARDINAL STOCK", "HOLIDAY", "ESSENTIAL"]',
    city: "Jakarta",
    area: "Central Jakarta",
    capacity: 50,
    passesUsed: 0,
    startDatetime: new Date("2026-01-25"),
  },
  {
    id: "placeholder-3",
    title: "FALL '25",
    tagline: "The collection that bridges seasons. Designed for transition.",
    coverImageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=80",
    accessType: "members_only",
    tags: '["FALL", "COLLECTION", "NEW"]',
    city: "Jakarta",
    area: "West Jakarta",
    capacity: 30,
    passesUsed: 0,
    startDatetime: new Date("2026-03-01"),
  },
  {
    id: "placeholder-4",
    title: "DIFFUSED BLUE",
    tagline: "A study in color. Limited edition colorway dropping soon.",
    coverImageUrl: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1920&q=80",
    accessType: "invite_only",
    tags: '["LIMITED", "COLORWAY", "EXCLUSIVE"]',
    city: "Jakarta",
    area: "North Jakarta",
    capacity: 20,
    passesUsed: 0,
    startDatetime: new Date("2026-02-28"),
  },
];

// Format date with full words
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

// Get CTA button based on access type
const getEventCTA = (event: any, isVerified: boolean) => {
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

// ============================================================================
// SINGLE EVENT SECTION - Nocta style (NO sticky, just full height)
// ============================================================================
function EventSection({ 
  event, 
  isVerified,
  isPlaceholder = false
}: { 
  event: any; 
  isVerified: boolean;
  isPlaceholder?: boolean;
}) {
  const cta = getEventCTA(event, isVerified);
  const tags = event.tags ? JSON.parse(event.tags || "[]").slice(0, 3) : [];
  
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background image - full bleed */}
      <div className="absolute inset-0">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />
        )}
        {/* Gradient overlays - Nocta style: heavy left fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      </div>
      
      {/* Content - left aligned like Nocta */}
      <div className="relative z-10 h-full flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-lg">
            {/* Collection label - small caps */}
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/50 mb-4">
              {event.accessType === "invite_only" ? "Invite Only" : 
               event.accessType === "members_only" ? "Members Only" : "Open Event"}
            </p>
            
            {/* Title - Large, bold, Nocta style */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-[0.9] tracking-tight uppercase">
              {event.title}
            </h1>
            
            {/* Tagline / Description */}
            {event.tagline && (
              <p className="text-sm md:text-base text-white/60 mb-8 leading-relaxed max-w-md">
                {event.tagline}
              </p>
            )}
            
            {/* Event details - minimal, only if not placeholder */}
            {!isPlaceholder && (
              <div className="space-y-2 mb-8 text-sm text-white/50">
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
            )}
            
            {/* CTA Button - Nocta outlined style with green accent */}
            <Link href={isPlaceholder ? "/gatherings" : `/gatherings/${event.id}`}>
              <button
                disabled={cta.disabled}
                className={`group relative px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] transition-all duration-300 ${
                  cta.disabled
                    ? "border border-white/20 text-white/30 cursor-not-allowed"
                    : "border border-[#00ff00] text-[#00ff00] hover:bg-[#00ff00] hover:text-black"
                }`}
              >
                {cta.variant === "locked" && <Lock className="w-4 h-4 inline mr-2" />}
                {isPlaceholder ? "Shop Collection" : cta.text}
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

  // Use placeholder products if no drops
  const displayDrops = drops.length > 0 ? drops : [
    { id: "p1", name: "Component 5 Jacket", price: 14829000, status: "sold_out", heroImageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600" },
    { id: "p2", name: "Prestigious Fold Jacket", price: 10293000, status: "active", heroImageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600" },
    { id: "p3", name: "Prestigious Flow Jacket", price: 13084000, status: "active", heroImageUrl: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600" },
    { id: "p4", name: "Prestigious Flow Pant", price: 7676000, status: "sold_out", heroImageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600" },
    { id: "p5", name: "Prestigious Fold Pant", price: 7676000, status: "sold_out", heroImageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600" },
    { id: "p6", name: "Hyena Top", price: 6804000, status: "active", heroImageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600" },
  ];

  return (
    <section className="bg-[#0a0a0a] py-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header - Nocta style */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#00ff00] mb-2">
              CODE
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase">
              Shop Collection
            </h2>
          </div>
        </div>
        
        {/* Product grid - 3 columns like Nocta */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {displayDrops.slice(0, 6).map((drop) => {
            const status = getStatus(drop);
            const imageUrl = drop.heroImageUrl || getDropImage(drop.name || "");
            
            return (
              <Link key={drop.id} href={`/marks/${drop.id}`}>
                <div className="group cursor-pointer">
                  {/* Image container - gray bg like Nocta */}
                  <div className="relative aspect-[3/4] bg-[#1a1a1a] mb-4 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={drop.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Status badge */}
                    {status && (
                      <div className={`absolute top-4 left-4 text-[10px] font-mono uppercase tracking-wider ${status.class}`}>
                        {status.text}
                      </div>
                    )}
                    
                    {/* Size buttons on hover - Nocta style */}
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {["S", "M", "L", "XL"].map((size) => (
                        <button
                          key={size}
                          className="flex-1 py-2 bg-white text-black text-xs font-medium hover:bg-[#00ff00] transition-colors"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Product info */}
                  <h3 className="text-sm text-white font-medium mb-1">{drop.name}</h3>
                  <p className="text-sm text-white/60">{formatPrice(drop.price)}</p>
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
// COMMUNITY SECTION
// ============================================================================
function CommunitySection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const faqs = [
    { q: "How do I join the collective?", a: "Membership is by invitation only. You must be referred by an existing member and complete the verification process." },
    { q: "What is a mark?", a: "A mark is both a physical item and a digital key. Each mark grants access to different levels of the collective." },
    { q: "What happens at gatherings?", a: "Gatherings are private events for members. What happens inside stays inside." },
    { q: "How do I advance in rank?", a: "Rank advancement is based on participation, contribution, and time within the collective." },
    { q: "Can I lose my membership?", a: "Membership can be revoked for violating the code of conduct or betraying the trust of the collective." }
  ];

  return (
    <section className="bg-black py-24">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        {/* Manifesto */}
        <div className="mb-24 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/40 mb-6">
            The Manifesto
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-8">
            What is COMM@?
          </h2>
          <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
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
                <div className="w-2 h-2 bg-[#00ff00]" />
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
                  "border-[#00ff00] text-[#00ff00]"
                }`}
              >
                {rank}
              </div>
            ))}
          </div>
          <Link href="/ranks">
            <button className="mt-8 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] border border-white/30 text-white/70 hover:border-[#00ff00] hover:text-[#00ff00] transition-all">
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
            <Link href="/marks" className="hover:text-[#00ff00] transition-colors">Marks</Link>
            <Link href="/gatherings" className="hover:text-[#00ff00] transition-colors">Gatherings</Link>
            <Link href="/verify" className="hover:text-[#00ff00] transition-colors">Verify</Link>
            <Link href="/inside" className="hover:text-[#00ff00] transition-colors">Inside</Link>
            <Link href="/ranks" className="hover:text-[#00ff00] transition-colors">Ranks</Link>
            <Link href="/refer" className="hover:text-[#00ff00] transition-colors">Refer</Link>
            <Link href="/partners" className="hover:text-[#00ff00] transition-colors">Partners</Link>
          </div>
          
          {/* Copyright */}
          <div className="text-xs text-white/30">
            © 2026 COMM@. All rights reserved.
          </div>
        </div>
        
        {/* Newsletter - Nocta style */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#00ff00] mb-4">
            Never Miss A Drop
          </p>
          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 bg-transparent border border-white/20 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#00ff00]"
            />
            <button className="px-6 py-3 bg-[#00ff00] text-black text-sm font-medium uppercase tracking-wider hover:bg-[#00cc00] transition-colors">
              Subscribe
            </button>
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
  
  // Use real events if available, otherwise use placeholders
  const displayEvents = events.length > 0 ? events : PLACEHOLDER_EVENTS;
  
  // Sort events by featured order, then by date
  const sortedEvents = [...displayEvents].sort((a, b) => {
    if (a.featuredOrder && b.featuredOrder) return a.featuredOrder - b.featuredOrder;
    if (a.featuredOrder) return -1;
    if (b.featuredOrder) return 1;
    const dateA = a.startDatetime || a.eventDate;
    const dateB = b.startDatetime || b.eventDate;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  }).slice(0, 4); // Limit to 4 hero sections like Nocta
  
  return (
    <div className="bg-black">
      <Nav />
      
      {/* Hero sections - simple vertical scroll like Nocta */}
      {sortedEvents.map((event, index) => (
        <EventSection
          key={event.id}
          event={event}
          isVerified={isVerified}
          isPlaceholder={!events.length}
        />
      ))}
      
      {/* Product grid */}
      <ProductGridSection drops={drops} />
      
      {/* Community section */}
      <CommunitySection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
