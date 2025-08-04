import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import ZROLogo from '@/components/ZROLogo';
import LoanCard from '@/components/LoanCard';

const Index = () => {
  const navigate = useNavigate();

  const loanOptions = [
    {
      type: 'personal' as const,
      title: 'Empréstimo Pessoal',
      description: 'Crédito para suas necessidades pessoais',
      features: [
        'Valores até R$ 100.000',
        'Aprovação em até 24h',
        'Documentação simplificada',
        'Taxas competitivas'
      ]
    },
    {
      type: 'clt' as const,
      title: 'Empréstimo CLT',
      description: 'Especial para trabalhadores CLT',
      features: [
        'Desconto em folha',
        'Taxas reduzidas',
        'Aprovação facilitada',
        'Sem consulta ao SPC/Serasa'
      ]
    },
    {
      type: 'fgts' as const,
      title: 'Empréstimo FGTS',
      description: 'Use seu FGTS como garantia',
      features: [
        'Menores taxas do mercado',
        'FGTS como garantia',
        'Aprovação automática',
        'Valores até R$ 200.000'
      ]
    }
  ];

  const handleLoanSelect = (type: string) => {
    navigate(`/loan-application?type=${type}`);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-surface opacity-50" />
      
      <div className="relative container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <ZROLogo className="h-12 mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Empréstimos <span className="text-primary">Descomplicados</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Solicite seu empréstimo com aprovação rápida, taxas competitivas e atendimento personalizado.
          </p>
        </div>

        {/* Loan Options */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Escolha a opção ideal para você
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loanOptions.map((loan) => (
              <LoanCard
                key={loan.type}
                type={loan.type}
                title={loan.title}
                description={loan.description}
                features={loan.features}
                onSelect={() => handleLoanSelect(loan.type)}
              />
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Por que escolher o Z.RO Bank?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Aprovação Rápida</h3>
              <p className="text-muted-foreground">Análise de crédito em tempo real com resposta em até 24 horas.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">100% Seguro</h3>
              <p className="text-muted-foreground">Seus dados protegidos com a mais alta tecnologia de segurança.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Melhores Taxas</h3>
              <p className="text-muted-foreground">Taxas competitivas e condições especiais para você.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-card-elevated p-8 rounded-2xl border border-border shadow-soft max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-card-foreground mb-4">
              Pronto para solicitar seu empréstimo?
            </h2>
            <p className="text-muted-foreground mb-6">
              Processo 100% digital, sem burocracia e com aprovação rápida.
            </p>
            <Button variant="premium" size="xl" className="mb-4">
              Simular Empréstimo
            </Button>
            <p className="text-sm text-muted-foreground">
              * Sujeito à análise de crédito
            </p>
          </div>
        </div>
      </div>

      {/* Admin Access Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin-login')}
          className="w-12 h-12 rounded-full bg-surface-elevated border border-border hover:bg-primary/10 shadow-soft"
        >
          <Lock className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
