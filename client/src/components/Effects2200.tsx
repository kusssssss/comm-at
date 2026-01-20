import { useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// YEAR 2200 EFFECTS SYSTEM - BOLD & CAPTIVATING
// The effects should make users feel like they're entering a restricted system
// ============================================================================

// Glitch characters for decrypt effect
const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~▓▒░█▄▀■□▪▫●○◆◇◈★☆";

// ============================================================================
// 1. SCAN LINES - More visible CRT effect
// ============================================================================
export function ScanLines({ intensity = "medium" }: { intensity?: "light" | "medium" | "heavy" }) {
  const opacityMap = { light: 0.02, medium: 0.04, heavy: 0.08 };
  
  return (
    <>
      {/* Horizontal scan lines */}
      <div 
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, ${opacityMap[intensity]}) 2px,
            rgba(0, 0, 0, ${opacityMap[intensity]}) 4px
          )`,
        }}
      />
      {/* Subtle vignette */}
      <div 
        className="fixed inset-0 pointer-events-none z-[9997]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </>
  );
}

// ============================================================================
// 2. CHROMATIC TEXT - Bold RGB split effect
// ============================================================================
export function ChromaticText({ 
  children, 
  className = '',
  intensity = 2
}: { 
  children: ReactNode; 
  className?: string;
  intensity?: number;
}) {
  return (
    <span 
      className={`relative inline-block ${className}`}
      style={{
        textShadow: `
          ${-intensity}px 0 rgba(168, 85, 247, 0.6),
          ${intensity}px 0 rgba(192, 132, 252, 0.6)
        `,
      }}
    >
      {children}
    </span>
  );
}

// ============================================================================
// 3. DECRYPT TEXT - Dramatic character reveal
// ============================================================================
export function DecryptText({ 
  text, 
  className = '',
  delay = 0,
  speed = 25,
  onComplete,
}: { 
  text: string; 
  className?: string;
  delay?: number;
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayText, setDisplayText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsDecrypting(true);
      let iteration = 0;
      const maxIterations = text.length * 3;
      
      const interval = setInterval(() => {
        setDisplayText(
          text
            .split('')
            .map((char, i) => {
              if (char === ' ') return ' ';
              if (i < iteration / 3) return char;
              return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
            })
            .join('')
        );
        
        iteration++;
        
        if (iteration >= maxIterations) {
          clearInterval(interval);
          setDisplayText(text);
          setIsDecrypting(false);
          onComplete?.();
        }
      }, speed);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(startTimeout);
  }, [text, delay, speed, onComplete]);
  
  return (
    <span 
      className={`${className}`}
      style={isDecrypting ? {
        textShadow: '-1px 0 #ff0000, 1px 0 #00ffff',
      } : {}}
    >
      {displayText || text.split('').map(() => '█').join('')}
    </span>
  );
}

// ============================================================================
// 4. CYCLE NUMBER - Dramatic number reveal
// ============================================================================
export function CycleNumber({ 
  value, 
  className = '',
  delay = 0,
  duration = 800,
}: { 
  value: number; 
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isCycling, setIsCycling] = useState(false);
  
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsCycling(true);
      const startTime = Date.now();
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress < 1) {
          // Easing function for dramatic effect
          const eased = 1 - Math.pow(1 - progress, 3);
          const randomRange = Math.floor((1 - eased) * 500);
          const randomOffset = Math.floor((Math.random() - 0.5) * randomRange);
          setDisplayValue(Math.max(0, Math.floor(value * eased + randomOffset)));
        } else {
          clearInterval(interval);
          setDisplayValue(value);
          setIsCycling(false);
        }
      }, 30);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(startTimeout);
  }, [value, delay, duration]);
  
  return (
    <span className={`tabular-nums ${className} ${isCycling ? 'opacity-90' : ''}`}>
      {displayValue.toLocaleString()}
    </span>
  );
}

// ============================================================================
// 5. GLITCH HOVER - Electric interaction feedback
// ============================================================================
export function GlitchHover({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  const [isGlitching, setIsGlitching] = useState(false);
  
  const handleHover = () => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 150);
  };
  
  return (
    <motion.div
      className={className}
      onMouseEnter={handleHover}
      animate={isGlitching ? {
        x: [0, -3, 3, -2, 2, 0],
        filter: [
          'hue-rotate(0deg)',
          'hue-rotate(90deg)',
          'hue-rotate(-90deg)',
          'hue-rotate(45deg)',
          'hue-rotate(0deg)',
        ],
      } : {}}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// 6. GLOW PULSE - Electric button effect
// ============================================================================
export function GlowPulse({ 
  children,
  className = '',
  color = '#3B82F6',
}: { 
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        className="absolute inset-0 rounded-sm"
        style={{ 
          boxShadow: `0 0 20px ${color}60, 0 0 40px ${color}30, 0 0 60px ${color}15`,
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {children}
    </motion.div>
  );
}

// ============================================================================
// 7. SYSTEM BOOT - Dramatic initialization sequence
// ============================================================================
export function SystemBoot({ 
  onComplete,
  children,
}: { 
  onComplete?: () => void;
  children: ReactNode;
}) {
  const hasSeenBoot = typeof window !== 'undefined' && sessionStorage.getItem('comm_boot_seen');
  const [phase, setPhase] = useState<'boot' | 'scan' | 'ready'>(hasSeenBoot ? 'ready' : 'boot');
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  
  useEffect(() => {
    if (hasSeenBoot) {
      onComplete?.();
      return;
    }
    
    const addLine = (text: string) => {
      setBootLines(prev => [...prev, text]);
    };
    
    // Boot sequence
    const sequence = async () => {
      await wait(100);
      addLine('> INITIALIZING NEURAL INTERFACE...');
      await wait(300);
      addLine('> LOADING CONSCIOUSNESS MATRIX...');
      await wait(250);
      addLine('> ESTABLISHING SECURE CONNECTION...');
      await wait(200);
      
      // Start scan phase
      setPhase('scan');
      
      // Animate scan progress
      for (let i = 0; i <= 100; i += 4) {
        setScanProgress(i);
        await wait(15);
      }
      
      await wait(100);
      addLine('> BIOMETRIC SCAN COMPLETE');
      await wait(150);
      addLine('> ACCESS GRANTED');
      await wait(400);
      
      setPhase('ready');
      sessionStorage.setItem('comm_boot_seen', 'true');
      onComplete?.();
    };
    
    sequence();
    
    // Fallback
    const fallback = setTimeout(() => {
      if (phase !== 'ready') {
        setPhase('ready');
        sessionStorage.setItem('comm_boot_seen', 'true');
        onComplete?.();
      }
    }, 5000);
    
    return () => clearTimeout(fallback);
  }, []);
  
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  return (
    <AnimatePresence mode="wait">
      {phase !== 'ready' ? (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 bg-black z-[10000] flex items-center justify-center overflow-hidden"
        >
          {/* Scan lines on boot screen */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 255, 0, 0.02) 2px,
                rgba(0, 255, 0, 0.02) 4px
              )`
            }}
          />
          
          {/* Horizontal scan beam */}
          <motion.div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0ABAB5] to-transparent opacity-50"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          
          <div className="w-full max-w-lg px-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <ChromaticText className="text-7xl font-bold text-white" intensity={3}>
                @
              </ChromaticText>
            </motion.div>
            
            {/* Terminal output */}
            <div className="font-mono text-xs space-y-1 mb-6 h-24 overflow-hidden">
              {bootLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[#0ABAB5]"
                >
                  {line}
                </motion.div>
              ))}
            </div>
            
            {/* Scan progress bar */}
            {phase === 'scan' && (
              <div className="space-y-2">
                <div className="flex justify-between text-[#0ABAB5] text-xs font-mono">
                  <span>SCANNING</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="h-1 bg-[#0a1a1a] overflow-hidden border border-[#0ABAB5]/30">
                  <motion.div
                    className="h-full bg-[#0ABAB5]"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Blinking cursor */}
            <motion.span
              className="inline-block w-2 h-4 bg-[#0ABAB5] mt-4"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, filter: 'brightness(2)' }}
          animate={{ opacity: 1, filter: 'brightness(1)' }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// 8. PAGE TRANSITION - Dramatic page change effect
// ============================================================================
export function PageTransition({ 
  children,
  className = '',
}: { 
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ 
        opacity: 0,
        filter: 'brightness(2) saturate(0)',
      }}
      animate={{ 
        opacity: 1,
        filter: 'brightness(1) saturate(1)',
      }}
      exit={{ 
        opacity: 0,
        filter: 'brightness(0.5) saturate(0)',
      }}
      transition={{ 
        duration: 0.4, 
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// 9. SCREEN GLITCH - Full screen glitch effect
// ============================================================================
export function ScreenGlitch({ 
  trigger = false,
  duration = 300,
  children,
}: { 
  trigger?: boolean;
  duration?: number;
  children: ReactNode;
}) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [glitchStyle, setGlitchStyle] = useState({});
  
  useEffect(() => {
    if (!trigger) return;
    
    setIsGlitching(true);
    
    const interval = setInterval(() => {
      setGlitchStyle({
        transform: `translate(${(Math.random() - 0.5) * 10}px, ${(Math.random() - 0.5) * 5}px)`,
        filter: `hue-rotate(${Math.random() * 360}deg)`,
      });
    }, 50);
    
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsGlitching(false);
      setGlitchStyle({});
    }, duration);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [trigger, duration]);
  
  return (
    <div style={isGlitching ? glitchStyle : {}}>
      {children}
    </div>
  );
}

// ============================================================================
// 10. FLICKER TEXT - Unstable text effect
// ============================================================================
export function FlickerText({ 
  children,
  className = '',
  intensity = 'medium',
}: { 
  children: ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
}) {
  const [opacity, setOpacity] = useState(1);
  
  useEffect(() => {
    const flickerRate = { light: 3000, medium: 1000, heavy: 300 }[intensity];
    
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setOpacity(0.4 + Math.random() * 0.6);
        setTimeout(() => setOpacity(1), 50 + Math.random() * 100);
      }
    }, flickerRate);
    
    return () => clearInterval(interval);
  }, [intensity]);
  
  return (
    <span className={className} style={{ opacity }}>
      {children}
    </span>
  );
}

