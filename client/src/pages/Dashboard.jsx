import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Users,
    Gamepad2,
    Calendar,
    MapPin,
    Lock,
    Unlock,
    Settings,
    PlusCircle,
    Loader2,
    Trophy,
    MonitorPlay,
    Briefcase
} from "lucide-react";

export function Dashboard() {
    const queryClient = useQueryClient();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // New event state
    const [newEvent, setNewEvent] = useState({
        name: "",
        date: new Date().toISOString().split("T")[0],
        venue: "",
        device_count: 1,
        is_private: false,
        password: "",
    });

    const { data: eventsRes, isLoading } = useQuery({
        queryKey: ["events"],
        queryFn: () => api.get("/events"),
    });

    const { data: usersRes } = useQuery({
        queryKey: ["admin-users"],
        queryFn: () => api.get("/auth/users"),
    });

    const currentUserToken = localStorage.getItem("brainblock_token");
    const currentUsername = currentUserToken ? currentUserToken.replace("dummy-token-for-", "") : "";
    const currentUser = usersRes?.data?.find(u => u.username === currentUsername);

    let events = eventsRes?.data || [];
    if (currentUser && currentUser.role !== "super_admin") {
        events = events.filter(e => e.organizer_id === currentUser.id);
    }


    async function handleCreateEvent() {
        if (!newEvent.name.trim() || !newEvent.date || !newEvent.venue.trim()) {
            toast.error("Nama, Tanggal, dan Lokasi event harus diisi!");
            return;
        }

        setCreating(true);
        try {
            const payload = {
                name: newEvent.name,
                date: new Date(newEvent.date).toISOString(),
                venue: newEvent.venue,
                organizer_id: currentUser ? currentUser.id : 1,
                device_count: Number(newEvent.device_count),
                is_private: newEvent.is_private,
                password: {
                    String: newEvent.password,
                    Valid: newEvent.password.length > 0,
                },
            };

            await api.post("/events", payload);
            toast.success("Event berhasil dibuat!");
            setCreateDialogOpen(false);
            setNewEvent({
                name: "",
                date: new Date().toISOString().split("T")[0],
                venue: "",
                device_count: 1,
                is_private: false,
                password: "",
            });
            queryClient.invalidateQueries(["events"]);
        } catch (err) {
            console.error(err);
            toast.error("Gagal membuat event.");
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl text-white">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-red-600 opacity-20 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-600 opacity-20 rounded-full blur-[80px]"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <Badge className="bg-white/10 text-white hover:bg-white/20 border-transparent mb-1">
                            Admin Portal
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                            Event Dashboard
                        </h1>
                        <p className="text-slate-400 font-medium max-w-xl text-sm sm:text-base">
                            Kelola semua acara perlombaan, pantau leaderboard peserta, dan atur perangkat bermain dari satu panel terpusat.
                        </p>
                    </div>
                    
                    <Button 
                        onClick={() => setCreateDialogOpen(true)} 
                        className="bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-900/50 rounded-xl h-12 px-6 font-bold w-full md:w-auto shrink-0"
                    >
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Buat Event Baru
                    </Button>
                </div>
            </div>

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="h-10 w-10 animate-spin mb-4 text-red-600" />
                        <p className="font-medium">Memuat data event...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
                        <Trophy className="h-16 w-16 text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-300">Belum Ada Event</h3>
                        <p className="text-slate-500 mt-2 max-w-md">Mulai buat turnamen atau kompetisi pertama Anda dengan menekan tombol Buat Event Baru di atas.</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <Card key={event.id} className="bg-slate-900 border-slate-800 flex flex-col overflow-hidden hover:border-slate-700 transition-colors shadow-lg group">
                            {/* Card Header Color Bar */}
                            <div className="h-2 w-full bg-gradient-to-r from-red-600 to-rose-900"></div>
                            
                            <CardContent className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="font-bold text-2xl text-slate-100 truncate pr-4 group-hover:text-red-400 transition-colors">
                                        {event.name}
                                    </h3>
                                    {event.is_private ? (
                                        <Badge variant="outline" className="bg-slate-950 text-amber-500 border-amber-900 shrink-0">
                                            <Lock className="h-3 w-3 mr-1" /> Privat
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-emerald-950 text-emerald-400 border-emerald-900 shrink-0">
                                            <Unlock className="h-3 w-3 mr-1" /> Publik
                                        </Badge>
                                    )}
                                </div>
                                
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
                                        <Calendar className="h-4 w-4 text-red-500 shrink-0" />
                                        <span className="truncate">
                                            {new Date(event.date).toLocaleDateString("id-ID", { dateStyle: "long" })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
                                        <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                                        <span className="truncate">{event.venue}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
                                        <MonitorPlay className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <span>{event.device_count} Perangkat Aktif</span>
                                    </div>
                                </div>

                                <div className="mt-auto space-y-3 pt-4 border-t border-slate-800">
                                    <Button asChild variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700 text-white border-none h-11 rounded-xl">
                                        <Link to={`/dashboard/events/${event.id}/participants`}>
                                            <Briefcase className="h-4 w-4 mr-2 text-slate-400" />
                                            Kelola Event
                                        </Link>
                                    </Button>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button asChild variant="outline" className="w-full h-10 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg">
                                            <Link to={`/event?eventId=${event.id}`} target="_blank">
                                                <Trophy className="h-4 w-4 mr-2" />
                                                Dashboard
                                            </Link>
                                        </Button>
                                        <Button asChild variant="default" className="w-full h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md shadow-red-900/20">
                                            <Link to={`/setup?eventId=${event.id}`} target="_blank">
                                                <Gamepad2 className="h-4 w-4 mr-2" />
                                                Buka Perangkat
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Buat Event Baru</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Isi rincian acara. Event privat memerlukan password
                            untuk dilihat oleh publik.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Nama Acara
                            </label>
                            <Input
                                placeholder="Contoh: Kompetisi Merdeka Raya"
                                value={newEvent.name}
                                onChange={(e) =>
                                    setNewEvent({
                                        ...newEvent,
                                        name: e.target.value,
                                    })
                                }
                                className="bg-slate-950 border-slate-700 h-11"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={newEvent.date}
                                    onChange={(e) =>
                                        setNewEvent({
                                            ...newEvent,
                                            date: e.target.value,
                                        })
                                    }
                                    className="bg-slate-950 border-slate-700 h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Lokasi
                                </label>
                                <Input
                                    placeholder="Gedung XYZ"
                                    value={newEvent.venue}
                                    onChange={(e) =>
                                        setNewEvent({
                                            ...newEvent,
                                            venue: e.target.value,
                                        })
                                    }
                                    className="bg-slate-950 border-slate-700 h-11"
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <input
                                type="checkbox"
                                id="is_private"
                                checked={newEvent.is_private}
                                onChange={(e) =>
                                    setNewEvent({
                                        ...newEvent,
                                        is_private: e.target.checked,
                                    })
                                }
                                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 accent-red-600"
                            />
                            <div className="flex flex-col">
                                <label
                                    htmlFor="is_private"
                                    className="text-sm font-bold text-slate-200 cursor-pointer"
                                >
                                    Event Privat (Tertutup)
                                </label>
                                <span className="text-xs text-slate-400 mt-1">
                                    Skor tidak tampil di layar publik tanpa memasukkan password khusus.
                                </span>
                            </div>
                        </div>
                        
                        {newEvent.is_private && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Password Akses
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Buat password untuk akses leaderboard..."
                                    value={newEvent.password}
                                    onChange={(e) =>
                                        setNewEvent({
                                            ...newEvent,
                                            password: e.target.value,
                                        })
                                    }
                                    className="bg-slate-950 border-amber-900/50 focus-visible:ring-amber-500 h-11"
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-3 justify-end mt-8">
                        <Button
                            variant="ghost"
                            className="text-slate-400 hover:text-white hover:bg-slate-800 h-11 px-6"
                            onClick={() => setCreateDialogOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={handleCreateEvent} 
                            disabled={creating}
                            className="bg-red-600 hover:bg-red-700 text-white h-11 px-8 rounded-xl shadow-lg shadow-red-900/20"
                        >
                            {creating ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...</>
                            ) : "Simpan Event"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
