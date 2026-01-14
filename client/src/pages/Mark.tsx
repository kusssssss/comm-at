import { useState, useEffect, useRef } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const THE_CODE = [
  { number: "I", text: "Protect the culture from dilution." },
  { number: "II", text: "Keep what is inside, inside." },
  { number: "III", text: "Respect the mark—it is a key, not merchandise." },
  { number: "IV", text: "Contribute to the collective." },
  { number: "V", text: "Accept the consequences of violation." },
];

type Phase = "loading" | "auth" | "verify" | "code" | "callsign" | "confirm" | "marking" | "complete" | "error";

export default function Mark() {
  const { serial } = useParams<{ serial: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [phase, setPhase] = useState<Phase>("loading");
  const [activationCode, setActivationCode] = useState("");
  const [codeIndex, setCodeIndex] = useState(0);
  const [callSign, setCallSign] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [artifactId, setArtifactId] = useState<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch artifact
  const { data: artifact, isLoading: artifactLoading } = trpc.artifact.getBySerial.useQuery(
    { serialNumber: serial || "" },
    { enabled: !!serial }
  );

  // Validation mutation
  const validateMutation = trpc.artifact.validateActivationCode.useMutation();

  // Marking mutation
  const markMutation = trpc.artifact.mark.useMutation({
    onSuccess: () => {
      setPhase("complete");
    },
    onError: (err) => {
      setError(err.message);
      setPhase("error");
    },
  });

  // Initialize phase after loading
  useEffect(() => {
    if (authLoading || artifactLoading) return;
    
    if (!isAuthenticated) {
      setPhase("auth");
      return;
    }
    
    if (!artifact) {
      setError("Artifact not found.");
      setPhase("error");
      return;
    }
    
    if (artifact.status === "marked") {
      setError("This artifact has already been marked.");
      setPhase("error");
    } else if (artifact.status === "flagged") {
      setError("This artifact has been flagged and cannot be marked.");
      setPhase("error");
    } else {
      setTimeout(() => setPhase("verify"), 800);
    }
  }, [authLoading, artifactLoading, isAuthenticated, artifact]);

  // Auto-focus inputs
  useEffect(() => {
    if ((phase === "verify" || phase === "callsign") && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [phase]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) return;
    
    try {
      const result = await validateMutation.mutateAsync({
        serialNumber: serial || "",
        activationCode: activationCode.trim().toUpperCase(),
      });
      
      if (result.valid) {
        setArtifactId(result.artifactId);
        setPhase("code");
      }
    } catch (err: any) {
      setError(err.message || "Invalid activation code");
      setPhase("error");
    }
  };

  const acceptCodeRule = () => {
    if (codeIndex < THE_CODE.length - 1) {
      setCodeIndex(prev => prev + 1);
    } else {
      setPhase("callsign");
    }
  };

  const handleCallSignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (callSign.trim() && callSign.length >= 2) {
      setPhase("confirm");
    }
  };

  const executeMarking = () => {
    if (!artifactId) return;
    setPhase("marking");
    markMutation.mutate({
      artifactId,
      callSign: callSign.trim(),
      chapter: "South Jakarta",
      acceptedCode: true,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Grain overlay */}
      <div className="grain" />

      {/* Minimal header - only @ symbol */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
        <Link href="/">
          <span className="text-[#9333EA] text-xl font-light cursor-crosshair">@</span>
        </Link>
      </header>

      <main className="min-h-screen flex items-center justify-center px-6">
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
              <span className="text-[#9333EA] cursor-blink text-2xl" />
            </motion.div>
          )}

          {/* AUTH REQUIRED */}
          {phase === "auth" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-xl text-center"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-micro text-[#333333] tracking-[0.3em] mb-8"
              >
                AUTHENTICATION REQUIRED
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-headline text-white mb-4"
              >
                Sign in to receive The Mark
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-body text-[#666666] mb-12"
              >
                The marking ceremony requires identity verification.
              </motion.p>
              
              <motion.a
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                href={getLoginUrl()}
                className="btn-mark inline-block"
              >
                SIGN IN
              </motion.a>
            </motion.div>
          )}

          {/* VERIFY - Enter activation code */}
          {phase === "verify" && (
            <motion.div
              key="verify"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-xl text-center"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-micro text-[#333333] tracking-[0.3em] mb-4"
              >
                MARK
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-headline text-white mb-2"
              >
                {artifact?.title}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-mono text-[#666666] mb-16"
              >
                {serial}
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-micro text-[#333333] tracking-[0.3em] mb-8"
              >
                ENTER ACTIVATION CODE
              </motion.p>

              <form onSubmit={handleVerifyCode}>
                <input
                  ref={inputRef}
                  type="text"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  className="input-void text-mono text-2xl"
                  placeholder="_"
                  autoComplete="off"
                  spellCheck={false}
                />
                {validateMutation.isPending && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-micro text-[#9333EA] mt-4"
                  >
                    VALIDATING...
                  </motion.p>
                )}
              </form>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-body text-[#333333] mt-16"
              >
                The activation code is found inside your mark.
              </motion.p>
            </motion.div>
          )}

          {/* CODE - Accept The Code one rule at a time */}
          {phase === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-2xl text-center cursor-crosshair select-none"
              onClick={acceptCodeRule}
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-micro text-[#9333EA] tracking-[0.3em] mb-16"
              >
                THE CODE
              </motion.p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={codeIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="text-mono text-[#333333] mb-6">{THE_CODE[codeIndex].number}</p>
                  <p className="text-display text-white leading-tight">{THE_CODE[codeIndex].text}</p>
                </motion.div>
              </AnimatePresence>

              {/* Progress */}
              <div className="flex justify-center gap-2 mt-16">
                {THE_CODE.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 transition-colors duration-500 ${
                      i <= codeIndex ? "bg-[#9333EA]" : "bg-[#333333]"
                    }`}
                  />
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-micro text-[#333333] mt-8 tracking-[0.3em]"
              >
                CLICK TO ACCEPT
              </motion.p>
            </motion.div>
          )}

          {/* CALLSIGN - Choose your call sign */}
          {phase === "callsign" && (
            <motion.div
              key="callsign"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-xl text-center"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-micro text-[#333333] tracking-[0.3em] mb-8"
              >
                CHOOSE YOUR CALL SIGN
              </motion.p>

              <form onSubmit={handleCallSignSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  value={callSign}
                  onChange={(e) => setCallSign(e.target.value)}
                  className="input-void text-3xl md:text-5xl font-light text-center"
                  placeholder="_"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={20}
                />
              </form>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-body text-[#333333] mt-16 max-w-md mx-auto"
              >
                This name will be permanently bound to your mark. 
                It cannot be changed.
              </motion.p>
            </motion.div>
          )}

          {/* CONFIRM - Final confirmation */}
          {phase === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-xl text-center"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-micro text-[#333333] tracking-[0.3em] mb-16"
              >
                CONFIRM MARKING
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-8 mb-16"
              >
                <div>
                  <p className="text-micro text-[#333333] tracking-[0.3em] mb-2">MARK</p>
                  <p className="text-headline text-white">{artifact?.title}</p>
                </div>
                <div>
                  <p className="text-micro text-[#333333] tracking-[0.3em] mb-2">SERIAL</p>
                  <p className="text-mono text-white">{serial}</p>
                </div>
                <div>
                  <p className="text-micro text-[#333333] tracking-[0.3em] mb-2">CALL SIGN</p>
                  <p className="text-display text-[#9333EA]">{callSign}</p>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-body text-[#666666] mb-12 max-w-md mx-auto"
              >
                By receiving The Mark, you accept The Code and become 
                part of the collective. This action is irreversible.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center gap-4"
              >
                <button
                  onClick={() => setPhase("callsign")}
                  className="btn-ghost"
                >
                  GO BACK
                </button>
                <button
                  onClick={executeMarking}
                  className="btn-mark"
                >
                  RECEIVE THE MARK
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* MARKING - Processing */}
          {phase === "marking" && (
            <motion.div
              key="marking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.p
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-headline text-white"
              >
                MARKING
              </motion.p>
              <span className="text-[#9333EA] cursor-blink text-2xl mt-8 block" />
            </motion.div>
          )}

          {/* COMPLETE - You are marked */}
          {phase === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="w-full max-w-xl text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-massive text-[#9333EA] mark-glow">
                  MARKED
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="mt-16 space-y-4"
              >
                <p className="text-headline text-white">{callSign}</p>
                <p className="text-body text-[#666666]">
                  You are now part of the collective.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="mt-16 flex justify-center gap-4"
              >
                <Link href="/inside">
                  <button className="btn-mark">ENTER INSIDE</button>
                </Link>
                <Link href={`/verify/${serial}`}>
                  <button className="btn-ghost">VIEW ARTIFACT</button>
                </Link>
              </motion.div>
            </motion.div>
          )}

          {/* ERROR */}
          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-xl text-center"
            >
              <p className="text-massive text-[#FF0000]">ERROR</p>
              <p className="text-body text-[#666666] mt-8">{error}</p>
              <div className="mt-16 flex justify-center gap-4">
                <Link href="/verify">
                  <button className="btn-ghost">VERIFY ANOTHER</button>
                </Link>
                <Link href="/">
                  <button className="btn-ghost">HOME</button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 px-6 py-6">
        <div className="flex justify-between items-center">
          <span className="text-micro text-[#333333] tracking-[0.2em]">THE MARKING</span>
          <span className="text-micro text-[#333333] tracking-[0.2em]">
            {phase === "verify" && "STEP 1 OF 4"}
            {phase === "code" && "STEP 2 OF 4"}
            {phase === "callsign" && "STEP 3 OF 4"}
            {phase === "confirm" && "STEP 4 OF 4"}
          </span>
        </div>
      </footer>
    </div>
  );
}
