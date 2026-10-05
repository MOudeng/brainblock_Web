import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, MonitorPlay, Loader2 } from "lucide-react";

export function SetupDevice() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [deviceIdInput, setDeviceIdInput] = useState("");
  
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const previewVideoRef = useRef(null);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    if (!selectedCamera) return;
    let stream = null;
    setPreviewError("");
    navigator.mediaDevices.getUserMedia({ 
        video: { deviceId: { exact: selectedCamera }, width: { ideal: 640 } } 
    }).then(s => {
        stream = s;
        if (previewVideoRef.current) previewVideoRef.current.srcObject = s;
    }).catch(err => {
        setPreviewError(err.message);
    });
    return () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [selectedCamera]);

  useEffect(() => {
    // Check if already setup
    const savedEvent = localStorage.getItem("kiosk_event_id");
    const savedDevice = localStorage.getItem("kiosk_device_id");
    if (savedEvent && savedDevice) {
      navigate("/play");
      return;
    }

    // Load events
    api.get("/events")
      .then(res => setEvents(res.data || []))
      .catch(err => toast.error("Gagal memuat daftar event"))
      .finally(() => setLoadingEvents(false));
      
    // Load cameras
    navigator.mediaDevices.getUserMedia({ video: true }).catch(() => {}).then(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            setCameras(videoDevices);
            if (videoDevices.length > 0) setSelectedCamera(videoDevices[0].deviceId);
        });
    });
  }, [navigate]);

  const handleSetup = async () => {
    if (!selectedEvent) {
      toast.error("Pilih event terlebih dahulu");
      return;
    }
    if (!deviceIdInput.trim()) {
      toast.error("Masukkan ID Perangkat");
      return;
    }

    setIsVerifying(true);
    try {
      // Verifikasi apakah device valid
      const res = await api.get(`/devices/${deviceIdInput.trim()}`);
      const device = res.data;
      
      if (device.event_id !== selectedEvent) {
        toast.error("ID Perangkat ini bukan milik Event yang dipilih.");
        setIsVerifying(false);
        return;
      }

      // Berhasil
      localStorage.setItem("kiosk_event_id", selectedEvent);
      localStorage.setItem("kiosk_device_id", device.id);
      if (selectedCamera) localStorage.setItem("kiosk_camera_id", selectedCamera);
      toast.success(`Perangkat "${device.name}" berhasil di-setup!`);
      navigate("/play");
    } catch (err) {
      toast.error("ID Perangkat tidak ditemukan atau salah.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <div className="flex items-center mb-4">
            <Button variant="ghost" asChild className="text-slate-400 hover:text-white -ml-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
              </Link>
            </Button>
          </div>
          <CardTitle className="text-2xl text-center flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-red-600/20 rounded-full flex items-center justify-center">
              <MonitorPlay className="h-8 w-8 text-red-500" />
            </div>
            Setup Perangkat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-slate-300">1. Pilih Event / Acara</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-full bg-slate-950 border-slate-700">
                <SelectValue placeholder={loadingEvents ? "Memuat..." : "Pilih Event"} />
              </SelectTrigger>
              <SelectContent>
                {events.map(ev => (
                  <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-300">2. ID Perangkat</Label>
            <Input 
              placeholder="Masukkan ID Perangkat..."
              value={deviceIdInput}
              onChange={(e) => setDeviceIdInput(e.target.value)}
              className="bg-slate-950 border-slate-700 font-mono text-sm"
            />
            <p className="text-xs text-slate-500">Dapatkan ID ini di Dashboard Admin &gt; Kelola Peserta &gt; Tab Perangkat</p>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-300">3. Pilih Kamera Game</Label>
            <Select value={selectedCamera} onValueChange={setSelectedCamera}>
              <SelectTrigger className="w-full bg-slate-950 border-slate-700">
                <SelectValue placeholder={cameras.length === 0 ? "Memuat Kamera..." : "Pilih Kamera"} />
              </SelectTrigger>
              <SelectContent>
                {cameras.map((cam, idx) => (
                  <SelectItem key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Kamera ${idx + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2 w-full h-40 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center">
              {previewError ? (
                  <p className="text-red-500 text-xs text-center px-2">{previewError}</p>
              ) : (
                  <video ref={previewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[60%] h-[60%] border border-dashed border-white/30 rounded"></div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSetup} 
            className="w-full h-12 text-base font-bold mt-4"
            disabled={!selectedEvent || !deviceIdInput || isVerifying}
          >
            {isVerifying ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            {isVerifying ? "Memverifikasi..." : "Kunci Perangkat & Mulai"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
