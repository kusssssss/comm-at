import { motion } from "framer-motion";

interface LoadingSkeletonProps {
  type: "card" | "text" | "avatar" | "button" | "line";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ type, count = 1, className = "" }: LoadingSkeletonProps) {
  const shimmer = {
    initial: { backgroundPosition: "200% center" },
    animate: { backgroundPosition: "-200% center" },
    transition: { duration: 2, repeat: Infinity }
  };

  const baseClass = "bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%]";

  const getSkeletonClass = () => {
    switch (type) {
      case "card":
        return `${baseClass} rounded-lg h-64 w-full`;
      case "text":
        return `${baseClass} rounded h-4 w-3/4`;
      case "avatar":
        return `${baseClass} rounded-full h-12 w-12`;
      case "button":
        return `${baseClass} rounded h-10 w-24`;
      case "line":
        return `${baseClass} rounded h-2 w-full`;
      default:
        return baseClass;
    }
  };

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={getSkeletonClass()}
          variants={shimmer}
          initial="initial"
          animate="animate"
          style={{ marginBottom: type === "card" ? "1rem" : "0.5rem" }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingSkeleton type="card" />
      <div className="space-y-2">
        <LoadingSkeleton type="text" />
        <LoadingSkeleton type="line" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <LoadingSkeleton type="avatar" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton type="text" className="w-1/2" />
            <LoadingSkeleton type="line" />
          </div>
        </div>
      ))}
    </div>
  );
}
