'use client';

import { useState, useRef } from 'react';
import { IoCamera, IoClose, IoImages } from 'react-icons/io5';

interface CameraInputProps {
  onImageCapture: (file: File) => void;
  onImageSelect: (file: File) => void;
  currentImage?: string;
  onRemoveImage: () => void;
}

export default function CameraInput({ 
  onImageCapture, 
  onImageSelect, 
  currentImage, 
  onRemoveImage 
}: CameraInputProps) {
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera on mobile
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setShowCameraOptions(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please make sure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onImageCapture(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
      setShowCameraOptions(false);
    }
  };

  if (currentImage) {
    return (
      <div className="relative">
        <img 
          src={currentImage} 
          alt="Preview"
          className="w-full h-64 sm:h-80 object-cover rounded-lg"
        />
        <button
          type="button"
          onClick={onRemoveImage}
          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
        >
          <IoClose size={16} />
        </button>
      </div>
    );
  }

  if (showCamera) {
    return (
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 sm:h-80 object-cover rounded-lg bg-black"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            type="button"
            onClick={capturePhoto}
            className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
          >
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </button>
          <button
            type="button"
            onClick={stopCamera}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {showCameraOptions ? (
        <div className="w-full h-64 sm:h-80 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center gap-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={startCamera}
              className="flex flex-col items-center gap-2 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <IoCamera size={32} className="text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Take Photo</span>
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <IoImages size={32} className="text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Choose from Gallery</span>
            </button>
          </div>
          
          <button
            type="button"
            onClick={() => setShowCameraOptions(false)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCameraOptions(true)}
          className="flex flex-col items-center justify-center w-full h-64 sm:h-80 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <IoCamera size={48} className="mb-4 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to add photo</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Take a photo or choose from gallery
            </p>
          </div>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}