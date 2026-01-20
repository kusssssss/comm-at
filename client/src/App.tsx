import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ScanLines } from "@/components/Effects2200";
import { FloatingParticles } from "@/components/effects/FloatingParticles";

// Public pages
import Home from "./pages/Home";
import Verify from "./pages/Verify";
import Mark from "./pages/Mark";
import DropDetail from "./pages/DropDetail";
import Drops from "./pages/Drops";
import Apply from "./pages/Apply";
import Acquire from "./pages/Acquire";
import Sponsors from "./pages/Sponsors";
import SponsorAnalytics from "./pages/SponsorAnalytics";

// Protected pages (marked users)
import Inside from "./pages/Inside";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Archive from "./pages/Archive";
import Leaderboard from "./pages/Leaderboard";
import Referral from "./pages/Referral";

// Staff pages
import Staff from "./pages/Staff";

// Admin pages
import Admin from "./pages/Admin";

// Dev tools
import Dev from "./pages/Dev";
import HomeTest from "./pages/HomeTest";

// Auth pages
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/test" component={HomeTest} />
      <Route path="/verify" component={Verify} />
      <Route path="/verify/:serial" component={Verify} />
      <Route path="/artifact/:serial" component={Verify} />
      <Route path="/mark/:serial" component={Mark} />
      <Route path="/drops" component={Drops} />
      <Route path="/marks" component={Drops} />
      <Route path="/drop/:id" component={DropDetail} />
      <Route path="/sponsors" component={Sponsors} />
      <Route path="/admin/sponsor/:sponsorId/analytics" component={SponsorAnalytics} />
      <Route path="/apply" component={Apply} />
      <Route path="/acquire/:dropId" component={Acquire} />
      <Route path="/login" component={Login} />
      
      {/* Protected routes (marked users) */}
      <Route path="/inside" component={Inside} />
      <Route path="/profile" component={Profile} />
      <Route path="/events" component={Events} />
      <Route path="/gatherings" component={Events} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/gatherings/:id" component={EventDetail} />
      <Route path="/archive" component={Archive} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/ranks" component={Leaderboard} />
      <Route path="/referral" component={Referral} />
      <Route path="/refer" component={Referral} />
      
      {/* Staff routes */}
      <Route path="/staff" component={Staff} />
      
      {/* Admin routes */}
      <Route path="/admin" component={Admin} />
      <Route path="/admin/:section" component={Admin} />
      
      {/* Dev tools */}
      <Route path="/dev" component={Dev} />
      
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Page transition wrapper
function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, filter: 'brightness(2)' }}
        animate={{ opacity: 1, filter: 'brightness(1)' }}
        exit={{ opacity: 0, filter: 'brightness(0.5)' }}
        transition={{ duration: 0.3, ease: [0.76, 0, 0.24, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          {/* Floating blue particles background */}
          <FloatingParticles particleCount={40} />
          {/* 2200 Scan lines overlay */}
          <ScanLines />
          {/* Grain overlay for noir aesthetic */}
          <div className="grain fixed inset-0 pointer-events-none z-[9999] opacity-[0.03]" aria-hidden="true" />
          <PageTransition>
            <Router />
          </PageTransition>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
