import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Calendar, MapPin, Users, ChevronDown, Eye, EyeOff, Lock, Unlock, Shield, Layers, Navigation, Target, Radio } from 'lucide-react';
import Nav from '@/components/Nav';
import { MissionMap } from '@/components/MissionMap';
// SponsorShowcase hidden from homepage - accessible via /sponsors
// import { SponsorShowcase } from '@/components/SponsorShowcase';

// Horizontal scrolling marquee component - FloatScroll style
function MarqueeRow({ direction = 'left', speed = 30 }: { direction?: 'left' | 'right'; speed?: number }) {
  const symbols = Array(20).fill('@');
  
  return (
    <div className="overflow-hidden whitespace-nowrap py-2">
      <div 
        className={`inline-flex gap-8 animate-marquee-${direction}`}
        style={{ 
          animationDuration: `${speed}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite'
        }}
      >
        {/* First set */}
        {symbols.map((symbol, i) => (
          <span 
            key={`a-${i}`} 
            className="text-4xl md:text-5xl font-bold text-[var(--mint)]/20 hover:text-[var(--mint)]/40 transition-colors cursor-default"
          >
            {symbol}
          </span>
        ))}
        {/* Duplicate for seamless loop */}
        {symbols.map((symbol, i) => (
          <span 
            key={`b-${i}`} 
            className="text-4xl md:text-5xl font-bold text-[var(--mint)]/20 hover:text-[var(--mint)]/40 transition-colors cursor-default"
          >
            {symbol}
          </span>
        ))}
      </div>
    </div>
  );
}

// Layer badge component
function LayerBadge({ layer }: { layer: string }) {
  const layerConfig: Record<string, { color: string; label: string }> = {
    streetlight: { color: 'bg-neutral-600', label: 'STREETLIGHT' },
    verified: { color: 'bg-blue-600', label: 'VERIFIED' },
    signal: { color: 'bg-cyan-500', label: 'SIGNAL' },
    inner_room: { color: 'bg-purple-600', label: 'INNER ROOM' },
    black_label: { color: 'bg-black border border-white', label: 'BLACK LABEL' }
  };
  
  const config = layerConfig[layer] || layerConfig.streetlight;
  
  return (
    <span className={`${config.color} text-white text-[10px] px-2 py-1 tracking-wider uppercase`}>
      {config.label}
    </span>
  );
}

// Reveal status indicator
function RevealStatus({ status }: { status: 'tease' | 'window' | 'lock' | 'reveal' }) {
  const statusConfig = {
    tease: { icon: EyeOff, color: 'text-neutral-500', label: 'TEASE' },
    window: { icon: Eye, color: 'text-yellow-500', label: 'WINDOW' },
    lock: { icon: Lock, color: 'text-orange-500', label: 'LOCKED' },
    reveal: { icon: Unlock, color: 'text-[var(--mint)]', label: 'REVEALED' }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className={`flex items-center gap-2 ${config.color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs tracking-wider">{config.label}</span>
    </div>
  );
}

// Marquee styles - add to global CSS or inline
const marqueeStyles = `
  @keyframes marquee-left {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes marquee-right {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }
  .animate-marquee-left {
    animation: marquee-left 30s linear infinite;
  }
  .animate-marquee-right {
    animation: marquee-right 30s linear infinite;
  }
`;

// Full-viewport sticky event section - Nocta style with Stratified Reality
function EventSection({ event, index, isFirst, sectionRef }: { event: any; index: number; isFirst: boolean; sectionRef?: (el: HTMLElement | null) => void }) {
  const eventDate = event?.eventDate ? new Date(event.eventDate) : (event?.startDatetime ? new Date(event.startDatetime) : null);
  
  // Determine reveal status based on event data
  const getRevealStatus = () => {
    if (event?.locationRevealed) return 'reveal';
    if (event?.timeRevealed) return 'lock';
    if (event?.accessType === 'members_only') return 'window';
    return 'tease';
  };
  
  // Determine required layer
  const getRequiredLayer = () => {
    if (event?.accessType === 'invite_only') return 'inner_room';
    if (event?.accessType === 'members_only') return 'signal';
    if (event?.accessType === 'verified') return 'verified';
    return 'streetlight';
  };

  return (
    <section 
      ref={sectionRef}
      className="h-screen w-full sticky top-0 flex items-center"
      style={{ zIndex: index + 1 }}
    >
      {/* Background Image - Full Bleed */}
      <div className="absolute inset-0">
        {event?.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
        )}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      </div>

      {/* Horizontal Scrolling Marquee - FloatScroll style */}
      <div className="absolute top-20 left-0 right-0 z-10 pointer-events-none">
        <MarqueeRow direction="left" speed={25} />
      </div>

      {/* Content - Left Side */}
      <div className="relative z-10 h-full flex items-center pt-16">
        <div className="container mx-auto px-6 md:px-8 lg:px-16">
          <div className="max-w-xl">
            {/* Stratified Reality badges */}
            <div className="flex items-center gap-3 mb-4">
              <RevealStatus status={getRevealStatus()} />
              <LayerBadge layer={getRequiredLayer()} />
            </div>

            {/* Event Type Label */}
            <p className="text-xs tracking-[0.3em] text-neutral-400 mb-4 uppercase">
              {event?.accessType === 'open' ? 'Open Gathering' : 
               event?.accessType === 'members_only' ? 'Members Only' : 
               event?.accessType === 'invite_only' ? 'Invite Only' : 'Gathering'}
            </p>

            {/* Event Title with Layered Backdrop - FloatScroll style */}
            <div className="relative inline-block">
              {/* Tiffany Blue circular backdrop */}
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-full bg-[var(--mint)]/20 blur-xl" />
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-24 h-24 md:w-36 md:h-36 lg:w-48 lg:h-48 rounded-full bg-[var(--mint)]/30" />
              <h1 className="relative text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 md:mb-6 tracking-tight leading-none uppercase">
                {event?.title || 'UPCOMING GATHERING'}
              </h1>
            </div>

            {/* Tagline */}
            {event?.tagline && (
              <p className="text-base md:text-lg text-neutral-300 mb-6 md:mb-8 leading-relaxed">
                {event.tagline}
              </p>
            )}

            {/* Event Details - Stratified reveal */}
            <div className="space-y-3 mb-6 md:mb-8 text-sm text-neutral-400">
              {eventDate && getRevealStatus() !== 'tease' ? (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span>{eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-neutral-500">
                  <Calendar className="w-4 h-4" />
                  <span className="italic">Date revealed to verified members</span>
                </div>
              )}
              
              {(event?.area || event?.venueName) && getRevealStatus() === 'reveal' ? (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venueName || event.area}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-neutral-500">
                  <MapPin className="w-4 h-4" />
                  <span className="italic">Location revealed to active members</span>
                </div>
              )}
              
              {event?.capacity && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>{event.spotsRemaining || event.capacity} of {event.capacity} spots</span>
                </div>
              )}
            </div>

            {/* CTA Button - Nocta Green Outlined Style */}
            <Link href={`/gatherings/${event?.id}`}>
              <button className="px-8 md:px-12 py-3 md:py-4 border-2 border-[var(--mint)] text-[var(--mint)] font-medium tracking-wider hover:bg-[var(--mint)] hover:text-black transition-all duration-300 uppercase text-sm md:text-base">
                Request Access
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator on first slide only */}
      {isFirst && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-neutral-500 tracking-wider uppercase">Scroll</span>
          <ChevronDown className="w-6 h-6 text-neutral-500" />
        </div>
      )}
    </section>
  );
}

