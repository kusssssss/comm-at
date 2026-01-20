import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Key, AlertTriangle, RefreshCw, Clock, Check } from "lucide-react";

// Generate device fingerprint (same as enrollment)
function getDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  const canvasData = canvas.toDataURL();
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvasData.slice(0, 100),
  ].join('|');
  
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

type CipherMode = 'verify' | 'recovery' | 'newDevice';

export default function Cipher() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const [mode, setMode] = useState<CipherMode>('verify');
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isNewDevice, setIsNewDevice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Check cipher status
  const { data: cipherStatus, isLoading: statusLoading } = trpc.cipher.status.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Verify cipher mutation
  const verifyCipher = trpc.cipher.validate.useMutation({
    onSuccess: (data: { success: boolean; newDevice?: boolean }) => {
      if (data.success) {
        // Redirect to home or intended destination
        navigate('/');
      } else if (data.newDevice) {
        setIsNewDevice(true);
        setMode('recovery');
        setError('');
      }
    },
    onError: (err) => {
      setError(err.message);
      setCode('');
    },
  });
  
  // Use recovery code mutation
  const useRecoveryCode = trpc.cipher.useRecoveryCode.useMutation({
    onSuccess: () => {
      navigate('/');
    },
    onError: (err) => {
      setError(err.message);
    },
  });
  
  // Use recovery code also handles new device binding
  // (useRecoveryCode mutation handles both cases)
  
  // Timer for TOTP countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setTimeRemaining(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Auto-focus input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);
  
  // Redirect if not enrolled
  useEffect(() => {
    if (!statusLoading && cipherStatus && !cipherStatus.isEnrolled) {
      navigate('/enroll');
    }
  }, [cipherStatus, statusLoading, navigate]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);
  
  const handleVerifySubmit = () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    const deviceFingerprint = getDeviceFingerprint();
    verifyCipher.mutate({ code, deviceFingerprint });
  };
  
  const handleRecoverySubmit = () => {
    if (recoveryCode.length < 8) {
      setError('Please enter a valid recovery code');
      return;
    }
    
    const deviceFingerprint = getDeviceFingerprint();
    useRecoveryCode.mutate({ recoveryCode, newDeviceFingerprint: deviceFingerprint });
  };
  
  // Handle key press for auto-submit
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'verify' && code.length === 6) {
        handleVerifySubmit();
      } else if (mode === 'recovery' && recoveryCode.length >= 8) {
        handleRecoverySubmit();
      }
    }
  };
  
  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0ABAB5]" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-2xl font-bold text-[#0ABAB5]">@</span>
          <span className="text-sm text-white/60">Personal Cipher</span>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-6 pt-12">
        {/* Verify Mode */}
        {mode === 'verify' && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-full bg-[#0ABAB5]/10 flex items-center justify-center mx-auto mb-4 relative">
                <Shield className="w-10 h-10 text-[#0ABAB5]" />
                {/* Countdown ring */}
                <svg className="absolute inset-0 w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="rgba(10, 186, 181, 0.2)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#0ABAB5"
                    strokeWidth="4"
                    strokeDasharray={`${(timeRemaining / 30) * 226} 226`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <CardTitle className="text-white">Enter Your Cipher</CardTitle>
              <CardDescription className="text-white/60">
                {cipherStatus?.callSign && (
                  <span className="block text-[#0ABAB5] font-semibold mb-1">
                    @{cipherStatus.callSign}
                  </span>
                )}
                Enter the 6-digit code from your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                <Clock className="w-4 h-4" />
                <span>Code refreshes in {timeRemaining}s</span>
              </div>
              
              {/* Code input */}
              <Input
                ref={inputRef}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                placeholder="000000"
                className="bg-black border-white/20 text-white text-center text-3xl tracking-[0.5em] font-mono h-16"
                maxLength={6}
                autoComplete="one-time-code"
              />
              
              {/* Account locked warning */}
              {cipherStatus?.isLocked && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <AlertDescription className="text-red-500">
                    Account temporarily locked due to too many failed attempts. 
                    Try again later or use a recovery code.
                  </AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <AlertDescription className="text-red-500">{error}</AlertDescription>
                </Alert>
              )}
              
              <Button
                onClick={handleVerifySubmit}
                disabled={code.length !== 6 || verifyCipher.isPending || cipherStatus?.isLocked}
                className="w-full bg-[#0ABAB5] hover:bg-[#0ABAB5]/80 text-black font-semibold h-12"
              >
                {verifyCipher.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  setMode('recovery');
                  setError('');
                }}
                className="w-full text-white/60 hover:text-white hover:bg-white/5"
              >
                <Key className="w-4 h-4 mr-2" />
                Use Recovery Code
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Recovery Mode */}
        {mode === 'recovery' && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-yellow-500" />
              </div>
              <CardTitle className="text-white">
                {isNewDevice ? 'New Device Detected' : 'Recovery Code'}
              </CardTitle>
              <CardDescription className="text-white/60">
                {isNewDevice 
                  ? 'Enter a recovery code to authorize this device. This will bind your cipher to this device.'
                  : 'Enter one of your recovery codes to access your account.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isNewDevice && (
                <Alert className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-500">
                    This device is not recognized. Using a recovery code will bind your cipher to this device.
                  </AlertDescription>
                </Alert>
              )}
              
              <Input
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="XXXX-XXXX-XXXX"
                className="bg-black border-white/20 text-white text-center text-lg tracking-widest font-mono"
              />
              
              {error && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <AlertDescription className="text-red-500">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMode('verify');
                    setError('');
                    setIsNewDevice(false);
                  }}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleRecoverySubmit}
                  disabled={recoveryCode.length < 8 || useRecoveryCode.isPending}
                  className="flex-1 bg-[#0ABAB5] hover:bg-[#0ABAB5]/80 text-black font-semibold"
                >
                  {useRecoveryCode.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    isNewDevice ? 'Authorize Device' : 'Recover'
                  )}
                </Button>
              </div>
              
              {cipherStatus && (
                <p className="text-xs text-white/40 text-center">
                  Recovery codes remaining: {cipherStatus.recoveryCodesRemaining}
                </p>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Layer badge */}
        {cipherStatus?.layer && (
          <div className="mt-6 text-center">
            <span className="text-xs text-white/40">Your Layer</span>
            <div className="mt-1">
              <span className={`
                px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                ${cipherStatus.layer === 'outside' || cipherStatus.layer === 'initiate' ? 'bg-zinc-800 text-zinc-400' : ''}
                ${cipherStatus.layer === 'member' ? 'bg-blue-900/50 text-blue-400' : ''}
                ${cipherStatus.layer === 'inner_circle' ? 'bg-amber-900/50 text-amber-400' : ''}
                ${cipherStatus.layer === 'restricted' ? 'bg-red-900/50 text-red-400' : ''}
                ${cipherStatus.layer === 'dormant' ? 'bg-gray-900/50 text-gray-400' : ''}
              `}>
                {cipherStatus.layer.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
