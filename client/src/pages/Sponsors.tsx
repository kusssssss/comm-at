import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Check, 
  Star, 
  Users, 
  TrendingUp, 
  Zap,
  Crown,
  Medal,
  Award,
  Trophy
} from "lucide-react";
import { toast } from "sonner";

const TIER_BENEFITS = {
  platinum: {
    name: "Platinum",
    icon: Crown,
    color: "text-zinc-200",
    bgColor: "bg-gradient-to-br from-zinc-300/20 to-zinc-400/10",
    borderColor: "border-zinc-300/30",
    price: "Custom",
    benefits: [
      "Logo on all event pages",
      "Logo on homepage (premium placement)",
      "Exclusive drop sponsorship",
      "VIP access to all events",
      "Custom branded experiences",
      "Dedicated account manager",
      "Monthly analytics reports",
      "Social media features",
    ],
  },
  gold: {
    name: "Gold",
    icon: Trophy,
    color: "text-yellow-400",
    bgColor: "bg-gradient-to-br from-yellow-500/20 to-amber-500/10",
    borderColor: "border-yellow-500/30",
    price: "Contact Us",
    benefits: [
      "Logo on homepage",
      "Logo on event pages",
      "Event sponsorship options",
      "Priority event access",
      "Quarterly analytics reports",
      "Social media mentions",
    ],
  },
  silver: {
    name: "Silver",
    icon: Medal,
    color: "text-gray-300",
    bgColor: "bg-gradient-to-br from-gray-400/20 to-gray-500/10",
    borderColor: "border-gray-400/30",
    price: "Contact Us",
    benefits: [
      "Logo on sponsors page",
      "Logo on select events",
      "Event ticket packages",
      "Bi-annual analytics reports",
    ],
  },
  bronze: {
    name: "Broke",
    icon: Award,
    color: "text-orange-400",
    bgColor: "bg-gradient-to-br from-orange-700/20 to-orange-800/10",
    borderColor: "border-orange-700/30",
    price: "Contact Us",
    benefits: [
      "Logo on sponsors page",
      "Brand recognition",
      "Community access",
    ],
  },
};

const STATS = [
  { label: "Active Members", value: "500+", icon: Users },
  { label: "Events Per Year", value: "50+", icon: Star },
  { label: "Engagement Rate", value: "85%", icon: TrendingUp },
  { label: "Brand Activations", value: "100+", icon: Zap },
];

function TierCard({ tier }: { tier: keyof typeof TIER_BENEFITS }) {
  const config = TIER_BENEFITS[tier];
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`
        ${config.bgColor} ${config.borderColor}
        border rounded-xl p-6
        hover:shadow-lg transition-all duration-300
      `}
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-6 h-6 ${config.color}`} />
        <h3 className={`text-xl font-bold ${config.color}`}>{config.name}</h3>
      </div>
      
      <p className="text-2xl font-bold text-white mb-6">{config.price}</p>
      
      <ul className="space-y-3">
        {config.benefits.map((benefit, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
            <Check className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function InquiryForm() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    sponsorTier: "" as "" | "platinum" | "gold" | "silver" | "bronze",
    message: "",
  });
  
  const inquiryMutation = trpc.sponsor.inquiry.useMutation({
    onSuccess: () => {
      toast.success("Inquiry Submitted", {
        description: "We'll be in touch within 48 hours.",
      });
      setFormData({
        companyName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        sponsorTier: "",
        message: "",
      });
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to submit inquiry",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.contactName || !formData.contactEmail) {
      toast.error("Missing Information", {
        description: "Please fill in all required fields",
      });
      return;
    }
    
    inquiryMutation.mutate({
      ...formData,
      sponsorTier: formData.sponsorTier || undefined,
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Company Name *</label>
          <Input
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="Your Company"
            className="bg-zinc-900 border-zinc-700"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Contact Name *</label>
          <Input
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            placeholder="John Doe"
            className="bg-zinc-900 border-zinc-700"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Email *</label>
          <Input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            placeholder="john@company.com"
            className="bg-zinc-900 border-zinc-700"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Phone</label>
          <Input
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            placeholder="+62 xxx xxxx xxxx"
            className="bg-zinc-900 border-zinc-700"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm text-gray-400 mb-2">Interested Tier</label>
        <Select
          value={formData.sponsorTier}
          onValueChange={(value) => setFormData({ ...formData, sponsorTier: value as typeof formData.sponsorTier })}
        >
          <SelectTrigger className="bg-zinc-900 border-zinc-700">
            <SelectValue placeholder="Select a tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="platinum">Platinum</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="bronze">Broke</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm text-gray-400 mb-2">Message</label>
        <Textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us about your brand and partnership goals..."
          rows={4}
          className="bg-zinc-900 border-zinc-700"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={inquiryMutation.isPending}
      >
        {inquiryMutation.isPending ? "Submitting..." : "Submit Inquiry"}
      </Button>
    </form>
  );
}

export default function Sponsors() {
  const { data: sponsors } = trpc.sponsor.list.useQuery();
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border/30">
        <nav className="flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="text-mono text-sm tracking-[0.3em] text-foreground/80 hover:text-foreground transition-colors">
            COMM@
          </Link>
          <span className="text-xs text-muted-foreground tracking-wider">PARTNERS</span>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs text-blue-400 tracking-[0.3em] uppercase mb-4">Partnership Opportunities</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Partner With COMM@
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Connect your brand with Jakarta's most engaged creative community. 
                From exclusive events to digital drops, we create authentic experiences 
                that resonate with our members.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 px-6 bg-zinc-900/50">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center"
                  >
                    <Icon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Sponsorship Tiers */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-white mb-4">Partnership Tiers</h2>
              <p className="text-gray-400">Choose the level that fits your brand goals</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(Object.keys(TIER_BENEFITS) as Array<keyof typeof TIER_BENEFITS>).map((tier) => (
                <TierCard key={tier} tier={tier} />
              ))}
            </div>
          </div>
        </section>

        {/* Current Partners */}
        {sponsors && sponsors.length > 0 && (
          <section className="py-16 px-6 bg-zinc-900/50">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Current Partners</h2>
                <p className="text-gray-400">Brands that trust COMM@</p>
              </motion.div>
              
              <div className="flex flex-wrap justify-center items-center gap-8">
                {sponsors.map((sponsor) => (
                  <motion.a
                    key={sponsor.id}
                    href={sponsor.websiteUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05 }}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                  >
                    {sponsor.logoUrl ? (
                      <img 
                        src={sponsor.logoUrl} 
                        alt={sponsor.name}
                        className="h-12 object-contain"
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-400">{sponsor.name}</span>
                    )}
                  </motion.a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Inquiry Form */}
        <section className="py-20 px-6">
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-white mb-4">Get In Touch</h2>
              <p className="text-gray-400">
                Ready to partner with us? Fill out the form below and our team 
                will reach out within 48 hours.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8"
            >
              <InquiryForm />
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
