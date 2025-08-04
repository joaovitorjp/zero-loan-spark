import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Briefcase, PiggyBank } from 'lucide-react';

interface LoanCardProps {
  type: 'personal' | 'clt' | 'fgts';
  title: string;
  description: string;
  features: string[];
  onSelect: () => void;
}

const iconMap = {
  personal: Users,
  clt: Briefcase,
  fgts: PiggyBank
};

const LoanCard: React.FC<LoanCardProps> = ({ type, title, description, features, onSelect }) => {
  const Icon = iconMap[type];

  return (
    <Card className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] bg-card-elevated border-border hover:border-primary/30 hover:shadow-soft">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
          <Icon className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl text-card-foreground">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3" />
              {feature}
            </li>
          ))}
        </ul>
        <Button 
          variant="loan" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground" 
          onClick={onSelect}
        >
          Solicitar Agora
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoanCard;