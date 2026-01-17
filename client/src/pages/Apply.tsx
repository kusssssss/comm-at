import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";

export default function Apply() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [reason, setReason] = useState("");
  const [vouchCallSign, setVouchCallSign] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Check existing clearance request
  const { data: existingRequest, isLoading: requestLoading } = trpc.clearance.getMyRequest.useQuery(
    undefined,
    { enabled: !!user }
  );

  const submitMutation = trpc.clearance.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  // Show loading state
  if (authLoading || requestLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  // Not logged in - show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="container max-w-2xl mx-auto px-4 py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-12">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center space-y-8">
            <div className="space-y-4">
              <p className="text-[#3B82F6]/80 text-sm tracking-[0.3em] uppercase">Request Clearance</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Join the Collective
              </h1>
              <p className="text-zinc-400 text-lg max-w-md mx-auto">
                You must be signed in to request clearance to acquire a Mark.
              </p>
            </div>

            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-[#3B82F6] hover:bg-[#60A5FA] text-black font-semibold px-8 py-6 text-lg"
            >
              Sign In to Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Already has clearance granted
  if (user.clearanceState === 'granted') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="container max-w-2xl mx-auto px-4 py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-12">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center space-y-8">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Clearance Granted</h1>
              <p className="text-zinc-400 text-lg">
                You have been granted clearance to acquire a Mark.
              </p>
              {user.clearanceExpiresAt && (
                <p className="text-[#3B82F6] text-sm">
                  Expires: {new Date(user.clearanceExpiresAt).toLocaleString()}
                </p>
              )}
            </div>

            <Button
              onClick={() => setLocation('/drops')}
              className="bg-[#3B82F6] hover:bg-[#60A5FA] text-black font-semibold px-8 py-6 text-lg"
            >
              Browse Marks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Already has pending request
  if (existingRequest?.status === 'pending' || user.clearanceState === 'applied') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="container max-w-2xl mx-auto px-4 py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-12">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center space-y-8">
            <Clock className="w-16 h-16 text-[#3B82F6] mx-auto" />
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Request Pending</h1>
              <p className="text-zinc-400 text-lg max-w-md mx-auto">
                Your clearance request is being reviewed. You will be notified when a decision is made.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-left max-w-md mx-auto">
              <p className="text-zinc-500 text-sm mb-2">Your submission:</p>
              <p className="text-zinc-300 italic">"{existingRequest?.reason}"</p>
              <p className="text-zinc-600 text-xs mt-4">
                Submitted: {existingRequest?.createdAt ? new Date(existingRequest.createdAt).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Request was denied
  if (existingRequest?.status === 'denied' || user.clearanceState === 'denied') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="container max-w-2xl mx-auto px-4 py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-12">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center space-y-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Request Denied</h1>
              <p className="text-zinc-400 text-lg max-w-md mx-auto">
                Your clearance request was not approved at this time. You may reapply next season.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Submission success
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="container max-w-2xl mx-auto px-4 py-16">
          <div className="text-center space-y-8">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Request Submitted</h1>
              <p className="text-zinc-400 text-lg max-w-md mx-auto">
                Your clearance request has been submitted. We will review it and notify you of our decision.
              </p>
            </div>

            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              className="border-zinc-700 text-zinc-300"
            >
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show application form
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-12">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <p className="text-[#3B82F6]/80 text-sm tracking-[0.3em] uppercase">Request Clearance</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Why Do You Protect<br />the Culture?
            </h1>
            <p className="text-zinc-400 text-lg max-w-md mx-auto">
              Clearance is required to acquire a Mark. Tell us why you belong.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim().length < 50) return;
              submitMutation.mutate({ reason, vouchCallSign: vouchCallSign || undefined });
            }}
            className="space-y-8"
          >
            {/* Main question */}
            <div className="space-y-3">
              <label className="text-zinc-300 text-sm font-medium">
                Your Answer <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What does protecting the culture mean to you? Why do you want to be part of this collective?"
                className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[200px] resize-none focus:border-[#3B82F6]/50 focus:ring-[#3B82F6]/20"
                required
                minLength={50}
              />
              <p className="text-zinc-600 text-xs">
                Minimum 50 characters. {reason.length}/50
              </p>
            </div>

            {/* Vouch field */}
            <div className="space-y-3">
              <label className="text-zinc-300 text-sm font-medium">
                Vouched By <span className="text-zinc-600">(optional)</span>
              </label>
              <Input
                value={vouchCallSign}
                onChange={(e) => setVouchCallSign(e.target.value)}
                placeholder="Call sign of existing member"
                className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#3B82F6]/50 focus:ring-[#3B82F6]/20"
              />
              <p className="text-zinc-600 text-xs">
                If an existing member referred you, enter their call sign.
              </p>
            </div>

            {/* Error message */}
            {submitMutation.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  {submitMutation.error.message}
                </p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={reason.trim().length < 50 || submitMutation.isPending}
              className="w-full bg-[#3B82F6] hover:bg-[#60A5FA] text-black font-semibold py-6 text-lg disabled:opacity-50"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>

            <p className="text-zinc-600 text-xs text-center">
              By submitting, you agree to The Code and understand that clearance is granted at our discretion.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
