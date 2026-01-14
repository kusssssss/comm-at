import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Lock, Eye } from "lucide-react";

interface BlurOverlayProps {
  isBlurred: boolean;
  isRestricted: boolean;
  markState: 'outside' | 'initiate' | 'member' | 'inner_circle';
  children: React.ReactNode;
  className?: string;
}

export function BlurOverlay({ 
  isBlurred, 
  isRestricted, 
  markState, 
  children,
  className = ""
}: BlurOverlayProps) {
  if (!isBlurred && !isRestricted) {
    return <>{children}</>;
  }

  const getMessage = () => {
    switch (markState) {
      case 'outside':
        return {
          title: "Restricted Content",
          description: "Request clearance to see full content",
          cta: "Request Clearance",
          href: "/apply"
        };
      case 'initiate':
        return {
          title: "Full Access Required",
          description: "Activate your Mark to unlock full access",
          cta: "Verify Mark",
          href: "/verify"
        };
      default:
        return null;
    }
  };

  const message = getMessage();

  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className={isBlurred ? "blur-md pointer-events-none select-none" : ""}>
        {children}
      </div>
      
      {/* Overlay */}
      {isBlurred && message && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center p-6 max-w-sm">
            <div className="w-12 h-12 rounded-full bg-#9333EA/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-#9333EA" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{message.title}</h3>
            <p className="text-sm text-neutral-400 mb-4">{message.description}</p>
            <Link href={message.href}>
              <Button variant="outline" className="border-#9333EA/50 text-#9333EA hover:bg-#9333EA/10">
                <Eye className="w-4 h-4 mr-2" />
                {message.cta}
              </Button>
            </Link>
          </div>
        </div>
      )}
      
      {/* Restricted badge (for partial access) */}
      {!isBlurred && isRestricted && (
        <div className="absolute top-2 right-2">
          <div className="px-2 py-1 bg-#9333EA/20 rounded text-xs text-#9333EA flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Limited View
          </div>
        </div>
      )}
    </div>
  );
}

// Simple visibility indicator for inline use
export function VisibilityBadge({ 
  markState 
}: { 
  markState: 'outside' | 'initiate' | 'member' | 'inner_circle' 
}) {
  if (markState === 'member' || markState === 'inner_circle') {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-#9333EA/20 rounded text-xs text-#9333EA">
      <Lock className="w-3 h-3" />
      {markState === 'outside' ? 'Request Clearance' : 'Activate Mark'}
    </div>
  );
}
