import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Calendar, MapPin, Users, ChevronDown } from 'lucide-react';

// Full-viewport event section - natural scroll reveal
function EventSection({ event, index }: { event: any; index: number }) {
  const eventDate = event?.eventDate ? new Date(event.eventDate) : (event?.startDatetime ? new Date(event.startDatetime) : null);

  return (
    <section className="h-screen w-full relative">
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
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-8 lg:px-16">
          <div className="max-w-xl">
            {/* Event Type Label */}
            <p className="text-xs tracking-[0.3em] text-neutral-400 mb-4 uppercase">
              {event?.accessType === 'open' ? 'Open Event' : 
               event?.accessType === 'members_only' ? 'Members Only' : 
               event?.accessType === 'invite_only' ? 'Invite Only' : 'Event'}
            </p>

            {/* Event Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-none uppercase">
              {event?.title || 'UPCOMING EVENT'}
            </h1>

            {/* Tagline */}
            {event?.tagline && (
              <p className="text-lg text-neutral-300 mb-8 leading-relaxed">
                {event.tagline}
              </p>
            )}

            {/* Event Details */}
            <div className="space-y-3 mb-8 text-sm text-neutral-400">
              {eventDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span>{eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
              {(event?.area || event?.venueName) && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venueName || event.area}</span>
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
              <button className="px-12 py-4 border-2 border-[#00ff00] text-[#00ff00] font-medium tracking-wider hover:bg-[#00ff00] hover:text-black transition-all duration-300 uppercase">
                Reserve
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator on first slide only */}
      {index === 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-neutral-500 tracking-wider uppercase">Scroll</span>
          <ChevronDown className="w-6 h-6 text-neutral-500" />
        </div>
      )}
    </section>
  );
}

// 2x2 Collection Grid (Nocta Style)
function CollectionGrid() {
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
    <section className="grid grid-cols-1 md:grid-cols-2">
      {collections.map((collection, index) => (
        <Link key={index} href={collection.link}>
          <div className="relative h-[50vh] overflow-hidden group cursor-pointer">
            <img
              src={collection.image}
              alt={collection.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-8 left-8 z-10">
              <p className="text-xs tracking-[0.2em] text-neutral-300 mb-2">{collection.subtitle}</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{collection.title}</h3>
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}

// Product Grid (Nocta Style)
function ProductGrid({ products }: { products: any[] }) {
  return (
    <section className="bg-neutral-900 py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xs tracking-[0.3em] text-neutral-400 uppercase">Shop Collection</h2>
          <Link href="/marks">
            <span className="text-xs tracking-[0.2em] text-neutral-400 hover:text-white transition-colors uppercase">
              View All
            </span>
          </Link>
        </div>

        {/* Product Grid - 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.slice(0, 6).map((product, index) => (
            <Link key={product.id || index} href={`/marks/${product.id}`}>
              <div className="group cursor-pointer">
                {/* Product Image */}
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
                  
                  {/* NEW Badge */}
                  {product.isNew && (
                    <span className="absolute top-3 right-3 bg-neutral-700 text-white text-[10px] px-2 py-1 tracking-wider">
                      NEW
                    </span>
                  )}

                  {/* Size buttons on hover */}
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

                {/* Product Info */}
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

// Newsletter Section
function NewsletterSection() {
  const [email, setEmail] = useState('');

  return (
    <section className="bg-black py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
          NEVER MISS A DROP
        </h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
          Subscribe to receive updates on exclusive events, limited releases, and member-only access.
        </p>
        <div className="flex max-w-md mx-auto">
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
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer hover:scale-125 ${
            index === currentIndex ? 'bg-[#00ff00] scale-125' : 'bg-neutral-600 hover:bg-neutral-400'
          }`}
          aria-label={`Go to event ${index + 1}`}
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
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Filter events for display
  const events = eventsData?.filter((e: any) => {
    const now = new Date();
    const eventDate = e.eventDate ? new Date(e.eventDate) : (e.startDatetime ? new Date(e.startDatetime) : null);
    return e.featuredOrder > 0 || (eventDate && eventDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
  }).sort((a: any, b: any) => (b.featuredOrder || 0) - (a.featuredOrder || 0)).slice(0, 8) || [];

  // Get products for grid
  const products = dropsData?.map((drop: any) => ({
    id: drop.id,
    name: drop.title,
    price: drop.price,
    image: drop.heroImageUrl || drop.imageUrl,
    isNew: true
  })) || [];

  // Scroll to specific section
  const scrollToSection = (index: number) => {
    const section = sectionRefs.current[index];
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Track scroll position to update current event index
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const index = Math.round(scrollTop / viewportHeight);
      if (index >= 0 && index < events.length) {
        setCurrentEventIndex(index);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [events.length]);

  return (
    <div className="bg-black">
      {/* Scroll Progress Indicator - only show during events section */}
      {events.length > 1 && (
        <ScrollProgress 
          currentIndex={currentEventIndex} 
          total={events.length} 
          onDotClick={scrollToSection}
        />
      )}

      {/* Full-viewport event sections - natural vertical scroll */}
      {events.length > 0 ? (
        events.map((event: any, index: number) => (
          <div 
            key={event.id} 
            ref={(el) => { sectionRefs.current[index] = el; }}
          >
            <EventSection event={event} index={index} />
          </div>
        ))
      ) : (
        <section className="h-screen w-full flex items-center justify-center bg-neutral-900">
          <p className="text-neutral-500">No events available</p>
        </section>
      )}

      {/* Collection Grid */}
      <CollectionGrid />

      {/* Product Grid */}
      <ProductGrid products={products} />

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  );
}
