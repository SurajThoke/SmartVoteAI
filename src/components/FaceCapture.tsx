import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { loadFaceModels, getFaceEmbedding } from '../services/faceService';
import { cn } from '../utils/utils';

interface FaceCaptureProps {
  onCapture: (embedding: number[]) => void;
  isProcessing?: boolean;
}

export const FaceCapture: React.FC<FaceCaptureProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraReady(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadFaceModels();
        setIsModelsLoaded(true);
        await startCamera();
      } catch (err) {
        setError("Failed to initialize camera or AI models.");
      }
    };
    init();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraReady(true);
      }
    } catch (err) {
      setError("Camera access denied. Please enable camera permissions.");
    }
  };

  const capture = async () => {
    if (!videoRef.current || !isModelsLoaded) return;
    
    setIsCapturing(true);
    setError(null);
    
    try {
      const embedding = await getFaceEmbedding(videoRef.current);
      if (embedding) {
        stopCamera(); // Stop camera immediately after successful capture
        onCapture(embedding);
      } else {
        setError("No face detected. Please ensure your face is clearly visible.");
      }
    } catch (err) {
      setError("Error processing face. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-md mx-auto">
      <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-200 shadow-xl">
        {!isCameraReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={cn("w-full h-full object-cover", !isCameraReady && "hidden")}
        />
        {isCapturing && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-white flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-sm font-medium">Analyzing Face...</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg w-full">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <button
        onClick={capture}
        disabled={!isCameraReady || isCapturing || isProcessing}
        className="flex items-center justify-center space-x-2 w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
      >
        {isCapturing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Camera className="w-5 h-5" />
            <span>Capture & Verify Face</span>
          </>
        )}
      </button>
      
      <p className="text-xs text-slate-500 text-center">
        Your face data is encrypted and used only for identity verification. We do not store raw images.
      </p>
    </div>
  );
};
