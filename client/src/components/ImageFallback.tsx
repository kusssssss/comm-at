import { useState } from "react";
import { Sparkles } from "lucide-react";

interface ImageFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export function ImageFallback({
  src,
  alt,
  className = "w-full h-full object-cover",
  fallbackIcon = <Sparkles className="w-8 h-8 text-[#333333]" />,
  onLoad,
  onError
}: ImageFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  const handleError = () => {
    console.warn(`Failed to load image: ${src}`);
    setImageError(true);
    onError?.();
  };

  if (!src || imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
        <div className="flex flex-col items-center gap-2">
          {fallbackIcon}
          <span className="text-xs text-[#444444] font-mono">No image</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
      {/* Loading skeleton - only show while loading */}
      {!imageLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a] z-10" />
      )}
      
      {/* Image */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: imageLoaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out"
        }}
      />
    </div>
  );
}

// Map drop IDs to product images - assign different images based on drop title
export const DROP_IMAGE_MAP: Record<number, string> = {
  // Noodle Bowl Chain
  1: "/images/product-chain.jpg",
  // BOMBAE Varsity Jacket
  2: "/images/product-varsity.jpg",
  // Good Girl Cropped Hoodie
  3: "/images/product-hoodie.jpg",
  // Team Tomodachi Bomber
  4: "/images/product-bomber.jpg",
  // Fallback for any other drops
  5: "/images/product-longsleeve.jpg",
  6: "/images/product-sukajan.jpg",
};

// Alternative: Map by title pattern
export const DROP_IMAGE_BY_TITLE: Record<string, string> = {
  "noodle bowl chain": "/images/product-chain.jpg",
  "bombae varsity": "/images/product-varsity.jpg",
  "good girl": "/images/product-hoodie.jpg",
  "tomodachi bomber": "/images/product-bomber.jpg",
  "chain": "/images/product-chain.jpg",
  "varsity": "/images/product-varsity.jpg",
  "hoodie": "/images/product-hoodie.jpg",
  "bomber": "/images/product-bomber.jpg",
  "sukajan": "/images/product-sukajan.jpg",
  "longsleeve": "/images/product-longsleeve.jpg",
};

export function getDropImage(dropId: number, heroImageUrl?: string | null, dropTitle?: string): string {
  // Use provided heroImageUrl if available
  if (heroImageUrl) return heroImageUrl;
  
  // Try to match by title pattern
  if (dropTitle) {
    const titleLower = dropTitle.toLowerCase().trim();
    
    // Direct string matching for each product
    if (titleLower.includes("noodle bowl") || titleLower.includes("chain")) {
      return "/images/product-chain.jpg";
    }
    if (titleLower.includes("bombae") || titleLower.includes("varsity")) {
      return "/images/product-varsity.jpg";
    }
    if (titleLower.includes("good girl") || titleLower.includes("hoodie")) {
      return "/images/product-hoodie.jpg";
    }
    if (titleLower.includes("tomodachi") || titleLower.includes("bomber")) {
      return "/images/product-bomber.jpg";
    }
  }
  
  // Fall back to mapped product image by ID
  return DROP_IMAGE_MAP[dropId] || "/images/product-sukajan.jpg";
}
