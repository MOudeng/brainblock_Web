import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

let isRequestingCamera = false;

export function CameraStream({ onStreamReady }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // 1. Get available video devices
  useEffect(() => {
    const getDevices = async () => {
      console.log("[CameraStream] getDevices() started");
      try {
        // Request permission first, otherwise device labels might be empty
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("[CameraStream] Initial getUserMedia (permissions check) succeeded");
      } catch (err) {
        console.warn('Initial getUserMedia failed, labels might be empty:', err);
      }
      
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          const savedCam = localStorage.getItem('kiosk_camera_id');
          const isValidSavedCam = videoDevices.some(d => d.deviceId && d.deviceId === savedCam);
          
          // If deviceId is empty string (permissions not fully granted), use a special value "default"
          const firstId = videoDevices[0].deviceId || ""; // Don't use "default", empty string tells browser to pick default
          const chosenId = isValidSavedCam ? savedCam : firstId;
          console.log("[CameraStream] Found devices:", videoDevices.length, "Chosen ID:", chosenId);
          setSelectedDeviceId(chosenId);
        } else {
          setError('Tidak ada kamera yang terdeteksi di perangkat ini.');
        }
      } catch (err) {
        console.error('Error getting devices:', err);
        setError('Gagal mendapatkan daftar kamera: ' + err.message);
        toast.error('Gagal mendapatkan daftar kamera.');
      }
    };
    getDevices();
  }, []);

  // 2. Initialize camera when selectedDeviceId changes
  useEffect(() => {
    console.log("[CameraStream] useEffect 2 running with selectedDeviceId:", selectedDeviceId);
    if (selectedDeviceId === null) return; // Allow empty string ""

    let stream = null;
    const initCamera = async () => {
      console.log("[CameraStream] initCamera() started");
      try {
        const videoConstraints = { width: { ideal: 1280 }, height: { ideal: 720 } };
        if (selectedDeviceId !== "default") {
             videoConstraints.deviceId = { exact: selectedDeviceId };
        }
        
        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Notify parent that stream is ready
        if (onStreamReady) {
          onStreamReady(videoRef.current);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError(err.message);
        toast.error('Gagal mengakses kamera: ' + err.message);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // We intentionally exclude onStreamReady from dependencies to avoid restarts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId]);

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950">
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-950/30 text-red-500 p-4 text-center">
          <p className="mb-4 font-semibold">Gagal mengakses kamera:</p>
          <p className="mb-4 text-sm opacity-80">{error}</p>
          <p className="text-xs text-slate-400">Silakan pilih kamera lain dari menu di atas.</p>
        </div>
      )}

      {/* Video Element */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline
        muted
        className={`w-full h-full object-contain ${error ? 'invisible' : 'visible'}`}
      />
      
      {/* Camera Selector Overlay - Hidden during gameplay as requested, now handled in Setup */}
    </div>
  );
}
