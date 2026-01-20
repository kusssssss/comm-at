import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Calendar, MapPin, Users, ChevronDown, Eye, EyeOff, Lock, Unlock, Shield, Layers } from 'lucide-react';
import Nav from '@/components/Nav';

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
    reveal: { icon: Unlock, color: 'text-[#00ff00]', label: 'REVEALED' }
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

            {/* Event Title */}
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 md:mb-6 tracking-tight leading-none uppercase">
              {event?.title || 'UPCOMING GATHERING'}
            </h1>

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
                  <span className="italic">Time reveals when you are cleared</span>
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
                  <span className="italic">Location reveals for Signal and above</span>
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
              <button className="px-8 md:px-12 py-3 md:py-4 border-2 border-[#00ff00] text-[#00ff00] font-medium tracking-wider hover:bg-[#00ff00] hover:text-black transition-all duration-300 uppercase text-sm md:text-base">
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
          backgroundImage: `radial-gradient(circle at 2px 2px, #00ff00 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full border-2 border-[#00ff00] flex items-center justify-center">
              <Layers className="w-10 h-10 text-[#00ff00]" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight uppercase">
            Stratified Reality
          </h2>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-neutral-400 mb-8 leading-relaxed">
            Not everyone sees the same Indonesia.
          </p>

          {/* Description */}
          <p className="text-base md:text-lg text-neutral-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Unlock layers to reveal time, location, and access. 
            Events are not posted — they are <span className="text-[#00ff00]">unlocked</span>.
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
            <button className="px-12 py-4 border-2 border-[#00ff00] text-[#00ff00] font-medium tracking-wider hover:bg-[#00ff00] hover:text-black transition-all duration-300 uppercase">
              Check Your Layer
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// 2x2 Collection Grid with sticky scroll
function CollectionGridSection({ index }: { index: number }) {
  const collections = [
    {
      title: 'CHAPTER ONE',
      subtitle: 'The Beginning',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      link: '/gatherings'
    },
    {
      title: 'THE INNER CIRCLE',
      subtitle: 'Members Only',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
      link: '/inside'
    },
    {
      title: 'EXCLUSIVE MARKS',
      subtitle: 'Limited Edition',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      link: '/marks'
    },
    {
      title: 'THE COLLECTIVE',
      subtitle: 'Join Us',
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
      link: '/referral'
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

// Layers Explanation Section with sticky scroll
function LayersSection({ index }: { index: number }) {
  const layers = [
    { name: 'STREETLIGHT', level: 0, description: 'Public view. See that something is happening.', color: 'bg-neutral-600' },
    { name: 'VERIFIED', level: 1, description: 'Request access. See the time window.', color: 'bg-blue-600' },
    { name: 'SIGNAL', level: 2, description: 'Late reveal access. Time reveals 6 hours before.', color: 'bg-cyan-500' },
    { name: 'INNER ROOM', level: 3, description: 'Private rooms. Full location reveal.', color: 'bg-purple-600' },
    { name: 'BLACK LABEL', level: 4, description: 'Partner circle. Invite-only artifacts.', color: 'bg-black border border-white' }
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
            <p className="text-xs tracking-[0.3em] text-[#00ff00] mb-4 uppercase">Stratified Identity</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight uppercase">
              Your Layer
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto">
              Every member has a Layer, Reputation, and Clearance. 
              What you see depends on who you are.
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
              <button className="px-8 py-3 bg-[#00ff00] text-black font-medium tracking-wider hover:bg-[#00cc00] transition-colors uppercase">
                Upgrade Your Layer
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
            <p className="text-xs tracking-[0.3em] text-[#00ff00] mb-2 uppercase">Stratified Commerce</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight uppercase">Artifacts</h2>
          </div>
          <Link href="/marks">
            <span className="text-xs tracking-[0.2em] text-neutral-400 hover:text-white transition-colors uppercase">
              View All
            </span>
          </Link>
        </div>

        {/* Description */}
        <p className="text-neutral-500 mb-8 max-w-lg">
          Merch is the physical receipt of "I was there" and "I belong." 
          Artifacts are tied to layers and proof.
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
          Subscribe to receive updates on exclusive gatherings, limited artifacts, and layer upgrades.
        </p>
        <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-2 sm:gap-0">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 bg-neutral-900 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-[#00ff00]"
          />
          <button className="bg-[#00ff00] text-black px-6 py-3 font-medium tracking-wider hover:bg-[#00cc00] transition-colors uppercase">
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
            index === currentIndex ? 'bg-[#00ff00] scale-125' : 'bg-neutral-600 hover:bg-neutral-400'
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
  const { data: eventsData } = trpc.event.list.useQuery();
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

  // Total sections: events + stratified reality + collection grid + layers + products
  const totalSections = events.length + 4;

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
        {/* Event sections */}
        {events.length > 0 ? (
          events.map((event: any, index: number) => (
            <EventSection 
              key={event.id} 
              event={event} 
              index={index} 
              isFirst={index === 0}
              sectionRef={(el: HTMLElement | null) => { sectionRefs.current[index] = el; }}
            />
          ))
        ) : (
          <section className="h-screen w-full flex items-center justify-center bg-neutral-900 sticky top-0">
            <p className="text-neutral-500">No gatherings available</p>
          </section>
        )}

        {/* Stratified Reality explanation section */}
        <StratifiedRealitySection index={events.length} />

        {/* Collection Grid section */}
        <CollectionGridSection index={events.length + 1} />

        {/* Layers explanation section */}
        <LayersSection index={events.length + 2} />

        {/* Product Grid section */}
        <ProductGridSection products={products} index={events.length + 3} />
      </div>

      {/* Newsletter - non-sticky, at the end */}
      <NewsletterSection />
    </div>
  );
}
