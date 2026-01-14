import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

/**
 * Development Navigation Page
 * Quick access to all routes in the application for testing purposes
 */
export default function Dev() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Going Noodles test data
  const testCodes = [
    { serial: 'GN001-001', drop: 'MSG Vol. 1 Sukajan', code: 'F5B5945C1A690C0D' },
    { serial: 'GN002-001', drop: 'Ca$hmere Chain Longsleeve', code: 'F73B875A043E81D7' },
    { serial: 'GN003-001', drop: 'Team Tomodachi Bomber', code: '86CD95C4BD285B5F' },
    { serial: 'GN004-001', drop: 'Good Girl Cropped Hoodie', code: '59EB3B403E137ED7' },
    { serial: 'GN005-001', drop: 'BOMBAE Varsity Jacket', code: '48E4678E76CFFB4C' },
    { serial: 'GN006-001', drop: 'Noodle Bowl Chain', code: '2C3A3C6D1F1E04D0' },
  ];

  const routes = [
    {
      category: "Public Pages",
      items: [
        { path: "/", label: "Home / Landing Page", description: "Main landing page with manifesto" },
        { path: "/artifact/GN001-001", label: "Verify: MSG Vol. 1 Sukajan #001", description: "Going Noodles artifact" },
        { path: "/artifact/GN002-001", label: "Verify: Ca$hmere Chain #001", description: "Going Noodles artifact" },
        { path: "/artifact/GN003-001", label: "Verify: Team Tomodachi Bomber #001", description: "Going Noodles artifact" },
      ]
    },
    {
      category: "Drop Pages (Going Noodles)",
      items: [
        { path: "/drop/30043", label: "Drop: MSG Vol. 1 Sukajan", description: "30 edition sukajan jacket" },
        { path: "/drop/30044", label: "Drop: Ca$hmere Chain Longsleeve", description: "100 edition longsleeve" },
        { path: "/drop/30045", label: "Drop: Team Tomodachi Bomber", description: "50 edition bomber jacket" },
        { path: "/drop/30046", label: "Drop: Good Girl Cropped Hoodie", description: "75 edition cropped hoodie" },
        { path: "/drop/30047", label: "Drop: BOMBAE Varsity Jacket", description: "40 edition varsity jacket" },
        { path: "/drop/30048", label: "Drop: Noodle Bowl Chain", description: "25 edition accessory" },
      ]
    },
    {
      category: "Marking Flow",
      items: [
        { path: "/mark/GN001-001", label: "Mark: MSG Vol. 1 Sukajan #001", description: "Test marking flow" },
        { path: "/mark/GN002-001", label: "Mark: Ca$hmere Chain #001", description: "Test marking flow" },
      ]
    },
    {
      category: "Authenticated Pages (Marked Users)",
      items: [
        { path: "/inside", label: "Inside Feed", description: "Doctrine cards and event announcements" },
        { path: "/profile", label: "Profile", description: "User profile and artifacts" },
        { path: "/events", label: "Events List", description: "Browse upcoming gatherings" },
        { path: "/events/30007", label: "Event: MSG Vol. 3", description: "Might Sound Good event" },
        { path: "/events/30008", label: "Event: Noodle Sessions", description: "Studio Night event" },
        { path: "/events/30009", label: "Event: MSG Vol. 4", description: "Zodiac Takeover event" },
      ]
    },
    {
      category: "Staff Portal",
      items: [
        { path: "/staff", label: "Staff Portal", description: "QR scanning for event check-in" },
      ]
    },
    {
      category: "Admin Panel",
      items: [
        { path: "/admin", label: "Admin Dashboard", description: "Full admin panel with tabs" },
        { path: "/admin?tab=drops", label: "Admin: Drops", description: "Manage drops" },
        { path: "/admin?tab=artifacts", label: "Admin: Artifacts", description: "Manage artifacts" },
        { path: "/admin?tab=events", label: "Admin: Events", description: "Manage events" },
        { path: "/admin?tab=users", label: "Admin: Users", description: "Manage users" },
        { path: "/admin?tab=doctrine", label: "Admin: Doctrine", description: "Manage doctrine cards" },
        { path: "/admin?tab=ugc", label: "Admin: UGC", description: "Manage user-generated content" },
        { path: "/admin?tab=logs", label: "Admin: Audit Logs", description: "View audit logs" },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-noir-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-#9333EA mb-2">🛠 Dev Navigation</h1>
          <p className="text-zinc-400">Quick access to all routes in comm@ for development and testing</p>
        </div>

        {/* Test Activation Codes */}
        <div className="mb-8 p-6 bg-#9333EA/10 border border-#9333EA/30 rounded-lg">
          <h3 className="text-#A855F7 font-semibold mb-4 text-lg">🔑 Test Activation Codes (Going Noodles)</h3>
          <div className="grid gap-2">
            {testCodes.map((item) => (
              <div key={item.serial} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                <div>
                  <span className="font-mono text-#A855F7">{item.serial}</span>
                  <span className="text-zinc-500 mx-2">—</span>
                  <span className="text-zinc-300">{item.drop}</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm text-zinc-400 bg-zinc-800 px-2 py-1 rounded">{item.code}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(item.code)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedCode === item.code ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-zinc-400" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {routes.map((section) => (
            <div key={section.category} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-#A855F7 mb-4 uppercase tracking-wider">
                {section.category}
              </h2>
              <div className="grid gap-3">
                {section.items.map((route) => (
                  <Link key={route.path} href={route.path}>
                    <div className="flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer group">
                      <div>
                        <div className="font-medium text-white group-hover:text-#A855F7 transition-colors">
                          {route.label}
                        </div>
                        <div className="text-sm text-zinc-500">{route.description}</div>
                      </div>
                      <div className="text-zinc-600 font-mono text-sm">
                        {route.path}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <h3 className="text-#A855F7 font-semibold mb-2">Going Noodles Sample Data</h3>
          <ul className="text-sm text-zinc-400 space-y-1">
            <li>• <strong>6 Drops</strong> — MSG Vol. 1 Sukajan, Ca$hmere Chain, Team Tomodachi Bomber, Good Girl Hoodie, BOMBAE Varsity, Noodle Bowl Chain</li>
            <li>• <strong>320 Artifacts</strong> — Various sizes (S, M, L, XL, OS) with 70% unmarked, 20% marked, 10% flagged</li>
            <li>• <strong>3 Events</strong> — MSG Vol. 3, Noodle Sessions: Studio Night, MSG Vol. 4: Zodiac Takeover</li>
            <li>• <strong>10 UGC entries</strong> — Scene proof photos linked to drops</li>
            <li>• <strong>4 Doctrine Cards</strong> — Going Noodles manifesto content</li>
          </ul>
        </div>

        <div className="mt-4 text-center text-zinc-600 text-sm">
          <Link href="/" className="hover:text-#A855F7 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
