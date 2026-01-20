import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export function QRScanner({ onScan, onError, enabled = true }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  const startScanner = async () => {
    if (!containerRef.current || scannerRef.current) return;
    
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Debounce: prevent duplicate scans within 2 seconds
          const now = Date.now();
          if (
            decodedText === lastScannedRef.current && 
            now - lastScanTimeRef.current < 2000
          ) {
            return;
          }
          
          lastScannedRef.current = decodedText;
          lastScanTimeRef.current = now;
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore "QR code not found" errors during scanning
          if (!errorMessage.includes('No QR code found')) {
            console.warn('QR scan warning:', errorMessage);
          }
        }
      );
      
      setIsScanning(true);
      setCameraError(null);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setCameraError(err.message || 'Failed to access camera');
      setHasCamera(false);
      onError?.(err.message || 'Failed to access camera');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const toggleScanner = async () => {
    if (isScanning) {
      await stopScanner();
    } else {
      await startScanner();
    }
  };

  useEffect(() => {
    if (enabled) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [enabled]);

  if (!hasCamera) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 text-center">
        <CameraOff className="w-12 h-12 mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400 mb-2">Camera not available</p>
        {cameraError && (
          <p className="text-red-400 text-sm mb-4">{cameraError}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setHasCamera(true);
            setCameraError(null);
            startScanner();
          }}
          className="border-[#0ABAB5] text-[#0ABAB5]"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Scanner container */}
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden"
        style={{ minHeight: '300px' }}
      >
        <div id="qr-reader" className="w-full" />
        
        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner markers */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#0ABAB5]" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#0ABAB5]" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#0ABAB5]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#0ABAB5]" />
              
              {/* Scanning line animation */}
              <div 
                className="absolute left-0 right-0 h-0.5 bg-[#0ABAB5] animate-pulse"
                style={{
                  animation: 'scanLine 2s ease-in-out infinite',
                  top: '50%',
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Toggle button */}
      <div className="mt-4 flex justify-center">
        <Button
          variant="outline"
          onClick={toggleScanner}
          className={`${
            isScanning 
              ? 'border-red-500 text-red-400 hover:bg-red-500/10' 
              : 'border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5]/10'
          }`}
        >
          {isScanning ? (
            <>
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </>
          )}
        </Button>
      </div>
      
      {/* CSS for scan line animation */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-50px); opacity: 0.5; }
          50% { transform: translateY(50px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default QRScanner;
