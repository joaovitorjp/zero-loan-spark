import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, CheckCircle, XCircle, Users, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ZROLogo from '@/components/ZROLogo';

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
  const { toast } = useToast();
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

  useEffect(() => {
    fetchApplications();
    
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
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="text-center">
            <ZROLogo className="h-10 mb-2" />
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerenciamento de Solicitações de Empréstimo</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card-elevated">
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card-elevated">
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-warning mr-3" />
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card-elevated">
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-8 w-8 text-success mr-3" />
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Aprovados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card-elevated">
            <CardContent className="flex items-center p-6">
              <XCircle className="h-8 w-8 text-destructive mr-3" />
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejeitados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card className="bg-card-elevated">
          <CardHeader>
            <CardTitle className="text-card-foreground">Solicitações de Empréstimo</CardTitle>
            <CardDescription>Gerencie as solicitações em tempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma solicitação encontrada
                </p>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{app.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{app.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">CPF: {app.cpf}</p>
                          <p className="text-sm text-muted-foreground">{getLoanTypeLabel(app.loan_type)}</p>
                        </div>
                        <div>
                          {getStatusBadge(app.status)}
                          {app.approved_amount && (
                            <p className="text-sm text-success mt-1">
                              R$ {app.approved_amount.toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Solicitação</DialogTitle>
                            <DialogDescription>
                              Analise e gerencie a solicitação de empréstimo
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedApp && (
                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">Detalhes</TabsTrigger>
                                <TabsTrigger value="manage">Gerenciar</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Nome Completo</Label>
                                    <p className="text-sm text-muted-foreground">{selectedApp.full_name}</p>
                                  </div>
                                  <div>
                                    <Label>CPF</Label>
                                    <p className="text-sm text-muted-foreground">{selectedApp.cpf}</p>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <p className="text-sm text-muted-foreground">{selectedApp.email}</p>
                                  </div>
                                  <div>
                                    <Label>Tipo de Empréstimo</Label>
                                    <p className="text-sm text-muted-foreground">{getLoanTypeLabel(selectedApp.loan_type)}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                                  </div>
                                  <div>
                                    <Label>Data da Solicitação</Label>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(selectedApp.created_at).toLocaleString('pt-BR')}
                                    </p>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="manage" className="space-y-4">
                                {selectedApp.status === 'pending' && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="approved_amount">Valor Aprovado (R$)</Label>
                                        <Input
                                          id="approved_amount"
                                          type="number"
                                          value={adminData.approved_amount}
                                          onChange={(e) => setAdminData(prev => ({ ...prev, approved_amount: e.target.value }))}
                                          placeholder="50000.00"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="age">Idade</Label>
                                        <Input
                                          id="age"
                                          type="number"
                                          value={adminData.age}
                                          onChange={(e) => setAdminData(prev => ({ ...prev, age: e.target.value }))}
                                          placeholder="35"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="birth_date">Data de Nascimento</Label>
                                        <Input
                                          id="birth_date"
                                          type="date"
                                          value={adminData.birth_date}
                                          onChange={(e) => setAdminData(prev => ({ ...prev, birth_date: e.target.value }))}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="gender">Sexo</Label>
                                        <Input
                                          id="gender"
                                          value={adminData.gender}
                                          onChange={(e) => setAdminData(prev => ({ ...prev, gender: e.target.value }))}
                                          placeholder="Masculino/Feminino"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="mother_name">Nome da Mãe</Label>
                                        <Input
                                          id="mother_name"
                                          value={adminData.mother_name}
                                          onChange={(e) => setAdminData(prev => ({ ...prev, mother_name: e.target.value }))}
                                          placeholder="Nome da mãe"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="cpf_status">Situação do CPF</Label>
                                        <Input
                                          id="cpf_status"
                                          value={adminData.cpf_status}
                                          onChange={(e) => setAdminData(prev => ({ ...prev, cpf_status: e.target.value }))}
                                          placeholder="Regular/Irregular"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="cns_number">Número CNS</Label>
                                        <Input
                                          id="cns_number"
                                          value={adminData.cns_number}
                                          onChange={(e) => setAdminData(prev => ({ ...prev, cns_number: e.target.value }))}
                                          placeholder="000000000000000"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor="address">Endereço Completo</Label>
                                      <Textarea
                                        id="address"
                                        value={adminData.address}
                                        onChange={(e) => setAdminData(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="Rua, número, bairro, cidade, CEP"
                                        rows={3}
                                      />
                                    </div>
                                    
                                    <div className="flex space-x-4">
                                      <Button
                                        onClick={handleApprove}
                                        disabled={loading}
                                        className="flex-1"
                                        variant="default"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Aprovar
                                      </Button>
                                      <Button
                                        onClick={() => handleReject(selectedApp.id)}
                                        disabled={loading}
                                        variant="destructive"
                                        className="flex-1"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Rejeitar
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                {selectedApp.status !== 'pending' && (
                                  <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                      Esta solicitação já foi {selectedApp.status === 'approved' ? 'aprovada' : 'rejeitada'}
                                    </p>
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {app.status === 'pending' && (
                        <Button
                          variant="admin"
                          size="sm"
                          onClick={() => handleReject(app.id)}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
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