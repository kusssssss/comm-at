import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Users, ChevronRight, Trophy, Calendar, Gift, Sparkles, Star, Crown } from "lucide-react";
import { trpc } from "@/lib/trpc";

// Map tier IDs to icons
const tierIcons: Record<string, typeof EyeOff> = {
  initiate: Eye,
  prospect: Users,
  member: Shield,
  insider: Star,
  elite: Crown,
  legend: Sparkles,
};

// Map tier IDs to colors (matching the tier config)
const tierColors: Record<string, string> = {
  initiate: "#6B7280",
  prospect: "#10B981",
  member: "#3B82F6",
  insider: "#8B5CF6",
  elite: "#F59E0B",
  legend: "#EF4444",
};

interface ProgressBarProps {
  label: string;
  current: number;
  required: number;
  icon: React.ReactNode;
}

function ProgressBar({ label, current, required, icon }: ProgressBarProps) {
  const isComplete = current >= required;
  const progressPercent = required > 0 ? Math.min((current / required) * 100, 100) : 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-gray-400">
          {icon}
          <span>{label}</span>
        </div>
        <span className={isComplete ? "text-green-400" : "text-gray-500"}>
          {current}/{required}
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isComplete ? "bg-green-500" : "bg-purple-500"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function TierProgressCard() {
  const { data, isLoading } = trpc.tier.progress.useQuery();
  
  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-1/3 mb-4" />
        <div className="h-4 bg-zinc-800 rounded w-2/3 mb-6" />
        <div className="space-y-4">
          <div className="h-2 bg-zinc-800 rounded" />
          <div className="h-2 bg-zinc-800 rounded" />
          <div className="h-2 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }
  
  if (!data) return null;
  
  const { progress } = data;
  const currentTier = progress.currentTier;
  const nextTier = progress.nextTier;
  const tierId = currentTier?.name?.toLowerCase() || 'initiate';
  
  const TierIcon = tierIcons[tierId] || EyeOff;
  const tierColor = tierColors[tierId] || "#6B7280";
  const isMaxTier = !nextTier;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative overflow-hidden"
    >
      {/* Background glow for Inner Circle tier */}
      {currentTier?.name === 'INNER_CIRCLE' && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${tierColor}20`, border: `2px solid ${tierColor}` }}
          >
            <TierIcon className="w-6 h-6" style={{ color: tierColor }} />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Current Tier</p>
            <h3 className="text-lg font-bold" style={{ color: tierColor }}>
              {currentTier?.name || 'Initiate'}
            </h3>
          </div>
        </div>
        
        {!isMaxTier && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Progress</p>
            <p className="text-2xl font-bold text-white">{progress.overallProgress}%</p>
          </div>
        )}
      </div>
      
      {/* Overall Progress Bar */}
      {!isMaxTier && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-400">Progress to {nextTier?.name}</span>
            <ChevronRight className="w-4 h-4 text-purple-500" />
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.overallProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
      
      {/* Requirements Breakdown */}
      {!isMaxTier ? (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Requirements</p>
          
          {progress.requirements.marksOwned.required > 0 && (
            <ProgressBar
              label="Marks Owned"
              current={progress.requirements.marksOwned.current}
              required={progress.requirements.marksOwned.required}
              icon={<Trophy className="w-4 h-4" />}
            />
          )}
          
          {progress.requirements.eventsAttended.required > 0 && (
            <ProgressBar
              label="Events Attended"
              current={progress.requirements.eventsAttended.current}
              required={progress.requirements.eventsAttended.required}
              icon={<Calendar className="w-4 h-4" />}
            />
          )}
          
          {progress.requirements.referralsMade.required > 0 && (
            <ProgressBar
              label="Referrals Made"
              current={progress.requirements.referralsMade.current}
              required={progress.requirements.referralsMade.required}
              icon={<Gift className="w-4 h-4" />}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-purple-400 font-medium">Maximum Tier Achieved</p>
          <p className="text-xs text-gray-500 mt-1">You have full access to everything</p>
        </div>
      )}
      
      {/* Next Tier Preview */}
      {!isMaxTier && nextTier && (
        <div className="mt-6 pt-4 border-t border-zinc-800">
          <p className="text-xs text-gray-500 mb-2">Next tier: {nextTier.name}</p>
          <p className="text-xs text-gray-400">{nextTier.description}</p>
        </div>
      )}
    </motion.div>
  );
}

// Compact version for sidebar or smaller spaces
export function TierProgressCompact() {
  const { data, isLoading } = trpc.tier.progress.useQuery();
  
  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-6 h-6 bg-zinc-800 rounded-full" />
        <div className="h-4 bg-zinc-800 rounded w-16" />
      </div>
    );
  }
  
  const { progress } = data;
  const currentTier = progress.currentTier;
  const tierId = currentTier?.name?.toLowerCase() || 'initiate';
  
  const TierIcon = tierIcons[tierId] || EyeOff;
  const tierColor = tierColors[tierId] || "#6B7280";
  
  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${tierColor}20`, border: `1px solid ${tierColor}` }}
      >
        <TierIcon className="w-3 h-3" style={{ color: tierColor }} />
      </div>
      <span className="text-xs font-medium" style={{ color: tierColor }}>
        {currentTier?.name || 'Initiate'}
      </span>
      {progress.nextTier && (
        <span className="text-xs text-gray-500">
          ({progress.overallProgress}%)
        </span>
      )}
    </div>
  );
}
