import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Percent,
  ArrowLeft,
  Calendar,
  Globe,
  BarChart3
} from "lucide-react";

export default function SponsorAnalytics() {
  const { sponsorId } = useParams<{ sponsorId: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [days, setDays] = useState(30);
  
  const isAdmin = user?.role === "admin";
  const id = parseInt(sponsorId || "0");
  
  const { data: sponsor } = trpc.sponsor.bySlug.useQuery(
    { slug: sponsorId || "" },
    { enabled: isNaN(id) && !!sponsorId }
  );
  
  const { data: analytics, isLoading } = trpc.sponsor.analytics.useQuery(
    { sponsorId: id || sponsor?.id || 0, days },
    { enabled: (!!id || !!sponsor?.id) && isAdmin }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="card-noir p-8 text-center max-w-md">
          <h2 className="text-headline mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Admin access required.</p>
          <a href={getLoginUrl()} className="btn-noir-primary inline-block">Sign In</a>
        </div>
      </div>
    );
  }

  const sponsorData = sponsor;
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border/30 sticky top-0 bg-background/95 backdrop-blur-sm z-40">
        <nav className="flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/admin/sponsors" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Sponsors</span>
          </Link>
          <span className="text-xs text-[#3B82F6] tracking-wider">ANALYTICS</span>
        </nav>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Sponsor Header */}
          {sponsorData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 mb-8"
            >
              {sponsorData.logoUrl ? (
                <img 
                  src={sponsorData.logoUrl} 
                  alt={sponsorData.name}
                  className="w-16 h-16 object-contain bg-zinc-900 rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-zinc-900 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-500">
                  {sponsorData.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{sponsorData.name}</h1>
                <p className="text-muted-foreground capitalize">{sponsorData.tier} Partner</p>
              </div>
            </motion.div>
          )}
          
          {/* Time Range Selector */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-medium text-white">Performance Overview</h2>
            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : analytics ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="card-noir p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Impressions</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.impressions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total views of your brand</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card-noir p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <MousePointer className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Clicks</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.clicks.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Visits to your website</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="card-noir p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Percent className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Click-Through Rate</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.ctr.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Engagement rate</p>
                </motion.div>
              </div>
              
              {/* Breakdown by Page */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card-noir p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-medium text-white">Performance by Page</h3>
                </div>
                
                {analytics.byPage.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available for this period
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/30">
                          <th className="text-left py-3 px-4 text-sm text-muted-foreground font-medium">Page</th>
                          <th className="text-right py-3 px-4 text-sm text-muted-foreground font-medium">Impressions</th>
                          <th className="text-right py-3 px-4 text-sm text-muted-foreground font-medium">Clicks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Group by page type */}
                        {['homepage', 'event', 'drop', 'sponsors'].map(pageType => {
                          const impressions = analytics.byPage.find(
                            (b: any) => b.pageType === pageType && b.eventType === 'impression'
                          )?.count || 0;
                          const clicks = analytics.byPage.find(
                            (b: any) => b.pageType === pageType && b.eventType === 'click'
                          )?.count || 0;
                          
                          if (impressions === 0 && clicks === 0) return null;
                          
                          return (
                            <tr key={pageType} className="border-b border-border/10">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-muted-foreground" />
                                  <span className="capitalize">{pageType}</span>
                                </div>
                              </td>
                              <td className="text-right py-3 px-4 text-white">{impressions.toLocaleString()}</td>
                              <td className="text-right py-3 px-4 text-white">{clicks.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
              
              {/* ROI Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card-noir p-6 mt-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-medium text-white">ROI Insights</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Estimated Reach Value</p>
                    <p className="text-2xl font-bold text-white">
                      ${((analytics.impressions * 0.005) + (analytics.clicks * 0.50)).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on industry CPM ($5) and CPC ($0.50) benchmarks
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Engagement Quality</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.ctr > 2 ? 'Excellent' : analytics.ctr > 1 ? 'Good' : analytics.ctr > 0.5 ? 'Average' : 'Building'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Industry average CTR is 0.5-2%
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            <div className="card-noir p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">No analytics data available</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
