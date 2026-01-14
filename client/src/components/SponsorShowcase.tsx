import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";

const tierColors = {
  platinum: {
    bg: "from-yellow-500/30 to-amber-600/20",
    border: "border-yellow-400/60",
    text: "text-yellow-300",
    glow: "shadow-yellow-500/40",
  },
  gold: {
    bg: "from-yellow-500/20 to-amber-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
  },
  silver: {
    bg: "from-gray-400/20 to-gray-500/10",
    border: "border-gray-400/30",
    text: "text-gray-300",
    glow: "shadow-gray-400/20",
  },
  bronze: {
    bg: "from-orange-700/20 to-orange-800/10",
    border: "border-orange-700/30",
    text: "text-orange-400",
    glow: "shadow-orange-700/20",
  },
};

interface Sponsor {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  description: string | null;
}

function SponsorCard({ sponsor, onImpression }: { sponsor: Sponsor; onImpression: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);
  const colors = tierColors[sponsor.tier];
  const isPlatinum = sponsor.tier === 'platinum';
  
  const trackMutation = trpc.sponsor.track.useMutation();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTracked.current) {
          hasTracked.current = true;
          onImpression();
        }
      },
      { threshold: 0.5 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [onImpression]);
  
  const handleClick = () => {
    trackMutation.mutate({
      sponsorId: sponsor.id,
      eventType: 'click',
      pageType: 'homepage',
    });
    
    if (sponsor.websiteUrl) {
      window.open(sponsor.websiteUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: isPlatinum ? 1.05 : 1.02 }}
      onClick={handleClick}
      className={`
        relative cursor-pointer group
        bg-gradient-to-br ${colors.bg}
        border-2 ${colors.border}
        rounded-xl p-8
        transition-all duration-300
        hover:shadow-2xl ${colors.glow}
        ${isPlatinum ? 'ring-1 ring-yellow-400/30' : ''}
      `}
    >
      {/* Tier badge */}
      <div className={`absolute top-3 right-3 text-[10px] uppercase tracking-wider font-bold ${colors.text} ${isPlatinum ? 'opacity-100 bg-yellow-500/20 px-2 py-1 rounded' : 'opacity-60'}`}>
        {sponsor.tier}
      </div>
      
      {/* Logo */}
      <div className={`${isPlatinum ? 'h-24' : 'h-16'} flex items-center justify-center mb-4`}>
        {sponsor.logoUrl ? (
          <img 
            src={sponsor.logoUrl} 
            alt={sponsor.name}
            className={`max-h-full max-w-full object-contain filter ${isPlatinum ? 'brightness-110' : 'brightness-90'} group-hover:brightness-125 transition-all`}
          />
        ) : (
          <div className={`${isPlatinum ? 'text-4xl' : 'text-2xl'} font-bold ${colors.text}`}>
            {sponsor.name.charAt(0)}
          </div>
        )
      }</div>
      
      {/* Name */}
      <h3 className={`text-center font-bold ${colors.text} mb-2 ${isPlatinum ? 'text-lg' : 'text-base'}`}>
        {sponsor.name}
      </h3>
      
      {/* Description (for platinum/gold) */}
      {(sponsor.tier === 'platinum' || sponsor.tier === 'gold') && sponsor.description && (
        <p className="text-xs text-gray-400 text-center line-clamp-2">
          {sponsor.description}
        </p>
      )}
      
      {/* Visit link indicator */}
      {sponsor.websiteUrl && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </motion.div>
  );
}

export function SponsorShowcase() {
  const { data: sponsors, isLoading } = trpc.sponsor.homepage.useQuery();
  const trackMutation = trpc.sponsor.track.useMutation();
  
  if (isLoading) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-800 rounded w-48 mx-auto mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-zinc-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  if (!sponsors || sponsors.length === 0) {
    return null;
  }
  
  // Group sponsors by tier
  const platinumSponsors = sponsors.filter(s => s.tier === 'platinum');
  const goldSponsors = sponsors.filter(s => s.tier === 'gold');
  const silverSponsors = sponsors.filter(s => s.tier === 'silver');
  const bronzeSponsors = sponsors.filter(s => s.tier === 'bronze');
  
  const handleImpression = (sponsorId: number) => {
    trackMutation.mutate({
      sponsorId,
      eventType: 'impression',
      pageType: 'homepage',
    });
  };
  
  return (
    <section className="py-16 px-6 bg-zinc-950/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs text-gray-500 tracking-[0.3em] uppercase mb-2">Powered By</p>
          <h2 className="text-2xl font-bold text-white">Our Partners</h2>
        </motion.div>
        
        {/* Platinum sponsors - large, prominent */}
        {platinumSponsors.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {platinumSponsors.map((sponsor) => (
                <SponsorCard 
                  key={sponsor.id} 
                  sponsor={sponsor as Sponsor}
                  onImpression={() => handleImpression(sponsor.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Gold sponsors - medium */}
        {goldSponsors.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {goldSponsors.map((sponsor) => (
                <SponsorCard 
                  key={sponsor.id} 
                  sponsor={sponsor as Sponsor}
                  onImpression={() => handleImpression(sponsor.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Silver & Bronze sponsors - smaller */}
        {(silverSponsors.length > 0 || bronzeSponsors.length > 0) && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[...silverSponsors, ...bronzeSponsors].map((sponsor) => (
              <SponsorCard 
                key={sponsor.id} 
                sponsor={sponsor as Sponsor}
                onImpression={() => handleImpression(sponsor.id)}
              />
            ))}
          </div>
        )}
        
        {/* Become a sponsor CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a 
            href="/partners" 
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Become a Partner →
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// Compact version for event/drop pages
export function SponsorBadges({ sponsors }: { sponsors: Array<{ sponsor: Sponsor; isPrimarySponsor: boolean; customMessage?: string | null }> }) {
  const trackMutation = trpc.sponsor.track.useMutation();
  
  if (!sponsors || sponsors.length === 0) return null;
  
  const primarySponsor = sponsors.find(s => s.isPrimarySponsor);
  const otherSponsors = sponsors.filter(s => !s.isPrimarySponsor);
  
  return (
    <div className="space-y-4">
      {primarySponsor && (
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">Presented by</p>
          <a
            href={primarySponsor.sponsor.websiteUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackMutation.mutate({
              sponsorId: primarySponsor.sponsor.id,
              eventType: 'click',
              pageType: 'event',
            })}
            className="inline-block"
          >
            {primarySponsor.sponsor.logoUrl ? (
              <img 
                src={primarySponsor.sponsor.logoUrl} 
                alt={primarySponsor.sponsor.name}
                className="h-12 object-contain filter brightness-90 hover:brightness-100 transition-all"
              />
            ) : (
              <span className="text-lg font-bold text-white">{primarySponsor.sponsor.name}</span>
            )}
          </a>
          {primarySponsor.customMessage && (
            <p className="text-xs text-gray-400 mt-2">{primarySponsor.customMessage}</p>
          )}
        </div>
      )}
      
      {otherSponsors.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 text-center">Supported by</p>
          <div className="flex flex-wrap justify-center gap-4">
            {otherSponsors.map(({ sponsor }) => (
              <a
                key={sponsor.id}
                href={sponsor.websiteUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackMutation.mutate({
                  sponsorId: sponsor.id,
                  eventType: 'click',
                  pageType: 'event',
                })}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                {sponsor.logoUrl ? (
                  <img 
                    src={sponsor.logoUrl} 
                    alt={sponsor.name}
                    className="h-8 object-contain"
                  />
                ) : (
                  <span className="text-sm text-gray-400">{sponsor.name}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