// ============================================================================
// 11. DATA CORRUPTION - Visual noise overlay
// ============================================================================
export function DataCorruption({ 
  active = false,
  intensity = 0.3,
}: { 
  active?: boolean;
  intensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    let animationId: number;
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Random noise blocks
      const blockCount = Math.floor(30 * intensity);
      for (let i = 0; i < blockCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const w = Math.random() * 150 + 30;
        const h = Math.random() * 4 + 1;
        
        ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,0,0' : '0,255,255'}, ${Math.random() * 0.2})`;
        ctx.fillRect(x, y, w, h);
      }
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [active, intensity]);
  
  if (!active) return null;
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

// ============================================================================
// 12. TYPING TEXT - Terminal typing effect
// ============================================================================
export function TypingText({ 
  children,
  speed = 50,
  delay = 0,
  className = '',
  showCursor = true,
  onComplete,
}: { 
  children: string;
  speed?: number;
  delay?: number;
  className?: string;
  showCursor?: boolean;
  onComplete?: () => void;
}) {
  const [displayText, setDisplayText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(true);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        if (currentIndex >= children.length) {
          clearInterval(interval);
          setIsTyping(false);
          onComplete?.();
          return;
        }
        
        setDisplayText(children.slice(0, currentIndex + 1));
        currentIndex++;
      }, speed);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [children, speed, delay, onComplete]);
  
  // Cursor blink
  useEffect(() => {
    if (!showCursor) return;
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);
    return () => clearInterval(interval);
  }, [showCursor]);
  
  return (
    <span className={className}>
      {displayText}
      {showCursor && (isTyping || cursorVisible) && (
        <span className="inline-block w-[2px] h-[1em] bg-current ml-[2px]" style={{ opacity: cursorVisible ? 1 : 0 }} />
      )}
    </span>
  );
}

