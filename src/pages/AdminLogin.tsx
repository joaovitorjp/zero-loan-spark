import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ZROLogo from '@/components/ZROLogo';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (password === 'admin4455') {
      toast({ title: "Acesso autorizado!" });
      navigate('/admin');
    } else {
      toast({ 
        title: "Senha incorreta", 
        description: "Verifique a senha e tente novamente.",
        variant: "destructive" 
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <Card className="bg-card-elevated border-border shadow-soft">
          <CardHeader className="text-center">
            <div className="mb-4">
              <ZROLogo className="h-8 mb-2" />
            </div>
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl text-card-foreground">Acesso Administrativo</CardTitle>
            <CardDescription>
              Digite a senha para acessar o painel administrativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              variant="premium"
              size="lg"
              disabled={loading || !password}
            >
              {loading ? 'Verificando...' : 'Acessar Painel'}
            </Button>
            
            <Button 
              onClick={() => navigate('/')} 
              variant="ghost" 
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;