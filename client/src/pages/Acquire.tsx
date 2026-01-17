import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Check, Clock, Lock, ShoppingBag } from "lucide-react";

type Phase = "loading" | "auth" | "clearance" | "form" | "confirm" | "processing" | "success" | "error";

export default function Acquire() {
  const { dropId } = useParams<{ dropId: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [phase, setPhase] = useState<Phase>("loading");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Fetch drop details
  const { data: drops } = trpc.drop.list.useQuery();
  const drop = drops?.find(d => d.id === parseInt(dropId || "0"));

  // Acquire mutation
  const acquireMutation = trpc.mark.acquire.useMutation({
    onSuccess: () => {
      setPhase("success");
    },
    onError: (err: { message: string }) => {
      setError(err.message);
      setPhase("error");
    },
  });

  // Determine phase based on auth and clearance state
  useState(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      setPhase("auth");
      return;
    }
    
    // Check clearance state
    if (user?.clearanceState !== "granted") {
      setPhase("clearance");
      return;
    }
    
    // Check if clearance expired
    if (user?.clearanceExpiresAt && new Date(user.clearanceExpiresAt) < new Date()) {
      setPhase("clearance");
      return;
    }
    
    setPhase("form");
  });

  // Check sale window
  const now = new Date();
  const saleWindowOpen = drop?.saleWindowStart && drop?.saleWindowEnd 
    ? new Date(drop.saleWindowStart) <= now && now <= new Date(drop.saleWindowEnd)
    : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) return;
    setPhase("confirm");
  };

  const executeAcquisition = () => {
    if (!drop) return;
    setPhase("processing");
    acquireMutation.mutate({
      dropId: drop.id,
      size: selectedSize || undefined,
      shippingAddress: `${shippingInfo.fullName}\n${shippingInfo.address}\n${shippingInfo.city} ${shippingInfo.postalCode}\n${shippingInfo.phone}`,
    });
  };

  // Calculate time remaining for clearance
  const clearanceTimeRemaining = user?.clearanceExpiresAt 
    ? Math.max(0, new Date(user.clearanceExpiresAt).getTime() - Date.now())
    : 0;
  const hoursRemaining = Math.floor(clearanceTimeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((clearanceTimeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="grain" />
      <Nav showBack backHref={`/drops`} backLabel="DROPS" />

      <main className="min-h-screen flex items-center justify-center px-6 pt-20 pb-12">
        <AnimatePresence mode="wait">
          {/* LOADING */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border border-[#3B82F6] border-t-transparent rounded-full mx-auto"
              />
            </motion.div>
          )}

          {/* AUTH REQUIRED */}
          {phase === "auth" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md text-center"
            >
              <Lock className="w-12 h-12 text-[#3B82F6] mx-auto mb-6" />
              <h1 className="text-2xl font-light mb-4">Sign In Required</h1>
              <p className="text-[#666666] mb-8">
                You must be signed in to acquire a Mark.
              </p>
              <a href={getLoginUrl()} className="btn-mark inline-block">
                SIGN IN
              </a>
            </motion.div>
          )}

          {/* CLEARANCE REQUIRED */}
          {phase === "clearance" && (
            <motion.div
              key="clearance"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md text-center"
            >
              <AlertCircle className="w-12 h-12 text-#3B82F6 mx-auto mb-6" />
              <h1 className="text-2xl font-light mb-4">Clearance Required</h1>
              <p className="text-[#666666] mb-8">
                {user?.clearanceState === "applied" 
                  ? "Your clearance request is pending review."
                  : user?.clearanceState === "expired"
                  ? "Your clearance has expired. You may request new clearance."
                  : "You need clearance to acquire Marks during sale windows."}
              </p>
              {user?.clearanceState !== "applied" && (
                <Link href="/apply">
                  <Button className="bg-[#3B82F6] text-black hover:bg-[#60A5FA]">
                    REQUEST CLEARANCE
                  </Button>
                </Link>
              )}
            </motion.div>
          )}

          {/* ACQUISITION FORM */}
          {phase === "form" && drop && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg"
            >
              {/* Clearance timer */}
              {clearanceTimeRemaining > 0 && (
                <div className="mb-8 p-4 border border-#3B82F6/30 rounded bg-#3B82F6/10">
                  <div className="flex items-center gap-2 text-#3B82F6 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Clearance expires in {hoursRemaining}h {minutesRemaining}m</span>
                  </div>
                </div>
              )}

              {/* Sale window check */}
              {!saleWindowOpen && (
                <div className="mb-8 p-4 border border-red-500/30 rounded bg-red-500/10">
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Sale window is not currently open for this drop.</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <p className="text-micro text-[#3B82F6] tracking-[0.3em] mb-2">ACQUIRE MARK</p>
                <h1 className="text-2xl font-light">{drop.title}</h1>
                <p className="text-[#666666]">{drop.artistName}</p>
                {drop.priceIdr && (
                  <p className="text-xl text-[#3B82F6] mt-2">
                    Rp {drop.priceIdr.toLocaleString()}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Size selection if applicable */}
                {drop.availableSizes && (
                  <div>
                    <Label className="text-[#666666]">Size</Label>
                    <div className="flex gap-2 mt-2">
                      {["S", "M", "L", "XL"].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 border ${
                            selectedSize === size
                              ? "border-[#3B82F6] text-[#3B82F6]"
                              : "border-[#333333] text-[#666666] hover:border-[#666666]"
                          } transition-colors`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipping info */}
                <div className="space-y-4">
                  <h3 className="text-sm text-[#3B82F6] tracking-wider">SHIPPING INFORMATION</h3>
                  
                  <div>
                    <Label htmlFor="fullName" className="text-[#666666]">Full Name</Label>
                    <Input
                      id="fullName"
                      value={shippingInfo.fullName}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                      className="bg-transparent border-[#333333] focus:border-[#3B82F6]"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address" className="text-[#666666]">Address</Label>
                    <Input
                      id="address"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                      className="bg-transparent border-[#333333] focus:border-[#3B82F6]"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-[#666666]">City</Label>
                      <Input
                        id="city"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                        className="bg-transparent border-[#333333] focus:border-[#3B82F6]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode" className="text-[#666666]">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={shippingInfo.postalCode}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="bg-transparent border-[#333333] focus:border-[#3B82F6]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="text-[#666666]">Phone Number</Label>
                    <Input
                      id="phone"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-transparent border-[#333333] focus:border-[#3B82F6]"
                      required
                    />
                  </div>
                </div>

                {/* Terms acceptance */}
                <div className="flex items-start gap-3 p-4 border border-[#222222] rounded">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-[#888888] cursor-pointer">
                    I understand that acquiring a Mark grants access to the collective. 
                    I agree to The Code and accept responsibility for protecting the culture.
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={!acceptedTerms || !saleWindowOpen}
                  className="w-full bg-[#3B82F6] text-black hover:bg-[#60A5FA] disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  CONTINUE TO PAYMENT
                </Button>
              </form>
            </motion.div>
          )}

          {/* CONFIRM */}
          {phase === "confirm" && drop && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md text-center"
            >
              <h2 className="text-2xl font-light mb-6">Confirm Acquisition</h2>
              
              <div className="p-6 border border-[#222222] rounded mb-6 text-left">
                <p className="text-[#666666] text-sm mb-2">Mark</p>
                <p className="text-lg mb-4">{drop.title}</p>
                
                {selectedSize && (
                  <>
                    <p className="text-[#666666] text-sm mb-2">Size</p>
                    <p className="mb-4">{selectedSize}</p>
                  </>
                )}
                
                <p className="text-[#666666] text-sm mb-2">Ship To</p>
                <p className="text-sm whitespace-pre-line">
                  {shippingInfo.fullName}<br />
                  {shippingInfo.address}<br />
                  {shippingInfo.city} {shippingInfo.postalCode}<br />
                  {shippingInfo.phone}
                </p>
                
                {drop.priceIdr && (
                  <>
                    <div className="border-t border-[#222222] my-4" />
                    <div className="flex justify-between">
                      <span className="text-[#666666]">Total</span>
                      <span className="text-[#3B82F6] text-xl">
                        Rp {drop.priceIdr.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              <p className="text-sm text-[#666666] mb-6">
                Payment integration coming soon. For now, your acquisition will be recorded 
                and you'll receive instructions for completing payment.
              </p>
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setPhase("form")}
                  className="flex-1 border-[#333333]"
                >
                  BACK
                </Button>
                <Button
                  onClick={executeAcquisition}
                  className="flex-1 bg-[#3B82F6] text-black hover:bg-[#60A5FA]"
                >
                  CONFIRM
                </Button>
              </div>
            </motion.div>
          )}

          {/* PROCESSING */}
          {phase === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-2 border-[#3B82F6] border-t-transparent rounded-full mx-auto mb-6"
              />
              <p className="text-[#666666]">Processing your acquisition...</p>
            </motion.div>
          )}

          {/* SUCCESS */}
          {phase === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#3B82F6]/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-[#3B82F6]" />
              </div>
              <h2 className="text-2xl font-light mb-4">Mark Reserved</h2>
              <p className="text-[#666666] mb-8">
                Your Mark has been reserved. You'll receive an email with payment 
                instructions and your unique serial number once confirmed.
              </p>
              <div className="space-y-4">
                <Link href="/inside">
                  <Button className="w-full bg-[#3B82F6] text-black hover:bg-[#60A5FA]">
                    GO TO INSIDE
                  </Button>
                </Link>
                <Link href="/drops">
                  <Button variant="outline" className="w-full border-[#333333]">
                    BROWSE MORE DROPS
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ERROR */}
          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md text-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-light mb-4">Acquisition Failed</h2>
              <p className="text-[#666666] mb-8">{error || "An error occurred. Please try again."}</p>
              <Button
                onClick={() => setPhase("form")}
                variant="outline"
                className="border-[#333333]"
              >
                TRY AGAIN
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
