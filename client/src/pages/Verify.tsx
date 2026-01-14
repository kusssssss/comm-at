import { useState, useRef, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import Nav from "@/components/Nav";
import { DecryptText, GlitchHover, GlowPulse } from "@/components/Effects2200";

type Phase = "input" | "searching" | "result";

export default function Verify() {
  const { serial: urlSerial } = useParams<{ serial?: string }>();
  const [, setLocation] = useLocation();
  
  const [phase, setPhase] = useState<Phase>(urlSerial ? "searching" : "input");
  const [serialInput, setSerialInput] = useState(urlSerial || "");
  const [searchedSerial, setSearchedSerial] = useState(urlSerial || "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => {
    if (phase === "input" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  // Auto-search if URL has serial
  useEffect(() => {
    if (urlSerial) {
      setSearchedSerial(urlSerial);
      setPhase("searching");
    }
  }, [urlSerial]);

  // Fetch artifact data
  const { data: artifact, isLoading } = trpc.artifact.getBySerial.useQuery(
    { serialNumber: searchedSerial },
    { enabled: !!searchedSerial && phase !== "input" }
  );

  // Transition to result after loading
  useEffect(() => {
    if (!isLoading && searchedSerial && phase === "searching") {
      const timer = setTimeout(() => setPhase("result"), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, searchedSerial, phase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (serialInput.trim()) {
      setSearchedSerial(serialInput.trim().toUpperCase());
      setPhase("searching");
      setLocation(`/artifact/${serialInput.trim().toUpperCase()}`);
    }
  };

  const handleReset = () => {
    setPhase("input");
    setSerialInput("");
    setSearchedSerial("");
    setLocation("/verify");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Grain overlay */}
      <div className="grain" />

      {/* Navigation */}
      <Nav showBack backHref="/" backLabel="HOME" />

      <main className="min-h-screen flex items-center justify-center px-6 pt-20">
        <AnimatePresence mode="wait">
          {/* INPUT PHASE */}
          {phase === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-xl text-center"
            >
              {/* Header with context */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <p className="text-micro text-[#9333EA] tracking-[0.3em] mb-4">
                  <DecryptText text="VERIFY MARK" delay={200} speed={30} />
                </p>
                <h1 className="text-2xl md:text-3xl text-white font-light mb-4">
                  Enter your serial number
                </h1>
                <p className="text-sm text-[#666666] leading-relaxed max-w-md mx-auto">
                  Find the serial on your mark's tag or certificate. 
                  Example: COMMA-SJ-2026-000001
                </p>
              </motion.div>

              {/* Input form */}
              <motion.form 
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                  className="w-full bg-transparent border-b-2 border-[#333333] focus:border-[#9333EA] text-white text-center text-xl md:text-2xl font-mono py-4 outline-none transition-colors placeholder:text-[#333333]"
                  placeholder="COMMA-XX-XXXX-XXXXXX"
                  autoComplete="off"
                  spellCheck={false}
                />
                
                <GlitchHover>
                  <button
                    type="submit"
                    disabled={!serialInput.trim()}
                    className="w-full bg-[#9333EA] text-black py-4 text-sm font-semibold tracking-[0.2em] uppercase hover:bg-[#A855F7] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 animate-glow-pulse"
                  >
                    VERIFY
                  </button>
                </GlitchHover>
              </motion.form>

              {/* Help section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-16 pt-8 border-t border-[#222222]"
              >
                <p className="text-micro text-[#444444] tracking-[0.3em] mb-6">NEED HELP?</p>
                
                <div className="grid gap-4 text-left max-w-md mx-auto">
                  <div className="p-4 border border-[#222222] rounded">
                    <p className="text-sm text-white mb-1">Where is my serial number?</p>
                    <p className="text-xs text-[#666666]">
                      Check the tag attached to your mark or the certificate of authenticity.
                    </p>
                  </div>
                  
                  <div className="p-4 border border-[#222222] rounded">
                    <p className="text-sm text-white mb-1">What happens after verification?</p>
                    <p className="text-xs text-[#666666]">
                      You'll see the mark's status. If unmarked, you can begin the marking process.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Alternative action */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12"
              >
                <p className="text-sm text-[#444444] mb-4">Don't have a mark yet?</p>
                <Link href="/drops">
                  <button className="text-micro text-[#9333EA] tracking-[0.2em] hover:text-white transition-colors border-b border-[#9333EA] pb-1">
                    BROWSE DROPS →
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          )}

          {/* SEARCHING PHASE */}
          {phase === "searching" && (
            <motion.div
              key="searching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <p className="text-mono text-[#666666] tracking-[0.2em] mb-4">
                {searchedSerial}
              </p>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border border-[#9333EA] border-t-transparent rounded-full mx-auto"
              />
              <p className="text-micro text-[#00FF41] tracking-[0.2em] mt-4 font-mono">
                <DecryptText text="SCANNING DATABASE..." delay={0} speed={50} />
              </p>
            </motion.div>
          )}

          {/* RESULT PHASE */}
          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-4xl"
            >
              {!artifact ? (
                // NOT FOUND
                <div className="text-center">
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="text-6xl md:text-8xl text-[#333333] font-light tracking-wider"
                  >
                    UNKNOWN
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-base text-[#666666] mt-8 max-w-md mx-auto"
                  >
                    This serial number does not exist in our registry. 
                    Please check the number and try again.
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={handleReset}
                    className="mt-12 border border-[#444444] text-[#888888] px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:border-white hover:text-white transition-all duration-500"
                  >
                    TRY AGAIN
                  </motion.button>
                </div>
              ) : artifact.status === "flagged" ? (
                // FLAGGED
                <div className="text-center">
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="text-6xl md:text-8xl text-red-500 font-light tracking-wider"
                  >
                    FLAGGED
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-base text-[#666666] mt-8 max-w-md mx-auto"
                  >
                    This mark has been flagged for violation. 
                    {artifact.flagReason && ` Reason: ${artifact.flagReason}`}
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={handleReset}
                    className="mt-12 border border-[#444444] text-[#888888] px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:border-white hover:text-white transition-all duration-500"
                  >
                    VERIFY ANOTHER
                  </motion.button>
                </div>
              ) : artifact.status === "marked" ? (
                // MARKED
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                  >
                    <p className="text-6xl md:text-8xl text-[#9333EA] font-light tracking-wider" style={{ textShadow: "0 0 60px rgba(201,162,39,0.5)" }}>
                      MARKED
                    </p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mt-16 space-y-8"
                  >
                    <div>
                      <p className="text-micro text-[#444444] tracking-[0.3em] mb-2">MARK</p>
                      <p className="text-2xl text-white font-light">{artifact.title}</p>
                      <p className="text-base text-[#666666] mt-1">{artifact.artistName}</p>
                    </div>
                    
                    <div className="flex justify-center gap-16">
                      <div>
                        <p className="text-micro text-[#444444] tracking-[0.3em] mb-2">SERIAL</p>
                        <p className="text-mono text-white">{artifact.serialNumber}</p>
                      </div>
                      <div>
                        <p className="text-micro text-[#444444] tracking-[0.3em] mb-2">EDITION</p>
                        <p className="text-mono text-white">{artifact.editionNumber} / {artifact.editionSize}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-micro text-[#444444] tracking-[0.3em] mb-2">MARKED BY</p>
                      <p className="text-2xl text-[#9333EA] font-light">{artifact.markerCallSign}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-16 flex flex-col sm:flex-row justify-center gap-4"
                  >
                    <Link href={`/drop/${artifact.dropId}`}>
                      <button className="bg-[#9333EA] text-black px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-[#A855F7] transition-all duration-500">
                        VIEW DROP
                      </button>
                    </Link>
                    <button 
                      onClick={handleReset} 
                      className="border border-[#444444] text-[#888888] px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:border-white hover:text-white transition-all duration-500"
                    >
                      VERIFY ANOTHER
                    </button>
                  </motion.div>
                </div>
              ) : (
                // UNMARKED
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                  >
                    <p className="text-6xl md:text-8xl text-white font-light tracking-wider">
                      UNMARKED
                    </p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mt-16 space-y-8"
                  >
                    <div>
                      <p className="text-micro text-[#444444] tracking-[0.3em] mb-2">MARK</p>
                      <p className="text-2xl text-white font-light">{artifact.title}</p>
                      <p className="text-base text-[#666666] mt-1">{artifact.artistName}</p>
                    </div>
                    
                    <div className="flex justify-center gap-16">
                      <div>
                        <p className="text-micro text-[#444444] tracking-[0.3em] mb-2">SERIAL</p>
                        <p className="text-mono text-white">{artifact.serialNumber}</p>
                      </div>
                      <div>
                        <p className="text-micro text-[#444444] tracking-[0.3em] mb-2">EDITION</p>
                        <p className="text-mono text-white">{artifact.editionNumber} / {artifact.editionSize}</p>
                      </div>
                    </div>
                    
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="text-base text-[#666666] max-w-md mx-auto"
                    >
                      This mark is authentic and awaits its owner. 
                      If you possess this piece, you may receive The Mark.
                    </motion.p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-16 flex flex-col sm:flex-row justify-center gap-4"
                  >
                    <Link href={`/mark/${artifact.serialNumber}`}>
                      <button className="bg-[#9333EA] text-black px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-[#A855F7] transition-all duration-500 hover:shadow-[0_0_30px_rgba(201,162,39,0.3)]">
                        RECEIVE THE MARK
                      </button>
                    </Link>
                    <button 
                      onClick={handleReset} 
                      className="border border-[#444444] text-[#888888] px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:border-white hover:text-white transition-all duration-500"
                    >
                      VERIFY ANOTHER
                    </button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <span className="text-micro text-[#222222] tracking-[0.2em]">COMM@</span>
          <span className="text-micro text-[#222222] tracking-[0.2em]">SEASON ONE</span>
        </div>
      </footer>
    </div>
  );
}
