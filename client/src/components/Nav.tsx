import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Calendar, 
  Award, 
  Users, 
  Gift, 
  Shield, 
  LogIn, 
  User,
  Sparkles,
  Trophy,
  Handshake
} from "lucide-react";

interface NavProps {
  variant?: "default" | "minimal" | "transparent";
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
}

export default function Nav({ 
  variant = "default", 
  showBack = false, 
  backHref = "/",
  backLabel = "BACK"
}: NavProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  const isActive = (path: string) => location === path;

  // Public navigation links
  const publicLinks = [
    { href: "/drops", label: "MARKS", icon: Sparkles },
    { href: "/verify", label: "VERIFY", icon: Shield },
    { href: "/events", label: "GATHERINGS", icon: Calendar },
    { href: "/sponsors", label: "PARTNERS", icon: Handshake },
  ];

  // Member-only links (shown when logged in)
  const memberLinks = [
    { href: "/inside", label: "INSIDE", icon: Users },
    { href: "/leaderboard", label: "RANKS", icon: Trophy },
    { href: "/referral", label: "REFER", icon: Gift },
  ];

  // Combine links based on auth state
  const navLinks = user ? [...publicLinks, ...memberLinks] : publicLinks;

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 ${
          variant === "transparent" ? "" : "bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1a1a1a]"
        }`}
      >
        <nav className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Left: Back button or Logo */}
          {showBack ? (
            <Link href={backHref}>
              <button className="flex items-center gap-2 text-[#666666] hover:text-white transition-colors group">
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                  className="group-hover:-translate-x-1 transition-transform"
                >
                  <path d="M15 18L9 12L15 6" />
                </svg>
                <span className="text-micro tracking-[0.2em]">{backLabel}</span>
              </button>
            </Link>
          ) : (
            <Link href="/">
              <motion.span 
                className="text-2xl font-light cursor-pointer logo-animated"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
              >
                @
              </motion.span>
            </Link>
          )}

          {/* Center: Navigation links (desktop) */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.slice(0, 4).map((link) => (
              <Link key={link.href} href={link.href}>
                <span 
                  className={`text-xs tracking-widest transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive(link.href) 
                      ? "text-[#9333EA]" 
                      : "text-[#666666] hover:text-white"
                  }`}
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Right: User section + more links (desktop) */}
          <div className="hidden lg:flex items-center gap-6">
            {user && navLinks.slice(4).map((link) => (
              <Link key={link.href} href={link.href}>
                <span 
                  className={`text-xs tracking-widest transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive(link.href) 
                      ? "text-[#9333EA]" 
                      : "text-[#666666] hover:text-white"
                  }`}
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </span>
              </Link>
            ))}
            
            {/* Auth button */}
            {!loading && (
              user ? (
                <Link href="/profile">
                  <span className="flex items-center gap-2 text-xs tracking-widest text-[#9333EA] hover:text-white transition-colors cursor-pointer">
                    <User className="w-3.5 h-3.5" />
                    {user.callSign || user.name?.split(' ')[0] || 'PROFILE'}
                  </span>
                </Link>
              ) : (
                <Link href="/inside">
                  <span className="flex items-center gap-2 px-4 py-2 bg-[#9333EA] text-white text-xs tracking-widest hover:bg-[#7c28c9] transition-colors cursor-pointer">
                    <LogIn className="w-3.5 h-3.5" />
                    ENTER
                  </span>
                </Link>
              )
            )}
          </div>

          {/* Mobile: Current location + menu button */}
          <div className="flex lg:hidden items-center gap-4">
            <span className="text-xs text-[#666666] tracking-wider font-medium">
              {location === "/" ? "COMM@" : location.replace("/", "").toUpperCase()}
            </span>
            
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-[#666666] hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              <motion.div
                animate={menuOpen ? "open" : "closed"}
                className="w-5 h-4 flex flex-col justify-between"
              >
                <motion.span 
                  variants={{
                    closed: { rotate: 0, y: 0 },
                    open: { rotate: 45, y: 6 }
                  }}
                  className="w-full h-[1px] bg-current origin-left"
                />
                <motion.span 
                  variants={{
                    closed: { opacity: 1 },
                    open: { opacity: 0 }
                  }}
                  className="w-full h-[1px] bg-current"
                />
                <motion.span 
                  variants={{
                    closed: { rotate: 0, y: 0 },
                    open: { rotate: -45, y: -6 }
                  }}
                  className="w-full h-[1px] bg-current origin-left"
                />
              </motion.div>
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/98 backdrop-blur-md lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.nav
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-col items-center justify-center h-full gap-6 py-20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Logo */}
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <span className="text-5xl font-light logo-animated mb-8">@</span>
              </Link>
              
              {/* Public links */}
              <div className="text-center mb-4">
                <p className="text-[10px] text-[#444444] tracking-[0.3em] mb-4">EXPLORE</p>
                <div className="flex flex-col gap-4">
                  {publicLinks.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <Link href={link.href} onClick={() => setMenuOpen(false)}>
                        <span 
                          className={`flex items-center justify-center gap-3 text-lg tracking-[0.2em] ${
                            isActive(link.href) 
                              ? "text-[#9333EA]" 
                              : "text-white"
                          }`}
                        >
                          <link.icon className="w-4 h-4" />
                          {link.label}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Member links (if logged in) */}
              {user && (
                <div className="text-center border-t border-[#222222] pt-6 mt-2">
                  <p className="text-[10px] text-[#444444] tracking-[0.3em] mb-4">MEMBERS</p>
                  <div className="flex flex-col gap-4">
                    {memberLinks.map((link, i) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                      >
                        <Link href={link.href} onClick={() => setMenuOpen(false)}>
                          <span 
                            className={`flex items-center justify-center gap-3 text-lg tracking-[0.2em] ${
                              isActive(link.href) 
                                ? "text-[#9333EA]" 
                                : "text-white"
                            }`}
                          >
                            <link.icon className="w-4 h-4" />
                            {link.label}
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Auth section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 pt-6 border-t border-[#222222]"
              >
                {user ? (
                  <Link href="/profile" onClick={() => setMenuOpen(false)}>
                    <span className="flex items-center gap-3 text-[#9333EA] text-lg tracking-[0.2em]">
                      <User className="w-4 h-4" />
                      {user.callSign || 'PROFILE'}
                    </span>
                  </Link>
                ) : (
                  <Link href="/inside" onClick={() => setMenuOpen(false)}>
                    <span className="flex items-center gap-3 px-8 py-3 bg-[#9333EA] text-white text-sm tracking-[0.2em]">
                      <LogIn className="w-4 h-4" />
                      ENTER THE COLLECTIVE
                    </span>
                  </Link>
                )}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-8 text-[10px] text-[#333333] tracking-[0.3em]"
              >
                SEASON ONE — SOUTH JAKARTA
              </motion.p>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
