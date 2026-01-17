
import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { CameraIcon } from './Icons.tsx';

interface WebcamViewProps {
  onCapture: (imageData: string) => void;
  captureLabel: string;
  hideCaptureButton?: boolean;
}

export const WebcamView = forwardRef<{ triggerCapture: () => void }, WebcamViewProps>(({ onCapture, captureLabel, hideCaptureButton = false }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [shutterEffect, setShutterEffect] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please check permissions and try again.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        setShutterEffect(true);
        setTimeout(() => setShutterEffect(false), 200);
        onCapture(imageData);
      }
    }
  }, [onCapture, isCameraReady]);

  useImperativeHandle(ref, () => ({
    triggerCapture: handleCapture
  }));

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-4 rounded-lg text-center">
        <p className="font-bold">Camera Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4">
      <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-lg border-2 border-slate-700">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-slate-400">Initializing Camera...</p>
                </div>
            </div>
        )}
        {shutterEffect && <div className="absolute inset-0 bg-white opacity-50 animate-ping"></div>}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {!hideCaptureButton && (
        <button
            onClick={handleCapture}
            disabled={!isCameraReady}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-all transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
        >
            <CameraIcon />
            {captureLabel}
        </button>
      )}
    </div>
  );
});