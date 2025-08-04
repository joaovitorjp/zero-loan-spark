import React from 'react';

const ZROLogo = ({ className = "h-8" }: { className?: string }) => {
  return (
    <div className={`font-bold text-2xl tracking-tight ${className}`}>
      <span className="text-primary">Z.</span>
      <span className="text-foreground">RO</span>
      <span className="text-sm text-muted-foreground ml-1">BANK</span>
    </div>
  );
};

export default ZROLogo;