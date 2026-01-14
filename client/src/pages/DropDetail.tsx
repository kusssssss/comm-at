import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronLeft, ChevronRight, Play, User } from "lucide-react";
import { useState, useRef } from "react";

interface GalleryImage {
  url: string;
  type: 'product' | 'ugc';
  holderCallsign?: string | null;
  caption?: string | null;
}

export default function DropDetail() {
  const { id } = useParams<{ id: string }>();
  const dropId = parseInt(id || "0");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: drop, isLoading } = trpc.drop.getById.useQuery(
    { id: dropId },
    { enabled: dropId > 0 }
  );
  const { data: ugcList } = trpc.ugc.getByDrop.useQuery(
    { dropId },
    { enabled: dropId > 0 }
  );

  // Map drop IDs to generated product images
  const productImageMap: Record<number, string[]> = {
    30043: ["/images/product-sukajan.jpg"],
    30044: ["/images/product-longsleeve.jpg"],
    30045: ["/images/product-bomber.jpg"],
    30046: ["/images/product-hoodie.jpg"],
    30047: ["/images/product-varsity.jpg"],
    30048: ["/images/product-chain.jpg"],
  };

  // Build combined gallery: product images first, then UGC
  const buildGallery = (): GalleryImage[] => {
    const gallery: GalleryImage[] = [];
    
    // Add product images
    const productImages = productImageMap[dropId] || ["/images/product-sukajan.jpg"];
    productImages.forEach(url => {
      gallery.push({ url, type: 'product' });
    });
    
    // Add approved UGC images from verified members
    if (ugcList && ugcList.length > 0) {
      ugcList.forEach(ugc => {
        if (ugc.type === 'image' && ugc.storageUrl) {
          gallery.push({
            url: ugc.storageUrl,
            type: 'ugc',
            holderCallsign: ugc.holderCallsign,
            caption: ugc.caption
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-#9333EA border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Drop not found</p>
          <Link href="/marks">
            <button className="text-#9333EA hover:underline">← Back to Marks</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Film Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-sm border-b border-zinc-900">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <span className="text-#9333EA text-xl font-light cursor-pointer hover:text-#A855F7 transition-colors">COMM@</span>
          </Link>
          <nav className="flex gap-8 text-sm">
            <Link href="/verify" className="text-zinc-400 hover:text-white transition-colors">Verify</Link>
            <Link href="/marks" className="text-zinc-400 hover:text-white transition-colors">Marks</Link>
            <Link href="/gatherings" className="text-zinc-400 hover:text-white transition-colors">Gatherings</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24">
        {/* Back Link */}
        <div className="container mx-auto px-6 py-6">
          <Link href="/marks">
            <span className="inline-flex items-center gap-2 text-zinc-500 hover:text-#9333EA transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider">Back to Marks</span>
            </span>
          </Link>
        </div>

        {/* Product Section */}
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Image Gallery - Now includes UGC */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden">
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={currentImage?.url}
                  alt={drop.title}
                  className="w-full h-full object-cover"
                />
                
                {/* UGC Badge - Show when viewing member photo */}
                {currentImage?.type === 'ugc' && (
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-2 flex items-center gap-2">
                    <User className="w-3 h-3 text-#9333EA" />
                    <span className="text-xs text-#9333EA uppercase tracking-wider">
                      {currentImage.holderCallsign || 'Verified Member'}
                    </span>
                  </div>
                )}
                
                {/* Navigation Arrows */}
                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}

                {/* Image Indicators with type distinction */}
                {gallery.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {gallery.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentImageIndex 
                            ? 'bg-#9333EA' 
                            : img.type === 'ugc' 
                              ? 'bg-#9333EA/30' 
                              : 'bg-white/30'
                        }`}
                        title={img.type === 'ugc' ? `Photo by ${img.holderCallsign || 'Member'}` : 'Product Photo'}
                      />
                    ))}
                  </div>
                )}

                {/* Edition Badge */}
                <div className="absolute top-4 right-4 bg-black/80 px-4 py-2">
                  <span className="text-#9333EA font-mono">{drop.editionSize} EDITION</span>
                </div>
              </div>

              {/* Thumbnail Strip - Shows all images including UGC */}
              {gallery.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`relative flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-colors ${
                        i === currentImageIndex ? 'border-#9333EA' : 'border-transparent'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {/* UGC indicator on thumbnail */}
                      {img.type === 'ugc' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-#9333EA/80 py-0.5">
                          <User className="w-3 h-3 text-black mx-auto" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* UGC count indicator */}
              {ugcList && ugcList.length > 0 && (
                <p className="text-xs text-zinc-500 mt-3">
                  <span className="text-#9333EA">{ugcList.filter(u => u.type === 'image').length}</span> photos from verified members
                </p>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:py-8"
            >
              {/* Artist & Chapter */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-#9333EA text-sm uppercase tracking-[0.2em]">{drop.artistName}</span>
                {drop.chapter && (
                  <>
                    <span className="text-zinc-700">|</span>
                    <span className="text-zinc-500 text-sm uppercase tracking-wider">{drop.chapter}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl text-white font-light mb-6">{drop.title}</h1>

              {/* Price */}
              {drop.priceIdr && (
                <p className="text-2xl text-white mb-8">
                  IDR {Number(drop.priceIdr).toLocaleString()}
                </p>
              )}

              {/* Story */}
              {drop.storyBlurb && (
                <div className="mb-10">
                  <p className="text-zinc-400 leading-relaxed">{drop.storyBlurb}</p>
                </div>
              )}

              {/* Key Terms */}
              {drop.keyTerms && (
                <div className="mb-10 flex flex-wrap gap-2">
                  {drop.keyTerms.split(',').map((term, i) => (
                    <span key={i} className="px-3 py-1 bg-zinc-900 text-zinc-400 text-sm">
                      {term.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Edition Info */}
              <div className="mb-10">
                <p className="text-zinc-500 text-sm uppercase tracking-wider mb-4">Edition</p>
                <div className="flex gap-2">
                  <span className="px-4 py-2 border border-zinc-800 text-zinc-400 text-sm">
                    {drop.editionSize} pieces total
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-800 my-10" />

              {/* Verification CTA */}
              <div className="space-y-4">
                <p className="text-zinc-500 text-sm">
                  Own this mark? Verify your possession to receive The Mark.
                </p>
                <Link href="/verify">
                  <button className="w-full py-4 border border-#9333EA/50 text-#9333EA hover:bg-#9333EA hover:text-black transition-all uppercase tracking-[0.2em] text-sm">
                    Verify Mark
                  </button>
                </Link>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-6 mt-10 pt-10 border-t border-zinc-800">
                <div>
                  <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Edition</p>
                  <p className="text-white">{drop.editionSize} pieces</p>
                </div>
                <div>
                  <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Artist</p>
                  <p className="text-white">{drop.artistName}</p>
                </div>
                <div>
                  <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Chapter</p>
                  <p className="text-white">{drop.chapter || 'Season One'}</p>
                </div>
                <div>
                  <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Status</p>
                  <p className="text-#9333EA uppercase">{drop.status}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 mt-20 border-t border-zinc-900">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-#9333EA">COMM@</span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-600 text-sm">Season One · South Jakarta</span>
            </div>
            <div className="flex gap-8 text-zinc-600 text-sm">
              <Link href="/verify" className="hover:text-#9333EA transition-colors">Verify</Link>
              <Link href="/inside" className="hover:text-#9333EA transition-colors">Inside</Link>
              <Link href="/gatherings" className="hover:text-#9333EA transition-colors">Gatherings</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
