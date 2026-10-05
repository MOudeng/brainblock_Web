import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Trophy, Clock, Zap, Target, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function ClockDisplay() {
  const t = useClock();
  return t.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function LeaderboardRow({ rank, row }) {
  const isTop3 = rank <= 3;
  return (
    <div
      className={cn(
        "flex items-center gap-6 px-6 py-4 rounded-2xl transition-all duration-300",
        rank === 1 ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/5 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]" :
        rank === 2 ? "bg-gradient-to-r from-slate-400/20 to-slate-300/5 border border-slate-400/30" :
        rank === 3 ? "bg-gradient-to-r from-orange-700/20 to-orange-600/5 border border-orange-700/30" :
        "bg-white/5 border border-white/5 hover:bg-white/10"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shrink-0 shadow-inner",
        rank === 1 ? "bg-gradient-to-br from-yellow-300 to-amber-600 text-slate-900 shadow-amber-500/50" :
        rank === 2 ? "bg-gradient-to-br from-slate-200 to-slate-500 text-slate-900" :
        rank === 3 ? "bg-gradient-to-br from-orange-400 to-orange-700 text-white" :
        "bg-white/10 text-white/50"
      )}>
        {rank}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-bold text-2xl truncate tracking-tight",
          isTop3 ? "text-white" : "text-white/80"
        )}>
          {row.name}
        </div>

      </div>
      
      <div className="text-right shrink-0 flex items-center gap-6">
        <div className="flex flex-col items-end">
          <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
            <Target className="h-3 w-3" /> Level
          </div>
          <div className="text-white/90 font-mono text-xl">{row.level_reached || 0}</div>
        </div>
        
        <div className="w-px h-10 bg-white/10"></div>
        
        <div className="flex flex-col items-end w-32">
          <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
            <Zap className="h-3 w-3" /> Skor
          </div>
          <div className={cn(
            "font-black text-4xl tabular-nums tracking-tighter",
            rank === 1 ? "text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" : 
            isTop3 ? "text-white" : "text-white/70"
          )}>
            {row.score != null ? Math.round(row.score) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventDisplay() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");

  const { data: eventRes } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => api.get(`/events/${eventId}`),
    enabled: !!eventId,
  });
  const event = eventRes?.data;

  const { data: boardRes, isLoading } = useQuery({
    queryKey: ["event-leaderboard", eventId],
    queryFn: () => api.get(`/events/${eventId}/leaderboard`),
    refetchInterval: 5000,
    enabled: !!eventId,
  });

  const leaderboard = useMemo(() => boardRes?.data || [], [boardRes]);
  
  if (!eventId) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <p className="text-white mb-4">Event ID tidak ditemukan di URL.</p>
        <Button onClick={() => navigate("/dashboard")}>Kembali ke Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col selection:bg-amber-500/30">
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />
      
      <header className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-white/50 hover:text-white hover:bg-white/10 rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <span className="text-white drop-shadow-md">{event?.name || "Memuat Event..."}</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">LIVE</span>
            </h1>
            <p className="text-white/50 text-sm mt-1">{event?.venue ? `Lokasi: ${event.venue}` : "BRAINBLOCK Event Display"}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-inner">
          <div className="flex items-center gap-2 text-white/40 text-sm font-bold uppercase tracking-widest border-r border-white/10 pr-6">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Polling Aktif
          </div>
          <div className="text-amber-400 font-mono text-2xl font-black tabular-nums tracking-tight">
            <Clock className="h-5 w-5 inline mr-2 -mt-1 opacity-50" />
            <ClockDisplay />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-auto p-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
              <Trophy className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-black tracking-tight drop-shadow-sm">Leaderboard <span className="text-white/30 font-light">| Top 10</span></h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/40 gap-4">
              <div className="w-12 h-12 border-4 border-white/10 border-t-amber-500 rounded-full animate-spin" />
              <p className="font-mono text-sm tracking-widest uppercase">Sinkronisasi Data...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/30 gap-6 bg-white/5 rounded-3xl border border-white/5 border-dashed">
              <Trophy className="h-16 w-16 opacity-20" />
              <p className="text-xl font-medium tracking-tight">Belum ada skor tercatat</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.slice(0, 10).map((row, i) => (
                <LeaderboardRow key={row.uid || i} rank={i + 1} row={row} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
