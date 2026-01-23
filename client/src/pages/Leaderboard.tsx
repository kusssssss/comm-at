import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { DecryptText, ChromaticText } from '@/components/Effects2200';
import { Crown, Medal, Award, Trophy, Star, ChevronUp, Zap } from 'lucide-react';

function getTierInfo(points: number) {
  if (points >= 5000) return { name: 'Platinum', color: 'text-blue-300', bg: 'bg-blue-500/20', icon: Crown };
  if (points >= 2000) return { name: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Trophy };
  if (points >= 500) return { name: 'Silver', color: 'text-gray-300', bg: 'bg-gray-500/20', icon: Medal };
  return { name: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-500/20', icon: Award };
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
  return <span className="text-gray-500 font-mono">#{rank}</span>;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const { data: leaderboard, isLoading } = trpc.leaderboard.top.useQuery({ limit: 50 });
  const { data: myReputation } = trpc.leaderboard.myReputation.useQuery(undefined, {
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-blue-500/20">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <Link href="/">
            <span className="text-xl md:text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">@</span>
          </Link>
          <nav className="flex items-center gap-3 md:gap-6">
            <Link href="/marks" className="text-xs md:text-sm tracking-wider text-gray-400 hover:text-white transition-colors">MARKS</Link>
            <Link href="/verify" className="text-xs md:text-sm tracking-wider text-gray-400 hover:text-white transition-colors hidden sm:block">VERIFY</Link>
            {user && (
              <Link href="/inside" className="text-xs md:text-sm tracking-wider text-gray-400 hover:text-white transition-colors">INSIDE</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="pt-20 md:pt-24 pb-12 md:pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <ChromaticText className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">
              LEADERBOARD
            </ChromaticText>
            <p className="text-gray-500 tracking-wider">
              <DecryptText text="TOP MEMBERS BY REPUTATION" delay={0.5} />
            </p>
          </motion.div>

          {/* User's Stats (if logged in) */}
          {user && myReputation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12 p-6 border border-blue-500/30 bg-blue-500/5 rounded-lg"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-gray-500 text-sm tracking-wider mb-1">YOUR RANK</p>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold text-blue-400">#{myReputation.rank}</span>
                    <div className={`px-3 py-1 rounded-full ${getTierInfo(myReputation.points).bg}`}>
                      <span className={`text-sm font-medium ${getTierInfo(myReputation.points).color}`}>
                        {myReputation.tier}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm tracking-wider mb-1">REPUTATION POINTS</p>
                  <div className="flex items-center gap-2 justify-end">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <span className="text-3xl font-bold text-white">{myReputation.points.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {myReputation.events && myReputation.events.length > 0 && (
                <div className="mt-6 pt-6 border-t border-blue-500/20">
                  <p className="text-gray-500 text-sm tracking-wider mb-3">RECENT ACTIVITY</p>
                  <div className="space-y-2">
                    {myReputation.events.slice(0, 3).map((event, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{event.description || event.eventType}</span>
                        <span className={event.points > 0 ? 'text-green-400' : 'text-red-400'}>
                          {event.points > 0 ? '+' : ''}{event.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Tier Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 flex flex-wrap justify-center gap-4"
          >
            {[
              { name: 'Bronze', points: '0+', color: 'text-amber-600' },
              { name: 'Silver', points: '500+', color: 'text-gray-300' },
              { name: 'Gold', points: '2000+', color: 'text-yellow-400' },
              { name: 'Platinum', points: '5000+', color: 'text-blue-300' },
            ].map((tier) => (
              <div key={tier.name} className="flex items-center gap-2 text-sm">
                <Star className={`w-4 h-4 ${tier.color}`} />
                <span className={tier.color}>{tier.name}</span>
                <span className="text-gray-600">({tier.points})</span>
              </div>
            ))}
          </motion.div>

          {/* Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border border-blue-500/20 rounded-lg overflow-hidden"
          >
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-pulse text-gray-500">Loading rankings...</div>
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">No rankings yet. Be the first to earn points!</p>
              </div>
            ) : (
              <div className="divide-y divide-blue-500/10">
                {leaderboard.map((member, index) => {
                  const rank = index + 1;
                  const tier = getTierInfo(member.reputationPoints || 0);
                  const isCurrentUser = user?.id === member.id;
                  
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * Math.min(index, 10) }}
                      className={`flex items-center gap-4 p-4 ${
                        isCurrentUser ? 'bg-blue-500/10' : 'hover:bg-white/5'
                      } transition-colors`}
                    >
                      {/* Rank */}
                      <div className="w-12 flex justify-center">
                        {getRankIcon(rank)}
                      </div>

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium truncate ${isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                            {member.callSign || 'Anonymous'}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">YOU</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{member.chapter}</p>
                      </div>

                      {/* Tier Badge */}
                      <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded ${tier.bg}`}>
                        <tier.icon className={`w-4 h-4 ${tier.color}`} />
                        <span className={`text-xs ${tier.color}`}>{tier.name}</span>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Zap className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-white">{(member.reputationPoints || 0).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* How to Earn Points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-6 border border-blue-500/20 rounded-lg"
          >
            <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
              <ChevronUp className="w-5 h-5" />
              HOW TO EARN POINTS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">First Mark</span>
                <span className="text-green-400">+100 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Additional Marks</span>
                <span className="text-green-400">+50 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Event Attendance</span>
                <span className="text-green-400">+50 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Referral Joins</span>
                <span className="text-green-400">+100 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Referral Marks</span>
                <span className="text-green-400">+200 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Inner Circle Promotion</span>
                <span className="text-green-400">+1000 pts</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
