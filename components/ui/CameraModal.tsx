'use client';

import { useRef, useState, useEffect } from 'react';
import Button from './Button';

interface CameraModalProps {
  onCapture: (imageBlob: Blob) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function CameraModal({ onCapture, onSkip, onClose }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (mounted) {
        await startCamera();
      }
    };

    init();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          stream.removeTrack(track);
        });
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      // First try the environment camera (back camera on phones)
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        // If environment camera fails, try user camera (front camera/webcam)
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }
    } catch (err) {
      setError('Could not access camera. Please ensure camera permissions are granted.');
      console.error('Camera error:', err);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          // Stop the camera first
          stopCamera();
          // Then call onCapture
          onCapture(blob);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });
      setStream(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg max-w-md w-full">
        <div className="mb-4">
          {error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
          )}
        </div>
        <div className="flex justify-between">
          <Button variant="secondary" onClick={onSkip}>
            Skip
          </Button>
          <Button onClick={takePhoto}>
            Take Photo
          </Button>
        </div>
      </div>
    </div>
  );
} 