import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ZROLogo from '@/components/ZROLogo';

const loanTypes = {
  personal: 'Empréstimo Pessoal',
  clt: 'Empréstimo CLT',
  fgts: 'Empréstimo FGTS'
};

const LoanApplication = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const loanType = searchParams.get('type') as keyof typeof loanTypes;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    email: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast({ title: "Nome completo é obrigatório", variant: "destructive" });
      return false;
    }
    if (!formData.cpf.trim()) {
      toast({ title: "CPF é obrigatório", variant: "destructive" });
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({ title: "Email válido é obrigatório", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Insert loan application directly without authentication
      const { error: insertError } = await supabase
        .from('loan_applications')
        .insert({
          user_id: null, // No user authentication needed
          full_name: formData.fullName,
          cpf: formData.cpf,
          email: formData.email,
          loan_type: loanType,
          status: 'pending'
        });

      if (insertError) throw insertError;

      setStep(3);
      toast({ title: "Solicitação enviada com sucesso!" });
    } catch (error: any) {
      toast({ 
        title: "Erro ao enviar solicitação", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!loanType || !loanTypes[loanType]) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Tipo de empréstimo inválido</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <ZROLogo />
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= stepNum 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > stepNum ? <CheckCircle className="h-4 w-4" /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-16 h-1 mx-2 transition-colors ${
                      step > stepNum ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2 text-sm text-muted-foreground">
              {step === 1 && "Dados Pessoais"}
              {step === 2 && "Confirmação"}
              {step === 3 && "Análise"}
            </div>
          </div>

          {/* Content */}
          <Card className="bg-card-elevated border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-card-foreground">
                {loanTypes[loanType]}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Preencha seus dados para análise de crédito"}
                {step === 2 && "Confirme os dados inseridos"}
                {step === 3 && "Sua solicitação está sendo analisada"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Digite seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <Button 
                    onClick={() => setStep(2)} 
                    className="w-full" 
                    variant="premium"
                    size="lg"
                    disabled={!formData.fullName || !formData.cpf || !formData.email}
                  >
                    Continuar
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-4 bg-surface p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground">Confirme seus dados:</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Nome:</span> {formData.fullName}</p>
                      <p><span className="font-medium">CPF:</span> {formData.cpf}</p>
                      <p><span className="font-medium">Email:</span> {formData.email}</p>
                      <p><span className="font-medium">Tipo:</span> {loanTypes[loanType]}</p>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button 
                      onClick={() => setStep(1)} 
                      variant="outline" 
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      variant="premium" 
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Confirmar e Enviar'
                      )}
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Análise em Andamento
                    </h3>
                    <p className="text-muted-foreground">
                      Aguarde enquanto um de nossos consultores analisa sua proposta. 
                      Em breve você receberá o resultado da análise.
                    </p>
                  </div>
                  <div className="bg-surface p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Mantenha esta página aberta para receber o resultado em tempo real.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;