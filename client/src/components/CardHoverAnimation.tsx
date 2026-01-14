import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardHoverAnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function CardHoverAnimation({ children, className = "", delay = 0 }: CardHoverAnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0, boxShadow: "0 0 0 rgba(168, 85, 247, 0)" }}
      whileHover={{
        y: -8,
        boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3)",
        transition: { duration: 0.3 }
      }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

interface ButtonHoverAnimationProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
}

export function ButtonHoverAnimation({
  children,
  onClick,
  className = "",
  variant = "primary"
}: ButtonHoverAnimationProps) {
  const baseClass = "relative overflow-hidden";
  
  return (
    <motion.button
      className={`${baseClass} ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
        whileHover={{ opacity: 0.2, x: 100 }}
        transition={{ duration: 0.6 }}
      />
      {children}
    </motion.button>
  );
}
