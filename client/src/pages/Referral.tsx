import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { DecryptText, ChromaticText } from '@/components/Effects2200';
import { Copy, Check, Users, UserPlus, Award, Share2, Gift } from 'lucide-react';
import { toast } from 'sonner';

export default function Referral() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  
  const { data: codeData, isLoading: codeLoading } = trpc.referral.getCode.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: stats } = trpc.referral.stats.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: history } = trpc.referral.history.useQuery(undefined, {
    enabled: !!user,
  });

  const referralUrl = codeData?.code 
    ? `${window.location.origin}?ref=${codeData.code}` 
    : '';

  const copyToClipboard = async () => {
    if (!referralUrl) return;
    
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const shareReferral = async () => {
    if (!referralUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join COMM@',
          text: 'Join the exclusive underground culture collective',
          url: referralUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      copyToClipboard();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">You must be a marked member to access referrals</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-blue-500/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">@</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/inside" className="text-sm tracking-wider text-gray-400 hover:text-white transition-colors">INSIDE</Link>
            <Link href="/ranks" className="text-sm tracking-wider text-gray-400 hover:text-white transition-colors">RANKS</Link>
          </nav>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <ChromaticText className="text-4xl md:text-5xl font-bold mb-4">
              REFER & EARN
            </ChromaticText>
            <p className="text-gray-500 tracking-wider">
              <DecryptText text="GROW THE COLLECTIVE. EARN REPUTATION." delay={0.5} />
            </p>
          </motion.div>

          {/* Referral Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 p-6 border border-blue-500/30 bg-blue-500/5 rounded-lg"
          >
            <p className="text-gray-500 text-sm tracking-wider mb-3">YOUR REFERRAL CODE</p>
            
            {codeLoading ? (
              <div className="animate-pulse h-12 bg-blue-500/10 rounded" />
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <code className="flex-1 text-2xl md:text-3xl font-mono font-bold text-blue-400 bg-black/30 px-4 py-3 rounded border border-blue-500/20">
                    {codeData?.code || '---'}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6 text-blue-400" />}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                    COPY LINK
                  </button>
                  <button
                    onClick={shareReferral}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    SHARE
                  </button>
                </div>
              </>
            )}
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="p-4 border border-blue-500/20 rounded-lg text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              <p className="text-xs text-gray-500 tracking-wider">REFERRED</p>
            </div>
            <div className="p-4 border border-blue-500/20 rounded-lg text-center">
              <UserPlus className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats?.joined || 0}</p>
              <p className="text-xs text-gray-500 tracking-wider">JOINED</p>
            </div>
            <div className="p-4 border border-blue-500/20 rounded-lg text-center">
              <Award className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats?.marked || 0}</p>
              <p className="text-xs text-gray-500 tracking-wider">MARKED</p>
            </div>
            <div className="p-4 border border-blue-500/20 rounded-lg text-center">
              <Gift className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats?.pointsEarned || 0}</p>
              <p className="text-xs text-gray-500 tracking-wider">POINTS EARNED</p>
            </div>
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 p-6 border border-blue-500/20 rounded-lg"
          >
            <h3 className="text-lg font-bold text-blue-400 mb-4">HOW IT WORKS</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">1</div>
                <div>
                  <p className="text-white font-medium">Share your referral link</p>
                  <p className="text-sm text-gray-500">Send your unique link to friends who appreciate underground culture</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">2</div>
                <div>
                  <p className="text-white font-medium">They join the collective</p>
                  <p className="text-sm text-gray-500">When they sign up, you earn <span className="text-green-400">+100 points</span></p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">3</div>
                <div>
                  <p className="text-white font-medium">They complete marking</p>
                  <p className="text-sm text-gray-500">When they claim their first mark, you earn <span className="text-green-400">+200 more points</span></p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Referral History */}
          {history && history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 border border-blue-500/20 rounded-lg"
            >
              <h3 className="text-lg font-bold text-blue-400 mb-4">REFERRAL HISTORY</h3>
              <div className="space-y-3">
                {history.map((ref, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-blue-500/10 last:border-0">
                    <div>
                      <span className={`text-sm px-2 py-0.5 rounded ${
                        ref.status === 'marked' ? 'bg-green-500/20 text-green-400' :
                        ref.status === 'joined' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {ref.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </p>
                      {ref.referrerPointsAwarded > 0 && (
                        <p className="text-xs text-green-400">+{ref.referrerPointsAwarded} pts</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
