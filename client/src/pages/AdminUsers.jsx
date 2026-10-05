import { useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Shield, UserPlus, Loader2, Users, Calendar } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

export function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: usersRes, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/auth/users"),
  });
  
  const usersList = usersRes?.data || [];

  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password_hash: "",
    role: "organizer"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password_hash) {
      toast.error("Harap isi semua kolom!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post("/auth/register", formData);
      toast.success("Admin Pelaksana berhasil didaftarkan!");
      setFormData({ name: "", username: "", password_hash: "", role: "organizer" });
      queryClient.invalidateQueries(["admin-users"]);
    } catch (err) {
      toast.error("Gagal mendaftarkan admin pelaksana.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-600" />
          Kelola Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Buat akun untuk Admin Pelaksana (Organizer) agar mereka dapat mengelola event.</p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-lg">Tambah Admin Baru</CardTitle>
          <CardDescription>Akun yang dibuat di sini dapat digunakan untuk login ke Dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">Nama Lengkap</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Misal: Panitia Lomba A"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">Username</label>
              <Input 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Misal: panitia_a"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">Password</label>
              <Input 
                type="password"
                value={formData.password_hash}
                onChange={(e) => setFormData({...formData, password_hash: e.target.value})}
                placeholder="Buat password yang kuat"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">Peran (Role)</label>
              <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organizer">Admin Pelaksana (Organizer)</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Daftarkan Admin
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card className="border border-border shadow-sm mt-8">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" /> Daftar Admin
          </CardTitle>
          <CardDescription>Semua pengguna yang memiliki akses ke sistem.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 px-0 overflow-hidden">
          {usersLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[300px]">Nama & Username</TableHead>
                    <TableHead>Peran (Role)</TableHead>
                    <TableHead className="text-right">Terdaftar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Belum ada admin lain.</TableCell>
                    </TableRow>
                  ) : (
                    usersList.map((adm) => (
                      <TableRow key={adm.id} className="group">
                        <TableCell>
                          <div className="font-bold text-foreground">{adm.name}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">@{adm.username}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={adm.role === 'super_admin' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'}>
                            {adm.role === 'super_admin' ? 'Super Admin' : 'Admin Pelaksana'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm flex items-center justify-end gap-1.5 h-full pt-4">
                          <Calendar className="h-3 w-3" />
                          {adm.created_at ? new Date(adm.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
