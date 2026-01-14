import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import Nav from "@/components/Nav";
import { ChevronLeft, ChevronRight, User, Lock, Eye, EyeOff, Clock, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DecryptText, CycleNumber, GlitchHover } from "@/components/Effects2200";
import { InlineCountdown } from "@/components/Countdown";
import { MembersOnlyBadge } from "@/components/AccessLock";
import { ImageFallback, DROP_IMAGE_MAP } from "@/components/ImageFallback";

export default function Drops() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user } = useAuth();
  
  // Touch handling state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const { data: drops, isLoading } = trpc.drop.list.useQuery();

  // drops are already filtered to published in the API
  const publishedDrops = drops || [];
  const currentDrop = publishedDrops[currentIndex];

  // Check if content is restricted (from stratified reality filtering)
  const isBlurred = (currentDrop as any)?.isBlurred ?? false;
  const isRestricted = (currentDrop as any)?.isRestricted ?? false;

  // Fetch UGC for current drop (only if not restricted)
  const { data: ugcList } = trpc.ugc.getByDrop.useQuery(
    { dropId: currentDrop?.id || 0 },
    { enabled: !!currentDrop?.id && !isRestricted }
  );

  // Reset image index when drop changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageLoaded(false);
  }, [currentIndex]);

  // Reset loaded state when image changes within gallery
  useEffect(() => {
    setImageLoaded(false);
  }, [currentImageIndex]);

  const navigate = useCallback((newDirection: number) => {
    if (!publishedDrops.length) return;
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      const next = prev + newDirection;
      if (next < 0) return publishedDrops.length - 1;
      if (next >= publishedDrops.length) return 0;
      return next;
    });
  }, [publishedDrops.length]);

  const goToIndex = useCallback((index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        navigate(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        navigate(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        navigate(1);
      } else {
        navigate(-1);
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Map drop IDs to generated images - now using DROP_IMAGE_MAP from ImageFallback
  const productImageMap: Record<number, string[]> = Object.entries(DROP_IMAGE_MAP).reduce(
    (acc, [id, url]) => ({ ...acc, [Number(id)]: [url] }),
    {} as Record<number, string[]>
  );

  // Build gallery with product images + UGC
  interface GalleryImage {
    url: string;
    type: 'product' | 'ugc';
    holderCallsign?: string | null;
  }

  const buildGallery = (): GalleryImage[] => {
    if (!currentDrop) return [];
    const gallery: GalleryImage[] = [];
    
    const productImages = productImageMap[currentDrop.id] || ["/images/product-sukajan.jpg"];
    productImages.forEach(url => {
      gallery.push({ url, type: 'product' });
    });
    
    // Only show UGC if not restricted
    if (!isRestricted && ugcList && ugcList.length > 0) {
      ugcList.forEach(ugc => {
        if (ugc.type === 'image' && ugc.storageUrl) {
          gallery.push({
            url: ugc.storageUrl,
            type: 'ugc',
            holderCallsign: ugc.holderCallsign
          });
        }
      });
    }
    
    return gallery;
  };

  const gallery = buildGallery();
  const currentImage = gallery[currentImageIndex];

  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % gallery.length);
  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + gallery.length) % gallery.length);

  // Get access level message
  const getAccessMessage = () => {
    if (!user) return "Sign in and request clearance to see full content";
    const role = user.role;
    if (role === 'marked_initiate') return "Activate your Mark to unlock full access";
    if (role === 'public') return "Request clearance to see full content";
    return null;
  };

  // Empty state
  if (!isLoading && (!publishedDrops || publishedDrops.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <div className="grain" />
        <Nav showBack backHref="/" backLabel="HOME" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-[#9333EA] text-6xl mb-8">@</p>
            <p className="text-xl text-white mb-2">No drops available</p>
            <p className="text-sm text-[#888888] mb-8">Check back soon for new releases</p>
            <Link href="/">
              <button className="text-sm text-[#888888] hover:text-white transition-colors tracking-wider">
                ← RETURN HOME
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Grain overlay */}
      <div className="grain" />

      {/* Navigation */}
      <Nav showBack backHref="/" backLabel="HOME" />

      {/* Loading state */}
      {isLoading && (
        <div className="min-h-screen flex items-center justify-center">
          <motion.span 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[#9333EA] text-4xl"
          >
            @
          </motion.span>
        </div>
      )}

      {/* Context header */}
      {!isLoading && publishedDrops.length > 0 && (
        <div className="fixed top-20 left-0 right-0 z-30 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-xs text-[#888888] tracking-widest uppercase">MARKS</p>
              <p className="text-sm text-[#666666] mt-1">Swipe or tap arrows to browse</p>
            </div>
            <div className="text-right flex items-center gap-4">
              {/* Access level indicator */}
              {isRestricted && (
                <div className="flex items-center gap-2 text-[#9333EA]">
                  <EyeOff className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Limited View</span>
                </div>
              )}
              <p className="font-mono text-lg text-white">
                {String(currentIndex + 1).padStart(2, '0')} <span className="text-[#444444]">/</span> {String(publishedDrops.length).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content - Single drop view with integrated gallery */}
      {!isLoading && publishedDrops.length > 0 && currentDrop && (
        <main className="min-h-screen flex items-center pt-32 pb-32">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full px-6 md:px-12 lg:px-24"
            >
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-7xl mx-auto">
                {/* Left: Image Gallery with UGC */}
                <div className="relative">
                  <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900">
                    {/* Loading skeleton */}
                    {!imageLoaded && (
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900" />
                    )}
                    <ImageFallback
                      src={currentImage?.url}
                      alt={`${currentDrop.title} by ${currentDrop.artistName}`}
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        isBlurred ? 'blur-xl scale-105' : ''
                      }`}
                      onLoad={() => setImageLoaded(true)}
                    />
                    
                    {/* Blur overlay for restricted content */}
                    {isBlurred && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                        <Lock className="w-12 h-12 text-[#9333EA] mb-4" />
                        <p className="text-white text-lg font-medium mb-2">Content Restricted</p>
                        <p className="text-[#888888] text-sm text-center px-8 max-w-xs">
                          {getAccessMessage()}
                        </p>
                        {!user && (
                          <button 
                            onClick={() => setLocation('/apply')}
                            className="mt-4 bg-[#9333EA] text-black px-6 py-2 text-sm font-semibold tracking-wider uppercase hover:bg-[#A855F7] transition-all"
                          >
                            Request Clearance
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* UGC Badge */}
                    {!isBlurred && currentImage?.type === 'ugc' && (
                      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-2 flex items-center gap-2">
                        <User className="w-3 h-3 text-[#9333EA]" />
                        <span className="text-xs text-[#9333EA] uppercase tracking-wider">
                          {currentImage.holderCallsign || 'Verified Member'}
                        </span>
                      </div>
                    )}
                    
                    {/* Gradient overlay */}
                    {!isBlurred && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    )}
                    
                    {/* Gallery navigation - only if not blurred */}
                    {!isBlurred && gallery.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 flex items-center justify-center transition-colors rounded-full"
                        >
                          <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 flex items-center justify-center transition-colors rounded-full"
                        >
                          <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                      </>
                    )}

                    {/* Image indicators */}
                    {!isBlurred && gallery.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {gallery.map((img, i) => (
                          <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              i === currentImageIndex 
                                ? 'bg-[#9333EA]' 
                                : img.type === 'ugc' 
                                  ? 'bg-[#9333EA]/30' 
                                  : 'bg-white/30'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Edition Badge */}
                    <div className="absolute top-4 right-4 bg-black/80 px-4 py-2">
                      <span className="text-[#9333EA] font-mono text-sm">{currentDrop.editionSize} EDITION</span>
                    </div>
                  </div>

                  {/* Thumbnail Strip - only if not blurred */}
                  {!isBlurred && gallery.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                      {gallery.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImageIndex(i)}
                          className={`relative flex-shrink-0 w-16 h-16 overflow-hidden border-2 transition-colors ${
                            i === currentImageIndex ? 'border-[#9333EA]' : 'border-transparent'
                          }`}
                        >
                          <img src={img.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                          {img.type === 'ugc' && (
                            <div className="absolute bottom-0 left-0 right-0 bg-[#9333EA]/80 py-0.5">
                              <User className="w-2.5 h-2.5 text-black mx-auto" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* UGC count - only if not restricted */}
                  {!isRestricted && ugcList && ugcList.filter(u => u.type === 'image').length > 0 && (
                    <p className="text-xs text-[#666666] mt-2">
                      <span className="text-[#9333EA]">{ugcList.filter(u => u.type === 'image').length}</span> photos from verified members
                    </p>
                  )}
                  
                  {/* Restricted UGC indicator */}
                  {isRestricted && (
                    <p className="text-xs text-[#666666] mt-2 flex items-center gap-2">
                      <EyeOff className="w-3 h-3" />
                      Member photos hidden
                    </p>
                  )}
                </div>

                {/* Right: Info */}
                <div className="space-y-6 lg:space-y-8">
                  {/* Artist & Chapter */}
                  <div className="flex items-center gap-4">
                    <span className="text-[#9333EA] text-sm uppercase tracking-[0.2em]">{currentDrop.artistName}</span>
                    {currentDrop.chapter && (
                      <>
                        <span className="text-[#444444]">|</span>
                        <span className="text-[#666666] text-sm uppercase tracking-wider">{currentDrop.chapter}</span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl text-white font-light">{currentDrop.title}</h1>

                  {/* Price - show placeholder if hidden */}
                  {currentDrop.priceIdr ? (
                    <p className="text-2xl text-white">
                      IDR {Number(currentDrop.priceIdr).toLocaleString()}
                    </p>
                  ) : isRestricted ? (
                    <div className="flex items-center gap-2 text-[#666666]">
                      <Lock className="w-4 h-4" />
                      <span className="text-lg">Price hidden</span>
                    </div>
                  ) : null}

                  {/* Story blurb - show truncated or full */}
                  {currentDrop.storyBlurb ? (
                    <p className="text-base text-[#888888] leading-relaxed max-w-md">
                      {currentDrop.storyBlurb}
                    </p>
                  ) : isRestricted ? (
                    <p className="text-base text-[#666666] leading-relaxed max-w-md italic">
                      Story details available to members...
                    </p>
                  ) : null}

                  {/* Key Terms */}
                  {currentDrop.keyTerms && (
                    <div className="flex flex-wrap gap-2">
                      {currentDrop.keyTerms.split(',').map((term, i) => (
                        <span key={i} className="px-3 py-1 bg-[#1a1a1a] text-[#888888] text-sm">
                          {term.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Sale Window Countdown */}
                  {currentDrop.saleWindowEnd && new Date(currentDrop.saleWindowEnd) > new Date() && (
                    <div className="bg-[#9333EA]/10 border border-[#9333EA]/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-[#9333EA]" />
                        <span className="text-[#9333EA] text-xs font-mono tracking-widest uppercase">SALE ENDS IN</span>
                      </div>
                      <InlineCountdown 
                        targetDate={new Date(currentDrop.saleWindowEnd)} 
                        className="text-2xl text-red-400 font-bold"
                      />
                    </div>
                  )}
                  
                  {/* Sale Window Starting Soon */}
                  {currentDrop.saleWindowStart && new Date(currentDrop.saleWindowStart) > new Date() && (
                    <div className="bg-[#1a1a1a] border border-[#333333] p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#9333EA]" />
                        <span className="text-[#9333EA] text-xs font-mono tracking-widest uppercase">AVAILABLE IN</span>
                      </div>
                      <InlineCountdown 
                        targetDate={new Date(currentDrop.saleWindowStart)} 
                        className="text-2xl text-[#9333EA] font-bold"
                      />
                    </div>
                  )}

                  {/* Edition info */}
                  <div className="flex gap-12">
                    <div>
                      <p className="text-xs text-[#666666] tracking-widest uppercase mb-2">Edition</p>
                      <p className="text-2xl text-white font-mono">{currentDrop.editionSize}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#666666] tracking-widest uppercase mb-2">Chapter</p>
                      <p className="text-2xl text-white font-mono">{currentDrop.chapter || "—"}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#333333] my-6" />

                  {/* Access level banner for restricted content */}
                  {isRestricted && (
                    <div className="bg-[#1a1a1a] border border-[#333333] p-4 space-y-3">
                      <div className="flex items-center gap-2 text-[#9333EA]">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-wider">Limited Access</span>
                      </div>
                      <p className="text-sm text-[#888888]">
                        {getAccessMessage()}
                      </p>
                      {!user ? (
                        <button 
                          onClick={() => setLocation('/apply')}
                          className="w-full bg-[#9333EA] text-black px-6 py-3 text-sm font-semibold tracking-wider uppercase hover:bg-[#A855F7] transition-all"
                        >
                          Request Clearance
                        </button>
                      ) : user.role === 'public' ? (
                        <button 
                          onClick={() => setLocation('/apply')}
                          className="w-full bg-[#9333EA] text-black px-6 py-3 text-sm font-semibold tracking-wider uppercase hover:bg-[#A855F7] transition-all"
                        >
                          Request Clearance
                        </button>
                      ) : user.role === 'marked_initiate' ? (
                        <button 
                          onClick={() => setLocation('/verify')}
                          className="w-full bg-[#9333EA] text-black px-6 py-3 text-sm font-semibold tracking-wider uppercase hover:bg-[#A855F7] transition-all"
                        >
                          Activate Your Mark
                        </button>
                      ) : null}
                    </div>
                  )}

                  {/* Verification CTA - only for non-restricted */}
                  {!isRestricted && (
                    <div className="space-y-4">
                      <p className="text-[#888888] text-sm">
                        Own this mark? Verify your possession to receive The Mark.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={() => setLocation('/verify')}
                          className="w-full sm:w-auto bg-[#9333EA] text-black px-8 py-4 text-sm font-semibold tracking-wider uppercase hover:bg-[#A855F7] transition-all duration-300"
                        >
                          Verify Mark
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      {/* Navigation arrows - LARGE touch targets */}
      {publishedDrops.length > 1 && (
        <>
          {/* Left arrow - full height touch zone */}
          <button
            onClick={() => navigate(-1)}
            className="fixed left-0 top-0 bottom-0 w-16 md:w-24 flex items-center justify-start pl-2 md:pl-4 z-40 group"
            aria-label="Previous drop"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center group-hover:bg-[#9333EA] group-hover:border-[#9333EA] group-active:scale-90 transition-all duration-300">
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="text-[#888888] group-hover:text-black transition-colors"
              >
                <path d="M15 18L9 12L15 6" />
              </svg>
            </div>
          </button>
          
          {/* Right arrow - full height touch zone */}
          <button
            onClick={() => navigate(1)}
            className="fixed right-0 top-0 bottom-0 w-16 md:w-24 flex items-center justify-end pr-2 md:pr-4 z-40 group"
            aria-label="Next drop"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center group-hover:bg-[#9333EA] group-hover:border-[#9333EA] group-active:scale-90 transition-all duration-300">
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="text-[#888888] group-hover:text-black transition-colors"
              >
                <path d="M9 18L15 12L9 6" />
              </svg>
            </div>
          </button>
        </>
      )}

      {/* Progress indicator - larger clickable dots */}
      {publishedDrops.length > 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-40 bg-[#0a0a0a]/80 px-4 py-3 rounded-full backdrop-blur-sm">
          {publishedDrops.map((_, i) => (
            <button
              key={i}
              onClick={() => goToIndex(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i === currentIndex 
                  ? "bg-[#9333EA] scale-125" 
                  : "bg-[#444444] hover:bg-[#666666]"
              }`}
              aria-label={`Go to drop ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="fixed bottom-8 right-6 z-40 hidden md:block">
        <span className="text-xs text-[#666666] tracking-wider">← → ARROWS or SWIPE</span>
      </div>
      <div className="fixed bottom-8 left-6 z-40 md:hidden">
        <span className="text-xs text-[#666666] tracking-wider">SWIPE TO BROWSE</span>
      </div>
    </div>
  );
}
