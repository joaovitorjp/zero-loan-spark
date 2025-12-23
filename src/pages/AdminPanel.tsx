import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, CheckCircle, XCircle, Users, Clock, DollarSign, Loader2, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ZROLogo from '@/components/ZROLogo';
import { User, Session } from '@supabase/supabase-js';

interface LoanApplication {
  id: string;
  full_name: string;
  cpf: string;
  email: string;
  loan_type: string;
  status: string;
  approved_amount?: number;
  address?: string;
  age?: number;
  birth_date?: string;
  mother_name?: string;
  gender?: string;
  cpf_status?: string;
  cns_number?: string;
  created_at: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [adminData, setAdminData] = useState({
    approved_amount: '',
    address: '',
    age: '',
    birth_date: '',
    mother_name: '',
    gender: '',
    cpf_status: '',
    cns_number: ''
  });
  const [loading, setLoading] = useState(false);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        setAuthLoading(false);
        navigate('/auth');
      } else {
        // Check admin role after auth state change
        setTimeout(() => {
          checkAdminRole(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        setAuthLoading(false);
        navigate('/auth');
      } else {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (data) {
        setIsAdmin(true);
        fetchApplications();
      } else {
        // First user becomes admin automatically (for initial setup)
        const { data: allRoles } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
        
        // If no admin exists, make this user admin
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true });
        
        if (count === 0) {
          // Insert first admin using service role via edge function would be ideal,
          // but for now we'll allow authenticated insert for first admin
          await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
          setIsAdmin(true);
          fetchApplications();
        } else {
          toast({ title: "Acesso negado", description: "Você não tem permissão de administrador", variant: "destructive" });
          setIsAdmin(false);
        }
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-applications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loan_applications'
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar solicitações",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleApprove = async () => {
    if (!selectedApp || !adminData.approved_amount) {
      toast({ title: "Valor aprovado é obrigatório", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({
          status: 'approved',
          approved_amount: parseFloat(adminData.approved_amount),
          address: adminData.address,
          age: adminData.age ? parseInt(adminData.age) : null,
          birth_date: adminData.birth_date || null,
          mother_name: adminData.mother_name,
          gender: adminData.gender,
          cpf_status: adminData.cpf_status,
          cns_number: adminData.cns_number
        })
        .eq('id', selectedApp.id);

      if (error) throw error;

      toast({ title: "Solicitação aprovada com sucesso!" });
      setSelectedApp(null);
      setAdminData({
        approved_amount: '',
        address: '',
        age: '',
        birth_date: '',
        mother_name: '',
        gender: '',
        cpf_status: '',
        cns_number: ''
      });
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar solicitação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (applicationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      if (error) throw error;

      toast({ title: "Solicitação rejeitada" });
    } catch (error: any) {
      toast({
        title: "Erro ao rejeitar solicitação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (applicationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('loan_applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      toast({ title: "Solicitação excluída" });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir solicitação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLoanTypeLabel = (type: string) => {
    const types = {
      personal: 'Empréstimo Pessoal',
      clt: 'Empréstimo CLT',
      fgts: 'Empréstimo FGTS'
    };
    return types[type as keyof typeof types] || type;
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">Você não tem permissão para acessar esta área.</p>
            <Button onClick={handleLogout} variant="outline">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <ZROLogo className="h-8 sm:h-10 mb-2 mx-auto" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gerenciamento de Solicitações de Empréstimo</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="bg-card-elevated">
            <CardContent className="flex items-center p-3 sm:p-6">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-card-foreground">{stats.total}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card-elevated">
            <CardContent className="flex items-center p-3 sm:p-6">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-warning mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-card-foreground">{stats.pending}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card-elevated">
            <CardContent className="flex items-center p-3 sm:p-6">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-success mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-card-foreground">{stats.approved}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Aprovados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card-elevated">
            <CardContent className="flex items-center p-3 sm:p-6">
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-card-foreground">{stats.rejected}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Rejeitados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card className="bg-card-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl text-card-foreground">Solicitações de Empréstimo</CardTitle>
            <CardDescription className="text-sm">Gerencie as solicitações em tempo real</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-3">
              {applications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">
                  Nenhuma solicitação encontrada
                </p>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-3 sm:p-4 bg-surface rounded-lg border border-border space-y-3 lg:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{app.full_name}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{app.email}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-muted-foreground">CPF: {app.cpf}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{getLoanTypeLabel(app.loan_type)}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                          {getStatusBadge(app.status)}
                          {app.approved_amount && (
                            <p className="text-xs sm:text-sm text-success font-medium">
                              R$ {app.approved_amount.toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)} className="text-xs">
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Ver</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                          <div className="p-4 sm:p-6">
                            <DialogHeader>
                              <DialogTitle className="text-lg sm:text-xl">Detalhes da Solicitação</DialogTitle>
                              <DialogDescription className="text-sm">
                                Analise e gerencie a solicitação de empréstimo
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedApp && (
                              <Tabs defaultValue="details" className="w-full mt-4">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="details" className="text-sm">Detalhes</TabsTrigger>
                                  <TabsTrigger value="manage" className="text-sm">Gerenciar</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="details" className="space-y-4 mt-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Nome Completo</Label>
                                      <p className="text-sm text-muted-foreground mt-1">{selectedApp.full_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">CPF</Label>
                                      <p className="text-sm text-muted-foreground mt-1">{selectedApp.cpf}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Email</Label>
                                      <p className="text-sm text-muted-foreground mt-1 break-all">{selectedApp.email}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Tipo de Empréstimo</Label>
                                      <p className="text-sm text-muted-foreground mt-1">{getLoanTypeLabel(selectedApp.loan_type)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Status</Label>
                                      <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Data da Solicitação</Label>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {new Date(selectedApp.created_at).toLocaleString('pt-BR')}
                                      </p>
                                    </div>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="manage" className="space-y-4 mt-4">
                                  {selectedApp.status === 'pending' && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <div>
                                            <Label htmlFor="approved_amount" className="text-sm">Valor Aprovado (R$)</Label>
                                            <Input
                                              id="approved_amount"
                                              type="number"
                                              value={adminData.approved_amount}
                                              onChange={(e) => setAdminData(prev => ({ ...prev, approved_amount: e.target.value }))}
                                              placeholder="50000.00"
                                              className="mt-1"
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="age" className="text-sm">Idade</Label>
                                            <Input
                                              id="age"
                                              type="number"
                                              value={adminData.age}
                                              onChange={(e) => setAdminData(prev => ({ ...prev, age: e.target.value }))}
                                              placeholder="35"
                                              className="mt-1"
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="birth_date" className="text-sm">Data de Nascimento</Label>
                                            <Input
                                              id="birth_date"
                                              type="date"
                                              value={adminData.birth_date}
                                              onChange={(e) => setAdminData(prev => ({ ...prev, birth_date: e.target.value }))}
                                              className="mt-1"
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="gender" className="text-sm">Sexo</Label>
                                            <Input
                                              id="gender"
                                              value={adminData.gender}
                                              onChange={(e) => setAdminData(prev => ({ ...prev, gender: e.target.value }))}
                                              placeholder="Masculino/Feminino"
                                              className="mt-1"
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="mother_name" className="text-sm">Nome da Mãe</Label>
                                            <Input
                                              id="mother_name"
                                              value={adminData.mother_name}
                                              onChange={(e) => setAdminData(prev => ({ ...prev, mother_name: e.target.value }))}
                                              placeholder="Nome da mãe"
                                              className="mt-1"
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="cpf_status" className="text-sm">Situação do CPF</Label>
                                            <Input
                                              id="cpf_status"
                                              value={adminData.cpf_status}
                                              onChange={(e) => setAdminData(prev => ({ ...prev, cpf_status: e.target.value }))}
                                              placeholder="Regular/Irregular"
                                              className="mt-1"
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="cns_number" className="text-sm">Número CNS</Label>
                                            <Input
                                              id="cns_number"
                                              value={adminData.cns_number}
                                              onChange={(e) => setAdminData(prev => ({ ...prev, cns_number: e.target.value }))}
                                              placeholder="000000000000000"
                                              className="mt-1"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <Label htmlFor="address" className="text-sm">Endereço Completo</Label>
                                          <Textarea
                                            id="address"
                                            value={adminData.address}
                                            onChange={(e) => setAdminData(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="Rua, número, bairro, cidade, CEP"
                                            rows={3}
                                            className="mt-1"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t">
                                        <Button 
                                          onClick={handleApprove} 
                                          variant="premium" 
                                          className="flex-1"
                                          disabled={loading || !adminData.approved_amount}
                                        >
                                          {loading ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Aprovando...
                                            </>
                                          ) : (
                                            'Aprovar Solicitação'
                                          )}
                                        </Button>
                                        <Button 
                                          onClick={() => handleReject(selectedApp.id)} 
                                          variant="destructive" 
                                          className="flex-1"
                                          disabled={loading}
                                        >
                                          Rejeitar
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  {selectedApp.status === 'approved' && (
                                    <div className="text-center py-8">
                                      <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-success mx-auto mb-4" />
                                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Solicitação Aprovada</h3>
                                      <p className="text-sm text-muted-foreground mb-4">
                                        Valor aprovado: R$ {selectedApp.approved_amount?.toLocaleString('pt-BR')}
                                      </p>
                                      <p className="text-xs sm:text-sm text-muted-foreground break-all">
                                        O cliente foi notificado por email: {selectedApp.email}
                                      </p>
                                    </div>
                                  )}
                                  {selectedApp.status === 'rejected' && (
                                    <div className="text-center py-8">
                                      <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
                                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Solicitação Rejeitada</h3>
                                      <p className="text-xs sm:text-sm text-muted-foreground break-all">
                                        O cliente foi notificado por email: {selectedApp.email}
                                      </p>
                                    </div>
                                  )}
                                </TabsContent>
                              </Tabs>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      {app.status === 'pending' ? (
                        <Button 
                          onClick={() => handleReject(app.id)} 
                          variant="destructive" 
                          size="sm"
                          disabled={loading}
                          className="text-xs"
                        >
                          <XCircle className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Rejeitar</span>
                        </Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={loading} className="text-xs">
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir solicitação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta solicitação concluída? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(app.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;