// Stratified Reality Hero Section
function StratifiedRealitySection({ index }: { index: number }) {
  return (
    <section 
      className="h-screen w-full sticky top-0 flex items-center bg-black"
      style={{ zIndex: index + 1 }}
    >
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-900 to-black">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, var(--mint) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full border-2 border-[var(--mint)] flex items-center justify-center">
              <Layers className="w-10 h-10 text-[var(--mint)]" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight uppercase">
            We Amplify Your Voice
          </h2>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-neutral-400 mb-8 leading-relaxed">
            A members-only network for exclusive events, limited merch, and insider access.
          </p>

          {/* Description */}
          <p className="text-base md:text-lg text-neutral-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join our community to get early access to events, exclusive merchandise drops, 
            and connect with <span className="text-[var(--mint)]">like-minded people</span>. 
            The more active you are, the more you unlock.
          </p>

          {/* Layer badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <LayerBadge layer="streetlight" />
            <LayerBadge layer="verified" />
            <LayerBadge layer="signal" />
            <LayerBadge layer="inner_room" />
            <LayerBadge layer="black_label" />
          </div>

          {/* CTA */}
          <Link href="/inside">
            <button className="px-12 py-4 border-2 border-[var(--mint)] text-[var(--mint)] font-medium tracking-wider hover:bg-[var(--mint)] hover:text-black transition-all duration-300 uppercase">
              Check Your Layer
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// 4 Pillars Collection Grid with sticky scroll
function CollectionGridSection({ index }: { index: number }) {
  // 4 Pillars: Platform, Production, Events, Community
  const collections = [
    {
      title: 'PLATFORM',
      subtitle: 'Amplify Your Voice',
      description: 'Ads, campaigns, and message amplification',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
      link: '/feed'
    },
    {
      title: 'PRODUCTION',
      subtitle: 'Limited Artifacts',
      description: 'Exclusive merch and physical receipts',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      link: '/marks'
    },
    {
      title: 'EVENTS',
      subtitle: 'Secret Gatherings',
      description: 'Activism, benefit concerts, education',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      link: '/gatherings'
    },
    {
      title: 'COMMUNITY',
      subtitle: 'The Inner Circle',
      description: 'Build trust and connection',
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
      link: '/inside'
    }
  ];

  return (
    <section 
      className="h-screen w-full sticky top-0 bg-black"
      style={{ zIndex: index + 1 }}
    >
      <div className="h-full grid grid-cols-1 md:grid-cols-2">
        {collections.map((collection, i) => (
          <Link key={i} href={collection.link}>
            <div className="relative h-[50vh] md:h-[50vh] overflow-hidden group cursor-pointer">
              <img
                src={collection.image}
                alt={collection.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 z-10">
                <p className="text-xs tracking-[0.2em] text-neutral-300 mb-2">{collection.subtitle}</p>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight">{collection.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Membership Tiers Section with sticky scroll
function LayersSection({ index }: { index: number }) {
  const layers = [
    { name: 'STREETLIGHT', level: 0, description: 'Free tier. Browse public events and see what\'s happening.', color: 'bg-neutral-600' },
    { name: 'VERIFIED', level: 1, description: 'Verified member. Request event access and see event times.', color: 'bg-blue-600' },
    { name: 'SIGNAL', level: 2, description: 'Active member. Get early event details 6 hours before others.', color: 'bg-cyan-500' },
    { name: 'INNER ROOM', level: 3, description: 'VIP access. See full event locations and join private gatherings.', color: 'bg-purple-600' },
    { name: 'BLACK LABEL', level: 4, description: 'Partner tier. Exclusive merch drops and invite-only events.', color: 'bg-black border border-white' }
  ];

  return (
    <section 
      className="h-screen w-full sticky top-0 flex items-center bg-black"
      style={{ zIndex: index + 1 }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 to-black" />
      
      <div className="relative z-10 container mx-auto px-6 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] text-[var(--mint)] mb-4 uppercase">Membership Tiers</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight uppercase">
              Your Access Level
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto">
              Your membership tier determines what events, merch, and content you can access. 
              Level up by attending events and engaging with the community.
            </p>
          </div>

          {/* Layers list */}
          <div className="space-y-4">
            {layers.map((layer, i) => (
              <div 
                key={layer.name}
                className="flex items-center gap-4 p-4 bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <div className={`w-12 h-12 ${layer.color} flex items-center justify-center text-white font-bold`}>
                  {layer.level}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium tracking-wider">{layer.name}</h3>
                  <p className="text-sm text-neutral-500">{layer.description}</p>
                </div>
                <Shield className={`w-5 h-5 ${i === 0 ? 'text-neutral-600' : 'text-neutral-700'}`} />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link href="/inside">
              <button className="px-8 py-3 bg-[var(--mint)] text-black font-medium tracking-wider hover:bg-[var(--mint-dark)] transition-colors uppercase">
                Check Your Tier
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Product Grid Section with sticky scroll
function ProductGridSection({ products, index }: { products: any[]; index: number }) {
  return (
    <section 
      className="min-h-screen w-full sticky top-0 bg-neutral-900 py-16 pt-24"
      style={{ zIndex: index + 1 }}
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] text-[var(--mint)] mb-2 uppercase">Exclusive Drops</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight uppercase">Limited Merch</h2>
          </div>
          <Link href="/marks">
            <span className="text-xs tracking-[0.2em] text-neutral-400 hover:text-white transition-colors uppercase">
              View All
            </span>
          </Link>
        </div>

        {/* Description */}
        <p className="text-neutral-500 mb-8 max-w-lg">
          Exclusive merchandise only available to members. 
          Some items require attending specific events or reaching certain membership tiers.
        </p>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.slice(0, 6).map((product, i) => (
            <Link key={product.id || i} href={`/marks/${product.id}`}>
              <div className="group cursor-pointer">
                <div className="relative aspect-square bg-neutral-800 overflow-hidden mb-3">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      No Image
                    </div>
                  )}
                  
                  {product.isNew && (
                    <span className="absolute top-3 right-3 bg-neutral-700 text-white text-[10px] px-2 py-1 tracking-wider">
                      NEW
                    </span>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {['S', 'M', 'L', 'XL'].map((size) => (
                      <button
                        key={size}
                        className="flex-1 bg-white/90 text-black text-xs py-2 hover:bg-white transition-colors"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <h3 className="text-sm text-white mb-1">{product.name}</h3>
                <p className="text-sm text-neutral-500">
                  {product.price ? `IDR ${product.price.toLocaleString()}` : 'Inquire'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Hero Map Section - Clean, minimal, Jakarta-focused
function HeroMapSection({ events, index, isAuthenticated }: { events: any[]; index: number; isAuthenticated: boolean }) {
  const eventsWithLocation = events.filter((e: any) => e.latitude && e.longitude || e.area);
  
  if (eventsWithLocation.length === 0) return null;

  return (
    <section 
      className="h-screen w-full sticky top-0 bg-black"
      style={{ zIndex: index + 1 }}
    >
      {/* Full-screen Mission Map */}
      <MissionMap 
        events={events} 
        isAuthenticated={isAuthenticated} 
        className="absolute inset-0 w-full h-full"
      />

      {/* Minimal bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-8">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between">
              {/* Left: Status */}
              <div className="pointer-events-auto">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#6FCF97] animate-pulse" />
                  <span className="text-[#6FCF97] text-xs font-mono uppercase tracking-wider">
                    {isAuthenticated ? 'LIVE' : 'RESTRICTED'}
                  </span>
                </div>
                <p className="text-white/60 text-sm">
                  {eventsWithLocation.length} active locations
                </p>
              </div>

              {/* Right: CTA if not authenticated */}
              {!isAuthenticated && (
                <a 
                  href="/inside"
                  className="pointer-events-auto px-6 py-3 border border-[#6FCF97]/50 text-[#6FCF97] text-xs font-mono uppercase tracking-wider hover:bg-[#6FCF97] hover:text-black transition-all"
                >
                  Unlock
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <ChevronDown className="w-5 h-5 text-white/30 animate-bounce" />
      </div>
    </section>
  );
}

// Newsletter Section (non-sticky, at the end)
function NewsletterSection() {
  const [email, setEmail] = useState('');

  return (
    <section className="relative z-50 bg-black py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight uppercase">
          Never Miss A Drop
        </h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
          Get notified about upcoming events, new merch drops, and membership perks.
        </p>
        <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-2 sm:gap-0">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 bg-neutral-900 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--mint)]"
          />
          <button className="bg-[var(--mint)] text-black px-6 py-3 font-medium tracking-wider hover:bg-[#089E99] transition-colors uppercase">
            Subscribe
          </button>
        </div>
      </div>
    </section>
  );
}

// Progress indicator for scroll position
function ScrollProgress({ currentIndex, total, onDotClick }: { currentIndex: number; total: number; onDotClick: (index: number) => void }) {
  return (
    <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 md:gap-3">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 cursor-pointer hover:scale-125 ${
            index === currentIndex ? 'bg-[var(--mint)] scale-125' : 'bg-neutral-600 hover:bg-neutral-400'
          }`}
          aria-label={`Go to section ${index + 1}`}
        />
      ))}
    </div>
  );
}

// Main Home Component
export default function Home() {
  const { user } = useAuth();
  // Use public endpoint for home page (no auth required)
  const { data: eventsData } = trpc.event.publicList.useQuery();
  const { data: dropsData } = trpc.drop.list.useQuery();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Filter events for display
  const events = eventsData?.filter((e: any) => {
    const now = new Date();
    const eventDate = e.eventDate ? new Date(e.eventDate) : (e.startDatetime ? new Date(e.startDatetime) : null);
    return e.featuredOrder > 0 || (eventDate && eventDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
  }).sort((a: any, b: any) => (b.featuredOrder || 0) - (a.featuredOrder || 0)).slice(0, 4) || [];

  // Get products for grid
  const products = dropsData?.map((drop: any) => ({
    id: drop.id,
    name: drop.title,
    price: drop.price,
    image: drop.heroImageUrl || drop.imageUrl,
    isNew: true
  })) || [];

  // Total sections: hero map + events + collection grid + products
  const totalSections = 1 + events.length + 2;

  // Scroll to specific section
  const scrollToSection = (index: number) => {
    const scrollPosition = index * window.innerHeight;
    window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
  };

  // Track scroll position to update current section index
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const index = Math.floor(scrollTop / viewportHeight);
      if (index >= 0 && index < totalSections) {
        setCurrentSectionIndex(index);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  // Calculate wrapper height for all sticky sections
  const wrapperHeight = `${totalSections * 100}vh`;

  return (
    <div className="bg-black">
      {/* Inject marquee animation styles */}
      <style>{marqueeStyles}</style>
      {/* Navigation */}
      <Nav variant="transparent" />

      {/* Scroll Progress Indicator */}
      {totalSections > 1 && (
        <ScrollProgress 
          currentIndex={currentSectionIndex} 
          total={totalSections} 
          onDotClick={scrollToSection}
        />
      )}

      {/* Sticky scroll wrapper */}
      <div 
        className="relative"
        style={{ height: wrapperHeight }}
      >
        {/* Hero Map Section - First sticky section */}
        <HeroMapSection 
          events={events} 
          index={0} 
          isAuthenticated={!!user}
        />

        {/* Event sections */}
        {events.length > 0 ? (
          events.map((event: any, index: number) => (
            <EventSection 
              key={event.id} 
              event={event} 
              index={index + 1} 
              isFirst={false}
              sectionRef={(el: HTMLElement | null) => { sectionRefs.current[index] = el; }}
            />
          ))
        ) : (
          <section className="h-screen w-full flex items-center justify-center bg-neutral-900 sticky top-0" style={{ zIndex: 2 }}>
            <p className="text-neutral-500">No gatherings available</p>
          </section>
        )}

        {/* Collection Grid section */}
        <CollectionGridSection index={events.length + 1} />

        {/* Product Grid section */}
        <ProductGridSection products={products} index={events.length + 2} />

        {/* Stratified Reality and Layers sections hidden from homepage - available for logged-in members */}
      </div>

      {/* Sponsors section hidden from homepage - accessible via /sponsors */}

      {/* Newsletter - non-sticky, at the end */}
      <NewsletterSection />
    </div>
  );
}
