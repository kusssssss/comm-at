import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
}

interface FloatingParticlesProps {
  particleCount?: number;
  className?: string;
}

export function FloatingParticles({ 
  particleCount = 50,
  className = ''
}: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    window.addEventListener('resize', resizeCanvas);

    // Track mouse position for subtle interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5 - 0.2, // Slight upward drift
          opacity: Math.random() * 0.5 + 0.1,
          hue: Math.random() * 40 + 260, // Purple range (260-300)
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
        });
      }
    };
    initParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, particleIndex) => {
        // Update pulse
        particle.pulse += particle.pulseSpeed;
        const pulseFactor = Math.sin(particle.pulse) * 0.3 + 0.7;

        // Mouse interaction - subtle attraction
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 200) {
          const force = (200 - distance) / 200 * 0.02;
          particle.speedX += dx * force * 0.01;
          particle.speedY += dy * force * 0.01;
        }

        // Apply speed limits
        particle.speedX = Math.max(-1, Math.min(1, particle.speedX));
        particle.speedY = Math.max(-1, Math.min(1, particle.speedY));

        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < -10) particle.x = canvas.width + 10;
        if (particle.x > canvas.width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = canvas.height + 10;
        if (particle.y > canvas.height + 10) particle.y = -10;

        // Draw particle with glow
        const currentOpacity = particle.opacity * pulseFactor;
        const currentSize = particle.size * pulseFactor;

        // Outer glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, currentSize * 4
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 80%, 60%, ${currentOpacity * 0.8})`);
        gradient.addColorStop(0.4, `hsla(${particle.hue}, 70%, 50%, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 60%, 40%, 0)`);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 90%, 70%, ${currentOpacity})`;
        ctx.fill();

        // Draw connections between nearby particles
        for (let j = particleIndex + 1; j < particlesRef.current.length; j++) {
          const other = particlesRef.current[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const lineOpacity = (1 - dist / 100) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `hsla(270, 70%, 60%, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}

export default FloatingParticles;
