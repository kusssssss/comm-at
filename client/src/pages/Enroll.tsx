import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Key, Copy, Check, AlertTriangle, Smartphone } from "lucide-react";

// Generate device fingerprint (simplified version)
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
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

type EnrollmentStep = 'invite' | 'callsign' | 'setup' | 'verify' | 'recovery' | 'complete';

export default function Enroll() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState<EnrollmentStep>('invite');
  const [inviteCode, setInviteCode] = useState('');
  const [callSign, setCallSign] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  
  // Enrollment data from server
  const [enrollmentData, setEnrollmentData] = useState<{
    qrCode: string;
    uri: string;
    secret: string;
    recoveryCodes: string[];
    callSign: string;
  } | null>(null);
  
  // Check if user already has cipher enrolled
  const { data: cipherStatus } = trpc.cipher.status.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Validate invite code
  const validateInvite = trpc.cipher.validateInvite.useQuery(
    { code: inviteCode },
    { enabled: inviteCode.length >= 6 }
  );
  
  // Start enrollment mutation
  const startEnrollment = trpc.cipher.startEnrollment.useMutation({
    onSuccess: (data) => {
      setEnrollmentData(data);
      setStep('setup');
      setError('');
    },
    onError: (err) => {
      setError(err.message);
    },
  });
  
  // Verify enrollment mutation
  const verifyEnrollment = trpc.cipher.verifyEnrollment.useMutation({
    onSuccess: () => {
      setStep('recovery');
      setError('');
    },
    onError: (err) => {
      setError(err.message);
    },
  });
  
  // Redirect if already enrolled
  useEffect(() => {
    if (cipherStatus?.isEnrolled) {
      navigate('/cipher');
    }
  }, [cipherStatus, navigate]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);
  
  const handleInviteSubmit = () => {
    if (!validateInvite.data?.valid) {
      setError('Please enter a valid invite code');
      return;
    }
    setStep('callsign');
    setError('');
  };
  
  const handleCallSignSubmit = () => {
    if (callSign.length < 3) {
      setError('Call sign must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(callSign)) {
      setError('Call sign can only contain letters, numbers, and underscores');
      return;
    }
    
    const deviceFingerprint = getDeviceFingerprint();
    startEnrollment.mutate({
      inviteCode,
      callSign,
      deviceFingerprint,
    });
  };
  
  const handleVerifySubmit = () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    verifyEnrollment.mutate({ code: verificationCode });
  };
  
  const copyToClipboard = (text: string, type: 'secret' | 'recovery') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedRecovery(true);
      setTimeout(() => setCopiedRecovery(false), 2000);
    }
  };
  
  if (authLoading) {
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
          <span className="text-sm text-white/60">Personal Cipher Enrollment</span>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-6 pt-12">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['invite', 'callsign', 'setup', 'verify', 'recovery'].map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                step === s ? 'bg-[#0ABAB5]' : 
                ['invite', 'callsign', 'setup', 'verify', 'recovery'].indexOf(step) > i 
                  ? 'bg-[#0ABAB5]/50' 
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
        
        {/* Step 1: Invite Code */}
        {step === 'invite' && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#0ABAB5]/10 flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-[#0ABAB5]" />
              </div>
              <CardTitle className="text-white">Enter Your Invite Code</CardTitle>
              <CardDescription className="text-white/60">
                You need an invite code to join comm@. This code was given to you by an existing member.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                className="bg-black border-white/20 text-white text-center text-lg tracking-widest"
                maxLength={14}
              />
              
              {validateInvite.data?.valid && (
                <Alert className="bg-[#0ABAB5]/10 border-[#0ABAB5]/30">
                  <Check className="w-4 h-4 text-[#0ABAB5]" />
                  <AlertDescription className="text-[#0ABAB5]">
                    Valid invite code. Default layer: {validateInvite.data.defaultLayer}
                  </AlertDescription>
                </Alert>
              )}
              
              {validateInvite.data && !validateInvite.data.valid && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <AlertDescription className="text-red-500">
                    {validateInvite.data.message}
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
                onClick={handleInviteSubmit}
                disabled={!validateInvite.data?.valid}
                className="w-full bg-[#0ABAB5] hover:bg-[#0ABAB5]/80 text-black font-semibold"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Step 2: Call Sign */}
        {step === 'callsign' && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#0ABAB5]/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[#0ABAB5]" />
              </div>
              <CardTitle className="text-white">Choose Your Call Sign</CardTitle>
              <CardDescription className="text-white/60">
                This is your unique identity within comm@. Choose wisely - it cannot be changed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0ABAB5]">@</span>
                <Input
                  value={callSign}
                  onChange={(e) => setCallSign(e.target.value)}
                  placeholder="your_callsign"
                  className="bg-black border-white/20 text-white pl-8"
                  maxLength={32}
                />
              </div>
              
              <p className="text-xs text-white/40">
                3-32 characters. Letters, numbers, and underscores only.
              </p>
              
              {error && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <AlertDescription className="text-red-500">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('invite')}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCallSignSubmit}
                  disabled={callSign.length < 3 || startEnrollment.isPending}
                  className="flex-1 bg-[#0ABAB5] hover:bg-[#0ABAB5]/80 text-black font-semibold"
                >
                  {startEnrollment.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Step 3: Setup Authenticator */}
        {step === 'setup' && enrollmentData && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#0ABAB5]/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-[#0ABAB5]" />
              </div>
              <CardTitle className="text-white">Set Up Your Cipher</CardTitle>
              <CardDescription className="text-white/60">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                <img src={enrollmentData.qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              
              {/* Manual entry */}
              <div className="space-y-2">
                <p className="text-xs text-white/40 text-center">Or enter this code manually:</p>
                <div className="flex items-center gap-2 bg-black rounded-lg p-3">
                  <code className="flex-1 text-sm text-[#0ABAB5] font-mono break-all">
                    {enrollmentData.secret}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(enrollmentData.secret, 'secret')}
                    className="text-white/60 hover:text-white"
                  >
                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={() => setStep('verify')}
                className="w-full bg-[#0ABAB5] hover:bg-[#0ABAB5]/80 text-black font-semibold"
              >
                I've Added It
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Step 4: Verify Code */}
        {step === 'verify' && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#0ABAB5]/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[#0ABAB5]" />
              </div>
              <CardTitle className="text-white">Verify Your Cipher</CardTitle>
              <CardDescription className="text-white/60">
                Enter the 6-digit code from your authenticator app to complete setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="bg-black border-white/20 text-white text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
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
                  onClick={() => setStep('setup')}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifySubmit}
                  disabled={verificationCode.length !== 6 || verifyEnrollment.isPending}
                  className="flex-1 bg-[#0ABAB5] hover:bg-[#0ABAB5]/80 text-black font-semibold"
                >
                  {verifyEnrollment.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Step 5: Recovery Codes */}
        {step === 'recovery' && enrollmentData && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
              <CardTitle className="text-white">Save Your Recovery Codes</CardTitle>
              <CardDescription className="text-white/60">
                These codes can be used to access your account if you lose your device. 
                <strong className="text-yellow-500"> Save them somewhere safe - they won't be shown again.</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-black rounded-lg p-4 space-y-2">
                {enrollmentData.recoveryCodes.map((code, i) => (
                  <div key={i} className="font-mono text-sm text-white/80">
                    {i + 1}. {code}
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={() => copyToClipboard(enrollmentData.recoveryCodes.join('\n'), 'recovery')}
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                {copiedRecovery ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Codes
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setStep('complete')}
                className="w-full bg-[#0ABAB5] hover:bg-[#0ABAB5]/80 text-black font-semibold"
              >
                I've Saved My Codes
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Step 6: Complete */}
        {step === 'complete' && enrollmentData && (
          <Card className="bg-zinc-900 border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#0ABAB5]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#0ABAB5]" />
              </div>
              <CardTitle className="text-white">Welcome, @{enrollmentData.callSign}</CardTitle>
              <CardDescription className="text-white/60">
                Your Personal Cipher is now active. You are now part of comm@.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-black rounded-lg p-4 text-center">
                <p className="text-sm text-white/60 mb-2">Your Call Sign</p>
                <p className="text-2xl font-bold text-[#0ABAB5]">@{enrollmentData.callSign}</p>
              </div>
              
              <Button
                onClick={() => navigate('/')}
                className="w-full bg-[#0ABAB5] hover:bg-[#0ABAB5]/80 text-black font-semibold"
              >
                Enter comm@
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
