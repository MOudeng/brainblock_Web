import { useState, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  Users,
  Search,
  ArrowLeft,
  CalendarDays,
  MapPin,
  MonitorPlay,
  UserPlus,
  Loader2,
  Trash2,
  Monitor,
  ArrowUpDown,
  Gamepad2,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


const SecretText = ({ text, placeholder = "••••••••••••" }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono border border-border">
        {show ? <span className="select-all">{text}</span> : <span className="select-none tracking-widest text-muted-foreground">{placeholder}</span>}
      </code>
      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => setShow(!show)}>
        {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </Button>
    </div>
  );
};

export function EventDetail() {
  const { eventId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "participants";

  const handleTabChange = (value) => {
    setSearchParams({ tab: value });
  };
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // New participant state
  const [newParticipant, setNewParticipant] = useState({ uid: "", name: "", age: "", gender: "L" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const { data: eventRes } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => api.get(`/events/${eventId}`),
    enabled: !!eventId,
  });

  const { data: devicesRes, isLoading: devicesLoading } = useQuery({
    queryKey: ["devices", eventId],
    queryFn: () => api.get(`/events/${eventId}/devices`),
    refetchInterval: 3000,
    enabled: !!eventId,
  });

  const { data: participantsRes, isLoading } = useQuery({
    queryKey: ["participants", eventId],
    queryFn: () => api.get(`/events/${eventId}/participants`),
    enabled: !!eventId,
    refetchInterval: 5000,
  });

  const event = eventRes?.data || eventRes;
  const rawParticipants = participantsRes?.data || participantsRes || [];
  const rawDevices = devicesRes?.data || devicesRes || [];

  const participants = Array.isArray(rawParticipants) ? rawParticipants : [];
  const devices = Array.isArray(rawDevices) ? rawDevices : [];

  const [isDeviceOpen, setIsDeviceOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [isCreatingDevice, setIsCreatingDevice] = useState(false);

  const filtered = useMemo(() => {
    let result = participants.filter(
      (p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.uid?.toLowerCase().includes(search.toLowerCase())
    );

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls/objects
      if (valA && typeof valA === 'object' && 'Valid' in valA) valA = valA.Valid ? valA.String || valA.Int32 : null;
      if (valB && typeof valB === 'object' && 'Valid' in valB) valB = valB.Valid ? valB.String || valB.Int32 : null;

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (valA < valB) return sortAsc ? -1 : 1;
      return sortAsc ? 1 : -1;
    });
    return result;
  }, [participants, search, sortField, sortAsc]);

  const toggleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newParticipant.uid.trim() || !newParticipant.name.trim() || !newParticipant.age) {
      toast.error("Harap isi UID, Nama, dan Usia");
      return;
    }
    
    setIsRegistering(true);
    try {
      // Check duplicate UID first
      try {
        const check = await api.get(`/events/${eventId}/participants/${newParticipant.uid}`);
        const p = check.data || check;
        if (p && p.id) {
          toast.error(`UID sudah terdaftar atas nama: ${p.name}`);
          setIsRegistering(false);
          return;
        }
      } catch (e) {
        // 404 means it's available, proceed.
      }

      const payload = {
        uid: newParticipant.uid,
        name: newParticipant.name,
        age: { Int32: Number(newParticipant.age), Valid: true },
        gender: { String: newParticipant.gender, Valid: true },
      };

      await api.post(`/events/${eventId}/participants`, payload);
      toast.success("Peserta berhasil didaftarkan!");
      setNewParticipant({ uid: "", name: "", age: "", gender: "L" });
      setIsRegisterOpen(false);
      queryClient.invalidateQueries({ queryKey: ["participants", eventId] });
    } catch (err) {
      toast.error("Gagal mendaftarkan peserta.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    setIsCreatingDevice(true);
    try {
      await api.post("/devices", {
        event_id: eventId,
        name: newDeviceName,
        status: "idle"
      });
      toast.success("Perangkat berhasil ditambahkan!");
      setNewDeviceName("");
      setIsDeviceOpen(false);
      queryClient.invalidateQueries({ queryKey: ["devices", eventId] });
    } catch (err) {
      toast.error("Gagal menambahkan perangkat.");
    } finally {
      setIsCreatingDevice(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-2 -ml-3">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Link>
      </Button>

      {/* Header */}
            {/* Hero Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-8 rounded-3xl shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-black opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-red-950/50 text-red-100 hover:bg-red-950/70 border-red-500/30 mb-2">
              Manajemen Event
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {event?.name || "Memuat Event..."}
            </h1>
            <p className="text-red-100/80 font-medium flex items-center gap-2 text-sm md:text-base">
              <CalendarDays className="h-4 w-4" />
              {event?.date ? new Date(event.date).toLocaleDateString("id-ID", { dateStyle: "long" }) : ""} 
              <span className="mx-2 opacity-50">•</span>
              <MapPin className="h-4 w-4" />
              {event?.venue || ""}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button asChild variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-none shadow-none backdrop-blur-sm w-full sm:w-auto">
              <Link to={`/event?eventId=${eventId}`} target="_blank">
                <MonitorPlay className="h-4 w-4 mr-2" /> Dashboard
              </Link>
            </Button>
            <Button asChild className="bg-white text-red-700 hover:bg-red-50 shadow-lg w-full sm:w-auto">
              <Link to={`/setup?eventId=${eventId}`} target="_blank">
                <Gamepad2 className="h-4 w-4 mr-2" /> Buka Perangkat
              </Link>
            </Button>
          </div>
        </div>
      </div>

<Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 bg-slate-100 dark:bg-zinc-900/50 p-1.5 rounded-xl">
          <TabsTrigger value="participants" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all"><Users className="h-4 w-4" /> Peserta</TabsTrigger>
          <TabsTrigger value="devices" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all"><Monitor className="h-4 w-4" /> Perangkat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="participants" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-border shadow-sm">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau UID peserta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 dark:bg-zinc-950 border-transparent focus-visible:ring-red-500 rounded-xl h-11"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">

              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Peserta</span>
                <span className="text-lg font-black text-foreground">{participants.length}</span>
              </div>
              <div className="h-10 w-px bg-border hidden sm:block mx-2"></div>
              <Button onClick={() => setIsRegisterOpen(true)} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 h-11 rounded-xl shadow-md shadow-red-600/20">
                <UserPlus className="h-4 w-4 mr-2" /> Tambah Peserta
              </Button>
            </div>
          </div>

          <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-muted/10">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-base font-medium text-foreground">Belum ada peserta.</p>
                  <p className="text-sm">Silakan tambah peserta pertama untuk event ini.</p>
                  <Button onClick={() => setIsRegisterOpen(true)} variant="outline" className="mt-4">
                    Tambah Peserta
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <SortTh field="name">Nama Peserta</SortTh>
                        <SortTh field="uid">UID (Barcode)</SortTh>
                        <SortTh field="age" className="text-center">Usia</SortTh>
                        <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground">Gender</TableHead>
                        <SortTh field="created_at" className="text-right">Terdaftar</SortTh>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((p) => (
                        <TableRow key={p.id} className="hover:bg-muted/10">
                          <TableCell className="font-bold text-foreground">
                            {p.name}
                          </TableCell>
                          <TableCell>
                            <SecretText text={p.uid} />
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {p.age?.Valid ? p.age.Int32 : "—"}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {p.gender?.Valid ? (p.gender.String === "L" ? "L" : "P") : "—"}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {p.created_at
                              ? new Date(p.created_at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Pencarian "{search}" tidak ditemukan.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-border gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center shrink-0">
                <Monitor className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Direktori Perangkat</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  Perangkat yang didaftarkan di sini akan digunakan sebagai stasiun bermain peserta. Copy ID Perangkat ke mesin bermain.
                </p>
              </div>
            </div>
            <Button onClick={() => setIsDeviceOpen(true)} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 h-11 rounded-xl shrink-0">
              <Monitor className="h-4 w-4 mr-2" /> Tambah Perangkat Baru
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devicesLoading ? (
              <div className="col-span-full py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : devices.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm">
                <Monitor className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-base font-medium text-foreground">Belum ada perangkat terdaftar.</p>
                <p className="text-sm text-muted-foreground mb-4">Tambahkan perangkat (misal: Laptop 1, HP 2) untuk mulai sesi main.</p>
                <Button variant="outline" onClick={() => setIsDeviceOpen(true)}>Tambah Perangkat Pertama</Button>
              </div>
            ) : (
              devices.map(device => (
                <Card key={device.id} className="border border-border shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-base font-bold flex justify-between items-center">
                      {device.name}
                      <Badge variant="outline" className={device.status === 'in_use' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}>
                        {device.status === 'in_use' ? 'Dipakai' : 'Kosong'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col gap-2">
                    <p className="text-xs font-bold text-muted-foreground tracking-wide">ID PERANGKAT</p>
                    <SecretText text={device.id} placeholder="••••-••••-••••-••••" />
                    <p className="text-[10px] text-center text-muted-foreground mt-1">Gunakan ID ini untuk login di halaman Perangkat Event.</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Registrasi Peserta */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pendaftaran Peserta Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground">UID (Barcode/RFID)</label>
              <Input
                value={newParticipant.uid}
                onChange={(e) => setNewParticipant({ ...newParticipant, uid: e.target.value })}
                placeholder="Scan atau ketik UID..."
                required
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Nama Peserta</label>
              <Input
                value={newParticipant.name}
                onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                placeholder="Nama lengkap"
                required
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Usia</label>
                <Input
                  type="number"
                  value={newParticipant.age}
                  onChange={(e) => setNewParticipant({ ...newParticipant, age: e.target.value })}
                  placeholder="25"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Gender</label>
                <select
                  value={newParticipant.gender}
                  onChange={(e) => setNewParticipant({ ...newParticipant, gender: e.target.value })}
                  className="flex h-10 w-full mt-1 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isRegistering}>
                {isRegistering ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Tambah Perangkat */}
      <Dialog open={isDeviceOpen} onOpenChange={setIsDeviceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Perangkat</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDevice} className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Nama Perangkat</label>
              <Input
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="Misal: Perangkat 01, Meja 1..."
                required
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDeviceOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isCreatingDevice}>
                {isCreatingDevice ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  function SortTh({ field, children, className }) {
    return (
      <TableHead
        className={cn("cursor-pointer select-none hover:bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground", className)}
        onClick={() => toggleSort(field)}
      >
        <span className={cn("flex items-center gap-1", className?.includes("text-right") && "justify-end", className?.includes("text-center") && "justify-center")}>
          {children}
          <ArrowUpDown
            className={cn(
              "h-3 w-3 transition-opacity",
              sortField === field ? "opacity-100 text-foreground" : "opacity-30"
            )}
          />
        </span>
      </TableHead>
    );
  }
}
