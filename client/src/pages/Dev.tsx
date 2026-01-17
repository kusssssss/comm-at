import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Play, Users, Calendar, Shield, Zap, Gift, Eye, Lock, Star, Trophy, MessageSquare, Settings, Database, Image, QrCode, UserCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Test User Switcher Component
 * Allows admins to impersonate test users for testing stratified visibility
 */
function TestUserSwitcher() {
  const [, navigate] = useLocation();
  const { data: testUsers, isLoading } = trpc.dev.getTestUsers.useQuery();
  const impersonateMutation = trpc.dev.impersonate.useMutation({
    onSuccess: (data) => {
      toast.success(`Now viewing as ${data.user.name}`);
      // Reload the page to apply new session
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const stopImpersonatingMutation = trpc.dev.stopImpersonating.useMutation({
    onSuccess: () => {
      toast.success('Session ended. Please log in again.');
      window.location.href = '/';
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'marked_initiate': return 'bg-blue-500/20 text-blue-400';
      case 'marked_member': return 'bg-blue-500/20 text-blue-400';
      case 'marked_inner_circle': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'marked_initiate': return 'Initiate';
      case 'marked_member': return 'Member';
      case 'marked_inner_circle': return 'Inner Circle';
      default: return role;
    }
  };

  return (
    <section className="mb-12">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <UserCircle className="w-5 h-5 text-[#9333EA]" />
        Test User Impersonation
      </h2>
      <div className="bg-[#111111] border border-[#9333EA]/30 rounded-lg p-6">
        <p className="text-sm text-[#666666] mb-4">
          Switch to a test user to experience the app from different tier perspectives. 
          This is useful for testing Stratified Reality visibility.
        </p>
        
        {isLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="w-5 h-5 animate-spin text-[#9333EA] mx-auto" />
          </div>
        ) : testUsers && testUsers.length > 0 ? (
          <div className="grid gap-3">
            {testUsers.map((testUser) => (
              <div 
                key={testUser.id} 
                className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#222222]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#9333EA]/20 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-[#9333EA]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{testUser.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(testUser.role || '')}`}>
                        {getRoleLabel(testUser.role || '')}
                      </span>
                      <span className="text-xs text-[#666666]">{testUser.callSign}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => impersonateMutation.mutate({ userId: testUser.id })}
                  disabled={impersonateMutation.isPending}
                  className="bg-[#9333EA] hover:bg-[#7e22ce] text-white"
                >
                  {impersonateMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    'View As'
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#666666] text-center py-4">
            No test users found. Create test users in the database first.
          </p>
        )}
        
        <div className="mt-4 pt-4 border-t border-[#222222]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => stopImpersonatingMutation.mutate()}
            className="border-[#333333] text-[#999999] hover:text-white hover:border-[#9333EA]"
          >
            End Session & Return to Login
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * Development & Demo Page
 * Comprehensive feature showcase for client demonstrations
 */
export default function Dev() {
  const { user, isAuthenticated } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Test activation codes for demo
  const testCodes = [
    { serial: 'NBC-001', drop: 'Noodle Bowl Chain', code: 'DEMO-NBC-2024' },
    { serial: 'VJ-001', drop: 'Varsity Jacket', code: 'DEMO-VJ-2024' },
  ];

  const featureCategories = [
    {
      category: "🏠 Core Experience",
      icon: Zap,
      color: "#9333EA",
      description: "The main user journey and landing experience",
      features: [
        { 
          path: "/", 
          label: "Homepage / Landing", 
          description: "Hero section, manifesto, tier system, and call-to-action",
          demoPoints: ["Glitch text effects", "Tier progression display", "Live member count", "Sponsor showcase"]
        },
        { 
          path: "/marks", 
          label: "MARKS (Products)", 
          description: "Browse limited edition drops with stratified visibility",
          demoPoints: ["Edition tracking", "Price display", "Clearance requirements", "Image gallery"]
        },
        { 
          path: "/gatherings", 
          label: "GATHERINGS (Events)", 
          description: "Secret events with location reveal system",
          demoPoints: ["Hidden location until reveal time", "RSVP system", "Capacity tracking", "Pass generation"]
        },
      ]
    },
    {
      category: "🔐 Authentication & Access",
      icon: Lock,
      color: "#22c55e",
      description: "Member verification and tiered access control",
      features: [
        { 
          path: "/verify", 
          label: "Mark Verification", 
          description: "Verify authenticity of physical products via serial number",
          demoPoints: ["Serial number lookup", "Activation code entry", "Ownership transfer", "Fraud detection"]
        },
        { 
          path: "/apply", 
          label: "Apply for Clearance", 
          description: "New member application with vouch system",
          demoPoints: ["Application form", "Vouch by existing member", "Admin approval flow", "48hr expiry window"]
        },
      ]
    },
    {
      category: "👥 Member Features",
      icon: Users,
      color: "#3b82f6",
      description: "Features exclusive to marked members",
      features: [
        { 
          path: "/inside", 
          label: "Inside Feed", 
          description: "Member-only activity feed and announcements",
          demoPoints: ["Real-time activity", "Doctrine cards", "Member interactions", "Event announcements"]
        },
        { 
          path: "/profile", 
          label: "Member Profile", 
          description: "Personal dashboard with marks and reputation",
          demoPoints: ["Mark collection", "Tier progress", "Event history", "Reputation score"]
        },
        { 
          path: "/ranks", 
          label: "Leaderboard / Ranks", 
          description: "Community rankings by reputation and activity",
          demoPoints: ["Top members", "Chapter rankings", "Activity streaks", "Achievement badges"]
        },
        { 
          path: "/referral", 
          label: "Referral System", 
          description: "Invite friends and earn reputation",
          demoPoints: ["Unique referral codes", "Invite tracking", "Reputation rewards", "Tier bonuses"]
        },
      ]
    },
    {
      category: "🎫 Event System",
      icon: Calendar,
      color: "#f59e0b",
      description: "Complete event management and attendance",
      features: [
        { 
          path: "/gatherings", 
          label: "Event Discovery", 
          description: "Browse upcoming secret gatherings",
          demoPoints: ["Upcoming events", "Past events archive", "Eligibility check", "RSVP status"]
        },
        { 
          path: "/staff", 
          label: "Staff Check-in Portal", 
          description: "QR scanning for event door control",
          demoPoints: ["QR code scanner", "Pass validation", "Check-in logging", "Capacity tracking"]
        },
      ]
    },
    {
      category: "🤝 Partners & Sponsors",
      icon: Star,
      color: "#ec4899",
      description: "Sponsor integration and partnership features",
      features: [
        { 
          path: "/partners", 
          label: "Partners Page", 
          description: "Sponsor showcase with tier-based visibility",
          demoPoints: ["Platinum/Gold/Silver tiers", "Banner display", "Analytics tracking", "Inquiry form"]
        },
        { 
          path: "/sponsors/analytics", 
          label: "Sponsor Analytics", 
          description: "Dashboard for sponsor performance metrics",
          demoPoints: ["Impression tracking", "Click-through rates", "Event sponsorship", "ROI metrics"]
        },
      ]
    },
    {
      category: "⚙️ Administration",
      icon: Settings,
      color: "#6366f1",
      description: "Backend management and content control",
      features: [
        { 
          path: "/admin", 
          label: "Admin Dashboard", 
          description: "Full administrative control panel",
          demoPoints: ["User management", "Drop creation", "Event management", "Analytics overview"]
        },
        { 
          path: "/admin?tab=drops", 
          label: "Manage Marks/Drops", 
          description: "Create and edit product drops",
          demoPoints: ["Create new drops", "Set pricing", "Upload images", "Generate artifacts"]
        },
        { 
          path: "/admin?tab=events", 
          label: "Manage Gatherings", 
          description: "Create and manage events",
          demoPoints: ["Event creation", "Location management", "Capacity settings", "Pass tracking"]
        },
        { 
          path: "/admin?tab=users", 
          label: "User Management", 
          description: "Manage member accounts and roles",
          demoPoints: ["Role assignment", "Tier adjustment", "Account suspension", "Activity logs"]
        },
        { 
          path: "/admin?tab=sponsors", 
          label: "Sponsor Management", 
          description: "Manage sponsor partnerships",
          demoPoints: ["Add sponsors", "Set tiers", "Upload banners", "Track performance"]
        },
        { 
          path: "/admin?tab=doctrine", 
          label: "Doctrine Cards", 
          description: "Manage manifesto and announcement cards",
          demoPoints: ["Create cards", "Set visibility", "Schedule posts", "Archive content"]
        },
        { 
          path: "/admin?tab=logs", 
          label: "Audit Logs", 
          description: "System activity and security logs",
          demoPoints: ["User actions", "Admin changes", "Security events", "Error tracking"]
        },
      ]
    },
  ];

  const systemFeatures = [
    {
      title: "Stratified Reality",
      icon: Eye,
      description: "Content visibility based on member tier - outside users see blurred/hidden content, members see full details",
      status: "active"
    },
    {
      title: "Tiered Membership",
      icon: Trophy,
      description: "4-tier system: Outside → Initiate → Member → Inner Circle with progressive access",
      status: "active"
    },
    {
      title: "Mark Verification",
      icon: QrCode,
      description: "Physical product authentication via serial number and activation code",
      status: "active"
    },
    {
      title: "Reputation System",
      icon: Star,
      description: "Earn points through events, referrals, and engagement to advance tiers",
      status: "active"
    },
    {
      title: "Location Reveal",
      icon: Lock,
      description: "Event locations hidden until X hours before, then revealed to RSVP holders",
      status: "active"
    },
    {
      title: "Sponsor Integration",
      icon: Gift,
      description: "Platinum/Gold/Silver sponsor tiers with analytics and event sponsorship",
      status: "active"
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#222222]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="text-2xl font-bold text-[#9333EA]">@</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">COMM@ Demo Console</h1>
              <p className="text-xs text-[#666666]">Feature showcase for client demonstrations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && user && (
              <div className="text-right">
                <p className="text-sm text-white">{user.name || user.email}</p>
                <p className="text-xs text-[#9333EA]">{user.role?.toUpperCase()}</p>
              </div>
            )}
            <Link href="/">
              <Button variant="outline" size="sm" className="border-[#333333] text-[#999999] hover:text-white hover:border-[#9333EA]">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Site
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* System Overview */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#9333EA]" />
            System Features Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemFeatures.map((feature) => (
              <div key={feature.title} className="bg-[#111111] border border-[#222222] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#9333EA]/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[#9333EA]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-xs text-[#666666] leading-relaxed">{feature.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
                  <span className="text-xs text-[#22c55e]">Active</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Test User Impersonation */}
        {isAuthenticated && user?.role === 'admin' && (
          <TestUserSwitcher />
        )}

        {/* Test Activation Codes */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#9333EA]" />
            Test Activation Codes
          </h2>
          <div className="bg-[#111111] border border-[#9333EA]/30 rounded-lg p-6">
            <p className="text-sm text-[#666666] mb-4">Use these codes to test the mark verification flow:</p>
            <div className="grid gap-3">
              {testCodes.map((item) => (
                <div key={item.serial} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#222222]">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[#9333EA] text-sm">{item.serial}</span>
                    <span className="text-[#444444]">—</span>
                    <span className="text-[#cccccc] text-sm">{item.drop}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="font-mono text-xs text-[#666666] bg-[#1a1a1a] px-3 py-1.5 rounded">{item.code}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.code)}
                      className="h-8 w-8 p-0 hover:bg-[#9333EA]/10"
                    >
                      {copiedCode === item.code ? (
                        <Check className="h-4 w-4 text-[#22c55e]" />
                      ) : (
                        <Copy className="h-4 w-4 text-[#666666]" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Categories */}
        <section className="space-y-8">
          {featureCategories.map((category) => (
            <div key={category.category} className="bg-[#111111] border border-[#222222] rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222222] flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <category.icon className="w-5 h-5" style={{ color: category.color }} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{category.category}</h2>
                  <p className="text-xs text-[#666666]">{category.description}</p>
                </div>
              </div>
              
              <div className="divide-y divide-[#1a1a1a]">
                {category.features.map((feature) => (
                  <div key={feature.path} className="p-4 hover:bg-[#0a0a0a] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link href={feature.path}>
                            <span className="text-sm font-bold text-white hover:text-[#9333EA] transition-colors cursor-pointer">
                              {feature.label}
                            </span>
                          </Link>
                          <code className="text-xs text-[#444444] font-mono">{feature.path}</code>
                        </div>
                        <p className="text-xs text-[#666666] mb-3">{feature.description}</p>
                        {feature.demoPoints && (
                          <div className="flex flex-wrap gap-2">
                            {feature.demoPoints.map((point, idx) => (
                              <span 
                                key={idx}
                                className="text-[10px] px-2 py-1 bg-[#1a1a1a] text-[#888888] rounded"
                              >
                                {point}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Link href={feature.path}>
                        <Button 
                          size="sm" 
                          className="bg-[#9333EA] hover:bg-[#7e22ce] text-white flex-shrink-0"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Demo
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Quick Stats */}
        <section className="mt-12 mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#9333EA]" />
            Database Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-[#9333EA]">28</p>
              <p className="text-xs text-[#666666]">Tables</p>
            </div>
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-[#22c55e]">2</p>
              <p className="text-xs text-[#666666]">Sample Marks</p>
            </div>
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-[#f59e0b]">2</p>
              <p className="text-xs text-[#666666]">Sample Gatherings</p>
            </div>
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-[#3b82f6]">1</p>
              <p className="text-xs text-[#666666]">Admin User</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-[#222222] text-center">
          <p className="text-xs text-[#444444]">
            COMM@ Demo Console • Built for client demonstrations
          </p>
          <Link href="/">
            <span className="text-xs text-[#9333EA] hover:text-[#a855f7] transition-colors cursor-pointer">
              ← Return to Homepage
            </span>
          </Link>
        </footer>
      </main>
    </div>
  );
}