// ============================================================================
// 13. HOLOGRAM EFFECT - Futuristic holographic overlay
// ============================================================================
export function Hologram({ 
  children,
  className = '',
}: { 
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative z-10">{children}</div>
      
      {/* Scan line animation */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        initial={false}
      >
        <motion.div
          className="absolute left-0 right-0 h-[30%] bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"
          animate={{ top: ['-30%', '130%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
      
      {/* Horizontal lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0, 255, 255, 0.1) 3px,
            rgba(0, 255, 255, 0.1) 4px
          )`
        }}
      />
    </div>
  );
}

// ============================================================================
// 14. ELECTRIC BORDER - Animated glowing border
// ============================================================================
export function ElectricBorder({ 
  children,
  className = '',
  color = '#3B82F6',
}: { 
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Animated border glow */}
      <motion.div
        className="absolute -inset-[1px] rounded-sm"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="relative bg-black">{children}</div>
    </div>
  );
}

// ============================================================================
// 15. GRAIN OVERLAY - Film grain texture
// ============================================================================
export function GrainOverlay({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <div 
      className="grain fixed inset-0 pointer-events-none z-[9999]"
      style={{ opacity }}
    />
  );
}

// ============================================================================
// 16. REVEAL ON SCROLL - Fade in elements as they enter viewport
// ============================================================================
export function RevealOnScroll({ 
  children,
  className = '',
  delay = 0,
}: { 
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [delay]);
  
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
