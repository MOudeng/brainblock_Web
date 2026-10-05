import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { CameraStream } from "@/components/CameraStream";
import { GameCanvas } from "@/components/GameCanvas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Play, Settings, MonitorX, User, Monitor, CheckCircle2, Circle } from "lucide-react";
import api from "@/lib/axios";
import { LEVEL_ANSWERS } from "@/lib/gameLogic";

export function PlayGame() {
  const navigate = useNavigate();
  
  // Kiosk Bootstrapped state
  const eventId = localStorage.getItem("kiosk_event_id");
  const deviceId = localStorage.getItem("kiosk_device_id");

  const [phase, setPhase] = useState("input"); // 'input' | 'game' | 'result'
  const [isTesting, setIsTesting] = useState(false); // If true, only 3 levels and no save

  // Participant 
  const [uid, setUid] = useState("");
  const [participant, setParticipant] = useState(null);
  const [checking, setChecking] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [deviceName, setDeviceName] = useState("Perangkat ini");

  // Game state
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentVariant, setCurrentVariant] = useState('1'); // Ex: '1A'
  const [totalTime, setTotalTime] = useState(0);
  
  // Timer state per level
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);

  // WebRTC
  const [videoElement, setVideoElement] = useState(null);

  useEffect(() => {
    if (!eventId || !deviceId) return; // Will redirect in render
    
    // Optional: Pre-load audio
    import('@/lib/audio').catch(err => console.log('Audio pre-load error:', err));
  }, [eventId, deviceId]);

  useEffect(() => {
    if (deviceId) {
      api.get(`/devices/${deviceId}`)
         .then(res => setDeviceName(res.data.name))
         .catch(err => console.error(err));
    }
  }, [deviceId]);

  useEffect(() => {
    let timer;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  if (!eventId || !deviceId) {
    return <Navigate to="/setup" replace />;
  }

  const getRandomVariant = (level) => {
    const variants = Object.keys(LEVEL_ANSWERS).filter(k => k.startsWith(level.toString()));
    if (variants.length === 0) return `${level}`; 
    return variants[Math.floor(Math.random() * variants.length)];
  };

  const startSession = async (testingMode = false) => {
    setIsTesting(testingMode);
    
    // Set status to in_use in background
    api.patch(`/devices/${deviceId}/status`, { status: 'in_use' }).catch(err => console.error(err));

    
    setLoadingAudio(true);
    try {
      const { sfx } = await import('@/lib/audio');
      sfx.bgm();
    } catch(err) {
      console.log('Audio error:', err);
    }
    setLoadingAudio(false);

    setPhase('game');
    setCurrentLevel(1);
    setCurrentVariant(getRandomVariant(1));
    setTotalTime(0);
    setElapsedTime(0);
    setGameStartTime(new Date());
    setIsTimerRunning(true);
  };

  const handlePatternMatch = () => {
    if (!isTimerRunning) return; // Prevent double triggers
    setIsTimerRunning(false);
    
    const timeTaken = elapsedTime;
    const newTotalTime = totalTime + timeTaken;
    setTotalTime(newTotalTime);

    import('@/lib/audio').then(({ sfx }) => {
      if (timeTaken < 10) sfx.amazing();
      else if (timeTaken < 20) sfx.good_job();
      else sfx.dont_give_up();
    });

    toast.success(`Level ${currentLevel} Selesai dalam ${timeTaken} detik!`);

    const maxLevel = isTesting ? 3 : 8;

    if (currentLevel < maxLevel) {
      setTimeout(() => {
        const nextLevel = currentLevel + 1;
        setCurrentLevel(nextLevel);
        setCurrentVariant(getRandomVariant(nextLevel));
        setElapsedTime(0);
        setIsTimerRunning(true);
      }, 1500);
    } else {
      setTimeout(async () => {
        if (isTesting) {
          toast.info("Testing Selesai!");
          handleResetKiosk();
        } else {
          toast.success(`GAME SELESAI! Total Waktu: ${newTotalTime} detik`);
          setPhase('result');
          
          try {
            const score = Math.max(0, 10000 - (newTotalTime * 10)); // simple calc
            await api.post('/games', {
              participant_id: participant.id,
              event_id: eventId,
              device_id: deviceId,
              score: score,
              level_reached: maxLevel,
              start_time: gameStartTime.toISOString(),
              end_time: new Date().toISOString()
            });
            toast.success("Skor berhasil disimpan ke server!");
          } catch (err) {
            console.error(err);
            toast.error("Gagal menyimpan skor.");
          }
        }
      }, 1500);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCheckUid = async () => {
    if (!uid) {
      toast.error('Scan Barcode terlebih dahulu');
      return;
    }
    setChecking(true);
    try {
      const res = await api.get(`/events/${eventId}/participants/${uid}`);
      if (res.data && res.data.id) {
        setParticipant(res.data);
        toast.success(`Berhasil! Halo ${res.data.name}`);
        // We could auto-start here, but let's let them click Mulai
      } else {
        toast.error('Peserta tidak ditemukan di event ini.');
        setParticipant(null);
      }
    } catch (err) {
      toast.error('Gagal memeriksa UID. Pastikan UID terdaftar di Event ini.');
      setParticipant(null);
    } finally {
      setChecking(false);
    }
  };

  const handleResetKiosk = () => {
    setParticipant(null);
    setUid('');
    setPhase('input');
    setIsTesting(false);
    
    // Set status to idle in background
    if (deviceId) {
      api.patch(`/devices/${deviceId}/status`, { status: 'idle' }).catch(err => console.error(err));
    }
  };

  const handleLogoutDevice = () => {
    localStorage.removeItem("kiosk_event_id");
    localStorage.removeItem("kiosk_device_id");
    navigate("/setup");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      {phase === 'input' && (
        <div className="w-full max-w-lg space-y-6">
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="bg-transparent border-slate-700 text-slate-300" onClick={() => startSession(true)}>
              <Settings className="h-4 w-4 mr-2" /> Test Kamera
            </Button>
            <Button variant="outline" className="bg-transparent border-red-900/50 text-red-400 hover:bg-red-950 hover:text-red-300" onClick={handleLogoutDevice}>
              <MonitorX className="h-4 w-4 mr-2" /> Ganti Perangkat
            </Button>
          </div>

          <Card className="bg-slate-900 border-slate-800 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-blue-600/20 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                <Play className="h-8 w-8 text-blue-500 ml-1" />
              </div>
              <CardTitle className="text-3xl font-bold">Siap Bermain</CardTitle>
              <p className="text-slate-400 text-sm mt-2">Mesin siap. Silakan scan barcode Anda untuk memulai sesi.</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="text-emerald-400 font-bold uppercase tracking-wider text-xs">Barcode Peserta</Label>
                <div className="flex gap-2">
                  <Input
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckUid()}
                    placeholder="Scan di sini..."
                    className="bg-slate-950 border-slate-700 font-mono text-lg h-12"
                    autoFocus
                  />
                  <Button onClick={handleCheckUid} variant="secondary" className="h-12 px-8" disabled={checking}>
                    {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cek"}
                  </Button>
                </div>
              </div>

              {participant && (
                <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-xl text-emerald-400 flex flex-col items-center">
                  <span className="text-sm text-emerald-500/80 mb-1">Identitas terverifikasi</span>
                  <strong className="text-xl">{participant.name}</strong> 
                </div>
              )}

              <Button 
                onClick={() => startSession(false)} 
                className="w-full text-lg h-14 bg-blue-600 hover:bg-blue-700" 
                disabled={!participant || loadingAudio}
              >
                {loadingAudio ? <Loader2 className="h-6 w-6 animate-spin" /> : "Mulai Game (8 Level)"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {phase === 'game' && (
        <div className="w-full h-full max-w-6xl mx-auto flex flex-col relative">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pemain</p>
                  <p className="font-medium text-slate-200">{participant?.name || "Admin (Testing Mode)"}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <Monitor className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Stasiun</p>
                  <p className="font-medium text-slate-200">{deviceName}</p>
                </div>
              </div>
            </div>

            {isTesting ? (
              <Badge className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-3 py-1 text-sm font-bold animate-pulse">
                MODE TESTING (Maks 3 Level)
              </Badge>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
                {[...Array(8)].map((_, i) => {
                  const lvl = i + 1;
                  const isCompleted = currentLevel > lvl;
                  const isActive = currentLevel === lvl;
                  return (
                    <div 
                      key={lvl} 
                      className={`flex items-center justify-center w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                        isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' :
                        'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : lvl}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-end mb-2 px-1">
             <h2 className="text-3xl font-black flex items-center gap-3">
              Level {currentLevel} 
              <Badge variant="outline" className="text-slate-400 border-slate-700 font-normal text-sm bg-slate-900">
                Pola {currentVariant}
              </Badge>
            </h2>
          </div>

          
          <div className="flex-1 flex gap-4 h-full min-h-0">
            {/* Camera Area */}
            <div 
              id="camera-container"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center group"
            >
              <CameraStream onStreamReady={(video) => setVideoElement(video)} />
              
              {/* Panduan Area Ideal & Indikator Kamera */}
              <div className="absolute inset-0 pointer-events-none z-15 flex flex-col items-center justify-center">
                 <div className="w-[60%] h-[60%] border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white/30 text-sm font-medium px-4 text-center bg-black/40 rounded-full py-1">Area Optimal Balok (Pastikan Kamera Tidak Terbalik)</span>
                 </div>
              </div>

              <div className="absolute inset-0 z-10 pointer-events-none">
                <GameCanvas 
                  videoElement={videoElement} 
                  targetPattern={LEVEL_ANSWERS[currentVariant] || []}
                  onPatternMatch={handlePatternMatch}
                  isDetectionPaused={!isTimerRunning}
                />
              </div>
              
              <button 
                onClick={() => {
                  const elem = document.getElementById('camera-container');
                  if (!document.fullscreenElement) {
                    elem.requestFullscreen().catch(err => toast.error('Gagal fullscreen: ' + err.message));
                  } else {
                    document.exitFullscreen();
                  }
                }}
                className="absolute top-4 right-4 bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center gap-2 text-sm"
              >
                Fullscreen
              </button>
            </div>

            {/* Target Pattern Area */}
            <div className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-6">
              <h3 className="text-xl font-semibold text-slate-300">Pola Target</h3>
              <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-sm aspect-square flex items-center justify-center overflow-hidden">
                <img 
                  src={`/assets/TEST_RANDOM_OTAK_ATIK/Lvl ${currentVariant}.PNG`}
                  alt={`Target Block ${currentVariant}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-slate-400 text-center text-sm">Susun balok sesuai dengan pola di atas. Kamera akan mendeteksi susunan balok Anda secara otomatis.</p>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center bg-slate-900 p-4 border border-slate-800 rounded-xl">
            <div className="text-xl font-mono text-emerald-400 font-bold tracking-wider">
              WAKTU: {formatTime(elapsedTime)}
            </div>
            <Button variant="destructive" onClick={handleResetKiosk}>Berhenti Sesi</Button>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-center shadow-2xl">
          <CardHeader>
            <CardTitle className="text-4xl text-emerald-400 mb-2">Permainan Selesai!</CardTitle>
            <p className="text-slate-300">Hebat {participant?.name}, kamu berhasil menyelesaikan 8 Level!</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="bg-slate-950 rounded-xl p-8 border border-slate-800">
              <p className="text-slate-400 uppercase tracking-widest text-sm font-bold mb-2">Total Waktu</p>
              <div className="text-6xl font-black font-mono text-white">
                {formatTime(totalTime)}
              </div>
            </div>
            <Button onClick={handleResetKiosk} className="w-full text-lg h-14 bg-blue-600 hover:bg-blue-700">
              Selesai & Pemain Berikutnya
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
